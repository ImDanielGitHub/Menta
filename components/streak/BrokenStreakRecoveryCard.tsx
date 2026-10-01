import {
  type MentaPalette,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { MentaMascot } from '@/components/ui/MentaMascot';

import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';

interface BrokenStreakRecoveryCardProps {
  missedLocalDay: string;
  previousStreak: number;
  resultingStreak: number;
  /** Days until an explicit server-saved end date for an active daily promise. */
  remainingDays?: number;
  onStartReturn: () => void;
  onViewHistory: () => void;
}

const formatMissedDay = (
  localDay: string,
  fallback: string,
  locale: string
): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match) return fallback;

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  ).toLocaleDateString(locale, { weekday: 'long', timeZone: 'UTC' });
};

/** A server-confirmed missed day remains visible while today starts a new run. */
export const BrokenStreakRecoveryCard: React.FC<
  BrokenStreakRecoveryCardProps
> = ({
  missedLocalDay,
  previousStreak,
  resultingStreak,
  remainingDays,
  onStartReturn,
  onViewHistory,
}) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const missedDay = formatMissedDay(
    missedLocalDay,
    t('todayProof.streak.missed_day'),
    locale
  );
  const previousUnit =
    previousStreak === 1
      ? t('todayProof.streak.previous_days', { count: previousStreak })
      : t('todayProof.streak.previous_days_other', { count: previousStreak });
  const previousDays = previousUnit;
  const resultingDays =
    resultingStreak > 0
      ? resultingStreak === 1
        ? t('todayProof.streak.day', { count: resultingStreak })
        : t('todayProof.streak.days', { count: resultingStreak })
      : t('todayProof.streak.ready_new_checkin');

  return (
    <View style={styles.section} testID="broken-streak-recovery">
      <View style={styles.heading}>
        <MentaMascot
          state="calm-warning"
          size="md"
          accessibilityLabel={t('todayProof.streak.missed')}
        />
        <Text style={styles.outcomeLabel}>
          {t('todayProof.streak.missed_day_label', { day: missedDay })}
        </Text>
        <Text style={styles.title}>
          {missedDay === t('todayProof.streak.missed_day')
            ? t('todayProof.streak.day_was_missed')
            : t('todayProof.streak.missed_day_title', { day: missedDay })}
        </Text>
        <Text style={styles.copy}>
          {t('todayProof.streak.no_proof_counted', {
            day: missedDay,
            streak: previousUnit,
          })}
        </Text>
      </View>

      <View style={styles.facts}>
        <View style={[styles.factRow, styles.factDivider]}>
          <Text style={styles.factLabel}>
            {t('todayProof.streak.previous_streak')}
          </Text>
          <Text style={styles.factValue}>{previousDays}</Text>
        </View>
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>{t('todayProof.streak.today')}</Text>
          <Text style={[styles.factValue, { color: colors.accent.primary }]}>
            {resultingDays}
          </Text>
        </View>
      </View>

      <Text style={styles.note}>
        {typeof remainingDays === 'number' &&
        Number.isInteger(remainingDays) &&
        remainingDays >= 28 &&
        remainingDays <= 31
          ? t('notifications.recovery.month')
          : t('notifications.recovery.restart')}
      </Text>

      <View style={styles.actions}>
        <AppButton
          title={t('todayProof.streak.start_today')}
          onPress={onStartReturn}
          fullWidth
          size="large"
          variant="accent"
          haptic
          hapticIntent="confirm"
        />
        <AppButton
          title={t('todayProof.streak.history_action', {
            count: previousStreak,
          })}
          onPress={onViewHistory}
          fullWidth
          size="large"
          variant="outline"
        />
      </View>
    </View>
  );
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    section: {
      borderBottomColor: mentaColors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: mentaColors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: mentaSpacing[5],
      marginHorizontal: mentaSpacing[6],
      marginTop: mentaSpacing[5],
      paddingVertical: mentaSpacing[5],
    },
    heading: {
      gap: mentaSpacing[2],
    },
    outcomeLabel: {
      ...mentaTypography.bodySmallMedium,
      color: mentaColors.danger,
    },
    title: {
      ...mentaTypography.journeyTitle,
      color: mentaColors.text.primary,
    },
    copy: {
      ...mentaTypography.body,
      color: mentaColors.text.secondary,
    },
    facts: {
      borderBottomColor: mentaColors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: mentaColors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    factRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: mentaSpacing[4],
      justifyContent: 'space-between',
      minHeight: 50,
    },
    factDivider: {
      borderBottomColor: mentaColors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    factLabel: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
    },
    factValue: {
      ...mentaTypography.bodySemibold,
      color: mentaColors.text.primary,
      fontVariant: ['tabular-nums'],
    },
    note: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
    },
    actions: {
      gap: mentaSpacing[2],
    },
  });
  return { styles };
};
