import type { TextStyle } from 'react-native';
import { mentaFonts } from '@/lib/menta-fonts';

/**
 * Google requires its provider label to use Google Sans Medium at 14/20.
 * Keep the static Medium face authoritative rather than adding a synthetic
 * `fontWeight`, which can make React Native fall back to a system font.
 */
export const googleProviderLabelTypography = {
  fontFamily: mentaFonts.provider.google,
  fontSize: 14,
  lineHeight: 20,
} satisfies TextStyle;
