import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import JoinGroupScreen from '@/app/join-group';
import { showRewardedAdDetailed } from '@/lib/ads';

const mockShowRewardedAdDetailed = showRewardedAdDetailed as jest.Mock;
const mockClaimAdReward = jest.fn();
const mockClearPendingForUser = jest.fn();
const mockClearPending = jest.fn();
const mockDismissPending = jest.fn();
const mockJoinInvoke = jest.fn();
const mockPreviewGuestGroupInvite = jest.fn();
const mockPreviewGroupInvite = jest.fn();
const mockGetJoinGroupQuote = jest.fn();
const mockSetPendingGroup = jest.fn();
const mockSetPendingChallenge = jest.fn();
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};
let mockAdsEnabled = true;
let mockSafeMode = false;
let mockUser: { id: string } | null = { id: 'user-1' };
let mockParams: { code?: string } = {};
let mockPendingInvite: {
  type: 'group' | 'challenge';
  code: string;
  timestamp: number;
  ownerUserId: string | null;
} | null = null;

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn(),
}));

jest.mock('@/hooks/useOperationalFlag', () => ({
  useOperationalFlag: (key: string) => ({
    enabled: key === 'ads_enabled' ? mockAdsEnabled : mockSafeMode,
    loading: false,
  }),
}));

jest.mock('@/lib/hooks/useActionCosts', () => ({
  useActionCosts: () => ({ join_group: 50 }),
}));

jest.mock('@/lib/hooks/useAdReward', () => ({
  useAdRewardAmount: () => 50,
}));

jest.mock('@/lib/ads', () => ({
  showRewardedAdDetailed: jest.fn(),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: mockUser }),
}));

jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: (selector: (state: unknown) => unknown) =>
    selector({
      balance: 0,
      claimAdReward: mockClaimAdReward,
      fetchBalance: jest.fn(),
    }),
}));

jest.mock('@/store/invite-store', () => {
  const useInviteStore = (selector: (state: unknown) => unknown) =>
    selector({
      clearPending: mockClearPending,
      clearPendingForUser: mockClearPendingForUser,
      dismissPending: mockDismissPending,
      pending: mockPendingInvite,
      setPendingGroup: mockSetPendingGroup,
      setPendingChallenge: mockSetPendingChallenge,
    });
  useInviteStore.getState = () => ({
    pending: mockPendingInvite,
    dismissPending: mockDismissPending,
  });
  return { useInviteStore };
});

jest.mock('@/store/group-store', () => ({
  useGroupStore: (selector: (state: unknown) => unknown) =>
    selector({
      previewGuestGroupInvite: mockPreviewGuestGroupInvite,
      previewGroupInvite: mockPreviewGroupInvite,
      getJoinGroupQuote: mockGetJoinGroupQuote,
    }),
}));

jest.mock('@/store/selectors', () => ({
  useGroupActions: () => ({
    fetchDiscoverGroups: jest.fn(),
    fetchUserGroups: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    functions: { invoke: mockJoinInvoke },
    rpc: jest.fn(),
  },
}));

jest.mock('@/components/CameraFix', () => {
  const { Text } = require('react-native') as typeof import('react-native');
  return () => <Text>Camera open</Text>;
});

jest.mock('@/components/groups/JoinGroupOutcomeSections', () => ({
  JoinGroupActionNoticeSection: () => null,
  JoinGroupDetailsSection: () => null,
  JoinGroupFundingOptionsSection: () => null,
  JoinGroupReceiptSection: () => null,
}));

jest.mock('@/components/ui/modal/ModalCard', () => ({
  __esModule: true,
  default: ({
    children,
    visible,
  }: {
    children: React.ReactNode;
    visible: boolean;
  }) => (visible ? children : null),
}));

jest.mock('@/components/paywall/PaywallModal', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');
  const MockPaywall = ({
    onWatchAd,
  }: {
    onWatchAd?: () => Promise<{
      earned: boolean;
      amount: number;
      reason?: string;
    }>;
  }) => {
    const [outcome, setOutcome] = ReactModule.useState('not-started');
    return (
      <View>
        <Text>
          {onWatchAd ? 'Join sponsor available' : 'Join sponsor hidden'}
        </Text>
        {onWatchAd ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void onWatchAd().then(result =>
                setOutcome(
                  result.earned
                    ? `join-earned:${result.amount}`
                    : `join-failed:${result.reason || 'no_reward'}`
                )
              );
            }}
          >
            <Text>Play join sponsor</Text>
          </Pressable>
        ) : null}
        <Text>{outcome}</Text>
      </View>
    );
  };
  return { __esModule: true, default: MockPaywall };
});

