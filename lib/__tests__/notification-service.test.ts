import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import {
  notificationService,
  NotificationType,
  resolveReminderTimeOutsideQuietHours,
} from '@/lib/services/notification-service';

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'project-123',
      },
    },
  },
  easConfig: {
    projectId: 'project-123',
  },
}));

jest.mock('expo-application', () => ({
  nativeBuildVersion: '128',
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    DEFAULT: 'default',
    HIGH: 'high',
  },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
  },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('scheduled-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

const setPlatformOS = (os: 'android' | 'ios' | 'web') => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
};

describe('notification service', () => {
  it('moves a local fallback reminder to the end of cross-midnight quiet hours', () => {
    const reminder = new Date('2026-08-15T22:30:00');
    const adjusted = resolveReminderTimeOutsideQuietHours(reminder, {
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '07:00:00',
    });
    expect(adjusted.getHours()).toBe(7);
    expect(adjusted.getMinutes()).toBe(0);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatformOS('ios');
    notificationService.startUserScopedWork('user-1');

    jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'Pacific/Auckland' }),
    } as Intl.DateTimeFormat);

    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
    } as Notifications.NotificationPermissionsStatus);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
    } as Notifications.NotificationPermissionsStatus);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[test-token]',
    } as Notifications.ExpoPushToken);
    mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);

    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        user_id: 'user-1',
        challenge_reminders: true,
        preferred_reminder_time: '20:00:00',
        timezone: 'Pacific/Auckland',
      },
      error: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('coalesces and briefly caches account-scoped preference reads', async () => {
    const [first, second] = await Promise.all([
      notificationService.getUserPreferences('user-1'),
      notificationService.getUserPreferences('user-1'),
    ]);
    const cached = await notificationService.getUserPreferences('user-1');

    expect(first).toEqual(second);
    expect(cached).toEqual(first);
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('invalidates cached preferences after a confirmed update', async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ upsert });

    await notificationService.getUserPreferences('user-1');
    await notificationService.updateUserPreferences('user-1', {
      challenge_reminders: false,
    });
    await notificationService.getUserPreferences('user-1');

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  });

  it('requests a rate-limited self-test through the authenticated RPC', async () => {
    (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: [{ notification_id: 42, status: 'QUEUED' }],
      error: null,
    });

    await expect(
      notificationService.requestTestNotification('user-1')
    ).resolves.toBe('queued');
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'request_test_notification_v1'
    );
  });

  it('does not cache a preference read that an update invalidated in flight', async () => {
    let resolveFirst!: (value: {
      data: UserNotificationPreferencesFixture;
      error: null;
    }) => void;
    type UserNotificationPreferencesFixture = {
      user_id: string;
      challenge_reminders: boolean;
      preferred_reminder_time: string;
      timezone: string;
    };
    const firstRead = new Promise<{
      data: UserNotificationPreferencesFixture;
      error: null;
    }>(resolve => {
      resolveFirst = resolve;
    });
    (mockSupabase.rpc as jest.Mock)
      .mockReturnValueOnce(firstRead)
      .mockResolvedValueOnce({
        data: {
          user_id: 'user-1',
          challenge_reminders: false,
          preferred_reminder_time: '20:00:00',
          timezone: 'Pacific/Auckland',
        },
        error: null,
      });
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ upsert });

    const staleRead = notificationService.getUserPreferences('user-1');
    await notificationService.updateUserPreferences('user-1', {
      challenge_reminders: false,
    });
    resolveFirst({
      data: {
        user_id: 'user-1',
        challenge_reminders: true,
        preferred_reminder_time: '20:00:00',
        timezone: 'Pacific/Auckland',
      },
      error: null,
    });
    await staleRead;

    const current = await notificationService.getUserPreferences('user-1');

    expect(current?.challenge_reminders).toBe(false);
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  });

  it('stores the Expo push token, project id, and timezone when permission is already granted', async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    const activeChallengeQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    };

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'notification_preferences') {
        return { upsert };
      }
      if (table === 'challenge_participants') {
        return activeChallengeQuery;
      }
      return { upsert };
    });

    await expect(notificationService.requestPermissions()).resolves.toBe(true);

    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'project-123',
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        expo_push_token: 'ExponentPushToken[test-token]',
        push_app_build: 128,
        push_platform: 'ios',
        timezone: 'Pacific/Auckland',
      }),
      { onConflict: 'user_id' }
    );
  });

  it('records Android as the platform that owns its Expo token', async () => {
    setPlatformOS('android');
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ upsert });

    await notificationService.updateUserPushToken(
      'user-1',
      'ExponentPushToken[android-token]'
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        expo_push_token: 'ExponentPushToken[android-token]',
        push_platform: 'android',
        user_id: 'user-1',
      }),
      { onConflict: 'user_id' }
    );
  });

  it('records a denied device permission without turning off the account preference', async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ upsert });
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
    } as Notifications.NotificationPermissionsStatus);
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    } as Notifications.NotificationPermissionsStatus);

    await expect(notificationService.requestPermissions()).resolves.toBe(false);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        device_permission_status: 'denied',
        expo_push_token: null,
        push_platform: 'ios',
        push_token_status: 'missing',
      }),
      { onConflict: 'user_id' }
    );
    expect(upsert.mock.calls[0]?.[0]).not.toHaveProperty('push_enabled');
  });

  it('does not ask again when the device already denied notification permission', async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ upsert });
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    } as Notifications.NotificationPermissionsStatus);

    await expect(notificationService.requestPermissions()).resolves.toBe(false);

    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        device_permission_status: 'denied',
        expo_push_token: null,
        push_platform: 'ios',
        push_token_status: 'missing',
      }),
      { onConflict: 'user_id' }
    );
  });

  it('fails closed when the native permission check never settles', async () => {
    jest.useFakeTimers();
    try {
      mockNotifications.getPermissionsAsync.mockReturnValueOnce(
        new Promise(() => undefined)
      );

      const result = notificationService.requestPermissions();
      await jest.advanceTimersByTimeAsync(8_001);

      await expect(result).resolves.toBe(false);
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('cancels the legacy local reminder when build 128 uses remote coach', async () => {
    (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: {
        user_id: 'user-1',
        challenge_reminders: true,
        preferred_reminder_time: '20:00:00',
        remote_coach_contract_version: 1,
        timezone: 'Pacific/Auckland',
      },
      error: null,
    });
    const cancel = jest
      .spyOn(notificationService, 'cancelSubmissionReminders')
      .mockResolvedValue(undefined);

    await notificationService.setupChallengeReminders(
      'user-1',
      'challenge-1',
      'Read Bible Daily'
    );

    expect(cancel).toHaveBeenCalledWith('user-1', 'challenge-1');
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules local daily challenge reminders on the Android reminders channel', async () => {
    setPlatformOS('android');
    const reminderTime = new Date('2026-05-12T00:00:00.000Z');
    reminderTime.setHours(20, 15, 0, 0);

    await notificationService.scheduleDailySubmissionReminder(
      'user-1',
      'challenge-1',
      'Read Bible Daily',
      reminderTime
    );

    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).toHaveBeenCalledWith('submission_reminder_user-1_challenge-1');
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'submission_reminder_user-1_challenge-1',
        content: expect.objectContaining({
          title: 'Proof due',
          body: 'Send proof for “Read Bible Daily”.',
          sound: true,
          channelId: 'reminders',
          data: expect.objectContaining({
            type: NotificationType.STREAK_REMINDER,
            challengeId: 'challenge-1',
          }),
        }),
        trigger: expect.objectContaining({
          type: 'daily',
          hour: 20,
          minute: 15,
          channelId: 'reminders',
        }),
      })
    );
  });

  it('records the device state without changing the reminder preference or prompting', async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    const activeChallengeQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    };

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'notification_preferences') {
        return { upsert };
      }
      if (table === 'challenge_participants') {
        return activeChallengeQuery;
      }
      return { upsert };
    });
    mockNotifications.getPermissionsAsync
      .mockResolvedValueOnce({
        status: 'undetermined',
      } as Notifications.NotificationPermissionsStatus)
      .mockResolvedValueOnce({
        status: 'undetermined',
      } as Notifications.NotificationPermissionsStatus)
      .mockResolvedValue({
        status: 'granted',
      } as Notifications.NotificationPermissionsStatus);
    await notificationService.setupChallengeReminders(
      'user-1',
      'challenge-1',
      'Read Bible Daily'
    );

    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        device_permission_status: 'undetermined',
        expo_push_token: null,
        push_token_status: 'missing',
      }),
      { onConflict: 'user_id' }
    );
    expect(upsert.mock.calls[0]?.[0]).not.toHaveProperty('challenge_reminders');
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('builds typed review queue actions for review reminders', async () => {
    const sendNotification = jest
      .spyOn(notificationService, 'sendNotification')
      .mockResolvedValue(true);

    await notificationService.sendReviewReminder(
      'reviewer-1',
      'Evening check-in',
      'challenge-1',
      'Sam',
      1,
      {
        groupId: 'group-1',
        submissionId: 'submission-1',
      }
    );

    expect(sendNotification).toHaveBeenCalledWith(
      'reviewer-1',
      expect.objectContaining({
        type: NotificationType.REVIEW_REMINDER,
        data: expect.objectContaining({
          challengeId: 'challenge-1',
          groupId: 'group-1',
          submissionId: 'submission-1',
          action: 'open_review_queue',
        }),
      })
    );
  });

  it('syncs local reminders for solo challenges when Supabase returns joined challenges as an array', async () => {
    mockNotifications.getPermissionsAsync.mockReset();
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
    } as Notifications.NotificationPermissionsStatus);

    const eqActive = jest.fn().mockResolvedValue({
      data: [
        {
          challenge_id: 'solo-1',
          challenges: [{ title: 'Solo Focus', status: 'active' }],
        },
      ],
      error: null,
    });
    const eqUser = jest.fn().mockReturnValue({ eq: eqActive });
    const select = jest.fn().mockReturnValue({ eq: eqUser });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'challenge_participants') {
        return { select };
      }

      return {
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await notificationService.syncChallengeRemindersForUser('user-1');

    expect(select).toHaveBeenCalledWith(expect.stringContaining('challenges'));
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1');
    expect(eqActive).toHaveBeenCalledWith('challenges.status', 'active');
    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).toHaveBeenCalledWith('submission_reminder_user-1_solo-1');
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'submission_reminder_user-1_solo-1',
        content: expect.objectContaining({
          body: 'Send proof for “Solo Focus”.',
          data: expect.objectContaining({
            type: NotificationType.STREAK_REMINDER,
            challengeId: 'solo-1',
          }),
        }),
      })
    );
  });

  it('keeps same-challenge reminders isolated between accounts on one device', async () => {
    const scheduled: Notifications.NotificationRequest[] = [];
    mockNotifications.getAllScheduledNotificationsAsync.mockImplementation(
      async () => scheduled
    );
    mockNotifications.scheduleNotificationAsync.mockImplementation(
      async request => {
        scheduled.push(request as Notifications.NotificationRequest);
        return request.identifier ?? 'scheduled-id';
      }
    );
    mockNotifications.cancelScheduledNotificationAsync.mockImplementation(
      async identifier => {
        const index = scheduled.findIndex(
          item => item.identifier === identifier
        );
        if (index >= 0) scheduled.splice(index, 1);
      }
    );

    const reminderTime = new Date('2026-05-12T20:00:00.000Z');
    await notificationService.scheduleDailySubmissionReminder(
      'user-1',
      'shared-challenge',
      'Shared promise',
      reminderTime
    );
    notificationService.startUserScopedWork('user-2');
    await notificationService.scheduleDailySubmissionReminder(
      'user-2',
      'shared-challenge',
      'Shared promise',
      reminderTime
    );

    mockNotifications.cancelScheduledNotificationAsync.mockClear();
    await notificationService.scheduleDailySubmissionReminder(
      'user-1',
      'shared-challenge',
      'Shared promise',
      reminderTime
    );

    expect(scheduled.map(item => item.identifier)).toEqual([
      'submission_reminder_user-2_shared-challenge',
      'submission_reminder_user-1_shared-challenge',
    ]);
    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).toHaveBeenCalledWith('submission_reminder_user-1_shared-challenge');
    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).not.toHaveBeenCalledWith('submission_reminder_user-2_shared-challenge');
  });

  it('cleans up a legacy challenge-only reminder only for its recorded account', async () => {
    mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'submission_reminder_shared-challenge',
        content: {
          data: {
            userId: 'user-1',
            challengeId: 'shared-challenge',
            notificationType: 'submission_reminder',
          },
        },
      },
      {
        identifier: 'submission_reminder_user-2_shared-challenge',
        content: {
          data: {
            userId: 'user-2',
            challengeId: 'shared-challenge',
            notificationType: 'submission_reminder',
          },
        },
      },
    ] as Notifications.NotificationRequest[]);

    await notificationService.cancelSubmissionReminders(
      'user-1',
      'shared-challenge'
    );

    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).toHaveBeenCalledWith('submission_reminder_user-1_shared-challenge');
    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).toHaveBeenCalledWith('submission_reminder_shared-challenge');
    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).not.toHaveBeenCalledWith('submission_reminder_user-2_shared-challenge');
  });

  it('surfaces notification preference upsert failures to callers', async () => {
    const failure = new Error('RLS blocked update');
    const upsert = jest.fn().mockResolvedValue({ data: null, error: failure });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'notification_preferences') {
        return { upsert };
      }

      return {
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await expect(
      notificationService.updateUserPreferences('user-1', {
        challenge_reminders: true,
      })
    ).rejects.toThrow('RLS blocked update');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        challenge_reminders: true,
      }),
      { onConflict: 'user_id' }
    );
  });

  it('does not write preferences after the account scope has stopped', async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ upsert });

    notificationService.stopUserScopedWork('user-1');
    await notificationService.updateUserPreferences('user-1', {
      challenge_reminders: true,
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it('clears only account-owned local reminder schedules when a scope ends', async () => {
    mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'submission_reminder_user-1-challenge-1',
        content: {
          data: {
            userId: 'user-1',
            notificationType: 'submission_reminder',
          },
        },
      },
      {
        identifier: 'submission_reminder_user-2-challenge-2',
        content: {
          data: {
            userId: 'user-2',
            notificationType: 'submission_reminder',
          },
        },
      },
    ] as Notifications.NotificationRequest[]);
    const cancelAccountSchedules = jest.spyOn(
      notificationService,
      'cancelScheduledRemindersForUser'
    );

    notificationService.stopUserScopedWork('user-1');
    await cancelAccountSchedules.mock.results[0]?.value;

    expect(cancelAccountSchedules).toHaveBeenCalledWith('user-1');
    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).toHaveBeenCalledWith('submission_reminder_user-1-challenge-1');
    expect(
      mockNotifications.cancelScheduledNotificationAsync
    ).not.toHaveBeenCalledWith('submission_reminder_user-2-challenge-2');
  });

  it('abandons an in-flight push sync when logout stops its user scope', async () => {
    const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ upsert });

    let resolvePermission: ((value: { status: 'granted' }) => void) | null =
      null;
    mockNotifications.getPermissionsAsync.mockReturnValueOnce(
      new Promise(resolve => {
        resolvePermission = resolve;
      }) as ReturnType<typeof Notifications.getPermissionsAsync>
    );

    const sync = notificationService.syncPushRegistrationForUser('user-1');
    await Promise.resolve();
    notificationService.stopUserScopedWork('user-1');
    resolvePermission?.({ status: 'granted' });

    await expect(sync).resolves.toBe(false);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(mockNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('does not log a revoked-session preference read as a fatal error', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let resolveRpc: ((value: { data: null; error: Error }) => void) | undefined;
    (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(
      new Promise(resolve => {
        resolveRpc = resolve;
      })
    );

    const read = notificationService.getUserPreferences('user-1');
    notificationService.stopUserScopedWork('user-1');
    resolveRpc?.({ data: null, error: new Error('JWT revoked') });

    await expect(read).resolves.toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('records a verified client open on the matching inbox row', async () => {
    const eq = jest.fn().mockResolvedValue({ data: null, error: null });
    const update = jest.fn(() => ({ eq }));
    (mockSupabase.from as jest.Mock).mockReturnValue({ update });

    await notificationService.recordRemoteNotificationOpened(17);

    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    expect(update).toHaveBeenCalledWith({
      is_read: true,
      opened_at: expect.any(String),
    });
    expect(eq).toHaveBeenCalledWith('id', 17);
  });
});
