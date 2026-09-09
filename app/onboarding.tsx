import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  type KeyboardEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  AlertCircleIcon,
  AppleIcon,
  CameraIcon,
  CheckIcon,
  ChevronRightIcon,
  LockIcon,
  MailIcon,
  UsersIcon,
  VideoIcon,
} from '@/components/ui/icons';
import { GoogleGlyph } from '@/components/ui/google-glyph';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import {
  AppScaledText as Text,
  AppTextScaleProvider,
} from '@/components/ui/AppScaledText';
import {
  AppTextArea,
  AppTextField,
  type AppTextFieldRef,
} from '@/components/ui/AppFields';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { queueActivationReview } from '@/lib/store-review';
import { beginOnboardingInvitation } from '@/lib/navigation/onboarding-invitation-lifecycle';
import {
  PaperAuthButton,
  PaperOAuthCancelled,
  PaperAuthNotice,
} from '@/components/onboarding/PaperAuthSurface';
import { NotificationPrivacyOnboarding } from '@/components/onboarding/NotificationPrivacyOnboarding';
import { OnboardingCelebrationBurst } from '@/components/onboarding/OnboardingCelebrationBurst';
import {
  clearOnboardingDraft,
  hasFreshOnboardingLegalConsent,
  loadOnboardingDraftForUser,
  type OnboardingAccountabilityChoice,
  type OnboardingDuration,
  type OnboardingLegalConsentVersions,
  type OnboardingProofType,
  saveOnboardingDraft,
} from '@/lib/onboarding-draft';
import { getValidatedOnboardingReceiptContinuation } from '@/lib/navigation/onboarding-completion';
import {
  decodeAccountActivationLookup,
  formatPromiseDueWindow,
  type PromiseCreationReceipt,
  type ReferralActivationReceipt,
} from '@/lib/commitments/promise-creation-receipt';
import { useAuthStore } from '@/store/auth-store';
import { useChallengeStore, type Challenge } from '@/store/challenge-store';
import { useReferralStore } from '@/store/referral-store';
import { useInviteStore } from '@/store/invite-store';
import {
  fetchPromiseAccountabilityInvitePreview,
  type PromiseAccountabilityInvitePreview,
} from '@/lib/promises/accountability';
import { normalizeInviteCode } from '@/lib/invite-links';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/services/notification-service';
import {
  acceptCurrentLegalDocuments,
  getCurrentLegalDocuments,
  getMyLegalAcceptanceStatus,
  isLegalAcceptanceRequiredError,
  type CurrentLegalDocuments,
} from '@/lib/legal-acceptance';
import { LegalDocumentLinks } from '@/components/legal/LegalDocumentLinks';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { mentaFonts } from '@/lib/menta-fonts';
import { trackProductEvent } from '@/lib/posthog';
import { trackMetaAdsCreatePromise } from '@/lib/meta-ads';
import {
  getPromiseDurationBucket,
  type AnalyticsEventProperties,
} from '@/lib/product-analytics';
import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import { addCivilDays, formatLocalDay } from '@/lib/loop';
import { addBreadcrumb, logCrash, logEvent } from '@/lib/sentry';
import {
  scaleTypeMetrics,
  withReadableLeading,
} from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { shouldUseIPadPortraitWorkspace } from '@/components/ipad/ipad-workspace';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

const colours = {
  canvas: mentaColors.canvas,
  surface: mentaColors.surface,
  raised: mentaColors.raised,
  border: mentaColors.border,
  paper: mentaColors.paper,
  paperPressed: mentaColors.paperPressed,
  text: mentaColors.text.primary,
  mutedInk: mentaColors.text.secondary,
  mutedPaper: mentaColors.text.mutedOnPaper,
  action: mentaColors.action,
  actionOnPaper: mentaColors.actionOnPaper,
  actionSoft: mentaColors.actionSoft,
  actionBorder: mentaColors.actionBorder,
  danger: mentaColors.danger,
  success: mentaColors.success,
  successSoft: mentaColors.successSoft,
  paperDivider: mentaColors.borderPaper,
};

const fonts = {
  inter: mentaFonts.inter.regular,
  interSemibold: mentaFonts.inter.semibold,
  interBold: mentaFonts.inter.bold,
  newsreader: mentaFonts.newsreader.medium,
};

type Step =
  | 'welcome'
  | 'draft'
  | 'proof'
  | 'preview'
  | 'duration'
  | 'momenta_gift'
  | 'activating'
  | 'save_gate'
  | 'auth_method'
  | 'receipt';

type OnboardingJourneyProperties =
  AnalyticsEventProperties['Onboarding Journey'];

const analyticsStageForStep = (
  step: Step,
  proofDisclosure: boolean,
  legalConfirmed: boolean
): OnboardingJourneyProperties['stage'] => {
  if (step === 'draft') return 'promise';
  if (step === 'preview') return 'review';
  if (step === 'momenta_gift') return 'reward';
  if (step === 'activating') return 'activation';
  if (step === 'auth_method') return legalConfirmed ? 'auth' : 'legal';
  if (step === 'proof' && proofDisclosure) return 'accountability';
  return step;
};

const getProofOptions = (
  t: ReturnType<typeof useTranslation>['t']
): {
  value: OnboardingProofType;
  title: string;
  detail: string;
  Icon: typeof CameraIcon;
}[] => [
  {
    value: 'note',
    title: t('fullAuth.onboarding.note'),
    detail: t('fullAuth.onboarding.write_what_happened'),
    Icon: MailIcon,
  },
  {
    value: 'photo',
    title: t('fullAuth.onboarding.photo'),
    detail: t('fullAuth.onboarding.take_one_photo'),
    Icon: CameraIcon,
  },
  {
    value: 'video',
    title: t('fullAuth.onboarding.video'),
    detail: t('fullAuth.onboarding.record_a_short_clip'),
    Icon: VideoIcon,
  },
];

type Localise = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const legalVersionsForDocuments = (
  documents: CurrentLegalDocuments
): OnboardingLegalConsentVersions => ({
  terms: documents.terms.version,
  privacy: documents.privacy.version,
  communityStandards: documents.community_standards.version,
});

const legalVersionsMatch = (
  left: OnboardingLegalConsentVersions | null | undefined,
  right: OnboardingLegalConsentVersions
): boolean =>
  Boolean(
    left &&
    left.terms === right.terms &&
    left.privacy === right.privacy &&
    left.communityStandards === right.communityStandards
  );

const proofLabel = (
  proofType: OnboardingProofType | null,
  localise: Localise
): string => {
  if (proofType === 'photo') return localise('fullAuth.source.proof.photo');
  if (proofType === 'video') return localise('fullAuth.source.proof.video');
  if (proofType === 'note') return localise('fullAuth.source.proof.note');
  return localise('fullAuth.source.proof.choose');
};

const durationOptions: OnboardingDuration[] = [7, 14, 30];

const isAuthCancelled = (message: string) =>
  message.toLowerCase().includes('sign-in was cancelled') ||
  message.toLowerCase().includes('sign in was cancelled');

type AuthProvider = 'apple' | 'google';
type AuthNotice = { title: string; message: string } | null;
type AccountAttempt = {
  epoch: number;
  requestId: number;
  userId: string;
};

const useOnboardingOverflow = (active: boolean) => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [discovered, setDiscovered] = useState(false);
  const canScroll = viewportHeight > 0 && contentHeight > viewportHeight + 8;

  useEffect(() => {
    if (active) return;
    setViewportHeight(0);
    setContentHeight(0);
    setDiscovered(false);
  }, [active]);

  return {
    canScroll,
    viewportHeight,
    showIndicator: canScroll && !discovered,
    onContentSizeChange: (_width: number, height: number) =>
      setContentHeight(height),
    onLayout: (event: LayoutChangeEvent) =>
      setViewportHeight(event.nativeEvent.layout.height),
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (event.nativeEvent.contentOffset.y > 2) setDiscovered(true);
    },
    onScrollBeginDrag: () => setDiscovered(true),
  };
};

const OnboardingOverflowIndicator = ({
  testID,
  visible,
}: {
  testID: string;
  visible: boolean;
}) =>
  visible ? (
    <View
      accessible={false}
      pointerEvents="none"
      style={styles.onboardingOverflowIndicator}
      testID={testID}
    />
  ) : null;

const accountChangedError = (message: string) => new Error(message);

