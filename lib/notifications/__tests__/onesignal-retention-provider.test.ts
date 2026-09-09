import {
  isValidOneSignalAppId,
  OneSignalRetentionNotificationProvider,
  ONESIGNAL_OWNED_IN_APP_TRIGGER_NAMES,
} from '@/lib/notifications/onesignal-retention-provider';

const APP_ID = '11111111-2222-4333-8444-555555555555';

type ClickListener = (event: never) => void;

const makeSdk = () => {
  let notificationClick: ClickListener | undefined;
  let inAppClick: ClickListener | undefined;

  const sdk = {
    initialize: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    User: {
      addEmail: jest.fn(),
      addTags: jest.fn(),
      removeEmail: jest.fn(),
      pushSubscription: {
        addEventListener: jest.fn(),
      },
      trackEvent: jest.fn(),
    },
    Notifications: {
      addEventListener: jest.fn((event: string, listener: ClickListener) => {
        if (event === 'click') notificationClick = listener;
      }),
    },
    InAppMessages: {
      addEventListener: jest.fn((event: string, listener: ClickListener) => {
        if (event === 'click') inAppClick = listener;
      }),
      addTriggers: jest.fn(),
      removeTriggers: jest.fn(),
    },
  };

  return {
    sdk,
    getInAppClick: () => inAppClick,
    getNotificationClick: () => notificationClick,
  };
};

describe('OneSignal retention provider', () => {
  it('requires a UUID App ID and every explicit data-sharing gate', async () => {
    expect(isValidOneSignalAppId(APP_ID)).toBe(true);
    expect(isValidOneSignalAppId('not-an-app-id')).toBe(false);

    for (const options of [
      { appId: '', releaseApproved: true, userDataEnabled: true },
      { appId: APP_ID, releaseApproved: false, userDataEnabled: true },
      { appId: APP_ID, releaseApproved: true, userDataEnabled: false },
      {
        appId: APP_ID,
        releaseApproved: true,
        userDataEnabled: true,
        platform: 'web',
      },
    ]) {
      const loadSdk = jest.fn();
      const provider = new OneSignalRetentionNotificationProvider({
        platform: 'ios',
        ...options,
        loadSdk,
      });

      expect(provider.configured).toBe(false);
      await expect(provider.initialize()).rejects.toThrow(
        'OneSignal is not configured'
      );
      expect(loadSdk).not.toHaveBeenCalled();
    }
  });

  it('loads and initializes the native SDK exactly once', async () => {
    const { sdk } = makeSdk();
    const loadSdk = jest.fn().mockResolvedValue(sdk as never);
    const provider = new OneSignalRetentionNotificationProvider({
      appId: APP_ID,
      loadSdk,
      platform: 'ios',
      releaseApproved: true,
      userDataEnabled: true,
    });

    await Promise.all([provider.initialize(), provider.initialize()]);

    expect(loadSdk).toHaveBeenCalledTimes(1);
    expect(sdk.initialize).toHaveBeenCalledWith(APP_ID);
    expect(sdk.initialize).toHaveBeenCalledTimes(1);
    expect(sdk.Notifications.addEventListener).toHaveBeenCalledTimes(2);
    expect(sdk.InAppMessages.addEventListener).toHaveBeenCalledTimes(3);
    expect(sdk.User.pushSubscription.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('routes only allowlisted action data and ignores provider URLs', async () => {
    const { sdk, getInAppClick, getNotificationClick } = makeSdk();
    const openUrl = jest.fn().mockResolvedValue(undefined);
    const recordNotificationOpened = jest.fn().mockResolvedValue(undefined);
    const provider = new OneSignalRetentionNotificationProvider({
      appId: APP_ID,
      loadSdk: jest.fn().mockResolvedValue(sdk as never),
      openUrl,
      platform: 'ios',
      recordNotificationOpened,
      releaseApproved: true,
      userDataEnabled: true,
    });
    await provider.initialize();

    getNotificationClick()?.({
      notification: {
        additionalData: {
          action: 'open_challenge',
          challengeId: 'challenge-1',
          notificationId: '17',
        },
        launchURL: 'https://attacker.example/notification',
      },
      result: { url: 'https://attacker.example/result' },
    } as never);
    getInAppClick()?.({
      result: {
        actionId: 'open_today',
        url: 'https://attacker.example/in-app',
      },
    } as never);
    getInAppClick()?.({
      result: {
        actionId: 'open_external_url',
        url: 'https://attacker.example/rejected',
      },
    } as never);

    expect(openUrl.mock.calls).toEqual([
      ['menta://challenges/challenge-1'],
      ['menta://'],
    ]);
    expect(recordNotificationOpened).toHaveBeenCalledWith(17);
  });

  it('binds identity, sends bounded state, and cleans up owned state', async () => {
    const { sdk } = makeSdk();
    const provider = new OneSignalRetentionNotificationProvider({
      appId: APP_ID,
      loadSdk: jest.fn().mockResolvedValue(sdk as never),
      platform: 'ios',
      releaseApproved: true,
      userDataEnabled: true,
    });

    await provider.bindExternalUser('user-1');
    await provider.recordEvent('proof_submitted', { source: 'today' });
    await provider.syncInAppTriggers({
      app_surface: 'today',
      has_active_promise: 'true',
    });
    await provider.syncAudienceTags({ marketing_email_opt_in: true });
    await provider.syncEmailSubscription('person@example.com', true);
    await provider.syncEmailSubscription('person@example.com', false);
    await provider.unbindExternalUser();

    expect(sdk.login).toHaveBeenCalledWith('user-1');
    expect(sdk.User.trackEvent).toHaveBeenCalledWith('proof_submitted', {
      source: 'today',
    });
    expect(sdk.InAppMessages.addTriggers).toHaveBeenCalledWith({
      app_surface: 'today',
      has_active_promise: 'true',
    });
    expect(sdk.InAppMessages.removeTriggers).toHaveBeenCalledWith(
      ONESIGNAL_OWNED_IN_APP_TRIGGER_NAMES
    );
    expect(sdk.User.addTags).toHaveBeenCalledWith({
      marketing_email_opt_in: 'true',
    });
    expect(sdk.User.addEmail).toHaveBeenCalledWith('person@example.com');
    expect(sdk.User.removeEmail).toHaveBeenCalledWith('person@example.com');
    expect(sdk.logout).toHaveBeenCalledTimes(1);
  });

  it('logs out even when owned trigger cleanup fails', async () => {
    const { sdk } = makeSdk();
    sdk.InAppMessages.removeTriggers.mockImplementation(() => {
      throw new Error('local trigger cleanup failed');
    });
    const provider = new OneSignalRetentionNotificationProvider({
      appId: APP_ID,
      loadSdk: jest.fn().mockResolvedValue(sdk as never),
      platform: 'ios',
      releaseApproved: true,
      userDataEnabled: true,
    });

    await provider.initialize();
    await expect(provider.unbindExternalUser()).resolves.toBeUndefined();

    expect(sdk.logout).toHaveBeenCalledTimes(1);
  });
});
