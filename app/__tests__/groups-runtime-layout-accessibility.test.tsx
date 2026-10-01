import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import GroupsScreen from '@/app/(tabs)/groups';
import GroupDetailRoute from '@/app/groups/[id]';
import { NavigationContext } from 'expo-router/react-navigation';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';
import type { Group } from '@/store/group-store';
import { supabase } from '@/lib/supabase';
import {
  buildGroupAccountabilitySnapshot,
  type GroupAccountabilitySnapshot,
} from '@/lib/loop/group-accountability-board';

const mockRouter = {
  back: jest.fn(),
  canGoBack: () => true,
  push: jest.fn(),
  replace: jest.fn(),
};
let mockFocused = true;
const mockFocusListeners = {
  focus: new Set<() => void>(),
  blur: new Set<() => void>(),
};
const mockNavigation = {
  isFocused: () => mockFocused,
  addListener: (event: 'focus' | 'blur', listener: () => void) => {
    mockFocusListeners[event].add(listener);
    return () => mockFocusListeners[event].delete(listener);
  },
};
const setRouteFocused = (focused: boolean) => {
  mockFocused = focused;
  mockFocusListeners[focused ? 'focus' : 'blur'].forEach(listener =>
    listener()
  );
};
const GroupDetailScreen = () => (
  <NavigationContext.Provider value={mockNavigation as never}>
    <GroupDetailRoute />
  </NavigationContext.Provider>
);

// Exercise Expo Router's real focus/blur/unmount lifecycle, replacing only its
// navigation event boundary rather than the cancellation implementation.
jest.mock('expo-router/react-navigation', () => ({
  ...jest.requireActual(
    'expo-router/build/react-navigation/core/NavigationContext'
  ),
  ...jest.requireActual(
    'expo-router/build/react-navigation/core/useFocusEffect'
  ),
}));
const mockFetchDiscoverGroups = jest.fn(() => Promise.resolve());
const mockFetchUserGroups = jest.fn(() => Promise.resolve());
const mockJoinGroup = jest.fn(() => Promise.resolve());
let mockGroupsListProps: {
  tab: string;
  fetchError: string | null;
  initialLoading: boolean;
} | null = null;
const mockGroupStoreState = {
  archiveFailedGroup: jest.fn(),
  deleteGroup: jest.fn(),
  joinGroup: jest.fn(),
  leaveGroup: jest.fn(),
  userGroups: [] as string[],
};
const mockGroupDetailState = { loaded: false };
let mockViewerId = 'user-1';
let mockBoardSnapshot: GroupAccountabilitySnapshot | undefined;
let mockGroupStatus = 'active';
let mockGroupKind: 'saved' | 'promise' = 'saved';
let mockGroupChallenges: Array<{
  id: string;
  title: string;
  description: string;
  verification_type: 'photo' | 'video' | 'text';
  added_to_group_at: string;
}> = [];

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'group-1' }),
  useRouter: () => mockRouter,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@/components/group/PublicGroupPreviewModal', () => () => null);

jest.mock('@/components/groups/GroupsListSection', () => {
  const React = jest.requireActual('react');
  const { Text, View } = jest.requireActual('react-native');

  return {
    GroupsListSection: (props: {
      tab: string;
      fetchError: string | null;
      initialLoading: boolean;
    }) => {
      mockGroupsListProps = props;
      return React.createElement(
        View,
        null,
        React.createElement(Text, null, `Showing ${props.tab} groups`),
        React.createElement(
          Text,
          null,
          props.fetchError ?? `${props.tab} groups ready`
        )
      );
    },
  };
});

jest.mock('@/hooks/useGroupCooldownCheck', () => ({
  useGroupCooldownCheck: () => jest.fn(() => Promise.resolve(false)),
}));

