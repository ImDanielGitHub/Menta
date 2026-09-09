import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import InviteRedirectScreen from '@/app/invite';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockRouter = { replace: jest.fn() };
const mockSetPendingReferral = jest.fn();
const mockClearPendingReferral = jest.fn();
const REFERRAL_CODE = '00112233445566778899AABBCCDDEEFF';

let mockParams: { ref?: string | string[] } = {};
let mockAuthState = {
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  user: null as { id: string } | null,
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));

jest.mock('@/store/referral-store', () => ({
  useReferralStore: () => ({
    setPendingReferral: mockSetPendingReferral,
    clearPendingReferral: mockClearPendingReferral,
  }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) =>
    selector(mockAuthState),
}));

const renderInviteRedirect = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider>
        <InviteRedirectScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('InviteRedirectScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockParams = {};
    mockAuthState = {
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      user: null,
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('holds a valid referral through the new-account handoff', () => {
    mockParams = { ref: REFERRAL_CODE.toLowerCase() };

    renderInviteRedirect();

    expect(mockSetPendingReferral).toHaveBeenCalledWith(REFERRAL_CODE, null);
    expect(screen.getByText('Referral saved')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('does not overwrite an already-onboarded account referral', () => {
    mockParams = { ref: REFERRAL_CODE };
    mockAuthState = {
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      user: { id: 'user-1' },
    };

    renderInviteRedirect();

    expect(mockClearPendingReferral).toHaveBeenCalledWith(
      'user-1',
      REFERRAL_CODE
    );
    expect(mockSetPendingReferral).not.toHaveBeenCalled();
    expect(screen.getByText('Referral is for new accounts')).toBeTruthy();
  });

  it('binds a signed-in onboarding referral to the current account', () => {
    mockParams = { ref: REFERRAL_CODE };
    mockAuthState = {
      isAuthenticated: true,
      hasCompletedOnboarding: false,
      user: { id: 'user-1' },
    };

    renderInviteRedirect();

    expect(mockSetPendingReferral).toHaveBeenCalledWith(
      REFERRAL_CODE,
      'user-1'
    );
    expect(mockClearPendingReferral).not.toHaveBeenCalled();
  });

  it('keeps a missing referral recoverable without saving one', () => {
    renderInviteRedirect();

    expect(mockSetPendingReferral).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Continue without referral'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('does not claim an invite-like value is a saved referral', () => {
    mockParams = { ref: 'FRIEND42' };

    renderInviteRedirect();

    expect(mockSetPendingReferral).not.toHaveBeenCalled();
    expect(screen.getByTestId('invite-referral-missing-notice')).toBeTruthy();
  });
});
