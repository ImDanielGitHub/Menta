import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from '@/app/login';
import { ThemeProvider } from '@/constants/ThemeContext';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { resolvePhoneLayout } from '@/constants/phone-layout';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignInWithApple = jest.fn().mockResolvedValue(undefined);
const mockSignInWithGoogle = jest.fn().mockResolvedValue(undefined);
const mockShowToastError = jest.fn();
const mockSaveOnboardingDraft = jest.fn().mockResolvedValue(undefined);
const mockLoadOnboardingDraft = jest.fn().mockResolvedValue(null);
let mockPhoneLayout = resolvePhoneLayout({
  width: 430,
  height: 932,
  fontScale: 1,
});

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View);
  return {
    AlertCircleIcon: Icon,
    AppleIcon: Icon,
    ArrowLeftIcon: Icon,
    CheckCircleIcon: Icon,
    EyeIcon: Icon,
    EyeOffIcon: Icon,
    LockIcon: Icon,
    MailIcon: Icon,
  };
});

jest.mock('@/components/ui/google-glyph', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { GoogleGlyph: () => React.createElement(View) };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({
    isLoading: false,
    signInWithApple: (...args: unknown[]) => mockSignInWithApple(...args),
    signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  }),
}));

jest.mock('@/components/ui/Toast', () => ({
  showToast: {
    error: (...args: unknown[]) => mockShowToastError(...args),
  },
}));

