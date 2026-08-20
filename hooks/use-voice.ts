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
  // True from the moment join-voice is emitted until leaveCall runs — NOT
  // derived from the `inCall` state value, which only flips true after the
  // join-voice ack returns. An incoming voice-user-joined/voice-signal/
  // voice-mute-changed can arrive in the gap between emit and ack, and
  // must still be gated the same way a not-in-call client would be.
  const inCallRef = useRef(false);
  // Guards joinCall against being invoked again before the first call's
  // ack has returned.
  const joinInFlightRef = useRef(false);
  // Per-peer queue of ICE candidates that arrived before we had a peer
  // connection for that sender, or before setRemoteDescription had
  // resolved on it — drained immediately after setRemoteDescription
  // succeeds in the offer branch below.
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

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
    pendingCandidatesRef.current.delete(peerSocketId);
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
      const stream = localStreamRef.current;
      if (!stream) {
        // No local media to attach — this happens when a voice-user-joined/
        // voice-signal event lands on a client that hasn't (or hasn't yet)
        // joined the call. Refuse to create a real connection here; the
        // call sites below bail out on a null return.
        console.warn(
          `[voice] refusing to create a peer connection to ${peerSocketId} — no local media stream`,
        );
        return null;
      }

      const pc = new RTCPeerConnection({ iceServers });

      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
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
      if (!pc) return;
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

    async function drainPendingCandidates(peerSocketId: string, pc: RTCPeerConnection) {
      const queued = pendingCandidatesRef.current.get(peerSocketId);
      if (!queued || queued.length === 0) return;
      pendingCandidatesRef.current.delete(peerSocketId);
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("[voice] failed to add queued ICE candidate", err);
        }
      }
    }

    function handleVoiceUserJoined(payload: { socketId: string }) {
      // The server broadcasts this to the whole file room, not just call
      // participants — a client that has the file open but hasn't joined
      // the call must not build a real peer connection for it.
      if (!inCallRef.current) return;
      setParticipants((prev) =>
        prev.some((p) => p.socketId === payload.socketId)
          ? prev
          : [...prev, { socketId: payload.socketId, muted: false }],
      );
      void initiateOfferTo(payload.socketId).catch((err) => {
        console.error(`[voice] failed to initiate offer to ${payload.socketId}:`, err);
      });
    }

    function handleVoiceUserLeft(payload: { socketId: string }) {
      setParticipants((prev) => prev.filter((p) => p.socketId !== payload.socketId));
      closePeer(payload.socketId);
    }

    async function handleVoiceSignal(payload: { fromSocketId: string; signal: VoiceSignal }) {
      if (!inCallRef.current) return;
      const { fromSocketId, signal } = payload;
      let pc = peersRef.current.get(fromSocketId) ?? null;

      if (signal.type === "offer") {
        // First message from this peer — the newcomer's case, per the
        // no-glare rule above: it only creates a connection on receiving
        // an offer, never proactively.
        if (!pc) {
          const iceServers = await getIceServers();
          pc = createPeerConnection(fromSocketId, iceServers);
          if (!pc) return;
        }
        try {
          await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
          await drainPendingCandidates(fromSocketId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket?.emit("voice-signal", {
            fileId,
            targetSocketId: fromSocketId,
            signal: { type: "answer", sdp: answer.sdp! },
          });
        } catch (err) {
          console.error(`[voice] failed to handle offer from ${fromSocketId}:`, err);
          closePeer(fromSocketId);
        }
      } else if (signal.type === "answer" && pc) {
        try {
          await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
          await drainPendingCandidates(fromSocketId, pc);
        } catch (err) {
          console.error(`[voice] failed to handle answer from ${fromSocketId}:`, err);
        }
      } else if (signal.type === "candidate") {
        // Queue instead of applying when there's no peer connection yet
        // for this sender, or its remoteDescription hasn't landed yet —
        // otherwise a candidate that races ahead of (or arrives mid-await
        // of) setRemoteDescription is silently dropped.
        if (!pc || !pc.remoteDescription) {
          const queue = pendingCandidatesRef.current.get(fromSocketId) ?? [];
          queue.push(signal.candidate);
          pendingCandidatesRef.current.set(fromSocketId, queue);
          return;
        }
        await pc.addIceCandidate(signal.candidate).catch((err) => {
          console.error("[voice] failed to add ICE candidate", err);
        });
      }
    }

    function handleVoiceMuteChanged(payload: { socketId: string; muted: boolean }) {
      if (!inCallRef.current) return;
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
    inCallRef.current = false;
    joinInFlightRef.current = false;
    socket?.emit("leave-voice", { fileId });
    for (const peerSocketId of Array.from(peersRef.current.keys())) {
      closePeer(peerSocketId);
    }
    pendingCandidatesRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setParticipants([]);
    setInCall(false);
    setLocalMuted(false);
  }, [fileId, socket, closePeer]);

  const joinCall = useCallback(async () => {
    // Guard against re-entry: either already in a call, or a previous
    // joinCall() is still awaiting its ack.
    if (inCallRef.current || joinInFlightRef.current) return;
    joinInFlightRef.current = true;

    setCallFullError(false);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("[voice] microphone access denied", err);
      joinInFlightRef.current = false;
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

    if (!socket) {
      joinInFlightRef.current = false;
      stream.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      return;
    }

    // Flip this the moment join-voice is emitted, not when the ack
    // returns — an incoming voice-user-joined/voice-signal/voice-mute-changed
    // can arrive in the gap between emit and ack and must already treat us
    // as in the call so it doesn't skip building a real peer connection.
    inCallRef.current = true;
    socket.emit("join-voice", { fileId }, (ack: JoinVoiceAck) => {
      joinInFlightRef.current = false;
      if (!ack.joined) {
        inCallRef.current = false;
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

  const leaveCallRef = useRef(leaveCall);
  // eslint-disable-next-line react-hooks/refs
  leaveCallRef.current = leaveCall;

  // A user can't be "in a call" on a file whose editor they've navigated
  // away from — leave automatically on fileId change or unmount. Reads
  // leaveCallRef.current (kept in sync every render, above) rather than
  // closing over leaveCall directly — this effect is keyed on [fileId]
  // only, so its cleanup would otherwise capture whatever leaveCall
  // closure existed on the render this effect was (re)created on, which
  // given hook-initialization order can be an early one where socket
  // isn't set yet, and leave-voice would never actually be emitted.
  useEffect(() => {
    return () => {
      leaveCallRef.current();
    };
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
