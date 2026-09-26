import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import {
  resolveTodayStreakTone,
  TodayStatusSection,
} from '@/components/today/TodayStatusSection';
import type { ServerObligationFact } from '@/lib/loop';
import { readTodayWeekActivity } from '@/lib/today-week-activity';
import { useMomentaStore } from '@/store/momenta-store';

jest.mock('@/lib/today-week-activity', () => ({
  ...jest.requireActual('@/lib/today-week-activity'),
  readTodayWeekActivity: jest.fn(),
}));

const obligation = (
  overrides: Partial<ServerObligationFact>
): ServerObligationFact => ({
  obligationKey: 'walk',
  challengeId: 'challenge-walk',
  title: 'Walk after work',
  localDay: '2026-09-24',
  timezone: 'Pacific/Auckland',
  proofStatus: 'none',
  isSolo: true,
  streakCount: 6,
  longestStreak: 9,
  ...overrides,
});

const renderSection = (
  props: Partial<React.ComponentProps<typeof TodayStatusSection>> = {}
) => {
  const onOpenPromiseHistory = jest.fn();
  const onOpenWallet = jest.fn();
  const utils = render(
    <TodayStatusSection
      localDay="2026-09-24"
      obligations={[
        obligation({}),
        obligation({
          obligationKey: 'read',
          challengeId: 'challenge-read',
          title: 'Read ten pages',
          proofStatus: 'approved',
          streakCount: 12,
          longestStreak: 12,
        }),
      ]}
      onOpenPromiseHistory={onOpenPromiseHistory}
      onOpenWallet={onOpenWallet}
      ready
      refreshToken="ready:2026-09-24T08:00:00.000Z"
      showWeek
      userId="user-1"
      {...props}
    />
  );
  return { ...utils, onOpenPromiseHistory, onOpenWallet };
};

describe('TodayStatusSection', () => {
  const fetchBalance = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readTodayWeekActivity).mockResolvedValue({
      submissions: [
        { localDay: '2026-09-22', status: 'approved' },
        { localDay: '2026-09-23', status: 'approved' },
      ],
      outcomes: [],
    });
    useMomentaStore.setState({
      activeAccountId: 'user-1',
      balance: 240,
      fetchBalance,
    });
  });

  it('never shows a balance that belongs to another signed-in account', async () => {
    useMomentaStore.setState({ activeAccountId: 'someone-else', balance: 900 });
    renderSection();
    await act(async () => {});

    expect(screen.queryByText('900')).toBeNull();
    expect(
      screen.getByLabelText(
        'Momenta balance not confirmed yet. Opens your wallet.'
      )
    ).toBeTruthy();
  });

  it('withholds the week instead of inventing empty days when history cannot be read', async () => {
    jest
      .mocked(readTodayWeekActivity)
      .mockRejectedValueOnce(new Error('offline'));
    renderSection();
    await act(async () => {});

    expect(screen.queryByTestId('today-week-row')).toBeNull();
    expect(
      screen.queryByTestId('today-week-row-loading', {
        includeHiddenElements: true,
      })
    ).toBeNull();
    expect(screen.getByTestId('today-streak-chip')).toBeTruthy();
  });
});

describe('resolveTodayStreakTone', () => {
  it('calls a streak kept only when every promise is approved, and at risk only when the server says so', () => {
    expect(
      resolveTodayStreakTone([
        obligation({ proofStatus: 'approved' }),
        obligation({ obligationKey: 'b', proofStatus: 'pending' }),
      ])
    ).toBe('waiting');
    expect(
      resolveTodayStreakTone([obligation({ proofStatus: 'approved' })])
    ).toBe('kept');
    expect(resolveTodayStreakTone([obligation({ atRisk: true })])).toBe('risk');
    expect(resolveTodayStreakTone([obligation({ atRisk: false })])).toBe('due');
  });
});
