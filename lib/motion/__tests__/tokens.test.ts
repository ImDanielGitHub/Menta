import {
  MOTION_DISTANCES,
  MOTION_DURATIONS,
  MOTION_SCALES,
  MOTION_SPRINGS,
} from '@/lib/motion/tokens';

describe('motion tokens', () => {
  it('keeps the audited timing ladder and hold threshold', () => {
    expect(MOTION_DURATIONS).toEqual({
      instant: 0,
      press: 120,
      fast: 140,
      state: 180,
      screen: 240,
      complex: 400,
      hold: 1300,
    });
  });

  it('keeps restrained distances, scales, and spring recipes', () => {
    expect(MOTION_DISTANCES).toEqual({ none: 0, xs: 4, sm: 8, md: 16 });
    expect(MOTION_SCALES).toEqual({ none: 1, press: 0.985, entrance: 0.96 });
    expect(MOTION_SPRINGS).toEqual({
      snappy: { stiffness: 400, damping: 30, mass: 1 },
      settle: { stiffness: 240, damping: 28, mass: 1 },
    });
  });
});
