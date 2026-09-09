import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppFieldRow,
  AppInlineNotice,
  AppScreen,
  AppSwitchRow,
  SkeletonLoader,
} from '@/components/ui';
import {
  ProofEvidenceRow,
  ProofEvidenceRowSkeleton,
  ProofEvidenceViewer,
  type ProofEvidenceRecord,
} from '@/components/challenge/proof-evidence';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { mentaFonts } from '@/lib/menta-fonts';
import {
  ChevronLeftIcon,
  ClockIcon,
  FileTextIcon,
  ShieldCheckIcon,
  TargetIcon,
  UsersIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import type { ProofMediaType } from '@/lib/proof-types';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  IPadTwoPaneWorkspace,
  useIPadPortraitWorkspace,
} from '@/components/ipad/ipad-workspace';

type FamilyFrameProps = {
  children: React.ReactNode;
  testID: string;
  scrollable?: boolean;
  hasTabBar?: boolean;
  contentGap?: number;
  /** Distribute short states through the viewport instead of stranding them at the top. */
  centered?: boolean;
};

const FamilyFrame = ({
  children,
  testID,
  scrollable = true,
  hasTabBar = false,
  contentGap,
  centered = false,
}: FamilyFrameProps) => (
  <AppScreen
    lane="immersive"
    testID={testID}
    safeArea
    scrollable={scrollable}
    padding={false}
    hasTabBar={hasTabBar}
    style={styles.screen}
    contentContainerStyle={{
      ...styles.contentFrame,
      ...(contentGap === undefined ? null : { gap: contentGap }),
      ...(centered ? styles.centeredLane : null),
    }}
  >
    {children}
  </AppScreen>
);

type FamilyHeadingProps = {
  cue?: string;
  title: string;
  description?: string;
  onBack?: () => void;
};

const normaliseAllCaps = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed !== trimmed.toUpperCase()) return trimmed;

  const lower = trimmed.toLocaleLowerCase('en-NZ');
  return `${lower.charAt(0).toLocaleUpperCase('en-NZ')}${lower.slice(1)}`;
};

const FamilyHeading = ({
  cue,
  title,
  description,
  onBack,
}: FamilyHeadingProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.headingBlock}>
      {onBack ? (
        <View style={styles.backAction}>
          <AppButton
            title={t('accessibility.back')}
            onPress={onBack}
            variant="ghost"
            size="small"
            haptic={false}
          />
        </View>
      ) : null}
      {cue ? <Text style={styles.cue}>{normaliseAllCaps(cue)}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
};

const PaperReceiptLabel = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.paperReceiptLabel}>{children}</Text>
);

const PromisePaperSheet = ({
  children,
  testID,
}: {
  children: React.ReactNode;
  testID: string;
}) => (
  <View style={styles.promisePaperSheet} testID={testID}>
    {children}
  </View>
);

const ActionStack = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.actionStack}>{children}</View>
);

export type PromiseMutationRecoveryNotice = {
  title: string;
  description: string;
  tone: 'info' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
};

const MutationRecoveryNotice = ({
  notice,
}: {
  notice?: PromiseMutationRecoveryNotice | null;
}) =>
  notice ? (
    <AppInlineNotice
      title={notice.title}
      description={notice.description}
      tone={notice.tone}
      actionLabel={notice.actionLabel}
      onAction={notice.onAction}
      actionLoading={notice.actionLoading}
      testID="promise-mutation-recovery"
    />
  ) : null;

const PromiseDetailWorkspace = ({
  primary,
  secondary,
  testID,
}: {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  testID: string;
}) => {
  const enabled = useIPadPortraitWorkspace();
  if (!enabled) {
    return (
      <>
        {primary}
        {secondary}
      </>
    );
  }

  return (
    <IPadTwoPaneWorkspace
      enabled
      primary={primary}
      secondary={secondary}
      testID={testID}
    />
  );
};

/**
 * A real but secondary route out of a screen. Keeps a full-height touch target
 * without giving a side path the same weight as the primary action.
 */
