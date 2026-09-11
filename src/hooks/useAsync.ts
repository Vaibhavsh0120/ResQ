import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> = {
  data: T | undefined;
  loading: boolean;
  error: string | null;
};

/**
 * Runs an async fetcher on mount (and whenever `deps` change), exposing
 * loading/error/data state plus a `refresh` function. Every domain hook in
 * this folder (useUpdates, useSafePlaces, useGuidance, ...) is a thin
 * wrapper around this, so screens all get the same loading/error/retry
 * behavior regardless of which service backs them.
 *
 * `refresh()` and the mount/deps-change effect share one "latest call
 * wins" guard (`callIdRef`), not just the effect's own cleanup closure —
 * calling `refresh()` while a previous call (from mount or an earlier
 * `refresh()`) is still in flight used to let the stale response land
 * after the fresh one, silently overwriting newer data with older data.
 * Concretely: useSosHistory().logEvent calls `refresh()` right after
 * writing, and sos.tsx can call `logEvent` twice in quick succession
 * (fire(), then finalizeAndClose()) — without this guard the first
 * refresh's response could resolve after the second's and clobber it.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): AsyncState<T> & { refresh: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const callIdRef = useRef(0);

  const run = useCallback(() => {
    const callId = ++callIdRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (callIdRef.current === callId) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (callIdRef.current === callId) {
          setState({
            data: undefined,
            loading: false,
            error: err instanceof Error ? err.message : 'Something went wrong.',
          });
        }
      });

    return () => {
      // Effect-cleanup path (unmount / deps change before this call
      // resolved): only invalidate if this is still the latest call —
      // otherwise a stale cleanup could invalidate a newer, still-pending
      // call that a manual refresh() started after this effect re-ran.
      if (callIdRef.current === callId) callIdRef.current = -1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, refresh: run };
}
