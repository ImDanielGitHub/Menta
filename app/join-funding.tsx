import React, { useEffect, useMemo, useRef } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  JoinConfirmedReceiptState,
  JoinFundingFailureState,
  JoinFundingLoadingState,
  JoinFundingReviewState,
  JoinInsufficientMomentaState,
  JoinMembershipWithoutReceiptState,
  JoinResultUnknownRuntimeState,
} from '@/components/challenge/JoinFundingStates';
import {
  challengeJoinTargetKey,
  formatChallengeJoinDue,
  normaliseChallengeJoinTarget,
  type ChallengeJoinTarget,
} from '@/lib/challenges/join-funding-contract';
import { useAuthStore } from '@/store/auth-store';
import { useChallengeStore } from '@/store/challenge-store';
import { useInviteStore } from '@/store/invite-store';
import { useJoinFundingStore } from '@/store/join-funding-store';

import { useTranslation } from '@/lib/localization';
const firstParam = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
};

export default function JoinFundingRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    challengeId?: string | string[];
    code?: string | string[];
  }>();
  const user = useAuthStore(state => state.user);
  const pendingInvite = useInviteStore(state => state.pending);
  const clearPendingInviteForUser = useInviteStore(
    state => state.clearPendingForUser
  );
  const fetchUserChallenges = useChallengeStore(
    state => state.fetchUserChallenges
  );
  const openJoin = useJoinFundingStore(state => state.open);
  const joinState = useJoinFundingStore();

  const parameterChallengeId = firstParam(params.challengeId);
  const parameterInviteCode = firstParam(params.code);
  const inviteCode =
    parameterInviteCode ??
    (pendingInvite?.type === 'challenge' &&
    (!pendingInvite.ownerUserId || pendingInvite.ownerUserId === user?.id)
      ? pendingInvite.code
      : null);
  const resolvedTarget = useMemo(
    () =>
      normaliseChallengeJoinTarget({
        challengeId: parameterChallengeId,
        inviteCode,
      }),
    [parameterChallengeId, inviteCode]
  );
  const routeKey = `${parameterChallengeId ?? ''}:${parameterInviteCode ?? ''}`;
  const heldTarget = useRef<{
    accountId: string;
    routeKey: string;
    target: ChallengeJoinTarget;
  } | null>(null);
  if (resolvedTarget && user?.id) {
    heldTarget.current = {
      accountId: user.id,
      routeKey,
      target: resolvedTarget,
    };
  }
  // Clearing a consumed invite must not erase/reopen this mounted receipt.
  // Keep only this route entry's target, never an earlier account's target.
  const target =
    resolvedTarget ??
    (heldTarget.current?.accountId === user?.id &&
    heldTarget.current?.routeKey === routeKey
      ? heldTarget.current.target
      : null);
  const targetKey = target ? challengeJoinTargetKey(target) : null;
  const ownsVisibleState =
    Boolean(user?.id) &&
    joinState.accountId === user?.id &&
    joinState.targetKey === targetKey;

  useEffect(() => {
    if (!user?.id || !target) return;
    void openJoin(user.id, target);
  }, [openJoin, target, targetKey, user?.id]);

  useEffect(() => {
    if (
      joinState.phase !== 'confirmed' ||
      !joinState.receipt ||
      !user?.id ||
      !ownsVisibleState
    ) {
      return;
    }

    void fetchUserChallenges(user.id);
    if (
      pendingInvite?.type === 'challenge' &&
      target?.inviteCode === pendingInvite.code
    ) {
      clearPendingInviteForUser(user.id, target.inviteCode);
    }
  }, [
    clearPendingInviteForUser,
    fetchUserChallenges,
    joinState.phase,
    joinState.receipt,
    ownsVisibleState,
    pendingInvite,
    target?.inviteCode,
    user?.id,
  ]);

  useEffect(() => {
    if (
      !user?.id ||
      !ownsVisibleState ||
      (joinState.phase !== 'member_without_receipt' &&
        !(joinState.phase === 'failed' && joinState.terminalInviteFailure))
    ) {
      return;
    }

    if (joinState.phase === 'member_without_receipt') {
      void fetchUserChallenges(user.id);
    }
    if (
      pendingInvite?.type === 'challenge' &&
      target?.inviteCode === pendingInvite.code
    ) {
      clearPendingInviteForUser(user.id, target.inviteCode);
    }
  }, [
    clearPendingInviteForUser,
    fetchUserChallenges,
    joinState.phase,
    joinState.terminalInviteFailure,
    ownsVisibleState,
    pendingInvite,
    target?.inviteCode,
    user?.id,
  ]);

  const goBack = () => {
    router.replace('/(tabs)');
  };

  const dismissInviteAndGoBack = () => {
    if (
      user?.id &&
      pendingInvite?.type === 'challenge' &&
      target?.inviteCode === pendingInvite.code
    ) {
      clearPendingInviteForUser(user.id, target.inviteCode);
    }
    goBack();
  };

  const openChallenge = (challengeId: string) => {
    router.replace(`/challenges/${challengeId}` as never);
  };

  const handleRetry = () => {
    if (!user?.id || !target) return;
    if (joinState.retry === 'status') {
      void joinState.reconcile(user.id);
      return;
    }
    if (joinState.retry === 'join') {
      void joinState.confirm(user.id);
      return;
    }
    void joinState.open(user.id, target);
  };

  const content = (() => {
    if (!user?.id) {
      return (
        <JoinFundingFailureState
          title={t('groups.join.sign_in_before')}
          message={t('groups.join.no_debit')}
          onBack={goBack}
        />
      );
    }

    if (!target) {
      return (
        <JoinFundingFailureState
          title={t('groups.join.incomplete')}
          message={t('groups.join.open_current')}
          onBack={goBack}
        />
      );
    }

    if (!ownsVisibleState || joinState.phase === 'idle') {
      return <JoinFundingLoadingState onBack={goBack} />;
    }

    if (joinState.phase === 'loading') {
      return <JoinFundingLoadingState onBack={goBack} />;
    }

    if (joinState.phase === 'ready' && joinState.quote) {
      return (
        <JoinFundingReviewState
          quote={joinState.quote}
          joining={false}
          onJoin={() => void joinState.confirm(user.id)}
          onMaybeLater={dismissInviteAndGoBack}
          onBack={goBack}
        />
      );
    }

    if (joinState.phase === 'joining' && joinState.quote) {
      return (
        <JoinFundingReviewState
          quote={joinState.quote}
          joining
          onJoin={() => undefined}
          onMaybeLater={goBack}
          onBack={goBack}
        />
      );
    }

    if (joinState.phase === 'insufficient' && joinState.quote) {
      return (
        <JoinInsufficientMomentaState
          quote={joinState.quote}
          onEarn={() => router.push('/momenta')}
          onKeepCreating={() => router.replace('/(tabs)')}
          onBack={goBack}
        />
      );
    }

    if (joinState.phase === 'confirmed' && joinState.receipt) {
      const receipt = joinState.receipt;
      return (
        <JoinConfirmedReceiptState
          receipt={receipt}
          firstDueLabel={formatChallengeJoinDue(receipt.firstDueAt)}
          onOpen={() =>
            receipt.accountabilityRole === 'reviewer' ||
            receipt.accountabilityRole === 'supporter'
              ? router.replace({
                  pathname: '/promise-accountability',
                  params: {
                    challengeId: receipt.challengeId,
                    source: 'invite_receipt',
                  },
                })
              : receipt.accountabilityRole
                ? openChallenge(receipt.challengeId)
                : receipt.groupId
                  ? router.replace(`/groups/${receipt.groupId}` as never)
                  : openChallenge(receipt.challengeId)
          }
          onBackToToday={() => router.replace('/(tabs)')}
          onBack={goBack}
        />
      );
    }

    if (joinState.phase === 'unknown') {
      return (
        <JoinResultUnknownRuntimeState
          checking={joinState.retry === null}
          message={joinState.message}
          onCheck={() => void joinState.reconcile(user.id)}
          onBackToSafety={() => router.replace('/(tabs)')}
          onBack={goBack}
        />
      );
    }

    if (joinState.phase === 'member_without_receipt') {
      const challengeId =
        joinState.quote?.challengeId ?? joinState.target?.challengeId;
      return (
        <JoinMembershipWithoutReceiptState
          message={
            joinState.message ??
            'No new Momenta debit is being claimed on this screen.'
          }
          onOpen={() => {
            if (!challengeId) return;
            if (
              joinState.quote?.accountabilityRole === 'reviewer' ||
              joinState.quote?.accountabilityRole === 'supporter'
            ) {
              router.replace({
                pathname: '/promise-accountability',
                params: {
                  challengeId,
                  source: 'existing_invite',
                },
              });
              return;
            }
            openChallenge(challengeId);
          }}
          onBack={goBack}
        />
      );
    }

    return (
      <JoinFundingFailureState
        message={
          joinState.message ??
          'Menta did not receive an authoritative join result.'
        }
        actionLabel={joinState.retry ? 'Try again' : undefined}
        onAction={joinState.retry ? handleRetry : undefined}
        onBack={goBack}
      />
    );
  })();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {content}
    </>
  );
}
