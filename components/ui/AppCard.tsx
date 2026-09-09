import React from 'react';
import {
  type AccessibilityProps,
  ColorValue,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';

export type AppCardVariant =
  | 'default'
  | 'content'
  | 'hero'
  | 'paper'
  | 'outlined'
  | 'interactive'
  | 'minimal'
  | 'critical'
  | 'gradient';

export interface AppCardProps extends Pick<
  AccessibilityProps,
  | 'accessibilityHint'
  | 'accessibilityLabel'
  | 'accessibilityRole'
  | 'accessibilityState'
> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressableStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: AppCardVariant;
  gradient?: readonly string[];
  padding?: number;
  testID?: string;
  disabled?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  pressableStyle,
  onPress,
  variant = 'default',
  gradient,
  padding,
  testID,
  disabled = false,
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}) => {
  const theme = useTheme();
  const resolvedPadding = padding ?? mentaSpacing[5];

  const baseStyle: ViewStyle = {
    padding: resolvedPadding,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    overflow: 'hidden',
  };

  const variants: Record<AppCardVariant, ViewStyle> = {
    default: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border.secondary,
    },
    content: {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.primary,
    },
    hero: {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.border.primary,
    },
    paper: {
      backgroundColor: mentaColors.paper,
      borderColor: mentaColors.borderPaper,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border.primary,
    },
    interactive: {
      backgroundColor: theme.colors.interactive.secondary,
      borderColor: theme.colors.border.primary,
    },
    minimal: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    critical: {
      backgroundColor: mentaColors.dangerSoft,
      borderColor: mentaColors.danger,
    },
    gradient: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border.secondary,
    },
  };

  const hasStandaloneAccessibility = Boolean(
    accessibilityHint ||
    accessibilityLabel ||
    accessibilityRole ||
    accessibilityState
  );

  const standaloneAccessibilityProps = !onPress
    ? {
        accessible: hasStandaloneAccessibility || undefined,
        accessibilityHint,
        accessibilityLabel,
        accessibilityRole,
        accessibilityState,
      }
    : {};

  const content =
    variant === 'gradient' || gradient ? (
      <LinearGradient
        colors={
          (gradient ?? [
            theme.colors.background.surface,
            theme.colors.background.secondary,
          ]) as readonly [ColorValue, ColorValue, ...ColorValue[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, baseStyle, variants.gradient, style]}
        testID={!onPress ? testID : undefined}
        {...standaloneAccessibilityProps}
      >
        {children}
      </LinearGradient>
    ) : (
      <View
        style={[baseStyle, variants[variant], style]}
        testID={!onPress ? testID : undefined}
        {...standaloneAccessibilityProps}
      >
        {children}
      </View>
    );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        pressableStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fill: {
    width: '100%',
  },
  disabled: {
    opacity: 0.44,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});

export default AppCard;
