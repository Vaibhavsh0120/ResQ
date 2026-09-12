import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChatReply } from '@/services/chatService';
import { speak, stopSpeaking } from '@/services/ttsService';
import { voiceService } from '@/services/voiceService';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage, VoicePhase, VoiceTurn } from '@/types';

let nextId = 1;
const genId = (prefix: string) => `voice-${prefix}-${Date.now()}-${nextId++}`;

/**
 * Orchestrates the voice conversation shown by app/voice.tsx: listen (via
 * src/services/voiceService's platform-specific STT) -> send the
 * transcript through the same `streamChatReply` pipeline app/chat.tsx
 * already uses (so voice and text share one brain, one mock/real seam,
 * one place to swap in a real backend) -> speak the reply aloud via
 * src/services/ttsService (expo-speech).
 *
 * `phase` is the single source of truth the screen's animated orb reads:
 *   idle      - waiting for the user to tap the mic
 *   listening - actively recording the user's speech
 *   thinking  - transcript captured, waiting on the (streamed) reply
 *   speaking  - ResQ's reply is being read aloud
 *   error     - something failed; `error` has a short human-readable reason
 *
 * `amplitude` (0..1) drives the waveform/orb's pulse. While listening it
 * reflects the mic-level callback voiceService reports (when the platform
 * provides one — see voiceService.web.ts's header comment for why it
 * currently doesn't on web either) or a gentle synthetic pulse otherwise,
 * so the orb never just sits dead when no real level is available. While
 * speaking it pulses on each expo-speech `onBoundary` word event, again
 * falling back to a steady synthetic pulse if the platform/browser never
 * fires one (see ttsService.ts's header comment on onBoundary's web
 * reliability) — the fallback interval is cleared the instant a real
 * boundary event arrives, so genuine word-sync always wins when it's
 * available.
 */
export function useVoiceAssistant() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [amplitude, setAmplitude] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const listenHandleRef = useRef<{ stop: () => void } | null>(null);
  const speakHandleRef = useRef<{ stop: () => void } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boundaryHeardRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearPulseTimer = useCallback(() => {
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
  }, []);

  // Gentle synthetic pulse used whenever the platform can't report a real
  // amplitude/boundary signal — keeps the orb visibly "alive" instead of
  // static, without pretending to be real audio data.
  const startSyntheticPulse = useCallback(() => {
    clearPulseTimer();
    let t = 0;
    pulseTimerRef.current = setInterval(() => {
      t += 1;
      if (!mountedRef.current) return;
      setAmplitude(0.35 + Math.abs(Math.sin(t * 0.4)) * 0.45);
    }, 120);
  }, [clearPulseTimer]);

  const stopEverything = useCallback(() => {
    clearPulseTimer();
    listenHandleRef.current?.stop();
    listenHandleRef.current = null;
    speakHandleRef.current?.stop();
    speakHandleRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    stopSpeaking();
    setAmplitude(0);
  }, [clearPulseTimer]);

  useEffect(() => stopEverything, [stopEverything]);

  const speakReply = useCallback(
    (text: string) => {
      setPhase('speaking');
      boundaryHeardRef.current = false;
      startSyntheticPulse();

      speakHandleRef.current = speak(text, {
        onBoundary: () => {
          if (!mountedRef.current) return;
          if (!boundaryHeardRef.current) {
            boundaryHeardRef.current = true;
            clearPulseTimer();
          }
          // Quick pop on each word boundary, matching real speech cadence
          // far more closely than a smooth synthetic sine ever could.
          setAmplitude(0.9);
          setTimeout(() => {
            if (mountedRef.current) setAmplitude(0.4);
          }, 90);
        },
        onDone: () => {
          if (!mountedRef.current) return;
          clearPulseTimer();
          setAmplitude(0);
          setPhase('idle');
        },
        onError: () => {
          if (!mountedRef.current) return;
          clearPulseTimer();
          setAmplitude(0);
          setPhase('idle');
        },
      });
    },
    [clearPulseTimer, startSyntheticPulse]
  );

  const sendToAssistant = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed) {
        setPhase('idle');
        return;
      }

      const userTurn: VoiceTurn = { id: genId('user'), role: 'user', text: trimmed };
      setTurns((prev) => [...prev, userTurn]);
      setPhase('thinking');
      setInterimTranscript('');

      const controller = new AbortController();
      abortRef.current = controller;

      let fullReply = '';
      const historyForContext: ChatMessage[] = [
        ...turns.map((t) => ({ id: t.id, role: t.role, text: t.text })),
        { id: userTurn.id, role: userTurn.role, text: userTurn.text },
      ];

      try {
        await streamChatReply(
          trimmed,
          historyForContext,
          (event) => {
            if (event.type === 'token') {
              fullReply += event.text;
            } else if (event.type === 'error') {
              fullReply = fullReply || event.message;
            }
          },
          controller.signal
        );
      } catch {
        fullReply = fullReply || "Sorry, I couldn't reach the assistant just now.";
      }

      if (!mountedRef.current || controller.signal.aborted) return;

      const assistantTurn: VoiceTurn = { id: genId('assistant'), role: 'assistant', text: fullReply.trim() };
      setTurns((prev) => [...prev, assistantTurn]);

      if (assistantTurn.text) {
        speakReply(assistantTurn.text);
      } else {
        setPhase('idle');
      }
    },
    [turns, speakReply]
  );

  const startListening = useCallback(() => {
    if (phase === 'listening') return;
    stopSpeaking();
    clearPulseTimer();
    setError(null);
    setInterimTranscript('');
    setPhase('listening');
    startSyntheticPulse();

    listenHandleRef.current = voiceService.startListening({
      onInterimResult: (text) => {
        if (mountedRef.current) setInterimTranscript(text);
      },
      onVolumeChange: (level) => {
        if (!mountedRef.current) return;
        clearPulseTimer();
        setAmplitude(Math.max(0.1, Math.min(1, level)));
      },
      onResult: (transcript) => {
        if (!mountedRef.current) return;
        clearPulseTimer();
        setAmplitude(0);
        sendToAssistant(transcript);
      },
      onError: (message) => {
        if (!mountedRef.current) return;
        clearPulseTimer();
        setAmplitude(0);
        setError(message);
        setPhase('error');
      },
    });
  }, [phase, clearPulseTimer, startSyntheticPulse, sendToAssistant]);

  const stopListening = useCallback(() => {
    listenHandleRef.current?.stop();
  }, []);

  /** Typed-input fallback path — used directly on native (voiceService.available is false) or whenever the user prefers typing. Shares the same reply/speak pipeline as voice input. */
  const sendTyped = useCallback(
    (text: string) => {
      setError(null);
      sendToAssistant(text);
    },
    [sendToAssistant]
  );

  const reset = useCallback(() => {
    stopEverything();
    setTurns([]);
    setInterimTranscript('');
    setError(null);
    setPhase('idle');
  }, [stopEverything]);

  const dismissError = useCallback(() => {
    setError(null);
    setPhase('idle');
  }, []);

  return {
    phase,
    turns,
    interimTranscript,
    amplitude,
    error,
    firstName,
    voiceAvailable: voiceService.available,
    voiceUnavailableReason: voiceService.unavailableReason,
    startListening,
    stopListening,
    sendTyped,
    reset,
    dismissError,
  };
}