const TextAction = ({
  danger = false,
  label,
  onPress,
  testID,
}: {
  danger?: boolean;
  label: string;
  onPress: () => void;
  testID?: string;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={({ pressed }) => [
      styles.textAction,
      pressed ? styles.pressed : null,
    ]}
    testID={testID}
  >
    <Text
      style={[styles.textActionLabel, danger ? styles.textActionDanger : null]}
    >
      {label}
    </Text>
  </Pressable>
);

/**
 * Seven-day proof evidence.
 *
 * Every marker is read from a real proof record. `past` means the calendar day
 * has gone by without a known proof outcome, so it renders as unresolved rather
 * than borrowing the approved colour.
 */
export type PromiseProofDayState =
  | 'approved'
  | 'waiting'
  | 'needs-retry'
  | 'missed'
  | 'protected'
  | 'today'
  | 'future'
  | 'past'
  | 'inactive';

export type PromiseProofDay = {
  label: string;
  state: PromiseProofDayState;
};

const proofDayDescription: Record<PromiseProofDayState, string> = {
  approved: 'proof approved',
  waiting: 'proof waiting for review',
  'needs-retry': 'proof needs another try',
  missed: 'missed, streak stopped',
  protected: 'streak protected, no approved proof',
  today: 'today, no proof yet',
  future: 'not due yet',
  past: 'no proof record',
  inactive: 'promise not active',
};

const proofMarkerStyle = (state: PromiseProofDayState) => {
  switch (state) {
    case 'approved':
      return styles.weekMarkerApproved;
    case 'waiting':
      return styles.weekMarkerWaiting;
    case 'needs-retry':
      return styles.weekMarkerRetry;
    case 'today':
      return styles.weekMarkerToday;
    case 'missed':
      return styles.weekMarkerMissed;
    case 'protected':
      return styles.weekMarkerProtected;
    case 'past':
      return styles.weekMarkerUnresolved;
    default:
      return styles.weekMarkerFuture;
  }
};

const proofMarkerContent = (
  state: PromiseProofDayState,
  accentColor: string
) => {
  if (state === 'missed') {
    return <Text style={styles.weekMarkerMissedText}>×</Text>;
  }
  if (state === 'protected') {
    return <ShieldCheckIcon color={accentColor} size={13} />;
  }
  return null;
};

export type PromiseProofWeekProps = {
  week: readonly PromiseProofDay[];
  /** Short factual caption, e.g. `Proof this week`. */
  label?: string;
};

export const PromiseProofWeek = ({
  week,
  label = 'Proof this week',
}: PromiseProofWeekProps) => {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${week
        .map(day => `${day.label} ${proofDayDescription[day.state]}`)
        .join(', ')}`}
      style={styles.weekStrip}
      testID="promise-proof-week"
    >
      {week.map((day, index) => (
        <View
          key={`${day.label}-${index}`}
          style={[
            styles.weekDay,
            day.state === 'today'
              ? [styles.weekDayToday, { borderColor: colors.accent.primary }]
              : null,
          ]}
        >
          <Text
            style={[
              styles.weekDayText,
              day.state === 'today'
                ? [styles.weekDayTextToday, { color: colors.accent.primary }]
                : null,
            ]}
          >
            {day.label}
          </Text>
          <View
            style={[
              styles.weekMarker,
              proofMarkerStyle(day.state),
              day.state === 'today'
                ? { borderColor: colors.accent.primary }
                : day.state === 'protected'
                  ? { borderColor: colors.accent.primary }
                  : null,
            ]}
            testID={`promise-proof-day-${index}-marker`}
          >
            {proofMarkerContent(day.state, colors.accent.primary)}
          </View>
        </View>
      ))}
    </View>
  );
};

type PromiseFactRowProps = {
  label: string;
  value: string;
  onChange?: () => void;
  isLast?: boolean;
  onPaper?: boolean;
  testID?: string;
};

/**
 * One promise fact. The value carries the weight because it is the answer the
 * person came for; the label stays quiet sentence-case supporting text.
 */
const PromiseFactRow = ({
  label,
  value,
  onChange,
  isLast = false,
  onPaper = false,
  testID,
}: PromiseFactRowProps) => {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const stacksPaperFact =
    onPaper &&
    ((phoneLayout.width > 0 && phoneLayout.isCompactWidth) ||
      phoneLayout.fontScale >= 1.2);
  const body = (
    <>
      <Text
        style={[
          styles.factRowLabel,
          onPaper ? styles.factRowLabelOnPaper : null,
          stacksPaperFact ? styles.factRowLabelOnPaperStacked : null,
        ]}
        testID={testID ? `${testID}-label` : undefined}
      >
        {label}
      </Text>
      <View
        style={[
          styles.factRowValueLane,
          stacksPaperFact ? styles.factRowValueLaneStacked : null,
        ]}
        testID={testID ? `${testID}-value-lane` : undefined}
      >
        <Text
          style={[
            styles.factRowValue,
            onPaper ? styles.factRowValueOnPaper : null,
          ]}
          testID={testID ? `${testID}-value` : undefined}
        >
          {value}
        </Text>
        {onChange ? (
          <Text
            style={[
              styles.factRowChange,
              onPaper ? styles.factRowChangeOnPaper : null,
              stacksPaperFact ? styles.factRowChangeOnPaperStacked : null,
            ]}
          >
            {t('todayProof.residual.change')}
          </Text>
        ) : null}
      </View>
    </>
  );

  const rowStyle = [
    styles.factRow,
    onPaper ? styles.factRowOnPaper : null,
    stacksPaperFact ? styles.factRowOnPaperStacked : null,
    isLast ? styles.factRowLast : null,
  ];

  if (!onChange) {
    return (
      <View
        accessible
        accessibilityLabel={`${label}: ${value}`}
        style={rowStyle}
        testID={testID}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={`Change ${label.toLocaleLowerCase('en-NZ')}`}
      onPress={onChange}
      style={({ pressed }) => [rowStyle, pressed ? styles.pressed : null]}
      testID={testID}
    >
      {body}
    </Pressable>
  );
};

export type SoloChallengesLoadingStateProps = {
  onBack?: () => void;
};

export const SoloChallengesLoadingState = ({
  onBack,
}: SoloChallengesLoadingStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="solo-challenges-loading" scrollable={false}>
      <FamilyHeading title={t('todayProof.solo.heading')} onBack={onBack} />
      <View
        accessible
        accessibilityLabel={t('todayProof.solo.loading_accessibility')}
        accessibilityRole="progressbar"
        style={styles.loadingStack}
      >
        <Text style={styles.loadingTitle}>{t('todayProof.solo.loading')}</Text>
        {/* Same geometry as the loaded list: one tab bar and full-height promise
          cards, so nothing shifts or shrinks when the records arrive. */}
        <SkeletonLoader
          announce={false}
          height={44}
          borderRadius={mentaRadii.round}
        />
        <SkeletonLoader
          announce={false}
          height={112}
          borderRadius={mentaRadii.large}
        />
        <SkeletonLoader
          announce={false}
          height={112}
          borderRadius={mentaRadii.large}
        />
      </View>
    </FamilyFrame>
  );
};

export type SoloChallengesEmptyStateProps = {
  onCreateSolo: () => void;
  onViewHistory: () => void;
  onCreateChallenge: () => void;
  /** Kept while older route callers migrate to onCreateChallenge. */
  onBackToCreation?: () => void;
  onBack?: () => void;
};

/**
 * Nothing to show yet, so the screen explains what a personal promise is and
 * offers exactly one way forward. Past promises and group promises stay
 * reachable as quiet text actions rather than three equal buttons.
 */
export const SoloChallengesEmptyState = ({
  onCreateSolo,
  onViewHistory,
  onCreateChallenge,
  onBack,
}: SoloChallengesEmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="solo-challenges-empty" centered>
      <View style={styles.emptyBlock}>
        {onBack ? (
          <View style={styles.backAction}>
            <AppButton
              title={t('accessibility.back')}
              onPress={onBack}
              variant="ghost"
              size="small"
              haptic={false}
            />
          </View>
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>
          {t('todayProof.solo.no_personal')}
        </Text>
        <Text style={[styles.emptyLead, styles.proseMeasure]}>
          {t('todayProof.solo.no_personal_detail')}
        </Text>
        <AppButton
          title={t('todayProof.solo.create')}
          onPress={onCreateSolo}
          fullWidth
          size="large"
          style={styles.emptyPrimaryAction}
          testID="solo-empty-create-solo"
        />
        <View style={styles.emptySecondaryActions}>
          <TextAction
            label={t('todayProof.solo.view_past')}
            onPress={onViewHistory}
            testID="solo-empty-view-history"
          />
          <TextAction
            label={t('todayProof.solo.create_group')}
            onPress={onCreateChallenge}
            testID="solo-empty-create-group-promise"
          />
        </View>
      </View>
    </FamilyFrame>
  );
};

export type CreateTabBridgeStateProps = {
  onCreatePromise: () => void;
  onJoinSoloChallenge: () => void;
  onStartWithGroup: () => void;
  onLearn: () => void;
  onBack?: () => void;
};

export const CreateTabBridgeState = ({
  onCreatePromise,
  onJoinSoloChallenge,
  onStartWithGroup,
  onLearn,
  onBack,
}: CreateTabBridgeStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="create-tab-bridge" hasTabBar contentGap={16}>
      <View style={styles.createTopBar}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.back')}
            onPress={onBack}
            style={({ pressed }) => [
              styles.createBackAction,
              pressed ? styles.pressed : null,
            ]}
          >
            <ChevronLeftIcon size={20} color={mentaColors.text.primary} />
            <Text style={styles.createTopBarLabel}>
              {t('todayProof.creation.header')}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.createTopBarLabel}>
            {t('todayProof.creation.header')}
          </Text>
        )}
      </View>
      <View style={styles.createIntro}>
        <Text style={styles.createTitle}>
          {t('todayProof.creation.what_create')}
        </Text>
        <Text style={styles.createDescription}>
          {t('todayProof.creation.create_intro')}
        </Text>
      </View>
      <View style={styles.rowList}>
        <AppFieldRow
          title={t('todayProof.solo.create')}
          subtitle={t('todayProof.creation.create_promise_detail')}
          icon={<TargetIcon size={20} color={mentaColors.action} />}
          onPress={onCreatePromise}
          testID="create-bridge-promise"
        />
        <AppFieldRow
          title={t('todayProof.creation.join_public')}
          subtitle={t('todayProof.creation.join_public_detail')}
          icon={<ClockIcon size={20} color={mentaColors.text.secondary} />}
          onPress={onJoinSoloChallenge}
          testID="create-bridge-solo-run"
        />
        <AppFieldRow
          title={t('todayProof.creation.with_group')}
          subtitle={t('todayProof.creation.with_group_detail')}
          icon={<UsersIcon size={20} color={mentaColors.text.secondary} />}
          onPress={onStartWithGroup}
          testID="create-bridge-group"
        />
      </View>
      <View style={styles.createActions}>
        <AppButton
          title={t('todayProof.creation.how_work')}
          onPress={onLearn}
          fullWidth
          variant="ghost"
        />
      </View>
    </FamilyFrame>
  );
};

export type GroupModeNoGroupStateProps = {
  onSelectGroup: () => void;
  onCreateGroup: () => void;
  onContinueWithoutGroup: () => void;
  onBack?: () => void;
};

export const GroupModeNoGroupState = ({
  onSelectGroup,
  onCreateGroup,
  onContinueWithoutGroup,
  onBack,
}: GroupModeNoGroupStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="group-mode-no-group">
      <FamilyHeading
        title={t('todayProof.creation.choose_group_first')}
        description={t('todayProof.creation.choose_group_first_detail')}
        onBack={onBack}
      />
      <ActionStack>
        <AppButton
          title={t('todayProof.creation.choose_group')}
          onPress={onSelectGroup}
          fullWidth
          size="large"
        />
        <AppButton
          title={t('todayProof.creation.create_group')}
          onPress={onCreateGroup}
          fullWidth
          variant="secondary"
        />
        <AppButton
          title={t('todayProof.creation.keep_personal')}
          onPress={onContinueWithoutGroup}
          fullWidth
          variant="ghost"
        />
      </ActionStack>
    </FamilyFrame>
  );
};

export type PromiseDetailSkeletonStateProps = {
  onBack?: () => void;
};

export const PromiseDetailSkeletonState = ({
  onBack,
}: PromiseDetailSkeletonStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="promise-detail-loading" scrollable={false}>
      <View
        accessible
        accessibilityLabel={t('todayProof.residual.loading_promise_details')}
        accessibilityRole="progressbar"
        style={styles.detailSkeleton}
      >
        <View style={styles.skeletonTopBar}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('todayProof.proof.back')}
              onPress={onBack}
              style={({ pressed }) => [
                styles.skeletonBack,
                pressed ? styles.pressed : null,
              ]}
            >
              <ChevronLeftIcon size={20} color={mentaColors.text.primary} />
            </Pressable>
          ) : (
            <SkeletonLoader
              announce={false}
              width={44}
              height={44}
              borderRadius={mentaRadii.round}
            />
          )}
          <SkeletonLoader
            announce={false}
            width={44}
            height={44}
            borderRadius={mentaRadii.round}
          />
        </View>
        <View style={styles.skeletonHeading}>
          <SkeletonLoader
            announce={false}
            width="89%"
            height={34}
            borderRadius={mentaRadii.small}
          />
          <SkeletonLoader
            announce={false}
            width="74%"
            height={34}
            borderRadius={mentaRadii.small}
          />
          <SkeletonLoader
            announce={false}
            width="62%"
            height={16}
            borderRadius={mentaRadii.round}
          />
        </View>
        <SkeletonLoader
          announce={false}
          height={44}
          borderRadius={mentaRadii.medium}
        />
        <View style={styles.skeletonLoopPanel}>
          <SkeletonLoader
            announce={false}
            width="48%"
            height={22}
            borderRadius={mentaRadii.round}
          />
          <SkeletonLoader
            announce={false}
            width="72%"
            height={16}
            borderRadius={mentaRadii.round}
          />
          <SkeletonLoader
            announce={false}
            height={52}
            borderRadius={mentaRadii.medium}
          />
          <View style={styles.skeletonWeekHeader}>
            <SkeletonLoader
              announce={false}
              width={82}
              height={15}
              borderRadius={mentaRadii.round}
            />
            <SkeletonLoader
              announce={false}
              width={68}
              height={13}
              borderRadius={mentaRadii.round}
            />
          </View>
          <View style={styles.skeletonWeekRow} testID="promise-skeleton-week">
            {[0, 1, 2, 3, 4, 5, 6].map(index => (
              <View
                key={index}
                testID="promise-skeleton-week-cell"
                style={styles.skeletonWeekCell}
              >
                <SkeletonLoader
                  announce={false}
                  width="100%"
                  height={58}
                  borderRadius={mentaRadii.medium}
                />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.skeletonActionRows}>
          {[0, 1, 2].map(index => (
            <View key={index} style={styles.skeletonActionRow}>
              <SkeletonLoader
                announce={false}
                width={22}
                height={22}
                borderRadius={mentaRadii.small}
              />
              <SkeletonLoader
                announce={false}
                width={index === 1 ? 178 : index === 2 ? 162 : 148}
                height={15}
                borderRadius={mentaRadii.round}
              />
            </View>
          ))}
        </View>
      </View>
    </FamilyFrame>
  );
};

export type PromiseActiveStateProps = {
  promiseTitle: string;
  dueLabel: string;
  statusTone?: 'action' | 'warning' | 'success' | 'danger' | 'muted';
  prompt?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  notice?: {
    title: string;
    description: string;
    tone: 'info' | 'warning' | 'error' | 'success';
  } | null;
  mutationNotice?: PromiseMutationRecoveryNotice | null;
  progressLabel: string;
  scheduleLabel: string;
  proofLabel: string;
  visibilityLabel: string;
  week: readonly PromiseProofDay[];
  onAddProof?: () => void;
  onProofHistory: () => void;
  onRules: () => void;
  onDelete?: () => void;
  onBack?: () => void;
};

const ACTIVE_PROMISE_STATUS_COLOR: Record<
  NonNullable<PromiseActiveStateProps['statusTone']>,
  string
> = {
  action: mentaColors.action,
  warning: mentaColors.warning,
  success: mentaColors.success,
  danger: mentaColors.danger,
  muted: mentaColors.text.secondary,
};

/**
 * The active solo-promise summary. The promise itself is the single tactile
 * object; evidence and routes remain plain, responsive lanes beneath it.
 */
export const PromiseActiveState = ({
  promiseTitle,
  dueLabel,
  statusTone = 'warning',
  prompt = 'Add today’s proof when you’ve done what you promised.',
  primaryLabel = 'Add proof',
  primaryDisabled = false,
  notice = null,
  mutationNotice = null,
  progressLabel,
  scheduleLabel,
  proofLabel,
  visibilityLabel,
  week,
  onAddProof,
  onProofHistory,
  onRules,
  onDelete,
  onBack,
}: PromiseActiveStateProps) => {
  const { t } = useTranslation();
  const primary = (
    <View style={styles.activePromisePanel} testID="active-promise-sheet">
      <View style={styles.activePromiseCopy}>
        <Text
          style={[
            styles.activePromiseStatus,
            { color: ACTIVE_PROMISE_STATUS_COLOR[statusTone] },
          ]}
        >
          {dueLabel}
        </Text>
        <Text style={styles.activePromisePrompt}>{prompt}</Text>
      </View>
      {notice ? (
        <AppInlineNotice
          title={notice.title}
          description={notice.description}
          tone={notice.tone}
        />
      ) : null}
      <View style={styles.activePromiseFacts}>
        <View style={styles.activePromiseFactRow}>
          <Text style={styles.activePromiseFactLabel}>
            {t('todayProof.residual.progress')}
          </Text>
          <Text style={styles.activePromiseFactValue}>{progressLabel}</Text>
        </View>
        <View style={styles.activePromiseFactRow}>
          <Text style={styles.activePromiseFactLabel}>
            {t('todayProof.residual.schedule')}
          </Text>
          <Text style={styles.activePromiseFactValue}>{scheduleLabel}</Text>
        </View>
        <View style={styles.activePromiseFactRow}>
          <Text style={styles.activePromiseFactLabel}>
            {t('todayProof.proof.receipt')}
          </Text>
          <Text style={styles.activePromiseFactValue}>{proofLabel}</Text>
        </View>
        <View style={styles.activePromiseFactRow}>
          <Text style={styles.activePromiseFactLabel}>
            {t('todayProof.residual.visible_to')}
          </Text>
          <Text style={styles.activePromiseFactValue}>{visibilityLabel}</Text>
        </View>
      </View>
      {onAddProof ? (
        <AppButton
          title={primaryLabel}
          onPress={onAddProof}
          variant="accent"
          disabled={primaryDisabled}
          fullWidth
          size="large"
          testID="active-promise-add-proof"
        />
      ) : null}
    </View>
  );
  const secondary = (
    <View style={styles.promiseSecondaryPane}>
      <View style={styles.weekSection}>
        <Text style={styles.sectionLabel}>
          {t('todayProof.residual.this_week')}
        </Text>
        <PromiseProofWeek
          week={week}
          label={t('todayProof.residual.this_week')}
        />
      </View>
      <View style={styles.rowList}>
        <AppFieldRow
          title={t('todayProof.promise.proof_history')}
          icon={<FileTextIcon size={18} color={mentaColors.text.secondary} />}
          onPress={onProofHistory}
        />
        <AppFieldRow
          title={t('todayProof.promise.rules_schedule')}
          icon={<ClockIcon size={18} color={mentaColors.text.secondary} />}
          onPress={onRules}
          showDivider={false}
        />
      </View>
      {onDelete ? (
        <TextAction
          danger
          label={t('todayProof.promise.delete')}
          onPress={onDelete}
          testID="active-promise-delete"
        />
      ) : null}
    </View>
  );

  return (
    <FamilyFrame testID="promise-active" contentGap={16}>
      <FamilyHeading
        cue="Personal promise"
        title={promiseTitle}
        onBack={onBack}
      />
      <MutationRecoveryNotice notice={mutationNotice} />
      <PromiseDetailWorkspace
        primary={primary}
        secondary={secondary}
        testID="promise-active-ipad-workspace"
      />
    </FamilyFrame>
  );
};

export type PromiseHistoryEntry = {
  id: string;
  dayLabel: string;
  timeLabel: string;
  detail: string;
  reviewerName?: string | null;
  kind?: 'proof' | 'outcome';
  status: 'waiting' | 'approved' | 'needs-retry' | 'missed' | 'protected';
  sortIso?: string;
  mediaType?: ProofMediaType | null;
  mediaUrl?: string | null;
  submissionText?: string | null;
  evidenceTitle?: string | null;
  reviewNotes?: string | null;
};

export type PromiseWaitingReviewStateProps = {
  promiseTitle: string;
  reviewerName?: string | null;
  sentLabel: string;
  proofTitle: string;
  submittedLabel: string;
  proofId?: string;
  proofMediaType?: ProofMediaType | null;
  proofMediaUri?: string | null;
  proofText?: string | null;
  proofReviewNotes?: string | null;
  proofAvailable?: boolean;
  evidenceUnavailableMessage?: string | null;
  mutationNotice?: PromiseMutationRecoveryNotice | null;
  week: readonly PromiseProofDay[];
  onViewProof?: () => void;
  onProofHistory: () => void;
  onRules: () => void;
  onPeople: () => void;
  onDelete?: () => void;
  onBack?: () => void;
};

export const PromiseWaitingReviewState = ({
  reviewerName,
  sentLabel,
  proofTitle,
  submittedLabel,
  proofId,
  proofMediaType,
  proofMediaUri,
  proofText,
  proofReviewNotes,
  proofAvailable = true,
  evidenceUnavailableMessage = null,
  mutationNotice = null,
  week,
  onViewProof,
  onProofHistory,
  onRules,
  onPeople,
  onDelete,
  onBack,
}: PromiseWaitingReviewStateProps) => {
  const { t } = useTranslation();
  const resolvedReviewer = reviewerName?.trim();
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);
  const proof: ProofEvidenceRecord = {
    id: proofId || 'waiting-proof',
    mediaType: proofMediaType,
    mediaUrl: proofMediaUri,
    submissionText: proofText,
    state: 'waiting',
    submittedLabel,
    evidenceTitle: proofTitle,
    reviewerName,
    reviewNotes: proofReviewNotes,
  };

  const openProof = () => {
    setSelectedProof(proof);
    onViewProof?.();
  };

  return (
    <FamilyFrame testID="promise-waiting-review" contentGap={14}>
      <FamilyHeading
        cue="Waiting for review"
        title={
          resolvedReviewer
            ? `${resolvedReviewer} has your proof.`
            : t('todayProof.residual.your_proof_is_waiting_for_a_reviewer')
        }
        description={sentLabel}
        onBack={onBack}
      />
      <MutationRecoveryNotice notice={mutationNotice} />
      {proofAvailable ? (
        <View style={styles.pendingPaperWrap}>
          <ProofEvidenceRow
            proof={proof}
            onPress={openProof}
            variant="paper"
            testID="waiting-proof-evidence"
          />
          <Text style={styles.pendingPaperBoundary}>
            {t('todayProof.residual.this_day_counts_only_after_approval')}
          </Text>
        </View>
      ) : (
        <AppInlineNotice
          title={t('todayProof.residual.proof_details_are_unavailable')}
          description={
            evidenceUnavailableMessage ||
            'Menta confirmed a pending review, but the submitted proof could not be loaded.'
          }
          tone="warning"
          testID="waiting-proof-unavailable"
        />
      )}
      <PromiseProofWeek week={week} />
      <View style={styles.rowList}>
        <AppFieldRow
          title={t('todayProof.promise.proof_history')}
          icon={<FileTextIcon size={18} color={mentaColors.text.secondary} />}
          onPress={onProofHistory}
        />
        <AppFieldRow
          title={t('todayProof.promise.rules_schedule')}
          icon={<ClockIcon size={18} color={mentaColors.text.secondary} />}
          onPress={onRules}
        />
        <AppFieldRow
          title={t('todayProof.residual.who_reviews')}
          icon={<UsersIcon size={18} color={mentaColors.text.secondary} />}
          value={reviewerName?.trim() || 'Checking'}
          onPress={onPeople}
          showDivider={false}
        />
      </View>
      {onDelete ? (
        <TextAction
          danger
          label={t('todayProof.promise.delete')}
          onPress={onDelete}
          testID="waiting-promise-delete"
        />
      ) : null}
      <ProofEvidenceViewer
        proof={selectedProof}
        visible={Boolean(selectedProof)}
        onClose={() => setSelectedProof(null)}
      />
    </FamilyFrame>
  );
};

export type PromiseHistoryStateProps = {
  durationLabel: string;
  promiseTitle: string;
  entries: readonly PromiseHistoryEntry[];
  loading?: boolean;
  staleMessage?: string | null;
  onLoadEarlier?: () => void;
  onOpenProof?: (proof: ProofEvidenceRecord) => void;
  onBack?: () => void;
};

export const PromiseHistoryState = ({
  durationLabel,
  promiseTitle,
  entries,
  loading = false,
  staleMessage = null,
  onLoadEarlier,
  onOpenProof,
  onBack,
}: PromiseHistoryStateProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);
  const proofRecords = entries.flatMap(entry =>
    entry.kind === 'outcome' ||
    entry.status === 'missed' ||
    entry.status === 'protected'
      ? []
      : [
          {
            id: entry.id,
            mediaType: entry.mediaType,
            mediaUrl: entry.mediaUrl,
            submissionText: entry.submissionText,
            state: entry.status,
            submittedLabel: `${normaliseAllCaps(entry.dayLabel)} · ${entry.timeLabel}`,
            evidenceTitle: entry.evidenceTitle || entry.detail,
            reviewerName: entry.reviewerName,
            reviewNotes:
              entry.reviewNotes ||
              (entry.status === 'needs-retry' ? entry.detail : undefined),
          } satisfies ProofEvidenceRecord,
        ]
  );
  const proofById = new Map(proofRecords.map(proof => [proof.id, proof]));

  return (
    <FamilyFrame testID="promise-proof-history">
      <FamilyHeading
        cue={durationLabel}
        title={t('todayProof.promise.proof_history')}
        description={promiseTitle}
        onBack={onBack}
      />

      {staleMessage ? (
        <AppInlineNotice
          title={t('todayProof.promise.out_of_date')}
          description={staleMessage}
          tone="warning"
        />
      ) : null}

      {loading && entries.length > 0 ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('todayProof.promise.checking_history_updates')}
          style={styles.historyRefreshing}
        >
          <Text style={styles.historyRefreshingText}>
            {t('todayProof.residual.checking_for_updates')}
          </Text>
        </View>
      ) : null}

      {loading && entries.length === 0 ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('todayProof.promise.loading_history_short')}
          style={styles.historyList}
        >
          {[0, 1, 2].map(index => (
            <ProofEvidenceRowSkeleton key={index} index={index} />
          ))}
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.historyEmpty}>
          <Text style={styles.historyEmptyTitle}>
            {t('todayProof.residual.no_history_yet')}
          </Text>
          <Text style={styles.historyEmptyText}>
            {t(
              'todayProof.residual.proof_and_confirmed_day_outcomes_will_appear_here'
            )}
          </Text>
        </View>
      ) : (
        <View style={styles.historyLedger}>
          <Text style={styles.historyOrder}>
            {t('todayProof.residual.newest_first')}
          </Text>
          <View style={styles.historyList} testID="promise-history-ledger">
            {entries.map(entry => {
              const proof = proofById.get(entry.id);
              if (proof) {
                return (
                  <ProofEvidenceRow
                    key={proof.id}
                    proof={proof}
                    onPress={() =>
                      onOpenProof ? onOpenProof(proof) : setSelectedProof(proof)
                    }
                    testID={`promise-history-proof-${proof.id}`}
                  />
                );
              }

              const protectedDay = entry.status === 'protected';
              const Icon = protectedDay ? ShieldCheckIcon : XCircleIcon;
              const iconColor = protectedDay
                ? colors.accent.primary
                : mentaColors.danger;
              return (
                <View
                  accessible
                  accessibilityLabel={`${entry.dayLabel}. ${entry.detail}`}
                  key={entry.id}
                  style={styles.outcomeHistoryRow}
                  testID={`promise-history-outcome-${entry.id}`}
                >
                  <View style={styles.outcomeHistoryIcon}>
                    <Icon color={iconColor} size={19} />
                  </View>
                  <View style={styles.outcomeHistoryCopy}>
                    <Text style={styles.outcomeHistoryDay}>
                      {normaliseAllCaps(entry.dayLabel)}
                    </Text>
                    <Text style={styles.outcomeHistoryDetail}>
                      {entry.detail}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {onLoadEarlier ? (
        <AppButton
          title={t('todayProof.residual.load_earlier_proof')}
          onPress={onLoadEarlier}
          fullWidth
          variant="secondary"
        />
      ) : null}

      <ProofEvidenceViewer
        proof={selectedProof}
        visible={Boolean(selectedProof)}
        onClose={() => setSelectedProof(null)}
      />
    </FamilyFrame>
  );
};

export type PromiseRuleRow = {
  label: string;
  value: string;
  onChange?: () => void;
};

export type PromiseRulesStateProps = {
  promiseTitle: string;
  proofType: string;
  proofDescription: string;
  rows: readonly PromiseRuleRow[];
  /** The promise in the person's own words, shown as plain canvas prose. */
  promiseSummary?: string | null;
  onBack?: () => void;
  onManagePeople?: () => void;
};

export const PromiseRulesState = ({
  promiseTitle,
  proofType,
  proofDescription,
  rows,
  promiseSummary,
  onBack,
  onManagePeople,
}: PromiseRulesStateProps) => {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const rulesInset = isIPad ? mentaSpacing[10] : phoneLayout.screenInset;
  return (
    <AppScreen
      lane="working"
      maxWidth={isIPad ? 760 : undefined}
      testID="promise-rules"
      safeArea
      scrollable
      padding={false}
      hasTabBar={false}
      style={styles.screen}
      contentContainerStyle={styles.rulesScreenContent}
    >
      <View
        style={[styles.rulesTopBar, { paddingHorizontal: rulesInset }]}
        testID="promise-rules-top-bar"
      >
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.back')}
            onPress={onBack}
            style={({ pressed }) => [
              styles.rulesBackButton,
              pressed ? styles.pressed : null,
            ]}
            testID="promise-rules-back"
          >
            <ChevronLeftIcon size={20} color={mentaColors.text.primary} />
          </Pressable>
        ) : (
          <View style={styles.rulesTopBarSlot} />
        )}
        <Text style={styles.rulesTopBarTitle}>
          {t('todayProof.create.promise_label')}
        </Text>
        <View style={styles.rulesTopBarSlot} />
      </View>
      <View
        style={[
          styles.rulesDocument,
          { paddingHorizontal: rulesInset },
          phoneLayout.isCompactWidth ? styles.rulesDocumentCompact : null,
        ]}
        testID="promise-rules-document"
      >
        <Text
          accessibilityRole="header"
          style={[
            styles.rulesDocumentTitle,
            phoneLayout.isCompactWidth
              ? styles.rulesDocumentTitleCompact
              : null,
          ]}
          testID="promise-rules-heading"
        >
          {t('todayProof.residual.rules_and_people')}
        </Text>
        <Text style={styles.rulesDocumentPromise}>
          {promiseSummary?.trim() || promiseTitle}
        </Text>
        <View style={styles.rulesDocumentSection}>
          <Text style={styles.rulesDocumentSectionTitle}>
            {t('todayProof.residual.what_counts')}
          </Text>
          <Text style={styles.rulesDocumentProse}>{proofDescription}</Text>
          <Text style={styles.rulesDocumentMeta}>
            {t('todayProof.promise.proof_type_approval', { proofType })}
          </Text>
        </View>
        <View style={styles.rulesDocumentRows}>
          {rows.map((row, index) => (
            <PromiseFactRow
              key={row.label}
              label={row.label}
              value={row.value}
              onChange={row.onChange}
              isLast={index === rows.length - 1}
              onPaper
              testID={`promise-rule-row-${index}`}
            />
          ))}
        </View>
        {onManagePeople ? (
          <AppButton
            title={t(
              'todayProof.source.accountability.invite_or_manage_people'
            )}
            onPress={onManagePeople}
            fullWidth
            testID="promise-rules-manage-people"
          />
        ) : null}
      </View>
    </AppScreen>
  );
};

export type PromiseProofDetailStateProps = {
  proof: ProofEvidenceRecord;
  onViewProof?: () => void;
  onProofHistory: () => void;
  onBack?: () => void;
};

/** A single server-read proof rendered as a physical receipt, not a status card. */
export const PromiseProofDetailState = ({
  proof,
  onViewProof,
  onProofHistory,
  onBack,
}: PromiseProofDetailStateProps) => {
  const { t } = useTranslation();
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);
  const openProof = () => {
    setSelectedProof(proof);
    onViewProof?.();
  };

  return (
    <FamilyFrame testID="promise-proof-detail" contentGap={18}>
      <FamilyHeading
        cue={proof.state === 'approved' ? 'Proof accepted' : undefined}
        title={t('todayProof.residual.proof_receipt')}
        description={proof.submittedLabel}
        onBack={onBack}
      />
      <View style={styles.proofReceiptWrap} testID="promise-proof-receipt">
        <ProofEvidenceRow
          proof={proof}
          onPress={openProof}
          variant="paper"
          testID="promise-proof-detail-evidence"
        />
      </View>
      <TextAction
        label={t('todayProof.residual.view_proof_history')}
        onPress={onProofHistory}
        testID="promise-proof-detail-history"
      />
      <ProofEvidenceViewer
        proof={selectedProof}
        visible={Boolean(selectedProof)}
        onClose={() => setSelectedProof(null)}
      />
    </FamilyFrame>
  );
};

export type PromiseCompletionRecord = {
  source: 'server-readback';
  approvedDays: number;
  totalDays: number;
  visibility: string;
  reviewerSummary: string;
};

export type PromiseCompleteStateProps = {
  record: PromiseCompletionRecord;
  onShareResult: () => void;
  onMakeAnother: () => void;
  onBackToToday: () => void;
  onProofHistory: () => void;
  mutationNotice?: PromiseMutationRecoveryNotice | null;
  onDelete?: () => void;
  onBack?: () => void;
};

export const PromiseCompleteState = ({
  record,
  onShareResult,
  onMakeAnother,
  onBackToToday,
  onProofHistory,
  mutationNotice = null,
  onDelete,
  onBack,
}: PromiseCompleteStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="promise-complete">
      <FamilyHeading
        cue="Promise complete"
        title={`${record.approvedDays} of ${record.totalDays} days were approved.`}
        description={`${record.visibility}. ${record.reviewerSummary}.`}
        onBack={onBack}
      />
      <MutationRecoveryNotice notice={mutationNotice} />
      <View
        accessible
        accessibilityLabel={`${record.approvedDays} of ${record.totalDays} days approved`}
        style={styles.completionTally}
        testID="promise-completion-tally"
      >
        <View style={styles.completionCountLine}>
          <Text style={styles.completionApprovedCount}>
            {record.approvedDays}
          </Text>
          <Text style={styles.completionTotalCount}> / {record.totalDays}</Text>
        </View>
        <Text style={styles.completionTallyLabel}>
          {t('todayProof.residual.days_approved')}
        </Text>
        <View style={styles.completionMarks}>
          {Array.from({ length: record.totalDays }, (_, index) => (
            <View
              key={index}
              style={[
                styles.completionMark,
                index < record.approvedDays
                  ? styles.completionMarkApproved
                  : styles.completionMarkNotApproved,
              ]}
              testID={`promise-completion-day-${index + 1}`}
            />
          ))}
        </View>
      </View>
      <ActionStack>
        <AppButton
          title={t('todayProof.residual.share_result')}
          onPress={onShareResult}
          fullWidth
          size="large"
        />
        <AppButton
          title={t('todayProof.residual.make_another_promise')}
          onPress={onMakeAnother}
          fullWidth
          variant="secondary"
        />
        <AppButton
          title={t('todayProof.review.back_today')}
          onPress={onBackToToday}
          fullWidth
          variant="outline"
        />
        <AppButton
          title={t('todayProof.residual.view_proof_history')}
          onPress={onProofHistory}
          fullWidth
          variant="ghost"
        />
      </ActionStack>
      {onDelete ? (
        <TextAction
          danger
          label={t('todayProof.promise.delete')}
          onPress={onDelete}
          testID="complete-promise-delete"
        />
      ) : null}
    </FamilyFrame>
  );
};

export type PromiseUnavailableStateProps = {
  hasLocalProof: boolean;
  onRetry: () => void;
  onCheckProofStatus: () => void;
  /** Kept while older route callers migrate to onCheckProofStatus. */
  onBackToToday: () => void;
  onReportProblem: () => void;
  onBack?: () => void;
};

export const PromiseUnavailableState = ({
  hasLocalProof,
  onRetry,
  onCheckProofStatus,
  onBackToToday,
  onReportProblem,
  onBack,
}: PromiseUnavailableStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="promise-unavailable">
      <FamilyHeading
        title={t('todayProof.residual.this_promise_isn_t_available')}
        description={t(
          'todayProof.residual.try_again_before_submitting_or_reviewing_proof'
        )}
        onBack={onBack}
      />
      <PromisePaperSheet testID="promise-unavailable-local-proof">
        <Text style={styles.paperStatus}>
          {hasLocalProof
            ? t('todayProof.residual.delivery_not_confirmed')
            : t('todayProof.residual.promise_status_unavailable')}
        </Text>
        <Text style={styles.paperPromiseTitle}>
          {hasLocalProof
            ? t('todayProof.residual.proof_still_saved_on_this_phone')
            : t('todayProof.residual.nothing_saved_on_this_phone_was_changed')}
        </Text>
        <Text style={styles.paperMeta}>
          {hasLocalProof
            ? t('todayProof.residual.proof_receive_not_confirmed')
            : t('todayProof.residual.latest_promise_details_not_confirmed')}
        </Text>
      </PromisePaperSheet>
      <ActionStack>
        <AppButton
          title={t('todayProof.residual.check_again')}
          onPress={onRetry}
          fullWidth
          size="large"
        />
        <AppButton
          title={t('todayProof.proof.check_status')}
          onPress={onCheckProofStatus}
          fullWidth
          variant="secondary"
        />
        <AppButton
          title={t('todayProof.review.back_today')}
          onPress={onBackToToday}
          fullWidth
          variant="outline"
        />
        <AppButton
          title={t('todayProof.residual.report_a_problem')}
          onPress={onReportProblem}
          fullWidth
          variant="ghost"
        />
      </ActionStack>
    </FamilyFrame>
  );
};

export type NotificationEducationStateProps = {
  enabled: boolean;
  onChangeEnabled: (enabled: boolean) => void;
  /** Kept while older route callers migrate away from the extra education row. */
  onLearnPermissions?: () => void;
  onContinueToPermission: () => void;
  onNotNow: () => void;
  onBack?: () => void;
};

export const NotificationEducationState = ({
  enabled,
  onChangeEnabled,
  onContinueToPermission,
  onNotNow,
  onBack,
}: NotificationEducationStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="promise-notification-education">
      <FamilyHeading
        title={t('todayProof.promise.reminder_question')}
        description={t('todayProof.promise.reminder_detail')}
        onBack={onBack}
      />
      <View style={styles.rowList}>
        <AppSwitchRow
          title={t('todayProof.promise.remind_about')}
          subtitle={t('todayProof.promise.remind_detail')}
          value={enabled}
          onChange={onChangeEnabled}
          showDivider={false}
        />
      </View>
      <ActionStack>
        <AppButton
          title={t('todayProof.promise.set_reminders')}
          onPress={onContinueToPermission}
          disabled={!enabled}
          fullWidth
          size="large"
        />
        <AppButton
          title={t('todayProof.promise.without_reminders')}
          onPress={onNotNow}
          fullWidth
          variant="ghost"
        />
      </ActionStack>
    </FamilyFrame>
  );
};

export type ReferralShareOutcome =
  | 'idle'
  | 'sheet-closed'
  | 'copied'
  | 'copy-failed';

export type ReferralBridgeStateProps = {
  promiseTitle: string;
  groupSummary: string;
  onShareInvite: () => void;
  onCopyInviteLink: () => void;
  onSkip: () => void;
  shareOutcome?: ReferralShareOutcome;
  working?: boolean;
  onBack?: () => void;
};

export const ReferralBridgeState = ({
  promiseTitle,
  groupSummary,
  onShareInvite,
  onCopyInviteLink,
  onSkip,
  shareOutcome = 'idle',
  working = false,
  onBack,
}: ReferralBridgeStateProps) => {
  const { t } = useTranslation();
  return (
    <FamilyFrame testID="promise-referral">
      <FamilyHeading
        title={t('todayProof.promise.invite_question')}
        description={t('todayProof.promise.invite_detail')}
        onBack={onBack}
      />
      <View style={styles.receiptBlock}>
        <PaperReceiptLabel>
          {t('todayProof.residual.invite_preview')}
        </PaperReceiptLabel>
        <Text style={styles.receiptTitle}>{promiseTitle}</Text>
        <Text style={styles.receiptDescription}>{groupSummary}</Text>
      </View>
      {shareOutcome === 'sheet-closed' ? (
        <AppInlineNotice
          title={t('todayProof.promise.invite_not_confirmed')}
          description={t('todayProof.promise.invite_still_available')}
          tone="info"
        />
      ) : shareOutcome === 'copied' ? (
        <AppInlineNotice
          title={t('todayProof.promise.link_copied')}
          description={t('todayProof.promise.link_copied_detail')}
          tone="success"
        />
      ) : shareOutcome === 'copy-failed' ? (
        <AppInlineNotice
          title={t('todayProof.promise.link_not_copied')}
          description={t('todayProof.promise.link_not_copied_detail')}
          tone="error"
        />
      ) : null}
      <ActionStack>
        <AppButton
          title={t('todayProof.promise.share_invite')}
          onPress={onShareInvite}
          loading={working}
          disabled={working}
          fullWidth
          size="large"
        />
        <AppButton
          title={t('todayProof.residual.copy_invite_link')}
          onPress={onCopyInviteLink}
          disabled={working}
          fullWidth
          variant="secondary"
        />
        <AppButton
          title={t('todayProof.promise.skip')}
          onPress={onSkip}
          disabled={working}
          fullWidth
          variant="ghost"
        />
      </ActionStack>
    </FamilyFrame>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
  },
  contentFrame: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[4],
    gap: mentaSpacing[6],
  },
  centeredLane: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  /** Long prose keeps the narrower reading measure. */
  proseMeasure: {
    maxWidth: mentaLayout.readingMeasure,
  },
  headingBlock: {
    gap: mentaSpacing[2],
  },
  backAction: {
    alignSelf: 'flex-start',
    marginBottom: mentaSpacing[1],
  },
  cue: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  description: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  sectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.muted,
  },
  actionStack: {
    gap: mentaSpacing[3],
  },
  promiseSecondaryPane: {
    gap: mentaSpacing[5],
  },
  textAction: {
    minHeight: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
  },
  textActionLabel: {
    ...mentaTypography.bodyMedium,
    color: mentaColors.action,
  },
  textActionDanger: {
    color: mentaColors.danger,
  },
  emptyBlock: {
    gap: mentaSpacing[3],
  },
  emptyLead: {
    ...mentaTypography.lead,
    color: mentaColors.text.secondary,
  },
  emptyPrimaryAction: {
    marginTop: mentaSpacing[5],
  },
  emptySecondaryActions: {
    marginTop: mentaSpacing[1],
  },
  loadingStack: {
    gap: mentaSpacing[4],
  },
  loadingTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  directSection: {
    gap: mentaSpacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    paddingVertical: mentaSpacing[4],
  },
  rowList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  factSection: {
    gap: mentaSpacing[2],
  },
  factSectionTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  factProse: {
    ...mentaTypography.body,
    color: mentaColors.text.primary,
  },
  factProseMeta: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.muted,
  },
  factRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  factRow: {
    minHeight: 60,
    paddingVertical: mentaSpacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
    gap: mentaSpacing[1],
  },
  factRowOnPaper: {
    borderBottomColor: mentaColors.borderPaper,
    minHeight: 58,
    paddingVertical: mentaSpacing[3],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mentaSpacing[3],
  },
  factRowOnPaperStacked: {
    flexDirection: 'column',
    gap: mentaSpacing[1],
  },
  factRowLast: {
    borderBottomWidth: 0,
  },
  factRowLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.muted,
  },
  factRowLabelOnPaper: {
    color: mentaColors.text.mutedOnPaper,
    flexShrink: 0,
    width: 110,
  },
  factRowLabelOnPaperStacked: {
    width: '100%',
  },
  factRowValueLane: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
    flex: 1,
    minWidth: 0,
  },
  factRowValueLaneStacked: {
    width: '100%',
  },
  factRowValue: {
    ...mentaTypography.bodyMedium,
    color: mentaColors.text.primary,
    flexShrink: 1,
  },
  factRowValueOnPaper: {
    color: mentaColors.text.onPaper,
  },
  factRowChange: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.action,
  },
  factRowChangeOnPaper: {
    color: mentaColors.actionOnPaper,
    flexShrink: 0,
    textAlign: 'right',
    width: 58,
  },
  factRowChangeOnPaperStacked: {
    width: 'auto',
  },
  rulesScreenContent: {
    flexGrow: 1,
    paddingTop: 0,
  },
  rulesTopBar: {
    minHeight: 66,
    paddingBottom: mentaSpacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulesBackButton: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesTopBarSlot: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
  },
  rulesTopBarTitle: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.secondary,
  },
  rulesDocument: {
    width: '100%',
    flexGrow: 1,
    gap: 15,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: mentaColors.paper,
    paddingTop: 26,
    paddingBottom: mentaSpacing[8],
  },
  rulesDocumentCompact: {
    paddingTop: mentaSpacing[5],
  },
  rulesDocumentTitle: {
    fontFamily: mentaFonts.inter.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1.12,
    color: mentaColors.text.onPaper,
  },
  rulesDocumentTitleCompact: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.84,
  },
  rulesDocumentPromise: {
    ...mentaTypography.body,
    color: mentaColors.text.mutedOnPaper,
  },
  rulesDocumentSection: {
    gap: mentaSpacing[2],
    backgroundColor: mentaColors.paperPressed,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    borderRadius: 10,
    padding: 18,
  },
  rulesDocumentSectionTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.onPaper,
  },
  rulesDocumentProse: {
    ...mentaTypography.body,
    color: mentaColors.text.onPaper,
  },
  rulesDocumentMeta: {
    ...mentaTypography.bodySmall,
    fontFamily: mentaFonts.inter.medium,
    color: mentaColors.text.mutedOnPaper,
  },
  rulesDocumentRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.borderPaper,
  },
  createTopBar: {
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createBackAction: {
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  createTopBarLabel: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    letterSpacing: mentaTypography.label.letterSpacing,
  },
  createIntro: {
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[3],
  },
  createTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  createDescription: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  createActions: {
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[3],
  },
  detailSkeleton: {
    flex: 1,
    gap: 14,
    paddingTop: 10,
  },
  skeletonTopBar: {
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonBack: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
  },
  skeletonHeading: {
    gap: 9,
  },
  skeletonLoopPanel: {
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
    paddingBottom: mentaSpacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  skeletonWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[4],
    marginTop: mentaSpacing[2],
  },
  skeletonWeekRow: {
    flexDirection: 'row',
    gap: 5,
  },
  skeletonWeekCell: {
    flex: 1,
    minWidth: 0,
  },
  skeletonActionRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  skeletonActionRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  receiptBlock: {
    gap: mentaSpacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
    padding: mentaSpacing[4],
  },
  promisePaperSheet: {
    width: '100%',
    gap: mentaSpacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
    padding: mentaSpacing[6],
    shadowColor: '#000000',
    shadowOffset: { width: 7, height: 9 },
    shadowOpacity: 0.42,
    shadowRadius: 0,
    elevation: 7,
  },
  activePromisePanel: {
    width: '100%',
    gap: mentaSpacing[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.raised,
    padding: mentaSpacing[4],
  },
  activePromiseCopy: {
    gap: mentaSpacing[2],
  },
  activePromiseStatus: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.warning,
  },
  activePromisePrompt: {
    ...mentaTypography.body,
    color: mentaColors.text.primary,
  },
  activePromiseFacts: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  activePromiseFactRow: {
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  activePromiseFactLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.muted,
  },
  activePromiseFactValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  weekSection: {
    gap: mentaSpacing[3],
  },
  paperStatus: {
    ...mentaTypography.bodySmallMedium,
    color: '#8A5B08',
  },
  paperPromiseTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
  },
  paperFactLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: mentaSpacing[2],
  },
  paperFact: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.onPaper,
    flexShrink: 1,
  },
  paperMeta: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
  },
  pendingPaperWrap: {
    width: '100%',
    gap: mentaSpacing[3],
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
    paddingBottom: mentaSpacing[4],
    shadowColor: '#000000',
    shadowOffset: { width: 7, height: 9 },
    shadowOpacity: 0.42,
    shadowRadius: 0,
    elevation: 7,
  },
  pendingPaperBoundary: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
    paddingHorizontal: mentaSpacing[4],
  },
  proofReceiptWrap: {
    width: '100%',
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
    shadowColor: '#000000',
    shadowOffset: { width: 7, height: 9 },
    shadowOpacity: 0.42,
    shadowRadius: 0,
    elevation: 7,
  },
  receiptTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
  },
  receiptDescription: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
  },
  paperReceiptLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.mutedOnPaper,
  },
  weekStrip: {
    flexDirection: 'row',
    gap: mentaSpacing[1],
  },
  weekDay: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[2],
    borderRadius: mentaRadii.small,
  },
  weekDayToday: {
    backgroundColor: mentaColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.action,
  },
  weekDayText: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.secondary,
  },
  weekDayTextToday: {
    color: mentaColors.action,
  },
  weekMarker: {
    borderRadius: mentaRadii.round,
  },
  weekMarkerApproved: {
    width: 18,
    height: 18,
    backgroundColor: mentaColors.success,
  },
  weekMarkerWaiting: {
    width: 18,
    height: 18,
    backgroundColor: mentaColors.warning,
  },
  weekMarkerRetry: {
    width: 18,
    height: 18,
    backgroundColor: mentaColors.danger,
  },
  weekMarkerToday: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: mentaColors.action,
  },
  weekMarkerUnresolved: {
    width: 18,
    height: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  weekMarkerMissed: {
    alignItems: 'center',
    backgroundColor: mentaColors.danger,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  weekMarkerMissedText: {
    color: mentaColors.text.onPaper,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  weekMarkerProtected: {
    alignItems: 'center',
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.actionOnPaper,
    borderWidth: StyleSheet.hairlineWidth,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  weekMarkerFuture: {
    width: 8,
    height: 8,
    backgroundColor: mentaColors.border,
  },
  pressed: {
    opacity: 0.78,
  },
  historyList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  historyLedger: {
    gap: mentaSpacing[2],
  },
  historyOrder: {
    ...mentaTypography.captionMedium,
    color: mentaColors.text.secondary,
  },
  historyRefreshing: {
    minHeight: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  historyRefreshingText: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  historyEmpty: {
    gap: mentaSpacing[2],
    paddingVertical: mentaSpacing[8],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  historyEmptyTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  historyEmptyText: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  outcomeHistoryRow: {
    alignItems: 'flex-start',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 74,
    paddingVertical: mentaSpacing[4],
  },
  outcomeHistoryIcon: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  outcomeHistoryCopy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  outcomeHistoryDay: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  outcomeHistoryDetail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  completionTally: {
    width: '100%',
    gap: mentaSpacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
    padding: mentaSpacing[6],
    shadowColor: '#000000',
    shadowOffset: { width: 7, height: 9 },
    shadowOpacity: 0.42,
    shadowRadius: 0,
    elevation: 7,
  },
  completionCountLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  completionApprovedCount: {
    ...mentaTypography.display,
    color: mentaColors.actionOnPaper,
  },
  completionTotalCount: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
  },
  completionTallyLabel: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.mutedOnPaper,
  },
  completionMarks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[2],
  },
  completionMark: {
    width: 16,
    height: 16,
    borderRadius: mentaRadii.round,
  },
  completionMarkApproved: {
    backgroundColor: mentaColors.actionOnPaper,
  },
  completionMarkNotApproved: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    backgroundColor: 'transparent',
  },
});
