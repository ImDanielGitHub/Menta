const mockGoogleSignIn = jest.fn();
const mockShowGlobalToast = jest.fn();
const mockSentryCapture = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }),
    addEventListener: jest.fn(() => () => undefined),
  },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: (...args: unknown[]) => mockGoogleSignIn(...args),
  },
}));

jest.mock('@/lib/network', () => ({
  networkManager: { isOnline: () => true },
  withRetry: jest.requireActual('@/lib/network').withRetry,
  handleNetworkError: (error: { message?: string }) =>
    error.message ?? 'Google sign-in failed',
}));

jest.mock('@/lib/toast-provider', () => ({
  showGlobalToast: (...args: unknown[]) => mockShowGlobalToast(...args),
}));

jest.mock('@/lib/sentry', () => ({
  captureError: (...args: unknown[]) => mockSentryCapture(...args),
  addBreadcrumb: jest.fn(),
  logError: jest.fn(),
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
import { supabase } from '@/lib/supabase';

describe('native Google OAuth cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a calm cancellation without error telemetry or toast', async () => {
    const browser = jest.spyOn(OAuthService, 'signInWithGoogleOAuth');
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
    expect(browser).not.toHaveBeenCalled();
    browser.mockRestore();

    consoleError.mockRestore();
  });

  it('uses the browser only when the native module is missing', async () => {
    const module = require('@react-native-google-signin/google-signin');
    const native = module.GoogleSignin;
    const browser = jest
      .spyOn(OAuthService, 'signInWithGoogleOAuth')
      .mockResolvedValue({ success: true });
    module.GoogleSignin = undefined;
    try {
      await expect(OAuthService.signInWithGoogle()).resolves.toEqual({
        success: true,
      });
      expect(browser).toHaveBeenCalledTimes(1);
      expect(mockGoogleSignIn).not.toHaveBeenCalled();
    } finally {
      module.GoogleSignin = native;
      browser.mockRestore();
    }
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

describe('native Google ID-token nonce validation', () => {
  const nonceToken =
    'eyJhbGciOiJub25lIn0.' +
    Buffer.from(JSON.stringify({ nonce: 'synthetic-nonce' })).toString(
      'base64url'
    ) +
    '.invalid';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGoogleSignIn.mockResolvedValue({
      type: 'success',
      data: { idToken: nonceToken },
    });
  });

  it.each([
    'nonce mismatch',
    'id_token rejected',
    'nonce should either both exist',
  ])('fails closed after %s without another exchange', async message => {
    const exchange = supabase.auth.signInWithIdToken as jest.Mock;
    exchange.mockResolvedValueOnce({ data: null, error: { message } });
    exchange.mockResolvedValueOnce({
      data: { user: { id: 'synthetic-user' }, session: {} },
      error: null,
    });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      await expect(OAuthService.signInWithGoogle()).resolves.toMatchObject({
        success: false,
      });
      expect(exchange).toHaveBeenCalledTimes(1);
      expect(exchange).toHaveBeenCalledWith(
        expect.objectContaining({
          token: nonceToken,
          nonce: 'synthetic-nonce',
        })
      );
    } finally {
      consoleError.mockRestore();
      exchange.mockReset();
    }
  });

  it('preserves a successful nonce-bearing native exchange', async () => {
    const data = {
      user: { id: 'synthetic-user' },
      session: { access_token: 'synthetic-access' },
    };
    const exchange = supabase.auth.signInWithIdToken as jest.Mock;
    exchange.mockResolvedValueOnce({ data, error: null });
    await expect(OAuthService.signInWithGoogle()).resolves.toEqual({
      success: true,
      ...data,
    });
    expect(exchange).toHaveBeenCalledTimes(1);
    expect(exchange).toHaveBeenCalledWith(
      expect.objectContaining({ token: nonceToken, nonce: 'synthetic-nonce' })
    );
  });
  it('preserves nonce-less native success without adding a challenge', async () => {
    const idToken = 'eyJhbGciOiJub25lIn0.e30.invalid';
    mockGoogleSignIn.mockResolvedValueOnce({
      type: 'success',
      data: { idToken },
    });
    const exchange = supabase.auth.signInWithIdToken as jest.Mock;
    exchange.mockResolvedValueOnce({
      data: { user: { id: 'synthetic-user' }, session: {} },
      error: null,
    });
    await expect(OAuthService.signInWithGoogle()).resolves.toMatchObject({
      success: true,
    });
    expect(exchange).toHaveBeenCalledTimes(1);
    expect(exchange.mock.calls[0][0]).not.toHaveProperty('nonce');
  });

  it('keeps the original nonce and token on a transient transport retry', async () => {
    jest.useFakeTimers();
    const exchange = supabase.auth.signInWithIdToken as jest.Mock;
    exchange.mockRejectedValueOnce(new Error('Network timeout'));
    exchange.mockResolvedValueOnce({
      data: { user: { id: 'synthetic-user' }, session: {} },
      error: null,
    });
    try {
      const signingIn = OAuthService.signInWithGoogle();
      await jest.advanceTimersByTimeAsync(800);
      await expect(signingIn).resolves.toMatchObject({ success: true });
      expect(exchange).toHaveBeenCalledTimes(2);
      expect(exchange.mock.calls[1][0]).toEqual(exchange.mock.calls[0][0]);
      expect(exchange.mock.calls[1][0]).toEqual(
        expect.objectContaining({ token: nonceToken, nonce: 'synthetic-nonce' })
      );
      expect(mockGoogleSignIn).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
