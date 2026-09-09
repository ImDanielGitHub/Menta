import {
  translate as resolveCopy,
  type TranslationKey,
} from '@/lib/localization';

export type GroupBoardProofStatus =
  | 'done'
  | 'pending'
  | 'retry'
  | 'due'
  | 'nudge';

export type GroupBoardScreenState =
  | 'loading'
  | 'active-member'
  | 'owner'
  | 'empty'
  | 'public-preview'
  | 'read-only'
  | 'stale'
  | 'unavailable';

export type GroupBoardAccessReason =
  | 'permission'
  | 'not-found'
  | 'network'
  | 'offline'
  | 'load-failed'
  | 'unknown';

export type GroupBoardMemberInput = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  isCurrentUser: boolean;
};

export type GroupBoardSubmissionInput = {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  mediaType: 'photo' | 'video' | 'text';
  submittedAt: string;
};

export type GroupBoardMediaProof = {
  id: string;
  challengeId: string;
  contributorId: string;
  contributorName: string;
  mediaType: 'photo' | 'video';
  mediaUrl: string;
  /** Video posters are optional. The proof viewer owns playback. */
  thumbnailUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  encouragementUserIds: readonly string[];
};

export type GroupBoardProofReadState = 'available' | 'unavailable';

export type GroupBoardMember = GroupBoardMemberInput & {
  status: GroupBoardProofStatus;
  statusLabel: string;
  detail: string;
  submissionId?: string;
};

export type GroupAccountabilitySnapshot = {
  members: GroupBoardMember[];
  recentProof: GroupBoardMediaProof[];
  proofReadState: GroupBoardProofReadState;
  completedCount: number;
  pendingCount: number;
  dueCount: number;
  retryCount: number;
  remainingCount: number;
  totalCount: number;
  approvedRate: number;
};

type GroupBoardTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: GroupBoardTranslate = (key, values = {}) =>
  resolveCopy('en-NZ', key, values);

const GROUP_BOARD_UNAVAILABLE_STATUS = 'unavailable' as const;
const GROUP_BOARD_DUE_STATUS = 'due' as const;
const GROUP_BOARD_NUDGE_STATUS = 'nudge' as const;
const GROUP_BOARD_DONE_STATUS = 'done' as const;
const GROUP_BOARD_PENDING_STATUS = 'pending' as const;
const GROUP_BOARD_RETRY_STATUS = 'retry' as const;

export const GROUP_BOARD_NUDGE_UNAVAILABLE = {
  status: GROUP_BOARD_UNAVAILABLE_STATUS,
  code: 'server-owned-nudge-receipt-contract-missing',
  label: defaultTranslate('todayProof.group.reminders_unavailable'),
  detail: defaultTranslate('todayProof.group.nudge_unavailable_detail'),
  missingContract: [
    'group-scoped target permission',
    'server-owned daily idempotency',
    'requester-visible delivery receipt',
    'push-provider receipt reconciliation',
  ],
} as const;

export type SelectGroupBoardStateInput = {
  hasGroup: boolean;
  groupStatus?: 'active' | 'failed' | 'expired';
  groupPrivacy?: string | null;
  isMember: boolean;
  isOwner: boolean;
  hasPromise: boolean;
  isInitialLoading: boolean;
  hasCachedData: boolean;
  hasError: boolean;
  isPaused: boolean;
};

export const selectGroupBoardState = ({
  hasGroup,
  groupStatus = 'active',
  groupPrivacy,
  isMember,
  isOwner,
  hasPromise,
  isInitialLoading,
  hasCachedData,
  hasError,
  isPaused,
}: SelectGroupBoardStateInput): GroupBoardScreenState => {
  if (isPaused) return hasGroup && hasCachedData ? 'stale' : 'unavailable';
  if (isInitialLoading) return 'loading';
  if (!hasGroup) return 'unavailable';

  if (hasError) {
    return hasCachedData ? 'stale' : 'unavailable';
  }

  if (!isMember) {
    return groupPrivacy === 'public' || groupPrivacy === 'discoverable'
      ? 'public-preview'
      : 'unavailable';
  }

  if (groupStatus === 'failed' || groupStatus === 'expired') {
    return 'read-only';
  }

  if (!hasPromise) return 'empty';
  return isOwner ? 'owner' : 'active-member';
};

