import { useTranslation } from '@/lib/localization';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppSecureField,
  AppTextField,
  AppTopBar,
} from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  PaperAuthLegal,
  usePaperAuthDraft,
} from '@/components/onboarding/PaperAuthSurface';
import { useAuthStore } from '@/store/auth-store';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { MINIMUM_NEW_PASSWORD_LENGTH } from '@/lib/auth/password-policy';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';
import { usePendingPromiseInvitePreview } from '@/hooks/usePendingPromiseInvitePreview';
import { PromiseInviteRoleHero } from '@/components/onboarding/PromiseInviteRoleHero';
import {
  accountabilityInviteMeaning,
  accountabilityInviteRoleCopy,
} from '@/lib/promises/accountability';
import { trackProductEvent } from '@/lib/posthog';

type EmailAuthMode = 'login' | 'signup';
type FieldErrors = Partial<
  Record<'name' | 'email' | 'password' | 'confirmPassword', string>
>;

const isMode = (value?: string | string[]): value is EmailAuthMode =>
  value === 'login' || value === 'signup';

const getParam = (value?: string | string[]) =>
  typeof value === 'string' ? value : '';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());
const isValidName = (value: string) => /^[a-zA-Z0-9_]+$/.test(value);
const isDuplicateAccountError = (message: string) =>
  /already|exists|registered/i.test(message);

const getFailureMessage = (
  error: unknown,
  mode: EmailAuthMode,
  t: ReturnType<typeof useTranslation>['t']
) => {
  const message = error instanceof Error ? error.message : '';
  if (isDuplicateAccountError(message)) return message;
  if (/network|offline|internet|connection|timed out/i.test(message)) {
    return t('fullAuth.email_auth.offline_reconnect');
  }
  if (/too many|rate limit/i.test(message)) {
    return t('fullAuth.email_auth.too_many_attempts');
  }
  return mode === 'login'
    ? t('fullAuth.email_auth.could_not_sign_in')
    : t('fullAuth.email_auth.could_not_create_account');
};

