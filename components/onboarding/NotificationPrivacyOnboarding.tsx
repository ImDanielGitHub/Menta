import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { PromiseInviteRoleHero } from '@/components/onboarding/PromiseInviteRoleHero';
import { BellIcon, CheckIcon, ShieldCheckIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { mentaFonts } from '@/lib/menta-fonts';
import { notificationService } from '@/lib/services/notification-service';
import { retentionNotificationClient } from '@/lib/notifications/retention-notification-client';
import { trackProductEvent } from '@/lib/posthog';
import { useTranslation } from '@/lib/localization';
import {
  accountabilityInviteRoleCopy,
  type PromiseAccountabilityRole,
} from '@/lib/promises/accountability';

type ScreenState =
  | 'checking'
  | 'education'
  | 'granted'
  | 'registration-pending'
  | 'permission-off';

export type NotificationPrivacyOnboardingProps = {
  beforeAuth?: boolean;
  completionLabel?: string;
  entryMode?: 'fresh' | 'restored' | 'replay' | 'post_sign_in';
  userId: string | null;
  onBack: () => void;
  onComplete: () => void;
  promptContext?: 'first_promise' | 'promise_invite' | 'settings';
  promiseInviteRole?: PromiseAccountabilityRole | null;
};

/**
 * Production counterpart to AUTH-07 through AUTH-09. Expo's notification
 * permission check is read-only; only the Continue action asks the phone. Push
 * registration is deliberately rendered as a second, fallible receipt.
 */
export const NotificationPrivacyOnboarding = ({
  beforeAuth = false,
  completionLabel,
  entryMode,
  userId,
  onBack,
  onComplete,
  promptContext = 'settings',
  promiseInviteRole = null,
}: NotificationPrivacyOnboardingProps) => {
  const { t } = useTranslation();
  const [screenState, setScreenState] = useState<ScreenState>('checking');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
    tone: 'info' | 'warning' | 'error' | 'success';
  } | null>(null);
  const mountedRef = useRef(true);
  const latestUserIdRef = useRef(userId);
  const settingsReturnPendingRef = useRef(false);
  const registrationInFlightForUserRef = useRef<string | null>(null);
  const previousUserIdRef = useRef(userId);
  const lastTrackedPermissionRef = useRef<string | null>(null);
  const journeyViewsRef = useRef(new Set<string>());
  const trackNotificationJourney = useCallback(
    (
      stage:
        | 'notification_education'
        | 'notification_permission'
        | 'notification_registration',
      action:
        | 'viewed'
        | 'continued'
        | 'back'
        | 'skipped'
        | 'requested'
        | 'opened'
        | 'returned'
        | 'retried'
        | 'completed',
      outcome:
        | 'not_applicable'
        | 'succeeded'
        | 'failed'
        | 'granted'
        | 'denied'
        | 'pending'
        | 'unknown' = 'not_applicable',
      selection:
        | 'not_applicable'
        | 'allow_notifications'
        | 'keep_notifications_off'
        | 'open_settings' = 'not_applicable'
    ) => {
      trackProductEvent('Onboarding Journey', {
        action,
        authenticated: Boolean(userId),
        entry_mode: entryMode ?? (beforeAuth ? 'fresh' : 'post_sign_in'),
        journey: 'notification_permission',
        outcome,
        selection,
        stage,
      });
      if (promptContext === 'promise_invite') {
        trackProductEvent('Promise Invite Journey', {
          action,
          authenticated: Boolean(userId),
          entry_point: 'first_account_setup',
          outcome,
          role: promiseInviteRole ?? 'unknown',
          stage: 'notification_education',
        });
      }
    },
    [beforeAuth, entryMode, promiseInviteRole, promptContext, userId]
  );

  useEffect(() => {
    if (screenState === 'checking') return;
    const stage =
      screenState === 'education'
        ? 'notification_education'
        : screenState === 'registration-pending'
          ? 'notification_registration'
          : 'notification_permission';
    const key = `${beforeAuth}:${promptContext}:${screenState}`;
    if (journeyViewsRef.current.has(key)) return;
    journeyViewsRef.current.add(key);
    trackNotificationJourney(
      stage,
      'viewed',
      screenState === 'granted'
        ? 'granted'
        : screenState === 'permission-off'
          ? 'denied'
          : screenState === 'registration-pending'
            ? 'pending'
            : 'not_applicable'
    );
  }, [beforeAuth, promptContext, screenState, trackNotificationJourney]);

  useEffect(() => {
    if (previousUserIdRef.current !== userId) {
      settingsReturnPendingRef.current = false;
      journeyViewsRef.current.clear();
      lastTrackedPermissionRef.current = null;
      previousUserIdRef.current = userId;
      setBusy(false);
      setNotice(null);
      setScreenState('checking');
    }
    latestUserIdRef.current = userId;
  }, [userId]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const isCurrentUser = useCallback(
    (capturedUserId: string | null) =>
      mountedRef.current && latestUserIdRef.current === capturedUserId,
    []
  );

  const recordPermissionResult = useCallback(
    (granted: boolean, source: 'education' | 'system_settings') => {
      const resultKey = `${source}:${granted}`;
      if (lastTrackedPermissionRef.current === resultKey) return;
      lastTrackedPermissionRef.current = resultKey;
      trackProductEvent('Notification Permission Updated', {
        permission_granted: granted,
        source,
      });
      void retentionNotificationClient.syncAudienceTags({
        notification_permission: granted ? 'granted' : 'denied',
      });
      void retentionNotificationClient.syncInAppState({
        notification_permission_status: granted ? 'granted' : 'denied',
      });
    },
    []
  );

  const registerDevice = useCallback(
    async (capturedUserId: string) => {
      if (registrationInFlightForUserRef.current === capturedUserId) return;
      registrationInFlightForUserRef.current = capturedUserId;
      trackNotificationJourney(
        'notification_registration',
        'requested',
        'pending'
      );

      try {
        const registered =
          await notificationService.syncPushRegistrationForUser(capturedUserId);
        if (!isCurrentUser(capturedUserId)) return;

        setScreenState(registered ? 'granted' : 'registration-pending');
        trackNotificationJourney(
          'notification_registration',
          'completed',
          registered ? 'succeeded' : 'pending'
        );
      } catch {
        if (!isCurrentUser(capturedUserId)) return;
        setScreenState('registration-pending');
        trackNotificationJourney(
          'notification_registration',
          'completed',
          'failed'
        );
        setNotice({
          title: t('notifications.notice.setup_failed.title'),
          description: t('notifications.notice.setup_failed.body'),
          tone: 'error',
        });
      } finally {
        if (registrationInFlightForUserRef.current === capturedUserId) {
          registrationInFlightForUserRef.current = null;
        }
        if (isCurrentUser(capturedUserId)) setBusy(false);
      }
    },
    [isCurrentUser, t, trackNotificationJourney]
  );

  useEffect(() => {
    const capturedUserId = userId;
    if (!capturedUserId) return () => undefined;

    void retentionNotificationClient.syncInAppState({
      app_surface: promptContext === 'settings' ? 'settings' : 'onboarding',
      has_active_promise: promptContext === 'first_promise',
      notification_prompt_context: promptContext,
    });

    const unsubscribe = retentionNotificationClient.subscribePermissionChanges(
      granted => {
        if (!isCurrentUser(capturedUserId)) return;
        recordPermissionResult(granted, 'education');
        if (!granted) {
          setBusy(false);
          setScreenState('permission-off');
          return;
        }
        setBusy(true);
        setScreenState('registration-pending');
        void registerDevice(capturedUserId);
      }
    );

    return () => {
      unsubscribe();
      void retentionNotificationClient.clearInAppState([
        'app_surface',
        'notification_permission_status',
        'notification_prompt_context',
      ]);
    };
  }, [
    isCurrentUser,
    promptContext,
    recordPermissionResult,
    registerDevice,
    userId,
  ]);

  useEffect(() => {
    const capturedUserId = userId;
    if (!capturedUserId && !beforeAuth) {
      setScreenState('education');
      return () => undefined;
    }
    let active = true;

    void Notifications.getPermissionsAsync()
      .then(({ status }) => {
        if (!active || !isCurrentUser(capturedUserId)) return;
        if (status === 'granted') {
          if (beforeAuth) {
            setScreenState('granted');
            setBusy(false);
            return;
          }
          setBusy(true);
          setScreenState('registration-pending');
          if (capturedUserId) void registerDevice(capturedUserId);
          return;
        }
        if (status === 'denied') {
          setScreenState('permission-off');
          return;
        }
        setScreenState('education');
      })
      .catch(() => {
        if (active && isCurrentUser(capturedUserId)) {
          // The explicit action remains the only place that can ask the phone.
          setScreenState('education');
        }
      });

    return () => {
      active = false;
    };
  }, [
    beforeAuth,
    isCurrentUser,
    recordPermissionResult,
    registerDevice,
    userId,
  ]);

  const recheckPermissionAfterSystemSettings = useCallback(async () => {
    const capturedUserId = latestUserIdRef.current;
    if ((!capturedUserId && !beforeAuth) || !mountedRef.current) return;

    setBusy(true);
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (!isCurrentUser(capturedUserId)) return;

      if (status !== 'granted') {
        trackNotificationJourney(
          'notification_permission',
          'returned',
          'denied',
          'open_settings'
        );
        recordPermissionResult(false, 'system_settings');
        setScreenState('permission-off');
        setNotice({
          title: t('notifications.notice.still_off.title'),
          description: t('notifications.notice.still_off.body'),
          tone: 'info',
        });
        setBusy(false);
        return;
      }

      setScreenState('registration-pending');
      trackNotificationJourney(
        'notification_permission',
        'returned',
        'granted',
        'open_settings'
      );
      recordPermissionResult(true, 'system_settings');
      setNotice({
        title: t('notifications.notice.allowed.title'),
        description: t('notifications.notice.allowed.body'),
        tone: 'info',
      });
      if (beforeAuth) {
        setScreenState('granted');
        setBusy(false);
        return;
      }
      if (capturedUserId) await registerDevice(capturedUserId);
    } catch {
      if (!isCurrentUser(capturedUserId)) return;
      setScreenState('permission-off');
      trackNotificationJourney(
        'notification_permission',
        'returned',
        'failed',
        'open_settings'
      );
      setNotice({
        title: t('notifications.notice.check_failed.title'),
        description: t('notifications.notice.continue_later.body'),
        tone: 'error',
      });
      setBusy(false);
    }
  }, [
    beforeAuth,
    isCurrentUser,
    recordPermissionResult,
    registerDevice,
    t,
    trackNotificationJourney,
  ]);

  useEffect(() => {
    let previousAppState = AppState.currentState;
    const subscription = AppState.addEventListener('change', nextAppState => {
      const returnedFromSettings =
        previousAppState !== 'active' && nextAppState === 'active';
      previousAppState = nextAppState;
      if (!returnedFromSettings || !settingsReturnPendingRef.current) return;

      settingsReturnPendingRef.current = false;
      void recheckPermissionAfterSystemSettings();
    });

    return () => subscription.remove();
  }, [recheckPermissionAfterSystemSettings]);

  const performPermissionRequest = useCallback(async () => {
    const capturedUserId = userId;
    if (!capturedUserId && !beforeAuth) {
      setNotice({
        title: t('notifications.notice.sign_in.title'),
        description: t('notifications.notice.sign_in.body'),
        tone: 'warning',
      });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      // Prefer the configured OneSignal SDK so the app-owned fallback and the
      // dashboard Push Permission Prompt share one permission/subscription
      // owner. Older or deliberately inert builds fall back to Expo.
      const oneSignalPermission = capturedUserId
        ? await retentionNotificationClient.requestPushPermission(true)
        : null;
      const permissionGranted =
        oneSignalPermission ?? (await notificationService.requestPermissions());
      if (!isCurrentUser(capturedUserId)) return;

      recordPermissionResult(permissionGranted, 'education');
      trackNotificationJourney(
        'notification_permission',
        'completed',
        permissionGranted ? 'granted' : 'denied',
        'allow_notifications'
      );

      if (!permissionGranted) {
        setScreenState('permission-off');
        setBusy(false);
        return;
      }

      if (beforeAuth) {
        setScreenState('granted');
        setBusy(false);
        return;
      }

      setScreenState('registration-pending');
      if (capturedUserId) await registerDevice(capturedUserId);
    } catch {
      if (!isCurrentUser(capturedUserId)) return;
      setBusy(false);
      trackNotificationJourney(
        'notification_permission',
        'completed',
        'failed',
        'allow_notifications'
      );
      setNotice({
        title: t('notifications.notice.prompt_failed.title'),
        description: t('notifications.notice.continue_later.body'),
        tone: 'error',
      });
      setScreenState('permission-off');
    }
  }, [
    beforeAuth,
    isCurrentUser,
    recordPermissionResult,
    registerDevice,
    t,
    trackNotificationJourney,
    userId,
  ]);

  const requestNotificationPermission = () => {
    if (busy) return;
    trackNotificationJourney(
      'notification_permission',
      'requested',
      'not_applicable',
      'allow_notifications'
    );
    void performPermissionRequest();
  };

  const retryRegistration = async () => {
    if (!userId || busy) return;
    const capturedUserId = userId;
    trackNotificationJourney('notification_registration', 'retried', 'pending');
    setBusy(true);
    setNotice(null);
    await registerDevice(capturedUserId);
  };

  const openNotificationSettings = async () => {
    if (busy) return;
    setBusy(true);
    trackNotificationJourney(
      'notification_permission',
      'opened',
      'not_applicable',
      'open_settings'
    );
    settingsReturnPendingRef.current = true;
    setNotice({
      title: t('notifications.notice.settings_opening.title'),
      description: t('notifications.notice.settings_opening.body'),
      tone: 'info',
    });
    try {
      await Linking.openSettings();
    } catch {
      settingsReturnPendingRef.current = false;
      if (!mountedRef.current) return;
      trackNotificationJourney(
        'notification_permission',
        'completed',
        'failed',
        'open_settings'
      );
      setNotice({
        title: t('notifications.notice.settings_failed.title'),
        description: t('notifications.notice.settings_failed.body'),
        tone: 'error',
      });
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const completeNotificationJourney = () => {
    if (screenState === 'education') {
      trackNotificationJourney(
        'notification_education',
        'skipped',
        'not_applicable',
        'keep_notifications_off'
      );
    } else if (screenState === 'permission-off') {
      trackNotificationJourney(
        'notification_permission',
        'skipped',
        'denied',
        'keep_notifications_off'
      );
    } else if (screenState === 'registration-pending') {
      trackNotificationJourney(
        'notification_registration',
        'skipped',
        'pending',
        'keep_notifications_off'
      );
    } else {
      trackNotificationJourney(
        'notification_permission',
        'continued',
        'granted'
      );
    }
    onComplete();
  };

  const backFromNotificationJourney = () => {
    trackNotificationJourney(
      screenState === 'education'
        ? 'notification_education'
        : 'notification_permission',
      'back'
    );
    onBack();
  };

  const content = (() => {
    if (screenState === 'checking') {
      return (
        <View
          accessibilityLabel={t('notifications.status.checking')}
          accessibilityRole="progressbar"
          style={styles.permissionChecking}
          testID="notification-privacy-permission-checking"
        >
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.round}
            height={32}
            width={32}
          />
          <Text style={styles.permissionCheckingText}>
            {t('notifications.status.checking')}
          </Text>
        </View>
      );
    }

    if (beforeAuth) {
      const preAuthState =
        screenState === 'registration-pending' ? 'education' : screenState;
      return (
        <PreAuthPermissionContent
          description={
            preAuthState === 'permission-off'
              ? t('notifications.onboarding.permission_off.body')
              : preAuthState === 'granted'
                ? t('notifications.onboarding.granted.body')
                : t('notifications.onboarding.body')
          }
          onComplete={completeNotificationJourney}
          onRequest={requestNotificationPermission}
          onSettings={() => void openNotificationSettings()}
          permissionHint={t('notifications.permission_prompt.hint')}
          state={preAuthState}
          title={
            preAuthState === 'permission-off'
              ? t('notifications.onboarding.permission_off.title')
              : preAuthState === 'granted'
                ? t('notifications.onboarding.granted.title')
                : t('notifications.onboarding.title')
          }
          turnOnLabel={t('notifications.onboarding.action.turn_on')}
          notNowLabel={t('notifications.onboarding.action.not_now')}
          continueLabel={t('notifications.onboarding.permission_off.action')}
          settingsLabel={t('notifications.onboarding.permission_off.settings')}
          grantedContinueLabel={t('notifications.onboarding.granted.action')}
          busy={busy}
        />
      );
    }

    switch (screenState) {
      case 'education': {
        const roleCopy = promiseInviteRole
          ? accountabilityInviteRoleCopy(promiseInviteRole, t)
          : null;
        const inviteCopy = promiseInviteRole
          ? promiseInviteRole === 'reviewer'
            ? {
                title: t('notifications.education.review.title'),
                body: roleCopy?.description ?? '',
                previewTitle: t('notifications.education.review.title'),
                previewBody: t('notifications.education.review.body'),
              }
            : promiseInviteRole === 'supporter'
              ? {
                  title: roleCopy?.title ?? '',
                  body: roleCopy?.description ?? '',
                  previewTitle: roleCopy?.title ?? '',
                  previewBody: roleCopy?.description ?? '',
                }
              : {
                  title: t('notifications.education.title'),
                  body: roleCopy?.description ?? '',
                  previewTitle: t('notifications.education.proof_due.title'),
                  previewBody: t('notifications.education.proof_due.body'),
                }
          : null;
        return (
          <>
            {promptContext === 'promise_invite' && promiseInviteRole ? (
              <PromiseInviteRoleHero
                compact
                role={promiseInviteRole}
                showCopy={false}
                title={inviteCopy?.title ?? ''}
                detail={inviteCopy?.body ?? ''}
                testID="notification-promise-invite-context"
              />
            ) : promptContext === 'first_promise' ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.orientationMascot}
              >
                <MentaMascot
                  size="md"
                  state="promise-guide"
                  testID="notification-privacy-education-mascot"
                />
              </View>
            ) : null}
            <Heading
              title={inviteCopy?.title ?? t('notifications.education.title')}
              description={
                inviteCopy?.body ?? t('notifications.education.body')
              }
            />
            <View style={styles.previewStack}>
              <ReminderPreview
                kind={promiseInviteRole === 'reviewer' ? 'review' : 'due'}
                subtitle={
                  inviteCopy?.previewBody ??
                  t('notifications.education.proof_due.body')
                }
                title={
                  inviteCopy?.previewTitle ??
                  t('notifications.education.proof_due.title')
                }
              />
              {!inviteCopy ? (
                <ReminderPreview
                  kind="review"
                  subtitle={t('notifications.education.review.body')}
                  title={t('notifications.education.review.title')}
                />
              ) : null}
            </View>
            <ActionStack>
              <AppButton
                accessibilityHint={t('notifications.permission_prompt.hint')}
                fullWidth
                loading={busy}
                size="large"
                testID="notification-privacy-education-continue"
                title={t('notifications.action.turn_on')}
                variant="accent"
                onPress={() => void requestNotificationPermission()}
              />
              <AppButton
                fullWidth
                size="large"
                testID="notification-privacy-education-not-now"
                title={t('notifications.action.continue_without')}
                variant="ghost"
                onPress={completeNotificationJourney}
              />
            </ActionStack>
          </>
        );
      }
      case 'permission-off':
        return (
          <>
            <Heading
              title={t('notifications.permission_off.title')}
              description={t('notifications.permission_off.body')}
            />
            <AppInlineNotice
              description={t('notifications.permission_off.later.body')}
              title={t('notifications.permission_off.later.title')}
              tone="info"
              testID="notification-privacy-permission-off"
            />
            <ActionStack>
              <AppButton
                fullWidth
                size="large"
                testID="notification-privacy-permission-off-continue"
                title={t('notifications.action.continue_without')}
                variant="accent"
                onPress={completeNotificationJourney}
              />
              <AppButton
                fullWidth
                size="large"
                testID="notification-privacy-permission-off-settings"
                title={t('notifications.action.open_settings')}
                variant="secondary"
                onPress={() => void openNotificationSettings()}
              />
            </ActionStack>
          </>
        );
      case 'registration-pending':
        return (
          <>
            <Heading
              title={t('notifications.registration_pending.title')}
              description={t('notifications.registration_pending.body')}
            />
            <ReminderReadiness
              connected={false}
              connecting={busy}
              phoneDetail={t('notifications.phone.allowed')}
              phoneLabel={t('notifications.phone.title')}
              phoneValue={t('notifications.status.on')}
              reminderDetail={t('notifications.menta.not_connected')}
              reminderLabel={t('notifications.menta.title')}
              reminderValue={
                busy
                  ? t('notifications.status.checking')
                  : t('notifications.status.not_ready')
              }
            />
            <ActionStack>
              <AppButton
                disabled={busy}
                fullWidth
                loading={busy}
                size="large"
                testID="notification-privacy-registration-retry"
                title={t('notifications.action.retry')}
                variant="accent"
                onPress={() => void retryRegistration()}
              />
              <AppButton
                disabled={busy}
                fullWidth
                size="large"
                testID="notification-privacy-registration-continue"
                title={t('notifications.action.continue_without')}
                variant="ghost"
                onPress={completeNotificationJourney}
              />
            </ActionStack>
          </>
        );
      case 'granted':
        return (
          <>
            <Heading
              title={t('notifications.granted.title')}
              description={t('notifications.granted.body')}
            />
            <ReminderReadiness
              connected
              phoneDetail={t('notifications.phone.allowed_by_phone')}
              phoneLabel={t('notifications.phone.title')}
              phoneValue={t('notifications.status.on')}
              reminderDetail={t('notifications.menta.connected')}
              reminderLabel={t('notifications.menta.title')}
              reminderValue={t('notifications.status.ready')}
            />
            <ActionStack>
              <AppButton
                fullWidth
                size="large"
                testID="notification-privacy-granted-promise"
                title={
                  completionLabel ?? t('notifications.action.back_to_settings')
                }
                variant={completionLabel ? 'accent' : 'primary'}
                onPress={completeNotificationJourney}
              />
              <AppButton
                fullWidth
                size="large"
                testID="notification-privacy-granted-settings"
                title={t('notifications.action.open_settings')}
                variant="secondary"
                onPress={() => void openNotificationSettings()}
              />
            </ActionStack>
          </>
        );
    }
  })();

  return (
    <AppScreen
      lane="focused"
      safeArea
      scrollable
      hasTabBar={false}
      padding
      contentContainerStyle={beforeAuth ? styles.preAuthLane : styles.lane}
      testID="notification-privacy-screen"
    >
      <View style={beforeAuth ? styles.preAuthFrame : undefined}>
        {beforeAuth ? (
          <View style={styles.preAuthTopRail}>
            <Pressable
              accessibilityLabel={t('notifications.topbar.back')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={backFromNotificationJourney}
              style={styles.preAuthBack}
            >
              <Text style={styles.preAuthBackText}>‹</Text>
            </Pressable>
            <View style={styles.preAuthProgressTrack}>
              <View style={styles.preAuthProgressFill} />
            </View>
            <View style={styles.preAuthRailSpacer} />
          </View>
        ) : (
          <AppTopBar
            backLabel={t('notifications.topbar.back')}
            subtitle={t('notifications.topbar.context')}
            title={t('notifications.topbar.title')}
            titleIsHeading={false}
            onBack={backFromNotificationJourney}
          />
        )}
        <View
          style={beforeAuth ? styles.preAuthContent : styles.content}
          testID="notification-privacy-content"
        >
          {notice ? (
            <AppInlineNotice
              description={notice.description}
              testID="notification-privacy-status-notice"
              title={notice.title}
              tone={notice.tone}
            />
          ) : null}
          {content}
        </View>
      </View>
    </AppScreen>
  );
};

