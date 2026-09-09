/**
 * Accessibility Utilities
 * WCAG 2.2 AA compliance helpers and accessibility enhancements
 */

import { AccessibilityInfo, Platform, useWindowDimensions } from 'react-native';
import { useEffect, useState, useCallback, type RefObject } from 'react';

// WCAG 2.2 AA Compliance Constants
export const WCAG_COMPLIANCE = {
  // Minimum contrast ratios
  CONTRAST_RATIOS: {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3.0,
    NON_TEXT: 3.0,
  },

  // Minimum touch target sizes (44pt minimum)
  TOUCH_TARGET: {
    MINIMUM: 44,
    RECOMMENDED: 48,
  },

  // Text size requirements
  TEXT_SIZE: {
    MINIMUM: 12,
    LARGE_TEXT_THRESHOLD: 18,
    LARGE_BOLD_THRESHOLD: 14,
  },

  // Timing requirements (in milliseconds)
  TIMING: {
    FOCUS_TIMEOUT: 3000,
    AUTO_DISMISS_MINIMUM: 5000,
    ANIMATION_DURATION_MAX: 5000,
  },
} as const;

// Screen reader announcements
export const SCREEN_READER = {
  ANNOUNCE_DELAY: 100,
  POLITENESS_LEVELS: {
    POLITE: 'polite' as const,
    ASSERTIVE: 'assertive' as const,
  },
} as const;

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): number {
  const getLuminance = (color: string): number => {
    // Remove # if present
    const hex = color.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const required = isLargeText
    ? WCAG_COMPLIANCE.CONTRAST_RATIOS.LARGE_TEXT
    : WCAG_COMPLIANCE.CONTRAST_RATIOS.NORMAL_TEXT;

  return ratio >= required;
}

/**
 * Generate accessible color alternatives
 */
export function getAccessibleColor(
  baseColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): string {
  if (meetsWCAGAA(baseColor, backgroundColor, isLargeText)) {
    return baseColor;
  }

  // Try darker versions
  const darkerColors = [
    adjustColorBrightness(baseColor, -0.1),
    adjustColorBrightness(baseColor, -0.2),
    adjustColorBrightness(baseColor, -0.3),
    adjustColorBrightness(baseColor, -0.4),
    adjustColorBrightness(baseColor, -0.5),
  ];

  for (const color of darkerColors) {
    if (meetsWCAGAA(color, backgroundColor, isLargeText)) {
      return color;
    }
  }

  // Try lighter versions
  const lighterColors = [
    adjustColorBrightness(baseColor, 0.1),
    adjustColorBrightness(baseColor, 0.2),
    adjustColorBrightness(baseColor, 0.3),
    adjustColorBrightness(baseColor, 0.4),
    adjustColorBrightness(baseColor, 0.5),
  ];

  for (const color of lighterColors) {
    if (meetsWCAGAA(color, backgroundColor, isLargeText)) {
      return color;
    }
  }

  // Fallback to high contrast colors
  return backgroundColor === '#FFFFFF' || backgroundColor === '#ffffff'
    ? '#000000'
    : '#FFFFFF';
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(color: string, factor: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const adjust = (value: number) => {
    const adjusted = Math.round(value + (255 - value) * factor);
    return Math.max(0, Math.min(255, adjusted));
  };

  const newR = adjust(r).toString(16).padStart(2, '0');
  const newG = adjust(g).toString(16).padStart(2, '0');
  const newB = adjust(b).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
}

/**
 * Validate touch target size
 */
export function validateTouchTarget(
  width: number,
  height: number
): {
  isValid: boolean;
  recommendation?: string;
} {
  const minSize = WCAG_COMPLIANCE.TOUCH_TARGET.MINIMUM;
  const recSize = WCAG_COMPLIANCE.TOUCH_TARGET.RECOMMENDED;

  if (width >= minSize && height >= minSize) {
    return { isValid: true };
  }

  return {
    isValid: false,
    recommendation: `Touch target should be at least ${minSize}x${minSize}pt. Consider ${recSize}x${recSize}pt for better usability.`,
  };
}

/**
 * Generate accessibility labels
 */
export function generateAccessibilityLabel(
  label: string,
  role?: string,
  state?: string,
  hint?: string
): string {
  const parts = [label];

  if (role) {
    parts.push(role);
  }

  if (state) {
    parts.push(state);
  }

  if (hint) {
    parts.push(hint);
  }

  return parts.join(', ');
}

/**
 * Joins visible title, subtitle, and value copy into one VoiceOver name.
 * Does not include role or state; those belong on accessibilityRole/State.
 */
export function composeSpokenLabel(
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .flatMap(part => {
      if (typeof part !== 'string') {
        return [];
      }

      const trimmed = part.trim().replace(/[.]+$/u, '');
      return trimmed ? [trimmed] : [];
    })
    .join('. ');
}

/** Apple's "larger text" band where single-line chrome starts clipping. */
export const LARGE_TYPE_WRAP_SCALE = 1.3;

export function allowsLargeTypeWrap(fontScale: number): boolean {
  return fontScale >= LARGE_TYPE_WRAP_SCALE;
}

export function useLargeTypeLineLimit(
  compactLines: number
): number | undefined {
  const { fontScale } = useWindowDimensions();
  return allowsLargeTypeWrap(fontScale) ? undefined : compactLines;
}

/**
 * Screen reader announcement utility
 */
export function announceToScreenReader(
  message: string,
  _politeness: 'polite' | 'assertive' = 'polite'
): void {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else {
    // Android implementation
    setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
    }, SCREEN_READER.ANNOUNCE_DELAY);
  }
}

