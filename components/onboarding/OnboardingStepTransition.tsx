import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { MOTION_DISTANCES, MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

type OnboardingStepTransitionProps = {
  children: React.ReactNode;
  /** Forward steps arrive from the right; going back arrives from the left. */
  direction: 'forward' | 'back';
  testID?: string;
};

/**
 * Plays one short continuity phrase when an onboarding step mounts. It never
 * delays input: the new step is interactive from its first frame.
 */
export function OnboardingStepTransition({
  children,
  direction,
  testID = 'onboarding-step-transition',
}: OnboardingStepTransitionProps) {
  const motion = useMotionPreferences();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.timing(progress, {
      duration: motion.duration(MOTION_DURATIONS.screen),
      toValue: 1,
      useNativeDriver: true,
    });
    entrance.start();
    return () => entrance.stop();
  }, [motion, progress]);

  const offset = motion.distance(MOTION_DISTANCES.sm);

  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.001, 1],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [direction === 'back' ? -offset : offset, 0],
              }),
            },
          ],
        },
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
