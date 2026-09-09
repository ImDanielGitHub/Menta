/**
 * Shared motion values for Menta's state changes.
 *
 * These values are intentionally small and explicit. Motion should clarify a
 * state change or mark a meaningful milestone, not become ambient decoration.
 */
export const MOTION_DURATIONS = {
  instant: 0,
  press: 120,
  fast: 140,
  state: 180,
  screen: 240,
  complex: 400,
  hold: 1300,
} as const;

export const MOTION_DISTANCES = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
} as const;

export const MOTION_SCALES = {
  none: 1,
  press: 0.985,
  entrance: 0.96,
} as const;

export const MOTION_SPRINGS = {
  snappy: {
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  settle: {
    stiffness: 240,
    damping: 28,
    mass: 1,
  },
} as const;

export type MotionDuration = keyof typeof MOTION_DURATIONS;
export type MotionDistance = keyof typeof MOTION_DISTANCES;
export type MotionScale = keyof typeof MOTION_SCALES;
export type MotionSpring = keyof typeof MOTION_SPRINGS;
