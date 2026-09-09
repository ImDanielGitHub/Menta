import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AppInlineNotice } from '@/components/ui';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppFields';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  HelpCircleIcon,
  BellIcon,
  GlobeIcon,
  InfoIcon,
  LogOutIcon,
  RefreshCwIcon,
  ShieldIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
} from '@/components/ui/icons';
import { useTheme, useThemedStyles } from '@/constants/ThemeContext';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  AccountDeletionNotCompletedError,
  deleteMentaAccount,
} from '@/lib/account-deletion';
import {
  saveAccountDeletionReceipt,
  type AccountDeletionReceipt,
} from '@/lib/account-deletion-receipt';
import {
  canOpenAccountDeletionConfirmation,
  readAccountDeletionPreflight,
  type AccountDeletionPreflight,
} from '@/lib/account-deletion-preflight';
import { getMyProfile } from '@/lib/profile-api';
import { openPaywall } from '@/lib/paywall/manager';
import {
  getAdvancedDiagnosticsEnabled,
  setAdvancedDiagnosticsEnabled,
} from '@/lib/advanced-diagnostics-preference';
import {
  isSentryReplayReleaseEnabled,
  setAdvancedDiagnosticsCollectionEnabled,
} from '@/lib/sentry';
import { trackProductOperation } from '@/lib/posthog';
import {
  ACCOUNT_DELETE_CONFIRM_WORD,
  ACCOUNT_DELETE_DESCRIPTION,
  ACCOUNT_DELETION_RECEIPT_COPY,
  ACCOUNT_DELETE_TITLE,
} from '@/lib/account-control-copy';
import { useAuthStore } from '@/store/auth-store';
import { useNetworkState } from '@/lib/network';
import {
  APP_COMMUNITY_STANDARDS_URL,
  APP_PRIVACY_URL,
  APP_SUPPORT_URL,
  APP_TERMS_URL,
} from '@/constants/LegalLinks';
import {
  SettingsDirectRow,
  SettingsSectionLabel,
} from '@/components/settings/SettingsDirectRow';
import {
  SettingsSignOutSheet,
  type SignOutSheetState,
} from '@/components/settings/SettingsSignOutSheet';
import { useOperationalFlag } from '@/hooks/useOperationalFlag';
import { notificationService } from '@/lib/services/notification-service';
import {
  getAdsPrivacyOptionsRequirement,
  showAdsPrivacyOptions,
  type AdsPrivacyOptionsRequirement,
} from '@/lib/ads';
import { openStoreWriteReview } from '@/lib/store-review';
import { getLanguageOption, useTranslation } from '@/lib/localization';
import {
  downloadAvailableOtaUpdate,
  restartIntoDownloadedOta,
} from '@/lib/ota-updates';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';

import { backOrReplace } from '@/lib/navigation/safe-back';

type SettingsNotice = {
  tone: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
} | null;

type SettingsAccountState =
  | 'loading'
  | 'ready'
  | 'cached-offline'
  | 'partial-error'
  | 'profile-missing'
  | 'session-unavailable';

type DeletionSheetState =
  | 'preflight'
  | 'confirm'
  | 'deleting'
  | 'failed'
  | 'unknown'
  | 'confirmed';

