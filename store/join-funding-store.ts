import { create } from 'zustand';
import { translate } from '@/lib/localization/translate';
import { createClientEventId } from '@/lib/client-event-id';
import {
  challengeJoinQuoteMatchesTarget,
  challengeJoinReceiptMatchesRequest,
  challengeJoinTargetKey,
  fetchChallengeJoinQuote,
  readChallengeJoinStatus,
  submitChallengeJoin,
  type ChallengeJoinQuote,
  type ChallengeJoinReceipt,
  type ChallengeJoinFailureCode,
  type ChallengeJoinTarget,
} from '@/lib/challenges/join-funding-contract';
import { useMomentaStore } from '@/store/momenta-store';

export type JoinFundingPhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'insufficient'
  | 'joining'
  | 'unknown'
  | 'confirmed'
  | 'member_without_receipt'
  | 'failed';

export type JoinFundingRetry = 'quote' | 'join' | 'status' | null;

type JoinFundingState = {
  accountId: string | null;
  target: ChallengeJoinTarget | null;
  targetKey: string | null;
  phase: JoinFundingPhase;
  quote: ChallengeJoinQuote | null;
  receipt: ChallengeJoinReceipt | null;
  clientEventId: string | null;
  message: string | null;
  retry: JoinFundingRetry;
  terminalInviteFailure: boolean;
  requestVersion: number;
  open: (accountId: string, target: ChallengeJoinTarget) => Promise<void>;
  confirm: (accountId: string) => Promise<void>;
  reconcile: (accountId: string) => Promise<void>;
  reset: () => void;
};

const initialState = {
  accountId: null,
  target: null,
  targetKey: null,
  phase: 'idle' as JoinFundingPhase,
  quote: null,
  receipt: null,
  clientEventId: null,
  message: null,
  retry: null as JoinFundingRetry,
  terminalInviteFailure: false,
  requestVersion: 0,
};

const confirmLocks = new Set<string>();
const terminalInviteFailureCodes = new Set<ChallengeJoinFailureCode>([
  'INVALID_REQUEST',
  'INVALID_INVITE',
  'INVITE_EXPIRED',
  'CHALLENGE_NOT_FOUND',
  'CHALLENGE_INACTIVE',
  'GROUP_INACTIVE',
  'SOLO_CHALLENGE',
  'ALREADY_JOINED',
]);

const isTerminalInviteFailure = (code: ChallengeJoinFailureCode): boolean =>
  terminalInviteFailureCodes.has(code);

const isCurrentRequest = (
  state: JoinFundingState,
  accountId: string,
  targetKey: string,
  requestVersion: number
) =>
  state.accountId === accountId &&
  state.targetKey === targetKey &&
  state.requestVersion === requestVersion;

const updateConfirmedWallet = (accountId: string, balance: number) => {
  const wallet = useMomentaStore.getState();
  if (wallet.activeAccountId === accountId) {
    useMomentaStore.setState({ balance });
  }
};

