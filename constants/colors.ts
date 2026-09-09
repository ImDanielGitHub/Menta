// Monochrome theme primitives built on top of the Design System Delta
// Provides backward-compatible exports for legacy consumers (palette, theme, etc.)

import {
  palette as designPalette,
  spacing as spacingScale,
  typography as typographyTokens,
  borderRadius as borderRadiusTokens,
  shadows as shadowTokens,
  createMinimalGradients,
  createSemanticColors,
} from './DesignSystem';

export const palette = designPalette;

const semantic = createSemanticColors(true);
const gradients = createMinimalGradients(true);

export const colors = {
  primary: palette.brand.primary,
  secondary: palette.brand.secondary,
  background: {
    primary: semantic.background.primary,
    secondary: semantic.background.secondary,
    card: semantic.background.card,
    surface: semantic.surface.primary,
    tertiary: semantic.surface.secondary,
    overlay: semantic.background.overlay,
  },
  text: {
    ...semantic.text,
    light: semantic.text.secondary,
  },
  interactive: semantic.interactive,
  border: {
    primary: semantic.border.primary,
    secondary: semantic.border.secondary,
  },
  status: semantic.status,
  brand: semantic.brand,
  shadow: semantic.shadow,
  surface: semantic.surface,
  accent: {
    primary: semantic.interactive.primary,
    blue: palette.brand.primary,
    green: palette.brand.success,
    red: palette.brand.danger,
    amber: palette.brand.orange,
    purple: palette.brand.purple,
    purpleSoft: 'rgba(167, 139, 250, 0.14)',
    background: semantic.interactive.secondary,
  },
  gradients,
};