export default function SettingsScreen() {
  const replayReleaseEnabled = isSentryReplayReleaseEnabled();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const pathname = usePathname();
  const isTabDestination = pathname === '/settings-tab';
  const { clearAuthData, isAuthenticated, logout, user } = useAuthStore();
  const network = useNetworkState();
  const { enabled: adsEnabled } = useOperationalFlag('ads_enabled');
  const { enabled: safeMode } = useOperationalFlag('safe_mode');
  const { locale, t } = useTranslation();

  const [isDeleting, setIsDeleting] = useState(false);
  const [signOutSheetVisible, setSignOutSheetVisible] = useState(false);
  const [signOutStatus, setSignOutStatus] =
    useState<SignOutSheetState>('confirm');
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [deleteStatus, setDeleteStatus] =
    useState<DeletionSheetState>('confirm');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletionPreflight, setDeletionPreflight] =
    useState<AccountDeletionPreflight | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<SettingsNotice>(null);
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const [otaUpdateReady, setOtaUpdateReady] = useState(false);
  const [restartingForUpdate, setRestartingForUpdate] = useState(false);
  const [accountState, setAccountState] =
    useState<SettingsAccountState>('loading');
  const [adPrivacyOptionsRequirement, setAdPrivacyOptionsRequirement] =
    useState<AdsPrivacyOptionsRequirement>('unavailable');
  const [adPrivacyOptionsBusy, setAdPrivacyOptionsBusy] = useState(false);
  const [advancedDiagnosticsEnabled, setAdvancedDiagnosticsEnabledState] =
    useState(false);
  const [advancedDiagnosticsLoading, setAdvancedDiagnosticsLoading] =
    useState(true);
  const [advancedDiagnosticsAvailable, setAdvancedDiagnosticsAvailable] =
    useState(true);
  const [advancedDiagnosticsSaving, setAdvancedDiagnosticsSaving] =
    useState(false);
  const [advancedDiagnosticsSheetVisible, setAdvancedDiagnosticsSheetVisible] =
    useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const accountRequestRef = useRef(0);
  const deletionPreflightRequestRef = useRef(0);
  const deletionAttemptRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  currentUserIdRef.current = user?.id ?? null;

  useEffect(() => {
    deletionPreflightRequestRef.current += 1;
    deletionAttemptRef.current += 1;
    setIsDeleting(false);
    setDeleteSheetVisible(false);
    setDeleteStatus('confirm');
    setDeleteConfirmation('');
    setDeletionPreflight(null);
  }, [user?.id]);

  const refreshAccountState = useCallback(async () => {
    const requestId = ++accountRequestRef.current;
    const accountId = user?.id ?? null;
    const isCurrentAccountRequest = () =>
      requestId === accountRequestRef.current &&
      currentUserIdRef.current === accountId;

    if (!accountId || isAuthenticated === false) {
      if (isCurrentAccountRequest()) {
        setAccountState('session-unavailable');
      }
      return;
    }

    if (!network.isOnline) {
      if (isCurrentAccountRequest()) {
        setAccountState('cached-offline');
      }
      return;
    }

    setAccountState('loading');

    try {
      const profile = await getMyProfile();
      if (!isCurrentAccountRequest()) return;

      if (!profile || profile.id !== accountId) {
        setHasProAccess(false);
        setAccountState('profile-missing');
        return;
      }

      setHasProAccess(profile.is_pro === true);
      setAccountState('ready');
    } catch {
      if (!isCurrentAccountRequest()) return;
      setAccountState(network.isOnline ? 'partial-error' : 'cached-offline');
    }
  }, [isAuthenticated, network.isOnline, user?.id]);

  useEffect(() => {
    void refreshAccountState();
    return () => {
      accountRequestRef.current += 1;
    };
  }, [refreshAccountState]);

  useEffect(() => {
    if (!adsEnabled || safeMode || accountState !== 'ready') {
      setAdPrivacyOptionsRequirement('unavailable');
      return;
    }

    let active = true;
    void getAdsPrivacyOptionsRequirement().then(requirement => {
      if (active) {
        setAdPrivacyOptionsRequirement(requirement);
      }
    });

    return () => {
      active = false;
    };
  }, [accountState, adsEnabled, safeMode]);

  const loadAdvancedDiagnosticsPreference = useCallback(async () => {
    setAdvancedDiagnosticsLoading(true);
    try {
      const enabled = await getAdvancedDiagnosticsEnabled();
      setAdvancedDiagnosticsEnabledState(enabled);
      setAdvancedDiagnosticsAvailable(true);
    } catch {
      setAdvancedDiagnosticsEnabledState(false);
      setAdvancedDiagnosticsAvailable(false);
    } finally {
      setAdvancedDiagnosticsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdvancedDiagnosticsPreference();
  }, [loadAdvancedDiagnosticsPreference]);

  const saveAdvancedDiagnosticsPreference = useCallback(
    async (enabled: boolean) => {
      if (advancedDiagnosticsSaving) return;

      setAdvancedDiagnosticsSaving(true);
      setSettingsNotice(null);
      trackProductOperation({
        area: 'settings',
        authority: 'client',
        operation: 'change_setting',
        outcome: 'started',
        phase: 'intent',
        source: 'settings',
      });
      try {
        await setAdvancedDiagnosticsEnabled(enabled);
        setAdvancedDiagnosticsCollectionEnabled(enabled);
        trackProductOperation({
          area: 'settings',
          authority: 'client',
          operation: 'change_setting',
          outcome: 'confirmed',
          phase: 'authority',
          source: 'settings',
        });
        setAdvancedDiagnosticsEnabledState(enabled);
        setAdvancedDiagnosticsAvailable(true);
        setAdvancedDiagnosticsSheetVisible(false);
        setSettingsNotice({
          tone: 'success',
          title: enabled
            ? t('fullAuth.settings.advanced_diagnostics_are_on')
            : t('fullAuth.settings.advanced_diagnostics_are_off'),
          description: enabled
            ? replayReleaseEnabled
              ? t(
                  'fullAuth.settings.extra_performance_measurements_start_now_masked_'
                )
              : t('fullAuth.settings.extra_performance_measurements_start_now')
            : replayReleaseEnabled
              ? t(
                  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina'
                )
              : t('fullAuth.settings.ordinary_crash_reports_stay_on'),
        });
      } catch {
        trackProductOperation({
          area: 'settings',
          authority: 'client',
          operation: 'change_setting',
          outcome: 'failed',
          phase: 'authority',
          source: 'settings',
        });
        setAdvancedDiagnosticsAvailable(false);
        setSettingsNotice({
          tone: 'error',
          title: t('fullAuth.settings.your_choice_was_not_saved'),
          description: t(
            'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co'
          ),
        });
      } finally {
        setAdvancedDiagnosticsSaving(false);
      }
    },
    [advancedDiagnosticsSaving, replayReleaseEnabled]
  );

  const openAdPrivacyOptions = useCallback(async () => {
    if (adPrivacyOptionsBusy) {
      return;
    }

    setAdPrivacyOptionsBusy(true);
    setSettingsNotice(null);
    try {
      const result = await showAdsPrivacyOptions();
      if (result.shown) {
        setAdPrivacyOptionsRequirement(
          result.privacyOptionsRequired ? 'required' : 'not_required'
        );
        return;
      }

      if (result.reason === 'not_required') {
        setAdPrivacyOptionsRequirement('not_required');
        return;
      }

      setSettingsNotice({
        tone: 'warning',
        title: t('fullAuth.settings.ad_privacy_choices_did_not_open'),
        description: t(
          'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un'
        ),
      });
    } catch {
      setSettingsNotice({
        tone: 'warning',
        title: t('fullAuth.settings.ad_privacy_choices_did_not_open'),
        description: t(
          'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un'
        ),
      });
    } finally {
      setAdPrivacyOptionsBusy(false);
    }
  }, [adPrivacyOptionsBusy]);

  const recoverAccountRoute = useCallback(() => {
    if (
      accountState === 'profile-missing' ||
      accountState === 'session-unavailable'
    ) {
      clearAuthData();
    }
    router.replace('/login');
  }, [accountState, clearAuthData, router]);

  const openAccountRoute = useCallback(
    (path: '/(tabs)/profile' | '/notification-settings') => {
      if (
        accountState === 'profile-missing' ||
        accountState === 'session-unavailable'
      ) {
        recoverAccountRoute();
        return;
      }

      router.push(path);
    },
    [accountState, recoverAccountRoute, router]
  );

  const openPro = useCallback(() => {
    openPaywall({
      context: 'general',
      initialView: hasProAccess ? 'active' : 'plans',
    });
  }, [hasProAccess]);

  const checkForUpdates = useCallback(async () => {
    if (checkingForUpdate || restartingForUpdate) return;

    if (otaUpdateReady) {
      setRestartingForUpdate(true);
      setSettingsNotice({
        tone: 'info',
        title: t('fullAuth.settings.restarting_menta'),
        description: t(
          'fullAuth.settings.the_downloaded_update_will_open_automatically'
        ),
      });
      try {
        await restartIntoDownloadedOta();
      } catch {
        setRestartingForUpdate(false);
        setSettingsNotice({
          tone: 'error',
          title: t('fullAuth.settings.menta_could_not_restart'),
          description: t(
            'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u'
          ),
        });
      }
      return;
    }

    setCheckingForUpdate(true);
    setSettingsNotice({
      tone: 'info',
      title: t('fullAuth.settings.checking_for_updates'),
      description: t(
        'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda'
      ),
    });
    try {
      const result = await downloadAvailableOtaUpdate();
      if (result === 'ready') {
        setOtaUpdateReady(true);
        setSettingsNotice({
          tone: 'success',
          title: t('fullAuth.settings.menta_update_ready'),
          description: t(
            'fullAuth.settings.press_restart_to_apply_the_downloaded_update'
          ),
        });
      } else if (result === 'current') {
        setSettingsNotice({
          tone: 'success',
          title: t('fullAuth.settings.menta_is_up_to_date'),
          description: t(
            'fullAuth.settings.this_device_has_the_latest_compatible_update'
          ),
        });
      } else {
        setSettingsNotice({
          tone: 'info',
          title: t('fullAuth.settings.update_checks_are_unavailable'),
          description: t(
            'fullAuth.settings.menta_will_continue_using_its_current_safe_versi'
          ),
        });
      }
    } catch {
      setSettingsNotice({
        tone: 'error',
        title: t('fullAuth.settings.menta_could_not_check_for_updates'),
        description: t('fullAuth.settings.check_your_connection_and_try_again'),
      });
    } finally {
      setCheckingForUpdate(false);
    }
  }, [checkingForUpdate, otaUpdateReady, restartingForUpdate]);

  const openExternalLink = useCallback(
    async (url: string, label: string) => {
      setSettingsNotice(null);
      try {
        await Linking.openURL(url);
      } catch {
        setSettingsNotice({
          tone: 'error',
          title: t('fullAuth.settings.label_did_not_open', { label: label }),
          description: t(
            'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_'
          ),
        });
      }
    },
    [t]
  );

  const startDeletionPreflight = useCallback(async () => {
    const accountId = user?.id ?? null;
    const requestId = ++deletionPreflightRequestRef.current;
    const isCurrentPreflightRequest = () =>
      requestId === deletionPreflightRequestRef.current &&
      currentUserIdRef.current === accountId;

    setDeleteStatus('preflight');
    setDeleteConfirmation('');
    setDeletionPreflight(null);
    setSettingsNotice(null);
    setDeleteSheetVisible(true);

    if (!accountId) {
      if (isCurrentPreflightRequest()) {
        setDeletionPreflight({
          canProceed: false,
          reason: 'session-unavailable',
          status: 'unknown',
        });
      }
      return;
    }

    const result = await readAccountDeletionPreflight({
      expectedUserId: accountId,
      isOnline: network.isOnline,
    });
    if (isCurrentPreflightRequest()) {
      setDeletionPreflight(result);
    }
  }, [network.isOnline, user?.id]);

  const confirmDeleteAccount = useCallback(async () => {
    if (isDeleting) {
      return;
    }

    trackProductOperation({
      area: 'account_deletion',
      authority: 'client',
      operation: 'delete_account',
      outcome: 'started',
      phase: 'intent',
      source: 'settings',
    });

    if (!user?.id) {
      trackProductOperation({
        area: 'account_deletion',
        authority: 'client',
        operation: 'delete_account',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'settings',
      });
      setSettingsNotice({
        tone: 'error',
        title: t('fullAuth.settings.sign_in_again'),
        description: t(
          'fullAuth.settings.sign_in_again_before_deleting_your_account'
        ),
      });
      setDeleteSheetVisible(false);
      return;
    }

    if (accountState === 'loading') {
      trackProductOperation({
        area: 'account_deletion',
        authority: 'server',
        operation: 'delete_account',
        outcome: 'pending',
        phase: 'eligibility',
        source: 'settings',
      });
      setSettingsNotice({
        tone: 'info',
        title: t('fullAuth.settings.checking_your_account'),
        description: t(
          'fullAuth.settings.delete_account_will_be_available_when_this_check'
        ),
      });
      return;
    }

    if (accountState === 'partial-error') {
      trackProductOperation({
        area: 'account_deletion',
        authority: 'server',
        operation: 'delete_account',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: 'settings',
      });
      setDeleteStatus('failed');
      setSettingsNotice({
        tone: 'warning',
        title: t('fullAuth.settings.could_not_check_your_account'),
        description: t(
          'fullAuth.settings.try_the_account_check_again_before_you_delete_an'
        ),
      });
      return;
    }

    if (accountState === 'profile-missing') {
      trackProductOperation({
        area: 'account_deletion',
        authority: 'server',
        operation: 'delete_account',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'settings',
      });
      setDeleteSheetVisible(false);
      recoverAccountRoute();
      return;
    }

    if (accountState === 'session-unavailable') {
      trackProductOperation({
        area: 'account_deletion',
        authority: 'server',
        operation: 'delete_account',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'settings',
      });
      setDeleteSheetVisible(false);
      recoverAccountRoute();
      return;
    }

    if (!network.isOnline) {
      setDeletionPreflight({
        canProceed: false,
        reason: 'offline',
        status: 'unknown',
      });
      trackProductOperation({
        area: 'account_deletion',
        authority: 'client',
        operation: 'delete_account',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'settings',
      });
      setDeleteConfirmation('');
      setDeleteStatus('preflight');
      return;
    }

    if (!canOpenAccountDeletionConfirmation(deletionPreflight)) {
      setDeleteConfirmation('');
      setDeleteStatus('preflight');
      return;
    }

    const accountId = user.id;
    const attemptId = ++deletionAttemptRef.current;
    const isCurrentDeletionAttempt = () =>
      deletionAttemptRef.current === attemptId &&
      currentUserIdRef.current === accountId;

    setIsDeleting(true);
    setSettingsNotice(null);

    // Typed confirmation can remain open for an arbitrary time. Re-read the
    // account, ownership and entitlement state immediately before the only
    // destructive request so a newly shared group or unresolved entitlement
    // cannot pass on an older preview.
    const latestPreflight = await readAccountDeletionPreflight({
      expectedUserId: accountId,
      isOnline: network.isOnline,
    });
    if (!isCurrentDeletionAttempt()) return;
    setDeletionPreflight(latestPreflight);
    if (!canOpenAccountDeletionConfirmation(latestPreflight)) {
      setIsDeleting(false);
      setDeleteConfirmation('');
      setDeleteStatus('preflight');
      return;
    }

    setDeleteStatus('deleting');
    void emitHaptic({ type: 'destructive-commit' });
    let receipt: AccountDeletionReceipt;
    try {
      receipt = await deleteMentaAccount(accountId);
    } catch (error) {
      if (!isCurrentDeletionAttempt()) {
        return;
      }

      if (error instanceof AccountDeletionNotCompletedError) {
        trackProductOperation({
          area: 'account_deletion',
          authority: 'server',
          operation: 'delete_account',
          outcome: 'failed',
          phase: 'authority',
          source: 'settings',
        });
        notificationService.startUserScopedWork(accountId);
        setDeleteStatus('failed');
        void emitHaptic({ type: 'failed', operation: 'delete' });
      } else {
        trackProductOperation({
          area: 'account_deletion',
          authority: 'server',
          operation: 'delete_account',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'settings',
        });
        setDeleteStatus('unknown');
        void emitHaptic({ type: 'unknown' });
      }
      setIsDeleting(false);
      return;
    }

    if (!isCurrentDeletionAttempt()) {
      return;
    }

    void emitConfirmedOutcome(
      'account-deleted',
      createConfirmedReceipt('account-deletion', accountId)
    );
    trackProductOperation({
      area: 'account_deletion',
      authority: 'server',
      operation: 'delete_account',
      outcome: 'confirmed',
      phase: 'authority',
      source: 'settings',
    });

    try {
      await saveAccountDeletionReceipt(receipt);
    } catch {
      // Deletion is already confirmed. Continue local auth teardown even when
      // this device cannot persist the public, identifier-free receipt. The
      // receipt route will refuse to claim success without stored evidence.
    }

    if (!isCurrentDeletionAttempt()) {
      return;
    }

    // Open the public receipt before auth teardown. The startup gate keeps
    // this route available after the confirmed account is signed out.
    router.replace('/account-deleted');

    try {
      await logout();
    } catch {
      if (currentUserIdRef.current === accountId) {
        clearAuthData();
      }
    } finally {
      if (isCurrentDeletionAttempt()) {
        setIsDeleting(false);
      }
    }
  }, [
    accountState,
    clearAuthData,
    isDeleting,
    logout,
    network.isOnline,
    recoverAccountRoute,
    router,
    deletionPreflight,
    user?.id,
  ]);

  const confirmSignOut = useCallback(async () => {
    if (signOutStatus === 'signing-out') return;

    setSignOutStatus('signing-out');
    setSettingsNotice(null);
    try {
      await logout();
      setSignOutSheetVisible(false);
      router.replace('/login');
    } catch {
      setSignOutStatus('failed');
      setSettingsNotice({
        tone: 'error',
        title: t('fullAuth.settings.you_are_still_signed_in'),
        description: t(
          'fullAuth.settings.menta_could_not_end_this_session_your_account_an'
        ),
      });
    }
  }, [logout, router, signOutStatus]);

  const openSignOutSheet = useCallback(() => {
    setSignOutStatus('confirm');
    setSettingsNotice(null);
    setSignOutSheetVisible(true);
  }, []);

  const canSignOut = Boolean(user?.id && isAuthenticated);
  const signOutRow = canSignOut ? (
    <SettingsDirectRow
      icon={<LogOutIcon size={18} color={theme.colors.text.secondary} />}
      onPress={openSignOutSheet}
      subtitle={t(
        'fullAuth.settings.leave_this_device_your_menta_account_stays_activ'
      )}
      testID="settings-sign-out"
      title={t('fullAuth.settings.sign_out')}
    />
  ) : null;

  const currentLanguage = getLanguageOption(locale);
  const languageRow = (
    <SettingsDirectRow
      icon={<GlobeIcon size={18} color={theme.colors.text.secondary} />}
      onPress={() => router.push('/language-settings')}
      showDivider={false}
      subtitle={t('settings.language.row.subtitle')}
      testID="settings-app-language"
      title={t('settings.language.row.title')}
      value={`${currentLanguage.flag} ${currentLanguage.shortName}`}
    />
  );

  const signOutSheet = (
    <SettingsSignOutSheet
      onConfirm={() => void confirmSignOut()}
      onRequestClose={() => {
        if (signOutStatus !== 'signing-out') {
          setSignOutSheetVisible(false);
        }
      }}
      status={signOutStatus}
      visible={signOutSheetVisible}
    />
  );

  if (accountState === 'loading') {
    return (
      <View style={styles.route}>
        <SettingsLoadingSkeleton
          isTabDestination={isTabDestination}
          onSignOut={canSignOut ? openSignOutSheet : undefined}
        />
        {signOutSheet}
      </View>
    );
  }

  const settingsFooter =
    accountState === 'cached-offline' ? (
      <>
        <AppButton
          accessibilityHint={t(
            'fullAuth.settings.checks_the_current_connection_and_known_account_'
          )}
          onPress={() => void refreshAccountState()}
          size="large"
          testID="settings-try-connection-again"
          title={t('fullAuth.settings.try_connection_again')}
        />
        {!isTabDestination ? (
          <AppButton
            onPress={() => router.replace('/(tabs)/profile')}
            size="large"
            title={t('fullAuth.settings.back_to_you')}
            variant="ghost"
          />
        ) : null}
      </>
    ) : accountState === 'partial-error' ? (
      <AppButton
        accessibilityHint={t(
          'fullAuth.settings.tries_to_load_the_signed_in_profile_again'
        )}
        onPress={() => void refreshAccountState()}
        size="large"
        testID="settings-retry-profile"
        title={t('fullAuth.settings.try_loading_profile_again')}
      />
    ) : null;

  return (
    <View style={styles.route}>
      <AppScreen
        lane="working"
        hasTabBar={isTabDestination}
        padding={false}
        scrollable
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: phoneLayout.screenInset },
        ]}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          {!isTabDestination ? (
            <AppTopBar
              backLabel={t('fullAuth.shared.back_to_you')}
              onBack={() => backOrReplace(router, '/(tabs)/profile')}
            />
          ) : null}
          <Text accessibilityRole="header" style={styles.settingsTitle}>
            {t('fullAuth.settings.settings')}
          </Text>
        </View>

        {accountState === 'cached-offline' ? (
          <>
            <SettingsSectionLabel>
              {t('fullAuth.settings.offline')}
            </SettingsSectionLabel>
            <Text style={styles.stateTitle}>
              {t('fullAuth.settings.your_saved_settings_are_still_here')}
            </Text>
            <Text style={styles.stateBody}>
              {t('fullAuth.settings.some_destinations_need_a_connection')}
            </Text>
            {signOutRow}
            <SettingsSectionLabel>
              {t('settings.language.section')}
            </SettingsSectionLabel>
            {languageRow}
            <SettingsDirectRow
              disabled
              icon={<BellIcon size={18} color={theme.colors.text.secondary} />}
              subtitle={t('fullAuth.settings.connect_to_check_this_phone')}
              title={t('fullAuth.settings.notifications')}
              value={t('fullAuth.residual.settings.offline_value')}
            />
            <SettingsDirectRow
              disabled
              icon={
                <ShieldIcon size={18} color={theme.colors.text.secondary} />
              }
              showDivider={false}
              subtitle={t('fullAuth.settings.open_when_connected')}
              title={t('fullAuth.settings.privacy_and_legal')}
              value={t('fullAuth.residual.settings.offline_value')}
            />
          </>
        ) : accountState === 'partial-error' ? (
          <>
            <SettingsSectionLabel>
              {t('fullAuth.settings.needs_attention')}
            </SettingsSectionLabel>
            <Text style={styles.stateTitle}>
              {t('fullAuth.settings.could_not_load_your_profile')}
            </Text>
            <Text style={styles.stateBody}>
              {t(
                'fullAuth.settings.other_settings_are_still_available_try_loading_t'
              )}
            </Text>
            {signOutRow}
            <SettingsDirectRow
              icon={<UserIcon size={18} color={theme.colors.status.error} />}
              onPress={() => void refreshAccountState()}
              subtitle={t(
                'fullAuth.settings.try_loading_your_name_and_profile_photo_again'
              )}
              title={t('fullAuth.settings.profile_details')}
              value={t('fullAuth.residual.settings.retry_value')}
            />
            <SettingsDirectRow
              icon={
                <ShieldIcon size={18} color={theme.colors.text.secondary} />
              }
              onPress={() =>
                void openExternalLink(
                  APP_PRIVACY_URL,
                  t('fullAuth.settings.privacy_policy')
                )
              }
              subtitle={t('fullAuth.settings.how_menta_handles_your_data')}
              title={t('fullAuth.settings.privacy_policy')}
            />
            <SettingsDirectRow
              icon={
                <HelpCircleIcon size={18} color={theme.colors.text.secondary} />
              }
              onPress={() => router.push('/support')}
              subtitle={t(
                'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep'
              )}
              title={t('fullAuth.settings.feedback_and_support')}
            />

            <SettingsDirectRow
              icon={<BellIcon size={18} color={theme.colors.text.secondary} />}
              onPress={() => router.push('/notification-settings')}
              showDivider={false}
              subtitle={t(
                'fullAuth.settings.proof_reminders_reviews_and_group_updates'
              )}
              title={t('fullAuth.settings.notifications')}
            />
            <SettingsSectionLabel>
              {t('settings.language.section')}
            </SettingsSectionLabel>
            {languageRow}
          </>
        ) : accountState === 'profile-missing' ||
          accountState === 'session-unavailable' ? (
          <>
            <SettingsSectionLabel>
              {t('fullAuth.settings.sign_in_needed')}
            </SettingsSectionLabel>
            <Text style={styles.stateTitle}>
              {t('fullAuth.settings.sign_in_again_to_see_settings')}
            </Text>
            <Text style={styles.stateBody}>
              {t(
                'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un'
              )}
            </Text>
            {signOutRow}
            <AppButton
              accessibilityHint={t(
                'fullAuth.settings.opens_sign_in_for_this_account'
              )}
              onPress={recoverAccountRoute}
              size="large"
              testID="settings-sign-in-again"
              title={t('fullAuth.settings.sign_in_again')}
            />
            <SettingsSectionLabel>
              {t('settings.language.section')}
            </SettingsSectionLabel>
            {languageRow}
          </>
        ) : (
          <>
            <SettingsSectionLabel>
              {t('fullAuth.settings.preferences')}
            </SettingsSectionLabel>
            <SettingsDirectRow
              icon={<BellIcon size={18} color={theme.colors.text.secondary} />}
              onPress={() => openAccountRoute('/notification-settings')}
              showDivider={false}
              subtitle={t(
                'fullAuth.settings.proof_reminders_reviews_and_group_updates'
              )}
              title={t('fullAuth.settings.notifications')}
            />

            <SettingsSectionLabel>
              {t('fullAuth.settings.membership')}
            </SettingsSectionLabel>
            <SettingsDirectRow
              icon={<InfoIcon size={18} color={theme.colors.text.secondary} />}
              accessibilityHint={t(
                'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a'
              )}
              onPress={openPro}
              subtitle={
                hasProAccess
                  ? t(
                      'fullAuth.settings.active_view_or_manage_your_subscription'
                    )
                  : t('fullAuth.settings.plans_benefits_and_restore_purchases')
              }
              testID="settings-open-pro"
              title={t('fullAuth.settings.menta_pro')}
            />
            <SettingsDirectRow
              busy={checkingForUpdate || restartingForUpdate}
              disabled={checkingForUpdate || restartingForUpdate}
              icon={
                <RefreshCwIcon size={18} color={theme.colors.text.secondary} />
              }
              onPress={() => void checkForUpdates()}
              showDivider={false}
              subtitle={
                otaUpdateReady
                  ? t(
                      'fullAuth.settings.a_compatible_update_is_downloaded_and_ready'
                    )
                  : t(
                      'fullAuth.settings.download_the_latest_compatible_menta_update'
                    )
              }
              testID="settings-check-for-updates"
              title={t('fullAuth.settings.check_for_updates')}
              value={
                restartingForUpdate
                  ? t('fullAuth.residual.settings.restart_loading')
                  : checkingForUpdate
                    ? t('fullAuth.residual.settings.checking_loading')
                    : otaUpdateReady
                      ? t('fullAuth.residual.settings.restart_value')
                      : t('fullAuth.residual.settings.check_value')
              }
            />

            <SettingsSectionLabel>
              {t('settings.language.section')}
            </SettingsSectionLabel>
            {languageRow}

            <SettingsSectionLabel>
              {t('fullAuth.settings.privacy_and_legal')}
            </SettingsSectionLabel>
            {advancedDiagnosticsEnabled ? (
              <SettingsDirectRow
                disabled={advancedDiagnosticsLoading}
                icon={
                  <InfoIcon size={18} color={theme.colors.text.secondary} />
                }
                onPress={() => {
                  if (!advancedDiagnosticsAvailable) {
                    void loadAdvancedDiagnosticsPreference();
                    return;
                  }
                  setAdvancedDiagnosticsSheetVisible(true);
                }}
                subtitle={
                  replayReleaseEnabled
                    ? t(
                        'fullAuth.settings.optional_performance_measurements_and_masked_dia'
                      )
                    : t('fullAuth.settings.optional_performance_measurements')
                }
                testID="settings-advanced-diagnostics"
                title={t('fullAuth.settings.advanced_diagnostics')}
                value={t('fullAuth.residual.settings.on_value')}
              />
            ) : null}
            <SettingsDirectRow
              icon={
                <ShieldIcon size={18} color={theme.colors.text.secondary} />
              }
              onPress={() =>
                void openExternalLink(
                  APP_PRIVACY_URL,
                  t('fullAuth.settings.privacy_policy')
                )
              }
              subtitle={t('fullAuth.settings.how_menta_handles_your_data')}
              title={t('fullAuth.settings.privacy_policy')}
            />
            <SettingsDirectRow
              icon={
                <ShieldIcon size={18} color={theme.colors.text.secondary} />
              }
              onPress={() =>
                router.push({
                  pathname: '/legal-acceptance',
                  params: { next: '/settings', surface: 'settings' },
                } as never)
              }
              subtitle={t(
                'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t'
              )}
              testID="settings-legal-acceptance"
              title={t('fullAuth.settings.terms_you_accepted')}
            />
            {adPrivacyOptionsRequirement === 'required' ? (
              <SettingsDirectRow
                busy={adPrivacyOptionsBusy}
                disabled={adPrivacyOptionsBusy}
                icon={
                  <ShieldIcon size={18} color={theme.colors.text.secondary} />
                }
                onPress={() => void openAdPrivacyOptions()}
                subtitle={t(
                  'fullAuth.settings.review_choices_used_for_sponsor_videos'
                )}
                testID="settings-ad-privacy-options"
                title={t('fullAuth.settings.ad_privacy_choices')}
                value={
                  adPrivacyOptionsBusy
                    ? t('fullAuth.residual.settings.opening_value')
                    : undefined
                }
              />
            ) : null}
            <SettingsDirectRow
              icon={<InfoIcon size={18} color={theme.colors.text.secondary} />}
              onPress={() =>
                void openExternalLink(
                  APP_COMMUNITY_STANDARDS_URL,
                  t('fullAuth.settings.community_standards')
                )
              }
              subtitle={t(
                'fullAuth.settings.rules_for_promises_proof_and_groups'
              )}
              title={t('fullAuth.settings.community_standards')}
            />
            <SettingsDirectRow
              icon={<InfoIcon size={18} color={theme.colors.text.secondary} />}
              onPress={() =>
                void openExternalLink(
                  APP_TERMS_URL,
                  t('fullAuth.settings.terms_of_use')
                )
              }
              showDivider={false}
              subtitle={t('fullAuth.settings.read_menta_s_terms')}
              title={t('fullAuth.settings.terms_of_use')}
            />

            <SettingsSectionLabel>
              {t('fullAuth.settings.help_and_feedback')}
            </SettingsSectionLabel>
            <SettingsDirectRow
              icon={
                <HelpCircleIcon size={18} color={theme.colors.text.secondary} />
              }
              onPress={() => router.push('/support')}
              subtitle={t(
                'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep'
              )}
              title={t('fullAuth.settings.feedback_and_support')}
            />

            <SettingsDirectRow
              icon={<StarIcon size={18} color={theme.colors.text.secondary} />}
              onPress={() => {
                void openStoreWriteReview();
              }}
              showDivider={false}
              subtitle={t(
                'fullAuth.settings.share_your_experience_and_help_others_discover_m'
              )}
              testID="settings-write-review"
              title={t('fullAuth.settings.leave_a_review')}
            />

            <SettingsSectionLabel>
              {t('fullAuth.settings.account_control')}
            </SettingsSectionLabel>
            {signOutRow}
            <SettingsDirectRow
              destructive
              icon={<Trash2Icon size={18} color={theme.colors.status.error} />}
              onPress={() => void startDeletionPreflight()}
              showDivider={false}
              subtitle={t(
                'fullAuth.settings.permanently_delete_your_account_and_menta_data'
              )}
              testID="settings-delete-account"
              title={t('fullAuth.settings.delete_account')}
            />
          </>
        )}

        {settingsNotice ? (
          <AppInlineNotice
            title={settingsNotice.title}
            description={settingsNotice.description}
            tone={settingsNotice.tone}
            style={styles.notice}
            testID="settings-notice"
          />
        ) : null}
      </AppScreen>
      {settingsFooter ? (
        <View
          style={[
            styles.fixedFooter,
            {
              paddingBottom: insets.bottom + mentaSpacing[3],
              paddingHorizontal: phoneLayout.screenInset,
            },
          ]}
        >
          <View style={styles.fixedFooterLane}>{settingsFooter}</View>
        </View>
      ) : null}

      {signOutSheet}

      <SettingsSheet
        onRequestClose={() => {
          if (!advancedDiagnosticsSaving) {
            setAdvancedDiagnosticsSheetVisible(false);
          }
        }}
        testID="settings-advanced-diagnostics-sheet"
        visible={advancedDiagnosticsSheetVisible}
      >
        <View style={styles.sheetState}>
          <View style={styles.sheetIntro}>
            <Text style={styles.sheetTitle}>
              {advancedDiagnosticsEnabled
                ? t('fullAuth.residual.settings.advanced_title')
                : t('fullAuth.residual.settings.advanced_prompt')}
            </Text>
            <Text style={styles.sheetBody}>
              {advancedDiagnosticsEnabled
                ? replayReleaseEnabled
                  ? t(
                      'fullAuth.settings.optional_performance_measurements_and_masked_dia'
                    )
                  : t('fullAuth.settings.optional_performance_measurements')
                : replayReleaseEnabled
                  ? t('fullAuth.residual.settings.advanced_full_body')
                  : t('fullAuth.residual.settings.advanced_basic_body')}
            </Text>
          </View>
          <AppInlineNotice
            tone="warning"
            title={t('fullAuth.settings.small_performance_impact')}
            description={
              replayReleaseEnabled
                ? t(
                    'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_'
                  )
                : t(
                    'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext'
                  )
            }
          />
          <Text style={styles.sheetBody}>
            {t(
              'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia'
            )}
          </Text>
          <View style={styles.sheetActions}>
            <AppButton
              disabled={advancedDiagnosticsSaving}
              fullWidth
              loading={advancedDiagnosticsSaving}
              onPress={() =>
                void saveAdvancedDiagnosticsPreference(
                  !advancedDiagnosticsEnabled
                )
              }
              testID="settings-advanced-diagnostics-confirm"
              title={
                advancedDiagnosticsEnabled
                  ? t('fullAuth.settings.turn_off_advanced_diagnostics')
                  : t('fullAuth.settings.turn_on_advanced_diagnostics')
              }
              variant={advancedDiagnosticsEnabled ? 'outline' : 'accent'}
            />
            <AppButton
              disabled={advancedDiagnosticsSaving}
              fullWidth
              onPress={() => setAdvancedDiagnosticsSheetVisible(false)}
              testID="settings-advanced-diagnostics-cancel"
              title={t('fullAuth.settings.keep_current_setting')}
              variant="ghost"
            />
          </View>
        </View>
      </SettingsSheet>

      <SettingsSheet
        visible={deleteSheetVisible}
        onRequestClose={() => {
          if (!isDeleting && deleteStatus !== 'confirmed') {
            setDeleteSheetVisible(false);
          }
        }}
        testID="settings-delete-account-sheet"
      >
        {deleteStatus === 'preflight' ? (
          <View style={styles.sheetState}>
            {deletionPreflight === null ? (
              <View
                accessibilityLiveRegion="polite"
                accessibilityRole="progressbar"
                style={styles.sheetIntro}
                testID="settings-delete-preflight-loading"
              >
                <Text style={styles.sheetTitle}>
                  {t('fullAuth.settings.checking_your_account')}
                </Text>
                <Text style={styles.sheetBody}>
                  {t('fullAuth.settings.deletion_checking_body')}
                </Text>
              </View>
            ) : deletionPreflight.status === 'unknown' ? (
              <>
                <View accessibilityRole="alert" style={styles.sheetIntro}>
                  <Text style={styles.sheetTitle}>
                    {t('fullAuth.settings.could_not_check_your_account')}
                  </Text>
                  <Text style={styles.sheetBody}>
                    {deletionPreflight.reason === 'offline'
                      ? t('fullAuth.settings.deletion_check_offline_body')
                      : t('fullAuth.settings.deletion_check_unknown_body')}
                  </Text>
                </View>
                <View style={styles.sheetActions}>
                  <AppButton
                    fullWidth
                    onPress={() => void startDeletionPreflight()}
                    testID="settings-delete-preflight-retry"
                    title={t('fullAuth.shared.try_again')}
                  />
                  <AppButton
                    fullWidth
                    onPress={() => setDeleteSheetVisible(false)}
                    testID="settings-delete-preflight-cancel"
                    title={t('fullAuth.settings.keep_my_account')}
                    variant="ghost"
                  />
                </View>
              </>
            ) : deletionPreflight.ownership.status === 'blocked' ? (
              <>
                <View accessibilityRole="alert" style={styles.sheetIntro}>
                  <Text style={styles.sheetTitle}>
                    {t('fullAuth.settings.delete_shared_groups_first')}
                  </Text>
                  <Text style={styles.sheetBody}>
                    {t('fullAuth.settings.delete_shared_groups_first_body')}
                  </Text>
                </View>
                <View
                  style={styles.preflightChecks}
                  testID="settings-delete-preflight-blocked"
                >
                  {deletionPreflight.ownership.blockingGroups.map(group => (
                    <SettingsDirectRow
                      icon={
                        <UserIcon
                          color={mentaColors.text.secondary}
                          size={18}
                        />
                      }
                      key={group.id}
                      onPress={() => {
                        setDeleteSheetVisible(false);
                        router.push({
                          pathname: '/groups/[id]',
                          params: { id: group.id },
                        });
                      }}
                      subtitle={
                        group.otherMemberCount === 1
                          ? t(
                              'fullAuth.settings.delete_owned_group_member_one',
                              { count: group.otherMemberCount }
                            )
                          : t(
                              'fullAuth.settings.delete_owned_group_members_many',
                              { count: group.otherMemberCount }
                            )
                      }
                      testID={`settings-delete-owned-group-${group.id}`}
                      title={group.name}
                    />
                  ))}
                  <SettingsDirectRow
                    icon={
                      <InfoIcon color={mentaColors.text.secondary} size={18} />
                    }
                    onPress={
                      deletionPreflight.subscription.status === 'active'
                        ? () => {
                            setDeleteSheetVisible(false);
                            openPaywall({
                              context: 'general',
                              initialView: 'active',
                            });
                          }
                        : undefined
                    }
                    showDivider={false}
                    showChevron={
                      deletionPreflight.subscription.status === 'active'
                    }
                    subtitle={
                      deletionPreflight.subscription.status === 'active'
                        ? t(
                            'fullAuth.settings.deletion_subscription_active_notice'
                          )
                        : t('fullAuth.settings.deletion_subscription_inactive')
                    }
                    testID="settings-delete-subscription-status"
                    title={t('fullAuth.settings.menta_pro_subscription')}
                  />
                </View>
                <View style={styles.sheetActions}>
                  <AppButton
                    fullWidth
                    onPress={() => void startDeletionPreflight()}
                    testID="settings-delete-preflight-retry"
                    title={t('fullAuth.shared.try_again')}
                    variant="secondary"
                  />
                  <AppButton
                    fullWidth
                    onPress={() => setDeleteSheetVisible(false)}
                    testID="settings-delete-preflight-cancel"
                    title={t('fullAuth.settings.keep_my_account')}
                    variant="ghost"
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.sheetIntro}>
                  <Text style={styles.sheetTitle}>{ACCOUNT_DELETE_TITLE}</Text>
                  <Text style={styles.sheetBody}>
                    {ACCOUNT_DELETE_DESCRIPTION}
                  </Text>
                </View>
                <View
                  style={styles.preflightChecks}
                  testID="settings-delete-preflight-resolved"
                >
                  {deletionPreflight.ownership.groups.length === 0 ? (
                    <SettingsDirectRow
                      icon={
                        <UserIcon
                          color={mentaColors.text.secondary}
                          size={18}
                        />
                      }
                      showChevron={false}
                      subtitle={t('fullAuth.settings.deletion_group_clear')}
                      title={t('groups.admin.ownership')}
                    />
                  ) : (
                    deletionPreflight.ownership.groups.map(group => (
                      <SettingsDirectRow
                        icon={
                          <UserIcon
                            color={mentaColors.text.secondary}
                            size={18}
                          />
                        }
                        key={group.id}
                        showChevron={false}
                        subtitle={t(
                          'fullAuth.settings.deletion_group_will_be_deleted'
                        )}
                        title={group.name}
                      />
                    ))
                  )}
                  <SettingsDirectRow
                    icon={
                      <InfoIcon color={mentaColors.text.secondary} size={18} />
                    }
                    onPress={
                      deletionPreflight.subscription.status === 'active'
                        ? () => {
                            setDeleteSheetVisible(false);
                            openPaywall({
                              context: 'general',
                              initialView: 'active',
                            });
                          }
                        : undefined
                    }
                    showDivider={false}
                    showChevron={
                      deletionPreflight.subscription.status === 'active'
                    }
                    subtitle={
                      deletionPreflight.subscription.status === 'active'
                        ? t(
                            'fullAuth.settings.deletion_subscription_active_notice'
                          )
                        : t('fullAuth.settings.deletion_subscription_inactive')
                    }
                    testID="settings-delete-subscription-status"
                    title={t('fullAuth.settings.menta_pro_subscription')}
                  />
                </View>
                <View style={styles.sheetActions}>
                  <AppButton
                    fullWidth
                    onPress={() => setDeleteStatus('confirm')}
                    testID="settings-delete-preflight-continue"
                    title={t('fullAuth.settings.review_deletion_confirmation')}
                  />
                  <AppButton
                    fullWidth
                    onPress={() => setDeleteSheetVisible(false)}
                    testID="settings-delete-preflight-cancel"
                    title={t('fullAuth.settings.keep_my_account')}
                    variant="ghost"
                  />
                </View>
              </>
            )}
          </View>
        ) : deleteStatus === 'confirmed' ? (
          <View accessibilityRole="alert" style={styles.sheetState}>
            <View style={styles.sheetIntro}>
              <Text style={styles.sheetTitle}>
                {t('fullAuth.settings.your_account_was_deleted')}
              </Text>
              <Text style={styles.sheetBody}>
                {ACCOUNT_DELETION_RECEIPT_COPY}
              </Text>
            </View>
            <View style={styles.sheetActions}>
              <AppButton
                title={t('fullAuth.settings.continue_to_sign_in')}
                onPress={() => router.replace('/login')}
                testID="settings-delete-account-receipt"
              />
            </View>
          </View>
        ) : deleteStatus === 'deleting' ? (
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
            style={styles.sheetState}
          >
            <View style={styles.sheetIntro}>
              <Text style={styles.sheetTitle}>
                {t('fullAuth.account_deleted.checking_account_deletion')}
              </Text>
              <Text style={styles.sheetBody}>
                {t(
                  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the'
                )}
              </Text>
            </View>
            <View style={styles.sheetActions}>
              <AppButton
                disabled
                fullWidth
                loading
                onPress={() => undefined}
                testID="settings-delete-account-sheet-confirm"
                title={t('fullAuth.settings.delete_account')}
                variant="destructive"
              />
            </View>
          </View>
        ) : deleteStatus === 'unknown' ? (
          <View accessibilityRole="alert" style={styles.sheetState}>
            <View style={styles.sheetIntro}>
              <Text style={styles.sheetTitle}>
                {t('fullAuth.settings.deletion_result_unknown')}
              </Text>
              <Text style={styles.sheetBody}>
                {t(
                  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo'
                )}
              </Text>
            </View>
            <View style={styles.sheetActions}>
              <AppButton
                title={t('fullAuth.settings.contact_support')}
                variant="secondary"
                fullWidth
                onPress={() =>
                  void openExternalLink(
                    APP_SUPPORT_URL,
                    t('fullAuth.support.support')
                  )
                }
              />
              <AppButton
                title={t('shared.action.close')}
                variant="ghost"
                onPress={() => setDeleteSheetVisible(false)}
                fullWidth
                testID="settings-delete-account-sheet-cancel"
              />
            </View>
          </View>
        ) : (
          <View style={styles.sheetState}>
            <View style={styles.sheetIntro}>
              <Text style={styles.sheetTitle}>
                {deleteStatus === 'failed'
                  ? t('fullAuth.settings.account_was_not_deleted')
                  : t(
                      'fullAuth.settings.type_delete_to_confirm_account_deletion'
                    )}
              </Text>
              <Text style={styles.sheetBody}>
                {deleteStatus === 'failed'
                  ? t(
                      'fullAuth.settings.menta_could_not_delete_the_account_check_your_co'
                    )
                  : t(
                      'fullAuth.settings.your_account_stays_open_until_menta_confirms_the'
                    )}
              </Text>
            </View>
            <AppTextField
              label={t('fullAuth.settings.confirmation')}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
              accessibilityLabel={t(
                'fullAuth.settings.type_delete_to_confirm_account_deletion'
              )}
              testID="settings-delete-confirmation-input"
            />
            <View style={styles.sheetActions}>
              <AppButton
                title={t('fullAuth.settings.delete_account')}
                onPress={() => void confirmDeleteAccount()}
                variant="destructive"
                fullWidth
                loading={isDeleting}
                disabled={
                  isDeleting ||
                  !canOpenAccountDeletionConfirmation(deletionPreflight) ||
                  deleteConfirmation.trim() !== ACCOUNT_DELETE_CONFIRM_WORD
                }
                testID="settings-delete-account-sheet-confirm"
              />
              <AppButton
                title={t('fullAuth.settings.keep_my_account')}
                variant="ghost"
                onPress={() => setDeleteSheetVisible(false)}
                fullWidth
                testID="settings-delete-account-sheet-cancel"
              />
            </View>
          </View>
        )}
      </SettingsSheet>
    </View>
  );
}

