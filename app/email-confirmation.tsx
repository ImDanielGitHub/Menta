import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
} from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { MailIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';
import { useAuthStore } from '@/store/auth-store';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';

type ConfirmationStatus =
  | 'expired'
  | 'invalid'
  | 'failed'
  | 'account-mismatch'
  | 'storage';

const getParam = (value?: string | string[]) =>
  typeof value === 'string' ? value : '';

const getStatus = (value?: string | string[]): ConfirmationStatus | null => {
  const status = getParam(value);
  return [
    'expired',
    'invalid',
    'failed',
    'account-mismatch',
    'storage',
  ].includes(status)
    ? (status as ConfirmationStatus)
    : null;
};

type Localise = ReturnType<typeof useTranslation>['t'];

const getResendFailureMessage = (
  error: unknown,
  localise: Localise
): string => {
  const message = error instanceof Error ? error.message : '';
  if (/network|offline|internet|connection|timed out/i.test(message)) {
    return localise('fullAuth.source.email_confirmation.resend_offline');
  }
  if (/too many|rate limit|security purposes/i.test(message)) {
    return localise('fullAuth.source.email_confirmation.resend_rate_limited');
  }
  return localise('fullAuth.source.email_confirmation.resend_failed');
};

export default function EmailConfirmationScreen() {
  const router = useRouter();
  const phoneLayout = usePhoneLayout();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ status?: string | string[] }>();
  const pending = useEmailConfirmationStore(state => state.pending);
  const hasHydrated = useEmailConfirmationStore(state => state.hasHydrated);
  const hydrate = useEmailConfirmationStore(state => state.hydrate);
  const markResent = useEmailConfirmationStore(state => state.markResent);
  const clear = useEmailConfirmationStore(state => state.clear);
  const resendEmailConfirmation = useAuthStore(
    state => state.resendEmailConfirmation
  );
  const recoverEmailConfirmationSession = useAuthStore(
    state => state.recoverEmailConfirmationSession
  );
  const [now, setNow] = useState(Date.now());
  const [loadingAction, setLoadingAction] = useState<
    'check' | 'resend' | 'edit' | null
  >(null);
  const [notice, setNotice] = useState<{
    tone: 'error' | 'success' | 'warning';
    title: string;
    description: string;
  } | null>(null);
  const resendLockRef = useRef(false);
  const checkLockRef = useRef(false);

  const status = getStatus(params.status);

  useEffect(() => {
    if (!hasHydrated) {
      void hydrate().catch(() => {
        setNotice({
          tone: 'error',
          title: t('fullAuth.source.email_confirmation.restore_failed_title'),
          description: t(
            'fullAuth.source.email_confirmation.restore_failed_description'
          ),
        });
      });
    }
  }, [hasHydrated, hydrate, t]);

  useEffect(() => {
    if (!pending || pending.resendAvailableAt <= now) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [now, pending]);

  useEffect(() => {
    if (!status) return;

    if (status === 'expired') {
      setNotice({
        tone: 'warning',
        title: t('fullAuth.source.email_confirmation.expired_title'),
        description: t(
          'fullAuth.source.email_confirmation.expired_description'
        ),
      });
      return;
    }
    if (status === 'invalid') {
      setNotice({
        tone: 'error',
        title: t('fullAuth.source.email_confirmation.invalid_title'),
        description: t(
          'fullAuth.source.email_confirmation.invalid_description'
        ),
      });
      return;
    }
    if (status === 'account-mismatch') {
      setNotice({
        tone: 'error',
        title: t('fullAuth.source.email_confirmation.account_mismatch_title'),
        description: t(
          'fullAuth.source.email_confirmation.account_mismatch_description'
        ),
      });
      return;
    }
    if (status === 'storage') {
      setNotice({
        tone: 'warning',
        title: t('fullAuth.source.email_confirmation.storage_title'),
        description: t(
          'fullAuth.source.email_confirmation.storage_description'
        ),
      });
      return;
    }
    setNotice({
      tone: 'error',
      title: t('fullAuth.source.email_confirmation.callback_failed_title'),
      description: t(
        'fullAuth.source.email_confirmation.callback_failed_description'
      ),
    });
  }, [status, t]);

  const resendSecondsRemaining = useMemo(() => {
    if (!pending) return 0;
    return Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000));
  }, [now, pending]);

  const changeEmail = async () => {
    if (!pending || loadingAction) return;
    setLoadingAction('edit');
    const editParams = {
      mode: 'signup',
      email: pending.email,
      name: pending.username,
      ...(pending.fromOnboarding ? { from: 'onboarding' } : {}),
    };
    try {
      await clear();
      router.replace({ pathname: '/email-auth', params: editParams });
    } catch {
      setNotice({
        tone: 'error',
        title: t('fullAuth.source.email_confirmation.reopen_failed_title'),
        description: t(
          'fullAuth.source.email_confirmation.reopen_failed_description'
        ),
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const checkSession = async () => {
    if (!pending || checkLockRef.current || loadingAction) return;
    checkLockRef.current = true;
    setLoadingAction('check');
    setNotice(null);
    try {
      const result = await recoverEmailConfirmationSession(pending.email);
      if (result === 'session_confirmed') {
        router.replace('/onboarding');
        return;
      }
      if (result === 'account_mismatch') {
        setNotice({
          tone: 'error',
          title: t(
            'fullAuth.source.email_confirmation.signed_in_account_mismatch_title'
          ),
          description: t(
            'fullAuth.source.email_confirmation.signed_in_account_mismatch_description'
          ),
        });
        return;
      }
      setNotice({
        tone: 'warning',
        title: t('fullAuth.source.email_confirmation.no_session_title'),
        description: t(
          'fullAuth.source.email_confirmation.no_session_description'
        ),
      });
    } catch {
      setNotice({
        tone: 'error',
        title: t('fullAuth.source.email_confirmation.check_failed_title'),
        description: t(
          'fullAuth.source.email_confirmation.check_failed_description'
        ),
      });
    } finally {
      checkLockRef.current = false;
      setLoadingAction(null);
    }
  };

  const resend = async () => {
    if (
      !pending ||
      resendLockRef.current ||
      loadingAction ||
      resendSecondsRemaining > 0
    ) {
      return;
    }

    resendLockRef.current = true;
    setLoadingAction('resend');
    setNotice(null);
    try {
      await resendEmailConfirmation(pending.email);
      await markResent(pending.email);
      setNow(Date.now());
      setNotice({
        tone: 'success',
        title: t('fullAuth.source.email_confirmation.resent_title'),
        description: t(
          'fullAuth.source.email_confirmation.resent_description',
          { email: pending.email }
        ),
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        title: t('fullAuth.source.email_confirmation.resend_failed_title'),
        description: getResendFailureMessage(error, t),
      });
    } finally {
      resendLockRef.current = false;
      setLoadingAction(null);
    }
  };

  if (!hasHydrated && !pending) {
    return (
      <AppScreen lane="focused" hasTabBar={false} testID="email-confirmation">
        <View style={styles.loadingBody}>
          <Text style={styles.body} textScale={phoneLayout.textScale}>
            {t('fullAuth.source.email_confirmation.restoring')}
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!pending) {
    return (
      <AppScreen
        lane="focused"
        hasTabBar={false}
        scrollable
        testID="email-confirmation"
        contentContainerStyle={{
          ...styles.screen,
          paddingHorizontal: phoneLayout.screenInset,
        }}
      >
        <AppTopBar
          title={t('brand.name')}
          titleIsHeading={false}
          textScale={phoneLayout.textScale}
        />
        <View style={styles.intro}>
          <Text
            accessibilityRole="header"
            style={styles.title}
            textScale={phoneLayout.textScale}
          >
            {t('fullAuth.source.email_confirmation.no_pending_title')}
          </Text>
          <Text style={styles.body} textScale={phoneLayout.textScale}>
            {t('fullAuth.source.email_confirmation.no_pending_description')}
          </Text>
        </View>
        {notice ? (
          <AppInlineNotice
            title={notice.title}
            description={notice.description}
            tone={notice.tone}
            textScale={phoneLayout.textScale}
            testID="email-confirmation-notice"
          />
        ) : null}
        <View style={styles.actions}>
          <AppButton
            fullWidth
            size="large"
            title={t('fullAuth.shared.sign_in')}
            variant="accent"
            textScale={phoneLayout.textScale}
            testID="email-confirmation-sign-in-empty"
            onPress={() => router.replace('/email-auth?mode=login')}
          />
          <AppButton
            fullWidth
            size="large"
            title={t('fullAuth.email_auth.create_account')}
            variant="secondary"
            textScale={phoneLayout.textScale}
            onPress={() => router.replace('/email-auth?mode=signup')}
          />
        </View>
      </AppScreen>
    );
  }

  const isBusy = loadingAction !== null;

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      testID="email-confirmation"
      contentContainerStyle={{
        ...styles.screen,
        paddingHorizontal: phoneLayout.screenInset,
      }}
    >
      <AppTopBar
        backLabel={t('fullAuth.source.email_confirmation.change_email')}
        title={t('brand.name')}
        titleIsHeading={false}
        onBack={() => void changeEmail()}
        textScale={phoneLayout.textScale}
      />

      <View style={styles.intro}>
        <View style={styles.icon} accessibilityElementsHidden>
          <MailIcon color={mentaColors.action} size={32} />
        </View>
        <Text
          accessibilityRole="header"
          style={styles.title}
          textScale={phoneLayout.textScale}
        >
          {t('fullAuth.source.email_confirmation.heading')}
        </Text>
        <Text style={styles.body} textScale={phoneLayout.textScale}>
          {t('fullAuth.source.email_confirmation.instruction')}
        </Text>
      </View>

      <View
        accessible
        accessibilityLabel={t(
          'fullAuth.source.email_confirmation.email_accessibility',
          { email: pending.email }
        )}
        style={styles.emailReceipt}
        testID="email-confirmation-address"
      >
        <Text style={styles.emailLabel} textScale={phoneLayout.textScale}>
          {t('fullAuth.source.email_confirmation.email_label')}
        </Text>
        <Text selectable style={styles.email} textScale={phoneLayout.textScale}>
          {pending.email}
        </Text>
      </View>

      <Text style={styles.savedCopy} textScale={phoneLayout.textScale}>
        {t('fullAuth.source.email_confirmation.saved_state_description')}
      </Text>

      {notice ? (
        <AppInlineNotice
          title={notice.title}
          description={notice.description}
          tone={notice.tone}
          textScale={phoneLayout.textScale}
          testID="email-confirmation-notice"
        />
      ) : null}

      <View style={styles.actions}>
        <AppButton
          disabled={isBusy}
          fullWidth
          loading={loadingAction === 'check'}
          preserveLabelPositionOnLoading
          size="large"
          title={t('fullAuth.source.email_confirmation.confirmed_action')}
          variant="accent"
          textScale={phoneLayout.textScale}
          testID="email-confirmation-check"
          onPress={() => void checkSession()}
        />
        <AppButton
          disabled={isBusy || resendSecondsRemaining > 0}
          fullWidth
          loading={loadingAction === 'resend'}
          preserveLabelPositionOnLoading
          size="large"
          title={
            resendSecondsRemaining > 0
              ? t('fullAuth.source.email_confirmation.resend_countdown', {
                  seconds: resendSecondsRemaining,
                })
              : t('fullAuth.source.email_confirmation.resend_action')
          }
          variant="secondary"
          textScale={phoneLayout.textScale}
          testID="email-confirmation-resend"
          onPress={() => void resend()}
        />
        <AppButton
          disabled={isBusy}
          fullWidth
          size="large"
          title={t('fullAuth.password_recovery.sign_in_instead')}
          variant="ghost"
          textScale={phoneLayout.textScale}
          testID="email-confirmation-sign-in"
          onPress={() =>
            router.replace({
              pathname: '/email-auth',
              params: {
                mode: 'login',
                email: pending.email,
                from: 'confirmation',
              },
            })
          }
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[4],
    maxWidth: mentaLayout.phoneFrameMax,
    paddingBottom: mentaSpacing[8],
    paddingTop: mentaSpacing[4],
    width: '100%',
  },
  loadingBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: mentaSpacing[6],
  },
  intro: { alignItems: 'flex-start', gap: mentaSpacing[2] },
  icon: {
    alignItems: 'center',
    backgroundColor: mentaColors.actionSoft,
    borderRadius: mentaRadii.large,
    height: 56,
    justifyContent: 'center',
    marginBottom: mentaSpacing[1],
    width: 56,
  },
  title: { color: mentaColors.text.primary, ...mentaTypography.heading },
  body: { color: mentaColors.text.secondary, ...mentaTypography.body },
  emailReceipt: {
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    gap: mentaSpacing[1],
    padding: mentaSpacing[4],
  },
  emailLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  email: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  savedCopy: {
    alignSelf: 'center',
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    ...mentaTypography.bodySmall,
  },
  actions: {
    gap: mentaSpacing[3],
    marginTop: 'auto',
    paddingTop: mentaSpacing[2],
  },
});
