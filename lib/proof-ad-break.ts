import { AppState } from 'react-native';

import { showInterstitialAdDetailed } from '@/lib/ads';
import { getMyProAuthority } from '@/lib/profile-api';
import {
  addBreadcrumb as sentryBreadcrumb,
  captureError as sentryCapture,
} from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import {
  decodeProofAdBreakHint,
  type ProofAdBreakHint,
} from '@/lib/proof-ad-break-contract';
import { trackProductOperation } from '@/lib/posthog';

export {
  decodeProofAdBreakHint,
  type ProofAdBreakHint,
} from '@/lib/proof-ad-break-contract';

export type ProofAdBreakAttempt = {
  attempted: boolean;
  claimed: boolean;
  shown: boolean;
  reason:
    | 'shown'
    | 'background'
    | 'pro'
    | 'pro_unknown'
    | 'not_due'
    | 'claim_error'
    | 'in_flight'
    | 'ad_unavailable';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export const getProofAdBreakHint = async (
  submissionId: string
): Promise<ProofAdBreakHint | null> => {
  if (!submissionId) return null;

  try {
    const { data, error } = await supabase.rpc('get_proof_ad_break_hint', {
      p_submission_id: submissionId,
    });
    if (error) throw error;
    return decodeProofAdBreakHint(data);
  } catch (error) {
    // Ad metadata is deliberately non-authoritative. A missing or malformed
    // hint must never invalidate the confirmed proof receipt.
    sentryCapture(error, { context: 'proof_ad_break_hint_failed' });
    return null;
  }
};

const claimProofAdBreak = async (
  submissionId: string
): Promise<{ claimed: boolean; ordinal?: number }> => {
  try {
    const { data, error } = await supabase.rpc('claim_proof_ad_break', {
      p_submission_id: submissionId,
    });
    if (error) throw error;
    if (
      isRecord(data) &&
      data.success === true &&
      data.code === 'CLAIMED' &&
      isPositiveInteger(data.ordinal)
    ) {
      return { claimed: true, ordinal: data.ordinal };
    }
    return { claimed: false };
  } catch (error) {
    sentryCapture(error, { context: 'proof_ad_break_claim_failed' });
    throw error;
  }
};

let proofAdBreakAttemptPromise: Promise<ProofAdBreakAttempt> | null = null;
const NOT_DUE_REASON: ProofAdBreakAttempt['reason'] = 'not_due';
const IN_FLIGHT_REASON: ProofAdBreakAttempt['reason'] = 'in_flight';

export const attemptProofAdBreak = async (
  submissionId: string
): Promise<ProofAdBreakAttempt> => {
  if (!submissionId) {
    return {
      attempted: false,
      claimed: false,
      shown: false,
      reason: NOT_DUE_REASON,
    };
  }

  if (proofAdBreakAttemptPromise) {
    return {
      attempted: false,
      claimed: false,
      shown: false,
      reason: IN_FLIGHT_REASON,
    };
  }

  proofAdBreakAttemptPromise = (async () => {
    if (AppState.currentState !== 'active') {
      trackProductOperation({
        area: 'ad_free',
        authority: 'client',
        operation: 'resolve_ad_free',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'today',
      });
      return {
        attempted: false,
        claimed: false,
        shown: false,
        reason: 'background' as const,
      };
    }

    let authority;
    try {
      authority = await getMyProAuthority();
    } catch (error) {
      sentryCapture(error, { context: 'proof_ad_break_pro_authority_failed' });
      authority = null;
    }

    if (!authority || authority.reconciliation_pending) {
      trackProductOperation({
        area: 'ad_free',
        authority: 'server',
        operation: 'resolve_ad_free',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: 'today',
      });
      return {
        attempted: false,
        claimed: false,
        shown: false,
        reason: 'pro_unknown' as const,
      };
    }

    if (authority.is_pro) {
      trackProductOperation({
        area: 'ad_free',
        authority: 'server',
        operation: 'resolve_ad_free',
        outcome: 'confirmed',
        phase: 'authority',
        source: 'today',
      });
      return {
        attempted: false,
        claimed: false,
        shown: false,
        reason: 'pro' as const,
      };
    }

    let claim;
    try {
      claim = await claimProofAdBreak(submissionId);
    } catch {
      trackProductOperation({
        area: 'ad_free',
        authority: 'server',
        operation: 'resolve_ad_free',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: 'today',
      });
      return {
        attempted: false,
        claimed: false,
        shown: false,
        reason: 'claim_error' as const,
      };
    }

    if (!claim.claimed) {
      trackProductOperation({
        area: 'ad_free',
        authority: 'server',
        operation: 'resolve_ad_free',
        outcome: 'ineligible',
        phase: 'eligibility',
        source: 'today',
      });
      return {
        attempted: false,
        claimed: false,
        shown: false,
        reason: 'not_due' as const,
      };
    }

    sentryBreadcrumb('proof_ad_break_claimed', {
      ordinal: claim.ordinal,
    });
    trackProductOperation({
      area: 'ad_free',
      authority: 'server',
      operation: 'resolve_ad_free',
      outcome: 'eligible',
      phase: 'eligibility',
      source: 'today',
    });

    // The server claim is already consumed. Every ad outcome below is
    // navigation-safe and must never cause this ordinal to be presented again.
    let ad;
    try {
      ad = await showInterstitialAdDetailed();
    } catch (error) {
      trackProductOperation({
        area: 'ad_free',
        authority: 'provider',
        operation: 'resolve_ad_free',
        outcome: 'failed',
        phase: 'authority',
        source: 'today',
      });
      sentryCapture(error, { context: 'proof_ad_break_show_failed' });
      return {
        attempted: true,
        claimed: true,
        shown: false,
        reason: 'ad_unavailable' as const,
      };
    }
    trackProductOperation({
      area: 'ad_free',
      authority: 'provider',
      operation: 'resolve_ad_free',
      outcome: ad.shown ? 'confirmed' : 'failed',
      phase: 'authority',
      source: 'today',
    });
    return {
      attempted: true,
      claimed: true,
      shown: ad.shown,
      reason: ad.shown ? ('shown' as const) : ('ad_unavailable' as const),
    };
  })();

  try {
    return await proofAdBreakAttemptPromise;
  } finally {
    proofAdBreakAttemptPromise = null;
  }
};
