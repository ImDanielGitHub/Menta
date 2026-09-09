import { useCallback, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { paywallManager } from '@/lib/paywall/manager';
import { requestEligibleSystemStoreReview } from '@/lib/store-review';
import { recoverActivationReview } from '@/lib/commitments/recover-activation-review';
import { trackProductEvent } from '@/lib/posthog';
import { useAuthStore } from '@/store/auth-store';
import { FeedbackCheckIn } from './FeedbackCheckIn';
import {
  acknowledgeOnboardingInvitationNavigation,
  getOnboardingInvitationReviewGate,
  hydrateOnboardingInvitationLifecycle,
  useOnboardingInvitationLifecycleStore,
} from '@/lib/navigation/onboarding-invitation-lifecycle';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';

const REVIEW_SETTLE_DELAY_MS = 2_000;

/**
 * Give StoreKit one contextual opportunity after Today has settled. Menta does
 * not show a rating pre-question and never calls the system request from a tap.
 */
export const StoreReviewRequestHost = ({ ready }: { ready: boolean }) => {
  const router = useRouter();
  const ownerId = useAuthStore(state => state.user?.id);
  const completedAccount = useAuthStore(
    state => state.isAuthenticated && state.hasCompletedOnboarding
  );
  const [feedbackOwner, setFeedbackOwner] = useState<string | null>(null);
  // Subscribe to semantic lifecycle changes, excluding navigation analytics
  // acknowledgement so that recording arrival cannot cancel its own prompt.
  useOnboardingInvitationLifecycleStore(state => {
    const entry = ownerId ? state.entries[ownerId] : undefined;
    return entry
      ? `${entry.firstPromiseId}:${entry.status}:${entry.outcome}`
      : null;
  });
  const invitationHydrated = useOnboardingInvitationLifecycleStore(
    state => state.hydrated
  );
  useOnboardingInvitationLifecycleStore(state =>
    ownerId ? state.blockedOwners[ownerId] : undefined
  );
  useOnboardingCompletionStore(state => state.pending);
  const [handoffHydrated, setHandoffHydrated] = useState(
    useOnboardingCompletionStore.persist.hasHydrated()
  );
  const [paywallVisible, setPaywallVisible] = useState(
    paywallManager.isVisible
  );
  const invitationGate = ownerId
    ? getOnboardingInvitationReviewGate(ownerId)
    : 'loading';

  useEffect(() => paywallManager.subscribeVisibility(setPaywallVisible), []);
  useEffect(() => {
    void hydrateOnboardingInvitationLifecycle();
    const unsubscribe = useOnboardingCompletionStore.persist.onFinishHydration(
      () => setHandoffHydrated(true)
    );
    if (useOnboardingCompletionStore.persist.hasHydrated())
      setHandoffHydrated(true);
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (
        !ready ||
        paywallVisible ||
        !completedAccount ||
        !invitationHydrated ||
        !handoffHydrated
      )
        return undefined;
      if (invitationGate === 'loading') return undefined;

      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const task = InteractionManager.runAfterInteractions(() => {
        timer = setTimeout(() => {
          void (async () => {
            if (!ownerId) return;
            const canPresent = () =>
              !cancelled &&
              !paywallManager.isVisible &&
              useAuthStore.getState().user?.id === ownerId;
            const gate = getOnboardingInvitationReviewGate(ownerId);
            if (gate === 'pending' || gate === 'loading') {
              trackProductEvent('Feedback Journey', {
                action: 'deferred',
                source: 'activation_check_in',
                stage: 'invitation',
              });
              trackProductEvent('Store Review Request', {
                capability: 'unavailable',
                outcome: 'invitation_pending',
                trigger: 'onboarding_activation',
              });
              return;
            }
            if (gate === 'legacy') {
              // Historical activation alone cannot prove an invite was finished.
              // Established users retain the independent three-accepted-proof path.
              await requestEligibleSystemStoreReview(
                Date.now(),
                undefined,
                () =>
                  canPresent() &&
                  getOnboardingInvitationReviewGate(ownerId) === 'legacy'
              );
              return;
            }
            if (await acknowledgeOnboardingInvitationNavigation(ownerId)) {
              if (canPresent())
                trackProductEvent('Accountability Invite Journey', {
                  source: 'onboarding',
                  context: 'present',
                  stage: 'navigation_completed',
                });
            }
            const key = `@menta/feedback-check-in:v1:${ownerId}`;
            const activationAt = await recoverActivationReview(ownerId);
            const previousOpportunity = await AsyncStorage.getItem(key);
            if (
              !canPresent() ||
              getOnboardingInvitationReviewGate(ownerId) !== 'complete'
            )
              return;
            // A later visit keeps this independent of the native sheet and the
            // invite handoff. Never stack two prompts on the activation visit.
            if (
              activationAt &&
              previousOpportunity &&
              previousOpportunity !== 'done' &&
              Date.now() - Date.parse(previousOpportunity) >= 60_000
            ) {
              setFeedbackOwner(ownerId);
              trackProductEvent('Feedback Journey', {
                action: 'shown',
                source: 'activation_check_in',
              });
              return;
            }
            if (activationAt && !previousOpportunity) {
              await AsyncStorage.setItem(key, new Date().toISOString());
            }
            if (!cancelled && useAuthStore.getState().user?.id === ownerId) {
              await requestEligibleSystemStoreReview(
                Date.now(),
                ownerId,
                () =>
                  canPresent() &&
                  getOnboardingInvitationReviewGate(ownerId) === 'complete'
              );
            }
          })().catch(() => undefined);
        }, REVIEW_SETTLE_DELAY_MS);
      });

      return () => {
        cancelled = true;
        setFeedbackOwner(null);
        task.cancel();
        if (timer !== null) clearTimeout(timer);
      };
    }, [
      completedAccount,
      handoffHydrated,
      invitationGate,
      invitationHydrated,
      ownerId,
      paywallVisible,
      ready,
    ])
  );

  const finishFeedback = () => {
    if (feedbackOwner) {
      void AsyncStorage.setItem(
        `@menta/feedback-check-in:v1:${feedbackOwner}`,
        'done'
      ).catch(() => undefined);
    }
    setFeedbackOwner(null);
  };
  const close = () => {
    finishFeedback();
    trackProductEvent('Feedback Journey', {
      action: 'dismissed',
      source: 'activation_check_in',
    });
  };

  return (
    <FeedbackCheckIn
      visible={Boolean(
        ownerId &&
        feedbackOwner === ownerId &&
        ready &&
        !paywallVisible &&
        getOnboardingInvitationReviewGate(ownerId) === 'complete'
      )}
      onClose={close}
      onAnswer={answer => {
        finishFeedback();
        trackProductEvent('Feedback Journey', {
          action: answer,
          source: 'activation_check_in',
        });
        router.push({
          pathname: '/report-issue',
          params: {
            mode: 'feedback',
            source: 'activation_feedback',
            newReport: '1',
            ...(answer === 'positive' ? { title: 'What is working well' } : {}),
          },
        });
      }}
    />
  );
};
