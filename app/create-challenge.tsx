import React from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useKeyboardOverlap,
  useRevealFocusedInput,
} from '@/hooks/use-keyboard-overlap';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import type { MascotState } from '@/components/ui/MentaMascot';
import { useRewardedMomentaAd } from '@/lib/hooks/use-rewarded-momenta-ad';
import { useAdRewardAmount } from '@/lib/hooks/useAdReward';
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
  XIcon,
} from '@/components/ui/icons';
import {
  useTheme,
  useThemedStyles,
  type ThemeContextType,
} from '@/constants/ThemeContext';
import {
  mentaColors,
  mentaHeadingRoles,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { AUTHORING_SAFETY_DISCLOSURE } from '@/lib/content-safety';
import { useAuthStore } from '@/store/auth-store';
import { useChallengeStore, type Challenge } from '@/store/challenge-store';
import { useMomentaStore } from '@/store/momenta-store';
import { useGroupStore } from '@/store/group-store';
import {
  PromiseFlowHeader,
  PromiseFlowQuestion,
  PromiseLengthStep,
  PromiseProofStep,
  PromiseReviewStep,
  PromiseReviewerStep,
  PromiseTitleStep,
  checkInWeekdaysFor,
  describeCheckInPlan,
  describeFirstProofDay,
  proofKindLabel,
  type CheckInPlan,
  type ReviewerChoice,
} from '@/components/challenge/create/PromiseFlow';
import { AppButton, AppScreen } from '@/components/ui';
import {
  GroupModeNoGroupState,
  NotificationEducationState,
  ReferralBridgeState,
  type ReferralShareOutcome,
} from '@/components/challenge/promise-runtime-states';
import {
  describeCreatePromiseCost,
  describeCreatePromiseQuota,
  resolveCreatePromiseGate,
  type CreatePromiseQuote,
} from '@/lib/economy/create-promise-quote';
import { RevenueCatAPI } from '@/lib/paywall/revenuecat';
import {
  resolveChallengeMode,
  type ChallengeCreateSearchParams,
} from '@/lib/challenge-mode';
import {
  getCommitmentTemplates,
  resolveCommitmentTemplate,
  type CommitmentTemplate,
  type CommitmentTemplateId,
} from '@/lib/commitments/templates';
import { listCreateIntensityOptions } from '@/lib/commitments/create-intensity-copy';
import { type PromiseCreationReceipt } from '@/lib/commitments/promise-creation-receipt';
import type {
  ChallengeDifficulty,
  ChallengeVerificationType,
} from '@/components/challenge/create/types';
import { clearOnboardingDraft } from '@/lib/onboarding-draft';
import { formatLocalDay } from '@/lib/loop/day-context';
import {
  getPromiseCreationRecovery,
  type PromiseCreationRecovery,
} from '@/lib/promise-creation-recovery';
import {
  clearPromiseCreationDraft,
  loadPromiseCreationDraft,
  savePromiseCreationDraft,
  type PromiseCreationDraftInput,
} from '@/lib/promise-creation-draft';
import { buildInviteShareUrl } from '@/lib/invite-links';
import { copyToClipboard } from '@/lib/qr-utils';
import { isLegalAcceptanceRequiredError } from '@/lib/legal-acceptance';
import { groupQueryKeys } from '@/lib/group-query-keys';
import { trackProductEvent } from '@/lib/posthog';
import { trackMetaAdsCreatePromise } from '@/lib/meta-ads';
import { getPromiseDurationBucket } from '@/lib/product-analytics';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
} from '@/lib/motion/haptics';

import { usePhoneLayout } from '@/constants/use-phone-layout';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type Localise = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;
const durationOptions = [7, 14, 30] as const;
const MIN_PROOF_DESCRIPTION_LENGTH = 8;
const PROMISE_TITLE_MAX_LENGTH = 100;

type CreateStepId = 'name' | 'proof' | 'who' | 'length' | 'review';

const getSingleParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDateString = (date: Date) =>
  formatLocalDay(
    date,
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

const isProofType = (
  value: unknown
): value is Exclude<ChallengeVerificationType, 'none'> =>
  value === 'photo' || value === 'video' || value === 'text';

const toPromiseDraftStep = (value: number): 0 | 1 | 2 | 3 => {
  if (value === 1 || value === 2 || value === 3) return value;
  return 0;
};

const toPromiseDraftDuration = (
  value: number
): (typeof durationOptions)[number] =>
  durationOptions.includes(value as (typeof durationOptions)[number])
    ? (value as (typeof durationOptions)[number])
    : 14;

const getProofTypeLabel = (
  value: ChallengeVerificationType,
  localise: Localise
) => {
  if (value === 'photo') return localise('todayProof.source.media.photo');
  if (value === 'video') return localise('todayProof.source.media.video');
  if (value === 'text') return localise('todayProof.source.media.text');
  return localise('todayProof.source.media.proof');
};

export default function CreateChallengeScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<ChallengeCreateSearchParams>();
  const resolvedMode = React.useMemo(
    () => resolveChallengeMode(params),
    [params]
  );
  const routeMode =
    resolvedMode.usedLegacyParams && !resolvedMode.groupId
      ? 'solo'
      : resolvedMode.mode;
  const routeGroupId = routeMode === 'group' ? resolvedMode.groupId : null;
  const commitmentTemplates = getCommitmentTemplates(locale);
  const difficultyOptions = React.useMemo(
    () => listCreateIntensityOptions(locale),
    [locale]
  );
  const screenRootRef = React.useRef<View>(null);
  const footerActionsRef = React.useRef<View>(null);
  const bodyScrollRef = React.useRef<ScrollView>(null);
  const focusedInputReveal = useRevealFocusedInput(bodyScrollRef);
  const keyboardOverlap = useKeyboardOverlap({
    rootRef: screenRootRef,
    targetRef: footerActionsRef,
    onShown: focusedInputReveal.requestReveal,
  });
  const selectedParamTemplate = React.useMemo(
    () => resolveCommitmentTemplate(params.templateId, locale),
    [locale, params.templateId]
  );
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const { user } = useAuthStore();
  const createChallengeWithPayment = useChallengeStore(
    state => state.createChallengeWithPayment
  );
  const shareChallenge = useChallengeStore(state => state.shareChallenge);
  const getOrCreateChallengeInviteCode = useChallengeStore(
    state => state.getOrCreateChallengeInviteCode
  );
  const getCreatePromiseQuote = useChallengeStore(
    state => state.getCreatePromiseQuote
  );
  const isStoreLoading = useChallengeStore(state => state.isLoading);
  const balance = useMomentaStore(state => state.balance);
  const fetchBalance = useMomentaStore(state => state.fetchBalance);
  const { watch: watchRewardedAd } = useRewardedMomentaAd('promise_create');
  const adRewardAmount = useAdRewardAmount();

  const onboardingTitle = getSingleParam(params.title);
  const onboardingVerificationType = getSingleParam(params.verificationType);
  const isOnboardingHandoff = getSingleParam(params.source) === 'onboarding';
  const hasExplicitRouteDefaults =
    Boolean(selectedParamTemplate) ||
    Boolean(onboardingTitle?.trim()) ||
    isProofType(onboardingVerificationType) ||
    isOnboardingHandoff;

  const showsReviewerStep = routeMode !== 'group' && !isOnboardingHandoff;
  const groups = useGroupStore(state => state.groups);
  const userGroupIds = useGroupStore(state => state.userGroups);
  const fetchUserGroups = useGroupStore(state => state.fetchUserGroups);
  React.useEffect(() => {
    if (!showsReviewerStep || !user?.id) return;
    void fetchUserGroups(user.id).catch(() => undefined);
  }, [fetchUserGroups, showsReviewerStep, user?.id]);
  const reviewerGroups = React.useMemo(
    () =>
      groups
        .filter(
          group =>
            userGroupIds.includes(group.id) &&
            group.status === 'active' &&
            group.kind !== 'promise'
        )
        .map(group => ({
          id: group.id,
          name: group.name,
          memberCount: group.member_count,
        })),
    [groups, userGroupIds]
  );

  const [currentStep, setCurrentStep] = React.useState(0);
  const [templateId, setTemplateId] = React.useState<
    CommitmentTemplateId | undefined
  >(selectedParamTemplate?.id);
  const [title, setTitle] = React.useState(
    onboardingTitle ?? selectedParamTemplate?.title ?? ''
  );
  const [description, setDescription] = React.useState(
    selectedParamTemplate?.description ?? ''
  );
  const [proofType, setProofType] = React.useState<ChallengeVerificationType>(
    () => {
      if (
        onboardingVerificationType === 'photo' ||
        onboardingVerificationType === 'video' ||
        onboardingVerificationType === 'text'
      ) {
        return onboardingVerificationType;
      }
      return selectedParamTemplate?.verificationType ?? 'photo';
    }
  );
  const [proofDescription, setProofDescription] = React.useState(
    selectedParamTemplate?.verificationDescription ?? ''
  );
  const [submissionText, setSubmissionText] = React.useState(
    selectedParamTemplate?.submissionText ?? ''
  );
  const [duration, setDuration] = React.useState(
    selectedParamTemplate?.durationDays ?? 14
  );
  const [difficulty, setDifficulty] = React.useState<ChallengeDifficulty>(
    selectedParamTemplate?.difficulty ?? 'medium'
  );
  const [checkInPlan, setCheckInPlan] = React.useState<CheckInPlan>({
    kind: 'every',
  });
  const [reviewer, setReviewer] = React.useState<ReviewerChoice>({
    kind: 'self',
  });
  const groupId =
    routeGroupId ?? (reviewer.kind === 'group' ? reviewer.groupId : null);
  const mode: 'solo' | 'group' =
    routeMode === 'group' || groupId ? 'group' : 'solo';
  const checkInWeekdays = checkInWeekdaysFor(checkInPlan);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [paywallVisible, setPaywallVisible] = React.useState(false);
  const [paywallVariant, setPaywallVariant] = React.useState<
    'default' | 'insufficient' | 'quota'
  >('default');
  const [quotaLimit, setQuotaLimit] = React.useState<number | undefined>();
  const [promiseQuote, setPromiseQuote] =
    React.useState<CreatePromiseQuote | null>(null);
  const [creationError, setCreationError] = React.useState<{
    title: string;
    message: string;
  } | null>(null);
  const [creationRecovery, setCreationRecovery] =
    React.useState<PromiseCreationRecovery | null>(null);
  const [createdChallenge, setCreatedChallenge] =
    React.useState<Challenge | null>(null);
  const [creationReceipt, setCreationReceipt] =
    React.useState<PromiseCreationReceipt | null>(null);
  const [postCreateView, setPostCreateView] = React.useState<
    'receipt' | 'notifications' | 'referral'
  >('receipt');
  const [reminderEducationEnabled, setReminderEducationEnabled] =
    React.useState(true);
  const [referralShareOutcome, setReferralShareOutcome] =
    React.useState<ReferralShareOutcome>('idle');
  const [referralWorking, setReferralWorking] = React.useState(false);
  const [isDraftRestoring, setIsDraftRestoring] = React.useState(true);
  const [isSavingDraftExit, setIsSavingDraftExit] = React.useState(false);
  const [unknownCreateResultAt, setUnknownCreateResultAt] = React.useState<
    string | null
  >(null);
  const [todayReadbackRequestedAt, setTodayReadbackRequestedAt] =
    React.useState<string | null>(null);
  const submittingRef = React.useRef(false);
  const creationReceiptRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setPromiseQuote(null);
      return () => undefined;
    }

    void getCreatePromiseQuote(user.id)
      .then(quote => {
        if (!cancelled) setPromiseQuote(quote);
      })
      .catch(() => {
        if (!cancelled) setPromiseQuote(null);
      });

    return () => {
      cancelled = true;
    };
  }, [getCreatePromiseQuote, user?.id]);

  const selectedTemplate = React.useMemo(
    () =>
      templateId
        ? commitmentTemplates.find(template => template.id === templateId)
        : null,
    [commitmentTemplates, templateId]
  );

  const stepIds = React.useMemo<CreateStepId[]>(
    () =>
      showsReviewerStep
        ? ['name', 'proof', 'who', 'length', 'review']
        : ['name', 'proof', 'length', 'review'],
    [showsReviewerStep]
  );
  const activeStepId = stepIds[Math.min(currentStep, stepIds.length - 1)];
  const nextStepId = stepIds[currentStep + 1];
  const isReviewStep = activeStepId === 'review';
  const reviewShortfall =
    isReviewStep && promiseQuote && promiseQuote.cost > balance
      ? promiseQuote.cost - balance
      : 0;
  const narratorState: MascotState =
    activeStepId === 'proof'
      ? 'today-proof-due'
      : activeStepId === 'length'
        ? 'today-at-risk'
        : activeStepId === 'review'
          ? reviewShortfall > 0
            ? 'momenta-short'
            : 'promise-confirmed'
          : 'promise-guide';
  const narratorMessage =
    reviewShortfall > 0
      ? t('commerce.topUp.shortBubble', {
          amount: reviewShortfall.toLocaleString(),
        })
      : activeStepId === 'name'
        ? t('todayProof.createFlow.promiseBubble')
        : activeStepId === 'proof'
          ? t('todayProof.createFlow.proofBubble')
          : activeStepId === 'who'
            ? t('todayProof.createFlow.whoBubble')
            : activeStepId === 'length'
              ? t('todayProof.createFlow.lengthBubble')
              : t('todayProof.createFlow.reviewBubble');
  const proofDescriptionLength = proofDescription.trim().length;
  const selectedDifficulty =
    difficultyOptions.find(option => option.id === difficulty) ??
    difficultyOptions[1];
  const scheduleLabel = describeCheckInPlan(checkInPlan, locale, t);
  const checkerLabel =
    reviewer.kind === 'group'
      ? reviewer.name
      : routeGroupId
        ? (groups.find(group => group.id === routeGroupId)?.name ??
          t('todayProof.createFlow.yourGroups'))
        : reviewer.kind === 'friend'
          ? t('todayProof.createFlow.checkerFriend')
          : t('todayProof.createFlow.checkerMe');
  const primaryCta =
    activeStepId === 'name'
      ? t('todayProof.create.choose_proof')
      : activeStepId === 'proof'
        ? nextStepId === 'who'
          ? t('todayProof.createFlow.chooseWho')
          : t('todayProof.createFlow.chooseLength')
        : activeStepId === 'who'
          ? t('todayProof.createFlow.chooseLength')
          : activeStepId === 'length'
            ? t('todayProof.createFlow.useDays', { count: duration })
            : reviewShortfall > 0
              ? t('commerce.topUp.getAmountMore', {
                  amount: reviewShortfall.toLocaleString(),
                })
              : t('todayProof.createFlow.start');
  const applyTemplate = (template: CommitmentTemplate) => {
    setTemplateId(template.id);
    setTitle(template.title);
    setDescription(template.description);
    setProofType(template.verificationType);
    setProofDescription(template.verificationDescription);
    setSubmissionText(template.submissionText);
    setDuration(template.durationDays);
    setDifficulty(template.difficulty);
  };

  const isStepValid = React.useMemo(() => {
    if (activeStepId === 'name') return title.trim().length >= 3;
    if (activeStepId === 'proof')
      return proofDescriptionLength >= MIN_PROOF_DESCRIPTION_LENGTH;
    return true;
  }, [activeStepId, proofDescriptionLength, title]);
  const isCreationBusy =
    isSubmitting || isStoreLoading || isDraftRestoring || isSavingDraftExit;
  const isCreationOutcomeUnknown = creationRecovery?.kind === 'unknown-result';
  const needsTodayReconciliation =
    isCreationOutcomeUnknown && !todayReadbackRequestedAt;
  const unknownCreationPrimaryLabel = needsTodayReconciliation
    ? t('todayProof.create.check_today')
    : t('todayProof.create.choose_return');
  const createdProofType = isProofType(createdChallenge?.verificationType)
    ? createdChallenge.verificationType
    : isProofType(proofType)
      ? proofType
      : 'photo';
  const createdChallengeTitle =
    createdChallenge?.title ||
    title.trim() ||
    t('todayProof.create.your_promise');

  const buildCurrentPromiseDraft = React.useCallback(
    (
      overrides: Partial<
        Pick<
          PromiseCreationDraftInput,
          'unknownCreateResultAt' | 'todayReadbackRequestedAt'
        >
      > = {}
    ): PromiseCreationDraftInput | null => {
      if (!user?.id) return null;

      return {
        ownerUserId: user.id,
        // Drafts keep four steps; a saved review reopens on the length step.
        currentStep: toPromiseDraftStep(Math.min(currentStep, 3)),
        title,
        description,
        proofType: isProofType(proofType) ? proofType : 'photo',
        proofDescription,
        submissionText,
        duration: toPromiseDraftDuration(duration),
        difficulty,
        unknownCreateResultAt:
          overrides.unknownCreateResultAt === undefined
            ? unknownCreateResultAt
            : overrides.unknownCreateResultAt,
        todayReadbackRequestedAt:
          overrides.todayReadbackRequestedAt === undefined
            ? todayReadbackRequestedAt
            : overrides.todayReadbackRequestedAt,
      };
    },
    [
      currentStep,
      description,
      difficulty,
      proofDescription,
      proofType,
      submissionText,
      title,
      todayReadbackRequestedAt,
      unknownCreateResultAt,
      user?.id,
      duration,
    ]
  );

  React.useEffect(() => {
    let cancelled = false;
    const userId = user?.id;

    const resetToRouteDefaults = () => {
      setCurrentStep(0);
      setTemplateId(selectedParamTemplate?.id);
      setTitle(onboardingTitle ?? selectedParamTemplate?.title ?? '');
      setDescription(selectedParamTemplate?.description ?? '');
      setProofType(() => {
        if (
          onboardingVerificationType === 'photo' ||
          onboardingVerificationType === 'video' ||
          onboardingVerificationType === 'text'
        ) {
          return onboardingVerificationType;
        }
        return selectedParamTemplate?.verificationType ?? 'photo';
      });
      setProofDescription(selectedParamTemplate?.verificationDescription ?? '');
      setSubmissionText(selectedParamTemplate?.submissionText ?? '');
      setDuration(selectedParamTemplate?.durationDays ?? 14);
      setDifficulty(selectedParamTemplate?.difficulty ?? 'medium');
      setCreationError(null);
      setCreationRecovery(null);
      setCreatedChallenge(null);
      setCreationReceipt(null);
      setUnknownCreateResultAt(null);
      setTodayReadbackRequestedAt(null);
      creationReceiptRef.current = false;
    };

    resetToRouteDefaults();

    if (!userId) {
      setIsDraftRestoring(false);
      return () => {
        cancelled = true;
      };
    }

    if (hasExplicitRouteDefaults) {
      setIsDraftRestoring(false);
      return () => {
        cancelled = true;
      };
    }

    setIsDraftRestoring(true);
    void loadPromiseCreationDraft(userId)
      .then(draft => {
        if (cancelled || !draft) {
          return;
        }

        setCurrentStep(draft.currentStep);
        setTitle(draft.title);
        setDescription(draft.description);
        setProofType(draft.proofType);
        setProofDescription(draft.proofDescription);
        setSubmissionText(draft.submissionText);
        setDuration(draft.duration);
        setDifficulty(draft.difficulty);
        setUnknownCreateResultAt(draft.unknownCreateResultAt);
        setTodayReadbackRequestedAt(draft.todayReadbackRequestedAt);
        if (draft.unknownCreateResultAt) {
          const recovery = getPromiseCreationRecovery(
            {
              message: t(
                'todayProof.residual.network_request_failed_before_a_response_arrived'
              ),
            },
            locale
          );
          setCreationRecovery(recovery);
          setCreationError(recovery);
        }
      })
      .catch(error => {
        console.warn('[PromiseCreationDraft] Could not restore draft:', error);
      })
      .finally(() => {
        if (!cancelled) setIsDraftRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasExplicitRouteDefaults,
    onboardingTitle,
    onboardingVerificationType,
    selectedParamTemplate,
    locale,
    t,
    user?.id,
  ]);

  React.useEffect(() => {
    if (isDraftRestoring || creationReceiptRef.current) return;

    const draft = buildCurrentPromiseDraft();
    if (!draft || (!draft.title.trim() && !draft.description.trim())) return;

    const timeout = setTimeout(() => {
      if (creationReceiptRef.current) return;
      void savePromiseCreationDraft(draft).catch(error => {
        console.warn('[PromiseCreationDraft] Could not save draft:', error);
      });
    }, 450);

    return () => clearTimeout(timeout);
  }, [buildCurrentPromiseDraft, isDraftRestoring]);

  const handleViewCreatedChallenge = React.useCallback(() => {
    if (!createdChallenge) return;
    // This screen is presented by the root native stack as a modal. Exit that
    // modal explicitly so its underlying review step cannot become the final
    // destination when the confirmed receipt opens the new promise.
    router.dismissTo({
      pathname: '/challenges/[id]',
      params: { id: createdChallenge.id },
    } as never);
  }, [createdChallenge, router]);

  const handlePostFirstProof = React.useCallback(() => {
    if (!createdChallenge) return;
    // Leave the creation modal so its review step cannot stay underneath.
    router.dismissTo({
      pathname: '/verification',
      params: {
        challengeId: createdChallenge.id,
        verificationType: createdProofType,
        source: 'created_challenge',
      },
    } as never);
  }, [createdChallenge, createdProofType, router]);

  const handleOpenCreatedGroup = React.useCallback(() => {
    if (groupId) {
      router.replace(`/groups/${groupId}` as never);
      return;
    }
    handleViewCreatedChallenge();
  }, [groupId, handleViewCreatedChallenge, router]);

  const handleInviteFriend = React.useCallback(() => {
    if (!createdChallenge) return;
    router.dismissTo({
      pathname: '/promise-accountability',
      params: { challengeId: createdChallenge.id, source: 'promise' },
    } as never);
  }, [createdChallenge, router]);

  const handleBackToToday = React.useCallback(() => {
    router.replace('/(tabs)' as never);
  }, [router]);

  const handleOpenReminderEducation = React.useCallback(() => {
    setReminderEducationEnabled(true);
    setPostCreateView('notifications');
  }, []);

  const handleOpenReferralBridge = React.useCallback(() => {
    setReferralShareOutcome('idle');
    setPostCreateView('referral');
  }, []);

  const handleShareCreatedChallenge = React.useCallback(async () => {
    if (!createdChallenge || mode !== 'group') return;

    setReferralWorking(true);
    setReferralShareOutcome('idle');
    try {
      const { shareResult } = await shareChallenge(
        createdChallenge.id,
        createdChallenge.title
      );
      // The native result only proves the share sheet closed. It does not
      // prove that a recipient received the invite.
      setReferralShareOutcome(
        shareResult === 'copied_fallback' ? 'copied' : 'sheet-closed'
      );
    } catch (shareError) {
      console.warn(
        '[PromiseReferral] Could not open invite share:',
        shareError
      );
      setReferralShareOutcome('copy-failed');
    } finally {
      setReferralWorking(false);
    }
  }, [createdChallenge, mode, shareChallenge]);

  const handleCopyCreatedChallengeInvite = React.useCallback(async () => {
    if (!createdChallenge || mode !== 'group') return;

    setReferralWorking(true);
    setReferralShareOutcome('idle');
    try {
      const code = await getOrCreateChallengeInviteCode(createdChallenge.id);
      if (!code) throw new Error('Invite code unavailable');
      await copyToClipboard(buildInviteShareUrl('challenge', code));
      setReferralShareOutcome('copied');
    } catch (copyError) {
      console.warn('[PromiseReferral] Could not copy invite:', copyError);
      setReferralShareOutcome('copy-failed');
    } finally {
      setReferralWorking(false);
    }
  }, [createdChallenge, getOrCreateChallengeInviteCode, mode]);

  const handleCloseCreateChallenge = () => {
    if (isCreationBusy || submittingRef.current) return;
    if (createdChallenge) {
      handleViewCreatedChallenge();
      return;
    }
    backOrReplace(router, '/(tabs)/create');
  };

  const goBack = () => {
    if (isCreationBusy || submittingRef.current) return;
    if (currentStep === 0) {
      handleCloseCreateChallenge();
      return;
    }
    setCurrentStep(step => Math.max(0, step - 1));
  };

  const goNext = () => {
    if (isCreationBusy || submittingRef.current || isCreationOutcomeUnknown) {
      return;
    }
    Keyboard.dismiss();
    if (activeStepId === 'name' && title.trim().length < 3) {
      setCreationError({
        title: t('todayProof.create.name_promise'),
        message: t('todayProof.create.name_promise_detail'),
      });
      return;
    }
    if (
      activeStepId === 'proof' &&
      proofDescription.trim().length < MIN_PROOF_DESCRIPTION_LENGTH
    ) {
      setCreationError({
        title: t('todayProof.create.describe_proof'),
        message: t('todayProof.create.describe_proof_detail'),
      });
      return;
    }
    setCreationError(null);
    setCreationRecovery(null);
    if (!isReviewStep) {
      setCurrentStep(step => Math.min(step + 1, stepIds.length - 1));
      return;
    }
    if (reviewShortfall > 0 && promiseQuote) {
      // The review already says how short the balance is and the draft is
      // autosaved, so the top-up opens without an error notice.
      setPaywallVariant('insufficient');
      setQuotaLimit(undefined);
      setPaywallVisible(true);
      return;
    }
    void submit();
  };

  const refreshPro = React.useCallback(async () => {
    await RevenueCatAPI.refreshCustomerInfo();
    if (user?.id) await fetchBalance(user.id);
  }, [fetchBalance, user?.id]);

  const submit = async () => {
    if (submittingRef.current) return;
    if (isCreationOutcomeUnknown) return;

    if (!user?.id) {
      const recovery = getPromiseCreationRecovery(
        {
          message: t('todayProof.create.session_expired'),
        },
        locale
      );
      setCreationRecovery(recovery);
      setCreationError(recovery);
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setCreationError({
        title: t('todayProof.create.name_promise'),
        message: t('todayProof.create.short_name'),
      });
      setCurrentStep(0);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setCreationError(null);
    setCreationRecovery(null);
    try {
      let quote = promiseQuote;
      try {
        quote = await getCreatePromiseQuote(user.id);
        setPromiseQuote(quote);
      } catch {
        if (!quote) {
          setCreationError({
            title: t('todayProof.create.cost_unconfirmed'),
            message: t('todayProof.create.cost_unconfirmed_detail'),
          });
          return;
        }
      }

      const gate = resolveCreatePromiseGate(quote);
      if (!gate.allowed) {
        const quotaCopy = describeCreatePromiseQuota(gate.reason, t);
        setPaywallVariant('quota');
        setQuotaLimit(gate.limit);
        setCreationError(quotaCopy);
        setPaywallVisible(true);
        return;
      }

      await fetchBalance(user.id);
      const currentBalance = useMomentaStore.getState().balance;
      const cost = quote.cost;
      if (cost > currentBalance) {
        setPaywallVariant('insufficient');
        setQuotaLimit(undefined);
        setCreationError({
          title: t('todayProof.create.more_momenta'),
          message: `This promise costs ${cost.toLocaleString()} Momenta and your balance is ${currentBalance.toLocaleString()}. Your draft is still here.`,
        });
        setPaywallVisible(true);
        return;
      }

      // The review screen shows the cost and what is left, so starting the
      // promise is the confirmation.
      const startDate = new Date();
      const endDate = addDays(startDate, Math.max(1, duration - 1));

      const { challenge, receipt } = await createChallengeWithPayment({
        title: trimmedTitle,
        description:
          description.trim() || selectedTemplate?.description || trimmedTitle,
        category: selectedTemplate?.category ?? 'personal',
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        creatorId: user.id,
        verificationType: proofType,
        verificationFrequency: 'daily',
        isPublic: false,
        duration,
        difficulty,
        pointsValue: selectedDifficulty.points,
        verificationDescription: proofDescription.trim(),
        submissionText: submissionText.trim(),
        allowExtensions: selectedDifficulty.maxExtensions > 0,
        maxExtensions: selectedDifficulty.maxExtensions,
        deadlineType: 'fixed',
        allowSelfReview: mode === 'solo',
        groupId: groupId ?? undefined,
        cost,
        checkInWeekdays,
      });

      if (groupId) {
        const queryKey = groupQueryKeys.challenges(user.id, groupId);
        queryClient.setQueryData(queryKey, (current: unknown) => {
          const existing = Array.isArray(current) ? current : [];
          return [
            {
              id: challenge.id,
              title: challenge.title,
              description: challenge.description,
              category: challenge.category,
              verification_type: challenge.verificationType,
              start_date: challenge.startDate,
              end_date: challenge.endDate,
              is_public: challenge.isPublic,
              allow_self_review: challenge.allowSelfReview,
              creator_id: challenge.creatorId,
              added_to_group_at: challenge.createdAt,
            },
            ...existing.filter(item => item?.id !== challenge.id),
          ];
        });
        void queryClient.invalidateQueries({ queryKey });
      }

      // The RPC returned a challenge id, which is the authoritative receipt
      // required before this device removes the user-owned local draft.
      creationReceiptRef.current = true;
      const confirmedChallengeId = challenge.id.trim();
      setCreatedChallenge(challenge);
      setCreationReceipt(receipt);
      if (confirmedChallengeId) {
        void emitConfirmedOutcome(
          'promise-created',
          createConfirmedReceipt('promise-creation', confirmedChallengeId)
        );
      }
      trackProductEvent('Promise Created', {
        creation_source: isOnboardingHandoff ? 'onboarding' : mode,
        duration_bucket: getPromiseDurationBucket(duration),
        is_first_promise: Boolean(receipt?.isFirstPromise),
        proof_type: isProofType(challenge.verificationType)
          ? challenge.verificationType
          : 'photo',
      });
      trackMetaAdsCreatePromise();
      try {
        await clearPromiseCreationDraft(user.id);
      } catch (draftError) {
        console.warn(
          '[PromiseCreationDraft] Could not clear confirmed draft:',
          draftError
        );
      }
      if (isOnboardingHandoff) {
        try {
          await clearOnboardingDraft(user.id);
        } catch (onboardingDraftError) {
          console.warn(
            '[OnboardingDraft] Could not clear confirmed handoff:',
            onboardingDraftError
          );
        }
      }
    } catch (error) {
      if (isLegalAcceptanceRequiredError(error)) {
        const draft = buildCurrentPromiseDraft();
        if (draft) {
          try {
            await savePromiseCreationDraft(draft);
          } catch (draftError) {
            console.warn(
              '[PromiseCreationDraft] Could not save legal handoff draft:',
              draftError
            );
          }
        }

        const returnParams = new URLSearchParams({ mode });
        if (groupId) returnParams.set('groupId', groupId);
        router.push({
          pathname: '/legal-acceptance',
          params: {
            next: `/create-challenge?${returnParams.toString()}`,
            surface: 'pre_authoring',
          },
        } as never);
        return;
      }

      const recovery = getPromiseCreationRecovery(error, locale);
      setCreationRecovery(recovery);
      setCreationError(recovery);
      if (
        recovery.kind === 'quota-active' ||
        recovery.kind === 'quota-monthly'
      ) {
        setPaywallVariant('quota');
        setQuotaLimit(recovery.kind === 'quota-active' ? 2 : 4);
        setPaywallVisible(true);
      }
      if (recovery.kind === 'unknown-result') {
        const unknownResultAt = new Date().toISOString();
        setUnknownCreateResultAt(unknownResultAt);
        setTodayReadbackRequestedAt(null);
        const draft = buildCurrentPromiseDraft({
          unknownCreateResultAt: unknownResultAt,
          todayReadbackRequestedAt: null,
        });
        if (draft) {
          void savePromiseCreationDraft(draft).catch(draftError => {
            console.warn(
              '[PromiseCreationDraft] Could not preserve unknown result:',
              draftError
            );
          });
        }
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCreationRecoveryAction = () => {
    if (!creationRecovery) return;

    if (creationRecovery.kind === 'session-expired') {
      router.push({
        pathname: '/auth-required',
        params: { next: '/create-challenge' },
      });
      return;
    }

    if (creationRecovery.kind === 'unknown-result') {
      const requestedAt = new Date().toISOString();
      setTodayReadbackRequestedAt(requestedAt);
      const draft = buildCurrentPromiseDraft({
        todayReadbackRequestedAt: requestedAt,
      });
      if (draft) {
        void savePromiseCreationDraft(draft).catch(draftError => {
          console.warn(
            '[PromiseCreationDraft] Could not save Today handoff:',
            draftError
          );
        });
      }
      router.push('/(tabs)' as never);
    }
  };

  const handleStartFreshPromise = () => {
    if (!todayReadbackRequestedAt) return;

    setCreationError(null);
    setCreationRecovery(null);
    setUnknownCreateResultAt(null);
    setTodayReadbackRequestedAt(null);
    const draft = buildCurrentPromiseDraft({
      unknownCreateResultAt: null,
      todayReadbackRequestedAt: null,
    });
    if (draft) {
      void savePromiseCreationDraft(draft).catch(draftError => {
        console.warn(
          '[PromiseCreationDraft] Could not save fresh-start choice:',
          draftError
        );
      });
    }
  };

  const clearCreationIssue = () => {
    if (isCreationOutcomeUnknown) return;
    if (creationError) setCreationError(null);
    if (creationRecovery) setCreationRecovery(null);
  };

  const canSaveGateDraftAndExit =
    Boolean(creationError) &&
    !paywallVisible &&
    (paywallVariant === 'insufficient' || paywallVariant === 'quota') &&
    !isCreationOutcomeUnknown;

  const handleSaveDraftAndExit = React.useCallback(async () => {
    if (isSavingDraftExit) return;
    const draft = buildCurrentPromiseDraft();
    if (!draft) {
      setCreationError({
        title: t('todayProof.create.draft_not_saved'),
        message: t('todayProof.create.sign_in_again'),
      });
      return;
    }

    setIsSavingDraftExit(true);
    try {
      await savePromiseCreationDraft(draft);
      if (mode === 'group' && groupId) {
        router.replace({
          pathname: '/groups/[id]',
          params: { id: groupId },
        } as never);
      } else {
        router.replace('/(tabs)' as never);
      }
    } catch (error) {
      console.warn('[PromiseCreationDraft] Could not save before exit:', error);
      setCreationError({
        title: t('todayProof.create.draft_not_saved'),
        message: t('todayProof.create.draft_not_saved_detail'),
      });
    } finally {
      setIsSavingDraftExit(false);
    }
  }, [buildCurrentPromiseDraft, groupId, isSavingDraftExit, mode, router, t]);

  const promiseSummaryParts = [
    proofKindLabel(isProofType(proofType) ? proofType : 'photo', t),
    scheduleLabel,
    t('todayProof.createFlow.days', { count: duration }),
  ];

  const renderStep = () => {
    if (activeStepId === 'name') {
      return (
        <PromiseTitleStep
          value={title}
          maxLength={PROMISE_TITLE_MAX_LENGTH}
          suggestions={commitmentTemplates
            .slice(0, 3)
            .map(template => ({ id: template.id, title: template.title }))}
          disabled={isCreationBusy}
          onChange={value => {
            setTitle(value);
            clearCreationIssue();
          }}
          onPickSuggestion={id => {
            const template = commitmentTemplates.find(item => item.id === id);
            if (template) applyTemplate(template);
            clearCreationIssue();
          }}
          onSubmit={goNext}
        />
      );
    }

    if (activeStepId === 'proof') {
      return (
        <PromiseProofStep
          promiseTitle={title.trim()}
          proofKind={isProofType(proofType) ? proofType : 'photo'}
          proofRule={proofDescription}
          shared={mode === 'group' || reviewer.kind === 'friend'}
          safetyNote={AUTHORING_SAFETY_DISCLOSURE}
          disabled={isCreationBusy}
          onChangeKind={kind => {
            setProofType(kind);
            clearCreationIssue();
          }}
          onChangeRule={value => {
            setProofDescription(value);
            clearCreationIssue();
          }}
        />
      );
    }

    if (activeStepId === 'who') {
      return (
        <PromiseReviewerStep
          groups={reviewerGroups}
          value={reviewer}
          disabled={isCreationBusy}
          onChange={value => {
            setReviewer(value);
            clearCreationIssue();
          }}
        />
      );
    }

    if (activeStepId === 'length') {
      return (
        <PromiseLengthStep
          promiseTitle={title.trim()}
          summary={`${proofKindLabel(
            isProofType(proofType) ? proofType : 'photo',
            t
          )} · ${checkerLabel}`}
          durations={durationOptions}
          duration={duration}
          plan={checkInPlan}
          disabled={isCreationBusy}
          onChangeDuration={setDuration}
          onChangePlan={setCheckInPlan}
        />
      );
    }

    return (
      <PromiseReviewStep
        short={reviewShortfall > 0}
        bubble={narratorMessage}
        promiseTitle={title.trim()}
        summary={promiseSummaryParts.join(' · ')}
        checker={checkerLabel}
        firstProof={describeFirstProofDay(checkInWeekdays, locale, t)}
      />
    );
  };

  if (mode === 'group' && !groupId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <GroupModeNoGroupState
          onSelectGroup={() => router.replace('/(tabs)/groups')}
          onCreateGroup={() =>
            router.replace({
              pathname: '/create-group',
              params: { source: 'promise_group_required' },
            })
          }
          onContinueWithoutGroup={() => {
            const draft = buildCurrentPromiseDraft();
            const openSolo = () =>
              router.replace(
                '/create-challenge?mode=solo&createSource=group_mode_fallback'
              );

            if (!draft) {
              openSolo();
              return;
            }

            void savePromiseCreationDraft(draft)
              .catch(draftError => {
                console.warn(
                  '[PromiseCreationDraft] Could not save group fallback draft:',
                  draftError
                );
              })
              .finally(openSolo);
          }}
          onBack={handleCloseCreateChallenge}
        />
      </>
    );
  }

  if (createdChallenge && postCreateView === 'notifications') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <NotificationEducationState
          enabled={reminderEducationEnabled}
          onChangeEnabled={setReminderEducationEnabled}
          onLearnPermissions={() =>
            router.push({
              pathname: '/notification-settings',
              params: {
                challengeId: createdChallenge.id,
                source: 'promise',
              },
            } as never)
          }
          onContinueToPermission={() =>
            router.push({
              pathname: '/notification-settings',
              params: {
                challengeId: createdChallenge.id,
                source: 'promise',
              },
            } as never)
          }
          onNotNow={() => setPostCreateView('receipt')}
          onBack={() => setPostCreateView('receipt')}
        />
      </>
    );
  }

  if (createdChallenge && postCreateView === 'referral' && mode === 'group') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ReferralBridgeState
          promiseTitle={createdChallenge.title}
          groupSummary={`${t('todayProof.createFlow.days', { count: duration })} · ${scheduleLabel}`}
          shareOutcome={referralShareOutcome}
          working={referralWorking}
          onShareInvite={() => {
            void handleShareCreatedChallenge();
          }}
          onCopyInviteLink={() => {
            void handleCopyCreatedChallengeInvite();
          }}
          onSkip={handleViewCreatedChallenge}
          onBack={() => setPostCreateView('receipt')}
        />
      </>
    );
  }

  const creationNotice = creationError ? (
    <View style={styles.creationError}>
      <CreationStateNotice
        title={creationError.title}
        description={creationError.message}
        tone={creationRecovery?.kind === 'unknown-result' ? 'warning' : 'error'}
        actionLabel={
          creationRecovery?.kind === 'session-expired'
            ? 'Sign in'
            : creationRecovery?.kind === 'unknown-result'
              ? 'Check Today'
              : canSaveGateDraftAndExit
                ? 'Save draft and exit'
                : undefined
        }
        onAction={
          creationRecovery?.kind === 'session-expired' ||
          creationRecovery?.kind === 'unknown-result'
            ? handleCreationRecoveryAction
            : canSaveGateDraftAndExit
              ? () => void handleSaveDraftAndExit()
              : undefined
        }
      />
    </View>
  ) : isCreationOutcomeUnknown && todayReadbackRequestedAt ? (
    <View style={styles.creationError}>
      <CreationStateNotice
        testID="create-promise-fresh-start-after-today"
        title={t('todayProof.create.check_today_before')}
        description={t('todayProof.create.missing_after_refresh')}
        tone="warning"
        actionLabel="Start a fresh promise"
        onAction={handleStartFreshPromise}
      />
    </View>
  ) : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View ref={screenRootRef} style={styles.screenRoot}>
        <AppScreen
          lane="working"
          hasTabBar={false}
          padding={false}
          // The iOS sheet already sits below the status bar, and the footer
          // owns the home indicator inset, so the shell adds neither.
          safeArea={false}
          scrollable={false}
          contentContainerStyle={styles.screen}
          testID="create-promise-screen"
        >
          <View
            style={[
              styles.keyboard,
              {
                paddingTop:
                  Platform.OS === 'ios' ? theme.spacing.sm : insets.top,
                paddingBottom: keyboardOverlap,
              },
            ]}
          >
            <PromiseFlowHeader
              first={currentStep === 0}
              progress={(currentStep + 1) / stepIds.length}
              disabled={isCreationBusy}
              onBack={goBack}
            />

            <ScrollView
              key={activeStepId}
              ref={bodyScrollRef}
              onLayout={focusedInputReveal.onLayout}
              onScroll={focusedInputReveal.onScroll}
              scrollEventThrottle={16}
              style={styles.bodyScroll}
              contentContainerStyle={[
                styles.body,
                isReviewStep && styles.bodyCentered,
                { paddingHorizontal: phoneLayout.screenInset },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
              }
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {isReviewStep ? null : (
                <PromiseFlowQuestion
                  state={narratorState}
                  message={narratorMessage}
                  testID="create-promise-narrator"
                />
              )}
              {creationNotice}
              {renderStep()}
            </ScrollView>

            <View
              style={[
                styles.footer,
                {
                  paddingBottom: Math.max(insets.bottom, theme.spacing.md),
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
            >
              <View ref={footerActionsRef} style={styles.footerActions}>
                {isReviewStep && promiseQuote ? (
                  <CostReceipt
                    cost={promiseQuote.cost}
                    balance={balance}
                    freeLabel={describeCreatePromiseCost(promiseQuote.cost)}
                  />
                ) : null}
                <AppButton
                  testID={`create-promise-primary-${activeStepId}`}
                  accessibilityLabel={
                    isCreationOutcomeUnknown
                      ? unknownCreationPrimaryLabel
                      : primaryCta
                  }
                  onPress={goNext}
                  disabled={
                    !isStepValid || isCreationBusy || isCreationOutcomeUnknown
                  }
                  loading={isCreationBusy}
                  preserveLabelPositionOnLoading
                  style={styles.primaryButton}
                  title={
                    isCreationBusy
                      ? isDraftRestoring
                        ? t('todayProof.create.restoring')
                        : t('todayProof.residual.creating_promise')
                      : isCreationOutcomeUnknown
                        ? unknownCreationPrimaryLabel
                        : primaryCta
                  }
                />
                {isReviewStep ? (
                  <AppButton
                    testID="create-promise-edit"
                    variant="text"
                    disabled={isCreationBusy}
                    textStyle={styles.editLabel}
                    onPress={() => setCurrentStep(0)}
                    title={
                      reviewShortfall > 0
                        ? t('todayProof.createFlow.editPromise')
                        : t('todayProof.createFlow.edit')
                    }
                  />
                ) : null}
              </View>
            </View>
          </View>
        </AppScreen>
      </View>

      <CreationReceiptSheet
        visible={Boolean(createdChallenge)}
        mode={mode}
        title={createdChallengeTitle}
        proofType={createdProofType}
        duration={duration}
        difficultyLabel={scheduleLabel}
        firstProofDue={describeFirstProofDay(checkInWeekdays, locale, t)}
        receipt={creationReceipt}
        onPostFirstProof={handlePostFirstProof}
        onOpenGroup={handleOpenCreatedGroup}
        onViewPromise={handleViewCreatedChallenge}
        onBackToToday={handleBackToToday}
        onSetReminder={handleOpenReminderEducation}
        onInvitePerson={
          mode === 'group'
            ? handleOpenReferralBridge
            : reviewer.kind === 'friend'
              ? handleInviteFriend
              : undefined
        }
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onBuyPro={refreshPro}
        onBuyCredits={() => {
          if (user?.id) void fetchBalance(user.id);
        }}
        context="challenge"
        variant={paywallVariant}
        quotaLimit={quotaLimit}
        quotaContext="challenge"
        shortfall={Math.max((promiseQuote?.cost ?? 0) - balance, 0)}
        balance={balance}
        requiredAmount={promiseQuote?.cost}
        onWatchAd={watchRewardedAd}
        adRewardAmount={adRewardAmount}
        onCheckProof={() => router.push('/review-queue' as never)}
      />
    </>
  );
}

/** Costs, then what is left: the same receipt row the first-promise gift uses. */
const CostReceipt: React.FC<{
  cost: number;
  balance: number;
  freeLabel: string;
}> = ({ cost, balance, freeLabel }) => {
  const { t } = useTranslation();
  const short = cost > balance;
  return (
    <View style={costReceiptStyles.row} testID="create-promise-cost-receipt">
      <View style={costReceiptStyles.side}>
        <Text style={costReceiptStyles.label}>{t('commerce.topUp.costs')}</Text>
        <Text style={costReceiptStyles.value}>
          {cost === 0
            ? freeLabel
            : t('commerce.topUp.amount', { amount: cost.toLocaleString() })}
        </Text>
      </View>
      {cost > 0 ? (
        <View style={[costReceiptStyles.side, costReceiptStyles.end]}>
          <Text style={costReceiptStyles.label}>
            {short
              ? t('commerce.topUp.youHaveLabel')
              : t('commerce.topUp.leftAfter')}
          </Text>
          <Text style={costReceiptStyles.value}>
            {short
              ? t('commerce.topUp.amount', {
                  amount: balance.toLocaleString(),
                })
              : t('commerce.topUp.leftOf', {
                  left: (balance - cost).toLocaleString(),
                  balance: balance.toLocaleString(),
                })}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const costReceiptStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
    paddingVertical: mentaSpacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  side: { gap: mentaSpacing[1], flexShrink: 1 },
  end: { alignItems: 'flex-end' },
  label: {
    ...mentaTypography.label,
    color: mentaColors.text.muted,
  },
  value: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
});

const CreationStateNotice: React.FC<{
  testID?: string;
  title: string;
  description: string;
  tone: 'info' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}> = ({ testID, title, description, tone, actionLabel, onAction }) => {
  const styles = useThemedStyles(createStyles);

  if (tone === 'info') {
    return (
      <View
        accessible
        accessibilityLabel={`${title}. ${description}`}
        accessibilityRole="summary"
        style={styles.creationStateReadback}
        testID={testID}
      >
        <Text style={styles.creationStateTitle}>{title}</Text>
        <Text style={styles.creationStateBody}>{description}</Text>
      </View>
    );
  }

  const accent = tone === 'error' ? mentaColors.danger : mentaColors.warning;

  return (
    <View
      testID={testID}
      style={[styles.creationStateNotice, { borderColor: `${accent}8F` }]}
    >
      <View
        style={[styles.creationStateIcon, { backgroundColor: `${accent}1F` }]}
      >
        <ShieldIcon size={17} color={accent} />
      </View>
      <View style={styles.creationStateCopy}>
        <Text style={styles.creationStateTitle}>{title}</Text>
        <Text style={styles.creationStateBody}>{description}</Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            style={({ pressed }) => [
              styles.creationStateAction,
              { borderColor: accent },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.creationStateActionText, { color: accent }]}>
              {actionLabel}
            </Text>
            <ArrowRightIcon size={15} color={accent} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const CreationReceiptSheet: React.FC<{
  visible: boolean;
  mode: 'solo' | 'group';
  title: string;
  proofType: Exclude<ChallengeVerificationType, 'none'>;
  duration: number;
  difficultyLabel: string;
  /** The same first required day the review step showed. */
  firstProofDue: string;
  receipt: PromiseCreationReceipt | null;
  onPostFirstProof: () => void;
  onOpenGroup: () => void;
  onViewPromise: () => void;
  onBackToToday: () => void;
  onSetReminder: () => void;
  onInvitePerson?: () => void;
}> = ({
  visible,
  mode,
  title,
  proofType,
  duration,
  difficultyLabel,
  firstProofDue,
  receipt,
  onPostFirstProof,
  onOpenGroup,
  onViewPromise,
  onBackToToday,
  onSetReminder,
  onInvitePerson,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isGroup = mode === 'group';
  const isFirstPromiseReceipt = !isGroup && receipt?.isFirstPromise === true;
  const receiptTitle = isGroup ? 'Group promise saved' : 'Promise saved';
  const receiptBody = isGroup
    ? 'The proof and review rules are saved. Invite people when the group is ready.'
    : 'Post the first proof when you are ready to begin.';

  return (
    <ModalCard
      visible={visible}
      onClose={onViewPromise}
      dismissOnBackdrop={false}
      surface="sheet"
      animationType="slide"
      accessibilityLabel={t('todayProof.create.promise_created')}
      testID="create-challenge-receipt-sheet"
      cardStyle={styles.receiptSheet}
    >
      <View
        style={[
          styles.receiptSheetInner,
          { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) },
        ]}
      >
        <View style={styles.sheetGrabber} />
        <View style={styles.sheetHeader}>
          <View style={styles.headerSpacer} />
          <View style={styles.receiptHeaderCopy}>
            <Text style={styles.sheetTitle}>{receiptTitle}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('todayProof.create.view_created')}
            onPress={onViewPromise}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <XIcon size={18} color={theme.colors.text.primary} />
          </Pressable>
        </View>

        {isFirstPromiseReceipt ? (
          <View
            style={styles.firstReceiptPaper}
            testID="create-challenge-first-promise-receipt"
          >
            <View style={styles.firstReceiptPaperHeader}>
              <CheckIcon size={20} color={mentaColors.success} />
              <Text style={styles.firstReceiptPaperLabel}>
                {t('todayProof.residual.saved_to_your_account')}
              </Text>
            </View>
            <Text style={styles.firstReceiptPaperTitle} numberOfLines={3}>
              {title}
            </Text>
            <View style={styles.firstReceiptPaperDivider} />
            <View style={styles.firstReceiptPaperFacts}>
              <ReceiptPaperFact
                label={t('todayProof.create.first_due')}
                value={firstProofDue}
              />
              <ReceiptPaperFact
                label={t('todayProof.proof.receipt')}
                value={`${getProofTypeLabel(proofType, t)} proof`}
              />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.receiptIntro}>{receiptBody}</Text>
            <View style={styles.receiptRows}>
              <ReceiptRow
                label={t('todayProof.proof.receipt')}
                value={`${getProofTypeLabel(proofType, t)} proof`}
              />
              <ReceiptRow
                label={t('todayProof.residual.schedule')}
                value={`${duration} days · ${difficultyLabel}`}
              />
              <ReceiptRow
                label={t('todayProof.create.first_due')}
                value={firstProofDue}
              />
              <ReceiptRow
                label={t('todayProof.review.review_action')}
                value={
                  isGroup ? 'Group members review' : 'Proof counts when sent'
                }
              />
              <ReceiptRow
                label={t('todayProof.residual.visibility')}
                value={isGroup ? 'Group members' : 'Only you'}
              />
            </View>
          </>
        )}

        <View style={styles.receiptActions}>
          <AppButton
            title={
              isFirstPromiseReceipt
                ? t('todayProof.create.open_promise')
                : isGroup
                  ? t('todayProof.create.open_group')
                  : t('todayProof.create.post_first_proof')
            }
            onPress={
              isFirstPromiseReceipt
                ? onViewPromise
                : isGroup
                  ? onOpenGroup
                  : onPostFirstProof
            }
            fullWidth
            size="large"
            rightIcon={
              <ArrowRightIcon size={17} color={theme.colors.text.inverse} />
            }
            iconPosition="right"
            testID={
              isFirstPromiseReceipt
                ? 'create-challenge-view-first-promise'
                : isGroup
                  ? 'create-challenge-open-group'
                  : 'create-challenge-post-proof'
            }
          />
          {isFirstPromiseReceipt ? (
            <AppButton
              title={t('todayProof.review.back_today')}
              onPress={onBackToToday}
              fullWidth
              variant="secondary"
            />
          ) : isGroup && onInvitePerson ? (
            <AppButton
              title={t('todayProof.create.invite_people')}
              onPress={onInvitePerson}
              fullWidth
              variant="secondary"
            />
          ) : (
            <AppButton
              title={t('todayProof.create.set_reminder')}
              onPress={onSetReminder}
              fullWidth
              variant="secondary"
            />
          )}
        </View>
      </View>
    </ModalCard>
  );
};

const ReceiptRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
};

const ReceiptPaperFact: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.firstReceiptPaperFact}>
      <Text style={styles.firstReceiptPaperFactLabel}>{label}</Text>
      <Text style={styles.firstReceiptPaperFactValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
};

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: mentaColors.canvas,
    },
    keyboard: {
      flex: 1,
    },
    screenRoot: {
      flex: 1,
    },
    header: {
      minHeight: 56,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
      backgroundColor: mentaColors.canvas,
    },
    iconButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      backgroundColor: mentaColors.surface,
    },
    headerCopy: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    headerTitle: {
      ...mentaTypography.control,
      color: theme.colors.text.primary,
    },
    headerSpacer: {
      width: 38,
      height: 38,
    },
    progressBlock: {
      gap: mentaSpacing[2],
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    progressLabel: {
      ...mentaTypography.captionMedium,
      color: mentaColors.text.secondary,
      fontVariant: ['tabular-nums'],
    },
    body: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xl,
    },
    bodyCentered: {
      justifyContent: 'center',
    },
    bodyScroll: {
      flex: 1,
    },
    copyBlock: {
      gap: theme.spacing.sm,
    },
    stepTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    stepSubtitle: {
      color: theme.colors.text.muted,
      ...mentaTypography.bodySmall,
    },
    stage: {
      flex: 1,
    },
    creationError: {
      marginTop: -theme.spacing.sm,
    },
    creationStateReadback: {
      gap: mentaSpacing[1],
      paddingVertical: theme.spacing.xs,
    },
    creationStateNotice: {
      alignItems: 'flex-start',
      backgroundColor: mentaColors.surface,
      borderRadius: mentaRadii.small,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    creationStateIcon: {
      alignItems: 'center',
      borderRadius: mentaRadii.small,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    creationStateCopy: {
      flex: 1,
      gap: mentaSpacing[1],
      minWidth: 0,
    },
    creationStateTitle: {
      color: mentaColors.text.primary,
      ...mentaTypography.body,
    },
    creationStateBody: {
      color: mentaColors.text.secondary,
      ...mentaTypography.caption,
    },
    creationStateAction: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: mentaRadii.small,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      minHeight: mentaLayout.minimumTouchTarget,
      paddingHorizontal: theme.spacing.sm,
    },
    creationStateActionText: {
      ...mentaTypography.captionMedium,
    },
    stepStack: {
      gap: theme.spacing.md,
    },
    promiseArtefactHelper: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.secondary,
      marginTop: -mentaSpacing[1],
      paddingHorizontal: mentaSpacing[1],
    },
    inlineRow: {
      minHeight: 58,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    inlineRowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    inlineRowTitle: {
      ...mentaTypography.bodySemibold,
      color: theme.colors.text.primary,
    },
    inlineRowMeta: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.tertiary,
    },
    noteText: {
      ...mentaTypography.bodySmall,
      flex: 1,
      color: theme.colors.text.secondary,
    },
    rowGroup: {
      gap: theme.spacing.sm,
    },
    trailingIcon: {
      width: 36,
      height: 36,
      borderRadius: mentaRadii.round,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      backgroundColor: mentaColors.surface,
    },
    choiceCopy: {
      flex: 1,
      minWidth: 0,
      gap: mentaSpacing[1],
      paddingRight: theme.spacing.xs,
    },
    choiceTitle: {
      ...mentaTypography.bodySemibold,
      color: theme.colors.text.primary,
    },
    choiceBody: {
      ...mentaTypography.caption,
      color: theme.colors.text.secondary,
    },
    fieldBlock: {
      gap: theme.spacing.sm,
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    fieldLabel: {
      ...mentaTypography.bodySmallMedium,
      color: theme.colors.text.secondary,
    },
    fieldCount: {
      ...mentaTypography.captionMedium,
      color: theme.colors.text.muted,
      fontVariant: ['tabular-nums'],
    },
    fieldHelper: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.secondary,
    },
    compactInput: {
      minHeight: 74,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.primary,
      borderRadius: mentaRadii.medium,
      padding: theme.spacing.md,
      color: theme.colors.text.primary,
      ...mentaTypography.body,
      backgroundColor: mentaColors.raised,
    },
    chipRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    durationChip: {
      flex: 1,
    },
    reviewList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    reviewLine: {
      minHeight: 76,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    reviewCopy: {
      flex: 1,
      gap: 3,
    },
    reviewLabel: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.tertiary,
    },
    reviewValue: {
      ...mentaTypography.bodyMedium,
      color: theme.colors.text.primary,
    },
    // Inline "Change" links read as actions, in violet, as in onboarding.
    changeText: {
      ...mentaTypography.bodySmallMedium,
      color: theme.colors.accent.primary,
    },
    reviewNote: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
    },
    footer: {
      paddingTop: theme.spacing.md,
      backgroundColor: mentaColors.canvas,
    },
    footerActions: {
      gap: theme.spacing.sm,
    },
    backButton: {
      minWidth: 104,
    },
    primaryButton: {
      alignSelf: 'stretch',
    },
    editLabel: {
      color: mentaColors.action,
    },
    disabled: {
      opacity: 0.38,
    },
    templateSheet: {
      padding: 0,
      overflow: 'hidden',
    },
    templateSheetInner: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      backgroundColor: mentaColors.surface,
      gap: theme.spacing.sm,
    },
    receiptSheet: {
      padding: 0,
      overflow: 'hidden',
    },
    receiptSheetInner: {
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      backgroundColor: mentaColors.surface,
    },
    receiptIntro: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
    },
    firstReceiptPaper: {
      backgroundColor: mentaColors.paper,
      borderRadius: mentaRadii.small,
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      transform: [{ rotate: '-0.3deg' }],
    },
    firstReceiptPaperHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    firstReceiptPaperLabel: {
      color: mentaColors.text.mutedOnPaper,
      ...mentaTypography.label,
    },
    firstReceiptPaperTitle: {
      color: mentaColors.text.onPaper,
      ...mentaTypography.title,
    },
    firstReceiptPaperDivider: {
      backgroundColor: mentaColors.borderPaper,
      height: StyleSheet.hairlineWidth,
    },
    firstReceiptPaperFacts: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    firstReceiptPaperFact: {
      flex: 1,
      gap: mentaSpacing[1],
      minWidth: 0,
    },
    firstReceiptPaperFactLabel: {
      color: mentaColors.text.mutedOnPaper,
      ...mentaTypography.label,
    },
    firstReceiptPaperFactValue: {
      color: mentaColors.text.onPaper,
      ...mentaTypography.caption,
    },
    receiptRows: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    receiptRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    receiptLabel: {
      ...mentaTypography.label,
      color: theme.colors.text.tertiary,
      textTransform: 'uppercase',
    },
    receiptValue: {
      ...mentaTypography.bodySmallMedium,
      flex: 1,
      color: theme.colors.text.primary,
      textAlign: 'right',
    },
    receiptActions: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
    sheetGrabber: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: mentaRadii.round,
      backgroundColor: mentaColors.border,
      marginBottom: theme.spacing.md,
    },
    sheetHeader: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    receiptHeaderCopy: {
      flex: 1,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    sheetTitle: {
      ...mentaHeadingRoles.section,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    sheetSubtitle: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    templateList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    templateScroll: {
      maxHeight: 420,
    },
    templateRow: {
      minHeight: 74,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    templateRowActive: {
      borderBottomColor: theme.colors.accent.primary,
    },
    templateIcon: {
      width: 34,
      height: 34,
      borderRadius: mentaRadii.small,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mentaColors.raised,
    },
    templateIconActive: {
      borderRadius: mentaRadii.small,
      backgroundColor: mentaColors.raised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.accent.primary,
    },
    templateActions: {
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.xs,
    },
    templateUnavailable: {
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      paddingVertical: theme.spacing.lg,
    },
    templateUnavailableIcon: {
      width: 34,
      height: 34,
      borderRadius: mentaRadii.small,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${mentaColors.warning}26`,
    },
    templateUnavailableTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0,
    },
    templateUnavailableBody: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 20,
      letterSpacing: 0,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.985 }],
    },
  });
