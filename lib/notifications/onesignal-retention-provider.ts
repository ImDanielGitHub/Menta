import type {
  InAppMessageDidDismissEvent,
  InAppMessageDidDisplayEvent,
  InAppMessageClickEvent,
  NotificationClickEvent,
  PushSubscriptionChangedState,
} from 'react-native-onesignal';
import { Linking, Platform } from 'react-native';

import { resolveNotificationActionUrl } from '@/lib/notifications/notification-actions';
import { trackProductEvent } from '@/lib/posthog';
import type {
  RetentionEventName,
  RetentionEventProperties,
  RetentionAudienceTags,
  RetentionInAppTriggerName,
  RetentionInAppTriggers,
  RetentionNotificationProvider,
} from '@/lib/notifications/retention-notification-client';

type OneSignalModule = typeof import('react-native-onesignal');
type OneSignalSdk = OneSignalModule['OneSignal'];

type OneSignalProviderOptions = Readonly<{
  appId: unknown;
  loadSdk?: () => Promise<OneSignalSdk>;
  openUrl?: (url: string) => Promise<unknown>;
  platform?: string;
  recordNotificationOpened?: (notificationId: number) => Promise<unknown>;
  releaseApproved: boolean;
  userDataEnabled: unknown;
}>;

const ONESIGNAL_APP_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ONESIGNAL_OWNED_IN_APP_TRIGGER_NAMES = [
  'app_surface',
  'has_active_promise',
  'is_pro',
  'notification_permission_status',
  'notification_prompt_context',
  'streak_state',
] as const;

const parseEnabled = (value: unknown): boolean =>
  value === true || value === 'true' || value === '1';

const loadOneSignalSdk = async (): Promise<OneSignalSdk> =>
  (await import('react-native-onesignal')).OneSignal;

export const isValidOneSignalAppId = (value: unknown): value is string =>
  typeof value === 'string' && ONESIGNAL_APP_ID.test(value.trim());

/**
 * Thin native adapter. Loading stays lazy so missing configuration, Expo Go,
 * web, and older native builds fall back to the existing Expo path instead of
 * evaluating an unavailable OneSignal TurboModule. A separate data-sharing
 * switch prevents account identity or retention state from leaving the device
 * until that release setting is explicitly approved.
 */
export class OneSignalRetentionNotificationProvider implements RetentionNotificationProvider {
  readonly configured: boolean;
  readonly name = 'onesignal';

  private readonly appId: string;
  private readonly loadSdk: () => Promise<OneSignalSdk>;
  private readonly openUrl: (url: string) => Promise<unknown>;
  private readonly recordNotificationOpened: (
    notificationId: number
  ) => Promise<unknown>;
  private initializationPromise: Promise<OneSignalSdk> | null = null;
  private activePromptContext:
    | 'first_promise'
    | 'promise_invite'
    | 'settings'
    | 'other' = 'other';
  private readonly permissionListeners = new Set<(granted: boolean) => void>();

  constructor(options: OneSignalProviderOptions) {
    this.appId = typeof options.appId === 'string' ? options.appId.trim() : '';
    this.configured =
      options.releaseApproved === true &&
      parseEnabled(options.userDataEnabled) &&
      (options.platform ?? Platform.OS) !== 'web' &&
      isValidOneSignalAppId(this.appId);
    this.loadSdk = options.loadSdk ?? loadOneSignalSdk;
    this.openUrl = options.openUrl ?? Linking.openURL;
    this.recordNotificationOpened =
      options.recordNotificationOpened ?? (() => Promise.resolve());
  }

