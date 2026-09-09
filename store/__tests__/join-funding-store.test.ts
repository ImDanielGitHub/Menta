import {
  fetchChallengeJoinQuote,
  readChallengeJoinStatus,
  submitChallengeJoin,
  type ChallengeJoinQuote,
  type ChallengeJoinReceipt,
} from '@/lib/challenges/join-funding-contract';
import { createClientEventId } from '@/lib/client-event-id';
import { useJoinFundingStore } from '@/store/join-funding-store';
import { useMomentaStore } from '@/store/momenta-store';

jest.mock('@/lib/challenges/join-funding-contract', () => ({
  challengeJoinQuoteMatchesTarget: jest.requireActual(
    '@/lib/challenges/join-funding-contract'
  ).challengeJoinQuoteMatchesTarget,
  challengeJoinReceiptMatchesRequest: jest.requireActual(
    '@/lib/challenges/join-funding-contract'
  ).challengeJoinReceiptMatchesRequest,
  challengeJoinTargetKey: jest.requireActual(
    '@/lib/challenges/join-funding-contract'
  ).challengeJoinTargetKey,
  fetchChallengeJoinQuote: jest.fn(),
  readChallengeJoinStatus: jest.fn(),
  submitChallengeJoin: jest.fn(),
}));

jest.mock('@/lib/client-event-id', () => ({
  createClientEventId: jest.fn(),
}));

jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: Object.assign(jest.fn(), {
    getState: jest.fn(() => ({ activeAccountId: 'account-1' })),
    setState: jest.fn(),
  }),
}));

const mockedQuote = jest.mocked(fetchChallengeJoinQuote);
const mockedSubmit = jest.mocked(submitChallengeJoin);
const mockedStatus = jest.mocked(readChallengeJoinStatus);
const mockedClientEventId = jest.mocked(createClientEventId);
const mockedWalletSet = jest.mocked(useMomentaStore.setState);

const target = {
  challengeId: '10000000-0000-4000-8000-000000000002',
  inviteCode: null,
};

