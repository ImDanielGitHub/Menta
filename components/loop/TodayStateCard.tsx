import React from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { MentaMascot, type MascotSize } from '@/components/ui/MentaMascot';
import { AppButton } from '@/components/ui/AppButton';
import {
  AppScaledText as Text,
  AppTextScaleProvider,
  useAppTextScale,
} from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { ChevronRightIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { CoachSnoozeControl } from '@/components/streak/CoachSnoozeControl';
import { ProofDueCountdown } from '@/components/streak/ProofDueCountdown';
import { useTranslation } from '@/lib/localization';

import type { TodayPresentation } from '@/components/loop/today-copy';

type TodayProgress = {
  streakCount: number | null;
  dayNumber: number | null;
  totalDays: number | null;
};

type TodayStateCardProps = {
  presentation: TodayPresentation;
  onPrimaryPress: () => void;
  onSecondaryPress?: (() => void) | null;
  onRemindLater?: (() => void | Promise<void>) | null;
  primaryDisabled?: boolean;
  progress?: TodayProgress | null;
  textScale?: number;
};

function TodayProgressSummary({
  progress,
}: {
  progress?: TodayProgress | null;
}) {
  const { t } = useTranslation();
  if (!progress) return null;

  const hasStreak = progress.streakCount !== null;
  const hasDay = progress.dayNumber !== null;
  if (!hasStreak && !hasDay) return null;

  const streakLabel = hasStreak
    ? t('today.progress.streak_days', { count: progress.streakCount! })
    : null;
  const dayLabel = hasDay
    ? progress.totalDays
      ? t('today.progress.day_of', {
          day: progress.dayNumber!,
          total: progress.totalDays,
        })
      : t('today.progress.day', { day: progress.dayNumber! })
    : null;
  const accessibilityParts = [
    streakLabel
      ? t('today.progress.accessibility.current_streak', {
          value: streakLabel,
        })
      : null,
    dayLabel
      ? t('today.progress.accessibility.promise', { value: dayLabel })
      : null,
  ].filter(Boolean);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityParts.join(' ')}
      style={styles.progressSummary}
      testID="today-progress-summary"
    >
      {streakLabel ? (
        <View style={styles.progressMetric}>
          <Text style={styles.progressValue}>{streakLabel}</Text>
          <Text style={styles.progressLabel}>
            {t('today.progress.current_streak')}
          </Text>
        </View>
      ) : null}
      {streakLabel && dayLabel ? <View style={styles.progressDivider} /> : null}
      {dayLabel ? (
        <View style={styles.progressMetric}>
          <Text style={styles.progressValue}>{dayLabel}</Text>
          <Text style={styles.progressLabel}>
            {t('today.progress.promise')}
          </Text>
        </View>
      ) : null}
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

function TodayHero({
  presentation,
  onPrimaryPress,
  onSecondaryPress,
  primaryDisabled,
  progress,
}: TodayStateCardProps) {
  const phoneLayout = usePhoneLayout();
  const isPassiveWait =
    presentation.primaryAction === 'wait' ||
    presentation.primaryAction === 'wait-upload';
  const hidesDecorativeVisual = phoneLayout.width <= 340;
  const mascotSize: MascotSize = phoneLayout.isShortHeight ? 'lg' : 'xl';
  const heroVisualHeight = phoneLayout.isShortHeight
    ? 128
    : phoneLayout.isCompactHeight || phoneLayout.width < 414
      ? 156
      : 168;

  return (
    <>
      <Text style={styles.heroDate}>{presentation.dateLabel}</Text>

      <View style={styles.heroCopyBlock}>
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

      {presentation.mascot && !hidesDecorativeVisual ? (
        <View
          style={[styles.heroVisual, { height: heroVisualHeight }]}
          testID="today-hero-visual"
        >
          <MentaMascot
            state={presentation.mascot}
            size={mascotSize}
            style={styles.heroMascot}
          />
        </View>
      ) : null}

      <AccountabilityReceipt receipt={presentation.accountabilityReceipt} />

      <TodayProgressSummary progress={progress} />

      <View style={styles.heroActions}>
        {!isPassiveWait ? (
          <AppButton
            disabled={primaryDisabled}
            onPress={onPrimaryPress}
            size="large"
            title={presentation.primaryLabel}
            variant="accent"
            fullWidth
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
}: TodayStateCardProps) {
  const { colors } = useTheme();
  const phoneLayout = usePhoneLayout();
  const isRecoveryState =
    presentation.state === 'returning' ||
    presentation.state === 'streak-broken';
  const isProofDueCountdown =
    presentation.state === 'proof-due' && Boolean(presentation.countdown);
  return (
    <View
      style={{ minHeight: phoneLayout.todayAccountabilityMinHeight }}
      testID="today-accountability-state"
    >
      <Text style={styles.heroDate}>{presentation.dateLabel}</Text>

      {!isProofDueCountdown ? (
        <View style={styles.accountabilityHeading}>
          <Text style={styles.accountabilityTitle}>{presentation.title}</Text>
          <Text style={styles.accountabilityDetail}>{presentation.detail}</Text>
        </View>
      ) : null}

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

      {isProofDueCountdown ? (
        <View style={[styles.accountabilityHeading, styles.proofDueHeading]}>
          <Text style={styles.accountabilityTitle}>{presentation.title}</Text>
          <Text style={styles.accountabilityDetail}>{presentation.detail}</Text>
        </View>
      ) : null}

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

function TodayLoadingSkeleton() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const visualHeight = phoneLayout.isShortHeight
    ? 128
    : phoneLayout.isCompactHeight || phoneLayout.width < 414
      ? 156
      : 168;

  const placeholder = (
    height: number,
    width: DimensionValue = '100%',
    testID?: string
  ) => (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.loadingPlaceholder, { height, width }]}
      testID={testID}
    />
  );

  return (
    <View
      accessible
      accessibilityLabel={t('today.loading.accessibility')}
      accessibilityRole="progressbar"
      style={styles.skeletonStack}
      testID="today-loading-skeleton"
    >
      {placeholder(16, '34%', 'today-loading-date')}
      <View style={styles.skeletonCopy}>
        {placeholder(38, '78%')}
        {placeholder(23, '92%')}
        {placeholder(23, '68%')}
      </View>
      {phoneLayout.width > 340 ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ height: visualHeight }}
          testID="today-loading-hero"
        />
      ) : null}
      <View style={styles.skeletonProgress}>
        {placeholder(44, '32%')}
        {placeholder(44, '38%')}
      </View>
      <View
        style={styles.loadingAction}
        testID="today-loading-primary-action"
      />
    </View>
  );
}

