/**
 * React 4-inspired monochrome design tokens.
 *
 * Menta is intentionally dark-only: black canvas, white type/actions,
 * thin dividers, and restrained semantic color only when status requires it.
 * Keep this file as the single source of truth for product UI styling.
 */

export const palette = {
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F7F7F7',
    100: '#E8E8E8',
    200: '#D1D1D1',
    300: '#AFAFAF',
    400: '#8A8A8A',
    500: '#666666',
    600: '#444444',
    700: '#262626',
    800: '#111111',
    900: '#080808',
  },
  brand: {
    primary: '#FFFFFF',
    secondary: '#DADADA',
    orange: '#D6B56D',
    purple: '#A78BFA',
    success: '#6ED39A',
    danger: '#D96A6A',
    deepOrange: '#A37B3A',
  },
} as const;

type Palette = typeof palette;

type GrayKeys = keyof Palette['gray'];

const getGray = (shade: GrayKeys) => palette.gray[shade];

const baseSpacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
} as const;

export const spacing = {
  ...baseSpacing,
  0.5: 2,
  1.5: 6,
  5: 20,
  7: 28,
  10: 40,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  xxxs: 2,
  xxs: 4,
  xs: baseSpacing[1],
  sm: baseSpacing[2],
  md: baseSpacing[4],
  lg: baseSpacing[6],
  xl: baseSpacing[8],
  xxl: baseSpacing[12],
  xxxl: 64,
  '2xl': baseSpacing[12],
  '3xl': 64,
  '4xl': 80,
} as const;

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 22,
  '3xl': 28,
  full: 9999,
} as const;

export const typography = {
  fonts: {
    body: 'System',
    heading: 'System',
    mono: 'System',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
  },
} as const;

export const shadows = {
  none: {},
  xs: {},
  sm: {},
  md: {},
  lg: {},
} as const;

export const colorTokens = {
  background: {
    primary: palette.black,
    secondary: '#050505',
    card: '#080808',
    surface: '#0D0D0D',
    tertiary: '#111111',
  },
  text: {
    primary: palette.white,
    secondary: 'rgba(255, 255, 255, 0.68)',
    tertiary: 'rgba(255, 255, 255, 0.44)',
    muted: 'rgba(255, 255, 255, 0.36)',
    placeholder: 'rgba(255, 255, 255, 0.28)',
    inverse: palette.black,
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.14)',
    secondary: 'rgba(255, 255, 255, 0.08)',
  },
  interactive: {
    primary: palette.white,
    secondary: 'rgba(255, 255, 255, 0.08)',
    disabled: 'rgba(255, 255, 255, 0.28)',
  },
  brand: {
    primary: palette.brand.primary,
    secondary: palette.brand.secondary,
    orange: palette.brand.orange,
    purple: palette.brand.purple,
    success: palette.brand.success,
  },
  status: {
    success: palette.brand.success,
    warning: palette.brand.orange,
    error: palette.brand.danger,
    info: '#BDBDBD',
  },
  shadow: {
    light: 'rgba(255, 255, 255, 0.08)',
    dark: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export const createMinimalGradients = (isDark: boolean) => {
  const surfaceStart = isDark ? colorTokens.background.primary : palette.white;
  const surfaceEnd = isDark ? '#0F0F0F' : getGray(100);

  return {
    brand: {
      primary: [palette.white, getGray(100)] as const,
      secondary: [getGray(100), palette.white] as const,
      tertiary: [getGray(300), palette.white] as const,
    },
    status: {
      success: [palette.brand.success, '#3F9D66'] as const,
      warning: [palette.brand.orange, palette.brand.deepOrange] as const,
      error: [palette.brand.danger, '#A84343'] as const,
    },
    emotion: {
      terrible: [palette.brand.danger, '#6F2F2F'] as const,
      bad: [palette.brand.orange, '#6E5728'] as const,
      okay: ['#C7A966', '#6F5D31'] as const,
      good: [palette.brand.success, '#2F6F48'] as const,
      great: [getGray(100), getGray(500)] as const,
    },
    streak: {
      base: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'] as const,
      highlight: [palette.white, getGray(300)] as const,
    },
    share: {
      card: [
        colorTokens.background.surface,
        colorTokens.background.card,
      ] as const,
      mesh: ['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.04)'] as const,
    },
    background: {
      primary: [
        colorTokens.background.primary,
        colorTokens.background.primary,
      ] as const,
      header: [
        colorTokens.background.primary,
        colorTokens.background.secondary,
      ] as const,
      subtle: [surfaceStart, surfaceEnd] as const,
      card: [
        colorTokens.background.card,
        colorTokens.background.surface,
      ] as const,
      surface: [
        colorTokens.background.surface,
        colorTokens.background.card,
      ] as const,
      screen: [
        colorTokens.background.primary,
        colorTokens.background.primary,
      ] as const,
    },
    effects: {
      glow: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.03)'] as const,
      shimmer: [
        'rgba(255, 255, 255, 0.14)',
        'rgba(255, 255, 255, 0.04)',
      ] as const,
    },
  } as const;
};

