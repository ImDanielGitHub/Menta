import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { paywallManager } from '@/lib/paywall/manager';
import { requestEligibleSystemStoreReview } from '@/lib/store-review';
import { recoverActivationReview } from '@/lib/commitments/recover-activation-review';
import { trackProductEvent } from '@/lib/posthog';
import { captureMessage } from '@/lib/sentry';
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
const feedbackKey = (ownerId: string) =>
  `@menta/feedback-check-in:v1:${ownerId}`;
const invitationAllowsCheckIn = (ownerId: string) => {
  const gate = getOnboardingInvitationReviewGate(ownerId);
  // Missing historical metadata is not an active invitation. The activation
  // receipt remains required before showing feedback; never fabricate an invite
  // completion or navigation receipt for these established accounts.
  return gate === 'complete' || gate === 'legacy';
};
const reportFeedbackFailure = (stage: 'today' | 'feedback') => {
  trackProductEvent('Feedback Journey', {
    action: 'failed',
    source: 'activation_check_in',
    stage,
  });
  captureMessage('feedback_check_in_failed', 'warning', {
    tags: { flow: 'activation_check_in', stage },
  });
};

/**
 * Show the account's check-in after activation and completed invitation handoff.
 * Established accounts retain the independent accepted-proof review opportunity.
 */
export const StoreReviewRequestHost = ({ ready }: { ready: boolean }) => {
  const router = useRouter();
  const ownerId = useAuthStore(state => state.user?.id);
  const completedAccount = useAuthStore(
    state => state.isAuthenticated && state.hasCompletedOnboarding
  );
  const [feedbackOwner, setFeedbackOwner] = useState<string | null>(null);
  const consumedOwners = useRef(new Set<string>());
  const focused = useRef(false);
  const pendingAnswer = useRef<{
    ownerId: string;
    answer: 'positive' | 'improve';
  } | null>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;
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
      focused.current = true;
      if (
        !ready ||
        paywallVisible ||
        !completedAccount ||
        !invitationHydrated ||
        !handoffHydrated
      )
        return () => {
          focused.current = false;
          pendingAnswer.current = null;
        };
      if (invitationGate === 'loading')
        return () => {
          focused.current = false;
          pendingAnswer.current = null;
        };

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
            if (
              gate === 'complete' &&
              (await acknowledgeOnboardingInvitationNavigation(ownerId))
            ) {
              if (canPresent())
                trackProductEvent('Accountability Invite Journey', {
                  source: 'onboarding',
                  context: 'present',
                  stage: 'navigation_completed',
                });
            }
            const activationAt = await recoverActivationReview(ownerId);
            const previousOpportunity = await AsyncStorage.getItem(
              feedbackKey(ownerId)
            );
            if (!canPresent() || !invitationAllowsCheckIn(ownerId)) return;
            // A saved timestamp is an unconsumed opportunity from older clients.
            // No extra Today visit or one-minute wait is required after inviting.
            if (
              activationAt &&
              previousOpportunity !== 'done' &&
              !consumedOwners.current.has(ownerId)
            ) {
              setFeedbackOwner(ownerId);
              trackProductEvent('Feedback Journey', {
                action: 'shown',
                source: 'activation_check_in',
              });
              return;
            }
            // The separate accepted-proof path remains available after the
            // check-in was consumed; an activation marker alone does not fire
            // a second native request behind a negative answer or dismissal.
            if (canPresent()) {
              await requestEligibleSystemStoreReview(
                Date.now(),
                undefined,
                () => canPresent() && invitationAllowsCheckIn(ownerId)
              );
            }
          })().catch(() => {
            if (!cancelled) reportFeedbackFailure('today');
          });
        }, REVIEW_SETTLE_DELAY_MS);
      });

      return () => {
        cancelled = true;
        focused.current = false;
        pendingAnswer.current = null;
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

  const canContinue = useCallback((id: string) => {
    const auth = useAuthStore.getState();
    return (
      focused.current &&
      readyRef.current &&
      !paywallManager.isVisible &&
      auth.user?.id === id &&
      auth.isAuthenticated &&
      auth.hasCompletedOnboarding &&
      invitationAllowsCheckIn(id)
    );
  }, []);

  const finishFeedback = (): string | null => {
    if (
      !feedbackOwner ||
      !canContinue(feedbackOwner) ||
      consumedOwners.current.has(feedbackOwner)
    )
      return null;
    const id = feedbackOwner;
    consumedOwners.current.add(id);
    void AsyncStorage.setItem(feedbackKey(id), 'done').catch(() =>
      reportFeedbackFailure('feedback')
    );
    setFeedbackOwner(null);
    return id;
  };
  const close = () => {
    if (!finishFeedback()) return;
    trackProductEvent('Feedback Journey', {
      action: 'dismissed',
      source: 'activation_check_in',
    });
  };

  const continueAfterDismiss = useCallback(() => {
    const pending = pendingAnswer.current;
    pendingAnswer.current = null;
    if (!pending || !canContinue(pending.ownerId)) return;
    if (pending.answer === 'positive') {
      void requestEligibleSystemStoreReview(Date.now(), pending.ownerId, () =>
        canContinue(pending.ownerId)
      )
        .then(result => {
          if (result.outcome === 'failed') reportFeedbackFailure('feedback');
        })
        .catch(() => reportFeedbackFailure('feedback'));
      return;
    }
    router.push({
      pathname: '/report-issue',
      params: {
        mode: 'feedback',
        source: 'activation_feedback',
        newReport: '1',
      },
    });
  }, [canContinue, router]);

  return (
    <FeedbackCheckIn
      visible={Boolean(
        ownerId &&
        feedbackOwner === ownerId &&
        ready &&
        completedAccount &&
        !paywallVisible &&
        invitationAllowsCheckIn(ownerId)
      )}
      onClose={close}
      onDismiss={continueAfterDismiss}
      onAnswer={answer => {
        const id = finishFeedback();
        if (!id) return;
        pendingAnswer.current = { ownerId: id, answer };
        trackProductEvent('Feedback Journey', {
          action: answer,
          source: 'activation_check_in',
        });
      }}
    />
  );
};
