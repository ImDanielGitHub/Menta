import React, { type ReactNode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import ProfileScreen from '@/app/(tabs)/profile';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getMyProfile } from '@/lib/profile-api';
import { RevenueCatAPI } from '@/lib/paywall/revenuecat';
import { openPaywall } from '@/lib/paywall/manager';
import { showGlobalToast } from '@/lib/toast-provider';
import { readProfileFollowThroughDays } from '@/lib/profile/follow-through';
import { buildProfileMonth, readProfileMonth } from '@/lib/profile/month';
import type { UserChallenge } from '@/store/challenge-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};
let mockPaywallAllowed = true;

jest.mock('@/lib/paywall/manager', () => ({ openPaywall: jest.fn() }));
jest.mock('@/lib/paywall/use-paywall-allowed', () => ({
  usePaywallAllowed: () => mockPaywallAllowed,
}));
jest.mock('@/lib/posthog', () => ({ trackProductEvent: jest.fn() }));

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
  ] as UserChallenge[],
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
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) =>
    selector(mockAuthState),
}));

jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: (
    selector: (state: typeof mockChallengeState) => unknown
  ) => selector(mockChallengeState),
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: (selector: (state: typeof mockGroupState) => unknown) =>
    selector(mockGroupState),
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

jest.mock('@/lib/profile/month', () => ({
  ...jest.requireActual('@/lib/profile/month'),
  readProfileMonth: jest.fn(),
}));

