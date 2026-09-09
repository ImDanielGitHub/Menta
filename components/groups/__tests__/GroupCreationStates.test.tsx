import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import {
  FirstGroupCreatedReceipt,
  GroupTemplatePickerSheet,
  SelectedGroupStartingPoint,
} from '@/components/groups/GroupCreationStates';

jest.mock('@/components/ui/SimpleBottomSheet', () => ({
  SimpleBottomSheet: ({
    children,
    scrollableBody,
    footer,
    visible,
  }: {
    children?: React.ReactNode;
    scrollableBody?: React.ReactNode;
    footer?: React.ReactNode;
    visible: boolean;
  }) =>
    visible ? (
      <>
        {scrollableBody ?? children}
        {footer}
      </>
    ) : null,
}));

describe('group creation Paper states', () => {
  it('lets a person choose one of the three group shapes', () => {
    const onSelect = jest.fn();
    const screen = render(
      <GroupTemplatePickerSheet
        visible
        onClose={jest.fn()}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('Choose a starting point')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Study'));
    expect(onSelect).toHaveBeenCalledWith('study_block');
  });

  it('explains the selected starting point and lets the person change it', () => {
    const onChange = jest.fn();
    const screen = render(
      <SelectedGroupStartingPoint
        description="Get outside early for a short walk."
        onChange={onChange}
        title="Morning walk"
      />
    );

    expect(screen.getByText('Starting point')).toBeTruthy();
    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(screen.queryByText(/prepares the group name/i)).toBeNull();
    fireEvent.press(
      screen.getByRole('button', { name: 'Change starting point' })
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps first-group actions separate and visible', () => {
    const onInvitePeople = jest.fn();
    const onCreateGroupPromise = jest.fn();
    const onOpenGroup = jest.fn();
    const screen = render(
      <FirstGroupCreatedReceipt
        groupName="After-work walkers"
        onInvitePeople={onInvitePeople}
        onCreateGroupPromise={onCreateGroupPromise}
        onOpenGroup={onOpenGroup}
      />
    );

    expect(
      screen.getByText('The group is saved. No invitations have been sent.')
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Invite people'));
    fireEvent.press(screen.getByText('Add first promise'));
    fireEvent.press(screen.getByText('Open group'));
    expect(onInvitePeople).toHaveBeenCalledTimes(1);
    expect(onCreateGroupPromise).toHaveBeenCalledTimes(1);
    expect(onOpenGroup).toHaveBeenCalledTimes(1);
  });

  it('can render the saved receipt without a second action stack', () => {
    const screen = render(
      <FirstGroupCreatedReceipt
        groupName="After-work walkers"
        showActions={false}
      />
    );

    expect(screen.getByText('After-work walkers is ready.')).toBeTruthy();
    expect(screen.queryByText('Add first promise')).toBeNull();
    expect(screen.queryByText('Invite people')).toBeNull();
    expect(screen.queryByText('Open group')).toBeNull();
  });

  it('shows the actual linked first promise in the group record', () => {
    const screen = render(
      <FirstGroupCreatedReceipt
        groupName="After-work walkers"
        linkedPromiseTitle="Walk for 20 minutes after work, then note what changed."
        linkedPromiseDurationDays={14}
        showActions={false}
      />
    );

    expect(screen.getByText('Group details')).toBeTruthy();
    expect(screen.getByText('First promise')).toBeTruthy();
    expect(
      screen.getByText(
        'Walk for 20 minutes after work, then note what changed.'
      ).props.numberOfLines
    ).toBe(3);
    expect(screen.getByText('14 days')).toBeTruthy();
    expect(screen.queryByText('Add first promise')).toBeNull();
  });
});
