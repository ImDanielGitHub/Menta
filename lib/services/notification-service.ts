import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import {
  notificationAction,
  resolveNotificationActionUrl,
} from '@/lib/notifications/notification-actions';
import { trackProductEvent } from '@/lib/posthog';
import { translate } from '@/lib/localization';
import { logCrash } from '@/lib/sentry';
import { withTimeout } from '@/utils/api';

const notificationDebugLog = (..._args: unknown[]): void => undefined;
const MIN_REMOTE_COACH_BUILD = 128;
const PREFERENCE_CACHE_TTL_MS = 2 * 60 * 1000;
const NOTIFICATION_PERMISSION_TIMEOUT_MS = 8_000;
const NOTIFICATION_REGISTRATION_TIMEOUT_MS = 15_000;

const getMobilePushPlatform = (): 'ios' | 'android' | null =>
  Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;

const withNotificationPermissionTimeout = async <T>(
  operation: Promise<T>,
  step: 'check' | 'request'
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      const error = new Error(
        `Notification permission ${step} did not finish in time.`
      );
      error.name = 'NotificationPermissionTimeoutError';
      reject(error);
    }, NOTIFICATION_PERMISSION_TIMEOUT_MS);

    operation.then(
      value => {
        clearTimeout(timeout);
        resolve(value);
      },
      error => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });

const supportsServerCoachReminders = (): boolean => {
  const build = Number.parseInt(Application.nativeBuildVersion ?? '', 10);
  return Number.isFinite(build) && build >= MIN_REMOTE_COACH_BUILD;
};

export enum NotificationType {
  STREAK_REMINDER = 'streak_reminder',
  STREAK_ACHIEVEMENT = 'streak_achievement',
  STREAK_RECOVERY = 'streak_recovery',
  CHALLENGE_START = 'challenge_start',
  CHALLENGE_COMPLETE = 'challenge_complete',
  CHALLENGE_EXPIRING = 'challenge_expiring',
  CHALLENGE_EXPIRED = 'challenge_expired',
  REVIEW_REMINDER = 'review_reminder',
  VERIFICATION_PENDING = 'verification_pending',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
  GROUP_ACTIVITY = 'group_activity',
  GROUP_STREAK_WARNING = 'group_streak_warning',
  GROUP_MILESTONE = 'group_milestone',
  DAILY_INSPIRATION = 'daily_inspiration',
  LOW_ACTIVITY = 'low_activity',
  BADGE_UNLOCKED = 'badge_unlocked',
  MOMENTA_REWARD = 'momenta_reward',
  APP_UPDATE = 'app_update',
  MAINTENANCE = 'maintenance',
  TEST_NOTIFICATION = 'test_notification',
}

export type TestNotificationRequestResult =
  | 'queued'
  | 'rate-limited'
  | 'not-ready'
  | 'auth-required'
  | 'failed';

export interface NotificationPayload {
  type: NotificationType;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  priority?: 1 | 2 | 3 | 4 | 5; // 1 = critical, 5 = low
  scheduledFor?: Date;
  variables?: Record<string, unknown>;
}

export interface NotificationTemplate {
  templates: string[];
}

export interface UserNotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  marketing_email_opt_in?: boolean;
  marketing_email_opted_at?: string | null;
  marketing_email_provider_sync_pending?: boolean;
  challenge_reminders: boolean;
  group_updates: boolean;
  streak_alerts: boolean;
  preferred_reminder_time: string | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  typical_proof_hour?: string | null;
  ignore_coach_until?: string | null;
  timezone: string | null;
  expo_push_token: string | null;
  device_permission_status?: 'granted' | 'denied' | 'undetermined' | null;
  device_permission_checked_at?: string | null;
  push_token_status?: 'active' | 'invalid' | 'missing' | null;
  push_token_updated_at?: string | null;
  push_app_build?: number | null;
  push_platform?: 'ios' | 'android' | null;
  remote_coach_contract_version?: number | null;
  remote_coach_activated_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

