import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Keyboard,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
  KeyboardDismissWrapper,
  MentaMascot,
} from '@/components/ui';
import { AppTextArea } from '@/components/ui/AppFields';
import { UploadIcon } from '@/components/ui/icons';
import {
  CameraVerification,
  type CapturedMediaProof,
} from '@/components/CameraVerification';
import { MilestoneModal } from '@/components/challenge/MilestoneModal';
import { HoldToSendButton, ProofReceiptPanel } from '@/components/proof';
import { OnboardingCelebrationBurst } from '@/components/onboarding/OnboardingCelebrationBurst';
import { useTheme, useThemedStyles } from '@/constants/ThemeContext';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  createClientEventId,
  getActiveProofDraftForChallenge,
  getProofDraft,
  isShareableProofReceipt,
  type ProofDraft,
  type ProofReceiptStatus,
} from '@/lib/proof-drafts';
import {
  emitConfirmedSuccess,
  emitHaptic,
  createConfirmedReceipt,
} from '@/lib/motion/haptics';
import { isProofMediaType, type ProofMediaType } from '@/lib/proof-types';
import { PROOF_SAFETY_DISCLOSURE } from '@/lib/content-safety';
import {
  ProofSubmissionError,
  resumeProofSubmission,
  submitChallengeProof,
  type SubmitProofResult,
} from '@/lib/services/proof-submission-service';
import { useAuthStore } from '@/store/auth-store';
import { queuePositiveOutcomeReview } from '@/lib/store-review';
import { getCorrectionFeedbackCopy } from '@/lib/proof/correction-copy';
import {
  attemptProofAdBreak,
  getProofAdBreakHint,
  type ProofAdBreakHint,
} from '@/lib/proof-ad-break';
import {
  getProofOutcomeReason,
  getProofReceiptActionStatus,
  getProofSubmissionOutcome,
} from '@/lib/product-analytics';
import { trackProductEvent } from '@/lib/posthog';

import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  getCorrectionComposeNotice,
  sanitizeCorrectionReason,
} from '@/lib/proof-correction-copy';
import { useTranslation } from '@/lib/localization';
type VerificationType = ProofMediaType;
type ScreenMode = 'capture' | 'receipt';

type SubmissionInput = {
  clientEventId: string;
  localMediaUri?: string | null;
  proofType: VerificationType;
  proofValue: string;
};

const isVerificationType = (value: unknown): value is VerificationType =>
  isProofMediaType(value);

const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const getProofModeCopy = (
  verificationType: VerificationType,
  t: ReturnType<typeof useTranslation>['t']
) => {
  if (verificationType === 'text') {
    return {
      title: t('todayProof.proof.write'),
      subtitle: t('todayProof.proof.write_detail'),
    };
  }

  if (verificationType === 'video') {
    return {
      title: t('todayProof.proof.record'),
      subtitle: t('todayProof.proof.record_detail'),
    };
  }

  return {
    title: t('todayProof.proof.take_photo'),
    subtitle: t('todayProof.proof.take_photo_detail'),
  };
};

const getReceiptDetail = (
  status: ProofReceiptStatus,
  detailOverride: string | null,
  verificationType: VerificationType | undefined,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  if (detailOverride) return detailOverride;

  switch (status) {
    case 'saved-local':
      return t('todayProof.proof.saved_detail');
    case 'uploading':
      return t('todayProof.proof.uploading_detail');
    case 'sent':
      return t('todayProof.proof.sent_detail');
    case 'pending-review':
      return t('todayProof.proof.pending_detail');
    case 'accepted':
      return t('todayProof.proof.accepted_detail');
    case 'correction-requested':
      return getCorrectionFeedbackCopy({ proofType: verificationType }).detail;
    case 'unknown-result':
      return t('todayProof.proof.unknown_detail');
    case 'failed':
      return t('todayProof.proof.failed_detail');
  }
};

const isMediaProof = (
  proofType: ProofMediaType
): proofType is 'photo' | 'video' =>
  proofType === 'photo' || proofType === 'video';

const getShareableReceiptMessage = (
  status: ProofReceiptStatus | null,
  t: ReturnType<typeof useTranslation>['t']
): string | null => {
  if (status === 'accepted') {
    return t('todayProof.proof.share_accepted');
  }
  if (status === 'pending-review') {
    return t('todayProof.proof.share_pending');
  }
  return null;
};

