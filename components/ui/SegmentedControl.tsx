import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { emitHaptic } from '@/lib/motion/haptics';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

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

/**
 * Tabs inside a detail screen. Shares the onboarding segment language with
 * AppSegmentedControl: a quiet track with the chosen segment as a filled
 * violet pill, plus an optional count badge per segment.
 */
export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  value,
  onChange,
  style,
  fullWidth = true,
}) => {
  const { colors } = useTheme();
  const motion = useMotionPreferences();

  const containerStyles: StyleProp<ViewStyle> = [
    styles.container,
    {
      backgroundColor: colors.background.secondary,
      borderColor: colors.border.primary,
    },
    fullWidth && styles.fullWidth,
    style,
  ];

  return (
    <View style={containerStyles}>
      {segments.map(segment => {
        const isActive = value === segment.value;
        const foreground = isActive ? colors.onPrimary : colors.text.secondary;
        return (
          <Pressable
            key={segment.value}
            accessibilityLabel={segment.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) void emitHaptic({ type: 'selection' });
              onChange(segment.value);
            }}
            style={({ pressed }) => [
              styles.segment,
              fullWidth && styles.segmentFill,
              isActive && { backgroundColor: colors.accent.primary },
              pressed &&
                !isActive &&
                (motion.reduceMotion ? styles.pressedReduced : styles.pressed),
            ]}
          >
            {segment.icon ? (
              <View style={styles.icon}>{segment.icon}</View>
            ) : null}
            <Text
              accessible={false}
              numberOfLines={1}
              style={[
                isActive ? styles.labelActive : styles.label,
                { color: foreground },
              ]}
            >
              {segment.label}
            </Text>
            {segment.badge != null ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isActive
                      ? colors.background.primary
                      : colors.border.primary,
                  },
                ]}
              >
                <Text
                  accessible={false}
                  style={[
                    styles.badgeLabel,
                    {
                      color: isActive
                        ? colors.text.primary
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {segment.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
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
    gap: mentaSpacing[1],
    minHeight: mentaLayout.minimumTouchTarget,
    padding: mentaSpacing[1],
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fullWidth: {
    width: '100%',
  },
  segment: {
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mentaSpacing[3],
    borderRadius: mentaRadii.small,
  },
  segmentFill: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  pressedReduced: {
    opacity: 0.72,
  },
  icon: {
    marginRight: mentaSpacing[1],
  },
  label: {
    ...mentaTypography.bodySmallMedium,
    flexShrink: 1,
  },
  labelActive: {
    ...mentaTypography.bodySmallMedium,
    fontFamily: mentaTypography.bodySemibold.fontFamily,
    flexShrink: 1,
  },
  badge: {
    marginLeft: mentaSpacing[1],
    minWidth: 22,
    paddingHorizontal: mentaSpacing[1],
    borderRadius: mentaRadii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    ...mentaTypography.captionMedium,
    fontVariant: ['tabular-nums'],
  },
});

export default SegmentedControl;