jest.mock('@/hooks/useGroupDetail', () => ({
  getGroupDetailErrorKind: () => 'unknown',
  useGroupDetailData: () =>
    mockGroupDetailState.loaded
      ? {
          challenges: mockGroupChallenges,
          error: null,
          errorKind: null,
          group: {
            id: 'group-1',
            name: 'Morning walk group',
            description: 'Meet each morning and keep the walk going together.',
            owner_id: 'user-1',
            status: mockGroupStatus,
            kind: mockGroupKind,
            duration_days: 30,
            current_streak: 4,
            created_at: '2026-08-01T00:00:00.000Z',
            member_count: 1,
            privacy: 'private',
          },
          hasCachedData: true,
          isError: false,
          isInitialLoading: false,
          isLoading: false,
          isPaused: false,
          isRefreshing: false,
          isStale: false,
          lastUpdatedAt: Date.parse('2026-08-11T00:00:00.000Z'),
          members: [
            {
              group_id: 'group-1',
              user_id: 'user-1',
              role: 'owner',
              joined_at: '2026-08-01T00:00:00.000Z',
              user: {
                id: 'user-1',
                username: 'daniel',
                display_name: 'Daniel',
                avatar_url: null,
                has_completed_onboarding: true,
              },
            },
            ...(mockBoardSnapshot
              ? [
                  {
                    group_id: 'group-1',
                    user_id: 'user-2',
                    role: 'member',
                    joined_at: '2026-08-01T00:00:00.000Z',
                    user: {
                      id: 'user-2',
                      username: 'sam',
                      display_name: 'Sam',
                      avatar_url: null,
                      has_completed_onboarding: true,
                    },
                  },
                ]
              : []),
          ],
          refetch: jest.fn(() => Promise.resolve()),
        }
      : {
          challenges: [],
          error: null,
          errorKind: null,
          group: null,
          hasCachedData: false,
          isError: false,
          isInitialLoading: true,
          isLoading: true,
          isPaused: false,
          isRefreshing: false,
          isStale: false,
          lastUpdatedAt: undefined,
          members: [],
          refetch: jest.fn(() => Promise.resolve()),
        },
}));

jest.mock('@/hooks/useGroupPendingReviews', () => ({
  useGroupPendingReviews: () => ({ data: 0 }),
}));

