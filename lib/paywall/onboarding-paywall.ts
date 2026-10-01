import { useAuthStore } from '@/store/auth-store';
import type { OnboardingPaywallVariant } from '@/lib/analytics/onboarding-paywall-context';

export { ONBOARDING_PAYWALL_FLAG } from '@/lib/analytics/onboarding-paywall-context';
export type OnboardingPaywallDecision = {
  variant: OnboardingPaywallVariant;
  enrolled: boolean;
  requiresPurchase: boolean;
  accessPending?: boolean;
};

/** The hard-paywall experiment is retired. Choosing Menta is an explicit offer. */
export async function resolveOnboardingPaywall(
  ownerId: string
): Promise<OnboardingPaywallDecision> {
  if (useAuthStore.getState().user?.id !== ownerId) {
    throw new Error('Your account changed. Sign in again to continue.');
  }
  return { variant: 'control', enrolled: false, requiresPurchase: false };
}

/** Retained for older callers; the retired experiment cannot create exposures. */
export function recordOnboardingPaywallExposure(
  _ownerId: string,
  _decision: OnboardingPaywallDecision
): void {
  // Deliberately no exposure: this allocation no longer controls onboarding.
}
