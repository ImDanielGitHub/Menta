import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';

export type AppSegmentedOption<Value extends string> = {
  label: string;
  value: Value;
};

type AppSegmentedControlProps<Value extends string> = {
  accessibilityLabel: string;
  onChange: (value: Value) => void;
  options: readonly AppSegmentedOption<Value>[];
  testID?: string;
  value: Value;
};

export function AppSegmentedControl<Value extends string>({
  accessibilityLabel,
  onChange,
  options,
  testID,
  value,
}: AppSegmentedControlProps<Value>) {
  const { colors } = useTheme();
  const accessibilityRole = Platform.OS === 'ios' ? 'button' : 'tab';

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      style={[
        styles.container,
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
            accessibilityLabel={option.label}
            accessibilityRole={accessibilityRole}
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => {
              if (!selected) onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.option,
              selected && {
                backgroundColor: colors.accent.background,
                borderColor: colors.accent.primary,
              },
              pressed && !selected ? styles.pressed : null,
            ]}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            <Text
              maxFontSizeMultiplier={1.5}
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: selected
                    ? colors.accent.primary
                    : colors.text.secondary,
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
  pressed: {
    opacity: 0.68,
  },
  label: {
    ...mentaTypography.bodySmallMedium,
    textAlign: 'center',
  },
});
