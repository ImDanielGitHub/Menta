import { useState, useEffect, useMemo } from 'react';
import { Dimensions, Platform } from 'react-native';
import { mentaBreakpoints } from '@/constants/MentaDesignSystem';
import {
  IPAD_SPACING_MULTIPLIER,
  IPAD_FONT_SCALE_MULTIPLIER,
  IPAD_MAX_CONTENT_WIDTH,
  IPAD_BOTTOM_PADDING_MULTIPLIER,
} from '@/constants/responsive-layout';

// iPad detection - exported for use across the app
export const isIPad = Platform.OS === 'ios' && Platform.isPad;

// Re-export shared responsive constants for compatibility with existing imports.
export {
  IPAD_SPACING_MULTIPLIER,
  IPAD_FONT_SCALE_MULTIPLIER,
  IPAD_MAX_CONTENT_WIDTH,
  IPAD_BOTTOM_PADDING_MULTIPLIER,
};

export interface ScreenDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface ResponsiveConfig {
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
  isTablet: boolean;
  isPhone: boolean;
  isIPad: boolean;
  orientation: 'portrait' | 'landscape';
  breakpoint: 'sm' | 'md' | 'lg' | 'xl';
}

// Hook for responsive design
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        scale: window.scale,
        fontScale: window.fontScale,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Memoized responsive configuration
  const responsive = useMemo((): ResponsiveConfig => {
    const { width, height } = dimensions;
    const isLandscape = width > height;

    // Determine device type and breakpoints
    const isTablet = Math.min(width, height) >= mentaBreakpoints.md;
    const isPhone = !isTablet;

    // Breakpoint detection
    let breakpoint: 'sm' | 'md' | 'lg' | 'xl';
    if (width >= mentaBreakpoints.xl) breakpoint = 'xl';
    else if (width >= mentaBreakpoints.lg) breakpoint = 'lg';
    else if (width >= mentaBreakpoints.md) breakpoint = 'md';
    else breakpoint = 'sm';

    return {
      isSmall: width < mentaBreakpoints.sm,
      isMedium: width >= mentaBreakpoints.sm && width < mentaBreakpoints.md,
      isLarge: width >= mentaBreakpoints.md && width < mentaBreakpoints.lg,
      isXLarge: width >= mentaBreakpoints.xl,
      isTablet,
      isPhone,
      isIPad,
      orientation: isLandscape ? 'landscape' : 'portrait',
      breakpoint,
    };
  }, [dimensions]);

  // Responsive styling utilities
  const getResponsiveValue = useMemo(() => {
    return <T>(values: { sm?: T; md?: T; lg?: T; xl?: T; default: T }): T => {
      const { breakpoint } = responsive;
      return values[breakpoint] ?? values.default;
    };
  }, [responsive]);

  // Get spacing based on screen size
  const getResponsiveSpacing = useMemo(() => {
    return (baseSpacing: number): number => {
      const multiplier = responsive.isTablet ? IPAD_SPACING_MULTIPLIER : 1;
      return baseSpacing * multiplier;
    };
  }, [responsive]);

  // Get iPad-specific spacing (only applies multiplier on iPad)
  const getIPadSpacing = useMemo(() => {
    return (baseSpacing: number): number => {
      return isIPad ? baseSpacing * IPAD_SPACING_MULTIPLIER : baseSpacing;
    };
  }, []);

  // Get iPad-specific value (returns iPad value on iPad, default otherwise)
  const getIPadValue = useMemo(() => {
    return <T>(values: { iPad: T; default: T }): T => {
      return isIPad ? values.iPad : values.default;
    };
  }, []);

  // Get font size based on screen size and font scale
  const getResponsiveFontSize = useMemo(() => {
    return (baseFontSize: number): number => {
      const { fontScale } = dimensions;
      const deviceMultiplier = isIPad
        ? IPAD_FONT_SCALE_MULTIPLIER
        : responsive.isTablet
          ? 1.1
          : 1;

      // Limit font scaling to prevent extremely large text
      const limitedFontScale = Math.min(fontScale, 1.3);

      return baseFontSize * deviceMultiplier * limitedFontScale;
    };
  }, [dimensions, responsive]);

  // Get grid columns based on screen size
  const getGridColumns = useMemo(() => {
    return (options?: {
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    }): number => {
      const defaultColumns = {
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4,
      };

      const columns = { ...defaultColumns, ...options };
      return getResponsiveValue({ ...columns, default: 2 });
    };
  }, [getResponsiveValue]);

  // Platform-specific responsive values
  const getPlatformValue = useMemo(() => {
    return <T>(values: { ios?: T; android?: T; web?: T; default: T }): T => {
      if (Platform.OS === 'ios') return values.ios ?? values.default;
      if (Platform.OS === 'android') return values.android ?? values.default;
      if (Platform.OS === 'web') return values.web ?? values.default;
      return values.default;
    };
  }, []);

  return {
    ...dimensions,
    ...responsive,
    getResponsiveValue,
    getResponsiveSpacing,
    getResponsiveFontSize,
    getGridColumns,
    getPlatformValue,
    getIPadSpacing,
    getIPadValue,
  };
};

// Utility function to create responsive styles
export const createResponsiveStyles = <T extends Record<string, unknown>>(
  createStyles: (responsive: ReturnType<typeof useResponsive>) => T
) => {
  return () => {
    const responsive = useResponsive();
    return useMemo(() => createStyles(responsive), [responsive]);
  };
};

// Pre-defined responsive breakpoint utilities
export const bp = {
  up: (size: keyof typeof mentaBreakpoints) => (width: number) =>
    width >= mentaBreakpoints[size],

  down: (size: keyof typeof mentaBreakpoints) => (width: number) =>
    width < mentaBreakpoints[size],

  between:
    (min: keyof typeof mentaBreakpoints, max: keyof typeof mentaBreakpoints) =>
    (width: number) =>
      width >= mentaBreakpoints[min] && width < mentaBreakpoints[max],

  only: (size: keyof typeof mentaBreakpoints) => {
    const sizes = Object.keys(
      mentaBreakpoints
    ) as (keyof typeof mentaBreakpoints)[];
    const currentIndex = sizes.indexOf(size);
    const nextSize = sizes[currentIndex + 1];

    return (width: number) => {
      if (!nextSize) return width >= mentaBreakpoints[size];
      return (
        width >= mentaBreakpoints[size] && width < mentaBreakpoints[nextSize]
      );
    };
  },
};

// Type-safe responsive props helper
export interface ResponsiveProp<T> {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default?: T;
}

export const resolveResponsiveProp = <T>(
  prop: T | ResponsiveProp<T>,
  responsive: ResponsiveConfig
): T => {
  if (typeof prop !== 'object' || prop === null) {
    return prop;
  }

  const responsiveProp = prop as ResponsiveProp<T>;

  if (responsive.isXLarge && responsiveProp.xl !== undefined)
    return responsiveProp.xl;
  if (responsive.isLarge && responsiveProp.lg !== undefined)
    return responsiveProp.lg;
  if (responsive.isMedium && responsiveProp.md !== undefined)
    return responsiveProp.md;
  if (responsive.isSmall && responsiveProp.sm !== undefined)
    return responsiveProp.sm;

  return responsiveProp.default ?? (prop as T);
};

export default useResponsive;
