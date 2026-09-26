const mockConfigure = jest.fn().mockResolvedValue(undefined);
const mockLogIn = jest.fn().mockResolvedValue(undefined);
const mockRestorePurchases = jest.fn();
const mockGetOfferings = jest.fn();
const mockGetCustomerInfo = jest.fn();
const mockPurchasePackage = jest.fn();
const mockInvalidateCustomerInfoCache = jest.fn();
const mockGetMyProAuthority = jest.fn();
const mockAuth = { user: { id: 'user-1' } };
const mockGetAppUserID = jest.fn();
let mockAdTracker:
  { trackAdDisplayed?: jest.Mock; trackAdLoaded?: jest.Mock } | undefined;

jest.mock('@/store/auth-store', () => ({
  useAuthStore: { getState: () => mockAuth },
}));

jest.mock('react-native-purchases', () => ({
  getAppUserID: () => mockGetAppUserID(),
  get adTracker() {
    return mockAdTracker;
  },
  configure(this: unknown, ...args: unknown[]) {
    return mockConfigure.apply(this, args);
  },
  logIn: (...args: unknown[]) => mockLogIn(...args),
  restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
  getOfferings: (...args: unknown[]) => mockGetOfferings(...args),
  getCustomerInfo: (...args: unknown[]) => mockGetCustomerInfo(...args),
  purchasePackage: (...args: unknown[]) => mockPurchasePackage(...args),
  invalidateCustomerInfoCache: (...args: unknown[]) =>
    mockInvalidateCustomerInfoCache(...args),
  PACKAGE_TYPE: { MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL' },
  setLogLevel: jest.fn(),
  LOG_LEVEL: { DEBUG: 'DEBUG', WARN: 'WARN', ERROR: 'ERROR' },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone',
    expoConfig: {
      extra: {
        revenuecatIosKey: 'appl_test_key',
        revenuecatAndroidKey: 'goog_test_key',
      },
    },
  },
}));

jest.mock('@/lib/profile-api', () => ({
  getMyProAuthority: (...args: unknown[]) => mockGetMyProAuthority(...args),
}));

