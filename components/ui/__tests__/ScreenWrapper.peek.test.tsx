import React from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ThemeProvider } from '@/constants/ThemeContext';
import {
  ScreenWrapper,
  TAB_BAR_PEEK_CLEARANCE,
} from '@/components/ui/ScreenWrapper';
import { mentaSpacing } from '@/constants/MentaDesignSystem';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));

describe('ScreenWrapper tab peek remainder', () => {
  it('does not reserve a second tab height or home-indicator gap on tab screens', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <ThemeProvider>
        <ScreenWrapper
          contentContainerStyle={{ paddingBottom: 104 }}
          hasTabBar
          scrollable
          testID="tab-peek"
        >
          <Text>Next row</Text>
        </ScreenWrapper>
      </ThemeProvider>
    );

    const wrapperStyle = StyleSheet.flatten(
      getByTestId('tab-peek').props.style
    );
    const scrollStyle = StyleSheet.flatten(
      UNSAFE_getByType(ScrollView).props.contentContainerStyle
    );

    expect(wrapperStyle.paddingBottom).toBe(0);
    expect(wrapperStyle.paddingTop).toBe(47);
    expect(scrollStyle.paddingBottom).toBe(TAB_BAR_PEEK_CLEARANCE);
    expect(scrollStyle.paddingBottom).toBe(mentaSpacing[5]);
    expect(scrollStyle.paddingBottom).toBeLessThan(80);
  });

  it('keeps home-indicator clearance on stack screens without a tab bar', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <ThemeProvider>
        <ScreenWrapper hasTabBar={false} scrollable testID="stack-screen">
          <Text>Receipt</Text>
        </ScreenWrapper>
      </ThemeProvider>
    );

    const wrapperStyle = StyleSheet.flatten(
      getByTestId('stack-screen').props.style
    );
    const scrollStyle = StyleSheet.flatten(
      UNSAFE_getByType(ScrollView).props.contentContainerStyle
    );

    expect(wrapperStyle.paddingBottom).toBe(34);
    expect(scrollStyle.paddingBottom).toBe(34 + mentaSpacing[8]);
  });

  it('lets bounded iPad scroll content fill the viewport', () => {
    const osDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    const isPadDescriptor = Object.getOwnPropertyDescriptor(Platform, 'isPad');
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    Object.defineProperty(Platform, 'isPad', {
      configurable: true,
      value: true,
    });

    try {
      const { getByTestId } = render(
        <ThemeProvider>
          <ScreenWrapper
            hasTabBar={false}
            maxWidth={640}
            scrollable
            testID="ipad-stack"
          >
            <Text>Sign-in actions</Text>
          </ScreenWrapper>
        </ThemeProvider>
      );

      expect(
        StyleSheet.flatten(
          getByTestId('ipad-stack-bounded-content').props.style
        )
      ).toMatchObject({
        alignSelf: 'center',
        flexGrow: 1,
        maxWidth: 640,
        width: '100%',
      });
    } finally {
      if (osDescriptor) Object.defineProperty(Platform, 'OS', osDescriptor);
      else delete (Platform as { OS?: string }).OS;
      if (isPadDescriptor) {
        Object.defineProperty(Platform, 'isPad', isPadDescriptor);
      } else delete (Platform as { isPad?: boolean }).isPad;
    }
  });
});
