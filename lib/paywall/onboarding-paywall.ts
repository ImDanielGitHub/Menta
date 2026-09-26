import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyProfile, getMyProAuthority } from '@/lib/profile-api';
import {
  getPostHogClient,
  setProductAnalyticsUserId,
  trackProductEvent,
} from '@/lib/posthog';
import {
  setAmplitudeUserId,
  setAmplitudePaywallAssignment,
} from '@/lib/amplitude';
import {
  ONBOARDING_PAYWALL_FLAG,
  rememberPaywallAnalyticsAssignment,
  type OnboardingPaywallVariant,
} from '@/lib/analytics/onboarding-paywall-context';
import { useAuthStore } from '@/store/auth-store';
import { useInviteStore } from '@/store/invite-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import { REVENUECAT_SUPPORTED } from '@/lib/paywall/revenuecat';

// Separate from the draft, dismissible paywall-placement experiment.
export { ONBOARDING_PAYWALL_FLAG } from '@/lib/analytics/onboarding-paywall-context';
export const ONBOARDING_PAYWALL_START = '2026-09-13T03:09:00Z';
export type OnboardingPaywallDecision = {
  variant: OnboardingPaywallVariant;
  enrolled: boolean;
  requiresPurchase: boolean;
  accessPending?: boolean;
};

const storageKey = (ownerId: string) =>
  `@menta/${ONBOARDING_PAYWALL_FLAG}/${ownerId}`;
const control: OnboardingPaywallDecision = {
  variant: 'control',
  enrolled: false,
  requiresPurchase: false,
};
const isVariant = (value: unknown): value is OnboardingPaywallVariant =>
  value === 'control' || value === 'hard_paywall';

const assertOwner = (ownerId: string) => {
  if (useAuthStore.getState().user?.id !== ownerId) {
    throw new Error('Your account changed. Sign in again to continue.');
  }
};

/** A flag changes the onboarding sequence, never the server's Pro entitlement. */
export async function resolveOnboardingPaywall(
  ownerId: string
): Promise<OnboardingPaywallDecision> {
  assertOwner(ownerId);
  const auth = useAuthStore.getState();
  if (!REVENUECAT_SUPPORTED || auth.hasCompletedOnboarding) return control;

  // Await persisted invitation state before classifying a returning draft.
  await Promise.all([
    useInviteStore.persist.hasHydrated()
      ? undefined
      : useInviteStore.persist.rehydrate(),
    useProtectedRouteStore.persist.hasHydrated()
      ? undefined
      : useProtectedRouteStore.persist.rehydrate(),
  ]);
  assertOwner(ownerId);
  const protectedHandoff = useProtectedRouteStore
    .getState()
    .peekPendingRouteForUser(ownerId);
  if (
    useInviteStore.getState().peekPendingForUser(ownerId) ||
    protectedHandoff?.path.startsWith('/events/')
  )
    return control;

  const saved = await AsyncStorage.getItem(storageKey(ownerId));
  assertOwner(ownerId);
  if (saved === 'released') return control;
  const profile = await getMyProfile();
  assertOwner(ownerId);
  if (!profile || profile.id !== ownerId)
    throw new Error('Your account could not be checked. Please try again.');
  if (
    profile.has_completed_onboarding ||
    !(Date.parse(profile.created_at) >= Date.parse(ONBOARDING_PAYWALL_START))
  )
    return control;
  const pro = await getMyProAuthority();
  assertOwner(ownerId);
  if (!pro)
    throw new Error('Your Pro access could not be checked. Please try again.');
  if (pro.is_pro && !pro.reconciliation_pending) return control;

  let variant = isVariant(saved) ? saved : null;
  const posthog = getPostHogClient();
  if (posthog) {
    setProductAnalyticsUserId(ownerId);
    posthog.setPersonPropertiesForFlags(
      { onboarding_hard_paywall_eligible_v1: true },
      false
    );
    // Use the fresh response rather than a previous account's cached flags.
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const flags = await Promise.race([
        (async () => {
          // identify() may already have started a request with older property
          // overrides. Drain it, then evaluate this account's eligibility.
          await posthog.reloadFeatureFlagsAsync();
          assertOwner(ownerId);
          return posthog.reloadFeatureFlagsAsync();
        })().catch(() => undefined),
        new Promise<undefined>(resolve => {
          timer = setTimeout(() => resolve(undefined), 3500);
        }),
      ]);
      assertOwner(ownerId);
      if (posthog.getDistinctId() !== ownerId)
        throw new Error('Analytics identity changed. Try again.');
      const remote = flags?.[ONBOARDING_PAYWALL_FLAG];
      // Disabled/deleted flags may be false or absent from a successful full
      // response. A failed request returns undefined, preserving the gate.
      if (flags && (remote === false || remote === undefined)) {
        if (variant)
          await AsyncStorage.setItem(storageKey(ownerId), 'released');
        return control;
      } else if (!variant && isVariant(remote)) variant = remote;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  assertOwner(ownerId);
  if (!variant) return control;
  await AsyncStorage.setItem(storageKey(ownerId), variant);
  assertOwner(ownerId);
  setAmplitudeUserId(ownerId);
  await rememberPaywallAnalyticsAssignment(ownerId, variant);
  assertOwner(ownerId);
  setAmplitudePaywallAssignment(variant);
  return {
    variant,
    enrolled: true,
    requiresPurchase: variant === 'hard_paywall',
    accessPending: pro.reconciliation_pending,
  };
}

const exposures = new Set<string>();
export function recordOnboardingPaywallExposure(
  ownerId: string,
  decision: OnboardingPaywallDecision
): void {
  if (!decision.enrolled || useAuthStore.getState().user?.id !== ownerId)
    return;
  const scope = `${ownerId}:${decision.variant}`;
  if (exposures.has(scope)) return;
  trackProductEvent('Experiment Exposed', {
    experiment_key: ONBOARDING_PAYWALL_FLAG,
    experiment_variant: decision.variant,
    experiment_surface: 'onboarding',
  });
  exposures.add(scope);
}
