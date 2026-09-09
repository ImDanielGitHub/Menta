describe('app-owned operational flags', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.dontMock('expo-constants');
  });

  it('uses the reviewed release defaults without an override', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: {} } },
    }));

    const { getOperationalFlag } =
      require('@/lib/operational-flags') as typeof import('@/lib/operational-flags');

    expect(getOperationalFlag('ads_enabled')).toBe(true);
    expect(getOperationalFlag('safe_mode')).toBe(false);
    expect(getOperationalFlag('group_notifications_enabled')).toBe(true);
    expect(getOperationalFlag('disable_google_login')).toBe(false);
    expect(getOperationalFlag('disable_apple_login')).toBe(false);
  });

  it('honours an explicit Expo release override', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: { operationalFlags: { ads_enabled: false, safe_mode: true } },
        },
      },
    }));

    const { getOperationalFlag } =
      require('@/lib/operational-flags') as typeof import('@/lib/operational-flags');

    expect(getOperationalFlag('ads_enabled')).toBe(false);
    expect(getOperationalFlag('safe_mode')).toBe(true);
  });

  it('gives an explicit EAS environment override precedence', () => {
    process.env.EXPO_PUBLIC_ADS_ENABLED = '0';
    process.env.EXPO_PUBLIC_DISABLE_GOOGLE_LOGIN = 'true';
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            operationalFlags: {
              ads_enabled: true,
              disable_google_login: false,
            },
          },
        },
      },
    }));

    const { getOperationalFlag } =
      require('@/lib/operational-flags') as typeof import('@/lib/operational-flags');

    expect(getOperationalFlag('ads_enabled')).toBe(false);
    expect(getOperationalFlag('disable_google_login')).toBe(true);
  });
});
