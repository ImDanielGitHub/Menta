import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  CheckIcon,
  ClockIcon,
  RotateCcwIcon,
  SnowflakeIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useTranslation } from '@/lib/localization';
import {
  countApprovedWeekDays,
  TODAY_WEEK_LENGTH,
  type TodayWeekDay,
  type TodayWeekDayStatus,
} from '@/lib/today-week-activity';

const DAY_MARK_SIZE = 34;

function DayMark({
  status,
  isToday,
}: {
  status: TodayWeekDayStatus;
  isToday: boolean;
}) {
  const motion = useMotionPreferences();
  const scale = useSharedValue(1);
  const previousStatus = useRef(status);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const changed = previousStatus.current !== status;
    previousStatus.current = status;
    // Only today's mark can change while the screen is open. It pops once
    // when the server moves it, never on first paint.
    if (!changed || !isToday || !motion.allowsTransform) return;
    scale.value = 0.6;
    scale.value = withTiming(1, {
      duration: MOTION_DURATIONS.complex,
      easing: Easing.out(Easing.back(2.4)),
    });
  }, [isToday, motion.allowsTransform, scale, status]);

  const icon =
    status === 'approved' ? (
      <CheckIcon color={mentaColors.canvas} size={18} />
    ) : status === 'pending' ? (
      <ClockIcon color={mentaColors.text.secondary} size={15} />
    ) : status === 'correction' ? (
      <RotateCcwIcon color={mentaColors.warning} size={15} />
    ) : status === 'protected' ? (
      <SnowflakeIcon color={mentaColors.info} size={15} />
    ) : null;

  return (
    <Animated.View
      style={[
        styles.mark,
        status === 'approved' ? styles.markApproved : null,
        status === 'pending' ? styles.markPending : null,
        status === 'correction' ? styles.markCorrection : null,
        status === 'protected' ? styles.markProtected : null,
        status === 'open' && isToday ? styles.markTodayOpen : null,
        animatedStyle,
      ]}
      testID={`today-week-mark-${status}${isToday ? '-today' : ''}`}
    >
      {icon}
    </Animated.View>
  );
}

/**
 * Rolling seven-day row ending today. Filled marks are server-approved days;
 * outlined marks show proof waiting, a requested correction, or a freeze.
 * Empty days are neutral: they are never presented as misses.
 */
export function TodayWeekRow({
  days,
}: {
  days: readonly TodayWeekDay[] | null;
}) {
  const { t } = useTranslation();

  if (!days) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.row}
        testID="today-week-row-loading"
      >
        {Array.from({ length: TODAY_WEEK_LENGTH }, (_, index) => (
          <View key={index} style={styles.day}>
            <SkeletonLoader announce={false} height={12} width={12} />
            <SkeletonLoader
              announce={false}
              borderRadius={mentaRadii.round}
              height={DAY_MARK_SIZE}
              width={DAY_MARK_SIZE}
            />
          </View>
        ))}
      </View>
    );
  }

  const approvedCount = countApprovedWeekDays(days);

  return (
    <View
      accessible
      accessibilityLabel={t('today.home.week.accessibility', {
        count: approvedCount,
      })}
      style={styles.row}
      testID="today-week-row"
    >
      {days.map(day => (
        <View key={day.localDay} style={styles.day}>
          <Text
            style={[styles.dayLabel, day.isToday ? styles.dayLabelToday : null]}
          >
            {day.weekdayLabel}
          </Text>
          <DayMark isToday={day.isToday} status={day.status} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: mentaSpacing[1],
    width: '100%',
  },
  day: {
    alignItems: 'center',
    gap: mentaSpacing[2],
    minWidth: DAY_MARK_SIZE,
  },
  dayLabel: {
    ...mentaTypography.caption,
    color: mentaColors.text.muted,
    textAlign: 'center',
  },
  dayLabelToday: {
    ...mentaTypography.captionMedium,
    color: mentaColors.text.primary,
  },
  mark: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    height: DAY_MARK_SIZE,
    justifyContent: 'center',
    width: DAY_MARK_SIZE,
  },
  markApproved: {
    backgroundColor: mentaColors.success,
    borderColor: mentaColors.success,
  },
  markPending: {
    borderColor: mentaColors.text.muted,
  },
  markCorrection: {
    backgroundColor: mentaColors.warningSoft,
    borderColor: mentaColors.warning,
  },
  markProtected: {
    borderColor: mentaColors.info,
  },
  markTodayOpen: {
    borderColor: mentaColors.action,
    borderWidth: 2,
  },
});