function TodayStateCardContent({
  presentation,
  onPrimaryPress,
  onSecondaryPress,
  onRemindLater = null,
  primaryDisabled = false,
  progress = null,
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
        <TodayAllClearState
          presentation={presentation}
          onPrimaryPress={onPrimaryPress}
          onSecondaryPress={onSecondaryPress}
          primaryDisabled={primaryDisabled}
        />
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
        <TodayEmptyState
          presentation={presentation}
          onPrimaryPress={onPrimaryPress}
          onSecondaryPress={onSecondaryPress}
          primaryDisabled={primaryDisabled}
        />
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
        <TodayHero
          presentation={presentation}
          onPrimaryPress={onPrimaryPress}
          onSecondaryPress={onSecondaryPress}
          primaryDisabled={primaryDisabled}
          progress={progress}
        />
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
        <TodayAccountabilityState
          presentation={presentation}
          onPrimaryPress={onPrimaryPress}
          onSecondaryPress={onSecondaryPress}
          onRemindLater={onRemindLater}
          primaryDisabled={primaryDisabled}
        />
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
        <>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{presentation.title}</Text>
              <Text style={styles.detail}>{presentation.detail}</Text>
            </View>
            {presentation.mascot ? (
              <MentaMascot
                state={presentation.mascot}
                size="sm"
                style={styles.mascot}
              />
            ) : null}
          </View>

          <View style={styles.actions}>
            <AppButton
              disabled={primaryDisabled}
              onPress={onPrimaryPress}
              title={presentation.primaryLabel}
              variant="accent"
              fullWidth
            />
            {presentation.secondaryLabel && onSecondaryPress ? (
              <AppButton
                onPress={onSecondaryPress}
                title={presentation.secondaryLabel}
                variant="outline"
                fullWidth
              />
            ) : null}
          </View>
        </>
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
    gap: mentaSpacing[5],
    paddingVertical: mentaSpacing[3],
  },
  heroDate: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.secondary,
    marginBottom: mentaSpacing[5],
  },
  heroVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: mentaSpacing[2],
    overflow: 'visible',
    position: 'relative',
    width: '100%',
  },
  heroMascot: {
    flexShrink: 0,
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
  progressSummary: {
    alignItems: 'stretch',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: mentaSpacing[5],
    paddingVertical: mentaSpacing[3],
  },
  progressMetric: {
    alignItems: 'center',
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  progressDivider: {
    backgroundColor: mentaColors.border,
    width: StyleSheet.hairlineWidth,
  },
  progressValue: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  progressLabel: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    textAlign: 'center',
  },
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
  heroRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[4],
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
  mascot: {
    flexShrink: 0,
    marginRight: -mentaSpacing[1],
    marginTop: -mentaSpacing[1],
  },
  actions: {
    gap: mentaSpacing[2],
  },
  skeletonStack: {
    gap: mentaSpacing[5],
  },
  skeletonCopy: {
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  skeletonProgress: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[2],
  },
  loadingPlaceholder: {
    backgroundColor: mentaColors.skeleton,
    borderRadius: mentaRadii.small,
  },
  loadingAction: {
    backgroundColor: mentaColors.skeleton,
    borderRadius: mentaRadii.large,
    height: mentaLayout.primaryControlHeight,
    width: '100%',
  },
});
