import React from 'react';
import { render, screen } from '@testing-library/react-native';

import {
  AppScaledText,
  AppTextScaleProvider,
} from '@/components/ui/AppScaledText';

describe('AppScaledText', () => {
  it('preserves native Dynamic Type outside a viewport envelope', () => {
    render(
      <AppScaledText style={{ fontSize: 16, lineHeight: 23 }}>
        Native text
      </AppScaledText>
    );

    expect(screen.getByText('Native text').props.allowFontScaling).toBe(
      undefined
    );
    expect(screen.getByText('Native text')).toHaveStyle({
      fontSize: 16,
      lineHeight: 23,
    });
  });

  it('writes measurable rounded metrics inside a viewport envelope', () => {
    render(
      <AppTextScaleProvider scale={1.3}>
        <AppScaledText style={{ fontSize: 16, lineHeight: 23 }}>
          Scaled text
        </AppScaledText>
      </AppTextScaleProvider>
    );

    expect(screen.getByText('Scaled text')).toHaveProp(
      'allowFontScaling',
      false
    );
    expect(screen.getByText('Scaled text')).toHaveStyle({
      fontSize: 20.8,
      lineHeight: 29.9,
    });
  });

  it('respects a lower role-specific ceiling inside the envelope', () => {
    render(
      <AppTextScaleProvider scale={1.4}>
        <AppScaledText
          maxFontSizeMultiplier={1.2}
          style={{ fontSize: 72, lineHeight: 76 }}
        >
          0
        </AppScaledText>
      </AppTextScaleProvider>
    );

    expect(screen.getByText('0')).toHaveStyle({
      fontSize: 86.4,
      lineHeight: 91.2,
    });
  });

  it('accepts an explicit scale without a provider', () => {
    render(
      <AppScaledText style={{ fontSize: 32, lineHeight: 38 }} textScale={1.4}>
        Today
      </AppScaledText>
    );

    expect(screen.getByText('Today')).toHaveStyle({
      fontSize: 44.8,
      lineHeight: 53.2,
    });
  });
});
