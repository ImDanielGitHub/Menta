import { renderHook } from '@testing-library/react-native';

import {
  getAccessibleAnimationDuration,
  useScreenReader,
} from '@/lib/accessibility';
import {
  createMotionPreferences,
  useMotionPreferences,
} from '@/lib/motion/use-motion-preferences';

jest.mock('@/lib/accessibility', () => ({
  getAccessibleAnimationDuration: (duration: number, reduceMotion: boolean) =>
    reduceMotion ? Math.min(duration * 0.1, 100) : Math.min(duration, 5000),
  useScreenReader: jest.fn(),
}));

describe('motion preferences', () => {
  it('removes transforms and loops when Reduce Motion is enabled', () => {
    const preferences = createMotionPreferences(true, true);

    expect(preferences.reduceMotion).toBe(true);
    expect(preferences.screenReaderEnabled).toBe(true);
    expect(preferences.allowsTransform).toBe(false);
    expect(preferences.allowsLoops).toBe(false);
    expect(preferences.duration(200)).toBe(0);
    expect(preferences.distance(16)).toBe(0);
    expect(preferences.scale(0.96)).toBe(1);
    expect(
      preferences.resolveTransform({
        translateX: 16,
        translateY: -8,
        scale: 0.96,
      })
    ).toEqual({ translateX: 0, translateY: 0, scale: 1 });
    expect(preferences.shouldLoop(true)).toBe(false);
  });

  it('preserves motion while using the shared accessibility duration cap', () => {
    const preferences = createMotionPreferences(false);

    expect(preferences.allowsTransform).toBe(true);
    expect(preferences.allowsLoops).toBe(true);
    expect(preferences.duration(6000)).toBe(5000);
    expect(preferences.distance(16)).toBe(16);
    expect(preferences.scale(0.985)).toBe(0.985);
    expect(
      preferences.resolveTransform({ translateX: 16, scale: 0.985 })
    ).toEqual({ translateX: 16, scale: 0.985 });
    expect(preferences.shouldLoop(true)).toBe(true);
  });

  it('updates the React hook from the platform accessibility state', () => {
    jest.mocked(useScreenReader).mockReturnValue({
      isScreenReaderEnabled: false,
      isReduceMotionEnabled: true,
      announce: (_message: string) => undefined,
    });

    const { result } = renderHook(() => useMotionPreferences());

    expect(result.current.reduceMotion).toBe(true);
    expect(result.current.duration(140)).toBe(
      getAccessibleAnimationDuration(0, true)
    );
    expect(result.current.resolveTransform({ translateY: 8 })).toEqual({
      translateY: 0,
    });
  });
});
