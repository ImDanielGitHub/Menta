import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

type GestureCallbacks = {
  begin?: () => void;
  start?: () => void;
  finalize?: (event: unknown, success: boolean) => void;
};

const mockGestureCallbacks: GestureCallbacks = {};
const mockGestureConfig = {
  enabled: true,
  maxDistance: 0,
  minDuration: 0,
};
const mockEmitHaptic = jest.fn();
const mockMotionPreferences = {
  reduceMotion: false,
  screenReaderEnabled: false,
  duration: (duration: number) => duration,
};

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: { View },
    cancelAnimation: jest.fn(),
    Easing: {
      cubic: () => undefined,
      linear: () => undefined,
      out: (easing: unknown) => easing,
    },
    runOnJS: (callback: () => void) => callback,
    useAnimatedReaction: jest.fn(),
    useAnimatedStyle: (createStyle: () => unknown) => createStyle(),
    useSharedValue: (value: number) => ({ value }),
    withTiming: (value: number) => value,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  const createLongPress = () => {
    const gesture = {
      enabled: (value: boolean) => {
        mockGestureConfig.enabled = value;
        return gesture;
      },
      maxDistance: (value: number) => {
        mockGestureConfig.maxDistance = value;
        return gesture;
      },
      minDuration: (value: number) => {
        mockGestureConfig.minDuration = value;
        return gesture;
      },
      onBegin: (callback: () => void) => {
        mockGestureCallbacks.begin = callback;
        return gesture;
      },
      onFinalize: (callback: (event: unknown, success: boolean) => void) => {
        mockGestureCallbacks.finalize = callback;
        return gesture;
      },
      onStart: (callback: () => void) => {
        mockGestureCallbacks.start = callback;
        return gesture;
      },
    };

    return gesture;
  };

  return {
    Gesture: { LongPress: createLongPress },
    GestureDetector: ({ children }: { children: React.ReactNode }) => (
      <View testID="gesture-detector">{children}</View>
    ),
  };
});

jest.mock('@/constants/ThemeContext', () => {
  const theme = {
    colors: {
      background: { tertiary: '#181919' },
      brand: { purple: '#B88CFF' },
      text: { inverse: '#080909', primary: '#F8F7F1', secondary: '#B7B6AF' },
    },
    spacing: { sm: 8, md: 12 },
    typography: {
      sizes: { base: 14, lg: 16, sm: 12 },
      weights: { medium: '500', semibold: '600' },
    },
  };

  return {
    useTheme: () => theme,
    useThemedStyles: (createStyles: (value: typeof theme) => unknown) =>
      createStyles(theme),
  };
});

jest.mock('@/components/ui/icons', () => ({
  SendIcon: () => null,
}));

jest.mock('@/lib/motion/haptics', () => ({
  emitHaptic: (...args: unknown[]) => mockEmitHaptic(...args),
}));

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => mockMotionPreferences,
}));

import {
  HOLD_TO_SEND_DURATION_MS,
  HoldToSendButton,
} from '../HoldToSendButton';

describe('HoldToSendButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-03T00:00:00.000Z'));
    mockGestureCallbacks.begin = undefined;
    mockGestureCallbacks.start = undefined;
    mockGestureCallbacks.finalize = undefined;
    mockGestureConfig.enabled = true;
    mockGestureConfig.maxDistance = 0;
    mockGestureConfig.minDuration = 0;
    mockMotionPreferences.reduceMotion = false;
    mockMotionPreferences.screenReaderEnabled = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses an immediate tap alternative when reduced motion or a screen reader is active', () => {
    mockMotionPreferences.reduceMotion = true;
    const reducedMotionComplete = jest.fn();
    const reducedMotionView = render(
      <HoldToSendButton
        onComplete={reducedMotionComplete}
        testID="send-proof"
      />
    );

    expect(reducedMotionView.getByText('Send proof')).toBeTruthy();
    fireEvent.press(reducedMotionView.getByTestId('send-proof'));

    expect(reducedMotionComplete).toHaveBeenCalledTimes(1);
    expect(mockEmitHaptic).toHaveBeenCalledWith({ type: 'hold-complete' });
    expect(mockEmitHaptic).not.toHaveBeenCalledWith({ type: 'success' });

    reducedMotionView.unmount();
    jest.clearAllMocks();
    mockMotionPreferences.reduceMotion = false;
    mockMotionPreferences.screenReaderEnabled = true;
    const screenReaderComplete = jest.fn();
    const screenReaderView = render(
      <HoldToSendButton onComplete={screenReaderComplete} testID="send-proof" />
    );

    expect(screenReaderView.getByText('Send proof')).toBeTruthy();
    fireEvent.press(screenReaderView.getByTestId('send-proof'));

    expect(screenReaderComplete).toHaveBeenCalledTimes(1);
    expect(mockEmitHaptic).toHaveBeenCalledWith({ type: 'hold-complete' });
    expect(mockEmitHaptic).not.toHaveBeenCalledWith({ type: 'success' });
  });

  it('shows live hold progress and cancels without sending when the gesture is released early', () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(jest.fn());
    const onComplete = jest.fn();
    const { getByTestId, getByText } = render(
      <HoldToSendButton onComplete={onComplete} testID="send-proof" />
    );

    expect(mockGestureConfig.minDuration).toBe(HOLD_TO_SEND_DURATION_MS);
    expect(mockGestureConfig.maxDistance).toBe(28);

    act(() => mockGestureCallbacks.begin?.());
    act(() => jest.advanceTimersByTime(900));

    expect(getByText('Keep holding…')).toBeTruthy();
    expect(
      getByTestId('send-proof').props.accessibilityValue.now
    ).toBeGreaterThan(60);

    act(() => mockGestureCallbacks.finalize?.({}, false));

    expect(getByText('Hold to send')).toBeTruthy();
    expect(getByTestId('send-proof').props.accessibilityValue.now).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
    expect(mockEmitHaptic).toHaveBeenCalledWith({ type: 'hold-start' });
    expect(mockEmitHaptic).toHaveBeenCalledWith({ type: 'hold-tick' });
    expect(mockEmitHaptic).not.toHaveBeenCalledWith({ type: 'success' });
    announceSpy.mockRestore();
  });

  it('only completes after the recognised long-press gesture and never emits receipt success itself', () => {
    const onComplete = jest.fn();
    render(<HoldToSendButton onComplete={onComplete} testID="send-proof" />);

    act(() => mockGestureCallbacks.begin?.());
    act(() => mockGestureCallbacks.start?.());

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(mockEmitHaptic).toHaveBeenCalledWith({ type: 'hold-start' });
    expect(mockEmitHaptic).toHaveBeenCalledWith({ type: 'hold-complete' });
    expect(mockEmitHaptic).not.toHaveBeenCalledWith({ type: 'success' });
  });
});
