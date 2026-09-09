import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Pressable, Share, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ShareInviteScreen from '@/app/share-invite';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockRouter = { replace: jest.fn() };
const mockClipboard = jest.fn();
const mockAuth = {
  user: { id: 'account-1' } as { id: string } | null,
  isAuthenticated: true,
};
const mockReferral = {
  generateReferralLink: jest.fn<Promise<string>, [string]>(),
  getReferralProgramStatus: jest.fn(),
  fetchUserReferrals: jest.fn<Promise<void>, [string]>(),
  userReferrals: [] as Array<{
    id: string;
    status: 'pending' | 'completed' | 'cancelled';
    rewardGranted: boolean;
    rewardOutcome: string | null;
    inviterRewardAmount: number;
    createdAt: string;
    completedAt: string | null;
  }>,
  isLoading: false,
  error: null as string | null,
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: unknown[]) => mockClipboard(...args),
}));

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    __esModule: true,
    default: ({ value }: { value: string }) =>
      React.createElement(View, {
        accessibilityLabel: value,
        testID: 'referral-qr-matrix',
      }),
  };
});

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) =>
    selector(mockAuth),
}));

jest.mock('@/store/referral-store', () => ({
  useReferralStore: (selector: (state: typeof mockReferral) => unknown) =>
    selector(mockReferral),
}));

const mockTrackMetaAdsInviteFriend = jest.fn();
jest.mock('@/lib/meta-ads', () => ({
  trackMetaAdsInviteFriend: () => mockTrackMetaAdsInviteFriend(),
}));

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppTopBar: () => React.createElement(Text, null, 'Back to You'),
  };
});

jest.mock('@/components/settings/SettingsDirectRow', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    SettingsSectionLabel: ({ children }: { children: string }) =>
      React.createElement(Text, null, children),
    SettingsDirectRow: ({
      title,
      subtitle,
      onPress,
      testID,
      busy,
      value,
    }: {
      title: string;
      subtitle?: string;
      onPress?: () => void;
      testID?: string;
      busy?: boolean;
      value?: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: title,
          accessibilityState: { busy },
          onPress,
          testID,
        },
        React.createElement(Text, null, title),
        subtitle ? React.createElement(Text, null, subtitle) : null,
        value ? React.createElement(Text, null, value) : null
      ),
  };
});

jest.mock('@/components/ui/AppButton', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    AppButton: ({
      title,
      onPress,
      testID,
      disabled,
      loading,
      accessibilityLabel,
    }: {
      title: string;
      onPress: () => void;
      testID?: string;
      disabled?: boolean;
      loading?: boolean;
      accessibilityLabel?: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: accessibilityLabel ?? title,
          accessibilityState: { busy: loading, disabled },
          disabled,
          onPress,
          testID: testID ?? title,
        },
        React.createElement(Text, null, title)
      ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppInlineNotice: ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description)
      ),
  };
});

