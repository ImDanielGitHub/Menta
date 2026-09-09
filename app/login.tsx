import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppleIcon, MailIcon } from '@/components/ui/icons';
import { GoogleGlyph } from '@/components/ui/google-glyph';
import { googleProviderLabelTypography } from '@/components/ui/google-provider-style';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
} from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { saveOnboardingDraft } from '@/lib/onboarding-draft';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePaperAuthDraft } from '@/components/onboarding/PaperAuthSurface';
import { PromiseInviteRoleHero } from '@/components/onboarding/PromiseInviteRoleHero';
import { usePendingPromiseInvitePreview } from '@/hooks/usePendingPromiseInvitePreview';
import {
  accountabilityInviteHeading,
  accountabilityInviteMeaning,
  accountabilityInviteRoleCopy,
} from '@/lib/promises/accountability';
import { useAuthStore } from '@/store/auth-store';
import { useInviteStore } from '@/store/invite-store';
import { withReadableLeading } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';
import { trackProductEvent } from '@/lib/posthog';

type Provider = 'apple' | 'google';

const isAuthCancelled = (message: string) =>
  message.toLowerCase().includes('sign-in was cancelled') ||
  message.toLowerCase().includes('sign in was cancelled');

export default function LoginScreen() {
  const router = useRouter();
  const phoneLayout = usePhoneLayout();
  const { t } = useTranslation();
  const { isLoading, signInWithApple, signInWithGoogle } = useAuthStore();
  const draft = usePaperAuthDraft();
  const { pendingInvite, preview: invitePreview } =
    usePendingPromiseInvitePreview();
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const providerLockRef = useRef<Provider | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [providerCancelled, setProviderCancelled] = useState(false);
  const hasDraft = Boolean(draft?.promise.trim());
  const hasInvite = Boolean(pendingInvite && invitePreview);

  const trackInviteAuth = (
    method: Provider | 'password',
    outcome: 'started' | 'handoff' | 'succeeded' | 'cancelled' | 'failed'
  ) => {
    if (!invitePreview) return;
    trackProductEvent('Promise Invite Journey', {
      action: outcome === 'handoff' ? 'handed_off' : outcome,
      authenticated: false,
      entry_point: 'authentication',
      method,
      outcome:
        outcome === 'started' || outcome === 'handoff' ? 'pending' : outcome,
      role: invitePreview.role,
      stage: 'auth_handoff',
    });
  };

  useEffect(() => {
    if (draft?.resumeStep === 'auth_cancelled') {
      setProviderCancelled(true);
    }
  }, [draft?.resumeStep]);

  const retainDraft = async (
    resumeStep: 'auth_method' | 'preview'
  ): Promise<boolean> => {
    if (!draft) return true;
    try {
      await saveOnboardingDraft(
        {
          promise: draft.promise,
          proofType: draft.proofType,
          durationDays: draft.durationDays,
        },
        draft.ownerUserId,
        resumeStep
      );
      return true;
    } catch {
      setErrorMessage(t('auth.login.error.keep_promise'));
      return false;
    }
  };

  const handleEmail = async () => {
    setProviderCancelled(false);
    setErrorMessage('');
    if (!(await retainDraft('auth_method'))) return;
    trackProductEvent('Authentication Result', {
      flow: 'login',
      method: 'password',
      outcome: 'handoff',
    });
    trackInviteAuth('password', 'handoff');
    router.push('/email-auth?mode=login');
  };

  const handleProvider = async (provider: Provider) => {
    if (providerLockRef.current || pendingProvider || isLoading) return;

    providerLockRef.current = provider;
    trackProductEvent('Authentication Result', {
      flow: 'login',
      method: provider,
      outcome: 'started',
    });
    trackInviteAuth(provider, 'started');
    setPendingProvider(provider);
    setProviderCancelled(false);
    setErrorMessage('');
    if (!(await retainDraft('auth_method'))) {
      providerLockRef.current = null;
      setPendingProvider(null);
      return;
    }

    try {
      await (provider === 'apple' ? signInWithApple() : signInWithGoogle());
      trackProductEvent('Authentication Result', {
        flow: 'login',
        method: provider,
        outcome: 'succeeded',
      });
      trackInviteAuth(provider, 'succeeded');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';

      if (isAuthCancelled(message)) {
        trackProductEvent('Authentication Result', {
          flow: 'login',
          method: provider,
          outcome: 'cancelled',
        });
        trackInviteAuth(provider, 'cancelled');
        if (draft) {
          try {
            await saveOnboardingDraft(
              {
                promise: draft.promise,
                proofType: draft.proofType,
                durationDays: draft.durationDays,
              },
              draft.ownerUserId,
              'auth_cancelled'
            );
          } catch {
            setErrorMessage(t('auth.login.error.cancel_recovery'));
            return;
          }
        }
        setProviderCancelled(true);
        router.replace('/login');
      } else {
        trackProductEvent('Authentication Result', {
          flow: 'login',
          method: provider,
          outcome: 'failed',
        });
        trackInviteAuth(provider, 'failed');
        setErrorMessage(
          t('auth.login.error.provider', {
            provider: provider === 'apple' ? 'Apple' : 'Google',
          })
        );
      }
    } finally {
      if (providerLockRef.current === provider) {
        providerLockRef.current = null;
      }
      setPendingProvider(null);
    }
  };

  const returnToDraft = async () => {
    setProviderCancelled(false);
    setErrorMessage('');
    if (!(await retainDraft('preview'))) return;
    router.replace('/onboarding');
  };

  const dismissInvite = () => {
    if (pendingInvite) {
      useInviteStore.getState().dismissPending(pendingInvite);
    }
    trackProductEvent('Promise Invite Journey', {
      action: 'dismissed',
      authenticated: false,
      entry_point: 'authentication',
      outcome: 'not_applicable',
      role: invitePreview?.role ?? 'unknown',
      stage: 'auth_handoff',
    });
    router.replace('/onboarding');
  };

  const providerBusy = pendingProvider !== null || isLoading;
  const titleLeading = withReadableLeading(
    mentaTypography.heading,
    phoneLayout
  );
  const bodyLeading = withReadableLeading(mentaTypography.body, phoneLayout);

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      testID="login"
      contentContainerStyle={{
        ...styles.screen,
        paddingHorizontal: phoneLayout.screenInset,
      }}
    >
      <AppTopBar
        textScale={phoneLayout.textScale}
        title={t('fullAuth.login.menta')}
        titleIsHeading={false}
      />

      {providerCancelled ? (
        <>
          <View style={styles.intro}>
            <Text
              accessibilityRole="header"
              style={[styles.title, titleLeading]}
              textScale={phoneLayout.textScale}
            >
              {t('auth.login.cancelled.title')}
            </Text>
            <Text
              style={[styles.body, bodyLeading]}
              textScale={phoneLayout.textScale}
            >
              {invitePreview
                ? t('fullAuth.onboarding.promise_invite_held')
                : hasDraft
                  ? t('auth.login.cancelled.draft_detail')
                  : t('auth.login.cancelled.detail')}
            </Text>
          </View>
          <View style={styles.actions}>
            <AppButton
              fullWidth
              size="large"
              title={t('auth.login.action.retry_apple')}
              variant="secondary"
              textScale={phoneLayout.textScale}
              onPress={() => void handleProvider('apple')}
            />
            <AppButton
              fullWidth
              size="large"
              title={t('auth.login.action.retry_google')}
              variant="secondary"
              textScale={phoneLayout.textScale}
              onPress={() => void handleProvider('google')}
            />
            <AppButton
              fullWidth
              size="large"
              title={t('auth.login.action.email')}
              variant="accent"
              textScale={phoneLayout.textScale}
              onPress={() => void handleEmail()}
            />
            {hasDraft ? (
              <AppButton
                fullWidth
                size="small"
                title={t('auth.login.action.keep_editing')}
                variant="ghost"
                textScale={phoneLayout.textScale}
                onPress={() => void returnToDraft()}
              />
            ) : pendingInvite ? (
              <AppButton
                fullWidth
                size="small"
                title={t('groups.source.accountability.join_promise.title')}
                variant="ghost"
                textScale={phoneLayout.textScale}
                onPress={() =>
                  router.replace({
                    pathname: '/join-promise',
                    params: { code: pendingInvite.code },
                  })
                }
              />
            ) : null}
          </View>
        </>
      ) : (
        <>
          <View style={styles.intro}>
            <Text
              accessibilityRole="header"
              style={[styles.title, titleLeading]}
              textScale={phoneLayout.textScale}
            >
              {invitePreview
                ? accountabilityInviteHeading(
                    invitePreview.role,
                    invitePreview.inviterName,
                    t
                  )
                : hasDraft
                  ? t('auth.login.draft_title')
                  : t('auth.login.title')}
            </Text>
            {invitePreview ? (
              <Text
                style={[styles.body, bodyLeading]}
                textScale={phoneLayout.textScale}
              >
                {t('fullAuth.onboarding.promise_invite_held')}
              </Text>
            ) : hasDraft ? (
              <Text
                style={[styles.body, bodyLeading]}
                textScale={phoneLayout.textScale}
              >
                {t('auth.login.draft_detail')}
              </Text>
            ) : null}
          </View>
          {invitePreview ? (
            <PromiseInviteRoleHero
              compact
              role={invitePreview.role}
              title={accountabilityInviteRoleCopy(invitePreview.role, t).title}
              detail={accountabilityInviteMeaning(
                invitePreview.role,
                invitePreview.promiseTitle,
                t
              )}
              testID="login-promise-invite-context"
            />
          ) : null}
          {errorMessage ? (
            <AppInlineNotice
              title={t('auth.login.error.title')}
              description={errorMessage}
              tone="error"
              testID="login-error"
              textScale={phoneLayout.textScale}
            />
          ) : null}
          <View style={styles.actions}>
            <AppButton
              disabled={providerBusy && pendingProvider !== 'apple'}
              fullWidth
              icon={<AppleIcon color={mentaColors.text.primary} size={18} />}
              loading={pendingProvider === 'apple'}
              preserveLabelPositionOnLoading
              size="large"
              testID="login-apple"
              title={t('auth.login.action.apple')}
              variant="secondary"
              textScale={phoneLayout.textScale}
              onPress={() => void handleProvider('apple')}
            />
            <AppButton
              disabled={providerBusy && pendingProvider !== 'google'}
              fullWidth
              icon={<GoogleGlyph size={20} />}
              loading={pendingProvider === 'google'}
              preserveLabelPositionOnLoading
              size="large"
              testID="login-google"
              textStyle={styles.googleProviderLabel}
              title={t('auth.login.action.google')}
              variant="secondary"
              textScale={phoneLayout.textScale}
              onPress={() => void handleProvider('google')}
            />
            <AppButton
              disabled={providerBusy}
              fullWidth
              icon={<MailIcon color={mentaColors.canvas} size={18} />}
              size="large"
              testID="login-email"
              title={t('auth.login.action.email')}
              variant="accent"
              textScale={phoneLayout.textScale}
              onPress={() => void handleEmail()}
            />
            {hasInvite ? (
              <AppButton
                fullWidth
                size="small"
                testID="login-dismiss-promise-invite"
                title={t('groups.source.accountability.common.not_now')}
                variant="ghost"
                textScale={phoneLayout.textScale}
                onPress={dismissInvite}
              />
            ) : (
              <AppButton
                fullWidth
                size="small"
                testID="login-replay-intro"
                title={t('auth.login.action.replay_intro')}
                variant="ghost"
                textScale={phoneLayout.textScale}
                onPress={() => router.push('/onboarding-again')}
              />
            )}
          </View>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[5],
    maxWidth: mentaLayout.phoneFrameMax,
    paddingBottom: mentaSpacing[8],
    paddingTop: mentaSpacing[4],
    width: '100%',
  },
  intro: { gap: mentaSpacing[2], paddingTop: mentaSpacing[4] },
  title: { color: mentaColors.text.primary, ...mentaTypography.heading },
  body: { color: mentaColors.text.secondary, ...mentaTypography.body },
  actions: { gap: mentaSpacing[3], marginTop: 'auto' },
  googleProviderLabel: googleProviderLabelTypography,
});
