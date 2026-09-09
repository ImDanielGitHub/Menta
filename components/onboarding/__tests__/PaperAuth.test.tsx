import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperAuthCheckEmail, PaperAuthResetForm } from '../PaperAuthReset';
import { PaperAuthForm } from '../PaperAuthForm';
import { PaperAuthMethods } from '../PaperAuthMethods';
import { PaperOAuthCancelled } from '../PaperAuthSurface';
import { AppTextScaleProvider } from '@/components/ui/AppScaledText';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { resolvePhoneLayout } from '@/constants/phone-layout';

let mockPhoneLayout = resolvePhoneLayout({
  width: 390,
  height: 844,
  fontScale: 1,
});

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
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

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

const LargePhoneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 430, height: 932 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

const ResponsivePhoneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
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
    {children}
  </SafeAreaProvider>
);

describe('Paper auth surfaces', () => {
  beforeEach(() => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 1,
    });
  });

  it.each([
    { width: 320, height: 568, titleSize: 48, titleLeading: 55.2 },
    { width: 390, height: 844, titleSize: 52, titleLeading: 59.8 },
    { width: 430, height: 932, titleSize: 56, titleLeading: 64.4 },
  ])(
    'fits provider methods to the $width-point AXXL envelope',
    ({ width, height, titleSize, titleLeading }) => {
      mockPhoneLayout = resolvePhoneLayout({
        width,
        height,
        fontScale: 2.35,
      });
      render(
        <PaperAuthMethods
          draft={null}
          onApple={jest.fn()}
          onEmail={jest.fn()}
          onGoogle={jest.fn()}
          testID="auth-methods-scaled"
        />,
        { wrapper: ResponsivePhoneWrapper }
      );

      expect(screen.getByText('Sign in to Menta')).toHaveStyle({
        fontSize: titleSize,
        lineHeight: titleLeading,
      });
      expect(screen.getByText('Sign in to Menta')).toHaveProp(
        'allowFontScaling',
        false
      );
      expect(screen.getByTestId('auth-methods-scaled-apple')).toBeTruthy();
      expect(screen.getByTestId('auth-methods-scaled-google')).toBeTruthy();
      expect(screen.getByTestId('auth-methods-scaled-email')).toBeTruthy();
      expect(
        StyleSheet.flatten(
          screen.getByTestId('auth-methods-scaled').props.contentContainerStyle
        ).paddingHorizontal
      ).toBe(mockPhoneLayout.screenInset);
    }
  );

  it('uses the large-phone task lane for provider actions and keeps reading copy capped', () => {
    render(
      <PaperAuthMethods
        draft={null}
        onApple={jest.fn()}
        onEmail={jest.fn()}
        onGoogle={jest.fn()}
        testID="auth-methods-wide"
      />,
      { wrapper: LargePhoneWrapper }
    );

    expect(screen.getByTestId('auth-methods-wide-task-lane')).toHaveStyle({
      maxWidth: mentaLayout.taskLane,
      width: '100%',
    });
    expect(screen.getByTestId('auth-methods-wide-heading-block')).toHaveStyle({
      maxWidth: 330,
    });
    expect(screen.getByTestId('paper-auth-legal')).toHaveStyle({
      maxWidth: mentaLayout.readingMeasure,
    });
    expect(
      screen.getByText(
        'Before you use the account, you’ll review and accept Menta’s current account and community documents.'
      )
    ).toHaveStyle({ maxWidth: 320 });
    expect(screen.getByText('Sign in to Menta')).toBeTruthy();
    expect(
      screen.getByTestId('paper-auth-legal-community-standards')
    ).toBeTruthy();
  });

  it('caps standalone auth copy, controls, and fields at AXXL', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 2.35,
    });

    render(
      <PaperAuthForm
        mode="login"
        onSubmit={jest.fn(async () => undefined)}
        testID="auth-form-axxl"
      />,
      { wrapper: ResponsivePhoneWrapper }
    );

    expect(screen.getByText('Sign in with email')).toHaveProp(
      'allowFontScaling',
      false
    );
    expect(screen.getByText('Sign in with email')).toHaveStyle({
      fontSize: 44.2,
      lineHeight: 48.1,
    });
    expect(screen.getByText('Email')).toHaveStyle({
      fontSize: 19.5,
      lineHeight: 27.3,
    });
    expect(screen.getByTestId('auth-form-axxl-email-input')).toHaveProp(
      'allowFontScaling',
      false
    );
    expect(screen.getByText('Sign in')).toHaveStyle({
      fontSize: 22.1,
      lineHeight: 31.2,
    });
  });

  it('keeps every registration field and action in the AXXL auth surface', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 2.35,
    });

    render(
      <PaperAuthForm
        mode="signup"
        onSubmit={jest.fn(async () => undefined)}
        onSwitchMode={jest.fn()}
        testID="auth-form-signup-axxl"
      />,
      { wrapper: ResponsivePhoneWrapper }
    );

    expect(screen.getByText('Create your account')).toHaveStyle({
      fontSize: 44.2,
      lineHeight: 48.1,
    });
    expect(screen.getByTestId('auth-form-signup-axxl-name-input')).toHaveProp(
      'allowFontScaling',
      false
    );
    expect(
      screen.getByTestId('auth-form-signup-axxl-email-input')
    ).toBeTruthy();
    expect(
      screen.getByTestId('auth-form-signup-axxl-password-input')
    ).toBeTruthy();
    expect(
      screen.getByTestId('auth-form-signup-axxl-confirm-password-input')
    ).toBeTruthy();
    expect(screen.getByTestId('auth-form-signup-axxl-legal')).toBeTruthy();
    expect(screen.getByTestId('auth-form-signup-axxl-submit')).toBeTruthy();
    expect(
      screen.getByTestId('auth-form-signup-axxl-switch-mode')
    ).toBeTruthy();
  });

  it('uses the large-phone task lane for email and reset controls', () => {
    const form = render(
      <PaperAuthForm
        mode="login"
        onSubmit={jest.fn(async () => undefined)}
        testID="auth-form-wide"
      />,
      { wrapper: LargePhoneWrapper }
    );

    expect(form.getByTestId('auth-form-wide-login')).toHaveStyle({
      maxWidth: mentaLayout.taskLane,
      width: '100%',
    });
    form.unmount();

    const reset = render(
      <PaperAuthResetForm
        email="daniel@example.com"
        onBackToSignIn={jest.fn()}
        onEmailChange={jest.fn()}
        onSubmit={jest.fn()}
        testID="auth-reset-wide"
      />,
      { wrapper: LargePhoneWrapper }
    );

    expect(reset.getByTestId('auth-reset-wide-task-lane')).toHaveStyle({
      maxWidth: mentaLayout.taskLane,
      width: '100%',
    });
    reset.unmount();

    const checkEmail = render(
      <PaperAuthCheckEmail
        email="daniel@example.com"
        onBackToSignIn={jest.fn()}
        onSendAnother={jest.fn()}
        testID="auth-check-wide"
      />,
      { wrapper: LargePhoneWrapper }
    );

    expect(checkEmail.getByTestId('auth-check-wide-task-lane')).toHaveStyle({
      maxWidth: mentaLayout.taskLane,
      width: '100%',
    });
  });

  it('keeps cancellation recovery controls at least 44 points tall', () => {
    render(
      <AppTextScaleProvider scale={1.3}>
        <PaperOAuthCancelled
          hasDraft
          onChooseMethod={jest.fn()}
          onKeepDraft={jest.fn()}
          testID="auth-cancelled"
        />
      </AppTextScaleProvider>,
      { wrapper: LargePhoneWrapper }
    );

    const back = screen.getByTestId('auth-cancelled-back');
    const keepDraft = screen.getByTestId('auth-cancelled-keep-draft');
    expect(screen.getByText('You’re still signed out.')).toBeTruthy();
    expect(screen.getByText('Your local promise is still here')).toBeTruthy();
    expect(screen.getByText('Choose sign-in method')).toBeTruthy();
    expect(screen.getByText('Keep local draft')).toBeTruthy();
    expect(back.props.accessibilityRole).toBe('button');
    expect(back.props.accessibilityLabel).toBe('Choose sign-in method');
    expect(back).toHaveStyle({
      minHeight: mentaLayout.minimumTouchTarget,
      minWidth: mentaLayout.minimumTouchTarget,
    });
    expect(keepDraft.props.accessibilityRole).toBe('button');
    expect(keepDraft).toHaveStyle({
      minHeight: mentaLayout.minimumTouchTarget,
    });
    expect(screen.getByText('You’re still signed out.')).toHaveStyle({
      fontSize: 20.8,
      lineHeight: 26,
    });
  });

  it('renders the Paper create-account hierarchy and validates before calling the store', () => {
    const onSubmit = jest.fn(async () => undefined);

    render(
      <PaperAuthForm mode="signup" onSubmit={onSubmit} testID="auth-signup" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('After this')).toBeTruthy();
    expect(screen.getByText('Return to your first promise')).toBeTruthy();
    expect(screen.getByText('Create your account')).toBeTruthy();
    expect(screen.getByText('8+ characters')).toBeTruthy();

    fireEvent(
      screen.getByTestId('auth-signup-confirm-password-input'),
      'submitEditing'
    );

    expect(
      screen.getByText('Choose the username people will see in Menta.')
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps account creation disabled until the password has eight characters', () => {
    render(
      <PaperAuthForm
        mode="signup"
        onSubmit={jest.fn(async () => undefined)}
        testID="auth-signup"
      />,
      { wrapper: Wrapper }
    );

    fireEvent.changeText(
      screen.getByTestId('auth-signup-name-input'),
      'Daniel'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-email-input'),
      'daniel@example.com'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-password-input'),
      'seven77'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-confirm-password-input'),
      'seven77'
    );

    expect(
      screen.getByTestId('auth-signup-submit').props.accessibilityState
    ).toEqual({ disabled: true, busy: false });
  });

  it('submits the existing signup payload and exposes 44px password visibility controls', async () => {
    const onSubmit = jest.fn(async () => undefined);

    render(
      <PaperAuthForm mode="signup" onSubmit={onSubmit} testID="auth-signup" />,
      { wrapper: Wrapper }
    );

    fireEvent.changeText(
      screen.getByTestId('auth-signup-name-input'),
      'Daniel'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-email-input'),
      'daniel@example.com'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-password-input'),
      'secret123'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-confirm-password-input'),
      'secret123'
    );

    expect(
      screen.getByTestId('auth-signup-password-visibility').props
        .accessibilityLabel
    ).toBe('Show password');
    expect(
      StyleSheet.flatten(
        screen.getByTestId('auth-signup-password-shell').props.style
      )
    ).toMatchObject({
      borderRadius: 12,
      minHeight: 48,
    });
    expect(
      StyleSheet.flatten(
        screen.getByTestId('auth-signup-password-visibility').props.style
      )
    ).toMatchObject({
      height: 44,
      width: 44,
    });
    fireEvent.press(screen.getByTestId('auth-signup-password-visibility'));
    expect(
      screen.getByTestId('auth-signup-password-visibility').props
        .accessibilityLabel
    ).toBe('Hide password');

    fireEvent.press(screen.getByTestId('auth-signup-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Daniel',
        email: 'daniel@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      });
    });
  });

  it('keeps duplicate-account failure inline and disables the Paper CTA until corrected', async () => {
    const onSubmit = jest.fn(async () => {
      throw new Error('User already registered');
    });

    render(
      <PaperAuthForm mode="signup" onSubmit={onSubmit} testID="auth-signup" />,
      { wrapper: Wrapper }
    );

    fireEvent.changeText(
      screen.getByTestId('auth-signup-name-input'),
      'Daniel'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-email-input'),
      'daniel@example.com'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-password-input'),
      'secret123'
    );
    fireEvent.changeText(
      screen.getByTestId('auth-signup-confirm-password-input'),
      'secret123'
    );
    fireEvent.press(screen.getByTestId('auth-signup-submit'));

    await waitFor(() => {
      expect(
        screen.getByText('This email already has a Menta account.')
      ).toBeTruthy();
      expect(
        screen.getByText(
          'Your promise is still here. Fix the highlighted field or sign in instead.'
        )
      ).toBeTruthy();
    });
  });

  it('keeps a valid email submission single-flight and names the busy account state', () => {
    const onSubmit = jest.fn(async () => undefined);

    render(
      <PaperAuthForm
        initialEmail="daniel@example.com"
        isLoading
        mode="signup"
        onSubmit={onSubmit}
        testID="auth-signup"
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Creating your account')).toBeTruthy();
    expect(
      screen.getByText(
        'Your promise stays on this phone while we create the account.'
      )
    ).toBeTruthy();
    const submit = screen.getByTestId('auth-signup-submit');
    expect(submit.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
    fireEvent.press(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders the sign-in Paper state with forgot-password navigation', () => {
    const onForgotPassword = jest.fn();
    const onSwitchMode = jest.fn();

    render(
      <PaperAuthForm
        mode="login"
        onForgotPassword={onForgotPassword}
        onSubmit={jest.fn(async () => undefined)}
        onSwitchMode={onSwitchMode}
        testID="auth-login"
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Sign in with email')).toBeTruthy();
    expect(
      screen.getByText('You will return to your first promise.')
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('auth-login-forgot-password'));
    fireEvent.press(screen.getByTestId('auth-login-switch-mode'));
    expect(onForgotPassword).toHaveBeenCalledWith('');
    expect(onSwitchMode).toHaveBeenCalledTimes(1);
  });

  it('keeps Apple, Google, email, and the local promise visible', () => {
    const onApple = jest.fn();
    const onGoogle = jest.fn();
    const onEmail = jest.fn();

    render(
      <PaperAuthMethods
        draft={{
          version: 2,
          promise: 'Walk for 20 minutes after work',
          proofType: 'photo',
          updatedAt: new Date().toISOString(),
          ownerUserId: null,
        }}
        onApple={onApple}
        onEmail={onEmail}
        onGoogle={onGoogle}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Returning to')).toBeTruthy();
    expect(screen.queryByText('Return after sign-in')).toBeNull();
    expect(screen.getByText('Walk for 20 minutes after work')).toBeTruthy();
    expect(screen.getByText('Save your promise')).toBeTruthy();
    fireEvent.press(screen.getByText('Continue with Apple'));
    fireEvent.press(screen.getByText('Continue with Google'));
    fireEvent.press(screen.getByText('Continue with email'));
    expect(onApple).toHaveBeenCalledTimes(1);
    expect(onGoogle).toHaveBeenCalledTimes(1);
    expect(onEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps provider rows stable and exposes provider-specific busy state', () => {
    render(
      <PaperAuthMethods
        appleLoading={false}
        draft={null}
        googleLoading
        onApple={jest.fn()}
        onEmail={jest.fn()}
        onGoogle={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    const apple = screen.getByTestId('paper-auth-methods-apple');
    const google = screen.getByTestId('paper-auth-methods-google');
    const email = screen.getByTestId('paper-auth-methods-email');

    expect(apple.props.accessibilityLabel).toBe('Continue with Apple');
    expect(google.props.accessibilityLabel).toBe('Continue with Google');
    expect(email.props.accessibilityLabel).toBe('Continue with email');
    expect(apple.props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
    expect(google.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
    expect(email.props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
    expect(apple).toHaveStyle({ minHeight: 52 });
    expect(google).toHaveStyle({ minHeight: 52 });
    expect(email).toHaveStyle({ minHeight: 52 });
    expect(
      StyleSheet.flatten(screen.getByText('Continue with Google').props.style)
    ).toMatchObject({
      fontFamily: 'GoogleSansMedium',
      fontSize: 14,
      lineHeight: 20,
    });
  });

  it('announces a provider failure as an assertive alert', () => {
    render(
      <PaperAuthMethods
        draft={null}
        errorMessage="Provider unavailable"
        onApple={jest.fn()}
        onEmail={jest.fn()}
        onGoogle={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    const notice = screen.getByTestId('paper-auth-methods-error');
    expect(notice.props.accessibilityRole).toBe('alert');
    expect(notice.props.accessibilityLiveRegion).toBe('assertive');
    expect(notice.props.accessibilityLabel).toBe(
      'We could not sign you in Provider unavailable'
    );
  });

  it('renders the reset success state with a masked address and resend action', () => {
    const onBack = jest.fn();
    const onSendAnother = jest.fn();

    render(
      <PaperAuthCheckEmail
        email="daniel@example.com"
        onBackToSignIn={onBack}
        onSendAnother={onSendAnother}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.queryByText('Reset link sent')).toBeNull();
    expect(screen.getByText('Check your email.')).toBeTruthy();
    expect(screen.getByText('Email sent to')).toBeTruthy();
    expect(screen.queryByText('SENT TO')).toBeNull();
    expect(screen.getByText('daniel@e•••.com')).toBeTruthy();
    expect(
      screen.getByText('Your password changes only after you use the link.')
    ).toBeTruthy();
    expect(screen.getByTestId('paper-auth-check-email-mascot')).toBeTruthy();

    fireEvent.press(screen.getByTestId('paper-auth-check-email-back'));
    fireEvent.press(screen.getByTestId('paper-auth-check-email-send-another'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSendAnother).toHaveBeenCalledTimes(1);
  });

  it('holds the resend action behind the Paper cooldown and uses explicit progress copy', () => {
    const onSendAnother = jest.fn();

    render(
      <PaperAuthCheckEmail
        email="daniel@example.com"
        resendAvailableAtLabel="9:43 pm"
        resendSecondsRemaining={42}
        onBackToSignIn={jest.fn()}
        onSendAnother={onSendAnother}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.queryByText('Link already sent')).toBeNull();
    expect(screen.getByText('Use the latest link.')).toBeTruthy();
    expect(
      screen.getByText('Another link is available at 9:43 pm.')
    ).toBeTruthy();

    const resend = screen.getByTestId('paper-auth-check-email-send-another');
    expect(resend.props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
    expect(screen.getByText('Send another link in 00:42')).toBeTruthy();
    fireEvent.press(resend);
    expect(onSendAnother).not.toHaveBeenCalled();
  });

  it('replaces the reset spinner with Paper sending copy and a progress treatment', () => {
    render(
      <PaperAuthResetForm
        email="daniel@example.com"
        loading
        onBackToSignIn={jest.fn()}
        onEmailChange={jest.fn()}
        onSubmit={jest.fn()}
        testID="auth-reset"
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Sending link…')).toBeTruthy();
    expect(screen.getByText('Sending your reset link')).toBeTruthy();
    expect(screen.getByTestId('auth-reset-submit-progress')).toBeTruthy();
    expect(
      screen.getByTestId('auth-reset-submit').props.accessibilityState
    ).toEqual({
      disabled: true,
      busy: true,
    });
  });

  it('keeps reset validation inline and the recovery action reachable', () => {
    const onSubmit = jest.fn();

    render(
      <PaperAuthResetForm
        email=""
        onBackToSignIn={jest.fn()}
        onEmailChange={jest.fn()}
        onSubmit={onSubmit}
        testID="auth-reset"
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(screen.getByTestId('auth-reset-submit'));

    expect(screen.getByText('your account email')).toBeTruthy();
    expect(screen.getByPlaceholderText('daniel@example.com')).toBeTruthy();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
