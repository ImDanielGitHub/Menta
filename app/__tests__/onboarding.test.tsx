import React from 'react';
import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import OnboardingScreen from '@/app/onboarding';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { resolvePhoneLayout } from '@/constants/phone-layout';
import { supabase } from '@/lib/supabase';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockCompleteOnboarding = jest.fn();
const mockProcessReferral = jest.fn();
const mockSetPendingReferral = jest.fn();
const mockClearPendingReferral = jest.fn();
const mockCancelPendingReferral = jest.fn();
const mockCreateFirstPromiseWithPayment = jest.fn();
const mockQueueCompletion = jest.fn().mockReturnValue(true);
const mockActivationStatusRpc = jest.fn();
const mockGetMyLegalAcceptanceStatus = jest.fn();
const mockGetCurrentLegalDocuments = jest.fn();
const mockAcceptCurrentLegalDocuments = jest.fn();
const mockUpdateUserPreferences = jest.fn().mockResolvedValue(undefined);
const mockRequestNotificationPermissions = jest.fn().mockResolvedValue(true);
const mockSyncPushRegistrationForUser = jest.fn().mockResolvedValue(true);
const mockClearOnboardingDraft = jest.fn().mockResolvedValue(undefined);
const mockSaveOnboardingDraft = jest.fn().mockResolvedValue(undefined);
const mockLoadOnboardingDraftForUser = jest.fn().mockResolvedValue(null);
const mockSignInWithApple = jest.fn().mockResolvedValue(undefined);
const mockSignInWithGoogle = jest.fn().mockResolvedValue(undefined);
const mockEmitConfirmedOutcome = jest.fn();
let mockAuthUser: { id: string } | null = null;
let mockHasCompletedOnboarding = false;
let mockPendingReferral: {
  referralCode: string;
  ownerUserId?: string | null;
} | null = null;
let mockLastProcessResult: unknown = null;
let mockRouteParams: { resume?: string } = {};
const longPromiseFixture =
  'Walk after work every weekday. Take a longer route home. Leave my phone in my bag. Notice how my body feels. Write one honest line before I head inside daily.';
const fixedActionContentClearance =
  mentaLayout.primaryControlHeight + mentaSpacing[4] + mentaSpacing[2];
let mockPhoneLayout = resolvePhoneLayout({
  width: 430,
  height: 932,
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
const currentLegalVersionTuple = {
  terms: '2026-08-01',
  privacy: '2026-08-01',
  communityStandards: '2026-08-01',
};

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: (source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  }),
  emitConfirmedOutcome: (...args: unknown[]) =>
    mockEmitConfirmedOutcome(...args),
  emitHaptic: jest.fn(),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View);

  return {
    AlertCircleIcon: Icon,
    AlertTriangleIcon: Icon,
    AppleIcon: Icon,
    ArrowLeftIcon: Icon,
    BellIcon: Icon,
    CameraIcon: Icon,
    CheckCircleIcon: Icon,
    CheckIcon: Icon,
    ChevronRightIcon: Icon,
    ExternalLinkIcon: Icon,
    FileTextIcon: Icon,
    InfoIcon: Icon,
    LockIcon: Icon,
    MailIcon: Icon,
    ShieldIcon: Icon,
    ShieldCheckIcon: Icon,
    UsersIcon: Icon,
    VideoIcon: Icon,
  };
});

jest.mock('@/components/ui/google-glyph', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { GoogleGlyph: () => React.createElement(View) };
});

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockRouteParams,
  usePathname: () => '/onboarding',
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/lib/legal-acceptance', () => ({
  buildOnboardingLegalAcceptanceRoute: () => ({
    pathname: '/legal-acceptance',
    params: {
      surface: 'post_auth',
      next: '/onboarding?resume=legal-accepted',
      back: '/onboarding?resume=legal-declined',
    },
  }),
  acceptCurrentLegalDocuments: (...args: unknown[]) =>
    mockAcceptCurrentLegalDocuments(...args),
  getMyLegalAcceptanceStatus: (...args: unknown[]) =>
    mockGetMyLegalAcceptanceStatus(...args),
  getCurrentLegalDocuments: (...args: unknown[]) =>
    mockGetCurrentLegalDocuments(...args),
  isLegalAcceptanceRequiredError: (error: unknown) =>
    Boolean(
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'LEGAL_ACCEPTANCE_REQUIRED'
    ),
}));

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    updateUserPreferences: (...args: unknown[]) =>
      mockUpdateUserPreferences(...args),
    requestPermissions: (...args: unknown[]) =>
      mockRequestNotificationPermissions(...args),
    syncPushRegistrationForUser: (...args: unknown[]) =>
      mockSyncPushRegistrationForUser(...args),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: (() => {
    const client = {
      rpc(this: unknown, ...args: unknown[]) {
        if (this !== client) {
          throw new TypeError('Supabase RPC lost its client context');
        }
        return mockActivationStatusRpc.apply(this, args);
      },
    };
    return client;
  })(),
}));

jest.mock('@/lib/onboarding-draft', () => ({
  ...jest.requireActual('@/lib/onboarding-draft'),
  clearOnboardingDraft: (...args: unknown[]) =>
    mockClearOnboardingDraft(...args),
  loadOnboardingDraftForUser: (...args: unknown[]) =>
    mockLoadOnboardingDraftForUser(...args),
  saveOnboardingDraft: (...args: unknown[]) => mockSaveOnboardingDraft(...args),
}));

