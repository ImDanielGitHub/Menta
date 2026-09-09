import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore, User } from '../auth-store';
import { supabase } from '@/lib/supabase';
import { useMomentaStore } from '../momenta-store';
import { getMyProfile, updateMyProfile } from '@/lib/profile-api';
import { clearAccountScopedState } from '@/lib/account-session-lifecycle';
import { notificationService } from '@/lib/services/notification-service';
import { OAuthService } from '@/lib/oauth';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';

const mockTrackProductEvent = jest.fn();
const mockTrackProductOperation = jest.fn();

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `menta://${path}`,
}));

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resend: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      refreshSession: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

jest.mock('@/lib/profile-api', () => ({
  getMyProfile: jest.fn(),
  updateMyProfile: jest.fn(),
}));

jest.mock('@/lib/posthog', () => ({
  trackProductEvent: (...args: unknown[]) => mockTrackProductEvent(...args),
  trackProductOperation: (...args: unknown[]) =>
    mockTrackProductOperation(...args),
}));

jest.mock('@/lib/oauth', () => ({
  OAuthService: {
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signInWithGoogleOAuth: jest.fn(),
    signInWithAppleOAuth: jest.fn(),
  },
}));

jest.mock('@/lib/account-session-lifecycle', () => ({
  clearAccountScopedState: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../momenta-store', () => ({
  useMomentaStore: {
    getState: jest.fn(() => ({
      syncWithBackend: jest.fn(),
      activateAccountScope: jest.fn(),
      clearMomentaData: jest.fn(),
    })),
  },
}));
jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: {
    getState: jest.fn(() => ({
      syncWithBackend: jest.fn().mockResolvedValue(undefined),
      activateAccountScope: jest.fn(),
      clearMomentaData: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/network', () => ({
  handleNetworkError: jest.fn(error => error?.message || 'Network error'),
  withRetry: jest.fn(fn => fn()),
  networkManager: {
    isOnline: jest.fn(() => true),
  },
}));

jest.mock('@/lib/operational-flags', () => ({
  isOperationalFeatureEnabled: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/meta-ads', () => ({
  isNewAuthUser: jest.fn(() => false),
  resolveMetaAdsRegistrationMethod: jest.fn(() => 'email'),
  trackMetaAdsSignUp: jest.fn(),
}));

jest.mock('@/lib/toast-provider', () => ({
  showGlobalToast: jest.fn(),
}));

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    startUserScopedWork: jest.fn(),
    stopUserScopedWork: jest.fn(),
    storeTemporaryTokenForUser: jest.fn().mockResolvedValue(undefined),
    syncChallengeRemindersForUser: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../referral-store', () => ({
  useReferralStore: {
    getState: jest.fn(() => ({
      processReferral: jest.fn().mockResolvedValue(false),
    })),
  },
}));
jest.mock('@/store/referral-store', () => ({
  useReferralStore: {
    getState: jest.fn(() => ({
      processReferral: jest.fn().mockResolvedValue(false),
    })),
  },
}));

