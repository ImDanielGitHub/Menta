import type { MentaPalette } from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

type ConfettiIntensity = 'full' | 'small';

type ConfettiBurstProps = {
  /** `full` for your own day counting, `small` for approving someone else. */
  intensity?: ConfettiIntensity;
  testID?: string;
};

type Piece = {
  x: number;
  drift: number;
  fall: number;
  spin: number;
  delay: number;
  round: boolean;
  length: number;
  color: string;
};

const DURATION_MS = 2200;

// A fixed pseudo-random sequence keeps the burst identical between renders
// and test runs while still looking scattered.
const seeded = (seed: number): number => {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  return value - Math.floor(value);
};

function ConfettiPiece({
  piece,
  width,
  height,
  progress,
}: {
  piece: Piece;
  width: number;
  height: number;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const travel = progress.value;
    return {
      opacity: interpolate(travel, [0, 0.08, 0.75, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: piece.x * width + piece.drift * travel },
        { translateY: -24 + travel * height * piece.fall },
        { rotate: `${piece.spin * travel}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        piece.round
          ? styles.round
          : { width: 6, height: piece.length, borderRadius: 2 },
        { backgroundColor: piece.color },
        style,
      ]}
    />
  );
}

function DelayedPiece(props: {
  piece: Piece;
  width: number;
  height: number;
  durationMs: number;
}) {
  const progress = useSharedValue(0);
  const { piece, durationMs } = props;

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, {
        duration: durationMs,
        easing: Easing.bezier(0.2, 0.7, 0.4, 1),
      })
    );
  }, [durationMs, piece.delay, progress]);

  return <ConfettiPiece {...props} progress={progress} />;
}

/**
 * One-shot confetti for a server-confirmed moment: your day counting, or
 * approving someone else's proof. It never loops, never takes touches, and
 * is skipped entirely when Reduce Motion is on.
 */
export function ConfettiBurst({
  intensity = 'full',
  testID = 'confetti-burst',
}: ConfettiBurstProps) {
  const { buildPieces } = useMentaStyles(createPaletteStyles);

  const motion = useMotionPreferences();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const pieces = useMemo(
    () => buildPieces(intensity === 'full' ? 38 : 20),
    [intensity, buildPieces]
  );

  if (motion.reduceMotion) return null;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize(current =>
      current.width === width && current.height === height
        ? current
        : { width, height }
    );
  };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.stage}
      onLayout={handleLayout}
      testID={testID}
    >
      {size.width > 0
        ? pieces.map((piece, index) => (
            <DelayedPiece
              key={index}
              piece={piece}
              width={size.width}
              height={size.height}
              durationMs={motion.duration(DURATION_MS)}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  piece: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  round: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
});

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const COLORS = [
    mentaColors.action,
    mentaColors.warning,
    mentaColors.success,
    mentaColors.paper,
    mentaColors.info,
  ];
  const buildPieces = (count: number): Piece[] =>
    Array.from({ length: count }, (_, index) => ({
      x: seeded(index + 1),
      drift: (seeded(index + 41) - 0.5) * 90,
      fall: 0.55 + seeded(index + 83) * 0.45,
      spin: (seeded(index + 127) - 0.5) * 720,
      delay: seeded(index + 173) * 260,
      round: index % 3 === 0,
      length: 10 + Math.round(seeded(index + 211) * 6),
      color: COLORS[index % COLORS.length],
    }));
  return { COLORS, buildPieces };
};
