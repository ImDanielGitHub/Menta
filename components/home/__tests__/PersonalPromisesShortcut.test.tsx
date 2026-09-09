import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PersonalPromisesShortcut } from '../PersonalPromisesShortcut';
import { AppTextScaleProvider } from '@/components/ui/AppScaledText';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';

jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props: Record<string, unknown>) =>
    React.createElement(View, props);
  return { ChevronRightIcon: Icon, TargetIcon: Icon };
});

describe('PersonalPromisesShortcut', () => {
  it('uses the surrounding Today text envelope', () => {
    render(
      <AppTextScaleProvider scale={1.3}>
        <PersonalPromisesShortcut
          activeCount={2}
          bestCurrentStreak={7}
          onPress={jest.fn()}
        />
      </AppTextScaleProvider>
    );

    expect(screen.getByText('Personal promises')).toHaveStyle({
      fontSize: 20.8,
      lineHeight: 29.9,
    });
    expect(
      screen.getByText('2 active promises · Longest active streak: 7 days')
    ).toHaveStyle({ fontSize: 16.9, lineHeight: 23.4 });
  });

  it('keeps the route available before Today has loaded', () => {
    const onPress = jest.fn();
    render(
      <PersonalPromisesShortcut
        activeCount={null}
        bestCurrentStreak={null}
        onPress={onPress}
      />
    );

    expect(screen.getByText('View your personal promises')).toBeTruthy();
    fireEvent.press(screen.getByTestId('today-personal-promises'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows only the supplied server-confirmed count and current streak', () => {
    render(
      <PersonalPromisesShortcut
        activeCount={2}
        bestCurrentStreak={7}
        onPress={jest.fn()}
      />
    );

    expect(
      screen.getByText('2 active promises · Longest active streak: 7 days')
    ).toBeTruthy();
  });

  it('does not invent a streak when the server has not confirmed one', () => {
    render(
      <PersonalPromisesShortcut
        activeCount={1}
        bestCurrentStreak={null}
        onPress={jest.fn()}
      />
    );

    expect(screen.getByText('1 active promise')).toBeTruthy();
  });

  it('uses the equipped theme colour for the personal promise icon', () => {
    const ember = getThemeAppearance('profile_theme_ember');

    render(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <PersonalPromisesShortcut
          activeCount={1}
          bestCurrentStreak={2}
          onPress={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('today-personal-promises-icon').props.color).toBe(
      ember?.interactivePrimary
    );
  });
});