  private recordOpenedFromPayload(value: unknown): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const candidate = (value as Record<string, unknown>).notificationId;
    const notificationId =
      typeof candidate === 'number'
        ? candidate
        : typeof candidate === 'string' && /^\d+$/.test(candidate)
          ? Number(candidate)
          : Number.NaN;
    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) return;
    void this.recordNotificationOpened(notificationId).catch(() => undefined);
  }

  private readonly handleNotificationClick = (
    event: NotificationClickEvent
  ): void => {
    const url = resolveNotificationActionUrl(event.notification.additionalData);
    if (url) {
      this.recordOpenedFromPayload(event.notification.additionalData);
      trackProductEvent('Notification Opened', {
        channel: 'onesignal_push',
      });
      void this.openUrl(url).catch(() => undefined);
    }
  };

  private readonly handleInAppMessageClick = (
    event: InAppMessageClickEvent
  ): void => {
    trackProductEvent('Notification In-App Outcome', {
      context: this.activePromptContext,
      outcome: 'clicked',
    });
    const url = resolveNotificationActionUrl({
      action: event.result.actionId,
    });
    if (url) {
      trackProductEvent('Notification Opened', {
        channel: 'onesignal_in_app',
      });
      void this.openUrl(url).catch(() => undefined);
    }
  };

  private readonly handleInAppMessageDisplayed = (
    _event: InAppMessageDidDisplayEvent
  ): void => {
    trackProductEvent('Notification In-App Outcome', {
      context: this.activePromptContext,
      outcome: 'displayed',
    });
  };

  private readonly handleInAppMessageDismissed = (
    _event: InAppMessageDidDismissEvent
  ): void => {
    trackProductEvent('Notification In-App Outcome', {
      context: this.activePromptContext,
      outcome: 'dismissed',
    });
  };

  private readonly handlePermissionChange = (granted: boolean): void => {
    for (const listener of this.permissionListeners) listener(granted);
  };

  private readonly handlePushSubscriptionChange = (
    event: PushSubscriptionChangedState
  ): void => {
    trackProductEvent('Notification Provider Outcome', {
      operation: 'push_subscription',
      outcome:
        event.current.optedIn && event.current.id && event.current.token
          ? 'succeeded'
          : 'failed',
      provider: 'onesignal',
    });
  };

  private getSdk(): Promise<OneSignalSdk> {
    if (!this.configured) {
      return Promise.reject(new Error('OneSignal is not configured'));
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.loadSdk().then(sdk => {
        sdk.initialize(this.appId);
        sdk.Notifications.addEventListener(
          'click',
          this.handleNotificationClick
        );
        sdk.InAppMessages.addEventListener(
          'click',
          this.handleInAppMessageClick
        );
        sdk.InAppMessages.addEventListener(
          'didDisplay',
          this.handleInAppMessageDisplayed
        );
        sdk.InAppMessages.addEventListener(
          'didDismiss',
          this.handleInAppMessageDismissed
        );
        sdk.Notifications.addEventListener(
          'permissionChange',
          this.handlePermissionChange
        );
        sdk.User.pushSubscription.addEventListener(
          'change',
          this.handlePushSubscriptionChange
        );
        return sdk;
      });
    }

    return this.initializationPromise;
  }

  async initialize(): Promise<void> {
    if (!this.configured) {
      trackProductEvent('Notification Provider Outcome', {
        operation: 'initialize',
        outcome: 'not_configured',
        provider: 'onesignal',
      });
      throw new Error('OneSignal is not configured');
    }
    try {
      await this.getSdk();
      trackProductEvent('Notification Provider Outcome', {
        operation: 'initialize',
        outcome: 'succeeded',
        provider: 'onesignal',
      });
    } catch (error) {
      trackProductEvent('Notification Provider Outcome', {
        operation: 'initialize',
        outcome: 'failed',
        provider: 'onesignal',
      });
      throw error;
    }
  }

  async bindExternalUser(userId: string): Promise<void> {
    try {
      const sdk = await this.getSdk();
      sdk.login(userId);
      trackProductEvent('Notification Provider Outcome', {
        operation: 'bind_user',
        outcome: 'succeeded',
        provider: 'onesignal',
      });
    } catch (error) {
      trackProductEvent('Notification Provider Outcome', {
        operation: 'bind_user',
        outcome: this.configured ? 'failed' : 'not_configured',
        provider: 'onesignal',
      });
      throw error;
    }
  }

  async recordEvent(
    event: RetentionEventName,
    properties: RetentionEventProperties
  ): Promise<void> {
    const sdk = await this.getSdk();
    sdk.User.trackEvent(event, properties);
  }

  async syncInAppTriggers(triggers: RetentionInAppTriggers): Promise<void> {
    const sdk = await this.getSdk();
    const context = triggers.notification_prompt_context;
    if (
      context === 'first_promise' ||
      context === 'promise_invite' ||
      context === 'settings'
    ) {
      this.activePromptContext = context;
    }
    sdk.InAppMessages.addTriggers(triggers);
  }

  async removeInAppTriggers(
    names: readonly RetentionInAppTriggerName[]
  ): Promise<void> {
    const sdk = await this.getSdk();
    sdk.InAppMessages.removeTriggers([...names]);
    if (names.includes('notification_prompt_context')) {
      this.activePromptContext = 'other';
    }
  }

  async requestPushPermission(fallbackToSettings: boolean): Promise<boolean> {
    const sdk = await this.getSdk();
    return sdk.Notifications.requestPermission(fallbackToSettings);
  }

  subscribePermissionChanges(listener: (granted: boolean) => void): () => void {
    this.permissionListeners.add(listener);
    return () => this.permissionListeners.delete(listener);
  }

  async syncAudienceTags(tags: RetentionAudienceTags): Promise<void> {
    const sdk = await this.getSdk();
    sdk.User.addTags(
      Object.fromEntries(
        Object.entries(tags).map(([key, value]) => [key, String(value)])
      )
    );
  }

  async syncEmailSubscription(email: string, enabled: boolean): Promise<void> {
    const sdk = await this.getSdk();
    if (enabled) sdk.User.addEmail(email);
    else sdk.User.removeEmail(email);
    trackProductEvent('Notification Provider Outcome', {
      operation: 'channel_subscription',
      outcome: 'succeeded',
      provider: 'onesignal',
    });
  }

  async unbindExternalUser(): Promise<void> {
    if (!this.initializationPromise) {
      trackProductEvent('Notification Provider Outcome', {
        operation: 'unbind_user',
        outcome: 'not_configured',
        provider: 'onesignal',
      });
      return;
    }
    const sdk = await this.initializationPromise;

    try {
      sdk.InAppMessages.removeTriggers([
        ...ONESIGNAL_OWNED_IN_APP_TRIGGER_NAMES,
      ]);
    } catch {}

    // Identity removal is the privacy-critical operation. Do not let a local
    // in-app-trigger cleanup error prevent logout.
    try {
      sdk.logout();
      trackProductEvent('Notification Provider Outcome', {
        operation: 'unbind_user',
        outcome: 'succeeded',
        provider: 'onesignal',
      });
    } catch (error) {
      trackProductEvent('Notification Provider Outcome', {
        operation: 'unbind_user',
        outcome: 'failed',
        provider: 'onesignal',
      });
      throw error;
    }
  }
}
