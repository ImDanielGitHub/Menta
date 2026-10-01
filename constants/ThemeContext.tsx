import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import {
  Appearance,
  Platform,
  Dimensions,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { theme, colors, colorUtils, accessibility } from './colors';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';
import {
  mentaColors as darkMentaColors,
  mentaLightColors,
  type MentaPalette,
} from '@/constants/MentaDesignSystem';

import { MentaPaletteContext } from './use-menta-palette';
import { useAppearanceStore } from '@/store/appearance-store';

type ExtendedBackground = {
  primary: string;
  secondary: string;
  tertiary: string;
  card: string;
  surface: string;
  overlay: string;
};

type ExtendedText = {
  primary: string;
  secondary: string;
  tertiary: string;
  muted: string;
  placeholder: string;
  inverse: string;
  light?: string;
};

type ExtendedBorder = {
  primary: string;
  secondary: string;
  focus?: string;
  light: string;
};

type ExtendedInteractive = {
  primary: string;
  secondary: string;
  disabled: string;
};

type ExtendedBrand = {
  primary: string;
  secondary: string;
  orange: string;
  purple: string;
  success: string;
};

type ExtendedStatus = {
  success: string;
  warning: string;
  error: string;
  info: string;
};

type ModerationTokens = {
  pending: string;
  approved: string;
  rejected: string;
  reported: string;
  destructive: string;
};

export type AppColors = {
  primary: string;
  secondary: string;
  background: ExtendedBackground;
  text: ExtendedText;
  interactive: ExtendedInteractive;
  border: ExtendedBorder;
  status: ExtendedStatus;
  brand: ExtendedBrand;
  shadow: Record<string, string>;
  surface: Record<string, string>;
  accent: Record<string, string>;
  moderation: ModerationTokens;
  success: string;
  warning: string;
  error: string;
  info: string;
  onPrimary: string;
  feedback: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
};

// Extend shadow tokens with commonly used aliases across the app
export type ShadowTokens = typeof theme.shadows & {
  small: typeof theme.shadows.sm;
  medium: typeof theme.shadows.md;
  large: typeof theme.shadows.lg;
  soft: typeof theme.shadows.sm;
  strong: typeof theme.shadows.lg;
  none: Record<string, never>;
};

type ThemeGradients = {
  [Group in keyof typeof colors.gradients]: {
    [Role in keyof (typeof colors.gradients)[Group]]: readonly [
      string,
      string,
      ...string[],
    ];
  };
};

export interface ThemeContextType {
  colors: AppColors;
  gradients: ThemeGradients;
  spacing: typeof theme.spacing;
  typography: typeof theme.typography;
  borderRadius: typeof theme.borderRadius;
  shadows: ShadowTokens;
  isDark: boolean;
  mentaColors: MentaPalette;

  // Utilities
  colorUtils: typeof colorUtils;
  accessibility: typeof accessibility;

  // Responsive design utilities
  dimensions: {
    width: number;
    height: number;
    isTablet: boolean;
    isLandscape: boolean;
  };

  // Animation utilities
  transitions: {
    fast: number;
    normal: number;
    slow: number;
  };
}

// Default theme values
const getDefaultTheme = (
  themeSku?: string | null,
  dimensions = Dimensions.get('window'),
  isDark = true
): ThemeContextType => {
  const mentaColors = isDark ? darkMentaColors : mentaLightColors;
  const width = dimensions.width;
  const height = dimensions.height;
  const baseShadows = theme.shadows;
  const normalizedShadows: ShadowTokens = {
    ...baseShadows,
    small: baseShadows.sm || baseShadows.xs,
    medium: baseShadows.md || baseShadows.sm,
    large: baseShadows.lg || baseShadows.md,
    soft: baseShadows.sm || baseShadows.xs,
    strong: baseShadows.lg || baseShadows.md,
    none: {},
  };
  const textTokens = colors.text as ExtendedText;
  const equipped = getThemeAppearance(themeSku);
  // Shop colours were authored for dark backgrounds. Keep the equipped accent
  // in light mode, with a darker foreground and pale surfaces for contrast.
  const darken = (hex: string) =>
    '#' +
    [1, 3, 5]
      .map(offset =>
        Math.round(parseInt(hex.slice(offset, offset + 2), 16) * 0.48)
          .toString(16)
          .padStart(2, '0')
      )
      .join('');
  const tint = (hex: string) =>
    '#' +
    [245, 243, 250]
      .map((paper, index) =>
        Math.round(
          paper * 0.9 +
            parseInt(hex.slice(index * 2 + 1, index * 2 + 3), 16) * 0.1
        )
          .toString(16)
          .padStart(2, '0')
      )
      .join('');
  const appearance =
    equipped && !isDark
      ? {
          ...equipped,
          primary: darken(equipped.primary),
          secondary: darken(equipped.secondary),
          interactivePrimary: darken(equipped.interactivePrimary),
          interactiveSecondary: tint(equipped.primary),
          borderFocus: darken(equipped.primary),
          backgroundSecondary: mentaColors.surface,
          surfacePrimary: mentaColors.raised,
        }
      : equipped;
  const primary =
    appearance?.primary ?? (isDark ? mentaColors.paper : mentaColors.action);

  const themeColors: AppColors = {
    ...colors,
    primary,
    secondary: appearance?.secondary ?? mentaColors.action,
    background: {
      primary: mentaColors.canvas,
      secondary: appearance?.backgroundSecondary ?? mentaColors.surface,
      tertiary: appearance?.surfacePrimary ?? mentaColors.raised,
      card: appearance?.backgroundSecondary ?? mentaColors.surface,
      surface: appearance?.surfacePrimary ?? mentaColors.raised,
      overlay: mentaColors.scrim,
    },
    text: {
      primary: mentaColors.text.primary,
      secondary: mentaColors.text.secondary,
      tertiary: mentaColors.text.muted,
      muted: mentaColors.text.muted,
      placeholder: mentaColors.text.muted,
      inverse: isDark ? mentaColors.text.onPaper : mentaColors.paper,
      light: isDark ? textTokens.light : mentaColors.text.secondary,
    },
    border: {
      primary: mentaColors.border,
      secondary: mentaColors.border,
      focus: appearance?.borderFocus ?? mentaColors.action,
      light: mentaColors.border,
    },
    brand: {
      primary: isDark ? mentaColors.paper : mentaColors.action,
      secondary: mentaColors.text.secondary,
      orange: mentaColors.warning,
      purple: mentaColors.action,
      success: mentaColors.success,
    },
    interactive: {
      primary: appearance?.interactivePrimary ?? primary,
      secondary: appearance?.interactiveSecondary ?? mentaColors.raised,
      disabled: mentaColors.text.muted,
    },
    surface: {
      ...colors.surface,
      secondary: mentaColors.raised,
      hover: mentaColors.raised,
      active: mentaColors.border,
      disabled: mentaColors.raised,
      primary: appearance?.surfacePrimary ?? mentaColors.raised,
    },
    accent: {
      ...colors.accent,
      primary: appearance?.interactivePrimary ?? mentaColors.action,
      background: appearance?.interactiveSecondary ?? mentaColors.actionSoft,
    },
    shadow: {
      ...colors.shadow,
    },
    status: {
      success: mentaColors.success,
      warning: mentaColors.warning,
      error: mentaColors.danger,
      info: mentaColors.info,
    },
    moderation: {
      pending: mentaColors.warning,
      approved: mentaColors.success,
      rejected: mentaColors.danger,
      reported: mentaColors.info,
      destructive: mentaColors.danger,
    },
    success: mentaColors.success,
    warning: mentaColors.warning,
    error: mentaColors.danger,
    info: mentaColors.info,
    onPrimary: isDark ? mentaColors.text.onPaper : mentaColors.paper,
    feedback: {
      success: mentaColors.success,
      warning: mentaColors.warning,
      error: mentaColors.danger,
      info: mentaColors.info,
    },
  };

  return {
    colors: themeColors,
    gradients: {
      ...colors.gradients,
      background: {
        primary: [mentaColors.canvas, mentaColors.canvas],
        header: [mentaColors.canvas, mentaColors.surface],
        subtle: [mentaColors.canvas, mentaColors.raised],
        card: [mentaColors.surface, mentaColors.raised],
        surface: [mentaColors.raised, mentaColors.surface],
        screen: [mentaColors.canvas, mentaColors.canvas],
      },
      share: {
        ...colors.gradients.share,
        card: [mentaColors.surface, mentaColors.raised],
      },
    },
    spacing: theme.spacing,
    typography: theme.typography,
    borderRadius: theme.borderRadius,
    shadows: normalizedShadows,
    isDark,
    mentaColors,
    colorUtils,
    accessibility,

    dimensions: {
      width,
      height,
      isTablet: width > 768,
      isLandscape: width > height,
    },

    transitions: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
  };
};

// Create theme context
const ThemeContext = createContext<ThemeContextType>(getDefaultTheme());

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
  equippedThemeSku?: string | null;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  equippedThemeSku,
}) => {
  const { fontScale, height, scale, width } = useWindowDimensions();
  const preference = useAppearanceStore(state => state.preference);
  const colorScheme = useColorScheme();
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // The automatic native configuration allows clearing an explicit override.
      Appearance.setColorScheme(
        preference === 'system' ? 'unspecified' : preference
      );
    }
  }, [preference]);
  const isDark =
    preference === 'system' ? colorScheme !== 'light' : preference === 'dark';
  const themeValue = useMemo(
    () =>
      getDefaultTheme(
        equippedThemeSku,
        {
          fontScale,
          height,
          scale,
          width,
        },
        isDark
      ),
    [equippedThemeSku, fontScale, height, scale, width, isDark]
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <MentaPaletteContext.Provider value={themeValue.mentaColors}>
        {children}
      </MentaPaletteContext.Provider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  // Add safety check for colors property
  if (!context.colors) {
    console.error('Theme context colors is undefined:', context);
    throw new Error(
      'Theme context colors is undefined - theme may not be properly initialized'
    );
  }

  return context;
};

// Utility hook for creating themed styles
export const useThemedStyles = <T,>(
  createStyles: (theme: ThemeContextType) => T
): T => {
  const theme = useTheme();
  return useMemo(() => createStyles(theme), [theme, createStyles]);
};

export default ThemeContext;
