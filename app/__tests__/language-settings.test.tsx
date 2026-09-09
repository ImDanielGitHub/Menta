import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguageSettingsScreen from '@/app/language-settings';
import { ThemeProvider } from '@/constants/ThemeContext';
import { useLocaleStore } from '@/store/locale-store';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-NZ' }],
}));

jest.mock('@/components/ui/AppShell', () => {
  const { Text: MockText, View: MockView } = require('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <MockView>{children}</MockView>
    ),
    AppTopBar: ({
      backLabel,
      onBack,
    }: {
      backLabel?: string;
      onBack?: () => void;
    }) => (
      <MockText
        accessibilityRole="button"
        onPress={onBack}
        testID="language-back"
      >
        {backLabel}
      </MockText>
    ),
  };
});

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return { CheckIcon: Icon, GlobeIcon: Icon };
});

describe('LanguageSettingsScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await useLocaleStore.persist.clearStorage();
    useLocaleStore.setState({ preference: 'system' });
  });

  it('shows the current phone language and every regional preview catalogue', () => {
    render(
      <ThemeProvider>
        <LanguageSettingsScreen />
      </ThemeProvider>
    );

    expect(
      screen.getByText(
        'Choose the language Menta uses. Translations are still being reviewed, so some screens remain in English.'
      )
    ).toBeTruthy();
    expect(
      screen.getByTestId('language-option-system').props.accessibilityState
        .checked
    ).toBe(true);
    expect(screen.getByText('New Zealand')).toBeTruthy();
    expect(screen.getByText('Deutschland')).toBeTruthy();
    expect(screen.getByText('España')).toBeTruthy();
    expect(screen.getByText('México')).toBeTruthy();
    expect(screen.getByText('France')).toBeTruthy();
    expect(screen.getByText('Canada')).toBeTruthy();
    expect(screen.getByText('Brasil')).toBeTruthy();
    expect(screen.getByText('Portugal')).toBeTruthy();
  });

  it('applies a language immediately and persists the explicit regional choice', async () => {
    render(
      <ThemeProvider>
        <LanguageSettingsScreen />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByTestId('language-option-es-MX'));

    expect(useLocaleStore.getState().preference).toBe('es-MX');
    expect(
      screen.getByTestId('language-option-es-MX').props.accessibilityState
        .checked
    ).toBe(true);
    expect(screen.getAllByText('Idioma').length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        'Elige el idioma que usa Menta. Las traducciones todavía están en revisión, así que algunas pantallas siguen en inglés.'
      )
    ).toBeTruthy();

    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalled());
    const persisted = JSON.parse(
      (await AsyncStorage.getItem('menta-locale-preference')) ?? '{}'
    );
    expect(persisted.state.preference).toBe('es-MX');
  });

  it('returns a cold route to Settings instead of issuing a dead Back', () => {
    render(
      <ThemeProvider>
        <LanguageSettingsScreen />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByTestId('language-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/settings');
  });
});
