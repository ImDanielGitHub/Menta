import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ClockIcon } from '@/components/ui/icons';
import { useTheme } from '@/constants/ThemeContext';
import { getStreakTimeRemaining } from '@/utils/timezone';
import { useTranslation } from '@/lib/localization';

/**
 * @deprecated UTC-midnight helper kept for unused compatibility. Proof-due
 * countdowns must use `ProofDueCountdown` and the user's local calendar day.
 */

interface GlobalDayCountdownProps {
  showIcon?: boolean;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const GlobalDayCountdown: React.FC<GlobalDayCountdownProps> = ({
  showIcon = true,
  showLabel = true,
  style,
  compact = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const [timeRemaining, setTimeRemaining] = useState(getStreakTimeRemaining());

  useEffect(() => {
    const updateCountdown = () => {
      setTimeRemaining(getStreakTimeRemaining());
    };

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = () => {
    const { days, hours, minutes, seconds, isExpired } = timeRemaining;

    if (isExpired) {
      return 'Resetting…';
    }

    if (compact) {
      if (days > 0) {
        return `${days}d ${hours}h`;
      }
      return `${hours}h ${minutes}m`;
    }

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  };

  const getTimeColor = () => {
    const { hours, minutes } = timeRemaining;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 60) return colors.status.error;
    if (totalMinutes < 180) return colors.status.warning;
    return colors.text.primary;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {showIcon ? <ClockIcon size={16} color={getTimeColor()} /> : null}

        <View style={styles.textContainer}>
          {showLabel && !compact ? (
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              {t('todayProof.residual.day_resets_in')}
            </Text>
          ) : null}
          <Text
            style={[
              compact ? styles.timeCompact : styles.time,
              { color: getTimeColor() },
            ]}
          >
            {formatTimeRemaining()}
          </Text>
          {showLabel && compact ? (
            <Text
              style={[styles.labelCompact, { color: colors.text.tertiary }]}
            >
              {t('todayProof.residual.until_reset')}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  labelCompact: {
    fontSize: 10,
    marginTop: 1,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeCompact: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GlobalDayCountdown;
