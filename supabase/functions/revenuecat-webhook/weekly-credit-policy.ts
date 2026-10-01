export interface WeeklyCreditReceipt {
  type?: string;
  period_type?: string;
  transaction_id?: string;
  price_in_purchased_currency?: number;
  price?: number;
}

/** Evaluate only authenticated provider receipts for a weekly Pro purchase. */
export function evaluateWeeklyCreditReceipt(event: WeeklyCreditReceipt): {
  eligible: boolean;
  reason: string;
} {
  const paidPrice = Number.isFinite(event.price_in_purchased_currency)
    ? event.price_in_purchased_currency
    : Number.isFinite(event.price)
      ? event.price
      : null;

  if (typeof paidPrice === 'number' && paidPrice > 0) {
    return { eligible: true, reason: 'weekly_payment_confirmed' };
  }

  // A trial is a provider-confirmed initial billing period, not every zero-price
  // activation. Require its real transaction ID to share the existing receipt
  // key across retries; the handler's synthetic fallback is not sufficient.
  if (
    event.type === 'INITIAL_PURCHASE' &&
    event.period_type === 'TRIAL' &&
    paidPrice === 0 &&
    Boolean(event.transaction_id?.trim())
  ) {
    return { eligible: true, reason: 'weekly_initial_trial_confirmed' };
  }

  return {
    eligible: false,
    reason:
      paidPrice === null
        ? 'weekly_payment_amount_missing'
        : 'weekly_no_paid_amount',
  };
}
