import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type {
  AdDisplayedData,
  AdFailedToLoadData,
  AdLoadedData,
  AdOpenedData,
  AdRevenueData,
  RewardVerificationResult,
  RewardVerificationToken,
  RewardedAdTrackingMetadata,
  CustomerInfo,
  LOG_LEVEL,
  LogInResult,
  MakePurchaseResult,
  PACKAGE_TYPE,
  PurchasesConfiguration,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import { showGlobalToast } from '@/lib/toast-provider';
import { translate } from '@/lib/localization/translate';
import { getMyProAuthority } from '@/lib/profile-api';
import { useAuthStore } from '@/store/auth-store';
import {
  addBreadcrumb as sentryBreadcrumb,
  captureError as sentryCapture,
} from '@/lib/sentry';

const TOAST_ERROR = 'error' as const;

/**
 * RevenueCat helpers with runtime guards for unsupported platforms.
 *
 * The native SDK is available in EAS builds, but not in Expo Go or web
 * previews. Keep all purchase calls behind this module so App Store review
 * behavior stays consistent across paywalls, restore, and quota gates.
 */
const APP_OWNERSHIP = Constants.appOwnership;
const RUNNING_IN_EXPO_GO = APP_OWNERSHIP === 'expo';
const IS_BROWSER = Platform.OS === 'web';
export const REVENUECAT_SUPPORTED = !RUNNING_IN_EXPO_GO && !IS_BROWSER;

export type ProPlan = 'weekly' | 'monthly' | 'annual';
export type CreditPack = 'small' | 'medium' | 'large';

export type PurchaseResult = {
  success: boolean;
  cancelled?: boolean;
  /** Apple/store flow returned, but Menta has not confirmed Pro access yet. */
  entitlementPending?: boolean;
  /**
   * The store returned from a consumable purchase, but Menta's webhook has
   * not yet confirmed the wallet credit. This must never be rendered as a
   * completed Momenta top-up.
   */
  receiptPending?: boolean;
  /** The native purchase call returned without throwing. */
  storeTransactionCompleted?: boolean;
  errorMessage?: string;
};

type PurchasesClient = {
  getAppUserID?: () => Promise<string>;
  generateRewardVerificationToken?: (
    impressionId: string
  ) => Promise<RewardVerificationToken>;
  pollRewardVerification?: (
    clientTransactionId: string,
    trackingMetadata?: RewardedAdTrackingMetadata
  ) => Promise<RewardVerificationResult>;
  adTracker?: {
    trackAdDisplayed?: (data: AdDisplayedData) => Promise<void>;
    trackAdOpened?: (data: AdOpenedData) => Promise<void>;
    trackAdLoaded?: (data: AdLoadedData) => Promise<void>;
    trackAdRevenue?: (data: AdRevenueData) => Promise<void>;
    trackAdFailedToLoad?: (data: AdFailedToLoadData) => Promise<void>;
  };
  configure?: (configuration: PurchasesConfiguration) => void | Promise<void>;
  getCustomerInfo?: () => Promise<CustomerInfo>;
  getOfferings?: () => Promise<PurchasesOfferings>;
  checkTrialOrIntroductoryPriceEligibility?: (
    ids: string[]
  ) => Promise<Record<string, { status: number }>>;
  invalidateCustomerInfoCache?: () => Promise<void>;
  logIn?: (appUserId: string) => Promise<LogInResult>;
  logOut?: () => Promise<CustomerInfo>;
  purchasePackage?: (
    packageToPurchase: PurchasesPackage
  ) => Promise<MakePurchaseResult>;
  restorePurchases?: () => Promise<CustomerInfo>;
  setLogLevel?: (level: LOG_LEVEL) => void | Promise<void>;
  showManageSubscriptions?: () => Promise<void>;
  LOG_LEVEL?: {
    DEBUG: LOG_LEVEL;
    WARN?: LOG_LEVEL;
    ERROR: LOG_LEVEL;
  };
  PACKAGE_TYPE?: {
    WEEKLY: PACKAGE_TYPE;
    MONTHLY: PACKAGE_TYPE;
    ANNUAL: PACKAGE_TYPE;
  };
};

type PurchasesModule = PurchasesClient & {
  default?: PurchasesClient;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const getErrorMessage = (error: unknown, fallback = ''): string => {
  if (error instanceof Error) return error.message;
  if (isRecord(error)) return readString(error.message) ?? fallback;
  return fallback;
};

const wasUserCancelled = (error: unknown): boolean =>
  isRecord(error) && error.userCancelled === true;

const getPurchasesMember = <Key extends keyof PurchasesClient>(
  module: PurchasesModule,
  key: Key
): PurchasesClient[Key] => {
  const owner = module[key] !== undefined ? module : module.default;
  const member = module[key] ?? module.default?.[key];

  if (typeof member === 'function' && owner) {
    return member.bind(owner) as PurchasesClient[Key];
  }

  return member;
};

const isPurchasesOffering = (value: unknown): value is PurchasesOffering =>
  isRecord(value) &&
  typeof value.identifier === 'string' &&
  Array.isArray(value.availablePackages);

const getOfferingValues = (value: unknown): PurchasesOffering[] => {
  if (Array.isArray(value)) return value.filter(isPurchasesOffering);
  if (!isRecord(value)) return [];
  return Object.values(value).filter(isPurchasesOffering);
};

const hasActiveProEntitlement = (active: Record<string, unknown>): boolean =>
  Boolean(active['pro_access'] || active['Pro'] || active['pro']);

const expoExtra = isRecord(Constants.expoConfig?.extra)
  ? Constants.expoConfig.extra
  : {};

const IOS_RC_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ||
  readString(expoExtra.revenuecatIosKey) ||
  'appl_xxx_replace_me';
const ANDROID_RC_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ||
  readString(expoExtra.revenuecatAndroidKey) ||
  'goog_xxx_replace_me';

// Purchases are unavailable in Expo Go or browser preview; use an EAS dev build to test IAPs.

// Internal configuration state to avoid UninitializedPurchasesError
let isConfigured = false;
let configurePromise: Promise<void> | null = null;
let desiredAppUserId: string | undefined;

const SERVER_CONFIRM_ATTEMPTS = 3;
const SERVER_CONFIRM_INTERVAL_MS = 500;

async function getPurchasesModule(): Promise<PurchasesModule | null> {
  if (Platform.OS === 'web') return null;
  try {
    // Dynamic import to avoid bundling issues on platforms without native module
    const mod: PurchasesModule = await import('react-native-purchases');
    return mod;
  } catch (e) {
    console.warn('[RevenueCat] SDK not available:', e);
    return null;
  }
}

async function configureInternal(appUserId?: string): Promise<void> {
  const RC = await getPurchasesModule();
  if (!RC) return;
  try {
    sentryBreadcrumb('revenuecat_init_start', { userId: appUserId });
    const apiKey = Platform.OS === 'ios' ? IOS_RC_API_KEY : ANDROID_RC_API_KEY;
    if (!apiKey || apiKey.endsWith('_replace_me')) {
      console.warn(
        '[RevenueCat] Missing SDK key. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS/ANDROID or edit lib/paywall/revenuecat.ts'
      );
      sentryBreadcrumb('revenuecat_init_skipped', {
        reason: 'missing_api_key',
        platform: Platform.OS,
      });
      return;
    }
    const configure = getPurchasesMember(RC, 'configure');
    if (typeof configure === 'function') {
      await configure({ apiKey, appUserID: appUserId });
    }
    const setLogLevel = getPurchasesMember(RC, 'setLogLevel');
    const logLevels = getPurchasesMember(RC, 'LOG_LEVEL');
    if (setLogLevel && logLevels) {
      const logLevel = __DEV__
        ? logLevels.DEBUG
        : (logLevels.WARN ?? logLevels.ERROR);
      if (logLevel) {
        await setLogLevel(logLevel);
      }
    }
    isConfigured = true;
    if (__DEV__) {
      console.warn('[RevenueCat] Initialized for user:', appUserId);
    }
    sentryBreadcrumb('revenuecat_init_success', {
      userId: appUserId,
      platform: Platform.OS,
    });
  } catch (e) {
    console.warn('[RevenueCat] Initialization failed:', e);
    sentryCapture(e, { context: 'revenuecat_init_failed' });
  }
}

async function ensureInitialized(appUserId?: string): Promise<boolean> {
  if (appUserId) {
    desiredAppUserId = appUserId;
  }
  if (isConfigured) return true;
  if (!configurePromise) {
    configurePromise = configureInternal(desiredAppUserId);
  }
  const activeAttempt = configurePromise;
  try {
    await activeAttempt;
    return isConfigured;
  } catch {
    return false;
  } finally {
    // A failed or skipped configuration must not poison every future retry.
    // Keep the shared promise only after the native SDK is configured.
    if (!isConfigured && configurePromise === activeAttempt) {
      configurePromise = null;
    }
  }
}

async function getPurchasesForAccount(
  appUserId: string
): Promise<PurchasesModule | null> {
  if (!appUserId || useAuthStore.getState().user?.id !== appUserId) return null;

  const initialized = await ensureInitialized(appUserId);
  if (!initialized) return null;

  const RC = await getPurchasesModule();
  if (!RC) return null;

  const getAppUserID = getPurchasesMember(RC, 'getAppUserID');
  if (typeof getAppUserID !== 'function') return null;

  // Account lifecycle owns SDK identity. An ad must never rebind purchases
  // after a delayed callback from a previous account.
  const currentAppUserId = await getAppUserID();

  if (currentAppUserId !== appUserId) {
    sentryCapture(new Error('revenuecat_ad_account_mismatch'), {
      context: 'revenuecat_ad_account_mismatch',
    });
    return null;
  }

  return useAuthStore.getState().user?.id === appUserId ? RC : null;
}

export async function prepareRevenueCatAdReward(
  appUserId: string,
  impressionId: string
): Promise<RewardVerificationToken | null> {
  try {
    const RC = await getPurchasesForAccount(appUserId);
    if (!RC) return null;

    const generateToken = getPurchasesMember(
      RC,
      'generateRewardVerificationToken'
    );
    if (typeof generateToken !== 'function') return null;

    const token = await generateToken(impressionId);
    if (
      !token ||
      token.appUserID !== appUserId ||
      !token.clientTransactionId ||
      !token.customData
    ) {
      sentryCapture(new Error('revenuecat_ad_token_invalid'), {
        context: 'revenuecat_ad_token_invalid',
      });
      return null;
    }

    return token;
  } catch (error) {
    sentryCapture(error, { context: 'revenuecat_ad_token_failed' });
    return null;
  }
}

export async function pollRevenueCatAdReward(
  appUserId: string,
  clientTransactionId: string,
  trackingMetadata: RewardedAdTrackingMetadata
): Promise<RewardVerificationResult | null> {
  try {
    const RC = await getPurchasesForAccount(appUserId);
    if (!RC) return null;

    const pollReward = getPurchasesMember(RC, 'pollRewardVerification');
    if (typeof pollReward !== 'function') return null;
    return await pollReward(clientTransactionId, trackingMetadata);
  } catch (error) {
    sentryCapture(error, { context: 'revenuecat_ad_verification_failed' });
    return null;
  }
}

type RevenueCatAdTrackingPayload =
  | { type: 'loaded'; data: AdLoadedData }
  | { type: 'displayed'; data: AdDisplayedData }
  | { type: 'opened'; data: AdOpenedData }
  | { type: 'revenue'; data: AdRevenueData }
  | { type: 'failed_to_load'; data: AdFailedToLoadData };

export async function trackRevenueCatAdEvent(
  appUserId: string,
  payload: RevenueCatAdTrackingPayload
): Promise<boolean> {
  try {
    const RC = await getPurchasesForAccount(appUserId);
    const tracker = RC?.adTracker ?? RC?.default?.adTracker;
    if (!tracker) return false;

    switch (payload.type) {
      case 'loaded':
        await tracker.trackAdLoaded?.(payload.data);
        break;
      case 'displayed':
        await tracker.trackAdDisplayed?.(payload.data);
        break;
      case 'opened':
        await tracker.trackAdOpened?.(payload.data);
        break;
      case 'revenue':
        await tracker.trackAdRevenue?.(payload.data);
        break;
      case 'failed_to_load':
        await tracker.trackAdFailedToLoad?.(payload.data);
        break;
    }
    return true;
  } catch (error) {
    // Ad reporting must not block a proof receipt, ad dismissal, or reward
    // verification. RevenueCat remains the preferred analytics sink while the
    // serving SDK owns the visible ad lifecycle.
    sentryCapture(error, { context: 'revenuecat_ad_tracking_failed' });
    return false;
  }
}

async function readServerProStatus(): Promise<boolean | null> {
  try {
    const authority = await getMyProAuthority();
    if (!authority) return null;
    if (authority.reconciliation_pending) {
      sentryBreadcrumb('server_pro_reconciliation_pending', {});
    }
    return authority.is_pro === true;
  } catch (error) {
    sentryCapture(error, { context: 'server_pro_status_failed' });
    return null;
  }
}

async function readSdkProStatus(refresh = false): Promise<boolean | null> {
  try {
    const ok = await ensureInitialized();
    if (!ok) return null;
    const RC = await getPurchasesModule();
    if (!RC) return null;

    if (refresh) {
      const invalidate = getPurchasesMember(RC, 'invalidateCustomerInfoCache');
      if (typeof invalidate === 'function') {
        await invalidate();
      }
    }

    const getCustomerInfo = getPurchasesMember(RC, 'getCustomerInfo');
    if (typeof getCustomerInfo !== 'function') return null;
    const { entitlements } = await getCustomerInfo();
    return hasActiveProEntitlement(entitlements?.active || {});
  } catch (error) {
    sentryCapture(error, {
      context: refresh ? 'refreshCustomerInfo_failed' : 'isPro_failed',
    });
    return null;
  }
}

const wait = (durationMs: number) =>
  new Promise<void>(resolve => setTimeout(resolve, durationMs));

export async function confirmServerProAccess(options?: {
  attempts?: number;
  intervalMs?: number;
}): Promise<boolean> {
  const attempts = Math.max(
    1,
    Math.floor(options?.attempts ?? SERVER_CONFIRM_ATTEMPTS)
  );
  const intervalMs = Math.max(
    0,
    Math.floor(options?.intervalMs ?? SERVER_CONFIRM_INTERVAL_MS)
  );

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const serverStatus = await readServerProStatus();
    if (serverStatus === true) return true;
    if (attempt < attempts - 1 && intervalMs > 0) {
      await wait(intervalMs);
    }
  }

  return false;
}

export const RevenueCatAPI = {
  initialize: async (appUserId?: string) => {
    await ensureInitialized(appUserId);
  },
  // Business gates use only the receipt-aware server projection. RevenueCat
  // SDK state can be fresher, but it cannot set costs or bypass quota checks.
  isPro: async (): Promise<boolean> => {
    const serverStatus = await readServerProStatus();
    return serverStatus === true;
  },
  // Refresh the device receipt cache, then read the server-owned gate. The
  // return value must never promote SDK-only entitlement state.
  refreshCustomerInfo: async (): Promise<boolean> => {
    await readSdkProStatus(true);
    const serverStatus = await readServerProStatus();
    return serverStatus === true;
  },
  confirmServerProAccess,
  isInitialized: () => isConfigured,
  logIn: async (appUserId?: string) => {
    if (!appUserId) return;
    desiredAppUserId = appUserId;
    try {
      const RC = await getPurchasesModule();
      if (!RC) return;
      const logIn = getPurchasesMember(RC, 'logIn');
      if (typeof logIn === 'function') {
        const initialized = await ensureInitialized(appUserId);
        if (!initialized) return;
        await logIn(appUserId);
        sentryBreadcrumb('revenuecat_login_success', {
          userId: appUserId,
        });
      }
    } catch (e) {
      sentryCapture(e, {
        context: 'revenuecat_login_failed',
        userId: appUserId,
      });
    }
  },
  logOut: async () => {
    try {
      if (!isConfigured) return;
      const RC = await getPurchasesModule();
      if (!RC) return;
      const logOut = getPurchasesMember(RC, 'logOut');
      if (typeof logOut === 'function') {
        await logOut();
        sentryBreadcrumb('revenuecat_logout_success', {});
      }
    } catch (e) {
      sentryCapture(e, { context: 'revenuecat_logout_failed' });
    } finally {
      isConfigured = false;
      configurePromise = null;
      desiredAppUserId = undefined;
    }
  },
  getOfferings: async (): Promise<PurchasesOfferings | null> => {
    try {
      const ok = await ensureInitialized();
      if (!ok) return null;
      const RC = await getPurchasesModule();
      if (!RC) return null;
      const getOfferings = getPurchasesMember(RC, 'getOfferings');
      if (!getOfferings) return null;
      return await getOfferings();
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      if (
        msg.toLowerCase().includes('no singleton') ||
        msg.toLowerCase().includes('uninitialized')
      ) {
        sentryCapture(e, { context: 'getOfferings_uninitialized' });
        return null;
      }
      sentryCapture(e, { context: 'getOfferings_failed' });
      return null;
    }
  },
  isIntroEligible: async (productId: string): Promise<boolean> => {
    if (!REVENUECAT_SUPPORTED || Platform.OS !== 'ios') return false;
    try {
      if (!(await ensureInitialized())) return false;
      const RC = await getPurchasesModule();
      if (!RC) return false;
      const check = getPurchasesMember(
        RC,
        'checkTrialOrIntroductoryPriceEligibility'
      );
      if (!check) return false;
      const result = await check([productId]);
      // RevenueCat INTRO_ELIGIBILITY_STATUS_ELIGIBLE. Unknown is not an offer.
      return result[productId]?.status === 2;
    } catch {
      return false;
    }
  },
  showManageSubscriptions: async (): Promise<boolean> => {
    try {
      const ok = await ensureInitialized();
      if (!ok) return false;
      const RC = await getPurchasesModule();
      if (!RC) return false;
      const showManageSubscriptions = getPurchasesMember(
        RC,
        'showManageSubscriptions'
      );
      if (typeof showManageSubscriptions !== 'function') return false;
      await showManageSubscriptions();
      return true;
    } catch (error) {
      sentryCapture(error, { context: 'showManageSubscriptions_failed' });
      return false;
    }
  },
  getCreditOfferings: async (): Promise<PurchasesOffering | null> => {
    try {
      const ok = await ensureInitialized();
      if (!ok) return null;
      const RC = await getPurchasesModule();
      if (!RC) return null;
      const getOfferings = getPurchasesMember(RC, 'getOfferings');
      if (!getOfferings) return null;
      const offerings = await getOfferings();
      const all = getOfferingValues(offerings.all);
      // Support both map and array forms returned by SDKs
      const creditOffering = all.find(
        offering => offering.identifier === 'credit_shop'
      );
      return creditOffering || offerings.current;
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      if (
        msg.toLowerCase().includes('no singleton') ||
        msg.toLowerCase().includes('uninitialized')
      ) {
        sentryCapture(e, { context: 'getCreditOfferings_uninitialized' });
        return null;
      }
      sentryCapture(e, { context: 'getCreditOfferings_failed' });
      return null;
    }
  },
};

export async function purchasePlan(plan: ProPlan): Promise<PurchaseResult> {
  // Log when the user taps a plan to aid TestFlight debugging
  try {
    sentryBreadcrumb('rc_purchase_plan_tap', { plan });
  } catch {}
  const ok = await ensureInitialized();
  if (!ok) {
    sentryBreadcrumb('rc_purchase_plan_init_failed', { plan });
    showGlobalToast(
      translate('en-NZ', 'commerce.paywall.revenueCat.notInitializedDetail'),
      'error'
    );
    return {
      success: false,
      errorMessage: translate(
        'en-NZ',
        'commerce.paywall.revenueCat.notInitialized'
      ),
    };
  }
  const RC = await getPurchasesModule();
  if (!RC) {
    sentryBreadcrumb('rc_purchase_plan_sdk_unavailable', {
      plan,
      platform: Platform.OS,
    });
    showGlobalToast(
      translate('en-NZ', 'commerce.paywall.revenueCat.unavailableDetail'),
      'error'
    );
    return {
      success: false,
      errorMessage: translate(
        'en-NZ',
        'commerce.paywall.revenueCat.unavailable'
      ),
    };
  }
  try {
    sentryBreadcrumb('rc_purchase_plan_attempt', { plan });
    const getOfferings = getPurchasesMember(RC, 'getOfferings');
    if (!getOfferings) {
      throw new Error('RevenueCat getOfferings is unavailable');
    }
    const offerings = await getOfferings();

    // Build a unified list of candidate packages from current and all offerings
    const allOfferingsArray = getOfferingValues(offerings.all);

    let current = offerings.current;
    if (!current && allOfferingsArray.length > 0) {
      const first =
        allOfferingsArray.find(
          offering => offering.availablePackages.length > 0
        ) || null;
      if (first) {
        current = first;
        try {
          sentryBreadcrumb('rc_purchase_plan_used_first_offering_fallback', {
            plan,
          });
        } catch {}
      }
    }
    if (!current) {
      sentryBreadcrumb('rc_purchase_plan_no_current_offering', { plan });
      showGlobalToast(
        translate('en-NZ', 'commerce.paywall.revenueCat.noCurrentOffering'),
        'error'
      );
      return {
        success: false,
        errorMessage: translate(
          'en-NZ',
          'commerce.paywall.revenueCat.noCurrentOfferingShort'
        ),
      };
    }

    const packageTypes = getPurchasesMember(RC, 'PACKAGE_TYPE');
    const wantedType =
      plan === 'weekly'
        ? packageTypes?.WEEKLY
        : plan === 'monthly'
          ? packageTypes?.MONTHLY
          : packageTypes?.ANNUAL;

    // Primary: match by packageType in current
    let pkg = current.availablePackages.find(
      candidate =>
        wantedType !== undefined && candidate.packageType === wantedType
    );

    // Secondary: match by canonical RC identifier in current
    if (!pkg) {
      const idIncludes = 'rc_' + plan;
      pkg = current.availablePackages.find(candidate =>
        candidate.identifier.includes(idIncludes)
      );
    }

    // Tertiary: match by product identifier pattern in current
    if (!pkg) {
      const desiredProductSubstr =
        plan === 'annual' ? 'pro_yearly' : 'pro_' + plan;
      const desiredPrefix = 'com.anekedigitalapps.lockedin.';
      pkg =
        current.availablePackages.find(candidate => {
          const pid = candidate.product.identifier;
          return (
            pid.startsWith(desiredPrefix) && pid.includes(desiredProductSubstr)
          );
        }) ||
        current.availablePackages.find(candidate =>
          candidate.product.identifier.includes(desiredProductSubstr)
        );
    }

    // Final fallback: search across all offerings for a matching product
    if (!pkg && allOfferingsArray.length > 0) {
      const desiredProductSubstr =
        plan === 'annual' ? 'pro_yearly' : 'pro_' + plan;
      for (const off of allOfferingsArray) {
        const found = off.availablePackages.find(candidate => {
          const pid = candidate.product.identifier;
          const id = candidate.identifier;
          return (
            id.includes('rc_' + plan) || pid.includes(desiredProductSubstr)
          );
        });
        if (found) {
          pkg = found;
          break;
        }
      }
      if (pkg) {
        try {
          sentryBreadcrumb('rc_purchase_plan_cross_offering_match', {
            plan,
            packageIdentifier: pkg.identifier,
          });
        } catch {}
      }
    }

    if (!pkg) {
      const available = current.availablePackages.map(candidate => ({
        identifier: candidate.identifier,
        productId: candidate.product.identifier,
        packageType: candidate.packageType,
      }));
      sentryCapture(new Error('rc_package_not_found'), {
        plan,
        context: 'purchasePlan',
        offeringsCurrentId: current.identifier,
        offeringsAllCount: allOfferingsArray.length,
        availablePackages: available,
      });
      showGlobalToast(
        translate('en-NZ', 'commerce.paywall.revenueCat.planPackageMissing'),
        'error'
      );
      return {
        success: false,
        errorMessage: translate(
          'en-NZ',
          'commerce.paywall.revenueCat.packageMissing'
        ),
      };
    }

    const purchasePackage = getPurchasesMember(RC, 'purchasePackage');
    if (!purchasePackage) {
      throw new Error('RevenueCat purchasePackage is unavailable');
    }
    try {
      sentryBreadcrumb('rc_purchase_plan_package_selected', {
        plan,
        packageIdentifier: pkg.identifier,
        productId: pkg.product.identifier,
      });
    } catch {}
    showGlobalToast(
      translate('en-NZ', 'commerce.paywall.revenueCat.startingPurchase'),
      'info'
    );
    const { customerInfo } = await purchasePackage(pkg);

    // CRITICAL FIX: Log detailed entitlement information for debugging
    try {
      const allEntitlements = customerInfo?.entitlements?.all || {};
      const activeEntitlements = customerInfo?.entitlements?.active || {};
      sentryBreadcrumb('rc_purchase_plan_entitlements_received', {
        plan,
        allEntitlementKeys: Object.keys(allEntitlements),
        activeEntitlementKeys: Object.keys(activeEntitlements),
        hasProAccessActive: Boolean(activeEntitlements['pro_access']),
        hasProActive: Boolean(activeEntitlements['Pro']),
        productIdentifier: pkg.product.identifier,
      });
    } catch {}

    const entitlements = customerInfo?.entitlements?.active || {};
    let hasPro = hasActiveProEntitlement(entitlements);

    if (hasPro && !entitlements['pro_access']) {
      try {
        sentryBreadcrumb('rc_purchase_plan_using_legacy_pro_key', {
          plan,
        });
      } catch {}
    }

    // CRITICAL FIX: If we still don't have the entitlement, try refreshing customer info
    if (!hasPro) {
      try {
        sentryBreadcrumb('rc_purchase_plan_refreshing_entitlements', {
          plan,
        });
        const getCustomerInfo = getPurchasesMember(RC, 'getCustomerInfo');
        if (typeof getCustomerInfo === 'function') {
          const refreshedInfo = await getCustomerInfo();
          const refreshedEntitlements =
            refreshedInfo?.entitlements?.active || {};
          hasPro = hasActiveProEntitlement(refreshedEntitlements);
          if (hasPro) {
            sentryBreadcrumb(
              'rc_purchase_plan_entitlement_found_after_refresh',
              { plan }
            );
          }
        }
      } catch (refreshError) {
        sentryCapture(refreshError, {
          context: 'purchasePlan_refresh_failed',
          plan,
        });
      }
    }

    const serverConfirmed = await confirmServerProAccess();

    sentryBreadcrumb('rc_purchase_plan_result', {
      plan,
      success: serverConfirmed,
      revenueCatHasPro: hasPro,
      serverConfirmed,
      productId: pkg.product.identifier,
    });

    if (!hasPro && !serverConfirmed) {
      console.warn(
        '[RevenueCat] Purchase completed but entitlement not active. This may indicate a configuration issue.'
      );
      sentryCapture(new Error('rc_purchase_no_entitlement_activated'), {
        plan,
        context: 'purchasePlan_success_but_no_entitlement',
        productId: pkg.product.identifier,
        packageId: pkg.identifier,
      });
    }

    if (!serverConfirmed) {
      return {
        success: false,
        entitlementPending: true,
        storeTransactionCompleted: true,
        errorMessage: translate(
          'en-NZ',
          'commerce.paywall.revenueCat.purchaseAccessPending'
        ),
      };
    }

    return { success: true, storeTransactionCompleted: true };
  } catch (e: unknown) {
    if (wasUserCancelled(e)) {
      sentryBreadcrumb('rc_purchase_plan_cancelled', { plan });
      return { success: false, cancelled: true };
    }
    sentryCapture(e, { context: 'purchasePlan_failed', plan });
    const message = getErrorMessage(e, 'Purchase failed');
    showGlobalToast(message, TOAST_ERROR);
    return { success: false, errorMessage: message };
  }
}

export async function purchaseCredits(
  size: CreditPack
): Promise<PurchaseResult> {
  // Log when the user taps a credits pack to aid TestFlight debugging
  try {
    sentryBreadcrumb('rc_purchase_credits_tap', { size });
  } catch {}
  const ok = await ensureInitialized();
  if (!ok) {
    sentryBreadcrumb('rc_purchase_credits_init_failed', { size });
    showGlobalToast(
      translate('en-NZ', 'commerce.paywall.revenueCat.notInitializedDetail'),
      TOAST_ERROR
    );
    return {
      success: false,
      errorMessage: translate(
        'en-NZ',
        'commerce.paywall.revenueCat.notInitialized'
      ),
    };
  }
  const RC = await getPurchasesModule();
  if (!RC) {
    sentryBreadcrumb('rc_purchase_credits_sdk_unavailable', {
      size,
      platform: Platform.OS,
    });
    showGlobalToast(
      translate('en-NZ', 'commerce.paywall.revenueCat.unavailableDetail'),
      TOAST_ERROR
    );
    return {
      success: false,
      errorMessage: translate(
        'en-NZ',
        'commerce.paywall.revenueCat.unavailable'
      ),
    };
  }
  try {
    sentryBreadcrumb('rc_purchase_credits_attempt', { size });
    const getOfferings = getPurchasesMember(RC, 'getOfferings');
    if (!getOfferings) {
      throw new Error('RevenueCat getOfferings is unavailable');
    }
    const offerings = await getOfferings();

    // Try to find Credit Shop offering first, fallback to default
    const all = getOfferingValues(offerings.all);
    // Support both map and array forms returned by SDKs
    let offering = all.find(
      candidate => candidate.identifier === 'credit_shop'
    );
    if (!offering) offering = offerings.current ?? undefined;
    if (!offering) {
      sentryBreadcrumb('rc_purchase_credits_no_offering', { size });
      showGlobalToast(
        translate('en-NZ', 'commerce.paywall.revenueCat.noCreditOffering'),
        TOAST_ERROR
      );
      return {
        success: false,
        errorMessage: translate(
          'en-NZ',
          'commerce.paywall.revenueCat.noCreditOfferingShort'
        ),
      };
    }

    const match =
      size === 'small'
        ? 'credits_small'
        : size === 'medium'
          ? 'credits_medium'
          : 'credits_large';
    let pkg = offering.availablePackages.find(
      candidate => candidate.identifier === match
    );
    if (!pkg) {
      // Fallback: match by product identifier substring
      pkg = offering.availablePackages.find(candidate =>
        candidate.product.identifier.includes(match)
      );
    }
    if (!pkg) {
      // Final fallback: try to match by full product ID pattern
      const productIdPattern = `com.anekedigitalapps.lockedin.credits_${size}`;
      pkg = offering.availablePackages.find(
        candidate => candidate.product.identifier === productIdPattern
      );
    }
    if (!pkg) {
      console.error('[RevenueCat] Credit package not found:', {
        size,
        offering: offering.identifier,
        availablePackages: offering.availablePackages.map(candidate => ({
          identifier: candidate.identifier,
          productId: candidate.product.identifier,
        })),
      });
      sentryCapture(new Error('rc_credit_package_not_found'), {
        size,
        context: 'purchaseCredits',
        offering: offering.identifier,
        availablePackages: offering.availablePackages.length,
      });
      showGlobalToast(
        translate('en-NZ', 'commerce.paywall.revenueCat.creditPackageMissing'),
        'error'
      );
      return {
        success: false,
        errorMessage: translate(
          'en-NZ',
          'commerce.paywall.revenueCat.creditPackageMissing'
        ),
      };
    }

    const purchasePackage = getPurchasesMember(RC, 'purchasePackage');
    if (!purchasePackage) {
      throw new Error('RevenueCat purchasePackage is unavailable');
    }
    showGlobalToast(
      translate('en-NZ', 'commerce.paywall.revenueCat.startingCreditPurchase'),
      'info'
    );
    await purchasePackage(pkg);

    sentryBreadcrumb('rc_purchase_credits_result', {
      size,
      success: true,
    });

    // Note: Credit fulfillment is handled by the RevenueCat webhook
    // which will add the credits to the user's balance via wallet_transactions
    // A successful StoreKit call is not proof that the webhook has credited the
    // wallet. Keep the UI in a receipt-pending state until a later wallet sync.
    return {
      success: true,
      receiptPending: true,
      storeTransactionCompleted: true,
    };
  } catch (e: unknown) {
    if (wasUserCancelled(e)) {
      sentryBreadcrumb('rc_purchase_credits_cancelled', { size });
      return { success: false, cancelled: true };
    }
    sentryCapture(e, { context: 'purchaseCredits_failed', size });
    const message = getErrorMessage(e, 'Purchase failed');
    showGlobalToast(message, TOAST_ERROR);
    return { success: false, errorMessage: message };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  const ok = await ensureInitialized();
  if (!ok)
    return {
      success: false,
      errorMessage: translate(
        'en-NZ',
        'commerce.paywall.revenueCat.notInitialized'
      ),
    };
  const RC = await getPurchasesModule();
  if (!RC)
    return {
      success: false,
      errorMessage: translate(
        'en-NZ',
        'commerce.paywall.revenueCat.unavailable'
      ),
    };
  try {
    const restore = getPurchasesMember(RC, 'restorePurchases');
    if (!restore) {
      throw new Error('RevenueCat restorePurchases is unavailable');
    }
    const customerInfo = await restore();
    const entitlements = customerInfo?.entitlements?.active || {};
    const hasPro = hasActiveProEntitlement(entitlements);
    const activeSubscriptionIds: string[] = (
      Array.isArray(customerInfo?.activeSubscriptions)
        ? customerInfo.activeSubscriptions
        : []
    ).map((productId: unknown) => String(productId));
    const hasKnownActiveProSubscription = activeSubscriptionIds.some(
      (productId: string) =>
        productId.includes('pro_monthly') ||
        productId.includes('pro_yearly') ||
        productId.includes('pro_weekly')
    );
    const serverConfirmed = await confirmServerProAccess();
    sentryBreadcrumb('rc_restore_result', {
      success: serverConfirmed,
      hasPro,
      serverConfirmed,
      activeEntitlementKeys: Object.keys(entitlements),
      hasKnownActiveProSubscription,
    });

    if (serverConfirmed) {
      return { success: true };
    }

    if (hasPro || hasKnownActiveProSubscription) {
      return {
        success: false,
        entitlementPending: true,
        storeTransactionCompleted: true,
        errorMessage: translate(
          'en-NZ',
          'commerce.paywall.revenueCat.restoreAccessPending'
        ),
      };
    }

    return { success: false };
  } catch (e: unknown) {
    sentryCapture(e, { context: 'restorePurchases_failed' });
    return {
      success: false,
      errorMessage: getErrorMessage(e, 'Restore failed'),
    };
  }
}
