import { useTranslation } from '@/lib/localization';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  PaperAuthButton,
  PaperAuthContextCard,
  PaperAuthFrame,
  PaperAuthLegal,
  PaperAuthNotice,
  PaperAuthTextField,
  PaperAuthTextLink,
  paperAuthFonts,
  paperAuthTokens,
  type PaperAuthFieldRef,
  type PaperAuthTextFieldProps,
} from '@/components/onboarding/PaperAuthSurface';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { MINIMUM_NEW_PASSWORD_LENGTH } from '@/lib/auth/password-policy';

export type PaperAuthMode = 'login' | 'signup';

export type PaperAuthSubmitInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type PaperAuthFieldErrors = Partial<
  Record<'name' | 'email' | 'password' | 'confirmPassword', string>
>;

export interface PaperAuthFormProps {
  mode: PaperAuthMode;
  onSubmit: (input: PaperAuthSubmitInput) => Promise<void>;
  onForgotPassword?: (email: string) => void;
  onSwitchMode?: () => void;
  onSubmitError?: (
    message: string,
    error: unknown,
    input: PaperAuthSubmitInput
  ) => void;
  isLoading?: boolean;
  initialEmail?: string;
  initialName?: string;
  testID?: string;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());
const validateName = (value: string) => /^[a-zA-Z0-9_]+$/.test(value);

const errorMessage = (
  error: unknown,
  mode: PaperAuthMode,
  t: ReturnType<typeof useTranslation>['t']
) =>
  error instanceof Error
    ? error.message
    : mode === 'login'
      ? t('fullAuth.residual.paper_auth.fallback_sign_in')
      : t('fullAuth.residual.paper_auth.fallback_create');

const isDuplicateAccountError = (message: string) =>
  /already|exists|registered/i.test(message);

