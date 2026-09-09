import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import ArchivedGroupsScreen from '@/app/archived-groups';
import GroupMembersScreen from '@/app/group-members';
import GroupSettingsScreen from '@/app/group-settings';

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
const mockAuth = { user: { id: 'user-1' } };
const mockGroupState = {
  deleteGroup: jest.fn(),
  fetchArchivedGroups: jest.fn(),
  fetchGroupMembers: jest.fn(),
  fetchGroups: jest.fn(),
  groupMembers: {} as Record<string, unknown[]>,
  groups: [] as unknown[],
  leaveGroup: jest.fn(),
  shareGroup: jest.fn(),
};
const mockSupabaseEq = jest.fn();
const mockSupabaseUpdate = jest.fn(() => ({ eq: mockSupabaseEq }));

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'group-1' }),
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(() => mockAuth, {
    getState: () => mockAuth,
  }),
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: Object.assign(() => mockGroupState, {
    getState: () => mockGroupState,
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ update: mockSupabaseUpdate }),
  },
}));

jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
  notificationAsync: jest.fn(),
}));

jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return {
    AppButton: ({
      disabled,
      loading,
      onPress,
      title,
      testID,
    }: {
      disabled?: boolean;
      loading?: boolean;
      onPress: () => void;
      title: string;
      testID?: string;
    }) => (
      <Pressable
        accessibilityLabel={title}
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={onPress}
        testID={testID}
      >
        <Text>{title}</Text>
      </Pressable>
    ),
    AppInlineNotice: ({
      description,
      title,
      testID,
    }: {
      description: string;
      title: string;
      testID?: string;
    }) => (
      <View testID={testID}>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    ),
    Avatar: () => <View />,
    SkeletonLoader: () => <View />,
  };
});

jest.mock('@/components/ui/AppFields', () => {
  const { Text, TextInput, View } = jest.requireActual('react-native');
  return {
    AppTextField: ({
      label,
      onChangeText,
      value,
    }: {
      label?: string;
      onChangeText: (value: string) => void;
      value: string;
    }) => (
      <View>
        <Text>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          onChangeText={onChangeText}
          value={value}
        />
      </View>
    ),
  };
});

jest.mock('@/components/ui/SimpleBottomSheet', () => {
  const { View } = jest.requireActual('react-native');
  return {
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
        <View>
          {scrollableBody ?? children}
          {footer}
        </View>
      ) : null,
  };
});

jest.mock('@/components/ui/ConfirmDestructiveSheet', () => () => null);

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    CheckIcon: Icon,
    ChevronLeftIcon: Icon,
    ChevronRightIcon: Icon,
    CopyIcon: Icon,
    FileTextIcon: Icon,
    GlobeIcon: Icon,
    LockIcon: Icon,
    MoreVerticalIcon: Icon,
    RefreshCcwIcon: Icon,
    Share2Icon: Icon,
    Trash2Icon: Icon,
    UsersIcon: Icon,
  };
});

const ownerGroup = {
  archived_at: null,
  created_at: '2026-08-01T00:00:00.000Z',
  current_streak: 0,
  description: 'Walk before work.',
  duration_days: 30,
  id: 'group-1',
  name: 'Morning Miles',
  notify_on_member_miss: true,
  owner_id: 'user-1',
  privacy: 'public',
  status: 'active' as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.user = { id: 'user-1' };
  mockGroupState.groups = [ownerGroup];
  mockGroupState.groupMembers = {
    'group-1': [
      {
        groupId: 'group-1',
        joinedAt: '2026-08-01T00:00:00.000Z',
        role: 'owner',
        userId: 'user-1',
        username: 'Maya',
      },
      {
        groupId: 'group-1',
        joinedAt: '2026-08-02T00:00:00.000Z',
        role: 'member',
        userId: 'member-2',
        username: 'Ari',
      },
    ],
  };
  mockGroupState.fetchGroups.mockResolvedValue(undefined);
  mockGroupState.fetchGroupMembers.mockResolvedValue(undefined);
  mockGroupState.fetchArchivedGroups.mockResolvedValue([]);
  mockSupabaseEq.mockResolvedValue({ error: null });
});

