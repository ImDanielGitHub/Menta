import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { AppScreen } from '@/components/ui/AppShell';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('AppScreen layout roles', () => {
  const renderLane = (
    lane: 'focused' | 'working' | 'immersive' | 'full',
    padding?: boolean
  ) => {
    const result = render(
      <ThemeProvider>
        <AppScreen lane={lane} padding={padding} scrollable>
          <Text>Canonical lane</Text>
        </AppScreen>
      </ThemeProvider>
    );

    return {
      contentStyle: StyleSheet.flatten(
        result.UNSAFE_getByType(ScrollView).props.contentContainerStyle
      ),
      frameStyle:
        result
          .UNSAFE_getAllByType(View)
          .map(view => StyleSheet.flatten(view.props.style))
          .find(style => style?.maxWidth !== undefined) ?? {},
    };
  };

  it('lets focused task journeys use the supported large-phone frame', () => {
    const { contentStyle, frameStyle } = renderLane('focused');

    expect(contentStyle.maxWidth).toBeUndefined();
    expect(contentStyle.paddingHorizontal).toBe(mentaLayout.screenInset);
    expect(frameStyle.maxWidth).toBe(mentaLayout.taskLane);
  });

  it('lets working screens use the full supported large-phone frame', () => {
    const { contentStyle, frameStyle } = renderLane('working');

    expect(contentStyle.maxWidth).toBeUndefined();
    expect(contentStyle.paddingHorizontal).toBe(mentaLayout.screenInset);
    expect(frameStyle.maxWidth).toBe(mentaLayout.taskLane);
  });

  it('gives custom-padded tab routes one frame width without a second gutter', () => {
    const { contentStyle, frameStyle } = renderLane('working', false);

    expect(contentStyle.paddingHorizontal).toBe(0);
    expect(contentStyle.maxWidth).toBeUndefined();
    expect(frameStyle.maxWidth).toBe(mentaLayout.workingFrameMax);
  });

  it('removes the canonical inset for edge-to-edge full screens', () => {
    const { contentStyle, frameStyle } = renderLane('full');

    expect(contentStyle.paddingHorizontal).toBe(0);
    expect(contentStyle.maxWidth).toBeUndefined();
    expect(frameStyle.maxWidth).toBeUndefined();
  });
});
