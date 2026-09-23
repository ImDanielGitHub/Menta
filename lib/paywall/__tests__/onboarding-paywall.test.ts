import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  resolveOnboardingPaywall,
  recordOnboardingPaywallExposure,
  ONBOARDING_PAYWALL_FLAG,
} from '../onboarding-paywall';

let mockOwner = 'new-member';
let mockCompleted = false;
let mockInvite: object | null = null;
let mockHandoff: { path: string } | null = null;
let mockSupported = true;
const mockProfile = jest.fn();
const mockPro = jest.fn();
const mockFlags = jest.fn();
const mockTrack = jest.fn();
const mockRemember = jest.fn().mockResolvedValue(undefined);
const mockAmplitudeAssignment = jest.fn();
const mockClient = {
  reloadFeatureFlagsAsync: mockFlags,
  getDistinctId: () => mockOwner,
  setPersonPropertiesForFlags: jest.fn(),
};
let mockAvailableClient = true;

jest.mock('@/store/auth-store', () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: mockOwner },
      hasCompletedOnboarding: mockCompleted,
    }),
  },
}));
jest.mock('@/store/invite-store', () => ({
  useInviteStore: {
    persist: { hasHydrated: () => true, rehydrate: jest.fn() },
    getState: () => ({ peekPendingForUser: () => mockInvite }),
  },
}));
jest.mock('@/store/protected-route-store', () => ({
  useProtectedRouteStore: {
    persist: { hasHydrated: () => true, rehydrate: jest.fn() },
    getState: () => ({ peekPendingRouteForUser: () => mockHandoff }),
  },
}));
jest.mock('@/lib/profile-api', () => ({
  getMyProfile: () => mockProfile(),
  getMyProAuthority: () => mockPro(),
}));
jest.mock('@/lib/paywall/revenuecat', () => ({
  get REVENUECAT_SUPPORTED() {
    return mockSupported;
  },
}));
jest.mock('@/lib/posthog', () => ({
  getPostHogClient: () => (mockAvailableClient ? mockClient : null),
  setProductAnalyticsUserId: jest.fn(),
  trackProductEvent: (...args: unknown[]) => mockTrack(...args),
}));
jest.mock('@/lib/amplitude', () => ({
  setAmplitudeUserId: jest.fn(),
  setAmplitudePaywallAssignment: (...args: unknown[]) =>
    mockAmplitudeAssignment(...args),
}));
jest.mock('@/lib/analytics/onboarding-paywall-context', () => ({
  ONBOARDING_PAYWALL_FLAG: 'onboarding_hard_paywall_v1',
  rememberPaywallAnalyticsAssignment: (...args: unknown[]) =>
    mockRemember(...args),
}));

const gateKey = (owner = mockOwner) =>
  `@menta/${ONBOARDING_PAYWALL_FLAG}/${owner}`;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockOwner = 'new-member';
  mockCompleted = false;
  mockInvite = null;
  mockHandoff = null;
  mockSupported = true;
  mockAvailableClient = true;
  mockProfile.mockResolvedValue({
    id: mockOwner,
    created_at: '2026-09-14T00:00:00Z',
    has_completed_onboarding: false,
  });
  mockPro.mockResolvedValue({ is_pro: false, reconciliation_pending: false });
  mockFlags.mockResolvedValue({ [ONBOARDING_PAYWALL_FLAG]: 'hard_paywall' });
});

it.each(['control', 'hard_paywall'] as const)(
  'assigns %s and persists it for the signed-in account',
  async variant => {
    mockFlags.mockResolvedValue({ [ONBOARDING_PAYWALL_FLAG]: variant });
    expect(await resolveOnboardingPaywall(mockOwner)).toEqual({
      variant,
      enrolled: true,
      requiresPurchase: variant === 'hard_paywall',
      accessPending: false,
    });
    expect(await AsyncStorage.getItem(gateKey())).toBe(variant);
    expect(mockRemember).toHaveBeenCalledWith(mockOwner, variant);
    expect(mockAmplitudeAssignment).toHaveBeenCalledWith(variant);
  }
);

it('keeps normal return-to-Today sign-ins eligible', async () => {
  mockHandoff = { path: '/(tabs)' };
  expect((await resolveOnboardingPaywall(mockOwner)).requiresPurchase).toBe(
    true
  );
});