type PreAuthPermissionState = 'education' | 'granted' | 'permission-off';

type PreAuthPermissionContentProps = {
  busy: boolean;
  continueLabel: string;
  description: string;
  grantedContinueLabel: string;
  notNowLabel: string;
  onComplete: () => void;
  onRequest: () => void;
  onSettings: () => void;
  permissionHint: string;
  settingsLabel: string;
  state: PreAuthPermissionState;
  title: string;
  turnOnLabel: string;
};

const PreAuthPermissionContent = ({
  busy,
  continueLabel,
  description,
  grantedContinueLabel,
  notNowLabel,
  onComplete,
  onRequest,
  onSettings,
  permissionHint,
  settingsLabel,
  state,
  title,
  turnOnLabel,
}: PreAuthPermissionContentProps) => (
  <View style={styles.preAuthFlow} testID="notification-permission-before-auth">
    <NotificationPermissionHero state={state} />
    <View style={styles.preAuthCopy}>
      <Text accessibilityRole="header" style={styles.preAuthTitle}>
        {title}
      </Text>
      <Text style={styles.preAuthBody}>{description}</Text>
    </View>
    <View style={styles.preAuthActions}>
      <ActionStack>
        {state === 'education' ? (
          <>
            <AppButton
              accessibilityHint={permissionHint}
              fullWidth
              loading={busy}
              size="large"
              testID="notification-privacy-education-continue"
              title={turnOnLabel}
              variant="accent"
              onPress={onRequest}
            />
            <AppButton
              disabled={busy}
              fullWidth
              size="large"
              testID="notification-privacy-education-not-now"
              title={notNowLabel}
              variant="ghost"
              onPress={onComplete}
            />
          </>
        ) : null}
        {state === 'permission-off' ? (
          <>
            <AppButton
              fullWidth
              size="large"
              testID="notification-privacy-permission-off-settings"
              title={settingsLabel}
              variant="secondary"
              onPress={onSettings}
            />
            <AppButton
              fullWidth
              size="large"
              testID="notification-privacy-permission-off-continue"
              title={continueLabel}
              variant="accent"
              onPress={onComplete}
            />
          </>
        ) : null}
        {state === 'granted' ? (
          <AppButton
            fullWidth
            size="large"
            testID="notification-privacy-granted-promise"
            title={grantedContinueLabel}
            variant="accent"
            onPress={onComplete}
          />
        ) : null}
      </ActionStack>
    </View>
  </View>
);

