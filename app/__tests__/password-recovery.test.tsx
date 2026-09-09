import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PasswordRecoveryScreen from '@/app/password-recovery';
import { ThemeProvider } from '@/constants/ThemeContext';
import { resolvePhoneLayout } from '@/constants/phone-layout';

let mockPhoneLayout = resolvePhoneLayout({
  width: 430,
  height: 932,
  fontScale: 1,
});

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

const mockReplace = jest.fn();
const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockGetRecoveryUserId = jest.fn();
const mockClearRecovery = jest.fn();
let mockParams: Record<string, string | string[] | undefined> = {};
let mockDraft: { promise: string } | null = null;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/supabase', () => ({
  passwordRecoverySupabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

jest.mock('@/lib/auth/password-recovery-session', () => ({
  clearPasswordRecoverySession: (...args: unknown[]) =>
    mockClearRecovery(...args),
  getPasswordRecoveryUserId: (...args: unknown[]) =>
    mockGetRecoveryUserId(...args),
}));

jest.mock('@/components/onboarding/PaperAuthSurface', () => ({
  usePaperAuthDraft: () => mockDraft,
}));

const renderRecovery = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: {
          x: 0,
          y: 0,
          width: mockPhoneLayout.width,
          height: mockPhoneLayout.height,
        },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        <PasswordRecoveryScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

const enterMatchingPasswords = async () => {
  await screen.findByTestId('password-recovery-password');
  fireEvent.changeText(
    screen.getByTestId('password-recovery-password'),
    'new-secret'
  );
  fireEvent.changeText(
    screen.getByTestId('password-recovery-confirmation'),
    'new-secret'
  );
};

describe('PasswordRecoveryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockDraft = null;
    mockGetRecoveryUserId.mockResolvedValue('recovery-user');
    mockClearRecovery.mockResolvedValue(undefined);
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'recovery-user' } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockPhoneLayout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1,
    });
  });

  it('fits password recovery to the short-phone AXXL envelope', async () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 320,
      height: 568,
      fontScale: 2.35,
    });
    const view = renderRecovery();

    expect(await screen.findByText('Choose a new password')).toHaveStyle({
      fontSize: 38.4,
      lineHeight: 45.6,
    });
    expect(
      view.UNSAFE_getByType(ScrollView).props.automaticallyAdjustKeyboardInsets
    ).toBe(true);
    expect(screen.getByTestId('password-recovery-password')).toBeTruthy();
    expect(screen.getByTestId('password-recovery-confirmation')).toBeTruthy();
    expect(screen.getByTestId('password-recovery-submit')).toBeTruthy();
  });

  it('changes the password only after the server confirms the recovery user', async () => {
    renderRecovery();
    await enterMatchingPasswords();

    fireEvent.press(screen.getByTestId('password-recovery-submit'));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledTimes(1));
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-secret' });
    expect(screen.getByText('Your password has been changed.')).toBeTruthy();
    expect(screen.getByTestId('password-recovery-success-mark')).toBeTruthy();
  });

  it('keeps a password mismatch inline and sends nothing', async () => {
    renderRecovery();
    await screen.findByTestId('password-recovery-password');

    fireEvent.changeText(
      screen.getByTestId('password-recovery-password'),
      'new-secret'
    );
    fireEvent.changeText(
      screen.getByTestId('password-recovery-confirmation'),
      'different'
    );
    fireEvent.press(screen.getByTestId('password-recovery-submit'));

    expect(screen.getByText('The passwords do not match.')).toBeTruthy();
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('requires eight characters for a replacement password', async () => {
    renderRecovery();
    await screen.findByTestId('password-recovery-password');

    fireEvent.changeText(
      screen.getByTestId('password-recovery-password'),
      'seven77'
    );
    fireEvent.changeText(
      screen.getByTestId('password-recovery-confirmation'),
      'seven77'
    );
    fireEvent.press(screen.getByTestId('password-recovery-submit'));

    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows the expired state for an invalid link without changing the account', async () => {
    mockParams = { status: 'invalid' };
    renderRecovery();

    expect(
      await screen.findByText('This reset link has expired.')
    ).toBeTruthy();
    expect(
      screen.getByText('Request a new link. Your draft is still on this phone.')
    ).toBeTruthy();
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('keeps a provider failure on the form and allows a retry', async () => {
    mockUpdateUser.mockResolvedValueOnce({
      error: new Error('Password service unavailable'),
    });
    renderRecovery();
    await enterMatchingPasswords();

    fireEvent.press(screen.getByTestId('password-recovery-submit'));

    expect(
      await screen.findByText('Password service unavailable')
    ).toBeTruthy();
    expect(screen.getByTestId('password-recovery')).toBeTruthy();
    expect(screen.getByTestId('password-recovery-submit')).toBeTruthy();
  });

  it('synchronously prevents duplicate password updates', async () => {
    let resolveUpdate: ((value: { error: null }) => void) | undefined;
    mockUpdateUser.mockImplementationOnce(
      () =>
        new Promise<{ error: null }>(resolve => {
          resolveUpdate = resolve;
        })
    );
    renderRecovery();
    await enterMatchingPasswords();

    fireEvent.press(screen.getByTestId('password-recovery-submit'));
    fireEvent.press(screen.getByTestId('password-recovery-submit'));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledTimes(1));
    expect(
      screen.getByTestId('password-recovery-submit').props.accessibilityState
    ).toEqual({ disabled: true, busy: true });

    resolveUpdate?.({ error: null });
    await screen.findByText('Your password has been changed.');
  });

  it('signs out the recovery session before returning to email sign-in', async () => {
    renderRecovery();
    await enterMatchingPasswords();
    fireEvent.press(screen.getByTestId('password-recovery-submit'));
    await screen.findByText('Your password has been changed.');

    fireEvent.press(screen.getByTestId('password-recovery-sign-in'));

    await waitFor(() => expect(mockClearRecovery).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith('/email-auth?mode=login');
  });

  it('renders the saved draft only when one exists on this phone', async () => {
    mockDraft = { promise: 'Walk for 20 minutes after work' };
    renderRecovery();
    await enterMatchingPasswords();
    fireEvent.press(screen.getByTestId('password-recovery-submit'));

    await screen.findByText('Your password has been changed.');
    expect(screen.getByText('Walk for 20 minutes after work')).toBeTruthy();
    expect(
      screen.getByText(
        'Sign in with your new password, then return to your draft.'
      )
    ).toBeTruthy();
  });

  it('navigates to a new request even when durable cleanup storage fails', async () => {
    mockParams = { status: 'invalid' };
    mockClearRecovery
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('storage unavailable'));
    renderRecovery();
    await screen.findByText('This reset link has expired.');

    fireEvent.press(screen.getByTestId('password-recovery-request-link'));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/forgot-password')
    );
  });
});
