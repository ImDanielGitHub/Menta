import React from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModalCard from '@/components/ui/modal/ModalCard';
import PaywallModal from '@/components/paywall/PaywallModal';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  ShieldIcon,
  TypeIcon,
  XIcon,
} from '@/components/ui/icons';
import {
  useTheme,
  useThemedStyles,
  type ThemeContextType,
} from '@/constants/ThemeContext';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { AUTHORING_SAFETY_DISCLOSURE } from '@/lib/content-safety';
import { useAuthStore } from '@/store/auth-store';
import { useChallengeStore, type Challenge } from '@/store/challenge-store';
import { useMomentaStore } from '@/store/momenta-store';
import {
  AppButton,
  AppChoiceChip,
  AppKeyboardDoneAccessory,
  AppOptionCard,
  AppScreen,
} from '@/components/ui';
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
  commitmentTemplates,
  resolveCommitmentTemplate,
  type CommitmentTemplate,
  type CommitmentTemplateId,
} from '@/lib/commitments/templates';
import { getTemplatePickerState } from '@/lib/commitments/template-picker-state';
import {
  CREATE_INTENSITY_SHOP_NOTE,
  listCreateIntensityOptions,
} from '@/lib/commitments/create-intensity-copy';
import {
  formatPromiseDueWindow,
  type PromiseCreationReceipt,
} from '@/lib/commitments/promise-creation-receipt';
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
import { PromiseArtefact } from '@/components/challenge/PromiseArtefact';
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
const CREATE_PROMISE_KEYBOARD_ACCESSORY_ID =
  'create-promise-keyboard-accessory';
const withEllipsis = (value: string) =>
  `${value.trim().replace(/[.!?]+$/u, '')}…`;
const promisePlaceholderExamples = commitmentTemplates.map(template =>
  withEllipsis(template.title)
);
const countsWhenPlaceholderExamples = commitmentTemplates.map(template =>
  withEllipsis(template.description)
);
const difficultyOptions = listCreateIntensityOptions();

