import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that returns a Date that updates on interval, plus a countdown.
 * Useful as a dependency to trigger periodic re-fetches.
 * @param {boolean} enabled - Whether polling is active
 * @param {number} interval - Milliseconds between ticks (default 30000)
 * @returns {{ now: Date, countdown: number, refresh: () => void }}
 */
export function useTick(enabled, interval = 30000) {
  const [now, setNow] = useState(new Date());
  const [countdown, setCountdown] = useState(Math.floor(interval / 1000));

  const refresh = useCallback(() => {
    setNow(new Date());
    setCountdown(Math.floor(interval / 1000));
  }, [interval]);

  useEffect(() => {
    if (!enabled) return;

    // Main tick for data refresh
    const tick = setInterval(() => {
      setNow(new Date());
      setCountdown(Math.floor(interval / 1000));
    }, interval);

    // Countdown tick every second
    const countdownTick = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : Math.floor(interval / 1000)));
    }, 1000);

    return () => {
      clearInterval(tick);
      clearInterval(countdownTick);
    };
  }, [enabled, interval]);

  return { now, countdown: enabled ? countdown : null, refresh };
}
