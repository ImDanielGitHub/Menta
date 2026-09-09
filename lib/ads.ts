import { AppState, NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import type { AdsConsentInterface } from 'react-native-google-mobile-ads';
import type { VerifiedReward } from 'react-native-purchases';
import {
  addBreadcrumb as sentryBreadcrumb,
  captureError as sentryCapture,
} from '@/lib/sentry';
import { trackProductEvent } from '@/lib/posthog';
import { getOperationalFlag } from '@/lib/operational-flags';
import { useAuthStore } from '@/store/auth-store';
import {
  pollRevenueCatAdReward,
  prepareRevenueCatAdReward,
  trackRevenueCatAdEvent,
} from '@/lib/paywall/revenuecat';
import { waitForRevenueCatAdRewardReceipt } from '@/lib/ads/revenuecat-reward-receipt';

type GoogleMobileAdsPackage = typeof import('react-native-google-mobile-ads');

let mobileAds: GoogleMobileAdsPackage['default'] | undefined;
let MaxAdContentRating:
  | GoogleMobileAdsPackage['MaxAdContentRating']
  | undefined;
let RewardedAd: GoogleMobileAdsPackage['RewardedAd'] | undefined;
let InterstitialAd:
  | typeof import('react-native-google-mobile-ads').InterstitialAd
  | undefined;
let AdEventType: GoogleMobileAdsPackage['AdEventType'] | undefined;
let RewardedAdEventType:
  | GoogleMobileAdsPackage['RewardedAdEventType']
  | undefined;
let TestIds: GoogleMobileAdsPackage['TestIds'] | undefined;
let AdsConsent: AdsConsentInterface | undefined;

try {
  // Expo Go does not include this native module, so keep runtime loading
  // guarded while retaining exact package types for native builds.
  const pkg =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-google-mobile-ads') as GoogleMobileAdsPackage;
  mobileAds = pkg.default;
  MaxAdContentRating = pkg.MaxAdContentRating;
  RewardedAd = pkg.RewardedAd;
  InterstitialAd = pkg.InterstitialAd;
  AdEventType = pkg.AdEventType;
  RewardedAdEventType = pkg.RewardedAdEventType;
  TestIds = pkg.TestIds;
  AdsConsent = pkg.AdsConsent;
} catch {
  // Module not linked or unavailable in Expo Go; leave undefined and guard usage
}

type AdsConsentInfoSnapshot = {
  canRequestAds: boolean;
  isConsentFormAvailable: boolean;
  privacyOptionsRequirementStatus: string;
  status: string;
};

type AdsReadiness = {
  ready: boolean;
  reason?:
    | 'module_missing'
    | 'consent_required'
    | 'consent_unavailable'
    | 'consent_error'
    | 'error';
  consentInfo?: AdsConsentInfoSnapshot;
};

export type AdsPrivacyOptionsRequirement =
  | 'required'
  | 'not_required'
  | 'unavailable';

export type AdsPrivacyOptionsResult = {
  shown: boolean;
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
  reason?: 'not_required' | 'unavailable' | 'error';
};

let consentGatherPromise: Promise<AdsReadiness> | null = null;
let mobileAdsInitializationPromise: Promise<AdsReadiness> | null = null;
let mobileAdsInitialized = false;
let privacyOptionsFormPromise: Promise<AdsPrivacyOptionsResult> | null = null;

export type RewardAdResult = {
  clientTransactionId?: string;
  earned: boolean;
  amount: number;
  type?: string;
  provider?: 'revenuecat' | 'admob_compatibility';
  verified?: boolean;
  reason?:
    | 'ads_disabled'
    | 'background'
    | 'module_missing'
    | 'invalid_config'
    | 'no_fill'
    | 'show_failed'
    | 'load_failed'
    | 'consent_required'
    | 'consent_unavailable'
    | 'consent_error'
    | 'daily_limit'
    | 'cooldown'
    | 'verification_unavailable'
    | 'verification_failed'
    | 'reward_pending'
    | 'reward_unconfirmed'
    | 'error';
};

export type RewardedAdOptions = {
  appUserId: string;
  placement?: string;
};

export const REWARD_AD_PROVIDER_ORDER = [
  'revenuecat',
  'admob_compatibility',
] as const;

export type InterstitialAdResult = {
  shown: boolean;
  reason?:
    | 'ads_disabled'
    | 'background'
    | 'module_missing'
    | 'invalid_config'
    | 'no_fill'
    | 'show_failed'
    | 'load_failed'
    | 'consent_required'
    | 'consent_unavailable'
    | 'consent_error'
    | 'timeout'
    | 'error';
};

export type InterstitialAdReadiness = {
  ready: boolean;
  reason?: InterstitialAdResult['reason'];
};

const normalizeConsentInfo = (value: unknown): AdsConsentInfoSnapshot => {
  const info =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};

  return {
    canRequestAds: info.canRequestAds === true,
    isConsentFormAvailable: info.isConsentFormAvailable === true,
    privacyOptionsRequirementStatus:
      typeof info.privacyOptionsRequirementStatus === 'string'
        ? info.privacyOptionsRequirementStatus
        : 'UNKNOWN',
    status: typeof info.status === 'string' ? info.status : 'UNKNOWN',
  };
};