/**
 * Hook for screen reader detection
 */
export function useScreenReader() {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    // Check screen reader status
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);

    // Check reduce motion preference
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);

    // Listen for changes
    const screenReaderChangedListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    const reduceMotionChangedListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      screenReaderChangedListener?.remove();
      reduceMotionChangedListener?.remove();
    };
  }, []);

  const announce = useCallback(
    (message: string, politeness?: 'polite' | 'assertive') => {
      if (isScreenReaderEnabled) {
        announceToScreenReader(message, politeness);
      }
    },
    [isScreenReaderEnabled]
  );

  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    announce,
  };
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const setFocus = useCallback((elementId: string) => {
    setFocusedElement(elementId);

    // Auto-clear focus after timeout to prevent stuck focus
    setTimeout(() => {
      setFocusedElement(null);
    }, WCAG_COMPLIANCE.TIMING.FOCUS_TIMEOUT);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedElement(null);
  }, []);

  return {
    focusedElement,
    setFocus,
    clearFocus,
  };
}

/**
 * Accessible form validation
 */
export function createAccessibleFormValidation(
  fieldName: string,
  errors: string[]
): {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityInvalid?: boolean;
  accessibilityErrorMessage?: string;
} {
  const hasErrors = errors.length > 0;

  return {
    accessibilityLabel: fieldName,
    accessibilityHint: hasErrors
      ? undefined
      : `Enter ${fieldName.toLowerCase()}`,
    accessibilityInvalid: hasErrors,
    accessibilityErrorMessage: hasErrors ? errors.join('. ') : undefined,
  };
}

/**
 * Keyboard navigation helpers
 */
export const KEYBOARD_NAVIGATION = {
  // Focus order management
  getFocusOrder: (elements: string[]): string[] => {
    return elements.filter(Boolean).sort();
  },

  // Tab index management
  getTabIndex: (isDisabled: boolean, isHidden: boolean): number => {
    if (isDisabled || isHidden) return -1;
    return 0;
  },

  // Focus trap for modals (no-op on native; web not supported)
  createFocusTrap: (_containerRef: RefObject<unknown>) => {
    return {
      trapFocus: () => {
        // Native platforms manage focus differently; no-op cleanup.
        return () => undefined;
      },
    };
  },
} as const;

/**
 * Accessible animation utilities
 */
export function getAccessibleAnimationDuration(
  defaultDuration: number,
  isReduceMotionEnabled: boolean
): number {
  if (isReduceMotionEnabled) {
    return Math.min(defaultDuration * 0.1, 100); // Significantly reduce animation time
  }

  return Math.min(
    defaultDuration,
    WCAG_COMPLIANCE.TIMING.ANIMATION_DURATION_MAX
  );
}

/**
 * High contrast mode detection
 */
export function useHighContrast() {
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);

  useEffect(() => {
    // This would typically check system preferences
    // Implementation varies by platform
    const checkHighContrast = () => {
      // Placeholder for high contrast detection
      // In a real implementation, this would check system settings
      setIsHighContrastEnabled(false);
    };

    checkHighContrast();
  }, []);

  return isHighContrastEnabled;
}

export default {
  WCAG_COMPLIANCE,
  SCREEN_READER,
  KEYBOARD_NAVIGATION,
  calculateContrastRatio,
  meetsWCAGAA,
  getAccessibleColor,
  validateTouchTarget,
  generateAccessibilityLabel,
  composeSpokenLabel,
  allowsLargeTypeWrap,
  useLargeTypeLineLimit,
  announceToScreenReader,
  useScreenReader,
  useFocusManagement,
  createAccessibleFormValidation,
  getAccessibleAnimationDuration,
  useHighContrast,
};
