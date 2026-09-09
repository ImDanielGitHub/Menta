import { useTranslation } from '@/lib/localization';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BellIcon, BellOffIcon } from '@/components/ui/icons';
import * as Notifications from 'expo-notifications';

import {
  AppDateTimeRow,
  AppFieldRow,
  AppSwitchRow,
} from '@/components/ui/AppFields';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import {
  AppInsetGroup,
  AppScreen,
  AppSectionHeader,
  AppTopBar,
} from '@/components/ui/AppShell';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useAuthStore } from '@/store/auth-store';
import {
  notificationService,
  type UserNotificationPreferences,
} from '@/lib/services/notification-service';
import { retentionNotificationClient } from '@/lib/notifications/retention-notification-client';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { trackProductEvent } from '@/lib/posthog';
import { logEvent } from '@/lib/sentry';
type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';
type PreferenceKey = keyof UserNotificationPreferences;
type StatusNotice = {
  title: string;
  description: string;
  tone: 'info' | 'warning' | 'error' | 'success';
} | null;

const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const dateForLocalTime = (value: string | null | undefined, hour: number) => {
  const result = new Date();
  const [savedHour, savedMinute] = (value ?? '').split(':').map(Number);
  result.setHours(
    Number.isInteger(savedHour) ? savedHour : hour,
    Number.isInteger(savedMinute) ? savedMinute : 0,
    0,
    0
  );
  return result;
};

const timeValue = (value: Date): string =>
  `${value.getHours().toString().padStart(2, '0')}:${value
    .getMinutes()
    .toString()
    .padStart(2, '0')}:00`;

type NotificationSettingsLayoutProps = {
  children: React.ReactNode;
  subtitle: string;
  onBack: () => void;
  backLabel?: string;
  centred?: boolean;
};

const NotificationSettingsLayout = ({
  children,
  subtitle,
  onBack,
  backLabel,
  centred = false,
}: NotificationSettingsLayoutProps) => {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  return (
    <AppScreen
      lane="working"
      safeArea
      hasTabBar={false}
      scrollable
      padding={false}
      contentContainerStyle={notificationStyles.scrollContent}
    >
      <View
        style={[
          notificationStyles.lane,
          { paddingHorizontal: phoneLayout.screenInset },
          centred && notificationStyles.centredLane,
        ]}
      >
        <AppTopBar
          backLabel={backLabel ?? t('fullAuth.shared.back_to_settings')}
          subtitle={subtitle}
          title={t('fullAuth.notification_settings.notifications')}
          onBack={onBack}
        />
        {centred ? (
          <View style={notificationStyles.centredContent}>{children}</View>
        ) : (
          children
        )}
      </View>
    </AppScreen>
  );
};

const NotificationSettingsSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <View style={notificationStyles.section}>
    <AppSectionHeader subtitle={description} title={title} />
    <AppInsetGroup>{children}</AppInsetGroup>
  </View>
);

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    challengeId?: string | string[];
    source?: string | string[];
  }>();
  const contextChallengeId = firstParam(params.challengeId);
  const isPromiseContext =
    firstParam(params.source) === 'promise' && Boolean(contextChallengeId);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { clearAuthData, isAuthenticated, user } = useAuthStore();

  const handleBack = useCallback(() => {
    if (isPromiseContext && contextChallengeId) {
      backOrReplace(router, `/challenges/${contextChallengeId}`);
      return;
    }
    backOrReplace(router, '/(tabs)/settings-tab');
  }, [contextChallengeId, isPromiseContext, router]);

  const [preferences, setPreferences] =
    useState<UserNotificationPreferences | null>(null);
  const [preferencesOwnerId, setPreferencesOwnerId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [quietHoursStart, setQuietHoursStart] = useState(() =>
    dateForLocalTime(null, 22)
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(() =>
    dateForLocalTime(null, 7)
  );
  const [savingQuietHours, setSavingQuietHours] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState>('undetermined');
  const [savingKeys, setSavingKeys] = useState<ReadonlySet<PreferenceKey>>(
    new Set()
  );
  const [statusNotice, setStatusNotice] = useState<StatusNotice>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openingSettings, setOpeningSettings] = useState(false);
  const [sendingTestNotification, setSendingTestNotification] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeUserIdRef = useRef<string | null>(
    isAuthenticated ? (user?.id ?? null) : null
  );

  useEffect(() => {
    const nextUserId = isAuthenticated ? (user?.id ?? null) : null;
    if (activeUserIdRef.current !== nextUserId) {
      setPreferences(null);
      setPreferencesOwnerId(null);
      setSavingKeys(new Set());
      setStatusNotice(null);
    }
    activeUserIdRef.current = nextUserId;
  }, [isAuthenticated, t, user?.id]);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const requestedUserId = isAuthenticated ? (user?.id ?? null) : null;
    if (!requestedUserId) {
      setPreferences(null);
      setPreferencesOwnerId(null);
      setLoadError(t('fullAuth.residual.notifications.sign_in_again'));
      setLoading(false);
      return;
    }

    try {
      const prefs =
        await notificationService.getUserPreferences(requestedUserId);
      if (activeUserIdRef.current !== requestedUserId) return;
      if (!prefs) {
        throw new Error('Notification settings did not load.');
      }
      setPreferences(prefs);
      setPreferencesOwnerId(requestedUserId);
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return;
      console.error('Failed to load notification preferences:', error);
      setPreferences(null);
      setPreferencesOwnerId(null);
      setLoadError(t('fullAuth.residual.notifications.load_failed'));
    } finally {
      if (activeUserIdRef.current === requestedUserId) setLoading(false);
    }
  }, [isAuthenticated, t, user?.id]);

  const checkPermissionStatus =
    useCallback(async (): Promise<PermissionState> => {
      if (Platform.OS === 'web') {
        setPermissionStatus('granted');
        return 'granted';
      }

      try {
        const { status } = await Notifications.getPermissionsAsync();
        const permission = status as PermissionState;
        setPermissionStatus(permission);
        return permission;
      } catch (error) {
        console.error('Failed to check permission status:', error);
        setPermissionStatus('unavailable');
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.phone_notification_check_failed'
          ),
          description: t(
            'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting'
          ),
          tone: 'error',
        });
        return 'unavailable';
      }
    }, [t]);

  useEffect(() => {
    void loadPreferences();
    void checkPermissionStatus();
  }, [checkPermissionStatus, loadPreferences]);

  useEffect(() => {
    let previousAppState = AppState.currentState;
    const subscription = AppState.addEventListener('change', nextAppState => {
      const returnedFromSettings =
        previousAppState !== 'active' && nextAppState === 'active';
      previousAppState = nextAppState;
      if (!returnedFromSettings) return;

      void (async () => {
        const returnedPermission = await checkPermissionStatus();
        const returnedUserId = activeUserIdRef.current;
        if (!returnedUserId) return;

        if (returnedPermission !== 'granted') {
          await notificationService
            .syncPushRegistrationForUser(returnedUserId)
            .catch(() => false);
          if (activeUserIdRef.current !== returnedUserId) return;
          setStatusNotice({
            title: t(
              'fullAuth.notification_settings.notifications_are_still_off'
            ),
            description: t(
              'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai'
            ),
            tone: 'info',
          });
          return;
        }

        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.your_phone_now_allows_notifications'
          ),
          description: t(
            'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p'
          ),
          tone: 'info',
        });

        try {
          const registered =
            await notificationService.syncPushRegistrationForUser(
              returnedUserId
            );
          if (activeUserIdRef.current !== returnedUserId) return;

          setStatusNotice(
            registered
              ? {
                  title: t(
                    'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications'
                  ),
                  description: t(
                    'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel'
                  ),
                  tone: 'success',
                }
              : {
                  title: t(
                    'fullAuth.notification_settings.notification_setup_did_not_finish'
                  ),
                  description: t(
                    'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t'
                  ),
                  tone: 'warning',
                }
          );
        } catch {
          if (activeUserIdRef.current !== returnedUserId) return;
          setStatusNotice({
            title: t(
              'fullAuth.notification_settings.notification_setup_did_not_finish'
            ),
            description: t(
              'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t'
            ),
            tone: 'warning',
          });
        }
      })();
    });

    return () => subscription.remove();
  }, [checkPermissionStatus, t]);

  useEffect(() => {
    if (preferences?.preferred_reminder_time) {
      const [hours, minutes] = preferences.preferred_reminder_time.split(':');
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      setReminderTime(time);
      return;
    }

    const defaultTime = new Date();
    defaultTime.setHours(20, 0, 0, 0);
    setReminderTime(defaultTime);
  }, [preferences?.preferred_reminder_time]);

  useEffect(() => {
    setQuietHoursStart(dateForLocalTime(preferences?.quiet_hours_start, 22));
    setQuietHoursEnd(dateForLocalTime(preferences?.quiet_hours_end, 7));
  }, [preferences?.quiet_hours_end, preferences?.quiet_hours_start]);

  const updatePreference = async (
    key: PreferenceKey,
    value: boolean | string
  ): Promise<boolean> => {
    const requestedUserId = user?.id;
    if (
      !requestedUserId ||
      !preferences ||
      preferencesOwnerId !== requestedUserId ||
      savingKeys.has(key)
    ) {
      return false;
    }

    const previous = preferences;
    const updatedPrefs = {
      ...preferences,
      [key]: value,
    } as UserNotificationPreferences;
    setSavingKeys(current => new Set(current).add(key));
    setPreferences(updatedPrefs);
    setStatusNotice({
      title: t('fullAuth.notification_settings.saving_your_choice'),
      description: t(
        'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous'
      ),
      tone: 'info',
    });

    try {
      await notificationService.updateUserPreferences(requestedUserId, {
        [key]: value,
      });
      if (activeUserIdRef.current !== requestedUserId) return false;
      setStatusNotice({
        title: t('fullAuth.notification_settings.choice_saved'),
        description: t(
          'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati'
        ),
        tone: 'success',
      });
      return true;
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return false;
      console.error('Failed to update preference:', error);
      setPreferences(previous);
      setStatusNotice({
        title: t('fullAuth.notification_settings.could_not_save_your_choice'),
        description: t(
          'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ'
        ),
        tone: 'error',
      });
      return false;
    } finally {
      if (activeUserIdRef.current === requestedUserId) {
        setSavingKeys(current => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    }
  };

  const handleMarketingEmailToggle = async (enabled: boolean) => {
    const requestedUserId = user?.id;
    const email = user?.email?.trim().toLowerCase();
    if (
      !requestedUserId ||
      !email ||
      !preferences ||
      preferencesOwnerId !== requestedUserId ||
      savingKeys.has('marketing_email_opt_in')
    ) {
      setStatusNotice({
        title: t(
          'fullAuth.notification_settings.email_updates_are_unavailable'
        ),
        description: t(
          'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi'
        ),
        tone: 'warning',
      });
      return;
    }

    const previous = preferences;
    const optedAt = enabled ? new Date().toISOString() : null;
    setSavingKeys(current => new Set(current).add('marketing_email_opt_in'));
    setPreferences({
      ...preferences,
      marketing_email_opt_in: enabled,
      marketing_email_opted_at: optedAt,
      marketing_email_provider_sync_pending: true,
    });
    setStatusNotice({
      title: enabled
        ? t('fullAuth.notification_settings.turning_on_email_updates')
        : t('fullAuth.notification_settings.turning_off_email_updates'),
      description: t(
        'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_'
      ),
      tone: 'info',
    });

    try {
      await notificationService.updateUserPreferences(requestedUserId, {
        marketing_email_opt_in: enabled,
        marketing_email_opted_at: optedAt,
        marketing_email_provider_sync_pending: true,
      });
      if (activeUserIdRef.current !== requestedUserId) return;

      const providerSynced =
        await retentionNotificationClient.syncEmailSubscription(email, enabled);
      await retentionNotificationClient.syncAudienceTags({
        marketing_email_opt_in: enabled,
      });
      if (activeUserIdRef.current !== requestedUserId) return;

      if (!providerSynced && enabled) {
        await notificationService.updateUserPreferences(requestedUserId, {
          marketing_email_opt_in: false,
          marketing_email_opted_at: null,
          marketing_email_provider_sync_pending: false,
        });
        if (activeUserIdRef.current !== requestedUserId) return;
        setPreferences({
          ...previous,
          marketing_email_opt_in: false,
          marketing_email_opted_at: null,
          marketing_email_provider_sync_pending: false,
        });
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.email_updates_are_still_off'
          ),
          description: t(
            'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you'
          ),
          tone: 'error',
        });
        return;
      }

      if (providerSynced) {
        await notificationService.updateUserPreferences(requestedUserId, {
          marketing_email_provider_sync_pending: false,
        });
        if (activeUserIdRef.current !== requestedUserId) return;
        setPreferences(current =>
          current
            ? {
                ...current,
                marketing_email_provider_sync_pending: false,
              }
            : current
        );
      }

      setStatusNotice({
        title: enabled
          ? t('fullAuth.notification_settings.email_updates_are_on')
          : t('fullAuth.notification_settings.email_updates_are_off'),
        description: enabled
          ? t(
              'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a'
            )
          : providerSynced
            ? t(
                'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del'
              )
            : t(
                'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil'
              ),
        tone: providerSynced ? 'success' : 'warning',
      });
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return;
      console.error('Failed to update marketing email consent:', error);
      setPreferences(previous);
      setStatusNotice({
        title: t('fullAuth.notification_settings.email_choice_did_not_change'),
        description: t(
          'fullAuth.notification_settings.your_previous_email_choice_is_still_active'
        ),
        tone: 'error',
      });
    } finally {
      if (activeUserIdRef.current === requestedUserId) {
        setSavingKeys(current => {
          const next = new Set(current);
          next.delete('marketing_email_opt_in');
          return next;
        });
      }
    }
  };

  const handleStreakReminderToggle = async (enabled: boolean) => {
    const requestedUserId = user?.id;
    if (enabled && permissionStatus === 'unavailable') {
      setStatusNotice({
        title: t(
          'fullAuth.notification_settings.could_not_check_phone_notifications'
        ),
        description: t(
          'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders'
        ),
        tone: 'warning',
      });
      return;
    }

    if (enabled) {
      if (permissionStatus !== 'granted') {
        setStatusNotice({
          title: t('fullAuth.notification_settings.allow_notifications_first'),
          description: t(
            'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho'
          ),
          tone: 'info',
        });
        router.push('/notification-onboarding' as never);
        return;
      }

      const saved = await updatePreference('challenge_reminders', true);
      if (
        !saved ||
        !requestedUserId ||
        activeUserIdRef.current !== requestedUserId
      ) {
        return;
      }

      try {
        setStatusNotice({
          title: t('fullAuth.notification_settings.preparing_proof_reminders'),
          description: t(
            'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro'
          ),
          tone: 'info',
        });
        const syncResult =
          await notificationService.syncChallengeRemindersForUser(
            requestedUserId
          );
        if (activeUserIdRef.current !== requestedUserId) return;

        if (syncResult === 'remote-owned') {
          setStatusNotice({
            title: t(
              'fullAuth.notification_settings.proof_reminders_are_ready'
            ),
            description: t(
              'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro'
            ),
            tone: 'success',
          });
          return;
        }

        if (syncResult === 'no-active-promises') {
          setStatusNotice({
            title: t('fullAuth.notification_settings.proof_reminders_saved'),
            description: t(
              'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men'
            ),
            tone: 'info',
          });
          return;
        }

        if (syncResult !== 'scheduled') {
          setStatusNotice({
            title: t(
              'fullAuth.notification_settings.reminder_setup_did_not_finish'
            ),
            description: t(
              'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not'
            ),
            tone: 'error',
          });
          return;
        }

        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone'
          ),
          description: t(
            'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred'
          ),
          tone: 'success',
        });
      } catch (error) {
        if (activeUserIdRef.current !== requestedUserId) return;
        console.error('Failed to sync challenge reminders:', error);
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.reminder_setup_did_not_finish'
          ),
          description: t(
            'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2'
          ),
          tone: 'error',
        });
      }
      return;
    }

    const saved = await updatePreference('challenge_reminders', false);
    if (
      !saved ||
      !requestedUserId ||
      activeUserIdRef.current !== requestedUserId
    ) {
      return;
    }

    try {
      await notificationService.cancelAllChallengeRemindersForUser(
        requestedUserId
      );
      if (activeUserIdRef.current !== requestedUserId) return;
      setStatusNotice({
        title: t('fullAuth.notification_settings.proof_reminders_are_off'),
        description: t(
          'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi'
        ),
        tone: 'info',
      });
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return;
      console.error('Failed to cancel challenge reminders:', error);
      setStatusNotice({
        title: t(
          'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone'
        ),
        description: t(
          'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti'
        ),
        tone: 'error',
      });
    }
  };

  const handleTimeChange = async (selectedTime: Date) => {
    const requestedUserId = user?.id;
    const previousTime = reminderTime;
    setReminderTime(selectedTime);

    const timeString = `${selectedTime
      .getHours()
      .toString()
      .padStart(2, '0')}:${selectedTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}:00`;

    const saved = await updatePreference('preferred_reminder_time', timeString);
    if (!saved) {
      setReminderTime(previousTime);
      return;
    }

    if (requestedUserId && activeUserIdRef.current === requestedUserId) {
      try {
        await notificationService.updateAllUserReminderTimes(
          requestedUserId,
          selectedTime
        );
        if (activeUserIdRef.current !== requestedUserId) return;
      } catch (error) {
        if (activeUserIdRef.current !== requestedUserId) return;
        console.error('Failed to update reminder times:', error);
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone'
          ),
          description: t(
            'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_'
          ),
          tone: 'error',
        });
      }
    }
  };

  const handleSaveQuietHours = async () => {
    const requestedUserId = user?.id;
    if (
      !requestedUserId ||
      !preferences ||
      preferencesOwnerId !== requestedUserId ||
      savingQuietHours
    ) {
      return;
    }

    const nextStart = timeValue(quietHoursStart);
    const nextEnd = timeValue(quietHoursEnd);
    const nextTimezone = notificationService.getCurrentTimezone();
    const previousStart = preferences.quiet_hours_start;
    const previousEnd = preferences.quiet_hours_end;
    setSavingQuietHours(true);
    setStatusNotice({
      title: t('fullAuth.notification_settings.saving_quiet_hours'),
      description: t(
        'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi'
      ),
      tone: 'info',
    });

    try {
      await notificationService.updateUserPreferences(requestedUserId, {
        quiet_hours_start: nextStart,
        quiet_hours_end: nextEnd,
        timezone: nextTimezone,
      });
      if (activeUserIdRef.current !== requestedUserId) return;
      setPreferences(current =>
        current
          ? {
              ...current,
              quiet_hours_start: nextStart,
              quiet_hours_end: nextEnd,
              timezone: nextTimezone,
            }
          : current
      );
      setStatusNotice({
        title: t('fullAuth.notification_settings.quiet_hours_saved'),
        description: t(
          'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h'
        ),
        tone: 'success',
      });
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return;
      console.error('Failed to save quiet hours:', error);
      setQuietHoursStart(dateForLocalTime(previousStart, 22));
      setQuietHoursEnd(dateForLocalTime(previousEnd, 7));
      setStatusNotice({
        title: t('fullAuth.notification_settings.quiet_hours_not_saved'),
        description: t(
          'fullAuth.notification_settings.your_previous_quiet_hours_remain_active'
        ),
        tone: 'error',
      });
    } finally {
      if (activeUserIdRef.current === requestedUserId) {
        setSavingQuietHours(false);
      }
    }
  };

  const requestNotificationPermissions = () => {
    if (!isPromiseContext || !contextChallengeId) {
      router.push('/notification-onboarding');
      return;
    }
    router.push({
      pathname: '/notification-onboarding',
      params: { challengeId: contextChallengeId, source: 'promise' },
    });
  };

  const openSystemNotificationSettings = async () => {
    if (openingSettings) return;
    setOpeningSettings(true);
    setStatusNotice({
      title: t('fullAuth.notification_settings.opening_phone_settings'),
      description: t(
        'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here'
      ),
      tone: 'info',
    });
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open notification settings:', error);
      setStatusNotice({
        title: t(
          'fullAuth.notification_settings.could_not_open_phone_settings'
        ),
        description: t(
          'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif'
        ),
        tone: 'error',
      });
    } finally {
      setOpeningSettings(false);
    }
  };

  const sendTestNotification = async () => {
    const requestedUserId = isAuthenticated ? (user?.id ?? null) : null;
    if (!requestedUserId || sendingTestNotification) return;

    setSendingTestNotification(true);
    trackProductEvent('Notification Test Journey', {
      stage: 'requested',
      outcome: 'started',
    });
    logEvent('info', 'notification_test_journey', {
      stage: 'requested',
      outcome: 'started',
    });
    setStatusNotice({
      title: t('fullAuth.notification_settings.preparing_a_test_notification'),
      description: t(
        'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th'
      ),
      tone: 'info',
    });

    try {
      const permission = await checkPermissionStatus();
      if (activeUserIdRef.current !== requestedUserId) return;
      if (permission !== 'granted') {
        trackProductEvent('Notification Test Journey', {
          stage: 'permission',
          outcome: 'not_granted',
        });
        logEvent('warn', 'notification_test_journey', {
          stage: 'permission',
          outcome: 'not_granted',
        });
        setStatusNotice({
          title: t('fullAuth.notification_settings.allow_notifications_first'),
          description: t(
            'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before'
          ),
          tone: 'warning',
        });
        return;
      }

      trackProductEvent('Notification Test Journey', {
        stage: 'permission',
        outcome: 'granted',
      });

      const registered =
        await notificationService.syncPushRegistrationForUser(requestedUserId);
      if (activeUserIdRef.current !== requestedUserId) return;
      if (!registered) {
        trackProductEvent('Notification Test Journey', {
          stage: 'registration',
          outcome: 'not_ready',
        });
        logEvent('warn', 'notification_test_journey', {
          stage: 'registration',
          outcome: 'not_ready',
        });
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.this_phone_is_not_ready_yet'
          ),
          description: t(
            'fullAuth.notification_settings.menta_could_not_finish_notification_registration'
          ),
          tone: 'warning',
        });
        return;
      }

      trackProductEvent('Notification Test Journey', {
        stage: 'registration',
        outcome: 'ready',
      });

      const result =
        await notificationService.requestTestNotification(requestedUserId);
      if (activeUserIdRef.current !== requestedUserId) return;

      if (result === 'queued') {
        trackProductEvent('Notification Test Journey', {
          stage: 'server',
          outcome: 'queued',
        });
        logEvent('info', 'notification_test_journey', {
          stage: 'server',
          outcome: 'queued',
        });
        setStatusNotice({
          title: t('fullAuth.notification_settings.test_notification_queued'),
          description: t(
            'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not'
          ),
          tone: 'success',
        });
      } else if (result === 'rate-limited') {
        trackProductEvent('Notification Test Journey', {
          stage: 'server',
          outcome: 'rate_limited',
        });
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.a_test_is_already_on_the_way'
          ),
          description: t(
            'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test'
          ),
          tone: 'info',
        });
      } else if (result === 'not-ready') {
        trackProductEvent('Notification Test Journey', {
          stage: 'server',
          outcome: 'not_ready',
        });
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.this_phone_is_not_ready_yet'
          ),
          description: t(
            'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a'
          ),
          tone: 'warning',
        });
      } else if (result === 'auth-required') {
        trackProductEvent('Notification Test Journey', {
          stage: 'server',
          outcome: 'auth_required',
        });
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.sign_in_again_to_send_a_test'
          ),
          description: t(
            'fullAuth.notification_settings.no_notification_was_queued'
          ),
          tone: 'warning',
        });
      } else {
        trackProductEvent('Notification Test Journey', {
          stage: 'server',
          outcome: 'failed',
        });
        logEvent('warn', 'notification_test_journey', {
          stage: 'server',
          outcome: 'failed',
        });
        setStatusNotice({
          title: t(
            'fullAuth.notification_settings.test_notification_was_not_queued'
          ),
          description: t(
            'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment'
          ),
          tone: 'error',
        });
      }
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return;
      console.error('Failed to request test notification:', error);
      trackProductEvent('Notification Test Journey', {
        stage: 'server',
        outcome: 'failed',
      });
      logEvent('error', 'notification_test_journey', {
        stage: 'server',
        outcome: 'failed',
      });
      setStatusNotice({
        title: t(
          'fullAuth.notification_settings.test_notification_was_not_queued'
        ),
        description: t(
          'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment'
        ),
        tone: 'error',
      });
    } finally {
      if (activeUserIdRef.current === requestedUserId) {
        setSendingTestNotification(false);
      }
    }
  };

  const formattedReminderTime = useMemo(
    () =>
      reminderTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [reminderTime]
  );
  const formattedQuietHours = useMemo(
    () =>
      `${quietHoursStart.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}–${quietHoursEnd.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`,
    [quietHoursEnd, quietHoursStart]
  );

  const currentUserId = isAuthenticated ? (user?.id ?? null) : null;

  if (loading || (!loadError && preferencesOwnerId !== currentUserId)) {
    return (
      <NotificationSettingsLayout
        subtitle={t(
          'fullAuth.notification_settings.loading_your_notification_settings'
        )}
        backLabel={
          isPromiseContext
            ? t('fullAuth.notification_settings.back_to_promise')
            : undefined
        }
        onBack={handleBack}
      >
        <NotificationSettingsSkeleton />
      </NotificationSettingsLayout>
    );
  }

  if (loadError || !preferences) {
    return (
      <NotificationSettingsLayout
        subtitle={t(
          'fullAuth.notification_settings.could_not_load_notification_settings'
        )}
        backLabel={
          isPromiseContext
            ? t('fullAuth.notification_settings.back_to_promise')
            : undefined
        }
        onBack={handleBack}
        centred
      >
        <AppInlineNotice
          title={t(
            'fullAuth.notification_settings.could_not_load_notification_settings_2'
          )}
          description={
            loadError || t('fullAuth.residual.notifications.still_apply')
          }
          tone="error"
          testID="notification-settings-load-notice"
        />
        {!user?.id || !isAuthenticated ? (
          <AppButton
            fullWidth
            size="large"
            title={t('fullAuth.notification_settings.sign_in_again')}
            onPress={() => {
              clearAuthData();
              router.replace('/login');
            }}
            testID="notification-settings-sign-in-again"
          />
        ) : null}
        <AppFieldRow
          title={t('fullAuth.notification_settings.try_again')}
          subtitle={t(
            'fullAuth.notification_settings.reload_your_saved_notification_choices'
          )}
          value="Retry"
          onPress={() => {
            void loadPreferences();
          }}
          testID="notification-settings-retry"
        />
        <AppButton
          fullWidth
          size="large"
          title={t('fullAuth.notification_settings.back_to_settings')}
          variant="secondary"
          onPress={handleBack}
        />
      </NotificationSettingsLayout>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <NotificationSettingsLayout
        subtitle={t(
          'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt'
        )}
        backLabel={
          isPromiseContext
            ? t('fullAuth.notification_settings.back_to_promise')
            : undefined
        }
        onBack={handleBack}
        centred
      >
        <NotificationSettingsSection
          title={t('fullAuth.notification_settings.notifications_off')}
          description={t(
            'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho'
          )}
        >
          <AppInlineNotice
            title={t('fullAuth.notification_settings.to_turn_them_on')}
            description={t(
              'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2'
            )}
            tone="info"
            testID="notification-settings-denied-instructions"
          />

          {statusNotice ? (
            <AppInlineNotice
              title={statusNotice.title}
              description={statusNotice.description}
              tone={statusNotice.tone}
              testID="notification-settings-status-notice"
            />
          ) : null}

          <AppButton
            fullWidth
            title={t('fullAuth.notification_settings.open_phone_settings')}
            disabled={openingSettings}
            loading={openingSettings}
            size="large"
            testID="notification-settings-open-system-settings"
            onPress={openSystemNotificationSettings}
          />
          <AppButton
            fullWidth
            size="large"
            title={t('fullAuth.notification_settings.keep_notifications_off')}
            variant="secondary"
            onPress={handleBack}
          />
        </NotificationSettingsSection>
      </NotificationSettingsLayout>
    );
  }

  return (
    <NotificationSettingsLayout
      subtitle={t(
        'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta'
      )}
      backLabel={
        isPromiseContext
          ? t('fullAuth.notification_settings.back_to_promise')
          : undefined
      }
      onBack={handleBack}
    >
      {isPromiseContext ? (
        <AppInlineNotice
          description={t(
            'fullAuth.notification_settings.promise_context_body',
            { timeZone }
          )}
          testID="notification-settings-promise-context"
          title={t('fullAuth.notification_settings.promise_context_title')}
          tone="info"
        />
      ) : null}
      {permissionStatus !== 'granted' ? (
        <AppInlineNotice
          title={
            permissionStatus === 'unavailable'
              ? t(
                  'fullAuth.notification_settings.could_not_check_phone_notifications'
                )
              : t('fullAuth.notification_settings.notifications_are_off')
          }
          description={
            permissionStatus === 'unavailable'
              ? t(
                  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p'
                )
              : t(
                  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho'
                )
          }
          tone={permissionStatus === 'unavailable' ? 'error' : 'info'}
          testID="notification-settings-primer-notice"
        />
      ) : null}

      {statusNotice ? (
        <AppInlineNotice
          title={statusNotice.title}
          description={statusNotice.description}
          tone={statusNotice.tone}
          testID="notification-settings-status-notice"
        />
      ) : null}

      {permissionStatus === 'unavailable' ? (
        <AppButton
          fullWidth
          size="large"
          testID="notification-settings-check-permission"
          title={t(
            'fullAuth.notification_settings.check_notification_permission'
          )}
          onPress={() => {
            void checkPermissionStatus();
          }}
        />
      ) : permissionStatus !== 'granted' ? (
        <AppButton
          fullWidth
          size="large"
          testID="notification-settings-setup"
          title={t('fullAuth.notification_settings.allow_notifications')}
          onPress={requestNotificationPermissions}
        />
      ) : null}

      <View
        accessible
        accessibilityLabel={
          permissionStatus === 'granted'
            ? t(
                'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications'
              )
            : t('fullAuth.notification_settings.notifications_are_off')
        }
        style={notificationStyles.permissionSummary}
        testID="notification-settings-permission-summary"
      >
        <View style={notificationStyles.permissionSummaryIcon}>
          {permissionStatus === 'granted' ? (
            <BellIcon size={22} color={mentaColors.action} />
          ) : (
            <BellOffIcon size={22} color={mentaColors.text.secondary} />
          )}
        </View>
        <View style={notificationStyles.permissionSummaryCopy}>
          <Text style={notificationStyles.permissionSummaryTitle}>
            {permissionStatus === 'granted'
              ? t(
                  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications'
                )
              : t('fullAuth.notification_settings.notifications_are_off')}
          </Text>
          <Text style={notificationStyles.permissionSummaryDetail}>
            {permissionStatus === 'granted'
              ? t(
                  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel'
                )
              : t(
                  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho'
                )}
          </Text>
        </View>
        <Text style={notificationStyles.permissionSummaryValue}>
          {permissionStatus === 'granted'
            ? t('fullAuth.residual.settings.on_value')
            : t('fullAuth.residual.settings.off_value')}
        </Text>
      </View>

      <NotificationSettingsSection
        title={t('fullAuth.notification_settings.promise_reminders')}
        description={t(
          'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_'
        )}
      >
        <AppSwitchRow
          title={t('fullAuth.notification_settings.proof_reminders')}
          subtitle={
            savingKeys.has('challenge_reminders')
              ? t('fullAuth.notification_settings.saving_your_choice_2')
              : permissionStatus === 'granted'
                ? t(
                    'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates'
                  )
                : t(
                    'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone'
                  )
          }
          value={preferences.challenge_reminders ?? true}
          onChange={value => {
            void handleStreakReminderToggle(value);
          }}
        />
        <AppDateTimeRow
          title={t('fullAuth.notification_settings.reminder_time')}
          subtitle={
            permissionStatus === 'granted'
              ? t(
                  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea',
                  { formattedReminderTime: formattedReminderTime }
                )
              : t(
                  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio',
                  { formattedReminderTime: formattedReminderTime }
                )
          }
          value={reminderTime}
          onChange={selectedTime => {
            void handleTimeChange(selectedTime);
          }}
          showDivider={false}
        />
      </NotificationSettingsSection>

      <NotificationSettingsSection
        title={t('fullAuth.notification_settings.people_and_progress')}
        description={t(
          'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma'
        )}
      >
        <AppSwitchRow
          title={t('fullAuth.notification_settings.reviews_and_group_activity')}
          subtitle={
            savingKeys.has('group_updates')
              ? t('fullAuth.notification_settings.saving_your_choice_2')
              : t(
                  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an'
                )
          }
          value={preferences.group_updates ?? true}
          onChange={value => {
            void updatePreference('group_updates', value);
          }}
        />
        <AppSwitchRow
          title={t('fullAuth.notification_settings.streaks_and_momenta')}
          subtitle={
            savingKeys.has('streak_alerts')
              ? t('fullAuth.notification_settings.saving_your_choice_2')
              : t(
                  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes'
                )
          }
          value={preferences.streak_alerts ?? true}
          onChange={value => {
            void updatePreference('streak_alerts', value);
          }}
          showDivider={false}
        />
      </NotificationSettingsSection>

      <NotificationSettingsSection
        title={t('fullAuth.notification_settings.email_updates')}
        description={t(
          'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro'
        )}
      >
        <AppSwitchRow
          title={t('fullAuth.notification_settings.menta_product_news')}
          subtitle={
            savingKeys.has('marketing_email_opt_in')
              ? t('fullAuth.notification_settings.saving_your_email_choice')
              : user?.email
                ? t(
                    'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here',
                    {
                      email: user.email,
                    }
                  )
                : t(
                    'fullAuth.notification_settings.a_confirmed_account_email_is_required'
                  )
          }
          value={preferences.marketing_email_opt_in ?? false}
          onChange={value => {
            void handleMarketingEmailToggle(value);
          }}
          showDivider={false}
        />
      </NotificationSettingsSection>

      <NotificationSettingsSection
        title={t('fullAuth.notification_settings.delivery_and_timing')}
        description={t(
          'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt'
        )}
      >
        <AppFieldRow
          title={t('fullAuth.notification_settings.quiet_hours_and_delivery')}
          subtitle={t(
            'fullAuth.notification_settings.quiet_hours_formattedquiethours',
            { formattedQuietHours: formattedQuietHours }
          )}
          value={showAdvanced ? 'Hide' : 'Open'}
          onPress={() => setShowAdvanced(current => !current)}
          testID="notification-settings-toggle-advanced"
          showDivider={false}
        />
      </NotificationSettingsSection>

      {showAdvanced ? (
        <>
          <NotificationSettingsSection
            title={t('fullAuth.notification_settings.quiet_hours')}
            description={t(
              'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo'
            )}
          >
            <AppDateTimeRow
              title={t('fullAuth.notification_settings.quiet_hours_start')}
              subtitle={t(
                'fullAuth.notification_settings.the_range_can_cross_midnight'
              )}
              value={quietHoursStart}
              onChange={setQuietHoursStart}
            />
            <AppDateTimeRow
              title={t('fullAuth.notification_settings.quiet_hours_end')}
              subtitle={t(
                'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time'
              )}
              value={quietHoursEnd}
              onChange={setQuietHoursEnd}
              showDivider={false}
            />
            <AppButton
              fullWidth
              size="medium"
              title={t('fullAuth.notification_settings.save_quiet_hours')}
              disabled={savingQuietHours}
              loading={savingQuietHours}
              testID="notification-settings-save-quiet-hours"
              onPress={() => {
                void handleSaveQuietHours();
              }}
            />
          </NotificationSettingsSection>

          <NotificationSettingsSection
            title={t('fullAuth.notification_settings.phone_controls')}
            description={t(
              'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are'
            )}
          >
            <AppFieldRow
              title={t(
                'fullAuth.notification_settings.phone_notification_settings'
              )}
              subtitle={t(
                'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery'
              )}
              value="Open"
              onPress={() => void openSystemNotificationSettings()}
              showDivider={false}
              testID="notification-settings-open-phone-controls"
            />
          </NotificationSettingsSection>

          {permissionStatus === 'granted' ? (
            <NotificationSettingsSection
              title={t('fullAuth.notification_settings.test_notifications')}
              description={t(
                'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho'
              )}
            >
              <AppButton
                fullWidth
                size="large"
                disabled={sendingTestNotification}
                loading={sendingTestNotification}
                testID="notification-settings-send-test"
                title={t(
                  'fullAuth.notification_settings.send_test_notification'
                )}
                onPress={() => {
                  void sendTestNotification();
                }}
              />
            </NotificationSettingsSection>
          ) : null}
        </>
      ) : null}

      <View style={notificationStyles.saveStatus}>
        {permissionStatus === 'granted' ? (
          <BellIcon size={16} color={mentaColors.text.muted} />
        ) : (
          <BellOffIcon size={16} color={mentaColors.text.muted} />
        )}
        <Text style={notificationStyles.saveStatusText}>
          {permissionStatus === 'granted'
            ? t('fullAuth.residual.notifications.auto_save')
            : t('fullAuth.residual.notifications.off_save')}
        </Text>
      </View>
    </NotificationSettingsLayout>
  );
}

