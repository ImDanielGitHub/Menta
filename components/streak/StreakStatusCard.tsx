import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import type { StreakStateV2 } from '@/types/streak-state-v2';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';

interface StreakStatusCardProps {
  state: StreakStateV2;
  goalDays?: number;
}

export const StreakStatusCard: React.FC<StreakStatusCardProps> = ({
  state,
  goalDays,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const nextMilestone = getNextMilestone(state.currentStreak, goalDays);
  const promiseGoal =
    typeof goalDays === 'number' && Number.isFinite(goalDays) && goalDays > 0
      ? Math.floor(goalDays)
      : null;
  const promiseGoalReached =
    promiseGoal !== null && state.currentStreak >= promiseGoal;
  const targetIsPromiseGoal =
    promiseGoal !== null && nextMilestone === promiseGoal;
  const progress = Math.min(
    100,
    Math.max(0, (state.currentStreak / nextMilestone) * 100)
  );

  const stateLabel = state.hasSubmittedToday
    ? state.submissionStatus === 'pending'
      ? t('todayProof.streak.status_waiting')
      : state.submissionStatus === 'rejected'
        ? t('todayProof.streak.status_requested')
        : state.submissionStatus === 'approved'
          ? t('todayProof.streak.status_approved')
          : t('todayProof.streak.status_sent')
    : state.latestOutcome?.outcome === 'missed'
      ? t('todayProof.streak.status_after_approval')
      : state.atRisk
        ? t('todayProof.streak.proof_due')
        : t('todayProof.promise.proof_due');
  const accent =
    state.latestOutcome?.outcome === 'missed'
      ? colors.accent.primary
      : state.atRisk
        ? mentaColors.warning
        : colors.accent.primary;
  const targetLabel =
    promiseGoalReached || targetIsPromiseGoal
      ? t('todayProof.streak.promise_goal')
      : t('todayProof.streak.next_target');
  const targetValue = promiseGoalReached
    ? t('todayProof.streak.goal_reached', { count: promiseGoal })
    : t('todayProof.streak.target_days', { count: nextMilestone });
  const accessibilityTarget = promiseGoalReached
    ? t('todayProof.streak.target_reached', {
        label: targetLabel,
        count: promiseGoal,
      })
    : t('todayProof.streak.target_accessibility', {
        label: targetLabel,
        count: nextMilestone,
      });

  return (
    <View
      accessible
      accessibilityLabel={t('todayProof.streak.card_summary_accessibility', {
        current: state.currentStreak,
        longest: state.longestStreak,
        target: accessibilityTarget,
        status: stateLabel,
      })}
      style={styles.section}
      testID="streak-status-card"
    >
      <View style={styles.headingRow}>
        <View style={styles.currentCopy}>
          <Text style={styles.sectionTitle}>
            {t('todayProof.streak.current')}
          </Text>
          <View style={styles.streakValueRow}>
            <Text style={styles.streakValue}>{state.currentStreak}</Text>
            <Text style={styles.streakUnit}>
              {state.currentStreak === 1
                ? t('todayProof.source.streak.day_unit')
                : t('todayProof.source.streak.days_unit')}
            </Text>
          </View>
        </View>
        <Text style={[styles.stateLabel, { color: accent }]}>{stateLabel}</Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>
            {t('todayProof.streak.longest')}
          </Text>
          <Text style={styles.metricValue}>
            {t('todayProof.streak.target_days', { count: state.longestStreak })}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{targetLabel}</Text>
          <Text style={styles.metricValue}>{targetValue}</Text>
        </View>
      </View>

      {!promiseGoalReached ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: nextMilestone,
            now: state.currentStreak,
          }}
          style={styles.progressTrack}
          testID="streak-progress"
        >
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: accent },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
};

const MILESTONE_GOALS = [3, 7, 14, 30, 50, 100];

const getNextMilestone = (currentStreak: number, goalDays?: number) => {
  const next = MILESTONE_GOALS.find(goal => goal > currentStreak);
  const validPromiseGoal =
    typeof goalDays === 'number' && Number.isFinite(goalDays) && goalDays > 0
      ? Math.floor(goalDays)
      : null;

  if (validPromiseGoal !== null) {
    if (currentStreak >= validPromiseGoal) return validPromiseGoal;
    return Math.min(next ?? validPromiseGoal, validPromiseGoal);
  }

  return next ?? currentStreak + 30;
};

const styles = StyleSheet.create({
  section: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[4],
    paddingVertical: mentaSpacing[5],
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    justifyContent: 'space-between',
  },
  currentCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  streakValueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[1],
  },
  streakValue: {
    ...mentaTypography.display,
    color: mentaColors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  streakUnit: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  stateLabel: {
    ...mentaTypography.bodySmallMedium,
    flexShrink: 1,
    maxWidth: 132,
    textAlign: 'right',
  },
  metricRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  metric: {
    flex: 1,
    gap: mentaSpacing[1],
  },
  metricDivider: {
    backgroundColor: mentaColors.border,
    marginHorizontal: mentaSpacing[4],
    width: StyleSheet.hairlineWidth,
  },
  metricLabel: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  metricValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    backgroundColor: mentaColors.raised,
    borderRadius: mentaRadii.round,
    height: 7,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: mentaRadii.round,
    height: '100%',
  },
});
