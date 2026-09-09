import {
  challengeJoinReceiptMatchesRequest,
  decodeChallengeJoinFailure,
  decodeChallengeJoinQuote,
  decodeChallengeJoinReceipt,
  fetchChallengeJoinQuote,
  normaliseChallengeJoinTarget,
  readChallengeJoinStatus,
  submitChallengeJoin,
} from '@/lib/challenges/join-funding-contract';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

const mockedRpc = jest.mocked(supabase.rpc);

const quote = {
  quote_id: '10000000-0000-5000-8000-000000000001',
  challenge_id: '10000000-0000-4000-8000-000000000002',
  challenge_title: 'After-work walkers',
  challenge_description: 'Walk together after work.',
  group_id: '10000000-0000-4000-8000-000000000003',
  group_name: 'After-work walkers',
  cost: 2,
  available_balance: 12,
  shortfall: 0,
  eligible: true,
  eligibility_code: 'ELIGIBLE',
};

const receipt = {
  receipt_id: '10000000-0000-4000-8000-000000000004',
  client_event_id: '10000000-0000-4000-8000-000000000005',
  quote_id: '10000000-0000-5000-8000-000000000001',
  challenge_id: '10000000-0000-4000-8000-000000000002',
  challenge_title: 'After-work walkers',
  group_id: '10000000-0000-4000-8000-000000000003',
  group_name: 'After-work walkers',
  joined_at: '2026-08-06T08:00:00.000Z',
  debit_amount: 2,
  new_balance: 10,
  first_proof_title: 'Walk after work',
  first_due_at: '2026-08-07T08:30:00.000Z',
  idempotent: false,
};

describe('challenge join funding decoders', () => {
  beforeEach(() => {
    mockedRpc.mockReset();
  });

  it('normalises one valid challenge capability without inventing a target', () => {
    expect(normaliseChallengeJoinTarget({ inviteCode: ' walk-22 ' })).toEqual({
      challengeId: null,
      inviteCode: 'WALK22',
    });
    expect(normaliseChallengeJoinTarget({})).toBeNull();
    expect(
      normaliseChallengeJoinTarget({ challengeId: 'not-a-uuid' })
    ).toBeNull();
  });

  it('accepts a complete server quote and rejects inconsistent or extended JSON', () => {
    expect(decodeChallengeJoinQuote(quote)).toMatchObject({
      source: 'server',
      cost: 2,
      availableBalance: 12,
      eligible: true,
    });
    expect(decodeChallengeJoinQuote({ ...quote, shortfall: 2 })).toBeNull();
    expect(decodeChallengeJoinQuote({ ...quote, client_cost: 1 })).toBeNull();
  });

  it('rejects a decoded quote for a different supplied challenge', async () => {
    mockedRpc.mockResolvedValue({
      data: {
        success: true,
        operation: 'CHALLENGE_JOIN_QUOTE',
        code: 'QUOTE_READY',
        quote: {
          ...quote,
          challenge_id: '10000000-0000-4000-8000-000000000099',
        },
      },
      error: null,
    } as never);

    await expect(
      fetchChallengeJoinQuote({
        challengeId: quote.challenge_id,
        inviteCode: null,
      })
    ).resolves.toMatchObject({
      kind: 'unavailable',
      message: expect.stringContaining('different challenge'),
    });
  });

  it('accepts only a complete authoritative receipt', () => {
    const decoded = decodeChallengeJoinReceipt(receipt);
    expect(decoded).toMatchObject({
      source: 'server',
      debitAmount: 2,
      newBalance: 10,
      idempotent: false,
    });
    expect(
      decoded &&
        challengeJoinReceiptMatchesRequest(decoded, {
          clientEventId: receipt.client_event_id,
          challengeId: receipt.challenge_id,
          quoteId: receipt.quote_id,
        })
    ).toBe(true);
    expect(
      decoded &&
        challengeJoinReceiptMatchesRequest(decoded, {
          clientEventId: '10000000-0000-4000-8000-000000000099',
          challengeId: receipt.challenge_id,
          quoteId: receipt.quote_id,
        })
    ).toBe(false);
    const { new_balance: _removed, ...withoutBalance } = receipt;
    expect(decodeChallengeJoinReceipt(withoutBalance)).toBeNull();
    expect(
      decodeChallengeJoinReceipt({ ...receipt, joined_at: 'tomorrow' })
    ).toBeNull();
  });

  it('treats a mutation receipt for another request as unknown', async () => {
    mockedRpc.mockResolvedValue({
      data: {
        success: true,
        operation: 'CHALLENGE_JOIN',
        code: 'JOIN_CONFIRMED',
        receipt: {
          ...receipt,
          quote_id: '10000000-0000-5000-8000-000000000099',
        },
      },
      error: null,
    } as never);

    await expect(
      submitChallengeJoin({
        target: {
          challengeId: receipt.challenge_id,
          inviteCode: null,
        },
        expectedChallengeId: receipt.challenge_id,
        quoteId: receipt.quote_id,
        clientEventId: receipt.client_event_id,
      })
    ).resolves.toMatchObject({
      kind: 'unknown',
      message: expect.stringContaining('did not match'),
    });
  });

  it('rejects a status receipt and snapshot for another request', async () => {
    mockedRpc
      .mockResolvedValueOnce({
        data: {
          success: true,
          operation: 'CHALLENGE_JOIN_STATUS',
          code: 'RECEIPT_FOUND',
          receipt: {
            ...receipt,
            client_event_id: '10000000-0000-4000-8000-000000000099',
          },
        },
        error: null,
      } as never)
      .mockResolvedValueOnce({
        data: {
          success: true,
          operation: 'CHALLENGE_JOIN_STATUS',
          code: 'NO_RECEIPT',
          status: {
            challenge_id: '10000000-0000-4000-8000-000000000099',
            is_member: true,
            available_balance: 10,
          },
        },
        error: null,
      } as never);

    const request = {
      challengeId: receipt.challenge_id,
      clientEventId: receipt.client_event_id,
      quoteId: receipt.quote_id,
    };
    await expect(readChallengeJoinStatus(request)).resolves.toMatchObject({
      kind: 'unavailable',
      message: expect.stringContaining('did not match'),
    });
    await expect(readChallengeJoinStatus(request)).resolves.toMatchObject({
      kind: 'unavailable',
      message: expect.stringContaining('different challenge'),
    });
  });

  it('requires a known operation, code, and message for definitive failure', () => {
    expect(
      decodeChallengeJoinFailure(
        {
          success: false,
          operation: 'CHALLENGE_JOIN',
          code: 'INSUFFICIENT_BALANCE',
          message: 'Your confirmed balance is not enough for this join.',
        },
        'CHALLENGE_JOIN'
      )
    ).toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
    expect(
      decodeChallengeJoinFailure({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: 'Missing operation',
      })
    ).toBeNull();
  });
});
