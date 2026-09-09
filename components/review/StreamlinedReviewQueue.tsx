import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
/**
 * Streamlined Review Queue
 *
 * A focused proof-review flow: choose one proof, inspect it with context, then
 * make the next fair decision from a calm bottom action surface.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useTheme,
  useThemedStyles,
  type ThemeContextType,
} from '@/constants/ThemeContext';
import { useAuthStore } from '@/store/auth-store';
import { useChallengeStore } from '@/store/challenge-store';
import { AppTopBar } from '@/components/ui/AppShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextArea } from '@/components/ui/AppFields';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { PromiseArtefact } from '@/components/challenge/PromiseArtefact';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  EvidenceUnavailablePanel,
  ReviewEvidenceImage,
  ReviewEvidenceVideo,
  type ReviewEvidenceAvailability,
} from '@/components/review/ReviewEvidenceImage';
import { getReviewRewardHint } from '@/lib/economy/contract';
import { claimReviewQueueReward } from '@/lib/review-rewards';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  ImageIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TypeIcon,
  VideoIcon,
  XIcon,
} from '@/components/ui/icons';
import type { ModerationStatus } from '@/types/moderation';
import type { ProofMediaType } from '@/lib/proof-types';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';
import { ReviewDecisionError } from '@/lib/review-decision';
import { getReviewEvidenceStatus } from '@/lib/review-evidence';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { trackProductEvent } from '@/lib/posthog';

type ReviewStatus = Exclude<ModerationStatus, 'reported'>;

interface ReviewSubmission {
  id: string;
  user_id: string;
  challenge_id: string;
  media_url: string;
  media_type: ProofMediaType;
  submission_date: string;
  submission_text?: string;
  status: ReviewStatus;
  review_notes?: string;
  reviewer_id?: string;
  verification_date?: string;
  user: {
    name: string;
    username: string;
    avatar_url?: string;
  };
  challenge: {
    title: string;
    description?: string;
    verification_description?: string;
    allow_self_review: boolean;
    category?: string;
  };
}

interface StreamlinedReviewQueueProps {
  challengeId?: string;
  groupId?: string;
  initialSubmissionId?: string;
  entryPoint?: string;
  onStatusChange?: () => void;
}

type FilterStatus = 'all' | ReviewStatus;
type LastDecision = {
  action: 'approve' | 'reject';
  username: string;
  challengeTitle: string;
  remainingPending: number;
} | null;
type ReviewRewardState =
  | { status: 'idle' }
  | { status: 'earned'; amount: number }
  | { status: 'already_logged' }
  | { status: 'unavailable'; message: string };
const REVIEW_REWARD_IDLE = 'idle' as const;
const REVIEW_REWARD_EARNED = 'earned' as const;
const REVIEW_REWARD_ALREADY_LOGGED = 'already_logged' as const;
const REVIEW_REWARD_UNAVAILABLE = 'unavailable' as const;
type ReviewConflictState = {
  submissionId: string;
  currentStatus: string | null;
  unsentCorrectionNote: string | null;
};
type ReviewUnknownState = {
  submissionId: string;
};

export const ReviewQueueSkeleton = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('todayProof.review.loading')}
      accessibilityRole="progressbar"
      style={reviewQueueSkeletonStyles.container}
      testID="review-queue-skeleton"
    >
      <AppTopBar
        title={t('todayProof.review.review')}
        onBack={onBack}
        trailing={
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.round}
            height={mentaLayout.minimumTouchTarget}
            width={mentaLayout.minimumTouchTarget}
          />
        }
      />

      <View style={reviewQueueSkeletonStyles.question}>
        <View style={reviewQueueSkeletonStyles.questionMeta}>
          <View style={reviewQueueSkeletonStyles.questionIdentity}>
            <SkeletonLoader
              announce={false}
              borderRadius={mentaRadii.round}
              height={28}
              width={28}
            />
            <SkeletonLoader announce={false} height={14} width={152} />
          </View>
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.round}
            height={28}
            width={56}
          />
        </View>
        <SkeletonLoader announce={false} height={30} width="94%" />
        <SkeletonLoader announce={false} height={30} width="54%" />
      </View>

      <View style={reviewQueueSkeletonStyles.evidence}>
        <SkeletonLoader announce={false} borderRadius={0} height={196} />
        <View style={reviewQueueSkeletonStyles.evidenceFooter}>
          <SkeletonLoader announce={false} height={14} width={180} />
          <SkeletonLoader announce={false} height={14} width={112} />
        </View>
      </View>

      <View style={reviewQueueSkeletonStyles.promise}>
        <SkeletonLoader announce={false} height={12} width={64} />
        <SkeletonLoader announce={false} height={24} width="91%" />
        <SkeletonLoader announce={false} height={1} width="100%" />
        <View style={reviewQueueSkeletonStyles.promiseReviewer}>
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.round}
            height={22}
            width={22}
          />
          <View style={reviewQueueSkeletonStyles.promiseReviewerCopy}>
            <SkeletonLoader announce={false} height={10} width={76} />
            <SkeletonLoader announce={false} height={12} width="80%" />
          </View>
        </View>
      </View>

      <View style={reviewQueueSkeletonStyles.decisions}>
        <SkeletonLoader announce={false} height={56} />
        <SkeletonLoader announce={false} height={56} />
      </View>
    </View>
  );
};

const FILTERS: FilterStatus[] = ['pending', 'all'];

const REJECTION_REASON_OPTIONS = [
  'Action not visible',
  "Doesn't match proof rule",
  'Too unclear to review',
] as const;

type RejectionReason = (typeof REJECTION_REASON_OPTIONS)[number];

const CORRECTION_NOTE_MAX_LENGTH = 240;

const buildCorrectionFeedback = (reason: RejectionReason, note: string) => {
  const boundedNote = note.trim().slice(0, CORRECTION_NOTE_MAX_LENGTH);
  return boundedNote ? `${reason}\n${boundedNote}` : reason;
};

const REPORT_CATEGORY_OPTIONS = [
  {
    id: 'safety',
    source: 'review_queue_proof_safety',
  },
  {
    id: 'privacy',
    source: 'review_queue_proof_privacy',
  },
] as const;

type ReportCategory = (typeof REPORT_CATEGORY_OPTIONS)[number];

const getReportCategoryLabel = (
  category: ReportCategory,
  localise: Localise
): string =>
  category.id === 'safety'
    ? localise('todayProof.source.accountability.report_safety')
    : localise('todayProof.source.accountability.report_privacy');

type VerificationRow = {
  id?: string;
  user_id?: string;
  challenge_id?: string;
  media_url?: string;
  media_type?: ProofMediaType;
  submission_date?: string;
  submission_text?: string;
  status?: ReviewStatus;
  review_notes?: string;
  reviewer_id?: string;
  verification_date?: string;
  users?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  challenges?: {
    title?: string;
    description?: string;
    verification_description?: string;
    allow_self_review?: boolean;
    category?: string;
  };
};

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

type Localise = ReturnType<typeof useTranslation>['t'];

const filterLabels: Record<FilterStatus, (t: Localise) => string> = {
  all: t => t('todayProof.review.filter_all'),
  pending: t => t('todayProof.review.filter_pending'),
  approved: t => t('todayProof.review.filter_approved'),
  rejected: t => t('todayProof.review.filter_rejected'),
};

const reviewStatusLabels: Record<ReviewStatus, (t: Localise) => string> = {
  pending: t => t('todayProof.review.filter_pending'),
  approved: t => t('todayProof.review.filter_approved'),
  rejected: t => t('todayProof.review.filter_rejected'),
};

const rejectionReasonLabels: Record<
  (typeof REJECTION_REASON_OPTIONS)[number],
  (t: Localise) => string
> = {
  'Action not visible': t => t('todayProof.review.action_not_visible'),
  "Doesn't match proof rule": t => t('todayProof.review.does_not_match_rule'),
  'Too unclear to review': t => t('todayProof.review.too_unclear'),
};

const getFilterLabel = (status: FilterStatus, t: Localise): string =>
  filterLabels[status](t);

const getReviewStatusLabel = (status: string | null, t: Localise): string => {
  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    return reviewStatusLabels[status](t);
  }
  return t('todayProof.review.unknown_status');
};

const getRejectionReasonLabel = (
  reason: (typeof REJECTION_REASON_OPTIONS)[number],
  t: Localise
): string => rejectionReasonLabels[reason](t);

const normalizeMediaType = (value: unknown): ProofMediaType => {
  if (value === 'video' || value === 'text' || value === 'photo') {
    return value;
  }
  return 'photo';
};

const getTextProofBody = (submission: ReviewSubmission) =>
  (
    submission.submission_text ||
    (submission.media_type === 'text' ? submission.media_url : '')
  ).trim();

const formatSubmittedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const getMediaLabel = (
  mediaType: ProofMediaType,
  t: ReturnType<typeof useTranslation>['t']
) => {
  if (mediaType === 'video') return t('todayProof.promise.video_proof');
  if (mediaType === 'text') return t('todayProof.review.text_checkin');
  return t('todayProof.promise.photo_proof');
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return '?';

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
};

const getProfileName = (
  profile:
    | {
        username?: string;
        display_name?: string;
      }
    | undefined
) => {
  const displayName = profile?.display_name?.trim();
  if (displayName) return displayName;

  const username = profile?.username?.trim();
  if (username) return username;

  return 'Unknown User';
};

const getEmptyCopy = (
  filterStatus: FilterStatus,
  t: ReturnType<typeof useTranslation>['t'],
  options?: {
    entryPoint?: string;
  }
) => {
  if (filterStatus === 'pending') {
    if (options?.entryPoint === 'proof_receipt') {
      return t('todayProof.review.fair_decision');
    }
    return t('todayProof.review.none_waiting');
  }
  if (filterStatus === 'approved') {
    return t('todayProof.review.none_approved');
  }
  if (filterStatus === 'rejected') {
    return t('todayProof.review.none_retry');
  }
  return t('todayProof.review.nothing');
};

export const StreamlinedReviewQueue: React.FC<StreamlinedReviewQueueProps> = ({
  challengeId,
  groupId,
  initialSubmissionId,
  entryPoint,
  onStatusChange,
}) => {
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const queueNameLines = useLargeTypeLineLimit(1);
  const queueMetaLines = useLargeTypeLineLimit(1);
  const queueNoteLines = useLargeTypeLineLimit(1);
  const proofIdentityLines = useLargeTypeLineLimit(2);

  const { user } = useAuthStore();
  const { reviewVerification } = useChallengeStore();

  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [rejectionValidationError, setRejectionValidationError] =
    useState(false);
  const [reviewConflict, setReviewConflict] =
    useState<ReviewConflictState | null>(null);
  const [reviewUnknown, setReviewUnknown] = useState<ReviewUnknownState | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(
    initialSubmissionId ?? null
  );
  const [rejectingSubmissionId, setRejectingSubmissionId] = useState<
    string | null
  >(null);
  const [selectedRejectionReason, setSelectedRejectionReason] =
    useState<RejectionReason | null>(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [reportingSubmissionId, setReportingSubmissionId] = useState<
    string | null
  >(null);
  const [processingItems, setProcessingItems] = useState<Set<string>>(
    new Set()
  );
  const [evidenceAvailability, setEvidenceAvailability] = useState<
    Record<string, ReviewEvidenceAvailability>
  >({});
  const processingItemsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const fetchRequestRef = useRef(0);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fetchRequestRef.current += 1;
    };
  }, []);
  const appliedInitialSubmissionIdRef = useRef<string | null>(null);
  const [lastDecision, setLastDecision] = useState<LastDecision>(null);
  const [queueClearedAfterDecision, setQueueClearedAfterDecision] =
    useState(false);
  const [reviewRewardState, setReviewRewardState] = useState<ReviewRewardState>(
    { status: REVIEW_REWARD_IDLE }
  );
  const returnsToGroupBoard = entryPoint === 'group_board' && Boolean(groupId);
  const returnLabel = returnsToGroupBoard
    ? t('todayProof.review.back_board')
    : t('todayProof.review.back_today');
  const returnToOrigin = useCallback(() => {
    if (returnsToGroupBoard && groupId) {
      router.replace({ pathname: '/groups/[id]', params: { id: groupId } });
      return;
    }
    router.replace('/(tabs)');
  }, [groupId, returnsToGroupBoard, router]);

  const fetchSubmissions = useCallback(
    async (showFullLoader = false) => {
      const request = ++fetchRequestRef.current;
      const isCurrent = () =>
        mountedRef.current && request === fetchRequestRef.current;
      try {
        if (showFullLoader) {
          setLoading(true);
        }
        setFetchError(null);
        const data = await useChallengeStore
          .getState()
          .getVerificationsByStatus(challengeId, 'all', user?.id, groupId);
        if (!isCurrent()) return;

        const rows = (data || []) as VerificationRow[];
        const normalized: ReviewSubmission[] = rows
          .map(row => {
            const profile = row.users ?? row.profiles;
            const name = getProfileName(profile);
            const username = profile?.username?.trim() || name;
            const avatarUrl = profile?.avatar_url ?? undefined;
            const title = row.challenges?.title ?? 'Promise';
            const description = row.challenges?.description?.trim();
            const verificationDescription =
              row.challenges?.verification_description?.trim();
            const category = row.challenges?.category ?? undefined;
            const allowSelf = !!row.challenges?.allow_self_review;

            return {
              id: String(row.id),
              user_id: String(row.user_id),
              challenge_id: String(row.challenge_id),
              media_url: String(row.media_url || ''),
              media_type: normalizeMediaType(row.media_type),
              submission_date: String(
                row.submission_date || new Date().toISOString()
              ),
              submission_text: row.submission_text ?? undefined,
              status: (row.status as ReviewStatus) ?? 'pending',
              review_notes: row.review_notes ?? undefined,
              reviewer_id: row.reviewer_id ?? undefined,
              verification_date: row.verification_date ?? undefined,
              user: {
                name,
                username,
                avatar_url: avatarUrl,
              },
              challenge: {
                title,
                description: description || undefined,
                verification_description: verificationDescription || undefined,
                allow_self_review: allowSelf,
                category,
              },
            };
          })
          .filter(submission => {
            if (submission.challenge.allow_self_review) return true;
            return submission.user_id !== user?.id;
          });

        setSubmissions(normalized);
        if (normalized.some(submission => submission.status === 'pending')) {
          setQueueClearedAfterDecision(false);
        }
      } catch (error) {
        if (!isCurrent()) return;
        console.error('Error fetching submissions:', error);
        setFetchError('Reviews did not load. Pull to refresh and try again.');
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [challengeId, groupId, user?.id]
  );

  useEffect(() => {
    fetchSubmissions(true);
  }, [fetchSubmissions]);

  useEffect(() => {
    if (
      !initialSubmissionId ||
      loading ||
      appliedInitialSubmissionIdRef.current === initialSubmissionId
    ) {
      return;
    }

    const requestedSubmission = submissions.find(
      submission => submission.id === initialSubmissionId
    );

    if (!requestedSubmission) return;

    setActiveSubmissionId(requestedSubmission.id);
    if (requestedSubmission.status !== 'pending') {
      setFilterStatus('all');
    }
    appliedInitialSubmissionIdRef.current = initialSubmissionId;
  }, [initialSubmissionId, loading, submissions]);

  const filteredSubmissions = useMemo(() => {
    if (filterStatus === 'all') return submissions;
    return submissions.filter(submission => submission.status === filterStatus);
  }, [submissions, filterStatus]);

  const summaryCounts = useMemo(() => {
    return submissions.reduce(
      (acc, submission) => {
        if (submission.status === 'approved') acc.approved += 1;
        if (submission.status === 'rejected') acc.rejected += 1;
        if (submission.status === 'pending') acc.pending += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [submissions]);

  const showClearedReward =
    filterStatus === 'pending' &&
    summaryCounts.pending === 0 &&
    queueClearedAfterDecision &&
    lastDecision === null;
  const reviewScopeTitle = groupId
    ? t('todayProof.review.group_reviews')
    : challengeId
      ? t('todayProof.review.promise_reviews')
      : t('todayProof.review.queue');
  const pendingEmptyTitle =
    entryPoint === 'proof_receipt'
      ? t('todayProof.review.nothing_else')
      : t('todayProof.review.no_submissions');
  const activeSubmission = useMemo(() => {
    if (!activeSubmissionId) return null;
    return (
      filteredSubmissions.find(
        submission => submission.id === activeSubmissionId
      ) ?? null
    );
  }, [activeSubmissionId, filteredSubmissions]);

  const activeEvidenceStatus =
    useMemo<ReviewEvidenceAvailability | null>(() => {
      if (!activeSubmission) return null;
      return getReviewEvidenceStatus(
        {
          mediaType: activeSubmission.media_type,
          mediaUrl: activeSubmission.media_url,
          submissionText: activeSubmission.submission_text,
        },
        evidenceAvailability[activeSubmission.id]
      );
    }, [activeSubmission, evidenceAvailability]);

  const updateEvidenceAvailability = useCallback(
    (submissionId: string, status: ReviewEvidenceAvailability) => {
      setEvidenceAvailability(current =>
        current[submissionId] === status
          ? current
          : { ...current, [submissionId]: status }
      );
    },
    []
  );

  const retryEvidence = useCallback(
    (submissionId: string) => {
      setEvidenceAvailability(current => ({
        ...current,
        [submissionId]: 'loading',
      }));
      setRefreshing(true);
      void fetchSubmissions(false);
    },
    [fetchSubmissions]
  );

  const rejectingSubmission = useMemo(() => {
    if (!rejectingSubmissionId) return null;
    return submissions.find(
      submission => submission.id === rejectingSubmissionId
    );
  }, [rejectingSubmissionId, submissions]);
  const reportingSubmission = useMemo(() => {
    if (!reportingSubmissionId) return null;
    return submissions.find(
      submission => submission.id === reportingSubmissionId
    );
  }, [reportingSubmissionId, submissions]);
  const isRejectingSubmission = !!(
    rejectingSubmission && processingItems.has(rejectingSubmission.id)
  );

  const markProcessingItem = useCallback((submissionId: string) => {
    if (processingItemsRef.current.has(submissionId)) {
      return false;
    }

    processingItemsRef.current.add(submissionId);
    setProcessingItems(new Set(processingItemsRef.current));
    return true;
  }, []);

  const clearProcessingItem = useCallback((submissionId: string) => {
    processingItemsRef.current.delete(submissionId);
    setProcessingItems(new Set(processingItemsRef.current));
  }, []);

  const closeRejectionSheet = useCallback(() => {
    if (
      rejectingSubmission &&
      processingItemsRef.current.has(rejectingSubmission.id)
    ) {
      return;
    }
    setRejectingSubmissionId(null);
    setSelectedRejectionReason(null);
    setCorrectionNote('');
    setRejectionValidationError(false);
  }, [rejectingSubmission]);

  const closeReportSheet = useCallback(() => {
    setReportingSubmissionId(null);
  }, []);

  useEffect(() => {
    if (
      !loading &&
      activeSubmissionId &&
      !filteredSubmissions.some(
        submission => submission.id === activeSubmissionId
      )
    ) {
      setActiveSubmissionId(null);
    }
  }, [activeSubmissionId, filteredSubmissions, loading]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubmissions(false);
  }, [fetchSubmissions]);

  const handleSingleAction = useCallback(
    async (
      submissionId: string,
      action: 'approve' | 'reject',
      feedback?: string
    ) => {
      if (!user?.id) return;

      const resolvedFeedback = (feedback ?? '').trim();
      if (action === 'reject' && !resolvedFeedback) {
        setRejectionValidationError(true);
        return;
      }

      setDecisionError(null);
      setRejectionValidationError(false);
      if (!markProcessingItem(submissionId)) return;

      try {
        const targetSubmission = submissions.find(
          submission => submission.id === submissionId
        );
        const willClearPendingQueue =
          !!targetSubmission &&
          targetSubmission.status === 'pending' &&
          submissions.filter(submission => submission.status === 'pending')
            .length === 1;

        const receipt = await reviewVerification(
          submissionId,
          action === 'approve' ? 'approved' : 'rejected',
          action === 'reject' ? resolvedFeedback : undefined,
          user.id
        );
        if (!mountedRef.current) return;
        onStatusChange?.();

        void emitConfirmedOutcome(
          action === 'approve' ? 'review-approved' : 'correction-requested',
          createConfirmedReceipt('review-decision', receipt.id)
        );

        if (targetSubmission) {
          trackProductEvent('Proof Reviewed', {
            proof_type: targetSubmission.media_type,
            queue_cleared: willClearPendingQueue,
            review_outcome:
              action === 'approve' ? 'approved' : 'correction_requested',
            review_scope:
              targetSubmission.user_id === user.id ? 'self' : 'peer',
          });
        }

        setSubmissions(prev =>
          prev.map(submission =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: receipt.status,
                  review_notes:
                    action === 'reject'
                      ? resolvedFeedback
                      : submission.review_notes,
                }
              : submission
          )
        );

        setSelectedRejectionReason(null);
        setCorrectionNote('');
        setRejectingSubmissionId(null);
        setActiveSubmissionId(null);
        setReviewRewardState({ status: REVIEW_REWARD_IDLE });
        if (willClearPendingQueue) {
          setQueueClearedAfterDecision(true);
        }
        setLastDecision(
          targetSubmission
            ? {
                action,
                username: targetSubmission.user.name,
                challengeTitle: targetSubmission.challenge.title,
                remainingPending: Math.max(0, summaryCounts.pending - 1),
              }
            : null
        );

        try {
          const reward = await claimReviewQueueReward(
            user.id,
            submissionId,
            locale
          );
          if (!mountedRef.current) return;

          if (reward.granted) {
            setReviewRewardState({
              status: REVIEW_REWARD_EARNED,
              amount: reward.amount,
            });
          } else if (reward.alreadyGranted) {
            setReviewRewardState({ status: REVIEW_REWARD_ALREADY_LOGGED });
          } else {
            setReviewRewardState({
              status: REVIEW_REWARD_UNAVAILABLE,
              message:
                reward.message || t('todayProof.review.reward_unconfirmed'),
            });
          }
        } catch (rewardError) {
          if (!mountedRef.current) return;
          console.warn('Review reward claim failed:', rewardError);
          setReviewRewardState({
            status: REVIEW_REWARD_UNAVAILABLE,
            message: t('todayProof.review.reward_failed'),
          });
        }
      } catch (error: unknown) {
        if (!mountedRef.current) return;
        console.error(`Error ${action}ing submission:`, error);
        if (
          error instanceof ReviewDecisionError &&
          (error.code === 'already_decided' ||
            error.code === 'changed_while_reviewing')
        ) {
          setReviewConflict({
            submissionId,
            currentStatus: error.currentStatus,
            unsentCorrectionNote:
              action === 'reject' ? resolvedFeedback || null : null,
          });
          setRejectingSubmissionId(null);
          return;
        }
        if (
          !(error instanceof ReviewDecisionError) ||
          error.code === 'unknown'
        ) {
          setReviewUnknown({ submissionId });
          setRejectingSubmissionId(null);
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : `Failed to ${action} submission`;
        setDecisionError(message);
      } finally {
        if (mountedRef.current) clearProcessingItem(submissionId);
      }
    },
    [
      clearProcessingItem,
      markProcessingItem,
      onStatusChange,
      locale,
      t,
      reviewVerification,
      summaryCounts.pending,
      submissions,
      user?.id,
    ]
  );

  const selectSubmission = useCallback((submissionId: string) => {
    setDecisionError(null);
    setActiveSubmissionId(submissionId);
    void emitHaptic({ type: 'selection' });
  }, []);

  const requestRejection = useCallback((submissionId: string) => {
    setDecisionError(null);
    setRejectionValidationError(false);
    setSelectedRejectionReason(null);
    setCorrectionNote('');
    setRejectingSubmissionId(submissionId);
  }, []);

  const openReportForm = useCallback(
    (submission: ReviewSubmission, category: ReportCategory) => {
      setReportingSubmissionId(null);
      router.push({
        pathname: '/report-issue',
        params: {
          newReport: '1',
          reportKind: 'submission',
          source: category.source,
          challengeId: submission.challenge_id,
          submissionId: submission.id,
          contextLabel: t('todayProof.source.accountability.report_context', {
            name: submission.user.name,
            promise: submission.challenge.title,
          }),
          title: getReportCategoryLabel(category, t),
          userId: submission.user_id,
          userLabel: submission.user.name,
        },
      });
    },
    [router, t]
  );

  const renderStatusDot = (status: ReviewStatus) => (
    <View
      style={[
        styles.statusDot,
        status === 'approved' && styles.statusApproved,
        status === 'rejected' && styles.statusRejected,
      ]}
    />
  );

  const renderSubmissionRow = (submission: ReviewSubmission, index: number) => {
    const isProcessing = processingItems.has(submission.id);
    const MediaIcon =
      submission.media_type === 'video'
        ? VideoIcon
        : submission.media_type === 'text'
          ? TypeIcon
          : ImageIcon;
    const textProofBody = getTextProofBody(submission);

    return (
      <Pressable
        key={submission.id}
        accessibilityRole="button"
        accessibilityLabel={t('todayProof.source.review.item_accessibility', {
          name: submission.user.name,
          promise: submission.challenge.title,
        })}
        accessibilityHint={t('todayProof.review.select_hint')}
        onPress={() => selectSubmission(submission.id)}
        style={({ pressed }) => [
          styles.queueRow,
          index < filteredSubmissions.length - 1
            ? styles.queueRowDivider
            : null,
          pressed && styles.queueRowPressed,
        ]}
      >
        <View style={styles.rowAvatar}>
          <Text style={styles.rowAvatarText}>
            {getInitials(submission.user.name)}
          </Text>
        </View>

        <View style={styles.rowBody}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowTitle} numberOfLines={queueNameLines}>
              {submission.user.name}
            </Text>
            {renderStatusDot(submission.status)}
          </View>
          <Text style={styles.rowMeta} numberOfLines={queueMetaLines}>
            {submission.challenge.title} ·{' '}
            {getMediaLabel(submission.media_type, t)} ·{' '}
            {formatSubmittedAt(submission.submission_date)}
          </Text>
          {submission.media_type === 'text' && textProofBody ? (
            <Text style={styles.rowNote} numberOfLines={queueNoteLines}>
              {textProofBody}
            </Text>
          ) : submission.submission_text ? (
            <Text style={styles.rowNote} numberOfLines={queueNoteLines}>
              {submission.submission_text}
            </Text>
          ) : null}
        </View>

        <View style={styles.rowRight}>
          {isProcessing ? (
            <SkeletonLoader announce={false} height={22} width={22} />
          ) : (
            <View style={styles.mediaTypePill}>
              <MediaIcon size={14} color={colors.text.primary} />
            </View>
          )}
          <Text style={styles.rowActionText}>
            {t('todayProof.review.review_action')}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderProofFocus = () => {
    if (!activeSubmission) return null;

    const textProofBody = getTextProofBody(activeSubmission);
    const promiseTitle = activeSubmission.challenge.title.trim();
    const whatCounts = activeSubmission.challenge.description?.trim();
    const proofRule =
      activeSubmission.challenge.verification_description?.trim();
    const MediaIcon =
      activeSubmission.media_type === 'video'
        ? VideoIcon
        : activeSubmission.media_type === 'text'
          ? TypeIcon
          : ImageIcon;

    return (
      <View style={styles.focusPanel}>
        <View style={styles.proofParticipantRow}>
          <View style={styles.proofAvatar}>
            <Text style={styles.proofAvatarText}>
              {getInitials(activeSubmission.user.name)}
            </Text>
          </View>
          <View style={styles.proofParticipantCopy}>
            <Text
              style={styles.proofParticipantTitle}
              numberOfLines={proofIdentityLines}
            >
              {t('todayProof.review.checked_in', {
                name: activeSubmission.user.name,
              })}
            </Text>
            <Text
              style={styles.proofParticipantMeta}
              numberOfLines={proofIdentityLines}
            >
              {t('todayProof.review.submitted', {
                promise: activeSubmission.challenge.title,
                time: formatSubmittedAt(activeSubmission.submission_date),
              })}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              activeSubmission.status === 'approved' && styles.approvedBadge,
              activeSubmission.status === 'rejected' && styles.rejectedBadge,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {titleCase(activeSubmission.status)}
            </Text>
          </View>
        </View>

        <View style={styles.reviewMediaCard}>
          <View style={styles.mediaFrame}>
            {activeEvidenceStatus === 'unavailable' ? (
              <EvidenceUnavailablePanel
                onRetry={() => retryEvidence(activeSubmission.id)}
                onBack={() => setActiveSubmissionId(null)}
                retrying={refreshing}
              />
            ) : activeSubmission.media_type === 'text' ? (
              <View style={styles.textProofPanel}>
                <View style={styles.textProofHeader}>
                  <View style={styles.textProofIcon}>
                    <TypeIcon size={18} color={colors.text.primary} />
                  </View>
                  <View>
                    <Text style={styles.textProofLabel}>
                      {t('todayProof.promise.text_proof')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.textProofBody}>
                  {textProofBody || t('todayProof.review.no_written')}
                </Text>
              </View>
            ) : activeSubmission.media_type === 'video' &&
              activeSubmission.media_url.trim() ? (
              <ReviewEvidenceVideo
                submissionId={activeSubmission.id}
                uri={activeSubmission.media_url}
                onAvailabilityChange={updateEvidenceAvailability}
                onBack={() => setActiveSubmissionId(null)}
              />
            ) : activeSubmission.media_url &&
              activeSubmission.media_url.trim() ? (
              <ReviewEvidenceImage
                submissionId={activeSubmission.id}
                uri={activeSubmission.media_url}
                onAvailabilityChange={updateEvidenceAvailability}
                onBack={() => setActiveSubmissionId(null)}
              />
            ) : (
              <EvidenceUnavailablePanel
                onRetry={() => retryEvidence(activeSubmission.id)}
                onBack={() => setActiveSubmissionId(null)}
                retrying={refreshing}
              />
            )}
          </View>

          {activeSubmission.media_type !== 'text' ? (
            <View style={styles.mediaFooter}>
              <View style={styles.mediaFooterLabel}>
                <MediaIcon size={16} color={colors.text.primary} />
                <Text style={styles.mediaFooterTitle}>
                  {getMediaLabel(activeSubmission.media_type, t)}
                </Text>
              </View>
              <Text style={styles.mediaFooterAction}>
                {activeEvidenceStatus === 'unavailable'
                  ? t('todayProof.review.preview_unavailable')
                  : activeSubmission.media_type === 'video'
                    ? t('todayProof.review.play_full')
                    : t('todayProof.review.tap_zoom')}
              </Text>
            </View>
          ) : null}
        </View>

        {activeEvidenceStatus === 'available' ? (
          <PromiseArtefact
            compact
            promise={promiseTitle}
            countsWhen={whatCounts}
            proofRule={proofRule}
            style={styles.reviewPromiseArtefact}
            testID="review-promise-artefact"
          />
        ) : null}

        {activeSubmission.media_type !== 'text' &&
        activeSubmission.submission_text ? (
          <View style={styles.noteBlock}>
            <Text style={styles.noteLabel}>
              {t('todayProof.review.participant_note')}
            </Text>
            <Text style={styles.noteText}>
              {activeSubmission.submission_text}
            </Text>
          </View>
        ) : null}

        {activeSubmission.review_notes ? (
          <View style={styles.noteBlock}>
            <Text style={styles.noteLabel}>
              {t('todayProof.review.feedback')}
            </Text>
            <Text style={styles.noteText}>{activeSubmission.review_notes}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderClearedReward = () => {
    const rewardTitle =
      reviewRewardState.status === 'earned'
        ? t('todayProof.review.reward_added_amount', {
            amount: reviewRewardState.amount,
          })
        : reviewRewardState.status === 'already_logged'
          ? t('todayProof.review.reward_added')
          : reviewRewardState.status === 'unavailable'
            ? reviewRewardState.message
            : t('todayProof.review.checking_reward');

    return (
      <View style={styles.clearedReward}>
        <CheckCircleIcon size={34} color={colors.status.success} />
        <View style={styles.rewardCopy}>
          <Text style={styles.rewardTitle}>
            {t('todayProof.review.queue_cleared')}
          </Text>
          <Text style={styles.rewardText}>
            {t('todayProof.review.no_waiting_short')}
          </Text>
        </View>
        <Text style={styles.rewardOutcomeText}>{rewardTitle}</Text>

        <View style={styles.rewardActions}>
          <AppButton
            title={returnLabel}
            onPress={returnToOrigin}
            variant="primary"
            size="large"
            fullWidth
          />
          {submissions.length > 0 ? (
            <AppButton
              title={t('todayProof.review.show_all')}
              onPress={() => setFilterStatus('all')}
              variant="secondary"
              size="medium"
              fullWidth
            />
          ) : null}
        </View>
      </View>
    );
  };

  const renderFilter = (status: FilterStatus) => {
    const count =
      status === 'all'
        ? submissions.length
        : status === 'pending'
          ? summaryCounts.pending
          : status === 'approved'
            ? summaryCounts.approved
            : summaryCounts.rejected;
    const isSelected = filterStatus === status;

    return (
      <Pressable
        key={status}
        accessibilityRole="button"
        accessibilityLabel={t('todayProof.review.filter_accessibility', {
          status: getFilterLabel(status, t),
        })}
        accessibilityState={{ selected: isSelected }}
        onPress={() => {
          setFilterStatus(status);
          setActiveSubmissionId(null);
        }}
        style={({ pressed }) => [
          styles.filterRow,
          isSelected && styles.filterRowSelected,
          pressed && styles.filterRowPressed,
        ]}
      >
        <Text
          style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
        >
          {getFilterLabel(status, t)}
        </Text>
        <Text
          style={[styles.filterCount, isSelected && styles.filterCountSelected]}
        >
          {count}
        </Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ReviewQueueSkeleton onBack={() => backOrReplace(router, '/(tabs)')} />
    );
  }

  if (reviewConflict) {
    return (
      <View style={styles.container} testID="review-changed-state">
        <View style={styles.header}>
          <AppTopBar
            title={t('todayProof.review.changed')}
            onBack={() => setReviewConflict(null)}
          />
        </View>

        <View style={styles.errorNotice}>
          <Text style={styles.errorTitle}>
            {t('todayProof.review.reload_title')}
          </Text>
          <Text style={styles.errorCopy}>
            {reviewConflict.unsentCorrectionNote
              ? t(
                  'todayProof.source.review.changed_detail_with_note_preserved',
                  {
                    note: reviewConflict.unsentCorrectionNote,
                  }
                )
              : t('todayProof.review.changed_detail')}
          </Text>
          {reviewConflict.currentStatus ? (
            <Text style={styles.errorCopy}>
              {t('todayProof.review.current_status', {
                status: getReviewStatusLabel(reviewConflict.currentStatus, t),
              })}
            </Text>
          ) : null}
          <View style={styles.errorActions}>
            <AppButton
              title={t('todayProof.review.reload')}
              onPress={() => {
                setLoading(true);
                setReviewConflict(null);
                setFilterStatus('all');
                setActiveSubmissionId(reviewConflict.submissionId);
                void fetchSubmissions(true);
              }}
              variant="primary"
              size="medium"
            />
            <AppButton
              title={t('todayProof.review.back_queue')}
              onPress={() => {
                setReviewConflict(null);
                setActiveSubmissionId(null);
                setSelectedRejectionReason(null);
              }}
              variant="secondary"
              size="medium"
            />
          </View>
        </View>
      </View>
    );
  }

  if (reviewUnknown) {
    return (
      <View style={styles.container} testID="review-result-unknown-state">
        <View style={styles.header}>
          <AppTopBar
            title={t('todayProof.source.accountability.review_result_unknown')}
          />
        </View>

        <View style={styles.errorNotice}>
          <Text style={styles.errorTitle}>
            {t('todayProof.source.accountability.check_proof_before_retry')}
          </Text>
          <Text style={styles.errorCopy}>
            {t('todayProof.source.accountability.review_unknown_detail')}
          </Text>
          <View style={styles.errorActions}>
            <AppButton
              title={t('todayProof.source.accountability.check_review_status')}
              onPress={() => {
                setLoading(true);
                setReviewUnknown(null);
                setFilterStatus('all');
                setActiveSubmissionId(reviewUnknown.submissionId);
                void fetchSubmissions(true);
              }}
              variant="primary"
              size="medium"
            />
            <AppButton
              title={returnLabel}
              onPress={returnToOrigin}
              variant="secondary"
              size="medium"
            />
          </View>
        </View>
      </View>
    );
  }

  if (lastDecision) {
    const approved = lastDecision.action === 'approve';
    return (
      <View
        style={styles.container}
        testID={
          approved ? 'review-approved-receipt' : 'review-correction-receipt'
        }
      >
        <View style={styles.header}>
          <AppTopBar
            title={t('todayProof.review.saved')}
            onBack={() => setLastDecision(null)}
          />
          <View style={styles.reviewThesis}>
            <Text style={[styles.reviewTitle, styles.reviewReceiptTitle]}>
              {approved
                ? t('todayProof.review.approved_receipt', {
                    name: lastDecision.username,
                  })
                : t('todayProof.review.retry_receipt', {
                    name: lastDecision.username,
                  })}
            </Text>
            <Text style={styles.reviewCopy}>
              {approved
                ? t('todayProof.review.approved_detail', {
                    promise: lastDecision.challengeTitle,
                  })
                : t('todayProof.review.feedback_sent')}
            </Text>
          </View>
        </View>

        <View style={styles.errorActions}>
          <AppButton
            title={
              lastDecision.remainingPending > 0
                ? `Review next proof (${lastDecision.remainingPending})`
                : t('todayProof.review.cleared')
            }
            onPress={() => setLastDecision(null)}
            variant="primary"
            size="large"
          />
          <AppButton
            title={
              returnsToGroupBoard
                ? t('todayProof.review.see_group')
                : t('todayProof.review.back_today')
            }
            onPress={returnToOrigin}
            variant="secondary"
            size="large"
          />
        </View>
      </View>
    );
  }

  const isProofDetail = !!activeSubmission && !showClearedReward;
  const canShowAllSubmissionsAction =
    filterStatus !== 'all' && submissions.length > 0;

  return (
    <View style={styles.container}>
      {!showClearedReward ? (
        <View style={styles.header}>
          <AppTopBar
            title={
              isProofDetail ? t('todayProof.review.review') : reviewScopeTitle
            }
            titleIsHeading={!isProofDetail}
            subtitle={
              isProofDetail
                ? t('todayProof.review.approve_or_clearer')
                : summaryCounts.pending > 0
                  ? t('todayProof.review.pending_count', {
                      count: summaryCounts.pending,
                    })
                  : t('todayProof.review.no_waiting')
            }
            onBack={() => {
              if (isProofDetail) {
                setActiveSubmissionId(null);
                return;
              }
              backOrReplace(router, '/(tabs)');
            }}
            trailing={
              isProofDetail && activeSubmission ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('todayProof.review.report')}
                  accessibilityHint={t('todayProof.review.report_hint')}
                  accessibilityState={{
                    disabled: processingItems.has(activeSubmission.id),
                  }}
                  disabled={processingItems.has(activeSubmission.id)}
                  onPress={() => setReportingSubmissionId(activeSubmission.id)}
                  style={({ pressed }) => [
                    styles.headerReportButton,
                    pressed && styles.headerReportButtonPressed,
                  ]}
                >
                  <AlertTriangleIcon size={18} color={colors.text.secondary} />
                </Pressable>
              ) : undefined
            }
          />

          {!isProofDetail ? (
            <>
              <View style={styles.filterList}>{FILTERS.map(renderFilter)}</View>
              {summaryCounts.pending > 0 ? (
                <Text style={styles.reviewReputationNote}>
                  {getReviewRewardHint()}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.clearedHeader}>
          <Text style={styles.clearedHeaderTitle}>
            {t('todayProof.review.queue')}
          </Text>
        </View>
      )}

      {fetchError ? (
        <View style={styles.errorNotice}>
          <Text style={styles.errorTitle}>
            {t('todayProof.review.refresh_needed')}
          </Text>
          <Text style={styles.errorCopy}>{fetchError}</Text>
          <View style={styles.errorActions}>
            <AppButton
              title={t('todayProof.promise.try_again')}
              onPress={handleRefresh}
              variant="secondary"
              size="medium"
              loading={refreshing}
              disabled={refreshing}
            />
          </View>
        </View>
      ) : null}

      {decisionError && !rejectingSubmission ? (
        <View style={styles.routeNotice}>
          <AppInlineNotice
            title={t('todayProof.review.not_saved')}
            description={t('todayProof.review.not_saved_detail', {
              error: decisionError,
            })}
            tone="error"
            actionLabel="Dismiss"
            onAction={() => setDecisionError(null)}
            testID="review-decision-error"
          />
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          activeSubmission?.status === 'pending' && styles.scrollWithAction,
          isProofDetail && styles.detailScrollContent,
          showClearedReward && styles.clearedScrollContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text.primary}
            colors={[colors.text.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {fetchError ? null : isProofDetail ? (
          renderProofFocus()
        ) : filteredSubmissions.length === 0 ? (
          showClearedReward ? (
            renderClearedReward()
          ) : (
            <View style={styles.emptyState}>
              <CheckCircleIcon size={34} color={colors.text.primary} />
              <Text style={styles.emptyTitle}>
                {filterStatus === 'pending'
                  ? pendingEmptyTitle
                  : `No ${filterStatus} proofs here`}
              </Text>
              <Text style={styles.emptyCopy}>
                {getEmptyCopy(filterStatus, t, { entryPoint })}
              </Text>
              {(entryPoint === 'proof_receipt' || returnsToGroupBoard) &&
              filterStatus === 'pending' ? (
                <AppButton
                  title={returnLabel}
                  onPress={returnToOrigin}
                  variant="primary"
                  size="medium"
                />
              ) : null}
              {canShowAllSubmissionsAction ? (
                <AppButton
                  title={t('todayProof.review.show_all_submissions')}
                  onPress={() => setFilterStatus('all')}
                  variant="secondary"
                  size="medium"
                />
              ) : null}
            </View>
          )
        ) : (
          <>
            <View style={styles.queueList}>
              {filteredSubmissions.map(renderSubmissionRow)}
            </View>
            {renderProofFocus()}
          </>
        )}
      </ScrollView>

      {activeSubmission?.status === 'pending' &&
      activeEvidenceStatus === 'available' ? (
        <View style={styles.bottomAction}>
          <View style={styles.bottomActionCopy}>
            <Text style={styles.bottomActionTitle}>
              {t('todayProof.review.match_promise')}
            </Text>
          </View>
          <View style={styles.bottomActionButtons}>
            <AppButton
              title={t('todayProof.review.ask_new')}
              onPress={() => requestRejection(activeSubmission.id)}
              variant="destructive"
              size="medium"
              style={styles.bottomActionButton}
              disabled={processingItems.has(activeSubmission.id)}
              accessibilityLabel={t('todayProof.review.reject')}
              leftIcon={
                <ThumbsDownIcon size={17} color={colors.status.error} />
              }
            />
            <AppButton
              title={t('todayProof.review.approve')}
              onPress={() => handleSingleAction(activeSubmission.id, 'approve')}
              variant="accent"
              size="medium"
              style={styles.bottomActionButton}
              disabled={processingItems.has(activeSubmission.id)}
              loading={processingItems.has(activeSubmission.id)}
              accessibilityLabel={t('todayProof.review.approve_submission')}
              leftIcon={<ThumbsUpIcon size={17} color={mentaColors.canvas} />}
            />
          </View>
        </View>
      ) : null}

      {rejectingSubmission ? (
        <SimpleBottomSheet
          visible={true}
          onClose={closeRejectionSheet}
          dismissOnBackdrop={!isRejectingSubmission}
          maxHeight={560}
          testID="review-reject-reason-sheet"
          scrollableBody={
            <>
              <View style={styles.sheetHeader}>
                <View>
                  <Text accessibilityRole="header" style={styles.sheetTitle}>
                    {t('todayProof.review.why_retry')}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('todayProof.review.close_reasons')}
                  accessibilityState={{ disabled: isRejectingSubmission }}
                  disabled={isRejectingSubmission}
                  onPress={closeRejectionSheet}
                  style={[
                    styles.sheetClose,
                    isRejectingSubmission && styles.sheetCloseDisabled,
                  ]}
                >
                  <XIcon size={18} color={colors.text.primary} />
                </Pressable>
              </View>

              <Text style={styles.sheetCopy}>
                {t('todayProof.review.reason_prompt', {
                  name: rejectingSubmission.user.name,
                })}
              </Text>

              <View style={styles.reasonList}>
                {REJECTION_REASON_OPTIONS.map(reason => {
                  const selected = selectedRejectionReason === reason;
                  return (
                    <Pressable
                      key={reason}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected,
                        disabled: isRejectingSubmission,
                      }}
                      accessibilityLabel={getRejectionReasonLabel(reason, t)}
                      disabled={isRejectingSubmission}
                      onPress={() => {
                        setSelectedRejectionReason(reason);
                        setDecisionError(null);
                        setRejectionValidationError(false);
                      }}
                      style={({ pressed }) => [
                        styles.reasonRow,
                        selected && styles.reasonRowSelected,
                        isRejectingSubmission && styles.reasonRowDisabled,
                        pressed && styles.reasonRowPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.reasonIcon,
                          selected && styles.reasonIconSelected,
                        ]}
                      >
                        {selected ? (
                          <CheckCircleIcon
                            size={16}
                            color={mentaColors.canvas}
                          />
                        ) : null}
                      </View>
                      <Text style={styles.reasonText}>
                        {getRejectionReasonLabel(reason, t)}
                      </Text>
                      <ChevronRightIcon
                        size={16}
                        color={colors.text.tertiary}
                      />
                    </Pressable>
                  );
                })}
              </View>

              {selectedRejectionReason ? (
                <AppTextArea
                  accessibilityLabel={t(
                    'todayProof.source.accountability.correction_note_accessibility'
                  )}
                  containerStyle={styles.correctionNoteField}
                  editable={!isRejectingSubmission}
                  helperText={t(
                    'todayProof.source.accountability.character_count',
                    {
                      current: correctionNote.length,
                      max: CORRECTION_NOTE_MAX_LENGTH,
                    }
                  )}
                  label={t(
                    'todayProof.source.accountability.correction_note_label'
                  )}
                  maxLength={CORRECTION_NOTE_MAX_LENGTH}
                  numberOfLines={4}
                  onChangeText={value => {
                    setCorrectionNote(
                      value.slice(0, CORRECTION_NOTE_MAX_LENGTH)
                    );
                    setDecisionError(null);
                  }}
                  placeholder={t(
                    'todayProof.source.accountability.correction_note_placeholder',
                    { name: rejectingSubmission.user.name }
                  )}
                  testID="review-correction-note"
                  textAlignVertical="top"
                  value={correctionNote}
                />
              ) : null}

              {decisionError ? (
                <AppInlineNotice
                  title={t(
                    'todayProof.source.accountability.feedback_not_sent'
                  )}
                  description={t(
                    'todayProof.source.accountability.feedback_preserved',
                    { error: decisionError }
                  )}
                  tone="error"
                  testID="review-correction-send-error"
                />
              ) : null}

              {rejectionValidationError ? (
                <AppInlineNotice
                  title={t('todayProof.review.choose_reason')}
                  description={t('todayProof.review.reason_detail')}
                  tone="warning"
                  testID="review-correction-reason-required"
                />
              ) : null}
            </>
          }
          footer={
            <View style={styles.rejectSheetActions}>
              <AppButton
                title={t('todayProof.review.keep_reviewing')}
                onPress={closeRejectionSheet}
                variant="secondary"
                size="medium"
                fullWidth
                disabled={isRejectingSubmission}
              />
              <AppButton
                title={
                  isRejectingSubmission
                    ? t('todayProof.review.sending_retry')
                    : t('fullAuth.report_issue.send_feedback')
                }
                onPress={() => {
                  if (!selectedRejectionReason) {
                    setRejectionValidationError(true);
                    return;
                  }

                  handleSingleAction(
                    rejectingSubmission.id,
                    'reject',
                    buildCorrectionFeedback(
                      selectedRejectionReason,
                      correctionNote
                    )
                  );
                }}
                variant="primary"
                size="medium"
                fullWidth
                disabled={
                  !selectedRejectionReason ||
                  processingItems.has(rejectingSubmission.id)
                }
                loading={processingItems.has(rejectingSubmission.id)}
              />
            </View>
          }
        />
      ) : null}

      {reportingSubmission ? (
        <SimpleBottomSheet
          visible={true}
          onClose={closeReportSheet}
          maxHeight={430}
          testID="review-report-category-sheet"
          scrollableBody={
            <>
              <View style={styles.sheetHeader}>
                <Text accessibilityRole="header" style={styles.sheetTitle}>
                  {t('todayProof.review.report')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    'todayProof.source.accountability.close_report_options'
                  )}
                  onPress={closeReportSheet}
                  style={styles.sheetClose}
                >
                  <XIcon size={18} color={colors.text.primary} />
                </Pressable>
              </View>
              <Text style={styles.sheetCopy}>
                {t('todayProof.source.accountability.report_help')}
              </Text>
              <View style={styles.reasonList}>
                {REPORT_CATEGORY_OPTIONS.map(category => (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={getReportCategoryLabel(category, t)}
                    onPress={() =>
                      openReportForm(reportingSubmission, category)
                    }
                    style={({ pressed }) => [
                      styles.reasonRow,
                      pressed && styles.reasonRowPressed,
                    ]}
                  >
                    <View style={styles.reasonIcon}>
                      <AlertTriangleIcon
                        size={16}
                        color={colors.text.secondary}
                      />
                    </View>
                    <Text style={styles.reasonText}>
                      {getReportCategoryLabel(category, t)}
                    </Text>
                    <ChevronRightIcon size={16} color={colors.text.tertiary} />
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    'todayProof.source.accountability.back_to_proof'
                  )}
                  onPress={closeReportSheet}
                  style={({ pressed }) => [
                    styles.reasonRow,
                    pressed && styles.reasonRowPressed,
                  ]}
                >
                  <Text style={styles.reasonText}>
                    {t('todayProof.source.accountability.back_to_proof')}
                  </Text>
                </Pressable>
              </View>
            </>
          }
        />
      ) : null}
    </View>
  );
};

const reviewQueueSkeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    gap: mentaSpacing[3],
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[2],
  },
  question: {
    gap: mentaSpacing[3],
    paddingBottom: mentaSpacing[2],
    paddingTop: mentaSpacing[3],
  },
  questionMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  questionIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  evidence: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    height: 268,
    overflow: 'hidden',
  },
  evidenceFooter: {
    gap: mentaSpacing[2],
    padding: mentaSpacing[3],
  },
  promise: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    height: 130,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  promiseReviewer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  promiseReviewerCopy: {
    gap: mentaSpacing[1],
  },
  decisions: {
    gap: mentaSpacing[2],
    marginTop: 'auto',
    paddingBottom: mentaSpacing[2],
    paddingTop: mentaSpacing[3],
  },
});

const createStyles = (theme: ThemeContextType) => {
  const s = theme.spacing;
  const f = theme.typography.sizes;
  const br = theme.borderRadius;
  const c = theme.colors;
  const transparent = (color: string, opacity: number) =>
    theme.colorUtils?.withOpacity
      ? theme.colorUtils.withOpacity(color, opacity)
      : color;
  const displaySize = f['3xl'] || 28;
  const headingSize = f['2xl'] || 24;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    header: {
      paddingHorizontal: s.lg,
      paddingTop: s.sm,
      paddingBottom: s.md,
      gap: s.md,
      backgroundColor: c.background.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border.secondary,
    },
    headerReportButton: {
      width: mentaLayout.minimumTouchTarget,
      height: mentaLayout.minimumTouchTarget,
      borderRadius: br.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border.secondary,
      backgroundColor: 'transparent',
    },
    headerReportButtonPressed: {
      opacity: 0.72,
    },
    clearedHeader: {
      minHeight: 64,
      paddingHorizontal: s.lg,
      paddingTop: s.lg,
      paddingBottom: s.sm,
      alignItems: 'center',
      backgroundColor: c.background.primary,
    },
    clearedHeaderTitle: {
      color: c.text.primary,
      fontSize: f.lg,
      fontWeight: '800',
    },
    reviewThesis: {
      gap: s.xs,
    },
    reviewTitle: {
      color: c.text.primary,
      fontSize: displaySize,
      lineHeight: displaySize * 1.08,
      fontWeight: '700',
    },
    reviewCopy: {
      color: c.text.secondary,
      fontSize: f.base,
      lineHeight: 22,
      maxWidth: 560,
    },
    reviewReceiptTitle: {
      ...mentaTypography.title,
    },
    reviewReputationNote: {
      color: c.text.secondary,
      fontSize: f.sm,
      lineHeight: 20,
    },
    filterList: {
      minHeight: 48,
      flexDirection: 'row',
      padding: 4,
      borderRadius: br.full,
      borderWidth: 1,
      borderColor: c.border.secondary,
      backgroundColor: c.background.secondary,
    },
    filterRow: {
      flex: 1,
      minHeight: mentaLayout.minimumTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.xs,
      borderRadius: br.full,
    },
    filterRowSelected: {
      backgroundColor: c.interactive.primary,
    },
    filterRowPressed: {
      opacity: 0.72,
    },
    filterLabel: {
      color: c.text.secondary,
      fontSize: f.base,
      fontWeight: '500',
    },
    filterLabelSelected: {
      color: c.text.inverse,
      fontWeight: '700',
    },
    filterCount: {
      color: c.text.tertiary,
      fontSize: f.sm,
      fontWeight: '600',
    },
    filterCountSelected: {
      color: c.text.inverse,
    },
    routeNotice: {
      paddingHorizontal: mentaSpacing[4],
      paddingTop: mentaSpacing[3],
    },
    errorNotice: {
      margin: s.lg,
      marginBottom: 0,
      padding: s.md,
      borderRadius: br.lg,
      borderWidth: 1,
      borderColor: transparent(c.status.error, 0.45),
      backgroundColor: transparent(c.status.error, 0.1),
    },
    errorTitle: {
      color: c.text.primary,
      fontSize: f.base,
      fontWeight: '700',
    },
    errorCopy: {
      color: c.text.secondary,
      fontSize: f.sm,
      lineHeight: 20,
      marginTop: s.xs,
    },
    errorActions: {
      marginTop: s.md,
      alignItems: 'flex-start',
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: s.lg,
      paddingTop: s.md,
      paddingBottom: s['2xl'],
      gap: s.lg,
    },
    detailScrollContent: {
      paddingTop: s.lg,
    },
    clearedScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    scrollWithAction: {
      paddingBottom: s.lg,
    },
    queueList: {
      borderBottomColor: c.border.secondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border.secondary,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    queueRow: {
      minHeight: 78,
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.md,
      paddingHorizontal: s.sm,
      paddingVertical: s.sm,
    },
    queueRowDivider: {
      borderBottomColor: c.border.secondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    queueRowPressed: {
      opacity: 0.72,
    },
    rowAvatar: {
      width: 44,
      height: 44,
      borderRadius: br.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: transparent(c.interactive.primary, 0.16),
      borderWidth: 1,
      borderColor: transparent(c.interactive.primary, 0.34),
      flexShrink: 0,
    },
    rowAvatarText: {
      color: c.text.primary,
      fontSize: f.sm,
      fontWeight: '800',
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    rowTitleLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
    },
    rowTitle: {
      flex: 1,
      color: c.text.primary,
      fontSize: f.base,
      fontWeight: '700',
    },
    rowMeta: {
      color: c.text.secondary,
      fontSize: f.sm,
    },
    rowNote: {
      color: c.text.tertiary,
      fontSize: f.sm,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      flexShrink: 0,
    },
    mediaTypePill: {
      width: 32,
      height: 32,
      borderRadius: br.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.interactive.secondary,
      borderWidth: 1,
      borderColor: c.border.secondary,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: br.full,
      backgroundColor: c.status.warning,
    },
    statusApproved: {
      backgroundColor: c.status.success,
    },
    statusRejected: {
      backgroundColor: c.status.error,
    },
    rowActionText: {
      color: c.interactive.primary,
      fontSize: f.sm,
      fontWeight: '800',
    },
    focusPanel: {
      gap: s.md,
    },
    proofParticipantRow: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.md,
    },
    proofAvatar: {
      width: 48,
      height: 48,
      borderRadius: br.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: transparent(c.interactive.primary, 0.18),
      borderWidth: 1,
      borderColor: transparent(c.interactive.primary, 0.38),
      flexShrink: 0,
    },
    proofAvatarText: {
      color: c.text.primary,
      fontSize: f.base,
      fontWeight: '800',
    },
    proofParticipantCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    proofParticipantTitle: {
      color: c.text.primary,
      fontSize: f.lg,
      fontWeight: '800',
    },
    proofParticipantMeta: {
      color: c.text.secondary,
      fontSize: f.sm,
      lineHeight: 19,
    },
    statusBadge: {
      borderRadius: br.full,
      borderWidth: 1,
      borderColor: c.border.primary,
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      backgroundColor: c.background.tertiary,
    },
    approvedBadge: {
      borderColor: transparent(c.status.success, 0.5),
      backgroundColor: transparent(c.status.success, 0.12),
    },
    rejectedBadge: {
      borderColor: transparent(c.status.error, 0.5),
      backgroundColor: transparent(c.status.error, 0.12),
    },
    statusBadgeText: {
      color: c.text.primary,
      fontSize: f.xs,
      fontWeight: '700',
    },
    reviewMediaCard: {
      borderRadius: br.lg,
      backgroundColor: c.background.secondary,
      borderWidth: 1,
      borderColor: c.border.secondary,
      overflow: 'hidden',
    },
    mediaFrame: {
      overflow: 'hidden',
      backgroundColor: c.background.secondary,
    },
    textProofPanel: {
      minHeight: 168,
      padding: s.lg,
      gap: s.lg,
      justifyContent: 'center',
      backgroundColor: c.background.secondary,
    },
    textProofHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.md,
    },
    textProofIcon: {
      width: 42,
      height: 42,
      borderRadius: br.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: transparent(c.text.primary, 0.08),
      borderWidth: 1,
      borderColor: c.border.secondary,
    },
    textProofLabel: {
      color: c.text.tertiary,
      fontSize: f.sm,
      fontWeight: '700',
    },
    textProofBody: {
      ...mentaTypography.title,
      color: c.text.primary,
    },
    mediaFooter: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s.md,
      paddingHorizontal: s.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border.secondary,
      backgroundColor: c.background.primary,
    },
    mediaFooterLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      flex: 1,
      minWidth: 0,
    },
    mediaFooterTitle: {
      color: c.text.primary,
      fontSize: f.sm,
      fontWeight: '800',
    },
    mediaFooterAction: {
      color: c.interactive.primary,
      fontSize: f.sm,
      fontWeight: '800',
    },
    reviewPromiseArtefact: {
      marginVertical: s.sm,
    },
    contextList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border.secondary,
    },
    contextRow: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border.secondary,
    },
    contextText: {
      color: c.text.secondary,
      fontSize: f.sm,
    },
    noteBlock: {
      paddingVertical: s.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border.secondary,
      gap: s.xs,
    },
    noteLabel: {
      color: c.text.tertiary,
      fontSize: f.sm,
      fontWeight: '700',
    },
    noteText: {
      color: c.text.secondary,
      fontSize: f.base,
      lineHeight: 23,
    },
    bottomAction: {
      paddingHorizontal: s.lg,
      paddingTop: s.md,
      paddingBottom: s.lg,
      gap: s.md,
      backgroundColor: c.background.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border.primary,
    },
    bottomActionCopy: {
      gap: 3,
    },
    bottomActionTitle: {
      color: c.text.primary,
      fontSize: f.base,
      fontWeight: '700',
    },
    bottomActionButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: s.sm,
    },
    bottomActionButton: {
      flex: 1,
      minWidth: 140,
    },
    emptyState: {
      minHeight: 320,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.md,
      paddingHorizontal: s.lg,
    },
    emptyTitle: {
      color: c.text.primary,
      fontSize: headingSize,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptyCopy: {
      color: c.text.secondary,
      fontSize: f.base,
      lineHeight: 22,
      textAlign: 'center',
    },
    clearedReward: {
      minHeight: 520,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.lg,
      paddingHorizontal: s.md,
      paddingVertical: s.xl,
    },
    rewardCopy: {
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: s.sm,
    },
    rewardTitle: {
      ...mentaTypography.title,
      color: c.text.primary,
      textAlign: 'center',
    },
    rewardText: {
      color: c.text.secondary,
      fontSize: f.base,
      lineHeight: 22,
      textAlign: 'center',
    },
    rewardOutcomeText: {
      color: c.text.secondary,
      fontSize: f.sm,
      lineHeight: 19,
      maxWidth: 360,
      textAlign: 'center',
    },
    rewardActions: {
      width: '100%',
      maxWidth: 360,
      gap: s.sm,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: s.md,
      marginBottom: s.sm,
    },
    sheetTitle: {
      ...mentaTypography.title,
      color: c.text.primary,
    },
    sheetClose: {
      width: mentaLayout.minimumTouchTarget,
      height: mentaLayout.minimumTouchTarget,
      borderRadius: br.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.interactive.secondary,
    },
    sheetCloseDisabled: {
      opacity: 0.48,
    },
    sheetCopy: {
      color: c.text.secondary,
      fontSize: f.base,
      lineHeight: 22,
      marginBottom: s.md,
    },
    reasonList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border.secondary,
    },
    reasonRow: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border.secondary,
      paddingVertical: s.md,
    },
    reasonRowPressed: {
      opacity: 0.72,
    },
    reasonRowSelected: {
      backgroundColor: transparent(c.interactive.primary, 0.1),
    },
    reasonRowDisabled: {
      opacity: 0.62,
    },
    reasonIcon: {
      width: 32,
      height: 32,
      borderRadius: br.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderColor: c.border.secondary,
      borderWidth: StyleSheet.hairlineWidth,
    },
    reasonIconSelected: {
      backgroundColor: c.interactive.primary,
      borderColor: c.interactive.primary,
    },
    reasonText: {
      flex: 1,
      minWidth: 0,
      color: c.text.primary,
      fontSize: f.base,
      lineHeight: 21,
      fontWeight: '500',
    },
    rejectSheetActions: {
      gap: s.sm,
      paddingTop: s.md,
    },
    correctionNoteField: {
      marginTop: s.lg,
    },
  });
};
