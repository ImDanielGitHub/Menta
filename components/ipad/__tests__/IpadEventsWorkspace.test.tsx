import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  IpadEventsWorkspace,
  type IpadEventsWorkspaceItem,
} from '@/components/ipad/IpadEventsWorkspace';

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

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return { UsersIcon: Icon };
});

const openOrganiserPass = jest.fn();
const openParticipantEvent = jest.fn();

const items: IpadEventsWorkspaceItem[] = [
  {
    key: 'authored-harbour-run',
    section: 'authored',
    title: 'Harbour Run Club',
    description: 'A social run around the waterfront.',
    when: 'Mon, 24 Aug, 9:00 am',
    venue: 'Silo Park',
    capacity: '60',
    context: 'Public · Organiser pass',
    actionLabel: 'Open organiser pass for Harbour Run Club',
    actionHint: 'Opens the organiser pass.',
    onOpen: openOrganiserPass,
  },
  {
    key: 'upcoming-park-walk',
    section: 'upcoming',
    title: 'Sunday park walk',
    description: 'A relaxed walk through Albert Park.',
    when: 'Sun, 30 Aug, 10:30 am',
    venue: 'Albert Park',
    capacity: '9 places left',
    context: 'Public',
    actionLabel: 'View Sunday park walk',
    actionHint: 'Opens the event.',
    onOpen: openParticipantEvent,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('iPad events workspace', () => {
  it('selects an event without navigating and opens it only from the explicit action', () => {
    render(
      <IpadEventsWorkspace
        authoredLabel="Your events"
        items={items}
        onRefresh={jest.fn()}
        refreshing={false}
        upcomingLabel="Upcoming"
      />
    );

    expect(screen.getByTestId('ipad-events-workspace')).toBeTruthy();
    expect(
      screen.getByTestId('ipad-event-detail-authored-harbour-run')
    ).toBeTruthy();
    expect(screen.getByText('Silo Park')).toBeTruthy();

    fireEvent.press(screen.getByTestId('ipad-event-select-upcoming-park-walk'));

    expect(openParticipantEvent).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('ipad-event-detail-upcoming-park-walk')
    ).toBeTruthy();
    expect(screen.getByText('Albert Park')).toBeTruthy();
    expect(screen.getByText('9 places left')).toBeTruthy();

    fireEvent.press(screen.getByTestId('ipad-event-open-upcoming-park-walk'));
    expect(openParticipantEvent).toHaveBeenCalledTimes(1);
    expect(openOrganiserPass).not.toHaveBeenCalled();
  });
});
