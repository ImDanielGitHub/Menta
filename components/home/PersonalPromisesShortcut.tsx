import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon, TargetIcon } from '@/components/ui/icons';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import {
  useTranslation,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/localization';

type PersonalPromisesShortcutProps = {
  activeCount: number | null;
  bestCurrentStreak: number | null;
  onPress: () => void;
  textScale?: number;
};

type Translate = (key: TranslationKey, values?: TranslationValues) => string;

const buildDetail = (
  activeCount: number | null,
  bestCurrentStreak: number | null,
  t: Translate
): string => {
  if (activeCount === null) return t('navigation.personal.view');
  if (activeCount === 0) return t('navigation.personal.none');
  const active = t('navigation.personal.active', { count: activeCount });
  if (!bestCurrentStreak) {
    return active;
  }

  return t('navigation.personal.longest', {
    active,
    days: t('today.progress.streak_days', { count: bestCurrentStreak }),
  });
};

export const PersonalPromisesShortcut = ({
  activeCount,
  bestCurrentStreak,
  onPress,
  textScale,
}: PersonalPromisesShortcutProps) => {
  const { t } = useTranslation();
  const detail = buildDetail(activeCount, bestCurrentStreak, t);
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityLabel={t('navigation.personal.accessibility', { detail })}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      testID="today-personal-promises"
    >
      <TargetIcon
        color={colors.accent.primary}
        size={20}
        testID="today-personal-promises-icon"
      />
      <View style={styles.copy}>
        <Text style={styles.title} textScale={textScale}>
          {t('navigation.personal.title')}
        </Text>
        <Text style={styles.detail} textScale={textScale}>
          {detail}
        </Text>
      </View>
      <ChevronRightIcon color={mentaColors.text.secondary} size={18} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    alignSelf: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    maxWidth: mentaLayout.taskLane,
    minHeight: 68,
    paddingVertical: mentaSpacing[3],
    width: '100%',
  },
  rowPressed: {
    backgroundColor: mentaColors.actionSoft,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: 2,
  },
});