export const PaperAuthForm: React.FC<PaperAuthFormProps> = ({
  mode,
  onSubmit,
  onForgotPassword,
  onSwitchMode,
  onSubmitError,
  isLoading = false,
  initialEmail = '',
  initialName = '',
  testID = 'paper-auth-form',
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<PaperAuthFieldErrors>({});
  const [serverError, setServerError] = useState('');

  const nameRef = useRef<PaperAuthFieldRef>(null);
  const emailRef = useRef<PaperAuthFieldRef>(null);
  const passwordRef = useRef<PaperAuthFieldRef>(null);
  const confirmPasswordRef = useRef<PaperAuthFieldRef>(null);

  useEffect(() => {
    setErrors({});
    setServerError('');
  }, [mode]);

  const copy = useMemo(
    () =>
      mode === 'signup'
        ? {
            title: isLoading
              ? t(
                  'fullAuth.component_onboarding_paperauthform.creating_your_account'
                )
              : t(
                  'fullAuth.component_onboarding_paperauthform.create_your_account'
                ),
            subtitle: isLoading
              ? t(
                  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create'
                )
              : t(
                  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou'
                ),
            action: isLoading
              ? t('fullAuth.residual.paper_auth.creating_account_action')
              : t('fullAuth.residual.paper_auth.create_account_action'),
            lead: t('fullAuth.residual.paper_auth.already_have_account'),
            switchAction: t('fullAuth.residual.paper_auth.switch_sign_in'),
          }
        : {
            title: isLoading
              ? t('fullAuth.component_onboarding_paperauthform.signing_you_in')
              : t(
                  'fullAuth.component_onboarding_paperauthform.sign_in_with_email'
                ),
            subtitle: isLoading
              ? t(
                  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_'
                )
              : t(
                  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise'
                ),
            action: isLoading
              ? t('fullAuth.residual.paper_auth.signing_in_action')
              : t('fullAuth.residual.paper_auth.sign_in_action'),
            lead: t('fullAuth.residual.paper_auth.new_to_menta'),
            switchAction: t('fullAuth.residual.paper_auth.switch_create'),
          },
    [isLoading, mode, t]
  );

  const clearFieldError = (field: keyof PaperAuthFieldErrors) => {
    setErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (serverError) setServerError('');
  };

  const validate = () => {
    const nextErrors: PaperAuthFieldErrors = {};
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);

    if (mode === 'signup') {
      if (!cleanName) {
        nextErrors.name = t('fullAuth.residual.paper_auth.choose_username');
      } else if (cleanName.length < 3) {
        nextErrors.name = t(
          'fullAuth.residual.paper_auth.minimum_three_characters'
        );
      } else if (!validateName(cleanName)) {
        nextErrors.name = t('fullAuth.residual.paper_auth.username_characters');
      }
    }

    if (!cleanEmail) {
      nextErrors.email = t('fullAuth.residual.paper_auth.account_email');
    } else if (!validateEmail(cleanEmail)) {
      nextErrors.email = t('fullAuth.residual.paper_auth.valid_email');
    }

    if (!password) {
      nextErrors.password =
        mode === 'login'
          ? t('fullAuth.residual.paper_auth.enter_password')
          : t('fullAuth.residual.paper_auth.create_password');
    } else if (
      mode === 'signup' &&
      password.length < MINIMUM_NEW_PASSWORD_LENGTH
    ) {
      nextErrors.password = t('fullAuth.residual.paper_auth.password_minimum', {
        length: MINIMUM_NEW_PASSWORD_LENGTH,
      });
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        nextErrors.confirmPassword = t(
          'fullAuth.residual.paper_auth.confirm_password'
        );
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = t(
          'fullAuth.residual.paper_auth.passwords_match'
        );
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!validate()) return;

    const input: PaperAuthSubmitInput = {
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      confirmPassword,
    };

    try {
      await onSubmit(input);
    } catch (error: unknown) {
      const message = errorMessage(error, mode, t);
      if (mode === 'signup' && isDuplicateAccountError(message)) {
        setErrors(current => ({
          ...current,
          email: t('fullAuth.residual.paper_auth.duplicate_email'),
        }));
        setServerError('');
      } else {
        setServerError(message);
      }
      onSubmitError?.(message, error, input);
    }
  };

  const hasValidFields =
    validateEmail(email) &&
    password.length > 0 &&
    (mode === 'login' ||
      (name.trim().length >= 3 &&
        validateName(name.trim()) &&
        password.length >= MINIMUM_NEW_PASSWORD_LENGTH &&
        confirmPassword.length > 0 &&
        password === confirmPassword));
  const isErrorState = Boolean(
    serverError || errors.email?.includes('already')
  );
  const submitDisabled = !hasValidFields || isErrorState;

  const fieldProps = (
    props: Omit<PaperAuthTextFieldProps, 'label' | 'value' | 'onChangeText'>
  ) => props;

  return (
    <PaperAuthFrame testID={testID}>
      <View style={styles.page} testID={`${testID}-${mode}`}>
        <PaperAuthContextCard
          compact
          label={t('fullAuth.component_onboarding_paperauthform.after_this')}
          testID={`${testID}-context`}
          value={t('fullAuth.residual.paper_auth.return_to_promise')}
        />

        <View style={styles.headingWrap}>
          <PaperAuthHeadingWithState
            mode={mode}
            errorState={isErrorState}
            title={copy.title}
            subtitle={copy.subtitle}
          />
        </View>

        {serverError ? (
          <PaperAuthNotice
            message={serverError}
            testID={`${testID}-error`}
            title={t(
              'fullAuth.component_onboarding_paperauthform.check_the_details'
            )}
          />
        ) : null}

        <View style={styles.fields}>
          {mode === 'signup' ? (
            <PaperAuthTextField
              {...fieldProps({
                autoCapitalize: 'none',
                autoCorrect: false,
                errorText: errors.name,
                placeholder: t(
                  'fullAuth.component_onboarding_paperauthform.daniel'
                ),
                textContentType: 'username',
              })}
              label={t('fullAuth.component_onboarding_paperauthform.username')}
              nextFieldRef={emailRef}
              ref={nameRef}
              testID={`${testID}-name`}
              value={name}
              editable={!isLoading}
              onChangeText={value => {
                setName(value);
                clearFieldError('name');
              }}
            />
          ) : null}

          <PaperAuthTextField
            {...fieldProps({
              autoCapitalize: 'none',
              autoCorrect: false,
              errorText: errors.email,
              keyboardType: 'email-address',
              placeholder: t(
                'fullAuth.component_onboarding_paperauthform.you_example_com'
              ),
              textContentType: 'emailAddress',
              autoComplete: 'email',
              nextFieldRef: passwordRef,
            })}
            label={t('fullAuth.component_onboarding_paperauthform.email')}
            ref={mode === 'signup' ? emailRef : undefined}
            testID={`${testID}-email`}
            value={email}
            editable={!isLoading}
            onChangeText={value => {
              setEmail(value);
              clearFieldError('email');
            }}
          />

          <PaperAuthTextField
            {...fieldProps({
              autoCapitalize: 'none',
              autoCorrect: false,
              errorText: errors.password,
              labelAccessory:
                mode === 'signup' ? (
                  <Text style={styles.fieldHint}>
                    {MINIMUM_NEW_PASSWORD_LENGTH}
                    {t(
                      'fullAuth.component_onboarding_paperauthform.characters'
                    )}
                  </Text>
                ) : onForgotPassword ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onForgotPassword(email)}
                    testID={`${testID}-forgot-password`}
                  >
                    <Text style={styles.forgotPassword}>
                      {t(
                        'fullAuth.component_onboarding_paperauthform.forgot_your_password'
                      )}
                    </Text>
                  </Pressable>
                ) : null,
              nextFieldRef: mode === 'signup' ? confirmPasswordRef : undefined,
              onSubmitEditing: mode === 'login' ? handleSubmit : undefined,
              placeholder: '••••••••',
              secure: true,
              textContentType: mode === 'login' ? 'password' : 'newPassword',
              autoComplete:
                mode === 'login' ? 'current-password' : 'new-password',
            })}
            label={t('fullAuth.component_onboarding_paperauthform.password')}
            ref={passwordRef}
            testID={`${testID}-password`}
            value={password}
            editable={!isLoading}
            onChangeText={value => {
              setPassword(value);
              clearFieldError('password');
            }}
          />

          {mode === 'signup' ? (
            <PaperAuthTextField
              {...fieldProps({
                autoCapitalize: 'none',
                autoCorrect: false,
                errorText: errors.confirmPassword,
                nextFieldRef: undefined,
                onSubmitEditing: handleSubmit,
                placeholder: '••••••••',
                secure: true,
                textContentType: 'none',
                autoComplete: 'off',
              })}
              label={t(
                'fullAuth.component_onboarding_paperauthform.confirm_password'
              )}
              ref={confirmPasswordRef}
              testID={`${testID}-confirm-password`}
              value={confirmPassword}
              editable={!isLoading}
              onChangeText={value => {
                setConfirmPassword(value);
                clearFieldError('confirmPassword');
              }}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          <PaperAuthButton
            disabled={submitDisabled}
            loading={isLoading}
            loadingProgress={0.56}
            loadingTitle={copy.action}
            testID={`${testID}-submit`}
            title={copy.action}
            variant={submitDisabled ? 'muted' : 'action'}
            onPress={() => void handleSubmit()}
          />
          {onSwitchMode ? (
            <PaperAuthTextLink
              action={copy.switchAction}
              lead={copy.lead}
              testID={`${testID}-switch-mode`}
              onPress={onSwitchMode}
            />
          ) : null}
        </View>
        {mode === 'signup' ? (
          <PaperAuthLegal testID={`${testID}-legal`} />
        ) : null}
      </View>
    </PaperAuthFrame>
  );
};

