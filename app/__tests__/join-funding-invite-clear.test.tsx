import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import JoinFundingRoute from '@/app/join-funding';

const mockOpenJoin = jest.fn();
const mockFetchUserChallenges = jest.fn();
const mockClearPendingForUser = jest.fn();
const mockRouterReplace = jest.fn();
let mockActiveUserId = 'user-1';
let mockParams: { code?: string } = { code: 'PROMISE42' };

const mockReceipt = {
  source: 'server' as const,
  receiptId: 'receipt-1',
  clientEventId: 'event-1',
  quoteId: 'quote-1',
  challengeId: 'challenge-1',
  challengeTitle: 'Walk before work',
  groupId: null,
  groupName: null,
  joinedAt: '2026-08-13T00:00:00.000Z',
  debitAmount: 50,
  newBalance: 150,
  firstProofTitle: 'Share the first walk',
  firstDueAt: null,
  idempotent: false,
};

const mockJoinState = {
  accountId: 'user-1',
  targetKey: ':PROMISE42',
  target: { challengeId: null, inviteCode: 'PROMISE42' },
  phase: 'confirmed',
  receipt: mockReceipt,
  quote: null,
  retry: null,
  message: null,
  open: mockOpenJoin,
  confirm: jest.fn(),
  reconcile: jest.fn(),
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: mockRouterReplace,
  }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: mockActiveUserId } }),
}));

jest.mock('@/store/invite-store', () => ({
  useInviteStore: (selector: (state: unknown) => unknown) =>
    selector({
      pending: {
        type: 'challenge',
        code: 'PROMISE42',
        timestamp: 1,
        ownerUserId: 'user-1',
      },
      clearPendingForUser: mockClearPendingForUser,
    }),
}));

jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: (selector: (state: unknown) => unknown) =>
    selector({ fetchUserChallenges: mockFetchUserChallenges }),
}));

jest.mock('@/store/join-funding-store', () => ({
  useJoinFundingStore: (selector?: (state: unknown) => unknown) =>
    selector ? selector(mockJoinState) : mockJoinState,
}));

jest.mock('@/components/challenge/JoinFundingStates', () => {
  const { Text: MockText } =
    require('react-native') as typeof import('react-native');
  return {
    JoinConfirmedReceiptState: () => <MockText>Confirmed join</MockText>,
    JoinFundingFailureState: () => <MockText>Failed join</MockText>,
    JoinFundingLoadingState: () => <MockText>Loading join</MockText>,
    JoinFundingReviewState: () => <MockText>Review join</MockText>,
    JoinInsufficientMomentaState: () => (
      <MockText>Insufficient Momenta</MockText>
    ),
    JoinMembershipWithoutReceiptState: ({ onOpen }: { onOpen: () => void }) => {
      const { Pressable } =
        require('react-native') as typeof import('react-native');
      return (
        <Pressable accessibilityRole="button" onPress={onOpen}>
          <MockText>Existing member</MockText>
        </Pressable>
      );
    },
    JoinResultUnknownRuntimeState: () => <MockText>Unknown join</MockText>,
  };
});

describe('JoinFundingRoute invite ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveUserId = 'user-1';
    mockParams = { code: 'PROMISE42' };
    Object.assign(mockJoinState, {
      accountId: 'user-1',
      targetKey: ':PROMISE42',
      target: { challengeId: null, inviteCode: 'PROMISE42' },
      phase: 'confirmed',
      receipt: mockReceipt,
      quote: null,
      retry: null,
      message: null,
      terminalInviteFailure: false,
    });
  });

  it('clears the exact current-account invite after a confirmed join receipt', async () => {
    render(<JoinFundingRoute />);

    await waitFor(() =>
      expect(mockClearPendingForUser).toHaveBeenCalledWith(
        'user-1',
        'PROMISE42'
      )
    );
    expect(mockFetchUserChallenges).toHaveBeenCalledWith('user-1');
  });

  it('opens the account-bound pending invite without putting its code in route params', async () => {
    mockParams = {};

    render(<JoinFundingRoute />);

    await waitFor(() =>
      expect(mockOpenJoin).toHaveBeenCalledWith('user-1', {
        challengeId: null,
        inviteCode: 'PROMISE42',
      })
    );
  });

  it('does not consume the invite when the receipt belongs to another account', async () => {
    mockActiveUserId = 'user-2';
    mockParams = {};

    render(<JoinFundingRoute />);

    await waitFor(() => expect(mockOpenJoin).not.toHaveBeenCalled());
    expect(mockClearPendingForUser).not.toHaveBeenCalled();
    expect(mockFetchUserChallenges).not.toHaveBeenCalled();
  });

  it('clears an already-member invite and opens role-aware promise people', async () => {
    Object.assign(mockJoinState, {
      phase: 'member_without_receipt',
      receipt: null,
      quote: {
        challengeId: 'challenge-1',
        accountabilityRole: 'reviewer',
      },
      terminalInviteFailure: true,
    });

    const { getByText } = render(<JoinFundingRoute />);

    await waitFor(() =>
      expect(mockClearPendingForUser).toHaveBeenCalledWith(
        'user-1',
        'PROMISE42'
      )
    );
    expect(mockFetchUserChallenges).toHaveBeenCalledWith('user-1');

    fireEvent.press(getByText('Existing member'));
    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/promise-accountability',
      params: {
        challengeId: 'challenge-1',
        source: 'existing_invite',
      },
    });
  });

  it('clears a decoded terminal invite failure but preserves retryable failures', async () => {
    Object.assign(mockJoinState, {
      phase: 'failed',
      receipt: null,
      terminalInviteFailure: true,
    });
    const terminal = render(<JoinFundingRoute />);
    await waitFor(() =>
      expect(mockClearPendingForUser).toHaveBeenCalledWith(
        'user-1',
        'PROMISE42'
      )
    );
    terminal.unmount();

    jest.clearAllMocks();
    Object.assign(mockJoinState, {
      phase: 'failed',
      terminalInviteFailure: false,
      retry: 'quote',
    });
    render(<JoinFundingRoute />);
    await waitFor(() => expect(mockOpenJoin).toHaveBeenCalled());
    expect(mockClearPendingForUser).not.toHaveBeenCalled();
  });
});
