import { useEffect, useRef, useState } from 'react';

import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

const COUNT_UP_MS = 520;

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

/**
 * Animates a displayed number from its previous value to the next confirmed
 * value. The first value renders immediately, and Reduce Motion always shows
 * the confirmed value without counting. Callers keep the exact value in their
 * accessibility label so assistive technology never hears an in-between
 * number.
 */
export function useCountUp(value: number): number {
  const motion = useMotionPreferences();
  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayedRef.current;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (
      motion.reduceMotion ||
      from === value ||
      !Number.isFinite(from) ||
      !Number.isFinite(value) ||
      typeof requestAnimationFrame !== 'function'
    ) {
      displayedRef.current = value;
      setDisplayed(value);
      return;
    }

    const startedAt = Date.now();
    const step = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / COUNT_UP_MS);
      const next = Math.round(from + (value - from) * easeOutCubic(progress));
      displayedRef.current = next;
      setDisplayed(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      displayedRef.current = value;
    };
  }, [motion.reduceMotion, value]);

  return displayed;
}
