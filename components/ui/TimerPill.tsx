import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization/use-translation';

type TimerPillProps = {
  secondsRemaining: number | null | undefined;
  submitted?: boolean;
  label?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  compact?: boolean;
};

/**
 * TimerPill: Unified timer chip with semantic colours.
 * - info: > 60m remaining
 * - warning: <= 60m remaining and > 0
 * - danger: expired
 */
export const TimerPill: React.FC<TimerPillProps> = ({
  secondsRemaining,
  submitted = false,
  label,
  style,
  textStyle,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, spacing, typography, borderRadius } = theme;

  const state = useMemo<'submitted' | 'danger' | 'warning' | 'info'>(() => {
    if (submitted) return 'submitted';
    if (secondsRemaining == null) return 'info';
    if (secondsRemaining <= 0) return 'danger';
    if (secondsRemaining <= 60 * 60) return 'warning';
    return 'info';
  }, [secondsRemaining, submitted]);

  const formatted = useMemo(() => {
    if (submitted) return t('shared.timer.done');
    if (secondsRemaining == null) return t('shared.timer.unavailable');
    const s = Math.max(0, secondsRemaining);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (hrs > 0)
      return t('shared.timer.hoursLeft', { hours: hrs, minutes: mins });
    return t('shared.timer.minutesLeft', { minutes: mins });
  }, [secondsRemaining, submitted, t]);

  const bg =
    state === 'submitted'
      ? colors.status.success + '22'
      : state === 'danger'
        ? colors.status.error + '22'
        : state === 'warning'
          ? colors.status.warning + '22'
          : colors.text.tertiary + '22';
  const fg =
    state === 'submitted'
      ? colors.status.success
      : state === 'danger'
        ? colors.status.error
        : state === 'warning'
          ? colors.status.warning
          : colors.text.secondary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: fg,
          paddingVertical: compact ? 4 : 6,
          paddingHorizontal: compact ? 8 : 12,
          borderRadius: borderRadius.full,
        },
        style,
      ]}
    >
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: fg,
              fontSize: typography.sizes.xs,
              marginRight: spacing.xs,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      ) : null}
      <Text
        style={[
          styles.text,
          {
            color: fg,
            fontSize: compact ? typography.sizes.xs : typography.sizes.sm,
          },
          textStyle,
        ]}
      >
        {formatted}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    opacity: 0.9,
  },
  text: {
    fontWeight: '600',
  },
});

export default TimerPill;
