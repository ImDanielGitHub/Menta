import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmailConfirmationCallbackScreen, {
  classifyEmailConfirmationFailure,
} from '@/app/email-confirmation/callback';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockReplace = jest.fn();
const mockExchange = jest.fn();
const mockSignOut = jest.fn();
const mockSetUserAndSession = jest.fn();
const mockHydrate = jest.fn();
const mockClearForEmail = jest.fn();

let mockParams: Record<string, string | string[] | undefined> = {
  code: 'confirmation-code',
};
let mockPending: {
  version: 1;
  email: string;
  username: string;
  expectedUserId: string | null;
  fromOnboarding: boolean;
  requestedAt: number;
  resendAvailableAt: number;
} | null = null;
let mockConfirmationHydrated = true;
let mockAuthState: {
  isAuthenticated: boolean;
  user: { id: string } | null;
  setUserAndSession: typeof mockSetUserAndSession;
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/supabase', () => ({
  getEmailConfirmationSupabase: () => ({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) => mockExchange(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: {
    getState: () => mockAuthState,
  },
}));

jest.mock('@/store/email-confirmation-store', () => ({
  isEmailConfirmationForSession: (
    pending: { email: string; expectedUserId: string | null },
    user: { id: string; email: string }
  ) =>
    pending.email === user.email.toLowerCase() &&
    (!pending.expectedUserId || pending.expectedUserId === user.id),
  useEmailConfirmationStore: {
    getState: () => ({
      pending: mockPending,
      hasHydrated: mockConfirmationHydrated,
      hydrate: mockHydrate,
      clearForEmail: mockClearForEmail,
    }),
  },
}));

const renderCallback = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 430, height: 932 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        <EmailConfirmationCallbackScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('EmailConfirmationCallbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { code: 'confirmation-code' };
    mockConfirmationHydrated = true;
    mockPending = {
      version: 1,
      email: 'alex@example.com',
      username: 'alexm',
      expectedUserId: 'pending-user',
      fromOnboarding: true,
      requestedAt: Date.now(),
      resendAvailableAt: Date.now() + 60_000,
    };
    mockAuthState = {
      isAuthenticated: false,
      user: null,
      setUserAndSession: mockSetUserAndSession,
    };
    mockSetUserAndSession.mockImplementation(async user => {
      mockAuthState = {
        ...mockAuthState,
        isAuthenticated: true,
        user: { id: user.id },
      };
    });
    mockHydrate.mockResolvedValue(mockPending);
    mockClearForEmail.mockResolvedValue(true);
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('accepts a matching PKCE session, clears the handoff, and replaces the callback', async () => {
    const user = { id: 'pending-user', email: 'alex@example.com' };
    const session = { access_token: 'token', user };
    mockExchange.mockResolvedValue({
      data: { user, session, redirectType: null },
      error: null,
    });

    renderCallback();

    await waitFor(() =>
      expect(mockSetUserAndSession).toHaveBeenCalledWith(user, session)
    );
    expect(mockClearForEmail).toHaveBeenCalledWith('alex@example.com');
    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('accepts a valid device-bound confirmation when auxiliary screen state was lost', async () => {
    mockPending = null;
    const user = { id: 'confirmed-user', email: 'confirmed@example.com' };
    const session = { access_token: 'token', user };
    mockExchange.mockResolvedValue({
      data: { user, session, redirectType: null },
      error: null,
    });

    renderCallback();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/onboarding')
    );
    expect(mockClearForEmail).not.toHaveBeenCalled();
  });

  it('signs out a callback session that does not match the pending account', async () => {
    const user = { id: 'other-user', email: 'other@example.com' };
    mockExchange.mockResolvedValue({
      data: { user, session: { access_token: 'token', user } },
      error: null,
    });

    renderCallback();

    await waitFor(() =>
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' })
    );
    expect(mockSetUserAndSession).not.toHaveBeenCalled();
    expect(mockClearForEmail).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(
      '/email-confirmation?status=account-mismatch'
    );
  });

  it('returns an expired exchange to the resendable confirmation screen', async () => {
    mockExchange.mockResolvedValue({
      data: { user: null, session: null, redirectType: null },
      error: { code: 'otp_expired', message: 'Email link expired' },
    });

    renderCallback();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        '/email-confirmation?status=expired'
      )
    );
    expect(mockClearForEmail).not.toHaveBeenCalled();
  });

  it('rejects a missing or duplicated callback code without an exchange', async () => {
    mockParams = { code: ['first', 'second'] };

    renderCallback();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        '/email-confirmation?status=invalid'
      )
    );
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it('classifies provider returns without exposing their raw descriptions', () => {
    expect(classifyEmailConfirmationFailure('otp_expired')).toBe('expired');
    expect(classifyEmailConfirmationFailure('PKCE verifier missing')).toBe(
      'invalid'
    );
    expect(classifyEmailConfirmationFailure('transport unavailable')).toBe(
      'failed'
    );
  });
});
