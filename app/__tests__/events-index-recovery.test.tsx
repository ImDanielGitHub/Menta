import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import EventsIndexScreen from '@/app/events';
import { listEventPublishRecoveries } from '@/lib/events/publish-recovery';
import type { EventDiscovery } from '@/types/event';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_EVENT_ID = '55555555-5555-4555-8555-555555555555';
const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockLoadPublicEvents = jest.fn().mockResolvedValue(undefined);
let mockAuthUser: { id: string } | null = { id: 'user-1' };
let mockPublicEvents: EventDiscovery[] = [];

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: typeof mockAuthUser }) => unknown) =>
    selector({ user: mockAuthUser }),
}));

jest.mock('@/store/event-store', () => ({
  useEventStore: (
    selector: (state: {
      publicEvents: EventDiscovery[];
      publicEventsLoading: boolean;
      publicEventsError: null;
      loadPublicEvents: typeof mockLoadPublicEvents;
    }) => unknown
  ) =>
    selector({
      publicEvents: mockPublicEvents,
      publicEventsLoading: false,
      publicEventsError: null,
      loadPublicEvents: mockLoadPublicEvents,
    }),
}));

jest.mock('@/components/ui/AppButton', () => {
  const { Pressable, Text } = require('react-native');
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
  };
});

jest.mock('@/lib/events/publish-recovery', () => ({
  listEventPublishRecoveries: jest.fn(),
}));

jest.mock('@/components/ui/AppShell', () => {
  const { View } = require('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    AppInlineNotice: ({
      actionLabel,
      description,
      onAction,
      testID,
      title,
    }: {
      actionLabel?: string;
      description: string;
      onAction?: () => void;
      testID?: string;
      title: string;
    }) => (
      <View testID={testID}>
        <Text>{title}</Text>
        <Text>{description}</Text>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction}>
            <Text>{actionLabel}</Text>
          </Pressable>
        ) : null}
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
    ArrowRightIcon: Icon,
    ChevronLeftIcon: Icon,
  };
});

const mockedListEventPublishRecoveries =
  listEventPublishRecoveries as jest.MockedFunction<
    typeof listEventPublishRecoveries
  >;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = { id: 'user-1' };
  mockPublicEvents = [];
});

describe('events organiser recovery index', () => {
  it('shows private authored events after a cold start and opens the organiser pass', async () => {
    mockedListEventPublishRecoveries.mockResolvedValue([
      {
        version: 1,
        ownerUserId: 'user-1',
        eventId: EVENT_ID,
        input: {
          clientEventId: '22222222-2222-4222-8222-222222222222',
          title: 'Harbour Run Club',
          description: null,
          venueName: 'Silo Park',
          timeZone: 'Pacific/Auckland',
          visibility: 'unlisted',
          startsAt: '2026-08-23T21:00:00.000Z',
          endsAt: '2026-08-23T22:30:00.000Z',
          capacity: 60,
        },
        updatedAt: '2026-08-09T01:00:00.000Z',
      },
      {
        version: 1,
        ownerUserId: 'user-1',
        eventId: '33333333-3333-4333-8333-333333333333',
        input: {
          clientEventId: '44444444-4444-4444-8444-444444444444',
          title: 'Invite-only studio session',
          description: null,
          venueName: null,
          timeZone: 'Pacific/Auckland',
          visibility: 'invite_only',
          startsAt: '2026-08-24T21:00:00.000Z',
          endsAt: '2026-08-24T22:30:00.000Z',
          capacity: 12,
        },
        updatedAt: '2026-08-09T02:00:00.000Z',
      },
    ]);

    render(<EventsIndexScreen />);

    await waitFor(() => {
      expect(screen.getByTestId(`authored-event-${EVENT_ID}`)).toBeTruthy();
    });
    expect(screen.getByText('Your events')).toBeTruthy();
    expect(screen.getByText('Unlisted · Organiser pass')).toBeTruthy();
    expect(screen.getByText('Invite only · Organiser pass')).toBeTruthy();

    fireEvent.press(screen.getByTestId(`authored-event-${EVENT_ID}`));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/events/[eventId]/organiser-pass',
      params: { eventId: EVENT_ID },
    });
  });

  it('turns a storage failure into a retryable non-loading notice', async () => {
    mockedListEventPublishRecoveries.mockRejectedValue(
      new Error('Storage unavailable')
    );

    render(<EventsIndexScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('authored-events-refresh-error')).toBeTruthy();
    });
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      expect(mockedListEventPublishRecoveries).toHaveBeenCalledTimes(2);
    });
  });

  it('renders an authored public event once and keeps other public events under Upcoming', async () => {
    mockedListEventPublishRecoveries.mockResolvedValue([
      {
        version: 1,
        ownerUserId: 'user-1',
        eventId: EVENT_ID,
        input: {
          clientEventId: '22222222-2222-4222-8222-222222222222',
          title: 'Harbour Run Club',
          description: null,
          venueName: 'Silo Park',
          timeZone: 'Pacific/Auckland',
          visibility: 'public',
          startsAt: '2026-08-23T21:00:00.000Z',
          endsAt: '2026-08-23T22:30:00.000Z',
          capacity: 60,
        },
        updatedAt: '2026-08-09T01:00:00.000Z',
      },
    ]);
    mockPublicEvents = [
      {
        eventId: EVENT_ID,
        occurrenceId: '66666666-6666-4666-8666-666666666666',
        title: 'Harbour Run Club',
        description: null,
        venueName: 'Silo Park',
        startsAt: '2026-08-23T21:00:00.000Z',
        endsAt: '2026-08-23T22:30:00.000Z',
        timeZone: 'Pacific/Auckland',
        consentVersion: 'attendance-v1',
        visibility: 'public',
        occurrenceState: 'scheduled',
        capacity: 60,
        reservedCount: 12,
      },
      {
        eventId: OTHER_EVENT_ID,
        occurrenceId: '77777777-7777-4777-8777-777777777777',
        title: 'Sunday park walk',
        description: null,
        venueName: 'Albert Park',
        startsAt: '2026-08-24T21:00:00.000Z',
        endsAt: '2026-08-24T22:30:00.000Z',
        timeZone: 'Pacific/Auckland',
        consentVersion: 'attendance-v1',
        visibility: 'public',
        occurrenceState: 'scheduled',
        capacity: null,
        reservedCount: 3,
      },
    ];

    render(<EventsIndexScreen />);

    await waitFor(() => {
      expect(screen.getByTestId(`authored-event-${EVENT_ID}`)).toBeTruthy();
    });
    expect(screen.getAllByText('Harbour Run Club')).toHaveLength(1);
    expect(screen.queryByTestId(`event-row-${EVENT_ID}`)).toBeNull();
    expect(screen.getByTestId(`event-row-${OTHER_EVENT_ID}`)).toBeTruthy();
    expect(screen.getByText('Events')).toBeTruthy();
    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.queryByText('Show up together.')).toBeNull();
    expect(
      screen.queryByText(
        'Find the next place to turn intention into visible momentum.'
      )
    ).toBeNull();
    expect(screen.queryByText('UP NEXT')).toBeNull();
  });

  it('shows the plain empty hierarchy and routes its primary action to event creation', async () => {
    mockedListEventPublishRecoveries.mockResolvedValue([]);

    render(<EventsIndexScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('events-empty-state')).toBeTruthy();
    });
    expect(screen.getByText('Events')).toBeTruthy();
    expect(screen.getByText('No upcoming events')).toBeTruthy();
    expect(screen.getByText('Public events will appear here.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('create-event'));
    expect(mockRouter.push).toHaveBeenCalledWith('/events/create');
  });
});
