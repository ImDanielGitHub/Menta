const mockSetRequestConfiguration = jest.fn();
const mockInitializeMobileAds = jest.fn();
const mockMobileAds = jest.fn(() => ({
  initialize: mockInitializeMobileAds,
  setRequestConfiguration: mockSetRequestConfiguration,
}));
const mockGatherConsent = jest.fn();
const mockGetConsentInfo = jest.fn();
const mockShowPrivacyOptionsForm = jest.fn();
const mockAdLoad = jest.fn();
const mockAdShow = jest.fn();
const mockAdListeners = new Map<string, (...args: unknown[]) => void>();
const mockAddAdEventListener = jest.fn(
  (event: string, listener: (...args: unknown[]) => void) => {
    mockAdListeners.set(event, listener);
    return jest.fn();
  }
);
const mockCreateRewardedAd = jest.fn(() => ({
  addAdEventListener: mockAddAdEventListener,
  load: mockAdLoad,
  show: mockAdShow,
}));
const mockCreateInterstitialAd = jest.fn(() => ({
  addAdEventListener: mockAddAdEventListener,
  load: mockAdLoad,
  show: mockAdShow,
}));
const mockSentryBreadcrumb = jest.fn();
const mockSentryCapture = jest.fn();
let mockAdAccountId = 'consent-user';

jest.mock('@/store/auth-store', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: mockAdAccountId } }),
    subscribe: () => () => undefined,
  },
}));
jest.mock('@/lib/paywall/revenuecat', () => ({
  prepareRevenueCatAdReward: jest.fn(async () => ({
    appUserID: 'consent-user',
    customData: 'verification-data',
    clientTransactionId: 'ad-consent-1',
  })),
  pollRevenueCatAdReward: jest.fn(async () => ({
    failed: false,
    reward: { type: 'virtual_currency', code: 'MNT', amount: 999 },
    moreRewards: [],
  })),
  trackRevenueCatAdEvent: jest.fn(async () => undefined),
}));
jest.mock('@/lib/ads/revenuecat-reward-receipt', () => ({
  waitForRevenueCatAdRewardReceipt: jest.fn(async () => ({
    status: 'applied',
    amount: 10,
    newBalance: 10,
    reason: null,
  })),
}));

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: mockMobileAds,
  AdEventType: {
    OPENED: 'opened',
    CLOSED: 'closed',
    ERROR: 'error',
    LOADED: 'loaded',
  },
  AdsConsent: {
    gatherConsent: mockGatherConsent,
    getConsentInfo: mockGetConsentInfo,
    showPrivacyOptionsForm: mockShowPrivacyOptionsForm,
  },
  MaxAdContentRating: { T: 'T' },
  InterstitialAd: { createForAdRequest: mockCreateInterstitialAd },
  RewardedAd: { createForAdRequest: mockCreateRewardedAd },
  RewardedAdEventType: {
    EARNED_REWARD: 'earned_reward',
    LOADED: 'rewarded_loaded',
  },
  TestIds: {
    INTERSTITIAL: 'test-interstitial-unit',
    REWARDED: 'test-rewarded-unit',
  },
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: mockSentryBreadcrumb,
  captureError: mockSentryCapture,
  recordProductAnalyticsEvent: jest.fn(),
}));

type AdsModule = typeof import('@/lib/ads');

const consentInfo = (overrides: Record<string, unknown> = {}) => ({
  canRequestAds: true,
  isConsentFormAvailable: false,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED',
  status: 'NOT_REQUIRED',
  ...overrides,
});

const loadAdsModule = (): AdsModule => require('@/lib/ads') as AdsModule;

const waitForAdLoad = async () => {
  for (
    let attempt = 0;
    attempt < 30 && !mockAdLoad.mock.calls.length;
    attempt++
  ) {
    await Promise.resolve();
  }
};

