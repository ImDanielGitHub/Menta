import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { emitHaptic } from '@/lib/motion/haptics';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

export type AppSegmentedOption<Value extends string> = {
  label: string;
  value: Value;
  accessibilityHint?: string;
  /** Overrides the derived `${testID}-${value}` identifier. */
  testID?: string;
};

type AppSegmentedControlProps<Value extends string> = {
  accessibilityLabel: string;
  onChange: (value: Value) => void;
  options: readonly AppSegmentedOption<Value>[];
  /**
   * `large` is the primary switch between two peer views of a destination,
   * such as Shared and Discover on Groups: full control height and label.
   */
  size?: 'regular' | 'large';
  testID?: string;
  value: Value;
};

export function AppSegmentedControl<Value extends string>({
  accessibilityLabel,
  onChange,
  options,
  size = 'regular',
  testID,
  value,
}: AppSegmentedControlProps<Value>) {
  const { colors } = useTheme();
  const isLarge = size === 'large';
  const motion = useMotionPreferences();
  const accessibilityRole = Platform.OS === 'ios' ? 'button' : 'tab';

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      style={[
        styles.container,
        isLarge && styles.containerLarge,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.primary,
        },
      ]}
      testID={testID}
    >
      {options.map(option => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityHint={option.accessibilityHint}
            accessibilityLabel={option.label}
            accessibilityRole={accessibilityRole}
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => {
              if (selected) return;
              void emitHaptic({ type: 'selection' });
              onChange(option.value);
            }}
            role={accessibilityRole}
            style={({ pressed }) => [
              styles.option,
              isLarge && styles.optionLarge,
              // The chosen segment is a filled violet pill, as in onboarding
              // and the Groups switcher, with dark text for contrast.
              selected && {
                backgroundColor: colors.accent.primary,
                borderColor: colors.accent.primary,
              },
              pressed && !selected
                ? motion.reduceMotion
                  ? styles.pressedReduced
                  : styles.pressed
                : null,
            ]}
            testID={
              option.testID ??
              (testID ? `${testID}-${option.value}` : undefined)
            }
          >
            <Text
              accessible={false}
              maxFontSizeMultiplier={1.5}
              numberOfLines={1}
              style={[
                styles.label,
                isLarge && styles.labelLarge,
                {
                  color: selected ? colors.onPrimary : colors.text.secondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[1],
    padding: mentaSpacing[1],
    width: '100%',
  },
  containerLarge: {
    minHeight: mentaLayout.primaryControlHeight + mentaSpacing[2],
  },
  option: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: mentaRadii.small,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[2],
  },
  optionLarge: {
    minHeight: mentaLayout.primaryControlHeight,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  pressedReduced: {
    opacity: 0.72,
  },
  label: {
    ...mentaTypography.bodySmallMedium,
    textAlign: 'center',
  },
  labelLarge: {
    ...mentaTypography.control,
  },
});
