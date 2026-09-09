import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ProofConnectionMosaic,
  type ProofConnectionMosaicItem,
} from '@/components/proof/ProofConnectionMosaic';
import { Avatar } from '@/components/ui/Avatar';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { GroupSharedPromisesEmptyState } from '@/components/groups/GroupSharedPromisesEmptyState';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  UsersIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypeScale,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { mentaFonts } from '@/lib/menta-fonts';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { formatProofRelativeTime } from '@/lib/localization/source-formatters';
import {
  type GroupAccountabilitySnapshot,
  type GroupBoardAccessReason,
  type GroupBoardMediaProof,
  type GroupBoardMember,
  type GroupBoardProofStatus,
  type GroupBoardScreenState,
} from '@/lib/loop/group-accountability-board';

type GroupAccountabilityBoardProps = {
  state: GroupBoardScreenState;
  groupName?: string;
  groupDescription?: string | null;
  roleLabel?: string;
  snapshot?: GroupAccountabilitySnapshot;
  promiseTitle?: string;
  promiseDescription?: string | null;
  memberCount?: number;
  ownerName?: string | null;
  /** Only supplied when the loaded promise contract authoritatively exposes it. */
  reviewRuleLabel?: string | null;
  /** Cost or entitlement copy is absent until backed by a runtime contract. */
  joinCostLabel?: string | null;
  endedDate?: string | null;
  /** Omit until the dedicated review-count read succeeds. */
  pendingReviewCount?: number;
  currentUserId?: string;
  proofType?: 'photo' | 'video' | 'text';
  /** The actual route lane after phone gutters or iPad pane allocation. */
  contentWidth?: number;
  lastUpdatedAt?: number;
  unavailableReason?: GroupBoardAccessReason | null;
  readOnlyStatus?: 'failed' | 'expired';
  showHeader?: boolean;
  isWorking?: boolean;
  onRetry?: () => void;
  onOpenReview?: (submissionId?: string) => void;
  onOpenProof?: (proof: GroupBoardMediaProof) => void;
  onToggleEncouragement?: (
    proof: GroupBoardMediaProof,
    encouraged: boolean
  ) => void;
  onSubmitProof?: () => void;
  onAddPromise?: () => void;
  onInvite?: () => void;
  onJoin?: () => void;
  onDismissPreview?: () => void;
  onOpenMembers?: () => void;
  onOpenHistory?: () => void;
  onBackToGroups?: () => void;
  onEnterCode?: () => void;
};

type Localise = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const STATUS_COLOURS: Record<GroupBoardProofStatus, string> = {
  done: mentaColors.success,
  pending: mentaColors.action,
  retry: mentaColors.danger,
  due: mentaColors.warning,
  nudge: mentaColors.warning,
};

const boardLaneStyle = (contentWidth?: number) =>
  contentWidth
    ? { maxWidth: Math.min(contentWidth, mentaLayout.immersiveFrameMax) }
    : undefined;

const BoardHeader = ({
  groupName,
  roleLabel,
}: {
  groupName: string;
  roleLabel?: string;
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Text style={[styles.groupName, { color: colors.text.primary }]}>
        {groupName}
      </Text>
      {roleLabel ? (
        <Text style={[styles.roleLabel, { color: colors.text.secondary }]}>
          {roleLabel}
        </Text>
      ) : null}
    </View>
  );
};

const ProgressSegments = ({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) => {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: Math.max(total, 1), now: completed }}
      style={styles.progressSegments}
    >
      {Array.from({ length: Math.max(total, 1) }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressSegment,
            {
              backgroundColor:
                index < completed ? mentaColors.success : colors.border.primary,
            },
          ]}
        />
      ))}
    </View>
  );
};

const MemberPulse = ({ member }: { member: GroupBoardMember }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const memberNameLines = useLargeTypeLineLimit(1);

  return (
    <View style={styles.memberPulseContent}>
      <View
        style={[
          styles.memberAvatarRing,
          { borderColor: STATUS_COLOURS[member.status] },
        ]}
      >
        <Avatar
          size={38}
          name={member.name}
          source={member.avatarUrl ? { uri: member.avatarUrl } : undefined}
        />
      </View>
      <Text
        style={[styles.memberName, { color: colors.text.primary }]}
        numberOfLines={memberNameLines}
      >
        {member.isCurrentUser ? t('groups.board.you') : member.name}
      </Text>
      <Text
        style={[styles.memberStatus, { color: STATUS_COLOURS[member.status] }]}
        numberOfLines={2}
      >
        {member.statusLabel}
      </Text>
    </View>
  );
};

