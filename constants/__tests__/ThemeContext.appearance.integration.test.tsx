import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Appearance, Text, View } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '@/constants/ThemeContext';
import { AppearanceSetting } from '@/components/settings/AppearanceSetting';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppFields';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAppearanceStore } from '@/store/appearance-store';
import { mentaColors, mentaLightColors } from '@/constants/MentaDesignSystem';

// Exercise the real subscription hook; the RN preset otherwise fixes it to Light.
jest.unmock('react-native/Libraries/Utilities/useColorScheme');

function Surface() {
  const theme = useTheme();
  return (
    <View
      testID="surface"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      <Text testID="mode" style={{ color: theme.colors.text.primary }}>
        {theme.isDark ? 'dark' : 'light'}
      </Text>
      <AppearanceSetting />
      <AppButton title="Save promise" onPress={() => undefined} />
      <AppButton
        title="Unavailable action"
        disabled
        testID="disabled-action"
        onPress={() => undefined}
      />
      <AppTextField
        multiline
        label="Promise"
        value="Read for twenty minutes"
        onChangeText={() => undefined}
      />
      <SkeletonLoader testID="loading" />
    </View>
  );
}

const renderSurface = (sku?: string) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ThemeProvider equippedThemeSku={sku}>
      <Surface />
    </ThemeProvider>
  </SafeAreaProvider>
);

