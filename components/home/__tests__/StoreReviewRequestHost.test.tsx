import React from 'react';
import { InteractionManager, Platform } from 'react-native';
import {
  act,
  fireEvent,
  render as renderNative,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreReviewRequestHost } from '@/components/home/StoreReviewRequestHost';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);
const render = (ui: React.ReactElement) =>
  renderNative(ui, { wrapper: Wrapper });

const mockRequestReview = jest.fn().mockResolvedValue({
  capability: 'system',
  outcome: 'requested',
  requested: true,
});
const mockVisibilityListeners = new Set<(visible: boolean) => void>();
const mockPaywallState = { visible: false };
let mockInvitationGate: 'legacy' | 'pending' | 'complete' = 'legacy';
let mockDismiss: () => void;
const mockStorage = new Map<string, string>();
const mockRecoverActivation = jest.fn();
const mockTrack = jest.fn();
const mockCapture = jest.fn();
const mockRouter = { push: jest.fn() };
const mockAcknowledgeInvitation = jest.fn().mockResolvedValue(false);
const originalPlatform = Platform.OS;
const mockAuthState = {
  user: { id: 'review-user' },
  isAuthenticated: true,
  hasCompletedOnboarding: true,
};

jest.mock('@/lib/commitments/recover-activation-review', () => ({
  recoverActivationReview: (...args: unknown[]) =>
    mockRecoverActivation(...args),
}));
jest.mock('@/lib/posthog', () => ({
  trackProductEvent: (...args: unknown[]) => mockTrack(...args),
}));
jest.mock('@/lib/sentry', () => ({
  captureMessage: (...args: unknown[]) => mockCapture(...args),
}));
jest.mock('@/components/ui/modal/ModalCard', () => {
  const { View } = require('react-native');
  return {
    ModalCard: ({
      visible,
      onDismiss,
      children,
    }: {
      visible: boolean;
      onDismiss: () => void;
      children: React.ReactNode;
    }) => {
      mockDismiss = onDismiss;
      return visible ? <View>{children}</View> : null;
    },
  };
});

jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector: (state: typeof mockAuthState) => unknown) =>
      selector(mockAuthState),
    { getState: () => mockAuthState }
  ),
}));

jest.mock('@/lib/navigation/onboarding-invitation-lifecycle', () => ({
  useOnboardingInvitationLifecycleStore: (
    selector: (state: unknown) => unknown
  ) => selector({ hydrated: true, entries: {}, blockedOwners: {} }),
  getOnboardingInvitationReviewGate: () => mockInvitationGate,
  hydrateOnboardingInvitationLifecycle: jest.fn().mockResolvedValue(undefined),
  acknowledgeOnboardingInvitationNavigation: (...args: unknown[]) =>
    mockAcknowledgeInvitation(...args),
}));

jest.mock('@/lib/navigation/onboarding-completion', () => ({
  useOnboardingCompletionStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector({ pending: null }),
    { persist: { hasHydrated: () => true, onFinishHydration: () => jest.fn() } }
  ),
}));

jest.mock('@/lib/store-review', () => ({
  requestEligibleSystemStoreReview: (...args: unknown[]) =>
    mockRequestReview(...args),
}));

jest.mock('@/lib/paywall/manager', () => ({
  paywallManager: {
    get isVisible() {
      return mockPaywallState.visible;
    },
    subscribeVisibility: (listener: (visible: boolean) => void) => {
      mockVisibilityListeners.add(listener);
      listener(mockPaywallState.visible);
      return () => mockVisibilityListeners.delete(listener);
    },
  },
}));

jest.mock('expo-router', () => {
  const { useEffect } = require('react') as typeof import('react');
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(() => callback(), [callback]);
    },
  };
});

