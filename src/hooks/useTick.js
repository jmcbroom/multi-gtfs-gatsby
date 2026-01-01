import { useState, useEffect } from 'react';

/**
 * Hook that returns a Date that updates on interval.
 * Useful as a dependency to trigger periodic re-fetches.
 * @param {boolean} enabled - Whether polling is active
 * @param {number} interval - Milliseconds between ticks (default 30000)
 */
export function useTick(enabled, interval = 30000) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!enabled) return;
    const tick = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(tick);
  }, [enabled, interval]);

  return now;
}