const quote: ChallengeJoinQuote = {
  source: 'server',
  quoteId: '10000000-0000-5000-8000-000000000001',
  challengeId: target.challengeId,
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
  challengeId: target.challengeId,
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

describe('join funding store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useJoinFundingStore.getState().reset();
    mockedClientEventId.mockReturnValue(receipt.clientEventId);
  });

  it('exposes JOIN-00 only from an eligible server quote', async () => {
    mockedQuote.mockResolvedValue({ kind: 'quote', quote });
    await useJoinFundingStore.getState().open('account-1', target);
    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'ready',
      quote,
      receipt: null,
    });
  });

  it('exposes JOIN-01 without running the mutation', async () => {
    const insufficient = {
      ...quote,
      availableBalance: 0,
      shortfall: 2,
      eligible: false,
      eligibilityCode: 'INSUFFICIENT_BALANCE' as const,
    };
    mockedQuote.mockResolvedValue({ kind: 'quote', quote: insufficient });
    await useJoinFundingStore.getState().open('account-1', target);
    expect(useJoinFundingStore.getState().phase).toBe('insufficient');
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('never exposes JOIN-00 for a quote bound to another challenge', async () => {
    mockedQuote.mockResolvedValue({
      kind: 'quote',
      quote: {
        ...quote,
        challengeId: '10000000-0000-4000-8000-000000000099',
      },
    });

    await useJoinFundingStore.getState().open('account-1', target);

    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'failed',
      quote: null,
      retry: 'quote',
    });
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it.each(['INVALID_INVITE', 'INVITE_EXPIRED', 'CHALLENGE_NOT_FOUND'] as const)(
    'marks %s as a terminal invite result',
    async code => {
      mockedQuote.mockResolvedValue({
        kind: 'failure',
        failure: {
          operation: 'CHALLENGE_JOIN_QUOTE',
          code,
          message: 'This promise invitation is not available.',
        },
      });

      await useJoinFundingStore.getState().open('account-1', target);

      expect(useJoinFundingStore.getState()).toMatchObject({
        phase: 'failed',
        retry: null,
        terminalInviteFailure: true,
      });
    }
  );

  it('keeps a transport failure retryable and non-terminal', async () => {
    mockedQuote.mockResolvedValue({
      kind: 'unavailable',
      message: 'Menta could not load the join terms.',
    });

    await useJoinFundingStore.getState().open('account-1', target);

    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'failed',
      retry: 'quote',
      terminalInviteFailure: false,
    });
  });

  it('treats an already-member quote as terminal without running another join', async () => {
    mockedQuote.mockResolvedValue({
      kind: 'quote',
      quote: {
        ...quote,
        eligible: false,
        eligibilityCode: 'ALREADY_JOINED',
      },
    });

    await useJoinFundingStore.getState().open('account-1', target);

    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'member_without_receipt',
      terminalInviteFailure: true,
    });
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('takes one synchronous confirm lock before awaiting the RPC', async () => {
    mockedQuote.mockResolvedValue({ kind: 'quote', quote });
    await useJoinFundingStore.getState().open('account-1', target);

    let resolveSubmit:
      | ((value: { kind: 'confirmed'; receipt: ChallengeJoinReceipt }) => void)
      | null = null;
    mockedSubmit.mockReturnValue(
      new Promise(resolve => {
        resolveSubmit = resolve;
      })
    );

    const first = useJoinFundingStore.getState().confirm('account-1');
    const second = useJoinFundingStore.getState().confirm('account-1');
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    expect(useJoinFundingStore.getState().phase).toBe('joining');

    resolveSubmit?.({ kind: 'confirmed', receipt });
    await Promise.all([first, second]);
    expect(useJoinFundingStore.getState().phase).toBe('confirmed');
  });

  it('holds JOIN-03 after response loss and reconciles by status only', async () => {
    mockedQuote.mockResolvedValue({ kind: 'quote', quote });
    mockedSubmit.mockResolvedValue({
      kind: 'unknown',
      message: 'Connection ended before a receipt was read.',
    });
    mockedStatus.mockResolvedValue({
      kind: 'confirmed',
      receipt: { ...receipt, idempotent: true },
    });

    await useJoinFundingStore.getState().open('account-1', target);
    await useJoinFundingStore.getState().confirm('account-1');
    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'unknown',
      clientEventId: receipt.clientEventId,
    });

    await useJoinFundingStore.getState().reconcile('account-1');
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    expect(mockedStatus).toHaveBeenCalledWith({
      challengeId: target.challengeId,
      clientEventId: receipt.clientEventId,
      quoteId: quote.quoteId,
    });
    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'confirmed',
      receipt: { idempotent: true },
    });
  });

  it('does not invent a debit when membership exists without a receipt', async () => {
    mockedQuote.mockResolvedValue({ kind: 'quote', quote });
    mockedSubmit.mockResolvedValue({
      kind: 'unknown',
      message: 'Unknown result',
    });
    mockedStatus.mockResolvedValue({
      kind: 'snapshot',
      status: {
        challengeId: target.challengeId,
        isMember: true,
        availableBalance: 10,
      },
    });

    await useJoinFundingStore.getState().open('account-1', target);
    await useJoinFundingStore.getState().confirm('account-1');
    await useJoinFundingStore.getState().reconcile('account-1');
    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'member_without_receipt',
      receipt: null,
    });
  });

  it('holds an unmatched mutation receipt without updating the wallet', async () => {
    mockedQuote.mockResolvedValue({ kind: 'quote', quote });
    mockedSubmit.mockResolvedValue({
      kind: 'confirmed',
      receipt: {
        ...receipt,
        challengeId: '10000000-0000-4000-8000-000000000099',
      },
    });

    await useJoinFundingStore.getState().open('account-1', target);
    await useJoinFundingStore.getState().confirm('account-1');

    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'unknown',
      receipt: null,
      retry: 'status',
    });
    expect(mockedWalletSet).not.toHaveBeenCalled();
  });

  it('holds an unmatched status receipt without updating the wallet', async () => {
    mockedQuote.mockResolvedValue({ kind: 'quote', quote });
    mockedSubmit.mockResolvedValue({
      kind: 'unknown',
      message: 'Unknown result',
    });
    mockedStatus.mockResolvedValue({
      kind: 'confirmed',
      receipt: {
        ...receipt,
        quoteId: '10000000-0000-5000-8000-000000000099',
      },
    });

    await useJoinFundingStore.getState().open('account-1', target);
    await useJoinFundingStore.getState().confirm('account-1');
    await useJoinFundingStore.getState().reconcile('account-1');

    expect(useJoinFundingStore.getState()).toMatchObject({
      phase: 'unknown',
      receipt: null,
      retry: 'status',
    });
    expect(mockedWalletSet).not.toHaveBeenCalled();
  });
});