const mediaLabel = (
  mediaType: GroupBoardSubmissionInput['mediaType'],
  t: GroupBoardTranslate
) => {
  if (mediaType === 'video') return t('todayProof.promise.video_proof');
  if (mediaType === 'text') return t('todayProof.review.text_checkin');
  return t('todayProof.promise.photo_proof');
};

const newestFirst = (
  left: GroupBoardSubmissionInput,
  right: GroupBoardSubmissionInput
) => {
  const leftTime = new Date(left.submittedAt).getTime();
  const rightTime = new Date(right.submittedAt).getTime();
  return rightTime - leftTime;
};

const buildMemberState = (
  member: GroupBoardMemberInput,
  submission: GroupBoardSubmissionInput | undefined,
  t: GroupBoardTranslate
): GroupBoardMember => {
  if (!submission) {
    return {
      ...member,
      status: member.isCurrentUser
        ? GROUP_BOARD_DUE_STATUS
        : GROUP_BOARD_NUDGE_STATUS,
      statusLabel: t('todayProof.today.status_due'),
      detail: t('todayProof.group.no_proof_submitted'),
    };
  }

  if (submission.status === 'approved') {
    return {
      ...member,
      status: GROUP_BOARD_DONE_STATUS,
      statusLabel: t('todayProof.today.status_approved'),
      detail: mediaLabel(submission.mediaType, t),
      submissionId: submission.id,
    };
  }

  if (submission.status === 'pending') {
    return {
      ...member,
      status: GROUP_BOARD_PENDING_STATUS,
      statusLabel: t('todayProof.proof.state_waiting'),
      detail: t('todayProof.group.pending_detail', {
        media: mediaLabel(submission.mediaType, t),
      }),
      submissionId: submission.id,
    };
  }

  return {
    ...member,
    status: GROUP_BOARD_RETRY_STATUS,
    statusLabel: t('todayProof.group.needs_clearer'),
    detail: member.isCurrentUser
      ? t('todayProof.group.send_clearer')
      : t('todayProof.group.new_proof_needed'),
    submissionId: submission.id,
  };
};

export const buildGroupAccountabilitySnapshot = ({
  members,
  submissions,
  recentProof = [],
  proofReadState = 'available',
  t = defaultTranslate,
}: {
  members: readonly GroupBoardMemberInput[];
  submissions: readonly GroupBoardSubmissionInput[];
  recentProof?: readonly GroupBoardMediaProof[];
  proofReadState?: GroupBoardProofReadState;
  t?: GroupBoardTranslate;
}): GroupAccountabilitySnapshot => {
  const latestSubmissionByUser = new Map<string, GroupBoardSubmissionInput>();

  [...submissions].sort(newestFirst).forEach(submission => {
    if (!latestSubmissionByUser.has(submission.userId)) {
      latestSubmissionByUser.set(submission.userId, submission);
    }
  });

  const boardMembers = members.map(member =>
    buildMemberState(member, latestSubmissionByUser.get(member.userId), t)
  );
  const completedCount = boardMembers.filter(
    member => member.status === 'done'
  ).length;
  const pendingCount = boardMembers.filter(
    member => member.status === 'pending'
  ).length;
  const dueCount = boardMembers.filter(
    member => member.status === 'due' || member.status === 'nudge'
  ).length;
  const retryCount = boardMembers.filter(
    member => member.status === 'retry'
  ).length;
  const totalCount = boardMembers.length;

  return {
    members: boardMembers,
    recentProof: [...recentProof],
    proofReadState,
    completedCount,
    pendingCount,
    dueCount,
    retryCount,
    remainingCount: Math.max(totalCount - completedCount, 0),
    totalCount,
    approvedRate:
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
  };
};