const getBlockedConsentReason = (
  info: AdsConsentInfoSnapshot
): NonNullable<AdsReadiness['reason']> => {
  if (info.status === 'REQUIRED') {
    return info.isConsentFormAvailable
      ? 'consent_required'
      : 'consent_unavailable';
  }

  return 'consent_unavailable';
};

const readinessFromConsentInfo = (
  info: AdsConsentInfoSnapshot
): AdsReadiness => ({
  ready: info.canRequestAds,
  reason: info.canRequestAds ? undefined : getBlockedConsentReason(info),
  consentInfo: info,
});

const rememberConsentInfo = (
  value: unknown
): { info: AdsConsentInfoSnapshot; readiness: AdsReadiness } => {
  const info = normalizeConsentInfo(value);
  const readiness = readinessFromConsentInfo(info);
  consentGatherPromise = Promise.resolve(readiness);
  return { info, readiness };
};

const gatherAdsConsentOnce = async (): Promise<AdsReadiness> => {
  if (consentGatherPromise) {
    return consentGatherPromise;
  }

  consentGatherPromise = (async () => {
    if (
      !AdsConsent ||
      typeof AdsConsent.gatherConsent !== 'function' ||
      typeof AdsConsent.getConsentInfo !== 'function'
    ) {
      sentryBreadcrumb('admob_consent_unavailable', {
        platform: Platform.OS,
      });
      return { ready: false, reason: 'consent_unavailable' };
    }

    sentryBreadcrumb('admob_consent_gather_start', {
      platform: Platform.OS,
    });

    try {
      const { info, readiness } = rememberConsentInfo(
        await AdsConsent.gatherConsent()
      );
      sentryBreadcrumb('admob_consent_gather_complete', {
        canRequestAds: info.canRequestAds,
        privacyOptionsRequirementStatus: info.privacyOptionsRequirementStatus,
        status: info.status,
      });
      return readiness;
    } catch (error) {
      sentryCapture(error, { context: 'admob_consent_gather_failed' });

      // UMP can retain a valid decision from the previous session. The SDK's
      // current guidance is to re-read that decision after an update error.
      try {
        const { info, readiness } = rememberConsentInfo(
          await AdsConsent.getConsentInfo()
        );
        sentryBreadcrumb('admob_consent_previous_session_checked', {
          canRequestAds: info.canRequestAds,
          status: info.status,
        });
        return readiness.ready
          ? readiness
          : {
              ...readiness,
              reason: 'consent_error',
            };
      } catch (readError) {
        sentryCapture(readError, {
          context: 'admob_consent_previous_session_failed',
        });
        return { ready: false, reason: 'consent_error' };
      }
    }
  })();

  return consentGatherPromise;
};

