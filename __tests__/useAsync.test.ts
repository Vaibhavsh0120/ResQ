import { act, renderHook } from '@testing-library/react-native';
import { useAsync } from '@/hooks/useAsync';

/**
 * Regression test for the 2026-09-11 fix: `refresh()` and the mount effect
 * used to share nothing but their own local `cancelled` closure, so a
 * `refresh()` call started while an earlier call (mount, or a previous
 * `refresh()`) was still in flight had no way to invalidate it — the
 * earlier call's response could resolve after the later one's and silently
 * overwrite fresher state with staler data. This exercises exactly that
 * scenario: two overlapping calls resolving out of order, and asserts the
 * hook always ends up reflecting the *last call made*, not the last call
 * to *resolve*.
 */
describe('useAsync', () => {
  it('keeps the result of the latest call even if an earlier call resolves after it', async () => {
    let resolveFirst!: (value: string) => void;
    let resolveSecond!: (value: string) => void;

    const first = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const second = new Promise<string>((resolve) => {
      resolveSecond = resolve;
    });

    const fetcher = jest.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);

    const { result } = await renderHook(() => useAsync(fetcher, []));

    // Mount's own call is in flight (unresolved `first`). Trigger a second,
    // overlapping call before it resolves — mirrors sos.tsx's fire() then
    // finalizeAndClose() both calling useSosHistory().logEvent() (and thus
    // refresh()) in quick succession.
    await act(async () => {
      result.current.refresh();
    });

    // Resolve the SECOND (later) call first, then the FIRST (earlier,
    // stale) call — the out-of-order resolution that used to cause the bug.
    await act(async () => {
      resolveSecond('second-response');
    });
    await act(async () => {
      resolveFirst('first-response');
    });

    // The stale first response must not win over the later refresh — the
    // hook should reflect the latest call, not whichever resolved last.
    expect(result.current.data).toBe('second-response');
    expect(result.current.loading).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reports an error from the latest call, not a stale earlier failure', async () => {
    let rejectFirst!: (err: Error) => void;
    let resolveSecond!: (value: string) => void;

    const first = new Promise<string>((_, reject) => {
      rejectFirst = reject;
    });
    const second = new Promise<string>((resolve) => {
      resolveSecond = resolve;
    });

    const fetcher = jest.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);

    const { result } = await renderHook(() => useAsync(fetcher, []));

    await act(async () => {
      result.current.refresh();
    });

    // Resolve the newer call successfully first...
    await act(async () => {
      resolveSecond('second-response');
    });
    // ...then reject the stale first call. The stale rejection must not
    // clobber the newer success.
    await act(async () => {
      rejectFirst(new Error('stale failure'));
      // Swallow the rejection at the promise level so Jest doesn't flag
      // it as unhandled — useAsync itself handles it via .catch().
      await first.catch(() => {});
    });

    expect(result.current.data).toBe('second-response');
    expect(result.current.error).toBeNull();
  });
});
