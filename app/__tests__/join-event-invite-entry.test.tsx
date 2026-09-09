import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import JoinEventRoute from '@/app/join-event';
import type { EventSummary } from '@/types/event';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const CAPABILITY = 'opaque_event_capability_1234567890';
const mockRouter = { replace: jest.fn() };
const mockLoad = jest.fn();
const mockClaim = jest.fn();
const mockDismiss = jest.fn();
let mockUser: { id: string } | null = null;
let mockHasCompletedOnboarding = false;

const pendingRoute = {
  path: `/events/${EVENT_ID}?inviteToken=${CAPABILITY}`,
  source: 'deep_link' as const,
  timestamp: 1_000,
  ownerUserId: null,
};

const summary: EventSummary = {
  eventId: EVENT_ID,
  occurrenceId: '22222222-2222-4222-8222-222222222222',
  title: 'Sunday park walk',
  description: 'A relaxed loop through the park.',
  venueName: 'Albert Park',
  startsAt: '2026-09-06T21:00:00.000Z',
  endsAt: '2026-09-06T22:30:00.000Z',
  timeZone: 'Pacific/Auckland',
  consentVersion: 'attendance-v1',
  visibility: 'invite_only',
  occurrenceState: 'scheduled',
  capacity: 12,
  reservedCount: 3,
  inviterName: 'Mia',
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ eventId: EVENT_ID }),
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (
    selector: (state: {
      user: typeof mockUser;
      hasCompletedOnboarding: boolean;
    }) => unknown
  ) =>
    selector({
      user: mockUser,
      hasCompletedOnboarding: mockHasCompletedOnboarding,
    }),
}));

jest.mock('@/store/protected-route-store', () => ({
  useProtectedRouteStore: (
    selector: (state: { pending: unknown }) => unknown
  ) => selector({ pending: pendingRoute }),
}));

jest.mock('@/lib/invites/inbound-invite-entry', () => ({
  claimPendingEventInviteEntryForUser: (...args: unknown[]) =>
    mockClaim(...args),
  dismissPendingEventInviteEntry: (...args: unknown[]) => mockDismiss(...args),
  loadPendingEventInviteEntry: (...args: unknown[]) => mockLoad(...args),
}));

jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    AppButton: ({
      onPress,
      testID,
      title,
    }: {
      onPress: () => void;
      testID?: string;
      title: string;
    }) => (
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
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
    AppTopBar: ({
      backLabel,
      onBack,
      title,
    }: {
      backLabel: string;
      onBack: () => void;
      title: string;
    }) => (
      <View>
        <Text>{title}</Text>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>{backLabel}</Text>
        </Pressable>
      </View>
    ),
    SkeletonLoader: () => <View testID="skeleton" />,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = null;
  mockHasCompletedOnboarding = false;
  mockClaim.mockReturnValue(true);
  mockDismiss.mockReturnValue(true);
  mockLoad.mockResolvedValue({ kind: 'ready', value: summary });
});

describe('event invite entry route', () => {
  it('lets a new user inspect the authoritative event before onboarding', async () => {
    render(<JoinEventRoute />);

    expect(await screen.findByText('Mia invited you')).toBeTruthy();
    expect(screen.getByText('Sunday park walk')).toBeTruthy();
    expect(screen.getByText('Albert Park')).toBeTruthy();
    expect(screen.getByText('Attendance')).toBeTruthy();
    expect(screen.getByText('Invite-only event')).toBeTruthy();
    expect(
      screen.getByText(
        'Joining adds you to the attendee list. After you check in, you can post one photo from the start of the event until two hours after it ends. It appears under your Menta name in this event’s shared album.'
      )
    ).toBeTruthy();
    expect(screen.queryByText(CAPABILITY)).toBeNull();

    fireEvent.press(screen.getByTestId('join-event-continue'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    expect(mockClaim).not.toHaveBeenCalled();
  });

  it('lets an existing user review the agreement without auto-joining', async () => {
    mockUser = { id: 'user-a' };
    mockHasCompletedOnboarding = true;
    render(<JoinEventRoute />);

    fireEvent.press(await screen.findByTestId('join-event-continue'));

    expect(mockClaim).toHaveBeenCalledWith({
      pendingRoute,
      eventId: EVENT_ID,
      userId: 'user-a',
    });
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/events/[eventId]',
      params: { eventId: EVENT_ID },
    });
    expect(JSON.stringify(mockRouter.replace.mock.calls)).not.toContain(
      CAPABILITY
    );
  });

  it('preserves an authenticated invite while unfinished onboarding completes', async () => {
    mockUser = { id: 'user-a' };
    render(<JoinEventRoute />);

    fireEvent.press(await screen.findByTestId('join-event-continue'));
    expect(mockClaim).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/invite-activation');
  });

  it('dismisses only the visible entry and returns an existing user to events', async () => {
    mockUser = { id: 'user-a' };
    mockHasCompletedOnboarding = true;
    render(<JoinEventRoute />);

    fireEvent.press(await screen.findByTestId('join-event-not-now'));
    expect(mockDismiss).toHaveBeenCalledWith({
      pendingRoute,
      eventId: EVENT_ID,
      currentUserId: 'user-a',
    });
    expect(mockRouter.replace).toHaveBeenCalledWith('/events');
  });

  it('keeps a retryable preview held until a later authoritative check', async () => {
    mockLoad
      .mockResolvedValueOnce({
        kind: 'retry',
        message: 'Menta could not check this event invitation.',
      })
      .mockResolvedValueOnce({ kind: 'ready', value: summary });
    render(<JoinEventRoute />);

    fireEvent.press(await screen.findByText('Try again'));
    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2));
    expect(mockDismiss).not.toHaveBeenCalled();
    expect(await screen.findByText('Sunday park walk')).toBeTruthy();
  });

  it('preserves an account-bound or unavailable link until a signed-out user authenticates', async () => {
    mockLoad.mockResolvedValue({
      kind: 'sign_in_required',
      message: 'Sign in to complete this action and return here afterwards.',
    });
    render(<JoinEventRoute />);

    expect(await screen.findByText('Sign in to continue')).toBeTruthy();
    expect(mockDismiss).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('join-event-sign-in'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it('clears a confirmed terminal invitation without leaking its reason', async () => {
    mockUser = { id: 'user-a' };
    mockLoad.mockResolvedValue({
      kind: 'terminal',
      message:
        'This event invitation is no longer available. Ask the sender for a current link.',
    });
    render(<JoinEventRoute />);

    expect(
      await screen.findByText('Event invitation unavailable')
    ).toBeTruthy();
    await waitFor(() => expect(mockDismiss).toHaveBeenCalled());
    expect(screen.queryByText(/blocked|expired|used/i)).toBeNull();
  });
});