const initializeMobileAdsWhenPermitted = async (): Promise<AdsReadiness> => {
  if (!mobileAds) {
    return { ready: false, reason: 'module_missing' };
  }

  const consent = await gatherAdsConsentOnce();
  if (!consent.ready) {
    sentryBreadcrumb('admob_init_blocked_by_consent', {
      reason: consent.reason,
      status: consent.consentInfo?.status,
    });
    return consent;
  }

  if (mobileAdsInitialized) {
    return consent;
  }

  if (!mobileAdsInitializationPromise) {
    mobileAdsInitializationPromise = (async () => {
      try {
        sentryBreadcrumb('admob_init_start', {
          platform: Platform.OS,
        });
        await mobileAds().setRequestConfiguration({
          ...(MaxAdContentRating
            ? { maxAdContentRating: MaxAdContentRating.T }
            : {}),
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
          testDeviceIdentifiers: [],
        });
        await mobileAds().initialize();
        mobileAdsInitialized = true;
        sentryBreadcrumb('admob_init_success', {
          platform: Platform.OS,
        });
        return consent;
      } catch (error) {
        sentryCapture(error, { context: 'admob_init_failed' });
        return {
          ready: false,
          reason: 'error' as const,
          consentInfo: consent.consentInfo,
        };
      }
    })();
  }

  const readiness = await mobileAdsInitializationPromise;
  if (!readiness.ready) {
    mobileAdsInitializationPromise = null;
  }
  return readiness;
};

// Basic sanity check: AdMob ad unit IDs contain a slash and never a tilde.
function isLikelyValidAdUnitId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  if (!id) return false;
  if (id.includes('~')) return false; // looks like an App ID, not an ad unit ID
  if (!id.includes('/')) return false; // ad unit IDs contain '/'
  return true;
}

const getInterstitialUnitId = (): string | null => {
  if (__DEV__) return TestIds?.INTERSTITIAL ?? null;

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const configured =
    Platform.OS === 'ios'
      ? (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS ??
        extra.admobInterstitialIos)
      : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID ??
        extra.admobInterstitialAndroid);

  return isLikelyValidAdUnitId(configured) ? configured : null;
};

const getRewardedUnitId = (): string | null => {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const configured =
    Platform.OS === 'ios'
      ? (process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ?? extra.admobRewardedIos)
      : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID ??
        extra.admobRewardedAndroid);

  return isLikelyValidAdUnitId(configured) ? configured : null;
};

const getMomentaCurrencyCode = (): string => {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const configured =
    process.env.EXPO_PUBLIC_REVENUECAT_MOMENTA_CURRENCY_CODE ??
    extra.revenuecatMomentaCurrencyCode;
  return typeof configured === 'string' && configured.trim()
    ? configured.trim()
    : 'MNT';
};

const findVerifiedMomentaReward = (
  rewards: (VerifiedReward | undefined)[]
): Extract<VerifiedReward, { type: 'virtual_currency' }> | null => {
  const expectedCode = getMomentaCurrencyCode();
  return (
    rewards.find(
      (
        reward
      ): reward is Extract<VerifiedReward, { type: 'virtual_currency' }> =>
        reward?.type === 'virtual_currency' &&
        reward.code === expectedCode &&
        Number.isSafeInteger(reward.amount) &&
        reward.amount > 0
    ) ?? null
  );
};

const getAdErrorCode = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') return null;
  const raw = (error as Record<string, unknown>).code;
  if (typeof raw === 'number' && Number.isSafeInteger(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const match = raw.match(/(?:^|\/)(\d+)$/);
  return match ? Number(match[1]) : null;
};

const mapRevenuePrecision = (value: unknown): string => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (numeric === 3) return 'exact';
  if (numeric === 2) return 'publisher_defined';
  if (numeric === 1) return 'estimated';
  return 'unknown';
};

const AD_NO_FILL_PATTERNS = [
  'no-fill',
  'no ad to show',
  'no ads to show',
  'no ad available',
  'no ad configured',
  'no ad config',
  'lack of ad inventory',
  'inventory unavailable',
  'googlemobileads/no-fill',
];

const AD_NO_FILL_CODES = [
  '3',
  'error-code-no-fill',
  'error-code-mediation-no-fill',
  'request-error-no-ad-to-show',
];

