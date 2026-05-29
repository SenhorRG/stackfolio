'use client';

import { useCallback, useEffect, useRef } from 'react';

export function usePreviewRefreshScheduler(
  delayMs: number,
  onRefresh: () => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onRefresh();
    }, delayMs);
  }, [delayMs, onRefresh]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const refreshNow = useCallback(() => {
    cancel();
    onRefresh();
  }, [cancel, onRefresh]);

  useEffect(() => () => cancel(), [cancel]);

  return { schedule, cancel, refreshNow };
}
