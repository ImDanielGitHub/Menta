import React, { type ReactNode } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import ProfileScreen from '@/app/(tabs)/profile';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getMyProfile } from '@/lib/profile-api';
import { RevenueCatAPI } from '@/lib/paywall/revenuecat';
import { showGlobalToast } from '@/lib/toast-provider';
import { readProfileFollowThroughDays } from '@/lib/profile/follow-through';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

const mockSafeAreaInsets = {
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
};

const mockAuthState = {
  clearAuthData: jest.fn(),
  isAuthenticated: true,
  logout: jest.fn<Promise<void>, []>(),
  user: {
    avatarUrl: undefined,
    email: 'mia@example.com',
    id: 'user-1',
    username: 'mia',
  },
};

const mockChallengeState = {
  fetchUserChallenges: jest.fn<Promise<void>, [string]>(),
  userChallenges: [
    {
      challengeId: 'challenge-1',
      currentStreak: 5,
      joinedAt: '2026-08-01T00:00:00.000Z',
      status: 'active' as const,
      userId: 'user-1',
    },
  ],
};

const mockGroupState = {
  fetchUserGroups: jest.fn<Promise<void>, [string]>(),
  groups: [],
};

jest.mock('expo-router', () => {
  const ReactModule = require('react') as typeof import('react');

  return {
    useFocusEffect: (callback: () => void) => {
      ReactModule.useEffect(callback, [callback]);
    },
    useRouter: () => mockRouter,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockSafeAreaInsets,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthState,
}));

jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: () => mockChallengeState,
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: () => mockGroupState,
}));

jest.mock('@/store/invite-store', () => ({
  useInviteStore: (selector: (state: { pending: null }) => unknown) =>
    selector({ pending: null }),
}));

jest.mock('@/lib/profile-api', () => ({
  getMyProfile: jest.fn(),
}));

jest.mock('@/lib/paywall/revenuecat', () => ({
  RevenueCatAPI: { isPro: jest.fn().mockResolvedValue(false) },
}));

jest.mock('@/lib/toast-provider', () => ({
  showGlobalToast: jest.fn(),
}));

jest.mock('@/lib/profile/follow-through', () => ({
  readProfileFollowThroughDays: jest.fn(),
}));

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    BellIcon: Icon,
    ChevronRightIcon: Icon,
    CrownIcon: Icon,
    Grid3x3Icon: Icon,
    InfoIcon: Icon,
    LogOutIcon: Icon,
    SettingsIcon: Icon,
    ShoppingBagIcon: Icon,
    TargetIcon: Icon,
    UserPlusIcon: Icon,
  };
});

jest.mock('@/components/ui/AppShell', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    AppScreen: ({
      children,
      testID,
    }: {
      children: ReactNode;
      testID?: string;
    }) => ReactModule.createElement(View, { testID }, children),
  };
});

jest.mock('@/components/ui/AppButton', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    AppButton: ({ onPress, title }: { onPress: () => void; title: string }) =>
      ReactModule.createElement(
        Pressable,
        { onPress, testID: `button-${title}` },
        ReactModule.createElement(Text, null, title)
      ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppInlineNotice: ({
      description,
      title,
    }: {
      description: string;
      title: string;
    }) =>
      ReactModule.createElement(
        View,
        null,
        ReactModule.createElement(Text, null, title),
        ReactModule.createElement(Text, null, description)
      ),
  };
});

jest.mock('@/components/ui/Avatar', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    Avatar: () => ReactModule.createElement(View, { testID: 'profile-avatar' }),
  };
});

jest.mock('@/components/ui/MentaMascot', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    MentaMascot: ({ testID }: { testID?: string }) =>
      ReactModule.createElement(View, { testID }),
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return { SkeletonLoader: () => ReactModule.createElement(View) };
});

