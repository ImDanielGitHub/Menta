import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import PublicGroupPreviewModal from '@/components/group/PublicGroupPreviewModal';
import {
  IPadTwoPaneWorkspace,
  useIPadPortraitWorkspace,
} from '@/components/ipad/ipad-workspace';
import { ConfirmDestructiveSheet } from '@/components/ui/ConfirmDestructiveSheet';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import {
  AppDivider,
  AppListRow,
  AppScreen,
  AppSectionHeader,
  AppTopBar,
} from '@/components/ui/AppShell';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GroupAccountabilityBoard } from '@/components/group/GroupAccountabilityBoard';
import {
  AlertTriangleIcon,
  CheckIcon,
  LogOutIcon,
  MoreVerticalIcon,
  SettingsIcon,
  Share2Icon,
  ShieldIcon,
  Trash2Icon,
  UsersIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useGroupPendingReviews } from '@/hooks/useGroupPendingReviews';
import { useGroupAccountabilityBoard } from '@/hooks/useGroupAccountabilityBoard';
import { usePromiseAccountability } from '@/hooks/usePromiseAccountability';
import {
  getGroupDetailErrorKind,
  useGroupDetailData,
  type DetailMember,
  type DisplayChallenge,
} from '@/hooks/useGroupDetail';
import {
  selectGroupBoardState,
  type GroupBoardAccessReason,
  type GroupBoardMediaProof,
} from '@/lib/loop/group-accountability-board';
import { openCreateGroupChallenge } from '@/lib/navigation/create-entry';
import { showToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useGroupStore } from '@/store/group-store';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';
type GroupDetailParams = {
  id?: string | string[];
  created?: string | string[];
};

type ActionNotice = {
  kind: 'success' | 'error' | 'warning';
  title: string;
  message: string;
} | null;

type GroupProofType = 'photo' | 'video' | 'text';

const roleRank: Record<DetailMember['role'], number> = {
  owner: 0,
  admin: 1,
  moderator: 2,
  member: 3,
};

const localiseRole = (role: DetailMember['role'], localise: Localise) => {
  if (role === 'owner') return localise('groups.source.role.owner');
  if (role === 'admin') return localise('groups.source.role.admin');
  if (role === 'moderator') return localise('groups.source.role.moderator');
  return localise('groups.source.role.member');
};

type Localise = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const privacyLabel = (
  privacy: string | null | undefined,
  localise: Localise
) => {
  switch ((privacy || '').toLowerCase()) {
    case 'public':
      return localise('groups.source.privacy.discoverable');
    case 'secret':
      return localise('groups.source.privacy.invite_link_only');
    case 'private':
    default:
      return localise('groups.source.privacy.invite_only');
  }
};

const privacyGroupLabel = (
  privacy: string | null | undefined,
  localise: Localise
) => {
  switch ((privacy || '').toLowerCase()) {
    case 'public':
      return localise('groups.detail.privacy_group.discoverable');
    case 'secret':
      return localise('groups.detail.privacy_group.invite_link_only');
    case 'private':
    default:
      return localise('groups.detail.privacy_group.invite_only');
  }
};

const isGroupProofType = (value: unknown): value is GroupProofType =>
  value === 'photo' || value === 'video' || value === 'text';

const getChallengeProofType = (
  challenge?: DisplayChallenge
): GroupProofType => {
  const raw =
    challenge?.verification_method ?? challenge?.verification_type ?? 'photo';
  return isGroupProofType(raw) ? raw : 'photo';
};

const groupColors = {
  text: {
    primary: mentaColors.text.primary,
    secondary: mentaColors.text.secondary,
    tertiary: mentaColors.text.muted,
    inverse: mentaColors.canvas,
  },
  border: {
    primary: mentaColors.border,
    secondary: mentaColors.border,
  },
  status: {
    error: mentaColors.danger,
    success: mentaColors.success,
    warning: mentaColors.warning,
  },
  background: {
    tertiary: mentaColors.skeleton,
  },
} as const;

