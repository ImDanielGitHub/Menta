import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { File, Paths } from 'expo-file-system';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

import { isE2EMode } from '@/lib/e2e';
import { trackProductEvent } from '@/lib/posthog';

export const APP_STORE_NUMERIC_ID = '6747362646';
export const ANDROID_PACKAGE_NAME = 'com.anekedigitalapps.lockedinpro';
export const APP_STORE_WRITE_REVIEW_URL = `https://apps.apple.com/app/id${APP_STORE_NUMERIC_ID}?action=write-review`;
export const PLAY_STORE_WRITE_REVIEW_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}&showAllReviews=true`;

const ACCEPTED_PROOF_COUNT_KEY = '@menta/store-review:accepted-proof-count:v3';
const REVIEW_ELIGIBLE_KEY = '@menta/store-review:eligible:v3';
const LAST_SYSTEM_REQUEST_AT_KEY =
  '@menta/store-review:last-system-request-at:v3';
const LAST_SYSTEM_REQUEST_VERSION_KEY =
  '@menta/store-review:last-system-request-version:v3';
const NATIVE_REQUEST_RETRY_AFTER_KEY =
  '@menta/store-review:native-request-retry-after:v1';
const LEGACY_SYSTEM_REVIEW_REQUESTED_KEY =
  '@menta/store-review:system-review-requested:v2';
const MINIMUM_ACCEPTED_PROOFS = 3;
const activationKey = (ownerId: string) =>
  `@menta/store-review:activation:v1:${ownerId}`;

/** Called only after the onboarding completion RPC confirms this account. */
export const queueActivationReview = async (ownerId: string): Promise<void> => {
  if (isE2EMode() || !ownerId) return;
  try {
    if (!(await AsyncStorage.getItem(activationKey(ownerId)))) {
      await AsyncStorage.setItem(
        activationKey(ownerId),
        new Date().toISOString()
      );
    }
  } catch {
    // A feedback opportunity must never block onboarding completion.
  }
};

export const getActivationReviewAt = (ownerId: string) =>
  AsyncStorage.getItem(activationKey(ownerId));
export const STORE_REVIEW_COOLDOWN_DAYS = 120;
const STORE_REVIEW_COOLDOWN_MS =
  STORE_REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
export const STORE_REVIEW_RETRY_BACKOFF_MINUTES = 15;
const STORE_REVIEW_RETRY_BACKOFF_MS =
  STORE_REVIEW_RETRY_BACKOFF_MINUTES * 60 * 1000;

export type StoreReviewCapability = 'system' | 'testflight' | 'unavailable';
export type StoreReviewOutcome =
  | 'eligible'
  | 'not_eligible'
  | 'requested'
  | 'cooldown'
  | 'retry_backoff'
  | 'same_version'
  | 'in_flight'
  | 'context_changed'
  | 'testflight'
  | 'unavailable'
  | 'failed'
  | 'e2e';

export type SystemStoreReviewResult = {
  capability: StoreReviewCapability;
  outcome: StoreReviewOutcome;
  requested: boolean;
};

export type StoreReviewDebugState = {
  acceptedProofCount: number;
  capability: StoreReviewCapability;
  currentVersion: string;
  eligible: boolean;
  lastRequestedAt: string | null;
  lastRequestedVersion: string | null;
  nativeRequestRetryAfter: string | null;
  requestInFlight: boolean;
};

let requestInFlight = false;

const readStoredValue = async (key: string): Promise<string | null> => {
  const value = await AsyncStorage.getItem(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readAcceptedProofCount = async (): Promise<number> => {
  const value = Number(await AsyncStorage.getItem(ACCEPTED_PROOF_COUNT_KEY));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};

export const getStoreReviewAppVersion = (): string => {
  const version = Application.nativeApplicationVersion?.trim();
  return version && version.length > 0 ? version : 'dev';
};

const hasIosSandboxReceipt = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  try {
    return new File(Paths.bundle, 'StoreKit', 'sandboxReceipt').exists === true;
  } catch {
    return false;
  }
};

const readIosReleaseType = async (): Promise<number | null> => {
  if (Platform.OS !== 'ios') return null;
  if (typeof Application.getIosApplicationReleaseTypeAsync !== 'function') {
    return null;
  }
  try {
    return await Application.getIosApplicationReleaseTypeAsync();
  } catch {
    return null;
  }
};

/**
 * StoreKit has no effect in TestFlight. Production can also suppress a valid
 * request without reporting whether its sheet appeared, so capability proves
 * only that Menta may issue the request.
 */
export const getStoreReviewCapability =
  async (): Promise<StoreReviewCapability> => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return 'unavailable';
    }

    if (Platform.OS === 'ios') {
      const releaseType = await readIosReleaseType();
      const isDebugRelease =
        releaseType === Application.ApplicationReleaseType.SIMULATOR ||
        releaseType === Application.ApplicationReleaseType.DEVELOPMENT;
      if (!isDebugRelease && hasIosSandboxReceipt()) return 'testflight';
    }

    return (await StoreReview.isAvailableAsync()) ? 'system' : 'unavailable';
  };

/** Queue eligibility only after repeated, server-confirmed positive outcomes. */
export const queuePositiveOutcomeReview = async (): Promise<boolean> => {
  try {
    if (isE2EMode()) return false;
    const nextCount = (await readAcceptedProofCount()) + 1;
    await AsyncStorage.setItem(ACCEPTED_PROOF_COUNT_KEY, String(nextCount));
    if (nextCount < MINIMUM_ACCEPTED_PROOFS) return false;
    if (await readStoredValue(REVIEW_ELIGIBLE_KEY)) return true;
    await AsyncStorage.setItem(REVIEW_ELIGIBLE_KEY, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
};

const getLastSystemRequestAt = async (): Promise<string | null> =>
  (await readStoredValue(LAST_SYSTEM_REQUEST_AT_KEY)) ??
  (await readStoredValue(LEGACY_SYSTEM_REVIEW_REQUESTED_KEY));

const getEligibilityOutcome = async (
  capability: StoreReviewCapability,
  now: number,
  activationEligible = false
): Promise<StoreReviewOutcome> => {
  if (isE2EMode()) return 'e2e';
  if (capability === 'testflight') return 'testflight';
  if (capability === 'unavailable') return 'unavailable';
  if (!activationEligible && !(await readStoredValue(REVIEW_ELIGIBLE_KEY)))
    return 'not_eligible';

  const retryAfter = Date.parse(
    (await readStoredValue(NATIVE_REQUEST_RETRY_AFTER_KEY)) ?? ''
  );
  if (Number.isFinite(retryAfter) && now < retryAfter) {
    return 'retry_backoff';
  }

  const currentVersion = getStoreReviewAppVersion();
  const lastVersion = await readStoredValue(LAST_SYSTEM_REQUEST_VERSION_KEY);
  if (lastVersion === currentVersion) return 'same_version';

  const lastRequestedAt = Date.parse((await getLastSystemRequestAt()) ?? '');
  if (
    Number.isFinite(lastRequestedAt) &&
    now - lastRequestedAt < STORE_REVIEW_COOLDOWN_MS
  ) {
    return 'cooldown';
  }
  return 'eligible';
};

/**
 * Issue one system-controlled request after Today settles. This is never called
 * from a button. `requested` means the API call completed; Apple does not expose
 * whether the system actually displayed its sheet.
 */
export const requestEligibleSystemStoreReview = async (
  now = Date.now(),
  ownerId?: string,
  canRequest: () => boolean = () => true
): Promise<SystemStoreReviewResult> => {
  const trigger =
    ownerId && (await getActivationReviewAt(ownerId).catch(() => null))
      ? 'onboarding_activation'
      : 'accepted_proofs';
  if (requestInFlight) {
    trackProductEvent('Store Review Request', {
      capability: 'unavailable',
      outcome: 'in_flight',
      trigger,
    });
    return {
      capability: 'unavailable',
      outcome: 'in_flight',
      requested: false,
    };
  }

  requestInFlight = true;
  let capability: StoreReviewCapability = 'unavailable';
  try {
    capability = await getStoreReviewCapability();
  } catch {
    trackProductEvent('Store Review Request', {
      capability,
      error_code: 'capability_probe_failed',
      failure_stage: 'capability',
      outcome: 'failed',
      trigger,
    });
    requestInFlight = false;
    return { capability, outcome: 'failed', requested: false };
  }

  let outcome: StoreReviewOutcome;
  try {
    outcome = await getEligibilityOutcome(
      capability,
      now,
      trigger === 'onboarding_activation'
    );
  } catch {
    trackProductEvent('Store Review Request', {
      capability,
      error_code: 'storage_read_failed',
      failure_stage: 'eligibility',
      outcome: 'failed',
      trigger,
    });
    requestInFlight = false;
    return { capability, outcome: 'failed', requested: false };
  }

  try {
    if (outcome !== 'eligible') {
      trackProductEvent('Store Review Request', {
        capability,
        outcome,
        trigger,
      });
      return { capability, outcome, requested: false };
    }

    trackProductEvent('Store Review Request', {
      capability,
      outcome: 'eligible',
      trigger,
    });
    if (!canRequest()) {
      trackProductEvent('Store Review Request', {
        capability,
        outcome: 'context_changed',
        trigger,
      });
      return { capability, outcome: 'context_changed', requested: false };
    }
    try {
      await StoreReview.requestReview();
    } catch {
      const retryAfter = new Date(
        now + STORE_REVIEW_RETRY_BACKOFF_MS
      ).toISOString();
      try {
        await AsyncStorage.setItem(NATIVE_REQUEST_RETRY_AFTER_KEY, retryAfter);
      } catch {
        // The closed diagnostic below remains useful without exposing the error.
      }
      trackProductEvent('Store Review Request', {
        capability,
        error_code: 'native_request_rejected',
        failure_stage: 'native_request',
        outcome: 'failed',
        trigger,
      });
      return { capability, outcome: 'failed', requested: false };
    }

    const requestedAt = new Date(now).toISOString();
    try {
      await AsyncStorage.multiSet([
        [LAST_SYSTEM_REQUEST_AT_KEY, requestedAt],
        [LAST_SYSTEM_REQUEST_VERSION_KEY, getStoreReviewAppVersion()],
        [NATIVE_REQUEST_RETRY_AFTER_KEY, ''],
        [REVIEW_ELIGIBLE_KEY, ''],
      ]);
    } catch {
      trackProductEvent('Store Review Request', {
        capability,
        error_code: 'storage_write_failed',
        failure_stage: 'success_persistence',
        outcome: 'failed',
        trigger,
      });
      return { capability, outcome: 'failed', requested: true };
    }
    trackProductEvent('Store Review Request', {
      capability,
      outcome: 'requested',
      trigger,
    });
    return { capability, outcome: 'requested', requested: true };
  } finally {
    requestInFlight = false;
  }
};

export const getStoreReviewDebugState = async (
  ownerId?: string
): Promise<StoreReviewDebugState> => ({
  acceptedProofCount: await readAcceptedProofCount(),
  capability: await getStoreReviewCapability(),
  currentVersion: getStoreReviewAppVersion(),
  eligible: Boolean(
    (ownerId && (await getActivationReviewAt(ownerId))) ||
    (await readStoredValue(REVIEW_ELIGIBLE_KEY))
  ),
  lastRequestedAt: await getLastSystemRequestAt(),
  lastRequestedVersion: await readStoredValue(LAST_SYSTEM_REQUEST_VERSION_KEY),
  nativeRequestRetryAfter: await readStoredValue(
    NATIVE_REQUEST_RETRY_AFTER_KEY
  ),
  requestInFlight,
});

export const getStoreWriteReviewUrl = (): string | null => {
  if (Platform.OS === 'ios') return APP_STORE_WRITE_REVIEW_URL;
  if (Platform.OS === 'android') return PLAY_STORE_WRITE_REVIEW_URL;
  return null;
};

export const openStoreWriteReview = async (): Promise<boolean> => {
  const storeUrl = getStoreWriteReviewUrl();
  const capability: StoreReviewCapability = storeUrl ? 'system' : 'unavailable';
  if (!storeUrl) {
    trackProductEvent('Store Review Request', {
      capability,
      error_code: 'store_link_unavailable',
      failure_stage: 'settings',
      outcome: 'store_page_failed',
      trigger: 'settings',
    });
    return false;
  }
  try {
    await Linking.openURL(storeUrl);
    trackProductEvent('Store Review Request', {
      capability,
      outcome: 'store_page_opened',
      trigger: 'settings',
    });
    return true;
  } catch {
    trackProductEvent('Store Review Request', {
      capability,
      error_code: 'store_link_open_failed',
      failure_stage: 'settings',
      outcome: 'store_page_failed',
      trigger: 'settings',
    });
    return false;
  }
};
