import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileFollowThroughChart } from '@/components/profile/ProfileFollowThroughChart';

describe('ProfileFollowThroughChart', () => {
  it('exposes each day as a selectable value and keeps history reachable', () => {
    const onOpenHistory = jest.fn();
    render(
      <ProfileFollowThroughChart
        activePromiseCount={2}
        currentStreak={4}
        days={[
          {
            approvedProofs: 0,
            localDay: '2026-08-30',
            longLabel: 'Sunday, 30 Aug',
            outcome: 'missed',
            shortLabel: 'S',
          },
          {
            approvedProofs: 2,
            localDay: '2026-08-31',
            longLabel: 'Monday, 31 Aug',
            outcome: null,
            shortLabel: 'M',
          },
        ]}
        groupCount={1}
        onOpenHistory={onOpenHistory}
      />
    );

    const missedDay = screen.getByLabelText(
      'Sunday, 30 Aug. Approved proofs: 0. Missed day'
    );
    expect(missedDay).toHaveProp('accessibilityRole', 'button');
    fireEvent.press(missedDay);
    expect(
      screen.getByLabelText('Sunday, 30 Aug. Approved proofs: 0. Missed day')
    ).toHaveProp('accessibilityState', { selected: true });

    fireEvent.press(screen.getByLabelText('Proof history'));
    expect(onOpenHistory).toHaveBeenCalledTimes(1);
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });
});
