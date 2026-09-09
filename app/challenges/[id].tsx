import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { AppButton } from '@/components/ui/AppButton';
import { AppFieldRow } from '@/components/ui/AppFields';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ConfirmDestructiveSheet } from '@/components/ui/ConfirmDestructiveSheet';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import ModalCard from '@/components/ui/modal/ModalCard';
import { AppScreen } from '@/components/ui/AppShell';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { showToast } from '@/components/ui/Toast';
import {
  CheckCircleIcon,
  CopyIcon,
  LogOutIcon,
  QrCodeIcon,
  Share2Icon,
  ShieldIcon,
  TargetIcon,
  Trash2Icon,
  XIcon,
} from '@/components/ui/icons';
import { ChallengeActions } from '@/components/challenge/detail/ChallengeActions';
import { ChallengeHero } from '@/components/challenge/detail/ChallengeHero';
import { ChallengeParticipants } from '@/components/challenge/detail/ChallengeParticipants';
import { DailyLoopPanel } from '@/components/challenge/detail/DailyLoopPanel';
import {
  ChallengeSubmissionPreview,
  ChallengeSubmissions,
} from '@/components/challenge/detail/ChallengeSubmissions';
import {
  ProofConnectionMosaic,
  type ProofConnectionMosaicItem,
} from '@/components/proof/ProofConnectionMosaic';
import {
  AtRiskBanner,
  BrokenStreakRecoveryCard,
  FreezeInventoryCard,
  ProtectedStreakReceipt,
} from '@/components/streak';
import { useAuthStore } from '@/store/auth-store';
import {
  Challenge as StoreChallenge,
  useChallengeStore,
} from '@/store/challenge-store';
import { useGroupStore } from '@/store/group-store';
import { useMomentaStore } from '@/store/momenta-store';
import { useStreakState } from '@/hooks/useStreakState';
import { usePromiseAccountability } from '@/hooks/usePromiseAccountability';
import { supabase } from '@/lib/supabase';
import { getDaysRemainingGlobal } from '@/utils/timezone';
import type { ProofMediaType } from '@/lib/proof-types';
import {
  getCorrectionFollowUpNote,
  sanitizeCorrectionReason,
} from '@/lib/proof-correction-copy';
import {
  getPowerUpDisplayCopy,
  getPowerUpSupport,
  isPowerUpSupported,
  powerUpIsAutoConsumed,
  powerUpRequiresChallengeId,
} from '@/lib/shop/powerUpSupport';
import { buildInviteShareUrl } from '@/lib/invite-links';
import { useNetworkState } from '@/lib/network';
import {
  createPromiseDetailLoadFailure,
  decodePromiseDetailLoadFailure,
  getPromiseDetailRecovery,
  type PromiseDetailLoadFailure,
} from '@/lib/promise-detail-recovery';
import { getQueuedProofSubmissions } from '@/lib/services/proof-submission-service';
import { snoozeCoachMessages } from '@/lib/notifications/revealed-habit';
import { createClientEventId } from '@/lib/client-event-id';
import {
  preservePromiseSubmissionStateAfterReadFailure,
  unconfirmedPromiseSubmissionState,
  type PromiseSubmissionState,
} from '@/lib/promise-submission-read';
import {
  PromiseCompleteState,
  PromiseDetailSkeletonState,
  PromiseHistoryState,
  PromiseActiveState,
  PromiseProofDetailState,
  PromiseRulesState,
  PromiseUnavailableState,
  PromiseWaitingReviewState,
  type PromiseHistoryEntry,
  type PromiseRuleRow,
} from '@/components/challenge/promise-runtime-states';
import { buildProofWeek, type ProofWeekRecord } from '@/lib/promise/proof-week';
import {
  formatPromiseFrequency,
  formatPromiseReminderTime,
  isPromiseTermComplete,
  resolveApprovedDayCount,
  resolvePromiseDetailBranch,
  shouldShowSoloActivePromise,
} from '@/lib/promise/promise-detail-presentation';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';
import {
  createConfirmedReceipt,
  emitConfirmedSuccess,
  emitHaptic,
} from '@/lib/motion/haptics';
import { emitPromiseMutationResultHaptic } from '@/lib/motion/promise-mutation-haptics';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  leavePromiseWithRoleAwareFallback,
  reconcilePromiseAccountabilityLeave,
} from '@/lib/promises/accountability';
import {
  unknownPromiseMutation,
  type PromiseMutationResult,
} from '@/lib/promises/mutation-result';
import { useTranslation } from '@/lib/localization';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  formatProofHistoryDetail,
  formatProofRelativeTime,
} from '@/lib/localization/source-formatters';

type Localise = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

type Challenge = Omit<StoreChallenge, 'startDate' | 'endDate'> & {
  startDate?: string | null;
  endDate?: string | null;
  invite_code?: string;
};

type ChallengeVerification = ChallengeSubmissionPreview & {
  challenge_id: string;
  user_id: string;
  media_url: string | null;
  media_type: ProofMediaType;
  status: 'pending' | 'approved' | 'rejected';
  verification_date?: string;
  reviewed_by?: string;
  local_day: string | null;
  encouragement_user_ids: string[];
};

type Participant = {
  id: string;
  username: string;
  avatar_url?: string;
  currentStreak: number;
  joined_at: string;
  status: 'active' | 'completed' | 'dropped' | 'failed';
};

type CompletionData = {
  percentage?: number;
  is_completed?: boolean;
  is_active?: boolean;
  days_remaining?: number;
  completed_days?: number;
  total_days?: number;
} | null;

type InventoryEntry = {
  sku: string;
  name: string;
  remaining: number;
};

type ActivePowerUp = {
  sku: string;
  expires_at: string | null;
  challenge_id: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const relationRecord = (value: unknown): Record<string, unknown> | null => {
  if (Array.isArray(value)) {
    return isRecord(value[0]) ? value[0] : null;
  }
  return isRecord(value) ? value : null;
};

const stringValue = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const optionalStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const numberValue = (value: unknown, fallback = 0) =>
  typeof value === 'number' ? value : fallback;

const boolValue = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const participantStatusValue = (value: unknown): Participant['status'] => {
  const status = stringValue(value, 'active');
  return status === 'completed' || status === 'dropped' || status === 'failed'
    ? status
    : 'active';
};

const parseExpectations = (
  value: unknown,
  allowSelfReview: boolean
): Challenge['expectations'] => {
  if (!isRecord(value)) {
    return {
      requiredDailySubmissions: 1,
      requiresPeerReview: !allowSelfReview,
      reviewersRequired: allowSelfReview ? 0 : 1,
      dailyDeadlineHourUtc: 23,
      graceMinutes: 0,
    };
  }

  const requiresPeerReview =
    typeof value.requires_peer_review === 'boolean'
      ? value.requires_peer_review
      : !allowSelfReview;

  return {
    requiredDailySubmissions: numberValue(value.required_daily_submissions, 1),
    requiresPeerReview,
    reviewersRequired: numberValue(
      value.reviewers_required,
      allowSelfReview ? 0 : 1
    ),
    dailyDeadlineHourUtc: numberValue(value.daily_deadline_hour_utc, 23),
    graceMinutes: numberValue(value.grace_minutes, 0),
  };
};

const mapChallengeRow = (value: unknown): Challenge | null => {
  if (!isRecord(value)) return null;

  const allowSelfReview = boolValue(value.allow_self_review);
  const teamChallenge = relationRecord(value.team_challenges);

  return {
    id: stringValue(value.id),
    title: stringValue(value.title),
    description: stringValue(value.description),
    category: stringValue(value.category, 'general'),
    startDate: typeof value.start_date === 'string' ? value.start_date : null,
    endDate: typeof value.end_date === 'string' ? value.end_date : null,
    duration: numberValue(value.duration, 30),
    createdAt:
      typeof value.created_at === 'string'
        ? value.created_at
        : new Date().toISOString(),
    creatorId: stringValue(value.creator_id),
    verificationType: stringValue(value.verification_type, 'photo'),
    verificationFrequency: stringValue(value.verification_frequency, 'daily'),
    verificationDescription:
      typeof value.verification_description === 'string'
        ? value.verification_description
        : null,
    submissionText:
      typeof value.submission_text === 'string' ? value.submission_text : null,
    isPublic: boolValue(value.is_public, true),
    status: stringValue(value.completion_status ?? value.status, 'active'),
    groupId: teamChallenge ? stringValue(teamChallenge.group_id) : undefined,
    allowSelfReview,
    expectations: parseExpectations(
      value.submission_expectations,
      allowSelfReview
    ),
  };
};

const mapParticipant = (value: unknown): Participant | null => {
  if (!isRecord(value)) return null;
  const profile = relationRecord(value.profiles);

  return {
    id: stringValue(value.user_id),
    username: profile
      ? stringValue(profile.username, 'Anonymous')
      : 'Anonymous',
    avatar_url: profile ? optionalStringValue(profile.avatar_url) : undefined,
    currentStreak: numberValue(value.current_streak),
    joined_at: stringValue(value.joined_at, new Date().toISOString()),
    status: participantStatusValue(value.status),
  };
};

const mapVerification = (value: unknown): ChallengeVerification | null => {
  if (!isRecord(value)) return null;
  const userProfile = relationRecord(value.profiles);
  const reviewerProfile = relationRecord(value.reviewer);
  const status = stringValue(value.status, 'pending');
  const submissionDate = optionalStringValue(value.submission_date);
  if (!submissionDate) return null;
  const verificationStatus: ChallengeVerification['status'] =
    status === 'approved' || status === 'rejected' || status === 'pending'
      ? status
      : 'pending';

  return {
    id: stringValue(value.id),
    challenge_id: stringValue(value.challenge_id),
    user_id: stringValue(value.user_id),
    media_url: typeof value.media_url === 'string' ? value.media_url : null,
    submission_text:
      typeof value.submission_text === 'string' ? value.submission_text : null,
    media_type: (() => {
      const mediaType = stringValue(value.media_type, 'photo');
      if (mediaType === 'video' || mediaType === 'text') return mediaType;
      return 'photo';
    })(),
    status: verificationStatus,
    submission_date: submissionDate,
    local_day: optionalStringValue(value.local_day) ?? null,
    verification_date:
      typeof value.verification_date === 'string'
        ? value.verification_date
        : undefined,
    review_notes:
      typeof value.review_notes === 'string' ? value.review_notes : undefined,
    reviewed_by:
      typeof value.reviewer_id === 'string' ? value.reviewer_id : undefined,
    users: userProfile
      ? {
          username: stringValue(userProfile.username, 'Anonymous'),
          avatar_url:
            typeof userProfile.avatar_url === 'string'
              ? userProfile.avatar_url
              : undefined,
        }
      : undefined,
    reviewer: reviewerProfile
      ? {
          username: stringValue(reviewerProfile.username, 'Reviewer'),
          avatar_url:
            typeof reviewerProfile.avatar_url === 'string'
              ? reviewerProfile.avatar_url
              : undefined,
        }
      : undefined,
    encouragement_user_ids: Array.isArray(value.proof_encouragements)
      ? value.proof_encouragements.flatMap(encouragement =>
          isRecord(encouragement) && typeof encouragement.user_id === 'string'
            ? [encouragement.user_id]
            : []
        )
      : [],
  };
};

const proofDate = (value: string): Date | null => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const localDayFromValue = (value: string | null | undefined): string | null => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? '');
  return match?.[1] ?? null;
};

const isSameLocalDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatProofClock = (
  value: string,
  locale: string,
  localise: Localise
): string => {
  const parsed = proofDate(value);
  if (!parsed) return localise('todayProof.promise.time_unavailable');
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
};

const formatProofDay = (
  value: string,
  locale: string,
  localise: Localise
): string => {
  const parsed = proofDate(value);
  if (!parsed) return localise('todayProof.promise.date_unavailable');
  if (isSameLocalDay(parsed, new Date())) return localise('term.today');
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(parsed);
};

const formatStreakCount = (count: number, localise: Localise): string =>
  count === 1
    ? localise('todayProof.streak.day', { count })
    : localise('todayProof.streak.days', { count });

const verificationMediaLabel = (
  verification: ChallengeVerification,
  localise: Localise
): string => {
  if (verification.media_type === 'text')
    return localise('todayProof.source.media.text');
  if (verification.media_type === 'video')
    return localise('todayProof.source.media.video');
  return localise('todayProof.source.media.photo');
};

const toPromiseHistoryEntry = (
  verification: ChallengeVerification,
  localise: Localise,
  locale: string
): PromiseHistoryEntry => {
  const reviewerName = verification.reviewer?.username?.trim() || null;
  const mediaLabel = verificationMediaLabel(verification, localise);
  const status: PromiseHistoryEntry['status'] =
    verification.status === 'approved'
      ? 'approved'
      : verification.status === 'rejected'
        ? 'needs-retry'
        : 'waiting';

  return {
    id: verification.id,
    kind: 'proof',
    dayLabel: formatProofDay(verification.submission_date, locale, localise),
    timeLabel: formatProofClock(verification.submission_date, locale, localise),
    detail: formatProofHistoryDetail(
      status === 'approved'
        ? 'approved'
        : status === 'needs-retry'
          ? 'rejected'
          : 'pending',
      mediaLabel,
      verification.review_notes,
      localise
    ),
    reviewerName,
    status,
    sortIso: verification.submission_date,
    mediaType: verification.media_type,
    mediaUrl: verification.media_url,
    submissionText: verification.submission_text,
    evidenceTitle: mediaLabel,
    reviewNotes: verification.review_notes,
  };
};

const formatOutcomeHistoryDay = (
  localDay: string,
  locale: string,
  localise: Localise
): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match) return localise('todayProof.promise.day_outcome');

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  ).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
};

const toProofWeekRecords = (
  verifications: readonly ChallengeVerification[]
): ProofWeekRecord[] =>
  verifications.map(verification => ({
    localDay: verification.local_day,
    status: verification.status,
  }));

const QRCodeModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  inviteCode: string;
  challengeTitle: string;
}> = ({ visible, onClose, inviteCode, challengeTitle }) => {
  const { t } = useTranslation();
  const inviteUrl = buildInviteShareUrl('challenge', inviteCode);
  const [inviteNotice, setInviteNotice] = useState<{
    title: string;
    message: string;
    tone: 'info' | 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setInviteNotice(null);
    }
  }, [visible, inviteCode]);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setInviteNotice({
        title: t('todayProof.promise.invite_copied'),
        message: t('todayProof.promise.invite_copied_detail'),
        tone: 'success',
      });
      void emitHaptic({ type: 'selection' });
    } catch (error) {
      console.error('Error copying challenge invite:', error);
      setInviteNotice({
        title: t('todayProof.promise.copy_failed'),
        message: t('todayProof.promise.copy_failed_detail'),
        tone: 'error',
      });
    }
  };

  const shareInvite = async () => {
    try {
      const result = await Share.share({
        message: `Join "${challengeTitle}" on Menta.\nInvite code: ${inviteCode}\n${inviteUrl}`,
        title: `Join ${challengeTitle}`,
      });
      if (result.action === Share.sharedAction) {
        setInviteNotice({
          title: t('todayProof.promise.invite_not_confirmed'),
          message: t('todayProof.promise.invite_still_available'),
          tone: 'info',
        });
      }
    } catch (error) {
      console.error('Error sharing challenge invite:', error);
      setInviteNotice({
        title: t('todayProof.proof.share_failed'),
        message: t('todayProof.promise.share_failed_detail'),
        tone: 'error',
      });
    }
  };

  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      animationType="fade"
      maxWidth={420}
      accessibilityLabel={t('todayProof.promise.close_invite')}
      cardStyle={[
        qrStyles.modalContent,
        {
          backgroundColor: mentaColors.surface,
          borderColor: mentaColors.border,
        },
      ]}
    >
      <View style={qrStyles.modalHeader}>
        <Text accessibilityRole="header" style={qrStyles.modalTitle}>
          {t('todayProof.residual.share_promise')}
        </Text>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            qrStyles.closeButton,
            pressed ? qrStyles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('todayProof.proof.close')}
        >
          <XIcon size={22} color={mentaColors.text.primary} />
        </Pressable>
      </View>

      <View style={qrStyles.qrContainer}>
        <QRCode
          value={inviteUrl}
          size={200}
          backgroundColor={mentaColors.paper}
          color={mentaColors.text.onPaper}
        />
      </View>

      <View style={qrStyles.inviteCodeBox}>
        <Text style={qrStyles.inviteCodeText}>{inviteCode}</Text>
        <Pressable
          onPress={copyToClipboard}
          hitSlop={10}
          style={({ pressed }) => [
            qrStyles.copyIconButton,
            pressed ? qrStyles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('todayProof.promise.copy_invite')}
        >
          <CopyIcon size={20} color={mentaColors.text.primary} />
        </Pressable>
      </View>

      {inviteNotice ? (
        <AppInlineNotice
          title={inviteNotice.title}
          description={inviteNotice.message}
          tone={inviteNotice.tone}
          style={qrStyles.inviteInlineNotice}
          testID="challenge-invite-notice"
        />
      ) : null}

      <View style={qrStyles.modalActions}>
        <AppButton
          title={t('todayProof.promise.copy_code')}
          onPress={copyToClipboard}
          variant="outline"
          size="medium"
          style={qrStyles.modalButton}
        />
        <AppButton
          title={t('todayProof.promise.share_invite')}
          onPress={shareInvite}
          variant="accent"
          size="medium"
          style={qrStyles.modalButton}
        />
      </View>
    </ModalCard>
  );
};

