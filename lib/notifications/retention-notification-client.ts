import { OneSignalRetentionNotificationProvider } from '@/lib/notifications/onesignal-retention-provider';
import { notificationService } from '@/lib/services/notification-service';

export const RETENTION_EVENT_NAMES = [
  'app_opened',
  'notification_opened',
  'notification_permission_changed',
  'promise_created',
  'proof_submitted',
  'proof_approved',
  'referral_shared',
  'streak_state_changed',
  'subscription_started',
] as const;

export type RetentionEventName = (typeof RETENTION_EVENT_NAMES)[number];

export type RetentionEventProperties = Partial<{
  days_since_activity: number;
  has_active_promise: boolean;
  is_pro: boolean;
  notification_type: string;
  permission_status: 'granted' | 'denied' | 'undetermined';
  source:
    | 'notification'
    | 'onboarding'
    | 'promise_detail'
    | 'settings'
    | 'system'
    | 'today';
  streak_state: 'active' | 'at_risk' | 'missed' | 'protected' | 'restarted';
}>;

export const RETENTION_IN_APP_TRIGGER_NAMES = [
  'app_surface',
  'has_active_promise',
  'is_pro',
  'notification_permission_status',
  'notification_prompt_context',
  'streak_state',
] as const;

export type RetentionInAppTriggerName =
  (typeof RETENTION_IN_APP_TRIGGER_NAMES)[number];

export type RetentionInAppState = Partial<{
  app_surface: 'onboarding' | 'promise_detail' | 'settings' | 'today';
  has_active_promise: boolean;
  is_pro: boolean;
  notification_permission_status: 'granted' | 'denied' | 'undetermined';
  notification_prompt_context: 'first_promise' | 'promise_invite' | 'settings';
  streak_state: 'active' | 'at_risk' | 'missed' | 'protected' | 'restarted';
}>;

export type RetentionInAppTriggers = Partial<
  Record<RetentionInAppTriggerName, string>
>;

export interface RetentionNotificationProvider {
  readonly configured: boolean;
  readonly name: string;
  initialize?(): Promise<void>;
  bindExternalUser(userId: string): Promise<void>;
  recordEvent(
    event: RetentionEventName,
    properties: RetentionEventProperties
  ): Promise<void>;
  syncInAppTriggers?(triggers: RetentionInAppTriggers): Promise<void>;
  removeInAppTriggers?(
    names: readonly RetentionInAppTriggerName[]
  ): Promise<void>;
  requestPushPermission?(fallbackToSettings: boolean): Promise<boolean>;
  subscribePermissionChanges?(listener: (granted: boolean) => void): () => void;
  syncAudienceTags?(tags: RetentionAudienceTags): Promise<void>;
  syncEmailSubscription?(email: string, enabled: boolean): Promise<void>;
  unbindExternalUser(): Promise<void>;
}

export type RetentionAudienceTags = Partial<{
  has_active_promise: boolean;
  is_pro: boolean;
  marketing_email_opt_in: boolean;
  notification_permission: 'granted' | 'denied' | 'undetermined';
  notification_qa: boolean;
}>;

export type ConfirmedProfileBinding = Readonly<{
  profileConfirmed: true;
  userId: string;
}>;

const SAFE_ACCOUNT_ID = /^[A-Za-z0-9_-]{1,128}$/;
const SAFE_NOTIFICATION_TYPE = /^[a-z][a-z0-9_]{0,63}$/;
const EVENT_NAMES = new Set<string>(RETENTION_EVENT_NAMES);
const PERMISSION_STATUSES = new Set(['granted', 'denied', 'undetermined']);
const SOURCES = new Set([
  'notification',
  'onboarding',
  'promise_detail',
  'settings',
  'system',
  'today',
]);
const STREAK_STATES = new Set([
  'active',
  'at_risk',
  'missed',
  'protected',
  'restarted',
]);
const APP_SURFACES = new Set([
  'onboarding',
  'promise_detail',
  'settings',
  'today',
]);
const NOTIFICATION_PROMPT_CONTEXTS = new Set([
  'first_promise',
  'promise_invite',
  'settings',
]);
const SAFE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEnabled = (value: unknown): boolean =>
  value === true || value === 'true' || value === '1';

export const isRetentionEventName = (
  value: unknown
): value is RetentionEventName =>
  typeof value === 'string' && EVENT_NAMES.has(value);

