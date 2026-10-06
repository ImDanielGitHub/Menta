import {
  mentaColors as defaultMentaColors,
  type MentaPalette,
  mentaHeadingRoles,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypeScale,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccessibilityInfo,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { useRewardedMomentaAd } from '@/lib/hooks/use-rewarded-momenta-ad';
import { useAdRewardAmount } from '@/lib/hooks/useAdReward';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  LockIcon,
  XIcon,
} from '@/components/ui/icons';
import { MentaMascot } from '@/components/ui/MentaMascot';

import {
  useTheme,
  useThemedStyles,
  type ThemeContextType,
} from '@/constants/ThemeContext';
import { GROUP_SAFETY_DISCLOSURE } from '@/lib/content-safety';
import { useAuthStore } from '@/store/auth-store';
import {
  isSavedGroupCreationUnknownError,
  SavedGroupCreationFailureError,
  useGroupStore,
} from '@/store/group-store';
import { useMomentaStore } from '@/store/momenta-store';
import {
  AppButton,
  AppInlineNotice,
  AppOptionCard,
  AppStepProgress,
  SkeletonLoader,
  SkeletonText,
} from '@/components/ui';
import {
  FirstGroupCreatedReceipt,
  GroupTemplatePickerSheet,
  SelectedGroupStartingPoint,
} from '@/components/groups/GroupCreationStates';
import { mentaFonts } from '@/lib/menta-fonts';
import { useQuotaGate } from '@/lib/hooks/useQuotaGate';
import { resolveAdaptiveLayout } from '@/constants/responsive-layout';
import {
  resolveCommitmentTemplate,
  type CommitmentTemplateId,
} from '@/lib/commitments/templates';
import { buildCreateChallengeHref } from '@/lib/navigation/create-entry';
import {
  decodeCreateGroupDraft,
  getCreateGroupDraftKey,
  type CreateGroupDraft,
} from '@/lib/groups/create-group-draft';
import { describeCreatedGroup } from '@/lib/groups/create-group-copy';
import {
  DEFAULT_GROUP_IMAGE_PRESET,
  GROUP_IMAGE_PRESETS,
  type GroupImagePresetKey,
} from '@/lib/groups/group-image-presets';
import { loadSavedGroupCreationAttempt } from '@/lib/groups/saved-group-creation-contract';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitConfirmedSuccess,
  emitHaptic,
} from '@/lib/motion/haptics';
import { trackMetaAdsCreateGroup } from '@/lib/meta-ads';
import { trackProductOperation } from '@/lib/posthog';
import {
  attachPromiseToSavedGroup,
  type PromiseSavedGroupLinkResult,
} from '@/lib/promises/saved-group-link';
import {
  clearPendingSavedGroupLink,
  loadPendingSavedGroupLink,
  markPendingSavedGroupCreated,
  type PendingSavedGroupLink,
} from '@/lib/promises/pending-saved-group-link';
type GroupParams = {
  templateId?: string | string[];
  groupName?: string | string[];
  qaState?: string | string[];
  source?: string | string[];
  firstPromiseId?: string | string[];
};

type PrivacyOption = 'public' | 'private';

const getSingleParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

