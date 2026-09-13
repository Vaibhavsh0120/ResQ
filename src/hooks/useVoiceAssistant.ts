import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChatReply, saveChatThread, fetchChatThreadMessages } from '@/services/chatService';
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
  // Mirrors which saved thread (if any) this voice conversation
  // continues — same id-based upsert pattern useChat.ts uses, so
  // resuming a previous voice conversation from chat.tsx's history
  // drawer and continuing to talk updates that thread in place instead
  // of forking a new one on every exchange.
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThreadIdRef = useRef<string | null>(null);

  const listenHandleRef = useRef<{ stop: () => void } | null>(null);
  const speakHandleRef = useRef<{ stop: () => void } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boundaryHeardRef = useRef(false);
  const mountedRef = useRef(true);
  // Passive mic listener kept running only while ResQ is talking, purely
  // to detect that the user has started speaking over it — see
  // startBargeInListener below. Separate from listenHandleRef, which is
  // the user-facing "actively listening" session (different phase,
  // different UI state) — the two are never active at the same time.
  const bargeInHandleRef = useRef<{ stop: () => void } | null>(null);
  // Points at the latest `interrupt` callback (defined further down, after
  // startListening/sendToAssistant, which it depends on) — read from
  // speakReply's barge-in listener below so that listener can call the
  // real interrupt without a circular declaration-order problem or a
  // stale closure over an early, empty version of it.
  const interruptRef = useRef<() => void>(() => {});

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

  const stopBargeInListener = useCallback(() => {
    bargeInHandleRef.current?.stop();
    bargeInHandleRef.current = null;
  }, []);

  // Starts a passive, non-visible listening session for as long as ResQ
  // is talking, so the user can interrupt just by speaking — not only by
  // tapping the orb. Fires on the *first* sign of speech (interim result,
  // the earliest signal the STT engine offers — see
  // voiceService.types.ts's onInterimResult doc) rather than waiting for
  // a final transcript, so the cut-off feels immediate rather than
  // laggy. What was said during that interruption isn't discarded: firing
  // interrupt() hands straight off into a real startListening() session,
  // which keeps capturing from that same moment.
  //
  // Known, honest limitation: on a phone/laptop speaker (no headphones),
  // the mic picks up ResQ's own voice along with the user's, so this can
  // false-trigger on ResQ's own speech, not just genuine interruptions —
  // real assistants (Siri, Alexa) solve this with echo-cancellation
  // hardware/DSP this app has no access to today. Tap-to-interrupt
  // (onOrbPress in app/voice.tsx) is the reliable path either way; this
  // is a best-effort addition on top of it, most useful with headphones.
  // `voiceService.ts`'s native implementation already sets
  // `iosVoiceProcessingEnabled: true`, which turns on iOS's own hardware
  // echo-cancellation and should meaningfully help there once run on a
  // real device. A more complete, cross-platform fix needs a real
  // backend (server-side AEC using the actual TTS reference signal) —
  // see AGENT.md's Important Decisions for the planned design once
  // Phase 3 (backend) exists.
  const startBargeInListener = useCallback(() => {
    if (!voiceService.available) return;
    stopBargeInListener();
    let triggered = false;
    const onSpeechDetected = () => {
      if (triggered) return;
      triggered = true;
      bargeInHandleRef.current?.stop();
      bargeInHandleRef.current = null;
      if (!mountedRef.current) return;
      interruptRef.current();
    };
    bargeInHandleRef.current = voiceService.startListening({
      onInterimResult: onSpeechDetected,
      onResult: (transcript) => {
        if (transcript.trim()) onSpeechDetected();
      },
      // Passive/background — a mic error here (e.g. another app briefly
      // holding the mic) shouldn't interrupt ResQ or surface as a
      // user-facing error; the user isn't actively trying to speak yet.
      onError: () => {},
    });
  }, [stopBargeInListener]);

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
    stopBargeInListener();
    abortRef.current?.abort();
    abortRef.current = null;
    stopSpeaking();
    setAmplitude(0);
  }, [clearPulseTimer, stopBargeInListener]);

  useEffect(() => stopEverything, [stopEverything]);

  const speakReply = useCallback(
    (text: string) => {
      setPhase('speaking');
      boundaryHeardRef.current = false;
      startSyntheticPulse();
      startBargeInListener();

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
          stopBargeInListener();
          if (!mountedRef.current) return;
          clearPulseTimer();
          setAmplitude(0);
          setPhase('idle');
        },
        onError: () => {
          stopBargeInListener();
          if (!mountedRef.current) return;
          clearPulseTimer();
          setAmplitude(0);
          setPhase('idle');
        },
      });
    },
    [clearPulseTimer, startSyntheticPulse, startBargeInListener, stopBargeInListener]
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

      // Persist the exchange — same secureStorage-backed thread store
      // chat.tsx's useChat.ts writes to (source: 'voice' distinguishes
      // it in the history drawer). A completed exchange always has real
      // content (the trimmed-empty-transcript case returned early
      // above), so this is never called with nothing worth saving.
      const allTurns = [...historyForContext, { id: assistantTurn.id, role: assistantTurn.role, text: assistantTurn.text }];
      saveChatThread({ id: activeThreadIdRef.current ?? undefined, source: 'voice', messages: allTurns })
        .then((saved) => {
          activeThreadIdRef.current = saved.id;
          setActiveThreadId(saved.id);
        })
        .catch(() => {
          // Best-effort — a failed save shouldn't interrupt the live
          // conversation the user is having right now. If this ever
          // fires, the conversation simply won't show up in "Previous
          // chats" afterward, which is a much better failure mode than
          // freezing the voice UI over a storage write.
        });

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
    stopBargeInListener();
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
  }, [phase, clearPulseTimer, startSyntheticPulse, sendToAssistant, stopBargeInListener]);

  const stopListening = useCallback(() => {
    listenHandleRef.current?.stop();
  }, []);

  // Barge-in while ResQ is talking (or still "thinking" about what to
  // say): stop whatever's in flight and start listening again right
  // away, so the user never has to wait out a reply they've already
  // decided to interrupt. Deliberately not just `startListening()` on
  // its own — that only calls `stopSpeaking()`/clears the pulse timer,
  // it doesn't abort a still-streaming `sendToAssistant` call (relevant
  // when interrupting during `thinking`, before speech has even started)
  // or guard against a late `onDone`/`onError` from the reply we just cut
  // off clobbering the phase startListening is about to set. Triggered
  // either by tapping the orb (app/voice.tsx's onOrbPress) or by the
  // passive barge-in listener above detecting the user talking over
  // ResQ — both funnel through this one path.
  const interrupt = useCallback(() => {
    stopBargeInListener();
    abortRef.current?.abort();
    abortRef.current = null;
    speakHandleRef.current?.stop();
    speakHandleRef.current = null;
    stopSpeaking();
    clearPulseTimer();
    setAmplitude(0);
    startListening();
  }, [clearPulseTimer, startListening, stopBargeInListener]);

  // Keeps interruptRef pointed at the latest `interrupt` closure, so
  // startBargeInListener's onSpeechDetected (declared earlier, before
  // `interrupt` exists) always calls the current one rather than a stale
  // reference captured on first render.
  useEffect(() => {
    interruptRef.current = interrupt;
  }, [interrupt]);

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
    activeThreadIdRef.current = null;
    setActiveThreadId(null);
  }, [stopEverything]);

  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  /**
   * Resumes a previous conversation from chat.tsx's history drawer —
   * works the same whether that thread was originally a text chat or a
   * voice conversation (source: 'chat' | 'voice' only affects how it's
   * *displayed* in the drawer, not whether it can be resumed here).
   * Continuing to talk after this updates the same thread in place
   * (activeThreadIdRef), matching useChat.ts's loadThread behavior.
   */
  const loadThread = useCallback(
    async (threadId: string) => {
      stopEverything();
      setLoadingThread(true);
      setThreadError(null);
      try {
        const messages = await fetchChatThreadMessages(threadId);
        setTurns(messages.map(({ id, role, text }) => ({ id, role, text })));
        activeThreadIdRef.current = threadId;
        setActiveThreadId(threadId);
        setPhase('idle');
      } catch (err) {
        setThreadError(err instanceof Error ? err.message : 'Could not load that conversation.');
      } finally {
        setLoadingThread(false);
      }
    },
    [stopEverything]
  );

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
    activeThreadId,
    loadingThread,
    threadError,
    voiceAvailable: voiceService.available,
    voiceUnavailableReason: voiceService.unavailableReason,
    startListening,
    stopListening,
    sendTyped,
    interrupt,
    reset,
    loadThread,
    dismissError,
  };
}