export const sanitizeRetentionEventProperties = (
  value: unknown
): RetentionEventProperties => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const output: RetentionEventProperties = {};

  if (
    typeof input.days_since_activity === 'number' &&
    Number.isInteger(input.days_since_activity) &&
    input.days_since_activity >= 0 &&
    input.days_since_activity <= 365
  ) {
    output.days_since_activity = input.days_since_activity;
  }
  if (typeof input.has_active_promise === 'boolean') {
    output.has_active_promise = input.has_active_promise;
  }
  if (typeof input.is_pro === 'boolean') output.is_pro = input.is_pro;
  if (
    typeof input.notification_type === 'string' &&
    SAFE_NOTIFICATION_TYPE.test(input.notification_type)
  ) {
    output.notification_type = input.notification_type;
  }
  if (
    typeof input.permission_status === 'string' &&
    PERMISSION_STATUSES.has(input.permission_status)
  ) {
    output.permission_status = input.permission_status as
      | 'granted'
      | 'denied'
      | 'undetermined';
  }
  if (typeof input.source === 'string' && SOURCES.has(input.source)) {
    output.source = input.source as RetentionEventProperties['source'];
  }
  if (
    typeof input.streak_state === 'string' &&
    STREAK_STATES.has(input.streak_state)
  ) {
    output.streak_state =
      input.streak_state as RetentionEventProperties['streak_state'];
  }

  return output;
};

export const sanitizeRetentionInAppState = (
  value: unknown
): RetentionInAppTriggers => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const output: RetentionInAppTriggers = {};

  if (
    typeof input.app_surface === 'string' &&
    APP_SURFACES.has(input.app_surface)
  ) {
    output.app_surface = input.app_surface;
  }
  if (typeof input.has_active_promise === 'boolean') {
    output.has_active_promise = String(input.has_active_promise);
  }
  if (typeof input.is_pro === 'boolean') {
    output.is_pro = String(input.is_pro);
  }
  if (
    typeof input.notification_permission_status === 'string' &&
    PERMISSION_STATUSES.has(input.notification_permission_status)
  ) {
    output.notification_permission_status =
      input.notification_permission_status;
  }
  if (
    typeof input.notification_prompt_context === 'string' &&
    NOTIFICATION_PROMPT_CONTEXTS.has(input.notification_prompt_context)
  ) {
    output.notification_prompt_context = input.notification_prompt_context;
  }
  if (
    typeof input.streak_state === 'string' &&
    STREAK_STATES.has(input.streak_state)
  ) {
    output.streak_state = input.streak_state;
  }

  return output;
};

export class NoopRetentionNotificationProvider implements RetentionNotificationProvider {
  readonly configured = false;
  readonly name = 'none';

  bindExternalUser(_userId: string): Promise<void> {
    return Promise.resolve();
  }

  recordEvent(
    _event: RetentionEventName,
    _properties: RetentionEventProperties
  ): Promise<void> {
    return Promise.resolve();
  }

  unbindExternalUser(): Promise<void> {
    return Promise.resolve();
  }
}

type ProviderRegistry = Readonly<Record<string, RetentionNotificationProvider>>;

export const selectRetentionNotificationProvider = (options: {
  enabled: unknown;
  providerName: unknown;
  providers?: ProviderRegistry;
}): RetentionNotificationProvider => {
  if (!parseEnabled(options.enabled)) {
    return new NoopRetentionNotificationProvider();
  }

  const providerName =
    typeof options.providerName === 'string'
      ? options.providerName.trim().toLowerCase()
      : '';
  const provider = providerName ? options.providers?.[providerName] : undefined;

  return provider?.configured
    ? provider
    : new NoopRetentionNotificationProvider();
};

export class RetentionNotificationClient {
  private boundUserId: string | null = null;
  private transitionBarrier: Promise<void> = Promise.resolve();
  private transitionEpoch = 0;

  constructor(private readonly provider: RetentionNotificationProvider) {}

  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.transitionBarrier.then(work, work);
    this.transitionBarrier = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  async initialize(): Promise<boolean> {
    if (!this.provider.configured) return false;

    return this.enqueue(async () => {
      try {
        await this.provider.initialize?.();
        return true;
      } catch {
        return false;
      }
    });
  }

  async bindConfirmedProfile(
    binding: ConfirmedProfileBinding
  ): Promise<boolean> {
    const userId = binding?.userId?.trim() ?? '';
    if (
      binding?.profileConfirmed !== true ||
      !SAFE_ACCOUNT_ID.test(userId) ||
      !this.provider.configured
    ) {
      return false;
    }

    const epoch = ++this.transitionEpoch;
    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch) return false;
      if (this.boundUserId === userId) return true;

      if (this.boundUserId) {
        await this.provider.unbindExternalUser();
        this.boundUserId = null;
      }

      try {
        await this.provider.bindExternalUser(userId);
      } catch {
        return false;
      }

      if (epoch !== this.transitionEpoch) {
        await this.provider.unbindExternalUser().catch(() => undefined);
        return false;
      }

