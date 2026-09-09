import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Share } from 'react-native';

import EventRulesScreen from '@/app/events/create/rules';
import { buildEventLink } from '@/lib/events/links';
import {
  clearAllEventCapabilitiesForTests,
  peekEventCapability,
} from '@/lib/events/event-capability-holder';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OCCURRENCE_ID = '22222222-2222-4222-8222-222222222222';
const CLIENT_EVENT_ID = '33333333-3333-4333-8333-333333333333';
const SHARE_CAPABILITY = 's'.repeat(32);
const CHECK_IN_TOKEN = 'private-organiser-check-in-token';
const mockClipboard = jest.fn();
const mockPublishEvent = jest.fn();
const mockLoadDraft = jest.fn();
const mockSaveDraft = jest.fn();
const mockClearDraft = jest.fn();
const mockSaveRecovery = jest.fn();
const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

const draft = {
  version: 3 as const,
  ownerUserId: 'user-1',
  name: 'Harbour Run Club',
  date: '2026-08-24',
  startTime: '09:00',
  durationMinutes: 90 as const,
  description: 'A waterfront run.',
  visibility: 'unlisted' as const,
  location: 'Silo Park',
  capacity: '60',
  publishClientEventId: null,
  updatedAt: '2026-08-10T01:00:00.000Z',
};

const createdData = {
  summary: {
    eventId: EVENT_ID,
    occurrenceId: OCCURRENCE_ID,
    title: draft.name,
    description: draft.description,
    venueName: draft.location,
    startsAt: '2026-08-23T21:00:00.000Z',
    endsAt: '2026-08-23T22:30:00.000Z',
    timeZone: 'Pacific/Auckland',
    consentVersion: 'attendance-v1',
    visibility: draft.visibility,
    occurrenceState: 'scheduled',
    capacity: 60,
    reservedCount: 0,
  },
  publishedAt: '2026-08-10T01:05:00.000Z',
  shareToken: SHARE_CAPABILITY,
  inviteToken: null,
  organiserCheckInCode: CHECK_IN_TOKEN,
  checkInExpiresAt: '2026-08-23T22:30:00.000Z',
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: unknown[]) => mockClipboard(...args),
}));

jest.mock('@/lib/client-event-id', () => ({
  createClientEventId: () => CLIENT_EVENT_ID,
}));

jest.mock('@/lib/events/create-draft', () => ({
  buildEventCreateSchedule: () => ({
    ok: true,
    startsAt: '2026-08-23T21:00:00.000Z',
    endsAt: '2026-08-23T22:30:00.000Z',
    timeZone: 'Pacific/Auckland',
  }),
  canReuseEventCreatePublishClientEventId: () => false,
  clearEventCreateDraft: (...args: unknown[]) => mockClearDraft(...args),
  isActiveEventCreateDraftRequest: (
    active: { ownerUserId: string | null; requestId: number },
    request: { ownerUserId: string | null; requestId: number }
  ) =>
    active.ownerUserId === request.ownerUserId &&
    active.requestId === request.requestId,
  loadEventCreateDraft: (...args: unknown[]) => mockLoadDraft(...args),
  saveEventCreateDraft: (...args: unknown[]) => mockSaveDraft(...args),
}));

jest.mock('@/lib/events/publish-recovery', () => ({
  saveEventPublishRecovery: (...args: unknown[]) => mockSaveRecovery(...args),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/store/event-store', () => ({
  useEventStore: (
    selector: (state: { publishEvent: typeof mockPublishEvent }) => unknown
  ) => selector({ publishEvent: mockPublishEvent }),
}));

jest.mock('@/components/events/EventCheckInPass', () => {
  const React = require('react') as typeof import('react');
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    EventCheckInPass: () =>
      React.createElement(Text, null, 'Organiser check-in code'),
  };
});