function isNoFillErrorPayload(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeCode = ((error as Record<string, unknown>).code ?? '') as
    | string
    | number;
  const maybeMessage = ((error as Record<string, unknown>).message ??
    '') as string;
  const maybeDetails = ((error as Record<string, unknown>).details ??
    '') as string;
  const normalize = (value: unknown) => {
    if (typeof value === 'number') return String(value);
    return typeof value === 'string' ? value.toLowerCase() : '';
  };

  const code = normalize(maybeCode);
  if (AD_NO_FILL_CODES.includes(code)) return true;

  const haystack = `${code} ${normalize(maybeMessage)} ${normalize(maybeDetails)}`;
  if (!haystack.trim()) return false;
  return AD_NO_FILL_PATTERNS.some(needle => haystack.includes(needle));
}

export async function initializeAds(): Promise<AdsReadiness> {
  return initializeMobileAdsWhenPermitted();
}

export async function getAdsPrivacyOptionsRequirement(): Promise<AdsPrivacyOptionsRequirement> {
  const consent = await gatherAdsConsentOnce();
  const requirement = consent.consentInfo?.privacyOptionsRequirementStatus;

  if (requirement === 'REQUIRED') {
    return 'required';
  }
  if (requirement === 'NOT_REQUIRED') {
    return 'not_required';
  }
  return 'unavailable';
}

export async function showAdsPrivacyOptions(): Promise<AdsPrivacyOptionsResult> {
  const consent = await gatherAdsConsentOnce();
  const requirement = consent.consentInfo?.privacyOptionsRequirementStatus;

  if (!AdsConsent || typeof AdsConsent.showPrivacyOptionsForm !== 'function') {
    return {
      shown: false,
      canRequestAds: false,
      privacyOptionsRequired: false,
      reason: 'unavailable',
    };
  }

  if (requirement !== 'REQUIRED') {
    return {
      shown: false,
      canRequestAds: consent.ready,
      privacyOptionsRequired: false,
      reason: 'not_required',
    };
  }

  if (!privacyOptionsFormPromise) {
    privacyOptionsFormPromise = (async () => {
      try {
        sentryBreadcrumb('admob_privacy_options_opened', {
          platform: Platform.OS,
        });
        const { info } = rememberConsentInfo(
          await AdsConsent.showPrivacyOptionsForm()
        );
        if (info.canRequestAds) {
          await initializeMobileAdsWhenPermitted();
        }
        return {
          shown: true,
          canRequestAds: info.canRequestAds,
          privacyOptionsRequired:
            info.privacyOptionsRequirementStatus === 'REQUIRED',
        };
      } catch (error) {
        sentryCapture(error, {
          context: 'admob_privacy_options_failed',
        });
        return {
          shown: false,
          canRequestAds: consent.ready,
          privacyOptionsRequired: true,
          reason: 'error' as const,
        };
      } finally {
        privacyOptionsFormPromise = null;
      }
    })();
  }

  return privacyOptionsFormPromise;
}

export function isDogfoodAdsDisabled(): boolean {
  return process.env.EXPO_PUBLIC_DOGFOOD_DISABLE_ADS === 'true';
}

// Publishing a generic ads-enabled flag cannot activate an unverified reward
// path. Open this release gate only after native SSV and wallet receipt proof.
export function areVerifiedAdRewardsEnabled(): boolean {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_AD_REWARDS_VERIFIED === 'true' &&
    typeof NativeModules.RNPurchases?.generateRewardVerificationToken ===
      'function' &&
    typeof NativeModules.RNPurchases?.pollRewardVerification === 'function'
  );
}

