import { useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { accessibility, palette } from './colors';

export interface AccessibleColorResult {
  color: string;
  contrast: number;
  isAccessible: boolean;
  level: 'FAIL' | 'AA' | 'AAA';
}

export interface AccessibilityValidation {
  foreground: string;
  background: string;
  contrast: number;
  isAccessible: boolean;
  wcagLevel: 'FAIL' | 'AA' | 'AAA';
  recommendations?: {
    lightAlternatives: string[];
    darkAlternatives: string[];
  };
}

// Hook for accessible color selection and validation
export const useAccessibleColors = () => {
  const { colors, isDark } = useTheme();

  // Get the best accessible color for text on a given background
  const getAccessibleTextColor = useMemo(() => {
    return (backgroundColor: string, preferredColor?: string): AccessibleColorResult => {
      // If a preferred color is provided, check if it's accessible
      if (preferredColor) {
        const contrast = accessibility.getContrastRatio(preferredColor, backgroundColor);
        const isAccessible = accessibility.isAccessible(preferredColor, backgroundColor);
        
        if (isAccessible) {
          return {
            color: preferredColor,
            contrast,
            isAccessible,
            level: contrast >= 7 ? 'AAA' : 'AA',
          };
        }
      }

      // Try primary text colors
      const textOptions = [
        colors.text.primary,
        colors.text.secondary,
        colors.text.inverse,
        '#000000', // Pure black
        '#ffffff', // Pure white
      ];

      for (const textColor of textOptions) {
        const contrast = accessibility.getContrastRatio(textColor, backgroundColor);
        if (accessibility.isAccessible(textColor, backgroundColor)) {
          return {
            color: textColor,
            contrast,
            isAccessible: true,
            level: contrast >= 7 ? 'AAA' : 'AA',
          };
        }
      }

      // Fallback to highest contrast option
      const contrastResults = textOptions.map(color => ({
        color,
        contrast: accessibility.getContrastRatio(color, backgroundColor),
        isAccessible: accessibility.isAccessible(color, backgroundColor),
        level: accessibility.getContrastRatio(color, backgroundColor) >= 7 ? 'AAA' as const : 
               accessibility.getContrastRatio(color, backgroundColor) >= 4.5 ? 'AA' as const : 'FAIL' as const,
      }));

      return contrastResults.reduce((best, current) => 
        current.contrast > best.contrast ? current : best
      );
    };
  }, [colors, isDark]);

  // Validate a color combination
  const validateColorCombination = useMemo(() => {
    return (foreground: string, background: string): AccessibilityValidation => {
      const contrast = accessibility.getContrastRatio(foreground, background);
      const isAccessible = accessibility.isAccessible(foreground, background);
      
      let wcagLevel: 'FAIL' | 'AA' | 'AAA' = 'FAIL';
      if (contrast >= 7) wcagLevel = 'AAA';
      else if (contrast >= 4.5) wcagLevel = 'AA';

      const result: AccessibilityValidation = {
        foreground,
        background,
        contrast,
        isAccessible,
        wcagLevel,
      };

      // Provide recommendations if not accessible
      if (!isAccessible) {
        const colorValues = Object.values(palette.gray);
        
        result.recommendations = {
          lightAlternatives: colorValues
            .filter(color => accessibility.isAccessible(color, background))
            .slice(0, 3),
          darkAlternatives: colorValues
            .reverse()
            .filter(color => accessibility.isAccessible(color, background))
            .slice(0, 3),
        };
      }

      return result;
    };
  }, []);

  // Get theme-appropriate colors with accessibility validation
  const getAccessibleColors = useMemo(() => {
    return {
      // Primary actions - guaranteed to be accessible
      primaryAction: {
        background: colors.primary,
        text: getAccessibleTextColor(colors.primary).color,
      },
      
      // Secondary actions
      secondaryAction: {
        background: colors.secondary,
        text: getAccessibleTextColor(colors.secondary).color,
      },
      
      // Status colors - accessible versions
      success: {
        background: colors.status.success,
        text: getAccessibleTextColor(colors.status.success).color,
      },
      
      error: {
        background: colors.status.error,
        text: getAccessibleTextColor(colors.status.error).color,
      },
      
      warning: {
        background: colors.status.warning,
        text: getAccessibleTextColor(colors.status.warning).color,
      },
      
      info: {
        background: colors.status.info,
        text: getAccessibleTextColor(colors.status.info).color,
      },
      
      // Surface colors with guaranteed readability
      surface: {
        primary: {
          background: colors.background.primary,
          text: colors.text.primary,
        },
        secondary: {
          background: colors.background.secondary,
          text: colors.text.primary,
        },
        elevated: {
          background: colors.background.surface,
          text: colors.text.primary,
        },
      },
    };
  }, [colors, getAccessibleTextColor]);

  // Utility to automatically adjust color for better accessibility
  const makeAccessible = useMemo(() => {
    return (foreground: string, background: string, targetLevel: 'AA' | 'AAA' = 'AA'): string => {
      const current = accessibility.getContrastRatio(foreground, background);
      const threshold = targetLevel === 'AAA' ? 7 : 4.5;
      
      if (current >= threshold) {
        return foreground; // Already accessible
      }

      // Try to find a similar color that meets accessibility standards
      const foregroundRgb = hexToRgb(foreground);
      if (!foregroundRgb) return foreground;

      // Gradually darken or lighten the color until it becomes accessible
      let attempts = 0;
      let adjustedColor = foreground;
      
      while (attempts < 50) { // Prevent infinite loops
        const factor = isDark ? 1.1 : 0.9; // Lighten for dark theme, darken for light theme
        
        foregroundRgb.r = Math.min(255, Math.max(0, Math.round(foregroundRgb.r * factor)));
        foregroundRgb.g = Math.min(255, Math.max(0, Math.round(foregroundRgb.g * factor)));
        foregroundRgb.b = Math.min(255, Math.max(0, Math.round(foregroundRgb.b * factor)));
        
        adjustedColor = `#${foregroundRgb.r.toString(16).padStart(2, '0')}${foregroundRgb.g.toString(16).padStart(2, '0')}${foregroundRgb.b.toString(16).padStart(2, '0')}`;
        
        if (accessibility.getContrastRatio(adjustedColor, background) >= threshold) {
          return adjustedColor;
        }
        
        attempts++;
      }
      
      // Fallback to high contrast colors
      return isDark ? '#ffffff' : '#000000';
    };
  }, [isDark]);

  return {
    getAccessibleTextColor,
    validateColorCombination,
    getAccessibleColors,
    makeAccessible,
    contrastRatio: accessibility.getContrastRatio,
    isAccessible: accessibility.isAccessible,
  };
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export default useAccessibleColors; 
