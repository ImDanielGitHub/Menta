import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import { ChevronRightIcon } from '@/components/ui/icons';

interface ReminderStatusRowProps {
  remindersEnabled: boolean;
  preferredReminderTime: string | null;
  timeZone?: string | null;
  onPress?: () => void;
  testID?: string;
}

export const ReminderStatusRow: React.FC<ReminderStatusRowProps> = ({
  remindersEnabled,
  preferredReminderTime,
  timeZone,
  onPress,
  testID,
}) => {
  const { t, locale } = useTranslation();
  const label = remindersEnabled
    ? t('todayProof.streak.on')
    : t('todayProof.streak.off');
  const reminderTime = formatReminderTime(preferredReminderTime, t, locale);
  const detail = remindersEnabled
    ? t('todayProof.streak.preferred_time', { time: reminderTime })
    : t('todayProof.streak.reminders_off');
  const timingDetail = [detail, timeZone?.trim()].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityLabel={t('todayProof.streak.reminder_row_accessibility', {
        detail: timingDetail,
        status: label,
      })}
      accessibilityRole={onPress ? 'button' : 'summary'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      testID={testID}
    >
      <View style={styles.headerRow}>
        <View style={styles.copyColumn}>
          <Text style={styles.title}>{t('todayProof.streak.reminders')}</Text>
          <Text style={styles.detail}>{timingDetail}</Text>
        </View>
        <View style={styles.trailing}>
          <Text
            style={[
              styles.status,
              remindersEnabled ? styles.statusOn : styles.statusOff,
            ]}
          >
            {label}
          </Text>
          {onPress ? (
            <ChevronRightIcon color={mentaColors.text.muted} size={18} />
          ) : null}
        </View>
      </View>
      <Text style={styles.limitCopy}>
        {t('todayProof.streak.deadline_note')}
      </Text>
    </Pressable>
  );
};

const formatReminderTime = (
  value: string | null,
  t: ReturnType<typeof useTranslation>['t'],
  locale: string
) => {
  const fallback = t('todayProof.streak.default_time');
  if (!value) return fallback;

  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return fallback;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const styles = StyleSheet.create({
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    paddingVertical: mentaSpacing[3],
    gap: mentaSpacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  copyColumn: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  detail: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
    marginTop: 2,
  },
  status: {
    ...mentaTypography.bodySmallMedium,
  },
  trailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  statusOn: {
    color: mentaColors.success,
  },
  statusOff: {
    color: mentaColors.text.muted,
  },
  limitCopy: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
  },
  pressed: {
    backgroundColor: mentaColors.actionSoft,
  },
});