const PeopleProgress = ({
  snapshot,
  onOpenMembers,
}: {
  snapshot: GroupAccountabilitySnapshot;
  onOpenMembers?: () => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const visibleMembers = snapshot.members.slice(0, 6);
  const hiddenCount = Math.max(
    snapshot.members.length - visibleMembers.length,
    0
  );
  const submittedCount = snapshot.members.filter(member =>
    Boolean(member.submissionId)
  ).length;

  return (
    <View style={styles.peopleProgress} testID="group-board-people-progress">
      <View style={styles.peopleProgressHeader}>
        <Text
          style={[styles.peopleProgressTitle, { color: colors.text.primary }]}
        >
          {t('groups.board.today')}
        </Text>
        <Text
          style={[styles.peopleProgressCount, { color: colors.text.secondary }]}
        >
          {t('groups.board.added_proof_count', {
            count: submittedCount,
            total: snapshot.totalCount,
          })}
        </Text>
      </View>
      <View style={styles.peopleGrid}>
        {visibleMembers.map(member => (
          <View
            key={member.userId}
            accessible
            accessibilityLabel={t('groups.board.member_status_accessibility', {
              name: member.isCurrentUser ? t('groups.board.you') : member.name,
              status: member.statusLabel,
              detail: member.detail,
            })}
            style={styles.memberPulse}
          >
            <MemberPulse member={member} />
          </View>
        ))}
        {hiddenCount > 0 && onOpenMembers ? (
          <Pressable
            accessibilityLabel={t('groups.source.member.view_all', {
              count: snapshot.members.length,
            })}
            accessibilityRole="button"
            onPress={onOpenMembers}
            style={({ pressed }) => [
              styles.morePeople,
              { borderColor: colors.border.primary },
              pressed && styles.memberRowPressed,
            ]}
          >
            <UsersIcon size={20} color={colors.text.primary} />
            <Text
              style={[styles.morePeopleText, { color: colors.text.primary }]}
            >
              +{hiddenCount}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onOpenMembers ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenMembers}
          style={({ pressed }) => [
            styles.peopleLink,
            pressed && styles.memberRowPressed,
          ]}
        >
          <Text
            style={[styles.peopleLinkText, { color: colors.accent.primary }]}
          >
            {t('todayProof.source.accountability.invite_or_manage_people')}
          </Text>
          <ChevronRightIcon size={17} color={colors.accent.primary} />
        </Pressable>
      ) : null}
    </View>
  );
};

const LoadingBoard = ({ contentWidth }: { contentWidth?: number }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('groups.board.loading')}
      style={[styles.loading, boardLaneStyle(contentWidth)]}
      testID="group-board-loading"
    >
      <View style={styles.loadingHeader}>
        <SkeletonLoader announce={false} width={58} height={58} />
        <View style={styles.loadingHeaderCopy}>
          <SkeletonLoader announce={false} width="48%" height={12} />
          <SkeletonLoader announce={false} width="30%" height={12} />
        </View>
      </View>
      <View
        style={[
          styles.loadingHero,
          { backgroundColor: colors.background.surface },
        ]}
      >
        <SkeletonLoader announce={false} width="22%" height={12} />
        <SkeletonLoader announce={false} width="72%" height={28} />
        <SkeletonLoader announce={false} width="86%" height={18} />
        <SkeletonLoader announce={false} width="100%" height={56} />
      </View>
      <View style={styles.loadingRows}>
        <SkeletonLoader announce={false} width="100%" height={76} />
        <SkeletonLoader announce={false} width="100%" height={76} />
      </View>
    </View>
  );
};