jest.mock('@/components/settings/SettingsDirectRow', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    SettingsDirectRow: ({
      onPress,
      subtitle,
      testID,
      title,
      value,
    }: {
      onPress?: () => void;
      subtitle?: string;
      testID?: string;
      title: string;
      value?: string;
    }) =>
      ReactModule.createElement(
        Pressable,
        { onPress, testID: testID ?? `profile-row-${title}` },
        ReactModule.createElement(Text, null, title),
        subtitle ? ReactModule.createElement(Text, null, subtitle) : null,
        value ? ReactModule.createElement(Text, null, value) : null
      ),
    SettingsSectionLabel: ({ children }: { children: string }) =>
      ReactModule.createElement(Text, null, children),
  };
});

const profile = {
  avatar_url: null,
  created_at: '2026-08-01T00:00:00.000Z',
  display_name: 'Mia Aroha',
  email: 'mia@example.com',
  has_completed_onboarding: true,
  id: 'user-1',
  is_approved: true,
  is_pro: false,
  momenta_balance: 42,
  updated_at: '2026-08-01T00:00:00.000Z',
  username: 'mia',
};

const mockedGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;
const mockedIsPro = RevenueCatAPI.isPro as jest.MockedFunction<
  typeof RevenueCatAPI.isPro
>;
const mockedShowGlobalToast = showGlobalToast as jest.MockedFunction<
  typeof showGlobalToast
