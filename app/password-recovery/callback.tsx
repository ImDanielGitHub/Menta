import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/localization';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppScreen } from '@/components/ui';
import { FullScreenLoading } from '@/components/ui/FullScreenLoading';
import { passwordRecoverySupabase } from '@/lib/supabase';
import {
  clearPasswordRecoverySession,
  markPasswordRecoverySession,
} from '@/lib/auth/password-recovery-session';

type RecoveryExchangeData = {
  session: { user: { id: string } } | null;
  redirectType?: string | null;
};

const getSingleCode = (value?: string | string[]) =>
  typeof value === 'string' && value.length > 0 && value.length <= 2048
    ? value
    : null;

export default function PasswordRecoveryCallbackScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const exchangeStartedRef = useRef(false);
  const [message, setMessage] = useState(() =>
    t('fullAuth.password_recovery_callback.checking_secure_reset_link')
  );

  useEffect(() => {
    if (exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;

    const rejectRecovery = async () => {
      try {
        await clearPasswordRecoverySession();
      } catch {
        // clearPasswordRecoverySession still signs out in its finally block.
      } finally {
        router.replace('/password-recovery?status=invalid');
      }
    };

    const exchangeRecoveryCode = async () => {
      const code = getSingleCode(params.code);
      if (!code) {
        await rejectRecovery();
        return;
      }

      try {
        const result =
          await passwordRecoverySupabase.auth.exchangeCodeForSession(code);
        const data = result.data as RecoveryExchangeData;

        if (
          result.error ||
          data.redirectType !== 'recovery' ||
          !data.session?.user.id
        ) {
          await rejectRecovery();
          return;
        }

        await markPasswordRecoverySession(data.session.user.id);
        setMessage(
          t('fullAuth.password_recovery_callback.reset_link_verified')
        );
        router.replace('/password-recovery');
      } catch {
        await rejectRecovery();
      }
    };

    void exchangeRecoveryCode();
  }, [params.code, router]);

  return (
    <AppScreen lane="focused" hasTabBar={false} testID="recovery-callback">
      <FullScreenLoading message={message} />
    </AppScreen>
  );
}