jest.mock('@/hooks/usePromiseAccountability', () => ({
  usePromiseAccountability: () => ({
    data: { members: [{ id: 'user-1', role: 'owner' }] },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useGroupAccountabilityBoard', () => ({
  useGroupAccountabilityBoard: () => ({
    data: mockBoardSnapshot,
    error: null,
    fetchStatus: 'idle',
    hasSnapshot: Boolean(mockBoardSnapshot),
    isError: false,
    isInitialLoading: false,
    lastUpdatedAt: undefined,
    refetch: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('@/lib/navigation/create-entry', () => ({
  openCreateGroup: jest.fn(),
  openCreateGroupChallenge: jest.fn(),
  openCreateSoloChallenge: jest.fn(),
}));

jest.mock('@/lib/navigation/pending-invite-open', () => ({
  resolvePendingInviteOpenAction: () => ({ kind: 'open_manual_entry' }),
}));

jest.mock('@/components/ui/Toast', () => ({
  showToast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: mockViewerId } }),
}));

jest.mock('@/store/invite-store', () => ({
  useInviteStore: (selector: (state: { pending: null }) => unknown) =>
    selector({ pending: null }),
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: (selector: (state: typeof mockGroupStoreState) => unknown) =>
    selector(mockGroupStoreState),
}));

jest.mock('@/store/selectors', () => ({
  useDiscoverGroupsState: () => ({ discoverGroups: [] }),
  useGroupActions: () => ({
    fetchDiscoverGroups: mockFetchDiscoverGroups,
    fetchUserGroups: mockFetchUserGroups,
    joinGroup: mockJoinGroup,
  }),
  useUserGroupsState: () => ({ groups: [] }),
}));

describe('Groups production-route geometry and accessibility', () => {
  afterEach(() => jest.restoreAllMocks());
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocused = true;
    mockFocusListeners.focus.clear();
    mockFocusListeners.blur.clear();
    mockFetchDiscoverGroups.mockResolvedValue(undefined);
    mockFetchUserGroups.mockResolvedValue(undefined);
    mockGroupsListProps = null;
    mockGroupDetailState.loaded = false;
    mockViewerId = 'user-1';
    mockGroupStatus = 'active';
    mockGroupKind = 'saved';
    mockGroupChallenges = [];
    mockBoardSnapshot = undefined;
    mockGroupStoreState.userGroups = [];
    mockGroupStoreState.archiveFailedGroup.mockReset();
    mockGroupStoreState.archiveFailedGroup.mockResolvedValue({
      success: true,
    });
  });

  it('exposes the Shared and Discover switch as selectable native controls', async () => {
    render(<GroupsScreen />);

    const expectedRole = Platform.OS === 'ios' ? 'button' : 'tab';
    const mine = await screen.findByLabelText('Shared');
    const discover = screen.getByLabelText('Discover');
    const switcher = screen.getByTestId('groups-tab-switcher');
    const titleStyle = StyleSheet.flatten(
      screen.getByText('Together').props.style
    );
    const mineStyle = StyleSheet.flatten(mine.props.style);
    const discoverStyle = StyleSheet.flatten(discover.props.style);
    const selectedTextStyle = StyleSheet.flatten(
      screen.getByText('Shared').props.style
    );
    const unselectedTextStyle = StyleSheet.flatten(
      screen.getByText('Discover').props.style
    );

    expect(titleStyle.fontSize).toBeGreaterThanOrEqual(32);
    expect(switcher).toHaveStyle({
      minHeight: mentaLayout.primaryControlHeight + 8,
      width: '100%',
    });
    expect(mineStyle.minHeight).toBeGreaterThanOrEqual(
      mentaLayout.primaryControlHeight
    );
    expect(mineStyle.flex).toBe(1);
    expect(discoverStyle.flex).toBe(1);
    expect(selectedTextStyle.fontSize).toBe(unselectedTextStyle.fontSize);
    expect(selectedTextStyle.lineHeight).toBe(unselectedTextStyle.lineHeight);
    expect(selectedTextStyle.fontSize).toBeGreaterThanOrEqual(17);
    expect(unselectedTextStyle.fontSize).toBeGreaterThanOrEqual(16);
    expect(mine).toHaveProp('accessibilityRole', expectedRole);
    expect(mine).toHaveProp('role', expectedRole);
    expect(mine).toHaveProp('accessibilityState', { selected: true });
    expect(mine).toHaveProp(
      'accessibilityHint',
      'Shows shared promises and saved groups.'
    );
    expect(discover).toHaveProp('accessibilityState', { selected: false });
    expect(discover).toHaveProp(
      'accessibilityHint',
      'Shows public groups you can join.'
    );
    expect(screen.getByText('Shared')).toHaveProp('accessible', false);
    expect(screen.getByText('Discover')).toHaveProp('accessible', false);
    expect(screen.getByTestId('groups-list-layout')).toHaveStyle({
      alignSelf: 'stretch',
      width: '100%',
    });
    expect(screen.queryByTestId('group-detail-ipad-workspace')).toBeNull();

    fireEvent.press(discover);

    await waitFor(() => {
      expect(screen.getByLabelText('Shared')).toHaveProp('accessibilityState', {
        selected: false,
      });
      expect(screen.getByLabelText('Discover')).toHaveProp(
        'accessibilityState',
        { selected: true }
      );
    });
    expect(screen.getByText('Showing discover groups')).toBeTruthy();
  });

  it('keeps Shared available when only Discover fails', async () => {
    mockFetchDiscoverGroups.mockRejectedValueOnce(
      new Error('Discover request failed')
    );

    render(<GroupsScreen />);

    await screen.findByText('Showing mine groups');
    expect(screen.getByText('mine groups ready')).toBeTruthy();
    expect(mockGroupsListProps).toEqual(
      expect.objectContaining({
        fetchError: null,
        initialLoading: false,
        tab: 'mine',
      })
    );

    fireEvent.press(screen.getByLabelText('Discover'));

    expect(await screen.findByText('Discover request failed')).toBeTruthy();
    expect(mockGroupsListProps).toEqual(
      expect.objectContaining({
        fetchError: 'Discover request failed',
        initialLoading: false,
        tab: 'discover',
      })
    );

    fireEvent.press(screen.getByLabelText('Shared'));
    expect(await screen.findByText('mine groups ready')).toBeTruthy();
  });

  it('uses an equipped theme for the persistent Together controls', async () => {
    render(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <GroupsScreen />
      </ThemeProvider>
    );

    const create = screen.getByLabelText('Invite someone into a promise');
    const mine = await screen.findByLabelText('Shared');

    expect(create).toHaveStyle({ backgroundColor: '#E7A86D' });
    expect(mine).toHaveStyle({ backgroundColor: '#E7A86D' });
    expect(screen.getByText('Shared')).toHaveStyle({ color: '#080909' });
  });

  it('keeps owned-group rows readable at large-phone scale', () => {
    const { GroupsListSection } = jest.requireActual<
      typeof import('@/components/groups/GroupsListSection')
    >('@/components/groups/GroupsListSection');
    const group: Group = {
      id: 'group-1',
      name: 'Morning crew',
      description: 'Walk before work',
      owner_id: 'user-1',
      status: 'active',
      duration_days: 14,
      current_streak: 3,
      created_at: '2026-08-01T00:00:00.000Z',
      member_count: 7,
      privacy: 'public',
    };

    render(
      <ThemeProvider>
        <GroupsListSection
          tab="mine"
          userId="user-1"
          myGroups={[group]}
          discoverGroups={[]}
          initialLoading={false}
          fetchError={null}
          onRefreshGroups={jest.fn()}
          onGoToToday={jest.fn()}
          onJoinWithCode={jest.fn()}
          onChoosePromise={jest.fn()}
          onCreateGroup={jest.fn()}
          onOpenPromise={jest.fn()}
          onOpenGroup={jest.fn()}
          onPreviewGroup={jest.fn()}
        />
      </ThemeProvider>
    );

    const row = screen.getByLabelText('Morning crew, Owner');
    const title = screen.getByText('Morning crew');
    const role = screen.getByText('Owner');
    const meta = screen.getByText('3-day group streak');
    const description = screen.getByText('Walk before work');

    expect(
      StyleSheet.flatten(row.props.style).minHeight
    ).toBeGreaterThanOrEqual(96);
    expect(
      StyleSheet.flatten(title.props.style).fontSize
    ).toBeGreaterThanOrEqual(16);
    expect(
      StyleSheet.flatten(meta.props.style).fontSize
    ).toBeGreaterThanOrEqual(13);
    expect(
      StyleSheet.flatten(role.props.style).fontSize
    ).toBeGreaterThanOrEqual(13);
    expect(
      StyleSheet.flatten(description.props.style).fontSize
    ).toBeGreaterThanOrEqual(15);
  });

  it('gives group detail the full task lane inside canonical gutters', () => {
    const { UNSAFE_getAllByType, UNSAFE_getByType } = render(
      <GroupDetailScreen />
    );

    expect(screen.getByTestId('group-detail-screen')).toBeTruthy();
    const scrollView = UNSAFE_getByType(ScrollView);
    const contentStyle = StyleSheet.flatten(
      scrollView.props.contentContainerStyle
    );

    const frameStyle = UNSAFE_getAllByType(View)
      .map(view => StyleSheet.flatten(view.props.style))
      .find(style => style?.maxWidth !== undefined);

    expect(contentStyle.maxWidth).toBeUndefined();
    expect(contentStyle.paddingHorizontal).toBe(mentaLayout.screenInset);
    expect(frameStyle?.maxWidth).toBe(mentaLayout.taskLane);
  });

  it('orients a member without repeating a dry group-metrics dashboard', () => {
    mockGroupDetailState.loaded = true;
    mockGroupStoreState.userGroups = ['group-1'];

    render(<GroupDetailScreen />);

    const header = screen.getByTestId('group-detail-header');
    const headerQueries = within(header);
    const title = headerQueries.getByText('Morning walk group');
    const titleStyle = StyleSheet.flatten(title.props.style);
    const headerStyle = StyleSheet.flatten(header.props.style);

    expect(titleStyle.fontSize).toBeGreaterThanOrEqual(24);
    expect(headerStyle.paddingTop).toBeGreaterThanOrEqual(12);
    expect(headerQueries.getByText('Owner · 1 member')).toBeTruthy();
    expect(
      screen.getByTestId('group-shared-promises-empty-mascot', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(screen.queryByTestId('group-board-empty-mark')).toBeNull();
    expect(screen.queryByText('You · Owner')).toBeNull();
    expect(screen.queryByTestId('group-identity-metrics')).toBeNull();
    expect(screen.getByText('No shared promises yet')).toBeTruthy();
    expect(screen.getByLabelText('Add first promise')).toBeTruthy();
    expect(screen.getByLabelText('Invite people')).toBeTruthy();
  });

  it('routes a promise container invite to promise roles, not a saved-group invite', () => {
    mockGroupDetailState.loaded = true;
    mockGroupKind = 'promise';
    mockGroupChallenges = [
      {
        id: 'promise-1',
        title: 'Walk after work',
        description: 'Add a photo from the walk.',
        verification_type: 'photo',
        added_to_group_at: '2026-09-01T00:00:00.000Z',
      },
    ];
    mockGroupStoreState.userGroups = ['group-1'];

    render(<GroupDetailScreen />);
    fireEvent.press(screen.getByLabelText('Group actions'));
    fireEvent.press(screen.getByText('Invite people'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/promise-accountability',
      params: {
        challengeId: 'promise-1',
        originGroupId: 'group-1',
        source: 'group_board',
      },
    });
    expect(mockRouter.push).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/group-invite' })
    );
  });

  it('does not announce or navigate on a rejected archive result', async () => {
    mockGroupDetailState.loaded = true;
    mockGroupStatus = 'failed';
    mockGroupStoreState.userGroups = ['group-1'];
    mockGroupStoreState.archiveFailedGroup.mockResolvedValueOnce({
      success: false,
      error: 'Archive service unavailable.',
    });

    render(<GroupDetailScreen />);
    fireEvent.press(screen.getByText('Archive this group'));

    expect(await screen.findByText('Group not archived')).toBeTruthy();
    expect(screen.getByText('Archive service unavailable.')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.getByText('Archive this group')).toBeTruthy();
  });

  it('navigates only after the group archive is confirmed', async () => {
    mockGroupDetailState.loaded = true;
    mockGroupStatus = 'failed';
    mockGroupStoreState.userGroups = ['group-1'];

    render(<GroupDetailScreen />);
    fireEvent.press(screen.getByText('Archive this group'));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/groups');
    });
  });

  describe('rejected-proof correction handoff', () => {
    const feedback =
      'Action not visible\nInclude the full walk route next time.';
    const proofRow = {
      id: 'proof-1',
      user_id: 'user-1',
      challenge_id: 'promise-1',
      status: 'rejected',
      review_notes: feedback as string | null,
    };

    const prepareRetry = (
      type: 'photo' | 'video' | 'text' = 'photo',
      row = proofRow,
      status: 'rejected' | 'pending' | 'approved' | null = 'rejected',
      owner = 'user-1'
    ) => {
      mockGroupDetailState.loaded = true;
      mockGroupStoreState.userGroups = ['group-1'];
      mockGroupChallenges = [
        {
          id: 'promise-1',
          title: 'Walk after work',
          description: 'Share your walk.',
          verification_type: type,
          added_to_group_at: '2026-09-01T00:00:00Z',
        },
      ];
      mockBoardSnapshot = buildGroupAccountabilitySnapshot({
        members: [
          { userId: 'user-1', name: 'Daniel', isCurrentUser: true },
          { userId: 'user-2', name: 'Sam', isCurrentUser: false },
        ],
        submissions: status
          ? [
              {
                id: 'proof-1',
                userId: owner,
                status,
                mediaType: type,
                submittedAt: '2026-10-01T10:00:00Z',
              },
            ]
          : [],
      });
      // A database-shaped read: all predicates must match to return feedback.
      return jest.spyOn(supabase, 'from').mockImplementation(() => {
        const filters: Record<string, unknown> = {};
        const query = {
          select: () => query,
          eq: (key: string, value: unknown) => {
            filters[key] = value;
            return query;
          },
          maybeSingle: async () => ({
            data: Object.entries(filters).every(
              ([key, value]) => row[key as keyof typeof row] === value
            )
              ? { review_notes: row.review_notes }
              : null,
            error: null,
          }),
        };
        return query as never;
      });
    };

    it.each([
      ['photo', 'Add my photo'],
      ['video', 'Add my video'],
      ['text', 'Add proof'],
    ] as const)(
      'preserves full feedback and the %s retry type and label',
      async (type, label) => {
        prepareRetry(type);
        render(<GroupDetailScreen />);
        fireEvent.press(screen.getByLabelText(label));
        await waitFor(() =>
          expect(mockRouter.push).toHaveBeenCalledWith({
            pathname: '/verification',
            params: {
              challengeId: 'promise-1',
              groupId: 'group-1',
              verificationType: type,
              suggestedVerificationType: type,
              source: 'group_detail',
              correctionReason: feedback,
            },
          })
        );
      }
    );

    it.each([
      ['another member', { ...proofRow, user_id: 'user-2' }],
      ['another challenge', { ...proofRow, challenge_id: 'promise-2' }],
      ['a replaced submission', { ...proofRow, id: 'older-proof' }],
      ['a resolved proof', { ...proofRow, status: 'approved' }],
      ['missing feedback', { ...proofRow, review_notes: null }],
      ['blank feedback', { ...proofRow, review_notes: ' \n ' }],
    ])(
      'does not pass %s feedback from a stale retry board',
      async (_label, row) => {
        prepareRetry('photo', row);
        render(<GroupDetailScreen />);
        fireEvent.press(screen.getByLabelText('Add my photo'));
        await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
        expect(mockRouter.push.mock.calls[0][0].params).not.toHaveProperty(
          'correctionReason'
        );
      }
    );

    it('does not reuse another member’s retry for the current user’s due proof', async () => {
      const read = prepareRetry('photo', proofRow, 'rejected', 'user-2');
      render(<GroupDetailScreen />);
      fireEvent.press(screen.getByLabelText('Add my photo'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
      expect(read).not.toHaveBeenCalled();
      expect(mockRouter.push.mock.calls[0][0].params).not.toHaveProperty(
        'correctionReason'
      );
    });

    it('preserves a reason without an optional note', async () => {
      prepareRetry('text', {
        ...proofRow,
        review_notes: 'Too unclear to review',
      });
      render(<GroupDetailScreen />);
      fireEvent.press(screen.getByLabelText('Add proof'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
      expect(mockRouter.push.mock.calls[0][0].params.correctionReason).toBe(
        'Too unclear to review'
      );
    });

    it('keeps the retry available when feedback cannot be read', async () => {
      const read = prepareRetry();
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
          data: null,
          error: { message: 'Unavailable' },
        }),
      };
      read.mockImplementationOnce(() => query as never);
      render(<GroupDetailScreen />);
      fireEvent.press(screen.getByLabelText('Add my photo'));
      expect(await screen.findByText('Try again')).toBeTruthy();
      expect(mockRouter.push).not.toHaveBeenCalled();
      fireEvent.press(screen.getByLabelText('Add my photo'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
      expect(mockRouter.push.mock.calls[0][0].params.correctionReason).toBe(
        feedback
      );
    });

    it('ignores feedback that finishes after the account changes', async () => {
      const read = prepareRetry();
      let finish!: (value: unknown) => void;
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: () =>
          new Promise(resolve => {
            finish = resolve;
          }),
      };
      read.mockImplementationOnce(() => query as never);
      const view = render(<GroupDetailScreen />);
      fireEvent.press(screen.getByLabelText('Add my photo'));
      mockViewerId = 'user-2';
      view.rerender(<GroupDetailScreen />);
      await act(async () =>
        finish({ data: { review_notes: feedback }, error: null })
      );
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    const delayFeedback = () => {
      const read = prepareRetry();
      const finishers: Array<(value: unknown) => void> = [];
      read.mockImplementation(() => {
        const query = {
          select: () => query,
          eq: () => query,
          maybeSingle: () =>
            new Promise(resolve => {
              finishers.push(resolve);
            }),
        };
        return query as never;
      });
      return { read, finishers };
    };

    it.each(['unmount', 'blur', 'back'] as const)(
      'cancels a delayed retry handoff after %s',
      async leave => {
        const { finishers } = delayFeedback();
        const view = render(<GroupDetailScreen />);
        fireEvent.press(screen.getByLabelText('Add my photo'));
        if (leave === 'unmount') view.unmount();
        else if (leave === 'blur') act(() => setRouteFocused(false));
        else {
          mockRouter.back.mockImplementationOnce(() => setRouteFocused(false));
          fireEvent.press(screen.getByLabelText('Back'));
          expect(mockRouter.back).toHaveBeenCalledTimes(1);
        }
        await act(async () =>
          finishers[0]({ data: { review_notes: feedback }, error: null })
        );
        expect(mockRouter.push).not.toHaveBeenCalled();
      }
    );

    it('coalesces repeated taps while a retry read is pending', async () => {
      const { read, finishers } = delayFeedback();
      render(<GroupDetailScreen />);
      fireEvent.press(screen.getByLabelText('Add my photo'));
      fireEvent.press(screen.getByLabelText('Add my photo'));
      expect(read).toHaveBeenCalledTimes(1);
      await act(async () =>
        finishers[0]({ data: { review_notes: feedback }, error: null })
      );
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      fireEvent.press(screen.getByLabelText('Add my photo'));
      expect(read).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
    });

    it('does not revive an old handoff after leaving and returning to the screen', async () => {
      const { read, finishers } = delayFeedback();
      render(<GroupDetailScreen />);
      fireEvent.press(screen.getByLabelText('Add my photo'));
      act(() => setRouteFocused(false));
      act(() => setRouteFocused(true));
      fireEvent.press(screen.getByLabelText('Add my photo'));
      await act(async () =>
        finishers[0]({ data: { review_notes: 'Old feedback' }, error: null })
      );
      expect(mockRouter.push).not.toHaveBeenCalled();
      fireEvent.press(screen.getByLabelText('Add my photo'));
      expect(read).toHaveBeenCalledTimes(2);
      await act(async () =>
        finishers[1]({ data: { review_notes: feedback }, error: null })
      );
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push.mock.calls[0][0].params.correctionReason).toBe(
        feedback
      );
    });

    it.each(['challenge', 'account', 'retry submission'] as const)(
      'invalidates the request even when its %s changes and returns to the same target',
      async context => {
        const { finishers } = delayFeedback();
        const view = render(<GroupDetailScreen />);
        fireEvent.press(screen.getByLabelText('Add my photo'));
        const originalSnapshot = mockBoardSnapshot;
        if (context === 'challenge')
          mockGroupChallenges = [
            { ...mockGroupChallenges[0], id: 'promise-2' },
          ];
        else if (context === 'account') mockViewerId = 'user-2';
        else
          mockBoardSnapshot = {
            ...mockBoardSnapshot!,
            members: mockBoardSnapshot!.members.map(member =>
              member.userId === 'user-1'
                ? { ...member, submissionId: 'proof-2' }
                : member
            ),
          };
        view.rerender(<GroupDetailScreen />);
        mockGroupChallenges = [{ ...mockGroupChallenges[0], id: 'promise-1' }];
        mockViewerId = 'user-1';
        mockBoardSnapshot = originalSnapshot;
        view.rerender(<GroupDetailScreen />);
        await act(async () =>
          finishers[0]({ data: { review_notes: feedback }, error: null })
        );
        expect(mockRouter.push).not.toHaveBeenCalled();
      }
    );

    it.each(['pending', 'approved'] as const)(
      'does not offer retry or read feedback for %s proof',
      status => {
        const read = prepareRetry('photo', proofRow, status);
        render(<GroupDetailScreen />);
        expect(screen.queryByLabelText('Add my photo')).toBeNull();
        expect(read).not.toHaveBeenCalled();
        expect(mockRouter.push).not.toHaveBeenCalled();
      }
    );
  });
});
