import {
  type MentaPalette,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';
import { mentaFonts } from '@/lib/menta-fonts';

/**
 * Paper 19 / Y01–Y02: three facts on the canvas. A zero streak with a live
 * promise reads as "Day 1 · starts today" rather than a bare 0.
 */
export function ProfileStatTrio({
  currentStreak,
  bestStreak,
  daysKept,
  hasActivePromise,
}: {
  currentStreak: number;
  bestStreak: number;
  daysKept: number | null;
  hasActivePromise: boolean;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const { colors } = useTheme();
  const freshStart = currentStreak === 0 && hasActivePromise;
  const currentValue = freshStart
    ? t('fullAuth.tabs_profile.stat_day_one')
    : String(currentStreak);
  const currentLabel = freshStart
    ? t('fullAuth.tabs_profile.stat_starts_today')
    : t('fullAuth.tabs_profile.stat_day_streak');
  const stats = [
    { key: 'current', value: currentValue, label: currentLabel },
    {
      key: 'best',
      value: String(Math.max(bestStreak, currentStreak)),
      label: t('fullAuth.tabs_profile.stat_best_streak'),
    },
    {
      key: 'kept',
      value: daysKept === null ? '–' : String(daysKept),
      label: t('fullAuth.tabs_profile.stat_days_kept'),
    },
  ];

  return (
    <View
      accessible
      accessibilityLabel={t('fullAuth.tabs_profile.stats_accessibility', {
        current: `${currentValue} ${currentLabel}`,
        best: Math.max(bestStreak, currentStreak),
        kept: daysKept ?? 0,
      })}
      style={styles.row}
      testID="profile-stats"
    >
      {stats.map((stat, index) => (
        <View
          key={stat.key}
          style={[styles.stat, index > 0 ? styles.statDivided : null]}
        >
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.value,
              stat.key === 'current' && freshStart
                ? { color: colors.accent.primary }
                : null,
            ]}
          >
            {stat.value}
          </Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginTop: mentaSpacing[6],
    },
    stat: {
      flex: 1,
      gap: 2,
      paddingRight: mentaSpacing[3],
    },
    statDivided: {
      borderLeftColor: mentaColors.border,
      borderLeftWidth: StyleSheet.hairlineWidth,
      paddingLeft: mentaSpacing[5],
    },
    value: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.newsreader.semibold,
      fontSize: 40,
      letterSpacing: -0.8,
      lineHeight: 46,
    },
    label: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
    },
  });
  return { styles };
};
