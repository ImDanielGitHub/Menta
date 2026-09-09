import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextScaleProvider } from '@/components/ui/AppScaledText';
import { emitHaptic } from '@/lib/motion/haptics';

jest.mock('@/lib/motion/haptics', () => ({
  emitHaptic: jest.fn(() => Promise.resolve(true)),
}));

describe('AppButton', () => {
  beforeEach(() => {
    jest.mocked(emitHaptic).mockClear();
  });

  it('exposes one named button and hides its visual label subtree', () => {
    const onPress = jest.fn();

    render(
      <AppButton
        title="Choose notification access"
        onPress={onPress}
        testID="notification-access"
      />
    );

    const button = screen.getByTestId('notification-access');
    expect(button).toHaveProp('accessible', true);
    expect(button).toHaveProp('accessibilityRole', 'button');
    expect(button).toHaveProp('role', 'button');
    expect(button).toHaveProp(
      'accessibilityLabel',
      'Choose notification access'
    );
    expect(screen.getByText('Choose notification access')).toHaveProp(
      'accessible',
      false
    );

    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(emitHaptic).not.toHaveBeenCalled();
  });

  it('inherits a measurable viewport text envelope', () => {
    render(
      <AppTextScaleProvider scale={1.3}>
        <AppButton title="Continue" onPress={jest.fn()} />
      </AppTextScaleProvider>
    );

    expect(screen.getByText('Continue')).toHaveProp('allowFontScaling', false);
    expect(screen.getByText('Continue')).toHaveStyle({
      fontSize: 22.1,
      lineHeight: 31.2,
    });
  });

  it('emits the requested haptic only when a button opts in', () => {
    const onPress = jest.fn();

    render(
      <AppButton
        title="Replace invite code"
        onPress={onPress}
        haptic
        hapticIntent="warning"
        testID="replace-invite-haptic"
      />
    );

    fireEvent.press(screen.getByTestId('replace-invite-haptic'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(emitHaptic).toHaveBeenCalledWith({ type: 'warning' });
  });

  it('reserves symmetric icon lanes while a stable action is loading', () => {
    render(
      <AppButton
        title="Replacing…"
        onPress={jest.fn()}
        loading
        preserveLabelPositionOnLoading
        leftIcon={<View testID="idle-leading-placeholder" />}
        rightIcon={<View testID="idle-trailing-placeholder" />}
        testID="replace-invite"
      />
    );

    expect(
      screen.getByTestId('replace-invite-loading-leading-slot')
    ).toBeTruthy();
    expect(
      screen.getByTestId('replace-invite-loading-trailing-slot')
    ).toBeTruthy();
    expect(screen.getByText('Replacing…')).toBeTruthy();
    expect(screen.getByTestId('replace-invite')).toHaveProp(
      'accessibilityState',
      { disabled: true, busy: true }
    );
  });
});
