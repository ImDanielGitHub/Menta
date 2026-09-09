import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ClockIcon } from '@/components/ui/icons';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import type { TodaysSubmission } from '@/store/group-store';
import { useTranslation } from '@/lib/localization';

type PendingReviewReturnCardProps = {
  submission: TodaysSubmission;
  pendingCount: number;
  onPress: () => void;
};

export const PendingReviewReturnCard: React.FC<
  PendingReviewReturnCardProps
> = ({ submission, pendingCount, onPress }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const extraPendingCount = Math.max(pendingCount - 1, 0);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={t('proofRecovery.pending.accessibility')}
      activeOpacity={0.86}
      onPress={onPress}
      style={styles.card}
      testID="pending-review-return-card"
    >
      <View style={styles.header}>
        <View style={styles.icon}>
          <ClockIcon size={17} color={theme.colors.status.success} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('proofRecovery.pending.title')}</Text>
          <Text style={styles.description}>
            {t('proofRecovery.pending.description', {
              promise: submission.challengeTitle,
            })}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.status}>{t('proofRecovery.pending.status')}</Text>
        <Text style={styles.pendingFact}>
          {t('proofRecovery.pending.not_counted')}
        </Text>
      </View>
      <Text style={styles.action}>
        {extraPendingCount > 0
          ? t('todayProof.review.pending_action_with_more', {
              action: t('proofRecovery.pending.action'),
              count: extraPendingCount,
            })
          : t('proofRecovery.pending.action')}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ThemeContextType) => {
  const { colors, spacing, borderRadius, typography } = theme;

  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.border.secondary,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.surface,
      padding: spacing.md,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.status.success}1A`,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    title: {
      color: colors.text.primary,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
    },
    description: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      lineHeight: 20,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.secondary,
      paddingTop: spacing.sm,
    },
    status: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
    },
    pendingFact: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    action: {
      color: colors.text.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
  });
};

export default PendingReviewReturnCard;
