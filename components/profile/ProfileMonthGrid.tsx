import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';
import { mentaFonts } from '@/lib/menta-fonts';
import type {
  ProfileMonth,
  ProfileMonthDay,
  ProfileMonthDayState,
} from '@/lib/profile/month';

const CELL_TONE: Record<
  ProfileMonthDayState,
  { background: string; text: string; border?: string; dashed?: boolean }
> = {
  kept: { background: '#15332A', text: mentaColors.success },
  frozen: { background: '#142838', text: '#A9D4F5' },
  missed: {
    background: 'transparent',
    text: mentaColors.text.muted,
    border: '#57564F',
    dashed: true,
  },
  today: { background: mentaColors.action, text: mentaColors.canvas },
  open: { background: 'transparent', text: '#3A3A36' },
  future: { background: '#121313', text: '#57564F' },
};

/**
 * Paper 19 / Y01–Y02: this month at a glance. Kept days are tinted rather
 * than solid so today's violet cell stays the one strong mark.
 */
export function ProfileMonthGrid({ month }: { month: ProfileMonth }) {
  const { t, locale } = useTranslation();
  const { colors } = useTheme();
  const legend = [
    month.counts.kept > 0
      ? t('fullAuth.tabs_profile.month_kept', { count: month.counts.kept })
      : null,
    month.counts.frozen > 0
      ? t('fullAuth.tabs_profile.month_frozen', { count: month.counts.frozen })
      : null,
    month.counts.missed > 0
      ? t('fullAuth.tabs_profile.month_missed', { count: month.counts.missed })
      : null,
  ].filter(Boolean);

  const leading = month.days[0]?.weekdayIndex ?? 0;
  const cells: (ProfileMonthDay | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...month.days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (ProfileMonthDay | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  const labelFor = (day: ProfileMonthDay) => {
    const name = new Date(`${day.localDay}T00:00:00Z`).toLocaleDateString(
      locale,
      { day: 'numeric', month: 'long', timeZone: 'UTC' }
    );
    switch (day.state) {
      case 'kept':
        return t('fullAuth.tabs_profile.day_kept', { day: name });
      case 'frozen':
        return t('fullAuth.tabs_profile.day_frozen', { day: name });
      case 'missed':
        return t('fullAuth.tabs_profile.day_missed', { day: name });
      case 'today':
        return t('fullAuth.tabs_profile.day_today', { day: name });
      default:
        return name;
    }
  };

  return (
    <View style={styles.section} testID="profile-month">
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.month}>
          {month.monthLabel}
        </Text>
        <Text style={styles.legend}>
          {legend.length > 0
            ? legend.join(' · ')
            : t('fullAuth.tabs_profile.month_empty')}
        </Text>
      </View>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((day, cellIndex) => {
              if (!day) {
                return (
                  <View key={`blank-${cellIndex}`} style={styles.cellSlot} />
                );
              }
              const tone = CELL_TONE[day.state];
              return (
                <View key={day.localDay} style={styles.cellSlot}>
                  <View
                    accessible
                    accessibilityLabel={labelFor(day)}
                    style={[
                      styles.cell,
                      {
                        backgroundColor:
                          day.state === 'today'
                            ? colors.accent.primary
                            : tone.background,
                      },
                      tone.border
                        ? {
                            borderColor: tone.border,
                            borderStyle: tone.dashed ? 'dashed' : 'solid',
                            borderWidth: 1.5,
                          }
                        : null,
                    ]}
                    testID={`profile-month-${day.localDay}-${day.state}`}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { color: tone.text },
                        day.state === 'today' ? styles.cellTextToday : null,
                      ]}
                    >
                      {day.dayOfMonth}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: mentaSpacing[4],
    marginTop: mentaSpacing[8],
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
    justifyContent: 'space-between',
  },
  month: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  legend: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  grid: {
    gap: mentaSpacing[2],
  },
  row: {
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  cellSlot: {
    aspectRatio: 1,
    flex: 1,
    maxWidth: 52,
  },
  cell: {
    alignItems: 'center',
    borderRadius: mentaRadii.medium,
    flex: 1,
    justifyContent: 'center',
  },
  cellText: {
    fontFamily: mentaFonts.inter.medium,
    fontSize: 13,
  },
  cellTextToday: {
    fontFamily: mentaFonts.inter.semibold,
  },
});