export const createSemanticColors = (isDark: boolean) => {
  if (!isDark) {
    return {
      text: {
        primary: getGray(900),
        secondary: getGray(600),
        tertiary: getGray(500),
        muted: getGray(500),
        placeholder: 'rgba(17, 24, 39, 0.4)',
        inverse: palette.white,
      },
      background: {
        primary: palette.white,
        secondary: getGray(50),
        tertiary: getGray(100),
        card: palette.white,
        surface: getGray(100),
        overlay: 'rgba(15, 23, 42, 0.5)',
      },
      surface: {
        primary: getGray(100),
        secondary: getGray(200),
        hover: getGray(200),
        active: getGray(300),
        disabled: 'rgba(15, 23, 42, 0.08)',
      },
      border: {
        primary: getGray(200),
        secondary: getGray(300),
        focus: getGray(900),
      },
      interactive: {
        primary: getGray(900),
        secondary: 'rgba(17, 17, 17, 0.08)',
        disabled: 'rgba(17, 17, 17, 0.3)',
      },
      brand: {
        primary: palette.brand.primary,
        secondary: palette.brand.secondary,
        orange: palette.brand.orange,
        purple: palette.brand.purple,
        success: palette.brand.success,
      },
      status: {
        success: palette.brand.success,
        warning: palette.brand.orange,
        error: palette.brand.danger,
        info: getGray(500),
      },
      shadow: {
        light: 'rgba(15, 23, 42, 0.08)',
        dark: 'rgba(15, 23, 42, 0.16)',
      },
    } as const;
  }

  return {
    text: colorTokens.text,
    background: {
      ...colorTokens.background,
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    surface: {
      primary: colorTokens.background.surface,
      secondary: colorTokens.background.tertiary,
      hover: '#141414',
      active: '#1A1A1A',
      disabled: 'rgba(255, 255, 255, 0.05)',
    },
    border: {
      ...colorTokens.border,
      focus: palette.white,
    },
    interactive: colorTokens.interactive,
    brand: colorTokens.brand,
    status: colorTokens.status,
    shadow: colorTokens.shadow,
  } as const;
};

export const componentVariants = {
  button: {
    primary: {
      backgroundColor: palette.white,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      color: palette.black,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colorTokens.border.primary,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      color: palette.white,
    },
  },
  card: {
    default: {
      backgroundColor: colorTokens.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: colorTokens.border.primary,
    },
    elevated: {
      backgroundColor: colorTokens.background.surface,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: colorTokens.border.primary,
      ...shadows.sm,
    },
  },
} as const;

export const designSystem = {
  palette,
  spacing,
  borderRadius,
  typography,
  shadows,
  colorTokens,
  createMinimalGradients,
  createSemanticColors,
  componentVariants,
} as const;

export default designSystem;