describe('Google UMP rewarded-ad gate', () => {
  afterEach(() => jest.useRealTimers());
  beforeEach(() => {
    mockAdAccountId = 'consent-user';
    jest.resetModules();
    jest.clearAllMocks();
    mockAdListeners.clear();
    mockSetRequestConfiguration.mockResolvedValue(undefined);
    mockInitializeMobileAds.mockResolvedValue([]);
    mockGatherConsent.mockResolvedValue(consentInfo());
    mockGetConsentInfo.mockResolvedValue(consentInfo());
    mockShowPrivacyOptionsForm.mockResolvedValue(consentInfo());
    process.env.EXPO_PUBLIC_ADS_ENABLED = 'true';
    process.env.EXPO_PUBLIC_DOGFOOD_DISABLE_ADS = 'false';
    process.env.EXPO_PUBLIC_REVENUECAT_AD_REWARDS_VERIFIED = 'true';
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS = 'test/rewarded-unit';
    process.env.EXPO_PUBLIC_REVENUECAT_MOMENTA_CURRENCY_CODE = 'MNT';
    const { AppState, NativeModules } =
      require('react-native') as typeof import('react-native');
    NativeModules.RNPurchases = {
      generateRewardVerificationToken: jest.fn(),
      pollRewardVerification: jest.fn(),
    };
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'active',
    });
  });

  it('gathers consent once and initializes Mobile Ads once for concurrent callers', async () => {
    const { initializeAds } = loadAdsModule();

    const [first, second] = await Promise.all([
      initializeAds(),
      initializeAds(),
    ]);

    expect(first.ready).toBe(true);
    expect(second.ready).toBe(true);
    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
    expect(mockSetRequestConfiguration).toHaveBeenCalledTimes(1);
    expect(mockInitializeMobileAds).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['consent_required', true],
    ['consent_unavailable', false],
  ])(
    'does not initialize, create, load, or show an ad when UMP reports %s',
    async (expectedReason, isConsentFormAvailable) => {
      mockGatherConsent.mockResolvedValue(
        consentInfo({
          canRequestAds: false,
          isConsentFormAvailable,
          privacyOptionsRequirementStatus: 'REQUIRED',
          status: 'REQUIRED',
        })
      );
      const { showRewardedAdDetailed } = loadAdsModule();

      await expect(
        showRewardedAdDetailed({ appUserId: 'consent-user' })
      ).resolves.toEqual({
        earned: false,
        amount: 0,
        reason: expectedReason,
      });
      expect(mockInitializeMobileAds).not.toHaveBeenCalled();
      expect(mockCreateRewardedAd).not.toHaveBeenCalled();
      expect(mockAdLoad).not.toHaveBeenCalled();
      expect(mockAdShow).not.toHaveBeenCalled();
    }
  );

  it('uses a previous-session consent decision after the current update fails', async () => {
    mockGatherConsent.mockRejectedValue(new Error('UMP update unavailable'));
    mockGetConsentInfo.mockResolvedValue(consentInfo({ status: 'OBTAINED' }));
    const { initializeAds } = loadAdsModule();

    await expect(initializeAds()).resolves.toMatchObject({ ready: true });
    expect(mockGetConsentInfo).toHaveBeenCalledTimes(1);
    expect(mockInitializeMobileAds).toHaveBeenCalledTimes(1);
    expect(mockSentryCapture).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'UMP update unavailable' }),
      { context: 'admob_consent_gather_failed' }
    );
  });

  it.each([
    ['offline', 'The Internet connection appears to be offline.'],
    ['timeout', 'The request timed out.'],
  ])(
    'keeps ads blocked after %s and retries consent on the next request',
    async (reason, message) => {
      mockGatherConsent.mockRejectedValueOnce(new Error(message));
      mockGetConsentInfo.mockResolvedValue(
        consentInfo({ canRequestAds: false, status: 'UNKNOWN' })
      );
      const { initializeAds, showRewardedAdDetailed } = loadAdsModule();

      const [first, second] = await Promise.all([
        initializeAds(),
        showRewardedAdDetailed({ appUserId: 'consent-user' }),
      ]);
      expect(first).toMatchObject({ ready: false, reason: 'consent_error' });
      expect(second).toEqual({
        earned: false,
        amount: 0,
        reason: 'consent_error',
      });
      expect(mockGatherConsent).toHaveBeenCalledTimes(1);
      expect(mockInitializeMobileAds).not.toHaveBeenCalled();
      expect(mockCreateRewardedAd).not.toHaveBeenCalled();
      expect(mockAdLoad).not.toHaveBeenCalled();
      expect(mockAdShow).not.toHaveBeenCalled();
      expect(mockSentryCapture).not.toHaveBeenCalled();
      expect(mockSentryBreadcrumb).toHaveBeenCalledWith(
        `admob_consent_gather_${reason}`,
        { platform: 'ios' }
      );

      await expect(initializeAds()).resolves.toMatchObject({ ready: true });
      expect(mockGatherConsent).toHaveBeenCalledTimes(2);
      expect(mockInitializeMobileAds).toHaveBeenCalledTimes(1);
    }
  );

  it('retains a valid UMP decision after an offline consent update', async () => {
    mockGatherConsent.mockRejectedValue(
      new Error('The Internet connection appears to be offline.')
    );
    mockGetConsentInfo.mockResolvedValue(consentInfo({ status: 'OBTAINED' }));
    const { initializeAds } = loadAdsModule();

    await expect(initializeAds()).resolves.toMatchObject({ ready: true });
    await expect(initializeAds()).resolves.toMatchObject({ ready: true });
    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
    expect(mockInitializeMobileAds).toHaveBeenCalledTimes(1);
    expect(mockSentryCapture).not.toHaveBeenCalled();
  });

  it('reports an unreadable consent decision even when the update failed offline', async () => {
    mockGatherConsent.mockRejectedValueOnce(
      new Error('The Internet connection appears to be offline.')
    );
    const readError = new Error('Consent storage unavailable');
    mockGetConsentInfo.mockRejectedValueOnce(readError);
    const { initializeAds } = loadAdsModule();

    await expect(initializeAds()).resolves.toEqual({
      ready: false,
      reason: 'consent_error',
    });
    expect(mockInitializeMobileAds).not.toHaveBeenCalled();
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    expect(mockSentryCapture).toHaveBeenCalledWith(readError, {
      context: 'admob_consent_previous_session_failed',
    });
    await expect(initializeAds()).resolves.toMatchObject({ ready: true });
  });

  it('keeps ads blocked when both the consent update and previous session are unusable', async () => {
    mockGatherConsent.mockRejectedValue(new Error('UMP update unavailable'));
    mockGetConsentInfo.mockResolvedValue(
      consentInfo({ canRequestAds: false, status: 'UNKNOWN' })
    );
    const { showRewardedAdDetailed } = loadAdsModule();

    await expect(
      showRewardedAdDetailed({ appUserId: 'consent-user' })
    ).resolves.toEqual({
      earned: false,
      amount: 0,
      reason: 'consent_error',
    });
    expect(mockInitializeMobileAds).not.toHaveBeenCalled();
    expect(mockCreateRewardedAd).not.toHaveBeenCalled();
  });

  it('serializes the required privacy-options form and initializes only after it permits ads', async () => {
    mockGatherConsent.mockResolvedValue(
      consentInfo({
        canRequestAds: false,
        isConsentFormAvailable: true,
        privacyOptionsRequirementStatus: 'REQUIRED',
        status: 'REQUIRED',
      })
    );
    mockShowPrivacyOptionsForm.mockResolvedValue(
      consentInfo({
        privacyOptionsRequirementStatus: 'REQUIRED',
        status: 'OBTAINED',
      })
    );
    const { showAdsPrivacyOptions } = loadAdsModule();

    const [first, second] = await Promise.all([
      showAdsPrivacyOptions(),
      showAdsPrivacyOptions(),
    ]);

    expect(first).toEqual({
      shown: true,
      canRequestAds: true,
      privacyOptionsRequired: true,
    });
    expect(second).toEqual(first);
    expect(mockShowPrivacyOptionsForm).toHaveBeenCalledTimes(1);
    expect(mockInitializeMobileAds).toHaveBeenCalledTimes(1);
  });

  it('loads and shows a rewarded ad only after the consent gate succeeds', async () => {
    const { showRewardedAdDetailed } = loadAdsModule();

    const outcome = showRewardedAdDetailed({ appUserId: 'consent-user' });
    await waitForAdLoad();

    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
    expect(mockInitializeMobileAds).toHaveBeenCalledTimes(1);
    expect(mockCreateRewardedAd).toHaveBeenCalledWith('test/rewarded-unit', {
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: {
        userId: 'consent-user',
        customData: 'verification-data',
      },
    });
    expect(mockAdLoad).toHaveBeenCalledTimes(1);

    mockAdListeners.get('rewarded_loaded')?.();
    expect(mockAdShow).toHaveBeenCalledTimes(1);
    mockAdListeners.get('earned_reward')?.({ amount: 10, type: 'Momenta' });
    mockAdListeners.get('closed')?.();

    await expect(outcome).resolves.toEqual({
      earned: true,
      amount: 10,
      type: 'MNT',
      clientTransactionId: 'ad-consent-1',
      provider: 'revenuecat',
      verified: true,
    });
  });

  it('keeps expected no-fill outcomes out of the Sentry error queue', async () => {
    const { showRewardedAdDetailed } = loadAdsModule();

    const outcome = showRewardedAdDetailed({ appUserId: 'consent-user' });
    await waitForAdLoad();

    mockAdListeners.get('error')?.({
      code: 'googleMobileAds/no-fill',
      message: 'No ad to show.',
    });

    await expect(outcome).resolves.toEqual({
      earned: false,
      amount: 0,
      reason: 'no_fill',
      provider: 'revenuecat',
      verified: false,
    });
    expect(mockSentryBreadcrumb).toHaveBeenCalledWith('rewarded_ad_no_fill', {
      provider: 'revenuecat',
      placement: 'momenta_reward',
    });
    expect(mockSentryCapture).not.toHaveBeenCalled();
  });

  it('preserves verification callbacks while a rewarded video plays longer than the load timeout', async () => {
    jest.useFakeTimers();
    const { showRewardedAdDetailed } = loadAdsModule();
    const outcome = showRewardedAdDetailed({ appUserId: 'consent-user' });
    await waitForAdLoad();
    mockAdListeners.get('rewarded_loaded')?.();
    mockAdListeners.get('opened')?.();
    await jest.advanceTimersByTimeAsync(60_000);
    mockAdListeners.get('earned_reward')?.();
    mockAdListeners.get('closed')?.();
    await expect(outcome).resolves.toMatchObject({
      earned: true,
      amount: 10,
      verified: true,
    });
  });

  it('returns a pending receipt after dismissal when verification never responds', async () => {
    jest.useFakeTimers();
    const { pollRevenueCatAdReward } = require('@/lib/paywall/revenuecat');
    pollRevenueCatAdReward.mockImplementationOnce(
      () => new Promise(() => undefined)
    );
    const { showRewardedAdDetailed } = loadAdsModule();
    const outcome = showRewardedAdDetailed({ appUserId: 'consent-user' });
    await waitForAdLoad();
    mockAdListeners.get('rewarded_loaded')?.();
    mockAdListeners.get('opened')?.();
    await jest.advanceTimersByTimeAsync(60_000);
    mockAdListeners.get('earned_reward')?.();
    mockAdListeners.get('closed')?.();
    await jest.advanceTimersByTimeAsync(45_000);
    await expect(outcome).resolves.toMatchObject({
      earned: false,
      reason: 'reward_pending',
    });
  });

  it('loads a non-personalised interstitial only after the consent gate succeeds', async () => {
    const { showInterstitialAdDetailed } = loadAdsModule();

    const resultPromise = showInterstitialAdDetailed();
    await waitForAdLoad();

    expect(mockCreateInterstitialAd).toHaveBeenCalledWith(
      'test-interstitial-unit',
      { requestNonPersonalizedAdsOnly: true }
    );
    expect(mockAdLoad).toHaveBeenCalledTimes(1);

    mockAdListeners.get('loaded')?.();
    expect(mockAdShow).toHaveBeenCalledTimes(1);
    mockAdListeners.get('closed')?.();

    await expect(resultPromise).resolves.toEqual({ shown: true });
  });

  it('keeps an interstitial fail-open when consent cannot permit ads', async () => {
    mockGatherConsent.mockResolvedValue(
      consentInfo({ canRequestAds: false, status: 'REQUIRED' })
    );
    const { showInterstitialAdDetailed } = loadAdsModule();

    await expect(showInterstitialAdDetailed()).resolves.toMatchObject({
      shown: false,
      reason: 'consent_unavailable',
    });
    expect(mockCreateInterstitialAd).not.toHaveBeenCalled();
  });

  it('does not report a displayed interstitial as timed out during playback', async () => {
    jest.useFakeTimers();
    const { showInterstitialAdDetailed } = loadAdsModule();
    const outcome = showInterstitialAdDetailed({ appUserId: 'consent-user' });
    await waitForAdLoad();
    mockAdListeners.get('loaded')?.();
    mockAdListeners.get('opened')?.();
    await jest.advanceTimersByTimeAsync(30_000);
    mockAdListeners.get('closed')?.();
    await expect(outcome).resolves.toEqual({ shown: true });
    expect(mockSentryBreadcrumb).not.toHaveBeenCalledWith(
      'interstitial_ad_timeout',
      expect.anything()
    );
  });

  it('does not present an old account ad after switching accounts during load', async () => {
    const { showInterstitialAdDetailed } = loadAdsModule();
    const outcome = showInterstitialAdDetailed({ appUserId: 'consent-user' });
    await waitForAdLoad();
    mockAdAccountId = 'different-user';
    mockAdListeners.get('loaded')?.();
    await expect(outcome).resolves.toMatchObject({
      shown: false,
      reason: 'account_changed',
    });
    expect(mockAdShow).not.toHaveBeenCalled();
  });

  it('recovers when the native interstitial loses its close callback', async () => {
    jest.useFakeTimers();
    const { showInterstitialAdDetailed } = loadAdsModule();
    const outcome = showInterstitialAdDetailed({ appUserId: 'consent-user' });
    await waitForAdLoad();
    mockAdListeners.get('loaded')?.();
    mockAdListeners.get('opened')?.();
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    await expect(outcome).resolves.toMatchObject({
      shown: false,
      reason: 'timeout',
    });
  });
});
