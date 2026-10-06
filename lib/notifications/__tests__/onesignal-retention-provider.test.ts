import { Linking } from 'react-native';

import {
  isValidOneSignalAppId,
  OneSignalRetentionNotificationProvider,
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
      requestPermission: jest.fn().mockResolvedValue(true),
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
    expect(sdk.logout).toHaveBeenCalledTimes(1);
    expect(sdk.login).not.toHaveBeenCalled();
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

  it('opens allowlisted destinations through Linking.openURL with Linking as this', async () => {
    const linking = Linking as typeof Linking & {
      _validateURL: (url: string) => void;
    };
    const opened: string[] = [];
    linking._validateURL = jest.fn((url: string) => {
      if (typeof url !== 'string' || url.length === 0) {
        throw new TypeError('Invalid URL');
      }
    });
    const openURL = jest.spyOn(Linking, 'openURL').mockImplementation(function (
      this: typeof linking,
      url: string
    ) {
      this._validateURL(url);
      opened.push(url);
      return Promise.resolve(true);
    });

    try {
      const { sdk, getInAppClick, getNotificationClick } = makeSdk();
      const provider = new OneSignalRetentionNotificationProvider({
        appId: APP_ID,
        loadSdk: jest.fn().mockResolvedValue(sdk as never),
        platform: 'ios',
        releaseApproved: true,
        userDataEnabled: true,
      });
      await provider.initialize();

      expect(() => {
        getNotificationClick()?.({
          notification: {
            additionalData: {
              action: 'open_challenge',
              challengeId: 'challenge-1',
            },
          },
          result: {},
        } as never);
      }).not.toThrow();
      expect(() => {
        getInAppClick()?.({
          result: { actionId: 'open_today' },
        } as never);
      }).not.toThrow();

      expect(opened).toEqual(['menta://challenges/challenge-1', 'menta://']);
      expect(linking._validateURL).toHaveBeenCalledTimes(2);
    } finally {
      openURL.mockRestore();
      delete (linking as { _validateURL?: unknown })._validateURL;
    }
  });

  it('keeps the installation anonymous while preserving permission handling', async () => {
    const { sdk } = makeSdk();
    const provider = new OneSignalRetentionNotificationProvider({
      appId: APP_ID,
      loadSdk: jest.fn().mockResolvedValue(sdk as never),
      platform: 'ios',
      releaseApproved: true,
      userDataEnabled: true,
    });

    await provider.bindExternalUser('user-1');
    await expect(
      provider.recordEvent('proof_submitted', { source: 'today' })
    ).rejects.toThrow('account-scoped data sharing is disabled');
    await expect(
      provider.syncInAppTriggers({
        app_surface: 'today',
        has_active_promise: 'true',
      })
    ).rejects.toThrow('account-scoped data sharing is disabled');
    await expect(
      provider.syncAudienceTags({ marketing_email_opt_in: true })
    ).rejects.toThrow('account-scoped data sharing is disabled');
    await expect(
      provider.syncEmailSubscription('person@example.com', true)
    ).rejects.toThrow('account-scoped data sharing is disabled');
    await expect(
      provider.removeInAppTriggers(['notification_prompt_context'])
    ).rejects.toThrow('account-scoped data sharing is disabled');
    await expect(provider.requestPushPermission(true)).resolves.toBe(true);
    await provider.unbindExternalUser();

    expect(sdk.login).not.toHaveBeenCalled();
    expect(sdk.User.trackEvent).not.toHaveBeenCalled();
    expect(sdk.InAppMessages.addTriggers).not.toHaveBeenCalled();
    expect(sdk.InAppMessages.removeTriggers).not.toHaveBeenCalled();
    expect(sdk.User.addTags).not.toHaveBeenCalled();
    expect(sdk.User.addEmail).not.toHaveBeenCalled();
    expect(sdk.User.removeEmail).not.toHaveBeenCalled();
    expect(sdk.Notifications.requestPermission).toHaveBeenCalledWith(true);
    expect(sdk.logout).toHaveBeenCalledTimes(3);
  });

  it('logs out without mutating provider triggers', async () => {
    const { sdk } = makeSdk();
    const provider = new OneSignalRetentionNotificationProvider({
      appId: APP_ID,
      loadSdk: jest.fn().mockResolvedValue(sdk as never),
      platform: 'ios',
      releaseApproved: true,
      userDataEnabled: true,
    });

    await provider.initialize();
    await expect(provider.unbindExternalUser()).resolves.toBeUndefined();

    expect(sdk.logout).toHaveBeenCalledTimes(2);
    expect(sdk.InAppMessages.removeTriggers).not.toHaveBeenCalled();
  });
});