it.each(['group', 'challenge'])(
  'preserves a pending %s invitation',
  async type => {
    mockInvite = { type };
    expect((await resolveOnboardingPaywall(mockOwner)).enrolled).toBe(false);
  }
);

it('preserves a protected event handoff', async () => {
  mockHandoff = { path: '/events/confirmed-event' };
  expect((await resolveOnboardingPaywall(mockOwner)).enrolled).toBe(false);
});

it('excludes accounts created before the launch cutoff', async () => {
  mockProfile.mockResolvedValue({
    id: mockOwner,
    created_at: '2026-09-12T00:00:00Z',
    has_completed_onboarding: false,
  });
  expect((await resolveOnboardingPaywall(mockOwner)).enrolled).toBe(false);
});

it('never paywalls completed onboarding or unsupported purchase clients', async () => {
  mockCompleted = true;
  expect((await resolveOnboardingPaywall(mockOwner)).requiresPurchase).toBe(
    false
  );
  mockCompleted = false;
  mockSupported = false;
  expect((await resolveOnboardingPaywall(mockOwner)).requiresPurchase).toBe(
    false
  );
});

it('releases an active subscriber only after server confirmation', async () => {
  await AsyncStorage.setItem(gateKey(), 'hard_paywall');
  mockPro.mockResolvedValue({ is_pro: true, reconciliation_pending: false });
  expect((await resolveOnboardingPaywall(mockOwner)).requiresPurchase).toBe(
    false
  );
});

it('shows recovery when entitlement reconciliation is pending', async () => {
  mockPro.mockResolvedValue({ is_pro: true, reconciliation_pending: true });
  expect(await resolveOnboardingPaywall(mockOwner)).toMatchObject({
    requiresPurchase: true,
    accessPending: true,
  });
});

it('does not rerandomise a persisted treatment when the remote split changes', async () => {
  await resolveOnboardingPaywall(mockOwner);
  mockFlags.mockResolvedValue({ [ONBOARDING_PAYWALL_FLAG]: 'control' });
  expect((await resolveOnboardingPaywall(mockOwner)).variant).toBe(
    'hard_paywall'
  );
});

it.each([false, undefined])(
  'releases a persisted gate when a successful response disables/removes the flag (%s)',
  async value => {
    await AsyncStorage.setItem(gateKey(), 'hard_paywall');
    mockFlags.mockResolvedValue(
      value === undefined ? {} : { [ONBOARDING_PAYWALL_FLAG]: value }
    );
    expect((await resolveOnboardingPaywall(mockOwner)).requiresPurchase).toBe(
      false
    );
    expect(await AsyncStorage.getItem(gateKey())).toBe('released');
  }
);

it('uses the free flow on first assignment failure and retains an existing gate offline', async () => {
  mockFlags.mockRejectedValue(new Error('offline'));
  expect((await resolveOnboardingPaywall(mockOwner)).enrolled).toBe(false);
  await AsyncStorage.setItem(gateKey(), 'hard_paywall');
  expect((await resolveOnboardingPaywall(mockOwner)).requiresPurchase).toBe(
    true
  );
});

it('does not reuse another account assignment', async () => {
  await AsyncStorage.setItem(gateKey('other-member'), 'hard_paywall');
  mockAvailableClient = false;
  expect((await resolveOnboardingPaywall(mockOwner)).enrolled).toBe(false);
});

it('aborts an in-flight decision after an account change', async () => {
  mockProfile.mockImplementation(async () => {
    mockOwner = 'other-member';
    return { id: 'new-member', created_at: '2026-09-14T00:00:00Z' };
  });
  await expect(resolveOnboardingPaywall('new-member')).rejects.toThrow(
    'account changed'
  );
  expect(await AsyncStorage.getItem(gateKey('other-member'))).toBeNull();
});

it.each(['control', 'hard_paywall'] as const)(
  'records %s exposure through the shared Amplitude and PostHog transport',
  variant => {
    mockOwner = 'exposure-' + variant;
    const decision = {
      variant,
      enrolled: true,
      requiresPurchase: variant === 'hard_paywall',
    };
    recordOnboardingPaywallExposure(mockOwner, decision);
    recordOnboardingPaywallExposure(mockOwner, decision);
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('Experiment Exposed', {
      experiment_key: ONBOARDING_PAYWALL_FLAG,
      experiment_variant: variant,
      experiment_surface: 'onboarding',
    });
  }
);
