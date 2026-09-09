import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import SimpleBottomSheet from '@/components/ui/SimpleBottomSheet';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('@/lib/accessibility', () => ({
  getAccessibleAnimationDuration: (duration: number) => duration,
  useScreenReader: () => ({
    isReduceMotionEnabled: true,
    isScreenReaderEnabled: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    reduceMotion: true,
    duration: () => 0,
    distance: () => 0,
  }),
}));

const renderSheet = (props = {}, equippedThemeSku: string | null = null) => {
  const onClose = jest.fn();
  const result = render(
    <ThemeProvider equippedThemeSku={equippedThemeSku}>
      <SimpleBottomSheet visible onClose={onClose} {...props}>
        <Text>Sheet body</Text>
      </SimpleBottomSheet>
    </ThemeProvider>
  );

  return { ...result, onClose };
};

describe('SimpleBottomSheet', () => {
  it('marks the sheet as a modal accessibility container', () => {
    const { UNSAFE_getByType } = renderSheet();

    expect(UNSAFE_getByType(Modal).props.accessibilityViewIsModal).toBe(true);
  });

  it('keeps native request-close locked when backdrop dismissal is disabled', () => {
    const { UNSAFE_getByType, queryByLabelText, onClose } = renderSheet({
      dismissOnBackdrop: false,
    });

    UNSAFE_getByType(Modal).props.onRequestClose();

    expect(onClose).not.toHaveBeenCalled();
    expect(queryByLabelText('Dismiss sheet')).toBeNull();
  });

  it('allows native request-close when backdrop dismissal is enabled', () => {
    const { UNSAFE_getByType, getByLabelText, onClose } = renderSheet({
      dismissOnBackdrop: true,
    });

    UNSAFE_getByType(Modal).props.onRequestClose();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Dismiss sheet')).toHaveProp(
      'accessibilityRole',
      'button'
    );
  });

  it('uses the equipped theme surface for sheet content', () => {
    const { getByTestId } = renderSheet(
      { testID: 'equipped-theme-sheet' },
      'profile_theme_ember'
    );

    expect(
      StyleSheet.flatten(getByTestId('equipped-theme-sheet').props.style)
        .backgroundColor
    ).toBe('#1D1713');
  });

  it('keeps default callers non-scrollable', () => {
    const { getByText, UNSAFE_queryByType } = renderSheet();

    expect(getByText('Sheet body')).toBeTruthy();
    expect(UNSAFE_queryByType(ScrollView)).toBeNull();
  });

  it('preserves the accepted full-width edge presentation by default', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderSheet({
      testID: 'context-choice-sheet',
    });

    const backdrop = UNSAFE_getAllByType(View).find(
      view =>
        StyleSheet.flatten(view.props.style)?.justifyContent === 'flex-end'
    );
    expect(backdrop).toBeTruthy();
    expect(getByTestId('context-choice-sheet')).toHaveStyle({
      alignSelf: 'stretch',
      borderBottomWidth: 0,
      width: '100%',
    });
  });

  it('supports an opt-in scrollable body with a fixed footer', () => {
    const { getByTestId, UNSAFE_getByType } = renderSheet({
      testID: 'scrollable-sheet',
      scrollableBody: <Text>Long notice content</Text>,
      footer: <Text>Persistent action</Text>,
    });

    expect(getByTestId('scrollable-sheet-scrollable-body')).toBeTruthy();
    expect(getByTestId('scrollable-sheet-footer')).toBeTruthy();
    expect(
      StyleSheet.flatten(getByTestId('scrollable-sheet').props.style).height
    ).toBeUndefined();
    expect(UNSAFE_getByType(ScrollView).props.keyboardShouldPersistTaps).toBe(
      'handled'
    );
  });

  it('shows an overflow cue until the scroll reaches the remaining content', () => {
    const { getByTestId, queryByTestId, UNSAFE_getByType } = renderSheet({
      testID: 'scrollable-sheet',
      scrollHint: 'Scroll for balance details',
      scrollableBody: <Text>Long notice content</Text>,
      footer: <Text>Persistent action</Text>,
    });
    const scrollView = UNSAFE_getByType(ScrollView);

    fireEvent(scrollView, 'layout', {
      nativeEvent: { layout: { height: 200 } },
    });
    fireEvent(scrollView, 'contentSizeChange', 320, 420);

    expect(getByTestId('scrollable-sheet-scroll-overflow-hint')).toBeTruthy();

    fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { y: 220 } },
    });

    expect(queryByTestId('scrollable-sheet-scroll-overflow-hint')).toBeNull();
  });
});
