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

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: mockMobileAds,
  AdEventType: {
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
    attempt < 10 && !mockAdLoad.mock.calls.length;
    attempt++
  ) {
    await Promise.resolve();
  }
};

describe('Google UMP rewarded-ad gate', () => {
  beforeEach(() => {
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
    const { AppState } =
      require('react-native') as typeof import('react-native');
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

      await expect(showRewardedAdDetailed()).resolves.toEqual({
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
  });

  it('keeps ads blocked when both the consent update and previous session are unusable', async () => {
    mockGatherConsent.mockRejectedValue(new Error('UMP update unavailable'));
    mockGetConsentInfo.mockResolvedValue(
      consentInfo({ canRequestAds: false, status: 'UNKNOWN' })
    );
    const { showRewardedAdDetailed } = loadAdsModule();

    await expect(showRewardedAdDetailed()).resolves.toEqual({
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

    const outcome = showRewardedAdDetailed();
    await waitForAdLoad();

    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
    expect(mockInitializeMobileAds).toHaveBeenCalledTimes(1);
    expect(mockCreateRewardedAd).toHaveBeenCalledWith('test-rewarded-unit', {
      requestNonPersonalizedAdsOnly: true,
    });
    expect(mockAdLoad).toHaveBeenCalledTimes(1);

    mockAdListeners.get('rewarded_loaded')?.();
    expect(mockAdShow).toHaveBeenCalledTimes(1);
    mockAdListeners.get('earned_reward')?.({ amount: 10, type: 'Momenta' });
    mockAdListeners.get('closed')?.();

    await expect(outcome).resolves.toEqual({
      earned: true,
      amount: 10,
      type: 'Momenta',
    });
  });

  it('keeps expected no-fill outcomes out of the Sentry error queue', async () => {
    const { showRewardedAdDetailed } = loadAdsModule();

    const outcome = showRewardedAdDetailed();
    await waitForAdLoad();

    mockAdListeners.get('error')?.({
      code: 'googleMobileAds/no-fill',
      message: 'No ad to show.',
    });

    await expect(outcome).resolves.toEqual({
      earned: false,
      amount: 0,
      reason: 'no_fill',
    });
    expect(mockSentryBreadcrumb).toHaveBeenCalledWith(
      'rewarded_ad_no_fill',
      expect.objectContaining({ code: 'googlemobileads/no-fill' })
    );
    expect(mockSentryCapture).not.toHaveBeenCalled();
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
});
