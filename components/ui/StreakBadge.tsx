import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { FlameIcon as FlameIcon } from '@/components/ui/icons';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization/use-translation';

export type StreakBadgeSize = 'sm' | 'md' | 'lg';

interface StreakBadgeProps {
  streak: number;
  size?: StreakBadgeSize;
  label?: string;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const createStyles = (
  theme: ReturnType<typeof useTheme>,
  size: StreakBadgeSize,
  showLabel: boolean
) => {
  const { spacing, typography, borderRadius, colors } = theme;

  const paddingHorizontal =
    size === 'lg' ? spacing.md : size === 'md' ? spacing.sm : spacing.xs;
  const paddingVertical =
    size === 'lg'
      ? spacing.sm
      : size === 'md'
        ? Math.max(2, spacing.xs)
        : Math.max(2, spacing.xs / 2);
  const gap =
    size === 'lg'
      ? spacing.sm
      : size === 'md'
        ? spacing.xs
        : Math.max(2, spacing.xs / 2);
  const textSize =
    size === 'lg'
      ? typography.sizes.lg
      : size === 'md'
        ? typography.sizes.base
        : typography.sizes.sm;
  const labelSize = size === 'lg' ? typography.sizes.sm : typography.sizes.xs;
  const minHeight =
    size === 'lg'
      ? spacing.xl
      : size === 'md'
        ? spacing.lg + spacing.xs
        : spacing.md + spacing.sm;
  const iconSize =
    size === 'lg'
      ? typography.sizes.lg
      : size === 'md'
        ? typography.sizes.base
        : typography.sizes.sm;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: showLabel ? 'flex-start' : undefined,
      minHeight,
      paddingHorizontal,
      paddingVertical,
      backgroundColor: colors.brand.primary,
      borderRadius: borderRadius.full,
    },
    icon: {
      marginRight: gap,
    },
    text: {
      color: colors.text.inverse,
      fontSize: textSize,
      fontWeight: typography.weights.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    label: {
      color: colors.text.inverse,
      fontSize: labelSize,
      fontWeight: typography.weights.medium,
      opacity: 0.9,
      marginLeft: gap,
      textTransform: 'uppercase',
    },
  });

  return { styles, iconSize };
};

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak,
  size = 'md',
  label,
  showLabel = true,
  style,
  textStyle,
  iconStyle,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('shared.streak.day');
  const { styles, iconSize } = useMemo(
    () => createStyles(theme, size, showLabel),
    [theme, size, showLabel]
  );
  const { colors } = theme;

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={t('shared.streak.accessibility', { streak })}
      style={[styles.container, style]}
    >
      <FlameIcon
        size={iconSize}
        color={colors.text.inverse}
        style={[styles.icon, iconStyle]}
      />
      <Text style={[styles.text, textStyle]}>
        {t('shared.streak.compact', { streak })}
      </Text>
      {showLabel && <Text style={styles.label}>{resolvedLabel}</Text>}
    </View>
  );
};

export default StreakBadge;
