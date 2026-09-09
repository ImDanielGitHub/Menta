import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

type OnboardingAtmosphereProps = {
  hero?: boolean;
  progress: number;
  quiet?: boolean;
};

const clampProgress = (progress: number) => Math.max(0, Math.min(1, progress));

/**
 * A restrained liquid horizon for onboarding. Progress moves the horizon down
 * the screen, so the journey appears to fill rather than relying on another
 * generic segmented progress bar.
 */
export function OnboardingAtmosphere({
  hero = false,
  progress,
  quiet = false,
}: OnboardingAtmosphereProps) {
  const motion = useMotionPreferences();
  const drift = useRef(new Animated.Value(0)).current;
  const safeProgress = clampProgress(progress);
  const atmosphereHeight = hero ? 280 : 176;
  const atmosphereOpacity = quiet
    ? 0.2
    : hero
      ? 0.54
      : 0.28 + safeProgress * 0.08;

  useEffect(() => {
    drift.stopAnimation();
    drift.setValue(0);
    if (!motion.allowsLoops || quiet) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          duration: motion.duration(2800),
          easing: Easing.bezier(0.32, 0.72, 0, 1),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          duration: motion.duration(3200),
          easing: Easing.bezier(0.32, 0.72, 0, 1),
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [drift, motion, quiet]);

  const particleStyle = useMemo(
    () => ({
      opacity: drift.interpolate({
        inputRange: [0, 1],
        outputRange: [quiet ? 0.12 : 0.2, quiet ? 0.22 : 0.5],
      }),
      transform: [
        {
          translateY: drift.interpolate({
            inputRange: [0, 1],
            outputRange: [0, motion.distance(-8)],
          }),
        },
      ],
    }),
    [drift, motion, quiet]
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.stage}
    >
      <Animated.View
        style={[
          styles.horizon,
          {
            height: atmosphereHeight,
            opacity: atmosphereOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['#5A289D', 'rgba(62, 27, 118, 0.42)', 'transparent']}
          end={{ x: 0.65, y: 1 }}
          locations={[0, 0.38, 1]}
          start={{ x: 0.18, y: 0 }}
          style={styles.gradient}
        />
        <Animated.View style={[styles.particles, particleStyle]}>
          <Svg height="100%" viewBox="0 0 430 180" width="100%">
            <Circle cx="58" cy="102" fill="#F8F7F1" opacity="0.34" r="2" />
            <Circle cx="126" cy="68" fill="#B88CFF" opacity="0.5" r="3" />
            <Circle cx="248" cy="112" fill="#F8F7F1" opacity="0.25" r="1.6" />
            <Circle cx="332" cy="75" fill="#B88CFF" opacity="0.42" r="2.4" />
            <Circle cx="386" cy="128" fill="#F8F7F1" opacity="0.28" r="1.8" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  horizon: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  gradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  particles: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
