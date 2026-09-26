import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { TodayPressable } from '@/components/today/TodayPressable';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { ChevronRightIcon, FlameIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import type { ObligationProofStatus } from '@/lib/loop';
import { MOTION_DISTANCES, MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useTranslation } from '@/lib/localization';

export type TodayStreakPanelItem = {
  key: string;
  challengeId: string;
  title: string;
  streak: number | null;
  longest: number | null;
  proofStatus: ObligationProofStatus;
};

const STATUS_COLOR: Record<ObligationProofStatus, string> = {
  none: mentaColors.text.secondary,
  pending: mentaColors.text.secondary,
  approved: mentaColors.success,
  rejected: mentaColors.warning,
};

/**
 * Expands under the streak chip. Lists each running promise with its own
 * confirmed streak, so a combined count never hides which promise it is.
 */
export function TodayStreakPanel({
  items,
  onOpenPromise,
}: {
  items: readonly TodayStreakPanelItem[];
  onOpenPromise: (challengeId: string) => void;
}) {
  const { t } = useTranslation();
  const motion = useMotionPreferences();
  const progress = useSharedValue(motion.allowsTransform ? 0 : 1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -MOTION_DISTANCES.sm }],
  }));

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: motion.duration(MOTION_DURATIONS.screen),
      easing: Easing.out(Easing.cubic),
    });
  }, [motion, progress]);

  return (
    <Animated.View
      style={[styles.panel, animatedStyle]}
      testID="today-streak-panel"
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {t('today.home.streaks.title')}
        </Text>
        <Text style={styles.note}>
          {items.length > 0
            ? t('today.home.streaks.note')
            : t('today.home.streaks.empty')}
        </Text>
      </View>

      {items.map(item => {
        const days =
          item.streak === null
            ? t('today.progress.streak_days', { count: 0 })
            : t('today.progress.streak_days', { count: item.streak });
        const status =
          item.proofStatus === 'approved'
            ? t('today.proof.status.approved')
            : item.proofStatus === 'pending'
              ? t('today.proof.status.waiting_review')
              : item.proofStatus === 'rejected'
                ? t('today.proof.status.correction_requested')
                : t('today.proof.status.due');
        return (
          <TodayPressable
            accessibilityLabel={t('today.home.streaks.row_accessibility', {
              promise: item.title,
              days,
              status,
            })}
            key={item.key}
            onPress={() => onOpenPromise(item.challengeId)}
            pressedStyle={styles.rowPressed}
            style={styles.row}
            testID={`today-streak-row-${item.key}`}
          >
            <View style={styles.streakBadge}>
              <FlameIcon
                color={
                  item.proofStatus === 'approved'
                    ? mentaColors.success
                    : mentaColors.text.primary
                }
                size={16}
              />
              <Text style={styles.streakValue}>{item.streak ?? 0}</Text>
            </View>
            <View style={styles.rowCopy}>
              <Text numberOfLines={2} style={styles.rowTitle}>
                {item.title}
              </Text>
              <View style={styles.rowMeta}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.rowDetail,
                    { color: STATUS_COLOR[item.proofStatus] },
                  ]}
                >
                  {status}
                </Text>
                {item.longest !== null && item.longest > 0 ? (
                  <Text numberOfLines={1} style={styles.rowDetail}>
                    {t('today.home.streaks.longest', {
                      days: t('today.progress.streak_days', {
                        count: item.longest,
                      }),
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
            <ChevronRightIcon color={mentaColors.text.secondary} size={18} />
          </TodayPressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'stretch',
    gap: mentaSpacing[3],
    width: '100%',
  },
  header: {
    gap: mentaSpacing[1],
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  note: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  row: {
    alignItems: 'center',
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 72,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  rowPressed: {
    backgroundColor: mentaColors.raised,
  },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderRadius: mentaRadii.medium,
    flexDirection: 'row',
    gap: mentaSpacing[1],
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 56,
    paddingHorizontal: mentaSpacing[2],
  },
  streakValue: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  rowMeta: {
    columnGap: mentaSpacing[3],
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rowDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
});