const PaperAuthHeadingWithState: React.FC<{
  errorState: boolean;
  mode: PaperAuthMode;
  title: string;
  subtitle: string;
}> = ({ mode, errorState, title, subtitle }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.headingBlock}>
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      <Text style={styles.subtitle}>
        {mode === 'signup' && errorState
          ? t('fullAuth.residual.paper_auth.error_state')
          : subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: 16,
    maxWidth: mentaLayout.taskLane,
    paddingTop: 20,
    width: '100%',
  },
  headingWrap: {
    width: '100%',
  },
  headingBlock: {
    gap: 6,
    maxWidth: 332,
  },
  heading: {
    color: paperAuthTokens.text,
    fontFamily: paperAuthFonts.newsreaderMedium,
    fontSize: 34,
    letterSpacing: -0.68,
    lineHeight: 37,
  },
  subtitle: {
    color: paperAuthTokens.muted,
    fontFamily: paperAuthFonts.inter,
    fontSize: 13,
    lineHeight: 18,
  },
  fields: {
    gap: 10,
    width: '100%',
  },
  fieldHint: {
    color: paperAuthTokens.muted,
    fontFamily: paperAuthFonts.inter,
    fontSize: 11,
    lineHeight: 16,
  },
  forgotPassword: {
    color: paperAuthTokens.muted,
    fontFamily: paperAuthFonts.inter,
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    gap: 8,
    marginTop: 'auto',
    paddingTop: 6,
    width: '100%',
  },
});