const createStyles = (_theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    route: {
      backgroundColor: mentaColors.canvas,
      flex: 1,
    },
    screen: {
      flex: 1,
    },
    content: {
      paddingHorizontal: mentaSpacing[6],
      paddingBottom: mentaSpacing[12],
      paddingTop: mentaSpacing[6],
    },
    header: {
      gap: mentaSpacing[2],
      marginBottom: mentaSpacing[2],
    },
    settingsTitle: {
      color: mentaColors.text.primary,
      ...mentaTypography.journeyTitle,
    },
    fixedFooter: {
      alignItems: 'center',
      backgroundColor: mentaColors.canvas,
      borderTopColor: mentaColors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: mentaSpacing[2],
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[3],
    },
    fixedFooterLane: {
      gap: mentaSpacing[2],
      maxWidth: mentaLayout.taskLane,
      width: '100%',
    },
    stateTitle: {
      color: mentaColors.text.primary,
      ...mentaTypography.title,
      marginTop: mentaSpacing[2],
    },
    stateBody: {
      color: mentaColors.text.secondary,
      ...mentaTypography.body,
      marginTop: mentaSpacing[2],
    },
    notice: {
      marginTop: mentaSpacing[5],
    },
    sheetState: {
      gap: mentaSpacing[6],
    },
    sheetIntro: {
      gap: mentaSpacing[2],
    },
    sheetActions: {
      gap: mentaSpacing[3],
    },
    preflightChecks: {
      borderBottomColor: mentaColors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: mentaColors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    sheetTitle: {
      color: mentaColors.text.primary,
      ...mentaTypography.title,
    },
    sheetBody: {
      color: mentaColors.text.secondary,
      ...mentaTypography.body,
    },
  });