jest.mock('@/components/ui', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, TextInput, View } =
    require('react-native') as typeof import('react-native');

  return {
    AppButton: ({
      accessibilityHint,
      disabled,
      onPress,
      title,
    }: {
      accessibilityHint?: string;
      disabled?: boolean;
      onPress: () => void;
      title: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityHint,
          accessibilityLabel: title,
          accessibilityRole: 'button',
          disabled,
          onPress,
        },
        React.createElement(Text, null, title)
      ),
    AppCard: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppFieldRow: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    AppInlineNotice: ({
      description,
      title,
    }: {
      description: string;
      title: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description)
      ),
    AppScreen: ({
      children,
      contentLane,
    }: {
      children: React.ReactNode;
      contentLane?: boolean;
    }) =>
      React.createElement(
        View,
        {
          accessibilityLabel: contentLane
            ? 'Canonical content lane'
            : undefined,
        },
        children
      ),
    AppTextField: ({
      accessibilityLabel,
      onChangeText,
      value,
    }: {
      accessibilityLabel: string;
      onChangeText: (value: string) => void;
      value: string;
    }) =>
      React.createElement(TextInput, {
        accessibilityLabel,
        onChangeText,
        value,
      }),
    SkeletonText: () => React.createElement(View, { testID: 'rules-skeleton' }),
  };
});

const publishCompletedEvent = async () => {
  render(<EventRulesScreen />);
  await screen.findByLabelText('Event meeting place');
  fireEvent.press(screen.getByRole('button', { name: 'Publish event' }));
  await screen.findByText('Your event is published.');
};

describe('event publish receipt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllEventCapabilitiesForTests();
    mockClipboard.mockResolvedValue(true);
    mockLoadDraft.mockResolvedValue(draft);
    mockSaveDraft.mockImplementation(async input => ({
      ...draft,
      ...input,
      version: 3,
      updatedAt: '2026-08-10T01:01:00.000Z',
    }));
    mockClearDraft.mockResolvedValue(undefined);
    mockSaveRecovery.mockResolvedValue(undefined);
    mockPublishEvent.mockResolvedValue({
      action: 'create_event',
      outcome: 'completed',
      code: 'EVENT_CREATED',
      message: 'Event created.',
      clientEventId: CLIENT_EVENT_ID,
      retryable: false,
      idempotent: true,
      data: createdData,
    });
    jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows one factual published receipt and keeps capabilities off-screen', async () => {
    await publishCompletedEvent();
    const eventLink = buildEventLink({
      eventId: EVENT_ID,
      capability: { kind: 'share', token: SHARE_CAPABILITY },
    });

    expect(
      screen.getByText(
        'The organiser code for Harbour Run Club is on this phone. Attendees scan it to record attendance. It does not approve their photos.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Published event')).toBeNull();
    expect(screen.queryByText(CHECK_IN_TOKEN)).toBeNull();
    expect(screen.queryByText(eventLink)).toBeNull();

    const buttonNames = screen
      .getAllByRole('button')
      .map(button => button.props.accessibilityLabel);
    expect(buttonNames).toEqual([
      'Share event',
      'Copy event link',
      'Copy check-in code',
      'Open published event',
      'Back to events',
    ]);

    fireEvent.press(screen.getByRole('button', { name: 'Share event' }));
    await waitFor(() =>
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({ url: eventLink })
      )
    );

    fireEvent.press(screen.getByRole('button', { name: 'Copy event link' }));
    await waitFor(() => expect(mockClipboard).toHaveBeenCalledWith(eventLink));

    fireEvent.press(screen.getByRole('button', { name: 'Copy check-in code' }));
    await waitFor(() =>
      expect(mockClipboard).toHaveBeenCalledWith(CHECK_IN_TOKEN)
    );
    expect(
      screen.getByRole('button', { name: 'Copy check-in code' }).props
        .accessibilityHint
    ).toBe('Use this when an attendee cannot scan the QR code.');
  });

  it('shows a truthful failure when the native share sheet cannot open', async () => {
    jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('unavailable'));
    await publishCompletedEvent();

    fireEvent.press(screen.getByRole('button', { name: 'Share event' }));

    expect(
      await screen.findByText('Menta could not open the share sheet.')
    ).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Menta could not open the share sheet.'
    );
    expect(screen.queryByText('Event sent')).toBeNull();
  });

  it('opens the published event with a private capability and safe params', async () => {
    await publishCompletedEvent();

    fireEvent.press(
      screen.getByRole('button', { name: 'Open published event' })
    );

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
});