describe('StoreReviewRequestHost', () => {
  const runAfterInteractions = jest.spyOn(
    InteractionManager,
    'runAfterInteractions'
  );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockVisibilityListeners.clear();
    mockPaywallState.visible = false;
    mockInvitationGate = 'legacy';
    mockAuthState.user = { id: 'review-user' };
    mockAuthState.isAuthenticated = true;
    mockAuthState.hasCompletedOnboarding = true;
    mockStorage.clear();
    mockRecoverActivation.mockResolvedValue('2026-09-13T00:00:00Z');
    mockRequestReview.mockResolvedValue({
      capability: 'system',
      outcome: 'requested',
      requested: true,
    });
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockImplementation(async key => mockStorage.get(key) ?? null);
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementation(async (key, value) => {
        mockStorage.set(key, value);
      });
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    runAfterInteractions.mockImplementation(task => {
      if (typeof task === 'function') task();
      return { cancel: jest.fn(), then: jest.fn() } as ReturnType<
        typeof InteractionManager.runAfterInteractions
      >;
    });
  });

  afterEach(() => jest.useRealTimers());
  afterAll(() => {
    runAfterInteractions.mockRestore();
    Object.defineProperty(Platform, 'OS', {
      value: originalPlatform,
      configurable: true,
    });
  });

  const settle = async () => {
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
  };

  it('does nothing until Today is settled', async () => {
    mockRecoverActivation.mockResolvedValue(null);
    const screen = render(<StoreReviewRequestHost ready={false} />);
    await settle();
    expect(mockRequestReview).not.toHaveBeenCalled();

    screen.rerender(<StoreReviewRequestHost ready />);
    await settle();
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('does not request while the paywall is visible', async () => {
    mockPaywallState.visible = true;
    render(<StoreReviewRequestHost ready />);
    await settle();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('defers the review request while the onboarding invitation is pending', async () => {
    mockInvitationGate = 'pending';
    render(<StoreReviewRequestHost ready />);
    await settle();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('shows the check-in on the first settled Today after activation and inviting, without requesting StoreKit first', async () => {
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    expect(screen.getByText('How is Menta going?')).toBeTruthy();
    expect(mockRequestReview).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith('Feedback Journey', {
      action: 'shown',
      source: 'activation_check_in',
    });
  });

  it('recovers a confirmed legacy activation without inventing an invitation completion receipt', async () => {
    mockInvitationGate = 'legacy';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    expect(mockRecoverActivation).toHaveBeenCalledWith('review-user');
    expect(screen.getByText('How is Menta going?')).toBeTruthy();
    expect(mockAcknowledgeInvitation).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalledWith(
      'Accountability Invite Journey',
      expect.anything()
    );
    fireEvent.press(screen.getByText("Yes, it's working for me"));
    await act(async () => mockDismiss());
    expect(mockRequestReview).toHaveBeenCalledWith(
      expect.any(Number),
      'review-user',
      expect.any(Function)
    );
  });

  it('does not show legacy activation feedback when authoritative recovery is absent or unavailable', async () => {
    mockInvitationGate = 'legacy';
    mockRecoverActivation.mockResolvedValue(null);
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    expect(screen.queryByText('How is Menta going?')).toBeNull();
    expect(mockRequestReview).toHaveBeenCalledWith(
      expect.any(Number),
      undefined,
      expect.any(Function)
    );
  });

  it('suppresses a recovered legacy check-in if an active invite starts during the receipt read', async () => {
    mockInvitationGate = 'legacy';
    let resolveActivation!: (value: string) => void;
    mockRecoverActivation.mockReturnValue(
      new Promise(resolve => {
        resolveActivation = resolve;
      })
    );
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    mockInvitationGate = 'pending';
    await act(async () => resolveActivation('2026-09-13T00:00:00Z'));
    expect(screen.queryByText('How is Menta going?')).toBeNull();
    expect(mockRequestReview).not.toHaveBeenCalled();
    expect(mockAcknowledgeInvitation).not.toHaveBeenCalled();
  });

  it('requests native rating only after a positive answer closes the sheet, once', async () => {
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    fireEvent.press(screen.getByText("Yes, it's working for me"));
    expect(mockRequestReview).not.toHaveBeenCalled();
    await act(async () => {
      mockDismiss();
      mockDismiss();
    });
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
    expect(mockRequestReview).toHaveBeenCalledWith(
      expect.any(Number),
      'review-user',
      expect.any(Function)
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockStorage.get('@menta/feedback-check-in:v1:review-user')).toBe(
      'done'
    );
  });

  it('opens a new feedback form for the negative answer without requesting rating', async () => {
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    fireEvent.press(screen.getByText('Something could be better'));
    await act(async () => mockDismiss());
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/report-issue',
      params: {
        mode: 'feedback',
        source: 'activation_feedback',
        newReport: '1',
      },
    });
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('continues the Android positive answer after the closed state without an iOS-only dismiss callback', async () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    fireEvent.press(screen.getByText("Yes, it's working for me"));
    await act(async () => {});
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('consumes an explicit dismissal without navigation or rating and does not show again on remount', async () => {
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    fireEvent.press(screen.getByText('Not now'));
    await act(async () => mockDismiss());
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRequestReview).not.toHaveBeenCalled();
    screen.unmount();
    const next = render(<StoreReviewRequestHost ready />);
    await settle();
    expect(next.queryByText('How is Menta going?')).toBeNull();
    // A later independent three-accepted-proof opportunity is preserved.
    expect(mockRequestReview).toHaveBeenCalledWith(
      expect.any(Number),
      undefined,
      expect.any(Function)
    );
  });

  it('preserves the check-in across a refresh interruption and resumes after Today settles', async () => {
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    screen.rerender(<StoreReviewRequestHost ready={false} />);
    expect(screen.queryByText('How is Menta going?')).toBeNull();
    expect(mockStorage.has('@menta/feedback-check-in:v1:review-user')).toBe(
      false
    );
    screen.rerender(<StoreReviewRequestHost ready />);
    await settle();
    expect(screen.getByText('How is Menta going?')).toBeTruthy();
  });

  it('cancels a pending positive handoff if the account changes before modal dismissal', async () => {
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    fireEvent.press(screen.getByText("Yes, it's working for me"));
    mockAuthState.user = { id: 'different-user' };
    await act(async () => mockDismiss());
    expect(mockRequestReview).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('does not let a cancelled or reopened invite through when the activation read completes late', async () => {
    mockInvitationGate = 'complete';
    let resolveActivation!: (value: string) => void;
    mockRecoverActivation.mockReturnValue(
      new Promise(resolve => {
        resolveActivation = resolve;
      })
    );
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    mockInvitationGate = 'pending';
    await act(async () => resolveActivation('2026-09-13T00:00:00Z'));
    expect(screen.queryByText('How is Menta going?')).toBeNull();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('records failed opportunity reads without presenting or blocking Today', async () => {
    mockInvitationGate = 'complete';
    jest
      .mocked(AsyncStorage.getItem)
      .mockRejectedValueOnce(new Error('unavailable'));
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    expect(screen.queryByText('How is Menta going?')).toBeNull();
    expect(mockCapture).toHaveBeenCalledWith(
      'feedback_check_in_failed',
      'warning',
      { tags: { flow: 'activation_check_in', stage: 'today' } }
    );
  });

  it('keeps dismissal effective for this session when its durable write fails', async () => {
    mockInvitationGate = 'complete';
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    jest
      .mocked(AsyncStorage.setItem)
      .mockRejectedValueOnce(new Error('unavailable'));
    fireEvent.press(screen.getByText('Not now'));
    await act(async () => {});
    screen.rerender(<StoreReviewRequestHost ready={false} />);
    screen.rerender(<StoreReviewRequestHost ready />);
    await settle();
    expect(screen.queryByText('How is Menta going?')).toBeNull();
    expect(mockCapture).toHaveBeenCalledWith(
      'feedback_check_in_failed',
      'warning',
      { tags: { flow: 'activation_check_in', stage: 'feedback' } }
    );
  });

  it('records a failed native request and leaves Today usable without opening feedback', async () => {
    mockInvitationGate = 'complete';
    mockRequestReview.mockResolvedValueOnce({
      capability: 'system',
      outcome: 'failed',
      requested: false,
    });
    const screen = render(<StoreReviewRequestHost ready />);
    await settle();
    fireEvent.press(screen.getByText("Yes, it's working for me"));
    await act(async () => mockDismiss());
    expect(screen.queryByText('How is Menta going?')).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalled();
  });
});