const mockReferralProgramme = jest.fn();
jest.mock('@/store/referral-store', () => ({
  useReferralStore: (
    selector: (state: { getReferralProgramStatus: () => unknown }) => unknown
  ) => selector({ getReferralProgramStatus: mockReferralProgramme }),
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
    AppButton: ({
      onPress,
      title,
      disabled,
    }: {
      onPress: () => void;
      title: string;
      disabled?: boolean;
    }) =>
      ReactModule.createElement(
        Pressable,
        {
          onPress,
          disabled,
          accessibilityState: { disabled },
          testID: `button-${title}`,
        },
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
      accessibilityLabel,
      disabled,
      busy,
    }: {
      onPress?: () => void;
      subtitle?: string;
      testID?: string;
      title: string;
      value?: string;
      accessibilityLabel?: string;
      disabled?: boolean;
      busy?: boolean;
    }) =>
      ReactModule.createElement(
        Pressable,
        {
          onPress,
          disabled,
          accessibilityLabel,
          accessibilityRole: 'button',
          accessibilityState: { disabled, busy },
          testID: testID ?? `profile-row-${title}`,
        },
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
const mockedReadProfileMonth = readProfileMonth as jest.MockedFunction<
  typeof readProfileMonth
>;
// September 2026: kept 1–8, missed 9–10, kept 11–22, frozen 23, today 24.
const september = buildProfileMonth({
  today: '2026-09-24',
  daysKept: 96,
  locale: 'en-NZ',
  rows: Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    return {
      local_day: `2026-09-${day.toString().padStart(2, '0')}`,
      approved_proofs:
        day < 24 && day !== 9 && day !== 10 && day !== 23 ? 1 : 0,
      outcome:
        day === 9 || day === 10 ? 'missed' : day === 23 ? 'protected' : null,
    };
  }),
});
const mockedReadProfileFollowThroughDays =
  readProfileFollowThroughDays as jest.MockedFunction<
    typeof readProfileFollowThroughDays
  >;

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPaywallAllowed = true;
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
    mockedReadProfileMonth.mockResolvedValue(september);
    mockReferralProgramme.mockResolvedValue({
      programmeEnabled: true,
      rewardAmount: 100,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 0,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });
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

    expect(screen.getByTestId('profile-loading')).toBeTruthy();
    await waitFor(() => expect(mockedGetMyProfile).toHaveBeenCalledTimes(1));
  });

  it('puts the Menta invite first, then streaks and this month', async () => {
    render(<ProfileScreen />);

    await screen.findByTestId('profile-screen');

    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Mia Aroha')).toBeTruthy();
    expect(screen.getByText('Keeping promises since August')).toBeTruthy();
    expect(screen.getByText('Bring a friend to Menta')).toBeTruthy();
    expect(
      await screen.findByText(
        'You each get 100 Momenta when they make their first promise.'
      )
    ).toBeTruthy();
    expect(screen.getByTestId('profile-stats')).toHaveProp(
      'accessibilityLabel',
      '5 day streak. Best streak 5 days. 96 days kept.'
    );
    expect(screen.getByText('20 kept · 1 frozen · 2 missed')).toBeTruthy();
    expect(screen.getByTestId('profile-month-2026-09-24-today')).toBeTruthy();
    expect(screen.getByTestId('profile-month-2026-09-23-frozen')).toBeTruthy();
    expect(screen.getByText('1 active')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-invite-card'));
    expect(mockRouter.push).toHaveBeenCalledWith('/share-invite');

    fireEvent.press(screen.getByTestId('profile-row-Personal promises'));
    expect(mockRouter.push).toHaveBeenCalledWith('/solo-challenges');

    fireEvent.press(screen.getByTestId('profile-row-Momenta'));
    expect(mockRouter.push).toHaveBeenCalledWith('/momenta');
  });

  it('drops the reward promise when referral rewards are paused', async () => {
    mockReferralProgramme.mockResolvedValue({
      programmeEnabled: false,
      rewardAmount: 100,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 0,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });

    render(<ProfileScreen />);

    await screen.findByTestId('profile-invite-card');
    expect(
      screen.getByText('Promises stick better when a friend is in on it.')
    ).toBeTruthy();
    expect(screen.queryByText(/100 Momenta/)).toBeNull();
  });

  it('does not duplicate settings, subscription or account controls in You', async () => {
    render(<ProfileScreen />);

    await screen.findByTestId('profile-screen');

    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.queryByText('Notifications')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
    expect(screen.getAllByTestId('profile-open-pro')).toHaveLength(1);
    expect(screen.queryByTestId('profile-open-inventory')).toBeNull();
  });

  it('keeps profile editing available in the first-promise journey', async () => {
    mockChallengeState.userChallenges = [];
    mockGroupState.groups = [];
    mockedReadProfileFollowThroughDays.mockResolvedValue([]);

    render(<ProfileScreen />);

    await screen.findByTestId('profile-first-use');
    fireEvent.press(screen.getByTestId('button-Edit profile'));

    expect(mockRouter.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('turns an empty account into a focused first-promise journey', async () => {
    mockChallengeState.userChallenges = [];
    mockGroupState.groups = [];
    mockedReadProfileFollowThroughDays.mockResolvedValue([]);

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

  it('does not show first-use for the next account while its progress is still loading', async () => {
    mockChallengeState.userChallenges = [];
    mockedReadProfileFollowThroughDays.mockResolvedValueOnce([]);
    const rendered = render(<ProfileScreen />);
    await screen.findByTestId('profile-first-use');

    let finishProgress!: (
      days: Awaited<ReturnType<typeof readProfileFollowThroughDays>>
    ) => void;
    mockedReadProfileFollowThroughDays.mockReturnValueOnce(
      new Promise(resolve => {
        finishProgress = resolve;
      })
    );
    mockAuthState.user = {
      ...mockAuthState.user,
      id: 'user-2',
      username: 'ben',
    };
    mockedGetMyProfile.mockResolvedValueOnce({
      ...profile,
      id: 'user-2',
      username: 'ben',
      display_name: 'Ben Aroha',
    });
    rendered.rerender(<ProfileScreen />);

    await screen.findByText('Ben Aroha');
    expect(screen.queryByTestId('profile-first-use')).toBeNull();
    expect(screen.queryByTestId('profile-rhythm-empty')).toBeNull();
    await act(async () => {
      finishProgress([
        {
          approvedProofs: 1,
          localDay: '2026-09-01',
          longLabel: 'Tuesday',
          outcome: null,
          shortLabel: '1',
        },
      ]);
    });
    expect(await screen.findByTestId('profile-stats')).toBeTruthy();
    expect(screen.queryByTestId('profile-first-use')).toBeNull();
  });

  it('hides the previous account month when the next account progress read fails', async () => {
    const rendered = render(<ProfileScreen />);
    await screen.findByTestId('profile-month');
    mockedReadProfileMonth.mockRejectedValueOnce(new Error('offline'));
    mockAuthState.user = {
      ...mockAuthState.user,
      id: 'user-2',
      username: 'ben',
    };
    mockedGetMyProfile.mockResolvedValueOnce({
      ...profile,
      id: 'user-2',
      username: 'ben',
      display_name: 'Ben Aroha',
    });
    rendered.rerender(<ProfileScreen />);
    expect(screen.queryByTestId('profile-month')).toBeNull();
    await screen.findByText('Ben Aroha');
    expect(screen.queryByTestId('profile-month')).toBeNull();
  });

  it('shows a zero streak with a live promise as day 1, not a bare 0', async () => {
    mockChallengeState.userChallenges[0].currentStreak = 0;

    render(<ProfileScreen />);

    expect(await screen.findByText('Day 1')).toBeTruthy();
    expect(screen.getByText('starts today')).toBeTruthy();
    expect(screen.queryByTestId('profile-first-use')).toBeNull();
  });

  it('keeps real history available when memberships are no longer present', async () => {
    mockChallengeState.userChallenges = [];

    render(<ProfileScreen />);

    expect(await screen.findByTestId('profile-month')).toBeTruthy();
    expect(screen.queryByTestId('profile-first-use')).toBeNull();
  });

  it('lets someone review old promises when they have no active commitment', async () => {
    mockChallengeState.userChallenges[0].status = 'completed';
    mockChallengeState.userChallenges[0].currentStreak = 0;

    render(<ProfileScreen />);

    await screen.findByTestId('profile-stats');
    expect(screen.queryByText('Day 1')).toBeNull();
    fireEvent.press(screen.getByTestId('profile-row-Personal promises'));
    expect(mockRouter.push).toHaveBeenCalledWith('/solo-challenges');
    expect(screen.queryByTestId('profile-first-use')).toBeNull();
  });

  it('does not present failed progress loading as an empty rhythm', async () => {
    mockChallengeState.userChallenges[0].currentStreak = 0;
    mockedReadProfileFollowThroughDays.mockRejectedValueOnce(
      new Error('offline')
    );

    render(<ProfileScreen />);

    await screen.findByText('Mia Aroha');
    expect(
      screen.getAllByText('Your progress may be out of date').length
    ).toBeGreaterThan(0);
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

  it('offers an access retry when Pro status cannot be confirmed', async () => {
    mockedIsPro.mockRejectedValueOnce(new Error('store unavailable'));

    render(<ProfileScreen />);

    await screen.findByTestId('profile-screen');

    fireEvent.press(await screen.findByLabelText('Check Pro access'));
    await screen.findByLabelText('See Pro plans');
    expect(mockedIsPro).toHaveBeenCalledTimes(2);
    expect(openPaywall).not.toHaveBeenCalled();
  });

  it('opens active Pro management from You', async () => {
    mockedIsPro.mockResolvedValueOnce(true);

    render(<ProfileScreen />);

    fireEvent.press(await screen.findByLabelText('Manage subscription'));
    expect(openPaywall).toHaveBeenCalledWith({
      context: 'general',
      initialView: 'active',
      onProConfirmed: expect.any(Function),
    });
  });

  it('shows free membership truthfully after the server check', async () => {
    mockedIsPro.mockResolvedValueOnce(false);

    render(<ProfileScreen />);

    fireEvent.press(await screen.findByLabelText('See Pro plans'));
    expect(screen.queryByText('Active')).toBeNull();
    expect(openPaywall).toHaveBeenCalledWith({
      context: 'general',
      initialView: 'plans',
      onProConfirmed: expect.any(Function),
    });
  });

  it('keeps Pro out of the unfinished onboarding invitation flow', async () => {
    mockPaywallAllowed = false;
    render(<ProfileScreen />);
    await screen.findByTestId('profile-screen');
    expect(screen.queryByTestId('profile-open-pro')).toBeNull();
    mockPaywallAllowed = true;
  });

  it('waits for entitlement confirmation before opening purchase plans', async () => {
    mockedIsPro.mockImplementationOnce(() => new Promise(() => undefined));
    render(<ProfileScreen />);
    await screen.findByTestId('profile-screen');
    fireEvent.press(screen.getByLabelText('Checking Pro access'));
    expect(openPaywall).not.toHaveBeenCalled();
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