jest.mock('@/lib/onboarding-draft', () => ({
  loadOnboardingDraft: (...args: unknown[]) => mockLoadOnboardingDraft(...args),
  saveOnboardingDraft: (...args: unknown[]) => mockSaveOnboardingDraft(...args),
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 430, height: 932 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

describe('returning login provider methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithApple.mockResolvedValue(undefined);
    mockSignInWithGoogle.mockResolvedValue(undefined);
    mockLoadOnboardingDraft.mockResolvedValue(null);
    mockPhoneLayout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1,
    });
  });

  it('keeps the 430pt auth lane at canonical gutters and control height', () => {
    const screen = render(<LoginScreen />, { wrapper: Wrapper });
    const contentStyle = StyleSheet.flatten(
      screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle
    );
    const googleButtonStyle = StyleSheet.flatten(
      screen.getByTestId('login-google').props.style
    );

    expect(contentStyle.maxWidth).toBe(mentaLayout.phoneFrameMax);
    expect(contentStyle.paddingHorizontal).toBe(mentaLayout.screenInset);
    expect(contentStyle.maxWidth - contentStyle.paddingHorizontal * 2).toBe(
      mentaLayout.taskLane
    );
    expect(googleButtonStyle.minHeight).toBe(mentaLayout.primaryControlHeight);
  });

  it.each([
    { width: 320, height: 568, fontScale: 1, inset: 20, titleSize: 32 },
    { width: 390, height: 844, fontScale: 1, inset: 24, titleSize: 32 },
    { width: 430, height: 932, fontScale: 1, inset: 24, titleSize: 32 },
    { width: 390, height: 844, fontScale: 1.3, inset: 24, titleSize: 41.6 },
    { width: 320, height: 568, fontScale: 2.35, inset: 20, titleSize: 38.4 },
    { width: 390, height: 844, fontScale: 2.35, inset: 24, titleSize: 41.6 },
    { width: 430, height: 932, fontScale: 2.35, inset: 24, titleSize: 44.8 },
  ])('keeps login readable at $width×$height / $fontScale', frame => {
    mockPhoneLayout = resolvePhoneLayout(frame);
    const screen = render(<LoginScreen />, { wrapper: Wrapper });
    const contentStyle = StyleSheet.flatten(
      screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle
    );
    const titleStyle = StyleSheet.flatten(
      screen.getByText('Sign in to Menta').props.style
    );
    expect(contentStyle.paddingHorizontal).toBe(frame.inset);
    expect(titleStyle.fontSize).toBe(frame.titleSize);
    if (frame.fontScale > 1) {
      expect(screen.getByText('Sign in to Menta')).toHaveProp(
        'allowFontScaling',
        false
      );
    }
  });

  it('keeps every saved-draft sign-in action in the AXXL scroll surface', async () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 2.35,
    });
    mockLoadOnboardingDraft.mockResolvedValue({
      accountabilityChoice: 'just_me',
      durationDays: 14,
      marketingOptIn: false,
      ownerUserId: null,
      promise: 'Walk after dinner',
      proofType: 'note',
      referralCode: null,
      resumeStep: 'auth_method',
    });
    const screen = render(<LoginScreen />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Save your promise')).toBeTruthy()
    );
    expect(
      StyleSheet.flatten(
        screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle
      ).paddingHorizontal
    ).toBe(24);
    expect(screen.getByText('Save your promise')).toHaveStyle({
      fontSize: 41.6,
      lineHeight: 49.4,
    });
    expect(
      screen.getByText(
        'Your promise is private on this phone until you sign in.'
      )
    ).toHaveStyle({ fontSize: 20.8, lineHeight: 32.5 });
    expect(screen.getByTestId('login-apple')).toBeTruthy();
    expect(screen.getByTestId('login-google')).toBeTruthy();
    expect(screen.getByTestId('login-email')).toBeTruthy();
    expect(screen.getByTestId('login-replay-intro')).toBeTruthy();
    expect(screen.getByText('Sign in with Apple')).toHaveProp(
      'allowFontScaling',
      false
    );
    expect(screen.getByText('Sign in with Apple')).toHaveStyle({
      fontSize: 22.1,
      lineHeight: 31.2,
    });
    expect(screen.getByText('Sign in with Google')).toHaveStyle({
      fontSize: 18.2,
      lineHeight: 26,
    });
  });

  it('shows Google directly and locks the stack to one provider attempt', async () => {
    let resolveGoogle: (() => void) | undefined;
    mockSignInWithGoogle.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveGoogle = resolve;
        })
    );
    const screen = render(<LoginScreen />, { wrapper: Wrapper });

    expect(
      StyleSheet.flatten(screen.getByText('Sign in with Google').props.style)
    ).toMatchObject({
      fontFamily: 'GoogleSansMedium',
      fontSize: 14,
      lineHeight: 20,
    });

    fireEvent.press(screen.getByTestId('login-google'));
    fireEvent.press(screen.getByTestId('login-google'));
    fireEvent.press(screen.getByTestId('login-apple'));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1));
    expect(mockSignInWithApple).not.toHaveBeenCalled();
    expect(screen.getByTestId('login-google').props.accessibilityState).toEqual(
      {
        disabled: true,
        busy: true,
      }
    );
    expect(screen.getByTestId('login-apple').props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
    expect(
      StyleSheet.flatten(screen.getByText('Sign in with Google').props.style)
    ).toMatchObject({
      fontFamily: 'GoogleSansMedium',
      fontSize: 14,
      lineHeight: 20,
    });

    resolveGoogle?.();
    await waitFor(() =>
      expect(
        screen.getByTestId('login-google').props.accessibilityState
      ).toEqual({ disabled: false, busy: false })
    );
  });

  it('keeps cancellation quiet on the login screen', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(
      new Error('Sign-in was cancelled')
    );
    const screen = render(<LoginScreen />, { wrapper: Wrapper });

    fireEvent.press(screen.getByTestId('login-google'));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('login-error')).toBeNull();
    expect(mockShowToastError).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(await screen.findByText('Sign-in cancelled')).toBeTruthy();
    expect(
      screen.getByText(
        'No account was connected. Try again or choose another sign-in method.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Keep editing my promise')).toBeNull();
    expect(
      screen.queryByText(
        'Your first promise remains on this phone until Menta confirms it is saved.'
      )
    ).toBeNull();
  });

  it('fails closed when the provider-cancellation recovery save fails', async () => {
    mockLoadOnboardingDraft.mockResolvedValueOnce({
      version: 3,
      promise: 'Walk after work',
      proofType: 'photo',
      durationDays: 14,
      marketingOptIn: false,
      updatedAt: '2026-08-25T00:00:00.000Z',
      ownerUserId: null,
      resumeStep: 'auth_method',
    });
    mockSaveOnboardingDraft
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('storage failed'));
    mockSignInWithGoogle.mockRejectedValueOnce(
      new Error('Sign-in was cancelled')
    );
    const screen = render(<LoginScreen />, { wrapper: Wrapper });
    await screen.findByText('Save your promise');

    fireEvent.press(screen.getByTestId('login-google'));

    expect(
      await screen.findByText(
        'Sign-in was cancelled, but Menta could not save that recovery state. Your promise is still on this screen. Try again.'
      )
    ).toBeTruthy();
    expect(mockSaveOnboardingDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({ durationDays: 14 }),
      null,
      'auth_cancelled'
    );
    expect(mockReplace).not.toHaveBeenCalledWith('/login');
    expect(screen.getByTestId('login-google')).toBeEnabled();
  });

  it('retains the selected promise length across an email handoff', async () => {
    mockLoadOnboardingDraft.mockResolvedValueOnce({
      version: 3,
      promise: 'Walk after work',
      proofType: 'photo',
      durationDays: 30,
      marketingOptIn: false,
      updatedAt: '2026-08-25T00:00:00.000Z',
      ownerUserId: null,
      resumeStep: 'auth_method',
    });
    const screen = render(<LoginScreen />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Save your promise')).toBeTruthy()
    );
    fireEvent.press(screen.getByTestId('login-email'));

    await waitFor(() =>
      expect(mockSaveOnboardingDraft).toHaveBeenCalledWith(
        {
          promise: 'Walk after work',
          proofType: 'photo',
          durationDays: 30,
        },
        null,
        'auth_method'
      )
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/email-auth?mode=login')
    );
  });

  it('waits for durable draft storage before opening email auth', async () => {
    let finishSave: (() => void) | undefined;
    mockLoadOnboardingDraft.mockResolvedValueOnce({
      version: 3,
      promise: 'Read every night',
      proofType: 'note',
      durationDays: 7,
      marketingOptIn: false,
      updatedAt: '2026-08-25T00:00:00.000Z',
      ownerUserId: null,
      resumeStep: 'auth_method',
    });
    mockSaveOnboardingDraft.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finishSave = resolve;
        })
    );
    const screen = render(<LoginScreen />, { wrapper: Wrapper });
    await screen.findByText('Save your promise');

    fireEvent.press(screen.getByTestId('login-email'));
    expect(mockPush).not.toHaveBeenCalled();

    finishSave?.();
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/email-auth?mode=login')
    );
  });

  it('keeps auth closed and shows a retryable error when draft storage fails', async () => {
    mockLoadOnboardingDraft.mockResolvedValueOnce({
      version: 3,
      promise: 'Read every night',
      proofType: 'note',
      durationDays: 7,
      marketingOptIn: false,
      updatedAt: '2026-08-25T00:00:00.000Z',
      ownerUserId: null,
      resumeStep: 'auth_method',
    });
    mockSaveOnboardingDraft.mockRejectedValueOnce(new Error('storage failed'));
    const screen = render(<LoginScreen />, { wrapper: Wrapper });
    await screen.findByText('Save your promise');

    fireEvent.press(screen.getByTestId('login-email'));

    expect(
      await screen.findByText(
        'Menta could not keep your promise on this phone. Try again before continuing.'
      )
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('keeps the introductory replay route available from sign-in', () => {
    const screen = render(<LoginScreen />, { wrapper: Wrapper });

    fireEvent.press(screen.getByTestId('login-replay-intro'));

    expect(mockPush).toHaveBeenCalledWith('/onboarding-again');
  });

  it('keeps the provider choices alongside an inline retryable failure', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(
      new Error('Provider unavailable')
    );
    const screen = render(<LoginScreen />, { wrapper: Wrapper });

    fireEvent.press(screen.getByTestId('login-google'));

    expect(await screen.findByText('We could not sign you in')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta could not complete Google sign-in. Try again or choose another sign-in method.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Sign in with Apple')).toBeTruthy();
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
    expect(screen.getByText('Use email')).toBeTruthy();
    expect(screen.getByTestId('login-error')).toBeTruthy();
    expect(mockShowToastError).not.toHaveBeenCalled();
  });
});
