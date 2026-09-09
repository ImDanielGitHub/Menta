import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Session } from '@supabase/supabase-js';

import { AppScreen, FullScreenLoading } from '@/components/ui';
import {
  getEmailConfirmationSupabase,
  type SupabaseUser,
} from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import {
  isEmailConfirmationForSession,
  useEmailConfirmationStore,
} from '@/store/email-confirmation-store';

type CallbackFailure = 'expired' | 'invalid' | 'failed';

type EmailConfirmationExchangeData = {
  session: Session | null;
  user?: SupabaseUser | null;
};

const getSingleParam = (value?: string | string[]): string | null =>
  typeof value === 'string' && value.length > 0 && value.length <= 2048
    ? value
    : null;

export const classifyEmailConfirmationFailure = (
  value: unknown
): CallbackFailure => {
  const message = String(
    (value as { code?: unknown; message?: unknown } | null)?.code ??
      (value as { message?: unknown } | null)?.message ??
      value ??
      ''
  ).toLowerCase();

  if (message.includes('expired') || message.includes('otp_expired')) {
    return 'expired';
  }
  if (
    message.includes('invalid') ||
    message.includes('access_denied') ||
    message.includes('pkce') ||
    message.includes('code verifier')
  ) {
    return 'invalid';
  }
  return 'failed';
};

export default function EmailConfirmationCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
    error_description?: string | string[];
  }>();
  const exchangeStartedRef = useRef(false);
  const [message, setMessage] = useState('Checking your confirmation link…');

  useEffect(() => {
    if (exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;

    const returnToConfirmation = (
      status: CallbackFailure | 'account-mismatch'
    ) => {
      router.replace(`/email-confirmation?status=${status}`);
    };

    const exchangeConfirmationCode = async () => {
      const providerError =
        getSingleParam(params.error_code) ??
        getSingleParam(params.error_description) ??
        getSingleParam(params.error);
      if (providerError) {
        returnToConfirmation(classifyEmailConfirmationFailure(providerError));
        return;
      }

      const code = getSingleParam(params.code);
      if (!code) {
        returnToConfirmation('invalid');
        return;
      }

      const confirmationStore = useEmailConfirmationStore.getState();
      let pending = confirmationStore.pending;
      if (!confirmationStore.hasHydrated) {
        try {
          pending = await confirmationStore.hydrate();
        } catch {
          // A valid PKCE exchange is still authoritative if the auxiliary
          // screen state could not be restored.
          pending = null;
        }
      }

      try {
        const emailConfirmationSupabase = getEmailConfirmationSupabase();
        const result =
          await emailConfirmationSupabase.auth.exchangeCodeForSession(code);
        const data = result.data as EmailConfirmationExchangeData;
        const session = data.session;
        const sessionUser = session?.user ?? data.user ?? null;

        if (result.error || !session || !sessionUser?.id) {
          returnToConfirmation(classifyEmailConfirmationFailure(result.error));
          return;
        }

        if (pending && !isEmailConfirmationForSession(pending, sessionUser)) {
          await emailConfirmationSupabase.auth.signOut({ scope: 'local' });
          returnToConfirmation('account-mismatch');
          return;
        }

        await useAuthStore.getState().setUserAndSession(sessionUser, session);
        const confirmedAuth = useAuthStore.getState();
        if (
          !confirmedAuth.isAuthenticated ||
          confirmedAuth.user?.id !== sessionUser.id
        ) {
          returnToConfirmation('failed');
          return;
        }

        if (pending) {
          await useEmailConfirmationStore
            .getState()
            .clearForEmail(pending.email);
        }
        setMessage('Email confirmed. Restoring your promise…');
        router.replace('/onboarding');
      } catch (error) {
        returnToConfirmation(classifyEmailConfirmationFailure(error));
      }
    };

    void exchangeConfirmationCode();
  }, [
    params.code,
    params.error,
    params.error_code,
    params.error_description,
    router,
  ]);

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      testID="email-confirmation-callback"
    >
      <FullScreenLoading message={message} />
    </AppScreen>
  );
}
