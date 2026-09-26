import React, { useCallback } from 'react';
import {
  Pressable,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { emitHaptic, type HapticIntent } from '@/lib/motion/haptics';
import { MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

/** Card-sized press depth. Deeper than a button so a whole row feels held. */
const CARD_PRESS_SCALE = 0.97;

type TodayPressableProps = {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  children: React.ReactNode;
  /** Layout for the animated wrapper, such as `flex` inside a row. */
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Semantic haptic for the press. Omit for a silent control. */
  haptic?: HapticIntent | null;
  onPress: () => void;
  pressedStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Tactile Today surface: the whole card sinks slightly on touch and springs
 * back on release, with an optional light haptic. Reduce Motion keeps the
 * pressed colour change and drops the scale.
 *
 * Promotion candidate for a shared `AppPressableCard` primitive.
 */
export function TodayPressable({
  accessibilityHint,
  accessibilityLabel,
  accessibilityState,
  children,
  containerStyle,
  disabled = false,
  haptic = 'press',
  onPress,
  pressedStyle,
  style,
  testID,
}: TodayPressableProps) {
  const motion = useMotionPreferences();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = useCallback(() => {
    if (!motion.allowsTransform) return;
    scale.value = withTiming(CARD_PRESS_SCALE, {
      duration: MOTION_DURATIONS.press,
      easing: Easing.out(Easing.quad),
    });
  }, [motion.allowsTransform, scale]);

  const pressOut = useCallback(() => {
    if (!motion.allowsTransform) {
      scale.value = 1;
      return;
    }
    scale.value = withTiming(1, {
      duration: MOTION_DURATIONS.state,
      easing: Easing.out(Easing.back(2)),
    });
  }, [motion.allowsTransform, scale]);

  const handlePress = useCallback(() => {
    if (haptic) void emitHaptic({ type: haptic });
    onPress();
  }, [haptic, onPress]);

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, disabled }}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed }) => [style, pressed ? pressedStyle : null]}
        testID={testID}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
