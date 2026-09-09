import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ForgotPasswordScreen from '@/app/forgot-password';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockReplace = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockCreateURL = jest.fn(() => 'menta://password-recovery/callback');

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-linking', () => ({
  createURL: (...args: unknown[]) => mockCreateURL(...args),
}));

jest.mock('@/lib/supabase', () => ({
  passwordRecoverySupabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) =>
        mockResetPasswordForEmail(...args),
    },
  },
}));

const renderForgotPassword = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 430, height: 932 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('ForgotPasswordScreen recovery handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it('binds the reset email to the approved native callback route', async () => {
    renderForgotPassword();

    fireEvent.changeText(
      screen.getByTestId('forgot-password-email'),
      '  ME@EXAMPLE.COM '
    );
    fireEvent.press(screen.getByTestId('forgot-password-submit'));

    await waitFor(() =>
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('me@example.com', {
        redirectTo: 'menta://password-recovery/callback',
      })
    );
    expect(mockCreateURL).toHaveBeenCalledWith('password-recovery/callback');
    expect(screen.getByTestId('forgot-password-success')).toBeTruthy();
  });
});