const SettingsSheet = ({
  children,
  onRequestClose,
  testID,
  visible,
}: {
  children: React.ReactNode;
  onRequestClose: () => void;
  testID?: string;
  visible: boolean;
}) => (
  <SimpleBottomSheet
    dismissOnBackdrop
    onClose={onRequestClose}
    scrollableBody={<View style={settingsSheetStyles.surface}>{children}</View>}
    testID={testID}
    visible={visible}
  />
);

const settingsSheetStyles = StyleSheet.create({
  surface: {
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[2],
  },
});

const SettingsLoadingSkeleton = ({
  isTabDestination,
  onSignOut,
}: {
  isTabDestination: boolean;
  onSignOut?: () => void;
}) => {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  return (
    <SafeAreaView style={settingsSkeletonStyles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          settingsSkeletonStyles.lane,
          { paddingHorizontal: phoneLayout.screenInset },
        ]}
      >
        <View
          accessibilityLabel={t(
            'fullAuth.settings.loading_account_specific_settings'
          )}
          accessibilityRole="progressbar"
          style={settingsSkeletonStyles.header}
          testID="settings-account-loading"
        >
          {!isTabDestination ? (
            <SkeletonLoader
              announce={false}
              borderRadius={mentaRadii.round}
              height={44}
              width={44}
            />
          ) : null}
          <SkeletonLoader announce={false} height={30} width={142} />
        </View>
        {onSignOut ? (
          <View>
            <SettingsSectionLabel>
              {t('fullAuth.settings.session')}
            </SettingsSectionLabel>
            <SettingsDirectRow
              icon={<LogOutIcon size={18} color={mentaColors.text.secondary} />}
              onPress={onSignOut}
              showDivider={false}
              subtitle={t(
                'fullAuth.settings.leave_this_device_your_menta_account_stays_activ'
              )}
              testID="settings-sign-out"
              title={t('fullAuth.settings.sign_out')}
            />
          </View>
        ) : (
          <SettingsSkeletonSection rows={1} />
        )}
        <SettingsSkeletonSection rows={3} />
        <SettingsSkeletonSection rows={1} />
        <SettingsSkeletonSection labelWidth={132} rows={2} />
        <SettingsSkeletonSection rows={2} />
        <SettingsSkeletonRow divider />
      </View>
    </SafeAreaView>
  );
};

