import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_PAYWALL_FLAG = 'onboarding_hard_paywall_v1';
export type OnboardingPaywallVariant = 'control' | 'hard_paywall';
const keyFor = (ownerId: string) =>
  `@menta/${ONBOARDING_PAYWALL_FLAG}/analytics/${ownerId}`;
let currentOwner: string | null = null;
let currentVariant: OnboardingPaywallVariant | null = null;

const isVariant = (value: unknown): value is OnboardingPaywallVariant =>
  value === 'control' || value === 'hard_paywall';

export async function setPaywallAnalyticsOwner(
  ownerId: string | null
): Promise<OnboardingPaywallVariant | null> {
  currentOwner = ownerId;
  currentVariant = null;
  if (!ownerId) return null;
  try {
    const value = await AsyncStorage.getItem(keyFor(ownerId));
    if (currentOwner === ownerId && isVariant(value)) {
      currentVariant = value;
      return value;
    }
  } catch {
    /* Analytics persistence never changes product access. */
  }
  return null;
}

/** Retain original allocation for intent-to-treat analysis after a remote disable. */
export async function rememberPaywallAnalyticsAssignment(
  ownerId: string,
  variant: OnboardingPaywallVariant
): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(keyFor(ownerId));
    const original = isVariant(saved) ? saved : variant;
    await AsyncStorage.setItem(keyFor(ownerId), original);
    if (currentOwner === ownerId) currentVariant = original;
  } catch {
    /* Tracking must not block checkout or activation. */
  }
}

export function getPaywallAnalyticsProperties(): {
  onboarding_paywall_experiment?: typeof ONBOARDING_PAYWALL_FLAG;
  onboarding_paywall_variant?: OnboardingPaywallVariant;
} {
  return currentOwner && currentVariant
    ? {
        onboarding_paywall_experiment: ONBOARDING_PAYWALL_FLAG,
        onboarding_paywall_variant: currentVariant,
      }
    : {};
}