export default function EmailAuthScreen() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string | string[];
    from?: string | string[];
    mode?: string | string[];
    name?: string | string[];
  }>();
  const { isLoading, login, register } = useAuthStore();
  const pendingEmailConfirmation = useEmailConfirmationStore(
    state => state.pending
  );
  const emailConfirmationHydrated = useEmailConfirmationStore(
    state => state.hasHydrated
  );
  const hydrateEmailConfirmation = useEmailConfirmationStore(
    state => state.hydrate
  );
  const stageEmailConfirmation = useEmailConfirmationStore(
    state => state.stage
  );
  const draft = usePaperAuthDraft();
  const { preview: invitePreview } = usePendingPromiseInvitePreview();
  const requestedMode = isMode(params.mode) ? params.mode : 'login';
  const source = getParam(params.from);
  const fromOnboarding = source === 'onboarding';
  const fromConfirmation = source === 'confirmation';
  const [mode, setMode] = useState<EmailAuthMode>(requestedMode);
  const [name, setName] = useState(getParam(params.name));
  const [email, setEmail] = useState(getParam(params.email));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const submissionLockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(requestedMode);
    setErrors({});
    setServerError('');
  }, [requestedMode]);

  useEffect(() => {
    if (!emailConfirmationHydrated) {
      void hydrateEmailConfirmation();
    }
  }, [emailConfirmationHydrated, hydrateEmailConfirmation]);

  useEffect(() => {
    if (
      emailConfirmationHydrated &&
      pendingEmailConfirmation &&
      !isSubmitting &&
      !fromConfirmation
    ) {
      router.replace('/email-confirmation');
    }
  }, [
    emailConfirmationHydrated,
    fromConfirmation,
    isSubmitting,
    pendingEmailConfirmation,
    router,
  ]);

  const copy = useMemo(
    () =>
      mode === 'signup'
        ? {
            title: t('fullAuth.email_auth.create_your_account'),
            description: invitePreview
              ? t('fullAuth.onboarding.promise_invite_held')
              : draft?.promise.trim()
                ? t(
                    'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta'
                  )
                : t(
                    'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_'
                  ),
            action: t('fullAuth.email_auth.create_account'),
            switchLead: t('fullAuth.email_auth.already_have_account'),
            switchAction: t('fullAuth.email_auth.sign_in'),
          }
        : {
            title: t('fullAuth.email_auth.sign_in_with_email'),
            description: invitePreview
              ? t('fullAuth.onboarding.promise_invite_held')
              : draft?.promise.trim()
                ? t(
                    'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou'
                  )
                : null,
            action: t('fullAuth.email_auth.sign_in'),
            switchLead: t('fullAuth.email_auth.new_to_menta'),
            switchAction: t('fullAuth.email_auth.create_account'),
          },
    [draft?.promise, invitePreview, mode, t]
  );

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (serverError) setServerError('');
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);

    if (mode === 'signup') {
      if (!cleanName) {
        nextErrors.name = t('fullAuth.email_auth.choose_username');
      } else if (cleanName.length < 3) {
        nextErrors.name = t('fullAuth.email_auth.minimum_three_characters');
      } else if (!isValidName(cleanName)) {
        nextErrors.name = t('fullAuth.email_auth.username_characters_only');
      }
    }

    if (!cleanEmail) {
      nextErrors.email = t('fullAuth.email_auth.account_email');
    } else if (!isValidEmail(cleanEmail)) {
      nextErrors.email = t('fullAuth.email_auth.valid_email');
    }

    if (!password) {
      nextErrors.password =
        mode === 'login'
          ? t('fullAuth.email_auth.enter_password')
          : t('fullAuth.email_auth.create_password');
    } else if (
      mode === 'signup' &&
      password.length < MINIMUM_NEW_PASSWORD_LENGTH
    ) {
      nextErrors.password = t('fullAuth.email_auth.password_minimum', {
        length: MINIMUM_NEW_PASSWORD_LENGTH,
      });
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        nextErrors.confirmPassword = t(
          'fullAuth.email_auth.confirm_your_password'
        );
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = t(
          'fullAuth.email_auth.passwords_need_to_match'
        );
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading || submissionLockRef.current || !validate()) return;

    submissionLockRef.current = true;
    setIsSubmitting(true);

    const input = {
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      confirmPassword,
    };

    if (invitePreview) {
      trackProductEvent('Promise Invite Journey', {
        action: 'started',
        authenticated: false,
        entry_point: 'password_authentication',
        method: 'password',
        mode,
        outcome: 'pending',
        role: invitePreview.role,
        stage: 'auth_handoff',
      });
    }

    try {
      if (mode === 'login') {
        await login(input.email, input.password);
        if (invitePreview) {
          trackProductEvent('Promise Invite Journey', {
            action: 'completed',
            authenticated: true,
            entry_point: 'password_authentication',
            method: 'password',
            mode,
            outcome: 'succeeded',
            role: invitePreview.role,
            stage: 'auth_handoff',
          });
        }
      } else {
        const result = await register(input.email, input.password, input.name);
        if (result.status === 'confirmation_required') {
          let persistenceFailed = false;
          try {
            await stageEmailConfirmation({
              email: result.email,
              username: input.name,
              expectedUserId: result.userId,
              fromOnboarding,
            });
          } catch {
            // The store publishes the in-memory pending state before writing.
            // Keep the person out of a duplicate signup even if this device
            // cannot make that state durable.
            persistenceFailed = true;
          }
          router.replace(
            persistenceFailed
              ? '/email-confirmation?status=storage'
              : '/email-confirmation'
          );
        }
        if (invitePreview) {
          trackProductEvent('Promise Invite Journey', {
            action:
              result.status === 'confirmation_required'
                ? 'handed_off'
                : 'completed',
            authenticated: result.status === 'session_confirmed',
            entry_point: 'password_authentication',
            method: 'password',
            mode,
            outcome:
              result.status === 'session_confirmed' ? 'succeeded' : 'pending',
            role: invitePreview.role,
            stage: 'auth_handoff',
          });
        }
      }
    } catch (error: unknown) {
      const message = getFailureMessage(error, mode, t);
      if (mode === 'signup' && isDuplicateAccountError(message)) {
        setErrors(current => ({
          ...current,
          email: 'This email already has a Menta account.',
        }));
      } else {
        setServerError(message);
      }
      if (invitePreview) {
        trackProductEvent('Promise Invite Journey', {
          action: 'completed',
          authenticated: false,
          entry_point: 'password_authentication',
          method: 'password',
          mode,
          outcome: 'failed',
          role: invitePreview.role,
          stage: 'auth_handoff',
        });
      }
    } finally {
      submissionLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const isAuthPending = isLoading || isSubmitting;

  const duplicateEmail = Boolean(errors.email?.includes('already'));

  const switchMode = () => {
    setMode(current => (current === 'login' ? 'signup' : 'login'));
    setErrors({});
    setServerError('');
  };

  return (
    <AppScreen
      automaticallyAdjustKeyboardInsets
      lane="focused"
      hasTabBar={false}
      scrollable
      testID="email-auth"
      contentContainerStyle={{
        ...styles.screen,
        paddingHorizontal: phoneLayout.screenInset,
      }}
    >
      <AppTopBar
        backLabel={t('fullAuth.shared.other_sign_in_options')}
        title={t('fullAuth.email_auth.menta')}
        titleIsHeading={false}
        onBack={() =>
          router.replace(
            fromConfirmation
              ? '/email-confirmation'
              : fromOnboarding
                ? '/onboarding'
                : '/login'
          )
        }
        textScale={phoneLayout.textScale}
      />

      <View style={styles.intro}>
        <Text
          accessibilityRole="header"
          style={styles.title}
          textScale={phoneLayout.textScale}
        >
          {copy.title}
        </Text>
        {copy.description ? (
          <Text style={styles.body} textScale={phoneLayout.textScale}>
            {copy.description}
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
          testID="email-auth-promise-invite-context"
        />
      ) : null}

      {serverError ? (
        <AppInlineNotice
          title={
            mode === 'login'
              ? t('fullAuth.email_auth.couldn_t_sign_you_in')
              : t('fullAuth.email_auth.couldn_t_create_account')
          }
          description={serverError}
          tone="error"
          textScale={phoneLayout.textScale}
          testID="email-auth-error"
        />
      ) : null}

      <View style={styles.fields}>
        {mode === 'signup' ? (
          <AppTextField
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            editable={!isAuthPending}
            errorText={errors.name}
            helperText={t(
              'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi'
            )}
            label={t('fullAuth.email_auth.username')}
            placeholder={t('fullAuth.email_auth.daniel')}
            testID="email-auth-name"
            textContentType="username"
            value={name}
            textScale={phoneLayout.textScale}
            onChangeText={value => {
              setName(value);
              clearFieldError('name');
            }}
          />
        ) : null}
        <AppTextField
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!isAuthPending}
          errorText={errors.email}
          keyboardType="email-address"
          label={t('fullAuth.email_auth.email')}
          placeholder={t('fullAuth.email_auth.you_example_com')}
          testID="email-auth-email"
          textContentType="emailAddress"
          value={email}
          textScale={phoneLayout.textScale}
          onChangeText={value => {
            setEmail(value);
            clearFieldError('email');
          }}
        />
        <View style={styles.passwordField}>
          <AppSecureField
            autoCapitalize="none"
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            autoCorrect={false}
            editable={!isAuthPending}
            errorText={errors.password}
            label={t('fullAuth.email_auth.password')}
            placeholder="••••••••"
            testID="email-auth-password"
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            value={password}
            textScale={phoneLayout.textScale}
            onChangeText={value => {
              setPassword(value);
              clearFieldError('password');
            }}
            onSubmitEditing={() => {
              if (mode === 'login') void handleSubmit();
            }}
          />
          {mode === 'login' ? (
            <Pressable
              accessibilityState={{
                disabled: isAuthPending,
                busy: isAuthPending,
              }}
              accessibilityRole="button"
              disabled={isAuthPending}
              testID="email-auth-forgot-password"
              onPress={() => {
                const normalisedEmail = normalizeEmail(email);
                router.push({
                  pathname: '/forgot-password',
                  params: normalisedEmail ? { email: normalisedEmail } : {},
                });
              }}
              style={styles.textAction}
            >
              <Text style={styles.fieldLink} textScale={phoneLayout.textScale}>
                {t('fullAuth.email_auth.forgot_your_password')}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.fieldHint} textScale={phoneLayout.textScale}>
              {t('fullAuth.email_auth.use_6_or_more_characters')}
            </Text>
          )}
        </View>
        {mode === 'signup' ? (
          <AppSecureField
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            editable={!isAuthPending}
            errorText={errors.confirmPassword}
            label={t('fullAuth.email_auth.confirm_password')}
            placeholder="••••••••"
            testID="email-auth-confirm-password"
            textContentType="none"
            value={confirmPassword}
            textScale={phoneLayout.textScale}
            onChangeText={value => {
              setConfirmPassword(value);
              clearFieldError('confirmPassword');
            }}
            onSubmitEditing={() => void handleSubmit()}
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        {mode === 'signup' ? (
          <PaperAuthLegal
            testID="email-auth-legal"
            textScale={phoneLayout.textScale}
          />
        ) : null}
        <AppButton
          disabled={isAuthPending || duplicateEmail}
          fullWidth
          loading={isAuthPending}
          preserveLabelPositionOnLoading
          size="large"
          testID="email-auth-submit"
          title={copy.action}
          variant="accent"
          textScale={phoneLayout.textScale}
          onPress={() => void handleSubmit()}
        />
        <Pressable
          accessibilityState={{
            disabled: isAuthPending,
            busy: isAuthPending,
          }}
          accessibilityRole="button"
          disabled={isAuthPending}
          testID="email-auth-switch-mode"
          onPress={switchMode}
          style={styles.textAction}
        >
          <Text style={styles.switchCopy} textScale={phoneLayout.textScale}>
            {copy.switchLead}{' '}
            <Text style={styles.switchAction} textScale={phoneLayout.textScale}>
              {copy.switchAction}
            </Text>
          </Text>
        </Pressable>
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
  intro: { gap: mentaSpacing[2], paddingTop: mentaSpacing[2] },
  title: { color: mentaColors.text.primary, ...mentaTypography.heading },
  body: { color: mentaColors.text.secondary, ...mentaTypography.body },
  fields: { gap: mentaSpacing[3] },
  passwordField: { gap: mentaSpacing[1] },
  fieldLink: {
    color: mentaColors.action,
    textAlign: 'right',
    ...mentaTypography.caption,
  },
  fieldHint: { color: mentaColors.text.secondary, ...mentaTypography.caption },
  textAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
  },
  actions: {
    gap: mentaSpacing[3],
    marginTop: 'auto',
    paddingTop: mentaSpacing[2],
  },
  switchCopy: {
    color: mentaColors.text.secondary,
    textAlign: 'center',
    ...mentaTypography.body,
  },
  switchAction: {
    color: mentaColors.action,
    ...mentaTypography.bodySemibold,
  },
});
