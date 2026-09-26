import { useEffect, useRef, useState } from 'react';

import { MOTION_DURATIONS } from '@/lib/motion/tokens';

const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

/**
 * Counts a displayed number towards a newly confirmed value. The first value
 * appears immediately; only a later change animates, so a balance or streak
 * visibly moves when it genuinely changes. Reduce Motion shows the final value.
 */
export function useCountUp(
  target: number | null,
  animate: boolean,
  duration: number = MOTION_DURATIONS.complex
): number | null {
  const [displayed, setDisplayed] = useState<number | null>(target);
  const previousRef = useRef<number | null>(target);

  useEffect(() => {
    const from = previousRef.current;
    previousRef.current = target;

    if (target === null || from === null || from === target || !animate) {
      setDisplayed(target);
      return;
    }

    let frame: ReturnType<typeof requestAnimationFrame> | null = null;
    const startedAt = Date.now();
    const step = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      setDisplayed(Math.round(from + (target - from) * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [animate, duration, target]);

  return displayed;
}
