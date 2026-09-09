import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { BrokenStreakRecoveryCard } from '../BrokenStreakRecoveryCard';
import { StreakStatusCard } from '../StreakStatusCard';
import type { StreakStateV2 } from '@/types/streak-state-v2';

const baseState: StreakStateV2 = {
  challengeId: 'promise-1',
  userId: 'user-1',
  currentStreak: 4,
  longestStreak: 9,
  freezeCount: 1,
  atRisk: false,
  hasSubmittedToday: true,
  submissionStatus: 'approved',
  dayStatus: 'done',
  accountabilityAvailable: true,
  latestOutcome: null,
  recentOutcomes: [],
  daysSinceAcceptedCheckIn: 0,
  effectiveLocalDay: '2026-08-12',
  effectiveTimezone: 'Pacific/Auckland',
  preferredReminderTime: '20:00',
  remindersEnabled: true,
};

describe('streak journey surfaces', () => {
  it('makes the current streak, record and next target legible without ornamental labels', () => {
    render(<StreakStatusCard state={baseState} goalDays={30} />);

    expect(screen.getByText('Current streak')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Current streak 4 days. Longest 9 days. Next target 7 days. Proof approved today.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Longest')).toBeTruthy();
    expect(screen.getByText('Next target')).toBeTruthy();
    expect(screen.getByText('Proof approved today')).toBeTruthy();
    expect(screen.queryByText('Streak status')).toBeNull();
  });

  it('never points beyond the promise goal and stops inventing a next target', () => {
    const { rerender } = render(
      <StreakStatusCard state={baseState} goalDays={5} />
    );

    expect(screen.getByText('Promise goal')).toBeTruthy();
    expect(screen.getByText('5 days')).toBeTruthy();
    expect(screen.getByTestId('streak-progress')).toHaveProp(
      'accessibilityValue',
      {
        min: 0,
        max: 5,
        now: 4,
      }
    );

    rerender(
      <StreakStatusCard
        state={{ ...baseState, currentStreak: 5 }}
        goalDays={5}
      />
    );
    expect(screen.getByText('5 days · reached')).toBeTruthy();
    expect(screen.queryByText('Next target')).toBeNull();
    expect(screen.queryByTestId('streak-progress')).toBeNull();
  });

  it('uses the exact ended run and routes return and history separately', () => {
    const onStartReturn = jest.fn();
    const onViewHistory = jest.fn();

    render(
      <BrokenStreakRecoveryCard
        missedLocalDay="2026-08-11"
        previousStreak={4}
        resultingStreak={0}
        onStartReturn={onStartReturn}
        onViewHistory={onViewHistory}
      />
    );

    expect(screen.getByText('Tuesday was missed.')).toBeTruthy();
    expect(
      screen.getByText(
        /No proof counted for Tuesday.*previous run ended at 4 days/
      )
    ).toBeTruthy();
    expect(screen.getByText('Ready for a new check-in')).toBeTruthy();
    expect(screen.queryByText(/10 focused minutes/i)).toBeNull();
    expect(screen.queryByText(/recovery quest/i)).toBeNull();
    expect(screen.queryByText(/leave yesterday missed/i)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Start again today' }));
    fireEvent.press(screen.getByRole('button', { name: 'View 4-day history' }));

    expect(onStartReturn).toHaveBeenCalledTimes(1);
    expect(onViewHistory).toHaveBeenCalledTimes(1);
  });
});
