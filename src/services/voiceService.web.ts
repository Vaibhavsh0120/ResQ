import { StartListeningOptions, VoiceRecognitionHandle, VoiceService } from './voiceService.types';

// Web speech-to-text — Metro/Expo Router resolves this file (not
// voiceService.ts) for web builds automatically via the `.web.ts`
// platform extension, matching MiniMap.tsx/MiniMap.web.tsx's convention
// (see voiceService.ts's header comment for the fuller rationale).
//
// Unlike native, this one is genuinely real: the browser's Web Speech API
// (`SpeechRecognition`, prefixed `webkitSpeechRecognition` in Chrome/Edge/
// Safari) needs no install, no API key, and no backend — it's built into
// the browser itself. Support isn't universal (notably: Firefox doesn't
// implement it as of this writing), which `available` below reports
// honestly rather than assuming.
//
// Volume/amplitude: the Web Speech API's `result`/`SpeechRecognitionAlternative`
// exposes a `confidence` score, not a live audio level, so `onVolumeChange`
// is never called from here — useVoiceAssistant.ts's fallback pulse
// animation is what actually drives the "listening" visual on web. A
// real live mic-level meter would need a separate getUserMedia +
// AnalyserNode pipeline running alongside this, which is a reasonable
// future enhancement but adds real complexity (permission prompt timing,
// cleanup) that isn't needed for STT to work as designed.

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

// Minimal structural type for what this file actually uses — the DOM lib
// bundled with Expo's base tsconfig doesn't ship Web Speech API types
// (it's not yet a standardized/Baseline API; see MDN), so this is typed
// by hand against the same interface MDN documents.
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const Ctor = getSpeechRecognitionCtor();

function startListening(options: StartListeningOptions): VoiceRecognitionHandle {
  if (!Ctor) {
    options.onError('Voice input is not supported in this browser — try Chrome, Edge, or Safari, or type instead.');
    return { stop: () => {} };
  }

  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = '';
  let settled = false;

  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? '';
      if (result.isFinal) {
        finalTranscript += text;
      } else {
        interim += text;
      }
    }
    if (interim) {
      options.onInterimResult?.(interim);
    }
  };

  recognition.onerror = (event: any) => {
    if (settled) return;
    // "no-speech" and "aborted" are routine (user paused, or we called
    // stop() ourselves) — resolve quietly with whatever was heard rather
    // than surfacing them as user-facing errors.
    if (event?.error === 'no-speech' || event?.error === 'aborted') {
      return;
    }
    settled = true;
    const message =
      event?.error === 'not-allowed' || event?.error === 'permission-denied'
        ? 'Microphone access was denied — allow it in your browser settings, or type instead.'
        : 'Could not hear you clearly — try again or type instead.';
    options.onError(message);
  };

  recognition.onend = () => {
    if (settled) return;
    settled = true;
    options.onResult(finalTranscript.trim());
  };

  try {
    recognition.start();
  } catch {
    settled = true;
    options.onError('Could not start listening — try again or type instead.');
  }

  return {
    stop: () => {
      if (!settled) {
        recognition.stop();
      }
    },
  };
}

export const voiceService: VoiceService = {
  available: Ctor !== null,
  unavailableReason: Ctor === null ? 'Voice input is not supported in this browser — try Chrome, Edge, or Safari, or type instead.' : undefined,
  startListening,
};