export default function ChallengeDetailScreen() {
  const { t, locale } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const { id, view, proofId, tab } = useLocalSearchParams<{
    id: string;
    view?: string;
    proofId?: string;
    tab?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isAuthenticated, hasCompletedOnboarding } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated || !hasCompletedOnboarding || !user?.id || !id) return;

    const completionStore = useOnboardingCompletionStore.getState();
    const completion = completionStore.peekCompletionForUser(user.id);
    if (
      completion?.accountabilityChoice !== 'just_me' ||
      completion.firstPromiseId !== id
    ) {
      return;
    }

    // Keep the confirmed receipt until its destination mounts, just as the
    // shared-promise invite route does. Consuming it before navigation can
    // replace the onboarding stack with the global startup loader.
    completionStore.consumeCompletionForUser(user.id);
  }, [hasCompletedOnboarding, id, isAuthenticated, user?.id]);
  const { isOnline } = useNetworkState();
  const {
    userChallenges,
    fetchChallenges,
    fetchUserChallenges,
    leaveChallenge,
    deleteChallenge,
    reconcileDeleteChallenge,
    getComprehensiveSubmissionStatus,
    getChallengeCompletion,
    shareChallenge,
  } = useChallengeStore();
  const { groups } = useGroupStore();
  const { usePowerUp: applyPowerUp } = useMomentaStore();
  const {
    streakState,
    isLoading: isStreakStateLoading,
    refresh: refreshStreakState,
  } = useStreakState({
    userId: user?.id,
    challengeId: id,
  });
  const { data: accountabilitySummary } = usePromiseAccountability(id);
  const viewerAccountabilityRole = accountabilitySummary?.members.find(
    member => member.id === user?.id
  )?.role;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [verifications, setVerifications] = useState<ChallengeVerification[]>(
    []
  );
  const [groupVerifications, setGroupVerifications] = useState<
    ChallengeVerification[]
  >([]);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [inventoryEntries, setInventoryEntries] = useState<InventoryEntry[]>(
    []
  );
  const [completionData, setCompletionData] = useState<CompletionData>(null);
  const [submissionState, setSubmissionState] =
    useState<PromiseSubmissionState>(unconfirmedPromiseSubmissionState);
  const [submissionStatusUnavailable, setSubmissionStatusUnavailable] =
    useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'proof' | 'people'>(
    tab === 'proof' || tab === 'people' ? tab : 'overview'
  );
  const [itemsVisible, setItemsVisible] = useState(false);
  const [paperDetailView, setPaperDetailView] = useState<
    'summary' | 'history' | 'rules' | 'proof'
  >('summary');
  const [selectedPaperProofId, setSelectedPaperProofId] = useState<
    string | null
  >(typeof proofId === 'string' ? proofId : null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const encouragementBusyRef = useRef(new Set<string>());
  const [loadFailure, setLoadFailure] =
    useState<PromiseDetailLoadFailure | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [refreshErrorBanner, setRefreshErrorBanner] = useState<string | null>(
    null
  );
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<null | 'leave' | 'delete'>(
    null
  );
  const [workingDestructive, setWorkingDestructive] = useState(false);
  const [promiseMutationRecovery, setPromiseMutationRecovery] =
    useState<Extract<
      PromiseMutationResult,
      { outcome: 'failed' | 'unknown' }
    > | null>(null);
  const [checkingPromiseMutation, setCheckingPromiseMutation] = useState(false);
  const [boostConfirmSku, setBoostConfirmSku] = useState<string | null>(null);
  const [boostClientEventId, setBoostClientEventId] = useState<string | null>(
    null
  );
  const [boostAttemptUnknown, setBoostAttemptUnknown] = useState(false);
  const [boostApplyingSku, setBoostApplyingSku] = useState<string | null>(null);
  const [boostConfirmError, setBoostConfirmError] = useState<string | null>(
    null
  );
  const [showQRModal, setShowQRModal] = useState(false);
  const [isGeneratingInviteCode, setIsGeneratingInviteCode] = useState(false);
  const [isNavigatingToVerification, setIsNavigatingToVerification] =
    useState(false);
  const [hasQueuedProofForChallenge, setHasQueuedProofForChallenge] =
    useState(false);

  useEffect(() => {
    setSubmissionState(unconfirmedPromiseSubmissionState);
    setSubmissionStatusUnavailable(false);
  }, [id, user?.id]);

  const userChallenge = userChallenges.find(uc => uc.challengeId === id);
  const isUserParticipant = Boolean(userChallenge);
  const isCreator = Boolean(
    challenge && user?.id && challenge.creatorId === user.id
  );
  const group = challenge?.groupId
    ? groups.find(item => item.id === challenge.groupId)
    : undefined;

  useEffect(() => {
    if (view === 'history' || view === 'rules') {
      setPaperDetailView(view);
      setSelectedPaperProofId(null);
      return;
    }
    if (view === 'proof' && typeof proofId === 'string') {
      setSelectedPaperProofId(proofId);
      setPaperDetailView('proof');
      return;
    }
    setSelectedPaperProofId(null);
    setPaperDetailView('summary');
  }, [id, proofId, view]);

  useEffect(() => {
    if (user) {
      void fetchChallenges();
      void fetchUserChallenges(user.id);
    }
  }, [fetchChallenges, fetchUserChallenges, user]);

  const fetchChallengeDetails = useCallback(async () => {
    if (!id || !user?.id) {
      setIsDetailLoading(false);
      return;
    }

    setIsDetailLoading(true);
    try {
      const [
        participantResult,
        userVerificationResult,
        groupVerificationResult,
      ] = await Promise.all([
        supabase
          .from('challenge_participants')
          .select(
            `
            user_id,
            current_streak,
            joined_at,
            status,
            profiles (
              username,
              avatar_url
            )
          `
          )
          .eq('challenge_id', id)
          .order('current_streak', { ascending: false }),
        supabase
          .from('challenge_submissions')
          .select(
            `
            *,
            reviewer:profiles!challenge_submissions_reviewer_id_fkey (
              username,
              avatar_url
            ),
            proof_encouragements (
              user_id
            )
          `
          )
          .eq('challenge_id', id)
          .eq('user_id', user.id)
          .order('submission_date', { ascending: false }),
        supabase
          .from('challenge_submissions')
          .select(
            `
            *,
            profiles!challenge_submissions_user_id_fkey (
              username,
              avatar_url
            ),
            reviewer:profiles!challenge_submissions_reviewer_id_fkey (
              username,
              avatar_url
            ),
            proof_encouragements (
              user_id
            )
          `
          )
          .eq('challenge_id', id)
          .order('submission_date', { ascending: false }),
      ]);

      const partialErrors: string[] = [];

      if (participantResult.error) {
        console.error('Error fetching participants:', participantResult.error);
        partialErrors.push('people');
      } else {
        setParticipants(
          (participantResult.data || [])
            .map(mapParticipant)
            .filter((item): item is Participant => Boolean(item))
        );
      }

      if (userVerificationResult.error) {
        console.error(
          'Error fetching user proof:',
          userVerificationResult.error
        );
        partialErrors.push('your proof');
      } else {
        setVerifications(
          (userVerificationResult.data || [])
            .map(mapVerification)
            .filter((item): item is ChallengeVerification => Boolean(item))
        );
      }

      if (groupVerificationResult.error) {
        console.error(
          'Error fetching challenge proof:',
          groupVerificationResult.error
        );
        partialErrors.push('promise proof');
      } else {
        setGroupVerifications(
          (groupVerificationResult.data || [])
            .map(mapVerification)
            .filter((item): item is ChallengeVerification => Boolean(item))
        );
      }

      if (partialErrors.length > 0) {
        setRefreshErrorBanner(t('todayProof.promise.refresh_failed'));
      }
    } catch (err) {
      console.error('Error fetching challenge details:', err);
      setRefreshErrorBanner(t('todayProof.promise.refresh_failed'));
    } finally {
      setIsDetailLoading(false);
    }
  }, [id, t, user?.id]);

  const refreshSubmissionStatus = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      const [submissionData, completion] = await Promise.all([
        getComprehensiveSubmissionStatus(user.id, id),
        getChallengeCompletion(user.id, id),
      ]);

      setSubmissionState({
        hasSubmittedToday: submissionData.hasSubmittedToday,
        submissionStatus: submissionData.submissionStatus,
        canSubmit: submissionData.canSubmit,
        shouldShowPending: submissionData.shouldShowPending,
        shouldShowApproved: submissionData.shouldShowApproved,
        shouldShowRejected: submissionData.shouldShowRejected,
      });
      setSubmissionStatusUnavailable(false);
      setCompletionData(completion as CompletionData);
    } catch (err) {
      console.error('Error checking submission status:', err);
      // Retain the last confirmed status. A transport or RLS failure cannot be
      // translated into a fresh "submit now" state without risking a duplicate
      // proof. The visible action remains blocked until a later read succeeds.
      setSubmissionState(preservePromiseSubmissionStateAfterReadFailure);
      setSubmissionStatusUnavailable(true);
      setRefreshErrorBanner(t('todayProof.promise.refresh_failed'));
    }
  }, [
    getChallengeCompletion,
    getComprehensiveSubmissionStatus,
    id,
    t,
    user?.id,
  ]);

  const refreshQueuedProofStatus = useCallback(async () => {
    if (!id || !user?.id) {
      setHasQueuedProofForChallenge(false);
      return;
    }

    try {
      const queuedProofs = await getQueuedProofSubmissions();
      setHasQueuedProofForChallenge(
        queuedProofs.some(
          queuedProof =>
            queuedProof.userId === user.id && queuedProof.challengeId === id
        )
      );
    } catch (err) {
      console.warn('Could not check queued proof status:', err);
    }
  }, [id, user?.id]);

  const loadChallenge = useCallback(async () => {
    if (!id) {
      setLoadFailure(
        createPromiseDetailLoadFailure({ code: 'ROUTE_NOT_FOUND' })
      );
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      setLoadFailure(
        createPromiseDetailLoadFailure({ code: 'SESSION_REQUIRED' })
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadFailure(null);
    setChallenge(null);

    try {
      // A promise is account-scoped server data. Do not paint or enable an
      // action from a persisted row before the active session proves it can
      // still read the canonical record.
      const { data, error: challengeError } = await supabase
        .from('challenges')
        .select(
          `
              *,
              team_challenges (
                group_id
              )
            `
        )
        .eq('id', id)
        .single();

      if (challengeError) {
        setLoadFailure(decodePromiseDetailLoadFailure(challengeError));
        return;
      }

      if (!data) {
        setLoadFailure(createPromiseDetailLoadFailure({ code: 'PGRST116' }));
        return;
      }

      const mappedChallenge = mapChallengeRow(data);
      if (!mappedChallenge?.id) {
        setLoadFailure(createPromiseDetailLoadFailure({ code: 'PGRST116' }));
        return;
      }
      setChallenge(mappedChallenge);

      await Promise.all([
        fetchChallengeDetails(),
        refreshSubmissionStatus(),
        refreshQueuedProofStatus(),
      ]);
    } catch (err) {
      console.error('Error loading challenge:', err);
      setLoadFailure(decodePromiseDetailLoadFailure(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchChallengeDetails,
    id,
    refreshQueuedProofStatus,
    refreshSubmissionStatus,
    user?.id,
  ]);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge, reloadToken]);

  useFocusEffect(
    useCallback(() => {
      if (!id || !user?.id) return undefined;

      void Promise.all([
        fetchChallenges(),
        fetchUserChallenges(user.id),
        fetchChallengeDetails(),
        refreshSubmissionStatus(),
        refreshQueuedProofStatus(),
        refreshStreakState(),
      ]);

      return undefined;
    }, [
      fetchChallengeDetails,
      fetchChallenges,
      fetchUserChallenges,
      id,
      refreshStreakState,
      refreshQueuedProofStatus,
      refreshSubmissionStatus,
      user?.id,
    ])
  );

  const refreshActivePowerUps = useCallback(async () => {
    if (!user?.id || !id) return;

    try {
      const { data, error: powerUpError } = await supabase
        .from('power_up_usage')
        .select('item_sku, expires_at, is_active, challenge_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (powerUpError || !Array.isArray(data)) return;

      setActivePowerUps(
        data
          .filter(row => {
            const record: Record<string, unknown> = isRecord(row) ? row : {};
            const challengeId = record.challenge_id;
            return !challengeId || challengeId === id;
          })
          .map(row => {
            const record: Record<string, unknown> = isRecord(row) ? row : {};
            return {
              sku: stringValue(record.item_sku),
              expires_at:
                typeof record.expires_at === 'string'
                  ? record.expires_at
                  : null,
              challenge_id:
                typeof record.challenge_id === 'string'
                  ? record.challenge_id
                  : null,
            };
          })
          .filter(item => item.sku.length > 0 && isPowerUpSupported(item.sku))
      );
    } catch (err) {
      console.error('Error fetching active boosts:', err);
    }
  }, [id, user?.id]);

  const refreshInventory = useCallback(async () => {
    if (!user?.id) {
      setInventoryEntries([]);
      return;
    }

    try {
      const { data: inventoryRows } = await supabase
        .from('inventory_items')
        .select('item_sku, quantity')
        .eq('user_id', user.id);

      const usable: Record<string, unknown>[] = (inventoryRows || [])
        .map(row => (isRecord(row) ? (row as Record<string, unknown>) : null))
        .filter((row): row is Record<string, unknown> => row !== null)
        .filter(row => numberValue(row.quantity) > 0);

      if (usable.length === 0) {
        setInventoryEntries([]);
        return;
      }

      const skus = Array.from(
        new Set(usable.map(row => stringValue(row.item_sku)).filter(Boolean))
      ).filter(
        sku =>
          isPowerUpSupported(sku) &&
          powerUpRequiresChallengeId(sku) &&
          !powerUpIsAutoConsumed(sku)
      );
      const { data: catalogRows } = await supabase
        .from('catalog_items')
        .select('sku, name')
        .in('sku', skus);

      const nameBySku: Record<string, string> = {};
      (catalogRows || []).forEach(row => {
        if (!isRecord(row)) return;
        const sku = stringValue(row.sku);
        if (sku) nameBySku[sku] = stringValue(row.name, sku);
      });

      setInventoryEntries(
        skus
          .map(sku => ({
            sku,
            name: nameBySku[sku] || sku,
            remaining: numberValue(
              usable.find(row => stringValue(row.item_sku) === sku)?.quantity
            ),
          }))
          .filter(entry => entry.remaining > 0)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    void Promise.all([refreshActivePowerUps(), refreshInventory()]);
  }, [refreshActivePowerUps, refreshInventory]);

  useEffect(() => {
    void refreshSubmissionStatus();
  }, [refreshSubmissionStatus, verifications.length]);

  const challengeStats = useMemo(() => {
    if (!challenge) {
      return {
        participantCount: 0,
        daysRemaining: 0,
        completedCount: 0,
        approvalRate: 0,
        isExpired: false,
        userCompleted: false,
      };
    }

    let daysRemaining = 0;
    if (challenge.endDate) {
      daysRemaining = getDaysRemainingGlobal(challenge.endDate);
    } else if (
      challenge.duration &&
      (challenge.startDate || challenge.createdAt)
    ) {
      const start = new Date(challenge.startDate || challenge.createdAt || '');
      const end = new Date(
        start.getTime() + challenge.duration * 24 * 60 * 60 * 1000
      );
      daysRemaining = getDaysRemainingGlobal(end);
    }

    const completedCount = participants.filter(
      participant => participant.currentStreak >= (challenge.duration || 30)
    ).length;
    const approvedCount = groupVerifications.filter(
      verification => verification.status === 'approved'
    ).length;
    const approvalRate =
      groupVerifications.length > 0
        ? Math.round((approvedCount / groupVerifications.length) * 100)
        : 0;
    const currentUserParticipant = participants.find(
      participant => participant.id === user?.id
    );

    return {
      participantCount: participants.length,
      daysRemaining,
      completedCount,
      approvalRate,
      isExpired: daysRemaining <= 0,
      userCompleted: currentUserParticipant
        ? currentUserParticipant.currentStreak >= (challenge.duration || 30)
        : false,
    };
  }, [challenge, groupVerifications, participants, user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;

    setRefreshing(true);
    setRefreshErrorBanner(null);
    setActionMessage(null);
    try {
      await Promise.all([
        fetchChallenges(),
        fetchUserChallenges(user.id),
        fetchChallengeDetails(),
        refreshSubmissionStatus(),
        refreshQueuedProofStatus(),
        refreshStreakState(),
        refreshActivePowerUps(),
        refreshInventory(),
      ]);
    } catch (err) {
      console.error('Refresh error:', err);
      setRefreshErrorBanner(t('todayProof.promise.refresh_data_failed'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinChallenge = () => {
    if (!user?.id || !challenge) return;

    router.push({
      pathname: '/join-funding',
      params: { challengeId: challenge.id },
    } as never);
  };

  const openProofSubmission = (source = 'challenge_detail') => {
    if (!challenge) return;

    const verificationType = challenge.verificationType || 'photo';
    if (!['photo', 'video', 'text'].includes(verificationType)) {
      setActionMessage({
        text: t('todayProof.promise.unsupported_proof'),
        type: 'info',
      });
      return;
    }

    setIsNavigatingToVerification(true);
    void emitHaptic({ type: 'press' });

    const correctionReason = sanitizeCorrectionReason(
      verifications.find(verification => verification.status === 'rejected')
        ?.review_notes
    );

    router.push({
      pathname: '/verification',
      params: {
        challengeId: challenge.id,
        ...(challenge.groupId ? { groupId: challenge.groupId } : {}),
        verificationType,
        suggestedVerificationType: verificationType,
        source,
        ...(correctionReason ? { correctionReason } : {}),
      },
    });

    setTimeout(() => {
      setIsNavigatingToVerification(false);
    }, 500);
  };

  const handleSubmitProof = () => {
    openProofSubmission();
  };

  const handleStartReturnProof = () => {
    openProofSubmission('streak_return');
  };

  const handleToggleProofEncouragement = async (
    item: ProofConnectionMosaicItem,
    encouraged: boolean
  ) => {
    if (
      !user?.id ||
      item.contributorId === user.id ||
      encouragementBusyRef.current.has(item.id)
    )
      return;
    encouragementBusyRef.current.add(item.id);
    try {
      if (encouraged) {
        const { error } = await supabase.from('proof_encouragements').insert({
          submission_id: item.id,
          user_id: user.id,
        });
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('proof_encouragements')
          .delete()
          .eq('submission_id', item.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }

      setGroupVerifications(current =>
        current.map(verification => {
          if (verification.id !== item.id) return verification;
          const next = new Set(verification.encouragement_user_ids);
          if (encouraged) next.add(user.id);
          else next.delete(user.id);
          return { ...verification, encouragement_user_ids: [...next] };
        })
      );
    } catch {
      setActionMessage({
        text: t('todayProof.source.accountability.encouragement_update_failed'),
        type: 'error',
      });
    } finally {
      encouragementBusyRef.current.delete(item.id);
    }
  };

  const handleShareInvite = async () => {
    if (!challenge || !user?.id) return;

    if (isCreator) {
      router.push({
        pathname: '/promise-accountability',
        params: { challengeId: challenge.id, source: 'promise_detail' },
      });
      return;
    }

    setIsGeneratingInviteCode(true);
    try {
      const result = await shareChallenge(challenge.id, challenge.title);
      setChallenge(prev =>
        prev ? { ...prev, invite_code: result.code } : prev
      );
      setShowQRModal(true);
      void emitConfirmedSuccess(
        createConfirmedReceipt('generic', `promise-invite:${result.code}`)
      );
    } catch (err) {
      console.error('Error generating challenge invite:', err);
      setActionMessage({
        text: t('todayProof.promise.invite_unavailable'),
        type: 'error',
      });
      void emitHaptic({ type: 'error' });
    } finally {
      setIsGeneratingInviteCode(false);
    }
  };

  const handleReportChallenge = () => {
    if (!challenge) return;
    const creator = participants.find(
      participant => participant.id === challenge.creatorId
    );
    setActionsVisible(false);
    router.push({
      pathname: '/report-issue',
      params: {
        reportKind: 'challenge',
        source: 'challenge_detail_actions',
        challengeId: challenge.id,
        contextLabel: challenge.title,
        ...(challenge.creatorId && challenge.creatorId !== user?.id
          ? {
              userId: challenge.creatorId,
              userLabel: creator?.username || 'the promise creator',
            }
          : {}),
      },
    });
  };

  const handleOpenReviewQueue = () => {
    if (!challenge) return;
    router.push({
      pathname: '/review-queue',
      params: { challengeId: challenge.id },
    });
  };

  const getPowerUpLabel = useCallback(
    (sku: string) => {
      return (
        getPowerUpDisplayCopy(sku, t)?.label ||
        getPowerUpSupport(sku)?.label ||
        sku
      );
    },
    [t]
  );

  const handleUseInventory = useCallback((sku: string) => {
    setBoostConfirmError(null);
    setBoostAttemptUnknown(false);
    setBoostClientEventId(createClientEventId());
    setBoostConfirmSku(sku);
  }, []);

  const closeBoostConfirm = useCallback(() => {
    if (boostApplyingSku) return;
    setBoostConfirmSku(null);
    setBoostClientEventId(null);
    setBoostAttemptUnknown(false);
    setBoostConfirmError(null);
  }, [boostApplyingSku]);

  const confirmUseInventory = useCallback(
    async (sku: string) => {
      if (!user?.id || !challenge?.id) return;

      setBoostApplyingSku(sku);
      setBoostConfirmError(null);
      try {
        const clientEventId = boostClientEventId || createClientEventId();
        if (!boostClientEventId) setBoostClientEventId(clientEventId);
        const result = await applyPowerUp(
          user.id,
          sku,
          challenge.id,
          undefined,
          clientEventId
        );
        if (result.success) {
          const successMessage =
            result.message ||
            `${getPowerUpLabel(sku)} is now helping this promise.`;
          setActionMessage({
            text: successMessage,
            type: 'success',
          });
          await Promise.all([refreshInventory(), refreshActivePowerUps()]);
          setBoostConfirmSku(null);
          setBoostClientEventId(null);
          setBoostAttemptUnknown(false);
        } else {
          const message = result.message || 'Please try again later.';
          setBoostAttemptUnknown(result.outcome === 'unknown');
          setBoostConfirmError(message);
          setActionMessage({
            text: message,
            type: result.outcome === 'unknown' ? 'info' : 'error',
          });
        }
      } catch (err) {
        console.error('Boost activation failed:', err);
        const message =
          'Menta could not confirm whether time was added. Check again before using another extension.';
        setBoostAttemptUnknown(true);
        setBoostConfirmError(message);
        setActionMessage({
          text: message,
          type: 'info',
        });
      } finally {
        setBoostApplyingSku(null);
      }
    },
    [
      applyPowerUp,
      boostClientEventId,
      challenge?.id,
      getPowerUpLabel,
      refreshActivePowerUps,
      refreshInventory,
      user?.id,
    ]
  );

  const formatTimeLeft = (iso?: string | null) => {
    if (!iso) return 'Active';
    const end = new Date(iso).getTime();
    if (Number.isNaN(end)) return 'Active';
    const ms = Math.max(0, end - Date.now());
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const proofStatusCopy = useMemo(() => {
    const reviewerNote = sanitizeCorrectionReason(
      verifications.find(verification => verification.status === 'rejected')
        ?.review_notes
    );
    if (viewerAccountabilityRole === 'reviewer') {
      return {
        title: t('todayProof.source.accountability.reviewer_ready'),
        note: t('todayProof.source.accountability.reviewer_note'),
        status: t('todayProof.source.accountability.role_reviewer'),
      };
    }
    if (viewerAccountabilityRole === 'supporter') {
      return {
        title: t('todayProof.source.accountability.supporter_following'),
        note: t('todayProof.source.accountability.supporter_note'),
        status: t('todayProof.source.accountability.role_supporter'),
      };
    }
    if (submissionState.shouldShowPending) {
      return {
        title: t('todayProof.streak.status_waiting'),
        note: 'Your proof has been sent. No need to submit twice.',
        status: t('todayProof.residual.waiting'),
      };
    }
    if (submissionState.shouldShowApproved) {
      return {
        title: t('todayProof.promise.done_today'),
        note: 'Today is logged. If someone needs review, that is the next useful action.',
        status: t('todayProof.proof.done'),
      };
    }
    if (submissionState.shouldShowRejected) {
      return {
        title: t('todayProof.promise.send_clearer'),
        note: getCorrectionFollowUpNote(reviewerNote, locale),
        status: t('todayProof.residual.redo'),
      };
    }
    if (streakState?.atRisk && isUserParticipant) {
      return {
        title: t('todayProof.promise.checkin_needed'),
        note: 'Submit one clear proof before the day closes.',
        status: t('todayProof.residual.due'),
      };
    }
    if (isUserParticipant) {
      return {
        title: t('todayProof.promise.proof_due'),
        note: 'Do the action, then send one clear proof.',
        status: t('todayProof.residual.due'),
      };
    }
    return {
      title: t('todayProof.promise.join_to_start'),
      note: 'Join first, then submit proof with everyone else.',
      status: t('todayProof.residual.open'),
    };
  }, [
    isUserParticipant,
    locale,
    streakState?.atRisk,
    submissionState,
    t,
    verifications,
    viewerAccountabilityRole,
  ]);

  const canReviewPromise = viewerAccountabilityRole
    ? viewerAccountabilityRole !== 'supporter'
    : isUserParticipant;
  const pendingReviewCount = canReviewPromise
    ? groupVerifications.filter(
        verification => verification.status === 'pending'
      ).length
    : 0;
  const activeParticipantCount = participants.filter(
    participant => participant.status === 'active'
  ).length;
  const isSoloPromise =
    challenge?.allowSelfReview === true && !challenge?.groupId;

  const reviewModelCopy = isSoloPromise
    ? 'Self-review'
    : challenge?.expectations?.requiresPeerReview
      ? `${challenge.expectations.reviewersRequired || 1} peer review${
          (challenge.expectations.reviewersRequired || 1) === 1 ? '' : 's'
        }`
      : 'No peer review';
  const proofMethodCopy =
    challenge?.verificationType === 'text'
      ? t('todayProof.promise.text_proof')
      : challenge?.verificationType === 'video'
        ? t('todayProof.promise.video_proof')
        : t('todayProof.promise.photo_proof');

  const otherPromisePeople =
    accountabilitySummary?.members.filter(member => member.id !== user?.id) ??
    [];
  const namedReviewer = otherPromisePeople.find(
    member => member.role === 'reviewer'
  )?.name;
  const peopleCopy = isSoloPromise
    ? t('todayProof.promise.just_you')
    : otherPromisePeople.length === 1
      ? otherPromisePeople[0].name
      : t('groups.admin.people_count', {
          count: accountabilitySummary?.acceptedCount || activeParticipantCount,
        });
  const reminderCopy = isStreakStateLoading
    ? t('todayProof.residual.checking')
    : !streakState
      ? t('todayProof.group.reminders_unavailable')
      : !streakState.remindersEnabled
        ? t('todayProof.streak.off')
        : formatPromiseReminderTime(
            streakState.preferredReminderTime,
            locale,
            t('todayProof.streak.default_time')
          );

  const primaryAction = (() => {
    if (viewerAccountabilityRole === 'reviewer') {
      return {
        title:
          pendingReviewCount > 0
            ? t('todayProof.review.review')
            : t('todayProof.source.accountability.open_proof'),
        onPress:
          pendingReviewCount > 0
            ? handleOpenReviewQueue
            : () => setActiveTab('proof'),
      };
    }
    if (viewerAccountabilityRole === 'supporter') {
      return {
        title: t('todayProof.source.accountability.see_shared_proof'),
        onPress: () => setActiveTab('proof'),
      };
    }
    if (!isUserParticipant) {
      return {
        title: t('todayProof.promise.join'),
        onPress: handleJoinChallenge,
      };
    }
    if (challengeStats.isExpired) {
      return {
        title: challengeStats.userCompleted
          ? t('todayProof.promise.complete')
          : t('todayProof.promise.ended'),
        onPress: undefined,
      };
    }
    if (submissionStatusUnavailable) {
      return {
        title: t('todayProof.promise.status_unavailable'),
        onPress: undefined,
      };
    }
    if (submissionState.canSubmit || submissionState.shouldShowRejected) {
      return {
        title: submissionState.shouldShowRejected
          ? t('todayProof.promise.submit_clearer')
          : t('todayProof.promise.submit'),
        onPress: handleSubmitProof,
      };
    }
    if (submissionState.shouldShowPending) {
      return {
        title: t('todayProof.streak.status_waiting'),
        onPress: undefined,
      };
    }
    if (pendingReviewCount > 0) {
      return {
        title: t('todayProof.review.review'),
        onPress: handleOpenReviewQueue,
      };
    }
    if (submissionState.shouldShowApproved) {
      return {
        title: t('todayProof.promise.done_for_today'),
        onPress: undefined,
      };
    }

    return {
      title: t('todayProof.promise.submit'),
      onPress: handleSubmitProof,
    };
  })();

  const completedDays =
    completionData?.completed_days || userChallenge?.currentStreak || 0;
  const totalDays = completionData?.total_days || challenge?.duration || 30;
  const recoveryCopy = submissionState.shouldShowRejected
    ? 'A retry does not reset the whole promise. Send proof that clearly shows the completed action.'
    : streakState?.atRisk && !streakState.hasSubmittedToday
      ? 'Today still counts. No outcome changes until proof is resolved.'
      : null;
  const showBrokenRecovery = Boolean(
    streakState?.latestOutcome?.outcome === 'missed' &&
    isUserParticipant &&
    !streakState.hasSubmittedToday &&
    !streakState.atRisk &&
    !submissionState.shouldShowPending &&
    !submissionState.shouldShowApproved
  );
  const detailRecovery = getPromiseDetailRecovery({
    failure: loadFailure,
    isOnline,
    locale,
  });

  const retryChallengeLoad = useCallback(() => {
    setReloadToken(previous => previous + 1);
  }, []);

  /**
   * Back has to work when this route was the first screen of the session: a
   * notification, an invite deep link, or a state restore after the app was
   * backgrounded all leave an empty history stack, where `plain back navigation` is a
   * silent no-op. Ordinary in-app Back still pops normally.
   */
  const handleBack = useCallback(() => {
    backOrReplace(router, '/(tabs)');
  }, [router]);

  const handleDetailRecovery = () => {
    if (detailRecovery.kind === 'session-expired') {
      router.push({
        pathname: '/auth-required',
        params: { next: `/challenges/${id}` },
      });
      return;
    }

    if (detailRecovery.canRetry) {
      retryChallengeLoad();
      return;
    }

    handleBack();
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: t('todayProof.create.promise_label'),
          }}
        />
        <PromiseDetailSkeletonState onBack={handleBack} />
      </>
    );
  }

  if (loadFailure || !challenge) {
    if (detailRecovery.canRetry) {
      return (
        <>
          <Stack.Screen
            options={{
              headerShown: false,
              title: t('todayProof.create.promise_label'),
            }}
          />
          <PromiseUnavailableState
            hasLocalProof={hasQueuedProofForChallenge}
            onRetry={retryChallengeLoad}
            onCheckProofStatus={() => router.replace('/(tabs)' as never)}
            onBackToToday={() => router.replace('/(tabs)' as never)}
            onReportProblem={() =>
              router.push({
                pathname: '/report-issue',
                params: {
                  source: 'promise_load_failure',
                  ...(id ? { challengeId: id } : {}),
                },
              })
            }
            onBack={handleBack}
          />
        </>
      );
    }

    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: t('todayProof.create.promise_label'),
          }}
        />
        <AppScreen
          lane="working"
          padding={false}
          scrollable
          hasTabBar={false}
          style={styles.screen}
        >
          <View style={styles.errorShell}>
            <Text style={styles.errorTitle}>{detailRecovery.title}</Text>
            <Text style={styles.errorText}>{detailRecovery.message}</Text>
            <View style={styles.errorActions}>
              <AppButton
                testID={
                  detailRecovery.kind === 'session-expired'
                    ? 'promise-detail-sign-in'
                    : 'promise-detail-go-back'
                }
                onPress={handleDetailRecovery}
                title={detailRecovery.primaryLabel}
                fullWidth
                variant="secondary"
              />
            </View>
          </View>
        </AppScreen>
      </>
    );
  }

  const participantLocalStart = participants.find(
    participant => participant.id === user?.id
  )?.joined_at;
  const activeFromLocalDay = [
    localDayFromValue(challenge.startDate),
    localDayFromValue(participantLocalStart),
  ]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const proofWeek = buildProofWeek({
    records: toProofWeekRecords(verifications),
    outcomes: streakState?.recentOutcomes ?? [],
    todayLocalDay:
      streakState?.effectiveLocalDay ?? new Date().toLocaleDateString('en-CA'),
    activeFromLocalDay,
  });

  const paperHistoryEntries: PromiseHistoryEntry[] = [
    ...verifications.map(verification =>
      toPromiseHistoryEntry(verification, t, locale)
    ),
    ...(streakState?.recentOutcomes ?? []).map(outcome => ({
      id: outcome.id,
      kind: 'outcome' as const,
      dayLabel: formatOutcomeHistoryDay(outcome.localDay, locale, t),
      timeLabel: t('todayProof.promise.day_outcome'),
      detail:
        outcome.outcome === 'missed'
          ? t('todayProof.source.outcome.missed', {
              streak: formatStreakCount(outcome.previousStreak, t),
            })
          : outcome.freezeUsed
            ? t('todayProof.source.outcome.protected_freeze', {
                streak: formatStreakCount(outcome.resultingStreak, t),
              })
            : t('todayProof.source.outcome.protected', {
                streak: formatStreakCount(outcome.resultingStreak, t),
              }),
      status: outcome.outcome,
      sortIso: outcome.createdAtIso,
    })),
  ].sort(
    (left, right) =>
      Date.parse(right.sortIso ?? '') - Date.parse(left.sortIso ?? '')
  );
  const proofHistoryStaleMessage =
    refreshErrorBanner &&
    (refreshErrorBanner.includes('your proof') ||
      refreshErrorBanner.includes('promise proof') ||
      refreshErrorBanner === 'Unable to refresh promise details.')
      ? refreshErrorBanner
      : null;
  const otherMemberVerifications = groupVerifications.filter(
    verification => verification.user_id !== user?.id
  );
  const latestPendingProof = verifications.find(
    verification => verification.status === 'pending'
  );
  const latestProof = latestPendingProof ?? null;
  const latestReviewerName = latestProof?.reviewer?.username?.trim() || null;
  const selectedPaperProof = selectedPaperProofId
    ? (groupVerifications.find(item => item.id === selectedPaperProofId) ??
      null)
    : null;
  const selectedPaperProofRecord = selectedPaperProof
    ? {
        id: selectedPaperProof.id,
        mediaType: selectedPaperProof.media_type,
        mediaUrl: selectedPaperProof.media_url,
        submissionText: selectedPaperProof.submission_text,
        state:
          selectedPaperProof.status === 'approved'
            ? ('approved' as const)
            : selectedPaperProof.status === 'rejected'
              ? ('needs-retry' as const)
              : ('waiting' as const),
        submittedLabel: `${formatProofDay(
          selectedPaperProof.submission_date,
          locale,
          t
        )} · ${formatProofClock(selectedPaperProof.submission_date, locale, t)}`,
        evidenceTitle: verificationMediaLabel(selectedPaperProof, t),
        reviewerName: selectedPaperProof.reviewer?.username?.trim() || null,
        reviewNotes: selectedPaperProof.review_notes,
      }
    : null;
  const sharedMediaProof: ProofConnectionMosaicItem[] = groupVerifications
    .filter(
      verification =>
        verification.media_type !== 'text' &&
        Boolean(verification.media_url?.trim())
    )
    .map(verification => ({
      id: verification.id,
      mediaType: verification.media_type === 'video' ? 'video' : 'photo',
      mediaUrl: verification.media_url,
      thumbnailUrl:
        verification.media_type === 'video' ? null : verification.media_url,
      contributorId: verification.user_id,
      contributorName:
        verification.users?.username?.trim() ||
        t('todayProof.source.accountability.member_fallback'),
      submittedLabel: formatProofDay(verification.submission_date, locale, t),
      state:
        verification.status === 'approved'
          ? 'approved'
          : verification.status === 'rejected'
            ? 'needs-retry'
            : 'waiting',
      reactionCount: verification.encouragement_user_ids.length,
      encouragedByCurrentUser: user?.id
        ? verification.encouragement_user_ids.includes(user.id)
        : false,
      canEncourage: Boolean(user?.id && verification.user_id !== user.id),
    }));
  const paperRuleRows: PromiseRuleRow[] = [
    {
      label: t('todayProof.residual.schedule'),
      value: formatPromiseFrequency(challenge.verificationFrequency, t),
    },
    {
      label: t('todayProof.create.proof_type'),
      value: proofMethodCopy,
    },
    {
      label: t('todayProof.promise.reviewed_by'),
      value: isSoloPromise
        ? t('todayProof.promise.only_you')
        : namedReviewer || reviewModelCopy,
    },
    {
      label: t('todayProof.residual.visibility'),
      value: isSoloPromise
        ? t('todayProof.promise.only_you')
        : challenge.isPublic
          ? t('todayProof.promise.group_members')
          : t('todayProof.promise.invite_only'),
    },
    {
      label: t('todayProof.create.length'),
      value: t('todayProof.create.days_unit', {
        count: challenge.duration || 30,
      }),
    },
    {
      label: t('todayProof.residual.reminder'),
      value: reminderCopy,
    },
    {
      label: t('todayProof.promise.people'),
      value: peopleCopy,
    },
  ];

  const promiseTermComplete = isPromiseTermComplete({
    isExpired: challengeStats.isExpired,
    serverCompleted: completionData?.is_completed,
    challengeStatus: challenge.status,
  });
  const showSoloActiveDue = shouldShowSoloActivePromise({
    allowSelfReview: challenge.allowSelfReview,
    groupId: challenge.groupId,
    isUserParticipant,
    challengeStatus: challenge.status,
    isExpired: promiseTermComplete,
    isDetailLoading,
    submissionStatusUnavailable,
    canSubmit: submissionState.canSubmit,
    shouldShowPending: submissionState.shouldShowPending,
    shouldShowApproved: submissionState.shouldShowApproved,
    shouldShowRejected: submissionState.shouldShowRejected,
  });
  const promiseDetailBranch = resolvePromiseDetailBranch({
    requestedView: paperDetailView,
    hasSelectedProof: Boolean(selectedPaperProofRecord),
    showWaiting:
      submissionState.shouldShowPending && isUserParticipant && isSoloPromise,
    showComplete: promiseTermComplete && isUserParticipant && !isDetailLoading,
    showQueued: isSoloPromise && hasQueuedProofForChallenge,
    showCorrection:
      isSoloPromise && isUserParticipant && submissionState.shouldShowRejected,
    showApproved:
      isSoloPromise && isUserParticipant && submissionState.shouldShowApproved,
    showRecovery: isSoloPromise && showBrokenRecovery,
    showUnknown: isSoloPromise && submissionStatusUnavailable,
    showActive: showSoloActiveDue,
  });

  const openDeleteConfirmation = () => {
    setConfirmTarget('delete');
    setConfirmVisible(true);
  };

  const closeDestructiveConfirmation = () => {
    if (workingDestructive) return;
    setConfirmVisible(false);
    setConfirmTarget(null);
  };

  const applyPromiseMutationResult = (
    result: PromiseMutationResult,
    interaction: 'mutation' | 'recovery'
  ) => {
    void emitPromiseMutationResultHaptic(result, interaction);

    if (result.outcome === 'confirmed') {
      setPromiseMutationRecovery(null);
      setActionMessage(null);
      if (result.operation === 'delete') {
        showToast.success(
          t('todayProof.promise.deleted'),
          t('todayProof.promise.deleted')
        );
      } else {
        showToast.success(
          t('todayProof.promise.left'),
          t('todayProof.promise.left_detail')
        );
      }
      handleBack();
      return;
    }

    setPromiseMutationRecovery(result);
    setActionMessage({
      text: result.message,
      type: result.outcome === 'failed' ? 'error' : 'info',
    });
  };

  const recoverPromiseMutation = async () => {
    if (!user?.id || !challenge || !promiseMutationRecovery) return;
    setCheckingPromiseMutation(true);
    try {
      const clientEventId = promiseMutationRecovery.clientEventId;
      let result: PromiseMutationResult;

      if (
        promiseMutationRecovery.outcome === 'failed' &&
        promiseMutationRecovery.safeToRetry &&
        clientEventId
      ) {
        result =
          promiseMutationRecovery.operation === 'delete'
            ? await deleteChallenge(challenge.id, clientEventId, t)
            : await leavePromiseWithRoleAwareFallback({
                challengeId: challenge.id,
                userId: user.id,
                clientEventId,
                leaveLegacy: (legacyUserId, legacyChallengeId) =>
                  leaveChallenge(legacyUserId, legacyChallengeId, t),
                localise: t,
              });
      } else if (
        promiseMutationRecovery.operation === 'leave' &&
        promiseMutationRecovery.outcome === 'unknown' &&
        promiseMutationRecovery.recovery === 'safe-retry'
      ) {
        // The legacy challenge-leave RPC explicitly returns ALREADY_LEFT, so
        // reusing it after response loss is idempotent and can recover the
        // authoritative receipt without repeating an unsafe mutation.
        result = await leaveChallenge(user.id, challenge.id, t);
      } else if (!clientEventId) {
        result = unknownPromiseMutation({
          operation: promiseMutationRecovery.operation,
          challengeId: challenge.id,
          clientEventId: null,
          message: t('todayProof.promise.check_action_unavailable'),
        });
      } else {
        result =
          promiseMutationRecovery.operation === 'delete'
            ? await reconcileDeleteChallenge(challenge.id, clientEventId, t)
            : await reconcilePromiseAccountabilityLeave(
                challenge.id,
                clientEventId,
                t
              );
      }

      applyPromiseMutationResult(result, 'recovery');
    } finally {
      setCheckingPromiseMutation(false);
    }
  };

  const confirmDestructiveAction = async () => {
    if (!user?.id || !challenge || !confirmTarget) return;
    try {
      setWorkingDestructive(true);
      const clientEventId = createClientEventId();
      const result =
        confirmTarget === 'leave'
          ? await leavePromiseWithRoleAwareFallback({
              challengeId: challenge.id,
              userId: user.id,
              clientEventId,
              leaveLegacy: (legacyUserId, legacyChallengeId) =>
                leaveChallenge(legacyUserId, legacyChallengeId, t),
              localise: t,
            })
          : await deleteChallenge(challenge.id, clientEventId, t);
      applyPromiseMutationResult(result, 'mutation');
    } catch (err) {
      applyPromiseMutationResult(
        unknownPromiseMutation({
          operation: confirmTarget,
          challengeId: challenge.id,
          clientEventId: null,
          message:
            err instanceof Error
              ? err.message
              : t('todayProof.promise.not_changed'),
        }),
        'mutation'
      );
    } finally {
      setWorkingDestructive(false);
      setConfirmVisible(false);
      setConfirmTarget(null);
    }
  };

  const destructiveConfirmation = (
    <ConfirmDestructiveSheet
      visible={confirmVisible}
      title={
        confirmTarget === 'delete'
          ? t('todayProof.promise.delete_question')
          : t('todayProof.promise.leave_question')
      }
      confirmLabel={
        confirmTarget === 'delete'
          ? t('todayProof.promise.delete')
          : t('todayProof.promise.leave')
      }
      nameToType={confirmTarget === 'delete' ? 'DELETE' : 'LEAVE'}
      description={
        confirmTarget === 'delete'
          ? t('todayProof.promise.delete_detail')
          : t('todayProof.promise.leave_detail')
      }
      onClose={closeDestructiveConfirmation}
      onConfirm={confirmDestructiveAction}
      loading={workingDestructive}
    />
  );

  const promiseMutationNotice = promiseMutationRecovery
    ? {
        title:
          promiseMutationRecovery.outcome === 'unknown'
            ? t('todayProof.promise.result_not_confirmed_title')
            : t('todayProof.promise.not_changed_title'),
        description: promiseMutationRecovery.message,
        tone:
          promiseMutationRecovery.outcome === 'unknown'
            ? ('warning' as const)
            : ('error' as const),
        actionLabel:
          promiseMutationRecovery.outcome === 'unknown'
            ? t('todayProof.promise.check_status')
            : promiseMutationRecovery.safeToRetry
              ? t('todayProof.promise.try_again')
              : undefined,
        onAction:
          promiseMutationRecovery.outcome === 'unknown' ||
          promiseMutationRecovery.safeToRetry
            ? () => void recoverPromiseMutation()
            : undefined,
        actionLoading: checkingPromiseMutation,
      }
    : null;

  if (promiseDetailBranch === 'history') {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: t('todayProof.promise.proof_history'),
          }}
        />
        <PromiseHistoryState
          durationLabel={`${challenge.duration || 30}-day promise`}
          promiseTitle={challenge.title}
          entries={paperHistoryEntries}
          loading={isDetailLoading}
          staleMessage={proofHistoryStaleMessage}
          onOpenProof={proof => {
            setSelectedPaperProofId(proof.id);
            setPaperDetailView('proof');
          }}
          onBack={() => setPaperDetailView('summary')}
        />
      </>
    );
  }

  if (promiseDetailBranch === 'rules') {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: t('todayProof.promise.details'),
          }}
        />
        <PromiseRulesState
          promiseTitle={challenge.title}
          proofType={proofMethodCopy}
          proofDescription={
            challenge.verificationDescription ||
            'Show the completed action clearly enough for the named reviewer.'
          }
          rows={paperRuleRows}
          promiseSummary={challenge.title}
          onBack={() => setPaperDetailView('summary')}
          onManagePeople={
            isCreator || accountabilitySummary?.canInvite
              ? handleShareInvite
              : undefined
          }
        />
      </>
    );
  }

  if (
    promiseDetailBranch === 'proof' ||
    promiseDetailBranch === 'proof-unavailable'
  ) {
    if (
      promiseDetailBranch === 'proof-unavailable' ||
      !selectedPaperProofRecord
    ) {
      return (
        <>
          <Stack.Screen
            options={{
              headerShown: false,
              title: t('todayProof.promise.proof_history'),
            }}
          />
          <PromiseHistoryState
            durationLabel={`${challenge.duration || 30}-day promise`}
            promiseTitle={challenge.title}
            entries={paperHistoryEntries}
            loading={isDetailLoading}
            staleMessage="That proof is not available in this promise."
            onOpenProof={proof => {
              setSelectedPaperProofId(proof.id);
              setPaperDetailView('proof');
            }}
            onBack={() => {
              setSelectedPaperProofId(null);
              setPaperDetailView('summary');
            }}
          />
        </>
      );
    }

    return (
      <>
        <Stack.Screen
          options={{ headerShown: false, title: t('todayProof.proof.receipt') }}
        />
        <PromiseProofDetailState
          proof={selectedPaperProofRecord}
          onProofHistory={() => {
            setSelectedPaperProofId(null);
            setPaperDetailView('history');
          }}
          onBack={() => {
            setSelectedPaperProofId(null);
            setPaperDetailView('history');
          }}
        />
      </>
    );
  }

  if (promiseDetailBranch === 'waiting') {
    return (
      <>
        <Stack.Screen
          options={{ headerShown: false, title: challenge.title }}
        />
        <PromiseWaitingReviewState
          promiseTitle={challenge.title}
          reviewerName={latestReviewerName}
          sentLabel={
            latestProof
              ? formatProofRelativeTime(
                  latestProof.submission_date,
                  new Date(),
                  locale,
                  t
                )
              : t('todayProof.promise.sent_recently')
          }
          proofTitle={
            latestProof
              ? verificationMediaLabel(latestProof, t)
              : 'Proof submitted'
          }
          submittedLabel={
            latestProof
              ? `${formatProofDay(latestProof.submission_date, locale, t)} · ${formatProofClock(latestProof.submission_date, locale, t)}`
              : t('todayProof.source.promise.submission_time_unavailable')
          }
          proofId={latestProof?.id}
          proofMediaType={latestProof?.media_type}
          proofMediaUri={latestProof?.media_url}
          proofText={latestProof?.submission_text}
          proofReviewNotes={latestProof?.review_notes}
          proofAvailable={Boolean(latestProof)}
          evidenceUnavailableMessage={refreshErrorBanner}
          mutationNotice={promiseMutationNotice}
          week={proofWeek}
          onProofHistory={() => setPaperDetailView('history')}
          onRules={() => setPaperDetailView('rules')}
          onPeople={() => setPaperDetailView('rules')}
          onDelete={isCreator ? openDeleteConfirmation : undefined}
          onBack={handleBack}
        />
        {destructiveConfirmation}
      </>
    );
  }

  if (promiseDetailBranch === 'complete') {
    const totalDays = completionData?.total_days ?? challenge.duration ?? 30;
    const approvedDays = resolveApprovedDayCount(
      completionData?.completed_days,
      verifications.filter(verification => verification.status === 'approved')
        .length
    );

    return (
      <>
        <Stack.Screen
          options={{ headerShown: false, title: challenge.title }}
        />
        <PromiseCompleteState
          record={{
            source: 'server-readback',
            approvedDays,
            totalDays,
            visibility: isSoloPromise
              ? 'Private'
              : group?.name || 'Group promise',
            reviewerSummary: isSoloPromise
              ? 'you reviewed your own proof'
              : 'the promise group reviewed proof',
          }}
          onShareResult={() => {
            void Share.share({
              message: `${challenge.title}: ${approvedDays} of ${totalDays} days approved on Menta.`,
            }).catch(error => {
              console.warn('Could not open result share sheet:', error);
            });
          }}
          onMakeAnother={() =>
            router.push(
              '/create-challenge?mode=solo&createSource=promise_complete'
            )
          }
          onBackToToday={() => router.replace('/(tabs)' as never)}
          onProofHistory={() => setPaperDetailView('history')}
          mutationNotice={promiseMutationNotice}
          onDelete={isCreator ? openDeleteConfirmation : undefined}
          onBack={handleBack}
        />
        {destructiveConfirmation}
      </>
    );
  }

  if (
    promiseDetailBranch === 'active' ||
    promiseDetailBranch === 'queued' ||
    promiseDetailBranch === 'correction' ||
    promiseDetailBranch === 'approved' ||
    promiseDetailBranch === 'recovery' ||
    promiseDetailBranch === 'unknown'
  ) {
    const totalDays = completionData?.total_days ?? challenge.duration ?? 30;
    const approvedDays = completionData?.completed_days;
    const progressLabel =
      typeof approvedDays === 'number'
        ? `${approvedDays} of ${totalDays} approved`
        : `${totalDays}-day promise`;
    const protectedOutcome =
      streakState?.latestOutcome?.outcome === 'protected';
    const presentation = (() => {
      switch (promiseDetailBranch) {
        case 'queued':
          return {
            dueLabel: 'Proof saved on this device',
            statusTone: 'action' as const,
            prompt:
              'Menta has not confirmed delivery yet. Open the saved proof before adding another one.',
            primaryLabel: t('todayProof.residual.open_proof_recovery'),
            onPrimary: handleSubmitProof,
            notice: {
              title: t('todayProof.residual.not_counted_yet'),
              description: t(
                'todayProof.residual.the_saved_proof_remains_on_this_device_until_menta_confirms_the_'
              ),
              tone: 'info' as const,
            },
          };
        case 'correction':
          return {
            dueLabel: 'One change needed',
            statusTone: 'danger' as const,
            prompt:
              recoveryCopy ||
              'The reviewer asked for clearer proof. The earlier attempt stays in proof history.',
            primaryLabel: t('todayProof.promise.send_clearer'),
            onPrimary: handleSubmitProof,
            notice: null,
          };
        case 'approved':
          return {
            dueLabel: 'Done today',
            statusTone: 'success' as const,
            prompt:
              'Today’s proof is approved. The next due day will appear when the schedule advances.',
            primaryLabel: t('todayProof.residual.view_proof_history'),
            onPrimary: () => setPaperDetailView('history'),
            notice: null,
          };
        case 'recovery':
          return {
            dueLabel: 'A missed day is in your history',
            statusTone: 'danger' as const,
            prompt:
              'The previous run ended, but you can start again with today’s next proof.',
            primaryLabel: t('todayProof.residual.start_today_s_proof'),
            onPrimary: handleStartReturnProof,
            notice: null,
          };
        case 'unknown':
          return {
            dueLabel: 'Proof status unavailable',
            statusTone: 'warning' as const,
            prompt:
              'Sending is paused until Menta confirms whether proof already exists for today.',
            primaryLabel: t('todayProof.residual.check_again'),
            onPrimary: onRefresh,
            notice: {
              title: t('todayProof.residual.no_new_proof_was_started'),
              description: t(
                'todayProof.residual.check_the_current_server_status_before_sending_or_retrying_proof'
              ),
              tone: 'warning' as const,
            },
          };
        case 'active':
        default:
          return {
            dueLabel: protectedOutcome
              ? 'Streak protected · Proof due today'
              : 'Proof due today',
            statusTone: 'warning' as const,
            prompt: 'Add today’s proof when you’ve done what you promised.',
            primaryLabel: t('todayProof.streak.add_proof'),
            onPrimary: handleSubmitProof,
            notice: protectedOutcome
              ? {
                  title: t('todayProof.residual.a_previous_day_was_protected'),
                  description: t(
                    'todayProof.residual.the_protected_day_remains_in_proof_history_today_still_needs_its'
                  ),
                  tone: 'info' as const,
                }
              : null,
          };
      }
    })();

    return (
      <>
        <Stack.Screen
          options={{ headerShown: false, title: challenge.title }}
        />
        <PromiseActiveState
          promiseTitle={challenge.title}
          dueLabel={presentation.dueLabel}
          statusTone={presentation.statusTone}
          prompt={presentation.prompt}
          primaryLabel={presentation.primaryLabel}
          notice={presentation.notice}
          mutationNotice={promiseMutationNotice}
          progressLabel={progressLabel}
          scheduleLabel={formatPromiseFrequency(
            challenge.verificationFrequency,
            t
          )}
          proofLabel={proofMethodCopy}
          visibilityLabel="Private"
          week={proofWeek}
          onAddProof={presentation.onPrimary}
          onProofHistory={() => setPaperDetailView('history')}
          onRules={() => setPaperDetailView('rules')}
          onDelete={isCreator ? openDeleteConfirmation : undefined}
          onBack={handleBack}
        />
        {destructiveConfirmation}
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: challenge.title,
          headerShown: false,
        }}
      />
      <AppScreen
        lane="working"
        scrollable
        padding={false}
        hasTabBar={false}
        style={styles.screen}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={mentaColors.text.primary}
            colors={[mentaColors.text.primary]}
            progressBackgroundColor={mentaColors.surface}
          />
        }
      >
        <ChallengeActions
          refreshErrorBanner={refreshErrorBanner}
          actionMessage={actionMessage}
          onRetry={() => {
            void onRefresh();
          }}
          retrying={refreshing}
          actionLabel={promiseMutationNotice?.actionLabel}
          onAction={promiseMutationNotice?.onAction}
          actionLoading={promiseMutationNotice?.actionLoading}
        />

        <ChallengeHero
          accentColor={colors.accent.primary}
          title={challenge.title}
          description={challenge.description}
          onBack={handleBack}
          onShare={handleShareInvite}
          onMore={() => setActionsVisible(true)}
          canShare={isCreator || !challenge.allowSelfReview}
        />

        <View
          style={[styles.tabs, { marginHorizontal: phoneLayout.screenInset }]}
        >
          <SegmentedControl
            segments={[
              {
                value: 'overview',
                label: t('todayProof.residual.status'),
              },
              {
                value: 'proof',
                label: t('todayProof.proof.receipt'),
                badge: challenge.allowSelfReview
                  ? verifications.length
                  : groupVerifications.length,
              },
              {
                value: 'people',
                label: t('todayProof.promise.people'),
                badge: participants.length,
              },
            ]}
            value={activeTab}
            onChange={value => {
              if (value === 'people') {
                router.push({
                  pathname: '/promise-accountability',
                  params: { challengeId: challenge.id, source: 'people_tab' },
                });
                return;
              }
              setActiveTab(value as 'overview' | 'proof');
            }}
          />
        </View>

        {activeTab === 'overview' ? (
          <>
            {streakState?.latestOutcome?.outcome === 'protected' ? (
              <ProtectedStreakReceipt
                localDay={streakState.latestOutcome.localDay}
                resultingStreak={streakState.latestOutcome.resultingStreak}
                freezeUsed={streakState.latestOutcome.freezeUsed}
              />
            ) : null}

            <AtRiskBanner
              visible={Boolean(
                streakState?.atRisk &&
                isUserParticipant &&
                streakState.submissionStatus !== 'pending' &&
                streakState.submissionStatus !== 'approved'
              )}
              freezeCount={streakState?.freezeCount ?? 0}
              currentStreak={
                streakState?.currentStreak ??
                userChallenge?.currentStreak ??
                null
              }
              localDay={streakState?.effectiveLocalDay}
              timeZone={streakState?.effectiveTimezone}
              preferredReminderTime={streakState?.preferredReminderTime}
              promiseLabel={challenge.title}
              queuedOnDevice={hasQueuedProofForChallenge}
              submitLoading={isNavigatingToVerification}
              onSubmitProof={handleSubmitProof}
              onOpenFreezes={() => router.push('/inventory')}
              onRemindLater={() => snoozeCoachMessages()}
            />

            {showBrokenRecovery ? (
              <BrokenStreakRecoveryCard
                missedLocalDay={streakState!.latestOutcome!.localDay}
                previousStreak={streakState!.latestOutcome!.previousStreak}
                resultingStreak={streakState!.latestOutcome!.resultingStreak}
                onStartReturn={handleStartReturnProof}
                onViewHistory={() => setPaperDetailView('history')}
              />
            ) : null}

            <DailyLoopPanel
              title={proofStatusCopy.title}
              note={proofStatusCopy.note}
              primaryLabel={primaryAction.title}
              primaryLoading={isNavigatingToVerification}
              onPrimaryPress={primaryAction.onPress}
              completedDays={completedDays}
              totalDays={totalDays}
              recoveryCopy={recoveryCopy}
              week={proofWeek}
              currentStreak={
                streakState?.currentStreak ??
                userChallenge?.currentStreak ??
                null
              }
              longestStreak={streakState?.longestStreak ?? null}
            />

            <View
              style={[
                styles.detailNavigation,
                { marginHorizontal: phoneLayout.screenInset },
              ]}
            >
              {isUserParticipant ? (
                <AppFieldRow
                  title={t('todayProof.streak.reminders')}
                  subtitle={
                    streakState?.remindersEnabled &&
                    streakState.effectiveTimezone
                      ? `${reminderCopy} · ${streakState.effectiveTimezone}`
                      : reminderCopy
                  }
                  onPress={() =>
                    router.push({
                      pathname: '/notification-settings',
                      params: {
                        challengeId: challenge.id,
                        source: 'promise',
                      },
                    })
                  }
                  testID="promise-reminder-status"
                />
              ) : null}
              <AppFieldRow
                title={t('todayProof.promise.rules_schedule')}
                subtitle={t('todayProof.promise.rules_schedule_detail')}
                onPress={() => setPaperDetailView('rules')}
                showDivider={isUserParticipant || pendingReviewCount > 0}
              />
              {isUserParticipant ? (
                <AppFieldRow
                  title={t('todayProof.solo.items')}
                  subtitle={
                    activePowerUps.length > 0
                      ? activePowerUps
                          .map(
                            powerUp =>
                              `${getPowerUpLabel(powerUp.sku)} · ${t(
                                'todayProof.promise.active_for',
                                { duration: formatTimeLeft(powerUp.expires_at) }
                              )}`
                          )
                          .join('\n')
                      : streakState
                        ? `${t('todayProof.streak.freeze_title')} · ${t(
                            'todayProof.streak.freezes_left',
                            { count: streakState.freezeCount }
                          )}`
                        : t('todayProof.residual.checking_streak_state')
                  }
                  onPress={() => setItemsVisible(true)}
                  showDivider={pendingReviewCount > 0}
                />
              ) : null}
              {pendingReviewCount > 0 ? (
                <AppFieldRow
                  title={t('todayProof.review.review')}
                  subtitle={`${pendingReviewCount} waiting in this promise.`}
                  onPress={handleOpenReviewQueue}
                  showDivider={false}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {activeTab === 'proof' ? (
          <>
            <View
              style={[
                styles.detailNavigation,
                { marginHorizontal: phoneLayout.screenInset },
              ]}
            >
              <AppFieldRow
                title={t('todayProof.promise.proof_history')}
                onPress={() => setPaperDetailView('history')}
                showDivider={false}
              />
            </View>
            {!challenge.allowSelfReview &&
            challenge.verificationType !== 'text' ? (
              <ProofConnectionMosaic
                copy={{
                  addProof:
                    challenge.verificationType === 'video'
                      ? t('todayProof.source.accountability.add_my_video')
                      : challenge.verificationType === 'photo'
                        ? t('todayProof.source.accountability.add_my_photo')
                        : t('todayProof.streak.add_proof'),
                }}
                errorMessage={proofHistoryStaleMessage}
                items={sharedMediaProof}
                loading={isDetailLoading}
                onAddProof={isUserParticipant ? handleSubmitProof : undefined}
                onOpenProof={item => {
                  setSelectedPaperProofId(item.id);
                  setPaperDetailView('proof');
                }}
                onViewAll={() => setPaperDetailView('history')}
                onRetry={() => void onRefresh()}
                onToggleEncouragement={(item, encouraged) =>
                  void handleToggleProofEncouragement(item, encouraged)
                }
                style={[
                  styles.proofMosaic,
                  { marginHorizontal: phoneLayout.screenInset },
                ]}
                title={challenge.title}
                visibilityLabel={t(
                  'todayProof.source.accountability.shared_with_promise_people'
                )}
              />
            ) : null}
            <ChallengeSubmissions
              mode="full"
              title={t('todayProof.promise.your_proof')}
              verifications={verifications}
              emptyTitle="No proof from you yet"
              emptyText="Submit today's proof and your log starts here."
              loading={isDetailLoading}
              staleMessage={proofHistoryStaleMessage}
            />
            {!challenge.allowSelfReview ? (
              <ChallengeSubmissions
                mode="full"
                title={t('todayProof.promise.other_proof')}
                verifications={otherMemberVerifications}
                emptyTitle="No proof from other members yet"
                emptyText="Their approved and pending check-ins will appear here."
                loading={isDetailLoading}
              />
            ) : null}
          </>
        ) : null}

        {activeTab === 'people' ? (
          <ChallengeParticipants
            participants={participants}
            loading={isDetailLoading}
            canInvite={isCreator || !challenge.allowSelfReview}
            inviteLoading={isGeneratingInviteCode}
            onInvite={handleShareInvite}
          />
        ) : null}
      </AppScreen>

      <SimpleBottomSheet
        visible={itemsVisible}
        onClose={() => setItemsVisible(false)}
        testID="promise-items-sheet"
        scrollableBody={
          <SupportSection
            activePowerUps={activePowerUps}
            inventoryEntries={inventoryEntries}
            formatTimeLeft={formatTimeLeft}
            getPowerUpLabel={getPowerUpLabel}
            onUseInventory={sku => {
              setItemsVisible(false);
              handleUseInventory(sku);
            }}
            onOpenFreezeInventory={() => {
              setItemsVisible(false);
              router.push('/inventory');
            }}
            isStreakStateLoading={isStreakStateLoading}
            streakState={streakState}
          />
        }
      />

      <SimpleBottomSheet
        visible={actionsVisible}
        onClose={() => setActionsVisible(false)}
        scrollableBody={
          <>
            <Text style={styles.sheetTitle}>
              {t('todayProof.promise.actions')}
            </Text>
            {isCreator || !challenge.allowSelfReview ? (
              <SheetAction
                icon={<QrCodeIcon size={18} color={mentaColors.text.primary} />}
                label={
                  isGeneratingInviteCode
                    ? t('todayProof.residual.preparing_invite')
                    : isCreator
                      ? t(
                          'todayProof.source.accountability.invite_or_manage_people'
                        )
                      : t('todayProof.promise.share_invite')
                }
                onPress={handleShareInvite}
                disabled={isGeneratingInviteCode}
              />
            ) : null}
            <SheetAction
              icon={<ShieldIcon size={18} color={mentaColors.text.primary} />}
              label={t('todayProof.promise.rules_schedule')}
              onPress={() => {
                setActionsVisible(false);
                setPaperDetailView('rules');
              }}
            />
            <SheetAction
              icon={
                <CheckCircleIcon size={18} color={mentaColors.text.primary} />
              }
              label={t('todayProof.promise.open_review_queue')}
              onPress={() => {
                setActionsVisible(false);
                router.push({
                  pathname: '/review-queue',
                  params: { challengeId: challenge.id },
                });
              }}
            />
            <SheetAction
              icon={<Share2Icon size={18} color={mentaColors.text.primary} />}
              label={t('todayProof.promise.report')}
              onPress={handleReportChallenge}
            />
            {isUserParticipant ? (
              <SheetAction
                icon={<LogOutIcon size={18} color={mentaColors.danger} />}
                label={t('todayProof.promise.leave')}
                danger
                onPress={() => {
                  setActionsVisible(false);
                  setConfirmTarget('leave');
                  setConfirmVisible(true);
                }}
              />
            ) : null}
            {isCreator ? (
              <SheetAction
                icon={<Trash2Icon size={18} color={mentaColors.danger} />}
                label={t('todayProof.promise.delete')}
                danger
                onPress={() => {
                  setActionsVisible(false);
                  setConfirmTarget('delete');
                  setConfirmVisible(true);
                }}
              />
            ) : null}
          </>
        }
      />

      {destructiveConfirmation}

      <SimpleBottomSheet
        visible={Boolean(boostConfirmSku)}
        onClose={closeBoostConfirm}
        dismissOnBackdrop={!boostApplyingSku}
        testID="challenge-boost-confirm-sheet"
        scrollableBody={
          <>
            <Text style={styles.sheetTitle}>
              {t('todayProof.promise.extend_question', {
                promise: challenge.title,
              })}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {t('todayProof.promise.extension_cost', {
                item: boostConfirmSku
                  ? getPowerUpLabel(boostConfirmSku)
                  : 'extension',
              })}
            </Text>
            {boostConfirmError ? (
              <View style={styles.boostConfirmError}>
                <Text style={styles.boostConfirmErrorText}>
                  {boostConfirmError}
                </Text>
              </View>
            ) : null}
          </>
        }
        footer={
          <View style={styles.boostConfirmActions}>
            <AppButton
              title={
                boostApplyingSku
                  ? boostAttemptUnknown
                    ? t('todayProof.residual.checking')
                    : t('todayProof.residual.adding_time')
                  : boostConfirmError
                    ? boostAttemptUnknown
                      ? t('todayProof.residual.check_again')
                      : t('todayProof.promise.try_again')
                    : t('todayProof.residual.add_12_hours')
              }
              onPress={() => {
                if (boostConfirmSku) {
                  void confirmUseInventory(boostConfirmSku);
                }
              }}
              loading={Boolean(boostApplyingSku)}
              disabled={!boostConfirmSku || Boolean(boostApplyingSku)}
              fullWidth
            />
            <AppButton
              title={t('todayProof.residual.keep_current_due_time')}
              variant="secondary"
              onPress={closeBoostConfirm}
              disabled={Boolean(boostApplyingSku)}
              fullWidth
            />
          </View>
        }
      />

      {challenge.invite_code ? (
        <QRCodeModal
          visible={showQRModal}
          onClose={() => setShowQRModal(false)}
          inviteCode={challenge.invite_code}
          challengeTitle={challenge.title}
        />
      ) : null}
    </>
  );
}

function SheetAction({
  icon,
  label,
  onPress,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <AppFieldRow
      title={label}
      icon={icon}
      onPress={disabled ? undefined : onPress}
      destructive={danger}
      showChevron={false}
    />
  );
}

function SupportSection({
  activePowerUps,
  inventoryEntries,
  formatTimeLeft,
  getPowerUpLabel,
  onUseInventory,
  onOpenFreezeInventory,
  isStreakStateLoading,
  streakState,
}: {
  activePowerUps: ActivePowerUp[];
  inventoryEntries: InventoryEntry[];
  formatTimeLeft: (iso?: string | null) => string;
  getPowerUpLabel: (sku: string) => string;
  onUseInventory: (sku: string) => void;
  onOpenFreezeInventory: () => void;
  isStreakStateLoading: boolean;
  streakState: ReturnType<typeof useStreakState>['streakState'];
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.supportSection}>
      <Text style={styles.sectionTitle}>{t('todayProof.solo.items')}</Text>
      <View style={styles.supportRows}>
        {isStreakStateLoading ? (
          <SkeletonLoader
            height={58}
            borderRadius={mentaRadii.small}
            accessibilityLabel={t('todayProof.residual.checking_streak_state')}
          />
        ) : streakState ? (
          <>
            <FreezeInventoryCard
              freezeCount={streakState.freezeCount}
              onPress={onOpenFreezeInventory}
            />
          </>
        ) : null}

        {activePowerUps.map((powerUp, index) => (
          <View key={`${powerUp.sku}-${index}`} style={styles.supportRow}>
            <TargetIcon size={18} color={mentaColors.text.primary} />
            <View style={styles.supportText}>
              <Text style={styles.supportTitle}>
                {getPowerUpLabel(powerUp.sku)}
              </Text>
              <Text style={styles.supportMeta}>
                {t('todayProof.promise.active_for', {
                  duration: formatTimeLeft(powerUp.expires_at),
                })}
              </Text>
            </View>
          </View>
        ))}

        {inventoryEntries.map(entry => (
          <View key={entry.sku} style={styles.supportRow}>
            <TargetIcon size={18} color={mentaColors.text.primary} />
            <View style={styles.supportText}>
              <Text style={styles.supportTitle}>{entry.name}</Text>
              <Text style={styles.supportMeta}>
                {t('todayProof.promise.available_count', {
                  count: entry.remaining,
                })}
              </Text>
            </View>
            <AppButton
              title={t('todayProof.residual.add_12_hours')}
              onPress={() => onUseInventory(entry.sku)}
              variant="outline"
              size="small"
              style={styles.useButton}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
  },
  tabs: {
    marginTop: mentaSpacing[5],
  },
  detailNavigation: {
    marginTop: mentaSpacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  proofMosaic: {
    marginTop: mentaSpacing[6],
  },
  supportSection: {
    paddingTop: mentaSpacing[2],
  },
  sectionTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    marginBottom: mentaSpacing[3],
  },
  supportRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  supportRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
    paddingVertical: mentaSpacing[3],
  },
  supportText: {
    flex: 1,
    minWidth: 0,
    marginLeft: mentaSpacing[3],
  },
  supportTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  supportMeta: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[1],
  },
  useButton: {
    marginLeft: mentaSpacing[3],
  },
  sheetTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  sheetSubtitle: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[2],
    marginBottom: mentaSpacing[4],
  },
  boostConfirmError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.danger,
    borderRadius: mentaRadii.medium,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: mentaSpacing[3],
    marginTop: mentaSpacing[3],
    backgroundColor: mentaColors.surface,
  },
  boostConfirmErrorText: {
    ...mentaTypography.caption,
    color: mentaColors.danger,
  },
  boostConfirmActions: {
    gap: mentaSpacing[3],
    marginTop: mentaSpacing[5],
  },
  errorShell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: mentaSpacing[6],
  },
  errorTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  errorText: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[3],
    marginBottom: mentaSpacing[6],
  },
  errorActions: {
    gap: mentaSpacing[3],
  },
});

const qrStyles = StyleSheet.create({
  modalContent: {
    borderRadius: mentaRadii.large,
    padding: mentaSpacing[6],
    minWidth: 300,
    maxWidth: 420,
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: mentaSpacing[6],
  },
  modalTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  closeButton: {
    minWidth: mentaLayout.minimumTouchTarget,
    minHeight: mentaLayout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: mentaSpacing[6],
    padding: mentaSpacing[5],
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: mentaSpacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    marginBottom: mentaSpacing[5],
  },
  inviteCodeText: {
    ...mentaTypography.control,
    color: mentaColors.text.primary,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyIconButton: {
    padding: mentaSpacing[1],
  },
  pressed: {
    opacity: 0.72,
  },
  inviteInlineNotice: {
    marginBottom: mentaSpacing[4],
  },
  modalActions: {
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  modalButton: {
    flex: 1,
  },
});
