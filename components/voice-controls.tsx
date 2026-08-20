"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Users } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import type { Collaborator, SocketId } from "@excalidraw/excalidraw/types";

interface VoiceControlsProps {
  fileId: string;
  collaborators: Map<SocketId, Collaborator>;
}

// Purely local rendering — no signaling involved. Polls amplitude on an
// animation frame for a given MediaStream (local or remote), used to
// highlight whoever's currently speaking in the participant list.
function useIsSpeaking(stream: MediaStream | null): boolean {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!stream) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpeaking(false);
      return;
    }
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame: number;

    function tick() {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, v) => sum + v, 0) / data.length;
      setSpeaking(average > 12);
      frame = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      void audioContext.close();
    };
  }, [stream]);

  return speaking;
}

function ParticipantRow({
  name,
  muted,
  stream,
  failed,
}: {
  name: string;
  muted: boolean;
  stream: MediaStream | null;
  failed: boolean;
}) {
  const speaking = useIsSpeaking(stream);

  return (
    <div className="flex flex-col gap-0.5 rounded-lg px-2 py-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={speaking ? "font-medium text-primary" : ""}>{name}</span>
        {muted ? (
          <MicOff className="size-3.5 text-muted-foreground" />
        ) : (
          <Mic className="size-3.5 text-muted-foreground" />
        )}
      </div>
      {failed && <span className="text-xs text-destructive">Couldn&apos;t connect to {name}</span>}
    </div>
  );
}

export function VoiceControls({ fileId, collaborators }: VoiceControlsProps) {
  const {
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
  } = useVoice(fileId);

  function resolveName(socketId: string): string {
    return collaborators.get(socketId as SocketId)?.username ?? "Someone";
  }

  return (
    <>
      {/* Remote audio playback, rendered unconditionally (NOT inside
          PopoverContent) so audio keeps playing while the popover is
          closed — PopoverContent unmounts its children when closed. */}
      {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
        <audio
          key={socketId}
          autoPlay
          ref={(el) => {
            if (el) el.srcObject = stream;
          }}
        />
      ))}
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>
          {inCall ? <Users className="size-4" /> : <Mic className="size-4" />}
          {inCall ? `Voice (${participants.length + 1})` : "Join voice"}
        </PopoverTrigger>
        <PopoverContent>
          {callFullError && (
            <p className="px-2 py-1 text-sm text-destructive">
              This call is full (6 participants max).
            </p>
          )}
          {!inCall ? (
            <Button size="sm" className="w-full" onClick={() => void joinCall()}>
              Join voice call
            </Button>
          ) : (
            <>
              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                <ParticipantRow name="You" muted={localMuted} stream={localStream} failed={false} />
                {participants.map((p) => (
                  <ParticipantRow
                    key={p.socketId}
                    name={resolveName(p.socketId)}
                    muted={p.muted}
                    stream={remoteStreams.get(p.socketId) ?? null}
                    failed={failedPeers.has(p.socketId)}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-2 border-t pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={toggleMute}>
                  {localMuted ? "Unmute" : "Mute"}
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={leaveCall}>
                  Leave
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
