import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { DEFAULT_COACH_SNOOZE_HOURS } from '@/lib/notifications/revealed-habit';
import { useTranslation } from '@/lib/localization';

type CoachSnoozeControlProps = {
  onRemindLater: () => void | Promise<void>;
};

export function CoachSnoozeControl({ onRemindLater }: CoachSnoozeControlProps) {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const [pausing, setPausing] = useState(false);

  if (paused) {
    return (
      <View
        accessibilityRole="text"
        style={styles.receipt}
        testID="coach-snooze-receipt"
      >
        <Text style={styles.receiptText}>
          {t('todayProof.streak.reminders_paused', {
            hours: DEFAULT_COACH_SNOOZE_HOURS,
          })}
        </Text>
      </View>
    );
  }

  return (
    <AppButton
      disabled={pausing}
      loading={pausing}
      onPress={() => {
        void (async () => {
          setPausing(true);
          try {
            await onRemindLater();
            setPaused(true);
          } catch {
            setPaused(false);
          } finally {
            setPausing(false);
          }
        })();
      }}
      size="large"
      title={t('todayProof.streak.remind_in', {
        hours: DEFAULT_COACH_SNOOZE_HOURS,
      })}
      variant="ghost"
      fullWidth
    />
  );
}

const styles = StyleSheet.create({
  receipt: {
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.canvas,
    padding: mentaSpacing[3],
  },
  receiptText: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySmall,
  },
});
