import React from 'react';
import { render, screen } from '@testing-library/react-native';

import EventAttendeeAlbumScreen from '@/app/events/[eventId]/album';
import EventRecapScreen from '@/app/events/[eventId]/recap';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OCCURRENCE_ID = '22222222-2222-4222-8222-222222222222';

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
const mockLoadAttendeeAlbum = jest.fn();
const mockLoadOrganiserRecap = jest.fn();
let mockRouteParams: Record<string, string> = {};
let mockAuthUser: { id: string } | null = { id: 'user-1' };
let mockEventState: Record<string, unknown> = {};

jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');
  return {
    Stack: { Screen: () => null },
    useFocusEffect: (callback: () => void) =>
      React.useEffect(callback, [callback]),
    useLocalSearchParams: () => mockRouteParams,
    useRouter: () => mockRouter,
  };
});

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
      title,
    }: {
      disabled?: boolean;
      loading?: boolean;
      onPress: () => void;
      title: string;
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={onPress}
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

jest.mock('@/components/events/EventAlbumMosaic', () => {
  const { Text, View } = require('react-native');
  return {
    EventAlbumMosaic: ({ items }: { items: unknown[] }) => (
      <View testID="event-album-mosaic">
        <Text>{items.length} signed photos</Text>
      </View>
    ),
  };
});

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    ArrowLeftIcon: Icon,
    CheckIcon: Icon,
    ImageIcon: Icon,
    Share2Icon: Icon,
    ShieldCheckIcon: Icon,
  };
});

const emptyAlbum = {
  eventId: EVENT_ID,
  occurrenceId: OCCURRENCE_ID,
  eventTitle: 'Harbour Run Club',
  viewerRole: 'attendee' as const,
  viewerCanPost: false,
  downloadsAllowed: false as const,
  approvedPostCount: 0,
  items: [],
};

const emptyRecap = {
  eventId: EVENT_ID,
  occurrenceId: OCCURRENCE_ID,
  eventTitle: 'Harbour Run Club',
  endedAt: '2026-08-05T07:30:00.000Z',
  timeZone: 'Pacific/Auckland',
  counts: { joined: 12, checkedIn: 9, posted: 7, verified: 6 },
  approvedPostCount: 0,
  albumItems: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = { id: 'user-1' };
  mockEventState = {
    attendeeAlbum: null,
    attendeeAlbumAccountId: null,
    attendeeAlbumOccurrenceId: null,
    attendeeAlbumLoading: false,
    attendeeAlbumError: null,
    loadAttendeeAlbum: mockLoadAttendeeAlbum,
    organiserRecap: null,
    organiserRecapAccountId: null,
    organiserRecapEventId: null,
    organiserRecapLoading: false,
    organiserRecapError: null,
    loadOrganiserRecap: mockLoadOrganiserRecap,
  };
});

describe('event attendee album route', () => {
  beforeEach(() => {
    mockRouteParams = { eventId: EVENT_ID, occurrenceId: OCCURRENCE_ID };
  });

  it('renders a confirmed empty album as a purposeful state', () => {
    mockEventState = {
      ...mockEventState,
      attendeeAlbum: emptyAlbum,
      attendeeAlbumAccountId: 'user-1',
      attendeeAlbumOccurrenceId: OCCURRENCE_ID,
    };

    render(<EventAttendeeAlbumScreen />);

    expect(screen.getByTestId('event-album-empty')).toBeTruthy();
    expect(screen.getByText('No approved photos yet.')).toBeTruthy();
    expect(screen.getByText('Downloads')).toBeTruthy();
    expect(screen.getByText('Photo posting')).toBeTruthy();
    expect(
      screen.getByText('From the start until two hours after it ends')
    ).toBeTruthy();
    expect(screen.getByText('Off')).toBeTruthy();
    expect(screen.queryByTestId('event-album-load-error')).toBeNull();
  });

  it('does not present an unconfirmed read failure as an empty album', () => {
    mockEventState = {
      ...mockEventState,
      attendeeAlbumAccountId: 'user-1',
      attendeeAlbumOccurrenceId: OCCURRENCE_ID,
      attendeeAlbumError: 'Private album read failed.',
    };

    render(<EventAttendeeAlbumScreen />);

    expect(screen.getByTestId('event-album-load-error')).toBeTruthy();
    expect(screen.queryByTestId('event-album-empty')).toBeNull();
  });
});

describe('event organiser recap route', () => {
  beforeEach(() => {
    mockRouteParams = { eventId: EVENT_ID };
  });

  it('renders only organiser-scoped server totals and a confirmed empty album', () => {
    mockEventState = {
      ...mockEventState,
      organiserRecap: emptyRecap,
      organiserRecapAccountId: 'user-1',
      organiserRecapEventId: EVENT_ID,
    };

    render(<EventRecapScreen />);

    expect(screen.getByText('9 people showed up.')).toBeTruthy();
    expect(screen.getByText('Joined')).toBeTruthy();
    expect(screen.getByText('Checked in')).toBeTruthy();
    expect(screen.getByText('Photos sent')).toBeTruthy();
    expect(screen.getByText('Photos approved')).toBeTruthy();
    expect(screen.getByTestId('event-recap-empty-album')).toBeTruthy();
    expect(screen.queryByText(/Paper fixture/i)).toBeNull();
  });

  it('keeps recap failure distinct from a zero-count completed recap', () => {
    mockEventState = {
      ...mockEventState,
      organiserRecapAccountId: 'user-1',
      organiserRecapEventId: EVENT_ID,
      organiserRecapError: 'Organiser recap read failed.',
    };

    render(<EventRecapScreen />);

    expect(screen.getByTestId('event-recap-load-error')).toBeTruthy();
    expect(screen.queryByTestId('event-recap-empty-album')).toBeNull();
  });
});