describe('Appearance selection across shared UI', () => {
  let deviceScheme: 'light' | 'dark' | null;
  let override: 'light' | 'dark' | 'unspecified';
  let listeners: Set<Parameters<typeof Appearance.addChangeListener>[0]>;
  const currentScheme = () =>
    override === 'unspecified' ? deviceScheme : override;
  const emitAppearance = () => {
    for (const listener of listeners) {
      listener({ colorScheme: currentScheme() ?? 'unspecified' });
    }
  };
  const changeDeviceScheme = (scheme: typeof deviceScheme) => {
    act(() => {
      deviceScheme = scheme;
      emitAppearance();
    });
  };
  beforeEach(async () => {
    await useAppearanceStore.persist.rehydrate();
    useAppearanceStore.setState({ preference: 'dark' });
    deviceScheme = 'light';
    override = 'unspecified';
    listeners = new Set();
    jest.spyOn(Appearance, 'getColorScheme').mockImplementation(currentScheme);
    jest.spyOn(Appearance, 'addChangeListener').mockImplementation(listener => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    });
    jest.spyOn(Appearance, 'setColorScheme').mockImplementation(scheme => {
      override = scheme;
      emitAppearance();
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('switches the live screen, controls and loading geometry, persists and restores the choice', async () => {
    const view = render(renderSurface());
    expect(
      screen.getByTestId('surface', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor: mentaColors.canvas,
    });
    fireEvent.press(screen.getByTestId('settings-appearance'));
    fireEvent.press(screen.getByRole('radio', { name: 'Light' }));
    expect(
      screen.getByRole('radio', { name: 'Light', checked: true })
    ).toBeTruthy();
    expect(
      screen.getByTestId('mode', { includeHiddenElements: true })
    ).toHaveTextContent('light');
    expect(
      screen.getByTestId('surface', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor: mentaLightColors.canvas,
    });
    expect(
      screen.getByText('Save promise', { includeHiddenElements: true })
    ).toHaveStyle({
      color: mentaLightColors.paper,
    });
    expect(
      screen.getByDisplayValue('Read for twenty minutes', {
        includeHiddenElements: true,
      })
    ).toHaveStyle({
      color: mentaLightColors.text.primary,
    });
    expect(
      screen.getByTestId('loading', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor: mentaLightColors.skeleton,
    });
    expect(
      screen.getByTestId('disabled-action', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor: '#E9E5EF',
      opacity: 1,
    });
    expect(
      screen.getByText('Unavailable action', { includeHiddenElements: true })
    ).toHaveStyle({ color: '#686171' });
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('light');
    await waitFor(async () => {
      const saved = await AsyncStorage.getItem('menta-appearance');
      expect(JSON.parse(saved ?? '{}').state.preference).toBe('light');
    });
    view.unmount();
    await act(async () => {
      await useAppearanceStore.persist.rehydrate();
    });
    render(renderSurface());
    expect(
      screen.getByTestId('mode', { includeHiddenElements: true })
    ).toHaveTextContent('light');
    fireEvent.press(screen.getByTestId('settings-appearance'));
    fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
    expect(
      screen.getByTestId('loading', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor: mentaColors.skeleton,
    });
    expect(
      screen.getByText('Save promise', { includeHiddenElements: true })
    ).toHaveStyle({
      color: mentaColors.text.onPaper,
    });
  });

  it('follows live System changes, preserves explicit overrides and clears them when returning to System', () => {
    render(renderSurface());
    fireEvent.press(screen.getByTestId('settings-appearance'));
    const mode = () =>
      screen.getByTestId('mode', { includeHiddenElements: true });
    expect(mode()).toHaveTextContent('dark');
    fireEvent.press(screen.getByRole('radio', { name: 'System' }));
    expect(
      screen.getByRole('radio', { name: 'System', checked: true })
    ).toBeTruthy();
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
    expect(mode()).toHaveTextContent('light');
    changeDeviceScheme('dark');
    expect(mode()).toHaveTextContent('dark');
    fireEvent.press(screen.getByRole('radio', { name: 'Light' }));
    expect(mode()).toHaveTextContent('light');
    changeDeviceScheme('dark');
    expect(mode()).toHaveTextContent('light');
    fireEvent.press(screen.getByRole('radio', { name: 'System' }));
    expect(mode()).toHaveTextContent('dark');
    changeDeviceScheme('light');
    expect(mode()).toHaveTextContent('light');
    fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
    changeDeviceScheme('light');
    expect(mode()).toHaveTextContent('dark');
    fireEvent.press(screen.getByRole('radio', { name: 'System' }));
    expect(mode()).toHaveTextContent('light');
    changeDeviceScheme(null);
    expect(mode()).toHaveTextContent('dark');
  });

  it.each([
    ['system', 'light'],
    ['light', 'light'],
    ['dark', 'dark'],
    ['invalid', 'dark'],
  ])(
    'restores persisted %s with the expected %s appearance',
    async (saved, expected) => {
      await AsyncStorage.setItem(
        'menta-appearance',
        JSON.stringify({ state: { preference: saved }, version: 0 })
      );
      await useAppearanceStore.persist.rehydrate();
      render(renderSurface());
      expect(
        screen.getByTestId('mode', { includeHiddenElements: true })
      ).toHaveTextContent(expected);
      expect(useAppearanceStore.getState().preference).toBe(
        saved === 'invalid' ? 'dark' : saved
      );
    }
  );

  it('persists System and restores it after remount without forcing an explicit appearance', async () => {
    const view = render(renderSurface());
    fireEvent.press(screen.getByTestId('settings-appearance'));
    fireEvent.press(screen.getByRole('radio', { name: 'System' }));
    await waitFor(async () => {
      const saved = await AsyncStorage.getItem('menta-appearance');
      expect(JSON.parse(saved ?? '{}').state.preference).toBe('system');
    });
    view.unmount();
    deviceScheme = 'dark';
    await act(async () => {
      await useAppearanceStore.persist.rehydrate();
    });
    render(renderSurface());
    expect(
      screen.getByTestId('mode', { includeHiddenElements: true })
    ).toHaveTextContent('dark');
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
    changeDeviceScheme('light');
    expect(
      screen.getByTestId('mode', { includeHiddenElements: true })
    ).toHaveTextContent('light');
  });

  it('keeps equipped themes on light surfaces and restores their dark surfaces', () => {
    useAppearanceStore.setState({ preference: 'light' });
    render(renderSurface('profile_theme_ember'));
    expect(
      screen.getByTestId('surface', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor: mentaLightColors.canvas,
    });
    expect(
      screen.getByText('Save promise', { includeHiddenElements: true })
    ).toHaveStyle({
      color: mentaLightColors.paper,
    });
    fireEvent.press(screen.getByTestId('settings-appearance'));
    fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
    expect(
      screen.getByTestId('surface', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor: mentaColors.canvas,
    });
  });
});
