import {
  type MentaPalette,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { TodayCardIcon } from '@/components/today/today-card-icon';
import { TodayPressable } from '@/components/today/TodayPressable';
import { ArrowRightIcon } from '@/components/ui/icons';
import {
  AppScaledText as Text,
  useAppTextScale,
} from '@/components/ui/AppScaledText';
import { allowsLargeTypeWrap } from '@/lib/accessibility';

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
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const detail = buildDetail(activeCount, bestCurrentStreak, t);
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const inheritedTextScale = useAppTextScale();
  const relaxedTitle =
    width < 390 ||
    allowsLargeTypeWrap(textScale ?? inheritedTextScale ?? fontScale);
  const hasStreak =
    activeCount !== null &&
    activeCount > 0 &&
    bestCurrentStreak !== null &&
    bestCurrentStreak > 0;
  const countDetail = buildDetail(activeCount, null, t);

  return (
    <TodayPressable
      accessibilityLabel={t('navigation.personal.accessibility', { detail })}
      onPress={onPress}
      pressedStyle={styles.rowPressed}
      style={[styles.row, { backgroundColor: colors.accent.background }]}
      testID="today-personal-promises"
    >
      <View style={styles.header}>
        <Text
          style={[styles.title, !relaxedTitle && styles.compactTitle]}
          textScale={textScale}
        >
          {t('navigation.personal.title')}
        </Text>
        <TodayCardIcon
          color={colors.accent.primary}
          kind="personal"
          size={44}
          testID="today-personal-promises-icon"
        />
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.detail} textScale={textScale}>
            {countDetail}
          </Text>
          {hasStreak ? (
            <View style={styles.streak}>
              <Text
                style={[styles.streakValue, { color: colors.accent.primary }]}
                textScale={textScale}
              >
                {t('today.progress.streak_days', { count: bestCurrentStreak })}
              </Text>
              <Text style={styles.streakLabel} textScale={textScale}>
                {t('navigation.personal.streak_label')}
              </Text>
            </View>
          ) : null}
        </View>
        <ArrowRightIcon color={colors.accent.primary} size={20} />
      </View>
    </TodayPressable>
  );
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    row: {
      alignSelf: 'center',
      borderRadius: mentaRadii.large,
      gap: mentaSpacing[6],
      maxWidth: mentaLayout.taskLane,
      minHeight: 160,
      padding: mentaSpacing[5],
      width: '100%',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: mentaSpacing[6],
    },
    summary: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: mentaSpacing[4],
    },
    summaryCopy: {
      flex: 1,
      gap: mentaSpacing[2],
      minWidth: 0,
    },
    streak: {
      alignItems: 'baseline',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: mentaSpacing[3],
      rowGap: mentaSpacing[1],
    },
    streakValue: {
      ...mentaTypography.title,
    },
    streakLabel: {
      ...mentaTypography.caption,
      color: mentaColors.text.secondary,
      flexShrink: 1,
    },
    rowPressed: {
      backgroundColor: mentaColors.raised,
    },
    title: {
      ...mentaTypography.title,
      color: mentaColors.text.primary,
      flex: 1,
    },
    compactTitle: {
      maxWidth: '55%',
    },
    detail: {
      ...mentaTypography.caption,
      color: mentaColors.text.secondary,
    },
  });
  return { styles };
};
