import * as Speech from 'expo-speech';

// Thin wrapper around expo-speech — real, on-device text-to-speech, no
// API key or network call needed (see AGENT.md's 2026-09-11 session 2
// entry for the decision). Isolated behind this module (rather than
// calling expo-speech directly from useVoiceAssistant.ts) for the same
// reason src/services/*Service.ts wrap every other external dependency:
// one place to swap if the TTS engine ever changes, and one place to
// reason about correctness without needing node_modules installed.
//
// Word-boundary animation: expo-speech's `onBoundary` fires per-word on
// iOS/Android but is unreliable on web (several tracked expo issues where
// onBoundary/onDone don't fire in some browsers — see AGENT.md). Rather
// than build the "ResQ is speaking" animation's correctness around an
// event that might silently never arrive, `speak()` here treats
// `onBoundary` as a bonus signal only (useVoiceAssistant.ts derives its
// main animation from the coarser start/stop of speaking, which is
// always driven by onDone/onStopped/onError with a safety-net timeout —
// see that file for the fuller reasoning).

export type SpeakHandle = {
  stop: () => void;
};

export type SpeakOptions = {
  onBoundary?: () => void;
  onDone?: () => void;
  onError?: () => void;
};

export function speak(text: string, options: SpeakOptions = {}): SpeakHandle {
  let settled = false;
  let safetyTimer: ReturnType<typeof setTimeout> | null = null;

  const finish = (cb?: () => void) => {
    if (settled) return;
    settled = true;
    if (safetyTimer) clearTimeout(safetyTimer);
    cb?.();
  };

  // Safety net: onDone/onStopped/onError are the normal way this
  // resolves, but expo-speech has documented cases (tracked upstream)
  // where none of them fire on web in some browsers. Without this, a
  // misfire would leave useVoiceAssistant's phase stuck on 'speaking'
  // forever with no way back to idle. Sized generously (word count *
  // ~400ms/word + a fixed buffer) so it only ever fires as a genuine
  // fallback, never cutting off real speech early.
  const estimatedMs = Math.max(4000, text.split(/\s+/).length * 400 + 1500);
  safetyTimer = setTimeout(() => finish(options.onDone), estimatedMs);

  Speech.speak(text, {
    rate: 0.98,
    pitch: 1.0,
    onBoundary: () => {
      options.onBoundary?.();
    },
    onDone: () => finish(options.onDone),
    onStopped: () => finish(options.onDone),
    onError: () => finish(options.onError),
  });

  return {
    stop: () => {
      finish(options.onDone);
      Speech.stop().catch(() => {});
    },
  };
}

export function stopSpeaking() {
  Speech.stop().catch(() => {});
}
