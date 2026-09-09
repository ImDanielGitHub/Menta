import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { DailyLoopPanel } from '../DailyLoopPanel';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';

const week = [
  { label: 'Mon', state: 'approved' as const },
  { label: 'Tue', state: 'missed' as const },
  { label: 'Wed', state: 'today' as const },
];

describe('DailyLoopPanel', () => {
  it('keeps streak evidence in the first journey surface instead of burying it in support', () => {
    render(
      <ThemeProvider>
        <DailyLoopPanel
          title="Proof due today"
          note="Submit one clear photo before the day closes."
          primaryLabel="Add proof"
          onPrimaryPress={jest.fn()}
          completedDays={4}
          totalDays={14}
          currentStreak={4}
          longestStreak={9}
          week={week}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('daily-loop-streak-value')).toHaveTextContent(
      '4'
    );
    expect(screen.getByText('day streak')).toBeTruthy();
    expect(screen.getByText('Best: 9 days')).toBeTruthy();
    expect(
      screen.getByLabelText(
        /Proof this week: Mon proof approved, Tue missed, streak stopped, Wed today, no proof yet/
      )
    ).toBeTruthy();
  });

  it('uses the equipped theme accent for the current day', () => {
    const ember = getThemeAppearance('profile_theme_ember');

    render(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <DailyLoopPanel
          title="Proof due today"
          note="Submit one clear photo before the day closes."
          primaryLabel="Add proof"
          completedDays={0}
          totalDays={30}
          week={week}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('promise-proof-day-2-marker')).toHaveStyle({
      borderColor: ember?.interactivePrimary,
    });
  });
});
