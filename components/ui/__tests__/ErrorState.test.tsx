import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  AuthErrorState,
  GenericErrorState,
  SubmissionErrorState,
  UploadErrorState,
  ValidationErrorState,
} from '@/components/ui/ErrorState';
import { NetworkErrorHandler } from '@/components/ui/NetworkErrorHandler';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const renderWithTheme = (node: React.ReactElement) =>
  render(<ThemeProvider>{node}</ThemeProvider>);

describe('shared error states', () => {
  it('keeps auth gates account-specific instead of generic sign-in copy', () => {
    const onLogin = jest.fn();
    const onCreateAccount = jest.fn();

    renderWithTheme(
      <AuthErrorState onLogin={onLogin} onCreateAccount={onCreateAccount} />
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Account required')).toBeTruthy();
    expect(
      screen.getByText(
        'Saved proof, groups, reviews, and Momenta need a Menta account. Sign in and return to the action you were opening.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Sign in now'));
    fireEvent.press(screen.getByText('Create account'));

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onCreateAccount).toHaveBeenCalledTimes(1);
  });

  it('keeps proof upload and submission failures tied to saved work', () => {
    const onRetryUpload = jest.fn();
    const onSaveDraft = jest.fn();
    const onRetrySubmission = jest.fn();

    renderWithTheme(
      <>
        <UploadErrorState onRetry={onRetryUpload} onSaveDraft={onSaveDraft} />
        <SubmissionErrorState onRetry={onRetrySubmission} />
      </>
    );

    expect(screen.getByText('Proof did not upload')).toBeTruthy();
    expect(screen.getByText('Proof could not submit')).toBeTruthy();
    expect(
      screen.getByText(
        'Your proof is still attached. Retry the upload, or save it for later when this flow supports offline recovery.'
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Your proof is still here. Retry submission, save it for later, or contact support if the review loop is blocked.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Retry upload'));
    fireEvent.press(screen.getByText('Save proof for later'));
    fireEvent.press(screen.getByText('Retry submission'));

    expect(onRetryUpload).toHaveBeenCalledTimes(1);
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    expect(onRetrySubmission).toHaveBeenCalledTimes(1);
  });

  it('keeps validation and generic recovery anchored to Menta language', () => {
    const onFix = jest.fn();
    const onRetry = jest.fn();
    const onGoHome = jest.fn();

    renderWithTheme(
      <>
        <ValidationErrorState
          message="Add the proof rule before saving."
          onFix={onFix}
        />
        <GenericErrorState onRetry={onRetry} onGoHome={onGoHome} />
      </>
    );

    expect(screen.getByText('Check the details')).toBeTruthy();
    expect(screen.getByText('This part needs a retry')).toBeTruthy();
    expect(
      screen.getByTestId('generic-error-mascot', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Menta could not finish that action. Your account data is safe; retry, return to Today, or contact support if it keeps happening.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Fix details'));
    fireEvent.press(screen.getByText('Try again'));
    fireEvent.press(screen.getByText('Back to Today'));

    expect(onFix).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('keeps network timeouts recoverable without generic server language', () => {
    const onRetry = jest.fn();
    const onDismiss = jest.fn();

    renderWithTheme(
      <NetworkErrorHandler
        error={{ message: 'request timeout', isTimeout: true }}
        onRetry={onRetry}
        onDismiss={onDismiss}
        showDismiss
      />
    );

    expect(screen.getByText('Menta is taking too long')).toBeTruthy();
    expect(
      screen.getByText(
        'The request did not finish. Retry before changing screens so the latest proof or account state can load.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));
    fireEvent.press(screen.getByText('Keep current screen'));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
