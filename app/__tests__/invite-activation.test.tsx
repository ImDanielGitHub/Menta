import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import InviteActivationRoute from '@/app/invite-activation';

const mockRouter = { replace: jest.fn() };
const mockCompleteOnboarding = jest.fn();
const mockLoadReceipt = jest.fn();
const mockGetLegal = jest.fn();
const mockAcceptLegal = jest.fn();
const mockClaimPromise = jest.fn();
const mockDismissPromise = jest.fn();
const mockClaimEvent = jest.fn();
const mockDismissEvent = jest.fn();
const mockProjectEvent = jest.fn();
let mockUser: { id: string } | null = { id: 'user-a' };
let mockPendingInvite: Record<string, unknown> | null = {
  type: 'challenge',
  code: 'BOOK2026',
  timestamp: 1_000,
  ownerUserId: null,
};
let mockPendingProtectedRoute: Record<string, unknown> | null = null;

const legalStatus = {
  userId: 'user-a',
  accepted: false,
  requiresAcceptance: true,
  reason: 'missing_or_stale' as const,
  current: {
    terms: {
      version: 'terms-2',
      url: 'https://menta.quest/terms',
      effectiveAt: '2026-08-01T00:00:00.000Z',
    },
    privacy: {
      version: 'privacy-2',
      url: 'https://menta.quest/privacy',
      effectiveAt: '2026-08-01T00:00:00.000Z',
    },
    community_standards: {
      version: 'community-2',
      url: 'https://menta.quest/community',
      effectiveAt: '2026-08-01T00:00:00.000Z',
    },
  },
  enforcement: { promiseCreationRequired: true },
  receipt: null,
};

const acceptedLegalStatus = {
  ...legalStatus,
  accepted: true,
  requiresAcceptance: false,
  reason: 'current' as const,
  receipt: {
    id: 'receipt-1',
    acceptedAt: '2026-08-31T00:00:00.000Z',
    surface: 'account_creation' as const,
    appVersion: '1.9.3',
    appBuild: '151',
    platform: 'ios' as const,
    locale: 'en-NZ',
  },
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => {
  const useAuthStore = (
    selector: (state: Record<string, unknown>) => unknown
  ) =>
    selector({
      user: mockUser,
      completeOnboarding: mockCompleteOnboarding,
    });
  useAuthStore.getState = () => ({ user: mockUser });
  return { useAuthStore };
});

jest.mock('@/store/invite-store', () => {
  const useInviteStore = (
    selector: (state: Record<string, unknown>) => unknown
  ) => selector({ pending: mockPendingInvite });
  useInviteStore.getState = () => ({
    pending: mockPendingInvite,
    claimPendingForUser: mockClaimPromise,
    dismissPending: mockDismissPromise,
  });
  return { useInviteStore };
});

jest.mock('@/store/protected-route-store', () => ({
  useProtectedRouteStore: (
    selector: (state: Record<string, unknown>) => unknown
  ) => selector({ pending: mockPendingProtectedRoute }),
}));

jest.mock('@/lib/invites/inbound-invite-entry', () => ({
  claimPendingEventInviteEntryForUser: (...args: unknown[]) =>
    mockClaimEvent(...args),
  dismissPendingEventInviteEntry: (...args: unknown[]) =>
    mockDismissEvent(...args),
  loadInboundInviteReceipt: (...args: unknown[]) => mockLoadReceipt(...args),
  projectPendingEventInviteEntry: (...args: unknown[]) =>
    mockProjectEvent(...args),
}));

jest.mock('@/lib/legal-acceptance', () => ({
  acceptCurrentLegalDocuments: (...args: unknown[]) => mockAcceptLegal(...args),
  getMyLegalAcceptanceStatus: (...args: unknown[]) => mockGetLegal(...args),
}));

jest.mock('@/components/legal/LegalDocumentLinks', () => {
  const { Text } = require('react-native');
  return { LegalDocumentLinks: () => <Text>Current Menta documents</Text> };
});

