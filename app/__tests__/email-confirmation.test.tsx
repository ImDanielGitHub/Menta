import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmailConfirmationScreen from '@/app/email-confirmation';
import { ThemeProvider } from '@/constants/ThemeContext';
import { resolvePhoneLayout } from '@/constants/phone-layout';

const mockReplace = jest.fn();
const mockHydrate = jest.fn();
const mockMarkResent = jest.fn();
const mockClear = jest.fn();
const mockResend = jest.fn();
const mockRecover = jest.fn();

let mockParams: Record<string, string | string[] | undefined> = {};
let mockPending: {
  version: 1;
  email: string;
  username: string;
  expectedUserId: string | null;
  fromOnboarding: boolean;
  requestedAt: number;
  resendAvailableAt: number;
} | null = null;
let mockHydrated = true;
let mockPhoneLayout = resolvePhoneLayout({
  width: 430,
  height: 932,
  fontScale: 1,
});

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

jest.mock('@/store/email-confirmation-store', () => ({
  useEmailConfirmationStore: (selector: (state: unknown) => unknown) =>
    selector({
      pending: mockPending,
      hasHydrated: mockHydrated,
      hydrate: mockHydrate,
      markResent: mockMarkResent,
      clear: mockClear,
    }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      resendEmailConfirmation: mockResend,
      recoverEmailConfirmationSession: mockRecover,
    }),
}));

const pendingAt = (resendAvailableAt: number) => ({
  version: 1 as const,
  email: 'alex@example.com',
  username: 'alexm',
  expectedUserId: 'pending-user',
  fromOnboarding: true,
  requestedAt: Date.now() - 1000,
  resendAvailableAt,
});

const renderConfirmation = () =>
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
        <EmailConfirmationScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('EmailConfirmationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockHydrated = true;
    mockPending = pendingAt(Date.now() - 1);
    mockPhoneLayout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1,
    });
    mockHydrate.mockResolvedValue(mockPending);
    mockMarkResent.mockResolvedValue(mockPending);
    mockClear.mockResolvedValue(undefined);
    mockResend.mockResolvedValue(undefined);
    mockRecover.mockResolvedValue('no_session');
  });

  it('shows the exact address and keeps every recovery action in a scrollable 320pt layout', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 320,
      height: 568,
      fontScale: 2.35,
    });
    const view = renderConfirmation();

    expect(view.UNSAFE_getByType(ScrollView)).toBeTruthy();
    expect(screen.getByText('alex@example.com')).toBeTruthy();
    expect(screen.getByText('I’ve confirmed my email')).toBeTruthy();
    expect(screen.getByText('Resend confirmation')).toBeTruthy();
    expect(screen.getByText('Sign in instead')).toBeTruthy();
    expect(screen.getByLabelText('Change email')).toBeTruthy();
  });

  it('holds resend behind the saved cooldown', () => {
    mockPending = pendingAt(Date.now() + 45_000);
    renderConfirmation();

    const resend = screen.getByTestId('email-confirmation-resend');
    expect(resend.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText(/Resend in 4[45]s/)).toBeTruthy();

    fireEvent.press(resend);
    expect(mockResend).not.toHaveBeenCalled();
  });

  it('locks one resend, persists the next cooldown, and shows the success result', async () => {
    let finishResend: (() => void) | undefined;
    mockResend.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finishResend = resolve;
        })
    );
    renderConfirmation();

    const resend = screen.getByTestId('email-confirmation-resend');
    fireEvent.press(resend);
    fireEvent.press(resend);

    expect(mockResend).toHaveBeenCalledTimes(1);
    finishResend?.();

    await waitFor(() =>
      expect(mockMarkResent).toHaveBeenCalledWith('alex@example.com')
    );
    expect(screen.getByText('New confirmation sent')).toBeTruthy();
  });

  it('clears the pending handoff before replacing the route with the editable signup', async () => {
    renderConfirmation();

    fireEvent.press(screen.getByLabelText('Change email'));

    await waitFor(() => expect(mockClear).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/email-auth',
      params: {
        mode: 'signup',
        email: 'alex@example.com',
        name: 'alexm',
        from: 'onboarding',
      },
    });
  });

  it('continues only after the auth store confirms a matching session', async () => {
    mockRecover.mockResolvedValueOnce('session_confirmed');
    renderConfirmation();

    fireEvent.press(screen.getByTestId('email-confirmation-check'));

    await waitFor(() =>
      expect(mockRecover).toHaveBeenCalledWith('alex@example.com')
    );
    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('turns an expired callback into a resendable recovery state', () => {
    mockParams = { status: 'expired' };
    renderConfirmation();

    expect(screen.getByText('That confirmation link expired')).toBeTruthy();
    expect(screen.getByTestId('email-confirmation-resend')).toBeTruthy();
  });

  it('offers a safe sign-in path without clearing the pending signup first', () => {
    renderConfirmation();

    fireEvent.press(screen.getByTestId('email-confirmation-sign-in'));

    expect(mockClear).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/email-auth',
      params: {
        mode: 'login',
        email: 'alex@example.com',
        from: 'confirmation',
      },
    });
  });
});
