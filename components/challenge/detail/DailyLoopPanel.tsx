import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import {
  PromiseProofWeek,
  type PromiseProofDay,
} from '@/components/challenge/promise-runtime-states';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';

type DailyLoopPanelProps = {
  title: string;
  note: string;
  primaryLabel: string;
  primaryLoading?: boolean;
  onPrimaryPress?: () => void;
  completedDays: number;
  totalDays: number;
  recoveryCopy?: string | null;
  showProgress?: boolean;
  /** Real proof outcomes for this week, shown beside the action they follow. */
  week?: readonly PromiseProofDay[];
  /** Server-owned streak count. Never inferred from the seven-day strip. */
  currentStreak?: number | null;
  /** Server-owned personal record, used only as supporting context. */
  longestStreak?: number | null;
};

export function DailyLoopPanel({
  title,
  note,
  primaryLabel,
  primaryLoading = false,
  onPrimaryPress,
  completedDays,
  totalDays,
  recoveryCopy,
  showProgress = true,
  week,
  currentStreak,
  longestStreak,
}: DailyLoopPanelProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const phoneLayout = usePhoneLayout();
  const safeTotal = Math.max(1, totalDays || 1);
  const safeCompleted = Math.max(0, Math.min(completedDays, safeTotal));
  const progress = Math.round((safeCompleted / safeTotal) * 100);

  return (
    <View
      style={[styles.section, { marginHorizontal: phoneLayout.screenInset }]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>{note}</Text>

      {onPrimaryPress ? (
        <AppButton
          title={primaryLabel}
          onPress={onPrimaryPress}
          disabled={primaryLoading}
          loading={primaryLoading}
          fullWidth
          size="large"
          variant="accent"
          style={styles.primaryAction}
        />
      ) : null}

      {recoveryCopy ? (
        <Text accessibilityRole="alert" style={styles.recoveryText}>
          {recoveryCopy}
        </Text>
      ) : null}

      {week && week.length > 0 ? (
        <View style={styles.streakSection}>
          {typeof currentStreak === 'number' ? (
            <View style={styles.streakSummary}>
              <View style={styles.streakValueRow}>
                <Text
                  style={styles.streakValue}
                  testID="daily-loop-streak-value"
                >
                  {Math.max(0, currentStreak)}
                </Text>
                <Text style={styles.streakUnit}>
                  {t('todayProof.source.streak.day_streak_unit')}
                </Text>
              </View>
              {typeof longestStreak === 'number' && longestStreak > 0 ? (
                <Text style={styles.streakRecord}>
                  {t('todayProof.streak.best_count', { count: longestStreak })}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.weekSection}>
            <Text style={styles.weekTitle}>
              {t('todayProof.residual.this_week')}
            </Text>
            <PromiseProofWeek
              week={week}
              label={t('todayProof.residual.proof_this_week')}
            />
          </View>
        </View>
      ) : null}

      {showProgress ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {t('todayProof.residual.progress')}
            </Text>
            <Text style={styles.progressMeta}>
              {t('todayProof.streak.progress', {
                completed: safeCompleted,
                total: safeTotal,
              })}
            </Text>
          </View>
          <View
            accessibilityLabel={`Promise progress: ${safeCompleted} of ${safeTotal} days`}
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: safeTotal,
              now: safeCompleted,
            }}
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: colors.accent.primary,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: mentaLayout.screenInset,
    marginTop: mentaSpacing[5],
    paddingBottom: mentaSpacing[6],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  note: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[2],
  },
  primaryAction: {
    marginTop: mentaSpacing[5],
  },
  recoveryText: {
    ...mentaTypography.bodySmall,
    color: mentaColors.warning,
    marginTop: mentaSpacing[4],
  },
  streakSection: {
    marginTop: mentaSpacing[6],
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[5],
    paddingTop: mentaSpacing[5],
  },
  streakSummary: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: mentaSpacing[4],
  },
  streakValueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: mentaSpacing[2],
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
  streakRecord: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.secondary,
    paddingBottom: 5,
    textAlign: 'right',
  },
  weekSection: {
    gap: mentaSpacing[3],
  },
  weekTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  progressSection: {
    marginTop: mentaSpacing[6],
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[4],
    marginBottom: mentaSpacing[3],
  },
  progressTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  progressMeta: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    textAlign: 'right',
  },
  progressTrack: {
    height: 6,
    borderRadius: mentaRadii.round,
    overflow: 'hidden',
    backgroundColor: mentaColors.raised,
  },
  progressFill: {
    height: '100%',
    borderRadius: mentaRadii.round,
  },
});
