const mockGoogleSignIn = jest.fn();
const mockShowGlobalToast = jest.fn();
const mockSentryCapture = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: (...args: unknown[]) => mockGoogleSignIn(...args),
  },
}));

jest.mock('@/lib/network', () => ({
  networkManager: { isOnline: () => true },
  withRetry: (operation: () => Promise<unknown>) => operation(),
  handleNetworkError: (error: { message?: string }) =>
    error.message ?? 'Google sign-in failed',
}));

jest.mock('@/lib/toast-provider', () => ({
  showGlobalToast: (...args: unknown[]) => mockShowGlobalToast(...args),
}));

jest.mock('@/lib/sentry', () => ({
  captureError: (...args: unknown[]) => mockSentryCapture(...args),
  addBreadcrumb: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
    },
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        googleWebClientId: 'web-client',
        googleIosClientId: 'ios-client',
      },
    },
  },
}));

import { OAuthService } from '@/lib/oauth';

describe('native Google OAuth cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a calm cancellation without error telemetry or toast', async () => {
    mockGoogleSignIn.mockRejectedValueOnce({
      code: 'SIGN_IN_CANCELLED',
      message: 'The user cancelled Google sign-in',
    });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(OAuthService.signInWithGoogle()).resolves.toEqual({
      success: false,
      error: 'Sign-in was cancelled',
      cancelled: true,
    });
    expect(mockShowGlobalToast).not.toHaveBeenCalled();
    expect(mockSentryCapture).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('handles the resolved cancellation response returned by v14', async () => {
    mockGoogleSignIn.mockResolvedValueOnce({ type: 'cancelled', data: null });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(OAuthService.signInWithGoogle()).resolves.toEqual({
      success: false,
      error: 'Sign-in was cancelled',
      cancelled: true,
    });
    expect(mockShowGlobalToast).not.toHaveBeenCalled();
    expect(mockSentryCapture).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
