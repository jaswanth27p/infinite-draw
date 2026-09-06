"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceParticipant } from "@/hooks/use-voice";

interface VoiceControlsProps {
  participants: VoiceParticipant[];
  localMuted: boolean;
  deafened: boolean;
  toggleTalk: () => void;
  toggleListen: () => void;
  inCall: boolean;
  callFullError: boolean;
  remoteStreams: Map<string, MediaStream>;
  localStream: MediaStream | null;
}

// Purely local rendering — no signaling involved. Polls amplitude on an
// animation frame for the local mic stream, used to ring the talk button
// while the user is actually speaking (a disabled/muted track just reads as
// silence, so this doubles as a "your mic is live" cue for free).
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

// Game-style voice chat: no explicit "join call" step and no participant
// popover — pressing either button implicitly joins (see useVoice's
// toggleTalk/toggleListen), and each button only ever controls its own
// half of the call afterwards (mic = send, speaker = receive).
//
// Call state (useVoice) is owned by the parent, not this component: the
// editor header remounts VoiceControls whenever the desktop/mobile Sheet
// boundary flips (see file-editor.tsx's isDesktop ternary), and useVoice's
// unmount cleanup calls leaveCall() -- if this component owned that hook,
// resizing the browser mid-call would silently hang up on the user.
export function VoiceControls({
  participants,
  localMuted,
  deafened,
  toggleTalk,
  toggleListen,
  inCall,
  callFullError,
  remoteStreams,
  localStream,
}: VoiceControlsProps) {
  const talking = inCall && !localMuted;
  const listening = inCall && !deafened;
  const speaking = useIsSpeaking(talking ? localStream : null);

  return (
    <div className="flex items-center gap-1">
      {/* Remote audio playback, always mounted (not gated on `listening`)
          so streams don't glitch on re-render — the "listen" toggle just
          mutes the element, it doesn't tear anything down. */}
      {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
        <audio
          key={socketId}
          autoPlay
          muted={!listening}
          ref={(el) => {
            // VoiceControls re-renders often (collaborators changes on
            // every mouse-move-driven presence update) — only reassign
            // srcObject when it actually changed, otherwise this ref
            // callback re-triggers the browser's media load algorithm on
            // every render and causes audio stutter.
            if (el && el.srcObject !== stream) el.srcObject = stream;
          }}
        />
      ))}

      <Button
        type="button"
        variant={talking ? "default" : "outline"}
        size="icon"
        aria-label={talking ? "Mute microphone" : "Talk"}
        aria-pressed={talking}
        title={talking ? "Mute microphone" : "Talk"}
        onClick={toggleTalk}
        className={speaking ? "ring-2 ring-primary" : undefined}
      >
        {talking ? <Mic className="size-4" /> : <MicOff className="size-4" />}
      </Button>

      <Button
        type="button"
        variant={listening ? "default" : "outline"}
        size="icon"
        aria-label={listening ? "Stop listening" : "Listen"}
        aria-pressed={listening}
        title={listening ? "Stop listening" : "Listen"}
        onClick={toggleListen}
      >
        {listening ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </Button>

      {inCall && participants.length > 0 && (
        <span className="text-xs text-muted-foreground">{participants.length + 1} in call</span>
      )}

      {callFullError && <span className="text-xs text-destructive">Call full (6 max)</span>}
    </div>
  );
}
