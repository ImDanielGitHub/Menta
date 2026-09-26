import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MentaMascot, type MascotSize } from '@/components/ui/MentaMascot';
import { AppButton } from '@/components/ui/AppButton';
import {
  AppScaledText as Text,
  AppTextScaleProvider,
  useAppTextScale,
} from '@/components/ui/AppScaledText';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
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
  ChevronRightIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  UsersIcon,
  WifiOffIcon,
} from '@/components/ui/icons';
import { CoachSnoozeControl } from '@/components/streak/CoachSnoozeControl';
import { ProofDueCountdown } from '@/components/streak/ProofDueCountdown';
import {
  TodayPromiseReceipt,
  type TodayPromiseReceiptData,
} from '@/components/today/TodayPromiseReceipt';
import { TodaySpeechBubble } from '@/components/today/TodaySpeechBubble';
import {
  TodayCountdownHero,
  useTodayCountdownNote,
} from '@/components/today/TodayCountdownHero';
import { MOTION_DISTANCES, MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useTranslation } from '@/lib/localization';

import type {
  TodayAccent,
  TodayPresentation,
} from '@/components/loop/today-copy';

type TodayStateCardProps = {
  presentation: TodayPresentation;
  onPrimaryPress: () => void;
  onSecondaryPress?: (() => void) | null;
  onRemindLater?: (() => void | Promise<void>) | null;
  primaryDisabled?: boolean;
  /** Cream receipt for the promise the hero is about. */
  promiseReceipt?: TodayPromiseReceiptData | null;
  /** Menta's one-line prompt at a genuine orientation point. */
  mascotPrompt?: string | null;
  textScale?: number;
};

const HALO_COLOR: Record<TodayAccent, string> = {
  action: mentaColors.actionSoft,
  success: mentaColors.successSoft,
  warning: mentaColors.warningSoft,
  danger: mentaColors.dangerSoft,
  muted: mentaColors.raised,
};

/**
 * Fades and lifts a Today state into place when the state changes while the
 * screen is open. The first paint is static; Reduce Motion keeps it static.
 */
function TodayStateEntrance({
  stateKey,
  children,
}: {
  stateKey: string;
  children: React.ReactNode;
}) {
  const motion = useMotionPreferences();
  const progress = useSharedValue(1);
  const previousKey = useRef(stateKey);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateY: (1 - progress.value) * MOTION_DISTANCES.md }],
  }));

  useEffect(() => {
    if (previousKey.current === stateKey) return;
    previousKey.current = stateKey;
    if (!motion.allowsTransform) return;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: MOTION_DURATIONS.screen,
      easing: Easing.out(Easing.cubic),
    });
  }, [motion.allowsTransform, progress, stateKey]);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

/**
 * The framed mascot stage from the Paper Today artboards. The halo takes the
 * state's accent. An approved day gets one springy pop when it arrives.
 */
function TodayHeroStage({
  presentation,
  height,
  mascotSize,
}: {
  presentation: TodayPresentation;
  height: number;
  mascotSize: MascotSize;
}) {
  const motion = useMotionPreferences();
  const scale = useSharedValue(1);
  const previousState = useRef(presentation.state);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const arrived =
      previousState.current !== presentation.state &&
      presentation.state === 'accepted-today';
    previousState.current = presentation.state;
    if (!arrived || !presentation.animateMascot || !motion.allowsTransform) {
      return;
    }
    scale.value = 0.82;
    scale.value = withTiming(1, {
      duration: MOTION_DURATIONS.complex,
      easing: Easing.out(Easing.back(2)),
    });
  }, [
    motion.allowsTransform,
    presentation.animateMascot,
    presentation.state,
    scale,
  ]);

  if (!presentation.mascot) return null;

  return (
    <View style={[styles.heroVisual, { height }]} testID="today-hero-visual">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.heroHalo,
          {
            backgroundColor: HALO_COLOR[presentation.accent],
            height: height - mentaSpacing[6],
            width: height - mentaSpacing[6],
          },
        ]}
      />
      <Animated.View style={animatedStyle}>
        <MentaMascot
          state={presentation.mascot}
          size={mascotSize}
          style={styles.heroMascot}
        />
      </Animated.View>
    </View>
  );
}

