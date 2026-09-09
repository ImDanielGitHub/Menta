import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';
import type { PromiseMutationResult } from '@/lib/promises/mutation-result';

/**
 * Emits feedback only for the direct mutation response. A status check or
 * safe retry is recovery, not a new achievement, so it stays tactile-silent
 * even when it discovers a historical confirmation.
 */
export const emitPromiseMutationResultHaptic = (
  result: PromiseMutationResult,
  interaction: 'mutation' | 'recovery' = 'mutation'
): Promise<boolean> => {
  if (interaction === 'recovery') return Promise.resolve(false);
  if (result.outcome === 'unknown') return emitHaptic({ type: 'unknown' });
  if (result.outcome === 'failed') {
    return emitHaptic({
      type: 'failed',
      operation: result.operation,
    });
  }

  return emitConfirmedOutcome(
    result.operation === 'delete' ? 'entity-deleted' : 'entity-left',
    createConfirmedReceipt(
      result.operation === 'delete'
        ? 'destructive-change'
        : 'promise-membership',
      result.receipt.id
    )
  );
};
