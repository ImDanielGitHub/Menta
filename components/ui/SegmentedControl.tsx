import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { mentaLayout } from '@/constants/MentaDesignSystem';

export type SegmentOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
};

export interface SegmentedControlProps {
  segments: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  value,
  onChange,
  style,
  fullWidth = true,
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();

  const containerStyles: StyleProp<ViewStyle> = [
    styles.container,
    {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.full,
      padding: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    fullWidth && { width: '100%' as const },
    style,
  ];

  return (
    <View style={containerStyles}>
      {segments.map(segment => {
        const isActive = value === segment.value;
        return (
          <TouchableOpacity
            key={segment.value}
            accessibilityLabel={segment.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(segment.value)}
            style={{
              flex: fullWidth ? 1 : undefined,
              minHeight: mentaLayout.minimumTouchTarget,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.full,
              backgroundColor: isActive ? colors.text.primary : 'transparent',
              ...(!isActive ? {} : shadows.sm),
            }}
            activeOpacity={0.9}
          >
            {segment.icon && (
              <View style={{ marginRight: spacing.xs }}>{segment.icon}</View>
            )}
            <Text
              style={{
                ...typography.subheading,
                color: isActive
                  ? colors.background.primary
                  : colors.text.secondary,
                fontWeight: isActive ? '600' : '500',
              }}
            >
              {segment.label}
            </Text>
            {segment.badge != null && (
              <View
                style={{
                  marginLeft: spacing.xs,
                  minWidth: 22,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: spacing.xxxs,
                  borderRadius: borderRadius.full,
                  backgroundColor: isActive
                    ? colors.background.primary
                    : colors.border.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: isActive
                      ? colors.text.primary
                      : colors.text.secondary,
                    fontWeight: '600',
                  }}
                >
                  {segment.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
  },
});

export default SegmentedControl;