export default function CreateGroupScreen() {
  const mentaColors = useMentaPalette();
  const { privacyOptions } = useMentaStyles(createPaletteStyles);

  const router = useRouter();
  const { t, locale } = useTranslation();
  const params = useLocalSearchParams<GroupParams>();
  const selectedParamTemplate = React.useMemo(
    () => resolveCommitmentTemplate(params.templateId, locale),
    [locale, params.templateId]
  );
  const initialGroupName = getSingleParam(params.groupName);
  const qaState = getSingleParam(params.qaState);
  const hasOnboardingSource =
    getSingleParam(params.source)?.trim() === 'onboarding';
  const hasPromiseAccountabilitySource =
    getSingleParam(params.source)?.trim() === 'promise_accountability';
  const onboardingFirstPromiseId = hasOnboardingSource
    ? getSingleParam(params.firstPromiseId)?.trim()
    : undefined;
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const adaptiveLayout = resolveAdaptiveLayout({
    width,
    safeAreaHorizontal: insets.left + insets.right,
    isIPad: Platform.OS === 'ios' && Platform.isPad,
    lane: 'focused',
  });
  const taskFrameWidth =
    adaptiveLayout.laneWidth == null
      ? undefined
      : adaptiveLayout.laneWidth + adaptiveLayout.gutter * 2;
  const { user } = useAuthStore();
  const createGroupWithPayment = useGroupStore(
    state => state.createGroupWithPayment
  );
  const createOnboardingGroupWithFirstPromise = useGroupStore(
    state => state.createOnboardingGroupWithFirstPromise
  );
  const reconcilePendingGroupCreation = useGroupStore(
    state => state.reconcilePendingGroupCreation
  );
  const resumePendingGroupCreation = useGroupStore(
    state => state.resumePendingGroupCreation
  );
  const clearPendingGroupCreation = useGroupStore(
    state => state.clearPendingGroupCreation
  );
  const checkUserCooldown = useGroupStore(state => state.checkUserCooldown);
  const getCreateGroupCost = useGroupStore(state => state.getCreateGroupCost);
  const userGroupCount = useGroupStore(
    state => state.groups.filter(group => group.kind !== 'promise').length
  );
  const balance = useMomentaStore(state => state.balance);
  const { watch: watchRewardedAd } = useRewardedMomentaAd('group_create');
  const adRewardAmount = useAdRewardAmount();
  const fetchBalance = useMomentaStore(state => state.fetchBalance);
  const { gateCreate } = useQuotaGate();

  const [currentStep, setCurrentStep] = React.useState(0);
  const [groupName, setGroupName] = React.useState(
    initialGroupName ?? selectedParamTemplate?.groupNameSuggestion ?? ''
  );
  const [duration, setDuration] = React.useState(
    selectedParamTemplate?.durationDays ?? 14
  );
  const [privacy, setPrivacy] = React.useState<PrivacyOption>('private');
  const [memberNudges, setMemberNudges] = React.useState(true);
  const [imagePreset, setImagePreset] = React.useState<GroupImagePresetKey>(
    DEFAULT_GROUP_IMAGE_PRESET
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [effectiveCreateCost, setEffectiveCreateCost] = React.useState<
    number | null
  >(null);
  const [costConfirmation, setCostConfirmation] = React.useState<{
    cost: number;
    balance: number;
  } | null>(null);
  const [paywallVisible, setPaywallVisible] = React.useState(false);
  const [paywallVariant, setPaywallVariant] = React.useState<
    'default' | 'insufficient' | 'quota'
  >('default');
  const [quotaLimit, setQuotaLimit] = React.useState<number | undefined>();
  const [creationError, setCreationError] = React.useState<{
    title: string;
    message: string;
  } | null>(null);
  const [showCreationStatusSheet, setShowCreationStatusSheet] =
    React.useState(false);
  const [creationRecoveryState, setCreationRecoveryState] = React.useState<
    'none' | 'unknown' | 'checking' | 'safe-to-retry'
  >('none');
  const [isRestoringDraft, setIsRestoringDraft] = React.useState(true);
  const [createdGroup, setCreatedGroup] = React.useState<{
    id: string;
    name: string;
    isFirstGroup: boolean;
    linkedFirstPromise?: { id: string; title: string; durationDays: number };
  } | null>(null);
  const [pendingPromiseLink, setPendingPromiseLink] =
    React.useState<PendingSavedGroupLink | null>(null);
  const [promiseLinkResult, setPromiseLinkResult] =
    React.useState<PromiseSavedGroupLinkResult | null>(null);
  const [promiseLinkSubmitting, setPromiseLinkSubmitting] =
    React.useState(false);
  const [promiseLinkLocalFailure, setPromiseLinkLocalFailure] =
    React.useState(false);
  const [showGroupShapes, setShowGroupShapes] = React.useState(
    !selectedParamTemplate && !initialGroupName
  );
  const submittingRef = React.useRef(false);
  const restoredDraftOwnerRef = React.useRef<string | null>(null);
  const qaStateAppliedRef = React.useRef(false);

  const draftKey = user?.id ? getCreateGroupDraftKey(user.id) : null;

  React.useEffect(() => {
    setCostConfirmation(null);
  }, [duration, groupName, imagePreset, memberNudges, privacy]);

  React.useEffect(() => {
    let cancelled = false;
    setEffectiveCreateCost(null);
    if (!user?.id) return () => undefined;

    void getCreateGroupCost(user.id)
      .then(cost => {
        if (!cancelled) setEffectiveCreateCost(cost);
      })
      .catch(() => {
        // Submission performs a fresh authoritative read and shows a bounded
        // recovery message if the price still cannot be confirmed.
      });

    return () => {
      cancelled = true;
    };
  }, [getCreateGroupCost, user?.id]);

  React.useEffect(() => {
    let cancelled = false;
    setIsRestoringDraft(true);
    restoredDraftOwnerRef.current = null;

    if (!user?.id || !draftKey) {
      setIsRestoringDraft(false);
      return () => {
        cancelled = true;
      };
    }

    void Promise.all([
      AsyncStorage.getItem(draftKey).catch(() => null),
      loadSavedGroupCreationAttempt(user.id).catch(() => null),
      hasPromiseAccountabilitySource
        ? loadPendingSavedGroupLink(user.id).catch(() => null)
        : Promise.resolve(null),
      new Promise<void>(resolve => setTimeout(resolve, 400)),
    ])
      .then(([raw, pendingAttempt, pendingLink]) => {
        if (cancelled) return;
        setPendingPromiseLink(pendingLink);
        if (pendingLink?.group) {
          setShowGroupShapes(false);
          setCreatedGroup({
            id: pendingLink.group.id,
            name: pendingLink.group.name,
            isFirstGroup: false,
          });
          setPromiseLinkResult({
            outcome: 'unknown',
            code: 'RESULT_UNKNOWN',
            request: {
              ...pendingLink.request,
              groupId: pendingLink.group.id,
            },
            retryWithSameClientEvent: true,
          });
          restoredDraftOwnerRef.current = user.id;
          return;
        }
        if (pendingAttempt) {
          setShowGroupShapes(false);
          setGroupName(pendingAttempt.request.name);
          setDuration(pendingAttempt.request.durationDays);
          setPrivacy(
            pendingAttempt.request.privacy === 'public' ? 'public' : 'private'
          );
          setMemberNudges(pendingAttempt.request.notifyOnMemberMiss);
          setImagePreset(
            pendingAttempt.request.imagePreset ?? DEFAULT_GROUP_IMAGE_PRESET
          );
          setCreationRecoveryState('unknown');
          setCreationError({
            title: t('groups.source.accountability.check_group_first_title'),
            message: t('groups.source.accountability.check_group_first_detail'),
          });
          setShowCreationStatusSheet(true);
          restoredDraftOwnerRef.current = user.id;
          return;
        }

        if (initialGroupName?.trim() || selectedParamTemplate) {
          setGroupName(
            initialGroupName ?? selectedParamTemplate?.groupNameSuggestion ?? ''
          );
          setDuration(selectedParamTemplate?.durationDays ?? 14);
          setPrivacy('private');
          setMemberNudges(true);
          setImagePreset(DEFAULT_GROUP_IMAGE_PRESET);
          restoredDraftOwnerRef.current = user.id;
          return;
        }

        const draft = decodeCreateGroupDraft(raw);
        setGroupName(draft?.groupName ?? '');
        setPrivacy(draft?.privacy ?? 'private');
        setMemberNudges(draft?.memberNudges ?? true);
        setImagePreset(draft?.imagePreset ?? DEFAULT_GROUP_IMAGE_PRESET);
        restoredDraftOwnerRef.current = user.id;
      })
      .finally(() => {
        if (!cancelled) setIsRestoringDraft(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    draftKey,
    initialGroupName,
    selectedParamTemplate,
    selectedParamTemplate?.groupNameSuggestion,
    hasPromiseAccountabilitySource,
    t,
    user?.id,
  ]);

  React.useEffect(() => {
    if (
      !__DEV__ ||
      (qaState !== 'failure' && qaState !== 'review') ||
      isRestoringDraft ||
      qaStateAppliedRef.current
    ) {
      return;
    }

    qaStateAppliedRef.current = true;
    if (qaState === 'review') {
      setGroupName(initialGroupName ?? 'Morning Miles');
      setCurrentStep(2);
      return;
    }
    setCreationError({
      title: t('groups.create.not_created_title'),
      message: t('groups.create.not_created_detail'),
    });
    setShowCreationStatusSheet(true);
  }, [initialGroupName, isRestoringDraft, qaState, t]);

  React.useEffect(() => {
    if (
      !draftKey ||
      !user?.id ||
      isRestoringDraft ||
      restoredDraftOwnerRef.current !== user.id ||
      createdGroup ||
      creationRecoveryState !== 'none'
    ) {
      return;
    }

    const draft: CreateGroupDraft = {
      version: 1,
      groupName,
      privacy,
      memberNudges,
      imagePreset,
    };
    void AsyncStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    createdGroup,
    creationRecoveryState,
    draftKey,
    groupName,
    imagePreset,
    isRestoringDraft,
    memberNudges,
    privacy,
    user?.id,
  ]);

  const steps = React.useMemo(
    () => [
      {
        id: 'name',
        title: t('groups.create.name_prompt'),
      },
      {
        id: 'settings',
        title: t('groups.create.settings_prompt'),
      },
      {
        id: 'review',
        title: t('groups.create.review_prompt'),
      },
    ],
    [t]
  );

  const activeStep = steps[currentStep];
  const primaryCta =
    currentStep === 0
      ? t('groups.create.choose_join')
      : currentStep === 1
        ? t('groups.create.review_group')
        : costConfirmation
          ? `Confirm ${costConfirmation.cost.toLocaleString()} Momenta`
          : t('groups.create.create_group');

  const isStepValid = React.useMemo(() => {
    if (currentStep === 0) return groupName.trim().length >= 3;
    return true;
  }, [currentStep, groupName]);

  const handleCloseCreateGroup = () => {
    if (isSubmitting || submittingRef.current) return;
    if (hasPromiseAccountabilitySource && user?.id && !createdGroup) {
      void clearPendingSavedGroupLink(user.id);
      setPendingPromiseLink(null);
      trackProductOperation({
        area: 'accountability',
        authority: 'client',
        operation: 'link_accountability',
        outcome: 'cancelled',
        phase: 'recovery',
        source: 'groups',
      });
    }
    backOrReplace(router, '/(tabs)/create');
  };

  const goBack = () => {
    if (isSubmitting || submittingRef.current) return;
    if (currentStep === 0) {
      handleCloseCreateGroup();
      return;
    }
    setCurrentStep(step => Math.max(0, step - 1));
  };

  const goNext = () => {
    Keyboard.dismiss();
    if (currentStep === 0 && groupName.trim().length < 3) {
      setCreationError({
        title: t('groups.create.name_heading'),
        message: t('groups.create.name_help'),
      });
      return;
    }
    setCreationError(null);
    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
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

  const refreshAfterPurchase = React.useCallback(async () => {
    try {
      const ownerId = user?.id;
      if (!ownerId) return;
      await fetchBalance(ownerId, { throwOnError: true });
      const cost = await getCreateGroupCost(ownerId);
      if (purchaseRefreshOwner.current !== ownerId) return;
      setEffectiveCreateCost(cost);
      // The paywall calls this after confirmed activation. Keep unresolved
      // creation recovery intact; the next explicit submit rechecks all gates.
      if (
        creationRecoveryState === 'none' &&
        (paywallVariant === 'quota' || paywallVariant === 'insufficient') &&
        cost <= useMomentaStore.getState().balance
      ) {
        setCreationError(current =>
          current === creationError ? null : current
        );
        setCostConfirmation(null);
      }
    } catch {
      // Keep the draft and existing retry guidance if readback fails. The
      // paywall does not await this callback; never leak a rejected promise.
    }
  }, [
    creationError,
    creationRecoveryState,
    fetchBalance,
    getCreateGroupCost,
    paywallVariant,
    user?.id,
  ]);

  const linkCreatedGroupToPromise = React.useCallback(
    async (
      group: { id: string; name: string },
      isFirstGroup: boolean,
      pending: PendingSavedGroupLink | null = pendingPromiseLink,
      interaction: 'mutation' | 'recovery' = 'mutation'
    ) => {
      if (!user?.id || !pending) return;

      const created = {
        id: group.id,
        name: group.name,
        isFirstGroup,
      };
      setCreatedGroup(created);
      setPromiseLinkSubmitting(true);
      setPromiseLinkResult(null);
      setPromiseLinkLocalFailure(false);

      let durablePending: PendingSavedGroupLink;
      try {
        durablePending = await markPendingSavedGroupCreated(
          user.id,
          pending,
          group
        );
        setPendingPromiseLink(durablePending);
      } catch {
        setPromiseLinkLocalFailure(true);
        trackProductOperation({
          area: 'accountability',
          authority: 'client',
          operation: 'link_accountability',
          outcome: 'failed',
          phase: 'recovery',
          source: 'groups',
        });
        void emitHaptic({ type: 'failed', operation: 'save' });
        setPromiseLinkSubmitting(false);
        return;
      }

      const request = {
        ...durablePending.request,
        groupId: group.id,
      };
      trackProductOperation({
        area: 'accountability',
        authority: 'server',
        operation: 'link_accountability',
        outcome: 'started',
        phase: interaction === 'recovery' ? 'reconciliation' : 'intent',
        source: 'groups',
      });
      try {
        const result = await attachPromiseToSavedGroup(request);
        setPromiseLinkResult(result);
        if (result.outcome === 'confirmed') {
          trackProductOperation({
            area: 'accountability',
            authority: 'server',
            operation: 'link_accountability',
            outcome: interaction === 'recovery' ? 'recovered' : 'confirmed',
            phase: interaction === 'recovery' ? 'recovery' : 'authority',
            source: 'groups',
          });
          await clearPendingSavedGroupLink(user.id).catch(() => undefined);
          setPendingPromiseLink(null);
          void emitConfirmedOutcome(
            'promise-joined',
            createConfirmedReceipt('promise-membership', result.receipt.id)
          );
          AccessibilityInfo.announceForAccessibility?.(
            t('groups.create.promise_link.confirmed_accessibility', {
              group: result.receipt.groupName,
            })
          );
          return;
        }

        if (result.outcome === 'failed') {
          trackProductOperation({
            area: 'accountability',
            authority: 'server',
            operation: 'link_accountability',
            outcome: 'failed',
            phase: 'authority',
            source: 'groups',
          });
          void emitHaptic({ type: 'failed', operation: 'join' });
          return;
        }

        trackProductOperation({
          area: 'accountability',
          authority: 'server',
          operation: 'link_accountability',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'groups',
        });
      } finally {
        setPromiseLinkSubmitting(false);
      }
    },
    [pendingPromiseLink, t, user?.id]
  );

  const submit = async () => {
    if (submittingRef.current) return;

    const analyticsSource = hasOnboardingSource ? 'onboarding' : 'groups';
    trackProductOperation({
      area: 'group',
      authority: 'client',
      operation: 'create_group',
      outcome: 'started',
      phase: 'intent',
      source: analyticsSource,
    });

    if (!user?.id) {
      trackProductOperation({
        area: 'group',
        authority: 'client',
        operation: 'create_group',
        outcome: 'blocked',
        phase: 'eligibility',
        source: analyticsSource,
      });
      setCreationError({
        title: t('groups.create.sign_in_title'),
        message: t('groups.create.sign_in_detail'),
      });
      return;
    }

    if (hasOnboardingSource && !onboardingFirstPromiseId) {
      trackProductOperation({
        area: 'group',
        authority: 'client',
        operation: 'create_group',
        outcome: 'blocked',
        phase: 'eligibility',
        source: analyticsSource,
      });
      setCreationError({
        title: t('groups.create.promise_unavailable_title'),
        message: t('groups.create.promise_unavailable_detail'),
      });
      return;
    }

    if (hasPromiseAccountabilitySource && !pendingPromiseLink) {
      trackProductOperation({
        area: 'accountability',
        authority: 'client',
        operation: 'link_accountability',
        outcome: 'blocked',
        phase: 'recovery',
        source: 'groups',
      });
      setCreationError({
        title: t('groups.create.promise_link.missing_context_title'),
        message: t('groups.create.promise_link.missing_context_detail'),
      });
      return;
    }

    const trimmedName = groupName.trim();
    if (trimmedName.length < 3) {
      trackProductOperation({
        area: 'group',
        authority: 'client',
        operation: 'create_group',
        outcome: 'ineligible',
        phase: 'eligibility',
        source: analyticsSource,
      });
      setCreationError({
        title: t('groups.create.name_heading'),
        message: t('groups.create.name_short_detail'),
      });
      setCurrentStep(0);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setCreationError(null);
    setCreationRecoveryState('none');
    try {
      if (hasOnboardingSource && onboardingFirstPromiseId) {
        setShowCreationStatusSheet(true);
        const linked = await createOnboardingGroupWithFirstPromise({
          first_promise_id: onboardingFirstPromiseId,
          name: trimmedName,
          description: t('groups.create.default_description'),
          owner_id: user.id,
          privacy,
          notify_on_member_miss: memberNudges,
          image_preset: imagePreset,
        });
        if (draftKey) await AsyncStorage.removeItem(draftKey);
        setShowCreationStatusSheet(false);
        setCreatedGroup({
          id: linked.group.id,
          name: linked.group.name || trimmedName,
          isFirstGroup: linked.receipt.economy.cost === 0,
          linkedFirstPromise: {
            id: linked.receipt.firstPromise.id,
            title: linked.receipt.firstPromise.title,
            durationDays: linked.receipt.group.durationDays,
          },
        });
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'confirmed',
          phase: 'authority',
          source: analyticsSource,
        });
        AccessibilityInfo.announceForAccessibility?.(
          `Group created. ${linked.group.name || trimmedName} now includes ${linked.receipt.firstPromise.title}.`
        );
        void emitConfirmedSuccess(
          createConfirmedReceipt(
            'generic',
            `onboarding-group-linked:${linked.group.id}:${linked.receipt.firstPromise.id}`
          )
        );
        return;
      }

      let cost: number;
      try {
        cost = await getCreateGroupCost(user.id);
        setEffectiveCreateCost(cost);
      } catch {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'unknown',
          phase: 'eligibility',
          source: analyticsSource,
        });
        setCreationError({
          title: t('groups.create.cost_unknown_title'),
          message: t('groups.create.cost_unknown_detail'),
        });
        return;
      }

      const cooldown = await checkUserCooldown(user.id);
      if (cooldown.inCooldown) {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'ineligible',
          phase: 'eligibility',
          source: analyticsSource,
        });
        setCreationError({
          title: t('groups.create.paused_title'),
          message: cooldown.groupName
            ? t('groups.create.cooldown_detail_group', {
                group: cooldown.groupName,
              })
            : t('groups.create.cooldown_detail'),
        });
        return;
      }

      const gate = await gateCreate(userGroupCount, 'max_active_groups');
      if (!gate.allowed) {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'ineligible',
          phase: 'eligibility',
          source: analyticsSource,
        });
        setPaywallVariant('quota');
        setQuotaLimit(gate.limit);
        setCreationError({
          title: t('groups.create.limit_title'),
          message: t('groups.create.limit_detail'),
        });
        setPaywallVisible(true);
        return;
      }

      await fetchBalance(user.id);
      const currentBalance = useMomentaStore.getState().balance;
      if (cost > currentBalance) {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'ineligible',
          phase: 'eligibility',
          source: analyticsSource,
        });
        setCostConfirmation(null);
        setPaywallVariant('insufficient');
        setQuotaLimit(undefined);
        setCreationError({
          title: t('groups.create.momenta_title'),
          message: t('groups.create.momenta_detail', {
            cost: cost.toLocaleString(),
            balance: currentBalance.toLocaleString(),
          }),
        });
        setPaywallVisible(true);
        return;
      }

      if (
        cost > 0 &&
        (costConfirmation?.cost !== cost ||
          costConfirmation.balance !== currentBalance)
      ) {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'pending',
          phase: 'eligibility',
          source: analyticsSource,
        });
        setCostConfirmation({ cost, balance: currentBalance });
        setCreationError({
          title: t('groups.create.spend_question', {
            cost: cost.toLocaleString(),
          }),
          message: t('groups.create.spend_detail', {
            cost: cost.toLocaleString(),
            balance: (currentBalance - cost).toLocaleString(),
          }),
        });
        AccessibilityInfo.announceForAccessibility?.(
          t('groups.create.spend_accessibility', {
            cost: cost.toLocaleString(),
            balance: (currentBalance - cost).toLocaleString(),
          })
        );
        return;
      }

      setCostConfirmation(null);

      setShowCreationStatusSheet(true);
      const wasFirstGroup = cost === 0;
      const group = await createGroupWithPayment({
        name: trimmedName,
        description:
          selectedParamTemplate?.description ??
          describeCreatedGroup(duration, t),
        owner_id: user.id,
        duration_days: duration,
        cost,
        privacy,
        notify_on_member_miss: memberNudges,
        image_preset: imagePreset,
      });
      if (draftKey) await AsyncStorage.removeItem(draftKey);
      setShowCreationStatusSheet(false);
      setCreationRecoveryState('none');
      const created = {
        id: group.id,
        name: group.name || trimmedName,
        isFirstGroup: wasFirstGroup,
      };
      trackProductOperation({
        area: 'group',
        authority: 'server',
        operation: 'create_group',
        outcome: 'confirmed',
        phase: 'authority',
        source: analyticsSource,
      });
      trackMetaAdsCreateGroup();
      if (hasPromiseAccountabilitySource && pendingPromiseLink) {
        await linkCreatedGroupToPromise(
          { id: created.id, name: created.name },
          created.isFirstGroup,
          pendingPromiseLink
        );
        return;
      }
      setCreatedGroup(created);
      AccessibilityInfo.announceForAccessibility?.(
        t('groups.create.created_accessibility', {
          group: group.name || trimmedName,
        })
      );
      void emitConfirmedSuccess(
        createConfirmedReceipt('generic', `group-created:${group.id}`)
      );
    } catch (error) {
      if (isSavedGroupCreationUnknownError(error)) {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: analyticsSource,
        });
        setCreationRecoveryState('unknown');
        setCreationError({
          title: t('groups.source.accountability.status_needs_checking'),
          message: error.message,
        });
        setShowCreationStatusSheet(true);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : t('groups.create.not_created_detail');
      trackProductOperation({
        area: 'group',
        authority: 'server',
        operation: 'create_group',
        outcome: 'failed',
        phase: 'authority',
        source: analyticsSource,
      });
      const title =
        error instanceof SavedGroupCreationFailureError
          ? error.code === 'INSUFFICIENT_BALANCE'
            ? t('groups.create.momenta_title')
            : error.code === 'GROUP_CREATION_COOLDOWN'
              ? t('groups.create.paused_title')
              : error.code === 'QUOTA_ACTIVE_GROUPS' ||
                  error.code === 'QUOTA_GROUPS_MONTH'
                ? t('groups.create.limit_title')
                : t('groups.create.not_created_title')
          : t('groups.create.not_created_title');
      setCreationRecoveryState('none');
      setCreationError({
        title,
        message,
      });
      setShowCreationStatusSheet(true);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCheckCreationStatus = async () => {
    if (isSubmitting || submittingRef.current || !user?.id) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setCreationRecoveryState('checking');
    setCreationError({
      title: t('groups.source.accountability.checking_group'),
      message: t('groups.source.accountability.checking_group_detail'),
    });
    setShowCreationStatusSheet(true);
    trackProductOperation({
      area: 'group',
      authority: 'server',
      operation: 'create_group',
      outcome: 'started',
      phase: 'reconciliation',
      source: hasOnboardingSource ? 'onboarding' : 'groups',
    });

    try {
      const recovery = await reconcilePendingGroupCreation(user.id);
      if (recovery.kind === 'confirmed') {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'recovered',
          phase: 'recovery',
          source: hasOnboardingSource ? 'onboarding' : 'groups',
        });
        if (draftKey) await AsyncStorage.removeItem(draftKey);
        setCreationRecoveryState('none');
        setShowCreationStatusSheet(false);
        const created = {
          id: recovery.group.id,
          name: recovery.group.name || groupName.trim(),
          isFirstGroup: recovery.receipt.debitAmount === 0,
        };
        if (hasPromiseAccountabilitySource && pendingPromiseLink) {
          await linkCreatedGroupToPromise(
            { id: created.id, name: created.name },
            created.isFirstGroup,
            pendingPromiseLink
          );
          return;
        }
        setCreatedGroup(created);
        AccessibilityInfo.announceForAccessibility?.(
          `Group confirmed. ${recovery.group.name || groupName.trim()} is ready.`
        );
        void emitConfirmedSuccess(
          createConfirmedReceipt(
            'generic',
            `group-created:${recovery.group.id}`
          )
        );
        return;
      }

      if (recovery.kind === 'safe-to-retry') {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'safe_to_retry',
          phase: 'recovery',
          source: hasOnboardingSource ? 'onboarding' : 'groups',
        });
        setCreationRecoveryState('safe-to-retry');
        setCreationError({
          title: t('groups.source.accountability.nothing_created_or_spent'),
          message: recovery.message,
        });
        return;
      }

      if (recovery.kind === 'pending') {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: hasOnboardingSource ? 'onboarding' : 'groups',
        });
        setCreationRecoveryState('unknown');
        setCreationError({
          title: t('groups.source.accountability.still_checking_group'),
          message: recovery.message,
        });
        return;
      }

      if (recovery.kind === 'failed') {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'failed',
          phase: 'reconciliation',
          source: hasOnboardingSource ? 'onboarding' : 'groups',
        });
        setCreationRecoveryState('none');
        setCreationError({
          title: t('groups.create.not_created_title'),
          message: recovery.message,
        });
        return;
      }

      setCreationRecoveryState('none');
      setCreationError({
        title: t('groups.source.accountability.no_saved_request_title'),
        message: t('groups.source.accountability.no_saved_request_detail'),
      });
    } catch (error) {
      trackProductOperation({
        area: 'group',
        authority: 'server',
        operation: 'create_group',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: hasOnboardingSource ? 'onboarding' : 'groups',
      });
      setCreationRecoveryState('unknown');
      setCreationError({
        title: t('groups.source.accountability.check_unavailable_title'),
        message:
          error instanceof Error
            ? error.message
            : t('groups.source.accountability.check_unavailable_detail'),
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleFinishRecoveredCreation = async () => {
    if (isSubmitting || submittingRef.current || !user?.id) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setCreationRecoveryState('none');
    setCreationError(null);
    setShowCreationStatusSheet(true);
    trackProductOperation({
      area: 'group',
      authority: 'server',
      operation: 'create_group',
      outcome: 'started',
      phase: 'recovery',
      source: hasOnboardingSource ? 'onboarding' : 'groups',
    });

    try {
      const group = await resumePendingGroupCreation(user.id);
      if (draftKey) await AsyncStorage.removeItem(draftKey);
      setShowCreationStatusSheet(false);
      const created = {
        id: group.id,
        name: group.name || groupName.trim(),
        isFirstGroup: effectiveCreateCost === 0,
      };
      trackProductOperation({
        area: 'group',
        authority: 'server',
        operation: 'create_group',
        outcome: 'recovered',
        phase: 'recovery',
        source: hasOnboardingSource ? 'onboarding' : 'groups',
      });
      trackMetaAdsCreateGroup();
      if (hasPromiseAccountabilitySource && pendingPromiseLink) {
        await linkCreatedGroupToPromise(
          { id: created.id, name: created.name },
          created.isFirstGroup,
          pendingPromiseLink
        );
        return;
      }
      setCreatedGroup(created);
      AccessibilityInfo.announceForAccessibility?.(
        `Group created. ${group.name || groupName.trim()} is ready.`
      );
      void emitConfirmedSuccess(
        createConfirmedReceipt('generic', `group-created:${group.id}`)
      );
    } catch (error) {
      if (isSavedGroupCreationUnknownError(error)) {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: hasOnboardingSource ? 'onboarding' : 'groups',
        });
        setCreationRecoveryState('unknown');
        setCreationError({
          title: t('groups.source.accountability.status_needs_checking'),
          message: error.message,
        });
      } else {
        trackProductOperation({
          area: 'group',
          authority: 'server',
          operation: 'create_group',
          outcome: 'failed',
          phase: 'recovery',
          source: hasOnboardingSource ? 'onboarding' : 'groups',
        });
        setCreationRecoveryState('none');
        setCreationError({
          title: t('groups.create.not_created_title'),
          message:
            error instanceof Error
              ? error.message
              : t('groups.create.not_created_detail'),
        });
      }
      setShowCreationStatusSheet(true);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleKeepDraft = () => {
    if (isSubmitting || submittingRef.current) return;
    setShowCreationStatusSheet(false);
  };

  const handleRetryCreateGroup = () => {
    if (isSubmitting || submittingRef.current) return;
    setShowCreationStatusSheet(false);
    void submit();
  };

  const handleReviewAfterRecovery = async () => {
    if (isSubmitting || submittingRef.current || !user?.id) return;
    try {
      if (creationRecoveryState === 'safe-to-retry') {
        await clearPendingGroupCreation(user.id);
      }
    } catch {
      setCreationError({
        title: t('groups.source.accountability.reopen_draft_title'),
        message: t('groups.source.accountability.reopen_draft_detail'),
      });
      return;
    }
    setCreationRecoveryState('none');
    setCreationError(null);
    setShowCreationStatusSheet(false);
  };

  const openCreatedGroup = React.useCallback(() => {
    if (!createdGroup) return;
    // Creation is presented as a modal. Dismiss to the confirmed destination
    // so the emptied wizard cannot remain underneath and swallow navigation.
    router.dismissTo({
      pathname: '/groups/[id]',
      params: {
        id: createdGroup.id,
        created: '1',
      },
    } as never);
  }, [createdGroup, router]);

  const addFirstPromise = React.useCallback(() => {
    if (!createdGroup) return;
    router.dismissTo(
      buildCreateChallengeHref({
        mode: 'group',
        source: 'group_detail',
        groupId: createdGroup.id,
        // The starting point the person picked has to reach the first promise.
        // Without this the picker only renamed the group and every promise fact
        // came back blank.
        templateId: selectedParamTemplate?.id,
      })
    );
  }, [createdGroup, router, selectedParamTemplate?.id]);

  const invitePeople = React.useCallback(() => {
    if (!createdGroup) return;
    router.dismissTo({
      pathname: '/group-invite',
      params: { groupId: createdGroup.id, groupName: createdGroup.name },
    } as never);
  }, [createdGroup, router]);

  const goToToday = React.useCallback(() => {
    router.dismissTo('/(tabs)' as never);
  }, [router]);

  const retryCreatedGroupPromiseLink = React.useCallback(() => {
    if (
      !createdGroup ||
      !pendingPromiseLink ||
      promiseLinkSubmitting ||
      promiseLinkResult?.outcome !== 'unknown'
    ) {
      return;
    }
    void linkCreatedGroupToPromise(
      { id: createdGroup.id, name: createdGroup.name },
      createdGroup.isFirstGroup,
      pendingPromiseLink,
      'recovery'
    );
  }, [
    createdGroup,
    linkCreatedGroupToPromise,
    pendingPromiseLink,
    promiseLinkResult?.outcome,
    promiseLinkSubmitting,
  ]);

  const returnToPromisePeople = React.useCallback(() => {
    const challengeId =
      pendingPromiseLink?.request.challengeId ??
      (promiseLinkResult?.outcome === 'confirmed'
        ? promiseLinkResult.receipt.challengeId
        : null);
    if (!challengeId) {
      openCreatedGroup();
      return;
    }
    router.dismissTo({
      pathname: '/promise-accountability',
      params: { challengeId, source: 'promise' },
    } as never);
  }, [openCreatedGroup, pendingPromiseLink, promiseLinkResult, router]);

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <View style={styles.stepStack}>
          {selectedParamTemplate ? (
            <SelectedGroupStartingPoint
              description={selectedParamTemplate.description}
              onChange={() => setShowGroupShapes(true)}
              title={selectedParamTemplate.title}
            />
          ) : null}
          <View style={styles.fieldBlock}>
            <FieldHeader
              label={t('groups.create.group_name_label')}
              count={`${groupName.trim().length}/80`}
            />
            <TextInput
              accessibilityLabel={t('groups.create.group_name_accessibility')}
              testID="create-group-name-input"
              value={groupName}
              onChangeText={value => {
                setGroupName(value);
                if (creationError) setCreationError(null);
              }}
              placeholder={t('groups.create.group_name_placeholder')}
              placeholderTextColor={theme.colors.text.placeholder}
              style={styles.compactInput}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={goNext}
              editable={!isSubmitting}
              maxLength={80}
            />
            <Text style={styles.fieldHelper}>
              {t('groups.create.name_help')}
            </Text>
          </View>
          <View style={styles.imagePresetField}>
            <Text style={styles.fieldLabel}>{t('groups.create.image')}</Text>
            <View
              accessibilityRole="radiogroup"
              style={styles.imagePresetGrid}
              testID="group-image-preset-picker"
            >
              {GROUP_IMAGE_PRESETS.map(preset => {
                const selected = imagePreset === preset.key;
                return (
                  <Pressable
                    key={preset.key}
                    accessibilityRole="radio"
                    accessibilityLabel={
                      preset.key === 'move'
                        ? t('groups.create.walking')
                        : preset.key === 'focus'
                          ? t('groups.create.study')
                          : preset.key === 'reset'
                            ? t('groups.create.reset')
                            : t('groups.create.creative')
                    }
                    accessibilityHint={
                      preset.key === 'move'
                        ? t('groups.source.image_move_description')
                        : preset.key === 'focus'
                          ? t('groups.source.image_focus_description')
                          : preset.key === 'reset'
                            ? t('groups.source.image_reset_description')
                            : t('groups.source.image_create_description')
                    }
                    accessibilityState={{
                      checked: selected,
                      selected,
                      disabled: isSubmitting,
                    }}
                    disabled={isSubmitting}
                    onPress={() => setImagePreset(preset.key)}
                    style={({ pressed }) => [
                      styles.imagePresetOption,
                      selected && styles.imagePresetOptionSelected,
                      pressed && styles.pressed,
                    ]}
                    testID={`group-image-preset-${preset.key}`}
                  >
                    <Image
                      accessibilityIgnoresInvertColors
                      source={preset.source}
                      style={styles.imagePresetThumbnail}
                    />
                    <View style={styles.imagePresetLabelRow}>
                      <Text style={styles.imagePresetLabel}>
                        {preset.key === 'move'
                          ? t('groups.create.walking')
                          : preset.key === 'focus'
                            ? t('groups.create.study')
                            : preset.key === 'reset'
                              ? t('groups.create.reset')
                              : t('groups.create.creative')}
                      </Text>
                      {selected ? (
                        <CheckIcon
                          size={16}
                          color={theme.colors.accent.primary}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.fieldHelper}>
              {t('groups.create.image_help')}
            </Text>
          </View>
        </View>
      );
    }

    if (currentStep === 1) {
      return (
        <View style={styles.stepStack}>
          <View style={styles.choiceStack}>
            {privacyOptions.map(option => (
              <ChoiceRow
                key={option.id}
                title={
                  option.id === 'public'
                    ? t('groups.create.public_label')
                    : t('groups.create.private_label')
                }
                body={
                  option.id === 'public'
                    ? t('groups.create.public_note')
                    : t('groups.create.private_note')
                }
                icon={option.icon}
                selected={privacy === option.id}
                disabled={isSubmitting}
                onPress={() => setPrivacy(option.id)}
              />
            ))}
          </View>

          <Text style={styles.stepNote}>{GROUP_SAFETY_DISCLOSURE}</Text>

          <View style={styles.nudgeRow}>
            <View style={styles.nudgeCopy}>
              <Text style={styles.inlineRowTitle}>
                {t('groups.create.review_reminders')}
              </Text>
              <Text style={styles.inlineRowMeta}>
                {t('groups.create.reminders_detail')}
              </Text>
            </View>
            <Switch
              value={memberNudges}
              onValueChange={setMemberNudges}
              disabled={isSubmitting}
              trackColor={{
                false: mentaColors.raised,
                true: theme.colors.accent.primary,
              }}
              thumbColor={theme.colors.text.primary}
              ios_backgroundColor={mentaColors.raised}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepStack}>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>
            {groupName.trim() || t('groups.create.your_group')}
          </Text>
          <View style={styles.reviewRows}>
            <ReviewDetailRow
              label={t('groups.create.image')}
              value={
                imagePreset === 'move'
                  ? t('groups.create.walking')
                  : imagePreset === 'focus'
                    ? t('groups.create.study')
                    : imagePreset === 'reset'
                      ? t('groups.create.reset')
                      : t('groups.create.creative')
              }
              onChange={() => setCurrentStep(0)}
            />
            <ReviewDetailRow
              label={t('groups.admin.who_join')}
              value={
                privacy === 'private'
                  ? t('groups.create.private_label')
                  : t('groups.create.public_label')
              }
              onChange={() => setCurrentStep(1)}
            />
            <ReviewDetailRow
              label={t('groups.create.review_reminders')}
              value={
                memberNudges ? t('groups.create.on') : t('groups.create.off')
              }
              onChange={() => setCurrentStep(1)}
            />
            <ReviewDetailRow
              label={t('groups.create.creation_cost')}
              value={
                effectiveCreateCost === null
                  ? t('groups.create.checking_cost')
                  : effectiveCreateCost > 0
                    ? `${effectiveCreateCost.toLocaleString()} Momenta`
                    : t('groups.create.free')
              }
            />
          </View>
        </View>
        <Text style={styles.reviewOutcome}>
          {t('groups.create.review_outcome')}
        </Text>
        <Text style={styles.draftSaved}>{t('groups.create.draft_saved')}</Text>
      </View>
    );
  };

  const isCheckingCreation =
    showCreationStatusSheet &&
    isSubmitting &&
    creationRecoveryState === 'checking';
  const isCreating =
    showCreationStatusSheet && isSubmitting && !isCheckingCreation;
  const creationNeedsStatus =
    showCreationStatusSheet &&
    !isSubmitting &&
    creationRecoveryState === 'unknown';
  const creationSafeToRetry =
    showCreationStatusSheet &&
    !isSubmitting &&
    creationRecoveryState === 'safe-to-retry';
  const creationFailed =
    showCreationStatusSheet &&
    !isSubmitting &&
    creationRecoveryState === 'none';
  const progressIndex =
    isRestoringDraft ||
    createdGroup ||
    isCreating ||
    isCheckingCreation ||
    creationNeedsStatus ||
    creationSafeToRetry ||
    creationFailed
      ? steps.length - 1
      : currentStep;

  const handleHeaderBack = () => {
    if (createdGroup) {
      openCreatedGroup();
      return;
    }
    if (creationNeedsStatus) {
      handleCloseCreateGroup();
      return;
    }
    if (creationSafeToRetry) {
      void handleReviewAfterRecovery();
      return;
    }
    if (creationFailed) {
      handleKeepDraft();
      return;
    }
    goBack();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <View
            style={[styles.header, { maxWidth: taskFrameWidth }]}
            testID="create-group-task-frame"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.create.back_from_creation')}
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleHeaderBack}
              style={({ pressed }) => [
                styles.iconButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeftIcon size={18} color={theme.colors.text.primary} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.headerTitle}>
                {t('groups.create.create_group')}
              </Text>
            </View>
          </View>

          <View style={[styles.progressBlock, { maxWidth: taskFrameWidth }]}>
            <Text style={styles.progressLabel}>
              {t('groups.create.step', {
                current: progressIndex + 1,
                total: steps.length,
              })}
            </Text>
            <AppStepProgress
              decorative
              progress={(progressIndex + 1) / steps.length}
              testID="create-group-progress"
            />
          </View>

          <ScrollView
            contentContainerStyle={[styles.body, { maxWidth: taskFrameWidth }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.bodyScroll}
            testID="create-group-body-scroll"
          >
            {isRestoringDraft ? (
              <View
                accessible
                style={styles.stateContent}
                accessibilityLabel={t('groups.create.restoring_draft')}
                accessibilityRole="progressbar"
              >
                <SkeletonLoader
                  announce={false}
                  width={266}
                  height={34}
                  borderRadius={12}
                />
                <SkeletonLoader
                  announce={false}
                  height={56}
                  borderRadius={mentaRadii.medium}
                />
                <SkeletonText
                  announce={false}
                  lines={1}
                  width={218}
                  style={styles.skeletonHelper}
                />
                <View style={styles.restoringRow}>
                  <Text style={styles.stateSupportingTitle}>
                    {t('groups.create.restoring_draft')}
                  </Text>
                </View>
                <Text style={styles.stateBody}>
                  {t('groups.create.nothing_created')}
                </Text>
              </View>
            ) : createdGroup &&
              hasPromiseAccountabilitySource &&
              promiseLinkResult?.outcome === 'confirmed' ? (
              <FirstGroupCreatedReceipt
                groupName={createdGroup.name}
                linkedPromiseTitle={promiseLinkResult.receipt.challengeTitle}
                showActions={false}
              />
            ) : createdGroup && hasPromiseAccountabilitySource ? (
              <View
                accessibilityLiveRegion={
                  promiseLinkSubmitting ? 'polite' : 'assertive'
                }
                accessibilityRole={
                  promiseLinkSubmitting ? 'progressbar' : undefined
                }
                style={[styles.stateContent, styles.failureContent]}
                testID={
                  promiseLinkSubmitting
                    ? 'created-group-promise-linking'
                    : promiseLinkResult?.outcome === 'unknown'
                      ? 'created-group-promise-link-unknown'
                      : 'created-group-promise-link-failed'
                }
              >
                <View
                  style={
                    promiseLinkResult?.outcome === 'failed' ||
                    promiseLinkLocalFailure
                      ? styles.failureIcon
                      : styles.recoveryIcon
                  }
                >
                  {promiseLinkResult?.outcome === 'failed' ||
                  promiseLinkLocalFailure ? (
                    <XIcon size={22} color={theme.colors.status.error} />
                  ) : (
                    <ClockIcon size={22} color={mentaColors.warning} />
                  )}
                </View>
                <View style={styles.receiptCopy}>
                  <Text style={styles.receiptTitle}>
                    {promiseLinkSubmitting
                      ? t('groups.create.promise_link.linking_title')
                      : promiseLinkResult?.outcome === 'unknown'
                        ? t('groups.create.promise_link.unknown_title')
                        : t('groups.create.promise_link.failed_title')}
                  </Text>
                  <Text style={styles.receiptBody}>
                    {promiseLinkSubmitting
                      ? t('groups.create.promise_link.linking_detail', {
                          group: createdGroup.name,
                        })
                      : promiseLinkResult?.outcome === 'unknown'
                        ? t('groups.create.promise_link.unknown_detail', {
                            group: createdGroup.name,
                          })
                        : t('groups.create.promise_link.failed_detail', {
                            group: createdGroup.name,
                          })}
                  </Text>
                </View>
              </View>
            ) : createdGroup?.isFirstGroup ||
              createdGroup?.linkedFirstPromise ? (
              <FirstGroupCreatedReceipt
                groupName={createdGroup.name}
                linkedPromiseTitle={createdGroup.linkedFirstPromise?.title}
                linkedPromiseDurationDays={
                  createdGroup.linkedFirstPromise?.durationDays
                }
                showActions={false}
              />
            ) : createdGroup ? (
              <View
                style={[styles.stateContent, styles.receiptContent]}
                accessibilityLabel={t('groups.create.created_accessibility', {
                  group: createdGroup.name,
                })}
              >
                <MentaMascot
                  state="celebration"
                  size="lg"
                  style={styles.receiptMascot}
                  testID="group-created-mascot"
                />
                <View style={styles.receiptCopy}>
                  <Text style={styles.receiptTitle}>
                    {t('groups.create.ready', { group: createdGroup.name })}
                  </Text>
                  <Text style={styles.receiptBody}>
                    {t('groups.create.add_then_invite')}
                  </Text>
                </View>
              </View>
            ) : isCheckingCreation ? (
              <View
                accessible
                style={styles.stateContent}
                accessibilityLabel={t(
                  'groups.source.accountability.checking_creation_accessibility'
                )}
                accessibilityRole="progressbar"
                testID="create-group-status-checking"
              >
                <View style={styles.recoveryIcon}>
                  <ClockIcon size={22} color={mentaColors.warning} />
                </View>
                <View style={styles.receiptCopy}>
                  <Text style={styles.receiptTitle}>
                    {t('groups.source.accountability.checking_group')}
                  </Text>
                  <Text style={styles.receiptBody}>
                    {t('groups.source.accountability.status_check_safe_detail')}
                  </Text>
                </View>
              </View>
            ) : isCreating ? (
              <View
                accessible
                style={styles.stateContent}
                accessibilityLabel={t('groups.create.creating', {
                  group: groupName.trim() || t('groups.create.your_group'),
                })}
                accessibilityRole="progressbar"
                testID="create-group-status-screen"
              >
                <View style={styles.creatingPreview}>
                  <SkeletonLoader
                    announce={false}
                    width={52}
                    height={52}
                    borderRadius={mentaRadii.large}
                  />
                  <View style={styles.creatingPreviewCopy}>
                    <SkeletonLoader
                      announce={false}
                      width={168}
                      height={18}
                      borderRadius={mentaRadii.small}
                    />
                    <SkeletonLoader
                      announce={false}
                      width={118}
                      height={12}
                      borderRadius={mentaRadii.small}
                    />
                  </View>
                </View>
                <Text style={styles.stateSupportingTitle}>
                  {t('groups.create.creating', {
                    group: groupName.trim() || t('groups.create.your_group'),
                  })}
                  …
                </Text>
                <Text style={styles.stateBody}>
                  {t('groups.create.creating_detail')}
                </Text>
              </View>
            ) : creationNeedsStatus || creationSafeToRetry ? (
              <View
                style={[styles.stateContent, styles.failureContent]}
                accessibilityLiveRegion="polite"
                testID="create-group-recovery-screen"
              >
                <View style={styles.recoveryIcon}>
                  <ClockIcon size={22} color={mentaColors.warning} />
                </View>
                <View style={styles.receiptCopy}>
                  <Text style={styles.receiptTitle}>
                    {creationSafeToRetry
                      ? t(
                          'groups.source.accountability.nothing_created_or_spent'
                        )
                      : t(
                          'groups.source.accountability.check_before_creating_again'
                        )}
                  </Text>
                  <Text style={styles.receiptBody}>
                    {t('groups.source.accountability.recovery_details_saved')}
                  </Text>
                </View>
                {creationError ? (
                  <AppInlineNotice
                    title={creationError.title}
                    description={creationError.message}
                    tone={creationSafeToRetry ? 'success' : 'warning'}
                  />
                ) : null}
                <Text style={styles.draftSaved}>
                  {t('groups.create.draft_saved')}
                </Text>
              </View>
            ) : creationFailed ? (
              <View
                style={[styles.stateContent, styles.failureContent]}
                accessibilityLiveRegion="assertive"
                testID="create-group-failure-screen"
              >
                <View style={styles.failureIcon}>
                  <XIcon size={22} color={theme.colors.status.error} />
                </View>
                <View style={styles.receiptCopy}>
                  <Text style={styles.receiptTitle}>
                    {t('groups.create.not_created_title')}
                  </Text>
                  <Text style={styles.receiptBody}>
                    {t('groups.create.entries_saved')}
                  </Text>
                </View>
                {creationError ? (
                  <AppInlineNotice
                    title={creationError.title}
                    description={creationError.message}
                    tone="error"
                  />
                ) : null}
                <Text style={styles.draftSaved}>
                  {t('groups.create.draft_saved')}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.copyBlock}>
                  <Text style={styles.stepTitle}>{activeStep.title}</Text>
                </View>

                {creationError ? (
                  <View style={styles.creationError}>
                    <AppInlineNotice
                      title={creationError.title}
                      description={creationError.message}
                      tone="error"
                    />
                  </View>
                ) : isSubmitting && !showCreationStatusSheet ? (
                  <View style={styles.creationError}>
                    <AppInlineNotice
                      testID="create-group-preflight-notice"
                      title={t('groups.create.checking_limits')}
                      description={t('groups.create.limits_detail')}
                      tone="info"
                    />
                  </View>
                ) : null}

                <View style={styles.stage}>{renderStep()}</View>
              </>
            )}
          </ScrollView>

          <View
            style={[
              styles.footer,
              { maxWidth: taskFrameWidth },
              { paddingBottom: Math.max(insets.bottom, 28) },
            ]}
          >
            <AppButton
              accessibilityLabel={
                isRestoringDraft
                  ? t('groups.create.restoring_draft')
                  : createdGroup
                    ? hasPromiseAccountabilitySource
                      ? promiseLinkSubmitting
                        ? t('groups.create.promise_link.linking_button')
                        : promiseLinkResult?.outcome === 'confirmed'
                          ? t('groups.create.invite_people')
                          : promiseLinkResult?.outcome === 'unknown'
                            ? t('groups.create.promise_link.check_again')
                            : t('groups.create.open_group')
                      : createdGroup.linkedFirstPromise
                        ? t('groups.create.invite_people')
                        : t('groups.create.add_promise')
                    : isCheckingCreation
                      ? 'Checking group status'
                      : isCreating
                        ? t('groups.create.creating_label')
                        : creationNeedsStatus
                          ? 'Check group status'
                          : creationSafeToRetry
                            ? 'Finish creating group'
                            : creationFailed
                              ? t('groups.create.try_again')
                              : primaryCta
              }
              disabled={
                isRestoringDraft ||
                isCreating ||
                isCheckingCreation ||
                promiseLinkSubmitting ||
                (!isStepValid &&
                  !creationFailed &&
                  !creationNeedsStatus &&
                  !creationSafeToRetry)
              }
              fullWidth
              loading={
                isCreating || isCheckingCreation || promiseLinkSubmitting
              }
              onPress={
                createdGroup
                  ? hasPromiseAccountabilitySource
                    ? promiseLinkResult?.outcome === 'confirmed'
                      ? invitePeople
                      : promiseLinkResult?.outcome === 'unknown'
                        ? retryCreatedGroupPromiseLink
                        : openCreatedGroup
                    : createdGroup.linkedFirstPromise
                      ? invitePeople
                      : addFirstPromise
                  : creationNeedsStatus
                    ? () => void handleCheckCreationStatus()
                    : creationSafeToRetry
                      ? () => void handleFinishRecoveredCreation()
                      : creationFailed
                        ? handleRetryCreateGroup
                        : goNext
              }
              preserveLabelPositionOnLoading
              size="large"
              title={
                isRestoringDraft
                  ? t('groups.create.restoring_button')
                  : createdGroup
                    ? hasPromiseAccountabilitySource
                      ? promiseLinkSubmitting
                        ? t('groups.create.promise_link.linking_button')
                        : promiseLinkResult?.outcome === 'confirmed'
                          ? t('groups.create.invite_people')
                          : promiseLinkResult?.outcome === 'unknown'
                            ? t('groups.create.promise_link.check_again')
                            : t('groups.create.open_group')
                      : createdGroup.linkedFirstPromise
                        ? t('groups.create.invite_people')
                        : t('groups.create.add_promise')
                    : isCheckingCreation
                      ? 'Checking…'
                      : isCreating
                        ? t('groups.create.creating_button')
                        : creationNeedsStatus
                          ? 'Check group status'
                          : creationSafeToRetry
                            ? 'Finish creating group'
                            : creationFailed
                              ? t('groups.create.try_again')
                              : primaryCta
              }
              variant="accent"
            />

            {!isCreating &&
            !isCheckingCreation &&
            !isRestoringDraft &&
            !promiseLinkSubmitting ? (
              <AppButton
                fullWidth
                onPress={
                  createdGroup
                    ? hasPromiseAccountabilitySource
                      ? promiseLinkResult?.outcome === 'confirmed'
                        ? openCreatedGroup
                        : returnToPromisePeople
                      : createdGroup.linkedFirstPromise
                        ? goToToday
                        : openCreatedGroup
                    : creationNeedsStatus
                      ? handleCloseCreateGroup
                      : creationSafeToRetry
                        ? () => void handleReviewAfterRecovery()
                        : creationFailed
                          ? handleKeepDraft
                          : currentStep > 0
                            ? goBack
                            : handleCloseCreateGroup
                }
                size="small"
                title={
                  createdGroup
                    ? hasPromiseAccountabilitySource
                      ? promiseLinkResult?.outcome === 'confirmed'
                        ? t('groups.create.open_group')
                        : t('groups.create.promise_link.return_to_promise')
                      : createdGroup.linkedFirstPromise
                        ? t('groups.create.go_today')
                        : t('groups.create.open_group')
                    : creationNeedsStatus
                      ? 'Close for now'
                      : creationSafeToRetry || creationFailed
                        ? t('groups.create.review_group')
                        : currentStep > 0
                          ? t('groups.create.back')
                          : t('groups.create.exit_setup')
                }
                variant="ghost"
              />
            ) : (
              <View
                style={styles.secondaryButton}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onBuyPro={refreshAfterPurchase}
        onBuyCredits={() => {
          if (user?.id) void fetchBalance(user.id);
        }}
        context="group"
        variant={paywallVariant}
        quotaLimit={quotaLimit}
        quotaContext="group"
        shortfall={Math.max((effectiveCreateCost ?? 0) - balance, 0)}
        balance={balance}
        requiredAmount={effectiveCreateCost ?? undefined}
        onWatchAd={watchRewardedAd}
        adRewardAmount={adRewardAmount}
        onCheckProof={() => router.push('/review-queue' as never)}
      />
      <GroupTemplatePickerSheet
        visible={showGroupShapes && !createdGroup && !isRestoringDraft}
        onClose={() => setShowGroupShapes(false)}
        onSelect={(templateId: CommitmentTemplateId) => {
          setShowGroupShapes(false);
          router.replace({
            pathname: '/create-group',
            params: { templateId },
          });
        }}
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

/**
 * One independent choice, in the shared onboarding choice language: its own
 * raised row, with the violet edge, tint and check carrying the selection.
 */
const ChoiceRow: React.FC<{
  title: string;
  body: string;
  icon?: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}> = ({ title, body, icon, selected, disabled = false, onPress }) => (
  <AppOptionCard
    description={body}
    disabled={disabled}
    icon={icon}
    onPress={onPress}
    selected={selected}
    title={title}
  />
);

const ReviewDetailRow: React.FC<{
  label: string;
  value: string;
  onChange?: () => void;
}> = ({ label, value, onChange }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.reviewStatRow}>
      <View style={styles.reviewStatCopy}>
        <Text style={styles.reviewStatLabel}>{label}</Text>
        <Text style={styles.reviewStatValue}>{value}</Text>
      </View>
      {onChange ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.create.change_label', {
            label: label.toLowerCase(),
          })}
          onPress={onChange}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.reviewChange}>{t('groups.create.change')}</Text>
        </Pressable>
      ) : null}
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
    header: {
      width: '100%',
      alignSelf: 'center',
      minHeight: 52,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: mentaColors.canvas,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
    },
    headerCopy: {
      flex: 1,
      alignItems: 'flex-start',
      gap: 2,
    },
    headerTitle: {
      ...mentaTypography.control,
      color: theme.colors.text.primary,
    },
    progressBlock: {
      width: '100%',
      alignSelf: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: 12,
      paddingBottom: 14,
      backgroundColor: mentaColors.canvas,
    },
    progressLabel: {
      ...mentaTypography.bodySmallMedium,
      color: theme.colors.text.secondary,
    },
    bodyScroll: {
      flex: 1,
    },
    body: {
      flexGrow: 1,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: 8,
      paddingBottom: theme.spacing.md,
      gap: 24,
    },
    copyBlock: {
      gap: theme.spacing.sm,
    },
    stepTitle: {
      ...mentaHeadingRoles.step,
      color: theme.colors.text.primary,
    },
    stage: {
      flex: 1,
    },
    creationError: {
      marginTop: -theme.spacing.sm,
    },
    stepStack: {
      gap: 24,
    },
    compactInput: {
      height: 56,
      borderWidth: 1,
      borderColor: theme.colors.border.focus,
      borderRadius: mentaRadii.medium,
      paddingHorizontal: mentaSpacing[4],
      ...mentaTypography.body,
      color: theme.colors.text.primary,
      backgroundColor: mentaColors.raised,
    },
    inlineRowTitle: {
      ...mentaTypography.bodySemibold,
      color: theme.colors.text.primary,
    },
    inlineRowMeta: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.tertiary,
    },
    nudgeRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingVertical: 14,
    },
    nudgeCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    fieldBlock: {
      gap: theme.spacing.sm,
    },
    imagePresetField: {
      gap: theme.spacing.sm,
    },
    imagePresetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: mentaSpacing[3],
    },
    imagePresetOption: {
      flexBasis: '47%',
      flexGrow: 1,
      minWidth: 132,
      minHeight: 80,
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[3],
      padding: mentaSpacing[2],
      borderWidth: 1,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.medium,
      backgroundColor: mentaColors.surface,
    },
    imagePresetOptionSelected: {
      borderColor: theme.colors.accent.primary,
      backgroundColor: theme.colors.accent.background,
    },
    imagePresetThumbnail: {
      width: 56,
      height: 56,
      flexShrink: 0,
      borderRadius: mentaRadii.small,
    },
    imagePresetLabelRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: mentaSpacing[1],
    },
    imagePresetLabel: {
      color: theme.colors.text.primary,
      fontFamily: mentaFonts.inter.semibold,
      ...mentaTypeScale.body,
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
      color: theme.colors.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    fieldHelper: {
      ...mentaTypography.caption,
      color: theme.colors.text.secondary,
    },
    choiceStack: {
      gap: mentaSpacing[3],
    },
    stepNote: {
      color: theme.colors.text.tertiary,
      fontFamily: mentaFonts.inter.regular,
      ...mentaTypeScale.bodySmall,
    },
    reviewCard: {
      backgroundColor: 'transparent',
    },
    reviewTitle: {
      color: theme.colors.text.primary,
      fontFamily: mentaFonts.newsreader.medium,
      ...mentaTypeScale.title,
      marginBottom: mentaSpacing[4],
    },
    reviewRows: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    reviewStatRow: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    reviewStatCopy: {
      gap: 2,
    },
    reviewStatLabel: {
      color: theme.colors.text.tertiary,
      fontFamily: mentaFonts.inter.regular,
      ...mentaTypeScale.bodySmall,
    },
    reviewStatValue: {
      color: theme.colors.text.primary,
      fontFamily: mentaFonts.inter.medium,
      ...mentaTypeScale.body,
    },
    reviewChange: {
      color: theme.colors.accent.primary,
      fontFamily: mentaFonts.inter.semibold,
      ...mentaTypeScale.bodySmall,
    },
    reviewOutcome: {
      color: theme.colors.text.secondary,
      fontFamily: mentaFonts.inter.regular,
      ...mentaTypeScale.body,
      maxWidth: mentaLayout.readingMeasure,
    },
    footer: {
      width: '100%',
      alignSelf: 'center',
      paddingTop: 12,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'column',
      gap: 10,
      backgroundColor: mentaColors.canvas,
    },
    secondaryButton: {
      width: '100%',
      height: mentaLayout.minimumTouchTarget,
    },
    disabled: {
      opacity: 0.38,
    },
    draftSaved: {
      ...mentaTypography.caption,
      color: theme.colors.status.success,
    },
    stateContent: {
      flex: 1,
      gap: 20,
      paddingTop: 10,
    },
    receiptContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
    },
    receiptMascot: {
      width: 142,
      height: 142,
    },
    receiptCopy: {
      gap: 8,
    },
    receiptTitle: {
      ...mentaHeadingRoles.result,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    receiptBody: {
      ...mentaTypography.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    failureContent: {
      justifyContent: 'center',
    },
    failureIcon: {
      width: 58,
      height: 58,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      borderColor: mentaColors.danger,
      backgroundColor: mentaColors.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recoveryIcon: {
      width: 58,
      height: 58,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      borderColor: mentaColors.warning,
      backgroundColor: mentaColors.warningSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    restoringRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 22,
    },
    stateSupportingTitle: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.primary,
    },
    stateBody: {
      ...mentaTypography.caption,
      color: theme.colors.text.secondary,
    },
    creatingPreview: {
      alignItems: 'center',
      borderBottomColor: mentaColors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: mentaSpacing[3],
      minHeight: 76,
      paddingBottom: mentaSpacing[4],
    },
    creatingPreviewCopy: {
      flex: 1,
      gap: mentaSpacing[2],
    },
    skeletonHelper: {
      width: 218,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
  });
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const privacyOptions: {
    id: PrivacyOption;
    labelKey: 'groups.create.public_label' | 'groups.create.private_label';
    noteKey: 'groups.create.public_note' | 'groups.create.private_note';
    icon: React.ReactNode;
  }[] = [
    {
      id: 'public',
      labelKey: 'groups.create.public_label',
      noteKey: 'groups.create.public_note',
      icon: <GlobeIcon size={20} color={mentaColors.text.primary} />,
    },
    {
      id: 'private',
      labelKey: 'groups.create.private_label',
      noteKey: 'groups.create.private_note',
      icon: <LockIcon size={20} color={mentaColors.text.primary} />,
    },
  ];
  return { privacyOptions };
};
