import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { emitHaptic, type HapticIntent } from '@/lib/motion/haptics';
import { useAppTextScale } from '@/components/ui/AppScaledText';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

const scaleTypeMetric = (value: number, scale: number): number =>
  Math.round(value * scale * 10) / 10;

type LegacyVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'tertiary'
  | 'destructive'
  | 'text'
  | 'accent'
  | 'success'
  | 'error'
  | 'warning';

type LegacySize = 'small' | 'medium' | 'large' | 'xlarge';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: LegacyVariant;
  size?: LegacySize;
  disabled?: boolean;
  loading?: boolean;
  preserveLabelPositionOnLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  textScale?: number;
  /**
   * Opt-in tactile feedback. Ordinary buttons stay silent so selection,
   * hold, and confirmed receipts remain the only haptic vocabulary.
   */
  haptic?: boolean;
  hapticIntent?: HapticIntent;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  preserveLabelPositionOnLoading = false,
  fullWidth = false,
  icon,
  leftIcon,
  rightIcon,
  iconPosition = 'left',
  style,
  textStyle,
  textScale: requestedTextScale,
  haptic = false,
  hapticIntent = 'press',
  testID,
  accessibilityHint,
  accessibilityLabel,
}) => {
  const theme = useTheme();
  const motion = useMotionPreferences();
  const inheritedTextScale = useAppTextScale();
  const textScale = requestedTextScale ?? inheritedTextScale ?? undefined;
  const resolvedVariant =
    variant === 'tertiary'
      ? 'secondary'
      : variant === 'text'
        ? 'ghost'
        : variant === 'error'
          ? 'destructive'
          : variant;
  const isDisabled = disabled || loading;

  const heightBySize: Record<LegacySize, number> = {
    small: mentaLayout.minimumTouchTarget,
    medium: 52,
    large: mentaLayout.primaryControlHeight,
    xlarge: 62,
  };

  const paddingBySize: Record<LegacySize, number> = {
    small: mentaSpacing[3],
    medium: mentaSpacing[4],
    large: mentaSpacing[5],
    xlarge: mentaSpacing[6],
  };

  // Route actions carry real authority: medium and above use the control size so
  // a button never reads as ordinary body copy inside a pill.
  const typographyBySize: Record<LegacySize, TextStyle> = {
    small: mentaTypography.bodySmallMedium,
    medium: mentaTypography.control,
    large: mentaTypography.control,
    xlarge: mentaTypography.control,
  };
  const resolvedTypography = StyleSheet.flatten([
    typographyBySize[size],
    textStyle,
  ]);
  const scaledTypography =
    textScale == null
      ? undefined
      : {
          fontSize: scaleTypeMetric(
            resolvedTypography.fontSize ?? 17,
            textScale
          ),
          lineHeight: scaleTypeMetric(
            resolvedTypography.lineHeight ?? 24,
            textScale
          ),
        };

  const colorsByVariant = {
    primary: {
      backgroundColor: theme.colors.interactive.primary,
      borderColor: theme.colors.interactive.primary,
      textColor: theme.colors.onPrimary,
    },
    accent: {
      backgroundColor: theme.colors.accent.primary,
      borderColor: theme.colors.accent.primary,
      textColor: theme.colors.onPrimary,
    },
    secondary: {
      backgroundColor: theme.colors.interactive.secondary,
      borderColor: theme.colors.border.primary,
      textColor: theme.colors.text.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border.primary,
      textColor: theme.colors.text.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.text.secondary,
    },
    destructive: {
      backgroundColor: mentaColors.dangerSoft,
      borderColor: mentaColors.danger,
      textColor: mentaColors.danger,
    },
    success: {
      backgroundColor: mentaColors.successSoft,
      borderColor: mentaColors.success,
      textColor: mentaColors.success,
    },
    warning: {
      backgroundColor: mentaColors.warningSoft,
      borderColor: mentaColors.warning,
      textColor: mentaColors.warning,
    },
  } as const;

  const palette = colorsByVariant[resolvedVariant];
  const resolvedLeftIcon = leftIcon ?? (iconPosition === 'left' ? icon : null);
  const resolvedRightIcon =
    rightIcon ?? (iconPosition === 'right' ? icon : null);

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic) {
      void emitHaptic({ type: hapticIntent });
    }
    onPress();
  };

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      role="button"
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: heightBySize[size],
          paddingHorizontal: paddingBySize[size],
          borderRadius: mentaRadii.large,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          alignSelf: fullWidth ? 'stretch' : undefined,
        },
        resolvedVariant !== 'ghost' && {
          borderWidth: 1,
        },
        pressed &&
          !isDisabled &&
          (motion.reduceMotion ? styles.pressedReduced : styles.pressed),
        style,
      ]}
    >
      <View accessible={false} style={styles.content}>
        {loading && preserveLabelPositionOnLoading ? (
          <>
            <View
              style={styles.icon}
              testID={testID ? `${testID}-loading-leading-slot` : undefined}
            >
              <ActivityIndicator color={palette.textColor} size="small" />
            </View>
            <Text
              accessible={false}
              allowFontScaling={textScale == null}
              style={[
                styles.title,
                typographyBySize[size],
                {
                  color: palette.textColor,
                },
                textStyle,
                scaledTypography,
              ]}
            >
              {title}
            </Text>
            <View
              style={styles.icon}
              testID={testID ? `${testID}-loading-trailing-slot` : undefined}
            >
              {resolvedRightIcon ?? resolvedLeftIcon}
            </View>
          </>
        ) : loading ? (
          <>
            <ActivityIndicator
              color={palette.textColor}
              size="small"
              style={styles.icon}
            />
            <Text
              accessible={false}
              allowFontScaling={textScale == null}
              style={[
                styles.title,
                typographyBySize[size],
                {
                  color: palette.textColor,
                },
                textStyle,
                scaledTypography,
              ]}
            >
              {title}
            </Text>
          </>
        ) : (
          <>
            {resolvedLeftIcon ? (
              <View style={styles.icon}>{resolvedLeftIcon}</View>
            ) : null}
            <Text
              accessible={false}
              allowFontScaling={textScale == null}
              style={[
                styles.title,
                typographyBySize[size],
                {
                  color: palette.textColor,
                },
                textStyle,
                scaledTypography,
              ]}
            >
              {title}
            </Text>
            {resolvedRightIcon ? (
              <View style={styles.icon}>{resolvedRightIcon}</View>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    minWidth: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  pressedReduced: {
    opacity: 0.86,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  icon: {
    marginHorizontal: mentaSpacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export type ButtonVariant = AppButtonProps['variant'];
export type ButtonSize = AppButtonProps['size'];

export default AppButton;
