import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';
import { StartListeningOptions, VoiceRecognitionHandle, VoiceService } from './voiceService.types';

// Native (iOS/Android) speech-to-text — Metro/Expo Router resolves *this*
// file for native builds, and voiceService.web.ts for web, via the
// standard `.web.ts` platform extension (same pattern as MiniMap.tsx/
// MiniMap.web.tsx — see that file for the fuller rationale on preferring
// platform files over a runtime Platform.OS branch here).
//
// Real on-device STT via `expo-speech-recognition` (jamsch) — the actively
// maintained community package for this (the older `@react-native-voice/
// voice` is deprecated/archived; its own README now points here). Wraps
// iOS's SFSpeechRecognizer and Android's SpeechRecognizer natively, with
// an API deliberately modeled on the Web Speech API — which is exactly
// why this file's shape barely differs from voiceService.web.ts's.
//
// **Requires a development-client build to actually run** — like any
// Expo Module with native code, it cannot load inside Expo Go. This
// sandbox has no ios/android build tooling (no Xcode, no device), so this
// implementation is written and typechecked against the library's real,
// installed type definitions (see AGENT.md's Verified Findings for how
// that was confirmed — `npm install expo-speech-recognition@57.0.0`
// resolved clean, 0 audit vulnerabilities, peer deps satisfied by this
// project's existing expo/react/react-native), but has NOT been run on a
// real device. Before shipping: `npx expo prebuild`, then `npx expo
// run:ios` (or `run:android`) on a real machine with Xcode/Android
// Studio, and manually verify a full listen → transcript → reply →
// speak round trip. See README.md's "Running natively" section (added
// alongside this change) for the exact steps.
export const voiceService: VoiceService = {
  // isRecognitionAvailable() reflects whether the OS itself can do speech
  // recognition right now (e.g. Siri/Dictation enabled on iOS) — but
  // that's a device-state check, not "is the native module linked at
  // all". Calling it when the module isn't linked (i.e. still running in
  // Expo Go, or a build from before this package was added) would throw
  // rather than return false, so this also confirms the module itself
  // loaded before trusting its answer.
  available: (() => {
    try {
      return ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      return false;
    }
  })(),
  unavailableReason:
    'Voice input needs speech recognition enabled on this device (Settings > Siri & Search > Dictation on iOS, or a speech-recognition service on Android) — type your message instead.',

  startListening(options: StartListeningOptions): VoiceRecognitionHandle {
    let settled = false;
    let finalTranscript = '';

    const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
      const transcript = event.results[0]?.transcript ?? '';
      if (event.isFinal) {
        finalTranscript = transcript;
      } else {
        options.onInterimResult?.(transcript);
      }
    });

    // Matches voice.web.ts's "volume" concept: the module's own
    // `volumechange` event reports a value between roughly -2 and 10
    // (per the library's docs), not the 0..1 range `onVolumeChange`
    // expects — normalized here so useVoiceAssistant.ts's amplitude
    // logic doesn't need to know this module's specific scale.
    const volumeListener = ExpoSpeechRecognitionModule.addListener('volumechange', (event: { value: number }) => {
      const normalized = Math.max(0, Math.min(1, (event.value + 2) / 12));
      options.onVolumeChange?.(normalized);
    });

    const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event: ExpoSpeechRecognitionErrorEvent) => {
      if (settled) return;
      // "aborted" fires when *we* call stop()/abort() below — that's a
      // normal, caller-initiated end, not a user-facing failure. Same
      // "no-speech" leniency voiceService.web.ts already applies.
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      settled = true;
      const message =
        event.error === 'not-allowed'
          ? 'Microphone or speech recognition access was denied — allow it in Settings, or type instead.'
          : 'Could not hear you clearly — try again or type instead.';
      options.onError(message);
    });

    const endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
      resultListener.remove();
      volumeListener.remove();
      errorListener.remove();
      endListener.remove();
      if (settled) return;
      settled = true;
      options.onResult(finalTranscript.trim());
    });

    ExpoSpeechRecognitionModule.requestPermissionsAsync()
      .then((result) => {
        if (settled) return;
        if (!result.granted) {
          settled = true;
          options.onError('Microphone or speech recognition access was denied — allow it in Settings, or type instead.');
          return;
        }
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          continuous: false,
          volumeChangeEventOptions: { enabled: true, intervalMillis: 150 },
          // Signal-processing option this library exposes specifically
          // for the "speaker audio gets picked up by the mic" problem —
          // see AGENT.md's Important Decisions for why this matters
          // beyond just this call: it's the same primitive the planned
          // backend-assisted barge-in (voice-activated interrupt while
          // ResQ is talking) will lean on once a real backend exists.
          iosVoiceProcessingEnabled: true,
        });
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        options.onError('Could not start listening — try again or type instead.');
      });

    return {
      stop: () => {
        if (!settled) ExpoSpeechRecognitionModule.stop();
      },
    };
  },
};
