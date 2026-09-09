import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Share } from 'react-native';

import EventOrganiserPassScreen from '@/app/events/[eventId]/organiser-pass';
import { buildEventLink } from '@/lib/events/links';
import { loadEventPublishRecovery } from '@/lib/events/publish-recovery';
import {
  clearAllEventCapabilitiesForTests,
  peekEventCapability,
} from '@/lib/events/event-capability-holder';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SHARE_CAPABILITY = 'a'.repeat(32);
const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockPublishEvent = jest.fn();
const mockClipboard = jest.fn();
let mockAuthUser: { id: string } | null = { id: 'user-1' };
const recovery = {
  version: 1 as const,
  ownerUserId: 'user-1',
  eventId: EVENT_ID,
  input: {
    clientEventId: '22222222-2222-4222-8222-222222222222',
    title: 'Harbour Run Club',
    description: null,
    venueName: 'Silo Park',
    timeZone: 'Pacific/Auckland',
    visibility: 'unlisted' as const,
    startsAt: '2026-08-23T21:00:00.000Z',
    endsAt: '2026-08-23T22:30:00.000Z',
    capacity: 60,
  },
  updatedAt: '2026-08-09T01:00:00.000Z',
};
const createdData = {
  summary: {
    eventId: EVENT_ID,
    occurrenceId: '33333333-3333-4333-8333-333333333333',
    title: recovery.input.title,
    description: null,
    venueName: recovery.input.venueName,
    startsAt: recovery.input.startsAt,
    endsAt: recovery.input.endsAt,
    timeZone: recovery.input.timeZone,
    consentVersion: 'attendance-v1',
    visibility: recovery.input.visibility,
    occurrenceState: 'scheduled',
    capacity: recovery.input.capacity,
    reservedCount: 0,
  },
  publishedAt: '2026-08-09T01:00:00.000Z',
  shareToken: SHARE_CAPABILITY,
  inviteToken: null,
  organiserCheckInCode: 'organiser-check-in-code',
  checkInExpiresAt: recovery.input.endsAt,
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ eventId: EVENT_ID }),
  useRouter: () => mockRouter,
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: unknown[]) => mockClipboard(...args),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: typeof mockAuthUser }) => unknown) =>
    selector({ user: mockAuthUser }),
}));

jest.mock('@/store/event-store', () => ({
  useEventStore: (
    selector: (state: { publishEvent: typeof mockPublishEvent }) => unknown
  ) => selector({ publishEvent: mockPublishEvent }),
}));

jest.mock('@/lib/events/publish-recovery', () => ({
  loadEventPublishRecovery: jest.fn(),
}));

jest.mock('@/components/events/EventCheckInPass', () => {
  const { Text } = require('react-native');
  return { EventCheckInPass: () => <Text>Event check-in pass</Text> };
});

jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    AppButton: ({
      accessibilityHint,
      onPress,
      title,
    }: {
      accessibilityHint?: string;
      onPress: () => void;
      title: string;
    }) => (
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={title}
        accessibilityRole="button"
        onPress={onPress}
      >
        <Text>{title}</Text>
      </Pressable>
    ),
    AppCard: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
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
    AppScreen: ({
      children,
      contentLane,
    }: {
      children: React.ReactNode;
      contentLane?: boolean;
    }) => (
      <View
        accessibilityLabel={contentLane ? 'Canonical content lane' : undefined}
      >
        {children}
      </View>
    ),
    AppTopBar: ({
      backLabel = 'Back',
      onBack,
      title,
    }: {
      backLabel?: string;
      onBack?: () => void;
      title?: string;
    }) => (
      <View>
        {onBack ? (
          <Pressable
            accessibilityLabel={backLabel}
            accessibilityRole="button"
            onPress={onBack}
          >
            <Text>Back</Text>
          </Pressable>
        ) : null}
        {title ? <Text>{title}</Text> : null}
      </View>
    ),
    SkeletonButton: () => <View testID="organiser-pass-skeleton-button" />,
    SkeletonLoader: () => <View testID="organiser-pass-skeleton" />,
  };
});

const mockedLoadEventPublishRecovery =
  loadEventPublishRecovery as jest.MockedFunction<
    typeof loadEventPublishRecovery
  >;

