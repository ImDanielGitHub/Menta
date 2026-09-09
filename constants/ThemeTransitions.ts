import React, { useCallback, useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from './ThemeContext';

export interface ThemeTransitionConfig {
  duration?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
}

export const defaultTransitionConfig: ThemeTransitionConfig = {
  duration: 300,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design standard easing
  useNativeDriver: false, // Can't use native driver for color animations
};

// Hook for smooth theme transitions
export const useThemeTransition = (config: ThemeTransitionConfig = defaultTransitionConfig) => {
  const { isDark } = useTheme();
  const transitionValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (isTransitioning.current) return;
    
    isTransitioning.current = true;
    
    Animated.timing(transitionValue, {
      toValue: isDark ? 1 : 0,
      duration: config.duration,
      easing: config.easing,
      useNativeDriver: config.useNativeDriver ?? false,
    }).start(() => {
      isTransitioning.current = false;
    });
  }, [isDark, transitionValue, config]);

  const interpolateColor = useCallback(
    (lightColor: string, darkColor: string) => {
      return transitionValue.interpolate({
        inputRange: [0, 1],
        outputRange: [lightColor, darkColor],
        extrapolate: 'clamp',
      });
    },
    [transitionValue]
  );

  const interpolateValue = useCallback(
    (lightValue: number, darkValue: number) => {
      return transitionValue.interpolate({
        inputRange: [0, 1],
        outputRange: [lightValue, darkValue],
        extrapolate: 'clamp',
      });
    },
    [transitionValue]
  );

  return {
    transitionValue,
    interpolateColor,
    interpolateValue,
    isTransitioning: isTransitioning.current,
  };
};

// Enhanced animated theme-aware component wrapper
export const withThemeTransition = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P & { transitionConfig?: ThemeTransitionConfig }>((props, ref) => {
    const { transitionConfig, ...restProps } = props;
    const transition = useThemeTransition(transitionConfig);
    
    return React.createElement(Component, {
      ...(restProps as P),
      ref,
      themeTransition: transition,
    });
  });
};

// Predefined transition presets
export const transitionPresets = {
  instant: { duration: 0 },
  fast: { duration: 150 },
  normal: { duration: 300 },
  slow: { duration: 500 },
  custom: (duration: number, easing?: (value: number) => number) => ({
    duration,
    easing: easing || Easing.bezier(0.4, 0.0, 0.2, 1),
  }),
} as const;