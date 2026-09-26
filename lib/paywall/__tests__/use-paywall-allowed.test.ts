import { renderHook } from '@testing-library/react-native';
import { usePaywallAllowed } from '../use-paywall-allowed';

let mockPath = '/profile';
let mockCompleted = true;
let mockOwner: string | null = 'member-a';
let mockHydrated = true;
let mockPending: {
  ownerUserId: string;
  firstPromiseId: string;
  accountabilityChoice: 'new_group';
  timestamp: number;
} | null = null;

jest.mock('expo-router', () => ({ usePathname: () => mockPath }));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({
      user: mockOwner ? { id: mockOwner } : null,
      hasCompletedOnboarding: mockCompleted,
    }),
}));
jest.mock('@/lib/navigation/onboarding-completion', () => ({
  ...jest.requireActual('@/lib/navigation/onboarding-completion'),
  useOnboardingCompletionStore: (select: (state: unknown) => unknown) =>
    select({ pending: mockPending }),
}));
jest.mock('@/lib/navigation/onboarding-invitation-lifecycle', () => ({
  hydrateOnboardingInvitationLifecycle: () => Promise.resolve(),
  useOnboardingInvitationLifecycleStore: (
    select: (state: unknown) => unknown
  ) =>
    select({
      hydrated: mockHydrated,
      blockedOwners: {},
      entries: { 'member-a': { status: 'pending' } },
    }),
}));

beforeEach(() => {
  mockPath = '/profile';
  mockCompleted = true;
  mockOwner = 'member-a';
  mockHydrated = true;
  mockPending = null;
});

it('allows explicit Pro management in You after leaving an unfinished invitation', () => {
  expect(renderHook(usePaywallAllowed).result.current).toBe(true);
});

it('allows only the assigned current account to open the pre-activation onboarding gate', () => {
  mockPath = '/onboarding';
  mockCompleted = false;
  expect(renderHook(() => usePaywallAllowed('member-a')).result.current).toBe(
    true
  );
  expect(renderHook(() => usePaywallAllowed('member-b')).result.current).toBe(
    false
  );
  expect(renderHook(() => usePaywallAllowed()).result.current).toBe(false);
  mockCompleted = true;
  expect(renderHook(() => usePaywallAllowed('member-a')).result.current).toBe(
    false
  );
});

it.each([
  '/onboarding',
  '/onboarding-again',
  '/auth/callback',
  '/shop',
  '/promise-accountability',
])('keeps the unfinished invitation exclusion on %s', pathname => {
  mockPath = pathname;
  expect(renderHook(usePaywallAllowed).result.current).toBe(false);
});

it('holds Pro while a fresh invitation handoff is about to navigate', () => {
  mockPending = {
    ownerUserId: 'member-a',
    firstPromiseId: 'promise-a',
    accountabilityChoice: 'new_group',
    timestamp: Date.now(),
  };
  expect(renderHook(usePaywallAllowed).result.current).toBe(false);
});

it('does not let an expired handoff permanently hide membership management', () => {
  mockPending = {
    ownerUserId: 'member-a',
    firstPromiseId: 'promise-a',
    accountabilityChoice: 'new_group',
    timestamp: Date.now() - 8 * 86400000,
  };
  expect(renderHook(usePaywallAllowed).result.current).toBe(true);
});

it('requires completed setup and a current account for explicit Pro access', () => {
  mockCompleted = false;
  expect(renderHook(usePaywallAllowed).result.current).toBe(false);
  mockCompleted = true;
  mockOwner = null;
  expect(renderHook(usePaywallAllowed).result.current).toBe(false);
});
