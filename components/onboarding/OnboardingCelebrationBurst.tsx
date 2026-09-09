import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { mentaColors } from '@/constants/MentaDesignSystem';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

const pieces = [
  { x: -132, y: -132, rotate: '-130deg', color: mentaColors.action },
  { x: -96, y: -178, rotate: '-70deg', color: mentaColors.warning },
  { x: -54, y: -148, rotate: '-35deg', color: mentaColors.text.primary },
  { x: -18, y: -188, rotate: '-18deg', color: mentaColors.action },
  { x: 24, y: -168, rotate: '25deg', color: mentaColors.warning },
  { x: 68, y: -144, rotate: '58deg', color: mentaColors.text.primary },
  { x: 112, y: -174, rotate: '92deg', color: mentaColors.action },
  { x: 142, y: -118, rotate: '134deg', color: mentaColors.warning },
  { x: -148, y: -76, rotate: '-110deg', color: mentaColors.text.primary },
  { x: 154, y: -52, rotate: '118deg', color: mentaColors.action },
  { x: -116, y: -36, rotate: '-82deg', color: mentaColors.warning },
  { x: 120, y: -20, rotate: '76deg', color: mentaColors.text.primary },
] as const;

/** One-shot, server-confirmed celebration. It never loops or blocks input. */
export function OnboardingCelebrationBurst() {
  const motion = useMotionPreferences();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (motion.reduceMotion) return;
    const animation = Animated.timing(progress, {
      duration: motion.duration(1250),
      easing: Easing.bezier(0.16, 0.84, 0.28, 1),
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [motion, progress]);

  const opacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.12, 0.82, 1],
        outputRange: [0, 1, 1, 0],
      }),
    [progress]
  );

  if (motion.reduceMotion) return null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.stage}
      testID="onboarding-receipt-confetti"
    >
      {pieces.map((piece, index) => {
        const delay = (index % 4) * 0.035;
        return (
          <Animated.View
            key={`${piece.x}-${piece.y}`}
            style={[
              styles.piece,
              {
                backgroundColor: piece.color,
                borderRadius: index % 3 === 0 ? 999 : 2,
                height: index % 3 === 0 ? 7 : 11,
                opacity,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, delay, 1],
                      outputRange: [0, 0, piece.x],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, delay, 0.68, 1],
                      outputRange: [0, 0, piece.y, piece.y + 72],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', piece.rotate],
                    }),
                  },
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 0.16, 1],
                      outputRange: [0.4, 1, 0.84],
                    }),
                  },
                ],
                width: index % 3 === 0 ? 7 : 5,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 1,
    left: '50%',
    position: 'absolute',
    top: 178,
    width: 1,
    zIndex: 2,
  },
  piece: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
