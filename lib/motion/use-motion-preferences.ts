import { useMemo } from 'react';

import {
  getAccessibleAnimationDuration,
  useScreenReader,
} from '@/lib/accessibility';

export type MotionTransform = {
  translateX?: number;
  translateY?: number;
  scale?: number;
};

export type MotionPreferences = Readonly<{
  reduceMotion: boolean;
  screenReaderEnabled: boolean;
  allowsTransform: boolean;
  allowsLoops: boolean;
  duration: (value: number) => number;
  distance: (value: number) => number;
  scale: (value: number) => number;
  resolveTransform: (transform: MotionTransform) => MotionTransform;
  shouldLoop: (requested: boolean) => boolean;
}>;

/**
 * Creates the pure part of the motion policy so components and tests can use
 * the same Reduce Motion behaviour without reaching into native APIs.
 */
export function createMotionPreferences(
  reduceMotion: boolean,
  screenReaderEnabled = false
): MotionPreferences {
  const duration = (value: number): number => {
    const safeValue = Math.max(0, value);

    return reduceMotion
      ? getAccessibleAnimationDuration(0, true)
      : getAccessibleAnimationDuration(safeValue, false);
  };

  const distance = (value: number): number => (reduceMotion ? 0 : value);

  const scale = (value: number): number => (reduceMotion ? 1 : value);

  const resolveTransform = (transform: MotionTransform): MotionTransform => {
    const resolved: MotionTransform = { ...transform };

    if (transform.translateX !== undefined) {
      resolved.translateX = distance(transform.translateX);
    }

    if (transform.translateY !== undefined) {
      resolved.translateY = distance(transform.translateY);
    }

    if (transform.scale !== undefined) {
      resolved.scale = scale(transform.scale);
    }

    return resolved;
  };

  return {
    reduceMotion,
    screenReaderEnabled,
    allowsTransform: !reduceMotion,
    allowsLoops: !reduceMotion,
    duration,
    distance,
    scale,
    resolveTransform,
    shouldLoop: (requested: boolean): boolean =>
      reduceMotion ? false : requested,
  };
}

/**
 * Reads the platform accessibility preference and exposes the shared motion
 * policy to React Native components.
 */
export function useMotionPreferences(): MotionPreferences {
  const { isReduceMotionEnabled, isScreenReaderEnabled } = useScreenReader();

  return useMemo(
    () => createMotionPreferences(isReduceMotionEnabled, isScreenReaderEnabled),
    [isReduceMotionEnabled, isScreenReaderEnabled]
  );
}