const NotificationPermissionHero = ({
  state,
}: {
  state: PreAuthPermissionState;
}) => {
  const { height, width } = useWindowDimensions();
  const muted = state === 'permission-off';
  const compact = width <= 340 || height <= 760;

  return (
    <View
      style={[styles.permissionHero, compact && styles.permissionHeroCompact]}
      testID="notification-permission-hero"
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.permissionMascotStage,
          muted && styles.permissionMascotStageMuted,
        ]}
      >
        <MentaMascot
          size="hero"
          state="notification-hero"
          style={{
            height: compact ? 218 : 282,
            width: compact ? 218 : 282,
          }}
          testID={
            state === 'granted'
              ? 'notification-permission-mascot-ready'
              : 'notification-permission-mascot-guide'
          }
        />
      </View>
    </View>
  );
};

const ReminderPreview = ({
  kind,
  subtitle,
  title,
}: {
  kind: 'due' | 'review';
  subtitle: string;
  title: string;
}) => {
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${subtitle}`}
      style={styles.reminderPreview}
      testID={`notification-preview-${kind}`}
    >
      <View style={styles.previewMeta}>
        <View style={styles.previewAppIcon}>
          {kind === 'due' ? (
            <BellIcon color={mentaColors.actionOnPaper} size={16} />
          ) : (
            <ShieldCheckIcon color={mentaColors.actionOnPaper} size={16} />
          )}
        </View>
        <Text style={styles.previewAppName}>{t('brand.name')}</Text>
      </View>
      <Text style={styles.previewTitle}>{title}</Text>
      <Text style={styles.previewBody}>{subtitle}</Text>
    </View>
  );
};

const ReminderReadiness = ({
  connected,
  connecting = false,
  phoneDetail,
  phoneLabel,
  phoneValue,
  reminderDetail,
  reminderLabel,
  reminderValue,
}: {
  connected: boolean;
  connecting?: boolean;
  phoneDetail: string;
  phoneLabel: string;
  phoneValue: string;
  reminderDetail: string;
  reminderLabel: string;
  reminderValue: string;
}) => (
  <View
    accessible
    accessibilityLabel={`${phoneLabel}. ${phoneDetail}. ${phoneValue}. ${reminderLabel}. ${reminderDetail}. ${reminderValue}.`}
    accessibilityRole={connected ? 'summary' : 'progressbar'}
    style={styles.readiness}
    testID={
      connected
        ? 'notification-privacy-ready-receipt'
        : 'notification-privacy-pending-receipt'
    }
  >
    <View style={styles.readinessMark}>
      {connected ? (
        <CheckIcon color={mentaColors.success} size={26} />
      ) : (
        <BellIcon color={mentaColors.action} size={24} />
      )}
    </View>
    <View style={styles.readinessFacts}>
      <ReadinessFact
        detail={phoneDetail}
        label={phoneLabel}
        value={phoneValue}
      />
      <View style={styles.readinessDivider} />
      <ReadinessFact
        detail={reminderDetail}
        label={reminderLabel}
        muted={!connected}
        value={reminderValue}
      />
    </View>
    {connecting ? <View style={styles.connectingRule} /> : null}
  </View>
);

const ReadinessFact = ({
  detail,
  label,
  muted = false,
  value,
}: {
  detail: string;
  label: string;
  muted?: boolean;
  value: string;
}) => (
  <View style={styles.readinessFact}>
    <View style={styles.readinessFactCopy}>
      <Text style={styles.readinessLabel}>{label}</Text>
      <Text style={styles.readinessDetail}>{detail}</Text>
    </View>
    <Text style={[styles.readinessValue, muted ? styles.mutedValue : null]}>
      {value}
    </Text>
  </View>
);

const Heading = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <View style={styles.heading}>
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
    <Text style={styles.body}>{description}</Text>
  </View>
);

const ActionStack = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.actions}>{children}</View>
);

const styles = StyleSheet.create({
  preAuthLane: {
    alignSelf: 'center',
    flexGrow: 1,
    paddingBottom: mentaSpacing[6],
    paddingTop: mentaSpacing[2],
    width: '100%',
  },
  preAuthFrame: {
    flexGrow: 1,
    width: '100%',
  },
  preAuthTopRail: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: mentaLayout.minimumTouchTarget,
    width: '100%',
  },
  preAuthBack: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: mentaLayout.minimumTouchTarget,
  },
  preAuthBackText: {
    color: mentaColors.text.primary,
    fontSize: 30,
    lineHeight: 34,
  },
  preAuthProgressTrack: {
    backgroundColor: mentaColors.border,
    borderRadius: 2,
    height: 3,
    overflow: 'hidden',
    width: 102,
  },
  preAuthProgressFill: {
    backgroundColor: mentaColors.action,
    borderRadius: 2,
    height: 3,
    width: '82%',
  },
  preAuthRailSpacer: {
    minWidth: mentaLayout.minimumTouchTarget,
  },
  preAuthContent: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[8],
    paddingTop: mentaSpacing[5],
  },
  preAuthFlow: {
    flexGrow: 1,
    gap: mentaSpacing[6],
  },
  permissionHero: {
    alignItems: 'center',
    height: 300,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  permissionHeroCompact: { height: 226 },
  permissionMascotStage: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  permissionMascotStageMuted: {
    opacity: 0.48,
  },
  preAuthCopy: {
    gap: mentaSpacing[3],
  },
  preAuthTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
    fontFamily: mentaFonts.inter.bold,
  },
  preAuthBody: {
    color: mentaColors.text.secondary,
    ...mentaTypography.lead,
  },
  preAuthTrust: {
    color: mentaColors.text.muted,
    ...mentaTypography.caption,
  },
  preAuthActions: {
    marginTop: 'auto',
  },
  lane: {
    alignSelf: 'center',
    flexGrow: 1,
    paddingBottom: 0,
    paddingTop: mentaSpacing[2],
    width: '100%',
  },
  content: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[10],
    paddingTop: mentaSpacing[8],
  },
  orientationMascot: {
    alignItems: 'center',
    height: 88,
    justifyContent: 'center',
  },
  heading: {
    gap: mentaSpacing[3],
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
  },
  body: {
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    ...mentaTypography.body,
  },
  previewStack: {
    gap: mentaSpacing[3],
  },
  reminderPreview: {
    backgroundColor: '#F3F1EB',
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[4],
  },
  previewMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    marginBottom: mentaSpacing[3],
  },
  previewAppIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(103, 66, 168, 0.11)',
    borderRadius: mentaRadii.small,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  previewAppName: {
    ...mentaTypography.label,
    color: mentaColors.text.mutedOnPaper,
  },
  previewTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.onPaper,
  },
  previewBody: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
    marginTop: mentaSpacing[1],
  },
  readiness: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: mentaSpacing[4],
  },
  readinessMark: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: mentaColors.actionSoft,
    borderRadius: mentaRadii.round,
    height: 48,
    justifyContent: 'center',
    marginBottom: mentaSpacing[4],
    width: 48,
  },
  readinessFacts: {
    gap: mentaSpacing[3],
  },
  readinessDivider: {
    backgroundColor: mentaColors.border,
    height: StyleSheet.hairlineWidth,
  },
  readinessFact: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
  },
  readinessFactCopy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  readinessLabel: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  readinessDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  readinessValue: {
    ...mentaTypography.label,
    color: mentaColors.success,
    paddingTop: 2,
  },
  mutedValue: {
    color: mentaColors.text.secondary,
  },
  connectingRule: {
    alignSelf: 'center',
    backgroundColor: mentaColors.action,
    borderRadius: mentaRadii.round,
    height: 2,
    marginTop: mentaSpacing[4],
    opacity: 0.7,
    width: 72,
  },
  actions: {
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
  },
  permissionChecking: {
    alignItems: 'center',
    flexGrow: 1,
    gap: mentaSpacing[3],
    justifyContent: 'center',
    minHeight: 320,
  },
  permissionCheckingText: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmallMedium,
  },
});
