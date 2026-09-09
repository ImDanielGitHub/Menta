import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { GroupSharedPromisesEmptyState } from '@/components/groups/GroupSharedPromisesEmptyState';

jest.mock('@/components/ui/MentaMascot', () => {
  const { View } = jest.requireActual('react-native');
  return {
    MentaMascot: ({ testID }: { testID?: string }) => <View testID={testID} />,
  };
});

describe('GroupSharedPromisesEmptyState', () => {
  it('uses the existing mascot and exposes the two next actions', () => {
    const onAddPromise = jest.fn();
    const onInvitePeople = jest.fn();

    render(
      <GroupSharedPromisesEmptyState
        canManage
        onAddPromise={onAddPromise}
        onInvitePeople={onInvitePeople}
      />
    );

    expect(
      screen.getByTestId('group-shared-promises-empty-mascot')
    ).toBeTruthy();
    expect(screen.getByText('No shared promises yet')).toBeTruthy();
    expect(
      screen.getByText(
        'Add the first promise so everyone knows what to do and what proof counts.'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('Nothing is due until the first promise is live.')
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Add first promise' }));
    fireEvent.press(screen.getByRole('button', { name: 'Invite people' }));

    expect(onAddPromise).toHaveBeenCalledTimes(1);
    expect(onInvitePeople).toHaveBeenCalledTimes(1);
  });

  it('does not offer authoring actions to a read-only viewer', () => {
    render(
      <GroupSharedPromisesEmptyState
        canManage={false}
        onAddPromise={jest.fn()}
        onInvitePeople={jest.fn()}
      />
    );

    expect(screen.queryByText('Add first promise')).toBeNull();
    expect(screen.queryByText('Invite people')).toBeNull();
  });
});
