import React, { createContext, useContext } from 'react';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

import { scaleTypeMetrics } from '@/constants/phone-layout';

const AppTextScaleContext = createContext<number | null>(null);

export const AppTextScaleProvider = ({
  children,
  scale,
}: {
  children: React.ReactNode;
  scale: number;
}): React.ReactElement => (
  <AppTextScaleContext.Provider value={scale}>
    {children}
  </AppTextScaleContext.Provider>
);

export const useAppTextScale = (): number | null =>
  useContext(AppTextScaleContext);

export const AppScaledText = ({
  allowFontScaling,
  maxFontSizeMultiplier,
  style,
  textScale: requestedTextScale,
  ...props
}: TextProps & { textScale?: number }): React.ReactElement => {
  const inheritedTextScale = useAppTextScale();
  const textScale = requestedTextScale ?? inheritedTextScale;
  if (textScale == null) {
    return (
      <NativeText
        {...props}
        allowFontScaling={allowFontScaling}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        style={style}
      />
    );
  }

  const effectiveScale = Math.min(
    textScale,
    maxFontSizeMultiplier ?? textScale
  );
  const scaledStyle =
    allowFontScaling === false
      ? undefined
      : scaleTypeMetrics(StyleSheet.flatten(style) ?? {}, effectiveScale);

  return (
    <NativeText
      {...props}
      allowFontScaling={false}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[style, scaledStyle]}
    />
  );
};