export default function ChallengeVerificationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{
    challengeId?: string | string[];
    groupId?: string | string[];
    clientEventId?: string | string[];
    verificationType?: string | string[];
    source?: string | string[];
    correctionReason?: string | string[];
  }>();
  const challengeId = firstParam(params.challengeId);
  const routeGroupId = firstParam(params.groupId);
  const rawVerificationType = firstParam(params.verificationType);
  const routeClientEventId = firstParam(params.clientEventId);
  const source = firstParam(params.source);
  const isRecoveryQuest = source === 'recovery_quest';
  const correctionNotice = getCorrectionComposeNotice(
    sanitizeCorrectionReason(firstParam(params.correctionReason))
  );
  const verificationType = isVerificationType(rawVerificationType)
    ? rawVerificationType
    : null;
  const { user } = useAuthStore();

  const [clientEventId, setClientEventId] = useState(
    () => routeClientEventId ?? createClientEventId()
  );
  const [screenMode, setScreenMode] = useState<ScreenMode>('capture');
  const [activeDraft, setActiveDraft] = useState<ProofDraft | null>(null);
  const [receiptStatus, setReceiptStatus] = useState<ProofReceiptStatus | null>(
    null
  );
  const [celebrationId, setCelebrationId] = useState<string | null>(null);
  const [receiptDetailOverride, setReceiptDetailOverride] = useState<
    string | null
  >(null);
  const [submissionErrorCode, setSubmissionErrorCode] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textProof, setTextProof] = useState('');
  const [textProofError, setTextProofError] = useState<string | null>(null);
  const [receiptNotice, setReceiptNotice] = useState<{
    tone: 'info' | 'error';
    title: string;
    description: string;
  } | null>(null);
  const [milestoneData, setMilestoneData] = useState<{
    milestone: number;
    reward: number;
  } | null>(null);
  const mountedRef = useRef(true);
  const captureOpenedRef = useRef(false);
  const clientEventIdRef = useRef(clientEventId);
  const proofAdBreakHintRequestRef = useRef<string | null>(null);
  const pendingProofAdBreakRef = useRef<{
    submissionId: string;
  } | null>(null);
  const [proofAdBreakHint, setProofAdBreakHint] =
    useState<ProofAdBreakHint | null>(null);
  const clientTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    []
  );

  useEffect(() => {
    clientEventIdRef.current = clientEventId;
  }, [clientEventId]);

  const validationError = useMemo(() => {
    if (!challengeId) {
      return t('todayProof.source.verification.missing_promise');
    }
    if (!verificationType) {
      return t('todayProof.source.verification.unsupported_type');
    }
    return null;
  }, [challengeId, t, verificationType]);

  const navigateBack = useCallback(() => {
    backOrReplace(
      router,
      challengeId ? `/challenges/${challengeId}` : '/(tabs)'
    );
  }, [challengeId, router]);

  const navigateToChallenge = useCallback(() => {
    if (!challengeId) {
      backOrReplace(router, '/(tabs)');
      return;
    }
    router.replace(`/challenges/${challengeId}`);
  }, [challengeId, router]);

  const loadCurrentDraft = useCallback(async () => {
    if (!user || !challengeId) return null;

    const exactDraft = await getProofDraft(clientEventIdRef.current);
    const draft =
      exactDraft ??
      (routeClientEventId
        ? null
        : await getActiveProofDraftForChallenge(user.id, challengeId));

    if (!draft || !mountedRef.current) return draft;

    setActiveDraft(draft);
    setClientEventId(draft.clientEventId);
    setReceiptDetailOverride(null);
    setSubmissionErrorCode(null);
    const isUnsentMediaPreview =
      isMediaProof(draft.proofType) &&
      draft.status === 'saved-local' &&
      draft.sendRequestedAt === null &&
      Boolean(draft.localMediaUri);
    setReceiptStatus(isUnsentMediaPreview ? null : draft.status);
    setScreenMode(isUnsentMediaPreview ? 'capture' : 'receipt');
    if (draft.proofType === 'text') setTextProof(draft.proofValue);
    return draft;
  }, [challengeId, routeClientEventId, user]);

  useEffect(() => {
    mountedRef.current = true;
    if (verificationType && !captureOpenedRef.current) {
      captureOpenedRef.current = true;
      trackProductEvent('Proof Capture Result', {
        action: 'opened',
        is_correction: Boolean(correctionNotice),
        proof_type: verificationType,
      });
    }
    void loadCurrentDraft();

    return () => {
      mountedRef.current = false;
    };
  }, [correctionNotice, loadCurrentDraft, verificationType]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && !isSubmitting) {
        void loadCurrentDraft();
      }
    });

    return () => subscription.remove();
  }, [isSubmitting, loadCurrentDraft]);

  const applySubmitResult = useCallback(async (result: SubmitProofResult) => {
    if (!mountedRef.current) return;

    setActiveDraft(result.draft);
    setReceiptStatus(result.receiptStatus);
    setReceiptDetailOverride(null);
    setSubmissionErrorCode(null);
    setScreenMode('receipt');
    trackProductEvent('Proof Submission Outcome', {
      is_correction: result.isCorrection === true,
      outcome: getProofSubmissionOutcome(result.receiptStatus),
      proof_type: result.draft.proofType,
      reason: 'none',
    });

    proofAdBreakHintRequestRef.current = null;
    pendingProofAdBreakRef.current = null;
    setProofAdBreakHint(null);

    const proofAdBreakSubmissionId = result.submissionId;
    const hasConfirmedDirectInsertion =
      (result.receiptStatus === 'accepted' ||
        result.receiptStatus === 'pending-review') &&
      result.inputAccepted === true &&
      result.isCorrection === false &&
      typeof proofAdBreakSubmissionId === 'string' &&
      proofAdBreakSubmissionId.length > 0;

    if (hasConfirmedDirectInsertion) {
      proofAdBreakHintRequestRef.current = proofAdBreakSubmissionId;
      const hintPromise = result.proofAdBreakHint
        ? Promise.resolve(result.proofAdBreakHint)
        : getProofAdBreakHint(proofAdBreakSubmissionId);
      void hintPromise.then(hint => {
        if (
          !mountedRef.current ||
          proofAdBreakHintRequestRef.current !== proofAdBreakSubmissionId
        ) {
          return;
        }

        if (!hint?.due) {
          proofAdBreakHintRequestRef.current = null;
          return;
        }

        pendingProofAdBreakRef.current = {
          submissionId: proofAdBreakSubmissionId,
        };
        setProofAdBreakHint(hint);
      });
    }

    if (result.receiptStatus === 'accepted') {
      if (result.inputAccepted === true && result.submissionId) {
        setCelebrationId(result.submissionId);
      }
      const receipt = createConfirmedReceipt(
        'proof',
        result.submissionId ?? result.clientEventId
      );
      void emitConfirmedSuccess(receipt);

      if (result.inputAccepted === true) {
        await queuePositiveOutcomeReview();
      }

      if (result.milestone?.reached) {
        setMilestoneData({
          milestone: result.milestone.milestone,
          reward: result.milestone.reward,
        });
      }
    }
  }, []);

  const applySubmissionError = useCallback(
    (error: unknown) => {
      if (!mountedRef.current) return;

      proofAdBreakHintRequestRef.current = null;
      pendingProofAdBreakRef.current = null;
      setProofAdBreakHint(null);

      if (error instanceof ProofSubmissionError) {
        trackProductEvent('Proof Submission Outcome', {
          is_correction: Boolean(correctionNotice),
          outcome: getProofSubmissionOutcome(error.receiptStatus),
          proof_type:
            error.draft?.proofType ??
            verificationType ??
            activeDraft?.proofType ??
            'photo',
          reason: getProofOutcomeReason(error.code),
        });
        setActiveDraft(error.draft);
        setReceiptStatus(error.receiptStatus);
        setScreenMode('receipt');
        setSubmissionErrorCode(error.code);
        setReceiptDetailOverride(
          error.code === 'DAILY_SUBMISSION_EXISTS'
            ? error.message
            : error.code === 'NOT_JOINED'
              ? 'You need to join this promise before you can send proof.'
              : null
        );
        if (error.receiptStatus === 'failed') {
          void emitHaptic({ type: 'error' });
        }
        return;
      }

      setReceiptStatus('failed');
      trackProductEvent('Proof Submission Outcome', {
        is_correction: Boolean(correctionNotice),
        outcome: 'failed',
        proof_type: verificationType ?? activeDraft?.proofType ?? 'photo',
        reason: 'network_or_server',
      });
      setSubmissionErrorCode(null);
      setReceiptDetailOverride(
        'Proof was not sent. Check your connection and try again. Your draft stays here if it was saved locally.'
      );
      setScreenMode('receipt');
      void emitHaptic({ type: 'error' });
    },
    [activeDraft?.proofType, correctionNotice, verificationType]
  );

  const submitProof = useCallback(
    async (input: SubmissionInput) => {
      if (!challengeId || !user) {
        applySubmissionError(
          new ProofSubmissionError('Sign in again before sending proof.', {
            receiptStatus: 'failed',
            clientEventId: input.clientEventId,
            code: 'MISSING_SESSION',
          })
        );
        return;
      }

      setIsSubmitting(true);
      setReceiptStatus('uploading');
      setReceiptDetailOverride(null);
      setSubmissionErrorCode(null);
      proofAdBreakHintRequestRef.current = null;
      pendingProofAdBreakRef.current = null;
      setProofAdBreakHint(null);
      setScreenMode('receipt');

      try {
        const result = await submitChallengeProof({
          userId: user.id,
          challengeId,
          groupId: routeGroupId,
          proofValue: input.proofValue,
          proofType: input.proofType,
          clientTimeZone,
          clientEventId: input.clientEventId,
          localMediaUri: input.localMediaUri ?? null,
        });
        await applySubmitResult(result);
      } catch (error) {
        applySubmissionError(error);
      } finally {
        if (mountedRef.current) setIsSubmitting(false);
      }
    },
    [
      applySubmissionError,
      applySubmitResult,
      challengeId,
      clientTimeZone,
      routeGroupId,
      user,
    ]
  );

  const handleTextSubmit = useCallback(() => {
    const note = textProof.trim();
    const genericOnly = /^(done|finished|completed|did it)[.!]?$/i.test(note);
    if (note.length < 8 || genericOnly) {
      setTextProofError(
        'Add a detail to continue. “Done” alone is not enough.'
      );
      return;
    }

    setTextProofError(null);
    void submitProof({
      clientEventId,
      proofType: 'text',
      proofValue: note,
    });
  }, [clientEventId, submitProof, textProof]);

  const handleCapturedProof = useCallback(
    (proof: CapturedMediaProof) => {
      setClientEventId(proof.clientEventId);
      void submitProof(proof);
    },
    [submitProof]
  );

  const handleLocalDraftSaved = useCallback(
    (draft: ProofDraft) => {
      if (!mountedRef.current) return;
      setActiveDraft(draft);
      setReceiptStatus(draft.status);
      setReceiptDetailOverride(null);
      setSubmissionErrorCode(null);
      trackProductEvent('Proof Capture Result', {
        action: 'saved_local',
        is_correction: Boolean(correctionNotice),
        proof_type: draft.proofType,
      });
    },
    [correctionNotice]
  );

  const handleCaptureIssue = useCallback(
    (draft: ProofDraft | null, message: string) => {
      if (!mountedRef.current) return;
      setActiveDraft(draft);
      setReceiptStatus(draft?.status ?? 'failed');
      setReceiptDetailOverride(message);
      setSubmissionErrorCode(null);
      setScreenMode('receipt');
      trackProductEvent('Proof Capture Result', {
        action: 'capture_failed',
        is_correction: Boolean(correctionNotice),
        proof_type: draft?.proofType ?? verificationType ?? 'photo',
      });
    },
    [correctionNotice, verificationType]
  );

  const resetForNewProof = useCallback(() => {
    const currentStatus = receiptStatus ?? activeDraft?.status;
    if (currentStatus) {
      trackProductEvent('Proof Receipt Action', {
        action: 'correct',
        receipt_status: getProofReceiptActionStatus(currentStatus),
      });
    }
    setClientEventId(createClientEventId());
    setActiveDraft(null);
    setReceiptStatus(null);
    setReceiptDetailOverride(null);
    setSubmissionErrorCode(null);
    setTextProof('');
    setTextProofError(null);
    proofAdBreakHintRequestRef.current = null;
    pendingProofAdBreakRef.current = null;
    setProofAdBreakHint(null);
    setScreenMode('capture');
  }, [activeDraft?.status, receiptStatus]);

  const resumeDraft = useCallback(async () => {
    const draft = activeDraft;
    if (!draft || isSubmitting) return;
    trackProductEvent('Proof Receipt Action', {
      action: 'retry',
      receipt_status: getProofReceiptActionStatus(
        receiptStatus ?? draft.status
      ),
    });

    if (
      isMediaProof(draft.proofType) &&
      !draft.remoteMediaUrl &&
      draft.localMediaUri &&
      draft.sendRequestedAt === null
    ) {
      setReceiptDetailOverride(null);
      setSubmissionErrorCode(null);
      setScreenMode('capture');
      return;
    }

    setIsSubmitting(true);
    setReceiptStatus('uploading');
    setReceiptDetailOverride(null);
    setSubmissionErrorCode(null);
    setScreenMode('receipt');
    try {
      const result = await resumeProofSubmission(draft.clientEventId);
      await applySubmitResult(result);
    } catch (error) {
      applySubmissionError(error);
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  }, [
    activeDraft,
    applySubmissionError,
    applySubmitResult,
    isSubmitting,
    receiptStatus,
  ]);

  const leaveReceipt = useCallback(
    (
      navigate: () => void,
      action: 'close' | 'view_promise' | 'review_queue'
    ) => {
      const currentStatus = receiptStatus ?? activeDraft?.status;
      if (currentStatus) {
        trackProductEvent('Proof Receipt Action', {
          action,
          receipt_status: getProofReceiptActionStatus(currentStatus),
        });
      }
      const pendingAdBreak = pendingProofAdBreakRef.current;
      proofAdBreakHintRequestRef.current = null;
      pendingProofAdBreakRef.current = null;
      setProofAdBreakHint(null);

      if (pendingAdBreak) {
        // Start the authenticated claim while the app is foregrounded, but never
        // await it. Navigation and the saved proof receipt remain independent of
        // every claim, consent, load, presentation, and SDK outcome.
        void attemptProofAdBreak(pendingAdBreak.submissionId);
      }

      navigate();
    },
    [activeDraft?.status, receiptStatus]
  );

  const leaveReceiptToPreviousScreen = useCallback(() => {
    leaveReceipt(navigateBack, 'close');
  }, [leaveReceipt, navigateBack]);

  const leaveReceiptToChallenge = useCallback(() => {
    leaveReceipt(navigateToChallenge, 'view_promise');
  }, [leaveReceipt, navigateToChallenge]);

  const handleBack = useCallback(() => {
    if (screenMode === 'receipt') {
      leaveReceiptToPreviousScreen();
      return;
    }
    navigateBack();
  }, [leaveReceiptToPreviousScreen, navigateBack, screenMode]);

  const status = receiptStatus ?? activeDraft?.status ?? null;
  const receiptGroupId = activeDraft?.groupId ?? routeGroupId;

  const openReviewQueue = useCallback(() => {
    router.push({
      pathname: '/review-queue',
      params: {
        ...(challengeId ? { challengeId } : {}),
        ...(activeDraft?.submissionId
          ? { submissionId: activeDraft.submissionId }
          : {}),
        ...(receiptGroupId ? { groupId: receiptGroupId } : {}),
        entryPoint: receiptGroupId ? 'group_board' : 'proof_receipt',
      },
    });
  }, [activeDraft?.submissionId, challengeId, receiptGroupId, router]);

  const leaveReceiptToReviewQueue = useCallback(() => {
    leaveReceipt(openReviewQueue, 'review_queue');
  }, [leaveReceipt, openReviewQueue]);

  const reportProofIssue = useCallback(() => {
    if (!activeDraft?.submissionId || !challengeId) return;
    if (status) {
      trackProductEvent('Proof Receipt Action', {
        action: 'report',
        receipt_status: getProofReceiptActionStatus(status),
      });
    }
    router.push({
      pathname: '/report-issue',
      params: {
        reportKind: 'submission',
        source: 'proof_receipt_detail',
        challengeId,
        submissionId: activeDraft.submissionId,
        contextLabel: 'My proof receipt',
      },
    });
  }, [activeDraft?.submissionId, challengeId, router, status]);

  const handleShareReceipt = useCallback(async () => {
    const message = getShareableReceiptMessage(status, t);
    if (!message) return;
    if (status) {
      trackProductEvent('Proof Receipt Action', {
        action: 'share',
        receipt_status: getProofReceiptActionStatus(status),
      });
    }

    try {
      await Share.share({
        title: t('todayProof.proof.share_title'),
        message,
      });
      setReceiptNotice({
        tone: 'info',
        title: t('todayProof.proof.share_opened'),
        description: t('todayProof.proof.share_opened_detail'),
      });
    } catch {
      setReceiptNotice({
        tone: 'error',
        title: t('todayProof.proof.share_failed'),
        description: t('todayProof.proof.share_failed_detail'),
      });
    }
  }, [status, t]);

  const handleShareMilestone = useCallback(async () => {
    if (!milestoneData) return;
    try {
      await Share.share({
        title: t('todayProof.proof.share_progress'),
        message: t('todayProof.proof.milestone_message', {
          count: milestoneData.milestone,
        }),
      });
      setReceiptNotice({
        tone: 'info',
        title: t('todayProof.proof.share_opened'),
        description: t('todayProof.proof.share_progress_detail'),
      });
    } catch {
      setReceiptNotice({
        tone: 'error',
        title: t('todayProof.proof.share_failed'),
        description: t('todayProof.proof.share_result_failed', {
          count: milestoneData.milestone,
        }),
      });
    }
  }, [milestoneData, t]);

  const canOpenUnsentLocalMedia = Boolean(
    activeDraft &&
    isMediaProof(activeDraft.proofType) &&
    !activeDraft.remoteMediaUrl &&
    activeDraft.localMediaUri &&
    activeDraft.sendRequestedAt === null
  );

  const receiptActions = useMemo(() => {
    if (!status) return null;

    if (submissionErrorCode === 'DAILY_SUBMISSION_EXISTS') {
      return {
        primaryLabel: t('todayProof.proof.view_promise'),
        onPrimary: navigateToChallenge,
        secondaryLabel: t('todayProof.proof.back'),
        onSecondary: navigateBack,
      };
    }

    switch (status) {
      case 'saved-local':
        return {
          primaryLabel: canOpenUnsentLocalMedia
            ? t('todayProof.proof.open_saved')
            : t('todayProof.proof.resume'),
          onPrimary: resumeDraft,
          secondaryLabel: t('todayProof.proof.back'),
          onSecondary: navigateBack,
        };
      case 'uploading':
        return {
          primaryLabel: isSubmitting ? undefined : t('todayProof.proof.resume'),
          onPrimary: resumeDraft,
          secondaryLabel: t('todayProof.proof.back'),
          onSecondary: navigateBack,
        };
      case 'sent':
        return {
          primaryLabel: t('todayProof.proof.done'),
          onPrimary: leaveReceiptToPreviousScreen,
          secondaryLabel: t('todayProof.proof.view_promise'),
          onSecondary: leaveReceiptToChallenge,
        };
      case 'pending-review':
        return {
          primaryLabel: t('todayProof.proof.review_someone'),
          onPrimary: leaveReceiptToReviewQueue,
          secondaryLabel: t('todayProof.proof.back'),
          onSecondary: leaveReceiptToPreviousScreen,
        };
      case 'accepted':
        return {
          primaryLabel: t('todayProof.proof.done'),
          onPrimary: leaveReceiptToPreviousScreen,
          secondaryLabel: t('todayProof.proof.view_promise'),
          onSecondary: leaveReceiptToChallenge,
        };
      case 'correction-requested':
        return {
          primaryLabel: getCorrectionFeedbackCopy({
            proofType: verificationType,
          }).primaryLabel,
          onPrimary: resetForNewProof,
          secondaryLabel: t('todayProof.proof.view_promise'),
          onSecondary: navigateToChallenge,
        };
      case 'unknown-result':
        return {
          primaryLabel: t('todayProof.proof.check_status'),
          onPrimary: resumeDraft,
          secondaryLabel: t('todayProof.proof.back'),
          onSecondary: navigateBack,
        };
      case 'failed':
        if (submissionErrorCode === 'NOT_JOINED') {
          return {
            primaryLabel: t('todayProof.proof.view_promise'),
            onPrimary: navigateToChallenge,
            secondaryLabel: t('todayProof.proof.back'),
            onSecondary: navigateBack,
          };
        }
        return {
          primaryLabel: canOpenUnsentLocalMedia
            ? t('todayProof.proof.open_saved')
            : t('todayProof.promise.try_again'),
          onPrimary: resumeDraft,
          secondaryLabel: t('todayProof.proof.back'),
          onSecondary: navigateBack,
        };
    }
  }, [
    canOpenUnsentLocalMedia,
    isSubmitting,
    leaveReceiptToChallenge,
    leaveReceiptToPreviousScreen,
    leaveReceiptToReviewQueue,
    navigateBack,
    navigateToChallenge,
    resetForNewProof,
    resumeDraft,
    status,
    submissionErrorCode,
    t,
    verificationType,
  ]);

  if (validationError) {
    return (
      <AppScreen
        lane="focused"
        safeArea
        hasTabBar={false}
        scrollable
        contentContainerStyle={styles.validationScreen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.validationCard}>
          <UploadIcon size={30} color={theme.colors.text.primary} />
          <Text style={styles.validationTitle}>
            {t('todayProof.review.could_not_open')}
          </Text>
          <Text style={styles.validationCopy}>{validationError}</Text>
          <AppButton
            title={t('todayProof.review.return_to_promise')}
            onPress={navigateBack}
            size="large"
            fullWidth
          />
        </View>
      </AppScreen>
    );
  }

  if (!verificationType || !challengeId) return null;

  const proofModeCopy = getProofModeCopy(verificationType, t);
  const shouldShowMascot = status === 'accepted' || status === 'pending-review';

  return (
    <AppScreen
      lane="immersive"
      safeArea
      hasTabBar={false}
      scrollable
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <AppTopBar
        title={
          screenMode === 'receipt' && status
            ? t('todayProof.proof.receipt')
            : proofModeCopy.title
        }
        subtitle={
          screenMode === 'receipt' && status
            ? undefined
            : proofModeCopy.subtitle
        }
        onBack={handleBack}
      />

      {screenMode === 'receipt' && status ? (
        <View style={styles.receiptScreen}>
          {status === 'accepted' && celebrationId ? (
            <OnboardingCelebrationBurst key={celebrationId} />
          ) : null}
          {shouldShowMascot ? (
            <MentaMascot
              state={status === 'accepted' ? 'proof-proud' : 'review-needed'}
              size="md"
            />
          ) : null}
          {proofAdBreakHint?.due ? (
            <AppInlineNotice
              title={t('todayProof.proof.ad_break')}
              description={t('todayProof.proof.ad_break_detail')}
              tone="info"
              testID="proof-ad-break-notice"
            />
          ) : null}
          {receiptNotice ? (
            <AppInlineNotice
              title={receiptNotice.title}
              description={receiptNotice.description}
              tone={receiptNotice.tone === 'error' ? 'error' : 'info'}
              testID="proof-receipt-share-notice"
            />
          ) : null}
          <ProofReceiptPanel
            status={status}
            detailOverride={getReceiptDetail(
              status,
              receiptDetailOverride,
              verificationType,
              t
            )}
            preview={
              activeDraft
                ? {
                    proofType: activeDraft.proofType,
                    localMediaUri: activeDraft.localMediaUri,
                    remoteMediaUri: activeDraft.remoteMediaUrl,
                    text:
                      activeDraft.proofType === 'text'
                        ? activeDraft.proofValue
                        : null,
                    updatedAt: activeDraft.updatedAt,
                  }
                : null
            }
            primaryActionLabel={receiptActions?.primaryLabel}
            onPrimaryAction={receiptActions?.onPrimary}
            primaryActionDisabled={isSubmitting}
            secondaryActionLabel={receiptActions?.secondaryLabel}
            onSecondaryAction={receiptActions?.onSecondary}
            secondaryActionDisabled={isSubmitting}
            shareActionLabel={
              isShareableProofReceipt(status)
                ? t('todayProof.proof.share_receipt')
                : undefined
            }
            onShareAction={
              isShareableProofReceipt(status)
                ? () => void handleShareReceipt()
                : undefined
            }
            shareActionDisabled={isSubmitting}
            showSpinner={status === 'uploading' && isSubmitting}
            onReportIssue={
              activeDraft?.submissionId ? reportProofIssue : undefined
            }
          />
        </View>
      ) : (
        <>
          {isRecoveryQuest ? (
            <AppInlineNotice
              title={t('todayProof.proof.recovery_title')}
              description={t('todayProof.proof.recovery_detail')}
              tone="warning"
              testID="recovery-proof-context"
            />
          ) : null}
          {correctionNotice ? (
            <AppInlineNotice
              title={correctionNotice.title}
              description={correctionNotice.description}
              tone="warning"
              testID="correction-proof-context"
            />
          ) : null}
          <Text style={styles.safetyDisclosure}>{PROOF_SAFETY_DISCLOSURE}</Text>
          {verificationType === 'text' ? (
            <KeyboardDismissWrapper
              testID="text-proof-keyboard-dismiss-area"
              style={styles.textProofPanel}
            >
              <AppTextArea
                testID="text-proof-input"
                value={textProof}
                onChangeText={value => {
                  setTextProof(value);
                  if (textProofError) setTextProofError(null);
                }}
                placeholder={t('todayProof.proof.text_placeholder')}
                textAlignVertical="top"
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                onSubmitEditing={() => Keyboard.dismiss()}
                containerStyle={styles.textProofInput}
                inputStyle={styles.textProofInputBody}
                maxLength={240}
                editable={!isSubmitting}
                errorText={textProofError ?? undefined}
                helperText={t('todayProof.proof.text_helper')}
                accessibilityLabel={t('todayProof.proof.text_label')}
                accessibilityHint={t('todayProof.proof.text_helper')}
              />
              <View style={styles.textProofMetaRow}>
                {textProofError ? (
                  <Text
                    style={[styles.textProofHelper, styles.textProofError]}
                    accessibilityLiveRegion="polite"
                  >
                    {textProofError}
                  </Text>
                ) : (
                  <View style={styles.textProofHelperSpacer} />
                )}
                <Text style={styles.textProofCounter}>
                  {textProof.length} / 240
                </Text>
              </View>
              <HoldToSendButton
                onComplete={handleTextSubmit}
                disabled={isSubmitting}
                label={t('todayProof.proof.hold_label')}
                holdingLabel={t('todayProof.proof.hold_holding')}
                hint={t('todayProof.proof.release_cancel')}
                tapAlternativeLabel={t('todayProof.proof.send_one_tap')}
                testID="text-proof-hold-to-send"
              />
            </KeyboardDismissWrapper>
          ) : (
            <CameraVerification
              key={`${clientEventId}-${activeDraft?.localMediaUri ?? 'new'}`}
              challengeId={challengeId}
              groupId={receiptGroupId}
              verificationType={verificationType}
              clientEventId={clientEventId}
              clientTimeZone={clientTimeZone}
              initialLocalMediaUri={
                activeDraft?.clientEventId === clientEventId
                  ? activeDraft.localMediaUri
                  : null
              }
              onLocalDraftSaved={handleLocalDraftSaved}
              onVerificationComplete={handleCapturedProof}
              onCaptureIssue={handleCaptureIssue}
              onCancel={handleBack}
            />
          )}
        </>
      )}

      {milestoneData ? (
        <MilestoneModal
          visible
          milestone={milestoneData.milestone}
          reward={milestoneData.reward}
          onClose={() => setMilestoneData(null)}
          onShare={() => void handleShareMilestone()}
          approvedAt={activeDraft?.updatedAt}
        />
      ) : null}
    </AppScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screenContent: {
      gap: mentaSpacing[6],
      paddingTop: mentaSpacing[5],
    },
    receiptScreen: {
      gap: mentaSpacing[6],
      paddingTop: mentaSpacing[5],
      paddingBottom: mentaSpacing[8],
    },
    textProofPanel: {
      gap: mentaSpacing[4],
      paddingTop: mentaSpacing[4],
      paddingBottom: mentaSpacing[8],
    },
    safetyDisclosure: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    textProofInput: {
      minHeight: 180,
    },
    textProofInputBody: {
      ...mentaTypography.body,
    },
    textProofMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    textProofHelper: {
      flex: 1,
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    textProofHelperSpacer: {
      flex: 1,
    },
    textProofError: {
      color: theme.colors.status.error,
    },
    textProofCounter: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.captionMedium,
      fontVariant: ['tabular-nums'],
    },
    validationScreen: {
      justifyContent: 'center',
    },
    validationCard: {
      gap: theme.spacing.lg,
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    validationTitle: {
      color: mentaColors.text.primary,
      ...mentaTypography.heading,
      textAlign: 'center',
    },
    validationCopy: {
      color: mentaColors.text.secondary,
      ...mentaTypography.body,
      textAlign: 'center',
      width: '100%',
    },
  });
