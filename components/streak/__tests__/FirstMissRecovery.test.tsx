import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { FirstMissRecovery } from '../FirstMissRecovery';

const mockReadOffer = jest.fn();
const mockClaim = jest.fn();

jest.mock('@/lib/streak/first-miss-recovery', () => {
  const actual = jest.requireActual('@/lib/streak/first-miss-recovery');
  return {
    ...actual,
    readFirstMissRecovery: (...args: unknown[]) => mockReadOffer(...args),
    claimFirstMissRecovery: (...args: unknown[]) => mockClaim(...args),
  };
});

jest.mock('@/store/auth-store', () => {
  const state = { user: { id: 'owner-1' } };
  return {
    useAuthStore: (selector: (value: typeof state) => unknown) =>
      selector(state),
  };
});

jest.mock('@/lib/navigation/onboarding-invitation-lifecycle', () => ({
  getOnboardingInvitationReviewGate: () => 'legacy',
}));

jest.mock('@/lib/posthog', () => ({ trackProductEvent: jest.fn() }));

jest.mock('expo-router', () => {
  const { useEffect } = require('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(() => callback(), [callback]);
    },
  };
});

const offer = {
  outcomeId: 'outcome-1',
  challengeId: 'challenge-1',
  challengeTitle: 'Walk after work',
  // 2026-09-23 is a Wednesday.
  localDay: '2026-09-23',
  previousStreak: 12,
  expiresAt: '2999-01-01T00:00:00.000Z',
};

describe('FirstMissRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadOffer.mockResolvedValue(offer);
  });

  it('asks one question with two honest choices when a free repair exists', async () => {
    const onVisibilityChange = jest.fn();
    render(
      <FirstMissRecovery
        ready
        onRecovered={jest.fn().mockResolvedValue(undefined)}
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(await screen.findByText('Keep your 12-day streak?')).toBeTruthy();
    expect(
      screen.getByText('Wednesday slipped by. It happens to everyone.')
    ).toBeTruthy();
    expect(screen.getByText('Keep my streak for free')).toBeTruthy();
    expect(screen.getByText('Start over at day 1')).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });

  it('lets people start over without losing the gift while it is valid', async () => {
    const onVisibilityChange = jest.fn();
    render(
      <FirstMissRecovery
        ready
        onRecovered={jest.fn().mockResolvedValue(undefined)}
        onVisibilityChange={onVisibilityChange}
      />
    );

    fireEvent.press(await screen.findByText('Start over at day 1'));

    expect(screen.queryByText('Keep your 12-day streak?')).toBeNull();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
    fireEvent.press(screen.getByText('Get your free streak freeze'));
    expect(screen.getByText('Keep your 12-day streak?')).toBeTruthy();
  });

  it('confirms the covered day after a successful claim', async () => {
    mockClaim.mockResolvedValue(12);
    const onRecovered = jest.fn().mockResolvedValue(undefined);
    render(
      <FirstMissRecovery
        ready
        onRecovered={onRecovered}
        onVisibilityChange={jest.fn()}
      />
    );

    fireEvent.press(await screen.findByText('Keep my streak for free'));

    await waitFor(() =>
      expect(screen.getByText('Your missed day is covered.')).toBeTruthy()
    );
    expect(mockClaim).toHaveBeenCalledWith(offer);
    expect(onRecovered).toHaveBeenCalled();
  });
});
