import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import {
  JoinConfirmedReceiptState,
  JoinFundingFailureState,
  JoinFundingLoadingState,
  JoinFundingReviewState,
  JoinInsufficientMomentaState,
  JoinMembershipWithoutReceiptState,
  JoinResultUnknownRuntimeState,
} from '@/components/challenge/JoinFundingStates';
import { ThemeProvider } from '@/constants/ThemeContext';
import type {
  ChallengeJoinQuote,
  ChallengeJoinReceipt,
} from '@/lib/challenges/join-funding-contract';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }),
  };
});

const quote: ChallengeJoinQuote = {
  source: 'server',
  quoteId: '10000000-0000-5000-8000-000000000001',
  challengeId: '10000000-0000-4000-8000-000000000002',
  challengeTitle: 'After-work walkers',
  challengeDescription: 'Walk together after work.',
  groupId: '10000000-0000-4000-8000-000000000003',
  groupName: 'After-work walkers',
  cost: 2,
  availableBalance: 12,
  shortfall: 0,
  eligible: true,
  eligibilityCode: 'ELIGIBLE',
};

const receipt: ChallengeJoinReceipt = {
  source: 'server',
  receiptId: '10000000-0000-4000-8000-000000000004',
  clientEventId: '10000000-0000-4000-8000-000000000005',
  quoteId: quote.quoteId,
  challengeId: quote.challengeId,
  challengeTitle: quote.challengeTitle,
  groupId: quote.groupId,
  groupName: quote.groupName,
  joinedAt: '2026-08-06T08:00:00.000Z',
  debitAmount: 2,
  newBalance: 10,
  firstProofTitle: 'Walk after work',
  firstDueAt: '2026-08-07T08:30:00.000Z',
  idempotent: false,
};

const renderState = (node: React.ReactElement) =>
  render(<ThemeProvider>{node}</ThemeProvider>);

describe('join funding runtime states', () => {
  afterEach(cleanup);

  it('names the promise while checking the real join details', () => {
    renderState(<JoinFundingLoadingState onBack={jest.fn()} />);

    expect(screen.getByText('Join promise')).toBeTruthy();
    expect(
      screen.getByText(
        'We’re checking this promise and your current Momenta balance.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Checking details')).toBeTruthy();
  });

  it('renders JOIN-00 from the authoritative quote and exposes one join action', () => {
    const onJoin = jest.fn();
    renderState(
      <JoinFundingReviewState
        quote={quote}
        joining={false}
        onJoin={onJoin}
        onMaybeLater={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText('Join After-work walkers?')).toBeTruthy();
    expect(screen.getByText('2 Momenta')).toBeTruthy();
    expect(screen.getByText('12 Momenta')).toBeTruthy();
    expect(
      screen.getByText(
        'Review the cost and your balance. Nothing changes until you join.'
      )
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('join-funding-confirm'));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('renders JOIN-01 as an uncharged recovery state', () => {
    renderState(
      <JoinInsufficientMomentaState
        quote={{
          ...quote,
          availableBalance: 0,
          shortfall: 2,
          eligible: false,
          eligibilityCode: 'INSUFFICIENT_BALANCE',
        }}
        onEarn={jest.fn()}
        onKeepCreating={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText('You need 2 more Momenta')).toBeTruthy();
    expect(
      screen.getByText('You haven’t been charged, and you haven’t joined yet.')
    ).toBeTruthy();
    expect(screen.getByText('Back to Today')).toBeTruthy();
    expect(screen.queryByText(/join confirmed/i)).toBeNull();
  });

  it('renders JOIN-02 only from a server receipt', () => {
    renderState(
      <JoinConfirmedReceiptState
        receipt={receipt}
        firstDueLabel="Fri · 8:30 am"
        onOpen={jest.fn()}
        onBackToToday={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText('Join receipt')).toBeTruthy();
    expect(screen.getByText('You’re in After-work walkers.')).toBeTruthy();
    expect(screen.getByText('−2')).toBeTruthy();
    expect(screen.getByText('New balance · 10')).toBeTruthy();
    expect(screen.getByText('Fri · 8:30 am')).toBeTruthy();
    expect(
      screen.getByText(
        'Your Momenta balance is updated. Your first proof is ready in this group.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Open group')).toBeTruthy();
  });

  it('uses promise copy when the confirmed destination is a promise', () => {
    renderState(
      <JoinConfirmedReceiptState
        receipt={{ ...receipt, groupId: null, groupName: null }}
        firstDueLabel="Fri · 8:30 am"
        onOpen={jest.fn()}
        onBackToToday={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(
      screen.getByText(
        'Your Momenta balance is updated. Your first proof is ready in this promise.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Open promise')).toBeTruthy();
  });

  it('renders JOIN-03 with status readback and no second join action', () => {
    const onCheck = jest.fn();
    renderState(
      <JoinResultUnknownRuntimeState
        checking={false}
        message="Connection ended before a receipt was read."
        onCheck={onCheck}
        onBackToSafety={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText('A second join is paused')).toBeTruthy();
    expect(
      screen.getByText('We need to check whether you joined')
    ).toBeTruthy();
    expect(screen.queryByText(/join again/i)).toBeNull();
    fireEvent.press(screen.getByTestId('join-funding-reconcile'));
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it('renders a safe adjacent failure without claiming a state change', () => {
    renderState(
      <JoinFundingFailureState
        message="The server did not return a verified join result."
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText('No confirmed change')).toBeTruthy();
    expect(
      screen.getByText('No membership or Momenta charge is confirmed.')
    ).toBeTruthy();
  });

  it('opens an existing membership as a promise', () => {
    const onOpen = jest.fn();
    renderState(
      <JoinMembershipWithoutReceiptState
        message="Your existing membership was found."
        onOpen={onOpen}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText('You’re already in this promise.')).toBeTruthy();
    fireEvent.press(screen.getByText('Open promise'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
