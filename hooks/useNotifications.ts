/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy notification row and payload shapes predate this cache change. */
import { useEffect, useState, useCallback } from 'react';
import { AppStateStatus } from 'react-native';
import { appStateManager } from '@/lib/app-state-manager';
import {
  notificationService,
  NotificationType,
  UserNotificationPreferences,
  UserGroupNotificationPreferences,
} from '@/lib/services/notification-service';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/localization';
import { trackProductOperation } from '@/lib/posthog';

interface UseNotificationsReturn {
  isInitialized: boolean;
  isPermissionGranted: boolean;
  preferences: UserNotificationPreferences | null;
  unreadCount: number;
  notifications: any[];
  isLoading: boolean;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  updatePreferences: (
    prefs: Partial<UserNotificationPreferences>
  ) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendTestNotification: (type: NotificationType) => Promise<void>;
}

export const useGroupNotificationPreferences = (groupId: string) => {
  const { user } = useAuthStore();
  const [preferences, setPreferences] =
    useState<UserGroupNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id || !groupId) return;
      setIsLoading(true);
      setError(null);
      try {
        const prefs = await notificationService.getGroupPreferences(
          user.id,
          groupId
        );
        if (mounted) setPreferences(prefs);
      } catch (e: any) {
        if (mounted)
          setError(e?.message || 'Could not load group notifications');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, groupId]);

  const updatePreferences = async (
    prefs: Partial<
      Omit<
        UserGroupNotificationPreferences,
        'user_id' | 'group_id' | 'created_at' | 'updated_at'
      >
    >
  ) => {
    if (!user?.id || !groupId) return;
    trackProductOperation({
      area: 'notification',
      authority: 'server',
      operation: 'configure_notifications',
      outcome: 'started',
      phase: 'intent',
      source: 'notifications',
    });
    const previous = preferences;
    setPreferences(current => (current ? { ...current, ...prefs } : current));
    try {
      setError(null);
      await notificationService.updateGroupPreferences(user.id, groupId, prefs);
      // Reload from backend to ensure we have persisted values
      const latest = await notificationService.getGroupPreferences(
        user.id,
        groupId
      );
      setPreferences(latest);
      trackProductOperation({
        area: 'notification',
        authority: 'server',
        operation: 'configure_notifications',
        outcome: 'confirmed',
        phase: 'authority',
        source: 'notifications',
      });
    } catch (e: any) {
      trackProductOperation({
        area: 'notification',
        authority: 'server',
        operation: 'configure_notifications',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: 'notifications',
      });
      setPreferences(previous);
      setError(e?.message || 'Could not save group notifications');
    }
  };

  return { preferences, isLoading, updatePreferences, error };
};

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [preferences, setPreferences] =
    useState<UserNotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);

      const unread = data?.filter(notif => !notif.is_read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
      setError('Could not load notifications');
    }
  }, [user?.id]);

  // Initialize notification service without prompting for permissions on mount
  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        setError(null);
        // Do not request permission automatically; match iOS/Android behavior via gate
        await notificationService.initialize({ requestPermissionNow: false });

        if (isMounted) {
          setIsInitialized(true);
          // Do not assume permission granted; explicitly query via service when needed
          setIsPermissionGranted(false);
        }
      } catch (err) {
        console.error('Failed to initialize notifications:', err);
        if (isMounted) {
          setError('Could not start notifications');
          setIsInitialized(false);
          setIsPermissionGranted(false);
        }
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load user preferences and notifications when user changes
  useEffect(() => {
    if (!user?.id || !isInitialized) {
      setPreferences(null);
      setNotifications([]);
      setUnreadCount(0);
      setIsPermissionGranted(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await notificationService.storeTemporaryTokenForUser(user.id);
        const permissionGranted =
          await notificationService.syncPushRegistrationForUser(user.id);
        if (isMounted) {
          setIsPermissionGranted(permissionGranted);
        }

        // Load preferences
        const userPrefs = await notificationService.getUserPreferences(user.id);
        if (isMounted) {
          setPreferences(userPrefs);
        }

        // Load notifications
        await refreshNotifications();
      } catch (err) {
        console.error('Failed to load user notification data:', err);
        if (isMounted) {
          setError('Could not load notification settings');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [isInitialized, refreshNotifications, user?.id]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          setNotifications(prev =>
            prev.map(notif =>
              notif.id === payload.new.id ? payload.new : notif
            )
          );

          // Update unread count if notification was marked as read
          if (payload.new?.is_read && !payload.old?.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  // Handle app state changes for notification refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user?.id) {
        // Refresh notifications when app becomes active
        refreshNotifications();
      }
    };

    return appStateManager.addListener(handleAppStateChange);
  }, [refreshNotifications, user?.id]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      // Request OS permission now via service; keep initialization idempotent
      const granted = await notificationService.requestPermissions();
      if (granted && user?.id) {
        await notificationService.syncPushRegistrationForUser(user.id);
      }
      setIsPermissionGranted(granted);
      if (granted && !isInitialized) setIsInitialized(true);
      return granted;
    } catch (err) {
      console.error('Failed to request permissions:', err);
      setError('Could not ask for notification permission');
      setIsPermissionGranted(false);
      return false;
    }
  }, [isInitialized, user?.id]);

  const updatePreferences = useCallback(
    async (prefs: Partial<UserNotificationPreferences>): Promise<void> => {
      if (!user?.id) return;

      const isReminderChange =
        Object.prototype.hasOwnProperty.call(prefs, 'challenge_reminders') ||
        Object.prototype.hasOwnProperty.call(prefs, 'preferred_reminder_time');
      const area = isReminderChange ? 'reminder' : 'notification';
      const operation = isReminderChange
        ? 'configure_reminder'
        : 'configure_notifications';
      trackProductOperation({
        area,
        authority: 'server',
        operation,
        outcome: 'started',
        phase: 'intent',
        source: 'notifications',
      });

      const previous = preferences;
      setPreferences(current => (current ? { ...current, ...prefs } : current));
      try {
        setError(null);
        await notificationService.updateUserPreferences(user.id, prefs);

        // Reload preferences to get updated values
        const updatedPrefs = await notificationService.getUserPreferences(
          user.id
        );
        setPreferences(updatedPrefs);
        trackProductOperation({
          area,
          authority: 'server',
          operation,
          outcome: 'confirmed',
          phase: 'authority',
          source: 'notifications',
        });
      } catch (err) {
        trackProductOperation({
          area,
          authority: 'server',
          operation,
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'notifications',
        });
        setPreferences(previous);
        console.error('Failed to update preferences:', err);
        setError('Could not save notification settings');
      }
    },
    [preferences, user?.id]
  );

  const markAsRead = useCallback(
    async (notificationId: number): Promise<void> => {
      if (!user?.id) return;

      try {
        await supabase
          .from('notifications')
          .update({
            is_read: true,
            opened_at: new Date().toISOString(),
          })
          .eq('id', notificationId)
          .eq('user_id', user.id);

        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [user?.id]
  );

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({
          is_read: true,
          opened_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [user?.id]);

  const sendTestNotification = useCallback(
    async (type: NotificationType): Promise<void> => {
      if (!user?.id) return;

      try {
        setError(null);

        const testData: Record<NotificationType, any> = {
          [NotificationType.STREAK_REMINDER]: {
            challengeTitle: 'Morning Workout',
            timeRemaining: '30 minutes',
          },
          [NotificationType.STREAK_ACHIEVEMENT]: {
            days: 7,
            challengeTitle: 'Daily Reading',
          },
          [NotificationType.CHALLENGE_COMPLETE]: {
            challengeTitle: 'Seven-day reading promise',
          },
          [NotificationType.CHALLENGE_EXPIRING]: {
            challengeTitle: 'Morning Workout',
            hoursRemaining: '2',
            timeUnit: 'hours',
          },
          [NotificationType.CHALLENGE_EXPIRED]: {
            challengeTitle: 'Daily Reading',
            streakLost: '7',
          },
          [NotificationType.REVIEW_REMINDER]: {
            challengeTitle: 'Fitness promise',
            submitterName: 'Alex',
            pendingReviews: '3',
            reviewText: 'reviews',
          },
          [NotificationType.BADGE_UNLOCKED]: {
            badgeName: 'Consistency Champion',
            badgeDescription: 'Complete 7 days in a row',
          },
          [NotificationType.MOMENTA_REWARD]: {
            amount: 100,
            reason: t('todayProof.notifications.daily_bonus'),
          },
          [NotificationType.DAILY_INSPIRATION]: {},
          [NotificationType.GROUP_ACTIVITY]: {
            memberName: 'Alex Champion',
            groupName: 'Morning Warriors',
            activity: 'completed their workout',
          },
          [NotificationType.VERIFICATION_PENDING]: {
            challengeTitle: 'Fitness Goal',
          },
          [NotificationType.VERIFICATION_APPROVED]: {
            challengeTitle: 'Photo Challenge',
            streakCount: '5',
          },
          [NotificationType.VERIFICATION_REJECTED]: {
            challengeTitle: 'Photo Challenge',
            feedback: 'Please retake with better lighting',
          },
          [NotificationType.STREAK_RECOVERY]: {
            challengeTitle: 'Daily Meditation',
          },
          [NotificationType.CHALLENGE_START]: {
            challengeTitle: 'Evening walk',
            startTime: 'in 1 hour',
          },
          [NotificationType.GROUP_STREAK_WARNING]: {
            groupName: 'Elite Squad',
            participationRate: 0.6,
          },
          [NotificationType.GROUP_MILESTONE]: {
            groupName: 'Champions League',
            milestone: 30,
          },
          [NotificationType.LOW_ACTIVITY]: {
            daysSinceActivity: 3,
          },
          [NotificationType.APP_UPDATE]: {
            version: '2.0.0',
            features: ['New promise tools', 'Clearer promise details'],
          },
          [NotificationType.MAINTENANCE]: {
            duration: '30 minutes',
            reason: t('todayProof.notifications.maintenance'),
          },
          [NotificationType.TEST_NOTIFICATION]: {},
        };

        await notificationService.sendNotification(user.id, {
          type,
          variables: testData[type],
          priority: 3,
        });
      } catch (err) {
        console.error('Failed to send test notification:', err);
        setError('Could not send the test notification');
      }
    },
    [t, user?.id]
  );

  return {
    isInitialized,
    isPermissionGranted,
    preferences,
    unreadCount,
    notifications,
    isLoading,
    error,
    requestPermissions,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    sendTestNotification,
  };
};
