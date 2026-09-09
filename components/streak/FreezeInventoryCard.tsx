import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { getEarnedFreezeGrantCopy } from '@/lib/economy/contract';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';

interface FreezeInventoryCardProps {
  freezeCount: number;
  onPress?: () => void;
}

export const FreezeInventoryCard: React.FC<FreezeInventoryCardProps> = ({
  freezeCount,
  onPress,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const availableLabel = t('todayProof.streak.freezes_left', {
    count: freezeCount,
  });

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={t('todayProof.streak.freeze_accessibility', {
        available: availableLabel,
      })}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.section,
        pressed && { backgroundColor: colors.accent.background },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>
            {t('todayProof.streak.freeze_title')}
          </Text>
          <Text style={styles.subtitle}>{availableLabel}</Text>
        </View>
        {onPress ? (
          <Text style={[styles.action, { color: colors.accent.primary }]}>
            {t('todayProof.streak.open_items')}
          </Text>
        ) : null}
      </View>

      <Text style={styles.copy}>
        {t('todayProof.streak.freeze_copy', {
          grant: getEarnedFreezeGrantCopy(t),
        })}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    paddingVertical: mentaSpacing[4],
    gap: mentaSpacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  subtitle: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
    marginTop: 2,
  },
  action: {
    ...mentaTypography.bodySmallMedium,
  },
  copy: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
  },
});