jest.mock('@/components/onboarding/NotificationPrivacyOnboarding', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    NotificationPrivacyOnboarding: ({
      onComplete,
    }: {
      onComplete: () => void;
    }) => (
      <View>
        <Text>Choose promise reminders</Text>
        <Pressable accessibilityRole="button" onPress={onComplete}>
          <Text>Continue without reminders</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    AppButton: ({
      disabled,
      onPress,
      testID,
      title,
    }: {
      disabled?: boolean;
      onPress: () => void;
      testID?: string;
      title: string;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
      >
        <Text>{title}</Text>
      </Pressable>
    ),
    AppInlineNotice: ({
      actionLabel,
      description,
      onAction,
      title,
    }: {
      actionLabel?: string;
      description: string;
      onAction?: () => void;
      title: string;
    }) => (
      <View>
        <Text>{title}</Text>
        <Text>{description}</Text>
        {actionLabel ? (
          <Pressable accessibilityRole="button" onPress={onAction}>
            <Text>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    ),
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    AppTopBar: () => null,
    SkeletonButton: () => <View />,
    SkeletonLoader: () => <View />,
  };
});

jest.mock('@/components/ui/icons', () => ({ CheckIcon: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { id: 'user-a' };
  mockPendingInvite = {
    type: 'challenge',
    code: 'BOOK2026',
    timestamp: 1_000,
    ownerUserId: null,
  };
  mockPendingProtectedRoute = null;
  mockLoadReceipt.mockResolvedValue({
    kind: 'ready',
    value: {
      kind: 'promise',
      promise: {
        promiseTitle: 'Read before bed',
        inviterName: 'Alex',
        promiseDescription: null,
        proofRule: 'Show the book',
        durationDays: 14,
        role: 'reviewer',
      },
    },
  });
  mockGetLegal.mockResolvedValue(legalStatus);
  mockAcceptLegal.mockResolvedValue(acceptedLegalStatus);
  mockClaimPromise.mockReturnValue(mockPendingInvite);
  mockClaimEvent.mockReturnValue(true);
  mockCompleteOnboarding.mockResolvedValue(undefined);
});

describe('invite-first activation', () => {
  it('accepts exact current legal versions before optional notification education', async () => {
    render(<InviteActivationRoute />);

    expect(await screen.findByText('Alex invited you.')).toBeTruthy();
    const continueButton = screen.getByTestId('invite-activation-continue');
    expect(continueButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('invite-activation-legal-confirmation'));
    fireEvent.press(continueButton);

    await waitFor(() =>
      expect(mockAcceptLegal).toHaveBeenCalledWith(
        legalStatus,
        'account_creation',
        'user-a'
      )
    );
    expect(await screen.findByText('Choose promise reminders')).toBeTruthy();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('lets reminders remain off, then completes without creating a personal promise', async () => {
    mockGetLegal.mockResolvedValue(acceptedLegalStatus);
    render(<InviteActivationRoute />);

    fireEvent.press(await screen.findByTestId('invite-activation-continue'));
    fireEvent.press(await screen.findByText('Continue without reminders'));

    await waitFor(() =>
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1)
    );
    expect(mockClaimPromise).toHaveBeenCalledWith('user-a');
    expect(mockAcceptLegal).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/invite-activation');
  });

  it('keeps a named group, member role and proof consequence through account setup', async () => {
    mockPendingInvite = {
      type: 'group',
      code: 'GROUP2026',
      timestamp: 1_000,
      ownerUserId: null,
    };
    mockGetLegal.mockResolvedValue(acceptedLegalStatus);
    mockLoadReceipt.mockResolvedValue({
      kind: 'ready',
      value: {
        kind: 'group',
        group: {
          status: 'ACTIVE',
          inviteCode: 'GROUP2026',
          groupId: 'group-1',
          groupName: 'Morning walkers',
          groupDescription: null,
          privacy: 'private',
          memberCount: 4,
          inviterName: 'Mia',
          sharedPromise: 'Walk after work.',
          expiresAt: '2026-09-08T00:00:00.000Z',
          isMember: false,
        },
      },
    });
    render(<InviteActivationRoute />);

    expect(await screen.findByText('Mia invited you')).toBeTruthy();
    expect(screen.getByText('Morning walkers')).toBeTruthy();
    expect(screen.getByText('Member')).toBeTruthy();
    expect(screen.getByText('Invite only')).toBeTruthy();
    expect(
      screen.getByText(
        'Members post proof. Another eligible member reviews it.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('invite-activation-continue'));
    fireEvent.press(await screen.findByText('Continue without reminders'));

    await waitFor(() =>
      expect(mockClaimPromise).toHaveBeenCalledWith('user-a')
    );
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
  });

  it('binds an event capability to the authenticated account without consuming it', async () => {
    mockPendingInvite = null;
    mockPendingProtectedRoute = {
      path: '/events/11111111-1111-4111-8111-111111111111?inviteToken=opaque_event_capability_1234567890',
      source: 'deep_link',
      timestamp: 1_000,
      ownerUserId: null,
    };
    mockGetLegal.mockResolvedValue(acceptedLegalStatus);
    mockLoadReceipt.mockResolvedValue({
      kind: 'ready',
      value: {
        kind: 'event',
        event: {
          eventId: '11111111-1111-4111-8111-111111111111',
          title: 'Sunday park walk',
        },
      },
    });
    render(<InviteActivationRoute />);

    fireEvent.press(await screen.findByTestId('invite-activation-continue'));
    fireEvent.press(await screen.findByText('Continue without reminders'));

    await waitFor(() =>
      expect(mockClaimEvent).toHaveBeenCalledWith({
        pendingRoute: mockPendingProtectedRoute,
        eventId: '11111111-1111-4111-8111-111111111111',
        userId: 'user-a',
      })
    );
    expect(mockDismissEvent).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
  });

  it('does not complete onboarding while the invitation check is retryable', async () => {
    mockLoadReceipt.mockResolvedValue({
      kind: 'retry',
      message: 'Menta could not check this invitation.',
    });
    render(<InviteActivationRoute />);

    expect(await screen.findByText('Setup could not load')).toBeTruthy();
    expect(mockDismissPromise).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });
});