function AccountabilityReceipt({
  receipt,
}: {
  receipt: TodayPresentation['accountabilityReceipt'];
}) {
  const { colors } = useTheme();
  if (!receipt) return null;

  return (
    <View
      accessible
      accessibilityLabel={`${receipt.title}. ${receipt.detail}`}
      style={styles.accountabilityReceipt}
      testID="today-accountability-receipt"
    >
      <ShieldCheckIcon color={colors.accent.primary} size={20} />
      <View style={styles.accountabilityReceiptCopy}>
        <Text style={styles.accountabilityReceiptTitle}>{receipt.title}</Text>
        <Text style={styles.accountabilityReceiptDetail}>{receipt.detail}</Text>
      </View>
    </View>
  );
}

function TodayCountdownNote(props: {
  localDay: string;
  timeZone: string;
  dueAtIso: string | null;
}) {
  const note = useTodayCountdownNote(props);
  if (!note) return null;
  return (
    <Text style={styles.countdownNote} testID="today-countdown-note">
      {note}
    </Text>
  );
}

function TodayHero({
  presentation,
  onPrimaryPress,
  onSecondaryPress,
  primaryDisabled,
  promiseReceipt,
}: TodayStateCardProps) {
  const phoneLayout = usePhoneLayout();
  const isPassiveWait =
    presentation.primaryAction === 'wait' ||
    presentation.primaryAction === 'wait-upload';
  const hidesDecorativeVisual = phoneLayout.width <= 340;
  // The receipt carries routine days. The mascot stays for a genuine change:
  // the day being approved, or a state with no promise receipt to anchor it.
  const showsStage =
    Boolean(presentation.mascot) &&
    !hidesDecorativeVisual &&
    (!promiseReceipt || presentation.state === 'accepted-today');
  const mascotSize: MascotSize = phoneLayout.isShortHeight ? 'lg' : 'xl';
  const heroVisualHeight = phoneLayout.isShortHeight
    ? 128
    : phoneLayout.isCompactHeight || phoneLayout.width < 414
      ? 156
      : 168;
  const showsAccountabilityReceipt =
    Boolean(presentation.accountabilityReceipt) &&
    !(promiseReceipt && presentation.state === 'accepted-today');

  const countdown =
    presentation.state === 'proof-due' ? presentation.countdown : null;

  return (
    <>
      <Text style={styles.heroDate}>{presentation.dateLabel}</Text>

      {countdown ? (
        <View style={styles.heroCountdown}>
          <TodayCountdownHero
            dueAtIso={countdown.dueAtIso}
            localDay={countdown.localDay}
            mascot={presentation.mascot}
            preferredReminderTime={countdown.preferredReminderTime}
            streak={countdown.streak ?? null}
            timeZone={countdown.timeZone}
          />
        </View>
      ) : null}

      {!countdown && showsStage ? (
        <TodayHeroStage
          height={heroVisualHeight}
          mascotSize={mascotSize}
          presentation={presentation}
        />
      ) : null}

      {!countdown ? (
        <View
          style={[
            styles.heroCopyBlock,
            showsStage ? styles.heroCopyAfterStage : null,
          ]}
        >
          <Text style={styles.heroTitle}>{presentation.title}</Text>
          <Text
            style={[
              styles.heroDetail,
              phoneLayout.isCompactWidth ? styles.heroDetailCompact : null,
            ]}
          >
            {presentation.detail}
          </Text>
        </View>
      ) : null}

      {promiseReceipt ? (
        <View style={styles.heroReceipt}>
          <TodayPromiseReceipt receipt={promiseReceipt} />
        </View>
      ) : null}

      {showsAccountabilityReceipt ? (
        <AccountabilityReceipt receipt={presentation.accountabilityReceipt} />
      ) : null}

      <View style={styles.heroActions}>
        {!isPassiveWait ? (
          <AppButton
            disabled={primaryDisabled}
            haptic
            onPress={onPrimaryPress}
            size="large"
            title={presentation.primaryLabel}
            variant="accent"
            fullWidth
          />
        ) : null}
        {countdown ? (
          <TodayCountdownNote
            dueAtIso={countdown.dueAtIso}
            localDay={countdown.localDay}
            timeZone={countdown.timeZone}
          />
        ) : null}
        {presentation.secondaryLabel && onSecondaryPress ? (
          <AppButton
            onPress={onSecondaryPress}
            size="small"
            title={presentation.secondaryLabel}
            variant={isPassiveWait ? 'outline' : 'ghost'}
            fullWidth
            rightIcon={
              <ChevronRightIcon color={mentaColors.text.secondary} size={17} />
            }
          />
        ) : null}
      </View>
    </>
  );
}

