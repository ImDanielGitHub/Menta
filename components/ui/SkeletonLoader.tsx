import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  type DimensionValue,
  Easing,
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import {
  getAccessibleAnimationDuration,
  useScreenReader,
} from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization/use-translation';

export interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Reserved for an explicit retry/load-on-demand affordance. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Announce one composed loading region rather than every decorative bone. */
  announce?: boolean;
  testID?: string;
}

/**
 * Canonical Paper-state skeleton primitive.
 *
 * Routes compose this primitive into the exact final-content geometry from the
 * live Paper loading artboard. It deliberately does not provide a generic
 * card/list preset: loading should not invent a different layout.
 */
export const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = mentaRadii.small,
  style,
  children,
  onPress,
  accessibilityLabel,
  announce = true,
  testID,
}: SkeletonLoaderProps) => {
  const { t } = useTranslation();
  const resolvedAccessibilityLabel =
    accessibilityLabel ??
    (onPress
      ? t('shared.accessibility.loadingRetry')
      : t('shared.accessibility.loading'));
  const { isReduceMotionEnabled } = useScreenReader();
  const shimmer = useRef(new Animated.Value(0)).current;
  const [layoutWidth, setLayoutWidth] = useState(0);

  useEffect(() => {
    if (isReduceMotionEnabled) {
      shimmer.setValue(0.5);
      return;
    }

    const duration = getAccessibleAnimationDuration(
      1800,
      isReduceMotionEnabled
    );
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        isInteraction: false,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [isReduceMotionEnabled, shimmer]);

  const shimmerWidth = Math.max(layoutWidth * 0.46, 32);
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-shimmerWidth, layoutWidth + shimmerWidth],
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setLayoutWidth(currentWidth =>
      Math.abs(currentWidth - nextWidth) > 0.5 ? nextWidth : currentWidth
    );
  };

  const skeleton = (
    <View
      testID={onPress ? undefined : testID}
      accessible={!onPress && announce}
      accessibilityLabel={
        !onPress && announce ? resolvedAccessibilityLabel : undefined
      }
      accessibilityRole={!onPress && announce ? 'progressbar' : undefined}
      onLayout={handleLayout}
      style={[styles.skeleton, { width, height, borderRadius }, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          { width: shimmerWidth },
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(41, 42, 42, 0)',
            mentaColors.skeletonHighlight,
            'rgba(41, 42, 42, 0)',
          ]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {children}
    </View>
  );

  if (!onPress) return skeleton;

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.retryTarget}
    >
      {skeleton}
    </Pressable>
  );
};

export const SkeletonText = ({
  lines = 1,
  width = '100%',
  style,
  announce = true,
}: {
  lines?: number;
  width?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  /** Let a composed parent own the single progress announcement. */
  announce?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <View
      accessible={announce}
      accessibilityLabel={
        announce ? t('shared.accessibility.loadingText') : undefined
      }
      accessibilityRole={announce ? 'progressbar' : undefined}
      importantForAccessibility={announce ? 'auto' : 'no'}
      style={style}
    >
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonLoader
          announce={false}
          key={index}
          width={index === lines - 1 && lines > 1 ? '72%' : width}
          height={16}
          style={index < lines - 1 ? styles.textLine : undefined}
        />
      ))}
    </View>
  );
};

export const SkeletonButton = ({
  width = '100%',
  style,
}: {
  width?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) => (
  <SkeletonLoader
    width={width}
    height={56}
    borderRadius={mentaRadii.medium}
    style={style}
  />
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: mentaColors.skeleton,
    overflow: 'hidden',
  },
  shimmer: {
    bottom: 0,
    opacity: 0.72,
    position: 'absolute',
    top: 0,
  },
  retryTarget: {
    minHeight: 44,
    minWidth: 44,
  },
  textLine: {
    marginBottom: mentaSpacing[2],
  },
});

export default SkeletonLoader;
