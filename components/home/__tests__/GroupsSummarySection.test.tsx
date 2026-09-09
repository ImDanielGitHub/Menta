import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { GroupsSummarySection } from '@/components/home/GroupsSummarySection';
import type { GroupWithRisk } from '@/utils/group-risk-calculator';

const groups: GroupWithRisk[] = [
  {
    id: 'group-1',
    name: 'Morning crew',
    current_streak: 3,
    status: 'active',
    failure_threshold_days: 3,
    min_participation_rate: 0.8,
    allow_recovery: true,
    member_count: 7,
    riskLevel: {
      level: 'safe',
      daysUntilFailure: 3,
      currentParticipationRate: 1,
      requiredParticipationRate: 0.8,
      missedDaysCount: 0,
    },
  },
  {
    id: 'group-2',
    name: 'Evening gym',
    current_streak: 1,
    status: 'active',
    failure_threshold_days: 3,
    min_participation_rate: 0.8,
    allow_recovery: true,
    member_count: 2,
    riskLevel: {
      level: 'critical',
      daysUntilFailure: 1,
      currentParticipationRate: 0.4,
      requiredParticipationRate: 0.8,
      missedDaysCount: 2,
    },
  },
];

const renderSection = (
  props?: Partial<React.ComponentProps<typeof GroupsSummarySection>>
) => {
  const handlers = {
    onViewAll: jest.fn(),
    onOpenGroup: jest.fn(),
  };

  return {
    ...handlers,
    ...render(
      <ThemeProvider>
        <GroupsSummarySection groups={groups} {...handlers} {...props} />
      </ThemeProvider>
    ),
  };
};

describe('GroupsSummarySection', () => {
  it('keeps group summary rows and route actions visible', () => {
    const { onViewAll, onOpenGroup } = renderSection();

    expect(screen.getByText('Groups')).toBeTruthy();
    expect(screen.getByText('Morning crew')).toBeTruthy();
    expect(
      screen.getByText('7 members - 3 days streak · On track')
    ).toBeTruthy();
    expect(screen.getByText('Evening gym')).toBeTruthy();
    expect(
      screen.getByText('2 members - 1 day streak · Critical')
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Morning crew'));
    fireEvent.press(screen.getByText('View all'));

    expect(onOpenGroup).toHaveBeenCalledWith('group-1');
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when there are no groups', () => {
    renderSection({ groups: [] });

    expect(screen.queryByText('Groups')).toBeNull();
  });
});
