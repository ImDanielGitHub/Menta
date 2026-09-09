import { useTranslation } from '@/lib/localization';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppSecureField,
  AppTopBar,
} from '@/components/ui';
import {
  AppScaledText as Text,
  AppTextScaleProvider,
} from '@/components/ui/AppScaledText';
import { CheckIcon } from '@/components/ui/icons';
import { usePaperAuthDraft } from '@/components/onboarding/PaperAuthSurface';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  clearPasswordRecoverySession,
  getPasswordRecoveryUserId,
} from '@/lib/auth/password-recovery-session';
import { passwordRecoverySupabase } from '@/lib/supabase';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { MINIMUM_NEW_PASSWORD_LENGTH } from '@/lib/auth/password-policy';

type RecoveryState = 'checking' | 'form' | 'expired' | 'updated';
type FieldErrors = Partial<Record<'password' | 'confirmation', string>>;

const getParam = (value?: string | string[]) =>
  typeof value === 'string' ? value : '';

export default function PasswordRecoveryScreen() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string | string[] }>();
  const draft = usePaperAuthDraft();
  const [state, setState] = useState<RecoveryState>(
    getParam(params.status) === 'invalid' ? 'expired' : 'checking'
  );
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submissionLockRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const restoreRecovery = async () => {
      if (getParam(params.status) === 'invalid') {
        await clearPasswordRecoverySession().catch(() => undefined);
        return;
      }
      const userId = await getPasswordRecoveryUserId();
      if (!mounted) return;
      setRecoveryUserId(userId);
      setState(userId ? 'form' : 'expired');
    };
    void restoreRecovery();
    return () => {
      mounted = false;
    };
  }, [params.status]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (serverError) setServerError('');
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (password.length < MINIMUM_NEW_PASSWORD_LENGTH) {
      nextErrors.password = t(
        'fullAuth.password_recovery.minimum_password_length',
        {
          length: MINIMUM_NEW_PASSWORD_LENGTH,
        }
      );
    }
    if (!confirmation) {
      nextErrors.confirmation = t(
        'fullAuth.password_recovery.confirm_new_password'
      );
    } else if (password !== confirmation) {
      nextErrors.confirmation = t(
        'fullAuth.password_recovery.passwords_mismatch'
      );
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (submissionLockRef.current || !validate()) return;

    if (!recoveryUserId) {
      setState('expired');
      return;
    }

    submissionLockRef.current = true;
    setSubmitting(true);
    setServerError('');

    try {
      const userResult = await passwordRecoverySupabase.auth.getUser();
      if (userResult.error || userResult.data.user?.id !== recoveryUserId) {
        try {
          await clearPasswordRecoverySession();
        } finally {
          setState('expired');
        }
        return;
      }

      const { error } = await passwordRecoverySupabase.auth.updateUser({
        password,
      });
      if (error) throw error;

      setPassword('');
      setConfirmation('');
      setState('updated');
    } catch (error: unknown) {
      setServerError(
        error instanceof Error
          ? error.message
          : t('fullAuth.password_recovery.could_not_change_now')
      );
    } finally {
      submissionLockRef.current = false;
      setSubmitting(false);
    }
  };

  const leaveRecovery = async (destination: string) => {
    try {
      await clearPasswordRecoverySession();
    } catch {
      // The isolated sign-out still runs in the cleanup helper's finally block.
    } finally {
      router.replace(destination as never);
    }
  };

  const closeAction = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('fullAuth.password_recovery.close_password_reset')}
      disabled={submitting}
      onPress={() => void leaveRecovery('/email-auth?mode=login')}
      style={styles.closeAction}
      testID="password-recovery-close"
    >
      <Text style={styles.closeText}>
        {t('fullAuth.password_recovery.close')}
      </Text>
    </Pressable>
  );
  const withTextEnvelope = (content: React.ReactElement) => (
    <AppTextScaleProvider scale={phoneLayout.textScale}>
      {content}
    </AppTextScaleProvider>
  );

  if (state === 'expired') {
    return withTextEnvelope(
      <AppScreen
        lane="focused"
        hasTabBar={false}
        scrollable
        testID="password-recovery-expired"
        contentContainerStyle={{
          ...styles.screen,
          paddingHorizontal: phoneLayout.screenInset,
        }}
      >
        <AppTopBar
          title={t('fullAuth.password_recovery.menta')}
          trailing={closeAction}
        />
        <View style={styles.expiredBody}>
          <View style={styles.intro}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('fullAuth.password_recovery.this_reset_link_has_expired')}
            </Text>
            <Text style={styles.body}>
              {t(
                'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p'
              )}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <AppButton
            fullWidth
            size="large"
            testID="password-recovery-request-link"
            title={t('fullAuth.password_recovery.request_a_new_link')}
            variant="accent"
            onPress={() => void leaveRecovery('/forgot-password')}
          />
          <AppButton
            fullWidth
            size="small"
            testID="password-recovery-sign-in-instead"
            title={t('fullAuth.password_recovery.sign_in_instead')}
            variant="ghost"
            onPress={() => void leaveRecovery('/email-auth?mode=login')}
          />
        </View>
      </AppScreen>
    );
  }

  if (state === 'updated') {
    return withTextEnvelope(
      <AppScreen
        lane="focused"
        hasTabBar={false}
        scrollable
        testID="password-recovery-updated"
        contentContainerStyle={{
          ...styles.screen,
          paddingHorizontal: phoneLayout.screenInset,
        }}
      >
        <AppTopBar title={t('fullAuth.password_recovery.menta')} />
        <View style={styles.updatedBody}>
          <View style={styles.intro}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('fullAuth.password_recovery.your_password_has_been_changed')}
            </Text>
            <Text style={styles.body}>
              {draft?.promise.trim()
                ? t(
                    'fullAuth.password_recovery.sign_in_with_new_password_draft'
                  )
                : t('fullAuth.password_recovery.sign_in_with_new_password')}
            </Text>
          </View>
          <View
            accessibilityLabel={t(
              'fullAuth.password_recovery.password_changed'
            )}
            accessibilityRole="image"
            style={styles.successMark}
            testID="password-recovery-success-mark"
          >
            <CheckIcon color={mentaColors.success} size={30} />
          </View>
          {draft?.promise.trim() ? (
            <View style={styles.draftReceipt} testID="password-recovery-draft">
              <Text style={styles.draftLabel}>
                {t('fullAuth.password_recovery.return_to')}
              </Text>
              <Text style={styles.draftPromise}>{draft.promise.trim()}</Text>
            </View>
          ) : null}
          <Text style={styles.secondaryBody}>
            {t(
              'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass'
            )}
          </Text>
        </View>
        <View style={styles.actions}>
          <AppButton
            fullWidth
            size="large"
            testID="password-recovery-sign-in"
            title={t('fullAuth.password_recovery.sign_in')}
            variant="accent"
            onPress={() => void leaveRecovery('/email-auth?mode=login')}
          />
        </View>
      </AppScreen>
    );
  }

  if (state === 'checking') {
    return withTextEnvelope(
      <AppScreen lane="focused" hasTabBar={false} testID="recovery-checking">
        <View style={styles.checking} />
      </AppScreen>
    );
  }

  return withTextEnvelope(
    <AppScreen
      automaticallyAdjustKeyboardInsets
      lane="focused"
      hasTabBar={false}
      scrollable
      testID="password-recovery"
      contentContainerStyle={{
        ...styles.screen,
        paddingHorizontal: phoneLayout.screenInset,
      }}
    >
      <AppTopBar
        title={t('fullAuth.password_recovery.menta')}
        trailing={closeAction}
      />
      <View style={styles.formBody}>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('fullAuth.password_recovery.choose_a_new_password')}
          </Text>
          <Text style={styles.body}>
            {t('fullAuth.password_recovery.use')} {MINIMUM_NEW_PASSWORD_LENGTH}{' '}
            {t(
              'fullAuth.password_recovery.or_more_characters_both_entries_must_match'
            )}
          </Text>
        </View>

        {serverError ? (
          <AppInlineNotice
            description={serverError}
            testID="password-recovery-error"
            title={t(
              'fullAuth.password_recovery.couldn_t_change_your_password'
            )}
            tone="error"
          />
        ) : null}

        <View style={styles.fields}>
          <AppSecureField
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect={false}
            editable={!submitting}
            errorText={fieldErrors.password}
            label={t('fullAuth.password_recovery.new_password')}
            placeholder={t('fullAuth.password_recovery.enter_new_password')}
            testID="password-recovery-password"
            textContentType="newPassword"
            value={password}
            onChangeText={value => {
              setPassword(value);
              clearFieldError('password');
            }}
          />
          <AppSecureField
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect={false}
            editable={!submitting}
            errorText={fieldErrors.confirmation}
            label={t('fullAuth.password_recovery.confirm_password')}
            placeholder={t('fullAuth.password_recovery.re_enter_new_password')}
            testID="password-recovery-confirmation"
            textContentType="newPassword"
            value={confirmation}
            onChangeText={value => {
              setConfirmation(value);
              clearFieldError('confirmation');
            }}
            onSubmitEditing={() => void handleUpdate()}
          />
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          disabled={submitting}
          fullWidth
          loading={submitting}
          preserveLabelPositionOnLoading
          size="large"
          testID="password-recovery-submit"
          title={t('fullAuth.password_recovery.change_my_password')}
          variant="accent"
          onPress={() => void handleUpdate()}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: mentaLayout.phoneFrameMax,
    paddingBottom: mentaSpacing[8],
    paddingTop: mentaSpacing[4],
    width: '100%',
  },
  checking: { flex: 1 },
  closeAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: mentaLayout.minimumTouchTarget,
  },
  closeText: {
    color: mentaColors.action,
    ...mentaTypography.bodySmallMedium,
  },
  formBody: {
    gap: mentaSpacing[6],
    paddingTop: mentaSpacing[6],
  },
  expiredBody: {
    flex: 1,
    paddingTop: mentaSpacing[12],
  },
  updatedBody: {
    flex: 1,
    gap: mentaSpacing[6],
    paddingTop: mentaSpacing[8],
  },
  intro: { gap: mentaSpacing[2] },
  title: { color: mentaColors.text.primary, ...mentaTypography.heading },
  body: { color: mentaColors.text.secondary, ...mentaTypography.bodySmall },
  secondaryBody: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
  },
  fields: { gap: mentaSpacing[4] },
  actions: {
    gap: mentaSpacing[2],
    marginTop: 'auto',
    paddingTop: mentaSpacing[8],
  },
  successMark: {
    alignItems: 'center',
    backgroundColor: mentaColors.successSoft,
    borderRadius: mentaRadii.round,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  draftReceipt: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.medium,
    gap: mentaSpacing[2],
    padding: mentaSpacing[4],
  },
  draftLabel: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.label,
    textTransform: 'uppercase',
  },
  draftPromise: {
    color: mentaColors.text.onPaper,
    ...mentaTypography.title,
  },
});
