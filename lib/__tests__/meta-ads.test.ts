import { waitFor } from '@testing-library/react-native';

const mockLogEvent = jest.fn();
const mockInitializeSDK = jest.fn();
const mockSetAdvertiserTrackingEnabled = jest.fn(async () => true);
const mockSetAutoLogAppEventsEnabled = jest.fn();
const mockSetAdvertiserIDCollectionEnabled = jest.fn();
const mockSetAppID = jest.fn();
const mockSetClientToken = jest.fn();
const mockGetTrackingPermissionsAsync = jest.fn(async () => ({
  status: 'undetermined',
}));
const mockRequestTrackingPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
}));

jest.mock('react-native-fbsdk-next', () => ({
  AppEventsLogger: {
    logEvent: mockLogEvent,
  },
  Settings: {
    initializeSDK: mockInitializeSDK,
    setAdvertiserIDCollectionEnabled: mockSetAdvertiserIDCollectionEnabled,
    setAdvertiserTrackingEnabled: mockSetAdvertiserTrackingEnabled,
    setAppID: mockSetAppID,
    setAutoLogAppEventsEnabled: mockSetAutoLogAppEventsEnabled,
    setClientToken: mockSetClientToken,
  },
}));

jest.mock('expo-tracking-transparency', () => ({
  getTrackingPermissionsAsync: mockGetTrackingPermissionsAsync,
  requestTrackingPermissionsAsync: mockRequestTrackingPermissionsAsync,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

describe('Meta ads transport', () => {
  const originalAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
  const originalClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_FACEBOOK_APP_ID = '1234567890';
    process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN = 'client-token';
    mockGetTrackingPermissionsAsync.mockResolvedValue({
      status: 'undetermined',
    });
    mockRequestTrackingPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    mockSetAdvertiserTrackingEnabled.mockResolvedValue(true);
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_FACEBOOK_APP_ID = originalAppId;
    process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN = originalClientToken;
  });

  it('does not initialise or log without Facebook credentials', () => {
    jest.isolateModules(() => {
      process.env.EXPO_PUBLIC_FACEBOOK_APP_ID = '';
      process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN = '';
      const { initializeMetaAds, trackMetaAdsCreateGroup } =
        require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');

      initializeMetaAds();
      trackMetaAdsCreateGroup();
    });

    expect(mockInitializeSDK).not.toHaveBeenCalled();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('supports Meta attribution only on iOS', () => {
    const { isMetaAdsPlatformSupported } =
      require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');

    expect(isMetaAdsPlatformSupported('ios')).toBe(true);
    expect(isMetaAdsPlatformSupported('android')).toBe(false);
  });

  it('keeps automatic events and advertiser IDs off before ATT consent', async () => {
    jest.isolateModules(() => {
      const { initializeMetaAds } =
        require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');
      initializeMetaAds();
      initializeMetaAds();
    });

    expect(mockSetAppID).toHaveBeenCalledTimes(1);
    expect(mockSetAppID).toHaveBeenCalledWith('1234567890');
    expect(mockSetClientToken).toHaveBeenCalledWith('client-token');
    expect(mockSetAutoLogAppEventsEnabled).toHaveBeenCalledWith(false);
    expect(mockSetAdvertiserIDCollectionEnabled).toHaveBeenCalledWith(false);
    expect(mockInitializeSDK).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(false)
    );
  });

  it('maps the four conversion receipts after ATT consent', async () => {
    let request: Promise<string> | undefined;
    let recordEvents: (() => void) | undefined;
    jest.isolateModules(() => {
      const {
        requestMetaAdsTrackingPermission,
        trackMetaAdsSignUp,
        trackMetaAdsCreateGroup,
        trackMetaAdsCreatePromise,
        trackMetaAdsInviteFriend,
      } = require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');

      request = requestMetaAdsTrackingPermission();
      recordEvents = () => {
        trackMetaAdsSignUp({ userId: 'user-1', method: 'email' });
        trackMetaAdsCreateGroup();
        trackMetaAdsCreatePromise();
        trackMetaAdsInviteFriend();
      };
    });
    await request;
    recordEvents?.();

    expect(mockLogEvent).toHaveBeenNthCalledWith(
      1,
      'fb_mobile_complete_registration',
      { fb_registration_method: 'email' }
    );
    expect(mockLogEvent).toHaveBeenNthCalledWith(2, 'CreateGroup');
    expect(mockLogEvent).toHaveBeenNthCalledWith(3, 'CreatePromise');
    expect(mockLogEvent).toHaveBeenNthCalledWith(4, 'InviteFriend');
  });

  it('de-dupes sign-up by user id across email and session load', async () => {
    let request: Promise<string> | undefined;
    let recordSignUps: (() => void) | undefined;
    jest.isolateModules(() => {
      const { requestMetaAdsTrackingPermission, trackMetaAdsSignUp } =
        require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');
      request = requestMetaAdsTrackingPermission();
      recordSignUps = () => {
        trackMetaAdsSignUp({ userId: 'user-1', method: 'email' });
        trackMetaAdsSignUp({ userId: 'user-1', method: 'oauth' });
      };
    });
    await request;
    recordSignUps?.();

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the native logger fails', async () => {
    mockLogEvent.mockImplementation(() => {
      throw new Error('native logger missing');
    });

    let request: Promise<string> | undefined;
    let track: (() => void) | undefined;
    jest.isolateModules(() => {
      const { requestMetaAdsTrackingPermission, trackMetaAdsCreatePromise } =
        require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');
      request = requestMetaAdsTrackingPermission();
      track = trackMetaAdsCreatePromise;
    });
    await request;
    expect(() => track?.()).not.toThrow();
  });

  it('applies the ATT result without changing the caller flow', async () => {
    let request: Promise<string> | undefined;
    jest.isolateModules(() => {
      const { requestMetaAdsTrackingPermission } =
        require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');
      request = requestMetaAdsTrackingPermission();
    });

    await expect(request).resolves.toBe('granted');
    expect(mockRequestTrackingPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockSetAdvertiserIDCollectionEnabled).toHaveBeenCalledWith(true);
    expect(mockInitializeSDK).toHaveBeenCalledTimes(1);
    expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
  });

  it('does not send conversion events after ATT denial', async () => {
    mockRequestTrackingPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });

    let request: Promise<string> | undefined;
    let track: (() => void) | undefined;
    jest.isolateModules(() => {
      const { requestMetaAdsTrackingPermission, trackMetaAdsCreatePromise } =
        require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');
      request = requestMetaAdsTrackingPermission();
      track = trackMetaAdsCreatePromise;
    });

    await expect(request).resolves.toBe('denied');
    track?.();
    expect(mockSetAdvertiserIDCollectionEnabled).toHaveBeenCalledWith(false);
    expect(mockInitializeSDK).not.toHaveBeenCalled();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});

describe('Meta ads signup detection', () => {
  const { isNewAuthUser, resolveMetaAdsRegistrationMethod } =
    require('@/lib/meta-ads') as typeof import('@/lib/meta-ads');

  it('treats a first session created just now as a new account', () => {
    const now = Date.parse('2026-08-27T12:00:00.000Z');
    expect(
      isNewAuthUser(
        {
          created_at: '2026-08-27T11:59:50.000Z',
          last_sign_in_at: '2026-08-27T11:59:51.000Z',
        },
        now
      )
    ).toBe(true);
  });

  it('does not treat an ordinary later login as a sign-up', () => {
    const now = Date.parse('2026-08-27T12:00:00.000Z');
    expect(
      isNewAuthUser(
        {
          created_at: '2026-07-01T00:00:00.000Z',
          last_sign_in_at: '2026-08-27T12:00:00.000Z',
        },
        now
      )
    ).toBe(false);
  });

  it('maps email providers to email and social providers to oauth', () => {
    expect(
      resolveMetaAdsRegistrationMethod({ app_metadata: { provider: 'email' } })
    ).toBe('email');
    expect(
      resolveMetaAdsRegistrationMethod({
        app_metadata: { provider: 'google' },
      })
    ).toBe('oauth');
    expect(
      resolveMetaAdsRegistrationMethod({
        identities: [{ provider: 'apple' }],
      })
    ).toBe('oauth');
  });
});