jest.mock('@/lib/sentry', () => ({
  setUser: jest.fn(),
  clearUser: jest.fn(),
  logError: jest.fn(),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockMomentaStore = useMomentaStore as jest.Mocked<typeof useMomentaStore>;
const mockGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;
const mockUpdateMyProfile = updateMyProfile as jest.MockedFunction<
  typeof updateMyProfile
>;
const mockClearAccountScopedState =
  clearAccountScopedState as jest.MockedFunction<
    typeof clearAccountScopedState
  >;
const mockNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;
const mockOAuthService = OAuthService as jest.Mocked<typeof OAuthService>;

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const profile = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: null,
      momenta_balance: 100,
      has_completed_onboarding: true,
      created_at: '2026-08-04T00:00:00.000Z',
      updated_at: '2026-08-04T00:00:00.000Z',
      is_pro: false,
      is_approved: true,
    };
    mockGetMyProfile.mockResolvedValue(profile);
    mockUpdateMyProfile.mockResolvedValue(profile);
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      hasCompletedOnboarding: false,
      authListenerActive: false,
    });
    useEmailConfirmationStore.setState({
      pending: null,
      hasHydrated: true,
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any);
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('initializeAuth', () => {
    it('initializes with existing session', async () => {
      const mockSession = {
        access_token: 'token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.auth.onAuthStateChange.mockImplementation(
        (callback: any) => {
          setTimeout(() => callback('INITIAL_SESSION', mockSession), 0);
          return {
            data: { subscription: { unsubscribe: jest.fn() } },
          } as any;
        }
      );

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                username: 'testuser',
                avatar_url: null,
                momenta_balance: 100,
                has_completed_onboarding: true,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.session).toBe(mockSession);
      });
    });

    it('restores an existing session when the auth listener stays silent', async () => {
      const mockSession = {
        access_token: 'persisted-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.session).toBe(mockSession);
      expect(result.current.user?.id).toBe('user-1');
      expect(result.current.isLoading).toBe(false);
    });

    it('retires a matching confirmation receipt when a confirmed session restores after process death', async () => {
      await useEmailConfirmationStore.getState().stage({
        email: 'test@example.com',
        username: 'testuser',
        expectedUserId: 'user-1',
        fromOnboarding: true,
      });
      const session = {
        access_token: 'restored-confirmed-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
      };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      await act(async () => {
        await useAuthStore.getState().initializeAuth();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useEmailConfirmationStore.getState().pending).toBeNull();
    });

    it('initializes without session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('handles initialization error gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('preserves an active account when the initial session check times out', async () => {
      const existingUser = { id: 'user-1', username: 'testuser' };
      const existingSession = { access_token: 'current-token' } as any;
      useAuthStore.setState({
        user: existingUser,
        session: existingSession,
        isAuthenticated: true,
        isInitialized: false,
        hasCompletedOnboarding: true,
      });
      mockSupabase.auth.getSession.mockRejectedValue(
        new Error('Session check timeout')
      );

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(mockClearAccountScopedState).not.toHaveBeenCalled();
      expect(result.current.user).toBe(existingUser);
      expect(result.current.session).toBe(existingSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(true);
    });

    it('preserves an active account when the initial session check returns a transient error', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const existingUser = { id: 'user-1', username: 'testuser' };
      const existingSession = { access_token: 'current-token' } as any;
      useAuthStore.setState({
        user: existingUser,
        session: existingSession,
        isAuthenticated: true,
        isInitialized: false,
        hasCompletedOnboarding: true,
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Network request failed'),
      } as any);

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(mockClearAccountScopedState).not.toHaveBeenCalled();
      expect(result.current.user).toBe(existingUser);
      expect(result.current.session).toBe(existingSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(true);

      consoleError.mockRestore();
    });

    it('silently clears a persisted account when its initial session is revoked', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      useAuthStore.setState({
        user: { id: 'revoked-user', username: 'revoked' },
        session: { access_token: 'revoked-token' } as any,
        isAuthenticated: true,
        hasCompletedOnboarding: true,
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('AUTH_SESSION_REVOKED: session revoked'),
      } as any);

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(mockClearAccountScopedState).toHaveBeenCalledWith('revoked-user');
      expect(consoleError).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.hasCompletedOnboarding).toBe(false);

      consoleError.mockRestore();
    });
  });

  describe('refreshSession', () => {
    it('clears the current account when Supabase confirms there is no refreshed session', async () => {
      useAuthStore.setState({
        user: { id: 'ended-user', username: 'ended' },
        session: { access_token: 'ended-token' } as any,
        isAuthenticated: true,
        isInitialized: true,
        hasCompletedOnboarding: true,
      });
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockClearAccountScopedState).toHaveBeenCalledWith('ended-user');
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    it('keeps the current account when refresh fails transiently', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const existingUser = { id: 'user-1', username: 'testuser' };
      const existingSession = { access_token: 'current-token' } as any;
      useAuthStore.setState({
        user: existingUser,
        session: existingSession,
        isAuthenticated: true,
        isInitialized: true,
        hasCompletedOnboarding: true,
      });
      mockSupabase.auth.refreshSession.mockRejectedValue(
        new Error('Network request failed')
      );

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.refreshSession();
      });

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(mockClearAccountScopedState).not.toHaveBeenCalled();
      expect(result.current.user).toBe(existingUser);
      expect(result.current.session).toBe(existingSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.hasCompletedOnboarding).toBe(true);

      consoleError.mockRestore();
    });

    it('silently clears account work when the refresh token is revoked', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      useAuthStore.setState({
        user: { id: 'revoked-user', username: 'revoked' },
        session: { access_token: 'revoked-token' } as any,
        isAuthenticated: true,
        isInitialized: true,
      });
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Invalid Refresh Token: session revoked'),
      } as any);

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockClearAccountScopedState).toHaveBeenCalledWith('revoked-user');
      expect(consoleError).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();

      consoleError.mockRestore();
    });
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockAuthData = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
        session: {
          access_token: 'token',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            user_metadata: { username: 'testuser' },
          },
        },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('handles login error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      mockSupabase.auth.signInWithPassword.mockReturnValue(loginPromise as any);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin({ data: { user: null, session: null }, error: null });
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Google sign-in', () => {
    it('preserves provider cancellation as a non-failure result', async () => {
      mockOAuthService.signInWithGoogle.mockResolvedValueOnce({
        success: false,
        cancelled: true,
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(result.current.signInWithGoogle()).rejects.toMatchObject({
        code: 'AUTH_CANCELLED',
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('successfully registers user', async () => {
      const mockAuthData = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
        session: {
          access_token: 'token',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            user_metadata: { username: 'testuser' },
          },
        },
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAuthStore());

      let registrationResult: unknown;
      await act(async () => {
        registrationResult = await result.current.register(
          'test@example.com',
          'password123',
          'testuser'
        );
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { username: 'testuser' },
          emailRedirectTo: 'menta://email-confirmation/callback',
        },
      });
      expect(registrationResult).toEqual({
        status: 'session_confirmed',
        email: 'test@example.com',
        userId: 'user-1',
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('passes username metadata to Supabase registration', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let registrationResult: unknown;
      await act(async () => {
        registrationResult = await result.current.register(
          'test@example.com',
          'password123',
          'testuser'
        );
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { username: 'testuser' },
          emailRedirectTo: 'menta://email-confirmation/callback',
        },
      });
      expect(registrationResult).toEqual({
        status: 'confirmation_required',
        email: 'test@example.com',
        userId: 'user-1',
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('shares one in-flight signup request across duplicate submissions', async () => {
      let resolveSignup:
        | ((value: {
            data: {
              user: { id: string; email: string };
              session: null;
            };
            error: null;
          }) => void)
        | undefined;
      mockSupabase.auth.signUp.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSignup = resolve;
          }) as never
      );

      const first = useAuthStore
        .getState()
        .register('same@example.com', 'password123', 'sameuser');
      const second = useAuthStore
        .getState()
        .register('same@example.com', 'password123', 'sameuser');

      expect(first).toBe(second);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledTimes(1);

      resolveSignup?.({
        data: {
          user: { id: 'pending-user', email: 'same@example.com' },
          session: null,
        },
        error: null,
      });

      await expect(first).resolves.toMatchObject({
        status: 'confirmation_required',
      });
    });

    it('locks a resend request and uses the signup callback', async () => {
      let resolveResend:
        | ((value: {
            data: { user: null; session: null };
            error: null;
          }) => void)
        | undefined;
      mockSupabase.auth.resend.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveResend = resolve;
          }) as never
      );

      const first = useAuthStore
        .getState()
        .resendEmailConfirmation('ME@EXAMPLE.COM');
      const second = useAuthStore
        .getState()
        .resendEmailConfirmation('me@example.com');

      expect(first).toBe(second);
      expect(mockSupabase.auth.resend).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'me@example.com',
        options: {
          emailRedirectTo: 'menta://email-confirmation/callback',
        },
      });

      resolveResend?.({ data: { user: null, session: null }, error: null });
      await expect(first).resolves.toBeUndefined();
    });

    it('clears a pending signup only after an explicit account switch succeeds', async () => {
      await useEmailConfirmationStore.getState().stage({
        email: 'pending@example.com',
        username: 'pendinguser',
        expectedUserId: 'pending-user',
        fromOnboarding: true,
        now: Date.now(),
      });
      const session = {
        access_token: 'account-b-token',
        user: {
          id: 'account-b',
          email: 'account-b@example.com',
          user_metadata: { username: 'accountb' },
        },
      };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: session.user, session },
        error: null,
      });
      mockGetMyProfile.mockResolvedValue({
        id: 'account-b',
        email: 'account-b@example.com',
        username: 'accountb',
        display_name: 'Account B',
        avatar_url: null,
        momenta_balance: 0,
        has_completed_onboarding: false,
        created_at: '2026-08-31T00:00:00.000Z',
        updated_at: '2026-08-31T00:00:00.000Z',
        is_pro: false,
        is_approved: true,
      });

      await act(async () => {
        await useAuthStore
          .getState()
          .login('account-b@example.com', 'password123');
      });

      expect(useAuthStore.getState().user?.id).toBe('account-b');
      expect(useEmailConfirmationStore.getState().pending).toBeNull();
    });

    it('recovers an already-confirmed matching session after app relaunch', async () => {
      await useEmailConfirmationStore.getState().stage({
        email: 'test@example.com',
        username: 'testuser',
        expectedUserId: 'user-1',
        fromOnboarding: true,
      });
      const session = {
        access_token: 'confirmed-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
      };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      await expect(
        useAuthStore
          .getState()
          .recoverEmailConfirmationSession('test@example.com')
      ).resolves.toBe('session_confirmed');

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useEmailConfirmationStore.getState().pending).toBeNull();
    });

    it('does not attach a pending signup to a different restored account', async () => {
      await useEmailConfirmationStore.getState().stage({
        email: 'pending@example.com',
        username: 'pendinguser',
        expectedUserId: 'pending-user',
        fromOnboarding: true,
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'other-token',
            user: {
              id: 'other-user',
              email: 'other@example.com',
              user_metadata: { username: 'otheruser' },
            },
          },
        },
        error: null,
      });

      await expect(
        useAuthStore
          .getState()
          .recoverEmailConfirmationSession('pending@example.com')
      ).resolves.toBe('account_mismatch');

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useEmailConfirmationStore.getState().pending?.email).toBe(
        'pending@example.com'
      );
    });

    it('handles registration error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.register(
            'test@example.com',
            'password123',
            'testuser'
          );
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('logout', () => {
    it('successfully logs out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        result.current.setUserAndSession(
          { id: 'user-1', email: 'test@example.com' } as any,
          { access_token: 'token' } as any
        );
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(
        mockSupabase.auth.signOut.mock.invocationCallOrder[0]
      ).toBeLessThan(mockClearAccountScopedState.mock.invocationCallOrder[0]);
    });

    it('keeps the current account signed in when remote sign-out fails', async () => {
      mockSupabase.auth.signOut.mockRejectedValue(new Error('Network error'));
      useAuthStore.setState({
        user: { id: 'user-1', username: 'testuser' },
        session: { access_token: 'token' } as any,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(result.current.logout()).rejects.toThrow('Network error');

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe('user-1');
      expect(mockClearAccountScopedState).not.toHaveBeenCalled();
      expect(mockNotificationService.startUserScopedWork).toHaveBeenCalledWith(
        'user-1'
      );
    });

    it('does not send a second sign-out while the first request is active', async () => {
      let resolveSignOut: ((value: { error: null }) => void) | undefined;
      mockSupabase.auth.signOut.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSignOut = resolve;
          }) as any
      );
      useAuthStore.setState({
        user: { id: 'user-1', username: 'testuser' },
        session: { access_token: 'token' } as any,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());
      const first = result.current.logout();

      await expect(result.current.logout()).rejects.toThrow(
        'session change is already in progress'
      );
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveSignOut?.({ error: null });
        await first;
      });
    });
  });

  describe('setUserAndSession', () => {
    it('sets user and session data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
      };
      const mockSession = { access_token: 'token' };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                username: 'testuser',
                avatar_url: 'avatar.jpg',
                momenta_balance: 100,
                has_completed_onboarding: true,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setUserAndSession(
          mockUser as any,
          mockSession as any
        );
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.session).toBe(mockSession);
      expect(result.current.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('records a Meta sign-up for a newly created OAuth session', async () => {
      const {
        isNewAuthUser,
        resolveMetaAdsRegistrationMethod,
        trackMetaAdsSignUp,
      } = jest.requireMock('@/lib/meta-ads') as {
        isNewAuthUser: jest.Mock;
        resolveMetaAdsRegistrationMethod: jest.Mock;
        trackMetaAdsSignUp: jest.Mock;
      };
      isNewAuthUser.mockReturnValue(true);
      resolveMetaAdsRegistrationMethod.mockReturnValue('oauth');

      const mockUser = {
        id: 'user-1',
        email: 'ada@example.com',
        app_metadata: { provider: 'google' },
        user_metadata: { username: 'ada' },
      };
      const mockSession = { access_token: 'token' };

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setUserAndSession(
          mockUser as any,
          mockSession as any
        );
      });

      expect(trackMetaAdsSignUp).toHaveBeenCalledWith({
        userId: 'user-1',
        method: 'oauth',
      });
    });

    it('invalidates a session whose authenticated profile is missing', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
      };
      const mockSession = { access_token: 'token' };
      mockGetMyProfile.mockResolvedValueOnce(null);
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' },
              })
              .mockResolvedValueOnce({
                data: {
                  username: 'testuser',
                  avatar_url: null,
                  momenta_balance: 0,
                  has_completed_onboarding: false,
                },
                error: null,
              }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setUserAndSession(
          mockUser as any,
          mockSession as any
        );
      });

      expect(mockNotificationService.stopUserScopedWork).toHaveBeenCalledWith(
        'user-1'
      );
      expect(mockClearAccountScopedState).toHaveBeenCalledWith('user-1');
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('silently clears account work when the current session is revoked', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockGetMyProfile.mockRejectedValueOnce(
        new Error('AUTH_SESSION_REVOKED: session revoked')
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setUserAndSession(
          {
            id: 'revoked-user',
            email: 'revoked@example.com',
            user_metadata: { username: 'revoked' },
          } as any,
          { access_token: 'revoked-token' } as any
        );
      });

      expect(mockNotificationService.stopUserScopedWork).toHaveBeenCalledWith(
        'revoked-user'
      );
      expect(mockClearAccountScopedState).toHaveBeenCalledWith('revoked-user');
      expect(consoleError).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();

      consoleError.mockRestore();
    });

    it('clears the previous account before activating a different user', async () => {
      useAuthStore.setState({
        user: { id: 'user-1', username: 'first' },
        session: { access_token: 'old-token' } as any,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.setUserAndSession(
          {
            id: 'user-2',
            email: 'second@example.com',
            user_metadata: { username: 'second' },
          } as any,
          { access_token: 'new-token' } as any
        );
      });

      expect(mockClearAccountScopedState).toHaveBeenCalledWith('user-1');
      expect(mockNotificationService.startUserScopedWork).toHaveBeenCalledWith(
        'user-2'
      );
      expect(
        mockClearAccountScopedState.mock.invocationCallOrder[0]
      ).toBeLessThan(
        mockNotificationService.startUserScopedWork.mock.invocationCallOrder[0]
      );
      expect(result.current.user?.id).toBe('user-2');
    });

    it('blocks account A immediately and lets only the latest session activate after teardown', async () => {
      let resolveTeardown: (() => void) | undefined;
      mockClearAccountScopedState.mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            resolveTeardown = resolve;
          })
      );
      useAuthStore.setState({
        user: { id: 'user-1', username: 'first', momentaBalance: 733 },
        session: { access_token: 'old-token' } as any,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        hasCompletedOnboarding: true,
      });

      const { result } = renderHook(() => useAuthStore());
      let secondAccountPromise: Promise<void> | undefined;
      act(() => {
        secondAccountPromise = result.current.setUserAndSession(
          {
            id: 'user-2',
            email: 'second@example.com',
            user_metadata: { username: 'second' },
          } as any,
          { access_token: 'second-token' } as any
        );
      });

      await waitFor(() =>
        expect(mockClearAccountScopedState).toHaveBeenCalledWith('user-1')
      );
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);

      let thirdAccountPromise: Promise<void> | undefined;
      act(() => {
        thirdAccountPromise = result.current.setUserAndSession(
          {
            id: 'user-3',
            email: 'third@example.com',
            user_metadata: { username: 'third' },
          } as any,
          { access_token: 'third-token' } as any
        );
      });
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(true);

      resolveTeardown?.();
      await act(async () => {
        await Promise.all([secondAccountPromise, thirdAccountPromise]);
      });

      expect(result.current.user?.id).toBe('user-3');
      expect(result.current.session?.access_token).toBe('third-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(mockNotificationService.startUserScopedWork).toHaveBeenCalledWith(
        'user-3'
      );
      expect(
        mockNotificationService.startUserScopedWork
      ).not.toHaveBeenCalledWith('user-2');
    });

    it('leaves the app signed out when sign-out supersedes a held account switch', async () => {
      let resolveTeardown: (() => void) | undefined;
      mockClearAccountScopedState.mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            resolveTeardown = resolve;
          })
      );
      useAuthStore.setState({
        user: { id: 'user-1', username: 'first' },
        session: { access_token: 'old-token' } as any,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        hasCompletedOnboarding: true,
      });

      const { result } = renderHook(() => useAuthStore());
      let switchPromise: Promise<void> | undefined;
      act(() => {
        switchPromise = result.current.setUserAndSession(
          {
            id: 'user-2',
            email: 'second@example.com',
            user_metadata: { username: 'second' },
          } as any,
          { access_token: 'second-token' } as any
        );
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));
      act(() => result.current.clearAuthData());
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);

      resolveTeardown?.();
      await act(async () => {
        await switchPromise;
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(
        mockNotificationService.startUserScopedWork
      ).not.toHaveBeenCalledWith('user-2');
    });

    it('holds route loading until the new account onboarding flag resolves', async () => {
      let resolveProfile:
        | ((value: {
            username: string;
            avatar_url: null;
            momenta_balance: number;
            has_completed_onboarding: boolean;
          }) => void)
        | undefined;
      mockGetMyProfile.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveProfile = resolve;
          })
      );
      useAuthStore.setState({
        user: { id: 'user-1', username: 'first', momentaBalance: 733 },
        session: { access_token: 'old-token' } as any,
        isAuthenticated: true,
        hasCompletedOnboarding: true,
      });

      const { result } = renderHook(() => useAuthStore());
      let switchPromise: Promise<void> | undefined;
      act(() => {
        switchPromise = result.current.setUserAndSession(
          {
            id: 'user-2',
            email: 'second@example.com',
            user_metadata: { username: 'second' },
          } as any,
          { access_token: 'new-token' } as any
        );
      });

      await waitFor(() => expect(result.current.user?.id).toBe('user-2'));
      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.user?.momentaBalance).toBe(0);
      expect(result.current.isLoading).toBe(true);

      resolveProfile?.({
        username: 'second',
        avatar_url: null,
        momenta_balance: 0,
        has_completed_onboarding: true,
      });
      await act(async () => {
        await switchPromise;
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('syncs with momenta store after setting user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
      };
      const mockSession = { access_token: 'token' };
      const mockSyncWithBackend = jest.fn();

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                username: 'testuser',
                momenta_balance: 100,
                has_completed_onboarding: true,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      mockMomentaStore.getState.mockReturnValue({
        syncWithBackend: mockSyncWithBackend,
        activateAccountScope: jest.fn(),
        clearMomentaData: jest.fn(),
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setUserAndSession(
          mockUser as any,
          mockSession as any
        );
      });

      await waitFor(() => {
        expect(mockSyncWithBackend).toHaveBeenCalledWith('user-1');
      });
    });

    it('clears auth data when user is null', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        result.current.setUserAndSession(
          { id: 'user-1', email: 'test@example.com' } as any,
          { access_token: 'token' } as any
        );
      });

      await act(async () => {
        await result.current.setUserAndSession(null, null);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('completeOnboarding', () => {
    it('marks onboarding as completed', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        momentaBalance: 100,
      };

      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          session: { access_token: 'token' } as any,
          isAuthenticated: true,
          isInitialized: true,
        });
      });

      await act(async () => {
        await result.current.completeOnboarding({
          activationPath: 'event_invite',
        });
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(mockTrackProductEvent).toHaveBeenCalledWith(
        'Onboarding Completed',
        {
          activation_path: 'event_invite',
          referral_used: false,
        }
      );
    });

    it('does not complete a new account after an earlier response arrives late', async () => {
      let resolveUpdate:
        | ((value: Awaited<ReturnType<typeof updateMyProfile>>) => void)
        | undefined;
      mockUpdateMyProfile.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveUpdate = resolve;
          })
      );
      useAuthStore.setState({
        user: { id: 'user-1', username: 'first' },
        session: { access_token: 'first-token' } as any,
        isAuthenticated: true,
        isInitialized: true,
        hasCompletedOnboarding: false,
      });

      const { result } = renderHook(() => useAuthStore());
      const completionPromise = result.current.completeOnboarding();
      await waitFor(() => expect(mockUpdateMyProfile).toHaveBeenCalledTimes(1));

      act(() => {
        result.current.clearAuthData();
        useAuthStore.setState({
          user: { id: 'user-2', username: 'second' },
          session: { access_token: 'second-token' } as any,
          isAuthenticated: true,
          isInitialized: true,
          hasCompletedOnboarding: false,
        });
      });

      resolveUpdate?.({
        id: 'user-1',
        email: 'first@example.com',
        username: 'first',
        display_name: 'First User',
        avatar_url: null,
        momenta_balance: 100,
        has_completed_onboarding: true,
        created_at: '2026-08-04T00:00:00.000Z',
        updated_at: '2026-08-04T00:00:00.000Z',
        is_pro: false,
        is_approved: true,
      });

      await expect(completionPromise).rejects.toMatchObject({
        code: 'ONBOARDING_ACCOUNT_CHANGED',
      });
      expect(result.current.user?.id).toBe('user-2');
      expect(result.current.session?.access_token).toBe('second-token');
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    it('rejects a completion receipt for a different profile owner', async () => {
      mockUpdateMyProfile.mockResolvedValueOnce({
        id: 'user-2',
        email: 'second@example.com',
        username: 'second',
        display_name: 'Second User',
        avatar_url: null,
        momenta_balance: 0,
        has_completed_onboarding: true,
        created_at: '2026-08-04T00:00:00.000Z',
        updated_at: '2026-08-04T00:00:00.000Z',
        is_pro: false,
        is_approved: true,
      });
      useAuthStore.setState({
        user: { id: 'user-1', username: 'first' },
        session: { access_token: 'first-token' } as any,
        isAuthenticated: true,
        isInitialized: true,
        hasCompletedOnboarding: false,
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(result.current.completeOnboarding()).rejects.toMatchObject({
        code: 'ONBOARDING_ACCOUNT_CHANGED',
      });
      expect(result.current.user?.id).toBe('user-1');
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('clearAuthData', () => {
    it('clears all auth data', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-1', email: 'test@example.com' } as any,
          session: { access_token: 'token' } as any,
          isAuthenticated: true,
          isInitialized: true,
        });
      });

      act(() => {
        result.current.clearAuthData();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('persists auth state to AsyncStorage', async () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        momentaBalance: 100,
      };

      act(() => {
        result.current.setUserAndSession(
          mockUser as any,
          { access_token: 'token' } as any
        );
      });

      // Wait for persistence
      await waitFor(async () => {
        const stored = await AsyncStorage.getItem('auth-storage');
        expect(stored).toBeTruthy();
      });
    });
  });
});
