import {
  parseNotificationDeliveryPolicy,
  resolveNotificationDeliveryProvider,
  selectRemoteNotificationProvider,
  type RemoteNotificationProvider,
} from '../providers.ts';

type RecordForTest = { id: number };
type ResultForTest = { accepted: boolean };

const makeProvider = (
  configured = true
): RemoteNotificationProvider<RecordForTest, ResultForTest> => ({
  configured,
  name: 'expo',
  send: jest.fn().mockResolvedValue({ accepted: true }),
});

describe('remote notification provider selection', () => {
  it('fails safely to Expo for missing or malformed delivery policies', () => {
    expect(parseNotificationDeliveryPolicy(undefined)).toEqual({
      schemaVersion: 1,
      ios: 'expo',
      android: 'expo',
    });
    expect(parseNotificationDeliveryPolicy('{not-json')).toEqual({
      schemaVersion: 1,
      ios: 'expo',
      android: 'expo',
    });
    expect(
      parseNotificationDeliveryPolicy(
        JSON.stringify({ schema_version: 1, ios: 'onesignal', android: 'expo' })
      )
    ).toEqual({ schemaVersion: 1, ios: 'onesignal', android: 'expo' });
  });

  it('enables OneSignal only for explicitly enabled configured iOS', () => {
    const policy = parseNotificationDeliveryPolicy(
      JSON.stringify({ schema_version: 1, ios: 'onesignal', android: 'expo' })
    );
    expect(
      resolveNotificationDeliveryProvider({
        oneSignalConfigured: true,
        platform: 'ios',
        policy,
      })
    ).toBe('onesignal');
    expect(
      resolveNotificationDeliveryProvider({
        oneSignalConfigured: false,
        platform: 'ios',
        policy,
      })
    ).toBe('expo');
    expect(
      resolveNotificationDeliveryProvider({
        oneSignalConfigured: true,
        platform: 'android',
        policy,
      })
    ).toBe('expo');
    expect(
      resolveNotificationDeliveryProvider({
        oneSignalConfigured: true,
        platform: null,
        policy,
      })
    ).toBe('expo');
  });

  it('keeps Expo active as the default provider', () => {
    const expo = makeProvider();
    expect(
      selectRemoteNotificationProvider({
        defaultProviderName: 'expo',
        requestedProviderName: undefined,
        providers: { expo },
      })
    ).toEqual({ kind: 'active', provider: expo });
  });

  it('returns a no-op selection for a disabled or unavailable provider', () => {
    expect(
      selectRemoteNotificationProvider({
        defaultProviderName: 'expo',
        requestedProviderName: 'disabled',
        providers: { expo: makeProvider() },
      })
    ).toEqual({
      kind: 'noop',
      providerName: 'disabled',
      reason: 'SKIPPED_REMOTE_DELIVERY_DISABLED',
    });

    expect(
      selectRemoteNotificationProvider({
        defaultProviderName: 'expo',
        requestedProviderName: 'future-provider',
        providers: { expo: makeProvider() },
      })
    ).toEqual({
      kind: 'noop',
      providerName: 'future-provider',
      reason: 'SKIPPED_REMOTE_PROVIDER_NOT_CONFIGURED',
    });
  });

  it('selects only the requested configured provider', () => {
    const expo = makeProvider();
    const alternate = { ...makeProvider(), name: 'alternate' };

    expect(
      selectRemoteNotificationProvider({
        defaultProviderName: 'expo',
        requestedProviderName: 'alternate',
        providers: { expo, alternate },
      })
    ).toEqual({ kind: 'active', provider: alternate });
  });
});
