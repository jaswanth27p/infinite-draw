"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { useFileSocket } from "@/hooks/file-socket-context";

export interface VoiceParticipant {
  socketId: string;
  muted: boolean;
}

type VoiceSignal =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "candidate"; candidate: RTCIceCandidateInit };

interface TurnCredentialsResponse {
  iceServers: RTCIceServer[];
  ttl: number;
}

type JoinVoiceAck =
  | { joined: true; participants: string[] }
  | { joined: false; reason: "full" | "no-access" };

export function useVoice(fileId: string) {
  const { socket } = useFileSocket();
  const apiClient = useApiClient();

  const [inCall, setInCall] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [callFullError, setCallFullError] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [failedPeers, setFailedPeers] = useState<Set<string>>(new Set());

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceServersRef = useRef<RTCIceServer[] | null>(null);

  const getIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    if (iceServersRef.current) return iceServersRef.current;
    const res: TurnCredentialsResponse = await apiClient("/voice/turn-credentials");
    iceServersRef.current = res.iceServers;
    return res.iceServers;
  }, [apiClient]);

  const closePeer = useCallback((peerSocketId: string) => {
    const pc = peersRef.current.get(peerSocketId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerSocketId);
    }
    setRemoteStreams((prev) => {
      if (!prev.has(peerSocketId)) return prev;
      const next = new Map(prev);
      next.delete(peerSocketId);
      return next;
    });
    setFailedPeers((prev) => {
      if (!prev.has(peerSocketId)) return prev;
      const next = new Set(prev);
      next.delete(peerSocketId);
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (peerSocketId: string, iceServers: RTCIceServer[]) => {
      const pc = new RTCPeerConnection({ iceServers });

      const stream = localStreamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("voice-signal", {
            fileId,
            targetSocketId: peerSocketId,
            signal: { type: "candidate", candidate: event.candidate.toJSON() },
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(peerSocketId, event.streams[0]);
          return next;
        });
      };

      // STUN and TURN both fail for this pair (e.g. both ends behind
      // symmetric NAT with the relay ports also firewalled) — surfaced
      // per-peer, without affecting any other pair's connection. No
      // retry/renegotiation beyond the browser's own ICE restart, which
      // is out of scope here.
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          console.error(`[voice] connection to ${peerSocketId} failed`);
          setFailedPeers((prev) => new Set(prev).add(peerSocketId));
        }
      };

      peersRef.current.set(peerSocketId, pc);
      return pc;
    },
    [fileId, socket],
  );

  // No-glare rule: only an EXISTING participant (the one receiving
  // voice-user-joined) creates the offer for a new joiner. The newcomer
  // never initiates — it only ever creates a peer connection in response
  // to an incoming offer. This avoids both sides racing to offer the same
  // pair without a rollback/tie-breaker.
  const initiateOfferTo = useCallback(
    async (peerSocketId: string) => {
      const iceServers = await getIceServers();
      const pc = createPeerConnection(peerSocketId, iceServers);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit("voice-signal", {
        fileId,
        targetSocketId: peerSocketId,
        signal: { type: "offer", sdp: offer.sdp! },
      });
    },
    [fileId, socket, createPeerConnection, getIceServers],
  );

  useEffect(() => {
    if (!socket) return;

    function handleVoiceUserJoined(payload: { socketId: string }) {
      setParticipants((prev) =>
        prev.some((p) => p.socketId === payload.socketId)
          ? prev
          : [...prev, { socketId: payload.socketId, muted: false }],
      );
      void initiateOfferTo(payload.socketId);
    }

    function handleVoiceUserLeft(payload: { socketId: string }) {
      setParticipants((prev) => prev.filter((p) => p.socketId !== payload.socketId));
      closePeer(payload.socketId);
    }

    async function handleVoiceSignal(payload: { fromSocketId: string; signal: VoiceSignal }) {
      const { fromSocketId, signal } = payload;
      let pc = peersRef.current.get(fromSocketId);

      if (signal.type === "offer") {
        // First message from this peer — the newcomer's case, per the
        // no-glare rule above: it only creates a connection on receiving
        // an offer, never proactively.
        if (!pc) {
          const iceServers = await getIceServers();
          pc = createPeerConnection(fromSocketId, iceServers);
        }
        await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.emit("voice-signal", {
          fileId,
          targetSocketId: fromSocketId,
          signal: { type: "answer", sdp: answer.sdp! },
        });
      } else if (signal.type === "answer" && pc) {
        await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
      } else if (signal.type === "candidate" && pc) {
        await pc.addIceCandidate(signal.candidate).catch((err) => {
          console.error("[voice] failed to add ICE candidate", err);
        });
      }
    }

    function handleVoiceMuteChanged(payload: { socketId: string; muted: boolean }) {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === payload.socketId ? { ...p, muted: payload.muted } : p)),
      );
    }

    socket.on("voice-user-joined", handleVoiceUserJoined);
    socket.on("voice-user-left", handleVoiceUserLeft);
    socket.on("voice-signal", handleVoiceSignal);
    socket.on("voice-mute-changed", handleVoiceMuteChanged);

    return () => {
      socket.off("voice-user-joined", handleVoiceUserJoined);
      socket.off("voice-user-left", handleVoiceUserLeft);
      socket.off("voice-signal", handleVoiceSignal);
      socket.off("voice-mute-changed", handleVoiceMuteChanged);
    };
  }, [socket, fileId, initiateOfferTo, createPeerConnection, closePeer, getIceServers]);

  const leaveCall = useCallback(() => {
    socket?.emit("leave-voice", { fileId });
    for (const peerSocketId of Array.from(peersRef.current.keys())) {
      closePeer(peerSocketId);
    }
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setParticipants([]);
    setInCall(false);
    setLocalMuted(false);
  }, [fileId, socket, closePeer]);

  const joinCall = useCallback(async () => {
    setCallFullError(false);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("[voice] microphone access denied", err);
      return;
    }
    localStreamRef.current = stream;
    setLocalStream(stream);

    // Fetch (and cache) TURN credentials up front so the first
    // voice-user-joined we receive can create a peer connection without
    // an extra round-trip.
    await getIceServers().catch((err) => {
      console.error("[voice] failed to fetch TURN credentials", err);
    });

    socket?.emit("join-voice", { fileId }, (ack: JoinVoiceAck) => {
      if (!ack.joined) {
        setCallFullError(ack.reason === "full");
        stream.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        return;
      }
      setParticipants(ack.participants.map((socketId) => ({ socketId, muted: false })));
      setInCall(true);
      // Per the no-glare rule, the newcomer never initiates — existing
      // participants will each send an offer once they see this join via
      // voice-user-joined.
    });
  }, [fileId, socket, getIceServers]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !localMuted;
    for (const track of stream.getAudioTracks()) {
      track.enabled = !nextMuted;
    }
    setLocalMuted(nextMuted);
    socket?.emit("voice-mute-changed", { fileId, muted: nextMuted });
  }, [fileId, socket, localMuted]);

  // A user can't be "in a call" on a file whose editor they've navigated
  // away from — leave automatically on fileId change or unmount.
  useEffect(() => {
    return () => {
      leaveCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  return {
    participants,
    localMuted,
    toggleMute,
    joinCall,
    leaveCall,
    inCall,
    callFullError,
    remoteStreams,
    localStream,
    failedPeers,
  };
}
