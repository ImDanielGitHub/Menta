import type { Tables } from '@/lib/database.types';
import {
  LEGACY_APP_UPDATE_POLICY_KEY,
  resolveLegacyUpdateDecision,
  type LegacyUpdateDecision,
  type LegacyUpdatePlatform,
} from '@/lib/legacy-app-update-policy';
import { supabase } from '@/lib/supabase';

const POLICY_COLUMNS =
  'android_minimum_version,android_store_available,enabled,ios_minimum_version,ios_store_available,key,mode,release,schema_version,updated_at';
const POLICY_TIMEOUT_MS = 5_000;
const POLICY_TTL_MS = 5 * 60 * 1000;

type CachedPolicy = {
  decision: LegacyUpdateDecision;
  cachedAt: number;
};

const cachedPolicies = new Map<string, CachedPolicy>();
const policyFetches = new Map<string, Promise<LegacyUpdateDecision>>();

const unknownDecision = (): LegacyUpdateDecision => ({
  status: 'authority_unknown',
});

export const loadLegacyUpdatePolicy = ({
  currentVersion,
  platform,
}: {
  currentVersion: string;
  platform: LegacyUpdatePlatform;
}): Promise<LegacyUpdateDecision> => {
  const cacheKey = `${platform}:${currentVersion}`;
  const cached = cachedPolicies.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < POLICY_TTL_MS) {
    return Promise.resolve(cached.decision);
  }

  const inFlight = policyFetches.get(cacheKey);
  if (inFlight) return inFlight;

  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POLICY_TIMEOUT_MS);

    try {
      const { data, error } = await supabase
        .from('app_update_policies')
        .select(POLICY_COLUMNS)
        .eq('key', LEGACY_APP_UPDATE_POLICY_KEY)
        .abortSignal(controller.signal)
        .maybeSingle();

      const decision =
        error || !data
          ? unknownDecision()
          : resolveLegacyUpdateDecision({
              currentVersion,
              platform,
              row: data as Tables<'app_update_policies'>,
            });

      cachedPolicies.set(cacheKey, {
        decision,
        cachedAt: Date.now(),
      });
      return decision;
    } catch {
      const decision = unknownDecision();
      cachedPolicies.set(cacheKey, {
        decision,
        cachedAt: Date.now(),
      });
      return decision;
    } finally {
      clearTimeout(timeout);
      policyFetches.delete(cacheKey);
    }
  })();

  policyFetches.set(cacheKey, request);
  return request;
};
