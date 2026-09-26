import { act } from '@testing-library/react-native';
import { useAuthStore } from '../auth-store';
import { supabase } from '@/lib/supabase';
import { getMyProfile } from '@/lib/profile-api';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';

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
