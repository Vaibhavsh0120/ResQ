import { VoiceService } from './voiceService.types';

// Native (iOS/Android) speech-to-text — Metro/Expo Router resolves *this*
// file for native builds, and voiceService.web.ts for web, via the
// standard `.web.ts` platform extension (same pattern as MiniMap.tsx/
// MiniMap.web.tsx — see that file for the fuller rationale on preferring
// platform files over a runtime Platform.OS branch here).
//
// There is currently no real on-device STT wired in. The only path to one
// is `expo-speech-recognition` (community package, not an official Expo
// SDK module) — it requires its own config plugin and a development-
// client rebuild (Expo Go can't load it), neither of which can be
// installed, linked, or verified inside this sandbox (no network access —
// see AGENT.md's Verified Findings for the standing constraint). Rather
// than silently fake a transcript or block the whole voice feature on a
// package that can't be confirmed working, app/voice.tsx checks
// `available` and falls back to typed input on native — a real, honest
// state, not a placeholder.
//
// To wire real native STT later: `npm install expo-speech-recognition`,
// add its config plugin to app.json, run `expo prebuild` + a dev-client
// build, then replace this file's body with calls into
// `ExpoSpeechRecognitionModule.start()`/`.stop()` and its result/error
// event listeners, matching the `VoiceService` shape below so
// useVoiceAssistant.ts and app/voice.tsx need zero changes.
export const voiceService: VoiceService = {
  available: false,
  unavailableReason: 'Voice input needs a custom app build on this device — type your message instead.',
  startListening(options) {
    // Never called in practice (app/voice.tsx checks `available` first
    // and shows typed input instead), but implemented honestly rather
    // than left as a no-op or a throw: reports the same unavailable
    // reason via onError a caller would need if it were invoked anyway.
    options.onError('Voice input needs a custom app build on this device — type your message instead.');
    return { stop: () => {} };
  },
};
