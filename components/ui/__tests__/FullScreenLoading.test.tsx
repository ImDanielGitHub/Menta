import React from 'react';
import { AccessibilityInfo, Animated, AppState } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { FullScreenLoading } from '../FullScreenLoading';
import { MentaPaletteContext } from '@/constants/use-menta-palette';
import { mentaColors, mentaLightColors } from '@/constants/MentaDesignSystem';
import { resolveStartupReduceMotion } from '@/lib/startup-splash';

jest.mock('@/lib/startup-splash', () => ({
  resolveStartupReduceMotion: jest.fn(() => new Promise(() => {})),
}));

describe('FullScreenLoading', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([mentaColors, mentaLightColors])(
    'uses the active canvas and readable text while announcing one busy region',
    palette => {
      const { getByTestId, getAllByRole } = render(
        <MentaPaletteContext.Provider value={palette}>
          <FullScreenLoading message="Loading your account" />
        </MentaPaletteContext.Provider>
      );
      expect(getByTestId('loading-container')).toHaveStyle({
        flex: 1,
        backgroundColor: palette.canvas,
      });
      expect(getByTestId('loading-status')).toHaveStyle({
        color: palette.text.primary,
      });
      expect(getByTestId('loading-tip')).toHaveStyle({
        color: palette.text.secondary,
      });
      const regions = getAllByRole('progressbar');
      expect(regions).toHaveLength(1);
      expect(regions[0].props.accessibilityLabel).toBe('Loading your account');
      expect(regions[0].props.accessibilityState).toEqual({ busy: true });
      expect(getByTestId('loading-mark-shell')).toHaveStyle({
        aspectRatio: 1,
        maxWidth: 200,
        width: '100%',
      });
    }
  );

  it('stays still until motion is allowed and stops for reduced motion, background and unmount', async () => {
    let resolvePreference!: (value: boolean) => void;
    jest.mocked(resolveStartupReduceMotion).mockReturnValueOnce(
      new Promise(resolve => {
        resolvePreference = resolve;
      })
    );
    const start = jest.fn();
    const stop = jest.fn();
    const loop = jest.spyOn(Animated, 'loop').mockReturnValue({
      start,
      stop,
      reset: jest.fn(),
    });
    let onMotion!: (value: boolean) => void;
    let onAppState!: (value: 'active' | 'background') => void;
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation((event, listener) => {
        if (event === 'reduceMotionChanged') onMotion = listener;
        return { remove: jest.fn() };
      });
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        onAppState = listener;
        return { remove: jest.fn() };
      });
    const { unmount, getByTestId } = render(<FullScreenLoading />);
    act(() => onAppState('active'));
    expect(loop).not.toHaveBeenCalled();
    await act(async () => resolvePreference(false));
    expect(start).toHaveBeenCalledTimes(1);
    act(() => onMotion(true));
    expect(stop).toHaveBeenCalledTimes(1);
    expect(getByTestId('loading-mark-shell')).toHaveStyle({
      transform: [{ translateY: 0 }],
    });
    act(() => onMotion(false));
    expect(start).toHaveBeenCalledTimes(2);
    act(() => onAppState('background'));
    expect(stop).toHaveBeenCalledTimes(2);
    act(() => onAppState('active'));
    expect(start).toHaveBeenCalledTimes(3);
    unmount();
    expect(stop).toHaveBeenCalledTimes(3);
  });

  it('does not let a stale lookup override a new reduced-motion preference', async () => {
    let resolvePreference!: (value: boolean) => void;
    jest.mocked(resolveStartupReduceMotion).mockReturnValueOnce(
      new Promise(resolve => {
        resolvePreference = resolve;
      })
    );
    let onMotion!: (value: boolean) => void;
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation((_event, listener) => {
        onMotion = listener;
        return { remove: jest.fn() };
      });
    const loop = jest.spyOn(Animated, 'loop');
    render(<FullScreenLoading />);
    act(() => onMotion(true));
    await act(async () => resolvePreference(false));
    expect(loop).not.toHaveBeenCalled();
  });
});