const preferenceMinutes = (value: string | null | undefined): number | null => {
  const match = /^(\d{2}):(\d{2})/.exec(value ?? '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
};

export const resolveReminderTimeOutsideQuietHours = (
  reminderTime: Date,
  preference: Pick<
    UserNotificationPreferences,
    'quiet_hours_end' | 'quiet_hours_start'
  > | null
): Date => {
  const start = preferenceMinutes(preference?.quiet_hours_start);
  const end = preferenceMinutes(preference?.quiet_hours_end);
  if (start === null || end === null || start === end) return reminderTime;

  const current = reminderTime.getHours() * 60 + reminderTime.getMinutes();
  const inside =
    start < end
      ? current >= start && current < end
      : current >= start || current < end;
  if (!inside) return reminderTime;

  const adjusted = new Date(reminderTime);
  adjusted.setHours(Math.floor(end / 60), end % 60, 0, 0);
  return adjusted;
};

export interface UserGroupNotificationPreferences {
  user_id: string;
  group_id: string;
  notify_all: boolean;
  notify_mentions: boolean;
  notify_daily_summary: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

type ChallengeReminderSyncResult =
  | 'scheduled'
  | 'remote-owned'
  | 'no-active-promises'
  | 'permission-not-granted'
  | 'stopped';

class NotificationService {
  private static instance: NotificationService;
  private templates: Map<NotificationType, NotificationTemplate> = new Map();
  private isInitialized = false;
  private temporaryPushToken?: string;
  private reminderSyncInFlightUsers = new Set<string>();
  private stoppedUserScopes = new Set<string>();
  private userScopeEpochs = new Map<string, number>();
  private preferenceCache = new Map<
    string,
    {
      epoch: number;
      expiresAt: number;
      timezone: string;
      version: number;
      value: UserNotificationPreferences;
    }
  >();
  private preferenceCacheVersions = new Map<string, number>();
  private preferenceRequests = new Map<
    string,
    Promise<UserNotificationPreferences | null>
  >();

  startUserScopedWork(userId: string): void {
    if (!userId) return;
    this.clearPreferenceCache(userId);
    this.stoppedUserScopes.delete(userId);
    this.userScopeEpochs.set(
      userId,
      (this.userScopeEpochs.get(userId) ?? 0) + 1
    );
  }

  stopUserScopedWork(userId: string): void {
    if (!userId) return;
    this.clearPreferenceCache(userId);
    this.stoppedUserScopes.add(userId);
    this.userScopeEpochs.set(
      userId,
      (this.userScopeEpochs.get(userId) ?? 0) + 1
    );
    this.reminderSyncInFlightUsers.delete(userId);
    // Local reminders can reveal a former account after sign-out or deletion.
    // This cleanup deliberately does not depend on an active user scope.
    void this.cancelScheduledRemindersForUser(userId);
  }

  private clearPreferenceCache(userId: string): void {
    this.preferenceCache.delete(userId);
    this.preferenceCacheVersions.set(
      userId,
      (this.preferenceCacheVersions.get(userId) ?? 0) + 1
    );
    for (const key of this.preferenceRequests.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.preferenceRequests.delete(key);
      }
    }
  }

  private captureUserScope(userId: string): number | null {
    if (
      !userId ||
      this.stoppedUserScopes.has(userId) ||
      !this.userScopeEpochs.has(userId)
    ) {
      return null;
    }
    return this.userScopeEpochs.get(userId) ?? null;
  }

  private isUserScopeCurrent(userId: string, epoch: number | null): boolean {
    return (
      epoch !== null &&
      !this.stoppedUserScopes.has(userId) &&
      (this.userScopeEpochs.get(userId) ?? 0) === epoch
    );
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(
    options: { requestPermissionNow?: boolean } = {}
  ): Promise<void> {
    const { requestPermissionNow = true } = options;
    if (this.isInitialized) return;

    try {
      notificationDebugLog(
        '📱 Starting notification service initialization...'
      );

      // Set up notification handler (moved from module level to avoid conflicts)
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Set up notification channels for Android 13+ (must be done before requesting permissions)
      await this.setupNotificationChannels();

      // Load notification templates from database (non-blocking)
      this.loadTemplates().catch(error => {
        console.warn('📱 Failed to load notification templates:', error);
      });

      // Optionally request notification permissions (prefer prompting after onboarding)
      if (requestPermissionNow) {
        await this.requestPermissions();
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      notificationDebugLog('📱 Notification service initialized successfully');
    } catch (error) {
      console.error('📱 Failed to initialize notification service:', error);
      // Don't throw error - let the app continue without notifications
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  private async setupNotificationChannels(): Promise<void> {
    try {
      if (Platform.OS !== 'android') {
        notificationDebugLog(
          '📱 iOS platform - notification channels not needed'
        );
        return;
      }

      notificationDebugLog('📱 Setting up Android notification channels...');

      // Set up notification channels for different types of notifications
      // This is CRITICAL for Android 13+ - permissions won't work without channels
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Menta notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: translate('en-NZ', 'domain.notifications.channel_updates'),
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Proof reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: translate(
          'en-NZ',
          'domain.notifications.channel_reminders'
        ),
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('group_activity', {
        name: 'Group updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
        description: translate('en-NZ', 'domain.notifications.channel_groups'),
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('achievements', {
        name: 'Progress and rewards',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        lightColor: '#FFD700',
        description: translate(
          'en-NZ',
          'domain.notifications.channel_progress'
        ),
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('verification_updates', {
        name: 'Proof updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: translate('en-NZ', 'domain.notifications.channel_proof'),
        sound: 'default',
      });

      notificationDebugLog(
        '📱 Android notification channels set up successfully'
      );
    } catch (error) {
      console.error('📱 Failed to set up notification channels:', error);
      // Don't throw - this shouldn't block app initialization
    }
  }

  private getLocalTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  getCurrentTimezone(): string {
    return this.getLocalTimezone();
  }

  private getExpoProjectId(): string | undefined {
    const extra = Constants.expoConfig?.extra as
      | { eas?: { projectId?: string } }
      | undefined;
    return (
      extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID
    );
  }

  private async getExpoPushToken(): Promise<string> {
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: this.getExpoProjectId(),
    });

    return pushTokenData.data;
  }

  private async loadTemplates(): Promise<void> {
    try {
      type TemplateRow =
        Database['public']['Tables']['notification_templates']['Row'];

      // Load simple (title/body) templates and group by NotificationType derived from template_key
      const { data, error } = await supabase
        .from('notification_templates')
        .select('template_key, body');

      if (error) throw error;

      // Clear any existing cached templates before populating
      this.templates.clear();

      (data as Pick<TemplateRow, 'template_key' | 'body'>[] | null)?.forEach(
        row => {
          const templateKey = row.template_key;
          // Derive the NotificationType from the template_key. We support keys like
          // "streak_reminder" or namespaced keys like "streak_reminder.default.1"
          const typeCandidate = (templateKey?.split?.('.')?.[0] ||
            templateKey) as string;
          const isValidType = Object.values(NotificationType).includes(
            typeCandidate as NotificationType
          );

          if (!isValidType) return;

          const notificationType = typeCandidate as NotificationType;
          const body = typeof row.body === 'string' ? row.body : '';
          if (!body.trim()) return;

          const existing = this.templates.get(notificationType);
          if (existing && Array.isArray(existing.templates)) {
            existing.templates.push(body);
          } else {
            this.templates.set(notificationType, { templates: [body] });
          }
        }
      );

      notificationDebugLog(
        `📋 Loaded ${this.templates.size} notification template groups`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to load notification templates:', error.message);
      } else {
        console.error('Failed to load notification templates – unknown error');
      }
      // Don't throw - this is not critical for app startup
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        notificationDebugLog('📱 Web platform - skipping push notifications');
        return true;
      }

      const { status: existingStatus } =
        await withNotificationPermissionTimeout(
          Notifications.getPermissionsAsync(),
          'check'
        );
      let finalStatus = existingStatus;

      // A denied permission is already a user decision. On iOS, asking again
      // cannot show the system sheet and on Android it can produce a repeated
      // prompt. Send the current state to the server and let the settings
      // surface guide the user to the phone controls instead.
      if (existingStatus === 'undetermined') {
        const { status } = await withNotificationPermissionTimeout(
          Notifications.requestPermissionsAsync(),
          'request'
        );
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('📱 Push notification permissions not granted');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id && this.captureUserScope(user.id) !== null) {
          await this.updateUserPreferences(user.id, {
            device_permission_status:
              finalStatus === 'denied' ? 'denied' : 'undetermined',
            device_permission_checked_at: new Date().toISOString(),
            expo_push_token: null,
            push_platform: getMobilePushPlatform(),
            push_token_status: 'missing',
            push_token_updated_at: new Date().toISOString(),
          });
        }
        return false;
      }

      // Get push token but don't require user to be available yet
      try {
        const pushToken = await this.getExpoPushToken();
        const timezone = this.getLocalTimezone();

        // Try to store push token, but don't fail if user isn't available yet
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.id) {
            await this.updateUserPushToken(user.id, pushToken, timezone);
            await this.syncChallengeRemindersForUser(user.id);
          } else {
            // Store token temporarily - we'll save it later when user is authenticated
            this.temporaryPushToken = pushToken;
          }
        } catch (tokenStoreError) {
          console.warn('📱 Could not store push token yet:', tokenStoreError);
          // Store token temporarily
          this.temporaryPushToken = pushToken;
        }
      } catch (tokenError: unknown) {
        // Handle specific error cases more gracefully
        const errorMessage =
          tokenError instanceof Error
            ? tokenError.message
            : String(tokenError || 'Unknown token error');

        if (errorMessage.includes('SERVICE_NOT_AVAILABLE')) {
          console.warn(
            '📱 Google Play Services not available - push notifications will be limited'
          );
          console.warn(
            '📱 This is common on emulators or devices without Google Play Services'
          );
        } else if (errorMessage.includes('TIMEOUT')) {
          console.warn('📱 Push token request timed out - will retry later');
        } else if (errorMessage.includes('NETWORK_ERROR')) {
          console.warn(
            '📱 Network error getting push token - will retry later'
          );
        } else {
          console.warn('📱 Could not get push token:', errorMessage);
        }

        // Don't return false for token errors - permissions were granted
        // The app can still function without push tokens
        return true;
      }

      notificationDebugLog('📱 Push notification permissions granted');
      return true;
    } catch (error) {
      console.error('📱 Failed to request notification permissions:', error);
      return false;
    }
  }

  private setupNotificationListeners(): void {
    try {
      // Handle notification received while app is foregrounded
      Notifications.addNotificationReceivedListener(notification => {
        notificationDebugLog('📱 Notification received:', notification);
        this.handleNotificationReceived(notification);
      });

      // Handle notification tapped/clicked
      Notifications.addNotificationResponseReceivedListener(response => {
        notificationDebugLog('📱 Notification tapped:', response);
        this.handleNotificationTapped(response);
      });

      // Store subscriptions for cleanup if needed
      notificationDebugLog('📱 Notification listeners set up successfully');
    } catch (error) {
      console.error('📱 Failed to set up notification listeners:', error);
    }
  }

  private async handleNotificationReceived(
    notification: Notifications.Notification
  ): Promise<void> {
    const idCandidate = notification.request.content.data?.notificationId;
    if (typeof idCandidate === 'number') {
      await this.markNotificationDelivered(idCandidate);
    }
  }

  private async handleNotificationTapped(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const idCandidate =
      response.notification.request.content.data?.notificationId;
    if (typeof idCandidate === 'number') {
      await this.markNotificationOpened(idCandidate);
    }

    // Handle navigation based on notification type
    const notificationType = response.notification.request.content.data?.type;
    const data = response.notification.request.content.data;

    // Notification payloads are untrusted input. Resolve only named actions or
    // the narrow legacy route set retained for already-queued notifications.
    try {
      const url = resolveNotificationActionUrl(data);
      if (url) {
        trackProductEvent('Notification Opened', {
          channel: 'expo_push',
        });
        Linking.openURL(url).catch(() => undefined);
      }
    } catch {}

    switch (notificationType) {
      case NotificationType.CHALLENGE_START:
      case NotificationType.CHALLENGE_COMPLETE:
        if (data?.challengeId) {
          // Navigate to challenge details
        }
        break;
      case NotificationType.GROUP_ACTIVITY:
      case NotificationType.GROUP_MILESTONE:
        if (data?.groupId) {
          // Navigate to group details
        }
        break;
      case NotificationType.VERIFICATION_APPROVED:
        if (data?.challengeId) {
          // Navigate to challenge details to see updated streak
        }
        break;
      case NotificationType.VERIFICATION_REJECTED:
        if (data?.challengeId) {
          // Navigate to verification/resubmission
        }
        break;
    }
  }

  async sendNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Check if user can receive notification
      const canSend = await this.canSendNotificationToUser(
        userId,
        payload.type,
        payload.priority || 3
      );
      if (!canSend) {
        notificationDebugLog(
          `📱 Cannot send notification to user ${userId} - restrictions apply`
        );
        return false;
      }

      // Get notification message (fallback to sensible default when template missing)
      const message = await this.getNotificationMessage(
        payload.type,
        payload.variables
      );
      if (!message) {
        console.error(
          '📱 No message template found for notification type:',
          payload.type
        );
      }

      const title = payload.title || this.getDefaultTitle(payload.type);
      const body =
        payload.body ||
        message ||
        this.getFallbackMessage(payload.type, payload.variables);
      if (!body) {
        console.error(
          '📱 No body available for notification type even after fallback:',
          payload.type
        );
        return false;
      }

      // Store notification in database
      const { data: notificationData, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          notification_type: payload.type,
          title,
          body,
          payload: payload.data || {},
          metadata: payload.variables || {},
          priority: payload.priority || 3,
          scheduled_for: payload.scheduledFor?.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const notification = notificationData as { id: number };
      const scheduledFor =
        payload.scheduledFor?.toISOString() || new Date().toISOString();

      // Server pipeline owns remote notification delivery and delivery tracking.
      const { data: enqueueResult, error: enqueueError } =
        await supabase.functions.invoke('enqueue-notification-job', {
          body: {
            userId,
            jobType: payload.type,
            payload: {
              notificationId: notification.id,
              title,
              body,
              data: {
                ...payload.data,
                notificationId: notification.id,
                type: payload.type,
              },
              metadata: payload.variables || {},
              priority: payload.priority || 3,
            },
            scheduledFor,
            idempotencyKey: `notif:${notification.id}`,
          },
        });

      if (enqueueError) {
        throw enqueueError;
      }

      if (
        !enqueueResult ||
        (enqueueResult as { success?: boolean }).success !== true
      ) {
        throw new Error('Failed to enqueue notification job');
      }

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  async requestTestNotification(
    userId: string
  ): Promise<TestNotificationRequestResult> {
    const scope = this.captureUserScope(userId);
    if (scope === null) return 'auth-required';

    const { data, error } = await supabase.rpc('request_test_notification_v1');
    if (!this.isUserScopeCurrent(userId, scope)) return 'auth-required';
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : null;
    switch (row?.status) {
      case 'QUEUED':
        return 'queued';
      case 'RATE_LIMITED':
        return 'rate-limited';
      case 'NOT_READY':
        return 'not-ready';
      case 'AUTH_REQUIRED':
        return 'auth-required';
      default:
        return 'failed';
    }
  }

  private async sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      // Note: Push notifications have limitations in Expo Go
      // For full functionality, use development builds or production builds
      // Get user's push token
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('expo_push_token')
        .eq('user_id', userId)
        .single();

      const pushToken = (prefs as { expo_push_token?: string | null })
        ?.expo_push_token;

      if (!pushToken) {
        console.warn(
          `📱 No push token found for user ${userId} - notifications will be shown in-app only`
        );
        return;
      }

      if (Platform.OS === 'web') {
        notificationDebugLog('📱 Web platform - showing in-app notification');
        return;
      }

      // Send via Expo push service
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
          ...(Platform.OS === 'android' && {
            channelId: this.getChannelForNotificationType(
              this.getNotificationType(notification.data?.type)
            ),
          }),
        },
        trigger: null, // Send immediately
      });

      notificationDebugLog(
        `📱 Push notification sent successfully to user ${userId}: ${notification.title}`
      );
    } catch (error) {
      console.error('Failed to send push notification:', error);
      // Don't throw error - notification was still stored in database
    }
  }

  private async scheduleNotification(
    notificationId: number,
    scheduledFor: Date,
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
          ...(Platform.OS === 'android' && {
            channelId: this.getChannelForNotificationType(
              this.getNotificationType(notification.data?.type)
            ),
          }),
        },
        trigger:
          scheduledFor as unknown as Notifications.NotificationTriggerInput, // cast for Expo typings
      });

      notificationDebugLog(
        `📱 Notification scheduled for ${scheduledFor.toISOString()}`
      );
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  private async canSendNotificationToUser(
    userId: string,
    notificationType: NotificationType,
    priority: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc(
        'can_send_notification_to_user',
        {
          p_user_id: userId,
          p_notification_type: notificationType,
          p_priority: priority,
        }
      );

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Failed to check if can send notification:', error);
      return false;
    }
  }

  private async getNotificationMessage(
    type: NotificationType,
    variables?: Record<string, unknown>
  ): Promise<string | null> {
    const template = this.templates.get(type);
    if (!template?.templates?.length) return null;

    // Randomly select a template
    const randomTemplate =
      template.templates[Math.floor(Math.random() * template.templates.length)];

    // Replace variables in template
    if (variables) {
      return this.replaceVariables(randomTemplate, variables);
    }

    return randomTemplate;
  }

  private replaceVariables(
    template: string,
    variables: Record<string, unknown>
  ): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  private getChannelForNotificationType(type?: NotificationType): string {
    if (!type) return 'default';

    switch (type) {
      case NotificationType.STREAK_REMINDER:
        return 'reminders';
      case NotificationType.STREAK_ACHIEVEMENT:
      case NotificationType.BADGE_UNLOCKED:
      case NotificationType.MOMENTA_REWARD:
        return 'achievements';
      case NotificationType.GROUP_ACTIVITY:
      case NotificationType.GROUP_STREAK_WARNING:
      case NotificationType.GROUP_MILESTONE:
        return 'group_activity';
      case NotificationType.VERIFICATION_APPROVED:
      case NotificationType.VERIFICATION_REJECTED:
      case NotificationType.VERIFICATION_PENDING:
        return 'verification_updates';
      case NotificationType.CHALLENGE_START:
      case NotificationType.CHALLENGE_COMPLETE:
        return 'group_activity';
      case NotificationType.CHALLENGE_EXPIRING:
      case NotificationType.CHALLENGE_EXPIRED:
        return 'reminders';
      case NotificationType.REVIEW_REMINDER:
        return 'verification_updates';
      default:
        return 'default';
    }
  }

  private getNotificationType(value: unknown): NotificationType | undefined {
    return typeof value === 'string' &&
      Object.values(NotificationType).includes(value as NotificationType)
      ? (value as NotificationType)
      : undefined;
  }

  private getFallbackMessage(
    type: NotificationType,
    variables?: Record<string, unknown>
  ): string {
    switch (type) {
      case NotificationType.GROUP_MILESTONE:
        return variables?.groupName
          ? translate('en-NZ', 'domain.notifications.group_milestone_named', {
              groupName: String(variables.groupName),
              milestone: String(
                variables?.milestone ??
                  translate('en-NZ', 'domain.notifications.new_milestone')
              ),
            })
          : translate('en-NZ', 'domain.notifications.group_milestone_reached');
      case NotificationType.GROUP_ACTIVITY:
        return variables?.groupName && variables?.memberName
          ? translate('en-NZ', 'domain.notifications.group_activity_named', {
              memberName: String(variables.memberName),
              groupName: String(variables.groupName),
            })
          : translate('en-NZ', 'domain.notifications.group_activity');
      case NotificationType.STREAK_REMINDER:
        return variables?.challengeTitle
          ? translate('en-NZ', 'domain.notifications.proof_due_for', {
              challengeTitle: String(variables.challengeTitle),
            })
          : translate('en-NZ', 'domain.notifications.proof_due_promise');
      default:
        return translate('en-NZ', 'domain.notifications.open_update');
    }
  }

  private getDefaultTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.STREAK_REMINDER]: translate(
        'en-NZ',
        'domain.notifications.proof_due'
      ),
      [NotificationType.STREAK_ACHIEVEMENT]: translate(
        'en-NZ',
        'domain.notifications.streak_updated'
      ),
      [NotificationType.STREAK_RECOVERY]: translate(
        'en-NZ',
        'domain.notifications.streak_protected'
      ),
      [NotificationType.CHALLENGE_START]: translate(
        'en-NZ',
        'domain.notifications.promise_started'
      ),
      [NotificationType.CHALLENGE_COMPLETE]: translate(
        'en-NZ',
        'domain.notifications.promise_complete'
      ),
      [NotificationType.CHALLENGE_EXPIRING]: translate(
        'en-NZ',
        'domain.notifications.promise_ending'
      ),
      [NotificationType.CHALLENGE_EXPIRED]: translate(
        'en-NZ',
        'domain.notifications.promise_ended'
      ),
      [NotificationType.REVIEW_REMINDER]: translate(
        'en-NZ',
        'domain.notifications.review_needed'
      ),
      [NotificationType.VERIFICATION_PENDING]: translate(
        'en-NZ',
        'domain.notifications.proof_waiting'
      ),
      [NotificationType.VERIFICATION_APPROVED]: translate(
        'en-NZ',
        'domain.notifications.proof_approved'
      ),
      [NotificationType.VERIFICATION_REJECTED]: translate(
        'en-NZ',
        'domain.notifications.proof_retry'
      ),
      [NotificationType.GROUP_ACTIVITY]: translate(
        'en-NZ',
        'domain.notifications.group_update'
      ),
      [NotificationType.GROUP_STREAK_WARNING]: translate(
        'en-NZ',
        'domain.notifications.group_attention'
      ),
      [NotificationType.GROUP_MILESTONE]: translate(
        'en-NZ',
        'domain.notifications.group_milestone'
      ),
      [NotificationType.DAILY_INSPIRATION]: translate(
        'en-NZ',
        'domain.notifications.daily_reminder'
      ),
      [NotificationType.LOW_ACTIVITY]: translate(
        'en-NZ',
        'domain.notifications.check_in_reminder'
      ),
      [NotificationType.BADGE_UNLOCKED]: translate(
        'en-NZ',
        'domain.notifications.badge_unlocked'
      ),
      [NotificationType.MOMENTA_REWARD]: translate(
        'en-NZ',
        'domain.notifications.momenta_added'
      ),
      [NotificationType.APP_UPDATE]: translate(
        'en-NZ',
        'domain.notifications.menta_updated'
      ),
      [NotificationType.MAINTENANCE]: translate(
        'en-NZ',
        'domain.notifications.menta_maintenance'
      ),
      [NotificationType.TEST_NOTIFICATION]: translate(
        'en-NZ',
        'domain.notifications.test'
      ),
    };

    return titles[type] || translate('en-NZ', 'domain.notifications.updated');
  }

  async updateUserPushToken(
    userId: string,
    pushToken: string,
    timezone = this.getLocalTimezone()
  ): Promise<void> {
    const scope = this.captureUserScope(userId);
    if (scope === null) return;
    try {
      const { error } = await supabase.from('notification_preferences').upsert(
        {
          user_id: userId,
          expo_push_token: pushToken,
          timezone,
          device_permission_status: 'granted',
          device_permission_checked_at: new Date().toISOString(),
          push_token_status: 'active',
          push_token_updated_at: new Date().toISOString(),
          push_app_build:
            Number.parseInt(Application.nativeBuildVersion ?? '', 10) || null,
          push_platform: getMobilePushPlatform(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
    } catch (error) {
      if (!this.isUserScopeCurrent(userId, scope)) return;
      console.error('Failed to update push token:', error);
      throw error;
    }
  }

  // Store temporary token when user becomes available
  async storeTemporaryTokenForUser(userId: string): Promise<void> {
    const scope = this.captureUserScope(userId);
    if (scope !== null && this.temporaryPushToken) {
      await this.updateUserPushToken(userId, this.temporaryPushToken);
      if (this.isUserScopeCurrent(userId, scope)) {
        this.temporaryPushToken = undefined;
      }
    }
  }

  async syncPushRegistrationForUser(userId: string): Promise<boolean> {
    const scope = this.captureUserScope(userId);
    if (scope === null) return false;
    try {
      if (Platform.OS === 'web') return true;
      if (!userId) return false;

      const timezone = this.getLocalTimezone();

      await withTimeout(
        this.updateUserPreferences(userId, {
          push_platform: getMobilePushPlatform(),
          timezone,
        }),
        NOTIFICATION_REGISTRATION_TIMEOUT_MS,
        'notification_registration_preferences'
      );
      if (!this.isUserScopeCurrent(userId, scope)) return false;

      const { status } = await withTimeout(
        Notifications.getPermissionsAsync(),
        NOTIFICATION_REGISTRATION_TIMEOUT_MS,
        'notification_registration_permission'
      );
      if (status !== 'granted') {
        await withTimeout(
          this.updateUserPreferences(userId, {
            device_permission_status:
              status === 'denied' ? 'denied' : 'undetermined',
            device_permission_checked_at: new Date().toISOString(),
            expo_push_token: null,
            push_platform: getMobilePushPlatform(),
            push_token_status: 'missing',
            push_token_updated_at: new Date().toISOString(),
          }),
          NOTIFICATION_REGISTRATION_TIMEOUT_MS,
          'notification_registration_permission_state'
        );
        return false;
      }

      const pushToken = await withTimeout(
        this.getExpoPushToken(),
        NOTIFICATION_REGISTRATION_TIMEOUT_MS,
        'notification_registration_token'
      );
      if (!this.isUserScopeCurrent(userId, scope)) return false;
      await withTimeout(
        this.updateUserPushToken(userId, pushToken, timezone),
        NOTIFICATION_REGISTRATION_TIMEOUT_MS,
        'notification_registration_token_save'
      );
      await withTimeout(
        this.syncChallengeRemindersForUser(userId),
        NOTIFICATION_REGISTRATION_TIMEOUT_MS,
        'notification_registration_reminder_sync'
      );

      return true;
    } catch (error) {
      if (!this.isUserScopeCurrent(userId, scope)) return false;
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code ?? 'unknown')
          : 'unknown';
      if (errorCode === 'TIMEOUT') {
        logCrash(error, {
          type: 'notification_registration_timeout',
          context: 'notification_service',
          isFatal: false,
          additionalContext: {
            recovery: 'continue_without_reminders',
          },
        });
      }
      console.error('Failed to sync push registration:', error);
      return false;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<
      Omit<UserNotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>
    >
  ): Promise<void> {
    const scope = this.captureUserScope(userId);
    if (scope === null) return;
    try {
      const { error } = await supabase.from('notification_preferences').upsert(
        {
          user_id: userId,
          ...preferences,
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
      this.clearPreferenceCache(userId);
    } catch (error) {
      if (!this.isUserScopeCurrent(userId, scope)) return;
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  async getUserPreferences(
    userId: string
  ): Promise<UserNotificationPreferences | null> {
    const scope = this.captureUserScope(userId);
    if (scope === null) return null;
    const timezone = this.getLocalTimezone();
    const cacheVersion = this.preferenceCacheVersions.get(userId) ?? 0;
    const cached = this.preferenceCache.get(userId);
    if (
      cached &&
      cached.epoch === scope &&
      cached.timezone === timezone &&
      cached.version === cacheVersion &&
      cached.expiresAt > Date.now()
    ) {
      return cached.value;
    }

    const requestKey = `${userId}:${scope}:${cacheVersion}:${timezone}`;
    const existingRequest = this.preferenceRequests.get(requestKey);
    if (existingRequest) return existingRequest;

    const request = (async (): Promise<UserNotificationPreferences | null> => {
      try {
        const { data, error } = await supabase.rpc(
          'get_notification_preferences',
          {
            p_user_id: userId,
            p_timezone: timezone,
          }
        );

        if (error) throw error;
        if (!this.isUserScopeCurrent(userId, scope)) return null;
        const value = data as UserNotificationPreferences;
        if ((this.preferenceCacheVersions.get(userId) ?? 0) === cacheVersion) {
          this.preferenceCache.set(userId, {
            epoch: scope,
            expiresAt: Date.now() + PREFERENCE_CACHE_TTL_MS,
            timezone,
            value,
            version: cacheVersion,
          });
        }
        return value;
      } catch (error) {
        if (!this.isUserScopeCurrent(userId, scope)) return null;
        console.error('Failed to get user preferences:', error);
        return null;
      } finally {
        this.preferenceRequests.delete(requestKey);
      }
    })();

    this.preferenceRequests.set(requestKey, request);
    return request;
  }

  private async markNotificationDelivered(
    notificationId: number
  ): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({
          delivered_at: new Date().toISOString(),
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as delivered:', error);
    }
  }

  private async markNotificationOpened(notificationId: number): Promise<void> {
    try {
      const openedAt = new Date().toISOString();
      await supabase
        .from('notifications')
        .update({
          opened_at: openedAt,
          is_read: true,
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as opened:', error);
    }
  }

  async recordRemoteNotificationOpened(notificationId: number): Promise<void> {
    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) return;
    await this.markNotificationOpened(notificationId);
  }

  // Convenience methods for common notification types
  async sendStreakReminder(
    userId: string,
    challengeTitle: string,
    timeRemaining: string
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.STREAK_REMINDER,
      priority: 2, // High priority
      variables: { challengeTitle, timeRemaining },
    });
  }

  async sendStreakAchievement(
    userId: string,
    days: number,
    challengeTitle: string
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.STREAK_ACHIEVEMENT,
      priority: 2,
      variables: { days, challengeTitle },
    });
  }

  async sendChallengeComplete(
    userId: string,
    challengeTitle: string,
    challengeId: string
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.CHALLENGE_COMPLETE,
      priority: 2,
      data: { challengeId },
      variables: { challengeTitle },
    });
  }

  async sendVerificationApproved(
    userId: string,
    challengeTitle: string,
    challengeId: string,
    streakCount?: number
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.VERIFICATION_APPROVED,
      priority: 2,
      data: {
        streakCount,
        ...notificationAction.challenge(challengeId),
        badge:
          streakCount && streakCount % 5 === 0 ? 'streak_milestone' : undefined,
      },
      variables: {
        challengeTitle,
        streakCount: streakCount?.toString() || '0',
      },
    });
  }

  async sendVerificationRejected(
    userId: string,
    challengeTitle: string,
    challengeId: string,
    feedback: string
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.VERIFICATION_REJECTED,
      priority: 2,
      data: {
        feedback,
        ...notificationAction.challenge(challengeId),
        actionRequired: true,
      },
      variables: { challengeTitle, feedback },
    });
  }

  async sendBadgeUnlocked(
    userId: string,
    badgeName: string,
    badgeDescription: string,
    badgeType: 'streak_milestone' | 'review_expert' | 'community_helper'
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.BADGE_UNLOCKED,
      priority: 1,
      data: {
        badgeType,
        badgeName,
        ...notificationAction.profileBadges(),
      },
      variables: { badgeName, badgeDescription },
    });
  }

  async sendGroupActivity(
    userId: string,
    memberName: string,
    groupName: string,
    groupId: string,
    activity: string
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.GROUP_ACTIVITY,
      priority: 3,
      data: { groupId },
      variables: { memberName, groupName, activity },
    });
  }

  async sendGroupStreakWarning(
    userId: string,
    groupName: string,
    participationRate?: number
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.GROUP_STREAK_WARNING,
      priority: 2,
      variables: { groupName, participationRate },
    });
  }

  // Notify a reviewer that there are pending reviews they can act on
  async sendReviewerReminder(
    userId: string,
    pendingReviews: number
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.REVIEW_REMINDER,
      priority: 2,
      data: {
        ...notificationAction.reviewQueue({}),
        actionRequired: true,
      },
      variables: {
        challengeTitle: translate(
          'en-NZ',
          'domain.notifications.group_submissions'
        ),
        submitterName: translate('en-NZ', 'domain.notifications.members'),
        pendingReviews,
        reviewText:
          pendingReviews === 1
            ? translate('en-NZ', 'domain.notifications.review')
            : translate('en-NZ', 'domain.notifications.reviews'),
      },
    });
  }

  // Notify when a group is nearing its end date
  async sendGroupExpiring(
    userId: string,
    groupId: string,
    groupName: string,
    hoursRemaining: number
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.GROUP_MILESTONE,
      priority: 2,
      data: notificationAction.group(groupId),
      variables: {
        groupName,
        milestone:
          hoursRemaining >= 1
            ? translate('en-NZ', 'domain.notifications.ending_in', {
                hours: hoursRemaining,
                hourLabel:
                  hoursRemaining === 1
                    ? translate('en-NZ', 'domain.coach.hour')
                    : translate('en-NZ', 'domain.coach.hours'),
              })
            : translate('en-NZ', 'domain.notifications.ending_soon'),
      },
    });
  }

  async sendMomentaReward(
    userId: string,
    amount: number,
    reason: string
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.MOMENTA_REWARD,
      priority: 3,
      variables: { amount, reason },
    });
  }

  async sendDailyInspiration(userId: string): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.DAILY_INSPIRATION,
      priority: 4,
    });
  }

  // NEW: Send notification when challenge is expiring soon
  async sendChallengeExpiring(
    userId: string,
    challengeTitle: string,
    challengeId: string,
    hoursRemaining: number
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.CHALLENGE_EXPIRING,
      priority: 2, // High priority
      data: {
        hoursRemaining,
        ...notificationAction.challenge(challengeId),
        actionRequired: true,
      },
      variables: {
        challengeTitle,
        hoursRemaining: hoursRemaining.toString(),
        timeUnit: hoursRemaining === 1 ? 'hour' : 'hours',
      },
    });
  }

  // NEW: Send notification when user's challenge has expired
  async sendChallengeExpired(
    userId: string,
    challengeTitle: string,
    challengeId: string,
    streakLost?: number
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.CHALLENGE_EXPIRED,
      priority: 1, // Critical priority
      data: {
        streakLost,
        ...notificationAction.challenge(challengeId),
        actionRequired: false,
      },
      variables: {
        challengeTitle,
        streakLost: streakLost?.toString() || '0',
      },
    });
  }

  // NEW: Send notification when user needs to review someone's submission
  async sendReviewReminder(
    userId: string,
    challengeTitle: string,
    challengeId: string,
    submitterName: string,
    pendingReviews: number,
    reviewScope?: {
      groupId?: string;
      submissionId?: string;
    }
  ): Promise<boolean> {
    const action = notificationAction.reviewQueue({
      challengeId,
      groupId: reviewScope?.groupId,
      submissionId: reviewScope?.submissionId,
    });

    return this.sendNotification(userId, {
      type: NotificationType.REVIEW_REMINDER,
      priority: 2, // High priority
      data: {
        challengeId,
        groupId: reviewScope?.groupId,
        submissionId: reviewScope?.submissionId,
        pendingReviews,
        ...action,
        actionRequired: true,
      },
      variables: {
        challengeTitle,
        submitterName,
        pendingReviews: pendingReviews.toString(),
        reviewText: pendingReviews === 1 ? 'review' : 'reviews',
      },
    });
  }

  async scheduleStreakReminder(
    userId: string,
    challengeTitle: string,
    reminderTime: Date
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.STREAK_REMINDER,
      priority: 2,
      scheduledFor: reminderTime,
      variables: {
        challengeTitle,
        timeRemaining: '30 minutes',
      },
    });
  }

  private getSubmissionReminderIdentifier(
    userId: string,
    challengeId: string
  ): string {
    return `submission_reminder_${userId}_${challengeId}`;
  }

  // NEW: Schedule daily submission reminders for a user's challenge
  async scheduleDailySubmissionReminder(
    userId: string,
    challengeId: string,
    challengeTitle: string,
    reminderTime: Date
  ): Promise<void> {
    const scope = this.captureUserScope(userId);
    if (scope === null) return;

    try {
      if (Platform.OS === 'web') {
        notificationDebugLog(
          '📱 Web platform - skipping local notification scheduling'
        );
        return;
      }

      // Cancel only this account's existing reminder. Challenge IDs are shared
      // between group members, so a challenge-only identifier can cancel another
      // account's local reminder on the same device.
      await this.cancelSubmissionReminders(userId, challengeId);
      if (!this.isUserScopeCurrent(userId, scope)) return;

      // Schedule recurring daily reminder
      const identifier = this.getSubmissionReminderIdentifier(
        userId,
        challengeId
      );

      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminderTime.getHours(),
        minute: reminderTime.getMinutes(),
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      };

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: translate('en-NZ', 'domain.notifications.proof_due'),
          body: translate('en-NZ', 'domain.notifications.proof_for', {
            challengeTitle,
          }),
          data: {
            type: NotificationType.STREAK_REMINDER,
            userId,
            ...notificationAction.challenge(challengeId),
            notificationType: 'submission_reminder',
          },
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        },
        trigger,
      });

      // A revoked/deleted session can end while the native schedule request is
      // in flight. Remove that just-created reminder rather than leaving it
      // able to surface account-specific copy on this device.
      if (!this.isUserScopeCurrent(userId, scope)) {
        await this.cancelSubmissionReminders(userId, challengeId);
        return;
      }

      notificationDebugLog(
        `📱 Daily submission reminder scheduled for challenge ${challengeId} at ${reminderTime.toTimeString()}`
      );
    } catch (error) {
      if (!this.isUserScopeCurrent(userId, scope)) return;
      console.error('Failed to schedule daily submission reminder:', error);
      throw error;
    }
  }

  async cancelScheduledRemindersForUser(userId: string): Promise<void> {
    try {
      if (Platform.OS === 'web' || !userId) return;

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const accountOwnedReminders = scheduled.filter(
        item =>
          item?.content?.data?.userId === userId &&
          item?.content?.data?.notificationType === 'submission_reminder'
      );

      await Promise.all(
        accountOwnedReminders.map(item =>
          Notifications.cancelScheduledNotificationAsync(item.identifier).catch(
            () => undefined
          )
        )
      );
    } catch (error) {
      console.error('Failed to clear account-owned reminder schedules:', error);
    }
  }

  private async cancelAndVerifyLocalCoachReminders(
    userId: string
  ): Promise<Notifications.NotificationRequest[]> {
    if (Platform.OS === 'web' || !userId) return [];

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const accountOwnedReminders = scheduled.filter(
      item =>
        item?.content?.data?.userId === userId &&
        item?.content?.data?.notificationType === 'submission_reminder'
    );

    const removed: Notifications.NotificationRequest[] = [];
    try {
      for (const reminder of accountOwnedReminders) {
        await Notifications.cancelScheduledNotificationAsync(
          reminder.identifier
        );
        removed.push(reminder);
      }

      const remaining = (
        await Notifications.getAllScheduledNotificationsAsync()
      ).filter(
        item =>
          item?.content?.data?.userId === userId &&
          item?.content?.data?.notificationType === 'submission_reminder'
      );

      if (remaining.length > 0) {
        throw new Error('Local proof reminders remain after cancellation');
      }

      return removed;
    } catch (error) {
      await this.restoreLocalCoachReminders(removed);
      throw error;
    }
  }

  private async restoreLocalCoachReminders(
    reminders: Notifications.NotificationRequest[]
  ): Promise<void> {
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.identifier,
        content:
          reminder.content as unknown as Notifications.NotificationContentInput,
        trigger:
          reminder.trigger as unknown as Notifications.NotificationTriggerInput,
      });
    }
  }

  private async activateServerCoachReminders(userId: string): Promise<boolean> {
    if (!supportsServerCoachReminders()) return false;

    const removed = await this.cancelAndVerifyLocalCoachReminders(userId);
    try {
      const { data, error } = await supabase.rpc('activate_remote_coach_v1', {
        p_contract_version: 1,
        p_user_id: userId,
      });

      if (error) throw error;
      if (data !== true) {
        await this.restoreLocalCoachReminders(removed);
        return false;
      }
      return true;
    } catch (error) {
      await this.restoreLocalCoachReminders(removed);
      throw error;
    }
  }

  // NEW: Cancel this account's submission reminders for a specific challenge.
  async cancelSubmissionReminders(
    userId: string,
    challengeId: string
  ): Promise<void> {
    try {
      if (Platform.OS === 'web' || !userId) return;

      const identifier = this.getSubmissionReminderIdentifier(
        userId,
        challengeId
      );
      await Notifications.cancelScheduledNotificationAsync(identifier);

      // Defensive cleanup covers stale and legacy schedules, but must stay
      // account-scoped. Legacy schedules used a challenge-only identifier, so
      // cancel one only when its persisted payload attributes it to this user.
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const matching = scheduled.filter(item => {
        const itemUserId = item?.content?.data?.userId;
        const itemChallengeId = item?.content?.data?.challengeId;
        return (
          itemUserId === userId &&
          itemChallengeId === challengeId &&
          item?.content?.data?.notificationType === 'submission_reminder'
        );
      });

      await Promise.all(
        matching.map(item =>
          Notifications.cancelScheduledNotificationAsync(item.identifier).catch(
            () => undefined
          )
        )
      );

      notificationDebugLog(
        `📱 Cancelled submission reminders for user ${userId} on challenge ${challengeId}`
      );
    } catch (error) {
      console.error('Failed to cancel submission reminders:', error);
    }
  }

  // NEW: Send notification when a new challenge is created in a group
  async sendChallengeCreatedNotification(
    groupMembers: string[],
    challengeTitle: string,
    challengeId: string,
    creatorName: string,
    groupName: string,
    groupId?: string
  ): Promise<void> {
    const notifications = groupMembers.map(userId =>
      this.sendNotification(userId, {
        type: NotificationType.CHALLENGE_START,
        priority: 2,
        data: {
          groupId,
          ...notificationAction.challenge(challengeId),
        },
        variables: {
          challengeTitle,
          creatorName,
          groupName,
        },
      })
    );

    try {
      await Promise.allSettled(notifications);
      notificationDebugLog(
        `📱 Challenge creation notifications sent to ${groupMembers.length} group members`
      );
    } catch (error) {
      console.error('Failed to send challenge creation notifications:', error);
    }
  }

  // NEW: Send notification when a new group is created
  async sendGroupCreatedNotification(
    userId: string,
    groupName: string,
    groupId: string
  ): Promise<boolean> {
    return this.sendNotification(userId, {
      type: NotificationType.GROUP_MILESTONE,
      priority: 2,
      data: { groupId },
      variables: {
        groupName,
        milestone: 'Group created',
      },
    });
  }

  // NEW: Set up submission reminders when user joins a challenge
  async setupChallengeReminders(
    userId: string,
    challengeId: string,
    challengeTitle: string,
    preferredReminderTime?: Date
  ): Promise<void> {
    try {
      const userPrefs = await this.getUserPreferences(userId);

      if (userPrefs?.challenge_reminders === false) {
        await this.cancelSubmissionReminders(userId, challengeId);
        notificationDebugLog(
          `📱 Skipping reminders for challenge ${challengeId}: reminders disabled`
        );
        return;
      }

      if (Platform.OS !== 'web') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await this.updateUserPreferences(userId, {
            device_permission_status:
              status === 'denied' ? 'denied' : 'undetermined',
            device_permission_checked_at: new Date().toISOString(),
            expo_push_token: null,
            push_platform: getMobilePushPlatform(),
            push_token_status: 'missing',
            push_token_updated_at: new Date().toISOString(),
          });
          notificationDebugLog(
            `📱 Skipping local reminders for challenge ${challengeId}: permission prompt not completed`
          );
          return;
        }
      }

      if (userPrefs?.remote_coach_contract_version === 1) {
        await this.cancelSubmissionReminders(userId, challengeId);
        notificationDebugLog(
          `📱 Remote coach owns reminders for challenge ${challengeId}`
        );
        return;
      }

      // Get user's preferred reminder time (default to 8 PM)
      let reminderTime = preferredReminderTime;

      if (!reminderTime) {
        if (userPrefs?.preferred_reminder_time) {
          const [hours, minutes] = userPrefs.preferred_reminder_time.split(':');
          reminderTime = new Date();
          reminderTime.setHours(
            parseInt(hours, 10),
            parseInt(minutes, 10),
            0,
            0
          );
        } else {
          // Default to 8 PM
          reminderTime = new Date();
          reminderTime.setHours(20, 0, 0, 0);
        }
      }

      // Schedule daily local fallback reminder. Remote push reminders are owned
      // by the server scheduler/processor pipeline.
      await this.scheduleDailySubmissionReminder(
        userId,
        challengeId,
        challengeTitle,
        resolveReminderTimeOutsideQuietHours(reminderTime, userPrefs)
      );

      notificationDebugLog(
        `📱 Challenge reminders set up for user ${userId} on challenge ${challengeId}`
      );
    } catch (error) {
      console.error('Failed to setup challenge reminders:', error);
    }
  }

  async cancelAllChallengeRemindersForUser(userId: string): Promise<void> {
    try {
      if (Platform.OS === 'web') return;
      if (!userId) return;

      const { data: userChallenges, error } = await supabase
        .from('challenge_participants')
        .select(
          `
          challenge_id,
          challenges!inner(status)
        `
        )
        .eq('user_id', userId)
        .eq('challenges.status', 'active');

      if (error) throw error;
      if (!userChallenges || userChallenges.length === 0) return;

      await Promise.all(
        userChallenges.map(userChallenge =>
          this.cancelSubmissionReminders(userId, userChallenge.challenge_id)
        )
      );

      notificationDebugLog(
        `📱 Cancelled reminders for ${userChallenges.length} active challenges for user ${userId}`
      );
    } catch (error) {
      console.error(
        'Failed to cancel all challenge reminders for user:',
        error
      );
    }
  }

  // Re-schedule reminders for all active challenges for an authenticated user.
  // This is important after reinstall/update/login where local schedules may be missing.
  async syncChallengeRemindersForUser(
    userId: string
  ): Promise<ChallengeReminderSyncResult> {
    const scope = this.captureUserScope(userId);
    if (scope === null) return 'stopped';
    try {
      if (Platform.OS === 'web') return 'scheduled';
      if (!userId) return 'stopped';
      if (this.reminderSyncInFlightUsers.has(userId)) return 'stopped';

      this.reminderSyncInFlightUsers.add(userId);

      const { status } = await Notifications.getPermissionsAsync();
      if (!this.isUserScopeCurrent(userId, scope)) return 'stopped';
      if (status !== 'granted') {
        notificationDebugLog(
          `[Notifications] Skipping reminder sync for ${userId}: permission not granted`
        );
        return 'permission-not-granted';
      }

      const userPrefs = await this.getUserPreferences(userId);
      if (!this.isUserScopeCurrent(userId, scope)) return 'stopped';
      if (userPrefs?.challenge_reminders === false) {
        notificationDebugLog(
          `[Notifications] Skipping reminder sync for ${userId}: reminders disabled`
        );
        return 'stopped';
      }

      if (supportsServerCoachReminders()) {
        try {
          if (await this.activateServerCoachReminders(userId)) {
            return 'remote-owned';
          }
        } catch (error) {
          console.error('Failed to activate server coach reminders:', error);
          // Keep the build-127 local schedule contract as the safe fallback.
        }
      }

      const reminderTime = new Date();
      if (userPrefs?.preferred_reminder_time) {
        const [hours, minutes] = userPrefs.preferred_reminder_time.split(':');
        reminderTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      } else {
        reminderTime.setHours(20, 0, 0, 0);
      }

      const { data: userChallenges, error } = await supabase
        .from('challenge_participants')
        .select(
          `
          challenge_id,
          challenges!inner(title, status)
        `
        )
        .eq('user_id', userId)
        .eq('challenges.status', 'active');

      if (!this.isUserScopeCurrent(userId, scope)) return 'stopped';

      if (error) throw error;
      if (!userChallenges || userChallenges.length === 0) {
        return 'no-active-promises';
      }

      for (const userChallenge of userChallenges) {
        if (!this.isUserScopeCurrent(userId, scope)) return 'stopped';
        const challengeId = userChallenge.challenge_id;
        const challenge = firstRelation<{ title?: string | null }>(
          (
            userChallenge as unknown as {
              challenges?:
                | { title?: string | null }
                | { title?: string | null }[]
                | null;
            }
          ).challenges
        );
        const challengeTitle = challenge?.title;
        if (!challengeTitle) continue;

        await this.scheduleDailySubmissionReminder(
          userId,
          challengeId,
          challengeTitle,
          resolveReminderTimeOutsideQuietHours(reminderTime, userPrefs)
        );
      }

      notificationDebugLog(
        `📱 Synced reminders for ${userChallenges.length} active challenges for user ${userId}`
      );
      return 'scheduled';
    } catch (error) {
      if (!this.isUserScopeCurrent(userId, scope)) return 'stopped';
      console.error('Failed to sync challenge reminders:', error);
      throw error;
    } finally {
      this.reminderSyncInFlightUsers.delete(userId);
    }
  }

  // NEW: Update all of a user's challenge reminder times
  async updateAllUserReminderTimes(
    userId: string,
    newReminderTime: Date
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      if (supportsServerCoachReminders()) {
        const userPrefs = await this.getUserPreferences(userId);
        if (userPrefs?.remote_coach_contract_version === 1) {
          await this.cancelAndVerifyLocalCoachReminders(userId);
          return;
        }
      }

      const userPrefs = await this.getUserPreferences(userId);
      if (userPrefs?.challenge_reminders === false) {
        await this.cancelAllChallengeRemindersForUser(userId);
        notificationDebugLog(
          `📱 Skipping reminder time update for ${userId}: reminders disabled`
        );
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        notificationDebugLog(
          `📱 Skipping reminder time update for ${userId}: permission not granted`
        );
        return;
      }

      const effectiveReminderTime = resolveReminderTimeOutsideQuietHours(
        newReminderTime,
        userPrefs
      );

      // Get all active challenges for this user
      const { data: userChallenges, error } = await supabase
        .from('challenge_participants')
        .select(
          `
          challenge_id,
          challenges!inner(title, status)
        `
        )
        .eq('user_id', userId)
        .eq('challenges.status', 'active');

      if (error) throw error;

      if (userChallenges && userChallenges.length > 0) {
        // Update reminder time for each active challenge
        for (const userChallenge of userChallenges) {
          const challengeId = userChallenge.challenge_id;
          const challenge = firstRelation<{ title?: string | null }>(
            (
              userChallenge as unknown as {
                challenges?:
                  | { title?: string | null }
                  | { title?: string | null }[]
                  | null;
              }
            ).challenges
          );
          const challengeTitle = challenge?.title;
          if (!challengeTitle) continue;

          // Cancel this account's existing reminder for the challenge.
          await this.cancelSubmissionReminders(userId, challengeId);

          // Schedule new reminder with updated time
          await this.scheduleDailySubmissionReminder(
            userId,
            challengeId,
            challengeTitle,
            effectiveReminderTime
          );
        }

        notificationDebugLog(
          `📱 Updated reminder times for ${userChallenges.length} challenges to ${newReminderTime.toTimeString()}`
        );
      }
    } catch (error) {
      console.error('Failed to update all user reminder times:', error);
      throw error;
    }
  }

  async getGroupPreferences(
    userId: string,
    groupId: string
  ): Promise<UserGroupNotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('team_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // No preferences found for this group, so create them with default values.
        const { data: newData, error: insertError } = await supabase
          .from('team_notification_preferences')
          .insert({ user_id: userId, group_id: groupId })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        return newData;
      }

      return data;
    } catch (error) {
      console.error('Failed to get group notification preferences:', error);
      return null;
    }
  }

  async getAllUserGroupPreferences(userId: string): Promise<
    | (UserGroupNotificationPreferences & {
        teams: { name: string; id: string };
      })[]
    | null
  > {
    try {
      const { data, error } = await supabase
        .from('team_notification_preferences')
        .select(
          `
          *,
          teams (id, name)
        `
        )
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // The return type from Supabase with relation is a bit complex, we cast it here.
      return data as unknown as (UserGroupNotificationPreferences & {
        teams: { name: string; id: string };
      })[];
    } catch (error) {
      console.error('Failed to get all group notification preferences:', error);
      return null;
    }
  }

  async updateGroupPreferences(
    userId: string,
    groupId: string,
    preferences: Partial<
      Omit<
        UserGroupNotificationPreferences,
        'user_id' | 'group_id' | 'created_at' | 'updated_at'
      >
    >
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_notification_preferences')
        .update(preferences)
        .eq('user_id', userId)
        .eq('group_id', groupId);

      if (error) throw error;

      notificationDebugLog(
        `Updated notification preferences for user ${userId} in group ${groupId}`
      );
    } catch (error) {
      console.error('Failed to update group notification preferences:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
