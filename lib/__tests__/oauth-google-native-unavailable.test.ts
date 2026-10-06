const mockShowGlobalToast = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => {
  throw new Error('native module unavailable');
});

jest.mock('@/lib/network', () => ({
  networkManager: { isOnline: () => true },
  withRetry: jest.fn((fn: () => unknown) => fn()),
  handleNetworkError: (error: { message?: string }) =>
    error.message ?? 'Google sign-in failed',
}));

jest.mock('@/lib/toast-provider', () => ({
  showGlobalToast: (...args: unknown[]) => mockShowGlobalToast(...args),
}));

jest.mock('@/lib/sentry', () => ({
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithIdToken: jest.fn() } },
}));

import { OAuthService } from '@/lib/oauth';

describe('Google OAuth without the native module', () => {
  it('falls back to the browser before starting native provider work', async () => {
    const browser = jest
      .spyOn(OAuthService, 'signInWithGoogleOAuth')
      .mockResolvedValue({ success: true });

    await expect(OAuthService.signInWithGoogle()).resolves.toEqual({
      success: true,
    });
    expect(browser).toHaveBeenCalledTimes(1);
    expect(mockShowGlobalToast).not.toHaveBeenCalled();
    browser.mockRestore();
  });
});
