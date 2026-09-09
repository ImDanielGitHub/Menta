import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppOptionCard } from '@/components/ui/AppChoice';
import { ThemeProvider } from '@/constants/ThemeContext';

describe('AppOptionCard', () => {
  it('exposes its choice label and selected state', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <ThemeProvider>
        <AppOptionCard
          title="Photo proof"
          description="Show the finished work."
          selected
          onPress={onPress}
        />
      </ThemeProvider>
    );

    const option = getByRole('radio', {
      name: 'Photo proof. Show the finished work.',
    });

    expect(option.props.accessibilityState).toMatchObject({
      checked: true,
      selected: true,
    });
    const optionStyle = StyleSheet.flatten(option.props.style);
    const titleStyle = StyleSheet.flatten(
      screen.getByText('Photo proof').props.style
    );
    expect(optionStyle.minHeight).toBeGreaterThanOrEqual(92);
    expect(titleStyle.fontSize).toBeGreaterThanOrEqual(17);

    fireEvent.press(option);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks interaction and reports disabled state while a choice is saving', () => {
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <AppOptionCard
          title="Video proof"
          description="Show the finished action."
          disabled
          testID="video-proof-option"
          onPress={onPress}
        />
      </ThemeProvider>
    );

    const option = screen.getByTestId('video-proof-option');
    expect(option.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(option);
    expect(onPress).not.toHaveBeenCalled();
  });
});
