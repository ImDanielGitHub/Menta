import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../auth-store';
import { supabase } from '@/lib/supabase';
import { getMyProfile } from '@/lib/profile-api';
import { clearAccountScopedState } from '@/lib/account-session-lifecycle';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';

// Each module gets one SDK listener; this suite drives actual auth callbacks
// while a direct acceptance is suspended on the quarantine storage read.
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
  ensurePrivateImageCachesCleared: jest.fn().mockResolvedValue(undefined),
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
const mockGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;

describe('auth event acceptance ordering', () => {
  const quarantineKey = 'menta.main-auth.recovery-quarantine.v1';
  type AuthCallback = Parameters<typeof supabase.auth.onAuthStateChange>[0];
  let onAuthEvent: AuthCallback;
  let originalStorageRead: typeof AsyncStorage.getItem;

  beforeAll(async () => {
    mockSupabase.auth.onAuthStateChange.mockImplementation(callback => {
      onAuthEvent = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } } as any;
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    await useAuthStore.getState().initializeAuth();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    originalStorageRead = jest
      .mocked(AsyncStorage.getItem)
      .getMockImplementation()!;
    useAuthStore.setState({
      user: { id: 'user-1', username: 'existing' },
      session: { access_token: 'initial-token', user: { id: 'user-1' } } as any,
      isInitialized: true,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.mocked(AsyncStorage.getItem).mockImplementation(originalStorageRead);
  });

  it('does not let the SDK SIGNED_OUT event bypass failed token cleanup', async () => {
    mockSupabase.auth.signOut.mockImplementationOnce(async () => {
      await onAuthEvent('SIGNED_OUT', null);
      return { error: null } as any;
    });
    jest
      .mocked(AsyncStorage.multiRemove)
      .mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(useAuthStore.getState().logout()).rejects.toThrow(
      'storage unavailable'
    );
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-1' },
      session: { access_token: 'initial-token' },
      isAuthenticated: true,
      isLoading: false,
    });
    expect(clearAccountScopedState).not.toHaveBeenCalled();

    await onAuthEvent(
      'TOKEN_REFRESHED',
      useAuthStore.getState().session as any
    );
  });

  it('coalesces SDK and direct logout cleanup into one teardown', async () => {
    mockSupabase.auth.signOut.mockImplementationOnce(async () => {
      await onAuthEvent('SIGNED_OUT', null);
      return { error: null } as any;
    });

    await useAuthStore.getState().logout();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(clearAccountScopedState).toHaveBeenCalledTimes(1);
    expect(clearAccountScopedState).toHaveBeenCalledWith('user-1');
  });
  it.each(['SIGNED_OUT', 'INITIAL_SESSION'] as const)(
    'does not let a delayed %s replace a newer accepted account',
    async event => {
      const user = {
        id: 'user-2',
        email: 'new@example.com',
        user_metadata: {},
      };
      const session = {
        access_token: 'new-session-token',
        refresh_token: 'new-refresh',
        user,
      };
      mockGetMyProfile.mockResolvedValue({
        id: 'user-2',
        username: 'new',
        has_completed_onboarding: true,
      } as any);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null,
      } as any);
      await onAuthEvent(
        event,
        event === 'SIGNED_OUT'
          ? null
          : ({ access_token: 'old-token', user: { id: 'user-1' } } as any)
      );
      await useAuthStore
        .getState()
        .setUserAndSession(user as any, session as any);
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      expect(useAuthStore.getState()).toMatchObject({
        isAuthenticated: true,
        user: { id: 'user-2' },
        session,
      });
    }
  );

  it.each(['SIGNED_IN', 'TOKEN_REFRESHED'] as const)(
    'keeps the later %s token when a direct quarantine read finishes last',
    async event => {
      let resolveRead!: (value: null) => void;
      const pendingRead = new Promise<null>(resolve => {
        resolveRead = resolve;
      });
      let held = false;
      jest.mocked(AsyncStorage.getItem).mockImplementation((key, callback) => {
        if (key === quarantineKey && !held) {
          held = true;
          return pendingRead;
        }
        return originalStorageRead(key, callback);
      });
      const user = { id: 'user-1', user_metadata: {} };
      const olderSession = { access_token: 'older-token', user };
      const newerSession = { access_token: 'newer-token', user };
      const older = useAuthStore
        .getState()
        .setUserAndSession(user as any, olderSession as any);
      await onAuthEvent(event, newerSession as any);
      await waitFor(() =>
        expect(useAuthStore.getState().session?.access_token).toBe(
          'newer-token'
        )
      );
      await act(async () => {
        resolveRead(null);
        await older;
      });
      expect(useAuthStore.getState()).toMatchObject({
        user: { id: 'user-1' },
        session: newerSession,
        isAuthenticated: true,
        isLoading: false,
      });
      expect(mockGetMyProfile).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['missing', false],
    ['rejected', false],
    ['missing', true],
    ['rejected', true],
  ] as const)(
    'rechecks a %s stale profile result with restored authority=%s',
    async (outcome, restoredAuthority) => {
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        hasCompletedOnboarding: restoredAuthority,
        onboardingConfirmedUserId: restoredAuthority ? 'user-1' : null,
      });
      let resolveProfile!: (value: null) => void;
      let rejectProfile!: (error: Error) => void;
      let profileStarted!: () => void;
      const started = new Promise<void>(resolve => {
        profileStarted = resolve;
      });
      mockGetMyProfile
        .mockImplementationOnce(() => {
          profileStarted();
          return new Promise((resolve, reject) => {
            resolveProfile = resolve;
            rejectProfile = reject;
          });
        })
        .mockResolvedValueOnce({
          id: 'user-1',
          username: 'confirmed',
          avatar_url: null,
          momenta_balance: 42,
          has_completed_onboarding: true,
        } as any);
      const user = { id: 'user-1', user_metadata: {} };
      const originalSession = { access_token: 'original-token', user };
      const refreshedSession = { access_token: 'refreshed-token', user };
      const hydration = useAuthStore
        .getState()
        .setUserAndSession(user as any, originalSession as any);
      await started;
      await onAuthEvent('TOKEN_REFRESHED', refreshedSession as any);
      await waitFor(() =>
        expect(useAuthStore.getState().session?.access_token).toBe(
          'refreshed-token'
        )
      );
      await act(async () => {
        if (outcome === 'missing') resolveProfile(null);
        else rejectProfile(new Error('stale profile request failed'));
        await hydration;
      });
      expect(useAuthStore.getState()).toMatchObject({
        user: { id: 'user-1', username: 'confirmed' },
        session: refreshedSession,
        isAuthenticated: true,
        isLoading: false,
        hasCompletedOnboarding: true,
      });
      expect(mockGetMyProfile).toHaveBeenCalledTimes(2);
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
    }
  );

  it('retries profile hydration superseded by rotation during quarantine storage', async () => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
      onboardingConfirmedUserId: null,
    });
    let resolveProfile!: (value: null) => void;
    let profileStarted!: () => void;
    const started = new Promise<void>(resolve => {
      profileStarted = resolve;
    });
    mockGetMyProfile
      .mockImplementationOnce(() => {
        profileStarted();
        return new Promise(resolve => {
          resolveProfile = resolve;
        });
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        username: 'confirmed',
        avatar_url: null,
        momenta_balance: 42,
        has_completed_onboarding: true,
      } as any);
    const user = { id: 'user-1', user_metadata: {} };
    const rotatedSession = { access_token: 'rotated-token', user };
    const hydration = useAuthStore
      .getState()
      .setUserAndSession(
        user as any,
        { access_token: 'old-token', user } as any
      );
    await started;
    await onAuthEvent('TOKEN_REFRESHED', rotatedSession as any);
    await waitFor(() =>
      expect(useAuthStore.getState().session?.access_token).toBe(
        'rotated-token'
      )
    );
    let releaseRead!: (value: null) => void;
    let storageStarted!: () => void;
    const readStarted = new Promise<void>(resolve => {
      storageStarted = resolve;
    });
    const heldRead = new Promise<null>(resolve => {
      releaseRead = resolve;
    });
    let held = false;
    jest.mocked(AsyncStorage.getItem).mockImplementation((key, callback) => {
      if (key === quarantineKey && !held) {
        held = true;
        storageStarted();
        return heldRead;
      }
      return originalStorageRead(key, callback);
    });
    resolveProfile(null);
    await readStarted;
    const newestSession = { access_token: 'newest-token', user };
    await onAuthEvent('TOKEN_REFRESHED', newestSession as any);
    await waitFor(() =>
      expect(useAuthStore.getState().session?.access_token).toBe('newest-token')
    );
    await act(async () => {
      releaseRead(null);
      await hydration;
    });
    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-1', username: 'confirmed' },
      session: newestSession,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('does not treat persisted onboarding as a confirmed profile when refreshed hydration fails', async () => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: true,
      onboardingConfirmedUserId: 'user-1',
    });
    let resolveProfile!: (value: null) => void;
    let profileStarted!: () => void;
    const started = new Promise<void>(resolve => {
      profileStarted = resolve;
    });
    mockGetMyProfile
      .mockImplementationOnce(() => {
        profileStarted();
        return new Promise(resolve => {
          resolveProfile = resolve;
        });
      })
      .mockRejectedValueOnce(new Error('user not found'));
    const user = { id: 'user-1', user_metadata: {} };
    const refreshedSession = { access_token: 'refreshed-token', user };
    const hydration = useAuthStore
      .getState()
      .setUserAndSession(
        user as any,
        { access_token: 'old-token', user } as any
      );
    await started;
    await onAuthEvent('TOKEN_REFRESHED', refreshedSession as any);
    await waitFor(() =>
      expect(useAuthStore.getState().session?.access_token).toBe(
        'refreshed-token'
      )
    );
    await act(async () => {
      resolveProfile(null);
      await hydration;
    });
    expect(mockGetMyProfile).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      session: null,
      isAuthenticated: false,
    });
  });

  it('rechecks session rotation that arrives while failed-profile cleanup is pending', async () => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
      onboardingConfirmedUserId: null,
    });
    let releaseTeardown!: () => void;
    let teardownStarted!: () => void;
    const started = new Promise<void>(resolve => {
      teardownStarted = resolve;
    });
    jest.mocked(clearAccountScopedState).mockImplementationOnce(() => {
      teardownStarted();
      return new Promise(resolve => {
        releaseTeardown = resolve;
      });
    });
    mockGetMyProfile
      .mockRejectedValueOnce(new Error('auth session missing'))
      .mockResolvedValueOnce({
        id: 'user-1',
        username: 'confirmed',
        avatar_url: null,
        momenta_balance: 42,
        has_completed_onboarding: true,
      } as any);
    const user = { id: 'user-1', user_metadata: {} };
    const refreshedSession = { access_token: 'refreshed-token', user };
    const hydration = useAuthStore
      .getState()
      .setUserAndSession(
        user as any,
        { access_token: 'old-token', user } as any
      );
    await started;
    await onAuthEvent('TOKEN_REFRESHED', refreshedSession as any);
    await waitFor(() =>
      expect(useAuthStore.getState().session?.access_token).toBe(
        'refreshed-token'
      )
    );
    await act(async () => {
      releaseTeardown();
      await hydration;
    });
    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-1', username: 'confirmed' },
      session: refreshedSession,
      isAuthenticated: true,
      isLoading: false,
    });
    expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('retains in-flight profile authority through a same-account token refresh', async () => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      onboardingConfirmedUserId: null,
    });
    let resolveProfile!: (
      profile: Awaited<ReturnType<typeof getMyProfile>>
    ) => void;
    let profileStarted!: () => void;
    const started = new Promise<void>(resolve => {
      profileStarted = resolve;
    });
    mockGetMyProfile.mockImplementationOnce(() => {
      profileStarted();
      return new Promise(resolve => {
        resolveProfile = resolve;
      });
    });
    const user = { id: 'user-1', user_metadata: {} };
    const originalSession = { access_token: 'original-token', user };
    const refreshedSession = { access_token: 'refreshed-token', user };
    const hydration = useAuthStore
      .getState()
      .setUserAndSession(user as any, originalSession as any);
    await started;
    await onAuthEvent('TOKEN_REFRESHED', refreshedSession as any);
    await waitFor(() =>
      expect(useAuthStore.getState().session?.access_token).toBe(
        'refreshed-token'
      )
    );
    await act(async () => {
      resolveProfile({
        id: 'user-1',
        username: 'confirmed',
        avatar_url: null,
        momenta_balance: 42,
        has_completed_onboarding: true,
      } as any);
      await hydration;
    });
    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-1', username: 'confirmed' },
      session: refreshedSession,
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: true,
    });
    expect(mockGetMyProfile).toHaveBeenCalledTimes(1);
  });
});