export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const { id, created } = useLocalSearchParams<GroupDetailParams>();
  const groupId = Array.isArray(id) ? id[0] : id;
  const createdParam = Array.isArray(created) ? created[0] : created;
  const router = useRouter();
  const colors = groupColors;
  const usesIPadWorkspace = useIPadPortraitWorkspace();
  const phoneLayout = usePhoneLayout();
  const { user } = useAuthStore();
  const {
    group,
    members,
    challenges,
    isInitialLoading,
    isError,
    isPaused,
    hasCachedData,
    errorKind,
    lastUpdatedAt,
    refetch,
  } = useGroupDetailData(groupId);
  const userGroups = useGroupStore(state => state.userGroups);
  const joinGroup = useGroupStore(state => state.joinGroup);
  const leaveGroup = useGroupStore(state => state.leaveGroup);
  const deleteGroup = useGroupStore(state => state.deleteGroup);
  const archiveFailedGroup = useGroupStore(state => state.archiveFailedGroup);

  const [refreshing, setRefreshing] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [joinPreviewVisible, setJoinPreviewVisible] = useState(false);
  const [isWorking, setWorking] = useState(false);
  const [actionNotice, setActionNotice] = useState<ActionNotice>(null);
  const [createdReceiptDismissed, setCreatedReceiptDismissed] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<'leave' | 'delete' | null>(
    null
  );
  const encouragementBusyRef = useRef(new Set<string>());

  const pendingReviews = useGroupPendingReviews(
    groupId,
    user?.id,
    challenges.map(challenge => challenge.id)
  );
  const promiseAccountability = usePromiseAccountability(
    group?.kind === 'promise' ? challenges[0]?.id : null
  );
  const promiseRole = promiseAccountability.data?.members.find(
    member => member.id === user?.id
  )?.role;
  const canSubmitGroupProof =
    group?.kind !== 'promise' ||
    promiseRole === 'owner' ||
    promiseRole === 'partner';

  const sortedMembers = useMemo(
    () =>
      [...members].sort((left, right) => {
        const roleDiff = roleRank[left.role] - roleRank[right.role];
        if (roleDiff !== 0) return roleDiff;
        return (left.user.username || '').localeCompare(
          right.user.username || ''
        );
      }),
    [members]
  );

  const membership = sortedMembers.find(member => member.user_id === user?.id);
  const isMember = Boolean(
    groupId && (userGroups.includes(groupId) || membership)
  );
  const isOwner = Boolean(group && user?.id === group.owner_id);
  const canManage =
    isOwner || membership?.role === 'admin' || membership?.role === 'moderator';
  const memberCount =
    sortedMembers.length > 0
      ? sortedMembers.length
      : (group?.member_count ?? 0);
  const streak = group?.current_streak ?? 0;
  const goal = group?.streak_goal ?? group?.duration_days ?? 0;
  const isReadOnly = group?.status === 'failed' || group?.status === 'expired';
  const createdInviteReceiptVisible =
    createdParam === '1' && isMember && !isReadOnly && !createdReceiptDismissed;
  const boardMembers = useMemo(
    () =>
      sortedMembers.map(member => ({
        userId: member.user_id,
        name:
          member.user.display_name ||
          member.user.username ||
          t('groups.source.member.fallback'),
        avatarUrl: member.user.avatar_url,
        isCurrentUser: member.user_id === user?.id,
      })),
    [sortedMembers, t, user?.id]
  );
  const boardChallengeIds = useMemo(
    () => challenges.map(challenge => challenge.id),
    [challenges]
  );
  const accountabilityBoard = useGroupAccountabilityBoard({
    userId: user?.id,
    groupId,
    challengeIds: boardChallengeIds,
    members: boardMembers,
    participantUserIds:
      group?.kind === 'promise'
        ? (promiseAccountability.data?.members
            .filter(
              member => member.role === 'owner' || member.role === 'partner'
            )
            .map(member => member.id) ?? [])
        : undefined,
    enabled:
      isMember &&
      challenges.length > 0 &&
      !isReadOnly &&
      (group?.kind !== 'promise' || Boolean(promiseAccountability.data)),
  });
  const livePendingReviewCount = pendingReviews.isSuccess
    ? pendingReviews.data
    : undefined;
  // A pending proof is not proof that this viewer may review it. Only the
  // role-aware review read can expose the review action.
  const pendingReviewCount = livePendingReviewCount;
  const displayedPendingReviewCount = pendingReviewCount ?? 0;
  const hasPendingReviews =
    pendingReviewCount !== undefined && pendingReviewCount > 0;
  const firstSharedChallenge = challenges[0];
  const hasSharedChallenge = Boolean(firstSharedChallenge);
  const ownerMember = sortedMembers.find(
    member => member.user_id === group?.owner_id
  );
  const publicReviewRuleLabel =
    firstSharedChallenge?.allow_self_review === false
      ? t('groups.source.review.rule')
      : undefined;
  const boardNeedsLiveRead =
    isMember && hasSharedChallenge && !isReadOnly && Boolean(groupId);
  const boardIsInitialLoading =
    isInitialLoading ||
    (boardNeedsLiveRead &&
      accountabilityBoard.isInitialLoading &&
      !promiseAccountability.isError);
  const boardHasError =
    isError ||
    (boardNeedsLiveRead &&
      (accountabilityBoard.isError || promiseAccountability.isError));
  const boardIsPaused =
    isPaused ||
    (boardNeedsLiveRead && accountabilityBoard.fetchStatus === 'paused');
  const boardState = selectGroupBoardState({
    hasGroup: Boolean(group),
    groupStatus: group?.status,
    groupPrivacy: group?.privacy,
    isMember,
    isOwner,
    hasPromise: hasSharedChallenge,
    isInitialLoading: boardIsInitialLoading,
    hasCachedData: hasCachedData || accountabilityBoard.hasSnapshot,
    hasError: boardHasError,
    isPaused: boardIsPaused,
  });
  const unavailableReason: GroupBoardAccessReason = boardIsPaused
    ? 'offline'
    : errorKind ||
      (accountabilityBoard.error
        ? getGroupDetailErrorKind(accountabilityBoard.error)
        : group
          ? 'unknown'
          : 'not-found');
  const boardUpdatedAtValues = [
    lastUpdatedAt,
    boardNeedsLiveRead ? accountabilityBoard.lastUpdatedAt : undefined,
  ].filter((value): value is number => Boolean(value));
  const boardLastUpdatedAt =
    boardUpdatedAtValues.length > 0
      ? Math.min(...boardUpdatedAtValues)
      : undefined;
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), accountabilityBoard.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [accountabilityBoard, refetch]);

  const openInvite = useCallback(() => {
    if (!group) return;
    setActionNotice(null);
    setMoreVisible(false);
    if (group.kind === 'promise' && firstSharedChallenge) {
      router.push({
        pathname: '/promise-accountability',
        params: {
          challengeId: firstSharedChallenge.id,
          source: 'group_board',
          originGroupId: group.id,
        },
      });
      return;
    }
    router.push({
      pathname: '/group-invite',
      params: { groupId: group.id, groupName: group.name },
    });
  }, [firstSharedChallenge, group, router]);

  const handleJoin = useCallback(
    async (expectedCost: number) => {
      if (!user?.id) {
        setActionNotice({
          kind: 'error',
          title: t('groups.tab.sign_in_title'),
          message: t('groups.detail.sign_in_detail'),
        });
        return;
      }
      if (!groupId || isWorking) return;
      setActionNotice(null);
      setWorking(true);
      try {
        await joinGroup(user.id, groupId, expectedCost);
        setJoinPreviewVisible(false);
        void emitConfirmedOutcome(
          'group-joined',
          createConfirmedReceipt('group-membership', groupId)
        );
        setActionNotice({
          kind: 'success',
          title: t('groups.detail.joined_title'),
          message: t('groups.detail.joined_detail'),
        });
        await refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t('groups.detail.join_failed_detail');
        setActionNotice({
          kind: 'error',
          title: t('groups.detail.join_failed'),
          message,
        });
      } finally {
        setWorking(false);
      }
    },
    [groupId, isWorking, joinGroup, refresh, t, user?.id]
  );

  const handleLeave = useCallback(async () => {
    if (!user?.id || !groupId || isWorking) return;

    setActionNotice(null);
    void emitHaptic({ type: 'destructive-commit' });
    setWorking(true);
    try {
      const outcome = await leaveGroup(user.id, groupId);
      if (outcome.kind === 'confirmed') {
        void emitConfirmedOutcome(
          'entity-left',
          createConfirmedReceipt('destructive-change', outcome.receipt.groupId)
        );
        showToast.success(
          t('groups.detail.left_title'),
          t('groups.detail.left_detail')
        );
        router.replace('/(tabs)/groups');
        return;
      }

      const resultUnknown = outcome.kind === 'unknown';
      if (resultUnknown) {
        void emitHaptic({ type: 'unknown' });
      } else if (outcome.kind === 'blocked') {
        void emitHaptic({ type: 'blocked', reason: 'validation' });
      } else {
        void emitHaptic({ type: 'failed', operation: 'delete' });
      }
      const message = resultUnknown
        ? t('groups.detail.leave_unknown_detail')
        : outcome.message;
      setActionNotice({
        kind: resultUnknown ? 'warning' : 'error',
        title: resultUnknown
          ? t('groups.detail.leave_unknown_title')
          : t('groups.detail.leave_failed_title'),
        message,
      });
    } finally {
      setWorking(false);
      setConfirmTarget(null);
    }
  }, [groupId, isWorking, leaveGroup, router, t, user?.id]);

  const handleDelete = useCallback(async () => {
    if (!groupId || !isOwner || isWorking) return;

    setActionNotice(null);
    setWorking(true);
    try {
      const outcome = await deleteGroup(groupId);
      if (outcome.kind === 'confirmed') {
        void emitConfirmedOutcome(
          'entity-deleted',
          createConfirmedReceipt('destructive-change', outcome.receipt.groupId)
        );
        showToast.success(
          t('groups.detail.deleted_title'),
          t('groups.detail.deleted_detail')
        );
        router.replace('/(tabs)/groups');
        return;
      }

      const resultUnknown = outcome.kind === 'unknown';
      if (resultUnknown) {
        void emitHaptic({ type: 'unknown' });
      } else if (outcome.kind === 'blocked') {
        void emitHaptic({ type: 'blocked', reason: 'permission' });
      } else {
        void emitHaptic({ type: 'failed', operation: 'delete' });
      }
      const message = resultUnknown
        ? t('groups.detail.delete_unknown_detail')
        : outcome.message;
      setActionNotice({
        kind: resultUnknown ? 'warning' : 'error',
        title: resultUnknown
          ? t('groups.detail.delete_unknown_title')
          : t('groups.detail.delete_failed_title'),
        message,
      });
    } finally {
      setWorking(false);
      setConfirmTarget(null);
    }
  }, [deleteGroup, groupId, isOwner, isWorking, router, t]);

  const requestLeave = useCallback(() => {
    setMoreVisible(false);
    setConfirmTarget('leave');
  }, []);

  const requestDelete = useCallback(() => {
    setMoreVisible(false);
    setConfirmTarget('delete');
  }, []);

  const handleArchive = useCallback(async () => {
    if (!groupId || !user?.id || isWorking) return;
    setActionNotice(null);
    setWorking(true);
    try {
      const outcome = await archiveFailedGroup(groupId, user.id);
      if (!outcome.success) {
        setActionNotice({
          kind: 'error',
          title: t('groups.detail.not_archived_title'),
          message: outcome.error || t('groups.detail.archive_failed_detail'),
        });
        return;
      }
      showToast.success(
        t('groups.detail.archived_title'),
        t('groups.detail.archived_detail')
      );
      router.replace('/(tabs)/groups');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('groups.detail.archive_failed_detail');
      setActionNotice({
        kind: 'error',
        title: t('groups.detail.archive_failed_title'),
        message,
      });
    } finally {
      setWorking(false);
    }
  }, [archiveFailedGroup, groupId, isWorking, router, t, user?.id]);

  const openSettings = useCallback(() => {
    if (!groupId) return;
    setMoreVisible(false);
    router.push({ pathname: '/group-settings', params: { id: groupId } });
  }, [groupId, router]);

  const openMembers = useCallback(() => {
    if (!groupId) return;
    setMoreVisible(false);
    if (group?.kind === 'promise' && firstSharedChallenge) {
      router.push({
        pathname: '/promise-accountability',
        params: {
          challengeId: firstSharedChallenge.id,
          source: 'group_board',
          originGroupId: groupId,
        },
      });
      return;
    }
    router.push({ pathname: '/group-members', params: { id: groupId } });
  }, [firstSharedChallenge, group?.kind, groupId, router]);

  const openReviewQueue = useCallback(() => {
    if (!groupId) return;
    router.push({
      pathname: '/review-queue',
      params: { groupId, entryPoint: 'group_board' },
    });
  }, [groupId, router]);

  const openBoardReview = useCallback(
    (submissionId?: string) => {
      if (!groupId) return;
      router.push({
        pathname: '/review-queue',
        params: {
          groupId,
          entryPoint: 'group_board',
          ...(submissionId ? { submissionId } : {}),
        },
      });
    },
    [groupId, router]
  );

  const openBoardProof = useCallback(
    (proof: GroupBoardMediaProof) => {
      router.push({
        pathname: '/challenges/[id]',
        params: {
          id: proof.challengeId,
          tab: 'proof',
          view: 'proof',
          proofId: proof.id,
        },
      });
    },
    [router]
  );

  const toggleBoardEncouragement = useCallback(
    async (proof: GroupBoardMediaProof, encouraged: boolean) => {
      if (
        !user?.id ||
        proof.contributorId === user.id ||
        encouragementBusyRef.current.has(proof.id)
      ) {
        return;
      }

      encouragementBusyRef.current.add(proof.id);
      setActionNotice(null);
      try {
        if (encouraged) {
          const { error } = await supabase.from('proof_encouragements').insert({
            submission_id: proof.id,
            user_id: user.id,
          });
          if (error && error.code !== '23505') throw error;
        } else {
          const { error } = await supabase
            .from('proof_encouragements')
            .delete()
            .eq('submission_id', proof.id)
            .eq('user_id', user.id);
          if (error) throw error;
        }
        await accountabilityBoard.refetch();
      } catch {
        setActionNotice({
          kind: 'error',
          title: t(
            'todayProof.source.accountability.encouragement_update_failed'
          ),
          message: t('todayProof.promise.refresh_failed'),
        });
      } finally {
        encouragementBusyRef.current.delete(proof.id);
      }
    },
    [accountabilityBoard, t, user?.id]
  );

  const createChallenge = useCallback(() => {
    if (!groupId) return;
    openCreateGroupChallenge({
      router,
      source: 'group_detail',
      groupId,
    });
  }, [groupId, router]);

  const openGroupProofSubmission = useCallback(() => {
    if (!canSubmitGroupProof) return;
    if (!firstSharedChallenge) {
      createChallenge();
      return;
    }

    router.push({
      pathname: '/verification',
      params: {
        challengeId: firstSharedChallenge.id,
        groupId,
        verificationType: getChallengeProofType(firstSharedChallenge),
        suggestedVerificationType: getChallengeProofType(firstSharedChallenge),
        source: 'group_detail',
      },
    });
  }, [
    canSubmitGroupProof,
    createChallenge,
    firstSharedChallenge,
    groupId,
    router,
  ]);

  if (boardState === 'loading' && !group) {
    return (
      <AppScreen
        lane="working"
        testID="group-detail-screen"
        safeArea
        scrollable
        padding
        hasTabBar={false}
        contentContainerStyle={styles.loadingContent}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <AppTopBar onBack={() => backOrReplace(router, '/(tabs)/groups')} />

        <View style={styles.hero}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('groups.detail.opening')}
          </Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            {t('groups.detail.opening_detail')}
          </Text>
        </View>

        <View
          accessibilityLabel={t('groups.detail.opening')}
          accessibilityRole="progressbar"
          style={[
            styles.loadingBoard,
            {
              borderColor: colors.border.primary,
              backgroundColor: mentaColors.surface,
            },
          ]}
        >
          <LoadingLine width="72%" height={28} />
          <LoadingLine width="46%" height={18} />
          <LoadingLine width="100%" height={56} />
        </View>

        <View style={styles.statsGrid}>
          <LoadingMetric label={t('groups.detail.promises')} />
          <LoadingMetric label={t('groups.detail.reviews')} />
          <LoadingMetric label={t('groups.detail.window')} />
        </View>

        <View>
          <AppSectionHeader
            title={t('groups.detail.promises')}
            subtitle={t('groups.detail.preparing_promises')}
          />
          <View style={styles.loadingRows}>
            <LoadingRow titleWidth="62%" metaWidth="34%" />
            <LoadingRow titleWidth="52%" metaWidth="44%" />
          </View>
        </View>

        <View>
          <AppSectionHeader
            title={t('groups.admin.members')}
            subtitle={t('groups.detail.checking_members')}
          />
          <View style={styles.loadingRows}>
            <LoadingRow titleWidth="48%" metaWidth="28%" avatar />
            <LoadingRow titleWidth="58%" metaWidth="32%" avatar />
            <LoadingRow titleWidth="42%" metaWidth="26%" avatar />
          </View>
        </View>
      </AppScreen>
    );
  }

  if (!group) {
    return (
      <AppScreen
        lane="working"
        testID="group-detail-screen"
        safeArea
        padding
        hasTabBar={false}
        contentContainerStyle={styles.failedContent}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <AppTopBar onBack={() => backOrReplace(router, '/(tabs)/groups')} />
        <View style={styles.failedHero}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('groups.detail.load_failed')}
          </Text>
          <View
            style={[
              styles.failedBanner,
              {
                borderColor: colors.status.error,
                backgroundColor: mentaColors.dangerSoft,
              },
            ]}
          >
            <AlertTriangleIcon size={20} color={colors.status.error} />
            <View style={styles.actionNoticeText}>
              <Text
                style={[
                  styles.actionNoticeTitle,
                  { color: colors.text.primary },
                ]}
              >
                {t('groups.detail.unavailable')}
              </Text>
              <Text
                style={[
                  styles.actionNoticeMessage,
                  { color: colors.text.secondary },
                ]}
              >
                {t('groups.detail.unavailable_detail')}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.failedPanel,
              {
                borderColor: colors.border.primary,
                backgroundColor: mentaColors.surface,
              },
            ]}
          >
            <Text
              style={[styles.actionNoticeTitle, { color: colors.text.primary }]}
            >
              {t('groups.detail.what_you_can_do')}
            </Text>
            <Text
              style={[
                styles.actionNoticeMessage,
                { color: colors.text.secondary },
              ]}
            >
              {t('groups.detail.what_you_can_do_detail')}
            </Text>
          </View>
        </View>
        <View style={styles.failedActions}>
          <AppButton
            title={t('groups.tab.try_again')}
            onPress={() => void refresh()}
            fullWidth
            size="large"
          />
          <AppButton
            title={t('groups.tab.back_groups')}
            variant="outline"
            onPress={() => router.replace('/(tabs)/groups')}
            fullWidth
            size="large"
          />
        </View>
      </AppScreen>
    );
  }

  const isAssignedPaperState =
    boardState === 'empty' ||
    boardState === 'public-preview' ||
    boardState === 'read-only';
  const memberRoleLabel = isOwner
    ? t('groups.source.role.owner')
    : membership?.role
      ? localiseRole(membership.role, t)
      : t('groups.source.role.member');
  const groupMemberLabel = t('groups.source.member.count', {
    count: memberCount,
  });
  const groupHeaderSubtitle = isMember
    ? t('groups.source.header.member', {
        role: memberRoleLabel,
        members: groupMemberLabel,
      })
    : t('groups.source.header.public', {
        privacy: privacyLabel(group.privacy, t),
        members: groupMemberLabel,
      });

  return (
    <AppScreen
      lane="working"
      maxWidth={usesIPadWorkspace ? 1180 : undefined}
      testID="group-detail-screen"
      safeArea
      scrollable
      hasTabBar={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.text.primary}
        />
      }
      contentContainerStyle={
        isAssignedPaperState ? styles.paperStateContent : styles.content
      }
    >
      <Stack.Screen options={{ headerShown: false }} />

      <IPadTwoPaneWorkspace
        enabled={usesIPadWorkspace}
        testID="group-detail-ipad-workspace"
        primary={
          <>
            <View style={styles.detailHeader} testID="group-detail-header">
              <AppTopBar
                title={group.name}
                subtitle={groupHeaderSubtitle}
                onBack={() => backOrReplace(router, '/(tabs)/groups')}
                trailing={
                  <AppButton
                    title=""
                    variant="outline"
                    size="small"
                    onPress={() => setMoreVisible(true)}
                    icon={
                      <MoreVerticalIcon size={18} color={colors.text.primary} />
                    }
                    accessibilityLabel={t('groups.board.actions')}
                  />
                }
              />
            </View>

            <ErrorBoundary level="component">
              <GroupAccountabilityBoard
                state={boardState}
                showHeader={false}
                groupName={group.name}
                groupDescription={group.description}
                roleLabel={isMember ? memberRoleLabel : undefined}
                snapshot={accountabilityBoard.data}
                currentUserId={user?.id}
                promiseTitle={firstSharedChallenge?.title}
                promiseDescription={firstSharedChallenge?.description}
                proofType={getChallengeProofType(firstSharedChallenge)}
                contentWidth={
                  usesIPadWorkspace
                    ? mentaLayout.immersiveFrameMax
                    : phoneLayout.contentWidth
                }
                memberCount={memberCount}
                ownerName={
                  ownerMember?.user.display_name || ownerMember?.user.username
                }
                reviewRuleLabel={publicReviewRuleLabel}
                endedDate={group.end_date}
                pendingReviewCount={pendingReviewCount}
                lastUpdatedAt={boardLastUpdatedAt}
                unavailableReason={unavailableReason}
                readOnlyStatus={
                  group.status === 'failed' || group.status === 'expired'
                    ? group.status
                    : undefined
                }
                isWorking={isWorking}
                onRetry={() => void refresh()}
                onOpenReview={openBoardReview}
                onOpenProof={openBoardProof}
                onToggleEncouragement={(proof, encouraged) =>
                  void toggleBoardEncouragement(proof, encouraged)
                }
                onSubmitProof={
                  canSubmitGroupProof ? openGroupProofSubmission : undefined
                }
                onAddPromise={
                  isOwner && group.kind !== 'promise'
                    ? createChallenge
                    : undefined
                }
                onInvite={isOwner ? openInvite : undefined}
                onJoin={() => setJoinPreviewVisible(true)}
                onDismissPreview={() => backOrReplace(router, '/(tabs)/groups')}
                onOpenMembers={openMembers}
                onOpenHistory={() => {
                  if (firstSharedChallenge) {
                    router.push({
                      pathname: '/challenges/[id]',
                      params: {
                        id: firstSharedChallenge.id,
                        tab: 'proof',
                        view: 'history',
                      },
                    });
                  }
                }}
                onBackToGroups={() => router.replace('/(tabs)/groups')}
                onEnterCode={() => router.push('/join-group')}
              />
            </ErrorBoundary>

            {createdInviteReceiptVisible ? (
              <View
                testID="group-created-next-step"
                style={[
                  styles.createdReceipt,
                  {
                    borderColor: colors.border.primary,
                    backgroundColor: mentaColors.surface,
                  },
                ]}
              >
                <View style={styles.createdReceiptHeader}>
                  <View style={styles.createdReceiptIcon}>
                    <CheckIcon size={18} color={colors.text.inverse} />
                  </View>
                  <View style={styles.createdReceiptCopy}>
                    <Text
                      style={[
                        styles.createdReceiptTitle,
                        { color: colors.text.primary },
                      ]}
                    >
                      {t('groups.detail.created_title')}
                    </Text>
                    <Text
                      style={[
                        styles.createdReceiptBody,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {privacyGroupLabel(group.privacy, t)} ·{' '}
                      {t('groups.detail.joined_count', {
                        count: memberCount,
                      })}
                    </Text>
                  </View>
                </View>
                <AppButton
                  title={t('groups.detail.invite')}
                  onPress={openInvite}
                  icon={<Share2Icon size={16} color={colors.text.inverse} />}
                  fullWidth
                  disabled={isWorking}
                />
                <View style={styles.createdReceiptSecondaryActions}>
                  <AppButton
                    title={t('groups.detail.add_promise')}
                    variant="ghost"
                    onPress={createChallenge}
                    disabled={isWorking}
                  />
                  <AppButton
                    title={t('groups.detail.open_board')}
                    variant="ghost"
                    onPress={() => setCreatedReceiptDismissed(true)}
                    disabled={isWorking}
                  />
                </View>
              </View>
            ) : null}

            {group.status === 'failed' && isMember ? (
              <AppListRow
                title={t('groups.detail.archive')}
                subtitle={t('groups.detail.archive_detail')}
                left={
                  <AlertTriangleIcon size={20} color={colors.status.warning} />
                }
                onPress={() => void handleArchive()}
                showChevron={false}
              />
            ) : null}

            {actionNotice ? (
              <AppInlineNotice
                title={actionNotice.title}
                description={actionNotice.message}
                tone={actionNotice.kind}
                testID="group-detail-action-notice"
              />
            ) : null}
          </>
        }
        secondary={
          <View style={styles.iPadContextPane}>
            <View style={styles.iPadContextHeader}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.iPadContextTitle,
                  { color: colors.text.primary },
                ]}
              >
                {t('groups.detail.glance_title')}
              </Text>
              <Text
                style={[
                  styles.iPadContextBody,
                  { color: colors.text.secondary },
                ]}
              >
                {t('groups.detail.glance_detail')}
              </Text>
            </View>
            <View
              style={[
                styles.iPadContextFacts,
                { borderColor: colors.border.primary },
              ]}
            >
              <AppListRow
                meta="YOUR ROLE"
                title={memberRoleLabel}
                subtitle={groupMemberLabel}
                showChevron={false}
              />
              <AppListRow
                meta="GROUP RHYTHM"
                title={t('groups.source.metric.day_streak_value', {
                  count: Math.max(group.current_streak || 0, 0),
                })}
                subtitle={
                  goal > 0
                    ? t('groups.source.streak.progress', {
                        completed: Math.min(streak, goal),
                        total: goal,
                      })
                    : t('groups.detail.no_fixed_streak')
                }
                showChevron={false}
              />
              <AppListRow
                meta="REVIEW QUEUE"
                title={
                  displayedPendingReviewCount === 1
                    ? t('groups.board.review_one')
                    : t('groups.board.review_many', {
                        count: displayedPendingReviewCount,
                      })
                }
                subtitle={t('groups.detail.review_against_promise')}
                showChevron={false}
                showDivider={Boolean(firstSharedChallenge)}
              />
              {firstSharedChallenge ? (
                <AppListRow
                  meta="SHARED PROMISE"
                  title={firstSharedChallenge.title}
                  subtitle={
                    firstSharedChallenge.description ||
                    t('groups.source.promise.detail_default')
                  }
                  onPress={() =>
                    router.push(`/challenges/${firstSharedChallenge.id}`)
                  }
                  showDivider={false}
                />
              ) : null}
            </View>
            {hasPendingReviews ? (
              <AppButton
                title={t('groups.source.review.button', {
                  count: pendingReviewCount ?? 0,
                })}
                onPress={openReviewQueue}
                fullWidth
                size="large"
              />
            ) : isMember && hasSharedChallenge && canSubmitGroupProof ? (
              <AppButton
                title={t('groups.board.add_proof')}
                onPress={openGroupProofSubmission}
                fullWidth
                size="large"
              />
            ) : null}
            <View style={styles.iPadContextActions}>
              <AppButton
                title={t('groups.admin.members')}
                variant="outline"
                onPress={openMembers}
              />
              {isMember ? (
                <AppButton
                  title={t('groups.detail.invite')}
                  variant="ghost"
                  onPress={() => void openInvite()}
                />
              ) : null}
            </View>
          </View>
        }
      />

      <PublicGroupPreviewModal
        visible={joinPreviewVisible}
        group={group}
        onClose={() => setJoinPreviewVisible(false)}
        onJoin={(_groupId, expectedCost) => void handleJoin(expectedCost)}
        onOpenDetails={() => setJoinPreviewVisible(false)}
        joining={isWorking}
        notice={
          actionNotice
            ? {
                title: actionNotice.title,
                message: actionNotice.message,
                tone:
                  actionNotice.kind === 'warning' ? 'info' : actionNotice.kind,
              }
            : null
        }
      />
      <SimpleBottomSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
      >
        <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>
          {t('groups.board.actions')}
        </Text>
        <AppDivider muted />
        <AppListRow
          title={t('groups.detail.invite')}
          subtitle={t('groups.detail.invite_sheet_detail')}
          left={<Share2Icon size={20} color={colors.text.primary} />}
          onPress={() => void openInvite()}
        />
        <AppListRow
          title={t('groups.admin.members')}
          subtitle={t('groups.detail.members_sheet_detail')}
          left={<UsersIcon size={20} color={colors.text.primary} />}
          onPress={openMembers}
        />
        {canManage && group.kind !== 'promise' ? (
          <AppListRow
            title={t('groups.admin.settings')}
            subtitle={t('groups.detail.settings_sheet_detail')}
            left={<SettingsIcon size={20} color={colors.text.primary} />}
            onPress={openSettings}
          />
        ) : null}
        <AppListRow
          title={t('groups.detail.report')}
          subtitle={t('groups.detail.report_detail')}
          left={<ShieldIcon size={20} color={colors.text.primary} />}
          onPress={() => {
            setMoreVisible(false);
            router.push({
              pathname: '/report-issue',
              params: {
                reportKind: 'group',
                source: 'group_detail',
                groupId: group.id,
                contextLabel: group.name,
                ...(group.owner_id && group.owner_id !== user?.id
                  ? {
                      userId: group.owner_id,
                      userLabel:
                        ownerMember?.user.display_name ||
                        ownerMember?.user.username ||
                        'the group owner',
                    }
                  : {}),
              },
            });
          }}
        />
        {isMember && !isOwner && group.kind !== 'promise' ? (
          <AppListRow
            title={t('groups.detail.leave')}
            destructive
            left={<LogOutIcon size={20} color={colors.status.error} />}
            onPress={requestLeave}
          />
        ) : null}
        {isOwner && group.kind !== 'promise' ? (
          <AppListRow
            title={t('groups.detail.delete')}
            subtitle={t('groups.detail.delete_detail')}
            destructive
            left={<Trash2Icon size={20} color={colors.status.error} />}
            onPress={requestDelete}
          />
        ) : null}
      </SimpleBottomSheet>

      <ConfirmDestructiveSheet
        visible={confirmTarget === 'delete'}
        title={t('groups.detail.delete')}
        confirmLabel="Delete group"
        nameToType="DELETE"
        description={t('groups.detail.delete_warning')}
        onClose={() => {
          if (!isWorking) setConfirmTarget(null);
        }}
        onConfirm={handleDelete}
        loading={isWorking}
      />

      <SimpleBottomSheet
        visible={confirmTarget === 'leave'}
        dismissOnBackdrop={!isWorking}
        onClose={() => {
          if (!isWorking) setConfirmTarget(null);
        }}
        testID="group-detail-leave-sheet"
      >
        <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>
          {t('groups.admin.leave_question', { group: group.name })}
        </Text>
        <Text style={[styles.sheetBody, { color: colors.text.secondary }]}>
          {t('groups.detail.leave_warning')}
        </Text>
        <View style={styles.leaveSheetActions}>
          <AppButton
            fullWidth
            loading={isWorking}
            onPress={() => void handleLeave()}
            title={t('groups.detail.leave')}
            variant="destructive"
          />
          <AppButton
            disabled={isWorking}
            fullWidth
            onPress={() => setConfirmTarget(null)}
            title={t('groups.detail.cancel')}
            variant="outline"
          />
        </View>
      </SimpleBottomSheet>
    </AppScreen>
  );
}

