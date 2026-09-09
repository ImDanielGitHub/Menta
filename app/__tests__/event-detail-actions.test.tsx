import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import EventDetailScreen from '@/app/events/[eventId]';
import {
  clearAllEventCapabilitiesForTests,
  holdEventCapability,
  peekEventCapability,
} from '@/lib/events/event-capability-holder';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import {
  getEventJoinHelperCopy,
  getEventJoinedReceiptCopy,
} from '@/lib/events/check-in-window';
import { EVENT_PHOTO_POSTING_AGREEMENT_COPY } from '@/lib/events/posting-window';
import type { EventMyOccurrence, EventSummary } from '@/types/event';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OCCURRENCE_ID = '22222222-2222-4222-8222-222222222222';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockLoadSummary = jest.fn();
const mockLoadMyOccurrence = jest.fn();
const mockLoadOrganiserReviewQueue = jest.fn();
const mockJoinEvent = jest.fn();
let mockAuthUser: { id: string } | null = { id: 'user-1' };
let mockEventState: Record<string, unknown> = {};

const summary: EventSummary = {
  eventId: EVENT_ID,
  occurrenceId: OCCURRENCE_ID,
  title: 'Sunday park walk',
  description: 'A relaxed loop through the park.',
  venueName: 'Albert Park',
  startsAt: '2026-08-24T21:00:00.000Z',
  endsAt: '2026-08-24T22:30:00.000Z',
  timeZone: 'Pacific/Auckland',
  consentVersion: 'attendance-v1',
  visibility: 'public',
  occurrenceState: 'scheduled',
  capacity: null,
  reservedCount: 3,
};

const noAttendance: EventMyOccurrence = {
  summary,
  attendance: null,
  ownPosts: [],
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ eventId: EVENT_ID }),
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: typeof mockAuthUser }) => unknown) =>
    selector({ user: mockAuthUser }),
}));

jest.mock('@/store/event-store', () => ({
  useEventStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockEventState),
}));