jest.mock('@/lib/toast-provider', () => ({
  showGlobalToast: jest.fn(),
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

import {
  purchasePlan,
  restorePurchases,
  RevenueCatAPI,
  trackRevenueCatAdEvent,
} from '@/lib/paywall/revenuecat';
import { captureError } from '@/lib/sentry';

const proCustomerInfo = {
  entitlements: {
    active: {
      pro_access: { isActive: true },
    },
  },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
};

const monthlyPackage = {
  packageType: 'MONTHLY',
  identifier: 'rc_monthly',
  product: {
    identifier: 'com.anekedigitalapps.lockedin.pro_monthly',
  },
};

const currentOffering = {
  current: {
    identifier: 'pro',
    availablePackages: [monthlyPackage],
  },
  all: {},
};

describe('RevenueCat authority', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.user = { id: 'user-1' };
    mockGetAppUserID.mockResolvedValue('user-1');
    mockAdTracker = {
      trackAdDisplayed: jest.fn().mockResolvedValue(undefined),
      trackAdLoaded: jest.fn().mockResolvedValue(undefined),
    };
    mockConfigure.mockResolvedValue(undefined);
    mockGetOfferings.mockResolvedValue(currentOffering);
    mockGetCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });
    mockInvalidateCustomerInfoCache.mockResolvedValue(undefined);
    mockGetMyProAuthority.mockResolvedValue({
      is_pro: false,
      reconciliation_pending: false,
    });
  });

  it('allows a later action to retry after native configuration fails', async () => {
    mockConfigure.mockRejectedValueOnce(new Error('temporary init failure'));

    await expect(RevenueCatAPI.logIn('user-1')).resolves.toBeUndefined();
    await expect(RevenueCatAPI.getOfferings()).resolves.toEqual(
      currentOffering
    );

    expect(mockConfigure).toHaveBeenCalledTimes(2);
    expect(mockConfigure.mock.calls[0]?.[0]).toMatchObject({
      appUserID: 'user-1',
    });
    expect(mockConfigure.mock.calls[1]?.[0]).toEqual(
      mockConfigure.mock.calls[0]?.[0]
    );
    expect(mockConfigure.mock.contexts).toEqual([
      expect.objectContaining({ PACKAGE_TYPE: expect.any(Object) }),
      expect.objectContaining({ PACKAGE_TYPE: expect.any(Object) }),
    ]);
    expect(mockGetOfferings).toHaveBeenCalledTimes(1);
  });

  it('sends manual ad display tracking through the configured account SDK', async () => {
    const data = {
      mediatorName: 'AdMob',
      adFormat: 'interstitial',
      adUnitId: 'ad-unit',
      impressionId: 'impression',
    };
    await expect(
      trackRevenueCatAdEvent('user-1', { type: 'displayed', data })
    ).resolves.toBe(true);
    expect(mockAdTracker?.trackAdDisplayed).toHaveBeenCalledWith(data);
    expect(mockAdTracker?.trackAdDisplayed?.mock.contexts[0]).toBe(
      mockAdTracker
    );
  });

  it('reports a missing ad method once and returns false so serving can continue independently', async () => {
    delete mockAdTracker!.trackAdDisplayed;
    const payload = {
      type: 'displayed' as const,
      data: {
        mediatorName: 'AdMob',
        adFormat: 'interstitial',
        adUnitId: 'ad-unit',
        impressionId: 'impression',
      },
    };
    await expect(trackRevenueCatAdEvent('user-1', payload)).resolves.toBe(
      false
    );
    await expect(trackRevenueCatAdEvent('user-1', payload)).resolves.toBe(
      false
    );
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(
      new Error('revenuecat_ad_capability_missing'),
      {
        context: 'revenuecat_ad_capability_missing',
        capability: 'displayed',
      }
    );
  });

  it('does not count a missing tracker or a rejected tracking call as delivered', async () => {
    const payload = {
      type: 'loaded' as const,
      data: {
        mediatorName: 'AdMob',
        adFormat: 'rewarded',
        adUnitId: 'ad-unit',
        impressionId: 'impression',
      },
    };
    mockAdTracker = undefined;
    await expect(trackRevenueCatAdEvent('user-1', payload)).resolves.toBe(
      false
    );
    expect(captureError).toHaveBeenCalledWith(
      new Error('revenuecat_ad_capability_missing'),
      {
        context: 'revenuecat_ad_capability_missing',
        capability: 'adTracker',
      }
    );
    mockAdTracker = {
      trackAdLoaded: jest
        .fn()
        .mockRejectedValue(new Error('native tracker unavailable')),
    };
    await expect(trackRevenueCatAdEvent('user-1', payload)).resolves.toBe(
      false
    );
  });

  it('never reports an old account ad under the new purchase identity', async () => {
    mockGetAppUserID.mockResolvedValue('user-2');
    await expect(
      trackRevenueCatAdEvent('user-1', {
        type: 'displayed',
        data: {
          mediatorName: 'AdMob',
          adFormat: 'interstitial',
          adUnitId: 'ad-unit',
          impressionId: 'impression',
        },
      })
    ).resolves.toBe(false);
    expect(mockAdTracker?.trackAdDisplayed).not.toHaveBeenCalled();
  });

  it('uses server Pro when an SDK refresh fails', async () => {
    mockGetCustomerInfo.mockRejectedValueOnce(new Error('SDK unavailable'));
    mockGetMyProAuthority.mockResolvedValueOnce({
      is_pro: true,
      reconciliation_pending: false,
    });

    await expect(RevenueCatAPI.refreshCustomerInfo()).resolves.toBe(true);
  });

  it('does not promote SDK-only Pro when the server says free', async () => {
    mockGetCustomerInfo.mockResolvedValueOnce(proCustomerInfo);

    await expect(RevenueCatAPI.refreshCustomerInfo()).resolves.toBe(false);
    await expect(RevenueCatAPI.isPro()).resolves.toBe(false);
  });

  it('fails closed when the server authority read is unavailable', async () => {
    mockGetCustomerInfo.mockResolvedValueOnce(proCustomerInfo);
    mockGetMyProAuthority.mockResolvedValue(null);

    await expect(RevenueCatAPI.refreshCustomerInfo()).resolves.toBe(false);
    await expect(RevenueCatAPI.isPro()).resolves.toBe(false);
  });

  it('fails closed while a server reconciliation is pending', async () => {
    mockGetMyProAuthority.mockResolvedValueOnce({
      is_pro: false,
      reconciliation_pending: true,
    });

    await expect(RevenueCatAPI.isPro()).resolves.toBe(false);
  });

  it('does not treat an expired historical Pro purchase as pending access', async () => {
    mockRestorePurchases.mockResolvedValueOnce({
      entitlements: { active: {} },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [
        'com.anekedigitalapps.lockedin.pro_monthly',
      ],
    });

    await expect(restorePurchases()).resolves.toEqual({ success: false });
  });

  it('keeps a current Pro subscription pending until the server confirms it', async () => {
    mockRestorePurchases.mockResolvedValueOnce({
      entitlements: { active: {} },
      activeSubscriptions: ['com.anekedigitalapps.lockedin.pro_yearly'],
      allPurchasedProductIdentifiers: [
        'com.anekedigitalapps.lockedin.pro_yearly',
      ],
    });

    await expect(restorePurchases()).resolves.toMatchObject({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });
  });

  it('does not promote an SDK entitlement before the server profile confirms it', async () => {
    mockRestorePurchases.mockResolvedValueOnce(proCustomerInfo);

    await expect(restorePurchases()).resolves.toMatchObject({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });
  });

  it('accepts a restore only after the server profile confirms Pro', async () => {
    mockRestorePurchases.mockResolvedValueOnce({
      entitlements: { active: {} },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
    });
    mockGetMyProAuthority.mockResolvedValueOnce({
      is_pro: true,
      reconciliation_pending: false,
    });

    await expect(restorePurchases()).resolves.toEqual({ success: true });
  });

  it('keeps a completed purchase pending while its webhook catches up', async () => {
    mockPurchasePackage.mockResolvedValueOnce({
      customerInfo: proCustomerInfo,
    });

    await expect(purchasePlan('monthly')).resolves.toMatchObject({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });
  });

  it('completes a purchase only after the server profile confirms Pro', async () => {
    mockPurchasePackage.mockResolvedValueOnce({
      customerInfo: proCustomerInfo,
    });
    mockGetMyProAuthority.mockResolvedValueOnce({
      is_pro: true,
      reconciliation_pending: false,
    });

    await expect(purchasePlan('monthly')).resolves.toEqual({
      success: true,
      storeTransactionCompleted: true,
    });
  });
});