const LoadingLine: React.FC<{ width: DimensionValue; height?: number }> = ({
  width,
  height = 14,
}) => {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: mentaColors.skeleton,
      }}
    />
  );
};

const LoadingMetric: React.FC<{ label: string }> = ({ label }) => {
  return (
    <View style={[styles.metric, { borderColor: mentaColors.border }]}>
      <LoadingLine width="52%" height={22} />
      <Text style={[styles.metricLabel, { color: mentaColors.text.secondary }]}>
        {label}
      </Text>
    </View>
  );
};

const LoadingRow: React.FC<{
  titleWidth: DimensionValue;
  metaWidth: DimensionValue;
  avatar?: boolean;
}> = ({ titleWidth, metaWidth, avatar = false }) => {
  return (
    <View
      style={[
        styles.loadingRow,
        {
          borderColor: mentaColors.border,
          backgroundColor: mentaColors.surface,
        },
      ]}
    >
      {avatar ? (
        <View
          style={[
            styles.loadingAvatar,
            { backgroundColor: mentaColors.skeleton },
          ]}
        />
      ) : (
        <View
          style={[
            styles.loadingRowIcon,
            { backgroundColor: mentaColors.skeleton },
          ]}
        />
      )}
      <View style={styles.loadingRowCopy}>
        <LoadingLine width={titleWidth} height={16} />
        <LoadingLine width={metaWidth} height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    width: '100%',
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[12],
  },
  iPadContextPane: {
    gap: mentaSpacing[5],
    paddingBottom: mentaSpacing[10],
    paddingTop: mentaSpacing[5],
  },
  iPadContextHeader: {
    gap: mentaSpacing[2],
  },
  iPadContextTitle: {
    ...mentaTypography.title,
  },
  iPadContextBody: {
    ...mentaTypography.bodySmall,
  },
  iPadContextFacts: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iPadContextActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
  },
  detailHeader: {
    paddingTop: mentaSpacing[3],
  },
  paperStateContent: {
    flex: 1,
    width: '100%',
    gap: mentaSpacing[3],
    paddingBottom: mentaSpacing[6],
  },
  loadingContent: {
    width: '100%',
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[12],
  },
  failedContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[8],
  },
  failedHero: {
    gap: mentaSpacing[6],
  },
  failedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.medium,
    padding: mentaSpacing[4],
  },
  failedPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.medium,
    padding: mentaSpacing[4],
  },
  failedActions: {
    gap: mentaSpacing[3],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[3],
  },
  centeredText: {
    fontSize: 14,
  },
  loadingBoard: {
    gap: mentaSpacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.large,
    padding: mentaSpacing[4],
  },
  loadingRows: {
    gap: mentaSpacing[2],
  },
  loadingRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.medium,
    padding: mentaSpacing[3],
  },
  loadingRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  loadingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  loadingRowCopy: {
    flex: 1,
    minWidth: 0,
    gap: mentaSpacing[2],
  },
  hero: {
    gap: mentaSpacing[2],
  },
  title: {
    ...mentaTypography.heading,
  },
  description: {
    ...mentaTypography.body,
  },
  reviewPrompt: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 16,
    paddingVertical: mentaSpacing[4],
  },
  reviewPromptCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  reviewPromptTitle: {
    ...mentaTypography.title,
  },
  reviewPromptBody: {
    ...mentaTypography.body,
  },
  reviewPromptActions: {
    gap: 10,
  },
  createdReceipt: {
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.large,
    padding: mentaSpacing[4],
  },
  createdReceiptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  createdReceiptIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mentaColors.paper,
  },
  createdReceiptCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  createdReceiptTitle: {
    ...mentaTypography.title,
  },
  createdReceiptBody: {
    ...mentaTypography.body,
  },
  createdReceiptBoard: {
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 14,
  },
  createdReceiptBoardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  createdReceiptBoardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  createdReceiptBoardTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  createdReceiptBoardMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  createdReceiptBoardMetaStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  createdReceiptJoined: {
    flexShrink: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  createdReceiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  createdReceiptActions: {
    gap: 10,
  },
  createdReceiptSecondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionNoticeText: {
    flex: 1,
    minWidth: 0,
  },
  actionNoticeTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  actionNoticeMessage: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
  metric: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  metricValue: {
    ...mentaTypography.control,
  },
  metricLabel: {
    marginTop: 4,
    ...mentaTypography.micro,
  },
  sheetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  inviteEyebrow: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sheetBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
  },
  inviteCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  inviteQrSlot: {
    width: 126,
    flexShrink: 0,
  },
  inviteQrPlaceholder: {
    width: 126,
    height: 126,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteQrPlaceholderText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inviteCardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  inviteCodeLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  inviteText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 2,
  },
  inviteCardNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  sheetActionsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  leaveSheetActions: {
    gap: 10,
    marginTop: 18,
  },
  sheetActionButton: {
    flex: 1,
  },
  inviteFooter: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
