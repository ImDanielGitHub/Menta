import React from 'react';
import { useRouter } from 'expo-router';
import {
  PaperAuthForm,
  type PaperAuthSubmitInput,
} from '@/components/onboarding/PaperAuthForm';
import { useAuthStore } from '@/store/auth-store';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';
import { trackProductEvent } from '@/lib/posthog';

export default function RegisterScreen() {
  const router = useRouter();
  const { isLoading, register } = useAuthStore();
  const stageEmailConfirmation = useEmailConfirmationStore(
    state => state.stage
  );

  const handleSubmit = async (input: PaperAuthSubmitInput) => {
    trackProductEvent('Authentication Result', {
      flow: 'signup',
      method: 'password',
      outcome: 'started',
    });
    try {
      const result = await register(input.email, input.password, input.name);
      if (result.status === 'confirmation_required') {
        let persistenceFailed = false;
        try {
          await stageEmailConfirmation({
            email: result.email,
            username: input.name,
            expectedUserId: result.userId,
            fromOnboarding: false,
          });
        } catch {
          persistenceFailed = true;
        }
        router.replace(
          persistenceFailed
            ? '/email-confirmation?status=storage'
            : '/email-confirmation'
        );
      }
      trackProductEvent('Authentication Result', {
        flow: 'signup',
        method: 'password',
        outcome:
          result.status === 'session_confirmed' ? 'succeeded' : 'handoff',
      });
    } catch (error) {
      trackProductEvent('Authentication Result', {
        flow: 'signup',
        method: 'password',
        outcome: 'failed',
      });
      throw error;
    }
  };

  return (
    <PaperAuthForm
      isLoading={isLoading}
      mode="signup"
      onSubmit={handleSubmit}
      onSwitchMode={() => router.replace('/email-auth?mode=login')}
      testID="register"
    />
  );
}
