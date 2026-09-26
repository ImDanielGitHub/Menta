import React from 'react';
import { StyleSheet, View } from 'react-native';

import { TodayPressable } from '@/components/today/TodayPressable';
import { useCountUp } from '@/components/today/use-count-up';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FlameIcon,
} from '@/components/ui/icons';
import { MomentaMark } from '@/components/shop/MomentaBalanceChip';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useTranslation } from '@/lib/localization';

/**
 * What today's proof means for the streak. `kept` is only used once the
 * server has approved today's proof; `risk` only when the server marks it.
 */
export type TodayStreakTone = 'kept' | 'waiting' | 'due' | 'risk' | 'none';

type TodayStatusRowProps = {
  loading: boolean;
  streak: number | null;
  streakTone: TodayStreakTone;
  streakExpanded: boolean;
  onStreakPress: () => void;
  momentaBalance: number | null;
  onMomentaPress: () => void;
};

const STREAK_FLEX = 1.2;

const FLAME_COLOR: Record<TodayStreakTone, string> = {
  kept: mentaColors.success,
  waiting: mentaColors.text.primary,
  due: mentaColors.text.primary,
  risk: mentaColors.warning,
  none: mentaColors.text.muted,
};

function StatusChipSkeleton({ flex }: { flex: number }) {
  return (
    <View style={[styles.chip, styles.chipSkeleton, { flex }]}>
      <SkeletonLoader
        announce={false}
        borderRadius={mentaRadii.round}
        height={22}
        width={22}
      />
      <View style={styles.chipCopy}>
        <SkeletonLoader announce={false} height={18} width={36} />
        <SkeletonLoader announce={false} height={12} width="70%" />
      </View>
    </View>
  );
}

/**
 * Top status row for Today: the streak and the Momenta balance, each a
 * tactile chip that opens the right place. Streak opens the streak panel on
 * Today; Momenta opens the wallet.
 */
export function TodayStatusRow({
  loading,
  momentaBalance,
  onMomentaPress,
  onStreakPress,
  streak,
  streakExpanded,
  streakTone,
}: TodayStatusRowProps) {
  const { t } = useTranslation();
  const motion = useMotionPreferences();
  const displayedStreak = useCountUp(streak, !motion.reduceMotion);
  const displayedBalance = useCountUp(momentaBalance, !motion.reduceMotion);

  if (loading) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.row}
        testID="today-status-row-loading"
      >
        <StatusChipSkeleton flex={STREAK_FLEX} />
        <StatusChipSkeleton flex={1} />
      </View>
    );
  }

  const streakDays =
    streak === null ? null : t('today.progress.streak_days', { count: streak });
  const streakLabel =
    streakDays === null
      ? t('today.home.streak.accessibility_none')
      : t('today.home.streak.accessibility', {
          days: streakDays,
          status:
            streakTone === 'kept'
              ? t('today.home.streak.status_kept')
              : streakTone === 'waiting'
                ? t('today.home.streak.status_waiting')
                : streakTone === 'risk'
                  ? t('today.home.streak.status_risk')
                  : streakTone === 'due'
                    ? t('today.home.streak.status_due')
                    : '',
        }).replace(/\s{2,}/g, ' ');
  const momentaLabel =
    momentaBalance === null
      ? t('today.home.momenta.accessibility_unknown')
      : t('today.home.momenta.accessibility', {
          balance: momentaBalance.toLocaleString(),
        });

  return (
    <View style={styles.row} testID="today-status-row">
      <TodayPressable
        accessibilityLabel={streakLabel}
        accessibilityState={{ expanded: streakExpanded }}
        haptic="selection"
        onPress={onStreakPress}
        pressedStyle={styles.chipPressed}
        containerStyle={styles.streakSlot}
        style={[styles.chip, streakExpanded ? styles.chipSelected : null]}
        testID="today-streak-chip"
      >
        <FlameIcon color={FLAME_COLOR[streakTone]} size={22} />
        <View style={styles.chipCopy}>
          <Text numberOfLines={1} style={styles.chipValue}>
            {displayedStreak === null ? '0' : String(displayedStreak)}
          </Text>
          <Text numberOfLines={1} style={styles.chipCaption}>
            {t('today.home.streak.caption')}
          </Text>
        </View>
        <View
          style={
            streakExpanded ? styles.chevronExpanded : styles.chevronCollapsed
          }
        >
          <ChevronDownIcon
            color={
              streakExpanded ? mentaColors.action : mentaColors.text.secondary
            }
            size={18}
          />
        </View>
      </TodayPressable>

      <TodayPressable
        accessibilityLabel={momentaLabel}
        onPress={onMomentaPress}
        pressedStyle={styles.chipPressed}
        containerStyle={styles.momentaSlot}
        style={styles.chip}
        testID="today-momenta-chip"
      >
        <MomentaMark size={24} />
        <View style={styles.chipCopy}>
          <Text numberOfLines={1} style={styles.chipValue}>
            {displayedBalance === null
              ? '–'
              : displayedBalance.toLocaleString()}
          </Text>
          <Text numberOfLines={1} style={styles.chipCaption}>
            {t('today.home.momenta.caption')}
          </Text>
        </View>
        <ChevronRightIcon color={mentaColors.text.secondary} size={18} />
      </TodayPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    width: '100%',
  },
  streakSlot: {
    flex: STREAK_FLEX,
    minWidth: 0,
  },
  momentaSlot: {
    flex: 1,
    minWidth: 0,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: mentaLayout.primaryControlHeight + mentaSpacing[1],
    minWidth: 0,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[2],
  },
  chipSkeleton: {
    borderColor: mentaColors.border,
  },
  chipSelected: {
    backgroundColor: mentaColors.actionSoft,
    borderColor: mentaColors.action,
  },
  chipPressed: {
    backgroundColor: mentaColors.raised,
  },
  chipCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  chipValue: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  chipCaption: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  chevronCollapsed: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
});