describe('Groups admin and archive production routes', () => {
  it('keeps archive failure honest and retries the same archive request', async () => {
    mockGroupState.fetchArchivedGroups.mockRejectedValueOnce(
      new Error('offline')
    );
    render(<ArchivedGroupsScreen />);
    await waitFor(() =>
      expect(screen.getByText("Archived groups couldn't load")).toBeTruthy()
    );
    expect(
      screen.getByText(
        'Nothing changed. Try again when your connection is stable.'
      )
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Try again'));
    await waitFor(() =>
      expect(mockGroupState.fetchArchivedGroups).toHaveBeenCalledTimes(2)
    );
  });

  it('retains an unsaved settings draft until the owner explicitly discards it', async () => {
    render(<GroupSettingsScreen />);
    await waitFor(() => expect(screen.getByText('Who can join')).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText('Group name'), 'Early Miles');
    fireEvent.press(screen.getByTestId('group-settings-screen-back'));
    expect(screen.getByText('Discard changes?')).toBeTruthy();
    fireEvent.press(screen.getByText('Keep editing'));
    expect(screen.getByDisplayValue('Early Miles')).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('announces a failed settings load without claiming the screen is synced', async () => {
    mockGroupState.fetchGroups.mockRejectedValueOnce(new Error('offline'));

    render(<GroupSettingsScreen />);

    const alert = await screen.findByRole('alert');
    expect(screen.getByText('Could not load settings')).toBeTruthy();
    expect(screen.getByText('offline')).toBeTruthy();
    expect(screen.queryByText('Synced')).toBeNull();
    expect(alert.props.accessibilityLabel).toBe(
      'Could not load settings. offline'
    );
    expect(alert.props.accessibilityLiveRegion).toBe('polite');
  });

  it('keeps the local draft and reports an unknown result when refreshed settings do not match the save receipt', async () => {
    render(<GroupSettingsScreen />);
    await waitFor(() => expect(screen.getByText('Who can join')).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText('Group name'), 'Early Miles');
    fireEvent.press(screen.getByText('Save changes'));

    await waitFor(() =>
      expect(screen.getByText('Save not confirmed')).toBeTruthy()
    );
    expect(
      screen.getByText(
        'Menta could not confirm whether the settings were saved. Your edits are still here. Check the group before trying again.'
      )
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Early Miles')).toBeTruthy();
    expect(screen.queryByText('Changes saved')).toBeNull();
  });

  it('renders a legacy secret group as one invitation-only choice', async () => {
    mockGroupState.groups = [{ ...ownerGroup, privacy: 'secret' }];
    render(<GroupSettingsScreen />);
    await waitFor(() => expect(screen.getByText('Who can join')).toBeTruthy());
    fireEvent.press(screen.getByText('Only people you invite'));

    const privacyChoices = screen.getAllByRole('radio');
    expect(privacyChoices).toHaveLength(2);
    expect(privacyChoices[1].props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it('canonicalises a legacy secret group to private when its owner saves', async () => {
    mockGroupState.groups = [{ ...ownerGroup, privacy: 'secret' }];
    render(<GroupSettingsScreen />);
    await waitFor(() => expect(screen.getByText('Who can join')).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText('Group name'), 'Early Miles');
    fireEvent.press(screen.getByText('Save changes'));

    await waitFor(() =>
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ privacy: 'private' })
      )
    );
  });

  it('routes invite management to the canonical invite flow', async () => {
    render(<GroupSettingsScreen />);
    await waitFor(() => expect(screen.getByText('Invitations')).toBeTruthy());
    fireEvent.press(screen.getByText('Manage invite'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/group-invite',
      params: { groupId: 'group-1', groupName: 'Morning Miles' },
    });
  });

  it('opens the canonical invite flow directly from the owner member list', async () => {
    render(<GroupMembersScreen />);
    await screen.findByRole('header', { name: 'Members' });

    fireEvent.press(screen.getByLabelText('Invite people'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/group-invite',
      params: { groupId: 'group-1', groupName: 'Morning Miles' },
    });
  });

  it('does not show an old account archive result after the account switches', async () => {
    let resolveFirstArchive: (groups: unknown[]) => void = () => undefined;
    const firstArchive = new Promise<unknown[]>(resolve => {
      resolveFirstArchive = resolve;
    });
    mockGroupState.fetchArchivedGroups.mockImplementationOnce(
      () => firstArchive
    );
    const view = render(<ArchivedGroupsScreen />);
    await waitFor(() =>
      expect(mockGroupState.fetchArchivedGroups).toHaveBeenCalledWith('user-1')
    );

    mockAuth.user = { id: 'user-2' };
    view.rerender(<ArchivedGroupsScreen />);
    await waitFor(() =>
      expect(mockGroupState.fetchArchivedGroups).toHaveBeenLastCalledWith(
        'user-2'
      )
    );

    await act(async () => {
      resolveFirstArchive([
        { ...ownerGroup, archived_at: '2026-08-01T00:00:00.000Z' },
      ]);
      await Promise.resolve();
    });

    expect(screen.queryByText('Morning Miles')).toBeNull();
    expect(screen.getByText('No archived groups')).toBeTruthy();
  });

  it('renders an authorised member view without exposing role controls', async () => {
    mockGroupState.groupMembers = {
      'group-1': [
        {
          groupId: 'group-1',
          joinedAt: '2026-08-01T00:00:00.000Z',
          role: 'owner',
          userId: 'owner-2',
          username: 'Maya',
        },
        {
          groupId: 'group-1',
          joinedAt: '2026-08-02T00:00:00.000Z',
          role: 'member',
          userId: 'user-1',
          username: 'Ari',
        },
      ],
    };
    render(<GroupMembersScreen />);
    await screen.findByRole('header', { name: 'Members' });
    expect(screen.getByLabelText('Open actions for Maya')).toBeTruthy();
    expect(screen.queryByText('Invite people')).toBeNull();
  });
});
