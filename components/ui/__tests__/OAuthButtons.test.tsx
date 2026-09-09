import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { OAuthButtons } from '@/components/ui/OAuthButtons';
import { showToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/auth-store';

jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/components/ui/Toast', () => ({
  showToast: {
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockShowToast = showToast as jest.Mocked<typeof showToast>;

describe('OAuthButtons', () => {
  const signInWithGoogle = jest.fn();
  const signInWithApple = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    signInWithGoogle.mockResolvedValue(undefined);
    signInWithApple.mockResolvedValue(undefined);
    mockUseAuthStore.mockReturnValue({
      signInWithGoogle,
      signInWithApple,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps cancelled Google sign-in visible without showing an error toast', async () => {
    signInWithGoogle.mockRejectedValueOnce(new Error('sign-in was cancelled'));

    render(<OAuthButtons />);

    fireEvent.press(screen.getByText('Continue with Google'));

    expect(await screen.findByText('Sign-in cancelled')).toBeTruthy();
    expect(
      screen.getByText(
        "You're still signed out. Choose Apple, Google, or email to try again."
      )
    ).toBeTruthy();
    expect(mockShowToast.error).not.toHaveBeenCalled();
  });

  it('uses the Google provider type contract for its fallback button', () => {
    render(<OAuthButtons />);

    expect(
      StyleSheet.flatten(screen.getByText('Continue with Google').props.style)
    ).toMatchObject({
      fontFamily: 'GoogleSansMedium',
      fontSize: 14,
      lineHeight: 20,
    });
  });

  it('keeps provider failures on an inline alert and toast backup', async () => {
    signInWithGoogle.mockRejectedValueOnce(new Error('Provider unavailable'));

    render(<OAuthButtons />);

    fireEvent.press(screen.getByText('Continue with Google'));

    expect(
      await screen.findByText(
        "Couldn't sign in with Google. Try again or use email instead."
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Sign in with Google isn't available here. Use email instead."
      )
    ).toBeTruthy();

    await waitFor(() => {
      expect(mockShowToast.error).toHaveBeenCalledWith(
        "Couldn't sign in with Google. Try again or use email instead.",
        "Sign in with Google isn't available here. Use email instead."
      );
    });
  });

  it('calls onSuccess quietly after a successful provider sign-in', async () => {
    const onSuccess = jest.fn();

    render(<OAuthButtons onSuccess={onSuccess} />);

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('google');
    });
    expect(screen.queryByText('Sign-in cancelled')).toBeNull();
    expect(screen.queryByText("Couldn't sign in with Google")).toBeNull();
    expect(mockShowToast.error).not.toHaveBeenCalled();
  });

  it('keeps provider handoff visible while OAuth is pending', async () => {
    let resolveGoogle: (() => void) | undefined;
    signInWithGoogle.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveGoogle = resolve;
        })
    );
    const onPendingChange = jest.fn();

    render(<OAuthButtons onPendingChange={onPendingChange} />);

    fireEvent.press(screen.getByText('Continue with Google'));

    expect(await screen.findByText('Opening Google sign-in')).toBeTruthy();
    expect(
      screen.getByText(
        "Keep Menta open. When sign-in finishes, you'll return to what you were doing."
      )
    ).toBeTruthy();
    expect(onPendingChange).toHaveBeenCalledWith(true, 'google');

    await act(async () => {
      resolveGoogle?.();
    });

    await waitFor(() => {
      expect(screen.queryByText('Opening Google sign-in')).toBeNull();
    });
    expect(onPendingChange).toHaveBeenLastCalledWith(false, null);
  });
});
