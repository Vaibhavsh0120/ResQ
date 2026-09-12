// Shared contract for the speech-to-text seam — src/services/voiceService.ts
// (native fallback — Metro's default, no platform suffix) and
// src/services/voiceService.web.ts (real browser implementation) both
// implement this same shape. See voiceService.ts's own header comment for
// the full rationale (platform-file pattern, same as MiniMap.tsx/
// MiniMap.web.tsx) and why native genuinely doesn't work yet rather than
// being faked.

export type StartListeningOptions = {
  /** Called with interim (not-yet-final) transcript text as the user speaks, for live captioning. Best-effort — not every engine supports this. */
  onInterimResult?: (text: string) => void;
  /** Called with a 0..1 microphone volume estimate while listening, for the waveform animation. Best-effort — not every engine reports this; when it isn't, useVoiceAssistant falls back to a gentle constant pulse instead of leaving the orb static. */
  onVolumeChange?: (level: number) => void;
  /** Called once with the final transcript when the engine detects the user has stopped speaking. Empty string if nothing was understood. */
  onResult: (transcript: string) => void;
  /** Called if listening fails or is denied, with a short human-readable reason. onResult is not called in this case. */
  onError: (message: string) => void;
};

export type VoiceRecognitionHandle = {
  /** Stops listening — the engine finalizes whatever it heard and fires onResult normally. */
  stop: () => void;
};

export type VoiceService = {
  /** Whether this platform's implementation can actually listen right now — false on native today (see voiceService.ts). A screen should show a typed-input fallback rather than a mic button when this is false. */
  readonly available: boolean;
  /** Human-readable reason `available` is false, for UI copy. Undefined when available is true. */
  readonly unavailableReason: string | undefined;
  /** Starts listening and returns a handle to stop it early. Never fabricates a transcript. */
  startListening: (options: StartListeningOptions) => VoiceRecognitionHandle;
};
