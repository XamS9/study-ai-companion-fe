import { useCallback, useEffect, useRef, useState } from 'react';

type UseCountdown = { seconds: number; start: (seconds: number) => void };

/**
 * Counts down to zero from a target time. Call `start(n)` to begin an `n`-second
 * countdown; `seconds` ticks down to 0 and the interval clears itself. Used to gate
 * the "Regenerate" button against the backend's rate-limit window.
 */
export function useCountdown(): UseCountdown {
  const [seconds, setSeconds] = useState(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  const start = useCallback(
    (total: number) => {
      const until = Date.now() + total * 1000;
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        setSeconds(remaining);
        if (remaining <= 0) clear();
      };
      clear();
      tick();
      interval.current = setInterval(tick, 500);
    },
    [clear],
  );

  useEffect(() => clear, [clear]);

  return { seconds, start };
}
