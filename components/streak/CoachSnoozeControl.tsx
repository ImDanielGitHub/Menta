import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';

import { DEFAULT_COACH_SNOOZE_HOURS } from '@/lib/notifications/revealed-habit';
import { useTranslation } from '@/lib/localization';

type CoachSnoozeControlProps = {
  onRemindLater: () => void | Promise<void>;
};

export function CoachSnoozeControl({ onRemindLater }: CoachSnoozeControlProps) {
  const { styles } = useMentaStyles(createPaletteStyles);

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

const createPaletteStyles = (mentaColors: MentaPalette) => {
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
  return { styles };
};
