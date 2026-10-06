import React, { useMemo } from 'react';
import ThemeContext, { useTheme } from '@/constants/ThemeContext';
import { MentaPaletteContext } from '@/constants/use-menta-palette';
import { mentaColors, type MentaPalette } from '@/constants/MentaDesignSystem';

/** The approved consent Paper palette is scoped to these two modal surfaces. */
const paperLight: MentaPalette = {
  ...mentaColors,
  canvas: mentaColors.paper,
  surface: mentaColors.paper,
  raised: mentaColors.paperPressed,
  skeleton: mentaColors.paperPressed,
  skeletonHighlight: mentaColors.paper,
  border: mentaColors.borderPaper,
  text: {
    ...mentaColors.text,
    primary: mentaColors.text.onPaper,
    secondary: mentaColors.text.mutedOnPaper,
    muted: mentaColors.text.mutedOnPaper,
  },
};
export function useConsentPalette() {
  const theme = useTheme();
  return theme.isDark ? mentaColors : paperLight;
}
export function ConsentPalette({ children }: { children: React.ReactNode }) {
  const parent = useTheme();
  const palette = useConsentPalette();
  const theme = useMemo(
    () => ({
      ...parent,
      mentaColors: palette,
      colors: {
        ...parent.colors,
        background: { ...parent.colors.background, primary: palette.canvas },
        text: {
          ...parent.colors.text,
          primary: palette.text.primary,
          secondary: palette.text.secondary,
          muted: palette.text.muted,
        },
        border: { ...parent.colors.border, primary: palette.border },
        accent: { ...parent.colors.accent, primary: palette.action },
        onPrimary: palette.text.onPaper,
      },
    }),
    [parent, palette]
  );
  return (
    <ThemeContext.Provider value={theme}>
      <MentaPaletteContext.Provider value={palette}>
        {children}
      </MentaPaletteContext.Provider>
    </ThemeContext.Provider>
  );
}
