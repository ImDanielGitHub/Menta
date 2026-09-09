import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from '@/app/onboarding';
import {
  loadOnboardingDraftForUser,
  saveOnboardingDraft,
} from '@/lib/onboarding-draft';
import { resolvePhoneLayout } from '@/constants/phone-layout';

const mockReplace = jest.fn();
const mockUpdateUserPreferences = jest.fn().mockResolvedValue(undefined);
const mockGetMyLegalAcceptanceStatus = jest.fn();
const mockGetCurrentLegalDocuments = jest.fn();
let mockRouteResume: 'legal-accepted' | 'legal-declined' = 'legal-accepted';
let mockUserId = 'legal-user';
const mockPhoneLayout = resolvePhoneLayout({
  width: 390,
  height: 844,
  fontScale: 1,
});
const currentLegalDocuments = {
  terms: {
    version: '2026-08-01',
    url: 'https://menta.quest/terms',
    effectiveAt: '2026-08-01T00:00:00.000Z',
  },
  privacy: {
    version: '2026-08-01',
    url: 'https://menta.quest/privacy',
    effectiveAt: '2026-08-01T00:00:00.000Z',
  },
  community_standards: {
    version: '2026-08-01',
    url: 'https://menta.quest/community-standards',
    effectiveAt: '2026-08-01T00:00:00.000Z',
  },
};

jest.mock('expo-font', () => ({ useFonts: () => [true] }));
jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ resume: mockRouteResume }),
  usePathname: () => '/onboarding',
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
}));
jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View);
  return {
    AlertCircleIcon: Icon,
    AlertTriangleIcon: Icon,
    AppleIcon: Icon,
    CameraIcon: Icon,
    CheckCircleIcon: Icon,
    CheckIcon: Icon,
    ChevronRightIcon: Icon,
    ExternalLinkIcon: Icon,
    FileTextIcon: Icon,
    InfoIcon: Icon,
    MailIcon: Icon,
    ShieldIcon: Icon,
    UsersIcon: Icon,
    VideoIcon: Icon,
  };
});
jest.mock('@/components/ui/google-glyph', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { GoogleGlyph: () => React.createElement(View) };
});
jest.mock('@/lib/legal-acceptance', () => ({
  buildOnboardingLegalAcceptanceRoute: () => ({
    pathname: '/legal-acceptance',
    params: { surface: 'post_auth' },
  }),
  getMyLegalAcceptanceStatus: (...args: unknown[]) =>
    mockGetMyLegalAcceptanceStatus(...args),
  getCurrentLegalDocuments: (...args: unknown[]) =>
    mockGetCurrentLegalDocuments(...args),
  isLegalAcceptanceRequiredError: () => false,
}));
jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    updateUserPreferences: (...args: unknown[]) =>
      mockUpdateUserPreferences(...args),
  },
}));
jest.mock('@/store/auth-store', () => {
  const state = {
    completeOnboarding: jest.fn(),
    hasCompletedOnboarding: false,
    get isAuthenticated() {
      return true;
    },
    get user() {
      return { id: mockUserId };
    },
    signInWithApple: jest.fn(),
    signInWithGoogle: jest.fn(),
  };
  const useAuthStore = () => ({ ...state, user: { id: mockUserId } });
  useAuthStore.getState = () => state;
  return { useAuthStore };
});
jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: (selector: (state: unknown) => unknown) =>
    selector({ createFirstPromiseWithPayment: jest.fn() }),
}));
jest.mock('@/store/referral-store', () => {
  const state = {
    processReferral: jest.fn(),
    setPendingReferral: jest.fn(),
    clearPendingReferral: jest.fn(),
    cancelPendingReferral: jest.fn(),
    pendingReferral: null,
    lastProcessResult: null,
  };
  const useReferralStore = (selector: (value: typeof state) => unknown) =>
    selector(state);
  useReferralStore.getState = () => state;
  return { useReferralStore };
});
jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
jest.mock('@/store/invite-store', () => ({
  useInviteStore: Object.assign(
    (selector: (state: { pending: null }) => unknown) =>
      selector({ pending: null }),
    {
      getState: () => ({ peekPendingNavigationForUser: () => null }),
    }
  ),
}));
jest.mock('@/store/protected-route-store', () => ({
  useProtectedRouteStore: {
    getState: () => ({ peekPendingRouteForUser: () => null }),
  },
}));
jest.mock('@/lib/navigation/onboarding-completion', () => ({
  ...jest.requireActual('@/lib/navigation/onboarding-completion'),
  useOnboardingCompletionStore: {
    getState: () => ({ queueCompletion: () => true }),
  },
}));

const persistLegalHandoff = async (userId: string) => {
  await saveOnboardingDraft(
    {
      promise: 'Walk after work',
      proofType: 'photo',
      durationDays: 30,
      marketingOptIn: true,
    },
    null,
    'auth_method'
  );
  const claimed = await loadOnboardingDraftForUser({
    userId,
    hasCompletedOnboarding: false,
  });
  await saveOnboardingDraft(claimed!, userId, 'legal_acceptance');
};

const renderOnboarding = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <OnboardingScreen />
    </SafeAreaProvider>
  );

describe('onboarding legal storage round-trip', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockUserId = 'legal-user';
    mockRouteResume = 'legal-accepted';
    mockGetCurrentLegalDocuments.mockResolvedValue(currentLegalDocuments);
  });

  it('consumes the real persisted marker only after a current accepted return', async () => {
    await persistLegalHandoff(mockUserId);
    mockGetMyLegalAcceptanceStatus.mockResolvedValue({
      userId: mockUserId,
      accepted: true,
      requiresAcceptance: false,
    });

    const screen = renderOnboarding();
    expect(await screen.findByText('Save your promise')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-confirmation'));
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-continue'));
    expect(screen.getByTestId('onboarding-auth-referral-expand')).toBeTruthy();
    await expect(
      loadOnboardingDraftForUser({
        userId: mockUserId,
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({ resumeStep: null, durationDays: 30 });
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ marketing_email_opt_in: true })
    );
  });

  it('preserves the real persisted marker after a declined return', async () => {
    mockRouteResume = 'legal-declined';
    await persistLegalHandoff(mockUserId);

    const screen = renderOnboarding();
    expect(await screen.findByText('Save your promise')).toBeTruthy();
    expect(screen.getByText('Legal review was not completed.')).toBeTruthy();
    await expect(
      loadOnboardingDraftForUser({
        userId: mockUserId,
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({ resumeStep: 'legal_acceptance' });
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });

  it('does not write a hidden marketing preference when no prior opt-in exists', async () => {
    await saveOnboardingDraft(
      {
        promise: 'Walk after work',
        proofType: 'photo',
        durationDays: 14,
        accountabilityChoice: 'just_me',
        marketingOptIn: false,
      },
      mockUserId,
      'legal_acceptance'
    );
    mockGetMyLegalAcceptanceStatus.mockResolvedValue({
      userId: mockUserId,
      accepted: true,
      requiresAcceptance: false,
    });

    const screen = renderOnboarding();

    expect(await screen.findByText('Save your promise')).toBeTruthy();
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });
});
