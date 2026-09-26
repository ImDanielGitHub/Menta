import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { mentaRadii } from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

export type AppStepProgressProps = {
  /** Completed share of the flow, from 0 to 1. */
  progress: number;
  /** Names the flow for assistive technology, for example "Create group". */
  accessibilityLabel?: string;
  /**
   * Hide the bar from assistive technology when a visible label such as
   * "Step 2 of 3" already announces the position, so a screen keeps one
   * progress region.
   */
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const TRACK_HEIGHT = 6;

const clampProgress = (value: number): number =>
  Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;

/**
 * The thin violet bar that sits at the top of every stepped flow, matching
 * the onboarding journey. It eases forward between steps and jumps straight
 * to the new value when Reduce Motion is on.
 */
export const AppStepProgress: React.FC<AppStepProgressProps> = ({
  progress,
  accessibilityLabel,
  decorative = false,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const motion = useMotionPreferences();
  const resolved = clampProgress(progress);
  const fill = useRef(new Animated.Value(resolved)).current;

  useEffect(() => {
    const duration = motion.duration(MOTION_DURATIONS.screen);
    if (duration === 0) {
      fill.setValue(resolved);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: resolved,
      duration,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fill, motion, resolved]);

  return (
    <View
      {...(decorative
        ? {
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          }
        : {
            accessible: true,
            accessibilityLabel,
            accessibilityRole: 'progressbar' as const,
            accessibilityValue: {
              min: 0,
              max: 100,
              now: Math.round(resolved * 100),
            },
          })}
      style={[styles.track, { backgroundColor: colors.border.primary }, style]}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: colors.accent.primary,
            width: fill.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
        testID={testID ? `${testID}-fill` : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: mentaRadii.small,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: mentaRadii.small,
  },
});
