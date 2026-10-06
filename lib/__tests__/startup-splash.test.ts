import { AccessibilityInfo } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  hideNativeStartupSplash,
  resolveStartupReduceMotion,
  STARTUP_PREFERENCE_TIMEOUT_MS,
} from '../startup-splash';

jest.mock('expo-splash-screen', () => ({
  setOptions: jest.fn(),
  hide: jest.fn(),
}));

describe('bounded startup motion preference', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it.each([false, true])('respects resolved Reduce Motion=%s', async value => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(value);
    await expect(resolveStartupReduceMotion()).resolves.toBe(value);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('uses no motion if the native lookup rejects', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockRejectedValue(new Error('unavailable'));
    await expect(resolveStartupReduceMotion()).resolves.toBe(true);
  });

  it('escapes a native preference promise that never settles', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockReturnValue(new Promise(() => {}));
    const preference = resolveStartupReduceMotion();
    jest.advanceTimersByTime(STARTUP_PREFERENCE_TIMEOUT_MS);
    await expect(preference).resolves.toBe(true);
    hideNativeStartupSplash();
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  it('still requests native hiding when options throw', () => {
    jest.mocked(SplashScreen.setOptions).mockImplementationOnce(() => {
      throw new Error('bridge');
    });
    expect(hideNativeStartupSplash).toThrow('bridge');
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });
});