const ActiveBoard = ({
  owner,
  groupName,
  roleLabel,
  snapshot,
  promiseTitle,
  promiseDescription,
  memberCount,
  pendingReviewCount,
  currentUserId,
  proofType = 'photo',
  contentWidth,
  onRetry,
  onOpenReview,
  onOpenProof,
  onToggleEncouragement,
  onSubmitProof,
  onInvite,
  onOpenMembers,
  onOpenHistory,
  showHeader = true,
}: GroupAccountabilityBoardProps & { owner: boolean }) => {
  const { colors } = useTheme();
  const { locale, t } = useTranslation();

  if (!snapshot) return null;

  const reviewCount = pendingReviewCount ?? 0;
  const currentMember = snapshot.members.find(member => member.isCurrentUser);
  const canSubmitProof = Boolean(
    onSubmitProof &&
    currentMember &&
    (currentMember.status === 'due' || currentMember.status === 'retry')
  );
  const boundedContentWidth = contentWidth
    ? Math.min(contentWidth, mentaLayout.immersiveFrameMax)
    : undefined;
  const proofById = new Map(
    snapshot.recentProof.map(proof => [proof.id, proof])
  );
  const proofItems: ProofConnectionMosaicItem[] = snapshot.recentProof.map(
    proof => ({
      id: proof.id,
      mediaType: proof.mediaType,
      mediaUrl: proof.mediaUrl,
      thumbnailUrl: proof.thumbnailUrl,
      contributorId: proof.contributorId,
      contributorName: proof.contributorName,
      submittedLabel: formatProofRelativeTime(
        proof.submittedAt,
        new Date(),
        locale,
        t
      ),
      state:
        proof.status === 'approved'
          ? 'approved'
          : proof.status === 'rejected'
            ? 'needs-retry'
            : 'waiting',
      reactionCount: proof.encouragementUserIds.length,
      encouragedByCurrentUser: currentUserId
        ? proof.encouragementUserIds.includes(currentUserId)
        : false,
      canEncourage: Boolean(
        currentUserId && proof.contributorId !== currentUserId
      ),
    })
  );
  const submitLabel =
    proofType === 'video'
      ? t('todayProof.source.accountability.add_my_video')
      : proofType === 'photo'
        ? t('todayProof.source.accountability.add_my_photo')
        : t('groups.board.add_proof');
  const primaryAction =
    (memberCount ?? snapshot.totalCount) <= 1 && onInvite
      ? { label: t('groups.admin.invite_people'), onPress: onInvite }
      : reviewCount > 0 && onOpenReview
        ? {
            label:
              reviewCount === 1
                ? t('groups.board.review_proof')
                : t('groups.board.review_proofs'),
            onPress: () => onOpenReview(),
          }
        : canSubmitProof && onSubmitProof
          ? { label: submitLabel, onPress: onSubmitProof }
          : onOpenHistory
            ? {
                label: t('todayProof.source.accountability.see_shared_proof'),
                onPress: onOpenHistory,
              }
            : owner && onInvite
              ? { label: t('groups.admin.invite_people'), onPress: onInvite }
              : null;

  return (
    <View
      style={[
        styles.board,
        boundedContentWidth ? { maxWidth: boundedContentWidth } : null,
      ]}
      testID={owner ? 'group-board-owner' : 'group-board-member'}
    >
      {showHeader ? (
        <BoardHeader
          groupName={groupName || t('groups.preview.group')}
          roleLabel={
            roleLabel ||
            (owner ? t('groups.admin.owner') : t('groups.admin.member'))
          }
        />
      ) : null}

      <View style={styles.promiseContext} testID="group-board-paper-promise">
        <Text
          style={[styles.promiseContextMeta, { color: colors.text.secondary }]}
        >
          {[
            groupName,
            t('groups.board.member_count', {
              count: memberCount ?? snapshot.totalCount,
            }),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text accessibilityRole="header" style={styles.promiseContextTitle}>
          {promiseTitle || t('groups.board.shared_promise')}
        </Text>
        {promiseDescription ? (
          <Text
            numberOfLines={3}
            style={[
              styles.promiseContextDescription,
              { color: colors.text.secondary },
            ]}
          >
            {promiseDescription}
          </Text>
        ) : null}
      </View>

      <PeopleProgress snapshot={snapshot} onOpenMembers={onOpenMembers} />

      {snapshot.proofReadState === 'unavailable' ? (
        <AppInlineNotice
          title={t('todayProof.promise.out_of_date')}
          description={t('todayProof.promise.refresh_failed')}
          tone="warning"
          actionLabel={onRetry ? t('groups.tab.try_again') : undefined}
          onAction={onRetry}
          testID="group-board-proof-read-unavailable"
        />
      ) : null}

      {proofItems.length > 0 ? (
        <ProofConnectionMosaic
          contentWidth={boundedContentWidth}
          items={proofItems}
          onOpenProof={item => {
            const proof = proofById.get(item.id);
            if (proof) onOpenProof?.(proof);
            else onOpenHistory?.();
          }}
          onToggleEncouragement={
            onToggleEncouragement
              ? (item, encouraged) => {
                  const proof = proofById.get(item.id);
                  if (proof) onToggleEncouragement(proof, encouraged);
                }
              : undefined
          }
          onViewAll={onOpenHistory}
          title={t('todayProof.source.accountability.proof_together')}
          visibilityLabel={t(
            'todayProof.source.accountability.shared_with_promise_people'
          )}
        />
      ) : (
        <View
          style={[styles.proofEmpty, { borderColor: colors.border.primary }]}
          testID="group-board-proof-empty"
        >
          <Text
            style={[styles.proofEmptyTitle, { color: colors.text.primary }]}
          >
            {t('todayProof.source.accountability.no_shared_proof')}
          </Text>
          <Text
            style={[styles.proofEmptyCopy, { color: colors.text.secondary }]}
          >
            {t('todayProof.promise.submit_appears')}
          </Text>
        </View>
      )}

      {primaryAction ? (
        <AppButton
          title={primaryAction.label}
          onPress={primaryAction.onPress}
          fullWidth
          size="large"
          style={styles.primaryAction}
        />
      ) : null}
    </View>
  );
};

const EmptyBoard = ({
  groupName,
  roleLabel,
  showHeader = true,
  contentWidth,
  onAddPromise,
  onInvite,
}: GroupAccountabilityBoardProps) => {
  const { t } = useTranslation();
  return (
    <View
      style={[styles.board, styles.stateBoard, boardLaneStyle(contentWidth)]}
      testID="group-board-empty"
    >
      {showHeader ? (
        <BoardHeader
          groupName={groupName || t('groups.preview.group')}
          roleLabel={roleLabel || t('groups.admin.member')}
        />
      ) : null}
      <GroupSharedPromisesEmptyState
        canManage={Boolean(onAddPromise || onInvite)}
        onAddPromise={onAddPromise}
        onInvitePeople={onInvite}
      />
    </View>
  );
};

const PublicPreview = ({
  groupName,
  groupDescription,
  promiseTitle,
  promiseDescription,
  memberCount,
  ownerName,
  reviewRuleLabel,
  joinCostLabel,
  isWorking,
  onJoin,
  onDismissPreview,
  showHeader = true,
  contentWidth,
}: GroupAccountabilityBoardProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.board, styles.stateBoard, boardLaneStyle(contentWidth)]}
      testID="group-board-public-preview"
    >
      {showHeader ? (
        <View style={styles.publicHeader}>
          <View
            style={[
              styles.publicAvatar,
              { backgroundColor: colors.background.surface },
            ]}
            testID="group-board-public-avatar"
          >
            <UsersIcon size={26} color={colors.text.primary} />
          </View>
          <View style={styles.publicHeaderCopy}>
            <Text style={[styles.eyebrow, { color: colors.text.secondary }]}>
              {t('groups.board.public_group')}
            </Text>
            <Text style={[styles.groupName, { color: colors.text.primary }]}>
              {groupName || t('groups.preview.group')}
            </Text>
            <Text style={[styles.publicMeta, { color: colors.text.secondary }]}>
              {ownerName ? `${ownerName} · ` : ''}
              {t('groups.board.member_count', { count: memberCount ?? 0 })}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.publicPromise} testID="group-board-public-promise">
        <Text style={styles.publicPromiseLabel}>
          {t('groups.board.shared_promise_label')}
        </Text>
        <Text style={styles.publicPromiseTitle}>
          {promiseTitle || t('groups.board.default_promise')}
        </Text>
        <Text style={styles.publicPromiseCopy}>
          {promiseDescription ||
            groupDescription ||
            t('groups.board.join_before_detail')}
        </Text>
        {reviewRuleLabel ? (
          <>
            <View style={styles.paperDivider} />
            <Text style={styles.publicRule}>{reviewRuleLabel}</Text>
          </>
        ) : null}
      </View>
      {joinCostLabel ? (
        <View
          style={[
            styles.joinCostRow,
            { borderBottomColor: colors.border.primary },
          ]}
        >
          <Text
            style={[styles.joinCostLabel, { color: colors.text.secondary }]}
          >
            {t('groups.board.join_cost')}
          </Text>
          <Text style={[styles.joinCostValue, { color: colors.text.primary }]}>
            {joinCostLabel}
          </Text>
        </View>
      ) : null}
      {onJoin || onDismissPreview ? (
        <View style={styles.actions}>
          {onJoin ? (
            <AppButton
              title={t('groups.join.join_group')}
              onPress={onJoin}
              disabled={isWorking}
              loading={isWorking}
              fullWidth
              size="large"
            />
          ) : null}
          {onDismissPreview ? (
            <AppButton
              title={t('groups.board.return_groups')}
              onPress={onDismissPreview}
              disabled={isWorking}
              variant="ghost"
              fullWidth
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const ReadOnlyBoard = ({
  groupName,
  roleLabel,
  promiseTitle,
  promiseDescription,
  readOnlyStatus,
  endedDate,
  onOpenHistory,
  onOpenMembers,
  showHeader = true,
  contentWidth,
}: GroupAccountabilityBoardProps) => {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <View
      style={[styles.board, styles.stateBoard, boardLaneStyle(contentWidth)]}
      testID="group-board-read-only"
    >
      {showHeader ? (
        <BoardHeader
          groupName={groupName || t('groups.source.group.fallback')}
          roleLabel={roleLabel || t('groups.source.member.fallback')}
        />
      ) : null}
      <AppInlineNotice
        title={t('groups.board.read_only')}
        description={getReadOnlyDescription(
          readOnlyStatus,
          endedDate,
          locale,
          t
        )}
        tone="warning"
        testID="group-board-read-only-notice"
      />
      <View
        style={[styles.readOnlyPromise, { borderColor: colors.border.primary }]}
      >
        <Text style={[styles.eyebrow, { color: colors.text.secondary }]}>
          {t('groups.board.final_promise')}
        </Text>
        <Text style={[styles.readOnlyTitle, { color: colors.text.primary }]}>
          {promiseTitle || t('groups.board.shared_promise_label')}
        </Text>
        <Text style={[styles.readOnlyCopy, { color: colors.text.secondary }]}>
          {promiseDescription || t('groups.board.final_rule')}
        </Text>
      </View>
      <View
        style={[styles.readOnlyRows, { borderTopColor: colors.border.primary }]}
      >
        <ReadOnlyRow
          title={t('groups.board.proof_history')}
          onPress={onOpenHistory}
        />
        <ReadOnlyRow
          title={t('groups.admin.members')}
          onPress={onOpenMembers}
        />
        <ReadOnlyRow
          title={t('groups.board.promise_rules')}
          onPress={onOpenHistory}
        />
      </View>
    </View>
  );
};

const getReadOnlyDescription = (
  status: GroupAccountabilityBoardProps['readOnlyStatus'],
  endedDate: string | null | undefined,
  locale: string,
  localise: Localise
) => {
  const label = endedDate
    ? new Date(`${endedDate}T12:00:00`).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
      })
    : null;
  if (label) {
    return localise('groups.source.read_only.ended_on', { date: label });
  }
  return status === 'failed'
    ? localise('groups.source.read_only.failed')
    : localise('groups.source.read_only.ended');
};

const ReadOnlyRow = ({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) => {
  const { colors } = useTheme();
  const content = (
    <>
      <Text style={[styles.readOnlyRowTitle, { color: colors.text.primary }]}>
        {title}
      </Text>
      {onPress ? (
        <ChevronRightIcon size={18} color={colors.text.secondary} />
      ) : null}
    </>
  );
  if (!onPress) {
    return (
      <View
        style={[
          styles.readOnlyRow,
          { borderBottomColor: colors.border.primary },
        ]}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.readOnlyRow,
        { borderBottomColor: colors.border.primary },
        pressed && styles.rowPressed,
      ]}
    >
      {content}
    </Pressable>
  );
};

const formatLastUpdated = (
  value: number | undefined,
  locale: string,
  localise: Localise
) => {
  if (!value) return localise('groups.board.saved_status');
  try {
    return new Date(value).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return localise('groups.board.saved_status');
  }
};

const StaleBoard = ({
  groupName,
  roleLabel,
  snapshot,
  promiseTitle,
  lastUpdatedAt,
  onRetry,
  showHeader = true,
  contentWidth,
}: GroupAccountabilityBoardProps) => {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <View
      style={[styles.board, boardLaneStyle(contentWidth)]}
      testID="group-board-stale"
    >
      {showHeader ? (
        <BoardHeader
          groupName={groupName || t('groups.source.group.fallback')}
          roleLabel={roleLabel || t('groups.source.member.fallback')}
        />
      ) : null}
      <AppInlineNotice
        title={t('groups.board.saved_board')}
        description={t('groups.board.stale_notice', {
          updated: formatLastUpdated(lastUpdatedAt, locale, t),
        })}
        tone="warning"
        actionLabel={t('groups.tab.try_again')}
        onAction={onRetry}
        testID="group-board-stale-notice"
      />
      <View
        style={[
          styles.knownState,
          { backgroundColor: colors.background.surface },
        ]}
        testID="group-board-known-state"
      >
        <Text style={[styles.eyebrow, { color: colors.text.secondary }]}>
          {t('groups.board.saved_status')}
        </Text>
        <Text style={[styles.knownStateTitle, { color: colors.text.primary }]}>
          {promiseTitle || t('groups.board.default_promise')}
        </Text>
        <Text style={[styles.knownStateCopy, { color: colors.text.secondary }]}>
          {snapshot
            ? t('groups.board.saved_approved', {
                completed: snapshot.completedCount,
                total: snapshot.totalCount,
              })
            : t('groups.board.saved_proof_missing')}
        </Text>
        {snapshot ? (
          <ProgressSegments
            completed={snapshot.completedCount}
            total={snapshot.totalCount}
          />
        ) : null}
      </View>
      <Text style={[styles.staleFootnote, { color: colors.text.muted }]}>
        {t('groups.board.stale_footnote')}
      </Text>
    </View>
  );
};

const UnavailableBoard = ({
  unavailableReason,
  onRetry,
  onBackToGroups,
  onEnterCode,
  contentWidth,
}: GroupAccountabilityBoardProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isPermission = unavailableReason === 'permission';
  const isOffline =
    unavailableReason === 'offline' || unavailableReason === 'network';
  const title = isPermission
    ? t('groups.board.permission_title')
    : isOffline
      ? t('groups.board.offline_title')
      : t('groups.board.unavailable_title');
  const description = isPermission
    ? t('groups.board.permission_detail')
    : isOffline
      ? t('groups.board.offline_detail')
      : t('groups.board.unavailable_detail');

  return (
    <View
      style={[styles.unavailable, boardLaneStyle(contentWidth)]}
      testID="group-board-unavailable"
    >
      <View style={styles.unavailableBody}>
        <View
          style={[
            styles.unavailableIcon,
            { backgroundColor: colors.background.surface },
          ]}
        >
          <AlertTriangleIcon size={30} color={mentaColors.danger} />
        </View>
        <Text style={[styles.unavailableTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
        <Text
          style={[styles.unavailableCopy, { color: colors.text.secondary }]}
        >
          {description}
        </Text>
        {onRetry ? (
          <AppButton
            title={t('groups.tab.try_again')}
            onPress={onRetry}
            variant="outline"
            leftIcon={<RefreshCwIcon size={18} color={colors.text.primary} />}
            fullWidth
          />
        ) : null}
      </View>
      {onBackToGroups || onEnterCode ? (
        <View style={styles.actions}>
          {onBackToGroups ? (
            <AppButton
              title={t('groups.board.go_groups')}
              onPress={onBackToGroups}
              fullWidth
              size="large"
            />
          ) : null}
          {onEnterCode ? (
            <AppButton
              title={t('groups.board.enter_code')}
              onPress={onEnterCode}
              variant="outline"
              fullWidth
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export const GroupAccountabilityBoard = (
  props: GroupAccountabilityBoardProps
) => {
  switch (props.state) {
    case 'loading':
      return <LoadingBoard contentWidth={props.contentWidth} />;
    case 'empty':
      return <EmptyBoard {...props} />;
    case 'public-preview':
      return <PublicPreview {...props} />;
    case 'read-only':
      return <ReadOnlyBoard {...props} />;
    case 'stale':
      return <StaleBoard {...props} />;
    case 'unavailable':
      return <UnavailableBoard {...props} />;
    case 'owner':
      return <ActiveBoard {...props} owner />;
    case 'active-member':
    default:
      return <ActiveBoard {...props} owner={false} />;
  }
};

const styles = StyleSheet.create({
  board: {
    gap: mentaSpacing[6],
    width: '100%',
    maxWidth: mentaLayout.taskLane,
    alignSelf: 'center',
  },
  stateBoard: {},
  header: {
    alignItems: 'flex-start',
    gap: mentaSpacing[1],
  },
  eyebrow: {
    ...mentaTypeScale.caption,
    fontFamily: mentaFonts.inter.semibold,
  },
  groupName: {
    ...mentaTypeScale.title,
    fontFamily: mentaFonts.inter.bold,
  },
  roleLabel: {
    ...mentaTypeScale.caption,
    fontFamily: mentaFonts.inter.semibold,
  },
  promiseContext: {
    gap: mentaSpacing[2],
    paddingBottom: mentaSpacing[5],
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  promiseContextMeta: {
    ...mentaTypeScale.caption,
    fontFamily: mentaFonts.inter.semibold,
  },
  promiseContextTitle: {
    ...mentaTypeScale.heading,
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
  },
  promiseContextDescription: {
    ...mentaTypeScale.body,
    fontFamily: mentaFonts.inter.regular,
  },
  peopleProgress: {
    gap: mentaSpacing[3],
  },
  peopleProgressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
    justifyContent: 'space-between',
    minHeight: mentaLayout.minimumTouchTarget,
  },
  peopleProgressTitle: {
    ...mentaTypeScale.body,
    fontFamily: mentaFonts.inter.semibold,
  },
  peopleProgressCount: {
    ...mentaTypeScale.caption,
    fontFamily: mentaFonts.inter.regular,
  },
  peopleGrid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[3],
  },
  memberPulse: {
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: 86,
    justifyContent: 'center',
    minHeight: 92,
    minWidth: 78,
  },
  memberPulseContent: {
    alignItems: 'center',
    gap: mentaSpacing[1],
    minWidth: 0,
    width: '100%',
  },
  memberAvatarRing: {
    alignItems: 'center',
    borderRadius: mentaRadii.round,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  morePeople: {
    alignItems: 'center',
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: 86,
    flexGrow: 1,
    gap: mentaSpacing[1],
    justifyContent: 'center',
    minHeight: 92,
    minWidth: 78,
  },
  morePeopleText: {
    ...mentaTypeScale.caption,
    fontFamily: mentaFonts.inter.semibold,
  },
  peopleLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[1],
    minHeight: mentaLayout.minimumTouchTarget,
  },
  peopleLinkText: {
    ...mentaTypeScale.bodySmall,
    fontFamily: mentaFonts.inter.semibold,
  },
  proofEmpty: {
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    minHeight: 126,
    padding: mentaSpacing[5],
  },
  proofEmptyTitle: {
    ...mentaTypeScale.title,
    fontFamily: mentaFonts.newsreader.medium,
  },
  proofEmptyCopy: {
    ...mentaTypeScale.body,
    fontFamily: mentaFonts.inter.regular,
  },
  primaryAction: {
    marginTop: mentaSpacing[1],
  },
  progressSegments: {
    flexDirection: 'row',
    gap: mentaSpacing[1],
  },
  progressSegment: {
    height: mentaSpacing[2],
    flex: 1,
    borderRadius: mentaRadii.round,
  },
  memberRowPressed: {
    opacity: 0.72,
  },
  memberName: {
    ...mentaTypeScale.bodySmall,
    fontFamily: mentaFonts.inter.semibold,
    textAlign: 'center',
  },
  memberStatus: {
    ...mentaTypeScale.caption,
    flexShrink: 0,
    fontFamily: mentaFonts.inter.bold,
    textAlign: 'center',
  },
  loading: {
    gap: mentaSpacing[6],
    width: '100%',
    maxWidth: mentaLayout.taskLane,
    alignSelf: 'center',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  loadingHeaderCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  loadingHero: {
    minHeight: 188,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
    borderRadius: mentaRadii.large,
  },
  loadingRows: {
    gap: mentaSpacing[3],
  },
  actions: {
    gap: mentaSpacing[3],
  },
  publicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[4],
  },
  publicAvatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.large,
  },
  publicHeaderCopy: {
    flex: 1,
    gap: mentaSpacing[1],
  },
  publicMeta: {
    ...mentaTypeScale.bodySmall,
    fontFamily: mentaFonts.inter.regular,
  },
  publicPromise: {
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.paper,
  },
  publicPromiseLabel: {
    ...mentaTypeScale.eyebrow,
    color: mentaColors.text.mutedOnPaper,
    fontFamily: mentaFonts.inter.bold,
  },
  publicPromiseTitle: {
    ...mentaTypeScale.title,
    color: mentaColors.text.onPaper,
    fontFamily: mentaFonts.newsreader.medium,
  },
  publicPromiseCopy: {
    ...mentaTypeScale.body,
    color: mentaColors.text.mutedOnPaper,
    fontFamily: mentaFonts.inter.regular,
  },
  paperDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: mentaColors.border,
  },
  publicRule: {
    ...mentaTypeScale.bodySmall,
    color: mentaColors.text.onPaper,
    fontFamily: mentaFonts.inter.semibold,
  },
  joinCostRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  joinCostLabel: {
    ...mentaTypeScale.bodySmall,
    fontFamily: mentaFonts.inter.regular,
  },
  joinCostValue: {
    ...mentaTypeScale.bodySmall,
    fontFamily: mentaFonts.inter.semibold,
  },
  readOnlyPromise: {
    gap: mentaSpacing[3],
    minHeight: 160,
    padding: mentaSpacing[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.large,
  },
  readOnlyTitle: {
    ...mentaTypeScale.title,
    fontFamily: mentaFonts.newsreader.medium,
  },
  readOnlyCopy: {
    ...mentaTypeScale.body,
    fontFamily: mentaFonts.inter.regular,
  },
  readOnlyRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  readOnlyRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
  },
  readOnlyRowTitle: {
    ...mentaTypeScale.body,
    fontFamily: mentaFonts.inter.semibold,
  },
  rowPressed: {
    opacity: 0.72,
  },
  knownState: {
    gap: mentaSpacing[3],
    padding: mentaSpacing[4],
    borderRadius: mentaRadii.large,
  },
  knownStateTitle: {
    ...mentaTypeScale.title,
    fontFamily: mentaFonts.newsreader.medium,
  },
  knownStateCopy: {
    ...mentaTypeScale.body,
    fontFamily: mentaFonts.inter.regular,
  },
  staleFootnote: {
    ...mentaTypeScale.bodySmall,
    fontFamily: mentaFonts.inter.regular,
    textAlign: 'center',
  },
  unavailable: {
    width: '100%',
    maxWidth: mentaLayout.taskLane,
    alignSelf: 'center',
    gap: mentaSpacing[6],
  },
  unavailableBody: {
    minHeight: 260,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: mentaSpacing[4],
  },
  unavailableIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.large,
  },
  unavailableTitle: {
    ...mentaTypeScale.title,
    fontFamily: mentaFonts.inter.semibold,
  },
  unavailableCopy: {
    ...mentaTypeScale.body,
    fontFamily: mentaFonts.inter.regular,
  },
});