describe('join group sponsor reward', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJoinInvoke.mockReset();
    mockPreviewGuestGroupInvite.mockReset();
    mockPreviewGroupInvite.mockReset();
    mockGetJoinGroupQuote.mockReset();
    mockGetJoinGroupQuote.mockResolvedValue({
      cost: 50,
      activeGroups: 0,
      isPro: false,
    });
    mockAdsEnabled = true;
    mockSafeMode = false;
    mockUser = { id: 'user-1' };
    mockParams = {};
    mockPendingInvite = null;
    mockDismissPending.mockImplementation(expected => {
      if (mockPendingInvite === expected) mockPendingInvite = null;
      return true;
    });
    mockShowRewardedAdDetailed.mockResolvedValue({
      earned: true,
      amount: 999,
      type: 'test-ad-unit',
    });
    mockClaimAdReward.mockResolvedValue({ earned: true, amount: 10 });
  });

  const renderScreen = () => render(<JoinGroupScreen />, { wrapper: Wrapper });

  it('opens the camera as soon as Scan QR is pressed', async () => {
    renderScreen();

    fireEvent.press(await screen.findByText('Scan QR'));

    expect(screen.getByText('Camera open')).toBeTruthy();
  });

  it.each([
    ['ads are disabled', false, false],
    ['safe mode is active', true, true],
  ])('does not expose sponsor video when %s', async (_, ads, safe) => {
    mockAdsEnabled = ads;
    mockSafeMode = safe;

    renderScreen();

    expect(await screen.findByText('Join sponsor hidden')).toBeTruthy();
    expect(screen.queryByText('Play join sponsor')).toBeNull();
    expect(mockShowRewardedAdDetailed).not.toHaveBeenCalled();
    expect(mockClaimAdReward).not.toHaveBeenCalled();
  });

  it('does not request a credit when no sponsor video is available', async () => {
    mockShowRewardedAdDetailed.mockResolvedValue({
      earned: false,
      amount: 0,
      reason: 'no_fill',
    });

    renderScreen();
    fireEvent.press(await screen.findByText('Play join sponsor'));

    expect(await screen.findByText('join-failed:no_fill')).toBeTruthy();
    expect(mockClaimAdReward).not.toHaveBeenCalled();
  });

  it('uses only the amount confirmed by the reward RPC', async () => {
    renderScreen();
    fireEvent.press(await screen.findByText('Play join sponsor'));

    expect(await screen.findByText('join-earned:10')).toBeTruthy();
    expect(screen.queryByText('join-earned:999')).toBeNull();
    expect(mockClaimAdReward).toHaveBeenCalledTimes(1);
  });

  it('automatically reopens the current account invite after auth', async () => {
    mockPendingInvite = {
      type: 'group',
      code: 'GROUP1234',
      timestamp: 1,
      ownerUserId: 'user-1',
    };
    mockPreviewGroupInvite.mockResolvedValue({
      status: 'ACTIVE',
      inviteCode: 'GROUP1234',
      groupId: 'group-1',
      groupName: 'Morning walkers',
      groupDescription: null,
      inviterName: 'Mia',
      privacy: 'private',
      memberCount: 4,
      sharedPromise: null,
    });
    const rendered = renderScreen();

    expect(await screen.findByText('Morning walkers')).toBeTruthy();
    expect(mockPreviewGroupInvite).toHaveBeenCalledWith('GROUP1234');
    expect(mockClearPendingForUser).not.toHaveBeenCalled();
    expect(mockDismissPending).not.toHaveBeenCalled();
    expect(mockPendingInvite).toMatchObject({ code: 'GROUP1234' });
    expect(
      screen.getByText(
        'Joining costs 50 Momenta. Nothing is spent until you tap Join group.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Join a group')).toBeNull();

    mockUser = { id: 'user-2' };
    rendered.rerender(<JoinGroupScreen />);

    expect(await screen.findByText('Join a group')).toBeTruthy();
    expect(screen.queryByText('Morning walkers')).toBeNull();
  });

  it('previews a possessed invite before account creation, then preserves it for sign-in', async () => {
    mockUser = null;
    mockParams = { code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23' };
    mockPreviewGuestGroupInvite.mockResolvedValue({
      status: 'ACTIVE',
      groupName: 'Morning walkers',
      inviterName: 'Mia',
      sharedPromise: 'Walk after work.',
      expiresAt: '2026-09-01T00:00:00.000Z',
    });

    renderScreen();

    expect(await screen.findByText('Morning walkers')).toBeTruthy();
    expect(
      screen.getByRole('header', { name: 'Morning walkers' })
    ).toBeTruthy();
    expect(screen.getByText('Mia invited you')).toBeTruthy();
    expect(screen.getByText('Walk after work.')).toBeTruthy();
    expect(
      screen.getByText(
        'Members post proof. Another eligible member reviews it.'
      )
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Join group' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeTruthy();
    expect(screen.getByTestId('join-group-guest-footer')).toHaveStyle({
      marginTop: 'auto',
    });
    expect(screen.getByTestId('join-group-guest-join')).toHaveStyle({
      minHeight: 56,
    });
    expect(screen.getByTestId('join-group-guest-not-now')).toHaveStyle({
      minHeight: 44,
    });
    expect(mockPreviewGuestGroupInvite).toHaveBeenCalledWith(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23'
    );
    expect(mockPreviewGroupInvite).not.toHaveBeenCalled();
    expect(mockClearPendingForUser).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Join group'));

    expect(await screen.findByText('Sign in to continue')).toBeTruthy();
    expect(
      screen.getByRole('header', { name: 'Sign in to continue' })
    ).toBeTruthy();
    expect(screen.getByTestId('join-group-auth-invite-summary')).toBeTruthy();
    expect(screen.getByText('Mia’s invite')).toBeTruthy();
    expect(screen.getByTestId('join-group-continue-to-sign-in')).toHaveStyle({
      minHeight: 56,
    });
    expect(screen.getByTestId('join-group-auth-not-now')).toHaveStyle({
      minHeight: 44,
    });

    fireEvent.press(screen.getByText('Continue to sign in'));

    expect(mockSetPendingGroup).toHaveBeenCalledWith(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23',
      null
    );
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/auth-required',
      params: {
        next: '/join-group?code=ABCDEFGHJKLMNPQRSTUVWXYZ23',
      },
    });
    expect(mockRouter.push).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/auth-required' })
    );
  });

  it('discards a guest response after sign-in and revalidates with the account preview', async () => {
    let resolveGuestPreview: (value: {
      status: 'ACTIVE';
      groupName: string;
      inviterName: string | null;
      sharedPromise: string | null;
      expiresAt: string;
    }) => void = () => {};
    mockUser = null;
    mockParams = { code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23' };
    mockPreviewGuestGroupInvite.mockReturnValue(
      new Promise(resolve => {
        resolveGuestPreview = resolve;
      })
    );
    mockPreviewGroupInvite.mockResolvedValue({
      status: 'ACTIVE',
      inviteCode: 'ABCDEFGHJKLMNPQRSTUVWXYZ23',
      groupId: 'group-1',
      groupName: 'Account-scoped group',
      groupDescription: null,
      inviterName: 'Mia',
      privacy: 'private',
      memberCount: 4,
      sharedPromise: 'Walk after work.',
      expiresAt: '2026-09-01T00:00:00.000Z',
      isMember: false,
    });

    const rendered = renderScreen();
    expect(await screen.findByTestId('join-group-invite-loading')).toBeTruthy();

    mockUser = { id: 'user-1' };
    rendered.rerender(<JoinGroupScreen />);

    expect(await screen.findByText('Account-scoped group')).toBeTruthy();
    expect(mockPreviewGroupInvite).toHaveBeenCalledWith(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23'
    );

    await act(async () => {
      resolveGuestPreview({
        status: 'ACTIVE',
        groupName: 'Stale guest group',
        inviterName: 'Someone else',
        sharedPromise: null,
        expiresAt: '2026-09-01T00:00:00.000Z',
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText('Stale guest group')).toBeNull();
      expect(screen.getByText('Account-scoped group')).toBeTruthy();
    });
  });

  it('does not let account B join from account A’s completed preview', async () => {
    let resolveAccountBPreview: (value: {
      status: 'ACTIVE';
      inviteCode: string;
      groupId: string;
      groupName: string;
      groupDescription: null;
      inviterName: string;
      privacy: 'private';
      memberCount: number;
      sharedPromise: string;
      expiresAt: string;
      isMember: false;
    }) => void = () => {};
    mockUser = { id: 'user-a' };
    mockParams = { code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23' };
    mockPreviewGroupInvite
      .mockResolvedValueOnce({
        status: 'ACTIVE',
        inviteCode: 'ABCDEFGHJKLMNPQRSTUVWXYZ23',
        groupId: 'group-1',
        groupName: 'Account A group preview',
        groupDescription: null,
        inviterName: 'Mia',
        privacy: 'private',
        memberCount: 4,
        sharedPromise: 'Walk after work.',
        expiresAt: '2026-09-01T00:00:00.000Z',
        isMember: false,
      })
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveAccountBPreview = resolve;
        })
      );

    const rendered = renderScreen();
    expect(await screen.findByText('Account A group preview')).toBeTruthy();

    mockUser = { id: 'user-b' };
    rendered.rerender(<JoinGroupScreen />);

    expect(await screen.findByTestId('join-group-invite-loading')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Join group' })).toBeNull();
    expect(mockJoinInvoke).not.toHaveBeenCalled();

    await act(async () => {
      resolveAccountBPreview({
        status: 'ACTIVE',
        inviteCode: 'ABCDEFGHJKLMNPQRSTUVWXYZ23',
        groupId: 'group-1',
        groupName: 'Account B group preview',
        groupDescription: null,
        inviterName: 'Mia',
        privacy: 'private',
        memberCount: 4,
        sharedPromise: 'Walk after work.',
        expiresAt: '2026-09-01T00:00:00.000Z',
        isMember: false,
      });
      await Promise.resolve();
    });

    expect(await screen.findByText('Account B group preview')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Join group' })).toBeEnabled();
  });

  it('removes a completed preview when the route invite becomes invalid or absent', async () => {
    mockUser = null;
    mockParams = { code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23' };
    mockPreviewGuestGroupInvite.mockResolvedValue({
      status: 'ACTIVE',
      groupName: 'Route A group',
      inviterName: 'Mia',
      sharedPromise: 'Walk after work.',
      expiresAt: '2026-09-01T00:00:00.000Z',
    });

    const rendered = renderScreen();
    expect(await screen.findByText('Route A group')).toBeTruthy();

    mockParams = { code: 'not-a-valid-invite!' };
    rendered.rerender(<JoinGroupScreen />);

    expect(
      await screen.findByTestId('group-invite-preview-recovery')
    ).toBeTruthy();
    expect(screen.queryByText('Route A group')).toBeNull();

    mockParams = {};
    rendered.rerender(<JoinGroupScreen />);

    expect(await screen.findByText('Join a group')).toBeTruthy();
    expect(screen.queryByText('Route A group')).toBeNull();
  });

  it('discards an in-flight guest response when the route invite changes', async () => {
    let resolveGuestPreview: (value: {
      status: 'ACTIVE';
      groupName: string;
      inviterName: string | null;
      sharedPromise: string | null;
      expiresAt: string;
    }) => void = () => {};
    mockUser = null;
    mockParams = { code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23' };
    mockPreviewGuestGroupInvite.mockReturnValue(
      new Promise(resolve => {
        resolveGuestPreview = resolve;
      })
    );

    const rendered = renderScreen();
    expect(await screen.findByTestId('join-group-invite-loading')).toBeTruthy();

    mockParams = { code: 'invalid!' };
    rendered.rerender(<JoinGroupScreen />);
    expect(
      await screen.findByTestId('group-invite-preview-recovery')
    ).toBeTruthy();

    await act(async () => {
      resolveGuestPreview({
        status: 'ACTIVE',
        groupName: 'Late route A group',
        inviterName: 'Mia',
        sharedPromise: null,
        expiresAt: '2026-09-01T00:00:00.000Z',
      });
      await Promise.resolve();
    });

    expect(screen.queryByText('Late route A group')).toBeNull();
    expect(screen.getByTestId('group-invite-preview-recovery')).toBeTruthy();
  });

  it('does not carry account A’s already-member receipt into account B', async () => {
    mockUser = { id: 'user-a' };
    mockParams = { code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23' };
    mockPreviewGroupInvite
      .mockResolvedValueOnce({
        status: 'ALREADY_MEMBER',
        inviteCode: 'ABCDEFGHJKLMNPQRSTUVWXYZ23',
        groupId: 'group-1',
        groupName: 'Account A membership',
        groupDescription: null,
        inviterName: 'Mia',
        privacy: 'private',
        memberCount: 4,
        sharedPromise: 'Walk after work.',
        expiresAt: '2026-09-01T00:00:00.000Z',
        isMember: true,
      })
      .mockReturnValueOnce(new Promise(() => {}));

    const rendered = renderScreen();
    expect(await screen.findByText('Account A membership')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open group' })).toBeTruthy();

    mockUser = { id: 'user-b' };
    rendered.rerender(<JoinGroupScreen />);

    expect(await screen.findByTestId('join-group-invite-loading')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open group' })).toBeNull();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/groups/group-1');
  });

  it('binds a promise invite found on this route to the current account', async () => {
    mockParams = {
      code: 'https://menta.quest/join/challenge/PROMISE42',
    };

    renderScreen();

    await waitFor(() => {
      expect(mockSetPendingChallenge).toHaveBeenCalledWith(
        'PROMISE42',
        'user-1'
      );
    });
    expect(
      await screen.findByTestId('group-invite-preview-recovery')
    ).toBeTruthy();
  });

  it('does not expose another account pending group invite', async () => {
    mockPendingInvite = {
      type: 'group',
      code: 'GROUP1234',
      timestamp: 1,
      ownerUserId: 'user-2',
    };

    renderScreen();

    expect(await screen.findByText('Find invite')).toBeDisabled();
    expect(mockPreviewGroupInvite).not.toHaveBeenCalled();
  });
});
