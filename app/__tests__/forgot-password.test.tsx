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
import { stagePasswordResetPrefill } from '@/lib/auth/password-reset-prefill';

let mockParams: Record<string, string | string[] | undefined> = {};
const mockReplace = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockCreateURL = jest.fn(() => 'menta://password-recovery/callback');

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
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

const renderForgotPassword = (strict = false) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 430, height: 932 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        {strict ? (
          <React.StrictMode>
            <ForgotPasswordScreen />
          </React.StrictMode>
        ) : (
          <ForgotPasswordScreen />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('ForgotPasswordScreen recovery handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it.each(['untrusted@example.invalid', ['untrusted@example.invalid']])(
    'does not prefill from email-bearing route parameters: %s',
    email => {
      mockParams = { email };
      renderForgotPassword();
      expect(screen.getByDisplayValue('')).toBeTruthy();
    }
  );

  it('prefills the intended reset form once, including under Strict Mode', () => {
    mockParams = {
      prefill: stagePasswordResetPrefill('synthetic@example.invalid'),
    };
    const view = renderForgotPassword(true);
    expect(screen.getByDisplayValue('synthetic@example.invalid')).toBeTruthy();
    view.unmount();
    renderForgotPassword();
    expect(screen.getByDisplayValue('')).toBeTruthy();
  });

  it('retains the entered email after a failed reset and allows retry', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({
      error: new Error('offline'),
    });
    mockParams = {
      prefill: stagePasswordResetPrefill('synthetic@example.invalid'),
    };
    renderForgotPassword();
    fireEvent.press(screen.getByTestId('forgot-password-submit'));
    await waitFor(() =>
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1)
    );
    expect(screen.getByDisplayValue('synthetic@example.invalid')).toBeTruthy();
    fireEvent.press(screen.getByTestId('forgot-password-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('forgot-password-success')).toBeTruthy()
    );
    expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(2);
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
    expect(mockCreateURL).not.toHaveBeenCalled();
    expect(screen.getByTestId('forgot-password-success')).toBeTruthy();
  });
  it('keeps the reset resend cooldown and safe return route', async () => {
    const clock = jest.spyOn(Date, 'now');
    try {
      mockParams = {
        prefill: stagePasswordResetPrefill('synthetic@example.invalid'),
      };
      renderForgotPassword();
      fireEvent.press(screen.getByTestId('forgot-password-submit'));
      await waitFor(() =>
        expect(screen.getByTestId('forgot-password-success')).toBeTruthy()
      );
      fireEvent.press(
        screen.getByTestId('forgot-password-success-send-another')
      );
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
      clock.mockReturnValue(Date.now() + 45_000);
      await waitFor(
        () =>
          expect(
            screen.getByTestId('forgot-password-success-send-another').props
              .accessibilityState.disabled
          ).toBe(false),
        { timeout: 2_000 }
      );
      fireEvent.press(
        screen.getByTestId('forgot-password-success-send-another')
      );
      await waitFor(() =>
        expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(2)
      );
      fireEvent.press(screen.getByTestId('forgot-password-success-back'));
      expect(mockReplace).toHaveBeenCalledWith('/email-auth?mode=login');
    } finally {
      clock.mockRestore();
    }
  });
});
