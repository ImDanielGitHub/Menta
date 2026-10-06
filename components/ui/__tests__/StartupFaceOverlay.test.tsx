import React from 'react';
import { Animated, AppState } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StartupFaceOverlay } from '../StartupFaceOverlay';
import {
  hideNativeStartupSplash,
  resolveStartupReduceMotion,
} from '@/lib/startup-splash';

jest.mock('@/lib/startup-splash', () => ({
  hideNativeStartupSplash: jest.fn(),
  resolveStartupReduceMotion: jest.fn(),
}));

it('keeps the native splash size through handoff and never replays on remount', async () => {
  jest.useFakeTimers();
  const originalState = AppState.currentState;
  AppState.currentState = 'active';
  jest.mocked(resolveStartupReduceMotion).mockResolvedValue(false);
  let finish!: () => void;
  const timing = jest.spyOn(Animated, 'timing').mockReturnValue({
    start: callback => {
      finish = () => callback?.({ finished: true });
    },
    stop: jest.fn(),
    reset: jest.fn(),
  });
  try {
    const screen = render(<StartupFaceOverlay />);
    expect(
      screen.getByTestId('startup-face-frame', { includeHiddenElements: true })
    ).toHaveStyle({
      transform: [{ scale: 0.86 }],
    });
    fireEvent(
      screen.getByTestId('startup-face-overlay', {
        includeHiddenElements: true,
      }),
      'layout',
      {
        nativeEvent: { layout: { width: 393, height: 852, x: 0, y: 0 } },
      }
    );
    fireEvent(
      screen.getByTestId('startup-face-image', { includeHiddenElements: true }),
      'load'
    );
    await act(async () => {});
    expect(hideNativeStartupSplash).toHaveBeenCalledTimes(1);
    // The only animated property is the overlay opacity; native geometry stays fixed.
    expect(timing).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0 })
    );
    expect(
      screen.getByTestId('startup-face-frame', { includeHiddenElements: true })
    ).toHaveStyle({
      transform: [{ scale: 0.86 }],
    });
    act(() => finish());
    expect(
      screen.queryByTestId('startup-face-overlay', {
        includeHiddenElements: true,
      })
    ).toBeNull();
    screen.unmount();
    const remount = render(<StartupFaceOverlay />);
    expect(
      remount.queryByTestId('startup-face-overlay', {
        includeHiddenElements: true,
      })
    ).toBeNull();
    expect(timing).toHaveBeenCalledTimes(1);
    remount.unmount();
    act(() => jest.advanceTimersByTime(1000));
    expect(hideNativeStartupSplash).toHaveBeenCalledTimes(1);
  } finally {
    AppState.currentState = originalState;
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  }
});