function TodayAllClearState({
  presentation,
  onPrimaryPress,
  onSecondaryPress,
  primaryDisabled,
}: TodayStateCardProps) {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  return (
    <View
      style={{ minHeight: phoneLayout.todayAccountabilityMinHeight }}
      testID="today-all-clear-state"
    >
      <Text style={styles.heroDate}>{presentation.dateLabel}</Text>

      <View
        accessible
        accessibilityLabel={
          presentation.reviewStatus
            ? t('todayProof.today.all_clear_accessibility_with_review', {
                status: presentation.reviewStatus,
              })
            : t('today.all_clear.accessibility.zero_due')
        }
        style={styles.allClearSummary}
        testID="today-all-clear-summary"
      >
        <Text style={styles.allClearValue}>0</Text>
        <View style={styles.allClearSummaryCopy}>
          <Text style={styles.allClearLabel}>
            {t('today.all_clear.due_now')}
          </Text>
          {presentation.reviewStatus ? (
            <Text style={styles.allClearReviewStatus}>
              {presentation.reviewStatus}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.allClearHeading}>
        <Text style={styles.accountabilityTitle}>{presentation.title}</Text>
        <Text style={styles.accountabilityDetail}>{presentation.detail}</Text>
      </View>

      <View style={styles.accountabilityActions}>
        <AppButton
          disabled={primaryDisabled}
          haptic
          onPress={onPrimaryPress}
          size="large"
          title={presentation.primaryLabel}
          variant="accent"
          fullWidth
        />
        {presentation.secondaryLabel && onSecondaryPress ? (
          <AppButton
            onPress={onSecondaryPress}
            size="small"
            title={presentation.secondaryLabel}
            variant="ghost"
            fullWidth
          />
        ) : null}
      </View>
    </View>
  );
}

function TodayAccountabilityState({
  presentation,
  onPrimaryPress,
  onSecondaryPress,
  onRemindLater,
  primaryDisabled,
  mascotPrompt,
}: TodayStateCardProps) {
  const { colors } = useTheme();
  const phoneLayout = usePhoneLayout();
  const isRecoveryState =
    presentation.state === 'returning' ||
    presentation.state === 'streak-broken';
  const isProofDueCountdown =
    presentation.state === 'proof-due' && Boolean(presentation.countdown);
  const prompt = presentation.prompt ?? mascotPrompt;
  const heading = (
    <View
      style={[
        styles.accountabilityHeading,
        isProofDueCountdown ? styles.proofDueHeading : null,
        isRecoveryState ? styles.recoveryHeading : null,
      ]}
    >
      <Text
        style={[
          styles.accountabilityTitle,
          isRecoveryState ? styles.recoveryText : null,
        ]}
      >
        {presentation.title}
      </Text>
      <Text
        style={[
          styles.accountabilityDetail,
          isRecoveryState ? styles.recoveryText : null,
        ]}
      >
        {presentation.detail}
      </Text>
    </View>
  );
  return (
    <View
      style={{ minHeight: phoneLayout.todayAccountabilityMinHeight }}
      testID="today-accountability-state"
    >
      <Text style={styles.heroDate}>{presentation.dateLabel}</Text>

      {!isProofDueCountdown && !isRecoveryState ? heading : null}

      {presentation.mascot ? (
        <View
          style={[
            styles.accountabilityVisual,
            isRecoveryState
              ? [
                  styles.recoveryVisual,
                  {
                    minHeight: phoneLayout.isShortHeight
                      ? 120
                      : phoneLayout.isCompactHeight
                        ? 148
                        : 168,
                  },
                ]
              : null,
            isProofDueCountdown
              ? [
                  styles.proofDueVisual,
                  {
                    height: phoneLayout.isShortHeight
                      ? 148
                      : phoneLayout.isCompactHeight
                        ? 184
                        : 208,
                  },
                ]
              : null,
          ]}
          testID="today-accountability-visual"
        >
          {prompt && isRecoveryState ? (
            <TodaySpeechBubble testID="today-mascot-prompt" text={prompt} />
          ) : null}
          <MentaMascot
            state={presentation.mascot}
            size={
              isProofDueCountdown
                ? phoneLayout.isShortHeight
                  ? 'lg'
                  : phoneLayout.isCompactHeight
                    ? 'xl'
                    : 'hero'
                : isRecoveryState
                  ? phoneLayout.isShortHeight
                    ? 'md'
                    : 'lg'
                  : 'xl'
            }
            style={styles.accountabilityMascot}
            testID={`today-accountability-mascot-${presentation.mascot}`}
          />
        </View>
      ) : null}

      {presentation.countdown ? (
        <View style={styles.accountabilityCountdown}>
          <ProofDueCountdown
            visible
            localDay={presentation.countdown.localDay}
            timeZone={presentation.countdown.timeZone}
            preferredReminderTime={presentation.countdown.preferredReminderTime}
            dueAtIso={presentation.countdown.dueAtIso}
            promiseLabel={presentation.countdown.promiseLabel}
            variant={isProofDueCountdown ? 'hero' : 'card'}
          />
        </View>
      ) : null}

      {isProofDueCountdown || isRecoveryState ? heading : null}

      {presentation.facts?.length ? (
        <View style={styles.accountabilityFacts}>
          {presentation.facts.map((fact, index) => (
            <View
              key={fact.label}
              style={[
                styles.accountabilityFact,
                index < presentation.facts!.length - 1
                  ? styles.accountabilityFactDivider
                  : null,
              ]}
            >
              <Text style={styles.accountabilityFactLabel}>{fact.label}</Text>
              <Text
                style={[
                  styles.accountabilityFactValue,
                  fact.tone === 'action'
                    ? { color: colors.accent.primary }
                    : null,
                ]}
              >
                {fact.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {presentation.supportingNote ? (
        <Text
          style={[
            styles.accountabilityNote,
            isRecoveryState ? styles.recoveryNote : null,
          ]}
          testID="today-accountability-note"
        >
          {presentation.supportingNote}
        </Text>
      ) : null}

      <AccountabilityReceipt receipt={presentation.accountabilityReceipt} />

      <View
        style={[
          styles.accountabilityActions,
          isRecoveryState ? styles.recoveryActions : null,
        ]}
        testID="today-accountability-actions"
      >
        <AppButton
          disabled={primaryDisabled}
          haptic
          onPress={onPrimaryPress}
          size="large"
          title={presentation.primaryLabel}
          variant="accent"
          fullWidth
        />
        {presentation.secondaryLabel && onSecondaryPress ? (
          <AppButton
            onPress={onSecondaryPress}
            size="large"
            title={presentation.secondaryLabel}
            variant="outline"
            fullWidth
          />
        ) : null}
        {onRemindLater && isRecoveryState ? (
          <CoachSnoozeControl onRemindLater={onRemindLater} />
        ) : null}
      </View>
    </View>
  );
}

function TodayEmptyState({
  presentation,
  onPrimaryPress,
  onSecondaryPress,
  primaryDisabled,
  mascotPrompt,
}: TodayStateCardProps) {
  const phoneLayout = usePhoneLayout();
  const mascotSize = phoneLayout.isShortHeight
    ? 'lg'
    : phoneLayout.isCompactHeight
      ? 'xl'
      : 'hero';

  return (
    <View
      style={[
        styles.emptyState,
        { minHeight: phoneLayout.todayEmptyMinHeight },
      ]}
      testID="today-empty-state"
    >
      <View style={styles.emptyMain}>
        <View style={styles.emptyIntro} testID="today-empty-intro">
          <Text style={styles.emptyTitle}>{presentation.title}</Text>
          <Text style={styles.emptyDetail}>{presentation.detail}</Text>
        </View>
        <View
          style={[
            styles.emptyVisual,
            { minHeight: phoneLayout.heroVisualHeight },
          ]}
          testID="today-empty-visual"
        >
          {mascotPrompt ? (
            <TodaySpeechBubble
              testID="today-mascot-prompt"
              text={mascotPrompt}
            />
          ) : null}
          {presentation.mascot ? (
            <MentaMascot
              state={presentation.mascot}
              size={mascotSize}
              style={styles.emptyMascot}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.emptyActions} testID="today-empty-actions">
        <AppButton
          disabled={primaryDisabled}
          haptic
          onPress={onPrimaryPress}
          size="large"
          title={presentation.primaryLabel}
          variant="accent"
          fullWidth
        />
        {presentation.secondaryLabel && onSecondaryPress ? (
          <AppButton
            onPress={onSecondaryPress}
            size="small"
            title={presentation.secondaryLabel}
            variant="ghost"
            fullWidth
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * Loading keeps the hero geometry: date, framed stage, centred heading and
 * detail, the promise receipt and the primary action, so nothing jumps when
 * the confirmed state arrives.
 */
function TodayLoadingSkeleton() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const visualHeight = phoneLayout.isShortHeight
    ? 128
    : phoneLayout.isCompactHeight || phoneLayout.width < 414
      ? 156
      : 168;

  return (
    <View
      accessible
      accessibilityLabel={t('today.loading.accessibility')}
      accessibilityRole="progressbar"
      style={styles.skeletonStack}
      testID="today-loading-skeleton"
    >
      <SkeletonLoader
        announce={false}
        height={16}
        testID="today-loading-date"
        width="42%"
      />
      {phoneLayout.width > 340 ? (
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.large}
          height={visualHeight}
          testID="today-loading-hero"
        />
      ) : null}
      <View style={styles.skeletonCopy}>
        <SkeletonLoader announce={false} height={34} width="82%" />
        <SkeletonLoader announce={false} height={18} width="92%" />
        <SkeletonLoader announce={false} height={18} width="64%" />
      </View>
      <SkeletonLoader
        announce={false}
        borderRadius={mentaRadii.large}
        height={144}
        testID="today-loading-receipt"
      />
      <SkeletonLoader
        announce={false}
        borderRadius={mentaRadii.round}
        height={mentaLayout.primaryControlHeight}
        testID="today-loading-primary-action"
      />
    </View>
  );
}

const SYSTEM_TILE_TONE: Record<TodayAccent, { background: string }> = {
  action: { background: mentaColors.actionSoft },
  success: { background: mentaColors.successSoft },
  warning: { background: mentaColors.warningSoft },
  danger: { background: mentaColors.dangerSoft },
  muted: { background: mentaColors.raised },
};

const SYSTEM_ICON_COLOR: Record<TodayAccent, string> = {
  action: mentaColors.action,
  success: mentaColors.success,
  warning: mentaColors.warning,
  danger: mentaColors.danger,
  muted: mentaColors.text.secondary,
};

function SystemStateIcon({
  presentation,
}: {
  presentation: TodayPresentation;
}) {
  const color = SYSTEM_ICON_COLOR[presentation.accent];
  switch (presentation.state) {
    case 'offline-stale':
      return <WifiOffIcon color={color} size={22} />;
    case 'group-at-risk':
      return <UsersIcon color={color} size={22} />;
    default:
      return <RefreshCwIcon color={color} size={22} />;
  }
}

function TodayStateCardContent({
  presentation,
  onPrimaryPress,
  onSecondaryPress,
  onRemindLater = null,
  primaryDisabled = false,
  promiseReceipt = null,
  mascotPrompt = null,
}: TodayStateCardProps) {
  const isLoading = presentation.state === 'loading';

  if (presentation.state === 'all-clear') {
    return (
      <View
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${presentation.title}. ${presentation.detail}`}
        style={styles.stateLane}
        testID="today-state-all-clear"
      >
        <TodayStateEntrance stateKey={presentation.state}>
          <TodayAllClearState
            presentation={presentation}
            onPrimaryPress={onPrimaryPress}
            onSecondaryPress={onSecondaryPress}
            primaryDisabled={primaryDisabled}
          />
        </TodayStateEntrance>
      </View>
    );
  }

  if (presentation.layout === 'empty') {
    return (
      <View
        accessibilityLiveRegion="polite"
        style={styles.stateLane}
        testID={`today-state-${presentation.state}`}
      >
        <TodayStateEntrance stateKey={presentation.state}>
          <TodayEmptyState
            presentation={presentation}
            onPrimaryPress={onPrimaryPress}
            onSecondaryPress={onSecondaryPress}
            primaryDisabled={primaryDisabled}
            mascotPrompt={mascotPrompt}
          />
        </TodayStateEntrance>
      </View>
    );
  }

  if (presentation.layout === 'hero') {
    return (
      <View
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${presentation.title}. ${presentation.detail}`}
        style={styles.stateLane}
        testID={`today-state-${presentation.state}`}
      >
        <TodayStateEntrance stateKey={presentation.state}>
          <TodayHero
            presentation={presentation}
            onPrimaryPress={onPrimaryPress}
            onSecondaryPress={onSecondaryPress}
            primaryDisabled={primaryDisabled}
            promiseReceipt={promiseReceipt}
          />
        </TodayStateEntrance>
      </View>
    );
  }

  if (presentation.layout === 'accountability') {
    return (
      <View
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${presentation.title}. ${presentation.detail}`}
        style={styles.stateLane}
        testID={`today-state-${presentation.state}`}
      >
        <TodayStateEntrance stateKey={presentation.state}>
          <TodayAccountabilityState
            presentation={presentation}
            onPrimaryPress={onPrimaryPress}
            onSecondaryPress={onSecondaryPress}
            onRemindLater={onRemindLater}
            primaryDisabled={primaryDisabled}
            mascotPrompt={mascotPrompt}
          />
        </TodayStateEntrance>
      </View>
    );
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${presentation.title}. ${presentation.detail}`}
      style={[styles.stateLane, styles.systemState]}
      testID={`today-state-${presentation.state}`}
    >
      {isLoading ? (
        <TodayLoadingSkeleton />
      ) : (
        <TodayStateEntrance stateKey={presentation.state}>
          <Text style={styles.heroDate}>{presentation.dateLabel}</Text>
          <View style={styles.systemCard}>
            <View
              style={[
                styles.systemTile,
                {
                  backgroundColor:
                    SYSTEM_TILE_TONE[presentation.accent].background,
                },
              ]}
            >
              <SystemStateIcon presentation={presentation} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{presentation.title}</Text>
              <Text style={styles.detail}>{presentation.detail}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              disabled={primaryDisabled}
              haptic
              onPress={onPrimaryPress}
              size="large"
              title={presentation.primaryLabel}
              variant="accent"
              fullWidth
            />
            {presentation.secondaryLabel && onSecondaryPress ? (
              <AppButton
                onPress={onSecondaryPress}
                size="large"
                title={presentation.secondaryLabel}
                variant="outline"
                fullWidth
              />
            ) : null}
          </View>
        </TodayStateEntrance>
      )}
    </View>
  );
}

export function TodayStateCard(props: TodayStateCardProps): React.ReactElement {
  const inheritedTextScale = useAppTextScale();
  const textScale = props.textScale ?? inheritedTextScale;
  if (textScale == null) {
    return <TodayStateCardContent {...props} />;
  }
  return (
    <AppTextScaleProvider scale={textScale}>
      <TodayStateCardContent {...props} />
    </AppTextScaleProvider>
  );
}

const styles = StyleSheet.create({
  heroCountdown: {
    marginBottom: mentaSpacing[6],
    marginTop: mentaSpacing[5],
  },
  recoveryHeading: {
    alignItems: 'center',
    marginTop: mentaSpacing[5],
  },
  recoveryText: {
    textAlign: 'center',
  },
  countdownNote: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.muted,
    textAlign: 'center',
  },
  stateLane: {
    alignSelf: 'center',
    maxWidth: mentaLayout.taskLane,
    width: '100%',
  },
  emptyState: {
    gap: mentaSpacing[5],
    justifyContent: 'center',
    paddingVertical: mentaSpacing[4],
  },
  emptyMain: {
    gap: mentaSpacing[5],
  },
  emptyIntro: {
    gap: mentaSpacing[3],
  },
  emptyTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  emptyDetail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  emptyMascot: {
    alignSelf: 'center',
  },
  emptyVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyActions: {
    gap: mentaSpacing[2],
  },
  systemState: {
    paddingVertical: mentaSpacing[3],
  },
  systemCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  systemTile: {
    alignItems: 'center',
    borderRadius: mentaRadii.medium,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  heroDate: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.secondary,
    marginBottom: mentaSpacing[5],
  },
  heroVisual: {
    alignItems: 'center',
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    width: '100%',
  },
  heroHalo: {
    borderRadius: mentaRadii.round,
    position: 'absolute',
  },
  heroMascot: {
    flexShrink: 0,
  },
  heroCopyAfterStage: {
    marginTop: mentaSpacing[5],
  },
  heroReceipt: {
    marginTop: mentaSpacing[6],
  },
  heroCopyBlock: {
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  heroTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
    textAlign: 'center',
  },
  heroDetail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    textAlign: 'center',
  },
  heroDetailCompact: { maxWidth: '100%' },
  heroActions: {
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[5],
  },
  accountabilityHeading: {
    gap: mentaSpacing[3],
  },
  accountabilityVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: mentaSpacing[4],
    minHeight: 196,
    overflow: 'visible',
    width: '100%',
  },
  recoveryVisual: {
    marginTop: mentaSpacing[3],
    minHeight: 168,
  },
  proofDueVisual: {
    marginTop: 0,
    minHeight: 0,
  },
  accountabilityMascot: {
    flexShrink: 0,
  },
  accountabilityTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  accountabilityDetail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  accountabilityCountdown: {
    marginTop: mentaSpacing[5],
  },
  proofDueHeading: {
    marginTop: mentaSpacing[3],
  },
  accountabilityFacts: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: mentaSpacing[5],
  },
  accountabilityFact: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: mentaSpacing[3],
  },
  accountabilityFactDivider: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accountabilityFactLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    flex: 1,
    minWidth: 0,
  },
  accountabilityFactValue: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  accountabilityNote: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[5],
    maxWidth: mentaLayout.readingMeasure,
  },
  recoveryNote: {
    marginTop: mentaSpacing[3],
  },
  accountabilityReceipt: {
    alignItems: 'flex-start',
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    marginTop: mentaSpacing[5],
    padding: mentaSpacing[4],
  },
  accountabilityReceiptCopy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  accountabilityReceiptTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.onPaper,
  },
  accountabilityReceiptDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
  },
  accountabilityActions: {
    gap: mentaSpacing[2],
    marginTop: 'auto',
    paddingTop: mentaSpacing[8],
  },
  recoveryActions: {
    marginTop: mentaSpacing[4],
    paddingTop: 0,
  },
  allClearSummary: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[5],
    marginTop: mentaSpacing[5],
    paddingVertical: mentaSpacing[5],
  },
  allClearValue: {
    ...mentaTypography.display,
    color: mentaColors.text.primary,
    fontSize: 72,
    fontVariant: ['tabular-nums'],
    lineHeight: 76,
  },
  allClearSummaryCopy: {
    flex: 1,
    flexGrow: 1,
    gap: mentaSpacing[1],
    minWidth: 180,
  },
  allClearLabel: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  allClearReviewStatus: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  allClearHeading: {
    gap: mentaSpacing[3],
    marginTop: mentaSpacing[6],
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[2],
  },
  actions: {
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[8],
  },
  skeletonStack: {
    gap: mentaSpacing[5],
  },
  skeletonCopy: {
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
});
