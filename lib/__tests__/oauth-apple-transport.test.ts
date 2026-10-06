import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthService } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { captureError } from '@/lib/sentry';

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => true),
  signInAsync: jest.fn(async () => ({ identityToken: 'apple-token' })),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'nonce',
  digestStringAsync: jest.fn(async () => 'hashed-nonce'),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { HEX: 'hex' },
}));
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
  addEventListener: jest.fn(),
}));
jest.mock('@/lib/network', () => ({
  networkManager: { isOnline: () => true },
  withRetry: jest.requireActual('@/lib/network').withRetry,
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithIdToken: jest.fn() } },
}));

const auth = supabase.auth.signInWithIdToken as jest.Mock;
const transportError = () =>
  Object.assign(
    new Error(
      'fetch failed: UnexpectedException: The network connection was lost.'
    ),
    {
      name: 'AuthRetryableFetchError',
      status: 0,
    }
  );

describe('Apple token exchange connection recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('keeps Apple cancellation out of retries and error reporting', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValueOnce({
      code: 'ERR_REQUEST_CANCELED',
    });
    await expect(OAuthService.signInWithApple()).resolves.toMatchObject({
      success: false,
      cancelled: true,
    });
    expect(auth).not.toHaveBeenCalled();
    expect(captureError).not.toHaveBeenCalled();
  });

  it('retries a resolved Supabase transport error without reopening Apple sign-in', async () => {
    const session = { access_token: 'session-token' };
    auth
      .mockResolvedValueOnce({ data: {}, error: transportError() })
      .mockResolvedValueOnce({
        data: { user: { id: 'user-1' }, session },
        error: null,
      });
    const result = OAuthService.signInWithApple();
    await jest.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toMatchObject({ success: true, session });
    expect(auth).toHaveBeenCalledTimes(2);
    expect(auth.mock.calls[0]).toEqual(auth.mock.calls[1]);
    expect(AppleAuthentication.signInAsync).toHaveBeenCalledTimes(1);
    expect(captureError).not.toHaveBeenCalled();
  });

  it('retains the transport cause after retries without reporting a provider error', async () => {
    const error = transportError();
    auth.mockResolvedValue({ data: {}, error });
    const result = OAuthService.signInWithApple();
    await jest.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toMatchObject({
      success: false,
      cause: error,
    });
    expect(auth).toHaveBeenCalledTimes(2);
    expect(AppleAuthentication.signInAsync).toHaveBeenCalledTimes(1);
    expect(captureError).not.toHaveBeenCalled();
  });

  it('reports a genuine provider failure without retrying it', async () => {
    const error = Object.assign(new Error('Invalid identity token'), {
      name: 'AuthApiError',
      status: 400,
    });
    auth.mockResolvedValue({ data: {}, error });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      await expect(OAuthService.signInWithApple()).resolves.toMatchObject({
        success: false,
      });
      expect(auth).toHaveBeenCalledTimes(1);
      expect(captureError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ provider: 'apple' })
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
