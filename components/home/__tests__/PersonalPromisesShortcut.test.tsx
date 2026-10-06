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
  return { ArrowRightIcon: Icon, ChevronRightIcon: Icon, TargetIcon: Icon };
});

describe('PersonalPromisesShortcut', () => {
  it('keeps the decorative icon out of the accessibility tree', () => {
    render(
      <PersonalPromisesShortcut
        activeCount={1}
        bestCurrentStreak={2}
        onPress={jest.fn()}
      />
    );

    expect(
      screen.getByTestId('today-personal-promises-icon').props.accessible
    ).toBe(false);
  });

  it('gives the unboxed personal artwork room without changing its accessible meaning', () => {
    render(
      <PersonalPromisesShortcut
        activeCount={1}
        bestCurrentStreak={2}
        onPress={jest.fn()}
      />
    );
    expect(screen.getByTestId('today-personal-promises-icon').props.width).toBe(
      44
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByLabelText(
        'Personal promises. 1 active promise · Longest active streak: 2 days'
      )
    ).toBeTruthy();
  });

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

    expect(screen.getByText('Personal promises')).not.toHaveStyle({
      maxWidth: '55%',
    });
    expect(screen.getByText('Personal promises')).toHaveStyle({
      fontSize: 31.2,
      lineHeight: 40.3,
    });
    expect(screen.getByText('2 active promises')).toHaveStyle({
      fontSize: 16.9,
      lineHeight: 23.4,
    });
  });

  it('gives the longest active streak a separate, pluralised value', () => {
    render(
      <PersonalPromisesShortcut
        activeCount={1}
        bestCurrentStreak={2}
        onPress={jest.fn()}
      />
    );
    expect(screen.getByText('2 days')).toHaveStyle({ fontSize: 24 });
    expect(screen.getByText('Longest active streak')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Personal promises. 1 active promise · Longest active streak: 2 days'
      )
    ).toBeTruthy();
  });

  it('uses singular days and hides an unconfirmed zero streak', () => {
    const { rerender } = render(
      <PersonalPromisesShortcut
        activeCount={1}
        bestCurrentStreak={1}
        onPress={jest.fn()}
      />
    );
    expect(screen.getByText('1 day')).toBeTruthy();
    rerender(
      <PersonalPromisesShortcut
        activeCount={1}
        bestCurrentStreak={0}
        onPress={jest.fn()}
      />
    );
    expect(screen.queryByText('Longest active streak')).toBeNull();
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

    expect(screen.getByText('2 active promises')).toBeTruthy();
  });

  it('retains the empty state without showing a stale streak', () => {
    render(
      <PersonalPromisesShortcut
        activeCount={0}
        bestCurrentStreak={12}
        onPress={jest.fn()}
      />
    );
    expect(screen.getByText('No active personal promises')).toBeTruthy();
    expect(screen.queryByText(/12 days/)).toBeNull();
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

    expect(screen.getByTestId('today-personal-promises')).toHaveStyle({
      backgroundColor: ember?.interactiveSecondary,
    });
    expect(screen.getByTestId('today-personal-promises-icon').props.color).toBe(
      ember?.interactivePrimary
    );
  });
});
