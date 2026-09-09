import { useCallback } from 'react';
import { getMyProAuthority } from '@/lib/profile-api';
import { FREE_TIER_QUOTAS } from '@/lib/product-config';

type GateResult = {
  allowed: boolean;
  limit?: number;
  maxKey?: string;
};

type QuotaConfig = {
  max_active_groups?: number | string | null;
  max_groups_per_month?: number | string | null;
  max_challenges_per_month?: number | string | null;
  max_active_promises?: number | string | null;
};

const DEFAULT_QUOTAS: Required<Record<keyof QuotaConfig, number>> =
  FREE_TIER_QUOTAS;

const parseQuotaLimit = (
  quotaJson: QuotaConfig | undefined,
  maxKey: string
): number | undefined => {
  const rawMax =
    quotaJson?.[maxKey as keyof QuotaConfig] ??
    (maxKey === 'max_active_groups'
      ? quotaJson?.max_groups_per_month
      : undefined) ??
    DEFAULT_QUOTAS[maxKey as keyof typeof DEFAULT_QUOTAS];
  const parsedMax = typeof rawMax === 'number' ? rawMax : Number(rawMax);

  return Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : undefined;
};

export function useQuotaGate() {
  const quotaJson: QuotaConfig = DEFAULT_QUOTAS;

  const gateCreate = useCallback(
    async (currentCount: number, maxKey: string): Promise<GateResult> => {
      const max = parseQuotaLimit(quotaJson, maxKey);

      try {
        const authority = await getMyProAuthority();
        if (authority?.is_pro && !authority.reconciliation_pending) {
          return { allowed: true, limit: max, maxKey };
        }
      } catch {
        // Fail closed to the free-tier count when Pro cannot be confirmed.
      }

      if (!max || currentCount < max) {
        return { allowed: true, limit: max, maxKey };
      }

      return { allowed: false, limit: max, maxKey };
    },
    [quotaJson]
  );

  return { gateCreate };
}
