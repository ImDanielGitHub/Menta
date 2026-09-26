import React from 'react';
import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { emitHaptic } from '@/lib/motion/haptics';
import { MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

const PRESSED_SCALE = 0.97;
const RELEASE_EASING = Easing.out(Easing.back(2.2));

type ShopPressableProps = {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  /** A light selection tick when the press opens or chooses something. */
  haptic?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  /** Layout and surface of the pressable content. */
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  /** Outer placement (width, flex, margins) around the animated surface. */
  containerStyle?: StyleProp<ViewStyle>;
  hitSlop?: number;
  testID?: string;
};

/**
 * The shop's tactile press: the surface sinks slightly while held and springs
 * back on release. Reduce Motion keeps the pressed tint without any scale.
 * Candidate for promotion into the shared `App*` primitives.
 */
export function ShopPressable({
  children,
  onPress,
  disabled = false,
  haptic = true,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  style,
  pressedStyle,
  containerStyle,
  hitSlop,
  testID,
}: ShopPressableProps) {
  const motion = useMotionPreferences();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = () => {
    if (disabled || motion.reduceMotion) return;
    scale.value = withTiming(PRESSED_SCALE, {
      duration: MOTION_DURATIONS.press,
    });
  };
  const pressOut = () => {
    if (motion.reduceMotion) return;
    scale.value = withTiming(1, {
      duration: MOTION_DURATIONS.screen,
      easing: RELEASE_EASING,
    });
  };

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, ...accessibilityState }}
        disabled={disabled}
        hitSlop={hitSlop}
        onPress={event => {
          if (haptic) void emitHaptic({ type: 'selection' });
          onPress?.(event);
        }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed }) => [
          style,
          pressed && !disabled ? pressedStyle : null,
        ]}
        testID={testID}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