const SettingsSkeletonSection = ({
  labelWidth = 88,
  rows,
}: {
  labelWidth?: number;
  rows: number;
}) => (
  <View>
    <View style={settingsSkeletonStyles.sectionLabel}>
      <SkeletonLoader announce={false} height={10} width={labelWidth} />
    </View>
    {Array.from({ length: rows }, (_, index) => (
      <SettingsSkeletonRow divider={index < rows - 1} key={index} />
    ))}
  </View>
);

const SettingsSkeletonRow = ({ divider = false }: { divider?: boolean }) => (
  <View
    style={[
      settingsSkeletonStyles.row,
      divider && settingsSkeletonStyles.rowDivider,
    ]}
  >
    <SkeletonLoader
      announce={false}
      borderRadius={mentaRadii.round}
      height={24}
      width={24}
    />
    <View style={settingsSkeletonStyles.rowCopy}>
      <SkeletonLoader announce={false} height={13} width={132} />
      <SkeletonLoader announce={false} height={10} width="72%" />
    </View>
    <SkeletonLoader
      announce={false}
      borderRadius={mentaRadii.round}
      height={12}
      width={12}
    />
  </View>
);

const settingsSkeletonStyles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
    flex: 1,
  },
  lane: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: mentaLayout.workingFrameMax,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    paddingBottom: mentaSpacing[2],
    paddingTop: mentaSpacing[6],
  },
  sectionLabel: {
    height: 40,
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 64,
    paddingVertical: mentaSpacing[3],
  },
  rowDivider: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
});
