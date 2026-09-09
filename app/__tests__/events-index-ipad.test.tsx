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

const FIRST_EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_EVENT_ID = '22222222-2222-4222-8222-222222222222';
const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockLoadPublicEvents = jest.fn().mockResolvedValue(undefined);

const mockPublicEvents: EventDiscovery[] = [
  {
    eventId: FIRST_EVENT_ID,
    occurrenceId: '33333333-3333-4333-8333-333333333333',
    title: 'Harbour Run Club',
    description: 'A social run around the waterfront.',
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
    eventId: SECOND_EVENT_ID,
    occurrenceId: '44444444-4444-4444-8444-444444444444',
    title: 'Sunday park walk',
    description: 'A relaxed walk through Albert Park.',
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

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('@/components/ipad/ipad-workspace', () => {
  const actual = jest.requireActual('@/components/ipad/ipad-workspace');
  return { ...actual, useIPadPortraitWorkspace: () => true };
});

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) =>
    selector({ user: null }),
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
      <Pressable onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => ({
  AppInlineNotice: () => null,
}));

jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => null,
  SkeletonText: () => null,
}));

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    ArrowRightIcon: Icon,
    ChevronLeftIcon: Icon,
    UsersIcon: Icon,
  };
});

const mockedListEventPublishRecoveries =
  listEventPublishRecoveries as jest.MockedFunction<
    typeof listEventPublishRecoveries
  >;

beforeEach(() => {
  jest.clearAllMocks();
  mockedListEventPublishRecoveries.mockResolvedValue([]);
});

describe('events iPad layout', () => {
  it('uses a master-detail workspace and keeps selection separate from navigation', async () => {
    expect(mockPublicEvents[1]?.eventId).toBe(SECOND_EVENT_ID);
    render(<EventsIndexScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('ipad-events-workspace')).toBeTruthy();
    });
    expect(
      screen.getByTestId(
        'ipad-event-detail-upcoming-33333333-3333-4333-8333-333333333333'
      )
    ).toBeTruthy();

    fireEvent.press(
      screen.getByTestId(
        'ipad-event-select-upcoming-44444444-4444-4444-8444-444444444444'
      )
    );

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(
      screen.getByTestId(
        'ipad-event-detail-upcoming-44444444-4444-4444-8444-444444444444'
      )
    ).toBeTruthy();
    expect(screen.getByText('Albert Park')).toBeTruthy();
    expect(screen.getByText('No attendee limit')).toBeTruthy();

    fireEvent.press(
      screen.getByTestId(
        'ipad-event-open-upcoming-44444444-4444-4444-8444-444444444444'
      )
    );
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/events/[eventId]',
      params: { eventId: SECOND_EVENT_ID },
    });
  });
});
