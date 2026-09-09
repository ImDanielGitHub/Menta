import { supabase } from '@/lib/supabase';

export type RevenueCatAdRewardReceipt = {
  status: 'applied' | 'ignored' | 'pending';
  amount: number;
  newBalance: number | null;
  reason: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSafeNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export const decodeRevenueCatAdRewardReceipt = (
  value: unknown
): RevenueCatAdRewardReceipt | null => {
  if (!isRecord(value)) return null;

  const status = value.status;
  if (status !== 'applied' && status !== 'ignored' && status !== 'pending') {
    return null;
  }

  if (!isSafeNonNegativeInteger(value.amount)) return null;
  if (
    value.newBalance !== null &&
    value.newBalance !== undefined &&
    !isSafeNonNegativeInteger(value.newBalance)
  ) {
    return null;
  }
  if (
    value.reason !== null &&
    value.reason !== undefined &&
    typeof value.reason !== 'string'
  ) {
    return null;
  }

  return {
    status,
    amount: value.amount,
    newBalance: typeof value.newBalance === 'number' ? value.newBalance : null,
    reason: typeof value.reason === 'string' ? value.reason : null,
  };
};

const wait = (durationMs: number) =>
  new Promise<void>(resolve => setTimeout(resolve, durationMs));

export async function waitForRevenueCatAdRewardReceipt(
  clientTransactionId: string,
  options?: { attempts?: number; intervalMs?: number }
): Promise<RevenueCatAdRewardReceipt | null> {
  if (!clientTransactionId) return null;

  const attempts = Math.max(1, Math.floor(options?.attempts ?? 8));
  const intervalMs = Math.max(0, Math.floor(options?.intervalMs ?? 750));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data, error } = await supabase.rpc(
      'get_my_revenuecat_ad_reward_receipt',
      { p_client_transaction_id: clientTransactionId }
    );
    if (error) throw error;

    const receipt = decodeRevenueCatAdRewardReceipt(data);
    if (receipt && receipt.status !== 'pending') return receipt;

    if (attempt < attempts - 1 && intervalMs > 0) {
      await wait(intervalMs);
    }
  }

  return null;
}
