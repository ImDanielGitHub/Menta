import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ShieldCheckIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';

interface ProtectedStreakReceiptProps {
  localDay: string;
  resultingStreak: number;
  freezeUsed: boolean;
}

const weekday = (localDay: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match) return 'The missed day';

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  ).toLocaleDateString('en-NZ', { weekday: 'long', timeZone: 'UTC' });
};

export const ProtectedStreakReceipt: React.FC<ProtectedStreakReceiptProps> = ({
  localDay,
  resultingStreak,
  freezeUsed,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const day = weekday(localDay);
  const count =
    resultingStreak === 1
      ? t('todayProof.streak.day', { count: resultingStreak })
      : t('todayProof.streak.days', { count: resultingStreak });
  const detail = freezeUsed
    ? t('today.state.protected.freeze_detail', {
        weekday: day,
        countCopy: t('today.state.protected.count_continues', { count }),
      })
    : t('today.state.protected.detail', {
        weekday: day,
        countCopy: t('today.state.protected.count_continues', { count }),
      });

  return (
    <View
      accessible
      accessibilityLabel={t('todayProof.today.protected_accessibility', {
        detail,
      })}
      style={styles.receipt}
      testID="protected-streak-receipt"
    >
      <ShieldCheckIcon color={colors.accent.primary} size={20} />
      <View style={styles.copy}>
        <Text style={styles.title}>{t('today.state.protected.title')}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  receipt: {
    alignItems: 'flex-start',
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    marginHorizontal: mentaSpacing[6],
    marginTop: mentaSpacing[5],
    padding: mentaSpacing[4],
  },
  copy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  title: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.onPaper,
  },
  detail: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
  },
});
