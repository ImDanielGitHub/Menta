import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmailAuthScreen from '@/app/email-auth';
import { ThemeProvider } from '@/constants/ThemeContext';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { resolvePhoneLayout } from '@/constants/phone-layout';

let mockPhoneLayout = resolvePhoneLayout({
  width: 430,
  height: 932,
  fontScale: 1,
});

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockHydrateEmailConfirmation = jest.fn();
const mockStageEmailConfirmation = jest.fn();

let mockParams: Record<string, string | string[] | undefined> = {};
let mockAuthenticated = false;
let mockHasCompletedOnboarding = false;
let mockLoading = false;
let mockUser: { id: string } | null = null;
let mockPendingEmailConfirmation: { email: string } | null = null;
let mockEmailConfirmationHydrated = true;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({
    hasCompletedOnboarding: mockHasCompletedOnboarding,
    isAuthenticated: mockAuthenticated,
    isLoading: mockLoading,
    login: mockLogin,
    register: mockRegister,
    user: mockUser,
  }),
}));

jest.mock('@/store/email-confirmation-store', () => ({
  useEmailConfirmationStore: (selector: (state: unknown) => unknown) =>
    selector({
      pending: mockPendingEmailConfirmation,
      hasHydrated: mockEmailConfirmationHydrated,
      hydrate: mockHydrateEmailConfirmation,
      stage: mockStageEmailConfirmation,
    }),
}));

jest.mock('@/components/onboarding/PaperAuthSurface', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    PaperAuthLegal: ({ testID }: { testID: string }) =>
      React.createElement(
        View,
        { testID },
        React.createElement(
          Text,
          null,
          'Next, you’ll review and accept Menta’s current account and community documents.'
        ),
        React.createElement(View, {
          testID: `${testID}-community-standards`,
        })
      ),
    usePaperAuthDraft: () => null,
  };
});

