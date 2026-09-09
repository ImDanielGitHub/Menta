import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import EventProofScreen from '@/app/events/[eventId]/proof';
import {
  clearAllEventCapabilitiesForTests,
  holdEventCapability,
} from '@/lib/events/event-capability-holder';
import { listEventUploadQueue } from '@/lib/events/upload-queue';
import type {
  EventMyOccurrence,
  EventOwnPost,
  EventSummary,
} from '@/types/event';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OCCURRENCE_ID = '22222222-2222-4222-8222-222222222222';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockLoadSummary = jest.fn();
const mockLoadMyOccurrence = jest.fn();
const mockSubmitPost = jest.fn();
const mockResumePost = jest.fn();
let mockAuthUser: { id: string } | null = { id: 'user-1' };
let mockEventState: Record<string, unknown> = {};

const summary: EventSummary = {
  eventId: EVENT_ID,
  occurrenceId: OCCURRENCE_ID,
  title: 'Harbour Run Club',
  description: 'A social run along the waterfront.',
  venueName: 'Silo Park',
  startsAt: '2026-08-23T21:00:00.000Z',
  endsAt: '2026-08-23T22:30:00.000Z',
  timeZone: 'Pacific/Auckland',
  consentVersion: 'attendance-v1',
  visibility: 'public',
  occurrenceState: 'ended',
  capacity: null,
  reservedCount: 12,
};

const rejectedPost: EventOwnPost = {
  postId: '33333333-3333-4333-8333-333333333333',
  occurrenceId: OCCURRENCE_ID,
  status: 'rejected',
  revision: 2,
  caption: 'Finishing the waterfront loop.',
  mediaPath: 'private/event-photo.jpg',
  contentType: 'image/jpeg',
  byteSize: 1_024,
  createdAt: '2026-08-23T22:00:00.000Z',
  reviewedAt: '2026-08-23T22:10:00.000Z',
  reviewNote: 'Show more of the event location.',
};

const rejectedOccurrence: EventMyOccurrence = {
  summary,
  attendance: {
    attendanceId: 'attendance-1',
    occurrenceId: OCCURRENCE_ID,
    state: 'joined',
    consentVersion: 'attendance-v1',
    joinedAt: '2026-08-20T09:15:00.000Z',
    checkedInAt: '2026-08-23T21:05:00.000Z',
    checkInMethod: 'rotating_qr',
  },
  ownPosts: [rejectedPost],
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ eventId: EVENT_ID }),
  useRouter: () => mockRouter,
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: typeof mockAuthUser }) => unknown) =>
    selector({ user: mockAuthUser }),
}));

jest.mock('@/store/event-store', () => ({
  useEventStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockEventState),
}));

jest.mock('@/lib/events/upload-queue', () => ({
  listEventUploadQueue: jest.fn(),
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
    ArrowLeftIcon: Icon,
    ImageIcon: Icon,
  };
});

const mockedListEventUploadQueue = listEventUploadQueue as jest.MockedFunction<
  typeof listEventUploadQueue
>;

beforeEach(() => {
  jest.clearAllMocks();
  clearAllEventCapabilitiesForTests();
  mockAuthUser = { id: 'user-1' };
  mockedListEventUploadQueue.mockResolvedValue([]);
  mockLoadSummary.mockResolvedValue({
    outcome: 'completed',
    code: 'EVENT_SUMMARY',
    data: summary,
  });
  mockLoadMyOccurrence.mockResolvedValue({
    outcome: 'completed',
    code: 'EVENT_MY_OCCURRENCE',
    data: rejectedOccurrence,
  });
  mockEventState = {
    summary,
    myOccurrence: rejectedOccurrence,
    loading: false,
    error: null,
    loadSummary: mockLoadSummary,
    loadMyOccurrence: mockLoadMyOccurrence,
    submitPost: mockSubmitPost,
    resumePost: mockResumePost,
  };
});

describe('event proof recovery states', () => {
  it('announces an unavailable event without swallowing its recovery actions', async () => {
    mockLoadSummary.mockResolvedValue({
      outcome: 'failed',
      code: 'EVENT_NOT_FOUND',
      data: null,
    });
    mockEventState = {
      ...mockEventState,
      summary: null,
      myOccurrence: null,
      error: 'This event is no longer active.',
    };
    mockedListEventUploadQueue.mockResolvedValue([
      {
        userId: 'user-1',
        clientEventId: '44444444-4444-4444-8444-444444444444',
        eventId: EVENT_ID,
        occurrenceId: OCCURRENCE_ID,
        localUri: 'file:///event-proof.jpg',
        caption: null,
        contentType: 'image/jpeg',
        byteSize: 1_024,
        status: 'saved_local',
        postId: null,
        storagePath: null,
        lastReceiptCode: null,
        lastError: null,
        createdAt: '2026-08-23T22:12:00.000Z',
        updatedAt: '2026-08-23T22:12:00.000Z',
      },
    ]);

    render(<EventProofScreen />);

    expect(
      screen.getByRole('alert', {
        name: 'This event is unavailable. This event is no longer active.',
      })
    ).toBeTruthy();
    expect(
      await screen.findByTestId('event-unavailable-local-photo')
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Find another event' }));
    expect(mockRouter.replace).toHaveBeenCalledWith('/events');

    fireEvent.press(screen.getByRole('button', { name: 'Back to Today' }));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('keeps the rejected evidence facts separate from replacement actions', async () => {
    render(<EventProofScreen />);

    expect(await screen.findByText("This photo wasn't approved.")).toBeTruthy();
    expect(
      screen.getByRole('summary', {
        name: 'Event photo not approved. Check-in remains confirmed. Organiser note: Show more of the event location.',
      })
    ).toBeTruthy();
    expect(screen.getByTestId('event-proof-needs-evidence')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Replace event photo' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Keep this result' })
    ).toBeTruthy();
    expect(screen.queryByText('Send photo for review')).toBeNull();

    await waitFor(() => {
      expect(mockLoadMyOccurrence).toHaveBeenCalledWith(OCCURRENCE_ID);
    });
  });

  it('opens the event photo picker without broad library permission', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    render(<EventProofScreen />);

    fireEvent.press(
      await screen.findByRole('button', { name: 'Replace event photo' })
    );

    await waitFor(() =>
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1)
    );
    expect(
      ImagePicker.requestMediaLibraryPermissionsAsync
    ).not.toHaveBeenCalled();
  });

  it('returns to event detail without putting the held capability in params', async () => {
    const capability = 'opaque_event_capability_1234567890';
    holdEventCapability({
      ownerUserId: 'user-1',
      eventId: EVENT_ID,
      surface: 'proof',
      kind: 'share',
      token: capability,
    });

    render(<EventProofScreen />);
    fireEvent.press(await screen.findByLabelText('Back to event'));

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/events/[eventId]',
      params: { eventId: EVENT_ID },
    });
    expect(JSON.stringify(mockRouter.replace.mock.calls)).not.toContain(
      capability
    );
    expect(JSON.stringify(mockRouter.replace.mock.calls)).not.toContain(
      'shareToken'
    );
  });
});