jest.mock('@/lib/paywall/revenuecat', () => ({
  RevenueCatAPI: {
    isPro: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: (
    selector: (state: {
      createFirstPromiseWithPayment: typeof mockCreateFirstPromiseWithPayment;
    }) => unknown
  ) =>
    selector({
      createFirstPromiseWithPayment: mockCreateFirstPromiseWithPayment,
    }),
}));

jest.mock('@/lib/navigation/onboarding-completion', () => ({
  ...jest.requireActual('@/lib/navigation/onboarding-completion'),
  useOnboardingCompletionStore: {
    getState: () => ({ queueCompletion: mockQueueCompletion }),
  },
}));

jest.mock('@/store/auth-store', () => {
  const state = {
    completeOnboarding: mockCompleteOnboarding,
    get hasCompletedOnboarding() {
      return mockHasCompletedOnboarding;
    },
    get isAuthenticated() {
      return mockAuthUser !== null;
    },
    signInWithApple: (...args: unknown[]) => mockSignInWithApple(...args),
    signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
    get user() {
      return mockAuthUser;
    },
  };
  const useAuthStore = () => ({
    ...state,
    completeOnboarding: mockCompleteOnboarding,
    hasCompletedOnboarding: mockHasCompletedOnboarding,
    isAuthenticated: mockAuthUser !== null,
    user: mockAuthUser,
  });
  useAuthStore.getState = () => state;
  return { useAuthStore };
});

jest.mock('@/store/referral-store', () => {
  const state = {
    processReferral: mockProcessReferral,
    setPendingReferral: mockSetPendingReferral,
    clearPendingReferral: mockClearPendingReferral,
    cancelPendingReferral: mockCancelPendingReferral,
    get pendingReferral() {
      return mockPendingReferral;
    },
    get lastProcessResult() {
      return mockLastProcessResult;
    },
  };
  const useReferralStore = (
    selector: (state: {
      processReferral: typeof mockProcessReferral;
      setPendingReferral: typeof mockSetPendingReferral;
      clearPendingReferral: typeof mockClearPendingReferral;
      cancelPendingReferral: typeof mockCancelPendingReferral;
      pendingReferral: {
        referralCode: string;
        ownerUserId?: string | null;
      } | null;
      lastProcessResult: unknown;
    }) => unknown
  ) =>
    selector({
      ...state,
      processReferral: mockProcessReferral,
      setPendingReferral: mockSetPendingReferral,
      clearPendingReferral: mockClearPendingReferral,
      cancelPendingReferral: mockCancelPendingReferral,
      pendingReferral: mockPendingReferral,
      lastProcessResult: mockLastProcessResult,
    });
  useReferralStore.getState = () => state;
  return { useReferralStore };
});

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

describe('Paper onboarding flow', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'isPad', {
      configurable: true,
      value: false,
    });
    jest.clearAllMocks();
    // `clearAllMocks` keeps queued `mock*Once` implementations. A test that
    // exits before consuming one must not leak that server result into the
    // next onboarding journey.
    mockActivationStatusRpc.mockReset();
    mockCancelPendingReferral.mockReset();
    mockSaveOnboardingDraft.mockReset();
    mockLoadOnboardingDraftForUser.mockReset();
    mockSignInWithGoogle.mockReset();
    mockSignInWithApple.mockReset();
    mockAuthUser = null;
    mockHasCompletedOnboarding = false;
    mockPendingReferral = null;
    mockLastProcessResult = null;
    mockRouteParams = {};
    mockPhoneLayout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 1,
    });
    mockLoadOnboardingDraftForUser.mockResolvedValue(null);
    mockClearOnboardingDraft.mockResolvedValue(undefined);
    mockSaveOnboardingDraft.mockResolvedValue(undefined);
    mockUpdateUserPreferences.mockResolvedValue(undefined);
    mockCreateFirstPromiseWithPayment.mockReset();
    mockQueueCompletion.mockReturnValue(true);
    mockActivationStatusRpc.mockResolvedValue({
      data: { confirmed: false, referral: null },
      error: null,
    });
    mockGetMyLegalAcceptanceStatus.mockResolvedValue({
      userId: 'new-user',
      accepted: true,
      requiresAcceptance: false,
    });
    mockGetCurrentLegalDocuments.mockImplementation(() => ({
      then: (resolve: (documents: typeof currentLegalDocuments) => void) => {
        resolve(currentLegalDocuments);
        return { catch: () => undefined };
      },
    }));
    mockAcceptCurrentLegalDocuments.mockResolvedValue({
      userId: 'new-user',
      accepted: true,
      requiresAcceptance: false,
    });
    mockSetPendingReferral.mockImplementation(
      (code: string, ownerUserId?: string | null) => {
        mockPendingReferral = { referralCode: code, ownerUserId };
      }
    );
    mockClearPendingReferral.mockImplementation(() => {
      mockPendingReferral = null;
    });
    mockCancelPendingReferral.mockImplementation(async () => {
      mockPendingReferral = null;
      return true;
    });
    mockProcessReferral.mockImplementation(async () => {
      mockLastProcessResult = {
        accepted: false,
        outcome: 'pending_activation',
        referralCode: mockPendingReferral?.referralCode ?? null,
        status: 'pending',
        inviterRewardAmount: 0,
        referredRewardAmount: 0,
      };
      return false;
    });
    mockSignInWithApple.mockResolvedValue(undefined);
    mockSignInWithGoogle.mockResolvedValue(undefined);
  });

  const reachAuthMethod = (
    screen: ReturnType<typeof render>,
    promise = 'Walk for 20 minutes after work',
    continuePastMomentaGift = true,
    _continuePastLegal = true,
    confirmLegal = true
  ) => {
    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      promise
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    if (
      continuePastMomentaGift &&
      screen.queryByTestId('onboarding-momenta-gift-continue')
    ) {
      fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    }
    if (screen.queryByTestId('notification-privacy-education-not-now')) {
      fireEvent.press(
        screen.getByTestId('notification-privacy-education-not-now')
      );
    }
    if (screen.queryByTestId('onboarding-auth-legal-confirmation')) {
      if (confirmLegal) {
        fireEvent.press(
          screen.getByTestId('onboarding-auth-legal-confirmation')
        );
        fireEvent.press(screen.getByTestId('onboarding-auth-legal-continue'));
      }
    }
  };

  const createFromCombinedAuth = (
    screen: ReturnType<typeof render>,
    referralCode?: string
  ) => {
    if (
      screen.getByTestId('onboarding-auth-legal-confirmation').props
        .accessibilityState.checked !== true
    ) {
      fireEvent.press(screen.getByTestId('onboarding-auth-legal-confirmation'));
      fireEvent.press(screen.getByTestId('onboarding-auth-legal-continue'));
    }
    if (referralCode) {
      if (!screen.queryByTestId('onboarding-auth-referral-code')) {
        fireEvent.press(screen.getByTestId('onboarding-auth-referral-expand'));
      }
      fireEvent.changeText(
        screen.getByTestId('onboarding-auth-referral-code'),
        referralCode
      );
    }
    fireEvent.press(screen.getByTestId('onboarding-auth-create-promise'));
  };

  it('makes the first-promise Momenta gift explicit before creation', () => {
    mockAuthUser = { id: 'copy-user' };
    const screen = render(<OnboardingScreen />);

    expect(screen.queryByText(/Your first promise is free/)).toBeNull();

    reachAuthMethod(screen, undefined, false);
    expect(screen.getByText(/Your first promise is free/)).toBeTruthy();
    expect(screen.getByTestId('onboarding-momenta-gift')).toBeTruthy();
    expect(screen.getByTestId('onboarding-momenta-gift-mascot')).toBeTruthy();
    expect(screen.getByTestId('onboarding-momenta-gift-ledger')).toBeTruthy();
    expect(screen.getByText('First promise')).toBeTruthy();
    expect(screen.getByText('+100 Momenta')).toBeTruthy();
    expect(screen.getByTestId('onboarding-header-back')).toBeTruthy();
    expect(screen.queryByText('Normal cost')).toBeNull();
    expect(screen.queryByText('Menta covers')).toBeNull();
    expect(screen.queryByText(/70 Momenta/)).toBeNull();

    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    expect(screen.getByText('Save your promise')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-confirmation'));
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-continue'));
    expect(screen.getByTestId('onboarding-auth-referral-expand')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-auth-referral-code')).toBeNull();
    expect(screen.getByTestId('onboarding-auth-create-promise')).toBeTruthy();
  });

  it('starts the promise draft instead of adding another explainer screen', () => {
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));

    expect(screen.getByTestId('onboarding-promise-input')).toBeTruthy();
    expect(screen.getByTestId('onboarding-journey-progress')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-proof-standard-guide')).toBeNull();
  });

  it('keeps the promise limit visible from empty through the 160-character boundary', () => {
    expect(longPromiseFixture).toHaveLength(158);
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    const input = screen.getByTestId('onboarding-promise-input');
    expect(screen.queryByText('0 / 160')).toBeNull();
    expect(input.props.maxLength).toBe(160);

    fireEvent.changeText(input, 'Walk for 20 minutes after work');
    expect(screen.getByText('30 / 160')).toBeTruthy();

    fireEvent.changeText(input, longPromiseFixture);
    expect(screen.getByText('158 / 160')).toBeTruthy();
    expect(screen.getByTestId('onboarding-promise-input').props.value).toBe(
      longPromiseFixture
    );

    const maximumPromise = 'x'.repeat(160);
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      maximumPromise
    );
    expect(screen.getByText('160 / 160')).toBeTruthy();
    expect(screen.getByTestId('onboarding-promise-input').props.maxLength).toBe(
      160
    );
  });

  it('uses a full iPad workspace for promise and proof setup', () => {
    Object.defineProperty(Platform, 'isPad', {
      configurable: true,
      value: true,
    });
    mockPhoneLayout = resolvePhoneLayout({
      width: 1024,
      height: 1366,
      fontScale: 1,
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));

    expect(screen.getByTestId('onboarding-draft-ipad-workspace')).toHaveStyle({
      flexDirection: 'row',
      width: '100%',
    });
    expect(screen.getByTestId('onboarding-draft-ipad-rail')).toBeTruthy();
    expect(screen.getByTestId('onboarding-draft-ipad-form')).toHaveStyle({
      flex: 1,
      minHeight: 500,
    });
    expect(
      StyleSheet.flatten(
        screen.getByTestId('onboarding-draft-body').props.contentContainerStyle
      ).paddingHorizontal
    ).toBe(32);

    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));

    expect(screen.getByTestId('onboarding-proof-ipad-workspace')).toHaveStyle({
      flexDirection: 'row',
      width: '100%',
    });
    expect(screen.getByTestId('onboarding-proof-ipad-rail')).toBeTruthy();
    expect(screen.getByTestId('onboarding-proof-ipad-selections')).toHaveStyle({
      flex: 1,
      minWidth: 0,
    });
    expect(screen.getByTestId('onboarding-proof-ipad-summary')).toBeTruthy();
    expect(screen.getByText('Walk for 20 minutes after work')).toBeTruthy();

    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));

    expect(screen.getAllByText('Photo proof').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Invite someone')).toHaveLength(2);
  });

  it('keeps narrow iPad and Split View widths on the phone composition', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 820,
      height: 1180,
      fontScale: 1,
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));

    expect(screen.queryByTestId('onboarding-draft-ipad-workspace')).toBeNull();
    expect(
      StyleSheet.flatten(
        screen.getByTestId('onboarding-draft-body').props.contentContainerStyle
      ).paddingHorizontal
    ).toBe(24);
  });

  it('keeps long entry and terminal setup content scrollable above fixed actions', async () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 1,
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    const input = screen.getByTestId('onboarding-promise-input');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, longPromiseFixture);

    const draftBody = screen.getByTestId('onboarding-draft-body');
    expect(screen.getByText('158 / 160')).toBeTruthy();
    expect(StyleSheet.flatten(draftBody.props.style)).toMatchObject({
      flex: 1,
    });
    expect(
      StyleSheet.flatten(draftBody.props.contentContainerStyle).paddingBottom
    ).toBe(fixedActionContentClearance);
    expect(draftBody.props.keyboardDismissMode).toBe('interactive');
    expect(draftBody.props.scrollIndicatorInsets).toEqual({
      bottom: fixedActionContentClearance,
    });
    expect(draftBody.props.showsVerticalScrollIndicator).toBe(false);
    expect(
      screen.queryByTestId('onboarding-draft-overflow-indicator')
    ).toBeNull();
    act(() => {
      draftBody.props.onLayout({
        nativeEvent: { layout: { height: 500 } },
      });
      draftBody.props.onContentSizeChange(390, 760);
    });
    expect(
      await screen.findByTestId('onboarding-draft-overflow-indicator')
    ).toBeTruthy();

    await waitFor(() =>
      expect(mockSaveOnboardingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ promise: longPromiseFixture }),
        null
      )
    );

    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    const proofBody = screen.getByTestId('onboarding-proof-body');
    expect(screen.getByText(/For “Walk after work every weekday/)).toBeTruthy();
    expect(
      StyleSheet.flatten(proofBody.props.contentContainerStyle).paddingBottom
    ).toBe(fixedActionContentClearance);
    expect(proofBody.props.scrollIndicatorInsets).toEqual({
      bottom: fixedActionContentClearance,
    });
    expect(proofBody.props.showsVerticalScrollIndicator).toBe(false);
    act(() => {
      proofBody.props.onLayout({
        nativeEvent: { layout: { height: 500 } },
      });
      proofBody.props.onContentSizeChange(390, 900);
    });
    expect(
      await screen.findByTestId('onboarding-proof-overflow-indicator')
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-proof-note'));
    expect(screen.getByTestId('onboarding-accountability-just_me')).toHaveProp(
      'accessibilityRole',
      'radio'
    );
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));

    const durationBody = screen.getByTestId('onboarding-duration-body');
    expect(durationBody).not.toBe(proofBody);
    expect(screen.getByTestId('onboarding-duration-7')).toBeTruthy();
    expect(screen.getByTestId('onboarding-duration-14')).toBeTruthy();
    expect(screen.getByTestId('onboarding-duration-30')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta confirms your first deadline when the promise is created.'
      )
    ).toBeTruthy();
    act(() => {
      durationBody.props.onLayout({
        nativeEvent: { layout: { height: 500 } },
      });
      durationBody.props.onContentSizeChange(390, 820);
    });
    expect(
      await screen.findByTestId('onboarding-duration-overflow-indicator')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    const previewBody = screen.getByTestId('onboarding-preview-body');
    expect(screen.getByText('Review your promise')).toBeTruthy();
    expect(screen.getByText('Invite someone')).toBeTruthy();
    expect(StyleSheet.flatten(previewBody.props.style)).toMatchObject({
      flex: 1,
    });
    expect(screen.getByTestId('onboarding-preview-footer')).toBeTruthy();
  });

  it('reveals an overflowing Draft after its field receives focus', () => {
    const scrollTo = jest
      .spyOn(ScrollView.prototype, 'scrollTo')
      .mockImplementation(() => undefined);
    const requestFrame = jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation(callback => {
        callback(0);
        return 1;
      });
    const screen = render(<OnboardingScreen />);
    fireEvent.press(screen.getByTestId('onboarding-start'));
    const draftBody = screen.getByTestId('onboarding-draft-body');
    const promiseField = screen.getByTestId('onboarding-promise-field');

    act(() => {
      promiseField.props.onLayout({
        nativeEvent: {
          layout: { height: 280, width: 354, x: 0, y: 290 },
        },
      });
      draftBody.props.onLayout({
        nativeEvent: { layout: { height: 420 } },
      });
      draftBody.props.onContentSizeChange(390, 900);
    });
    requestFrame.mockClear();
    fireEvent(screen.getByTestId('onboarding-promise-input'), 'focus');

    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ animated: true, y: 162 });
    requestFrame.mockRestore();
    scrollTo.mockRestore();
  });

  it('uses the purpose-built welcome mascot image', () => {
    const screen = render(<OnboardingScreen />);

    expect(screen.getByTestId('onboarding-promise-guide')).toHaveProp(
      'accessibilityLabel',
      'Menta mascot holding your first promise'
    );
    expect(screen.queryByTestId('menta-mascot-sheet-guide')).toBeNull();
  });

  it('keeps the active draft mounted across Dynamic Type changes', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 1,
    });
    const screen = render(<OnboardingScreen />);
    const welcomeRoot = screen.getByTestId('onboarding-screen-root');

    fireEvent.press(screen.getByTestId('onboarding-start'));
    const draftRoot = screen.getByTestId('onboarding-screen-root');
    expect(draftRoot).not.toBe(welcomeRoot);
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk after dinner tonight'
    );

    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 2.35,
    });
    screen.rerender(<OnboardingScreen />);
    expect(screen.getByTestId('onboarding-screen-root')).toBe(draftRoot);
    expect(screen.getByTestId('onboarding-promise-input')).toHaveProp(
      'value',
      'Walk after dinner tonight'
    );
    expect(screen.getByText('What’s one thing you want to do?')).toHaveStyle({
      fontSize: 39,
      lineHeight: 45.5,
    });
  });

  it('measures every onboarding step with the large-phone text envelope', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 430,
      height: 932,
      fontScale: 2.35,
    });
    const screen = render(<OnboardingScreen />);

    const expectScaledHeading = (copy: string) => {
      expect(screen.getByText(copy)).toHaveProp('allowFontScaling', false);
      const style = StyleSheet.flatten(screen.getByText(copy).props.style);
      expect(style.fontSize).toBeGreaterThanOrEqual(42);
      expect(style.lineHeight).toBeGreaterThanOrEqual(49);
    };

    const welcomeTitle = screen.getByText(
      'Keep the promises you make to yourself.'
    );
    expect(welcomeTitle).toHaveProp('allowFontScaling', false);
    expect(welcomeTitle).toHaveStyle({ fontSize: 43.4, lineHeight: 51.8 });

    fireEvent.press(screen.getByTestId('onboarding-start'));
    expectScaledHeading('What’s one thing you want to do?');
    expect(screen.getByTestId('onboarding-promise-input')).toHaveProp(
      'allowFontScaling',
      false
    );
    expect(screen.getByTestId('onboarding-promise-input')).toHaveStyle({
      fontSize: 40.6,
      lineHeight: 49,
    });
    expect(
      screen.getByTestId('onboarding-draft-body').props
        .automaticallyAdjustKeyboardInsets
    ).toBe(true);
    expect(screen.getByTestId('onboarding-header-back')).toBeTruthy();
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    expectScaledHeading('How will you show you did it?');
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    expectScaledHeading('How long do you want to keep this promise?');
    expect(
      screen.getByText('Choose a length you can genuinely follow through on.')
    ).toHaveStyle({ fontSize: 21, lineHeight: 32.2 });
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    expectScaledHeading('Review your promise');
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    expect(screen.getByTestId('onboarding-momenta-gift-title')).toHaveStyle({
      fontSize: 58.8,
      lineHeight: 64.4,
    });
    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    fireEvent.press(
      screen.getByTestId('notification-privacy-education-not-now')
    );
    expectScaledHeading('Save your promise');
    expect(
      screen.getByTestId('onboarding-auth-legal-confirmation')
    ).toBeTruthy();
  });

  it.each([
    {
      width: 320,
      height: 568,
      fontScale: 1,
      inset: 20,
      welcomeMascot: 233,
      giftMascot: 152,
    },
    {
      width: 390,
      height: 844,
      fontScale: 1,
      inset: 24,
      welcomeMascot: 437,
      giftMascot: 176,
    },
    {
      width: 430,
      height: 932,
      fontScale: 1,
      inset: 24,
      welcomeMascot: 482,
      giftMascot: 192,
    },
    {
      width: 390,
      height: 844,
      fontScale: 1.3,
      inset: 24,
      welcomeMascot: 437,
      giftMascot: 176,
    },
    {
      width: 430,
      height: 932,
      fontScale: 2.35,
      inset: 24,
      welcomeMascot: 482,
      giftMascot: 192,
    },
  ])(
    'keeps onboarding readable at $width×$height and font scale $fontScale',
    frame => {
      mockPhoneLayout = resolvePhoneLayout(frame);
      const scaledType = (value: number) =>
        Math.round(value * mockPhoneLayout.textScale * 10) / 10;
      const screen = render(<OnboardingScreen />);
      expect(screen.getByTestId('onboarding-welcome-body')).toHaveStyle({
        paddingHorizontal: frame.inset,
      });
      expect(screen.getByTestId('onboarding-promise-guide')).toHaveStyle({
        height: frame.welcomeMascot,
        width: frame.welcomeMascot,
      });

      fireEvent.press(screen.getByTestId('onboarding-start'));
      expect(
        StyleSheet.flatten(
          screen.getByTestId('onboarding-draft-body').props
            .contentContainerStyle
        ).paddingHorizontal
      ).toBe(frame.inset);
      fireEvent.changeText(
        screen.getByTestId('onboarding-promise-input'),
        'Walk for 20 minutes after work'
      );
      fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
      expect(
        StyleSheet.flatten(
          screen.getByTestId('onboarding-proof-body').props
            .contentContainerStyle
        ).paddingHorizontal
      ).toBe(frame.inset);
      fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
      expect(
        screen.getByTestId('onboarding-accountability-just_me')
      ).toBeTruthy();
      expect(
        screen.getByTestId('onboarding-accountability-new_group')
      ).toBeTruthy();
      fireEvent.press(
        screen.getByTestId('onboarding-accountability-new_group')
      );
      expect(
        screen.getByTestId('onboarding-accountability-new_group').props
          .accessibilityState
      ).toMatchObject({ checked: true, selected: true });
      expect(screen.getByTestId('onboarding-proof-footer')).toBeTruthy();
      fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
      expect(
        StyleSheet.flatten(
          screen.getByTestId('onboarding-duration-body').props
            .contentContainerStyle
        ).paddingHorizontal
      ).toBe(frame.inset);
      expect(screen.getByText('Every day')).toBeTruthy();
      if (frame.fontScale > 1) {
        expect(
          StyleSheet.flatten(
            screen.getByText(
              'Choose a length you can genuinely follow through on.'
            ).props.style
          ).lineHeight
        ).toBeGreaterThan(mentaTypography.bodySmall.lineHeight);
      }
      fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
      expect(screen.getByTestId('onboarding-preview-body')).toBeTruthy();
      fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
      expect(screen.getByTestId('onboarding-momenta-gift-mascot')).toHaveStyle({
        height: frame.giftMascot,
        width: frame.giftMascot,
      });
      const giftBody = screen.getByTestId('onboarding-momenta-gift');
      fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
      fireEvent.press(
        screen.getByTestId('notification-privacy-education-not-now')
      );
      const authBody = screen.getByTestId('onboarding-auth-body');
      expect(authBody).not.toBe(giftBody);
      expect(
        StyleSheet.flatten(authBody.props.contentContainerStyle)
          .paddingHorizontal
      ).toBe(frame.inset);
      expect(authBody).toHaveStyle({ flex: 1 });
      expect(screen.getByText('Read the current terms.')).toBeTruthy();
      expect(
        screen.getByText('Rules for promises, proof and groups.')
      ).toBeTruthy();
      expect(
        screen.getByText('How Menta handles your information.')
      ).toBeTruthy();
      expect(screen.queryByTestId('onboarding-marketing-opt-in')).toBeNull();
      expect(screen.getByTestId('onboarding-header-back')).toHaveStyle({
        minHeight: mentaLayout.minimumTouchTarget,
      });
      if (frame.fontScale > 1) {
        expect(screen.getByText('Save your promise')).toHaveProp(
          'allowFontScaling',
          false
        );
        expect(screen.getByText('Save your promise')).toHaveStyle({
          fontSize: scaledType(mentaTypography.heading.fontSize),
          lineHeight: scaledType(mentaTypography.heading.lineHeight),
        });
        expect(
          screen.getByText(
            'Choose how you want to continue. Your draft stays on this phone.'
          )
        ).toHaveStyle({
          fontSize: scaledType(mentaTypography.bodySmall.fontSize),
          lineHeight: scaledType(
            mentaTypography.bodySmall.lineHeight +
              mockPhoneLayout.bodyLineHeightBoost
          ),
        });
        expect(screen.getByText('Read the current terms.')).toHaveStyle({
          fontSize: scaledType(mentaTypography.caption.fontSize),
          lineHeight: scaledType(mentaTypography.caption.lineHeight),
        });
        expect(
          screen.getByText(
            'I agree to Menta’s Terms of Use and Community Standards, and acknowledge the Privacy Policy.'
          )
        ).toHaveStyle({
          fontSize: scaledType(mentaTypography.bodySmall.fontSize),
          lineHeight: scaledType(mentaTypography.bodySmall.lineHeight),
        });
        fireEvent.press(
          screen.getByTestId('onboarding-auth-legal-confirmation')
        );
        fireEvent.press(screen.getByTestId('onboarding-auth-legal-continue'));
        expect(screen.getByText('Continue with Apple')).toHaveStyle({
          fontSize: scaledType(mentaTypography.control.fontSize),
          lineHeight: scaledType(mentaTypography.control.lineHeight),
        });
      }
      act(() => {
        authBody.props.onLayout({
          nativeEvent: { layout: { height: 500 } },
        });
        authBody.props.onContentSizeChange(390, 900);
      });
      expect(
        screen.getByTestId('onboarding-auth-body').props
          .showsVerticalScrollIndicator
      ).toBe(true);
      expect(
        screen.getByTestId('onboarding-auth-overflow-indicator')
      ).toHaveProp('pointerEvents', 'none');
      act(() => {
        screen.getByTestId('onboarding-auth-body').props.onScrollBeginDrag();
      });
      expect(
        screen.queryByTestId('onboarding-auth-overflow-indicator')
      ).toBeNull();
      const authFooter = screen.getByTestId('onboarding-auth-footer');
      expect(authFooter).toBeTruthy();
      expect(
        within(authBody).getByTestId('onboarding-auth-not-now')
      ).toBeTruthy();
      expect(
        within(authFooter).getByTestId('onboarding-auth-not-now')
      ).toBeTruthy();
      if (frame.fontScale > 1) {
        expect(screen.getByText('Save your promise')).toHaveStyle({
          fontSize: scaledType(mentaTypography.heading.fontSize),
          lineHeight: scaledType(mentaTypography.heading.lineHeight),
        });
        expect(screen.getByText('Continue with Apple')).toHaveStyle({
          fontSize: scaledType(mentaTypography.control.fontSize),
          lineHeight: scaledType(mentaTypography.control.lineHeight),
        });
      }
      expect(screen.getByText('‹ Promise')).toBeTruthy();
      if (frame.fontScale > 1) {
        fireEvent.press(screen.getByTestId('onboarding-header-back'));
        expect(screen.getByTestId('onboarding-momenta-gift')).toBeTruthy();
      }
    }
  );

  it('keeps the welcome message complete in a scroll-safe composition', () => {
    const screen = render(<OnboardingScreen />);
    const welcomeBody = screen.getByTestId('onboarding-welcome-body');

    expect(welcomeBody).toHaveStyle({
      flexGrow: 1,
      justifyContent: 'flex-start',
    });
    expect(screen.getByTestId('onboarding-welcome-scroll')).toBeTruthy();
    expect(
      screen.getByText('Keep the promises you make to yourself.')
    ).toBeTruthy();
    expect(
      screen.getByText('Start with one promise. Take it one day at a time.')
    ).toBeTruthy();
    expect(screen.queryByText(/Menta puts it in Today/)).toBeNull();
    expect(screen.queryByText(/asks you to show what you did/)).toBeNull();
    expect(screen.queryByText(/Your first promise is free/)).toBeNull();
    expect(screen.getByTestId('onboarding-start')).toBeTruthy();
    expect(screen.getByTestId('onboarding-existing-user')).toBeTruthy();
    expect(screen.getByText('Choose my first promise')).toBeTruthy();
    expect(screen.getByText('I already use Menta')).toBeTruthy();
  });

  it('uses the action colour for the main onboarding progression', () => {
    const screen = render(<OnboardingScreen />);

    expect(screen.getByTestId('onboarding-start')).toHaveStyle({
      backgroundColor: mentaColors.action,
    });
  });

  it('keeps an empty promise in context with progression disabled', () => {
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    expect(
      screen.getByTestId('onboarding-draft-continue').props.accessibilityState
    ).toMatchObject({ disabled: true });
    expect(screen.getByTestId('onboarding-promise-input')).toBeTruthy();
    expect(screen.queryByText('What will count as proof?')).toBeNull();
  });

  it('lets proof radio rows grow when Dynamic Type content wraps', () => {
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));

    const photo = screen.getByTestId('onboarding-proof-photo');
    const rowStyle = StyleSheet.flatten(photo.props.style);
    expect(photo.props.accessibilityRole).toBe('radio');
    expect(photo.props.accessibilityState).toEqual({
      checked: false,
      selected: false,
    });
    expect(rowStyle).toMatchObject({
      minHeight: 68,
      paddingVertical: 12,
    });
    expect(rowStyle.height).toBeUndefined();
    expect(screen.getByText('Take one photo.')).toBeTruthy();
  });

  it('keeps both accountability choices and the footer action reachable with compact Dynamic Type and a long promise', () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 320,
      height: 568,
      fontScale: 1.3,
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work, then write down what changed and what I want to repeat tomorrow before I finish the day.'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));

    const justMe = screen.getByTestId('onboarding-accountability-just_me');
    const group = screen.getByTestId('onboarding-accountability-new_group');
    expect(justMe.props.accessibilityRole).toBe('radio');
    expect(group.props.accessibilityRole).toBe('radio');
    fireEvent.press(group);
    expect(
      screen.getByTestId('onboarding-accountability-new_group').props
        .accessibilityState
    ).toMatchObject({ checked: true, selected: true });
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));

    expect(screen.getByText('Review your promise')).toBeTruthy();
    expect(screen.getByText('Invite someone')).toBeTruthy();
  });

  it('preserves the first promise through proof choice and auth handoff', async () => {
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));

    const input = screen.getByTestId('onboarding-promise-input');
    fireEvent.changeText(input, 'Walk for 20 minutes after work');
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));

    const previewButton = screen.getByTestId('onboarding-proof-continue');
    expect(previewButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    expect(screen.getByText('Photo proof')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));

    expect(screen.getByTestId('onboarding-duration-7')).toBeTruthy();
    expect(screen.getByTestId('onboarding-duration-14')).toBeTruthy();
    expect(screen.getByTestId('onboarding-duration-30')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    expect(screen.getByText('Walk for 20 minutes after work')).toBeTruthy();
    expect(screen.getByText('Review your promise')).toBeTruthy();
    expect(screen.queryByText('Your first Today')).toBeNull();
    expect(screen.queryByText('Ready to save')).toBeNull();
    expect(screen.queryByText('Add proof')).toBeNull();
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    expect(screen.getByTestId('onboarding-momenta-gift')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    fireEvent.press(
      screen.getByTestId('notification-privacy-education-not-now')
    );
    expect(screen.getByText('Save your promise')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-confirmation'));
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-continue'));
    expect(screen.queryByText('Return after sign-in')).toBeNull();
    expect(screen.queryByText('Draft saved on this phone')).toBeNull();
    fireEvent.press(screen.getByTestId('onboarding-continue-email'));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        '/email-auth?mode=signup&from=onboarding'
      )
    );
    await waitFor(() =>
      expect(mockSaveOnboardingDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          promise: 'Walk for 20 minutes after work',
          proofType: 'photo',
          durationDays: 14,
          accountabilityChoice: 'new_group',
          marketingOptIn: false,
        }),
        null,
        'auth_method'
      )
    );
  });

  it('persists new-group accountability as a next action without claiming creation', async () => {
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-note'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));

    expect(screen.getByText('Invite someone')).toBeTruthy();
    expect(
      screen.getByText(
        'Your promise is saved and still private. Choose how someone can help, then decide who to invite.'
      )
    ).toBeTruthy();
    expect(screen.queryByText(/name (?:the|your) group/i)).toBeNull();

    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    expect(screen.getByTestId('onboarding-duration-body')).toBeTruthy();

    await waitFor(() =>
      expect(mockSaveOnboardingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ accountabilityChoice: 'new_group' }),
        null
      )
    );
    expect(screen.queryByText(/group (?:was )?created/i)).toBeNull();
  });

  it('completes onboarding only after the first-promise activation receipt', async () => {
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 1.3,
    });
    mockAuthUser = { id: 'new-user' };
    const cancelledReferral = {
      accepted: false,
      outcome: 'already_accepted',
      referralId: 'cancelled-referral',
      referralCode: '00112233445566778899AABBCCDDEEFF',
      status: 'cancelled',
      rewardOutcome: 'cancelled_before_activation',
      inviterRewardAmount: 0,
      referredRewardAmount: 0,
    };
    mockCreateFirstPromiseWithPayment.mockResolvedValue({
      challenge: {
        id: 'promise-1',
        title: 'Walk for 20 minutes after work',
      },
      receipt: {
        isFirstPromise: true,
        nextDueAt: '2026-08-14T09:00:00+12:00',
        activation: {
          confirmed: true,
          activated: true,
          activatedAt: '2026-08-13T09:00:00+12:00',
          firstPromiseId: 'promise-1',
          source: 'first_promise_v1',
          welcomeMomentaAmount: 100,
          welcomeMomentaGranted: true,
          welcomeMomentaOutcome: 'granted_now',
          referral: cancelledReferral,
        },
        referral: cancelledReferral,
      },
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    fireEvent.press(screen.getByTestId('onboarding-duration-30'));
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    expect(screen.getByText('Save your promise')).toBeTruthy();
    createFromCombinedAuth(screen);

    expect(
      screen.getByTestId('onboarding-auth-create-promise').props
        .accessibilityState
    ).toEqual({ disabled: true, busy: true });
    expect(screen.queryByTestId('onboarding-receipt-sparkles')).toBeNull();
    expect(screen.queryByTestId('onboarding-receipt-check')).toBeNull();
    await waitFor(() =>
      expect(mockActivationStatusRpc).toHaveBeenCalledTimes(1)
    );

    await waitFor(() =>
      expect(mockActivationStatusRpc).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(mockCreateFirstPromiseWithPayment).toHaveBeenCalledTimes(1)
    );
    expect(await screen.findByText('Your promise is ready.')).toBeTruthy();
    expect(
      StyleSheet.flatten(
        screen.getByText(
          'Menta saved the promise and confirmed your account from the same server receipt.'
        ).props.style
      ).lineHeight
    ).toBeGreaterThan(mentaTypography.bodySmall.lineHeight);
    expect(mockActivationStatusRpc.mock.contexts[0]).toBe(supabase);
    expect(mockCreateFirstPromiseWithPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: 'new-user',
        title: 'Walk for 20 minutes after work',
        verificationType: 'photo',
        duration: 30,
        cost: 0,
      }),
      'new-user'
    );
    const createdInput = mockCreateFirstPromiseWithPayment.mock.calls[0][0];
    expect(createdInput.description).toContain('a Photo proof as proof');
    expect(createdInput.description).not.toContain('{proofName}');
    expect(createdInput.verificationDescription).toContain('proof');
    expect(createdInput.verificationDescription).not.toContain('{');
    expect(createdInput.submissionText).not.toContain('{');
    const startDay = Date.parse(`${createdInput.startDate}T00:00:00.000Z`);
    const endDay = Date.parse(`${createdInput.endDate}T00:00:00.000Z`);
    expect((endDay - startDay) / 86_400_000).toBe(29);
    expect(mockCancelPendingReferral).toHaveBeenCalledTimes(1);
    expect(mockCancelPendingReferral).toHaveBeenCalledWith('new-user');
    expect(mockCancelPendingReferral.mock.invocationCallOrder[0]).toBeLessThan(
      mockCreateFirstPromiseWithPayment.mock.invocationCallOrder[0]
    );
    expect(mockClearOnboardingDraft).toHaveBeenCalledWith('new-user');
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
    expect(screen.getByTestId('onboarding-receipt-mascot')).toBeTruthy();
    expect(mockEmitConfirmedOutcome).toHaveBeenCalledWith('promise-created', {
      confirmed: true,
      receiptId: 'promise-1',
      source: 'promise-creation',
    });
    expect(
      screen.getByText(
        'Menta saved the promise and confirmed your account from the same server receipt.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Walk for 20 minutes after work')).toBeTruthy();
    expect(screen.getByText('Next due')).toBeTruthy();
    expect(screen.getByText('100 added')).toBeTruthy();
    expect(screen.getByText('Invite someone')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Invite someone' })).toBeTruthy();

    expect(
      screen.getByTestId('onboarding-receipt-continue')
    ).not.toBeDisabled();
    const finishButton = screen.getByTestId('onboarding-receipt-continue');
    fireEvent.press(finishButton);

    await waitFor(() =>
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1)
    );
    expect(mockCompleteOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        completionHandoff: {
          firstPromiseId: 'promise-1',
          accountabilityChoice: 'new_group',
        },
      })
    );
  });

  it('locks activation synchronously before React disables the button', async () => {
    mockAuthUser = { id: 'locked-user' };
    let resolveLookup:
      | ((value: {
          data: { confirmed: false; referral: null };
          error: null;
        }) => void)
      | undefined;
    mockActivationStatusRpc.mockImplementationOnce(
      () =>
        new Promise<{
          data: { confirmed: false; referral: null };
          error: null;
        }>(resolve => {
          resolveLookup = resolve;
        })
    );
    mockCreateFirstPromiseWithPayment.mockResolvedValue({
      challenge: {
        id: 'locked-promise',
        title: 'Walk for 20 minutes after work',
      },
      receipt: {
        isFirstPromise: true,
        nextDueAt: null,
        activation: {
          confirmed: true,
          activated: true,
          activatedAt: '2026-08-13T09:00:00+12:00',
          firstPromiseId: 'locked-promise',
          firstPromiseTitle: 'Walk for 20 minutes after work',
          source: 'first_promise_v1',
          welcomeMomentaAmount: 100,
          welcomeMomentaGranted: true,
          welcomeMomentaOutcome: 'granted_now',
          referral: null,
        },
        referral: null,
      },
    });
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    const skipButton = screen.getByTestId('onboarding-auth-create-promise');
    act(() => {
      fireEvent.press(skipButton);
      fireEvent.press(skipButton);
    });

    await waitFor(() =>
      expect(mockActivationStatusRpc).toHaveBeenCalledTimes(1)
    );
    await act(async () => {
      resolveLookup?.({
        data: { confirmed: false, referral: null },
        error: null,
      });
    });
    expect(await screen.findByText('Your promise is ready.')).toBeTruthy();
    expect(mockCancelPendingReferral).toHaveBeenCalledTimes(1);
    expect(mockCreateFirstPromiseWithPayment).toHaveBeenCalledTimes(1);
  });

  it('records a deep-link referral before creation and trusts the nested receipt', async () => {
    const referralCode = '00112233445566778899AABBCCDDEEFF';
    mockAuthUser = { id: 'referred-user' };
    mockPendingReferral = { referralCode };
    mockCreateFirstPromiseWithPayment.mockResolvedValue({
      challenge: {
        id: 'promise-referred',
        title: 'Walk for 20 minutes after work',
      },
      receipt: {
        isFirstPromise: true,
        nextDueAt: null,
        activation: {
          confirmed: true,
          activated: true,
          activatedAt: '2026-08-13T09:00:00+12:00',
          firstPromiseId: 'promise-referred',
          source: 'first_promise_v1',
          welcomeMomentaAmount: 100,
          welcomeMomentaGranted: true,
          welcomeMomentaOutcome: 'granted_now',
        },
        referral: {
          accepted: true,
          outcome: 'both_rewarded',
          inviterRewardAmount: 50,
          referredRewardAmount: 50,
        },
      },
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));

    createFromCombinedAuth(screen, referralCode);

    expect(await screen.findByText('Your promise is ready.')).toBeTruthy();
    expect(mockSetPendingReferral).toHaveBeenCalledWith(
      referralCode,
      'referred-user'
    );
    expect(mockProcessReferral).toHaveBeenCalledWith('referred-user');
    expect(mockProcessReferral.mock.invocationCallOrder[0]).toBeLessThan(
      mockCreateFirstPromiseWithPayment.mock.invocationCallOrder[0]
    );
    expect(screen.getByText(/You received 50 Momenta/)).toBeTruthy();
    expect(mockClearPendingReferral).toHaveBeenCalledTimes(1);
    expect(mockClearPendingReferral).toHaveBeenCalledWith('referred-user');
  });

  it('restores the server-staged referral and blocks an explicit different code', async () => {
    const serverCode = '00112233445566778899AABBCCDDEEFF';
    const typedCode = 'FFEEDDCCBBAA99887766554433221100';
    mockAuthUser = { id: 'mismatch-user' };
    mockPendingReferral = {
      referralCode: typedCode,
      ownerUserId: 'mismatch-user',
    };
    mockActivationStatusRpc.mockResolvedValueOnce({
      data: {
        confirmed: false,
        referral: {
          accepted: false,
          outcome: 'pending_activation',
          referral_id: 'pending-referral',
          referral_code: serverCode,
          status: 'pending',
          reward_outcome: 'pending_activation_v2',
          inviter_reward_amount: 0,
          referred_reward_amount: 0,
        },
      },
      error: null,
    });
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    fireEvent.changeText(
      screen.getByTestId('onboarding-auth-referral-code'),
      typedCode
    );
    createFromCombinedAuth(screen, typedCode);

    expect(
      await screen.findByText(/different referral code is already saved/)
    ).toBeTruthy();
    expect(mockSetPendingReferral).toHaveBeenCalledWith(
      serverCode,
      'mismatch-user'
    );
    expect(mockProcessReferral).not.toHaveBeenCalled();
    expect(mockCreateFirstPromiseWithPayment).not.toHaveBeenCalled();
    expect(mockEmitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('does not create when referral cancellation cannot be confirmed', async () => {
    mockAuthUser = { id: 'cancel-failed-user' };
    mockCancelPendingReferral.mockResolvedValueOnce(false);
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    createFromCombinedAuth(screen);

    expect(await screen.findByTestId('onboarding-auth-error')).toBeTruthy();
    expect(screen.getByText(/referral was skipped/i)).toBeTruthy();
    expect(mockCreateFirstPromiseWithPayment).not.toHaveBeenCalled();
    expect(mockEmitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('recovers a confirmed activation without creating a second promise', async () => {
    mockAuthUser = { id: 'activated-user' };
    mockActivationStatusRpc.mockResolvedValue({
      data: {
        confirmed: true,
        activated: false,
        activated_at: '2026-08-12T09:00:00+12:00',
        first_promise_id: 'existing-promise',
        first_promise_title: 'Original morning walk',
        source: 'first_promise_v1',
        welcome_momenta: {
          granted: false,
          amount: 100,
          outcome: 'already_confirmed',
        },
        referral: {
          accepted: true,
          outcome: 'both_rewarded',
          referral_id: 'referral-1',
          referral_code: '00112233445566778899AABBCCDDEEFF',
          status: 'completed',
          reward_outcome: 'rewards_granted_v2',
          inviter_reward_amount: 50,
          referred_reward_amount: 50,
        },
      },
      error: null,
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    createFromCombinedAuth(screen);

    expect(await screen.findByText('Your promise is ready.')).toBeTruthy();
    expect(mockCreateFirstPromiseWithPayment).not.toHaveBeenCalled();
    expect(screen.getByText('100 already confirmed')).toBeTruthy();
    expect(screen.getByText('Original morning walk')).toBeTruthy();
    expect(screen.queryByText('Walk for 20 minutes after work')).toBeNull();
    expect(screen.getByText(/You received 50 Momenta/)).toBeTruthy();
    expect(mockClearPendingReferral).toHaveBeenCalledTimes(1);
    expect(mockClearPendingReferral).toHaveBeenCalledWith('activated-user');
    expect(mockClearOnboardingDraft).toHaveBeenCalledWith('activated-user');

    await waitFor(() =>
      expect(
        screen.getByTestId('onboarding-receipt-continue')
      ).not.toBeDisabled()
    );
    fireEvent.press(screen.getByTestId('onboarding-receipt-continue'));
    await waitFor(() => expect(mockCompleteOnboarding).toHaveBeenCalled());
  });

  it('fails closed when activation status is unavailable', async () => {
    mockAuthUser = { id: 'new-user' };
    mockActivationStatusRpc.mockResolvedValue({
      data: null,
      error: { message: 'network unavailable' },
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    createFromCombinedAuth(screen);

    expect(
      await screen.findByText(/could not confirm whether your first promise/)
    ).toBeTruthy();
    expect(screen.queryByTestId('onboarding-receipt-sparkles')).toBeNull();
    expect(screen.queryByTestId('onboarding-receipt-check')).toBeNull();
    expect(screen.queryByText('Your promise is ready.')).toBeNull();
    expect(mockCancelPendingReferral).not.toHaveBeenCalled();
    expect(mockCreateFirstPromiseWithPayment).not.toHaveBeenCalled();
  });

  it('keeps creation blocked and returns to inline consent when the legal receipt is missing', async () => {
    mockAuthUser = { id: 'legal-user' };
    mockGetMyLegalAcceptanceStatus.mockResolvedValue({
      userId: 'legal-user',
      accepted: false,
      requiresAcceptance: true,
      reason: 'missing_or_stale',
      current: currentLegalDocuments,
      enforcement: { promiseCreationRequired: true },
      receipt: null,
    });
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    createFromCombinedAuth(screen);
    await waitFor(() =>
      expect(
        screen.getByTestId('onboarding-auth-legal-confirmation').props
          .accessibilityState.checked
      ).toBe(false)
    );
    expect(screen.getByText('Confirm the required documents.')).toBeTruthy();
    expect(screen.getByTestId('onboarding-auth-legal-continue')).toBeDisabled();
    expect(screen.queryByTestId('onboarding-auth-create-promise')).toBeNull();
    expect(mockCancelPendingReferral).not.toHaveBeenCalled();
    expect(mockCreateFirstPromiseWithPayment).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/legal-acceptance' })
    );
  });

  it('clears a receipt when the authenticated account changes', async () => {
    mockAuthUser = { id: 'first-user' };
    mockCreateFirstPromiseWithPayment.mockResolvedValue({
      challenge: {
        id: 'first-user-promise',
        title: 'Walk for 20 minutes after work',
      },
      receipt: {
        isFirstPromise: true,
        nextDueAt: null,
        activation: {
          confirmed: true,
          activated: true,
          activatedAt: '2026-08-13T09:00:00+12:00',
          firstPromiseId: 'first-user-promise',
          firstPromiseTitle: null,
          source: 'first_promise_v1',
          welcomeMomentaAmount: 100,
          welcomeMomentaGranted: true,
          welcomeMomentaOutcome: 'granted_now',
          referral: null,
        },
        referral: null,
      },
    });
    const screen = render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('onboarding-start'));
    fireEvent.changeText(
      screen.getByTestId('onboarding-promise-input'),
      'Walk for 20 minutes after work'
    );
    fireEvent.press(screen.getByTestId('onboarding-draft-continue'));
    fireEvent.press(screen.getByTestId('onboarding-proof-photo'));
    fireEvent.press(screen.getByTestId('onboarding-accountability-new_group'));
    fireEvent.press(screen.getByTestId('onboarding-proof-continue'));
    fireEvent.press(screen.getByTestId('onboarding-duration-continue'));
    fireEvent.press(screen.getByTestId('onboarding-preview-continue'));
    fireEvent.press(screen.getByTestId('onboarding-momenta-gift-continue'));
    createFromCombinedAuth(screen);
    expect(await screen.findByText('Your promise is ready.')).toBeTruthy();

    mockAuthUser = { id: 'second-user' };
    screen.rerender(<OnboardingScreen />);

    expect(await screen.findByTestId('onboarding-start')).toBeTruthy();
    expect(screen.queryByText('Your promise is ready.')).toBeNull();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('ignores a late activation lookup after an account switch', async () => {
    mockAuthUser = { id: 'first-user' };
    let resolveLookup:
      | ((value: {
          data: { confirmed: false; referral: null };
          error: null;
        }) => void)
      | undefined;
    mockActivationStatusRpc.mockImplementationOnce(
      () =>
        new Promise<{
          data: { confirmed: false; referral: null };
          error: null;
        }>(resolve => {
          resolveLookup = resolve;
        })
    );
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    createFromCombinedAuth(screen);
    await waitFor(() =>
      expect(mockActivationStatusRpc).toHaveBeenCalledTimes(1)
    );

    mockAuthUser = { id: 'second-user' };
    screen.rerender(<OnboardingScreen />);
    await act(async () => {
      resolveLookup?.({
        data: { confirmed: false, referral: null },
        error: null,
      });
    });

    expect(await screen.findByTestId('onboarding-start')).toBeTruthy();
    expect(screen.queryByText('Your promise is ready.')).toBeNull();
    expect(mockCancelPendingReferral).not.toHaveBeenCalled();
    expect(mockCreateFirstPromiseWithPayment).not.toHaveBeenCalled();
  });

  it('locks the email handoff while its draft save is pending', async () => {
    let resolveSave: (() => void) | undefined;
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);
    mockSaveOnboardingDraft.mockClear();
    mockSaveOnboardingDraft.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveSave = resolve;
        })
    );

    const emailButton = screen.getByTestId('onboarding-continue-email');
    fireEvent.press(emailButton);
    fireEvent.press(emailButton);

    expect(mockSaveOnboardingDraft).toHaveBeenCalledTimes(1);
    expect(emailButton.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
    expect(screen.getByText('Opening email…')).toBeTruthy();

    resolveSave?.();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
  });

  it('keeps the email handoff retryable when draft persistence fails', async () => {
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);
    mockSaveOnboardingDraft.mockClear();
    mockSaveOnboardingDraft.mockRejectedValueOnce(new Error('storage full'));

    fireEvent.press(screen.getByTestId('onboarding-continue-email'));

    expect(
      await screen.findByText('Your draft could not be saved yet.')
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('onboarding-continue-email').props.accessibilityState
    ).toEqual({ disabled: false, busy: false });
    expect(screen.getByText('Continue with email')).toBeTruthy();
  });

  it('starts Google directly and keeps only that provider busy', async () => {
    let resolveGoogle: (() => void) | undefined;
    mockSignInWithGoogle.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveGoogle = resolve;
        })
    );
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    fireEvent.press(screen.getByTestId('onboarding-continue-google'));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1));
    expect(
      screen.getByTestId('onboarding-continue-google').props.accessibilityState
    ).toEqual({ disabled: true, busy: true });
    expect(
      screen.getByTestId('onboarding-continue-apple').props.accessibilityState
    ).toEqual({ disabled: true, busy: false });
    expect(
      screen.getByTestId('onboarding-continue-email').props.accessibilityState
    ).toEqual({ disabled: true, busy: false });

    resolveGoogle?.();
    await waitFor(() =>
      expect(
        screen.getByTestId('onboarding-continue-google').props
          .accessibilityState
      ).toEqual({ disabled: false, busy: false })
    );
  });

  it('keeps sign-in separate until required legal consent is selected', () => {
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen, undefined, true, false, false);

    expect(screen.getByText('‹ Promise')).toBeTruthy();
    expect(screen.getByText('Read the current terms.')).toBeTruthy();
    expect(
      screen.getByText('Rules for promises, proof and groups.')
    ).toBeTruthy();
    expect(
      screen.getByText('How Menta handles your information.')
    ).toBeTruthy();
    expect(screen.queryByText('Read document')).toBeNull();
    expect(screen.queryByTestId('onboarding-marketing-opt-in')).toBeNull();
    expect(screen.queryByTestId('onboarding-continue-apple')).toBeNull();
    expect(
      screen.getByTestId('onboarding-auth-legal-documents-terms')
    ).toHaveProp('accessibilityRole', 'link');
    fireEvent.press(
      screen.getByTestId('onboarding-auth-legal-documents-terms')
    );
    expect(
      screen.getByTestId('onboarding-auth-legal-confirmation').props
        .accessibilityState
    ).toEqual({ checked: false });
    expect(screen.queryByTestId('onboarding-continue-google')).toBeNull();
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-confirmation'));
    expect(
      screen.getByTestId('onboarding-auth-legal-confirmation').props
        .accessibilityState
    ).toEqual({ checked: true });
    expect(screen.queryByTestId('onboarding-continue-apple')).toBeNull();
    fireEvent.press(screen.getByTestId('onboarding-auth-legal-continue'));
    expect(screen.getByTestId('onboarding-continue-apple')).toBeEnabled();
    expect(screen.getByTestId('onboarding-continue-google')).toBeEnabled();
    expect(screen.getByTestId('onboarding-continue-email')).toBeEnabled();
  });

  it('flushes and claims the anonymous draft before resuming after Google auth', async () => {
    const claimedDraft = {
      version: 3 as const,
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo' as const,
      durationDays: 14 as const,
      legalConsentAt: new Date().toISOString(),
      legalConsentVersions: currentLegalVersionTuple,
      referralCode: '',
      marketingOptIn: true,
      updatedAt: new Date().toISOString(),
      ownerUserId: 'google-user',
      resumeStep: 'auth_method' as const,
    };
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);
    await waitFor(() =>
      expect(mockLoadOnboardingDraftForUser).toHaveBeenCalledTimes(1)
    );
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce(claimedDraft);
    mockSignInWithGoogle.mockImplementationOnce(async () => {
      mockAuthUser = { id: 'google-user' };
    });

    fireEvent.press(screen.getByTestId('onboarding-continue-google'));

    await waitFor(() => expect(mockActivationStatusRpc).toHaveBeenCalled());
    expect(mockSaveOnboardingDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        promise: 'Walk for 20 minutes after work',
        proofType: 'photo',
        durationDays: 14,
        accountabilityChoice: 'new_group',
        marketingOptIn: false,
      }),
      null,
      'auth_method'
    );
    expect(mockSaveOnboardingDraft.mock.invocationCallOrder[0]).toBeLessThan(
      mockSignInWithGoogle.mock.invocationCallOrder[0]
    );
    expect(mockLoadOnboardingDraftForUser).toHaveBeenLastCalledWith({
      userId: 'google-user',
      hasCompletedOnboarding: false,
    });
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith(
      'google-user',
      expect.objectContaining({ marketing_email_opt_in: true })
    );
  });

  it('does not write marketing when the claimed account draft has no prior opt-in', async () => {
    const claimedDraft = {
      version: 3 as const,
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo' as const,
      durationDays: 14 as const,
      accountabilityChoice: 'just_me' as const,
      marketingOptIn: false,
      updatedAt: new Date().toISOString(),
      ownerUserId: 'google-user',
      resumeStep: 'auth_method' as const,
    };
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);
    await waitFor(() =>
      expect(mockLoadOnboardingDraftForUser).toHaveBeenCalledTimes(1)
    );
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce(claimedDraft);
    mockSignInWithGoogle.mockImplementationOnce(async () => {
      mockAuthUser = { id: 'google-user' };
    });

    fireEvent.press(screen.getByTestId('onboarding-continue-google'));

    await waitFor(() => expect(mockActivationStatusRpc).toHaveBeenCalled());
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });

  it('routes post-auth legal review to current server document versions', async () => {
    const claimedDraft = {
      version: 3 as const,
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo' as const,
      durationDays: 14 as const,
      legalConsentAt: new Date().toISOString(),
      legalConsentVersions: currentLegalVersionTuple,
      referralCode: '',
      marketingOptIn: true,
      updatedAt: new Date().toISOString(),
      ownerUserId: 'google-user',
      resumeStep: 'auth_method' as const,
    };
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);
    await waitFor(() =>
      expect(mockLoadOnboardingDraftForUser).toHaveBeenCalledTimes(1)
    );
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce(claimedDraft);
    mockGetMyLegalAcceptanceStatus
      .mockResolvedValueOnce({
        userId: 'google-user',
        accepted: false,
        requiresAcceptance: true,
        current: currentLegalDocuments,
      })
      .mockResolvedValue({
        userId: 'google-user',
        accepted: true,
        requiresAcceptance: false,
        current: currentLegalDocuments,
      });
    mockSignInWithGoogle.mockImplementationOnce(async () => {
      mockAuthUser = { id: 'google-user' };
    });

    fireEvent.press(screen.getByTestId('onboarding-continue-google'));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockGetMyLegalAcceptanceStatus).toHaveBeenCalledWith('google-user')
    );
    await waitFor(() =>
      expect(mockAcceptCurrentLegalDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ current: currentLegalDocuments }),
        'account_creation',
        'google-user'
      )
    );
    expect(mockReplace).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/legal-acceptance' })
    );
    expect(screen.queryByText('This is what you’ll see today.')).toBeNull();
    expect(screen.queryByTestId('onboarding-momenta-gift')).toBeNull();
  });

  it('continues an authenticated provider draft without painting terms twice', async () => {
    mockAuthUser = { id: 'google-user' };
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce({
      version: 3 as const,
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo' as const,
      durationDays: 14 as const,
      accountabilityChoice: 'new_group' as const,
      legalConsentAt: new Date().toISOString(),
      legalConsentVersions: currentLegalVersionTuple,
      referralCode: '',
      marketingOptIn: false,
      updatedAt: new Date().toISOString(),
      ownerUserId: 'google-user',
      resumeStep: 'auth_method' as const,
    });
    mockGetMyLegalAcceptanceStatus
      .mockResolvedValueOnce({
        userId: 'google-user',
        accepted: false,
        requiresAcceptance: true,
        current: currentLegalDocuments,
      })
      .mockResolvedValue({
        userId: 'google-user',
        accepted: true,
        requiresAcceptance: false,
        current: currentLegalDocuments,
      });
    mockCreateFirstPromiseWithPayment.mockResolvedValue({
      challenge: {
        id: 'promise-1',
        title: 'Walk for 20 minutes after work',
      },
      receipt: {
        isFirstPromise: true,
        nextDueAt: '2026-09-02T09:00:00+12:00',
        activation: {
          confirmed: true,
          activated: true,
          activatedAt: '2026-09-01T03:00:00+12:00',
          firstPromiseId: 'promise-1',
          source: 'first_promise_v1',
          welcomeMomentaAmount: 100,
          welcomeMomentaGranted: true,
          welcomeMomentaOutcome: 'granted_now',
          referral: null,
        },
        referral: null,
      },
    });

    const screen = render(<OnboardingScreen />);

    await waitFor(() =>
      expect(mockAcceptCurrentLegalDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ current: currentLegalDocuments }),
        'account_creation',
        'google-user'
      )
    );
    await waitFor(() => expect(mockActivationStatusRpc).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId('onboarding-receipt')).toBeTruthy()
    );

    expect(screen.queryByText('Save your promise')).toBeNull();
    expect(
      screen.queryByTestId('onboarding-auth-legal-confirmation')
    ).toBeNull();
    expect(mockReplace).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/legal-acceptance' })
    );
  });

  it('keeps the auth method full-lane and scroll-safe within the phone frame', () => {
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);
    const contentStyle = StyleSheet.flatten(
      screen.getByTestId('onboarding-auth-body').props.contentContainerStyle
    );

    expect(mentaLayout.phoneFrameMax).toBe(430);
    expect(contentStyle).toEqual(
      expect.objectContaining({
        flexGrow: 1,
        justifyContent: 'flex-start',
        maxWidth: 430,
        paddingBottom: 40,
        paddingHorizontal: 24,
        paddingTop: 24,
        width: '100%',
      })
    );
    expect(screen.getByTestId('onboarding-auth-body')).toHaveStyle({
      flex: 1,
    });
    expect(screen.getByTestId('onboarding-auth-copy')).toHaveStyle({
      width: '100%',
    });
    expect(screen.getByText('Save your promise')).toHaveStyle({
      fontSize: 32,
      lineHeight: mentaTypography.heading.lineHeight,
    });
  });

  it('lets a signed-out user defer authentication and return to preview', async () => {
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    fireEvent.press(screen.getByTestId('onboarding-auth-not-now'));

    expect(screen.getByText('Review your promise')).toBeTruthy();
    expect(screen.getByText('Continue to save')).toBeTruthy();
    expect(screen.queryByText('Save your promise')).toBeNull();
    await waitFor(() =>
      expect(mockSaveOnboardingDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          promise: 'Walk for 20 minutes after work',
          proofType: 'photo',
          durationDays: 14,
          accountabilityChoice: 'new_group',
          marketingOptIn: false,
        }),
        null,
        'preview'
      )
    );
  });

  it('shows the persisted cancellation recovery after a Google handoff', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(
      new Error('Sign-in was cancelled')
    );
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    fireEvent.press(screen.getByTestId('onboarding-continue-google'));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('onboarding-auth-error')).toBeNull();
    expect(await screen.findByText('You’re still signed out.')).toBeTruthy();
    expect(screen.getByText('Your local promise is still here')).toBeTruthy();
    expect(screen.getByText('Choose sign-in method')).toBeTruthy();
    expect(screen.getByText('Keep local draft')).toBeTruthy();
    expect(mockReplace).toHaveBeenCalledWith('/onboarding');

    fireEvent.press(screen.getByText('Keep local draft'));
    expect(screen.getByText('Local draft')).toBeTruthy();
    expect(
      screen.getByText(
        'Your draft is private on this phone. Sign in to keep it.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Nothing has been sent yet.')).toBeNull();
    expect(
      screen.getByText('Your draft is still private on this phone.')
    ).toBeTruthy();
  });

  it('restores the auth method after a native handoff remount', async () => {
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce({
      version: 3,
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo',
      durationDays: 14,
      updatedAt: new Date().toISOString(),
      ownerUserId: null,
      resumeStep: 'auth_method',
    });

    const screen = render(<OnboardingScreen />);

    expect(await screen.findByText('Save your promise')).toBeTruthy();
    expect(
      screen.getByTestId('onboarding-auth-legal-confirmation')
    ).toBeTruthy();
    expect(screen.queryByText('Continue with Google')).toBeNull();
    expect(
      screen.getByText(
        'Choose how you want to continue. Your draft stays on this phone.'
      )
    ).toBeTruthy();
  });

  it('keeps a deferred signed-out draft on its preview after relaunch', async () => {
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce({
      version: 3,
      promise: longPromiseFixture,
      proofType: 'photo',
      durationDays: 14,
      accountabilityChoice: 'new_group',
      updatedAt: new Date().toISOString(),
      ownerUserId: null,
      resumeStep: 'preview',
    });

    const screen = render(<OnboardingScreen />);

    expect(await screen.findByText('Review your promise')).toBeTruthy();
    expect(screen.getByText(longPromiseFixture)).toBeTruthy();
    expect(screen.getByText('Invite someone')).toBeTruthy();
    expect(
      screen.getByText(
        'You can review these choices before Menta saves anything.'
      )
    ).toBeTruthy();
    expect(
      StyleSheet.flatten(
        screen.getByTestId('onboarding-preview-body').props
          .contentContainerStyle
      ).paddingBottom
    ).toBe(fixedActionContentClearance);
    expect(screen.getByText('Continue to save')).toBeTruthy();
    expect(screen.queryByText('Continue with Google')).toBeNull();
  });

  it('consumes a server-current legal-accepted return before referral', async () => {
    mockAuthUser = { id: 'legal-return-user' };
    mockRouteParams = { resume: 'legal-accepted' };
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce({
      version: 3,
      promise: 'Walk after work',
      proofType: 'photo',
      durationDays: 30,
      marketingOptIn: true,
      updatedAt: new Date().toISOString(),
      ownerUserId: 'legal-return-user',
      resumeStep: 'legal_acceptance',
    });
    mockGetMyLegalAcceptanceStatus.mockResolvedValue({
      userId: 'legal-return-user',
      accepted: true,
      requiresAcceptance: false,
    });

    const screen = render(<OnboardingScreen />);

    expect(await screen.findByText('Save your promise')).toBeTruthy();
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith(
      'legal-return-user',
      expect.objectContaining({ marketing_email_opt_in: true })
    );
    expect(mockSaveOnboardingDraft).toHaveBeenCalledWith(
      expect.objectContaining({ durationDays: 30 }),
      'legal-return-user',
      null
    );
  });

  it('keeps a legal-declined return at review without saving marketing', async () => {
    mockAuthUser = { id: 'legal-declined-user' };
    mockRouteParams = { resume: 'legal-declined' };
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce({
      version: 3,
      promise: 'Walk after work',
      proofType: 'photo',
      durationDays: 14,
      marketingOptIn: true,
      updatedAt: new Date().toISOString(),
      ownerUserId: 'legal-declined-user',
      resumeStep: 'legal_acceptance',
    });

    const screen = render(<OnboardingScreen />);

    expect(await screen.findByText('Save your promise')).toBeTruthy();
    expect(screen.getByText(/Legal review was not completed/)).toBeTruthy();
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });

  it('continues an authenticated auth handoff after the gift without repeating providers', async () => {
    mockAuthUser = { id: 'email-user' };
    mockLoadOnboardingDraftForUser.mockResolvedValueOnce({
      version: 3,
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo',
      durationDays: 14,
      updatedAt: new Date().toISOString(),
      ownerUserId: 'email-user',
      resumeStep: 'auth_method',
    });

    const screen = render(<OnboardingScreen />);

    expect(await screen.findByText('Save your promise')).toBeTruthy();
    expect(screen.queryByText('Continue with Google')).toBeNull();
    expect(screen.queryByTestId('onboarding-momenta-gift')).toBeNull();
    expect(mockLoadOnboardingDraftForUser).toHaveBeenCalledWith({
      userId: 'email-user',
      hasCompletedOnboarding: false,
    });
  });

  it('retains the draft and actions after a Google provider failure', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(
      new Error('Provider unavailable')
    );
    const screen = render(<OnboardingScreen />);
    reachAuthMethod(screen);

    fireEvent.press(screen.getByTestId('onboarding-continue-google'));

    expect(
      await screen.findByText('Google sign-in did not finish.')
    ).toBeTruthy();
    expect(
      screen.getByText('Provider unavailable Your draft is still here.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Choose how you want to continue. Your draft stays on this phone.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Continue with email')).toBeTruthy();
  });
});