async function showRewardedAdDetailedInternal(
  options?: RewardedAdOptions
): Promise<RewardAdResult> {
  const appUserId = options?.appUserId?.trim();
  const placement = options?.placement?.trim() || 'momenta_reward';

  if (
    !getOperationalFlag('ads_enabled') ||
    getOperationalFlag('safe_mode') ||
    isDogfoodAdsDisabled() ||
    !areVerifiedAdRewardsEnabled()
  ) {
    return { earned: false, amount: 0, reason: 'ads_disabled' };
  }
  if (AppState.currentState !== 'active') {
    return { earned: false, amount: 0, reason: 'background' };
  }
  if (!appUserId) {
    return {
      earned: false,
      amount: 0,
      provider: 'revenuecat',
      verified: false,
      reason: 'verification_unavailable',
    };
  }
  if (!RewardedAd || !AdEventType || !RewardedAdEventType) {
    return { earned: false, amount: 0, reason: 'module_missing' };
  }

  const readiness = await initializeAds();
  if (!readiness.ready) {
    return {
      earned: false,
      amount: 0,
      reason: readiness.reason ?? 'consent_unavailable',
    };
  }

  const adUnitId = getRewardedUnitId();
  if (!adUnitId) {
    sentryCapture(new Error('rewarded_ad_invalid_config'), {
      context: 'rewarded_ad_invalid_config',
      platform: Platform.OS,
    });
    return { earned: false, amount: 0, reason: 'invalid_config' };
  }

  const impressionId = randomUUID();
  const token = await prepareRevenueCatAdReward(appUserId, impressionId);
  if (!token) {
    // The compatibility provider can still render ordinary ads, but it cannot
    // authorise a Momenta grant. Do not show an optional rewarded ad when the
    // preferred RevenueCat verification path is unavailable.
    sentryBreadcrumb('rewarded_ad_provider_fallback_blocked', {
      preferredProvider: REWARD_AD_PROVIDER_ORDER[0],
      fallbackProvider: REWARD_AD_PROVIDER_ORDER[1],
    });
    return {
      earned: false,
      amount: 0,
      provider: 'admob_compatibility',
      verified: false,
      reason: 'verification_unavailable',
    };
  }

  const trackingData = {
    networkName: null,
    mediatorName: 'AdMob',
    adFormat: 'rewarded',
    placement,
    adUnitId,
    impressionId,
  };

  sentryBreadcrumb('rewarded_ad_load_attempt', {
    provider: 'revenuecat',
    placement,
  });

  try {
    return await new Promise<RewardAdResult>(resolve => {
      const ad = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        serverSideVerificationOptions: {
          userId: token.appUserID,
          customData: token.customData,
        },
      });
      const unsubscribers: (() => void)[] = [];
      let settled = false;
      let earnedCallbackReceived = false;
      let adClosed = false;
      let verificationOutcome: RewardAdResult | null = null;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        while (unsubscribers.length) {
          try {
            unsubscribers.pop()?.();
          } catch {}
        }
      };

      const finish = (result: RewardAdResult) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };

      const finishAfterDismissal = () => {
        if (adClosed && verificationOutcome) {
          finish(verificationOutcome);
        }
      };

      const verifyReward = async () => {
        const verification = await pollRevenueCatAdReward(
          appUserId,
          token.clientTransactionId,
          trackingData
        );
        const verifiedMomenta = verification
          ? findVerifiedMomentaReward([
              verification.reward,
              ...verification.moreRewards,
            ])
          : null;

        if (verification?.failed || !verifiedMomenta) {
          verificationOutcome = {
            earned: false,
            amount: 0,
            provider: 'revenuecat',
            verified: false,
            reason: 'verification_failed',
          };
          finishAfterDismissal();
          return;
        }

        try {
          const receipt = await waitForRevenueCatAdRewardReceipt(
            token.clientTransactionId
          );
          if (receipt?.status === 'applied' && receipt.amount > 0) {
            verificationOutcome = {
              earned: true,
              clientTransactionId: token.clientTransactionId,
              amount: receipt.amount,
              type: verifiedMomenta.code,
              provider: 'revenuecat',
              verified: true,
            };
          } else if (receipt?.reason === 'daily_limit') {
            verificationOutcome = {
              earned: false,
              amount: 0,
              provider: 'revenuecat',
              verified: true,
              reason: 'daily_limit',
            };
          } else if (receipt?.reason === 'cooldown') {
            verificationOutcome = {
              earned: false,
              amount: 0,
              provider: 'revenuecat',
              verified: true,
              reason: 'cooldown',
            };
          } else {
            verificationOutcome = {
              earned: false,
              amount: 0,
              provider: 'revenuecat',
              verified: true,
              reason: 'reward_pending',
            };
          }
        } catch (error) {
          sentryCapture(error, {
            context: 'revenuecat_ad_reward_receipt_failed',
          });
          verificationOutcome = {
            earned: false,
            amount: 0,
            provider: 'revenuecat',
            verified: true,
            reason: 'reward_pending',
          };
        }
        finishAfterDismissal();
      };

      timeout = setTimeout(() => {
        finish({
          earned: false,
          amount: 0,
          provider: 'revenuecat',
          verified: false,
          reason: earnedCallbackReceived ? 'reward_pending' : 'load_failed',
        });
      }, 45_000);

      try {
        unsubscribers.push(
          ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
            void trackRevenueCatAdEvent(appUserId, {
              type: 'loaded',
              data: trackingData,
            });
            if (AppState.currentState !== 'active') {
              finish({ earned: false, amount: 0, reason: 'background' });
              return;
            }
            void Promise.resolve(ad.show()).catch((error: unknown) => {
              sentryCapture(error, {
                context: 'rewarded_ad_show_failed',
              });
              finish({ earned: false, amount: 0, reason: 'show_failed' });
            });
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(AdEventType.OPENED, () => {
            void trackRevenueCatAdEvent(appUserId, {
              type: 'displayed',
              data: trackingData,
            });
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(AdEventType.CLICKED, () => {
            void trackRevenueCatAdEvent(appUserId, {
              type: 'opened',
              data: trackingData,
            });
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(AdEventType.PAID, (paid: unknown) => {
            const value =
              paid && typeof paid === 'object'
                ? Number((paid as Record<string, unknown>).value)
                : Number.NaN;
            const currency =
              paid && typeof paid === 'object'
                ? (paid as Record<string, unknown>).currency
                : null;
            if (
              Number.isFinite(value) &&
              value >= 0 &&
              typeof currency === 'string'
            ) {
              void trackRevenueCatAdEvent(appUserId, {
                type: 'revenue',
                data: {
                  ...trackingData,
                  revenueMicros: Math.round(value * 1_000_000),
                  currency,
                  precision: mapRevenuePrecision(
                    (paid as Record<string, unknown>).precision
                  ),
                },
              });
            }
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            if (earnedCallbackReceived) return;
            earnedCallbackReceived = true;
            void verifyReward();
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(AdEventType.CLOSED, () => {
            adClosed = true;
            if (!earnedCallbackReceived) {
              finish({
                earned: false,
                amount: 0,
                provider: 'revenuecat',
                verified: false,
                reason: 'reward_unconfirmed',
              });
              return;
            }
            finishAfterDismissal();
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(AdEventType.ERROR, (error: unknown) => {
            const noFill = isNoFillErrorPayload(error);
            void trackRevenueCatAdEvent(appUserId, {
              type: 'failed_to_load',
              data: {
                mediatorName: 'AdMob',
                adFormat: 'rewarded',
                placement,
                adUnitId,
                mediatorErrorCode: getAdErrorCode(error),
              },
            });
            sentryBreadcrumb(
              noFill ? 'rewarded_ad_no_fill' : 'rewarded_ad_error',
              { provider: 'revenuecat', placement }
            );
            if (!noFill) {
              sentryCapture(error, { context: 'rewarded_ad_error' });
            }
            finish({
              earned: false,
              amount: 0,
              provider: 'revenuecat',
              verified: false,
              reason: noFill ? 'no_fill' : 'load_failed',
            });
          })
        );
        ad.load();
      } catch (error) {
        sentryCapture(error, { context: 'rewarded_ad_load_failed' });
        finish({ earned: false, amount: 0, reason: 'load_failed' });
      }
    });
  } catch (error) {
    sentryCapture(error, { context: 'rewarded_ad_exception' });
    return { earned: false, amount: 0, reason: 'error' };
  }
}

export async function showRewardedAdDetailed(
  options?: RewardedAdOptions
): Promise<RewardAdResult> {
  const appUserId = options?.appUserId;
  let accountChanged = useAuthStore.getState().user?.id !== appUserId;
  const unsubscribe = useAuthStore.subscribe(state => {
    if (state.user?.id !== appUserId) accountChanged = true;
  });
  let result: RewardAdResult;
  try {
    result = await showRewardedAdDetailedInternal(options);
    if (accountChanged) {
      return { earned: false, amount: 0, reason: 'verification_unavailable' };
    }
  } finally {
    unsubscribe();
  }
  trackProductEvent('Ad Outcome', {
    format: 'rewarded',
    outcome: result.earned
      ? 'earned'
      : result.reason === 'ads_disabled' ||
          result.reason === 'background' ||
          result.reason === 'daily_limit' ||
          result.reason === 'cooldown'
        ? 'skipped'
        : 'failed',
    reason: result.reason ?? 'none',
  });
  return result;
}

export async function showRewardedAd(
  options?: RewardedAdOptions
): Promise<boolean> {
  const res = await showRewardedAdDetailed(options);
  return !!res.earned;
}

export async function getInterstitialAdReadiness(): Promise<InterstitialAdReadiness> {
  if (
    !getOperationalFlag('ads_enabled') ||
    getOperationalFlag('safe_mode') ||
    isDogfoodAdsDisabled()
  ) {
    return { ready: false, reason: 'ads_disabled' };
  }
  if (AppState.currentState !== 'active') {
    return { ready: false, reason: 'background' };
  }
  if (!InterstitialAd || !AdEventType) {
    return { ready: false, reason: 'module_missing' };
  }

  const consent = await initializeAds();
  if (!consent.ready) {
    return {
      ready: false,
      reason: consent.reason ?? 'consent_unavailable',
    };
  }

  if (!getInterstitialUnitId()) {
    return { ready: false, reason: 'invalid_config' };
  }
  return { ready: true };
}

async function showInterstitialAdDetailedInternal(options?: {
  appUserId?: string;
  placement?: string;
}): Promise<InterstitialAdResult> {
  const readiness = await getInterstitialAdReadiness();
  if (!readiness.ready) return { shown: false, reason: readiness.reason };

  const adUnitId = getInterstitialUnitId();
  if (!adUnitId) {
    sentryCapture(new Error('interstitial_ad_invalid_config'), {
      context: 'interstitial_ad_invalid_config',
      platform: Platform.OS,
    });
    return { shown: false, reason: 'invalid_config' };
  }
  const Interstitial = InterstitialAd;
  const InterstitialEvents = AdEventType;
  if (!Interstitial || !InterstitialEvents) {
    return { shown: false, reason: 'module_missing' };
  }

  sentryBreadcrumb('interstitial_ad_load_attempt', { adUnitId });
  const appUserId = options?.appUserId?.trim() || null;
  const placement = options?.placement?.trim() || 'proof_receipt_cadence';
  const impressionId = randomUUID();
  const trackingData = {
    networkName: null,
    mediatorName: 'AdMob',
    adFormat: 'interstitial',
    placement,
    adUnitId,
    impressionId,
  };

  try {
    return await new Promise<InterstitialAdResult>(resolve => {
      const ad = Interstitial.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });
      const unsubscribers: (() => void)[] = [];
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        while (unsubscribers.length) {
          try {
            unsubscribers.pop()?.();
          } catch {}
        }
      };

      const finish = (result: InterstitialAdResult) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        cleanup();
        resolve(result);
      };

      timeout = setTimeout(() => {
        sentryBreadcrumb('interstitial_ad_timeout', { adUnitId });
        finish({ shown: false, reason: 'timeout' });
      }, 10_000);

      try {
        unsubscribers.push(
          ad.addAdEventListener(InterstitialEvents.LOADED, () => {
            if (appUserId) {
              void trackRevenueCatAdEvent(appUserId, {
                type: 'loaded',
                data: trackingData,
              });
            }
            if (AppState.currentState !== 'active') {
              finish({ shown: false, reason: 'background' });
              return;
            }
            try {
              void Promise.resolve(ad.show()).catch((error: unknown) => {
                sentryCapture(error, {
                  context: 'interstitial_ad_show_failed',
                  adUnitId,
                });
                finish({ shown: false, reason: 'show_failed' });
              });
            } catch (error) {
              sentryCapture(error, {
                context: 'interstitial_ad_show_failed',
                adUnitId,
              });
              finish({ shown: false, reason: 'show_failed' });
            }
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(InterstitialEvents.OPENED, () => {
            if (appUserId) {
              void trackRevenueCatAdEvent(appUserId, {
                type: 'displayed',
                data: trackingData,
              });
            }
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(InterstitialEvents.CLICKED, () => {
            if (appUserId) {
              void trackRevenueCatAdEvent(appUserId, {
                type: 'opened',
                data: trackingData,
              });
            }
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(InterstitialEvents.PAID, (paid: unknown) => {
            if (!appUserId || !paid || typeof paid !== 'object') return;
            const record = paid as Record<string, unknown>;
            const value = Number(record.value);
            if (
              !Number.isFinite(value) ||
              value < 0 ||
              typeof record.currency !== 'string'
            ) {
              return;
            }
            void trackRevenueCatAdEvent(appUserId, {
              type: 'revenue',
              data: {
                ...trackingData,
                revenueMicros: Math.round(value * 1_000_000),
                currency: record.currency,
                precision: mapRevenuePrecision(record.precision),
              },
            });
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(InterstitialEvents.CLOSED, () => {
            sentryBreadcrumb('interstitial_ad_closed', { adUnitId });
            finish({ shown: true });
          })
        );
        unsubscribers.push(
          ad.addAdEventListener(InterstitialEvents.ERROR, (error: unknown) => {
            const noFill = isNoFillErrorPayload(error);
            if (appUserId) {
              void trackRevenueCatAdEvent(appUserId, {
                type: 'failed_to_load',
                data: {
                  mediatorName: 'AdMob',
                  adFormat: 'interstitial',
                  placement,
                  adUnitId,
                  mediatorErrorCode: getAdErrorCode(error),
                },
              });
            }
            sentryBreadcrumb(
              noFill ? 'interstitial_ad_no_fill' : 'interstitial_ad_error',
              { placement }
            );
            if (!noFill) {
              sentryCapture(error, {
                context: 'interstitial_ad_error',
                adUnitId,
              });
            }
            finish({
              shown: false,
              reason: noFill ? 'no_fill' : 'load_failed',
            });
          })
        );
        ad.load();
      } catch (error) {
        sentryCapture(error, {
          context: 'interstitial_ad_load_failed',
          adUnitId,
        });
        finish({ shown: false, reason: 'load_failed' });
      }
    });
  } catch (error) {
    sentryCapture(error, {
      context: 'interstitial_ad_load_failed',
      adUnitId,
    });
    return { shown: false, reason: 'load_failed' };
  }
}

export async function showInterstitialAdDetailed(options?: {
  appUserId?: string;
  placement?: string;
}): Promise<InterstitialAdResult> {
  const result = await showInterstitialAdDetailedInternal(options);
  trackProductEvent('Ad Outcome', {
    format: 'interstitial',
    outcome: result.shown
      ? 'shown'
      : result.reason === 'ads_disabled' || result.reason === 'background'
        ? 'skipped'
        : 'failed',
    reason: result.reason ?? 'none',
  });
  return result;
}

const AD_UNAVAILABLE_REASONS: RewardAdResult['reason'][] = [
  'ads_disabled',
  'background',
  'module_missing',
  'invalid_config',
  'no_fill',
  'load_failed',
  'show_failed',
  'consent_required',
  'consent_unavailable',
  'consent_error',
  'verification_unavailable',
  'error',
];

export const isAdUnavailableReason = (
  reason?: RewardAdResult['reason']
): boolean => {
  if (!reason) return false;
  return AD_UNAVAILABLE_REASONS.includes(reason);
};