const renderEmailAuth = () =>
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
        <EmailAuthScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('EmailAuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { mode: 'login' };
    mockAuthenticated = false;
    mockHasCompletedOnboarding = false;
    mockLoading = false;
    mockUser = null;
    mockPendingEmailConfirmation = null;
    mockEmailConfirmationHydrated = true;
    mockLogin.mockResolvedValue(undefined);
    mockRegister.mockResolvedValue({
      status: 'session_confirmed',
      email: 'me@example.com',
      userId: 'email-user',
    });
    mockHydrateEmailConfirmation.mockResolvedValue(null);
    mockStageEmailConfirmation.mockResolvedValue(undefined);
    mockPhoneLayout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1,
    });
  });

  it('fits email sign-in and its fields to the short-phone AXXL envelope', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 320,
      height: 568,
      fontScale: 2.35,
    });
    const view = renderEmailAuth();
    const contentStyle = StyleSheet.flatten(
      view.UNSAFE_getByType(ScrollView).props.contentContainerStyle
    );

    expect(screen.getByText('Sign in with email')).toHaveStyle({
      fontSize: 38.4,
      lineHeight: 45.6,
    });
    expect(contentStyle.paddingHorizontal).toBe(20);
    expect(screen.getByTestId('email-auth-email')).toBeTruthy();
    expect(screen.getByTestId('email-auth-password')).toBeTruthy();
    expect(screen.getByTestId('email-auth-submit')).toBeTruthy();
  });

  it('keeps the focused email form and submit action reachable at AXXL', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 2.35,
    });
    const view = renderEmailAuth();
    const scrollView = view.UNSAFE_getByType(ScrollView);

    expect(scrollView.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(screen.getByText('Sign in with email')).toHaveStyle({
      fontSize: 41.6,
      lineHeight: 49.4,
    });
    expect(screen.getByText('Email')).toHaveStyle({
      fontSize: 19.5,
      lineHeight: 27.3,
    });
    expect(screen.getByText('Sign in', { exact: true })).toHaveStyle({
      fontSize: 22.1,
      lineHeight: 31.2,
    });
  });

  it('keeps the 430pt email lane at canonical gutters and control height', () => {
    const view = renderEmailAuth();
    const contentStyle = StyleSheet.flatten(
      view.UNSAFE_getByType(ScrollView).props.contentContainerStyle
    );
    const submitStyle = StyleSheet.flatten(
      screen.getByTestId('email-auth-submit').props.style
    );

    expect(contentStyle.maxWidth).toBe(mentaLayout.phoneFrameMax);
    expect(contentStyle.paddingHorizontal).toBe(mentaLayout.screenInset);
    expect(contentStyle.maxWidth - contentStyle.paddingHorizontal * 2).toBe(
      mentaLayout.taskLane
    );
    expect(submitStyle.minHeight).toBe(mentaLayout.primaryControlHeight);
  });

  it('keeps an invalid email inline and does not call the auth service', () => {
    renderEmailAuth();

    fireEvent.changeText(screen.getByTestId('email-auth-email'), 'nope');
    fireEvent.changeText(
      screen.getByTestId('email-auth-password'),
      'secret123'
    );
    fireEvent.press(screen.getByTestId('email-auth-submit'));

    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  });

  it('allows an existing account to sign in with its current password', async () => {
    renderEmailAuth();

    fireEvent.changeText(
      screen.getByTestId('email-auth-email'),
      'me@example.com'
    );
    fireEvent.changeText(screen.getByTestId('email-auth-password'), 'secret');
    fireEvent.press(screen.getByTestId('email-auth-submit'));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('me@example.com', 'secret')
    );
  });

  it('requires eight characters for a new account password', () => {
    mockParams = { mode: 'signup' };
    renderEmailAuth();

    fireEvent.changeText(screen.getByTestId('email-auth-name'), 'Daniel');
    fireEvent.changeText(
      screen.getByTestId('email-auth-email'),
      'me@example.com'
    );
    fireEvent.changeText(screen.getByTestId('email-auth-password'), 'seven77');
    fireEvent.changeText(
      screen.getByTestId('email-auth-confirm-password'),
      'seven77'
    );
    fireEvent.press(screen.getByTestId('email-auth-submit'));

    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('sends users to the reset request with a normalised email', () => {
    renderEmailAuth();

    fireEvent.changeText(
      screen.getByTestId('email-auth-email'),
      '  ME@EXAMPLE.COM '
    );
    fireEvent.press(screen.getByTestId('email-auth-forgot-password'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/forgot-password',
      params: { email: 'me@example.com' },
    });
  });

  it('returns to onboarding methods when the draft opened email auth', () => {
    mockParams = { mode: 'signup', from: 'onboarding' };
    renderEmailAuth();

    fireEvent.press(screen.getByLabelText('Other sign-in options'));

    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('shows all legal documents for signup without treating sign-in as acceptance', () => {
    mockParams = { mode: 'signup' };
    const signup = renderEmailAuth();

    expect(
      screen.getByText(
        'Next, you’ll review and accept Menta’s current account and community documents.'
      )
    ).toBeTruthy();
    expect(
      screen.getByTestId('email-auth-legal-community-standards')
    ).toBeTruthy();
    signup.unmount();

    mockParams = { mode: 'login' };
    renderEmailAuth();
    expect(screen.queryByTestId('email-auth-legal')).toBeNull();
  });

  it('synchronously prevents a duplicate email sign-in submission', async () => {
    let resolveLogin: (() => void) | undefined;
    mockLogin.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveLogin = resolve;
        })
    );
    renderEmailAuth();

    fireEvent.changeText(
      screen.getByTestId('email-auth-email'),
      'me@example.com'
    );
    fireEvent.changeText(
      screen.getByTestId('email-auth-password'),
      'secret123'
    );

    fireEvent.press(screen.getByTestId('email-auth-submit'));
    fireEvent.press(screen.getByTestId('email-auth-submit'));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(
      screen.getByTestId('email-auth-forgot-password').props.accessibilityState
    ).toEqual({ disabled: true, busy: true });
    expect(
      screen.getByTestId('email-auth-switch-mode').props.accessibilityState
    ).toEqual({ disabled: true, busy: true });

    resolveLogin?.();
    await waitFor(() =>
      expect(
        screen.getByTestId('email-auth-forgot-password').props
          .accessibilityState
      ).toEqual({ disabled: false, busy: false })
    );
  });

  it('disables recovery and mode-switch links while the auth store is busy', () => {
    mockLoading = true;
    renderEmailAuth();

    expect(screen.getByText('Sign in with email')).toBeTruthy();
    expect(screen.queryByText('Signing you in')).toBeNull();
    expect(
      screen.getByTestId('email-auth-forgot-password').props.accessibilityState
    ).toEqual({ disabled: true, busy: true });
    expect(
      screen.getByTestId('email-auth-switch-mode').props.accessibilityState
    ).toEqual({ disabled: true, busy: true });

    fireEvent.press(screen.getByTestId('email-auth-forgot-password'));
    fireEvent.press(screen.getByTestId('email-auth-switch-mode'));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('keeps a duplicate signup failure attached to the email field', async () => {
    mockParams = { mode: 'signup' };
    mockRegister.mockRejectedValueOnce(new Error('Email already registered'));
    renderEmailAuth();

    fireEvent.changeText(screen.getByTestId('email-auth-name'), 'Daniel');
    fireEvent.changeText(
      screen.getByTestId('email-auth-email'),
      'me@example.com'
    );
    fireEvent.changeText(
      screen.getByTestId('email-auth-password'),
      'secret123'
    );
    fireEvent.changeText(
      screen.getByTestId('email-auth-confirm-password'),
      'secret123'
    );
    fireEvent.press(screen.getByTestId('email-auth-submit'));

    await waitFor(() => {
      expect(
        screen.getByText('This email already has a Menta account.')
      ).toBeTruthy();
    });
    expect(screen.queryByTestId('email-auth-error')).toBeNull();
  });

  it('lets RootLayout own the post-auth onboarding handoff', async () => {
    mockParams = { mode: 'signup', from: 'onboarding' };
    mockRegister.mockImplementationOnce(async () => {
      mockAuthenticated = true;
      mockUser = { id: 'email-user' };
      return {
        status: 'session_confirmed',
        email: 'me@example.com',
        userId: 'email-user',
      };
    });
    renderEmailAuth();

    fireEvent.changeText(screen.getByTestId('email-auth-name'), 'Daniel');
    fireEvent.changeText(
      screen.getByTestId('email-auth-email'),
      'me@example.com'
    );
    fireEvent.changeText(
      screen.getByTestId('email-auth-password'),
      'secret123'
    );
    fireEvent.changeText(
      screen.getByTestId('email-auth-confirm-password'),
      'secret123'
    );
    fireEvent.press(screen.getByTestId('email-auth-submit'));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister).toHaveBeenCalledWith(
      'me@example.com',
      'secret123',
      'Daniel'
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('replaces the signup form with a durable check-email state when no session exists', async () => {
    mockParams = { mode: 'signup', from: 'onboarding' };
    mockRegister.mockResolvedValueOnce({
      status: 'confirmation_required',
      email: 'me@example.com',
      userId: 'pending-user',
    });
    renderEmailAuth();

    fireEvent.changeText(screen.getByTestId('email-auth-name'), 'Daniel');
    fireEvent.changeText(
      screen.getByTestId('email-auth-email'),
      '  ME@EXAMPLE.COM '
    );
    fireEvent.changeText(
      screen.getByTestId('email-auth-password'),
      'secret123'
    );
    fireEvent.changeText(
      screen.getByTestId('email-auth-confirm-password'),
      'secret123'
    );
    fireEvent.press(screen.getByTestId('email-auth-submit'));

    await waitFor(() =>
      expect(mockStageEmailConfirmation).toHaveBeenCalledWith({
        email: 'me@example.com',
        username: 'Daniel',
        expectedUserId: 'pending-user',
        fromOnboarding: true,
      })
    );
    expect(mockReplace).toHaveBeenCalledWith('/email-confirmation');
  });

  it('does not expose the signup form again when a pending confirmation reloads', async () => {
    mockParams = { mode: 'signup', from: 'onboarding' };
    mockPendingEmailConfirmation = { email: 'saved@example.com' };

    renderEmailAuth();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/email-confirmation')
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
