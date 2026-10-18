import { useEffect, useRef, useState } from 'react';

const TICK_MS = 250;

// Countdown that can be paused (e.g. while waiting on Gemma). Remount the component
// (change its `key`) to reset it. `onExpire` fires once when it reaches 0.
export function useCountdown(limitSec: number, opts: { paused?: boolean; onExpire?: () => void } = {}) {
  const [remainingMs, setRemainingMs] = useState(limitSec * 1000);
  const onExpireRef = useRef(opts.onExpire);
  onExpireRef.current = opts.onExpire;
  const expiredRef = useRef(false);
  const stopped = !!opts.paused || remainingMs <= 0;

  useEffect(() => {
    if (stopped) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      setRemainingMs((r) => Math.max(0, r - dt));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [stopped]);

  useEffect(() => {
    if (remainingMs <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [remainingMs]);

  // Burns time off the clock (e.g. the cost of a hint).
  const penalize = (sec: number) => setRemainingMs((r) => Math.max(0, r - sec * 1000));

  const remaining = remainingMs / 1000;
  return { remaining, elapsed: limitSec - remaining, expired: remainingMs <= 0, penalize };
}
