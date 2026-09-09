import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization/use-translation';
import { Badge } from '@/components/ui/Badge';

interface TimelineProps {
  currentDay: number; // 1-based
  totalDays: number; // N
  label?: string; // e.g., "Day 4 of 30"
  showWeeks?: boolean; // renders Week Y/Z when totalDays % 7 === 0
  showBadges?: boolean; // Show alignment badges
  alignmentStatus?: 'aligned' | 'misaligned' | 'incomplete';
  groupName?: string;
  challengeName?: string;
  compact?: boolean; // Compact mode for smaller spaces
}

export const Timeline: React.FC<TimelineProps> = ({
  currentDay,
  totalDays,
  label,
  showWeeks = true,
  showBadges = false,
  alignmentStatus,
  groupName,
  challengeName,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const clampedDay = Math.max(0, Math.min(currentDay, totalDays));
  const progress = totalDays > 0 ? clampedDay / totalDays : 0;

  const weeks = Math.ceil(totalDays / 7);
  const currentWeek = Math.min(weeks, Math.ceil(clampedDay / 7));

  const getAlignmentBadgeVariant = () => {
    switch (alignmentStatus) {
      case 'aligned':
        return 'success';
      case 'misaligned':
        return 'error';
      case 'incomplete':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getAlignmentBadgeText = () => {
    switch (alignmentStatus) {
      case 'aligned':
        return t('shared.timeline.aligned');
      case 'misaligned':
        return t('shared.timeline.misaligned');
      case 'incomplete':
        return t('shared.timeline.incomplete');
      default:
        return '';
    }
  };

  return (
    <View style={styles(theme, compact).container}>
      {/* Progress Bar */}
      <View style={styles(theme, compact).barBackground}>
        <View
          style={[
            styles(theme, compact).barFill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>

      {/* Labels Row */}
      <View style={styles(theme, compact).labelsRow}>
        <View style={styles(theme, compact).labelContainer}>
          <Text style={styles(theme, compact).labelText}>
            {label ||
              t('shared.timeline.day', { day: clampedDay, total: totalDays })}
          </Text>

          {/* Show group/challenge context if provided */}
          {groupName && challengeName && !compact && (
            <Text style={styles(theme, compact).contextText}>
              {t('shared.timeline.context', {
                challenge: challengeName,
                group: groupName,
              })}
            </Text>
          )}
        </View>

        {/* Week badge */}
        {showWeeks && totalDays % 7 === 0 && (
          <Badge
            text={t('shared.timeline.week', {
              current: currentWeek,
              total: weeks,
            })}
            variant="secondary"
            size="small"
          />
        )}

        {/* Alignment status badge */}
        {showBadges && alignmentStatus && (
          <Badge
            text={getAlignmentBadgeText()}
            variant={getAlignmentBadgeVariant()}
            size="small"
          />
        )}
      </View>

      {/* Progress Stats (non-compact only) */}
      {!compact && (
        <View style={styles(theme, compact).statsRow}>
          <Text style={styles(theme, compact).statText}>
            {t('shared.timeline.complete', {
              percent: Math.round(progress * 100),
            })}
          </Text>
          <Text style={styles(theme, compact).statText}>
            {t('shared.timeline.remaining', {
              days: totalDays - clampedDay,
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = (theme: ReturnType<typeof useTheme>, compact: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    barBackground: {
      height: compact ? 6 : 8,
      width: '100%',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      ...theme.shadows.soft,
    },
    barFill: {
      height: compact ? 6 : 8,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
    },
    labelsRow: {
      marginTop: compact ? theme.spacing.xs : theme.spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    labelContainer: {
      flex: 1,
    },
    labelText: {
      fontSize: compact
        ? theme.typography.sizes.sm
        : theme.typography.sizes.base,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text.primary,
      marginBottom: compact ? 0 : theme.spacing.xs,
    },
    contextText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
    },
    statsRow: {
      marginTop: theme.spacing.xs,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.tertiary,
      fontWeight: theme.typography.weights.medium,
    },
  });

export default Timeline;
