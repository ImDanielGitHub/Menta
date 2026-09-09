import * as haptics from '@/lib/motion/haptics';
import { emitPromiseMutationResultHaptic } from '@/lib/motion/promise-mutation-haptics';
import type { PromiseMutationResult } from '@/lib/promises/mutation-result';

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: jest.fn((source, receiptId) => ({
    confirmed: true,
    source,
    receiptId,
  })),
  emitConfirmedOutcome: jest.fn().mockResolvedValue(true),
  emitHaptic: jest.fn().mockResolvedValue(true),
}));

const confirmed: PromiseMutationResult = {
  outcome: 'confirmed',
  operation: 'delete',
  challengeId: 'promise-1',
  code: 'DELETE_CONFIRMED',
  message: 'Deleted.',
  receipt: {
    id: 'receipt-1',
    challengeId: 'promise-1',
    clientEventId: 'event-1',
    idempotent: false,
    verifiedBy: 'mutation-response',
  },
};

describe('promise mutation haptics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the authoritative receipt for a direct confirmation', async () => {
    await emitPromiseMutationResultHaptic(confirmed, 'mutation');
    expect(haptics.emitConfirmedOutcome).toHaveBeenCalledWith(
      'entity-deleted',
      expect.objectContaining({ receiptId: 'receipt-1' })
    );
  });

  it('emits failure only for a definitive direct rejection', async () => {
    await emitPromiseMutationResultHaptic(
      {
        outcome: 'failed',
        operation: 'leave',
        challengeId: 'promise-1',
        clientEventId: 'event-1',
        code: 'OWNER_CANNOT_LEAVE',
        message: 'Rejected.',
        safeToRetry: false,
      },
      'mutation'
    );
    expect(haptics.emitHaptic).toHaveBeenCalledWith({
      type: 'failed',
      operation: 'leave',
    });
  });

  it('keeps unknown, retry, and status-check outcomes silent', async () => {
    await expect(
      emitPromiseMutationResultHaptic(confirmed, 'recovery')
    ).resolves.toBe(false);
    expect(haptics.emitConfirmedOutcome).not.toHaveBeenCalled();
    expect(haptics.emitHaptic).not.toHaveBeenCalled();
  });
});