      this.boundUserId = userId;
      return true;
    });
  }

  async unbindAccount(userId: string | null | undefined): Promise<boolean> {
    const candidate = userId?.trim() ?? '';
    const epoch = ++this.transitionEpoch;

    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch || this.boundUserId !== candidate) {
        return false;
      }

      try {
        await this.provider.unbindExternalUser();
      } catch {
        return false;
      }
      this.boundUserId = null;
      return true;
    });
  }

  async recordEvent(
    event: unknown,
    properties: unknown = {}
  ): Promise<boolean> {
    if (!isRetentionEventName(event) || !this.provider.configured) return false;
    const epoch = this.transitionEpoch;

    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch || !this.boundUserId) return false;

      try {
        await this.provider.recordEvent(
          event,
          sanitizeRetentionEventProperties(properties)
        );
        return true;
      } catch {
        return false;
      }
    });
  }

  async syncInAppState(value: unknown): Promise<boolean> {
    if (!this.provider.configured || !this.provider.syncInAppTriggers) {
      return false;
    }
    const triggers = sanitizeRetentionInAppState(value);
    if (Object.keys(triggers).length === 0) return false;
    const epoch = this.transitionEpoch;

    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch || !this.boundUserId) return false;

      try {
        await this.provider.syncInAppTriggers?.(triggers);
        return true;
      } catch {
        return false;
      }
    });
  }

  async clearInAppState(
    names: readonly RetentionInAppTriggerName[]
  ): Promise<boolean> {
    if (!this.provider.configured || !this.provider.removeInAppTriggers) {
      return false;
    }
    const ownedNames = names.filter(name =>
      RETENTION_IN_APP_TRIGGER_NAMES.includes(name)
    );
    if (ownedNames.length === 0) return false;
    const epoch = this.transitionEpoch;

    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch || !this.boundUserId) return false;
      try {
        await this.provider.removeInAppTriggers?.(ownedNames);
        return true;
      } catch {
        return false;
      }
    });
  }

  async requestPushPermission(
    fallbackToSettings = true
  ): Promise<boolean | null> {
    if (!this.provider.configured || !this.provider.requestPushPermission) {
      return null;
    }
    const epoch = this.transitionEpoch;
    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch || !this.boundUserId) return null;
      try {
        return (
          (await this.provider.requestPushPermission?.(fallbackToSettings)) ??
          null
        );
      } catch {
        return null;
      }
    });
  }

  subscribePermissionChanges(listener: (granted: boolean) => void): () => void {
    if (
      !this.provider.configured ||
      !this.provider.subscribePermissionChanges
    ) {
      return () => undefined;
    }
    return this.provider.subscribePermissionChanges(listener);
  }

  async syncAudienceTags(value: unknown): Promise<boolean> {
    if (!this.provider.configured || !this.provider.syncAudienceTags) {
      return false;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return false;
    const input = value as Record<string, unknown>;
    const tags: RetentionAudienceTags = {};
    if (typeof input.has_active_promise === 'boolean') {
      tags.has_active_promise = input.has_active_promise;
    }
    if (typeof input.is_pro === 'boolean') tags.is_pro = input.is_pro;
    if (typeof input.marketing_email_opt_in === 'boolean') {
      tags.marketing_email_opt_in = input.marketing_email_opt_in;
    }
    if (
      typeof input.notification_permission === 'string' &&
      PERMISSION_STATUSES.has(input.notification_permission)
    ) {
      tags.notification_permission = input.notification_permission as
        | 'granted'
        | 'denied'
        | 'undetermined';
    }
    if (typeof input.notification_qa === 'boolean') {
      tags.notification_qa = input.notification_qa;
    }
    if (Object.keys(tags).length === 0) return false;
    const epoch = this.transitionEpoch;
    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch || !this.boundUserId) return false;
      try {
        await this.provider.syncAudienceTags?.(tags);
        return true;
      } catch {
        return false;
      }
    });
  }

  async syncEmailSubscription(
    email: unknown,
    enabled: boolean
  ): Promise<boolean> {
    if (!this.provider.configured || !this.provider.syncEmailSubscription) {
      return false;
    }
    const candidate =
      typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!candidate || candidate.length > 254 || !SAFE_EMAIL.test(candidate)) {
      return false;
    }
    const epoch = this.transitionEpoch;
    return this.enqueue(async () => {
      if (epoch !== this.transitionEpoch || !this.boundUserId) return false;
      try {
        await this.provider.syncEmailSubscription?.(candidate, enabled);
        return true;
      } catch {
        return false;
      }
    });
  }
}

// Daniel approved the OneSignal client cut-over for the next native release.
// Runtime configuration still has to opt in and provide the live-verified
// public App ID before the SDK can initialize or transfer allowlisted data.
const ONESIGNAL_USER_DATA_RELEASE_APPROVED = true;

const oneSignalProvider = new OneSignalRetentionNotificationProvider({
  appId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
  recordNotificationOpened: notificationId =>
    notificationService.recordRemoteNotificationOpened(notificationId),
  releaseApproved: ONESIGNAL_USER_DATA_RELEASE_APPROVED,
  userDataEnabled: process.env.EXPO_PUBLIC_ONESIGNAL_USER_DATA_ENABLED,
});

const defaultProvider = selectRetentionNotificationProvider({
  enabled: process.env.EXPO_PUBLIC_RETENTION_NOTIFICATIONS_ENABLED,
  providerName: process.env.EXPO_PUBLIC_RETENTION_NOTIFICATION_PROVIDER,
  providers: { onesignal: oneSignalProvider },
});

export const retentionNotificationClient = new RetentionNotificationClient(
  defaultProvider
);
