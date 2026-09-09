import type { ThemeContextType } from '@/constants/ThemeContext';

export const getCreationFormTokens = (theme: ThemeContextType) => ({
  fieldGap: theme.spacing.sm,
  fieldBlockGap: theme.spacing.lg,
  labelSize: theme.typography.sizes.base,
  helperSize: theme.typography.sizes.sm,
  counterSize: theme.typography.sizes.xs,
  inputMinHeight: 52,
  inputMultilineMinHeight: 108,
  inputHorizontalPadding: theme.spacing.md,
  inputVerticalPadding: theme.spacing.sm,
  inputRadius: theme.borderRadius.lg,
});