const renderInvite = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider>
        <ShareInviteScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('ShareInviteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.user = { id: 'account-1' };
    mockAuth.isAuthenticated = true;
    mockReferral.userReferrals = [];
    mockReferral.isLoading = false;
    mockReferral.error = null;
    mockReferral.fetchUserReferrals.mockResolvedValue();
    mockReferral.generateReferralLink.mockResolvedValue(
      'https://menta.quest/invite?ref=ACTIVE'
    );
    mockReferral.getReferralProgramStatus.mockResolvedValue({
      programmeEnabled: true,
      rewardAmount: 50,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 3,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'dismissedAction' });
    mockClipboard.mockResolvedValue(true);
  });

  it('reads the active account link, then treats share-sheet return as neutral', async () => {
    renderInvite();
    expect(screen.queryByText('Share invite')).toBeNull();
    fireEvent.press(screen.getByTestId('invite-share-row'));

    await waitFor(() => expect(Share.share).toHaveBeenCalledTimes(1));
    expect(mockReferral.generateReferralLink).toHaveBeenCalledWith('account-1');
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Join me on Menta. Use this link, then create your first promise to complete the referral.\n\nhttps://menta.quest/invite?ref=ACTIVE',
        url: 'https://menta.quest/invite?ref=ACTIVE',
      })
    );
    expect(screen.getByText('Ready to share again')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta can’t tell whether the link was sent. You can share it again or copy it.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Invite sent')).toBeNull();
    expect(mockTrackMetaAdsInviteFriend).toHaveBeenCalledTimes(1);
  });

  it('prepares the active referral link for an in-person QR code', async () => {
    renderInvite();

    expect(
      await screen.findByLabelText('https://menta.quest/invite?ref=ACTIVE')
    ).toBeTruthy();
    expect(mockReferral.generateReferralLink).toHaveBeenCalledWith('account-1');
    expect(screen.getByText('Let them scan to join')).toBeTruthy();
  });

  it('shows the server-confirmed double-sided reward and annual reset', async () => {
    renderInvite();

    expect(
      await screen.findByText('You can both earn 50 Momenta')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'An eligible new member uses your link and creates their first promise. If rewards are still active, you each earn 50 Momenta. You can earn up to 10 referral rewards each year.'
      )
    ).toBeTruthy();
    expect(screen.getByText('3 of 10')).toBeTruthy();
    expect(screen.getByText('1 Jan 2027')).toBeTruthy();
    expect(screen.getByText('At 00:00 UTC')).toBeTruthy();
  });

  it('shows a server-confirmed referral reward separately from share return', async () => {
    mockReferral.userReferrals = [
      {
        id: 'referral-1',
        status: 'completed',
        rewardGranted: true,
        rewardOutcome: 'rewards_granted_v2',
        inviterRewardAmount: 50,
        createdAt: '2026-08-31T01:00:00.000Z',
        completedAt: '2026-08-31T02:00:00.000Z',
      },
    ];

    renderInvite();

    expect(await screen.findByText('50 Momenta added')).toBeTruthy();
  });

  it('keeps inviting available without promising paused rewards', async () => {
    mockReferral.getReferralProgramStatus.mockResolvedValueOnce({
      programmeEnabled: false,
      rewardAmount: 50,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 3,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });

    renderInvite();

    expect(await screen.findByText('Rewards are paused')).toBeTruthy();
    expect(
      screen.getByText(
        'You can still share your link, but Menta won’t add referral Momenta while the programme is paused.'
      )
    ).toBeTruthy();
    expect(screen.getByTestId('invite-share-row')).toBeTruthy();
    expect(screen.getByTestId('invite-copy-row')).toBeTruthy();
    expect(screen.queryByText('You can both earn 50 Momenta')).toBeNull();
  });

  it('explains the annual cap without removing the new-member reward', async () => {
    mockReferral.getReferralProgramStatus.mockResolvedValueOnce({
      programmeEnabled: true,
      rewardAmount: 50,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 10,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });

    renderInvite();

    expect(
      await screen.findByText('You have reached your reward limit')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'You have used all 10 referral rewards available to you this year. An eligible new member can still earn 50 Momenta when they use your link and create their first promise, while rewards are active. You can earn again from 1 Jan 2027.'
      )
    ).toBeTruthy();
    expect(screen.getByText('10 of 10')).toBeTruthy();
  });

  it('keeps invite controls available when reward terms cannot be confirmed', async () => {
    mockReferral.getReferralProgramStatus.mockRejectedValueOnce(
      new Error('unavailable')
    );

    renderInvite();

    expect(await screen.findByText('Reward terms unavailable')).toBeTruthy();
    expect(
      screen.getByText(
        'You can still share your link. Menta will show the reward terms when it can confirm them.'
      )
    ).toBeTruthy();
    expect(screen.getByTestId('invite-share-row')).toBeTruthy();
    expect(screen.getByTestId('invite-copy-row')).toBeTruthy();
    expect(screen.queryByText(/50 Momenta/)).toBeNull();
  });

  it('reports a clipboard write as local-only', async () => {
    renderInvite();
    fireEvent.press(screen.getByTestId('invite-copy-row'));

    await waitFor(() =>
      expect(mockClipboard).toHaveBeenCalledWith(
        'https://menta.quest/invite?ref=ACTIVE'
      )
    );
    expect(screen.getByText('Link copied')).toBeTruthy();
    expect(
      screen.getByText('It’s on this phone’s clipboard. It hasn’t been sent.')
    ).toBeTruthy();
  });

  it('retains an unavailable state until an explicit retry succeeds', async () => {
    mockReferral.generateReferralLink.mockRejectedValueOnce(
      new Error('offline')
    );
    renderInvite();
    fireEvent.press(screen.getByTestId('invite-share-row'));

    await waitFor(() =>
      expect(screen.getByText('Invite link unavailable')).toBeTruthy()
    );
    expect(
      screen.getByText('The link wasn’t copied or opened. Try again.')
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('invite-retry'));

    await waitFor(() =>
      expect(screen.getByTestId('invite-share-row')).toBeTruthy()
    );
  });

  it('prevents a second action while preparing the same link', async () => {
    let resolveLink: ((value: string) => void) | undefined;
    mockReferral.generateReferralLink.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveLink = resolve;
        })
    );
    renderInvite();
    fireEvent.press(screen.getByTestId('invite-share-row'));

    expect(mockReferral.generateReferralLink).toHaveBeenCalledTimes(1);
    expect(
      screen.getByTestId('invite-preparing').props.accessibilityState
    ).toMatchObject({ busy: true, disabled: true });
    fireEvent.press(screen.getByTestId('invite-preparing'));
    expect(mockReferral.generateReferralLink).toHaveBeenCalledTimes(1);
    resolveLink?.('https://menta.quest/invite?ref=ACTIVE');
    await waitFor(() => expect(Share.share).toHaveBeenCalledTimes(1));
  });

  it('keeps the footer action geometry stable during native share handoff', async () => {
    let resolveShare: ((value: { action: string }) => void) | undefined;
    jest.spyOn(Share, 'share').mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveShare = resolve;
        })
    );
    renderInvite();
    fireEvent.press(screen.getByTestId('invite-share-row'));

    await waitFor(() =>
      expect(screen.getByTestId('invite-system-handoff')).toBeTruthy()
    );
    expect(
      screen.getByTestId('invite-system-handoff-reserved-slot')
    ).toBeTruthy();
    resolveShare?.({ action: 'dismissedAction' });
  });

  it('ignores a late native share return from a former account', async () => {
    let resolveShare: ((value: { action: string }) => void) | undefined;
    jest.spyOn(Share, 'share').mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveShare = resolve;
        })
    );
    const view = renderInvite();
    fireEvent.press(screen.getByTestId('invite-share-row'));

    await waitFor(() => expect(Share.share).toHaveBeenCalledTimes(1));
    mockAuth.user = { id: 'account-2' };
    view.rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <ThemeProvider>
          <ShareInviteScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    resolveShare?.({ action: 'dismissedAction' });

    await waitFor(() =>
      expect(screen.getByTestId('invite-share-row')).toBeTruthy()
    );
    expect(screen.queryByText('Ready to share again')).toBeNull();
  });

  it('ignores a late clipboard result from a former account', async () => {
    let resolveCopy: ((value: boolean) => void) | undefined;
    mockClipboard.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveCopy = resolve;
        })
    );
    const view = renderInvite();
    fireEvent.press(screen.getByTestId('invite-copy-row'));

    await waitFor(() => expect(mockClipboard).toHaveBeenCalledTimes(1));
    mockAuth.user = { id: 'account-2' };
    view.rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <ThemeProvider>
          <ShareInviteScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    resolveCopy?.(true);

    await waitFor(() =>
      expect(screen.getByTestId('invite-copy-row')).toBeTruthy()
    );
    expect(screen.queryByText('Link copied')).toBeNull();
  });

  it('does not hand off a late link from a former account', async () => {
    let resolveOldLink: ((value: string) => void) | undefined;
    mockReferral.generateReferralLink.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOldLink = resolve;
        })
    );
    const view = renderInvite();
    fireEvent.press(screen.getByTestId('invite-share-row'));

    mockAuth.user = { id: 'account-2' };
    view.rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <ThemeProvider>
          <ShareInviteScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    resolveOldLink?.('https://menta.quest/invite?ref=FORMER');

    await waitFor(() =>
      expect(screen.getByTestId('invite-share-row')).toBeTruthy()
    );
    expect(Share.share).not.toHaveBeenCalled();
  });
});