beforeEach(() => {
  jest.clearAllMocks();
  clearAllEventCapabilitiesForTests();
  mockAuthUser = { id: 'user-1' };
  mockClipboard.mockResolvedValue(true);
  jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: Share.dismissedAction });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('event organiser pass recovery', () => {
  it('leaves a retryable non-loading state when device storage rejects', async () => {
    mockedLoadEventPublishRecovery.mockRejectedValue(
      new Error('Storage unavailable')
    );

    render(<EventOrganiserPassScreen />);

    expect(screen.getByTestId('organiser-pass-skeleton')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('organiser-pass-storage-error')).toBeTruthy();
    });
    expect(screen.queryByTestId('organiser-pass-skeleton')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      expect(mockedLoadEventPublishRecovery).toHaveBeenCalledTimes(2);
    });
  });

  it('passes the recovery owner into replay after the storage await', async () => {
    mockedLoadEventPublishRecovery.mockResolvedValue(recovery);
    mockPublishEvent.mockResolvedValue({
      action: 'create_event',
      outcome: 'unknown_result',
      code: 'EVENT_ACCOUNT_CHANGED',
      message: 'The account changed.',
      clientEventId: recovery.input.clientEventId,
      data: null,
      retryable: true,
      idempotent: false,
    });

    render(<EventOrganiserPassScreen />);

    await waitFor(() => {
      expect(mockPublishEvent).toHaveBeenCalledWith(recovery.input, 'user-1');
    });
  });

  it('opens the recovered private event with its server capability', async () => {
    mockedLoadEventPublishRecovery.mockResolvedValue(recovery);
    mockPublishEvent.mockResolvedValue({
      action: 'create_event',
      outcome: 'completed',
      code: 'EVENT_CREATED',
      message: 'Event created.',
      clientEventId: recovery.input.clientEventId,
      retryable: false,
      idempotent: true,
      data: createdData,
    });

    render(<EventOrganiserPassScreen />);

    const openEvent = await screen.findByRole('button', {
      name: 'Open event',
    });
    fireEvent.press(openEvent);

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/events/[eventId]',
      params: { eventId: EVENT_ID },
    });
    expect(
      peekEventCapability({
        ownerUserId: 'user-1',
        eventId: EVENT_ID,
        surface: 'detail',
      })
    ).toMatchObject({ kind: 'share', token: SHARE_CAPABILITY });
    expect(JSON.stringify(mockRouter.replace.mock.calls)).not.toContain(
      SHARE_CAPABILITY
    );
  });

  it('keeps Back as navigation instead of hiding Open event in the chevron', async () => {
    mockedLoadEventPublishRecovery.mockResolvedValue(recovery);
    mockPublishEvent.mockResolvedValue({
      action: 'create_event',
      outcome: 'completed',
      code: 'EVENT_CREATED',
      message: 'Event created.',
      clientEventId: recovery.input.clientEventId,
      retryable: false,
      idempotent: true,
      data: createdData,
    });

    render(<EventOrganiserPassScreen />);

    await screen.findByRole('button', { name: 'Open event' });
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(
      peekEventCapability({
        ownerUserId: 'user-1',
        eventId: EVENT_ID,
        surface: 'detail',
      })
    ).toBeNull();
  });

  it('keeps the private tokens off-screen and puts share before copy', async () => {
    mockedLoadEventPublishRecovery.mockResolvedValue(recovery);
    mockPublishEvent.mockResolvedValue({
      action: 'create_event',
      outcome: 'completed',
      code: 'EVENT_CREATED',
      message: 'Event created.',
      clientEventId: recovery.input.clientEventId,
      retryable: false,
      idempotent: true,
      data: createdData,
    });
    const eventLink = buildEventLink({
      eventId: EVENT_ID,
      capability: { kind: 'share', token: SHARE_CAPABILITY },
    });

    render(<EventOrganiserPassScreen />);

    await screen.findByText(
      'Harbour Run Club is ready. Show this code to attendees when they arrive. It expires when the event ends.'
    );
    expect(screen.getByText('Check attendees in')).toBeTruthy();
    expect(screen.queryByText(createdData.organiserCheckInCode)).toBeNull();
    expect(screen.queryByText(eventLink)).toBeNull();
    expect(screen.queryByText('Event confirmed')).toBeNull();
    expect(screen.queryByText('Clipboard receipt')).toBeNull();

    const buttonNames = screen
      .getAllByRole('button')
      .map(button => button.props.accessibilityLabel);
    expect(buttonNames).toEqual([
      'Back',
      'Share event',
      'Copy event link',
      'Copy check-in code',
      'Open event',
    ]);

    fireEvent.press(screen.getByRole('button', { name: 'Share event' }));
    await waitFor(() =>
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({ url: eventLink })
      )
    );

    fireEvent.press(screen.getByRole('button', { name: 'Copy event link' }));
    await waitFor(() => expect(mockClipboard).toHaveBeenCalledWith(eventLink));
    expect(screen.getByText('Event link copied to this phone.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Copy check-in code' }));
    await waitFor(() =>
      expect(mockClipboard).toHaveBeenCalledWith(
        createdData.organiserCheckInCode
      )
    );
    expect(
      screen.getByRole('button', { name: 'Copy check-in code' }).props
        .accessibilityHint
    ).toBe('Use this when an attendee cannot scan the QR code.');
  });

  it('reports a share-sheet failure without claiming the event was sent', async () => {
    mockedLoadEventPublishRecovery.mockResolvedValue(recovery);
    mockPublishEvent.mockResolvedValue({
      action: 'create_event',
      outcome: 'completed',
      code: 'EVENT_CREATED',
      message: 'Event created.',
      clientEventId: recovery.input.clientEventId,
      retryable: false,
      idempotent: true,
      data: createdData,
    });
    jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('unavailable'));

    render(<EventOrganiserPassScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Share event' }));

    expect(
      await screen.findByText('Menta could not open the share sheet.')
    ).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Menta could not open the share sheet.'
    );
    expect(screen.queryByText('Event sent')).toBeNull();
  });
});
