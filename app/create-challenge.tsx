import {
  mentaColors as defaultMentaColors,
  type MentaPalette,
  mentaHeadingRoles,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { AppSwitchRow } from '@/components/ui/AppFields';
import { MentaConsent } from '@/components/menta-check/menta-consent';
import { useMentaCheckOverview } from '@/hooks/use-menta-check';
import { buyMentaCheckPass, setPromiseReviewMode } from '@/lib/menta-check/api';
import { openPaywall } from '@/lib/paywall/manager';
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
import { useFocusEffect } from 'expo-router/react-navigation';
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
import {
  loadCreateReminderPreference,
  persistCreateReminderPreference,
} from '@/lib/commitments/create-reminder-preference';
import { notificationService } from '@/lib/services/notification-service';
import { showGlobalToast } from '@/lib/toast-provider';
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
  withPromiseCreationRequest,
  retainPromiseCreationReceipt,
  subscribePromiseCreationReceipts,
  getPromiseCreationReceiptRecovery,
  cancelPromiseCreationAttempt,
  saveFreshPromiseCreationDraft,
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
  const mentaOverview = useMentaCheckOverview();
  const [mentaConsentVisible, setMentaConsentVisible] = React.useState(false);
  const [mentaSetupFailed, setMentaSetupFailed] = React.useState(false);
  const [mentaBackup, setMentaBackup] = React.useState(false);
  const [mentaMomenta, setMentaMomenta] = React.useState(false);
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
    kind?: PromiseCreationRecovery['kind'] | 'receipt-read';
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
  const [pendingFriendChallengeId, setPendingFriendChallengeId] =
    React.useState<string | null>(null);
  const pendingFriendRef = React.useRef<string | null>(null);
  const setupOpeningRef = React.useRef(false);
  const creationScopeRef = React.useRef({
    active: false,
    version: 0,
    owner: user?.id,
    context: '',
    freeChosen: false,
  });
  const creationContext = `${user?.id ?? ''}:${routeMode}:${routeGroupId ?? ''}`;
  const currentCreationContext = React.useRef(creationContext);
  currentCreationContext.current = creationContext;
  useFocusEffect(
    React.useCallback(() => {
      const scope = creationScopeRef.current;
      scope.active = true;
      scope.version += 1;
      scope.owner = user?.id;
      scope.context = creationContext;
      scope.freeChosen = false;
      setupOpeningRef.current = false;
      return () => {
        scope.active = false;
        scope.version += 1;
        setupOpeningRef.current = false;
      };
    }, [creationContext, user?.id])
  );
  const submittingRef = React.useRef(false);
  const submissionOperationRef = React.useRef<number | null>(null);
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
  const mentaPassCost =
    reviewer.kind === 'menta' && mentaMomenta && !mentaOverview.data?.isPro
      ? (mentaOverview.data?.passCost ?? 20)
      : 0;
  const reviewAmount = (promiseQuote?.cost ?? 0) + mentaPassCost;
  const reviewShortfall =
    isReviewStep && promiseQuote && reviewAmount > balance
      ? reviewAmount - balance
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
    reviewer.kind === 'menta'
      ? t('mentaCheck.receipt.checkedBy')
      : reviewer.kind === 'group'
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
          | 'unknownCreateResultAt'
          | 'todayReadbackRequestedAt'
          | 'pendingFriendChallengeId'
        >
      > = {}
    ): PromiseCreationDraftInput | null => {
      if (!user?.id) return null;

      return {
        ownerUserId: user.id,
        reviewer,
        checkInPlan,
        templateId,
        mentaBackup,
        mentaMomenta,
        groupId,
        stepId: activeStepId,
        pendingFriendChallengeId:
          overrides.pendingFriendChallengeId === undefined
            ? pendingFriendRef.current
            : overrides.pendingFriendChallengeId,
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
      reviewer,
      checkInPlan,
      templateId,
      mentaBackup,
      mentaMomenta,
      groupId,
      activeStepId,
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

  const restorePromiseDraft = React.useCallback(
    (draft: PromiseCreationDraftInput) => {
      if (draft.ownerUserId !== user?.id) return;
      if (routeGroupId && (draft.groupId ?? null) !== routeGroupId) {
        // Ordinary drafts do not cross into a different audience. A durable
        // receipt or uncertain result must be resumed in its original scope.
        if (draft.pendingFriendChallengeId || draft.unknownCreateResultAt) {
          router.replace({
            pathname: '/create-challenge',
            params: draft.groupId
              ? { mode: 'group', groupId: draft.groupId }
              : { mode: 'solo' },
          });
        }
        return;
      }
      if (draft.pendingFriendChallengeId) {
        setCreationRecovery(null);
        const recovery = getPromiseCreationReceiptRecovery(draft.ownerUserId);
        setCreationError(
          recovery?.persistence === 'failed'
            ? {
                title: t('commerce.free.receiptRetry'),
                message: t('commerce.free.receiptRetryDetail'),
              }
            : null
        );
      }
      const restoredStep = draft.pendingFriendChallengeId
        ? 'review'
        : draft.stepId;
      setCurrentStep(
        restoredStep
          ? (showsReviewerStep
              ? ['name', 'proof', 'who', 'length', 'review']
              : ['name', 'proof', 'length', 'review']
            ).indexOf(restoredStep)
          : draft.currentStep
      );
      setReviewer(
        draft.groupId
          ? {
              kind: 'group',
              groupId: draft.groupId,
              name:
                draft.reviewer?.kind === 'group' &&
                draft.reviewer.groupId === draft.groupId
                  ? draft.reviewer.name
                  : t('todayProof.createFlow.yourGroups'),
            }
          : (draft.reviewer ?? { kind: 'self' })
      );
      setCheckInPlan(draft.checkInPlan ?? { kind: 'every' });
      setTemplateId(draft.templateId);
      setMentaBackup(draft.mentaBackup ?? false);
      setMentaMomenta(draft.mentaMomenta ?? false);
      pendingFriendRef.current = draft.pendingFriendChallengeId ?? null;
      setPendingFriendChallengeId(pendingFriendRef.current);
      creationReceiptRef.current = Boolean(pendingFriendRef.current);
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
    },
    [locale, routeGroupId, router, showsReviewerStep, t, user?.id]
  );

  useFocusEffect(
    React.useCallback(() => {
      const owner = user?.id;
      if (!owner) return;
      const scope = creationScopeRef.current;
      const version = scope.version;
      const unsubscribe = subscribePromiseCreationReceipts(owner, recovery => {
        if (
          scope.active &&
          scope.version === version &&
          scope.owner === owner &&
          currentCreationContext.current === creationContext
        )
          restorePromiseDraft(recovery.draft);
      });
      // Reading a durable receipt publishes it to the current owned observer.
      void loadPromiseCreationDraft(owner).catch(() => undefined);
      return unsubscribe;
    }, [creationContext, restorePromiseDraft, user?.id])
  );

  React.useEffect(() => {
    let cancelled = false;
    const userId = user?.id;

    const resetToRouteDefaults = () => {
      submittingRef.current = false;
      submissionOperationRef.current = null;
      setIsSubmitting(false);
      setIsSavingDraftExit(false);
      setCurrentStep(0);
      setReviewer({ kind: 'self' });
      setCheckInPlan({ kind: 'every' });
      setMentaBackup(false);
      setMentaMomenta(false);
      pendingFriendRef.current = null;
      setPendingFriendChallengeId(null);
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

    setIsDraftRestoring(true);
    void loadPromiseCreationDraft(userId)
      .then(draft => {
        if (cancelled || !draft) {
          return;
        }

        // Route defaults may replace an unfinished draft, never a receipt.
        if (
          hasExplicitRouteDefaults &&
          !draft.pendingFriendChallengeId &&
          !draft.unknownCreateResultAt
        )
          return;
        restorePromiseDraft(draft);
      })
      .catch(() => {
        if (!cancelled)
          setCreationError({
            kind: 'receipt-read',
            title: t('commerce.free.receiptReadBlocked'),
            message: t('commerce.free.receiptReadBlockedDetail'),
          });
      })
      .finally(() => {
        if (!cancelled) setIsDraftRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasExplicitRouteDefaults,
    restorePromiseDraft,
    showsReviewerStep,
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

  const continueFriendSetup = async (
    exit = false,
    restoredDraft?: PromiseCreationDraftInput
  ) => {
    if (restoredDraft && restoredDraft.ownerUserId !== user?.id) return;
    const id =
      restoredDraft?.pendingFriendChallengeId ?? pendingFriendRef.current;
    const scope = creationScopeRef.current;
    if (!id || !scope.active || setupOpeningRef.current) return;
    const version = scope.version;
    setupOpeningRef.current = true;
    let navigated = false;
    try {
      const draft =
        restoredDraft ??
        buildCurrentPromiseDraft({ pendingFriendChallengeId: id });
      if (!draft) return;
      await savePromiseCreationDraft({
        ...draft,
        stepId: 'review',
        reviewer: { kind: 'friend' },
        mentaBackup: false,
        mentaMomenta: false,
      });
      if (
        !scope.active ||
        scope.version !== version ||
        currentCreationContext.current !== scope.context
      )
        return;
      if (exit) backOrReplace(router, '/(tabs)');
      else
        router.push({
          pathname: '/promise-accountability',
          params: { challengeId: id, source: 'promise', requiredReviewer: '1' },
        });
      navigated = true;
    } catch {
      if (scope.active && scope.version === version)
        setCreationError({
          title: t('commerce.free.receiptRetry'),
          message: t('commerce.free.receiptRetryDetail'),
        });
    } finally {
      if (scope.version === version && !navigated)
        setupOpeningRef.current = false;
    }
  };

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

  const reminderPreferenceRevision = React.useRef(0);
  const reminderPreferenceWrites = React.useRef<Promise<void>>(
    Promise.resolve()
  );

  const readCreateReminderPreference = React.useCallback(
    async (userId: string) => {
      const prefs = await notificationService.getUserPreferences(userId);
      return prefs?.challenge_reminders;
    },
    []
  );

  const writeCreateReminderPreference = React.useCallback(
    async (userId: string, enabled: boolean) => {
      await notificationService.updateUserPreferences(userId, {
        challenge_reminders: enabled,
      });
    },
    []
  );

  React.useEffect(() => {
    if (postCreateView !== 'notifications') return;

    let cancelled = false;
    const revision = reminderPreferenceRevision.current;
    void loadCreateReminderPreference(user?.id, readCreateReminderPreference)
      .then(enabled => {
        if (!cancelled && revision === reminderPreferenceRevision.current)
          setReminderEducationEnabled(enabled);
      })
      .catch(() => {
        if (!cancelled && revision === reminderPreferenceRevision.current)
          setReminderEducationEnabled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [postCreateView, readCreateReminderPreference, user?.id]);

  const handleReminderEducationChange = React.useCallback(
    (enabled: boolean) => {
      const owner = user?.id;
      const scope = creationScopeRef.current;
      const version = scope.version;
      const previous = reminderEducationEnabled;
      const revision = ++reminderPreferenceRevision.current;
      const isCurrent = () =>
        Boolean(
          owner &&
          scope.active &&
          scope.version === version &&
          scope.owner === owner &&
          useAuthStore.getState().user?.id === owner
        );
      if (!isCurrent()) return;
      setReminderEducationEnabled(enabled);
      const write = reminderPreferenceWrites.current.then(async () => {
        if (!isCurrent()) return;
        await persistCreateReminderPreference(
          owner,
          enabled,
          writeCreateReminderPreference
        );
      });
      reminderPreferenceWrites.current = write.catch(() => {
        if (isCurrent() && reminderPreferenceRevision.current === revision) {
          setReminderEducationEnabled(previous);
          showGlobalToast(t('domain.network.error'), 'error');
        }
      });
    },
    [reminderEducationEnabled, t, user?.id, writeCreateReminderPreference]
  );

  const handleOpenReminderEducation = React.useCallback(() => {
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
    if (pendingFriendRef.current) {
      void continueFriendSetup(true);
      return;
    }
    if (isCreationBusy || submittingRef.current) return;
    if (currentStep === 0) {
      handleCloseCreateChallenge();
      return;
    }
    setCurrentStep(step => Math.max(0, step - 1));
  };

  const retryReceiptRead = async () => {
    const scope = creationScopeRef.current;
    const owner = user?.id;
    const version = scope.version;
    const context = currentCreationContext.current;
    if (!owner || !scope.active || setupOpeningRef.current) return;
    const current = () =>
      creationScopeRef.current.active &&
      creationScopeRef.current.version === version &&
      creationScopeRef.current.owner === owner &&
      currentCreationContext.current === context;
    setupOpeningRef.current = true;
    setIsDraftRestoring(true);
    try {
      const saved = await loadPromiseCreationDraft(owner);
      if (!current()) return;
      if (saved?.pendingFriendChallengeId || saved?.unknownCreateResultAt)
        restorePromiseDraft(saved);
      else setCreationError(null);
    } catch {
      if (current())
        setCreationError({
          kind: 'receipt-read',
          title: t('commerce.free.receiptReadBlocked'),
          message: t('commerce.free.receiptReadBlockedDetail'),
        });
    } finally {
      if (current()) {
        setupOpeningRef.current = false;
        setIsDraftRestoring(false);
      }
    }
  };

  const goNext = () => {
    if (creationError?.kind === 'receipt-read') {
      void retryReceiptRead();
      return;
    }
    if (pendingFriendRef.current) {
      void continueFriendSetup();
      return;
    }
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

  const purchaseRefreshOwner = React.useRef(user?.id);
  React.useEffect(() => {
    purchaseRefreshOwner.current = user?.id;
    return () => {
      purchaseRefreshOwner.current = undefined;
    };
  }, [user?.id]);

  const refreshPro = React.useCallback(async () => {
    try {
      const ownerId = user?.id;
      const scopeVersion = creationScopeRef.current.version;
      if (!ownerId || !creationScopeRef.current.active) return;
      await fetchBalance(ownerId, { throwOnError: true });
      const quote = await getCreatePromiseQuote(ownerId);
      if (
        purchaseRefreshOwner.current !== ownerId ||
        !creationScopeRef.current.active ||
        creationScopeRef.current.version !== scopeVersion
      )
        return;
      setPromiseQuote(quote);
      // This callback follows the paywall's confirmed purchase receipt. Refresh
      // the server quote before removing the obsolete gate notice, and never
      // discard an unresolved creation receipt or submit the draft automatically.
      if (
        !unknownCreateResultAt &&
        !creationRecovery &&
        (paywallVariant === 'quota' || paywallVariant === 'insufficient') &&
        resolveCreatePromiseGate(quote).allowed &&
        quote.cost + mentaPassCost <= useMomentaStore.getState().balance
      ) {
        setCreationError(current =>
          current === creationError ? null : current
        );
      }
    } catch {
      // Keep the draft and existing retry guidance if readback fails. The
      // paywall does not await this callback; never leak a rejected promise.
    }
  }, [
    creationError,
    creationRecovery,
    fetchBalance,
    getCreatePromiseQuote,
    mentaPassCost,
    paywallVariant,
    unknownCreateResultAt,
    user?.id,
  ]);

  const submit = async () => {
    if (submittingRef.current || pendingFriendRef.current) return;
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

    const operationScope = creationScopeRef.current;
    const operationVersion = operationScope.version;
    const operationOwner = user.id;
    const operationContext = creationContext;
    const operationCurrent = () =>
      operationScope.active &&
      operationScope.version === operationVersion &&
      operationScope.owner === operationOwner &&
      operationScope.context === operationContext &&
      currentCreationContext.current === operationContext;
    if (!operationCurrent()) return;
    submittingRef.current = true;
    submissionOperationRef.current = operationVersion;
    setIsSubmitting(true);
    setCreationError(null);
    setCreationRecovery(null);
    let attemptedDraft: PromiseCreationDraftInput | null = null;
    try {
      await withPromiseCreationRequest(operationOwner, async () => {
        // This is a fresh account-owned read, not a continuation from the old
        // screen generation. It also waits for a remounted route's earlier RPC.
        let savedDraft: Awaited<ReturnType<typeof loadPromiseCreationDraft>>;
        try {
          savedDraft = await loadPromiseCreationDraft(operationOwner);
        } catch {
          if (operationCurrent())
            setCreationError({
              kind: 'receipt-read',
              title: t('commerce.free.receiptReadBlocked'),
              message: t('commerce.free.receiptReadBlockedDetail'),
            });
          return;
        }
        if (!operationCurrent()) return;
        if (
          savedDraft?.pendingFriendChallengeId ||
          savedDraft?.unknownCreateResultAt
        ) {
          restorePromiseDraft(savedDraft);
          if (savedDraft.pendingFriendChallengeId)
            await continueFriendSetup(false, savedDraft);
          return;
        }
        let quote = promiseQuote;
        try {
          quote = await getCreatePromiseQuote(operationOwner);
          if (!operationCurrent()) return;
          setPromiseQuote(quote);
        } catch {
          if (!operationCurrent()) return;
          if (!quote) {
            setCreationError({
              title: t('todayProof.create.cost_unconfirmed'),
              message: t('todayProof.create.cost_unconfirmed_detail'),
            });
            return;
          }
        }

        if (!operationCurrent()) return;
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
        if (!operationCurrent()) return;
        const currentBalance = useMomentaStore.getState().balance;
        const cost = quote.cost;
        if (cost + mentaPassCost > currentBalance) {
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
        if (
          reviewer.kind === 'menta' ||
          (mentaBackup && (mode === 'group' || reviewer.kind === 'friend'))
        ) {
          const latest = await mentaOverview.refetch();
          if (!operationCurrent()) return;
          if (!latest.data?.consented) {
            setMentaConsentVisible(true);
            return;
          }
          if (
            reviewer.kind === 'menta' &&
            !latest.data.isPro &&
            !mentaMomenta
          ) {
            const scope = creationScopeRef.current;
            const version = scope.version;
            const draft = buildCurrentPromiseDraft();
            scope.freeChosen = false;
            const stillCurrent = () =>
              scope.active &&
              scope.version === version &&
              currentCreationContext.current === scope.context &&
              scope.owner === user.id &&
              !pendingFriendRef.current;
            openPaywall({
              context: 'menta_check',
              onContinueFree: () => {
                if (!stillCurrent() || scope.freeChosen) return;
                scope.freeChosen = true;
                setReviewer({ kind: 'friend' });
                setMentaBackup(false);
                setMentaMomenta(false);
                setCreationError(null);
                setCreationRecovery(null);
                const whoStep = stepIds.indexOf('who');
                setCurrentStep(whoStep >= 0 ? whoStep : 0);
                if (draft)
                  void savePromiseCreationDraft({
                    ...draft,
                    reviewer: { kind: 'friend' },
                    mentaBackup: false,
                    mentaMomenta: false,
                    stepId: 'who',
                    currentStep: toPromiseDraftStep(whoStep),
                  }).catch(() => {
                    if (stillCurrent())
                      setCreationError({
                        title: t('todayProof.create.draft_not_saved'),
                        message: t('todayProof.create.draft_not_saved_detail'),
                      });
                  });
              },
              onProConfirmed: () => {
                if (stillCurrent() && !scope.freeChosen)
                  void mentaOverview.refetch();
              },
            });
            return;
          }
        }
        const endDate = addDays(startDate, Math.max(1, duration - 1));

        const confirmedDraft = buildCurrentPromiseDraft();
        if (!confirmedDraft) return;
        const attemptAt = new Date().toISOString();
        const attemptDraft = {
          ...confirmedDraft,
          unknownCreateResultAt: attemptAt,
          todayReadbackRequestedAt: null,
        };
        let durableAttempt: Awaited<
          ReturnType<typeof savePromiseCreationDraft>
        >;
        try {
          durableAttempt = await savePromiseCreationDraft(attemptDraft);
        } catch {
          if (operationCurrent())
            setCreationError({
              title: t('todayProof.create.draft_not_saved'),
              message: t('todayProof.create.draft_not_saved_detail'),
            });
          return;
        }
        if (!operationCurrent()) return;
        if (
          !durableAttempt ||
          durableAttempt.pendingFriendChallengeId ||
          durableAttempt.unknownCreateResultAt !== attemptAt
        ) {
          if (durableAttempt) restorePromiseDraft(durableAttempt);
          return;
        }
        attemptedDraft = attemptDraft;
        let creationResult: Awaited<
          ReturnType<typeof createChallengeWithPayment>
        >;
        try {
          creationResult = await createChallengeWithPayment({
            title: trimmedTitle,
            description:
              description.trim() ||
              selectedTemplate?.description ||
              trimmedTitle,
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
            allowSelfReview: mode === 'solo' && reviewer.kind !== 'friend',
            groupId: groupId ?? undefined,
            cost,
            checkInWeekdays,
          });
        } catch (error) {
          const recovery = getPromiseCreationRecovery(error, locale);
          if (
            isLegalAcceptanceRequiredError(error) ||
            ['session-expired', 'quota-active', 'quota-monthly'].includes(
              recovery.kind
            )
          ) {
            try {
              await cancelPromiseCreationAttempt(confirmedDraft, attemptAt);
              attemptedDraft = null;
            } catch {
              // Retain the durable block if this known rejection cannot be saved.
            }
          }
          throw error;
        }
        const { challenge, receipt } = creationResult;
        attemptedDraft = null;
        const confirmedChallengeId = challenge.id.trim();
        if (reviewer.kind === 'friend' && confirmedDraft) {
          const ownedReceipt = retainPromiseCreationReceipt({
            ...confirmedDraft,
            ownerUserId: operationOwner,
            reviewer: { kind: 'friend' },
            mentaBackup: false,
            mentaMomenta: false,
            stepId: 'review',
            pendingFriendChallengeId: confirmedChallengeId,
          });
          // A server receipt belongs to the account that sent the request, even
          // after it leaves. Shared screen refs belong only to the current scope.
          if (operationCurrent()) {
            creationReceiptRef.current = true;
            pendingFriendRef.current = confirmedChallengeId;
            setPendingFriendChallengeId(confirmedChallengeId);
          }
          try {
            await savePromiseCreationDraft(ownedReceipt);
          } catch {
            if (operationCurrent())
              setCreationError({
                title: t('commerce.free.receiptRetry'),
                message: t('commerce.free.receiptRetryDetail'),
              });
          }
        }
        if (!operationCurrent()) return;
        creationReceiptRef.current = true;

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

        if (
          reviewer.kind === 'menta' ||
          (mentaBackup && (mode === 'group' || reviewer.kind === 'friend'))
        ) {
          try {
            const result =
              reviewer.kind === 'menta' &&
              mentaMomenta &&
              !mentaOverview.data?.isPro
                ? await buyMentaCheckPass(challenge.id)
                : await setPromiseReviewMode(
                    challenge.id,
                    reviewer.kind === 'menta' ? 'menta' : 'people',
                    reviewer.kind === 'menta' ? null : 24
                  );
            if (!operationCurrent()) return;
            setMentaSetupFailed(!result.success);
            if (result.success) await fetchBalance(user.id);
          } catch {
            if (!operationCurrent()) return;
            setMentaSetupFailed(true);
          }
        }
        if (!operationCurrent()) return;
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
          if (reviewer.kind !== 'friend')
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
      });
    } catch (error) {
      if (!operationCurrent()) return;
      if (!attemptedDraft && isLegalAcceptanceRequiredError(error)) {
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

        if (!operationCurrent()) return;
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

      const recovery = getPromiseCreationRecovery(
        attemptedDraft
          ? new Error('Network request failed before a response arrived')
          : error,
        locale
      );
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
        const unknownResultAt =
          (attemptedDraft as PromiseCreationDraftInput | null)
            ?.unknownCreateResultAt ?? new Date().toISOString();
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
      if (submissionOperationRef.current === operationVersion) {
        submissionOperationRef.current = null;
        submittingRef.current = false;
        if (currentCreationContext.current === operationContext)
          setIsSubmitting(false);
      }
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

  const handleStartFreshPromise = async () => {
    if (!todayReadbackRequestedAt || isSavingDraftExit) return;
    const scope = creationScopeRef.current;
    const version = scope.version;
    const context = creationContext;
    if (!scope.active || currentCreationContext.current !== context) return;
    const draft = buildCurrentPromiseDraft({
      unknownCreateResultAt: null,
      todayReadbackRequestedAt: null,
    });
    if (!draft) return;
    setIsSavingDraftExit(true);
    try {
      await saveFreshPromiseCreationDraft(draft);
      if (
        !scope.active ||
        scope.version !== version ||
        currentCreationContext.current !== context
      )
        return;
      setCreationError(null);
      setCreationRecovery(null);
      setUnknownCreateResultAt(null);
      setTodayReadbackRequestedAt(null);
    } catch {
      if (
        scope.active &&
        scope.version === version &&
        currentCreationContext.current === context
      )
        setCreationError({
          title: t('todayProof.create.draft_not_saved'),
          message: t('todayProof.create.draft_not_saved_detail'),
        });
    } finally {
      if (
        scope.version === version &&
        currentCreationContext.current === context
      )
        setIsSavingDraftExit(false);
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
      <>
        <PromiseReviewStep
          short={reviewShortfall > 0}
          bubble={narratorMessage}
          promiseTitle={title.trim()}
          summary={promiseSummaryParts.join(' · ')}
          checker={checkerLabel}
          firstProof={describeFirstProofDay(checkInWeekdays, locale, t)}
        />
        {reviewer.kind === 'menta' && !mentaOverview.data?.isPro ? (
          <AppSwitchRow
            title={t('mentaCheck.keep.ctaPass')}
            subtitle={t('mentaCheck.option.passNote', {
              cost: mentaOverview.data?.passCost ?? 20,
            })}
            value={mentaMomenta}
            onChange={next => {
              if (!isCreationBusy) setMentaMomenta(next);
            }}
          />
        ) : null}
        {mode === 'group' || reviewer.kind === 'friend' ? (
          <AppSwitchRow
            title={t('mentaCheck.group.backupToggle')}
            subtitle={t('mentaCheck.group.after24')}
            value={mentaBackup}
            onChange={next => {
              if (!isCreationBusy) setMentaBackup(next);
            }}
          />
        ) : null}
      </>
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
          onChangeEnabled={handleReminderEducationChange}
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

  const creationNotice = pendingFriendChallengeId ? (
    <CreationStateNotice
      title={
        creationError
          ? t('commerce.free.receiptRetry')
          : t('commerce.free.pendingReviewer')
      }
      description={
        creationError
          ? t('commerce.free.receiptRetryDetail')
          : t('commerce.free.pendingDetail')
      }
      tone={creationError ? 'error' : 'warning'}
      actionLabel={creationError ? t('commerce.action.tryAgain') : undefined}
      onAction={creationError ? () => void continueFriendSetup() : undefined}
    />
  ) : creationError ? (
    <View style={styles.creationError}>
      <CreationStateNotice
        title={creationError.title}
        description={creationError.message}
        tone={creationRecovery?.kind === 'unknown-result' ? 'warning' : 'error'}
        actionLabel={
          creationError.kind === 'receipt-read'
            ? t('commerce.action.tryAgain')
            : creationRecovery?.kind === 'session-expired'
              ? 'Sign in'
              : creationRecovery?.kind === 'unknown-result'
                ? 'Check Today'
                : canSaveGateDraftAndExit
                  ? 'Save draft and exit'
                  : undefined
        }
        onAction={
          creationError.kind === 'receipt-read'
            ? () => void retryReceiptRead()
            : creationRecovery?.kind === 'session-expired' ||
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
                {isReviewStep && promiseQuote && !pendingFriendChallengeId ? (
                  <CostReceipt
                    cost={reviewAmount}
                    balance={balance}
                    freeLabel={describeCreatePromiseCost(reviewAmount)}
                  />
                ) : null}
                <AppButton
                  testID={`create-promise-primary-${activeStepId}`}
                  accessibilityLabel={
                    creationError?.kind === 'receipt-read'
                      ? t('commerce.action.tryAgain')
                      : isCreationOutcomeUnknown
                        ? unknownCreationPrimaryLabel
                        : pendingFriendChallengeId
                          ? t('commerce.free.finishSetup')
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
                      : creationError?.kind === 'receipt-read'
                        ? t('commerce.action.tryAgain')
                        : isCreationOutcomeUnknown
                          ? unknownCreationPrimaryLabel
                          : pendingFriendChallengeId
                            ? t('commerce.free.finishSetup')
                            : primaryCta
                  }
                />
                {isReviewStep && !pendingFriendChallengeId ? (
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

      <MentaConsent
        visible={mentaConsentVisible}
        source="create"
        onClose={() => {
          setMentaConsentVisible(false);
          setMentaBackup(false);
          if (reviewer.kind === 'menta') setReviewer({ kind: 'self' });
        }}
        onAccepted={() => {
          setMentaConsentVisible(false);
          void mentaOverview.refetch();
        }}
      />
      {mentaSetupFailed && createdChallenge ? (
        <ModalCard
          visible
          onClose={() => {
            setMentaSetupFailed(false);
            router.push('/menta-check');
          }}
        >
          <Text>{t('mentaCheck.receipt.selfFallback')}</Text>
          <AppButton
            title={t('mentaCheck.settings.title')}
            onPress={() => {
              setMentaSetupFailed(false);
              router.push('/menta-check');
            }}
          />
        </ModalCard>
      ) : null}
      <CreationReceiptSheet
        visible={
          Boolean(createdChallenge) &&
          !mentaSetupFailed &&
          !pendingFriendChallengeId
        }
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
        shortfall={Math.max(reviewAmount - balance, 0)}
        balance={balance}
        requiredAmount={reviewAmount}
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
  const { costReceiptStyles } = useMentaStyles(createPaletteStyles);

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

const CreationStateNotice: React.FC<{
  testID?: string;
  title: string;
  description: string;
  tone: 'info' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}> = ({ testID, title, description, tone, actionLabel, onAction }) => {
  const mentaColors = useMentaPalette();

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
  const mentaColors = useMentaPalette();

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

const createStyles = (theme: ThemeContextType) => {
  const mentaColors = theme.mentaColors ?? defaultMentaColors;
  return StyleSheet.create({
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
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
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
  return { costReceiptStyles };
};