>;
const mockedReadProfileFollowThroughDays =
  readProfileFollowThroughDays as jest.MockedFunction<
    typeof readProfileFollowThroughDays
  >;

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = {
      avatarUrl: undefined,
      email: 'mia@example.com',
      id: 'user-1',
      username: 'mia',
    };
    mockAuthState.logout.mockResolvedValue(undefined);
    mockChallengeState.userChallenges = [
      {
        challengeId: 'challenge-1',
        currentStreak: 5,
        joinedAt: '2026-08-01T00:00:00.000Z',
        status: 'active' as const,
        userId: 'user-1',
      },
    ];
    mockGroupState.groups = [];
    mockChallengeState.fetchUserChallenges.mockResolvedValue(undefined);
    mockGroupState.fetchUserGroups.mockResolvedValue(undefined);
    mockedGetMyProfile.mockResolvedValue(profile);
    mockedIsPro.mockResolvedValue(false);
    mockedReadProfileFollowThroughDays.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => ({
        approvedProofs: index === 5 ? 2 : 0,
        localDay: `2026-08-${(26 + index).toString().padStart(2, '0')}`,
        longLabel: `Day ${index + 1}`,
        outcome: null,
        shortLabel: String(index + 1),
      }))
    );
  });

  it('uses the Paper-shaped profile layout while confirming the current account', async () => {
    mockedGetMyProfile.mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Keep the refresh in flight so the screen paints from local account state. */
        })
    );

    render(<ProfileScreen />);

    expect(screen.getByTestId('profile-screen')).toBeTruthy();
    await waitFor(() => expect(mockedGetMyProfile).toHaveBeenCalledTimes(1));
  });

  it('renders a profile-owned You hierarchy with progress and rewards', async () => {
    render(<ProfileScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('profile-screen')).toBeTruthy()
    );

    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Mia Aroha')).toBeTruthy();
    expect(screen.getByText('Your rhythm')).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('Progress and rewards')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('Wallet, shop and items')).toBeTruthy();
    expect(screen.getByText('Invite friends')).toBeTruthy();
    expect(screen.getByText('Current reward terms and your link')).toBeTruthy();
    expect(screen.getByTestId('profile-rhythm-panel')).toBeTruthy();
    expect(screen.getByTestId('profile-follow-through-plot')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Proof history'));
    expect(mockRouter.push).toHaveBeenCalledWith('/solo-challenges');

    fireEvent.press(screen.getByTestId('profile-row-Personal promises'));
    expect(mockRouter.push).toHaveBeenCalledWith('/solo-challenges');

    fireEvent.press(screen.getByTestId('profile-row-Momenta'));
    expect(mockRouter.push).toHaveBeenCalledWith('/momenta');

    fireEvent.press(screen.getByTestId('profile-invite-someone'));
    expect(mockRouter.push).toHaveBeenCalledWith('/share-invite');
  });

  it('does not duplicate settings, subscription or account controls in You', async () => {
    render(<ProfileScreen />);

    await screen.findByTestId('profile-screen');

    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.queryByText('Notifications')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
    expect(screen.queryByTestId('profile-open-pro')).toBeNull();
    expect(screen.queryByTestId('profile-open-inventory')).toBeNull();
  });

  it('keeps profile editing available in the first-promise journey', async () => {
    mockChallengeState.userChallenges = [];
    mockGroupState.groups = [];

    render(<ProfileScreen />);

    await screen.findByTestId('profile-first-use');
    fireEvent.press(screen.getByTestId('button-Edit profile'));

    expect(mockRouter.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('turns an empty account into a focused first-promise journey', async () => {
    mockChallengeState.userChallenges = [];
    mockGroupState.groups = [];

    render(<ProfileScreen />);

    expect(await screen.findByTestId('profile-first-use')).toBeTruthy();
    expect(screen.getByText('Make your first promise')).toBeTruthy();
    expect(
      screen.getByText(
        'Choose one thing to follow through on. It will appear in Today with the proof you choose.'
      )
    ).toBeTruthy();
    expect(
      screen.queryByText('No live streak yet · 0 active promises')
    ).toBeNull();
    expect(screen.queryByText(/Best active streak/)).toBeNull();

    fireEvent.press(screen.getByTestId('button-Create a promise'));
    expect(mockRouter.push).toHaveBeenCalledWith('/create-challenge');
  });

  it('keeps profile refresh failure local while You actions remain available', async () => {
    mockedGetMyProfile.mockRejectedValueOnce(new Error('offline'));

    render(<ProfileScreen />);

    expect(
      await screen.findByText('Profile details may be out of date')
    ).toBeTruthy();
    expect(screen.getByText('Edit profile')).toBeTruthy();
    expect(screen.getByText('Momenta')).toBeTruthy();
    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
    expect(mockedShowGlobalToast).not.toHaveBeenCalled();
  });

  it('keeps identity and You actions available when only group summary fails', async () => {
    mockGroupState.fetchUserGroups.mockRejectedValueOnce(
      new Error('Groups unavailable')
    );

    render(<ProfileScreen />);

    expect(await screen.findByText('Mia Aroha')).toBeTruthy();
    expect(screen.getByText('Your progress may be out of date')).toBeTruthy();
    expect(screen.queryByText('Profile details may be out of date')).toBeNull();
    expect(screen.getByText('Personal promises')).toBeTruthy();
    expect(screen.getByText('Momenta')).toBeTruthy();
    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
  });

  it('keeps a failed Pro read quiet because subscription management belongs to Settings', async () => {
    mockedIsPro.mockRejectedValueOnce(new Error('store unavailable'));

    render(<ProfileScreen />);

    await screen.findByTestId('profile-screen');

    expect(screen.getByText('@mia · Member')).toBeTruthy();
    expect(screen.queryByText('Menta Pro is unavailable')).toBeNull();
    expect(screen.queryByTestId('profile-open-pro')).toBeNull();
  });

  it('shows confirmed Pro status as identity metadata without a settings row', async () => {
    mockedIsPro.mockResolvedValueOnce(true);

    render(<ProfileScreen />);

    expect(await screen.findByText('@mia · Menta Pro')).toBeTruthy();
    expect(screen.queryByTestId('profile-open-pro')).toBeNull();
    expect(
      screen.queryByText('Manage access or restore a purchase')
    ).toBeNull();
  });

  it('shows free membership truthfully after the server check', async () => {
    mockedIsPro.mockResolvedValueOnce(false);

    render(<ProfileScreen />);

    expect(await screen.findByText('@mia · Member')).toBeTruthy();
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('uses the equipped Ember accent for profile actions', async () => {
    render(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <ProfileScreen />
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('profile-screen')).toBeTruthy()
    );

    expect(screen.getByText('Edit profile')).toHaveStyle({
      color: '#E7A86D',
    });
  });
});
