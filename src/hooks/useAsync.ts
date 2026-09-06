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
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): AsyncState<T> & { refresh: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: undefined,
            loading: false,
            error: err instanceof Error ? err.message : 'Something went wrong.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, refresh: run };
}