export const theme = {
  colors,
  typography: {
    sizes: {
      xs: typographyTokens.fontSizes.xs,
      sm: typographyTokens.fontSizes.sm,
      md: typographyTokens.fontSizes.base,
      base: typographyTokens.fontSizes.base,
      lg: typographyTokens.fontSizes.lg,
      xl: typographyTokens.fontSizes.xl,
      '2xl': typographyTokens.fontSizes['2xl'],
      '3xl': typographyTokens.fontSizes['3xl'],
      '4xl': typographyTokens.fontSizes['4xl'],
      '5xl': typographyTokens.fontSizes['5xl'],
      '6xl': typographyTokens.fontSizes['6xl'],
    },
    weights: {
      thin: typographyTokens.fontWeights.thin,
      extralight: typographyTokens.fontWeights.extralight,
      light: typographyTokens.fontWeights.light,
      regular: typographyTokens.fontWeights.regular,
      medium: typographyTokens.fontWeights.medium,
      semibold: typographyTokens.fontWeights.semibold,
      bold: typographyTokens.fontWeights.bold,
      extrabold: typographyTokens.fontWeights.extrabold,
      black: typographyTokens.fontWeights.black,
    },
    fontWeights: typographyTokens.fontWeights,
    lineHeights: {
      tight: typographyTokens.lineHeights.tight,
      normal: typographyTokens.lineHeights.normal,
      relaxed: typographyTokens.lineHeights.relaxed,
      loose: typographyTokens.lineHeights.loose,
    },
    display: {
      fontSize: typographyTokens.fontSizes['5xl'],
      lineHeight: typographyTokens.fontSizes['5xl'] * 1.08,
      fontWeight: typographyTokens.fontWeights.light,
    },
    h1: {
      fontSize: typographyTokens.fontSizes['4xl'],
      lineHeight: typographyTokens.fontSizes['4xl'] * 1.12,
      fontWeight: typographyTokens.fontWeights.light,
    },
    h2: {
      fontSize: typographyTokens.fontSizes['3xl'],
      lineHeight: typographyTokens.fontSizes['3xl'] * 1.16,
      fontWeight: typographyTokens.fontWeights.medium,
    },
    h3: {
      fontSize: typographyTokens.fontSizes['2xl'],
      lineHeight: typographyTokens.fontSizes['2xl'] * 1.18,
      fontWeight: typographyTokens.fontWeights.medium,
    },
    h4: {
      fontSize: typographyTokens.fontSizes.xl,
      lineHeight: typographyTokens.fontSizes.xl * 1.2,
      fontWeight: typographyTokens.fontWeights.medium,
    },
    heading: {
      fontSize: typographyTokens.fontSizes.xl,
      lineHeight: typographyTokens.fontSizes.xl * 1.2,
      fontWeight: typographyTokens.fontWeights.medium,
    },
    subheading: {
      fontSize: typographyTokens.fontSizes.base,
      lineHeight: typographyTokens.fontSizes.base * 1.35,
      fontWeight: typographyTokens.fontWeights.medium,
    },
    body: {
      fontSize: typographyTokens.fontSizes.base,
      lineHeight: typographyTokens.fontSizes.base * 1.45,
      fontWeight: typographyTokens.fontWeights.regular,
    },
    caption: {
      fontSize: typographyTokens.fontSizes.sm,
      lineHeight: typographyTokens.fontSizes.sm * 1.35,
      fontWeight: typographyTokens.fontWeights.regular,
    },
    overline: {
      fontSize: typographyTokens.fontSizes.xs,
      lineHeight: typographyTokens.fontSizes.xs * 1.35,
      fontWeight: typographyTokens.fontWeights.semibold,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
  },
  spacing: spacingScale,
  borderRadius: borderRadiusTokens,
  shadows: {
    xs: shadowTokens.xs,
    sm: shadowTokens.sm,
    md: shadowTokens.md,
    lg: shadowTokens.lg,
  },
};

export const colorUtils = {
  withOpacity: (color: string, opacity: number) =>
    `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`,

  parseColor: (color: string): { r: number; g: number; b: number } | null => {
    if (!color) return null;
    const hex = color.trim();
    if (hex.startsWith('#')) {
      const normalized = hex.slice(1);
      if (normalized.length === 3) {
        const r = parseInt(normalized[0] + normalized[0], 16);
        const g = parseInt(normalized[1] + normalized[1], 16);
        const b = parseInt(normalized[2] + normalized[2], 16);
        return { r, g, b };
      }
      if (normalized.length >= 6) {
        const r = parseInt(normalized.substring(0, 2), 16);
        const g = parseInt(normalized.substring(2, 4), 16);
        const b = parseInt(normalized.substring(4, 6), 16);
        return { r, g, b };
      }
      return null;
    }
    const rgbMatch = hex.match(/rgba?\(([^)]+)\)/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map(p => parseFloat(p.trim()));
      if (parts.length >= 3) {
        return { r: parts[0], g: parts[1], b: parts[2] };
      }
    }
    return null;
  },

  luminance: (color: string): number => {
    const rgb = colorUtils.parseColor(color);
    if (!rgb) return 0;
    const srgb = [rgb.r, rgb.g, rgb.b].map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  },

  getContrastText: (backgroundColor: string) => {
    try {
      const L = colorUtils.luminance(backgroundColor);
      return L > 0.5 ? palette.black : palette.white;
    } catch {
      return backgroundColor === palette.black ? palette.white : palette.black;
    }
  },

  textOn: (backgroundColor: string) =>
    colorUtils.getContrastText(backgroundColor),
};

export const accessibility = {
  minContrast: {
    normal: 4.5,
    large: 3,
  },
  touchTarget: {
    min: 44,
    recommended: 48,
  },
  getContrastRatio: (foreground: string, background: string): number => {
    try {
      const L1 = colorUtils.luminance(foreground);
      const L2 = colorUtils.luminance(background);
      const light = Math.max(L1, L2);
      const dark = Math.min(L1, L2);
      return (light + 0.05) / (dark + 0.05);
    } catch {
      return 1;
    }
  },
  isAccessible: (
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' | 'large' = 'AA'
  ): boolean => {
    const ratio = accessibility.getContrastRatio(foreground, background);
    if (level === 'AAA') return ratio >= 7;
    if (level === 'large') return ratio >= accessibility.minContrast.large;
    return ratio >= accessibility.minContrast.normal;
  },
};