export const useJoinFundingStore = create<JoinFundingState>((set, get) => ({
  ...initialState,

  open: async (accountId, target) => {
    const targetKey = challengeJoinTargetKey(target);
    const current = get();

    if (
      current.accountId === accountId &&
      current.targetKey === targetKey &&
      (current.phase === 'loading' || current.phase === 'joining')
    ) {
      return;
    }

    if (
      current.accountId === accountId &&
      current.targetKey === targetKey &&
      current.phase === 'unknown' &&
      current.clientEventId
    ) {
      await current.reconcile(accountId);
      return;
    }

    const requestVersion = current.requestVersion + 1;
    set({
      accountId,
      target,
      targetKey,
      phase: 'loading',
      quote: null,
      receipt: null,
      clientEventId: null,
      message: null,
      retry: null,
      terminalInviteFailure: false,
      requestVersion,
    });

    const result = await fetchChallengeJoinQuote(target);
    if (!isCurrentRequest(get(), accountId, targetKey, requestVersion)) {
      return;
    }

    if (result.kind === 'unavailable') {
      set({
        phase: 'failed',
        message: result.message,
        retry: 'quote',
        terminalInviteFailure: false,
      });
      return;
    }

    if (result.kind === 'failure') {
      const terminalInviteFailure = isTerminalInviteFailure(
        result.failure.code
      );
      set({
        phase: 'failed',
        message: result.failure.message,
        terminalInviteFailure,
        retry:
          result.failure.code === 'AUTH_REQUIRED' ||
          result.failure.code === 'AUTH_SESSION_REVOKED' ||
          terminalInviteFailure
            ? null
            : 'quote',
      });
      return;
    }

    if (!challengeJoinQuoteMatchesTarget(result.quote, target)) {
      set({
        phase: 'failed',
        quote: null,
        message: translate('en-NZ', 'groups.funding.terms_mismatch'),
        retry: 'quote',
        terminalInviteFailure: false,
      });
      return;
    }

    if (result.quote.eligibilityCode === 'INSUFFICIENT_BALANCE') {
      set({
        phase: 'insufficient',
        quote: result.quote,
        message: null,
        retry: 'quote',
        terminalInviteFailure: false,
      });
      return;
    }

    if (result.quote.eligibilityCode === 'ALREADY_JOINED') {
      set({
        phase: 'member_without_receipt',
        quote: result.quote,
        message: translate('en-NZ', 'groups.funding.already_member'),
        retry: null,
        terminalInviteFailure: true,
      });
      return;
    }

    set({
      phase: 'ready',
      quote: result.quote,
      message: null,
      retry: null,
      terminalInviteFailure: false,
    });
  },

  confirm: async accountId => {
    const current = get();
    if (
      current.accountId !== accountId ||
      !current.target ||
      !current.targetKey ||
      !current.quote ||
      !current.quote.eligible ||
      (current.phase !== 'ready' && current.retry !== 'join')
    ) {
      return;
    }

    const confirmLockKey = `${accountId}:${current.targetKey}`;
    if (confirmLocks.has(confirmLockKey)) return;
    confirmLocks.add(confirmLockKey);

    const clientEventId = current.clientEventId ?? createClientEventId();
    const requestVersion = current.requestVersion + 1;
    const target = current.target;
    const targetKey = current.targetKey;
    const quote = current.quote;

    set({
      phase: 'joining',
      clientEventId,
      message: null,
      retry: null,
      terminalInviteFailure: false,
      requestVersion,
    });

    let result: Awaited<ReturnType<typeof submitChallengeJoin>>;
    try {
      result = await submitChallengeJoin({
        target,
        expectedChallengeId: quote.challengeId,
        quoteId: quote.quoteId,
        clientEventId,
      });
    } finally {
      confirmLocks.delete(confirmLockKey);
    }
    if (!isCurrentRequest(get(), accountId, targetKey, requestVersion)) {
      return;
    }

    if (result.kind === 'unknown') {
      set({
        phase: 'unknown',
        message: result.message,
        retry: 'status',
        terminalInviteFailure: false,
      });
      return;
    }

    if (result.kind === 'failure') {
      if (result.failure.code === 'JOIN_IN_PROGRESS') {
        set({
          phase: 'unknown',
          message: result.failure.message,
          retry: 'status',
          terminalInviteFailure: false,
        });
        return;
      }

      if (result.failure.code === 'INSUFFICIENT_BALANCE') {
        set({
          phase: 'failed',
          message: result.failure.message,
          clientEventId: null,
          quote: null,
          retry: 'quote',
          terminalInviteFailure: false,
        });
        return;
      }

      if (result.failure.code === 'QUOTE_STALE') {
        set({
          phase: 'failed',
          message: result.failure.message,
          clientEventId: null,
          quote: null,
          retry: 'quote',
          terminalInviteFailure: false,
        });
        return;
      }

      set({
        phase: 'failed',
        message: result.failure.message,
        clientEventId: null,
        retry: null,
        terminalInviteFailure: isTerminalInviteFailure(result.failure.code),
      });
      return;
    }

    if (
      !challengeJoinReceiptMatchesRequest(result.receipt, {
        clientEventId,
        challengeId: quote.challengeId,
        quoteId: quote.quoteId,
      })
    ) {
      set({
        phase: 'unknown',
        receipt: null,
        message: translate('en-NZ', 'groups.funding.receipt_mismatch'),
        retry: 'status',
        terminalInviteFailure: false,
      });
      return;
    }

    updateConfirmedWallet(accountId, result.receipt.newBalance);
    set({
      phase: 'confirmed',
      receipt: result.receipt,
      quote,
      message: null,
      retry: null,
      terminalInviteFailure: false,
    });
  },

  reconcile: async accountId => {
    const current = get();
    const challengeId =
      current.quote?.challengeId ?? current.target?.challengeId;
    if (
      current.accountId !== accountId ||
      !current.targetKey ||
      !current.clientEventId ||
      !challengeId
    ) {
      return;
    }

    const requestVersion = current.requestVersion + 1;
    const targetKey = current.targetKey;
    const clientEventId = current.clientEventId;
    set({
      phase: 'unknown',
      message: null,
      retry: null,
      terminalInviteFailure: false,
      requestVersion,
    });

    const result = await readChallengeJoinStatus({
      challengeId,
      clientEventId,
      quoteId: current.quote?.quoteId,
    });
    if (!isCurrentRequest(get(), accountId, targetKey, requestVersion)) {
      return;
    }

    if (result.kind === 'unavailable') {
      set({
        phase: 'unknown',
        message: result.message,
        retry: 'status',
        terminalInviteFailure: false,
      });
      return;
    }

    if (result.kind === 'failure') {
      if (result.failure.code === 'JOIN_IN_PROGRESS') {
        set({
          phase: 'unknown',
          message: result.failure.message,
          retry: 'status',
          terminalInviteFailure: false,
        });
        return;
      }
      set({
        phase: 'failed',
        message: result.failure.message,
        retry: null,
        terminalInviteFailure: isTerminalInviteFailure(result.failure.code),
      });
      return;
    }

    if (result.kind === 'confirmed') {
      if (
        !challengeJoinReceiptMatchesRequest(result.receipt, {
          clientEventId,
          challengeId,
          quoteId: current.quote?.quoteId,
        })
      ) {
        set({
          phase: 'unknown',
          receipt: null,
          message: translate('en-NZ', 'groups.funding.status_receipt_mismatch'),
          retry: 'status',
          terminalInviteFailure: false,
        });
        return;
      }

      updateConfirmedWallet(accountId, result.receipt.newBalance);
      set({
        phase: 'confirmed',
        receipt: result.receipt,
        message: null,
        retry: null,
        terminalInviteFailure: false,
      });
      return;
    }

    updateConfirmedWallet(accountId, result.status.availableBalance);
    if (result.status.isMember) {
      set({
        phase: 'member_without_receipt',
        message: translate('en-NZ', 'groups.funding.member_without_receipt'),
        retry: null,
        terminalInviteFailure: true,
      });
      return;
    }

    set({
      phase: 'failed',
      message: translate('en-NZ', 'groups.funding.no_receipt'),
      retry: current.quote ? 'join' : 'quote',
      terminalInviteFailure: false,
    });
  },

  reset: () => {
    set(state => ({
      ...initialState,
      requestVersion: state.requestVersion + 1,
    }));
  },
}));