const SkeletonSwitchRow = ({ last = false }: { last?: boolean }) => (
  <View
    style={[
      notificationSkeletonStyles.switchRow,
      !last && notificationSkeletonStyles.switchDivider,
    ]}
  >
    <View style={notificationSkeletonStyles.switchCopy}>
      <SkeletonLoader announce={false} height={14} width="44%" />
      <SkeletonLoader announce={false} height={11} width="72%" />
    </View>
    <SkeletonLoader
      announce={false}
      borderRadius={mentaRadii.round}
      height={28}
      width={48}
    />
  </View>
);

const SkeletonDateTimeRow = ({ last = false }: { last?: boolean }) => (
  <View
    style={[
      notificationSkeletonStyles.switchRow,
      !last && notificationSkeletonStyles.switchDivider,
    ]}
  >
    <View style={notificationSkeletonStyles.switchCopy}>
      <SkeletonLoader announce={false} height={14} width="52%" />
      <SkeletonLoader announce={false} height={11} width="64%" />
    </View>
    <SkeletonLoader announce={false} height={14} width={64} />
  </View>
);

const NotificationSettingsSkeleton = () => {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t(
        'fullAuth.notification_settings.loading_notification_settings'
      )}
      accessibilityRole="progressbar"
      testID="notification-settings-loading"
      style={notificationSkeletonStyles.frame}
    >
      <View style={notificationStyles.section}>
        <SkeletonLoader announce={false} height={18} width="48%" />
        <SkeletonLoader announce={false} height={12} width="78%" />
        <AppInsetGroup>
          <SkeletonSwitchRow />
          <SkeletonDateTimeRow last />
        </AppInsetGroup>
      </View>
      <View style={notificationStyles.section}>
        <SkeletonLoader announce={false} height={18} width="36%" />
        <SkeletonLoader announce={false} height={12} width="82%" />
        <AppInsetGroup>
          <SkeletonDateTimeRow />
          <SkeletonDateTimeRow last />
        </AppInsetGroup>
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.medium}
          height={44}
          width="100%"
        />
      </View>
      <View style={notificationStyles.section}>
        <SkeletonLoader announce={false} height={18} width="42%" />
        <SkeletonLoader announce={false} height={12} width="70%" />
        <AppInsetGroup>
          <SkeletonSwitchRow />
          <SkeletonSwitchRow last />
        </AppInsetGroup>
      </View>
      <View style={notificationStyles.section}>
        <SkeletonLoader announce={false} height={18} width="28%" />
        <SkeletonLoader announce={false} height={12} width="54%" />
        <AppInsetGroup>
          <SkeletonSwitchRow last />
        </AppInsetGroup>
      </View>
      <View style={notificationStyles.saveStatus}>
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.round}
          height={16}
          width={16}
        />
        <SkeletonLoader announce={false} height={12} width="56%" />
      </View>
    </View>
  );
};

const notificationSkeletonStyles = StyleSheet.create({
  frame: {
    gap: mentaSpacing[6],
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 68,
    paddingVertical: mentaSpacing[3],
  },
  switchDivider: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  switchCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
});

const notificationStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  lane: {
    alignSelf: 'center',
    gap: mentaSpacing[8],
    paddingHorizontal: mentaLayout.screenInset,
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  centredLane: {
    flexGrow: 1,
  },
  centredContent: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    justifyContent: 'center',
    paddingBottom: mentaSpacing[12],
  },
  section: {
    gap: mentaSpacing[4],
  },
  permissionSummary: {
    alignItems: 'center',
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 112,
    padding: mentaSpacing[5],
  },
  permissionSummaryIcon: {
    alignItems: 'center',
    backgroundColor: mentaColors.actionSoft,
    borderRadius: mentaRadii.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  permissionSummaryCopy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  permissionSummaryTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  permissionSummaryDetail: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  permissionSummaryValue: {
    color: mentaColors.action,
    flexShrink: 0,
    ...mentaTypography.label,
  },
  saveStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  saveStatusText: {
    color: mentaColors.text.muted,
    ...mentaTypography.caption,
  },
});
