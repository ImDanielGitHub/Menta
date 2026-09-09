import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/constants/ThemeContext';

type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  size?: ProgressBarSize;
  backgroundColor?: string;
  progressColor?: string;
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: [string, string];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height,
  size = 'md',
  backgroundColor,
  progressColor,
  showLabel = false,
  label,
  showPercentage = false,
  style,
  gradient = false,
  gradientColors,
}) => {
  const theme = useTheme();
  const { colors, spacing, typography } = theme;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const containerBgColor = backgroundColor || colors.background.secondary;
  const defaultProgressColor = progressColor || colors.primary;
  const defaultGradientColors = gradientColors || [
    colors.primary,
    colors.secondary,
  ];

  const resolvedHeight = useMemo(() => {
    if (height) return height;

    switch (size) {
      case 'xs':
        return Math.max(2, theme.spacing.xs / 2);
      case 'sm':
        return Math.max(3, theme.spacing.xs);
      case 'lg':
        return Math.max(theme.spacing.sm, theme.spacing.md / 2);
      case 'md':
      default:
        return theme.spacing.sm;
    }
  }, [height, size, theme.spacing.xs, theme.spacing.sm, theme.spacing.md]);

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.xs,
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.text.primary,
    },
    percentage: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text.secondary,
    },
    progressContainer: {
      height: resolvedHeight,
      backgroundColor: containerBgColor,
      borderRadius: resolvedHeight / 2,
      overflow: 'hidden',
      ...theme.shadows.small,
    },
    progressBar: {
      height: '100%',
      width: `${clampedProgress}%`,
      borderRadius: resolvedHeight / 2,
    },
    progressBarSolid: {
      backgroundColor: defaultProgressColor,
    },
  });

  const renderProgressBar = () => {
    if (gradient) {
      return (
        <LinearGradient
          colors={defaultGradientColors}
          style={styles.progressBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      );
    }

    return <View style={[styles.progressBar, styles.progressBarSolid]} />;
  };

  return (
    <View style={[styles.container, style]}>
      {(showLabel || showPercentage) && (
        <View style={styles.labelContainer}>
          {showLabel && label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={styles.percentage}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}

      <View style={styles.progressContainer}>{renderProgressBar()}</View>
    </View>
  );
};