const proofOptions: {
  id: Exclude<ChallengeVerificationType, 'none'>;
  note: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'photo',
    note: 'Best when the completed action or result needs to be seen.',
    icon: <CameraIcon size={18} color={mentaColors.text.primary} />,
  },
  {
    id: 'text',
    note: 'Best for a short written check-in.',
    icon: <TypeIcon size={18} color={mentaColors.text.primary} />,
  },
];

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
  const mode =
    resolvedMode.usedLegacyParams && !resolvedMode.groupId
      ? 'solo'
      : resolvedMode.mode;
  const groupId = mode === 'group' ? resolvedMode.groupId : null;
  const selectedParamTemplate = React.useMemo(
    () => resolveCommitmentTemplate(params.templateId),
    [params.templateId]
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

  const onboardingTitle = getSingleParam(params.title);
  const onboardingVerificationType = getSingleParam(params.verificationType);
  const isOnboardingHandoff = getSingleParam(params.source) === 'onboarding';
  const hasExplicitRouteDefaults =
    Boolean(selectedParamTemplate) ||
    Boolean(onboardingTitle?.trim()) ||
    isProofType(onboardingVerificationType) ||
    isOnboardingHandoff;

  const [currentStep, setCurrentStep] = React.useState(0);
  const [costConfirmation, setCostConfirmation] = React.useState<{
    cost: number;
    balance: number;
  } | null>(null);
  const [showTemplates, setShowTemplates] = React.useState(false);
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
  const [didRestoreDraft, setDidRestoreDraft] = React.useState(false);
  const [isSavingDraftExit, setIsSavingDraftExit] = React.useState(false);
  const [unknownCreateResultAt, setUnknownCreateResultAt] = React.useState<
    string | null
  >(null);
  const [todayReadbackRequestedAt, setTodayReadbackRequestedAt] =
    React.useState<string | null>(null);
  const submittingRef = React.useRef(false);
  const creationReceiptRef = React.useRef(false);

  React.useEffect(() => {
    setCostConfirmation(null);
  }, [
    description,
    difficulty,
    duration,
    proofDescription,
    proofType,
    submissionText,
    title,
  ]);

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
    [templateId]
  );

  const steps = React.useMemo(
    () => [
      {
        id: 'name',
        title: t('todayProof.create.promise_question'),
        subtitle: t('todayProof.create.promise_question_detail'),
      },
      {
        id: 'proof',
        title: t('todayProof.create.proof_question'),
        subtitle:
          mode === 'solo'
            ? t('todayProof.create.proof_solo_detail')
            : t('todayProof.create.proof_group_detail'),
      },
      {
        id: 'pace',
        title: t('todayProof.create.flexibility_question'),
        subtitle: t('todayProof.create.flexibility_detail'),
      },
      {
        id: 'review',
        title: t('todayProof.create.review_question'),
        subtitle: t('todayProof.create.review_detail'),
      },
    ],
    [mode, t]
  );

  const activeStep = steps[currentStep];
  const proofDescriptionLength = proofDescription.trim().length;
  const proofDescriptionNeedsMore =
    proofDescriptionLength < MIN_PROOF_DESCRIPTION_LENGTH;
  const selectedDifficulty =
    difficultyOptions.find(option => option.id === difficulty) ??
    difficultyOptions[1];
  const primaryCta =
    currentStep === 0
      ? t('todayProof.create.choose_proof')
      : currentStep === 1
        ? t('todayProof.create.choose_schedule')
        : currentStep === 2
          ? t('todayProof.create.review_promise')
          : costConfirmation
            ? `Confirm ${costConfirmation.cost.toLocaleString()} Momenta`
            : t('todayProof.create.create_promise');
  const applyTemplate = (template: CommitmentTemplate) => {
    setTemplateId(template.id);
    setTitle(template.title);
    setDescription(template.description);
    setProofType(template.verificationType);
    setProofDescription(template.verificationDescription);
    setSubmissionText(template.submissionText);
    setDuration(template.durationDays);
    setDifficulty(template.difficulty);
    setShowTemplates(false);
  };

  const clearTemplate = () => {
    setTemplateId(undefined);
    setDescription('');
    setShowTemplates(false);
  };

  const isStepValid = React.useMemo(() => {
    if (currentStep === 0) {
      return (
        title.trim().length >= 3 &&
        description.trim().length >= MIN_PROOF_DESCRIPTION_LENGTH
      );
    }
    if (currentStep === 1)
      return proofDescriptionLength >= MIN_PROOF_DESCRIPTION_LENGTH;
    return true;
  }, [currentStep, description, proofDescriptionLength, title]);
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
        currentStep: toPromiseDraftStep(currentStep),
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
      setDidRestoreDraft(false);
      setIsDraftRestoring(false);
      return () => {
        cancelled = true;
      };
    }

    if (hasExplicitRouteDefaults) {
      setDidRestoreDraft(false);
      setIsDraftRestoring(false);
      return () => {
        cancelled = true;
      };
    }

    setIsDraftRestoring(true);
    void loadPromiseCreationDraft(userId)
      .then(draft => {
        if (cancelled || !draft) {
          if (!cancelled) setDidRestoreDraft(false);
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
        setDidRestoreDraft(true);
      })
      .catch(error => {
        console.warn('[PromiseCreationDraft] Could not restore draft:', error);
        if (!cancelled) setDidRestoreDraft(false);
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
    router.replace({
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
    if (currentStep === 0 && title.trim().length < 3) {
      setCreationError({
        title: t('todayProof.create.name_promise'),
        message: t('todayProof.create.name_promise_detail'),
      });
      return;
    }
    if (currentStep === 0 && description.trim().length < 8) {
      setCreationError({
        title: t('todayProof.create.say_what_counts'),
        message: t('todayProof.create.say_what_counts_detail'),
      });
      return;
    }
    if (
      currentStep === 1 &&
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
    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
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

    if (description.trim().length < 8) {
      setCreationError({
        title: t('todayProof.create.say_what_counts'),
        message: t('todayProof.create.short_rule'),
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
        setCostConfirmation(null);
        setPaywallVariant('insufficient');
        setQuotaLimit(undefined);
        setCreationError({
          title: t('todayProof.create.more_momenta'),
          message: `This promise costs ${cost.toLocaleString()} Momenta and your balance is ${currentBalance.toLocaleString()}. Your draft is still here.`,
        });
        setPaywallVisible(true);
        return;
      }

      if (
        cost > 0 &&
        (costConfirmation?.cost !== cost ||
          costConfirmation.balance !== currentBalance)
      ) {
        setCostConfirmation({ cost, balance: currentBalance });
        setCreationError({
          title: `Spend ${cost.toLocaleString()} Momenta?`,
          message: `Your confirmed balance is ${currentBalance.toLocaleString()}. Creating this promise leaves ${(currentBalance - cost).toLocaleString()} Momenta. Press the confirmation button to create it.`,
        });
        AccessibilityInfo.announceForAccessibility?.(
          `Confirm spending ${cost.toLocaleString()} Momenta. Your balance will be ${(currentBalance - cost).toLocaleString()} Momenta.`
        );
        return;
      }

      setCostConfirmation(null);

      const startDate = new Date();
      const endDate = addDays(startDate, Math.max(1, duration - 1));

      const { challenge, receipt } = await createChallengeWithPayment({
        title: trimmedTitle,
        description:
          description.trim() ||
          selectedTemplate?.description ||
          proofDescription.trim(),
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

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <View style={styles.stepStack}>
          <PromiseArtefact
            editable
            promise={title}
            countsWhen={description}
            disabled={isCreationBusy}
            onChangePromise={value => {
              setTitle(value);
              clearCreationIssue();
            }}
            onChangeCountsWhen={value => {
              setDescription(value);
              clearCreationIssue();
            }}
            promiseInputTestID="create-promise-name-input"
            countsWhenInputTestID="create-promise-what-counts-input"
            promisePlaceholders={promisePlaceholderExamples}
            countsWhenPlaceholders={countsWhenPlaceholderExamples}
            testID="create-promise-artefact"
          />

          <Text style={styles.promiseArtefactHelper}>
            {mode === 'solo'
              ? t('todayProof.create.start_rule_solo')
              : t('todayProof.create.start_rule_group')}
          </Text>

          <Pressable
            testID="create-promise-use-template"
            accessibilityRole="button"
            accessibilityState={{ disabled: isCreationBusy }}
            disabled={isCreationBusy}
            onPress={() => setShowTemplates(true)}
            style={({ pressed }) => [
              styles.inlineRow,
              isCreationBusy && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.inlineRowCopy}>
              <Text style={styles.inlineRowTitle}>
                {t('todayProof.create.use_template')}
              </Text>
              <Text style={styles.inlineRowMeta} numberOfLines={1}>
                {selectedTemplate
                  ? selectedTemplate.title
                  : t('todayProof.create.start_common')}
              </Text>
            </View>
            <View style={styles.trailingIcon}>
              <ArrowRightIcon size={16} color={theme.colors.text.tertiary} />
            </View>
          </Pressable>
        </View>
      );
    }

    if (currentStep === 1) {
      return (
        <View style={styles.stepStack}>
          <View style={styles.rowGroup}>
            {proofOptions.map(option => (
              <AppOptionCard
                key={option.id}
                testID={`create-promise-proof-${option.id}`}
                title={
                  option.id === 'photo'
                    ? t('todayProof.create.photo_video')
                    : t('todayProof.promise.text_proof')
                }
                description={option.note}
                icon={option.icon}
                selected={
                  option.id === 'photo'
                    ? proofType === 'photo' || proofType === 'video'
                    : proofType === option.id
                }
                disabled={isCreationBusy}
                onPress={() => setProofType(option.id)}
              />
            ))}
          </View>

          <View style={styles.fieldBlock}>
            <FieldHeader
              label={t('todayProof.create.proof_show_required')}
              count={`${proofDescription.trim().length}/300`}
            />
            <TextInput
              testID="create-promise-reviewer-instructions-input"
              accessibilityLabel={t('todayProof.create.proof_show')}
              value={proofDescription}
              accessibilityHint={t('todayProof.create.proof_required_hint', {
                count: MIN_PROOF_DESCRIPTION_LENGTH,
              })}
              onChangeText={value => {
                setProofDescription(value);
                clearCreationIssue();
              }}
              placeholder={t('todayProof.create.photo_example')}
              placeholderTextColor={theme.colors.text.placeholder}
              style={styles.compactInput}
              multiline
              inputAccessoryViewID={CREATE_PROMISE_KEYBOARD_ACCESSORY_ID}
              textAlignVertical="top"
              editable={!isCreationBusy}
              maxLength={300}
            />
            <Text
              testID="create-promise-proof-helper"
              style={styles.fieldHelper}
            >
              {proofDescriptionNeedsMore
                ? t('todayProof.create.proof_minimum', {
                    count: MIN_PROOF_DESCRIPTION_LENGTH,
                  })
                : mode === 'solo'
                  ? t('todayProof.create.proof_rule')
                  : t('todayProof.create.group_proof_rule')}
            </Text>
            <Text style={styles.fieldHelper}>
              {AUTHORING_SAFETY_DISCLOSURE}
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <FieldHeader
              label={t('todayProof.create.prompt_optional')}
              count={`${submissionText.trim().length}/200`}
            />
            <TextInput
              testID="create-promise-proof-prompt-input"
              accessibilityLabel={t('todayProof.create.prompt')}
              value={submissionText}
              onChangeText={value => {
                setSubmissionText(value);
                clearCreationIssue();
              }}
              placeholder={t('todayProof.create.prompt_example')}
              placeholderTextColor={theme.colors.text.placeholder}
              style={styles.compactInput}
              multiline
              inputAccessoryViewID={CREATE_PROMISE_KEYBOARD_ACCESSORY_ID}
              textAlignVertical="top"
              editable={!isCreationBusy}
              maxLength={200}
            />
          </View>
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepStack}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>
              {t('todayProof.create.length')}
            </Text>
            <View style={styles.chipRow}>
              {durationOptions.map(days => (
                <AppChoiceChip
                  key={days}
                  testID={`create-promise-duration-${days}`}
                  label={t('todayProof.create.days_unit', { count: days })}
                  selected={duration === days}
                  disabled={isCreationBusy}
                  style={styles.durationChip}
                  onPress={() => setDuration(days)}
                />
              ))}
            </View>
          </View>

          <View style={styles.rowGroup}>
            {difficultyOptions.map(option => (
              <AppOptionCard
                key={option.id}
                testID={`create-promise-intensity-${option.id}`}
                title={option.label}
                description={option.note}
                selected={difficulty === option.id}
                disabled={isCreationBusy}
                onPress={() => setDifficulty(option.id)}
              />
            ))}
            <Text style={styles.noteText}>{CREATE_INTENSITY_SHOP_NOTE}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.reviewList}>
        <PromiseArtefact
          compact
          promise={title.trim()}
          countsWhen={description.trim()}
          disabled={isCreationBusy}
          onPress={() => setCurrentStep(0)}
          accessibilityHint={t('todayProof.create.edit_wording')}
          testID="create-promise-review-artefact"
        />
        <ReviewLine
          label={t('todayProof.create.proof_type')}
          value={t('todayProof.create.proof_type_daily', {
            type: getProofTypeLabel(proofType, t),
          })}
          disabled={isCreationBusy}
          onPress={() => setCurrentStep(1)}
        />
        <ReviewLine
          label={t('todayProof.create.proof_counts')}
          value={proofDescription.trim()}
          disabled={isCreationBusy}
          onPress={() => setCurrentStep(1)}
        />
        <ReviewLine
          label={t('todayProof.residual.schedule')}
          value={`${duration} days · ${selectedDifficulty.label}`}
          disabled={isCreationBusy}
          onPress={() => setCurrentStep(2)}
        />
        <ReviewLine
          label={t('todayProof.residual.momenta')}
          value={
            promiseQuote
              ? describeCreatePromiseCost(promiseQuote.cost)
              : t('todayProof.create.confirming')
          }
        />
        <View style={styles.reviewNote}>
          <ShieldIcon size={18} color={theme.colors.text.secondary} />
          <Text style={styles.noteText}>
            {mode === 'solo'
              ? t('todayProof.create.private_send')
              : t('todayProof.create.group_review_rule')}
          </Text>
        </View>
      </View>
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
          groupSummary={`${duration} days · ${selectedDifficulty.label} schedule`}
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="working"
        hasTabBar={false}
        padding={false}
        scrollable={false}
        contentContainerStyle={styles.screen}
        testID="create-promise-screen"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <View
            style={[
              styles.header,
              { paddingHorizontal: phoneLayout.screenInset },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('todayProof.create.back_from_creation')}
              accessibilityState={{ disabled: isCreationBusy }}
              disabled={isCreationBusy}
              onPress={goBack}
              style={({ pressed }) => [
                styles.iconButton,
                isCreationBusy && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeftIcon size={18} color={theme.colors.text.primary} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>
                {t('todayProof.create.create_promise')}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View
            style={[
              styles.progressBlock,
              { paddingHorizontal: phoneLayout.screenInset },
            ]}
          >
            <Text
              accessibilityRole="text"
              style={styles.progressLabel}
              testID="create-promise-step-label"
            >
              {t('todayProof.create.step_progress', {
                current: currentStep + 1,
                total: steps.length,
              })}
            </Text>
            <View style={styles.progressSegments}>
              {steps.map((step, index) => (
                <View
                  key={step.id}
                  style={[
                    styles.progressSegment,
                    index <= currentStep && styles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={[
              styles.body,
              { paddingHorizontal: phoneLayout.screenInset },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.copyBlock}>
              <Text style={styles.stepTitle}>{activeStep.title}</Text>
              <Text style={styles.stepSubtitle}>{activeStep.subtitle}</Text>
            </View>

            {isDraftRestoring ? (
              <View style={styles.creationError}>
                <CreationStateNotice
                  testID="create-promise-restoring-draft"
                  title={t('todayProof.create.restoring_draft')}
                  description={t('todayProof.create.nothing_created')}
                  tone="info"
                />
              </View>
            ) : creationError ? (
              <View style={styles.creationError}>
                <CreationStateNotice
                  title={creationError.title}
                  description={creationError.message}
                  tone={
                    creationRecovery?.kind === 'unknown-result'
                      ? 'warning'
                      : 'error'
                  }
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
            ) : isCreationBusy ? (
              <View style={styles.creationError}>
                <CreationStateNotice
                  testID="create-challenge-saving-notice"
                  title={t('todayProof.create.creating')}
                  description={t('todayProof.create.keep_open')}
                  tone="info"
                />
              </View>
            ) : null}

            {!isDraftRestoring && didRestoreDraft ? (
              <View style={styles.creationError}>
                <CreationStateNotice
                  testID="create-promise-restored-draft"
                  title={t('todayProof.create.draft_restored')}
                  description={t('todayProof.create.private_on_phone')}
                  tone="info"
                />
              </View>
            ) : null}

            {isCreationOutcomeUnknown && todayReadbackRequestedAt ? (
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
            ) : null}

            <View style={styles.stage}>{renderStep()}</View>
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
            <View style={styles.footerActionRow}>
              {currentStep > 0 ? (
                <AppButton
                  testID="create-promise-back"
                  accessibilityLabel={t('todayProof.proof.back')}
                  onPress={goBack}
                  disabled={isCreationBusy}
                  leftIcon={
                    <ArrowLeftIcon
                      size={17}
                      color={theme.colors.text.primary}
                    />
                  }
                  style={styles.backButton}
                  title={t('todayProof.proof.back')}
                  variant="outline"
                />
              ) : null}

              <AppButton
                testID={`create-promise-primary-${activeStep.id}`}
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
                rightIcon={
                  currentStep === steps.length - 1 ? (
                    <CheckIcon size={17} color={mentaColors.canvas} />
                  ) : (
                    <ArrowRightIcon size={17} color={mentaColors.canvas} />
                  )
                }
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
            </View>
          </View>
          <AppKeyboardDoneAccessory
            nativeID={CREATE_PROMISE_KEYBOARD_ACCESSORY_ID}
          />
        </KeyboardAvoidingView>
      </AppScreen>

      <TemplatePickerSheet
        visible={showTemplates}
        selectedTemplateId={templateId}
        onClose={() => setShowTemplates(false)}
        onApply={applyTemplate}
        onClear={templateId ? clearTemplate : undefined}
      />

      <CreationReceiptSheet
        visible={Boolean(createdChallenge)}
        mode={mode}
        title={createdChallengeTitle}
        proofType={createdProofType}
        duration={duration}
        difficultyLabel={selectedDifficulty.label}
        receipt={creationReceipt}
        onPostFirstProof={handlePostFirstProof}
        onOpenGroup={handleOpenCreatedGroup}
        onViewPromise={handleViewCreatedChallenge}
        onBackToToday={handleBackToToday}
        onSetReminder={handleOpenReminderEducation}
        onInvitePerson={mode === 'group' ? handleOpenReferralBridge : undefined}
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
      />
    </>
  );
}

const FieldHeader: React.FC<{ label: string; count: string }> = ({
  label,
  count,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.fieldHeader}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldCount}>{count}</Text>
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

const ReviewLine: React.FC<{
  label: string;
  value: string;
  disabled?: boolean;
  onPress?: () => void;
}> = ({ label, value, disabled = false, onPress }) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const body = (
    <>
      <View style={styles.reviewCopy}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
      {onPress ? (
        <Text style={styles.changeText}>{t('todayProof.residual.change')}</Text>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.reviewLine}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.reviewLine,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {body}
    </Pressable>
  );
};

const TemplatePickerSheet: React.FC<{
  visible: boolean;
  selectedTemplateId?: CommitmentTemplateId;
  onClose: () => void;
  onApply: (template: CommitmentTemplate) => void;
  onClear?: () => void;
  templates?: readonly CommitmentTemplate[];
}> = ({
  visible,
  selectedTemplateId,
  onClose,
  onApply,
  onClear,
  templates = commitmentTemplates,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const [pendingTemplateId, setPendingTemplateId] = React.useState<
    CommitmentTemplateId | undefined
  >(selectedTemplateId);
  const templatePickerState = React.useMemo(
    () => getTemplatePickerState(templates),
    [templates]
  );
  const pendingTemplate =
    templatePickerState.kind === 'ready'
      ? templatePickerState.templates.find(
          template => template.id === pendingTemplateId
        )
      : null;

  React.useEffect(() => {
    if (visible) setPendingTemplateId(selectedTemplateId);
  }, [selectedTemplateId, visible]);

  const applySelectedTemplate = () => {
    if (!pendingTemplate) return;
    onApply(pendingTemplate);
  };

  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      surface="sheet"
      animationType="slide"
      accessibilityLabel={t('todayProof.create.template_picker')}
      cardStyle={styles.templateSheet}
    >
      <View
        style={[
          styles.templateSheetInner,
          {
            paddingBottom: Math.max(insets.bottom, theme.spacing.md),
            paddingHorizontal: phoneLayout.screenInset,
          },
        ]}
      >
        <View style={styles.sheetGrabber} />
        <View style={styles.sheetHeader}>
          <View style={styles.headerSpacer} />
          <Text style={styles.sheetTitle}>
            {t('todayProof.residual.starter_templates')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('todayProof.create.close_templates')}
            onPress={onClose}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <XIcon size={18} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <Text style={styles.sheetSubtitle}>
          {t(
            'todayProof.residual.choose_one_then_edit_the_promise_and_proof_rule'
          )}
        </Text>

        {templatePickerState.kind === 'ready' ? (
          <>
            <ScrollView
              style={styles.templateScroll}
              contentContainerStyle={styles.templateList}
              showsVerticalScrollIndicator
            >
              {templatePickerState.templates.map(template => {
                const isSelected = template.id === pendingTemplateId;
                const isTextProof = template.verificationType === 'text';
                const flexibilityLabel =
                  difficultyOptions.find(
                    option => option.id === template.difficulty
                  )?.label ?? 'Standard';

                return (
                  <Pressable
                    key={template.id}
                    testID={`create-promise-template-${template.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setPendingTemplateId(template.id)}
                    style={({ pressed }) => [
                      styles.templateRow,
                      isSelected && styles.templateRowActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.templateIcon,
                        isSelected && styles.templateIconActive,
                      ]}
                    >
                      {isTextProof ? (
                        <TypeIcon
                          size={17}
                          color={
                            isSelected
                              ? theme.colors.text.primary
                              : theme.colors.text.secondary
                          }
                        />
                      ) : (
                        <CameraIcon
                          size={17}
                          color={
                            isSelected
                              ? theme.colors.text.primary
                              : theme.colors.text.secondary
                          }
                        />
                      )}
                    </View>
                    <View style={styles.choiceCopy}>
                      <Text style={styles.choiceTitle} numberOfLines={1}>
                        {template.title}
                      </Text>
                      <Text style={styles.choiceBody} numberOfLines={2}>
                        {`${template.durationDays} days · ${getProofTypeLabel(
                          template.verificationType,
                          t
                        ).toLowerCase()} proof · ${flexibilityLabel}`}
                      </Text>
                    </View>
                    <View style={styles.trailingIcon}>
                      {isSelected ? (
                        <CheckIcon
                          size={17}
                          color={theme.colors.text.primary}
                        />
                      ) : (
                        <ArrowRightIcon
                          size={17}
                          color={theme.colors.text.tertiary}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.templateActions}>
              <Pressable
                testID="create-promise-apply-template"
                accessibilityRole="button"
                accessibilityLabel={t(
                  'todayProof.create.use_selected_template'
                )}
                accessibilityState={{ disabled: !pendingTemplate }}
                disabled={!pendingTemplate}
                onPress={applySelectedTemplate}
                style={({ pressed }) => [
                  styles.templateApplyButton,
                  !pendingTemplate && styles.disabled,
                  pressed && pendingTemplate && styles.pressed,
                ]}
              >
                <Text style={styles.templateApplyButtonText}>
                  {t('todayProof.create.use_selected_template')}
                </Text>
              </Pressable>
              <Pressable
                testID="create-promise-write-own"
                accessibilityRole="button"
                accessibilityLabel={t('todayProof.create.write_own')}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.clearTemplate,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.clearTemplateText}>
                  {t('todayProof.create.write_own')}
                </Text>
              </Pressable>
            </View>

            {onClear ? (
              <Pressable
                accessibilityRole="button"
                onPress={onClear}
                style={({ pressed }) => [
                  styles.clearTemplate,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.clearTemplateText}>
                  {t('todayProof.residual.clear_template')}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={styles.templateUnavailable}>
            <View style={styles.templateUnavailableIcon}>
              <ShieldIcon size={18} color={mentaColors.warning} />
            </View>
            <Text style={styles.templateUnavailableTitle}>
              {t('todayProof.residual.templates_are_unavailable')}
            </Text>
            <Text style={styles.templateUnavailableBody}>
              {t(
                'todayProof.residual.no_template_was_applied_your_promise_details_and_proof_rule_stay'
              )}
            </Text>
            <Pressable
              testID="create-promise-write-own-unavailable"
              accessibilityRole="button"
              accessibilityLabel={t('todayProof.create.write_promise')}
              onPress={onClose}
              style={({ pressed }) => [
                styles.templateApplyButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.templateApplyButtonText}>
                {t('todayProof.create.write_promise')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ModalCard>
  );
};

const CreationReceiptSheet: React.FC<{
  visible: boolean;
  mode: 'solo' | 'group';
  title: string;
  proofType: Exclude<ChallengeVerificationType, 'none'>;
  duration: number;
  difficultyLabel: string;
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
  const dueWindow = receipt ? formatPromiseDueWindow(receipt.nextDueAt) : null;
  const receiptTitle = isGroup ? 'Group promise saved' : 'Promise saved';
  const receiptBody = dueWindow
    ? `Your next proof is due ${dueWindow}.`
    : isGroup
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
                value={dueWindow ?? 'Schedule saved'}
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
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0,
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
    progressSegments: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    progressSegment: {
      flex: 1,
      height: 4,
      borderRadius: mentaRadii.round,
      backgroundColor: theme.colors.border.secondary,
    },
    progressSegmentActive: {
      backgroundColor: theme.colors.accent.primary,
    },
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.lg,
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
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
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
      ...mentaTypography.caption,
      fontWeight: theme.typography.weights.semibold,
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
    titleInput: {
      minHeight: 68,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.primary,
      color: theme.colors.text.primary,
      ...mentaTypography.title,
      paddingVertical: theme.spacing.sm,
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
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.semibold,
    },
    inlineRowMeta: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 19,
    },
    noteRow: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    noteText: {
      flex: 1,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 20,
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
    promiseNameInput: {
      minHeight: 82,
      ...mentaTypography.title,
    },
    largeInput: {
      minHeight: 118,
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
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0,
    },
    reviewValue: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 19,
      letterSpacing: 0,
    },
    changeText: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
    },
    reviewNote: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor: mentaColors.canvas,
    },
    footerActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    backButton: {
      minWidth: 104,
    },
    primaryButton: {
      flex: 1,
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
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0,
    },
    receiptValue: {
      flex: 1,
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      lineHeight: 19,
      textAlign: 'right',
      letterSpacing: 0,
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
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      textAlign: 'center',
    },
    sheetSubtitle: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 20,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      letterSpacing: 0,
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
    templateApplyButton: {
      minHeight: 52,
      borderRadius: mentaRadii.small,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.accent.primary,
    },
    templateApplyButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0,
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
    clearTemplate: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearTemplateText: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.985 }],
    },
  });