const MentaHeader = ({
  screenInset = mentaLayout.screenInset,
  onBack,
  backLabel,
  progress,
  showBrand = true,
}: {
  screenInset?: number;
  onBack?: () => void;
  backLabel?: string;
  progress?: number;
  showBrand?: boolean;
}) => {
  const { t } = useTranslation();
  const textScale = usePhoneLayout().textScale;
  const backTextStyle = scaleTypeMetrics(
    mentaTypography.bodySmallMedium,
    textScale
  );
  const labelTextStyle = scaleTypeMetrics(
    { fontSize: 17, lineHeight: 22 },
    textScale
  );

  return (
    <>
      <View style={[styles.header, { paddingHorizontal: screenInset }]}>
        {onBack ? (
          <Pressable
            accessibilityLabel={
              backLabel
                ? t('fullAuth.onboarding.back_to_backlabel', {
                    backLabel,
                  })
                : t('fullAuth.onboarding.back')
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={styles.headerBackButton}
            testID="onboarding-header-back"
          >
            <Text
              allowFontScaling={false}
              style={[styles.headerBack, backTextStyle]}
            >
              ‹ {backLabel ?? t('fullAuth.onboarding.back')}
            </Text>
          </Pressable>
        ) : showBrand ? (
          <Text
            allowFontScaling={false}
            style={[styles.headerLabel, labelTextStyle]}
          >
            {t('fullAuth.onboarding.menta')}
          </Text>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        {onBack && showBrand ? (
          <Text
            allowFontScaling={false}
            style={[styles.headerLabel, labelTextStyle]}
          >
            {t('fullAuth.onboarding.menta')}
          </Text>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      {progress !== undefined ? (
        <View
          accessibilityLabel={t('fullAuth.onboarding.your_first_promise')}
          accessibilityRole="progressbar"
          accessibilityValue={{
            max: 100,
            min: 0,
            now: Math.round(progress * 100),
          }}
          style={[
            styles.journeyProgressTrack,
            { marginHorizontal: screenInset },
          ]}
          testID="onboarding-journey-progress"
        >
          <View
            style={[
              styles.journeyProgressFill,
              { width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
      ) : null}
    </>
  );
};

const StepMeta = ({ counter }: { counter: string }) => {
  const textScale = usePhoneLayout().textScale;
  return (
    <View style={styles.stepMeta}>
      <Text
        allowFontScaling={false}
        style={[
          styles.headerCounter,
          scaleTypeMetrics(mentaTypography.bodySmallMedium, textScale),
        ]}
      >
        {counter}
      </Text>
    </View>
  );
};

const ConsentRow = ({
  checked,
  label,
  onPress,
  testID,
  tone = 'dark',
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
  testID: string;
  tone?: 'dark' | 'paper';
}) => {
  const textScale = usePhoneLayout().textScale;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.consentRow,
        tone === 'paper' && styles.consentRowPaper,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.consentBox,
          tone === 'paper' && styles.consentBoxPaper,
          checked && styles.consentBoxChecked,
        ]}
      >
        {checked ? <CheckIcon color={colours.canvas} size={15} /> : null}
      </View>
      <Text
        allowFontScaling={false}
        style={[
          styles.consentLabel,
          tone === 'paper' && styles.consentLabelPaper,
          scaleTypeMetrics(mentaTypography.bodySmall, textScale),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  tone = 'action',
  testID,
  icon,
  compactHeight = false,
  loading = false,
  preserveLabelPositionOnLoading = false,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  tone?: 'action' | 'paper' | 'ghost' | 'outline';
  testID?: string;
  icon?: React.ReactNode;
  compactHeight?: boolean;
  loading?: boolean;
  preserveLabelPositionOnLoading?: boolean;
}) => {
  const textScale = usePhoneLayout().textScale;
  const actionTextScale =
    label === 'Back' || label === 'Edit' ? Math.min(textScale, 1) : textScale;
  return (
    <AppButton
      disabled={disabled}
      fullWidth
      icon={icon}
      loading={loading}
      preserveLabelPositionOnLoading={preserveLabelPositionOnLoading}
      textScale={actionTextScale}
      size="large"
      style={[
        styles.primaryButton,
        tone === 'paper' && styles.paperButton,
        tone === 'ghost' && styles.ghostButton,
        tone === 'outline' && styles.outlineButton,
        compactHeight && styles.compactButton,
      ]}
      testID={testID}
      textStyle={[
        styles.primaryButtonText,
        tone === 'ghost' && styles.ghostButtonText,
        tone === 'outline' && styles.outlineButtonText,
      ]}
      title={label}
      variant={
        tone === 'action'
          ? 'accent'
          : tone === 'ghost'
            ? 'ghost'
            : tone === 'outline'
              ? 'outline'
              : 'primary'
      }
      onPress={() => {
        void onPress();
      }}
    />
  );
};

const Mascot = ({
  size,
  small = false,
  pose = 'default',
}: {
  size: number;
  small?: boolean;
  pose?: 'default' | 'gate' | 'welcome';
}) => {
  const { t } = useTranslation();
  return (
    <View style={{ width: size, height: size }}>
      {!small ? (
        <View
          style={[styles.mascotDisc, { width: size - 24, height: size - 24 }]}
        />
      ) : null}
      <MentaMascot
        accessibilityLabel={
          pose === 'gate'
            ? t(
                'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi'
              )
            : pose === 'welcome'
              ? t('fullAuth.onboarding.menta_mascot_holding_your_first_promise')
              : t('fullAuth.onboarding.menta_mascot_waving_hello')
        }
        size={small ? 'md' : 'hero'}
        sheet="auto"
        state={
          pose === 'gate'
            ? 'empty-guide'
            : pose === 'welcome'
              ? 'welcome-hero'
              : 'welcome-back'
        }
        style={{ height: size, width: size }}
        testID={
          pose === 'welcome'
            ? 'onboarding-promise-guide'
            : pose === 'gate'
              ? 'onboarding-save-gate-mascot'
              : undefined
        }
      />
    </View>
  );
};

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const promiseExamples = [
    t('fullAuth.source.example.walk'),
    t('fullAuth.source.example.application'),
    t('fullAuth.source.example.read'),
  ];
  const proofOptions = getProofOptions(t);
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ resume?: string | string[] }>();
  const phoneLayout = usePhoneLayout();
  const safeAreaInsets = useSafeAreaInsets();
  const motion = useMotionPreferences();
  const inputRef = useRef<AppTextFieldRef>(null);
  const proofScrollRef = useRef<ScrollView>(null);
  const authScrollRef = useRef<ScrollView>(null);
  const proofDisclosureProgress = useRef(new Animated.Value(0)).current;
  const authDisclosureProgress = useRef(new Animated.Value(0)).current;
  const {
    completeOnboarding,
    hasCompletedOnboarding,
    signInWithApple,
    signInWithGoogle,
    user,
  } = useAuthStore();
  const createFirstPromiseWithPayment = useChallengeStore(
    state => state.createFirstPromiseWithPayment
  );
  const processReferral = useReferralStore(state => state.processReferral);
  const pendingReferral = useReferralStore(state => state.pendingReferral);
  const pendingInvite = useInviteStore(state => state.pending);
  const setPendingReferral = useReferralStore(
    state => state.setPendingReferral
  );
  const clearPendingReferral = useReferralStore(
    state => state.clearPendingReferral
  );
  const cancelPendingReferral = useReferralStore(
    state => state.cancelPendingReferral
  );
  const [step, setStep] = useState<Step>('welcome');
  const [promise, setPromise] = useState('');
  const [proofType, setProofType] = useState<OnboardingProofType | null>(null);
  const [proofDisclosure, setProofDisclosure] = useState(false);
  const [duration, setDuration] = useState<OnboardingDuration>(14);
  const [accountabilityChoice, setAccountabilityChoice] =
    useState<OnboardingAccountabilityChoice>('new_group');
  const [accountabilityConfirmed, setAccountabilityConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [resumeAuthenticatedDraft, setResumeAuthenticatedDraft] =
    useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [authProviderLoading, setAuthProviderLoading] =
    useState<AuthProvider | null>(null);
  const authProviderLockRef = useRef<AuthProvider | null>(null);
  const providerHandoffRef = useRef(false);
  const providerRequestSequenceRef = useRef(0);
  const activeProviderRequestRef = useRef<number | null>(null);
  const emailAuthHandoffRef = useRef(false);
  const emailRequestSequenceRef = useRef(0);
  const activeEmailRequestRef = useRef<number | null>(null);
  const [emailAuthLoading, setEmailAuthLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<AuthNotice>(null);
  const [authCancelled, setAuthCancelled] = useState(false);
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const [legalReady, setLegalReady] = useState(false);
  const [legalConsentAt, setLegalConsentAt] = useState<string | null>(null);
  const [legalConsentVersions, setLegalConsentVersions] =
    useState<OnboardingLegalConsentVersions | null>(null);
  const [legalDocuments, setLegalDocuments] =
    useState<CurrentLegalDocuments | null>(null);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [examplesExpanded, setExamplesExpanded] = useState(false);
  const [draftFieldFocused, setDraftFieldFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [draftFieldLayout, setDraftFieldLayout] = useState<{
    height: number;
    y: number;
  } | null>(null);
  const draftScrollRef = useRef<ScrollView | null>(null);
  const [createdPromise, setCreatedPromise] = useState<Pick<
    Challenge,
    'id' | 'title'
  > | null>(null);
  const [
    showNotificationPermissionEducation,
    setShowNotificationPermissionEducation,
  ] = useState(false);
  const notificationPromptHandledRef = useRef(false);
  const notificationPromptReturnStepRef = useRef<Step>('duration');
  const authMethodReturnStepRef = useRef<Step>('momenta_gift');
  const [activationReceipt, setActivationReceipt] =
    useState<PromiseCreationReceipt | null>(null);
  const [activationOwnerId, setActivationOwnerId] = useState<string | null>(
    null
  );
  const [referralCode, setReferralCode] = useState('');
  const [referralExpanded, setReferralExpanded] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralFormatReady, setReferralFormatReady] = useState(false);
  const [pendingPromisePreview, setPendingPromisePreview] =
    useState<PromiseAccountabilityInvitePreview | null>(null);
  const draftOverflow = useOnboardingOverflow(step === 'draft');
  const proofOverflow = useOnboardingOverflow(step === 'proof');
  const previewOverflow = useOnboardingOverflow(step === 'preview');
  const durationOverflow = useOnboardingOverflow(step === 'duration');
  const authOverflow = useOnboardingOverflow(step === 'auth_method');
  const mountedRef = useRef(true);
  const accountAttemptEpochRef = useRef(0);
  const activationRequestSequenceRef = useRef(0);
  const activeActivationRequestRef = useRef<number | null>(null);
  const continueToFirstPromiseRef = useRef<
    ((options?: { skipReferral?: boolean }) => Promise<void>) | null
  >(null);
  const completionRequestSequenceRef = useRef(0);
  const activeCompletionRequestRef = useRef<number | null>(null);
  const hydrationRequestRef = useRef(0);
  const onboardingNavigationEpochRef = useRef(0);
  const restoredEntryRef = useRef(false);
  const draftEditFocusRequestedRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(user?.id ?? null);
  const isReplay = pathname.includes('onboarding-again');
  const onboardingViewEventsRef = useRef(new Set<string>());
  const trackOnboardingJourney = useCallback(
    ({
      action,
      outcome = 'not_applicable',
      selection = 'not_applicable',
      stage,
    }: Pick<OnboardingJourneyProperties, 'action' | 'stage'> &
      Partial<Pick<OnboardingJourneyProperties, 'outcome' | 'selection'>>) => {
      const currentUserId = useAuthStore.getState().user?.id ?? null;
      trackProductEvent('Onboarding Journey', {
        action,
        authenticated: Boolean(currentUserId),
        entry_mode: isReplay
          ? 'replay'
          : currentUserId && providerHandoffRef.current
            ? 'post_sign_in'
            : restoredEntryRef.current
              ? 'restored'
              : 'fresh',
        journey: 'first_promise',
        outcome,
        selection,
        stage,
      });
    },
    [isReplay]
  );
  const compact = phoneLayout.isCompactHeight;
  const compactWelcomeVisual = phoneLayout.height < 700;
  const welcomeHeroSize = compactWelcomeVisual
    ? Math.min(260, Math.max(0, phoneLayout.width - 40))
    : Math.min(phoneLayout.width, 430);
  const giftMascotSize = Math.min(
    phoneLayout.heroVisualHeight,
    phoneLayout.width >= 414 ? 236 : phoneLayout.width >= 375 ? 220 : 184
  );
  const routeResume = Array.isArray(params.resume)
    ? params.resume[0]
    : params.resume;
  const headingLeading = withReadableLeading(
    mentaTypography.heading,
    phoneLayout
  );
  const bodySmallLeading = withReadableLeading(
    mentaTypography.bodySmall,
    phoneLayout
  );
  const giftTitleLeading = withReadableLeading(
    { fontSize: 36, lineHeight: 41 },
    phoneLayout
  );
  const onboardingTextScale = phoneLayout.textScale;
  const platformBottomActionFallback =
    Platform.OS === 'ios' ? 48 : mentaSpacing[8];
  const actionDockBottomPadding = Math.max(
    safeAreaInsets.bottom,
    platformBottomActionFallback
  );
  const actionDockContentClearance =
    mentaLayout.primaryControlHeight +
    actionDockBottomPadding +
    mentaSpacing[2];
  const authContentBottomPadding =
    Platform.OS === 'android' && keyboardVisible
      ? keyboardHeight + mentaSpacing[4]
      : actionDockBottomPadding + mentaSpacing[6];
  const usesWideIPadWorkspace = shouldUseIPadPortraitWorkspace(
    phoneLayout.width,
    Platform.OS === 'ios' && Platform.isPad === true
  );

  useEffect(() => {
    if (!hydrated) return;
    const stage = authCancelled
      ? 'auth_cancelled'
      : analyticsStageForStep(step, proofDisclosure, legalConfirmed);
    const key = `${stage}:${legalConfirmed}:${proofDisclosure}`;
    if (onboardingViewEventsRef.current.has(key)) return;
    onboardingViewEventsRef.current.add(key);
    trackOnboardingJourney({
      action: 'viewed',
      outcome:
        stage === 'receipt'
          ? activationReceipt?.activation?.confirmed
            ? 'succeeded'
            : 'unknown'
          : 'not_applicable',
      stage,
    });
  }, [
    activationReceipt?.activation?.confirmed,
    authCancelled,
    hydrated,
    legalConfirmed,
    proofDisclosure,
    step,
    trackOnboardingJourney,
  ]);

  useEffect(() => {
    Animated.timing(proofDisclosureProgress, {
      duration: motion.duration(360),
      easing: Easing.bezier(0.32, 0.72, 0, 1),
      toValue: proofDisclosure ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [motion, proofDisclosure, proofDisclosureProgress]);

  useEffect(() => {
    Animated.timing(authDisclosureProgress, {
      duration: motion.duration(360),
      easing: Easing.bezier(0.32, 0.72, 0, 1),
      toValue: legalConfirmed ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [authDisclosureProgress, legalConfirmed, motion]);

  useEffect(() => {
    if (
      step !== 'draft' ||
      !draftFieldFocused ||
      !draftOverflow.canScroll ||
      !draftFieldLayout ||
      draftOverflow.viewportHeight <= 0
    ) {
      return undefined;
    }
    const revealDraftField = () => {
      const minimumOffset =
        draftFieldLayout.y +
        draftFieldLayout.height -
        draftOverflow.viewportHeight +
        mentaSpacing[3];
      draftScrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, minimumOffset),
      });
    };
    const frame = requestAnimationFrame(revealDraftField);
    const keyboardSubscription = Keyboard.addListener(
      'keyboardDidShow',
      revealDraftField
    );
    return () => {
      cancelAnimationFrame(frame);
      keyboardSubscription.remove();
    };
  }, [
    draftFieldFocused,
    draftFieldLayout,
    draftOverflow.canScroll,
    draftOverflow.viewportHeight,
    phoneLayout.textScale,
    step,
  ]);

  useEffect(() => {
    if (step !== 'draft' || !draftEditFocusRequestedRef.current) return;
    draftEditFocusRequestedRef.current = false;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(
      showEvent,
      (event: KeyboardEvent) => {
        setKeyboardHeight(Math.max(0, event.endCoordinates.height));
        setKeyboardVisible(true);
      }
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const hasCurrentLegalReceipt = useCallback(
    async (
      expectedUserId: string,
      legalDraft: {
        promise: string;
        proofType: OnboardingProofType | null;
        durationDays: OnboardingDuration;
        accountabilityChoice: OnboardingAccountabilityChoice;
        accountabilityChoiceConfirmed?: boolean;
        legalConsentAt: string | null;
        legalConsentVersions: OnboardingLegalConsentVersions | null;
        referralCode: string;
        marketingOptIn: boolean;
      },
      canApplyResult: () => boolean = () => true
    ): Promise<boolean> => {
      const status = await getMyLegalAcceptanceStatus(expectedUserId);
      if (useAuthStore.getState().user?.id !== expectedUserId) {
        throw accountChangedError(t('fullAuth.source.error.account_changed'));
      }
      if (!canApplyResult()) return false;
      if (!status.requiresAcceptance) {
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'succeeded',
          selection: 'legal_bundle',
          stage: 'legal',
        });
        return true;
      }

      const currentVersions = legalVersionsForDocuments(status.current);
      if (
        !hasFreshOnboardingLegalConsent(legalDraft.legalConsentAt) ||
        !legalVersionsMatch(legalDraft.legalConsentVersions, currentVersions)
      ) {
        await saveOnboardingDraft(legalDraft, expectedUserId, 'auth_method');
        setLegalConfirmed(false);
        setLegalReady(false);
        setLegalConsentAt(null);
        setLegalConsentVersions(null);
        setLegalDocuments(status.current);
        setAuthNotice({
          title: t('fullAuth.onboarding.confirm_the_required_documents'),
          message: t(
            'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below'
          ),
        });
        setStep('auth_method');
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'blocked',
          selection: 'legal_bundle',
          stage: 'legal',
        });
        return false;
      }

      const accepted = await acceptCurrentLegalDocuments(
        status,
        'account_creation',
        expectedUserId
      );
      const confirmed = accepted.accepted && !accepted.requiresAcceptance;
      trackOnboardingJourney({
        action: 'completed',
        outcome: confirmed ? 'succeeded' : 'failed',
        selection: 'legal_bundle',
        stage: 'legal',
      });
      return confirmed;
    },
    [t, trackOnboardingJourney]
  );

  const preserveLegacyMarketingEmailConsent = useCallback(
    async (expectedUserId: string, optedIn: boolean): Promise<void> => {
      if (!optedIn) return;
      await notificationService.updateUserPreferences(expectedUserId, {
        marketing_email_opt_in: true,
        marketing_email_opted_at: new Date().toISOString(),
      });
      if (useAuthStore.getState().user?.id !== expectedUserId) {
        throw accountChangedError(t('fullAuth.source.error.account_changed'));
      }
    },
    [t]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      accountAttemptEpochRef.current += 1;
      activationRequestSequenceRef.current += 1;
      completionRequestSequenceRef.current += 1;
      providerRequestSequenceRef.current += 1;
      emailRequestSequenceRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const expectedUserId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;
    const accountIdentityChanged = previousUserId !== expectedUserId;
    const preservesProviderHandoff =
      accountIdentityChanged &&
      providerHandoffRef.current &&
      previousUserId === null &&
      expectedUserId !== null;
    previousUserIdRef.current = expectedUserId;

    if (accountIdentityChanged) {
      onboardingViewEventsRef.current.clear();
      accountAttemptEpochRef.current += 1;
      activationRequestSequenceRef.current += 1;
      completionRequestSequenceRef.current += 1;
      activeActivationRequestRef.current = null;
      activeCompletionRequestRef.current = null;
      setIsFinishing(false);

      if (!preservesProviderHandoff) {
        providerHandoffRef.current = false;
        providerRequestSequenceRef.current += 1;
        emailRequestSequenceRef.current += 1;
        activeProviderRequestRef.current = null;
        activeEmailRequestRef.current = null;
        authProviderLockRef.current = null;
        emailAuthHandoffRef.current = false;
        setAuthProviderLoading(null);
        setEmailAuthLoading(false);
        setCreatedPromise(null);
        setShowNotificationPermissionEducation(false);
        notificationPromptHandledRef.current = false;
        setActivationReceipt(null);
        setActivationOwnerId(null);
      }
    }

    let active = true;
    const hydrationRequestId = ++hydrationRequestRef.current;
    const navigationEpochAtHydrationStart =
      onboardingNavigationEpochRef.current;
    const isHydrationRequestCurrent = () =>
      active &&
      hydrationRequestId === hydrationRequestRef.current &&
      (useAuthStore.getState().user?.id ?? null) === expectedUserId;
    const canApplyHydratedNavigation = () =>
      isHydrationRequestCurrent() &&
      navigationEpochAtHydrationStart === onboardingNavigationEpochRef.current;
    if (accountIdentityChanged && !preservesProviderHandoff) {
      // The screen can remain mounted while Supabase swaps or clears the account.
      // Clear the previous in-memory value before reading the new account scope so
      // an A -> B transition never paints or re-saves account A's local promise.
      setHydrated(false);
      setPromise('');
      setProofType(null);
      setProofDisclosure(false);
      setDuration(14);
      setAccountabilityChoice('new_group');
      setAccountabilityConfirmed(false);
      restoredEntryRef.current = false;
      draftEditFocusRequestedRef.current = false;
      setValidation(null);
      setAuthCancelled(false);
      setResumeAuthenticatedDraft(false);
      setAuthNotice(null);
      setLegalConfirmed(false);
      setLegalReady(false);
      setLegalConsentAt(null);
      setLegalConsentVersions(null);
      setLegalDocuments(null);
      setFinishError(null);
      setReferralCode('');
      setReferralError(null);
      setReferralFormatReady(false);
      setStep('welcome');
    }
    void loadOnboardingDraftForUser({
      userId: expectedUserId,
      hasCompletedOnboarding,
    })
      .then(async draft => {
        if (!canApplyHydratedNavigation()) return;
        if (draft?.promise.trim()) {
          setPromise(draft.promise);
          setProofType(draft.proofType);
          setDuration(draft.durationDays);
          setAccountabilityChoice(
            draft.accountabilityChoice === 'new_group' ? 'new_group' : 'just_me'
          );
          setAccountabilityConfirmed(
            draft.accountabilityChoiceConfirmed === true
          );
          setMarketingOptIn(draft.marketingOptIn);
          const hasFreshConsent =
            hasFreshOnboardingLegalConsent(draft.legalConsentAt) &&
            Boolean(draft.legalConsentVersions);
          setLegalConfirmed(hasFreshConsent);
          setLegalReady(hasFreshConsent);
          setLegalConsentAt(hasFreshConsent ? draft.legalConsentAt : null);
          setLegalConsentVersions(
            hasFreshConsent ? draft.legalConsentVersions : null
          );
          setReferralCode(draft.referralCode);
          setReferralExpanded(Boolean(draft.referralCode));
          setReferralFormatReady(
            /^[0-9A-F]{32}$/.test(normalizeInviteCode(draft.referralCode))
          );
          restoredEntryRef.current = true;
          notificationPromptHandledRef.current =
            draft.notificationEducationHandled === true;
          if (
            !isReplay &&
            draft.proofType &&
            draft.resumeStep === 'auth_method' &&
            !notificationPromptHandledRef.current
          ) {
            notificationPromptReturnStepRef.current = 'preview';
            authMethodReturnStepRef.current = 'preview';
            setShowNotificationPermissionEducation(true);
          } else if (
            !isReplay &&
            expectedUserId &&
            draft.proofType &&
            draft.resumeStep === 'legal_acceptance'
          ) {
            if (routeResume === 'legal-declined') {
              setLegalConfirmed(false);
              setLegalReady(false);
              setLegalConsentAt(null);
              setAuthNotice({
                title: t('fullAuth.onboarding.legal_review_was_not_completed'),
                message: t(
                  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do'
                ),
              });
              setStep('auth_method');
              return;
            }
            if (
              !(await hasCurrentLegalReceipt(
                expectedUserId,
                draft,
                canApplyHydratedNavigation
              ))
            )
              return;
            setLegalConfirmed(true);
            setLegalReady(true);
            await preserveLegacyMarketingEmailConsent(
              expectedUserId,
              draft.marketingOptIn
            );
            await saveOnboardingDraft(draft, expectedUserId, null);
            if (!canApplyHydratedNavigation()) return;
            setStep('auth_method');
          } else if (
            !isReplay &&
            expectedUserId &&
            draft.proofType &&
            draft.resumeStep === 'auth_method'
          ) {
            // Reaching an external email or provider handoff is only possible
            // after the mandatory agreement is selected. Claim the account-
            // scoped receipt, then continue after the gift instead of replaying
            // the preview and gift screens.
            if (
              !(await hasCurrentLegalReceipt(
                expectedUserId,
                draft,
                canApplyHydratedNavigation
              ))
            )
              return;
            await preserveLegacyMarketingEmailConsent(
              expectedUserId,
              draft.marketingOptIn
            );
            if (!canApplyHydratedNavigation()) return;
            await saveOnboardingDraft(draft, expectedUserId, null);
            // OAuth can recreate the Expo root before the provider promise
            // settles. The claimed draft already contains the exact documents
            // selected before sign-in, and hasCurrentLegalReceipt has now
            // recorded those versions for this account. Continue from that
            // receipt instead of painting the same terms screen again.
            setResumeAuthenticatedDraft(true);
            setStep('activating');
          } else if (!isReplay && draft.resumeStep === 'auth_cancelled') {
            setAuthCancelled(true);
            notificationPromptReturnStepRef.current = 'preview';
            authMethodReturnStepRef.current = 'preview';
          } else if (
            !isReplay &&
            draft.resumeStep === 'auth_method' &&
            draft.proofType
          ) {
            setStep('auth_method');
            notificationPromptReturnStepRef.current = 'preview';
            authMethodReturnStepRef.current = 'preview';
          } else if (
            !isReplay &&
            draft.resumeStep === 'preview' &&
            draft.proofType
          ) {
            setStep('preview');
          } else if (!isReplay && draft.resumeStep === null) {
            draftEditFocusRequestedRef.current = false;
            setStep('draft');
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isHydrationRequestCurrent()) setHydrated(true);
        if (
          preservesProviderHandoff &&
          hydrationRequestId === hydrationRequestRef.current
        ) {
          providerHandoffRef.current = false;
        }
      });
    return () => {
      active = false;
    };
  }, [
    hasCompletedOnboarding,
    hasCurrentLegalReceipt,
    isReplay,
    preserveLegacyMarketingEmailConsent,
    routeResume,
    t,
    user?.id,
  ]);

  useEffect(() => {
    if (createdPromise || !hydrated || (!promise && !proofType)) return;
    const timeout = setTimeout(() => {
      void saveOnboardingDraft(
        {
          promise,
          proofType,
          durationDays: duration,
          accountabilityChoice,
          accountabilityChoiceConfirmed: accountabilityConfirmed,
          legalConsentAt,
          legalConsentVersions,
          referralCode,
          marketingOptIn,
        },
        user?.id ?? null
      );
    }, 240);
    return () => clearTimeout(timeout);
  }, [
    accountabilityConfirmed,
    accountabilityChoice,
    createdPromise,
    duration,
    hydrated,
    legalConsentAt,
    legalConsentVersions,
    marketingOptIn,
    promise,
    proofType,
    referralCode,
    user?.id,
  ]);

  useEffect(() => {
    let active = true;
    if (step !== 'auth_method' || pendingInvite?.type !== 'challenge') {
      setPendingPromisePreview(null);
      return () => {
        active = false;
      };
    }

    void fetchPromiseAccountabilityInvitePreview(pendingInvite.code)
      .then(preview => {
        if (active) setPendingPromisePreview(preview);
      })
      .catch(() => {
        if (active) setPendingPromisePreview(null);
      });

    return () => {
      active = false;
    };
  }, [pendingInvite?.code, pendingInvite?.type, step]);

  useEffect(() => {
    let active = true;
    void getCurrentLegalDocuments()
      .then(documents => {
        if (!active) return;
        setLegalDocuments(documents);
      })
      .catch(() => {
        if (!active) return;
        setLegalDocuments(null);
        setLegalConfirmed(false);
        setLegalReady(false);
        setLegalConsentAt(null);
        setLegalConsentVersions(null);
        setAuthNotice({
          title: t(
            'fullAuth.source.accountability.documents_load_failed_title'
          ),
          message: t(
            'fullAuth.source.accountability.documents_load_failed_description'
          ),
        });
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (
      !legalDocuments ||
      !legalConfirmed ||
      legalVersionsMatch(
        legalConsentVersions,
        legalVersionsForDocuments(legalDocuments)
      )
    ) {
      return;
    }
    setLegalConfirmed(false);
    setLegalReady(false);
    setLegalConsentAt(null);
    setLegalConsentVersions(null);
    setAuthNotice({
      title: t('fullAuth.source.accountability.documents_changed_title'),
      message: t(
        'fullAuth.source.accountability.documents_changed_description'
      ),
    });
  }, [legalConfirmed, legalConsentVersions, legalDocuments, t]);

  const canContinueDraft = promise.trim().length >= 5;
  const toggleLegalConsent = () => {
    if (legalConfirmed) {
      trackOnboardingJourney({
        action: 'edited',
        outcome: 'cancelled',
        selection: 'legal_bundle',
        stage: 'legal',
      });
      setLegalConfirmed(false);
      setLegalReady(false);
      setLegalConsentAt(null);
      setLegalConsentVersions(null);
      return;
    }
    setLegalReady(current => {
      trackOnboardingJourney({
        action: 'selected',
        outcome: current ? 'cancelled' : 'succeeded',
        selection: 'legal_bundle',
        stage: 'legal',
      });
      return !current;
    });
  };

  const confirmLegalConsent = () => {
    if (!legalReady) return;
    if (!legalDocuments) {
      trackOnboardingJourney({
        action: 'submitted',
        outcome: 'blocked',
        selection: 'legal_bundle',
        stage: 'legal',
      });
      setAuthNotice({
        title: t('fullAuth.source.accountability.documents_loading_title'),
        message: t(
          'fullAuth.source.accountability.documents_loading_description'
        ),
      });
      return;
    }
    trackOnboardingJourney({
      action: 'submitted',
      outcome: 'pending',
      selection: 'legal_bundle',
      stage: 'legal',
    });
    setLegalConfirmed(true);
    setLegalReady(true);
    setLegalConsentAt(new Date().toISOString());
    setLegalConsentVersions(legalVersionsForDocuments(legalDocuments));
    setAuthNotice(null);
  };
  const contentStyle = useMemo(
    () => [
      styles.scrollContent,
      compact && styles.scrollContentCompact,
      usesWideIPadWorkspace && styles.iPadDraftContent,
      {
        paddingBottom: actionDockContentClearance,
        paddingHorizontal: usesWideIPadWorkspace
          ? mentaSpacing[8]
          : phoneLayout.screenInset,
      },
    ],
    [
      actionDockContentClearance,
      compact,
      phoneLayout.screenInset,
      usesWideIPadWorkspace,
    ]
  );

  const move = (next: Step) => {
    onboardingNavigationEpochRef.current += 1;
    setValidation(null);
    setStep(next);
  };

  const persistEditableDraft = () => {
    void saveOnboardingDraft(
      {
        promise,
        proofType,
        durationDays: duration,
        accountabilityChoice,
        accountabilityChoiceConfirmed: accountabilityConfirmed,
        legalConsentAt,
        legalConsentVersions,
        referralCode,
        marketingOptIn,
      },
      user?.id ?? null,
      null
    );
  };

  const enterDraftForEdit = () => {
    draftEditFocusRequestedRef.current = true;
    move('draft');
    persistEditableDraft();
  };

  const showAuthMethods = () => {
    setAuthCancelled(false);
    const currentUserId = useAuthStore.getState().user?.id ?? null;
    const authMethodReturnStep =
      step === 'duration' ||
      step === 'preview' ||
      step === 'save_gate' ||
      step === 'momenta_gift'
        ? step
        : 'momenta_gift';
    authMethodReturnStepRef.current = authMethodReturnStep;
    if (!notificationPromptHandledRef.current) {
      notificationPromptReturnStepRef.current = authMethodReturnStep;
      setShowNotificationPermissionEducation(true);
      void saveOnboardingDraft(
        {
          promise,
          proofType,
          durationDays: duration,
          accountabilityChoice,
          accountabilityChoiceConfirmed: accountabilityConfirmed,
          legalConsentAt,
          legalConsentVersions,
          referralCode,
          marketingOptIn,
        },
        currentUserId
      );
      return;
    }

    setStep('auth_method');
    void saveOnboardingDraft(
      {
        promise,
        proofType,
        durationDays: duration,
        accountabilityChoice,
        accountabilityChoiceConfirmed: accountabilityConfirmed,
        legalConsentAt,
        legalConsentVersions,
        referralCode,
        marketingOptIn,
      },
      currentUserId,
      'auth_method'
    );
  };

  const completeNotificationPermissionEducation = () => {
    const currentUserId = useAuthStore.getState().user?.id ?? null;
    notificationPromptHandledRef.current = true;
    authMethodReturnStepRef.current = notificationPromptReturnStepRef.current;
    setShowNotificationPermissionEducation(false);
    setAuthCancelled(false);
    setStep('auth_method');
    void saveOnboardingDraft(
      {
        promise,
        proofType,
        durationDays: duration,
        accountabilityChoice,
        accountabilityChoiceConfirmed: accountabilityConfirmed,
        notificationEducationHandled: true,
        legalConsentAt,
        legalConsentVersions,
        referralCode,
        marketingOptIn,
      },
      currentUserId,
      'auth_method'
    );
  };

  const back = () => {
    trackOnboardingJourney({
      action: 'back',
      stage: analyticsStageForStep(step, proofDisclosure, legalConfirmed),
    });
    const previous: Record<Step, Step | null> = {
      welcome: null,
      draft: 'welcome',
      proof: 'draft',
      preview: 'duration',
      duration: 'proof',
      momenta_gift: 'preview',
      activating: 'auth_method',
      save_gate: 'preview',
      auth_method: 'momenta_gift',
      receipt: null,
    };
    const destination =
      step === 'auth_method' ? authMethodReturnStepRef.current : previous[step];
    if (destination === 'proof') setProofDisclosure(Boolean(proofType));
    if (destination === 'draft') {
      draftEditFocusRequestedRef.current = false;
      move(destination);
      persistEditableDraft();
    } else if (destination) move(destination);
    else if (isReplay) router.replace('/login');
  };

  const submitDraft = () => {
    if (!canContinueDraft) {
      trackOnboardingJourney({
        action: 'submitted',
        outcome: 'invalid',
        stage: 'promise',
      });
      setValidation(t('fullAuth.source.validation.action_required'));
      inputRef.current?.focus();
      void emitHaptic({ type: 'warning' });
      return;
    }
    setProofDisclosure(Boolean(proofType));
    trackOnboardingJourney({
      action: 'continued',
      outcome: 'succeeded',
      stage: 'promise',
    });
    move('proof');
  };

  const continueAfterMomentaGift = () => {
    trackOnboardingJourney({ action: 'continued', stage: 'reward' });
    const currentUserId = useAuthStore.getState().user?.id ?? null;
    const pendingCode =
      pendingReferral &&
      (!pendingReferral.ownerUserId ||
        pendingReferral.ownerUserId === currentUserId)
        ? pendingReferral.referralCode
        : '';
    if (pendingCode && !referralCode) {
      setReferralCode(pendingCode);
      setReferralExpanded(true);
      setReferralFormatReady(
        /^[0-9A-F]{32}$/.test(normalizeInviteCode(pendingCode))
      );
    }
    setReferralError(null);
    showAuthMethods();
  };

  const showMomentaGiftStep = () => {
    setFinishError(null);
    move('momenta_gift');
  };

  const continueAfterDuration = () => {
    trackOnboardingJourney({
      action: 'continued',
      selection: `days_${duration}` as 'days_7' | 'days_14' | 'days_30',
      stage: 'duration',
    });
    move('preview');
  };

  const continueAfterPreview = () => {
    trackOnboardingJourney({ action: 'continued', stage: 'review' });
    showMomentaGiftStep();
  };

  const validateReferralBeforeAuthentication = (): boolean => {
    const normalizedCode = normalizeInviteCode(referralCode);
    if (!normalizedCode) {
      trackOnboardingJourney({
        action: 'submitted',
        outcome: 'succeeded',
        selection: 'referral_absent',
        stage: 'referral',
      });
      setReferralError(null);
      setReferralFormatReady(false);
      return true;
    }
    if (/^[0-9A-F]{32}$/.test(normalizedCode)) {
      trackOnboardingJourney({
        action: 'submitted',
        outcome: 'succeeded',
        selection: 'referral_present',
        stage: 'referral',
      });
      setReferralError(null);
      setReferralFormatReady(true);
      return true;
    }
    setReferralExpanded(true);
    trackOnboardingJourney({
      action: 'submitted',
      outcome: 'invalid',
      selection: 'referral_present',
      stage: 'referral',
    });
    setReferralFormatReady(false);
    setReferralError(
      t('fullAuth.source.accountability.referral_code_format_error')
    );
    void emitHaptic({ type: 'warning' });
    return false;
  };

  const isAccountIdentityCurrent = (attempt: AccountAttempt): boolean =>
    mountedRef.current &&
    accountAttemptEpochRef.current === attempt.epoch &&
    useAuthStore.getState().user?.id === attempt.userId;

  const assertActivationAttemptCurrent = (attempt: AccountAttempt) => {
    if (
      activeActivationRequestRef.current !== attempt.requestId ||
      !isAccountIdentityCurrent(attempt)
    ) {
      throw accountChangedError(t('fullAuth.source.error.account_changed'));
    }
  };

  const assertCompletionAttemptCurrent = (attempt: AccountAttempt) => {
    if (
      activeCompletionRequestRef.current !== attempt.requestId ||
      !isAccountIdentityCurrent(attempt)
    ) {
      throw accountChangedError(t('fullAuth.source.error.account_changed'));
    }
  };

  const clearConfirmedDraft = async (attempt: AccountAttempt) => {
    assertActivationAttemptCurrent(attempt);
    try {
      await clearOnboardingDraft(attempt.userId);
    } catch {
      // The server receipt remains authoritative. A storage cleanup failure is
      // safe because the draft is account-scoped and activation is idempotent.
    }
    assertActivationAttemptCurrent(attempt);
  };

  const visibleReferral = (
    referral: ReferralActivationReceipt | null
  ): ReferralActivationReceipt | null =>
    referral?.status === 'cancelled' ? null : referral;

  const recoverExistingActivation = async (
    attempt: AccountAttempt
  ): Promise<
    | {
        kind: 'absent';
        stagedReferral: ReferralActivationReceipt | null;
      }
    | { kind: 'recovered' }
  > => {
    assertActivationAttemptCurrent(attempt);
    const { data, error } = await (
      supabase.rpc as unknown as (
        functionName: string
      ) => Promise<{ data: unknown; error: unknown }>
    ).call(supabase, 'get_my_account_activation_v1');
    assertActivationAttemptCurrent(attempt);

    if (error || !data) {
      throw new Error(t('fullAuth.source.error.first_promise_lookup'));
    }

    const lookup = decodeAccountActivationLookup(data);
    if (!lookup) {
      throw new Error(t('fullAuth.source.error.incomplete_activation_receipt'));
    }

    if (lookup.kind === 'absent') {
      const stagedCode = lookup.stagedReferral?.referralCode;
      if (stagedCode) {
        setPendingReferral(stagedCode, attempt.userId);
        setReferralCode(stagedCode);
      }
      return lookup;
    }

    const activation = lookup.receipt;
    const recoveredPromiseId = activation.firstPromiseId;
    const recoveredPromiseTitle = activation.firstPromiseTitle;
    if (!recoveredPromiseId || !recoveredPromiseTitle) {
      throw new Error(t('fullAuth.source.error.incomplete_recovered_promise'));
    }
    await clearConfirmedDraft(attempt);
    clearPendingReferral(attempt.userId);
    const referral = visibleReferral(activation.referral);
    const visibleActivation = { ...activation, referral };
    setActivationOwnerId(attempt.userId);
    setCreatedPromise({
      id: recoveredPromiseId,
      title: recoveredPromiseTitle,
    });
    setActivationReceipt({
      isFirstPromise: true,
      nextDueAt: null,
      activation: visibleActivation,
      referral,
    });
    trackOnboardingJourney({
      action: 'completed',
      outcome: 'recovered',
      stage: 'activation',
    });
    setStep('receipt');
    return { kind: 'recovered' };
  };

  const continueToFirstPromise = async ({
    skipReferral = false,
  }: { skipReferral?: boolean } = {}) => {
    if (activeActivationRequestRef.current !== null) return;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      showAuthMethods();
      return;
    }

    const requestId = ++activationRequestSequenceRef.current;
    activeActivationRequestRef.current = requestId;
    const attempt: AccountAttempt = {
      epoch: accountAttemptEpochRef.current,
      requestId,
      userId: currentUser.id,
    };
    setIsFinishing(true);
    setFinishError(null);
    setReferralError(null);
    trackOnboardingJourney({
      action: 'requested',
      outcome: 'pending',
      stage: 'activation',
    });
    setStep('activating');
    try {
      assertActivationAttemptCurrent(attempt);
      const recovery = await recoverExistingActivation(attempt);
      assertActivationAttemptCurrent(attempt);
      if (recovery.kind === 'recovered') {
        return;
      }

      const legalStatus = await getMyLegalAcceptanceStatus(attempt.userId);
      assertActivationAttemptCurrent(attempt);
      if (legalStatus.requiresAcceptance) {
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'blocked',
          stage: 'activation',
        });
        setLegalConfirmed(false);
        setLegalReady(false);
        setLegalConsentAt(null);
        setStep('auth_method');
        setAuthNotice({
          title: t('fullAuth.onboarding.confirm_the_required_documents'),
          message: t(
            'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below'
          ),
        });
        return;
      }

      const typedReferralCode = normalizeInviteCode(referralCode);
      const stagedReferralCode = recovery.stagedReferral?.referralCode
        ? normalizeInviteCode(recovery.stagedReferral.referralCode)
        : '';

      if (stagedReferralCode && typedReferralCode !== stagedReferralCode) {
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'blocked',
          selection: 'referral_present',
          stage: 'activation',
        });
        setStep('auth_method');
        setReferralError(t('fullAuth.source.error.referral_code_mismatch'));
        return;
      }

      if (skipReferral) {
        assertActivationAttemptCurrent(attempt);
        const cancelled = await cancelPendingReferral(attempt.userId);
        assertActivationAttemptCurrent(attempt);
        if (!cancelled) {
          throw new Error(t('fullAuth.source.error.referral_skip_unconfirmed'));
        }
      } else {
        const normalizedCode = stagedReferralCode || typedReferralCode;
        if (!/^[0-9A-F]{32}$/.test(normalizedCode)) {
          trackOnboardingJourney({
            action: 'completed',
            outcome: 'invalid',
            selection: 'referral_present',
            stage: 'activation',
          });
          setStep('auth_method');
          setReferralError(t('fullAuth.source.error.referral_code_invalid'));
          return;
        }

        assertActivationAttemptCurrent(attempt);
        setPendingReferral(normalizedCode, attempt.userId);
        await processReferral(attempt.userId);
        assertActivationAttemptCurrent(attempt);
        const referralResult = useReferralStore.getState().lastProcessResult;
        const confirmedReferralCode = referralResult?.referralCode
          ? normalizeInviteCode(referralResult.referralCode)
          : '';
        if (
          referralResult?.outcome === 'staged_code_mismatch' ||
          (confirmedReferralCode && confirmedReferralCode !== normalizedCode)
        ) {
          trackOnboardingJourney({
            action: 'completed',
            outcome: 'blocked',
            selection: 'referral_present',
            stage: 'activation',
          });
          if (confirmedReferralCode) {
            setReferralCode(confirmedReferralCode);
            setPendingReferral(confirmedReferralCode, attempt.userId);
          }
          setReferralError(t('fullAuth.source.error.referral_code_mismatch'));
          setStep('auth_method');
          return;
        }
        if (referralResult?.outcome !== 'pending_activation') {
          trackOnboardingJourney({
            action: 'completed',
            outcome:
              referralResult?.outcome === 'unavailable' ? 'failed' : 'blocked',
            selection: 'referral_present',
            stage: 'activation',
          });
          setReferralError(
            referralResult?.outcome === 'unavailable'
              ? t('fullAuth.source.error.referral_unavailable')
              : t('fullAuth.source.error.referral_code_not_added')
          );
          setStep('auth_method');
          return;
        }
        if (
          referralResult.status !== 'pending' ||
          confirmedReferralCode !== normalizedCode
        ) {
          trackOnboardingJourney({
            action: 'completed',
            outcome: 'blocked',
            selection: 'referral_present',
            stage: 'activation',
          });
          setReferralError(t('fullAuth.source.error.referral_not_confirmed'));
          setStep('auth_method');
          return;
        }
      }

      const verificationType =
        proofType === 'photo'
          ? 'photo'
          : proofType === 'video'
            ? 'video'
            : 'text';
      const proofName = proofLabel(proofType, t);
      const effectiveTimeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const startDate = formatLocalDay(new Date(), effectiveTimeZone);
      const endDate = addCivilDays(startDate, duration - 1);
      assertActivationAttemptCurrent(attempt);

      const { challenge, receipt } = await createFirstPromiseWithPayment(
        {
          title: promise.trim(),
          description: t(
            'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro',
            { proofName }
          ),
          category: 'personal',
          startDate,
          endDate,
          duration,
          creatorId: attempt.userId,
          verificationType,
          verificationFrequency: 'daily',
          isPublic: false,
          difficulty: 'medium',
          pointsValue: 200,
          verificationDescription: t(
            'fullAuth.source.verification_description'
          ),
          submissionText: t('fullAuth.source.submission_text'),
          allowExtensions: true,
          maxExtensions: 2,
          deadlineType: 'fixed',
          allowSelfReview: true,
          cost: 0,
        },
        attempt.userId
      );
      assertActivationAttemptCurrent(attempt);

      if (
        !receipt ||
        !receipt.isFirstPromise ||
        !receipt.activation?.confirmed ||
        receipt.activation.firstPromiseId !== challenge.id
      ) {
        throw new Error(t('fullAuth.source.error.incomplete_promise_response'));
      }

      const referral = skipReferral ? null : visibleReferral(receipt.referral);
      const visibleReceipt: PromiseCreationReceipt = {
        ...receipt,
        referral,
        activation: {
          ...receipt.activation,
          referral,
        },
      };

      await clearConfirmedDraft(attempt);
      clearPendingReferral(attempt.userId);
      const confirmedPromiseId = challenge.id.trim();
      setActivationOwnerId(attempt.userId);
      setCreatedPromise(challenge);
      setActivationReceipt(visibleReceipt);
      if (confirmedPromiseId) {
        void emitConfirmedOutcome(
          'promise-created',
          createConfirmedReceipt('promise-creation', confirmedPromiseId)
        );
      }
      setStep('receipt');
      trackOnboardingJourney({
        action: 'completed',
        outcome: 'succeeded',
        stage: 'activation',
      });
      trackProductEvent('Promise Created', {
        creation_source: 'onboarding',
        duration_bucket: getPromiseDurationBucket(duration),
        is_first_promise: true,
        proof_type: verificationType,
      });
      trackMetaAdsCreatePromise();
    } catch (error: unknown) {
      if (
        isLegalAcceptanceRequiredError(error) &&
        isAccountIdentityCurrent(attempt)
      ) {
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'blocked',
          stage: 'activation',
        });
        setLegalConfirmed(false);
        setLegalReady(false);
        setLegalConsentAt(null);
        setStep('auth_method');
        setAuthNotice({
          title: t('fullAuth.onboarding.confirm_the_required_documents'),
          message: t(
            'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below'
          ),
        });
        return;
      }

      if (activeActivationRequestRef.current === requestId) {
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'failed',
          stage: 'activation',
        });
        setStep('auth_method');
        setAuthNotice({
          title: t('todayProof.residual.promise_not_created'),
          message:
            error instanceof Error
              ? error.message
              : t('fullAuth.source.error.draft_safe'),
        });
      }
    } finally {
      if (activeActivationRequestRef.current === requestId) {
        activeActivationRequestRef.current = null;
        setIsFinishing(false);
      }
    }
  };

  continueToFirstPromiseRef.current = continueToFirstPromise;

  useEffect(() => {
    if (
      !resumeAuthenticatedDraft ||
      !hydrated ||
      !user?.id ||
      !promise.trim() ||
      !proofType
    ) {
      return;
    }

    setResumeAuthenticatedDraft(false);
    void continueToFirstPromiseRef.current?.({
      skipReferral: normalizeInviteCode(referralCode) === '',
    });
  }, [
    hydrated,
    promise,
    proofType,
    referralCode,
    resumeAuthenticatedDraft,
    user?.id,
  ]);

  const finishActivation = async () => {
    trackProductEvent('Accountability Invite Journey', {
      context: createdPromise ? 'present' : 'missing',
      source: 'onboarding',
      stage: 'handoff_requested',
    });
    const nextStep =
      accountabilityChoice === 'new_group'
        ? 'promise_accountability'
        : 'first_promise';
    if (
      activeCompletionRequestRef.current !== null ||
      activeActivationRequestRef.current !== null ||
      !createdPromise ||
      !activationOwnerId ||
      useAuthStore.getState().user?.id !== activationOwnerId ||
      !activationReceipt?.activation?.confirmed
    ) {
      logEvent('warn', 'onboarding_completion_blocked', {
        source: 'onboarding',
        next_step: nextStep,
        has_created_promise: Boolean(createdPromise),
        has_activation_owner: Boolean(activationOwnerId),
        has_confirmed_receipt: Boolean(
          activationReceipt?.activation?.confirmed
        ),
      });
      trackOnboardingJourney({
        action: 'completed',
        outcome: 'blocked',
        selection:
          accountabilityChoice === 'new_group' ? 'invite_someone' : 'today',
        stage: 'receipt',
      });
      return;
    }

    const requestId = ++completionRequestSequenceRef.current;
    activeCompletionRequestRef.current = requestId;
    const attempt: AccountAttempt = {
      epoch: accountAttemptEpochRef.current,
      requestId,
      userId: activationOwnerId,
    };
    setIsFinishing(true);
    trackOnboardingJourney({
      action: 'continued',
      selection:
        accountabilityChoice === 'new_group' ? 'invite_someone' : 'today',
      stage: 'receipt',
    });
    setFinishError(null);
    addBreadcrumb('onboarding_completion_requested', {
      source: 'onboarding',
      next_step: nextStep,
    });
    try {
      assertCompletionAttemptCurrent(attempt);
      // Block secondary prompts synchronously before the route can advance.
      // Local persistence must never hold up this confirmed user action.
      void beginOnboardingInvitation({
        ownerUserId: attempt.userId,
        firstPromiseId: createdPromise.id,
        accountabilityChoice,
      });
      addBreadcrumb('onboarding_completion_queued', {
        source: 'onboarding',
        next_step: nextStep,
      });
      await completeOnboarding({
        activationPath: 'first_promise',
        referralUsed: Boolean(activationReceipt.referral),
        completionHandoff: {
          firstPromiseId: createdPromise.id,
          accountabilityChoice,
        },
      });
      void queueActivationReview(attempt.userId);
      trackOnboardingJourney({
        action: 'completed',
        outcome: 'succeeded',
        selection:
          accountabilityChoice === 'new_group' ? 'invite_someone' : 'today',
        stage: 'receipt',
      });
      // completeOnboarding marks the account complete, which can make
      // RootLayout replace this screen before the promise resolves. The auth
      // store already verified the account/session around the server receipt;
      // do not treat that expected route transition as an account change.
      addBreadcrumb('onboarding_completion_confirmed', {
        source: 'onboarding',
        next_step: nextStep,
      });
      // RootLayout owns the single post-onboarding destination. The confirmed
      // state change above causes it to consume the queued handoff and replace
      // this screen exactly once.
    } catch (error: unknown) {
      if (activeCompletionRequestRef.current === requestId) {
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'failed',
          selection:
            accountabilityChoice === 'new_group' ? 'invite_someone' : 'today',
          stage: 'receipt',
        });
        logEvent('error', 'onboarding_completion_failed', {
          source: 'onboarding',
          next_step: nextStep,
          recovery: 'stay_on_receipt',
        });
        logCrash(error, {
          type: 'onboarding_completion_handoff_error',
          context: 'onboarding_finish_activation',
          userAction:
            nextStep === 'promise_accountability'
              ? 'continue_to_invite'
              : 'see_today',
          screenName: 'onboarding',
          additionalContext: {
            source: 'onboarding',
            nextStep,
            recovery: 'stay_on_receipt',
          },
        });
        setFinishError(
          error instanceof Error
            ? error.message
            : t('fullAuth.source.error.promise_safe')
        );
      }
    } finally {
      if (activeCompletionRequestRef.current === requestId) {
        activeCompletionRequestRef.current = null;
        setIsFinishing(false);
      }
    }
  };

  const handleProviderSignIn = async (provider: AuthProvider) => {
    if (
      !legalConfirmed ||
      !validateReferralBeforeAuthentication() ||
      authProviderLockRef.current ||
      authProviderLoading ||
      emailAuthHandoffRef.current
    )
      return;

    trackOnboardingJourney({
      action: 'requested',
      selection: provider,
      stage: 'auth',
    });
    trackProductEvent('Authentication Result', {
      flow: 'signup',
      method: provider,
      outcome: 'started',
    });

    const requestId = ++providerRequestSequenceRef.current;
    let authenticationSucceeded = false;
    activeProviderRequestRef.current = requestId;
    const startingUserId = useAuthStore.getState().user?.id ?? null;
    const isCurrentProviderRequest = () =>
      mountedRef.current &&
      activeProviderRequestRef.current === requestId &&
      authProviderLockRef.current === provider;
    const assertCurrentProviderRequest = (expectedUserId: string | null) => {
      if (
        !isCurrentProviderRequest() ||
        (useAuthStore.getState().user?.id ?? null) !== expectedUserId
      ) {
        throw accountChangedError(t('fullAuth.source.error.account_changed'));
      }
    };

    authProviderLockRef.current = provider;
    providerHandoffRef.current = true;
    setAuthProviderLoading(provider);
    setAuthNotice(null);

    try {
      assertCurrentProviderRequest(startingUserId);
      await saveOnboardingDraft(
        {
          promise,
          proofType,
          durationDays: duration,
          accountabilityChoice,
          accountabilityChoiceConfirmed: accountabilityConfirmed,
          legalConsentAt,
          legalConsentVersions,
          referralCode,
          marketingOptIn,
        },
        startingUserId,
        'auth_method'
      );
      assertCurrentProviderRequest(startingUserId);
      await (provider === 'apple' ? signInWithApple() : signInWithGoogle());

      if (!isCurrentProviderRequest())
        throw accountChangedError(t('fullAuth.source.error.account_changed'));
      const authenticatedState = useAuthStore.getState();
      if (!authenticatedState.isAuthenticated || !authenticatedState.user?.id) {
        throw new Error(t('fullAuth.source.error.sign_in_session'));
      }
      const authenticatedUserId = authenticatedState.user.id;
      authenticationSucceeded = true;
      trackOnboardingJourney({
        action: 'completed',
        outcome: 'succeeded',
        selection: provider,
        stage: 'auth',
      });
      trackProductEvent('Authentication Result', {
        flow: 'signup',
        method: provider,
        outcome: 'succeeded',
      });

      assertCurrentProviderRequest(authenticatedUserId);
      const claimedDraft = await loadOnboardingDraftForUser({
        userId: authenticatedUserId,
        hasCompletedOnboarding:
          authenticatedState.hasCompletedOnboarding ?? false,
      });
      assertCurrentProviderRequest(authenticatedUserId);
      if (
        !claimedDraft?.promise.trim() ||
        !claimedDraft.proofType ||
        claimedDraft.ownerUserId !== authenticatedUserId
      ) {
        throw new Error(t('fullAuth.source.error.claim_draft'));
      }
      if (!legalConfirmed) {
        throw new Error(t('fullAuth.source.error.confirm_documents'));
      }
      if (!(await hasCurrentLegalReceipt(authenticatedUserId, claimedDraft)))
        return;
      await preserveLegacyMarketingEmailConsent(
        authenticatedUserId,
        claimedDraft.marketingOptIn
      );
      assertCurrentProviderRequest(authenticatedUserId);

      await saveOnboardingDraft(claimedDraft, authenticatedUserId, null);

      setPromise(claimedDraft.promise);
      setProofType(claimedDraft.proofType);
      setAccountabilityChoice(
        claimedDraft.accountabilityChoice === 'new_group'
          ? 'new_group'
          : 'just_me'
      );
      setAccountabilityConfirmed(true);
      restoredEntryRef.current = true;
      if (!authenticatedState.hasCompletedOnboarding) {
        await continueToFirstPromise({
          skipReferral: normalizeInviteCode(claimedDraft.referralCode) === '',
        });
      }
    } catch (error: unknown) {
      if (!isCurrentProviderRequest()) return;
      const message =
        error instanceof Error
          ? error.message
          : t('fullAuth.source.error.provider_sign_in', {
              providerName: provider === 'apple' ? 'Apple' : 'Google',
            });

      if (isAuthCancelled(message) && !authenticationSucceeded) {
        trackOnboardingJourney({
          action: 'completed',
          outcome: 'cancelled',
          selection: provider,
          stage: 'auth',
        });
        trackProductEvent('Authentication Result', {
          flow: 'signup',
          method: provider,
          outcome: 'cancelled',
        });
        if ((useAuthStore.getState().user?.id ?? null) !== startingUserId) {
          return;
        }
        providerHandoffRef.current = false;
        try {
          assertCurrentProviderRequest(startingUserId);
          await saveOnboardingDraft(
            {
              promise,
              proofType,
              durationDays: duration,
              accountabilityChoice,
              accountabilityChoiceConfirmed: accountabilityConfirmed,
              legalConsentAt,
              legalConsentVersions,
              referralCode,
              marketingOptIn,
            },
            startingUserId,
            'auth_cancelled'
          );
          assertCurrentProviderRequest(startingUserId);
        } catch {
          if (isCurrentProviderRequest()) {
            setAuthNotice({
              title: t('fullAuth.onboarding.your_draft_could_not_be_saved_yet'),
              message: t(
                'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p'
              ),
            });
          }
          return;
        }
        setAuthCancelled(true);
        // Native provider sheets can recreate the Expo root before their
        // promise settles. Reassert the route only after persisting the
        // recovery state so the newly mounted screen reads AUTH-11 instead of
        // falling back to the provider chooser.
        router.replace('/onboarding');
      } else {
        if (!authenticationSucceeded) {
          trackOnboardingJourney({
            action: 'completed',
            outcome: 'failed',
            selection: provider,
            stage: 'auth',
          });
          trackProductEvent('Authentication Result', {
            flow: 'signup',
            method: provider,
            outcome: 'failed',
          });
        }
        providerHandoffRef.current = false;
        if ((useAuthStore.getState().user?.id ?? null) !== startingUserId) {
          return;
        }
        const providerName = provider === 'apple' ? 'Apple' : 'Google';
        setAuthNotice({
          title: t('fullAuth.onboarding.providername_sign_in_did_not_finish', {
            providerName: providerName,
          }),
          message: t('fullAuth.onboarding.message_your_draft_is_still_here', {
            message: message,
          }),
        });
      }
    } finally {
      if (
        activeProviderRequestRef.current === requestId &&
        authProviderLockRef.current === provider
      ) {
        activeProviderRequestRef.current = null;
        authProviderLockRef.current = null;
        if (mountedRef.current) setAuthProviderLoading(null);
      }
    }
  };

  const handleEmailSignIn = async () => {
    if (
      !legalConfirmed ||
      !validateReferralBeforeAuthentication() ||
      emailAuthHandoffRef.current ||
      authProviderLockRef.current ||
      authProviderLoading
    )
      return;

    trackOnboardingJourney({
      action: 'requested',
      selection: 'password',
      stage: 'auth',
    });
    trackProductEvent('Authentication Result', {
      flow: 'signup',
      method: 'password',
      outcome: 'started',
    });

    const requestId = ++emailRequestSequenceRef.current;
    activeEmailRequestRef.current = requestId;
    const startingUserId = useAuthStore.getState().user?.id ?? null;
    emailAuthHandoffRef.current = true;
    setEmailAuthLoading(true);
    setAuthNotice(null);

    try {
      if (
        !mountedRef.current ||
        activeEmailRequestRef.current !== requestId ||
        (useAuthStore.getState().user?.id ?? null) !== startingUserId
      ) {
        throw accountChangedError(t('fullAuth.source.error.account_changed'));
      }
      await saveOnboardingDraft(
        {
          promise,
          proofType,
          durationDays: duration,
          accountabilityChoice,
          accountabilityChoiceConfirmed: accountabilityConfirmed,
          legalConsentAt,
          legalConsentVersions,
          referralCode,
          marketingOptIn,
        },
        startingUserId,
        'auth_method'
      );
      if (
        !mountedRef.current ||
        activeEmailRequestRef.current !== requestId ||
        (useAuthStore.getState().user?.id ?? null) !== startingUserId
      ) {
        throw accountChangedError(t('fullAuth.source.error.account_changed'));
      }
      router.replace('/email-auth?mode=signup&from=onboarding');
      trackOnboardingJourney({
        action: 'handed_off',
        selection: 'password',
        stage: 'auth',
      });
      trackProductEvent('Authentication Result', {
        flow: 'signup',
        method: 'password',
        outcome: 'handoff',
      });
    } catch {
      trackOnboardingJourney({
        action: 'completed',
        outcome: 'failed',
        selection: 'password',
        stage: 'auth',
      });
      trackProductEvent('Authentication Result', {
        flow: 'signup',
        method: 'password',
        outcome: 'failed',
      });
      if (mountedRef.current && activeEmailRequestRef.current === requestId) {
        const changed =
          (useAuthStore.getState().user?.id ?? null) !== startingUserId;
        setAuthNotice(
          changed
            ? {
                title: t('fullAuth.onboarding.your_account_changed'),
                message: t(
                  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email'
                ),
              }
            : {
                title: t(
                  'fullAuth.onboarding.your_draft_could_not_be_saved_yet'
                ),
                message: t(
                  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c'
                ),
              }
        );
      }
    } finally {
      if (activeEmailRequestRef.current === requestId) {
        activeEmailRequestRef.current = null;
        emailAuthHandoffRef.current = false;
        if (mountedRef.current) setEmailAuthLoading(false);
      }
    }
  };

  const confirmCombinedForSignedInAccount = async () => {
    const currentUserId = useAuthStore.getState().user?.id;
    if (!currentUserId || !legalConfirmed || isFinishing) return;

    let canCreate = false;
    setIsFinishing(true);
    setAuthNotice(null);
    try {
      if (
        !(await hasCurrentLegalReceipt(currentUserId, {
          promise,
          proofType,
          durationDays: duration,
          accountabilityChoice,
          accountabilityChoiceConfirmed: accountabilityConfirmed,
          legalConsentAt,
          legalConsentVersions,
          referralCode,
          marketingOptIn,
        }))
      )
        return;
      await preserveLegacyMarketingEmailConsent(currentUserId, marketingOptIn);
      if (useAuthStore.getState().user?.id !== currentUserId) {
        throw accountChangedError(t('fullAuth.source.error.account_changed'));
      }
      canCreate = true;
    } catch (error) {
      setAuthNotice({
        title: t('fullAuth.onboarding.legal_confirmation_did_not_finish'),
        message:
          error instanceof Error
            ? error.message
            : t(
                'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing'
              ),
      });
    } finally {
      if (mountedRef.current) setIsFinishing(false);
    }

    if (canCreate) {
      await continueToFirstPromise({
        skipReferral: normalizeInviteCode(referralCode) === '',
      });
    }
  };

  const keepLocalDraft = () => {
    setAuthCancelled(false);
    setStep('save_gate');
    void saveOnboardingDraft(
      {
        promise,
        proofType,
        durationDays: duration,
        accountabilityChoice,
        accountabilityChoiceConfirmed: accountabilityConfirmed,
        legalConsentAt,
        legalConsentVersions,
        referralCode,
        marketingOptIn,
      },
      user?.id ?? null,
      'preview'
    );
  };

  const deferAuth = () => {
    trackOnboardingJourney({ action: 'skipped', stage: 'auth' });
    move('preview');
    void saveOnboardingDraft(
      {
        promise,
        proofType,
        durationDays: duration,
        accountabilityChoice,
        accountabilityChoiceConfirmed: accountabilityConfirmed,
        legalConsentAt,
        legalConsentVersions,
        referralCode,
        marketingOptIn,
      },
      user?.id ?? null,
      'preview'
    );
  };

  if (showNotificationPermissionEducation) {
    const currentUserId = useAuthStore.getState().user?.id ?? null;
    return (
      <NotificationPrivacyOnboarding
        beforeAuth={!currentUserId}
        entryMode={
          isReplay
            ? 'replay'
            : currentUserId
              ? 'post_sign_in'
              : restoredEntryRef.current
                ? 'restored'
                : 'fresh'
        }
        userId={currentUserId}
        onBack={() => {
          setShowNotificationPermissionEducation(false);
          move(notificationPromptReturnStepRef.current);
        }}
        onComplete={completeNotificationPermissionEducation}
        promptContext="first_promise"
      />
    );
  }

  if (authCancelled) {
    return (
      <AppTextScaleProvider scale={phoneLayout.textScale}>
        <PaperOAuthCancelled
          hasDraft={Boolean(promise.trim())}
          onChooseMethod={() => {
            trackOnboardingJourney({
              action: 'continued',
              stage: 'auth_cancelled',
            });
            showAuthMethods();
          }}
          onKeepDraft={keepLocalDraft}
          testID="onboarding-oauth-cancelled"
        />
      </AppTextScaleProvider>
    );
  }

  const selectedProofOption = proofOptions.find(
    option => option.value === proofType
  );
  const SelectedProofIcon = selectedProofOption?.Icon;

  const screen = (() => {
    switch (step) {
      case 'welcome':
        return (
          <ScrollView
            contentContainerStyle={styles.welcomeScrollContent}
            showsVerticalScrollIndicator={false}
            testID="onboarding-welcome-scroll"
          >
            <View
              style={[
                styles.welcomeBody,
                compact && styles.welcomeBodyCompact,
                { paddingHorizontal: phoneLayout.screenInset },
              ]}
              testID="onboarding-welcome-body"
            >
              <Text style={styles.welcomeWordmark}>
                {t('fullAuth.onboarding.menta')}
              </Text>
              <View
                style={[
                  styles.welcomeMascotStage,
                  compact && styles.welcomeMascotStageCompact,
                  { height: welcomeHeroSize },
                ]}
              >
                <Mascot pose="welcome" size={welcomeHeroSize} />
              </View>
              <View style={styles.welcomeCopy}>
                <Text
                  style={[styles.heroTitle, compact && styles.heroTitleCompact]}
                >
                  {t('onboarding.welcome.title')}
                </Text>
                <Text
                  style={[
                    styles.heroBody,
                    styles.welcomeBodyText,
                    bodySmallLeading,
                  ]}
                >
                  {t('onboarding.welcome.body')}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.footerStack,
                styles.welcomeFooter,
                {
                  paddingBottom: actionDockBottomPadding,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
            >
              <PrimaryButton
                label={t('onboarding.welcome.action.start')}
                onPress={() => {
                  trackOnboardingJourney({
                    action: 'continued',
                    stage: 'welcome',
                  });
                  move('draft');
                }}
                testID="onboarding-start"
              />
              <PrimaryButton
                label={t('onboarding.welcome.action.sign_in')}
                onPress={() => {
                  trackOnboardingJourney({
                    action: 'handed_off',
                    selection: 'existing_account',
                    stage: 'welcome',
                  });
                  router.replace('/login');
                }}
                tone="outline"
                compactHeight
                testID="onboarding-existing-user"
              />
            </View>
          </ScrollView>
        );
      case 'draft':
        return (
          <View style={styles.flex}>
            <MentaHeader
              onBack={back}
              progress={0.2}
              screenInset={phoneLayout.screenInset}
              showBrand={false}
            />
            <View style={styles.onboardingOverflowStage}>
              <ScrollView
                automaticallyAdjustKeyboardInsets
                contentContainerStyle={contentStyle}
                key="onboarding-draft-scroll"
                ref={draftScrollRef}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={draftOverflow.onContentSizeChange}
                onLayout={draftOverflow.onLayout}
                onScroll={draftOverflow.onScroll}
                onScrollBeginDrag={draftOverflow.onScrollBeginDrag}
                scrollEventThrottle={16}
                scrollIndicatorInsets={{
                  bottom: actionDockContentClearance,
                }}
                showsVerticalScrollIndicator={draftOverflow.canScroll}
                style={styles.flex}
                testID="onboarding-draft-body"
              >
                <View
                  style={[
                    styles.draftWorkspace,
                    usesWideIPadWorkspace && styles.iPadWorkspace,
                  ]}
                  testID={
                    usesWideIPadWorkspace
                      ? 'onboarding-draft-ipad-workspace'
                      : undefined
                  }
                >
                  {usesWideIPadWorkspace ? (
                    <View
                      style={styles.iPadStepRail}
                      testID="onboarding-draft-ipad-rail"
                    >
                      <StepMeta
                        counter={t(
                          'fullAuth.onboarding.promise_setup_step_one'
                        )}
                      />
                      <View style={styles.iPadRailCopy}>
                        <Text style={styles.iPadRailKicker}>
                          {t('fullAuth.onboarding.your_first_promise')}
                        </Text>
                        <Text style={styles.iPadRailTitle}>
                          {t(
                            'fullAuth.onboarding.start_with_one_thing_that_matters_today'
                          )}
                        </Text>
                        <Text style={[styles.heroBody, bodySmallLeading]}>
                          {t(
                            'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_'
                          )}
                        </Text>
                      </View>
                      <View style={styles.iPadStepTrack}>
                        <View style={styles.iPadStepTrackActive} />
                        <View style={styles.iPadStepTrackInactive} />
                      </View>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.draftFormStack,
                      usesWideIPadWorkspace && styles.iPadDraftForm,
                    ]}
                    testID={
                      usesWideIPadWorkspace
                        ? 'onboarding-draft-ipad-form'
                        : undefined
                    }
                  >
                    <View style={styles.draftCopy}>
                      <Text style={styles.draftKicker}>
                        {t('fullAuth.onboarding.your_first_promise')}
                      </Text>
                      <Text style={styles.draftTitle}>
                        {t(
                          'fullAuth.onboarding.what_s_one_thing_you_want_to_do'
                        )}
                      </Text>
                    </View>
                    {!promise.trim() || examplesExpanded ? (
                      <View style={styles.exampleChoices}>
                        <Text style={styles.exampleHeading}>
                          {t('fullAuth.onboarding.show_another_example')}
                        </Text>
                        <View style={styles.exampleChipList}>
                          {promiseExamples.map(example => (
                            <Pressable
                              accessibilityRole="button"
                              key={example}
                              onPress={() => {
                                setPromise(example);
                                setExamplesExpanded(false);
                                setValidation(null);
                                trackOnboardingJourney({
                                  action: 'selected',
                                  selection: 'example',
                                  stage: 'promise',
                                });
                                requestAnimationFrame(() =>
                                  inputRef.current?.focus()
                                );
                                void emitHaptic({ type: 'selection' });
                              }}
                              style={({ pressed }) => [
                                styles.exampleChip,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text style={styles.exampleChipText}>
                                {example}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setExamplesExpanded(true);
                          trackOnboardingJourney({
                            action: 'expanded',
                            stage: 'promise',
                          });
                        }}
                        style={styles.examplesRestore}
                      >
                        <Text style={styles.exampleLink}>
                          {t('fullAuth.onboarding.show_another_example')}
                        </Text>
                      </Pressable>
                    )}
                    <View
                      style={styles.promiseField}
                      testID="onboarding-promise-field"
                      onLayout={event => {
                        const { height, y } = event.nativeEvent.layout;
                        setDraftFieldLayout({ height, y });
                      }}
                    >
                      <AppTextArea
                        ref={inputRef}
                        accessibilityLabel={t(
                          'fullAuth.onboarding.your_first_promise_2'
                        )}
                        autoCapitalize="sentences"
                        autoFocus={
                          !restoredEntryRef.current ||
                          draftEditFocusRequestedRef.current
                        }
                        fieldStyle={styles.promiseFieldShell}
                        maxLength={160}
                        inputStyle={[
                          styles.promiseTextArea,
                          usesWideIPadWorkspace && styles.iPadPromiseTextArea,
                        ]}
                        onChangeText={value => {
                          setPromise(value);
                          if (value.trim()) setExamplesExpanded(false);
                          if (validation) setValidation(null);
                        }}
                        onBlur={() => setDraftFieldFocused(false)}
                        onFocus={() => setDraftFieldFocused(true)}
                        placeholder={t('todayProof.residual.type_your_promise')}
                        returnKeyType="next"
                        testID="onboarding-promise-input"
                        textAlignVertical="top"
                        value={promise}
                      />
                      <View style={styles.inputMeta}>
                        <Text style={styles.localCopy}>
                          {t(
                            'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type'
                          )}
                        </Text>
                        {promise.length > 0 ? (
                          <Text style={styles.characterCount}>
                            {promise.length} / 160
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {Platform.OS === 'android' && keyboardVisible ? (
                      <View style={styles.draftInlineKeyboardAction}>
                        <PrimaryButton
                          disabled={!promise.trim()}
                          label={t('fullAuth.onboarding.choose_proof')}
                          onPress={submitDraft}
                          testID="onboarding-draft-keyboard-continue"
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              </ScrollView>
              <OnboardingOverflowIndicator
                testID="onboarding-draft-overflow-indicator"
                visible={draftOverflow.showIndicator}
              />
            </View>
            {!keyboardVisible ? (
              <View style={styles.draftFooter}>
                {validation ? (
                  <View
                    accessible
                    accessibilityLiveRegion="assertive"
                    accessibilityRole="alert"
                    style={styles.draftValidation}
                    testID="onboarding-draft-error"
                  >
                    <AlertCircleIcon color={colours.danger} size={17} />
                    <Text style={styles.draftValidationText}>{validation}</Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.draftActionDock,
                    usesWideIPadWorkspace && styles.iPadDraftFooter,
                    {
                      paddingBottom: actionDockBottomPadding,
                      paddingHorizontal: phoneLayout.screenInset,
                    },
                  ]}
                >
                  <View style={styles.flexButton}>
                    <PrimaryButton
                      disabled={!promise.trim()}
                      label={t('fullAuth.onboarding.choose_proof')}
                      onPress={submitDraft}
                      testID="onboarding-draft-continue"
                    />
                  </View>
                </View>
              </View>
            ) : null}
            {Platform.OS === 'ios' && keyboardVisible ? (
              <View
                style={[
                  styles.draftKeyboardOverlay,
                  {
                    bottom: keyboardHeight,
                    paddingHorizontal: phoneLayout.screenInset,
                  },
                ]}
              >
                <PrimaryButton
                  disabled={!promise.trim()}
                  label={t('fullAuth.onboarding.choose_proof')}
                  onPress={submitDraft}
                  testID="onboarding-draft-keyboard-continue"
                />
              </View>
            ) : null}
          </View>
        );
      case 'proof':
        return (
          <>
            <MentaHeader
              onBack={() => {
                if (proofDisclosure) {
                  trackOnboardingJourney({
                    action: 'edited',
                    stage: 'accountability',
                  });
                  setProofDisclosure(false);
                  return;
                }
                back();
              }}
              progress={proofDisclosure ? 0.48 : 0.36}
              screenInset={phoneLayout.screenInset}
              showBrand={false}
            />
            <View style={styles.onboardingOverflowStage}>
              <ScrollView
                ref={proofScrollRef}
                contentContainerStyle={[
                  styles.proofContent,
                  phoneLayout.isCompactHeight && styles.proofContentCompact,
                  usesWideIPadWorkspace && styles.iPadProofContent,
                  {
                    paddingBottom: actionDockContentClearance,
                    paddingHorizontal: usesWideIPadWorkspace
                      ? mentaSpacing[8]
                      : phoneLayout.screenInset,
                  },
                ]}
                key="onboarding-proof-scroll"
                onContentSizeChange={proofOverflow.onContentSizeChange}
                onLayout={proofOverflow.onLayout}
                onScroll={proofOverflow.onScroll}
                onScrollBeginDrag={proofOverflow.onScrollBeginDrag}
                scrollEventThrottle={16}
                scrollIndicatorInsets={{
                  bottom: actionDockContentClearance,
                }}
                showsVerticalScrollIndicator={proofOverflow.canScroll}
                style={styles.flex}
                testID="onboarding-proof-body"
              >
                <View
                  style={[
                    styles.proofWorkspace,
                    usesWideIPadWorkspace && styles.iPadWorkspace,
                  ]}
                  testID={
                    usesWideIPadWorkspace
                      ? 'onboarding-proof-ipad-workspace'
                      : undefined
                  }
                >
                  {usesWideIPadWorkspace ? (
                    <View
                      style={styles.iPadStepRail}
                      testID="onboarding-proof-ipad-rail"
                    >
                      <StepMeta
                        counter={t(
                          'fullAuth.onboarding.promise_setup_step_two'
                        )}
                      />
                      <View style={styles.iPadRailCopy}>
                        <Text style={styles.iPadRailKicker}>
                          {t('fullAuth.onboarding.proof_and_support')}
                        </Text>
                        <Text style={styles.iPadRailTitle}>
                          {t(
                            'fullAuth.onboarding.decide_what_finished_will_look_like'
                          )}
                        </Text>
                        <Text style={[styles.heroBody, bodySmallLeading]}>
                          {t(
                            'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b'
                          )}
                        </Text>
                      </View>
                      <View style={styles.iPadStepTrack}>
                        <View style={styles.iPadStepTrackComplete} />
                        <View style={styles.iPadStepTrackActive} />
                      </View>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.proofSelectionColumn,
                      usesWideIPadWorkspace && styles.iPadProofSelectionColumn,
                    ]}
                    testID={
                      usesWideIPadWorkspace
                        ? 'onboarding-proof-ipad-selections'
                        : undefined
                    }
                  >
                    {!proofDisclosure ? (
                      <View style={styles.proofCopy}>
                        <Text style={styles.promiseContext} numberOfLines={2}>
                          {t('fullAuth.onboarding.for_promise', {
                            promise: promise.trim(),
                          })}
                        </Text>
                        <Text style={styles.proofTitle}>
                          {t('fullAuth.onboarding.how_will_you_prove_it')}
                        </Text>
                        <Text style={[styles.heroBody, bodySmallLeading]}>
                          {t(
                            'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in'
                          )}
                        </Text>
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.proofList,
                        !proofDisclosure && styles.proofListInitial,
                      ]}
                    >
                      {proofOptions
                        .filter(() => !proofDisclosure)
                        .map(option => {
                          const selected = proofType === option.value;
                          return (
                            <Pressable
                              accessibilityRole="radio"
                              accessibilityState={{
                                checked: selected,
                                selected,
                              }}
                              key={option.value}
                              onPress={() => {
                                setProofType(option.value);
                                setProofDisclosure(true);
                                trackOnboardingJourney({
                                  action: 'selected',
                                  selection: option.value,
                                  stage: 'proof',
                                });
                                void emitHaptic({ type: 'selection' });
                              }}
                              style={({ pressed }) => [
                                styles.proofRow,
                                styles.proofRowInitial,
                                phoneLayout.isCompactHeight &&
                                  styles.proofRowCompact,
                                selected && styles.proofRowSelected,
                                pressed && styles.pressed,
                              ]}
                              testID={`onboarding-proof-${option.value}`}
                            >
                              <View style={styles.proofIconSlot}>
                                <option.Icon
                                  size={22}
                                  color={
                                    selected ? colours.action : colours.text
                                  }
                                />
                              </View>
                              <View style={styles.proofText}>
                                <Text style={styles.proofRowTitle}>
                                  {option.title}
                                </Text>
                                <Text
                                  style={[
                                    styles.proofRowDetail,
                                    bodySmallLeading,
                                  ]}
                                >
                                  {option.detail}
                                </Text>
                              </View>
                              {selected ? (
                                <View style={styles.choiceCheck}>
                                  <CheckIcon color={colours.canvas} size={15} />
                                </View>
                              ) : null}
                            </Pressable>
                          );
                        })}
                    </View>
                    {proofDisclosure ? (
                      <Animated.View
                        style={[
                          styles.disclosureStage,
                          {
                            opacity: proofDisclosureProgress,
                            transform: [
                              {
                                translateY: proofDisclosureProgress.interpolate(
                                  {
                                    inputRange: [0, 1],
                                    outputRange: [motion.distance(18), 0],
                                  }
                                ),
                              },
                            ],
                          },
                        ]}
                        testID="onboarding-accountability-disclosure"
                      >
                        <View style={styles.resolvedProofRow}>
                          <View style={styles.resolvedProofIdentity}>
                            {SelectedProofIcon ? (
                              <View style={styles.resolvedProofIcon}>
                                <SelectedProofIcon
                                  color={colours.action}
                                  size={19}
                                />
                              </View>
                            ) : null}
                            <Text
                              style={styles.resolvedProofText}
                              textScale={Math.min(onboardingTextScale, 1.12)}
                            >
                              {proofLabel(proofType, t)}
                            </Text>
                          </View>
                          <Pressable
                            accessibilityLabel={t('fullAuth.onboarding.edit')}
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() => {
                              setProofDisclosure(false);
                              trackOnboardingJourney({
                                action: 'edited',
                                stage: 'accountability',
                              });
                            }}
                            style={({ pressed }) => [
                              styles.proofChange,
                              pressed && styles.pressed,
                            ]}
                            testID="onboarding-proof-change"
                          >
                            <Text
                              style={styles.proofChangeText}
                              textScale={Math.min(onboardingTextScale, 1.12)}
                            >
                              {t('fullAuth.onboarding.edit')}
                            </Text>
                          </Pressable>
                        </View>
                        <View
                          style={[
                            styles.accountabilityCopy,
                            phoneLayout.isCompactHeight &&
                              styles.accountabilityCopyCompact,
                          ]}
                        >
                          <Text
                            style={styles.accountabilityTitle}
                            textScale={Math.min(onboardingTextScale, 1.18)}
                          >
                            {t(
                              'fullAuth.onboarding.who_will_hold_you_accountable'
                            )}
                          </Text>
                          <Text style={[styles.heroBody, bodySmallLeading]}>
                            {t(
                              'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_'
                            )}
                          </Text>
                        </View>
                        <View
                          accessibilityRole="radiogroup"
                          style={styles.accountabilityList}
                          testID="onboarding-accountability-choice"
                        >
                          {(
                            [
                              {
                                value: 'new_group',
                                title: t('fullAuth.onboarding.create_my_group'),
                                detail: t(
                                  'fullAuth.onboarding.create_my_group_detail'
                                ),
                              },
                              {
                                value: 'just_me',
                                title: t('todayProof.promise.private_only'),
                                detail: t(
                                  'fullAuth.onboarding.start_privately_you_can_invite_people_later'
                                ),
                              },
                            ] as const
                          ).map(option => {
                            const selected =
                              accountabilityConfirmed &&
                              accountabilityChoice === option.value;
                            const AccountabilityIcon =
                              option.value === 'new_group'
                                ? UsersIcon
                                : LockIcon;
                            return (
                              <Pressable
                                accessibilityRole="radio"
                                accessibilityState={{
                                  checked: selected,
                                  selected,
                                }}
                                key={option.value}
                                onPress={() => {
                                  setAccountabilityChoice(option.value);
                                  setAccountabilityConfirmed(true);
                                  trackOnboardingJourney({
                                    action: 'selected',
                                    selection:
                                      option.value === 'new_group'
                                        ? 'invite_someone'
                                        : 'private',
                                    stage: 'accountability',
                                  });
                                  void emitHaptic({ type: 'selection' });
                                }}
                                style={({ pressed }) => [
                                  styles.proofRow,
                                  phoneLayout.isCompactHeight &&
                                    styles.proofRowCompact,
                                  styles.accountabilityRow,
                                  selected && styles.proofRowSelected,
                                  pressed && styles.pressed,
                                ]}
                                testID={`onboarding-accountability-${option.value}`}
                              >
                                <View style={styles.proofIconSlot}>
                                  <AccountabilityIcon
                                    color={
                                      selected ? colours.action : colours.text
                                    }
                                    size={22}
                                  />
                                </View>
                                <View
                                  style={[
                                    styles.proofText,
                                    styles.accountabilityText,
                                  ]}
                                >
                                  <Text style={styles.proofRowTitle}>
                                    {option.title}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.proofRowDetail,
                                      bodySmallLeading,
                                    ]}
                                  >
                                    {option.detail}
                                  </Text>
                                </View>
                                {selected ? (
                                  <View
                                    style={[
                                      styles.choiceCheck,
                                      styles.accountabilityChoiceCheck,
                                    ]}
                                  >
                                    <CheckIcon
                                      color={colours.canvas}
                                      size={15}
                                    />
                                  </View>
                                ) : null}
                              </Pressable>
                            );
                          })}
                        </View>
                      </Animated.View>
                    ) : null}
                  </View>
                  {usesWideIPadWorkspace ? (
                    <View
                      style={styles.iPadPromiseSummary}
                      testID="onboarding-proof-ipad-summary"
                    >
                      <Text style={styles.iPadSummaryLabel}>
                        {t('fullAuth.onboarding.your_promise_2')}
                      </Text>
                      <Text style={styles.iPadSummaryPromise}>
                        {promise.trim()}
                      </Text>
                      <View style={styles.iPadSummaryDivider} />
                      <View style={styles.iPadSummaryFact}>
                        <Text style={styles.summaryEyebrow}>
                          {t('fullAuth.onboarding.proof')}
                        </Text>
                        <Text style={styles.iPadSummaryValue}>
                          {proofLabel(proofType, t)}
                        </Text>
                      </View>
                      {proofDisclosure ? (
                        <View style={styles.iPadSummaryFact}>
                          <Text style={styles.summaryEyebrow}>
                            {t('fullAuth.onboarding.accountability')}
                          </Text>
                          <Text style={styles.iPadSummaryValue}>
                            {accountabilityChoice === 'new_group'
                              ? t('fullAuth.onboarding.create_my_group')
                              : t('todayProof.promise.private_only')}
                          </Text>
                        </View>
                      ) : null}
                      <Text style={styles.iPadSummaryNote}>
                        {t(
                          'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_'
                        )}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
              <OnboardingOverflowIndicator
                testID="onboarding-proof-overflow-indicator"
                visible={proofOverflow.showIndicator}
              />
            </View>
            <View
              style={[
                styles.proofActionDock,
                styles.fixedActionDock,
                usesWideIPadWorkspace && styles.iPadProofFooter,
                {
                  paddingBottom: actionDockBottomPadding,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
              testID="onboarding-proof-footer"
            >
              <View style={styles.flexButton}>
                <PrimaryButton
                  disabled={!proofType || !accountabilityConfirmed}
                  label={t('fullAuth.onboarding.choose_length')}
                  onPress={() => {
                    trackOnboardingJourney({
                      action: 'continued',
                      stage: 'accountability',
                    });
                    move('duration');
                  }}
                  testID="onboarding-proof-continue"
                />
              </View>
            </View>
          </>
        );
      case 'preview':
        return (
          <>
            <MentaHeader
              onBack={back}
              progress={0.54}
              screenInset={phoneLayout.screenInset}
            />
            <View style={styles.onboardingOverflowStage}>
              <ScrollView
                contentContainerStyle={[
                  styles.previewBody,
                  compact && styles.previewBodyCompact,
                  {
                    paddingBottom: actionDockContentClearance,
                    paddingHorizontal: phoneLayout.screenInset,
                  },
                ]}
                key="onboarding-preview-scroll"
                scrollEventThrottle={16}
                scrollIndicatorInsets={{
                  bottom: actionDockContentClearance,
                }}
                onContentSizeChange={previewOverflow.onContentSizeChange}
                onLayout={previewOverflow.onLayout}
                onScroll={previewOverflow.onScroll}
                onScrollBeginDrag={previewOverflow.onScrollBeginDrag}
                showsVerticalScrollIndicator={previewOverflow.canScroll}
                style={styles.flex}
                testID="onboarding-preview-body"
              >
                <View style={styles.reviewContentStage}>
                  <Text style={[headingLeading, styles.previewTitle]}>
                    {t('fullAuth.onboarding.review_your_promise')}
                  </Text>
                  <View style={styles.reviewArtefactStage}>
                    <View
                      style={[
                        styles.todayCard,
                        compact && styles.todayCardCompact,
                      ]}
                    >
                      <Text style={styles.todayPromise}>{promise.trim()}</Text>
                      <Text style={styles.reviewMeta}>
                        {proofLabel(proofType, t)} ·{' '}
                        {t('fullAuth.onboarding.every_day')} · {duration}{' '}
                        {t('fullAuth.onboarding.days')}
                      </Text>
                      <Text style={styles.reviewAccountability}>
                        {accountabilityChoice === 'new_group'
                          ? t('fullAuth.onboarding.create_my_group')
                          : t('todayProof.promise.private_only')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.previewHelper, bodySmallLeading]}>
                    {t(
                      'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_'
                    )}
                  </Text>
                  <Pressable
                    accessibilityLabel={t('fullAuth.onboarding.edit')}
                    accessibilityRole="button"
                    onPress={() => {
                      trackOnboardingJourney({
                        action: 'edited',
                        stage: 'review',
                      });
                      enterDraftForEdit();
                    }}
                    style={({ pressed }) => [
                      styles.reviewEditAction,
                      pressed && styles.pressed,
                    ]}
                    testID="onboarding-preview-edit"
                  >
                    <Text style={styles.reviewEditText}>
                      {t('fullAuth.onboarding.edit')}
                    </Text>
                  </Pressable>
                  {finishError ? (
                    <View
                      accessible
                      accessibilityRole="alert"
                      style={styles.finishErrorCard}
                    >
                      <Text style={styles.finishErrorTitle}>
                        {t('fullAuth.onboarding.could_not_finish_setup')}
                      </Text>
                      <Text style={styles.finishError}>{finishError}</Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
              <OnboardingOverflowIndicator
                testID="onboarding-preview-overflow-indicator"
                visible={previewOverflow.showIndicator}
              />
            </View>
            <View
              style={[
                styles.reviewActionDock,
                styles.fixedActionDock,
                {
                  paddingBottom: actionDockBottomPadding,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
              testID="onboarding-preview-footer"
            >
              <View style={styles.flexButton}>
                <PrimaryButton
                  disabled={isFinishing}
                  label={t('fullAuth.onboarding.continue_to_save')}
                  onPress={continueAfterPreview}
                  testID="onboarding-preview-continue"
                />
              </View>
            </View>
          </>
        );
      case 'duration':
        return (
          <>
            <MentaHeader
              onBack={back}
              progress={0.62}
              screenInset={phoneLayout.screenInset}
            />
            <View style={styles.onboardingOverflowStage}>
              <ScrollView
                contentContainerStyle={[
                  styles.durationBody,
                  {
                    paddingBottom: actionDockContentClearance,
                    paddingHorizontal: phoneLayout.screenInset,
                  },
                ]}
                key="onboarding-duration-scroll"
                onContentSizeChange={durationOverflow.onContentSizeChange}
                onLayout={durationOverflow.onLayout}
                onScroll={durationOverflow.onScroll}
                onScrollBeginDrag={durationOverflow.onScrollBeginDrag}
                scrollEventThrottle={16}
                scrollIndicatorInsets={{
                  bottom: actionDockContentClearance,
                }}
                showsVerticalScrollIndicator={durationOverflow.canScroll}
                style={styles.flex}
                testID="onboarding-duration-body"
              >
                <View style={styles.durationCopy}>
                  <Text style={[headingLeading, styles.previewTitle]}>
                    {t(
                      'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise'
                    )}
                  </Text>
                  <Text style={[styles.heroBody, bodySmallLeading]}>
                    {t(
                      'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through'
                    )}
                  </Text>
                </View>
                <View style={styles.durationPromiseStage}>
                  <View style={styles.durationPromiseCard}>
                    <Text style={styles.durationPromiseText} numberOfLines={2}>
                      {promise.trim()}
                    </Text>
                    <Text style={styles.durationPromiseMeta}>
                      {t('fullAuth.onboarding.every_day')}
                    </Text>
                  </View>
                </View>
                <View
                  accessibilityLabel={t('fullAuth.onboarding.promise_length')}
                  accessibilityRole="radiogroup"
                  style={styles.durationOptions}
                >
                  {durationOptions.map(option => {
                    const selected = duration === option;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected, selected }}
                        key={option}
                        onPress={() => {
                          setDuration(option);
                          trackOnboardingJourney({
                            action: 'selected',
                            selection: `days_${option}` as
                              | 'days_7'
                              | 'days_14'
                              | 'days_30',
                            stage: 'duration',
                          });
                          void emitHaptic({ type: 'selection' });
                        }}
                        style={({ pressed }) => [
                          styles.durationOption,
                          selected && styles.durationOptionSelected,
                          pressed && styles.pressed,
                        ]}
                        testID={`onboarding-duration-${option}`}
                      >
                        <Text
                          style={[
                            styles.durationOptionText,
                            selected && styles.durationOptionTextSelected,
                          ]}
                        >
                          {option} {t('fullAuth.onboarding.days')}
                        </Text>
                        <View style={styles.durationOptionMeaning}>
                          <Text
                            style={[
                              styles.durationCheckIns,
                              selected && styles.durationOptionTextSelected,
                            ]}
                          >
                            {t('fullAuth.onboarding.check_ins', {
                              count: option,
                            })}
                          </Text>
                          {selected ? (
                            <View style={styles.choiceCheck}>
                              <CheckIcon color={colours.canvas} size={15} />
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.previewHelper, bodySmallLeading]}>
                  {t(
                    'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom'
                  )}
                </Text>
              </ScrollView>
              <OnboardingOverflowIndicator
                testID="onboarding-duration-overflow-indicator"
                visible={durationOverflow.showIndicator}
              />
            </View>
            <View
              style={[
                styles.durationActionDock,
                styles.fixedActionDock,
                {
                  paddingBottom: actionDockBottomPadding,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
              testID="onboarding-duration-footer"
            >
              <View style={styles.flexButton}>
                <PrimaryButton
                  label={t('fullAuth.onboarding.use_duration_days', {
                    duration: duration,
                  })}
                  onPress={continueAfterDuration}
                  testID="onboarding-duration-continue"
                />
              </View>
            </View>
          </>
        );
      case 'momenta_gift':
        return (
          <>
            <MentaHeader
              onBack={back}
              progress={0.72}
              screenInset={phoneLayout.screenInset}
            />
            <ScrollView
              key="onboarding-momenta-gift-scroll"
              contentContainerStyle={[
                styles.momentaGiftBody,
                {
                  paddingBottom: actionDockContentClearance,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
              showsVerticalScrollIndicator={false}
              testID="onboarding-momenta-gift"
            >
              <View
                style={[
                  styles.momentaGiftMascotStage,
                  { height: giftMascotSize },
                ]}
              >
                <MentaMascot
                  accessibilityLabel={t(
                    'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token'
                  )}
                  size="hero"
                  state="momenta-gift"
                  testID="onboarding-momenta-gift-mascot"
                  style={{
                    height: giftMascotSize,
                    width: giftMascotSize,
                  }}
                />
              </View>
              <View style={styles.momentaGiftCopy}>
                <Text
                  style={[
                    styles.momentaGiftTitle,
                    giftTitleLeading,
                    phoneLayout.width <= 340 && styles.momentaGiftTitleCompact,
                  ]}
                  testID="onboarding-momenta-gift-title"
                >
                  {t('fullAuth.onboarding.your_first_promise_is')}{' '}
                  <Text style={styles.momentaGiftTitleAccent}>
                    {t('fullAuth.onboarding.free')}
                  </Text>
                </Text>
                <Text style={[styles.momentaGiftBodyCopy, bodySmallLeading]}>
                  {t('fullAuth.onboarding.create_it_first_menta_will_then_add')}{' '}
                  {ECONOMY_CONTRACT_V1.welcomeBonus}{' '}
                  {t('fullAuth.onboarding.momenta_for_later_choices')}
                </Text>
              </View>
              <View
                accessibilityLabel={t(
                  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre',
                  {
                    firstPromiseCost:
                      ECONOMY_CONTRACT_V1.firsts.firstPromiseCost,
                    welcomeBonus: ECONOMY_CONTRACT_V1.welcomeBonus,
                  }
                )}
                accessible
                style={[
                  styles.momentaGiftFacts,
                  phoneLayout.width <= 340 && styles.momentaGiftFactsCompact,
                ]}
                testID="onboarding-momenta-gift-ledger"
              >
                <View style={styles.momentaGiftFact}>
                  <Text style={styles.momentaGiftRowLabel}>
                    {t('fullAuth.onboarding.first_promise')}
                  </Text>
                  <Text style={styles.momentaGiftFactValue}>
                    {ECONOMY_CONTRACT_V1.firsts.firstPromiseCost}{' '}
                    {t('fullAuth.onboarding.momenta')}
                  </Text>
                </View>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.momentaGiftJourneyArrow}
                >
                  <ChevronRightIcon color={colours.action} size={24} />
                </View>
                <View
                  style={styles.momentaGiftFact}
                  testID="onboarding-momenta-gift-reward"
                >
                  <Text style={styles.momentaGiftRowLabel}>
                    {t('fullAuth.onboarding.after_it_s_created_menta_adds')}
                  </Text>
                  <Text style={styles.momentaGiftFactValue}>
                    +{ECONOMY_CONTRACT_V1.welcomeBonus}{' '}
                    {t('fullAuth.onboarding.momenta')}
                  </Text>
                </View>
              </View>
            </ScrollView>
            <View
              style={[
                styles.footerStack,
                styles.fixedActionDock,
                {
                  paddingBottom: actionDockBottomPadding,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
            >
              <PrimaryButton
                label={
                  user?.id
                    ? t('fullAuth.onboarding.review_your_promise')
                    : t('fullAuth.onboarding.sign_in_to_save_my_promise')
                }
                onPress={continueAfterMomentaGift}
                testID="onboarding-momenta-gift-continue"
              />
            </View>
          </>
        );
      case 'activating':
        return (
          <>
            <MentaHeader
              progress={0.94}
              screenInset={phoneLayout.screenInset}
            />
            <View
              accessibilityLabel={t(
                'fullAuth.onboarding.creating_your_first_promise'
              )}
              accessibilityRole="progressbar"
              style={styles.activationBody}
              testID="onboarding-activation-loading"
            >
              <MentaMascot
                accessibilityLabel={t(
                  'fullAuth.onboarding.menta_mascot_holding_your_first_promise'
                )}
                size={phoneLayout.width <= 340 ? 'lg' : 'xl'}
                state="promise-guide"
                testID="onboarding-activation-mascot"
              />
              <View style={styles.activationCopy}>
                <Text style={styles.activationTitle}>
                  {t('fullAuth.onboarding.creating_your_first_promise_2')}
                </Text>
                <Text
                  style={[
                    styles.heroBody,
                    bodySmallLeading,
                    styles.activationBodyText,
                  ]}
                >
                  {t(
                    'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal'
                  )}
                </Text>
              </View>
              <View accessibilityElementsHidden style={styles.activationDots}>
                <View style={styles.activationDot} />
                <View
                  style={[styles.activationDot, styles.activationDotMuted]}
                />
                <View
                  style={[styles.activationDot, styles.activationDotQuiet]}
                />
              </View>
            </View>
          </>
        );
      case 'save_gate':
        return (
          <>
            <MentaHeader progress={0.8} screenInset={phoneLayout.screenInset} />
            <ScrollView
              contentContainerStyle={[
                styles.gateBody,
                {
                  paddingBottom:
                    actionDockContentClearance +
                    mentaLayout.minimumTouchTarget +
                    mentaSpacing[2],
                },
              ]}
              showsVerticalScrollIndicator={false}
              style={styles.flex}
            >
              <View style={styles.gateIntro}>
                <View style={styles.gateCopy}>
                  <Text style={styles.gateTitle}>
                    {t('fullAuth.onboarding.save_this_promise_to_menta')}
                  </Text>
                  <Text style={styles.gateBodyCopy}>
                    {t(
                      'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k'
                    )}
                  </Text>
                </View>
                <Mascot pose="gate" size={106} small />
              </View>
              <View style={styles.gatePromiseCard}>
                <Text style={styles.summaryEyebrow}>
                  {t('fullAuth.onboarding.local_draft')}
                </Text>
                <Text style={styles.gatePromiseText}>{promise.trim()}</Text>
                <Text style={styles.promiseSummaryMeta}>
                  {proofLabel(proofType, t)}{' '}
                  {t('fullAuth.onboarding.every_day_2')} {duration}{' '}
                  {t('fullAuth.onboarding.days')}
                </Text>
                <Text style={styles.promiseSummaryMeta}>
                  {accountabilityChoice === 'new_group'
                    ? t('fullAuth.onboarding.create_my_group')
                    : t('todayProof.promise.private_only')}
                </Text>
              </View>
              <Text style={styles.gateLocalHelper}>
                {t(
                  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone'
                )}
              </Text>
            </ScrollView>
            <View
              style={[
                styles.footerStack,
                styles.fixedActionDock,
                {
                  paddingBottom: actionDockBottomPadding,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
            >
              <PrimaryButton
                label={t('fullAuth.onboarding.continue_to_save')}
                onPress={() => {
                  trackOnboardingJourney({
                    action: 'continued',
                    stage: 'save_gate',
                  });
                  if (user?.id) showMomentaGiftStep();
                  else showAuthMethods();
                }}
              />
              <PrimaryButton
                compactHeight
                label={t('fullAuth.onboarding.return_to_draft')}
                onPress={back}
                tone="ghost"
              />
            </View>
          </>
        );
      case 'receipt': {
        const dueWindow = formatPromiseDueWindow(
          activationReceipt?.nextDueAt ?? null
        );
        const activation = activationReceipt?.activation;
        const receiptConfirmed = Boolean(activation?.confirmed);
        const referral = activationReceipt?.referral;
        const continuation = getValidatedOnboardingReceiptContinuation({
          currentUserId: user?.id ?? null,
          accountabilityChoice,
          localise: t,
        });
        const referralCopy = (() => {
          if (!referral) return null;
          if (referral.outcome === 'both_rewarded') {
            return t('fullAuth.source.referral.both_rewarded', {
              referredRewardAmount: referral.referredRewardAmount,
              inviterRewardAmount: referral.inviterRewardAmount,
            });
          }
          if (referral.outcome === 'inviter_capped') {
            return t('fullAuth.source.referral.inviter_capped', {
              referredRewardAmount: referral.referredRewardAmount,
            });
          }
          if (referral.outcome === 'program_disabled') {
            return t('fullAuth.source.referral.program_disabled');
          }
          if (referral.outcome === 'already_accepted') {
            return t('fullAuth.source.referral.already_accepted');
          }
          if (referral.outcome === 'unavailable') {
            return t('fullAuth.source.referral.unavailable');
          }
          return referral.accepted
            ? t('fullAuth.source.referral.accepted')
            : t('fullAuth.source.referral.not_added');
        })();

        return (
          <>
            <MentaHeader progress={1} screenInset={phoneLayout.screenInset} />
            <ScrollView
              key="onboarding-receipt-scroll"
              contentContainerStyle={[
                styles.receiptBody,
                {
                  paddingBottom: actionDockContentClearance,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.receiptCopy}>
                <View style={styles.receiptCelebrationStage}>
                  {receiptConfirmed ? <OnboardingCelebrationBurst /> : null}
                  <MentaMascot
                    accessibilityLabel={t(
                      'fullAuth.onboarding.promise_saved_and_confirmed'
                    )}
                    size="lg"
                    state={
                      receiptConfirmed ? 'promise-confirmed' : 'calm-warning'
                    }
                    testID="onboarding-receipt-mascot"
                  />
                </View>
                <Text style={[styles.receiptTitle, headingLeading]}>
                  {receiptConfirmed
                    ? t('fullAuth.onboarding.your_promise_is_ready')
                    : t('fullAuth.onboarding.activation_needs_attention')}
                </Text>
                {!receiptConfirmed ? (
                  <Text style={[styles.heroBody, bodySmallLeading]}>
                    {t(
                      'fullAuth.onboarding.your_draft_is_still_private_on_this_phone'
                    )}
                  </Text>
                ) : null}
              </View>
              <View
                style={styles.receiptAchievement}
                testID="onboarding-receipt"
              >
                <Text style={styles.receiptPromise}>
                  {createdPromise?.title ?? promise.trim()}
                </Text>
                <View
                  style={[
                    styles.receiptStats,
                    phoneLayout.width <= 340 && styles.receiptStatsCompact,
                  ]}
                >
                  <View style={styles.receiptStat}>
                    <Text style={styles.receiptFactLabel}>
                      {t('fullAuth.onboarding.next_due')}
                    </Text>
                    <Text style={styles.receiptFactValue}>
                      {dueWindow ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.receiptStat}>
                    <Text style={styles.receiptFactLabel}>
                      {t('fullAuth.onboarding.welcome_momenta')}
                    </Text>
                    <Text style={styles.receiptFactValue}>
                      {activation?.welcomeMomentaGranted
                        ? t('fullAuth.source.momenta.added', {
                            amount: activation.welcomeMomentaAmount,
                          })
                        : activation?.welcomeMomentaAmount
                          ? t('fullAuth.source.momenta.already_confirmed', {
                              amount: activation.welcomeMomentaAmount,
                            })
                          : t('fullAuth.source.momenta.no_new_credit')}
                    </Text>
                  </View>
                </View>
                {referralCopy ? (
                  <View style={styles.receiptReferralRow}>
                    <Text style={styles.receiptFactLabel}>
                      {t('fullAuth.onboarding.invite')}
                    </Text>
                    <Text style={styles.receiptFactDetail}>{referralCopy}</Text>
                  </View>
                ) : null}
              </View>
              {continuation ? (
                <Text
                  style={[styles.receiptContinuation, bodySmallLeading]}
                  testID="onboarding-receipt-continuation"
                >
                  {continuation.message}
                </Text>
              ) : null}
              {finishError ? (
                <View
                  accessible
                  accessibilityRole="alert"
                  style={styles.finishErrorCard}
                >
                  <Text style={styles.finishErrorTitle}>
                    {t('fullAuth.onboarding.activation_needs_attention')}
                  </Text>
                  <Text style={styles.finishError}>{finishError}</Text>
                </View>
              ) : null}
            </ScrollView>
            <View
              style={[
                styles.footerStack,
                styles.fixedActionDock,
                {
                  paddingBottom: actionDockBottomPadding,
                  paddingHorizontal: phoneLayout.screenInset,
                },
              ]}
            >
              <PrimaryButton
                disabled={!activationReceipt?.activation?.confirmed}
                label={
                  continuation?.label ?? t('fullAuth.source.receipt.see_today')
                }
                loading={isFinishing}
                preserveLabelPositionOnLoading
                testID="onboarding-receipt-continue"
                onPress={() => {
                  void finishActivation();
                }}
              />
            </View>
          </>
        );
      }
      case 'auth_method':
        return (
          <>
            <MentaHeader
              backLabel={
                legalConfirmed
                  ? t('shared.legal.terms')
                  : t('fullAuth.shared.promise')
              }
              onBack={() => {
                if (legalConfirmed) {
                  trackOnboardingJourney({
                    action: 'edited',
                    selection: 'legal_bundle',
                    stage: 'auth',
                  });
                  setLegalConfirmed(false);
                  setLegalReady(true);
                  return;
                }
                back();
              }}
              progress={legalConfirmed ? 0.9 : 0.82}
              screenInset={phoneLayout.screenInset}
            />
            <View style={styles.onboardingOverflowStage}>
              <ScrollView
                automaticallyAdjustKeyboardInsets
                ref={authScrollRef}
                key={`onboarding-auth-method-${
                  legalConfirmed ? 'sign-in' : 'legal'
                }`}
                contentContainerStyle={[
                  styles.authBody,
                  legalConfirmed && styles.authBodySignIn,
                  {
                    paddingBottom: authContentBottomPadding,
                    paddingHorizontal: phoneLayout.screenInset,
                  },
                ]}
                keyboardDismissMode={
                  Platform.OS === 'ios' ? 'interactive' : 'on-drag'
                }
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={authOverflow.onContentSizeChange}
                onLayout={authOverflow.onLayout}
                onScroll={authOverflow.onScroll}
                onScrollBeginDrag={authOverflow.onScrollBeginDrag}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={authOverflow.canScroll}
                style={styles.flex}
                testID="onboarding-auth-body"
              >
                {legalConfirmed ? (
                  <View style={styles.authCopy} testID="onboarding-auth-copy">
                    <Text
                      allowFontScaling={false}
                      style={[
                        headingLeading,
                        styles.authTitle,
                        scaleTypeMetrics(
                          { fontSize: 32, lineHeight: 36 },
                          onboardingTextScale
                        ),
                      ]}
                    >
                      {t('fullAuth.onboarding.save_your_promise')}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.heroBody,
                        bodySmallLeading,
                        scaleTypeMetrics(bodySmallLeading, onboardingTextScale),
                      ]}
                    >
                      {t(
                        'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays'
                      )}
                    </Text>
                  </View>
                ) : null}
                {pendingInvite ? (
                  <AppInlineNotice
                    title={
                      pendingInvite.type === 'challenge'
                        ? pendingPromisePreview
                          ? t('groups.join.invited_you', {
                              inviter: pendingPromisePreview.inviterName,
                            })
                          : t('fullAuth.onboarding.review_promise_invite')
                        : t('fullAuth.onboarding.review_group_invite')
                    }
                    description={
                      pendingInvite.type === 'challenge'
                        ? (pendingPromisePreview?.promiseTitle ??
                          t('fullAuth.onboarding.promise_invite_held'))
                        : t('fullAuth.onboarding.group_invite_held')
                    }
                    tone="info"
                    testID="onboarding-pending-invite"
                  />
                ) : null}
                {!legalConfirmed ? (
                  <View
                    style={styles.legalConsentSurface}
                    testID="onboarding-auth-legal-surface"
                  >
                    <View style={styles.legalConsentCopy}>
                      <Text style={styles.legalConsentTitle}>
                        {t('fullAuth.onboarding.review_menta_s_terms')}
                      </Text>
                      <Text style={styles.legalConsentBody}>
                        {t(
                          'fullAuth.onboarding.read_the_current_account_and_community_documents'
                        )}
                      </Text>
                    </View>
                    <LegalDocumentLinks
                      documents={legalDocuments}
                      onOpen={() => {
                        trackOnboardingJourney({
                          action: 'opened',
                          selection: 'legal_bundle',
                          stage: 'legal',
                        });
                      }}
                      presentation="consent"
                      testID="onboarding-auth-legal-documents"
                      textScale={onboardingTextScale}
                    />
                    <View style={styles.legalConsentPaperRow}>
                      <ConsentRow
                        checked={legalReady}
                        label={t(
                          'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st'
                        )}
                        onPress={toggleLegalConsent}
                        testID="onboarding-auth-legal-confirmation"
                        tone="paper"
                      />
                    </View>
                    <AppButton
                      disabled={!legalReady || !legalDocuments}
                      fullWidth
                      size="large"
                      rightIcon={
                        <ChevronRightIcon color={colours.paper} size={20} />
                      }
                      style={styles.legalConsentAction}
                      testID="onboarding-auth-legal-continue"
                      textStyle={styles.legalConsentActionText}
                      title={t('fullAuth.onboarding.agree_and_choose_sign_in')}
                      variant="primary"
                      onPress={confirmLegalConsent}
                    />
                  </View>
                ) : null}
                {legalConfirmed ? (
                  <Animated.View
                    style={[
                      styles.authDisclosureStage,
                      {
                        opacity: authDisclosureProgress,
                        transform: [
                          {
                            translateY: authDisclosureProgress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [motion.distance(18), 0],
                            }),
                          },
                        ],
                      },
                    ]}
                    testID="onboarding-auth-disclosure"
                  >
                    <View style={styles.authProviderStack}>
                      <View style={styles.combinedReferralStage}>
                        {referralExpanded ? (
                          <>
                            <AppTextField
                              accessibilityLabel={t(
                                'fullAuth.onboarding.referral_code'
                              )}
                              autoCapitalize="characters"
                              autoCorrect={false}
                              errorText={referralError ?? undefined}
                              helperText={t(
                                'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr'
                              )}
                              label={t('fullAuth.onboarding.referral_code')}
                              maxLength={40}
                              onChangeText={value => {
                                setReferralCode(value);
                                setReferralFormatReady(false);
                                if (referralError) setReferralError(null);
                              }}
                              placeholder={t(
                                'fullAuth.onboarding.32_character_code'
                              )}
                              testID="onboarding-auth-referral-code"
                              value={referralCode}
                            />
                            <AppButton
                              title={t('fullAuth.onboarding.add_referral_code')}
                              onPress={() => {
                                void validateReferralBeforeAuthentication();
                              }}
                              fullWidth
                              variant="outline"
                              testID="onboarding-auth-referral-apply"
                            />
                            {referralFormatReady ? (
                              <AppInlineNotice
                                title={t('domain.handoff.check_referral_short')}
                                description={t(
                                  'domain.handoff.referral_setup_description'
                                )}
                                tone="info"
                                testID="onboarding-auth-referral-ready"
                              />
                            ) : null}
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => {
                                setReferralExpanded(false);
                                trackOnboardingJourney({
                                  action: 'collapsed',
                                  selection: 'referral_absent',
                                  stage: 'referral',
                                });
                                setReferralCode('');
                                setReferralError(null);
                                setReferralFormatReady(false);
                              }}
                              style={({ pressed }) => [
                                styles.combinedReferralRemove,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text style={styles.combinedReferralRemoveText}>
                                {t('fullAuth.onboarding.create_without_a_code')}
                              </Text>
                            </Pressable>
                          </>
                        ) : (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              setReferralExpanded(true);
                              trackOnboardingJourney({
                                action: 'expanded',
                                stage: 'referral',
                              });
                            }}
                            style={({ pressed }) => [
                              styles.referralDisclosure,
                              pressed && styles.pressed,
                            ]}
                            testID="onboarding-auth-referral-expand"
                          >
                            <View style={styles.combinedReferralCopy}>
                              <Text style={styles.referralDisclosureText}>
                                {t(
                                  'fullAuth.onboarding.do_you_have_a_referral_code'
                                )}
                              </Text>
                            </View>
                            <ChevronRightIcon
                              color={colours.mutedInk}
                              size={20}
                            />
                          </Pressable>
                        )}
                      </View>
                      <View style={styles.authButtons}>
                        {!user ? (
                          <>
                            <PaperAuthButton
                              disabled={
                                !legalConfirmed ||
                                authProviderLoading === 'google' ||
                                emailAuthLoading
                              }
                              icon={
                                <AppleIcon size={20} color={colours.canvas} />
                              }
                              loading={authProviderLoading === 'apple'}
                              textScale={onboardingTextScale}
                              testID="onboarding-continue-apple"
                              title={t(
                                'fullAuth.onboarding.continue_with_apple'
                              )}
                              variant="paper"
                              onPress={() => void handleProviderSignIn('apple')}
                            />
                            <PaperAuthButton
                              disabled={
                                !legalConfirmed ||
                                authProviderLoading === 'apple' ||
                                emailAuthLoading
                              }
                              icon={<GoogleGlyph size={18} />}
                              loading={authProviderLoading === 'google'}
                              textScale={onboardingTextScale}
                              testID="onboarding-continue-google"
                              title={t(
                                'fullAuth.onboarding.continue_with_google'
                              )}
                              variant="google"
                              onPress={() =>
                                void handleProviderSignIn('google')
                              }
                            />
                            <PaperAuthButton
                              disabled={
                                !legalConfirmed ||
                                authProviderLoading !== null ||
                                emailAuthLoading
                              }
                              icon={
                                <MailIcon size={18} color={colours.mutedInk} />
                              }
                              loading={emailAuthLoading}
                              loadingProgress={0}
                              textScale={onboardingTextScale}
                              testID="onboarding-continue-email"
                              title={
                                emailAuthLoading
                                  ? t('fullAuth.onboarding.opening_email')
                                  : t('fullAuth.onboarding.continue_with_email')
                              }
                              variant="muted"
                              onPress={() => void handleEmailSignIn()}
                            />
                          </>
                        ) : (
                          <PrimaryButton
                            disabled={!legalConfirmed}
                            label={t('todayProof.create.create_promise')}
                            loading={isFinishing}
                            preserveLabelPositionOnLoading
                            testID="onboarding-auth-create-promise"
                            onPress={() =>
                              void confirmCombinedForSignedInAccount()
                            }
                          />
                        )}
                      </View>
                    </View>
                  </Animated.View>
                ) : null}
                {authNotice ? (
                  <PaperAuthNotice
                    message={authNotice.message}
                    testID="onboarding-auth-error"
                    title={authNotice.title}
                  />
                ) : null}
                {legalConfirmed ? (
                  <View
                    style={styles.authFooter}
                    testID="onboarding-auth-footer"
                  >
                    <PrimaryButton
                      compactHeight
                      label={t('fullAuth.onboarding.return_to_draft')}
                      onPress={deferAuth}
                      testID="onboarding-auth-not-now"
                      tone="ghost"
                    />
                  </View>
                ) : null}
              </ScrollView>
              <OnboardingOverflowIndicator
                testID="onboarding-auth-overflow-indicator"
                visible={authOverflow.showIndicator}
              />
            </View>
          </>
        );
    }
  })();

  return (
    <AppTextScaleProvider scale={phoneLayout.textScale}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        key={`onboarding-${step}`}
        style={styles.safeArea}
        testID="onboarding-screen-root"
      >
        {screen}
      </SafeAreaView>
    </AppTextScaleProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colours.canvas },
  header: {
    height: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaLayout.screenInset,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    color: colours.text,
    fontFamily: fonts.interBold,
    fontSize: 17,
    letterSpacing: -0.34,
  },
  headerBack: {
    color: colours.text,
    ...mentaTypography.bodySmallMedium,
  },
  headerBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
  },
  headerSpacer: {
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: mentaLayout.minimumTouchTarget,
  },
  journeyProgressTrack: {
    backgroundColor: colours.border,
    borderRadius: mentaRadii.small,
    height: 6,
    overflow: 'hidden',
  },
  journeyProgressFill: {
    backgroundColor: colours.action,
    borderRadius: mentaRadii.small,
    height: 6,
  },
  headerCounter: {
    color: colours.action,
    ...mentaTypography.bodySmallMedium,
  },
  stepMeta: {
    width: '100%',
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  welcomeScrollContent: {
    flexGrow: 1,
  },
  welcomeBody: {
    flexGrow: 1,
    paddingHorizontal: mentaLayout.screenInset,
    minHeight: 0,
    alignItems: 'center',
    gap: mentaSpacing[3],
    justifyContent: 'flex-start',
    paddingTop: mentaSpacing[4],
  },
  welcomeBodyCompact: {
    gap: mentaSpacing[2],
  },
  welcomeMascotStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  welcomeMascotStageCompact: { minHeight: 0 },
  mascotDisc: { display: 'none' },
  welcomeCopy: {
    alignItems: 'center',
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[4],
    width: '100%',
  },
  welcomeWordmark: {
    color: colours.text,
    fontFamily: fonts.interSemibold,
    fontSize: 18,
    letterSpacing: -0.2,
    lineHeight: 24,
    textAlign: 'center',
  },
  heroTitle: {
    color: colours.text,
    textAlign: 'center',
    maxWidth: 354,
    ...mentaTypography.display,
    fontSize: 31,
    lineHeight: 37,
  },
  heroTitleCompact: {
    ...mentaTypography.heading,
    fontSize: 26,
    lineHeight: 32,
  },
  heroBody: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmall,
  },
  welcomeBodyText: { maxWidth: 330, textAlign: 'center' },
  footerStack: {
    width: '100%',
    paddingHorizontal: mentaLayout.screenInset,
    paddingBottom: mentaSpacing[2],
    paddingTop: mentaSpacing[4],
    gap: mentaSpacing[2],
  },
  fixedActionDock: {
    backgroundColor: colours.canvas,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  welcomeFooter: {
    marginTop: 'auto',
  },
  primaryButton: {
    borderBottomColor: '#7750B6',
    borderBottomWidth: 3,
    minHeight: mentaLayout.primaryControlHeight,
  },
  compactButton: { minHeight: mentaLayout.minimumTouchTarget },
  paperButton: {
    backgroundColor: colours.paper,
    borderBottomColor: '#C9C5B8',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  primaryButtonText: {
    color: colours.canvas,
    ...mentaTypography.control,
  },
  ghostButtonText: { color: colours.mutedInk },
  outlineButton: {
    backgroundColor: 'transparent',
    borderBottomColor: colours.border,
    borderBottomWidth: 1,
    borderColor: colours.border,
    borderWidth: 1,
  },
  outlineButtonText: { color: colours.action },
  splitFooter: {
    paddingHorizontal: mentaLayout.screenInset,
    paddingBottom: mentaSpacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  secondaryActionSlot: { width: 88 },
  flexButton: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[6],
    paddingBottom: 20,
    gap: 22,
  },
  scrollContentCompact: {
    paddingTop: mentaSpacing[3],
    gap: mentaSpacing[4],
  },
  draftWorkspace: {
    width: '100%',
  },
  draftFormStack: {
    gap: 22,
  },
  iPadDraftContent: {
    justifyContent: 'center',
    paddingTop: mentaSpacing[8],
  },
  iPadWorkspace: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[8],
    maxWidth: 1240,
    width: '100%',
  },
  iPadStepRail: {
    alignSelf: 'stretch',
    flexBasis: 220,
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'space-between',
    minHeight: 500,
    paddingBottom: mentaSpacing[4],
    paddingTop: mentaSpacing[2],
  },
  iPadRailCopy: {
    gap: mentaSpacing[3],
  },
  iPadRailKicker: {
    color: colours.action,
    fontFamily: fonts.interBold,
    fontSize: 12,
    letterSpacing: 1.1,
    lineHeight: 16,
  },
  iPadRailTitle: {
    color: colours.text,
    fontFamily: fonts.newsreader,
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  iPadStepTrack: {
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  iPadStepTrackActive: {
    backgroundColor: colours.action,
    borderRadius: mentaRadii.small,
    flex: 1,
    height: 5,
  },
  iPadStepTrackInactive: {
    backgroundColor: colours.border,
    borderRadius: mentaRadii.small,
    flex: 1,
    height: 5,
  },
  iPadStepTrackComplete: {
    backgroundColor: colours.success,
    borderRadius: mentaRadii.small,
    flex: 1,
    height: 5,
  },
  iPadDraftForm: {
    alignSelf: 'center',
    backgroundColor: colours.raised,
    borderColor: colours.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: mentaSpacing[6],
    maxWidth: 780,
    minHeight: 500,
    padding: mentaSpacing[8],
  },
  iPadPromiseTextArea: {
    minHeight: 226,
  },
  iPadDraftFooter: {
    marginLeft: 284,
    marginRight: mentaSpacing[8],
  },
  draftCopy: { gap: mentaSpacing[2] },
  draftKicker: {
    color: colours.action,
    fontFamily: fonts.interBold,
    fontSize: 12,
    letterSpacing: 1.1,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  draftTitle: {
    color: colours.text,
    fontFamily: fonts.interBold,
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 35,
  },
  exampleChoices: { gap: mentaSpacing[3] },
  exampleHeading: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmallMedium,
  },
  exampleChipList: { gap: mentaSpacing[2] },
  exampleChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colours.raised,
    borderColor: colours.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[2],
  },
  exampleChipText: {
    color: colours.text,
    ...mentaTypography.bodySmallMedium,
  },
  examplesRestore: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
  },
  exampleLink: {
    color: colours.action,
    ...mentaTypography.bodySmallMedium,
  },
  promiseField: { gap: mentaSpacing[2] },
  promiseFieldShell: {
    backgroundColor: 'transparent',
    borderLeftWidth: 0,
    borderRadius: mentaRadii.none,
    borderRightWidth: 0,
    borderTopWidth: 0,
    minHeight: 82,
    paddingHorizontal: 0,
  },
  draftActionDock: {
    paddingBottom: mentaSpacing[2],
  },
  draftInlineKeyboardAction: {
    paddingTop: mentaSpacing[4],
  },
  draftKeyboardOverlay: {
    backgroundColor: colours.canvas,
    borderTopColor: colours.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    left: 0,
    paddingBottom: mentaSpacing[2],
    paddingTop: mentaSpacing[2],
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  draftFooter: {
    backgroundColor: colours.canvas,
    bottom: 0,
    gap: 8,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  draftValidation: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 24,
    minHeight: 22,
  },
  draftValidationText: {
    color: colours.danger,
    flex: 1,
    ...mentaTypography.bodySmallMedium,
    fontFamily: fonts.interSemibold,
  },
  fieldLabel: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmallMedium,
  },
  promiseTextArea: {
    color: colours.text,
    fontFamily: fonts.newsreader,
    fontSize: 29,
    letterSpacing: -0.4,
    lineHeight: 35,
    minHeight: 72,
    paddingHorizontal: 0,
    paddingVertical: mentaSpacing[2],
  },
  inputMeta: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
  },
  proofContent: {
    flexGrow: 1,
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: 22,
    paddingBottom: 16,
    gap: 16,
  },
  proofContentCompact: {
    paddingTop: mentaSpacing[2],
    paddingBottom: mentaSpacing[2],
    gap: mentaSpacing[2],
  },
  proofWorkspace: {
    flex: 1,
    gap: 16,
    width: '100%',
  },
  proofSelectionColumn: {
    flex: 1,
    gap: 16,
  },
  iPadProofContent: {
    justifyContent: 'center',
    paddingTop: mentaSpacing[6],
  },
  iPadProofSelectionColumn: {
    flex: 1,
    gap: mentaSpacing[4],
    minWidth: 0,
  },
  iPadPromiseSummary: {
    alignSelf: 'flex-start',
    backgroundColor: colours.paper,
    borderRadius: mentaRadii.large,
    flexBasis: 248,
    flexGrow: 0,
    flexShrink: 0,
    gap: mentaSpacing[5],
    minHeight: 360,
    padding: mentaSpacing[6],
  },
  iPadSummaryLabel: {
    color: colours.mutedPaper,
    fontFamily: fonts.interBold,
    fontSize: 12,
    letterSpacing: 1.1,
    lineHeight: 16,
  },
  iPadSummaryPromise: {
    color: colours.canvas,
    fontFamily: fonts.newsreader,
    fontSize: 28,
    letterSpacing: -0.56,
    lineHeight: 34,
  },
  iPadSummaryDivider: {
    backgroundColor: colours.paperDivider,
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  iPadSummaryFact: {
    gap: mentaSpacing[1],
  },
  iPadSummaryValue: {
    color: colours.canvas,
    ...mentaTypography.bodySmallMedium,
  },
  iPadSummaryNote: {
    color: colours.mutedPaper,
    marginTop: 'auto',
    ...mentaTypography.bodySmall,
  },
  iPadProofFooter: {
    marginLeft: 284,
    marginRight: 288,
  },
  localCopy: {
    flex: 1,
    color: colours.mutedInk,
    ...mentaTypography.bodySmall,
  },
  errorCopy: { color: colours.danger },
  finishError: {
    color: colours.danger,
    ...mentaTypography.bodySmallMedium,
  },
  finishErrorCard: {
    gap: 4,
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: colours.danger,
    borderRadius: mentaRadii.medium,
    backgroundColor: colours.raised,
  },
  finishErrorTitle: {
    color: colours.paper,
    ...mentaTypography.bodySmallMedium,
  },
  characterCount: {
    color: colours.mutedInk,
    ...mentaTypography.captionMedium,
  },
  promiseSummary: {
    width: '100%',
    borderRadius: mentaRadii.medium,
    backgroundColor: 'rgba(24, 25, 25, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
    gap: mentaSpacing[1],
  },
  promiseSummaryCompact: {
    paddingVertical: mentaSpacing[2],
    gap: mentaSpacing[1],
  },
  summaryEyebrow: {
    color: colours.action,
    ...mentaTypography.bodySmallMedium,
  },
  promiseSummaryText: {
    color: colours.text,
    ...mentaTypography.title,
  },
  promiseSummaryMeta: {
    color: colours.mutedPaper,
    ...mentaTypography.bodySmallMedium,
  },
  proofCopy: { gap: 6 },
  promiseContext: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmallMedium,
  },
  accountabilityCopy: { gap: 6 },
  accountabilityCopyCompact: { gap: mentaSpacing[1], marginTop: 0 },
  disclosureStage: {
    flex: 1,
    gap: mentaSpacing[6],
    justifyContent: 'flex-start',
    paddingTop: mentaSpacing[4],
  },
  accountabilityTitle: {
    color: colours.text,
    ...mentaTypography.heading,
    fontSize: 34,
    letterSpacing: -0.68,
    lineHeight: 40,
  },
  proofTitle: {
    color: colours.text,
    fontFamily: fonts.interBold,
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  proofList: {
    gap: 10,
  },
  proofListInitial: {
    flex: 1,
  },
  accountabilityList: {
    gap: mentaSpacing[3],
  },
  proofRow: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.raised,
    borderColor: colours.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  proofRowInitial: {
    flex: 1,
    maxHeight: 124,
    minHeight: 88,
  },
  accountabilityRow: {
    minHeight: 116,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[5],
  },
  accountabilityText: {
    paddingRight: 42,
  },
  accountabilityChoiceCheck: {
    position: 'absolute',
    right: mentaSpacing[5],
  },
  proofRowCompact: {
    minHeight: 60,
    paddingVertical: mentaSpacing[1],
  },
  proofRowDivider: {
    borderBottomColor: colours.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  proofRowSelected: {
    backgroundColor: colours.actionSoft,
    borderColor: colours.actionBorder,
    borderWidth: 2,
  },
  proofIconSlot: {
    alignItems: 'center',
    backgroundColor: colours.actionSoft,
    borderRadius: mentaRadii.small,
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  proofText: { flex: 1, gap: 2, minWidth: 0 },
  proofChange: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: mentaLayout.minimumTouchTarget,
    paddingHorizontal: 0,
  },
  proofChangeText: {
    color: colours.action,
    ...mentaTypography.bodySmallMedium,
  },
  proofRowTitle: {
    color: colours.text,
    ...mentaTypography.bodySemibold,
  },
  proofRowDetail: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmall,
  },
  choiceCheck: {
    alignItems: 'center',
    backgroundColor: colours.action,
    borderRadius: mentaRadii.medium,
    flexShrink: 0,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  resolvedProofRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomColor: colours.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: mentaSpacing[2],
  },
  resolvedProofIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minWidth: 0,
  },
  resolvedProofIcon: {
    alignItems: 'center',
    backgroundColor: colours.actionSoft,
    borderRadius: mentaRadii.small,
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  resolvedProofText: {
    color: colours.text,
    ...mentaTypography.bodySemibold,
  },
  proofActionDock: {
    paddingBottom: mentaSpacing[2],
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: mentaRadii.round,
    borderWidth: 1.5,
    borderColor: colours.mutedPaper,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: { borderColor: colours.actionOnPaper },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: mentaRadii.round,
    backgroundColor: colours.actionOnPaper,
  },
  previewBody: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: mentaSpacing[6],
    paddingBottom: mentaSpacing[8],
    paddingHorizontal: mentaLayout.screenInset,
  },
  previewBodyCompact: {
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[4],
  },
  onboardingOverflowStage: {
    flex: 1,
    position: 'relative',
  },
  onboardingOverflowIndicator: {
    position: 'absolute',
    right: 7,
    top: 16,
    width: 3,
    height: 44,
    borderRadius: mentaRadii.small,
    backgroundColor: colours.mutedInk,
    opacity: 0.72,
  },
  previewTitle: {
    color: colours.text,
    textAlign: 'center',
    ...mentaTypography.heading,
    fontSize: 34,
    lineHeight: 40,
  },
  reviewContentStage: {
    flexGrow: 1,
    gap: mentaSpacing[5],
    justifyContent: 'center',
    width: '100%',
  },
  reviewArtefactStage: {
    maxWidth: 382,
    width: '100%',
  },
  todayCard: {
    width: '100%',
    minHeight: 0,
    borderRadius: mentaRadii.medium,
    backgroundColor: colours.paper,
    justifyContent: 'flex-end',
    paddingBottom: mentaSpacing[5],
    paddingHorizontal: mentaSpacing[5],
    paddingTop: mentaSpacing[6],
    gap: mentaSpacing[2],
  },
  todayCardCompact: {
    paddingTop: mentaSpacing[5],
  },
  todayPromise: {
    color: colours.canvas,
    textAlign: 'center',
    ...mentaTypography.journeyTitle,
  },
  reviewMeta: {
    color: colours.mutedPaper,
    textAlign: 'center',
    ...mentaTypography.bodySmallMedium,
  },
  reviewAccountability: {
    color: colours.actionOnPaper,
    textAlign: 'center',
    ...mentaTypography.bodySmallMedium,
  },
  reviewActionDock: {
    paddingBottom: mentaSpacing[2],
  },
  reviewEditAction: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[4],
  },
  reviewEditText: {
    color: colours.action,
    ...mentaTypography.bodySmallMedium,
  },
  todayProofRow: {
    minHeight: 54,
    borderTopWidth: 1,
    borderTopColor: colours.paperDivider,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayProofLabel: {
    color: colours.mutedPaper,
    ...mentaTypography.bodySmall,
  },
  todayProofValue: {
    color: colours.canvas,
    ...mentaTypography.bodySmallMedium,
  },
  previewHelper: {
    width: '100%',
    color: colours.mutedInk,
    ...mentaTypography.bodySmall,
  },
  durationBody: {
    flexGrow: 1,
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[6],
    paddingBottom: mentaSpacing[6],
    gap: mentaSpacing[5],
  },
  durationCopy: { gap: mentaSpacing[2] },
  durationPromiseStage: {
    minHeight: 94,
    width: '100%',
  },
  durationPromiseCard: {
    width: '100%',
    borderRadius: mentaRadii.medium,
    backgroundColor: colours.paper,
    borderColor: colours.paperDivider,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[1],
    minHeight: 88,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[4],
  },
  durationPromiseText: {
    color: colours.canvas,
    ...mentaTypography.journeyTitle,
  },
  durationPromiseMeta: {
    color: colours.mutedPaper,
    ...mentaTypography.bodySmall,
  },
  durationOptions: {
    width: '100%',
    flexDirection: 'column',
    gap: mentaSpacing[2],
  },
  durationOption: {
    alignItems: 'center',
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: mentaRadii.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: mentaSpacing[4],
  },
  durationOptionSelected: {
    borderColor: colours.actionBorder,
    borderWidth: 2,
    backgroundColor: colours.raised,
  },
  durationOptionText: {
    color: colours.text,
    ...mentaTypography.bodySemibold,
  },
  durationOptionTextSelected: { color: colours.action },
  durationOptionMeaning: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  durationCheckIns: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmall,
  },
  durationActionDock: { paddingBottom: mentaSpacing[2] },
  durationFactRow: {
    minHeight: mentaLayout.minimumTouchTarget,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colours.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationFactValue: {
    color: colours.text,
    ...mentaTypography.bodySmallMedium,
  },
  momentaGiftBody: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[5],
    gap: mentaSpacing[5],
  },
  momentaGiftMascotStage: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentaGiftCopy: {
    alignItems: 'center',
    gap: mentaSpacing[4],
    width: '100%',
  },
  momentaGiftTitle: {
    color: colours.text,
    fontFamily: fonts.newsreader,
    fontSize: 36,
    lineHeight: 41,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  momentaGiftTitleAccent: { color: colours.action },
  momentaGiftTitleCompact: {
    fontSize: 34,
    letterSpacing: -0.7,
    lineHeight: 39,
  },
  momentaGiftBodyCopy: {
    color: colours.mutedInk,
    maxWidth: 350,
    textAlign: 'center',
    ...mentaTypography.bodySmall,
  },
  momentaGiftFacts: {
    alignItems: 'center',
    borderBottomColor: colours.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 88,
    paddingVertical: mentaSpacing[4],
    width: '100%',
  },
  momentaGiftFactsCompact: { minHeight: 82 },
  momentaGiftFact: {
    flex: 1,
    gap: mentaSpacing[1],
    justifyContent: 'center',
    minWidth: 0,
  },
  momentaGiftJourneyArrow: {
    alignItems: 'center',
    backgroundColor: colours.actionSoft,
    borderRadius: mentaRadii.round,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: mentaSpacing[3],
    width: 36,
  },
  momentaGiftRowLabel: {
    color: colours.mutedInk,
    fontFamily: fonts.interBold,
    fontSize: 11,
    letterSpacing: 0.9,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  momentaGiftFactValue: {
    color: colours.action,
    ...mentaTypography.bodySemibold,
  },
  momentaGiftTear: {
    bottom: -7,
    flexDirection: 'row',
    height: 14,
    justifyContent: 'space-around',
    left: 8,
    overflow: 'hidden',
    position: 'absolute',
    right: 8,
  },
  momentaGiftTooth: {
    backgroundColor: colours.paper,
    height: 14,
    transform: [{ rotate: '45deg' }],
    width: 14,
  },
  momentaGiftReward: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    paddingHorizontal: mentaSpacing[2],
  },
  momentaGiftRewardBadge: {
    alignItems: 'center',
    borderColor: colours.border,
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  momentaGiftRewardAmount: {
    color: colours.action,
    ...mentaTypography.bodySemibold,
  },
  rewardLeaf: { height: 20, position: 'relative', width: 30 },
  rewardLeafLeft: {
    backgroundColor: colours.action,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    height: 14,
    left: 2,
    position: 'absolute',
    top: 4,
    transform: [{ rotate: '20deg' }],
    width: 18,
  },
  rewardLeafRight: {
    backgroundColor: colours.action,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12,
    height: 14,
    position: 'absolute',
    right: 2,
    top: 1,
    transform: [{ rotate: '-20deg' }],
    width: 18,
  },
  referralBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingBottom: mentaSpacing[8],
    gap: mentaSpacing[6],
  },
  referralCopy: {
    width: '100%',
    gap: mentaSpacing[3],
  },
  referralTitle: {
    color: colours.text,
    ...mentaTypography.heading,
    fontFamily: fonts.interBold,
  },
  referralDisclosure: {
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colours.border,
    backgroundColor: 'transparent',
    paddingHorizontal: mentaSpacing[1],
    paddingVertical: mentaSpacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  referralDisclosureText: {
    color: colours.text,
    ...mentaTypography.bodySemibold,
  },
  referralError: {
    color: colours.danger,
    ...mentaTypography.bodySmall,
  },
  activationBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingBottom: mentaSpacing[8],
    gap: mentaSpacing[6],
  },
  activationCopy: {
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  activationTitle: {
    color: colours.mutedInk,
    fontFamily: fonts.interBold,
    fontSize: 13,
    letterSpacing: 1.1,
    lineHeight: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  activationBodyText: { maxWidth: 320, textAlign: 'center' },
  activationDots: {
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  activationDot: {
    backgroundColor: colours.action,
    borderRadius: mentaRadii.round,
    height: 8,
    width: 8,
  },
  activationDotMuted: { opacity: 0.55 },
  activationDotQuiet: { opacity: 0.25 },
  receiptBody: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingVertical: mentaSpacing[8],
    gap: mentaSpacing[5],
  },
  receiptCopy: {
    alignItems: 'center',
    width: '100%',
    gap: mentaSpacing[2],
  },
  receiptCelebrationStage: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 136,
    justifyContent: 'center',
    position: 'relative',
    width: 180,
  },
  receiptTitle: {
    color: colours.text,
    textAlign: 'center',
    ...mentaTypography.display,
  },
  receiptAchievement: {
    alignItems: 'center',
    gap: mentaSpacing[5],
    width: '100%',
  },
  receiptStats: {
    flexDirection: 'row',
    gap: mentaSpacing[3],
    width: '100%',
  },
  receiptStatsCompact: { flexDirection: 'column' },
  receiptStat: {
    backgroundColor: colours.raised,
    borderColor: colours.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: mentaSpacing[2],
    minHeight: 88,
    padding: mentaSpacing[4],
  },
  receiptReferralRow: {
    borderBottomColor: colours.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    paddingVertical: mentaSpacing[3],
    width: '100%',
  },
  receiptCardStage: {
    width: '100%',
    position: 'relative',
    paddingBottom: mentaSpacing[5],
  },
  receiptCard: {
    width: '100%',
    borderRadius: mentaRadii.large,
    backgroundColor: colours.paper,
    overflow: 'hidden',
  },
  receiptCheckBadge: {
    position: 'absolute',
    right: mentaSpacing[4],
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: mentaRadii.round,
    borderWidth: 4,
    borderColor: colours.canvas,
    backgroundColor: colours.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptPromiseRow: {
    padding: mentaSpacing[5],
    gap: mentaSpacing[2],
  },
  receiptLabel: {
    color: colours.mutedPaper,
    ...mentaTypography.bodySmallMedium,
  },
  receiptPromise: {
    color: colours.text,
    maxWidth: 360,
    textAlign: 'center',
    ...mentaTypography.display,
  },
  receiptMeta: {
    color: colours.mutedPaper,
    ...mentaTypography.bodySmall,
  },
  receiptFactRow: {
    minHeight: 58,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.paperDivider,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  receiptFactColumn: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.paperDivider,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[4],
    gap: mentaSpacing[1],
  },
  receiptFactLabel: {
    color: colours.mutedInk,
    fontFamily: fonts.interBold,
    fontSize: 11,
    letterSpacing: 0.9,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  receiptFactValue: {
    color: colours.text,
    flexShrink: 1,
    textAlign: 'left',
    ...mentaTypography.bodySmallMedium,
  },
  receiptFactDetail: {
    color: colours.text,
    ...mentaTypography.bodySmall,
  },
  receiptContinuation: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmall,
  },
  gateBody: {
    flexGrow: 1,
    gap: mentaSpacing[5],
    justifyContent: 'center',
    paddingBottom: 24,
    paddingHorizontal: mentaLayout.screenInset,
  },
  gateIntro: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gateCopy: { flex: 1, gap: mentaSpacing[3], minWidth: 0 },
  gateTitle: {
    color: colours.text,
    ...mentaTypography.heading,
    fontFamily: fonts.interBold,
  },
  gateBodyCopy: {
    color: colours.mutedInk,
    ...mentaTypography.body,
  },
  gatePromiseCard: {
    width: '100%',
    borderRadius: mentaRadii.large,
    backgroundColor: colours.paper,
    padding: mentaSpacing[5],
    gap: mentaSpacing[3],
  },
  gatePromiseText: {
    color: colours.canvas,
    ...mentaTypography.title,
  },
  gateLocalHelper: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmall,
  },
  authBody: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[5],
    justifyContent: 'flex-start',
    maxWidth: mentaLayout.phoneFrameMax,
    paddingBottom: mentaSpacing[10],
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  authBodySignIn: {
    justifyContent: 'center',
    paddingTop: 0,
  },
  authDisclosureStage: {
    gap: mentaSpacing[5],
    width: '100%',
  },
  authProviderStack: {
    flexDirection: 'column-reverse',
    gap: mentaSpacing[4],
    width: '100%',
  },
  authFooter: {
    alignItems: 'center',
    paddingTop: mentaSpacing[1],
    width: '100%',
  },
  legalBody: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[5],
    maxWidth: mentaLayout.phoneFrameMax,
    paddingTop: 28,
    width: '100%',
  },
  legalBodyCompact: {
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[3],
  },
  legalCopy: { gap: 10, width: '100%' },
  legalDocumentStage: {
    transform: [{ rotate: '0.35deg' }],
    width: '100%',
  },
  legalConsentSurface: {
    backgroundColor: colours.paper,
    borderColor: colours.paperDivider,
    borderRadius: mentaRadii.medium,
    borderWidth: 1,
    gap: mentaSpacing[5],
    padding: mentaSpacing[5],
    width: '100%',
  },
  legalConsentCopy: {
    gap: mentaSpacing[2],
  },
  legalConsentTitle: {
    color: colours.canvas,
    fontFamily: fonts.interBold,
    fontSize: 28,
    letterSpacing: -0.56,
    lineHeight: 34,
  },
  legalConsentBody: {
    color: colours.mutedPaper,
    ...mentaTypography.bodySmall,
  },
  legalConsentPaperRow: {
    borderBottomColor: colours.paperDivider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.paperDivider,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legalConsentAction: {
    backgroundColor: colours.canvas,
    borderColor: colours.canvas,
  },
  legalConsentActionText: {
    color: colours.paper,
  },
  combinedReferralStage: {
    gap: mentaSpacing[2],
    width: '100%',
  },
  combinedReferralCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  combinedReferralRemove: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
  },
  combinedReferralRemoveText: {
    color: colours.mutedInk,
    ...mentaTypography.bodySmallMedium,
  },
  authCopy: { width: '100%', gap: 10 },
  authTitle: {
    color: colours.text,
    ...mentaTypography.heading,
    fontFamily: fonts.interBold,
    lineHeight: 36,
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: mentaLayout.minimumTouchTarget,
    paddingVertical: mentaSpacing[3],
  },
  consentRowPaper: {
    paddingHorizontal: 0,
  },
  consentBox: {
    alignItems: 'center',
    borderColor: colours.mutedInk,
    borderRadius: mentaRadii.small,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    marginTop: 1,
    width: 24,
  },
  consentBoxChecked: {
    backgroundColor: colours.action,
    borderColor: colours.action,
  },
  consentBoxPaper: {
    borderColor: colours.mutedPaper,
  },
  consentLabel: {
    color: colours.text,
    flex: 1,
    ...mentaTypography.bodySmall,
  },
  consentLabelPaper: {
    color: colours.canvas,
  },
  authButtons: { gap: 12 },
});
