import { isSameLocalDay } from '@/lib/loop/day-context';
import type { ConfirmedReceipt } from '@/lib/loop/types';

/** Default window where an accepted receipt still owns Today. */
export const DEFAULT_ACCEPTED_RECEIPT_FRESH_MS = 6 * 60 * 60 * 1000;

export type ReceiptFreshnessInput = {
  receipt: ConfirmedReceipt | null;
  localDay: string;
  timezone: string;
  nowIso: string;
  freshMs?: number;
};

/**
 * An accepted receipt is fresh only when:
 * 1. it is kind `accepted`
 * 2. it belongs to the current local day
 * 3. it is still within the freshness window
 *
 * Non-accepted receipts are never "fresh" for `accepted-today`.
 */
export const isAcceptedReceiptFresh = (
  input: ReceiptFreshnessInput
): boolean => {
  const { receipt, localDay, timezone, nowIso } = input;
  if (!receipt || receipt.kind !== 'accepted') {
    return false;
  }

  if (receipt.localDay !== localDay) {
    return false;
  }

  if (!isSameLocalDay(receipt.confirmedAtIso, localDay, timezone)) {
    return false;
  }

  const confirmedAt = Date.parse(receipt.confirmedAtIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(confirmedAt) || Number.isNaN(now)) {
    return false;
  }

  const freshMs = input.freshMs ?? DEFAULT_ACCEPTED_RECEIPT_FRESH_MS;
  if (confirmedAt > now) {
    return false;
  }

  return now - confirmedAt <= freshMs;
};