jest.mock('@/components/ui/AppShell', () => {
  const { View } = require('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/AppButton', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AppButton: ({
      disabled,
      loading,
      onPress,
      testID,
      title,
    }: {
      disabled?: boolean;
      loading?: boolean;
      onPress: () => void;
      testID?: string;
      title: string;
    }) => (
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={onPress}
        testID={testID}
      >
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const { Text, View } = require('react-native');
  return {
    AppInlineNotice: ({
      description,
      testID,
      title,
    }: {
      description: string;
      testID?: string;
      title: string;
    }) => (
      <View testID={testID}>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    ),
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => {
  const { View } = require('react-native');
  return {
    SkeletonLoader: () => <View testID="skeleton" />,
    SkeletonText: () => <View testID="skeleton-text" />,
  };
});

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    ArrowLeftIcon: Icon,
    CheckIcon: Icon,
    ClockIcon: Icon,
    RefreshCwIcon: Icon,
    TargetIcon: Icon,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  clearAllEventCapabilitiesForTests();
  useProtectedRouteStore.setState({ pending: null });
  mockAuthUser = { id: 'user-1' };
  mockLoadSummary.mockResolvedValue({
    outcome: 'completed',
    code: 'EVENT_SUMMARY',
    data: summary,
  });
  mockLoadMyOccurrence.mockResolvedValue({
    outcome: 'completed',
    code: 'EVENT_MY_OCCURRENCE',
    data: noAttendance,
  });
  mockJoinEvent.mockResolvedValue({
    outcome: 'completed',
    code: 'EVENT_JOINED',
    data: null,
  });
  mockEventState = {
    summary,
    myOccurrence: null,
    loading: false,
    error: null,
    loadSummary: mockLoadSummary,
    loadMyOccurrence: mockLoadMyOccurrence,
    loadOrganiserReviewQueue: mockLoadOrganiserReviewQueue,
    joinEvent: mockJoinEvent,
  };
});

describe('event detail role-aware actions', () => {
  it('makes the organiser pass the organiser primary action and removes the join CTA', async () => {
    mockLoadOrganiserReviewQueue.mockResolvedValue({
      outcome: 'completed',
      code: 'EVENT_ORGANISER_REVIEW_QUEUE',
      data: { items: [] },
    });

    render(<EventDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('open-organiser-pass')).toBeTruthy();
    });
    expect(screen.queryByText('Review agreement')).toBeNull();
    expect(
      screen.queryByText(
        'Joining records your attendance. Check-in and event proof happen separately.'
      )
    ).toBeNull();

    const actionLabels = screen
      .getAllByRole('button')
      .map(button => button.props.accessibilityLabel);
    expect(actionLabels).toEqual(['Back to events', 'Open organiser pass']);

    fireEvent.press(screen.getByTestId('open-organiser-pass'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/events/[eventId]/organiser-pass',
      params: { eventId: EVENT_ID },
    });
  });

  it('keeps the agreement as the unaffiliated attendee action with plain receipt copy', async () => {
    mockLoadOrganiserReviewQueue.mockResolvedValue({
      outcome: 'failed',
      code: 'FORBIDDEN',
      data: null,
    });

    render(<EventDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('review-event-agreement')).toBeTruthy();
    });
    expect(screen.getByText(getEventJoinHelperCopy())).toBeTruthy();
    expect(screen.queryByText('Open organiser pass')).toBeNull();

    fireEvent.press(screen.getByTestId('review-event-agreement'));
    expect(screen.getByText('Review your attendance.')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta checks the latest event terms before confirming your place.'
      )
    ).toBeTruthy();
    expect(screen.getByText(EVENT_PHOTO_POSTING_AGREEMENT_COPY)).toBeTruthy();
    expect(screen.queryByText(/server/i)).toBeNull();
  });

  it('keeps the no-duplicate safety instruction with a server unknown message', async () => {
    mockLoadOrganiserReviewQueue.mockResolvedValue({
      outcome: 'failed',
      code: 'FORBIDDEN',
      data: null,
    });
    mockJoinEvent.mockResolvedValue({
      outcome: 'unknown_result',
      code: 'EVENT_JOIN_UNKNOWN',
      message: 'The attendance receipt is still being checked.',
    });

    render(<EventDetailScreen />);
    fireEvent.press(await screen.findByTestId('review-event-agreement'));
    fireEvent.press(await screen.findByText('Agree and join'));

    expect(
      await screen.findByText(
        'The attendance receipt is still being checked. Do not start a second join. Check this request again first.'
      )
    ).toBeTruthy();
  });

  it('shows a human joined receipt without implementation language', async () => {
    mockLoadOrganiserReviewQueue.mockResolvedValue({
      outcome: 'failed',
      code: 'FORBIDDEN',
      data: null,
    });
    mockEventState = {
      ...mockEventState,
      myOccurrence: {
        summary,
        attendance: {
          attendanceId: 'attendance-1',
          occurrenceId: OCCURRENCE_ID,
          state: 'joined',
          consentVersion: 'attendance-v1',
          joinedAt: '2026-08-20T09:15:00.000Z',
          checkedInAt: null,
          checkInMethod: null,
        },
        ownPosts: [],
      },
    };

    render(<EventDetailScreen />);

    expect(await screen.findByText('You’re going.')).toBeTruthy();
    expect(screen.getByText(/Your place is confirmed/)).toBeTruthy();
    expect(screen.getByText(getEventJoinedReceiptCopy())).toBeTruthy();
    expect(screen.queryByText(/server-owned/i)).toBeNull();
    expect(screen.queryByText(/read model/i)).toBeNull();
  });

  it('moves a held capability to check-in without adding it to router params', async () => {
    const capability = 'opaque_event_capability_1234567890';
    holdEventCapability({
      ownerUserId: 'user-1',
      eventId: EVENT_ID,
      surface: 'detail',
      kind: 'invite',
      token: capability,
    });
    mockLoadOrganiserReviewQueue.mockResolvedValue({
      outcome: 'failed',
      code: 'FORBIDDEN',
      data: null,
    });
    mockEventState = {
      ...mockEventState,
      myOccurrence: {
        summary,
        attendance: {
          attendanceId: 'attendance-1',
          occurrenceId: OCCURRENCE_ID,
          state: 'joined',
          consentVersion: 'attendance-v1',
          joinedAt: '2026-08-20T09:15:00.000Z',
          checkedInAt: null,
          checkInMethod: null,
        },
        ownPosts: [],
      },
    };

    render(<EventDetailScreen />);
    fireEvent.press(await screen.findByText('Enter organiser code'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/events/[eventId]/check-in',
      params: { eventId: EVENT_ID },
    });
    expect(JSON.stringify(mockRouter.push.mock.calls)).not.toContain(
      capability
    );
    expect(JSON.stringify(mockRouter.push.mock.calls)).not.toContain(
      'inviteToken'
    );
  });

  it('moves a held capability to proof without adding it to router params', async () => {
    const capability = 'opaque_event_capability_1234567890';
    holdEventCapability({
      ownerUserId: 'user-1',
      eventId: EVENT_ID,
      surface: 'detail',
      kind: 'share',
      token: capability,
    });
    mockLoadOrganiserReviewQueue.mockResolvedValue({
      outcome: 'failed',
      code: 'FORBIDDEN',
      data: null,
    });
    mockEventState = {
      ...mockEventState,
      myOccurrence: {
        summary,
        attendance: {
          attendanceId: 'attendance-1',
          occurrenceId: OCCURRENCE_ID,
          state: 'joined',
          consentVersion: 'attendance-v1',
          joinedAt: '2026-08-20T09:15:00.000Z',
          checkedInAt: '2026-08-24T21:05:00.000Z',
          checkInMethod: 'organiser_code',
        },
        ownPosts: [],
      },
    };

    render(<EventDetailScreen />);
    fireEvent.press(await screen.findByText('Add event photo'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/events/[eventId]/proof',
      params: { eventId: EVENT_ID },
    });
    expect(JSON.stringify(mockRouter.push.mock.calls)).not.toContain(
      capability
    );
    expect(JSON.stringify(mockRouter.push.mock.calls)).not.toContain(
      'shareToken'
    );
  });

  it('does not hydrate or consume a persisted capability from an uncommitted render', () => {
    const capability = 'opaque_event_capability_1234567890';
    useProtectedRouteStore.setState({
      pending: {
        path: `/events/${EVENT_ID}?inviteToken=${capability}`,
        source: 'onboarding_gate',
        timestamp: Date.now(),
        ownerUserId: 'user-1',
      },
    });
    const AbortRender = () => {
      throw new Error('abort before commit');
    };
    const UncommittedTree = () => (
      <>
        <EventDetailScreen />
        <AbortRender />
      </>
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<UncommittedTree />)).toThrow('abort before commit');

    expect(useProtectedRouteStore.getState().pending).not.toBeNull();
    expect(
      peekEventCapability({
        ownerUserId: 'user-1',
        eventId: EVENT_ID,
        surface: 'detail',
      })
    ).toBeNull();
    expect(mockLoadSummary).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
