import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';
import { useAuthStore } from '../auth-store';
import { supabase } from '@/lib/supabase';
import { getMyProfile } from '@/lib/profile-api';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';
import { ensurePrivateImageCachesCleared } from '@/lib/account-session-lifecycle';
import { clearPrivateVideoCache } from '@/lib/auth/clear-private-video-cache';
import { clearVideoCacheAsync, getCurrentVideoCacheSize } from 'expo-video';
import { OAuthService } from '@/lib/oauth';

// Kept apart from auth-store.test.ts because the auth listener registers once
// per module, and this launch case needs it to deliver INITIAL_SESSION.
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

it('recognises an existing Google account when the installed video cache directory has never been created', async () => {
  await AsyncStorage.clear();
  useAuthStore.setState({
    user: null,
    session: null,
    isAuthenticated: false,
    isInitialized: true,
    isLoading: false,
    hasCompletedOnboarding: false,
    sessionRecoveryRequired: true,
  });
  const session = {
    access_token: 'synthetic-google-token',
    user: { id: 'returning-google-user', user_metadata: {} },
  } as any;
  jest.mocked(getCurrentVideoCacheSize).mockReturnValue(0);
  jest
    .mocked(clearVideoCacheAsync)
    .mockRejectedValueOnce(
      new Error('NSCocoaErrorDomain Code=260: The folder does not exist.')
    );
  jest
    .mocked(ensurePrivateImageCachesCleared)
    .mockImplementationOnce(clearPrivateVideoCache);
  jest.mocked(OAuthService.signInWithGoogle).mockResolvedValueOnce({
    success: true,
    user: session.user,
    session,
  });
  mockGetMyProfile.mockResolvedValueOnce({
    id: session.user.id,
    username: 'Returning member',
    has_completed_onboarding: true,
    momenta_balance: 100,
  } as any);
  await useAuthStore.getState().signInWithGoogle();
  expect(useAuthStore.getState()).toMatchObject({
    isAuthenticated: true,
    isLoading: false,
    hasCompletedOnboarding: true,
    sessionRecoveryRequired: false,
    user: { id: session.user.id },
  });
  jest.mocked(clearVideoCacheAsync).mockReset().mockResolvedValue(undefined);
});

it('loads a restored account once when Supabase reports the same session twice at launch', async () => {
  const session = {
    access_token: 'persisted-token',
    user: { id: 'user-1', email: 'test@example.com', user_metadata: {} },
  } as any;
  let releaseProfile: () => void = () => undefined;
  const profileReady = new Promise<void>(resolve => {
    releaseProfile = resolve;
  });
  mockGetMyProfile.mockImplementation(async () => {
    // Hold the profile like a slow network so both launch paths overlap.
    await profileReady;
    return {
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
    } as any;
  });
  useEmailConfirmationStore.setState({ pending: null, hasHydrated: true });
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session },
    error: null,
  });
  mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
    callback('INITIAL_SESSION', session);
    return { data: { subscription: { unsubscribe: jest.fn() } } } as any;
  });

  await act(async () => {
    const init = useAuthStore.getState().initializeAuth();
    // Let the listener's deferred INITIAL_SESSION handler start as well.
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    releaseProfile();
    await init;
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(useAuthStore.getState().isLoading).toBe(false);
  expect(mockGetMyProfile).toHaveBeenCalledTimes(1);
});

describe('durable recovery quarantine', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      isAuthenticated: false,
    });
    await AsyncStorage.clear();
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
  });

  it('rejects a quarantined restored session without waiting for an auth event', async () => {
    const storage = AsyncStorage;
    const {
      MAIN_RECOVERY_QUARANTINE_STORAGE_KEY,
    } = require('@/lib/auth/main-recovery-quarantine');
    await storage.setItem(MAIN_RECOVERY_QUARANTINE_STORAGE_KEY, 'user-1');
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'synthetic-recovery',
          user: { id: 'user-1', user_metadata: {} },
        } as any,
      },
      error: null,
    });
    await useAuthStore.getState().initializeAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });

  it('rejects direct session acceptance even for an already-ready account', async () => {
    const storage = AsyncStorage;
    const {
      MAIN_RECOVERY_QUARANTINE_STORAGE_KEY,
    } = require('@/lib/auth/main-recovery-quarantine');
    await storage.setItem(MAIN_RECOVERY_QUARANTINE_STORAGE_KEY, 'user-1');
    useAuthStore.setState({
      user: { id: 'user-1', username: 'Synthetic' },
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
    });
    await useAuthStore
      .getState()
      .setUserAndSession(
        { id: 'user-1', user_metadata: {} } as any,
        { access_token: 'synthetic-recovery', user: { id: 'user-1' } } as any
      );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().session).toBeNull();
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });
});
