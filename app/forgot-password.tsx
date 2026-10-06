import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/localization';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PaperAuthCheckEmail,
  PaperAuthResetForm,
} from '@/components/onboarding/PaperAuthReset';
import { passwordRecoverySupabase } from '@/lib/supabase';
import { PASSWORD_RECOVERY_REDIRECT_URL } from '@/lib/auth/password-recovery-config';
import { takePasswordResetPrefill } from '@/lib/auth/password-reset-prefill';
import { formatPasswordResetResendTime } from '@/lib/auth/password-reset-copy';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

const RESET_LINK_COOLDOWN_SECONDS = 45;

export default function ForgotPasswordScreen() {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string | string[] }>();
  const [email, setEmail] = useState(() =>
    takePasswordResetPrefill(params.prefill)
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(
    null
  );
  const [now, setNow] = useState(() => Date.now());

  const resendSecondsRemaining = useMemo(() => {
    if (!resendAvailableAt) return 0;
    return Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  }, [now, resendAvailableAt]);

  useEffect(() => {
    if (!sent || resendSecondsRemaining === 0) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [resendSecondsRemaining, sent]);

  const handleReset = async () => {
    if (loading || (sent && resendSecondsRemaining > 0)) return;

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      setErrorMessage(
        t('fullAuth.forgot_password.enter_email_tied_to_account')
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage(t('fullAuth.forgot_password.enter_valid_email'));
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const { error } =
        await passwordRecoverySupabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: PASSWORD_RECOVERY_REDIRECT_URL,
        });

      if (error) throw error;

      setSent(true);
      setResendAvailableAt(Date.now() + RESET_LINK_COOLDOWN_SECONDS * 1000);
      setNow(Date.now());
    } catch {
      setErrorMessage(t('fullAuth.forgot_password.could_not_send_reset_email'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.replace('/email-auth?mode=login');
  };

  if (sent) {
    return (
      <PaperAuthCheckEmail
        email={email}
        errorMessage={errorMessage}
        loading={loading}
        resendAvailableAtLabel={
          resendAvailableAt
            ? formatPasswordResetResendTime(resendAvailableAt, locale)
            : undefined
        }
        resendSecondsRemaining={resendSecondsRemaining}
        testID="forgot-password-success"
        onBackToSignIn={handleBackToSignIn}
        onSendAnother={() => void handleReset()}
      />
    );
  }

  return (
    <PaperAuthResetForm
      email={email}
      errorMessage={errorMessage}
      loading={loading}
      testID="forgot-password"
      onBackToSignIn={handleBackToSignIn}
      onEmailChange={value => {
        setEmail(value);
        if (errorMessage) setErrorMessage('');
      }}
      onSubmit={() => void handleReset()}
    />
  );
}
