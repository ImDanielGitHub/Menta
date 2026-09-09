import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import PaywallHost from '@/components/paywall/PaywallHost';
import { showRewardedAdDetailed } from '@/lib/ads';

const mockShowRewardedAdDetailed = showRewardedAdDetailed as jest.Mock;
const mockClaimAdReward = jest.fn();
const mockOnProConfirmed = jest.fn();
let mockAdsEnabled = true;
let mockSafeMode = false;

jest.mock('@/lib/paywall/manager', () => ({
  paywallManager: {
    subscribe: (listener: (options: unknown) => void) => {
      listener({
        id: 'test-paywall',
        context: 'challenge',
        shortfall: 20,
        onProConfirmed: mockOnProConfirmed,
      });
      return jest.fn();
    },
    setVisible: jest.fn(),
  },
}));

jest.mock('@/hooks/useOperationalFlag', () => ({
  useOperationalFlag: (key: string) => ({
    enabled: key === 'ads_enabled' ? mockAdsEnabled : mockSafeMode,
    loading: false,
  }),
}));

jest.mock('@/lib/hooks/useAdReward', () => ({
  useAdRewardAmount: () => 50,
}));

jest.mock('@/lib/ads', () => ({
  showRewardedAdDetailed: jest.fn(),
}));

jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: (selector: (state: unknown) => unknown) =>
    selector({ claimAdReward: mockClaimAdReward }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/components/paywall/PaywallModal', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');
  const MockPaywall = ({
    onBuyPro,
    onClose,
    onWatchAd,
    visible,
  }: {
    onBuyPro?: () => void;
    onClose: () => void;
    onWatchAd?: () => Promise<{
      earned: boolean;
      amount: number;
      reason?: string;
    }>;
    visible: boolean;
  }) => {
    const [outcome, setOutcome] = ReactModule.useState('not-started');

    if (!visible) return null;

    return (
      <View>
        <Text>{onWatchAd ? 'Sponsor reward available' : 'Sponsor hidden'}</Text>
        {onWatchAd ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void onWatchAd().then(result => {
                setOutcome(
                  result.earned
                    ? `earned:${result.amount}`
                    : `failed:${result.reason || 'no_reward'}`
                );
              });
            }}
          >
            <Text>Watch sponsor</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onBuyPro}>
          <Text>Start using Pro</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose}>
          <Text>Close paywall</Text>
        </Pressable>
        <Text testID="reward-outcome">{outcome}</Text>
      </View>
    );
  };

  return { PaywallModal: MockPaywall, default: MockPaywall };
});

describe('PaywallHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdsEnabled = true;
    mockSafeMode = false;
    mockShowRewardedAdDetailed.mockResolvedValue({
      earned: true,
      amount: 999,
      type: 'test-ad-unit',
    });
    mockClaimAdReward.mockResolvedValue({ earned: true, amount: 10 });
  });

  it.each([
    ['ads are disabled', false, false],
    ['safe mode is active', true, true],
  ])(
    'does not expose or execute sponsor video when %s',
    async (_, ads, safe) => {
      mockAdsEnabled = ads;
      mockSafeMode = safe;

      render(<PaywallHost />);

      expect(await screen.findByText('Sponsor hidden')).toBeTruthy();
      expect(screen.queryByText('Watch sponsor')).toBeNull();
      expect(mockShowRewardedAdDetailed).not.toHaveBeenCalled();
      expect(mockClaimAdReward).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['no_fill', { earned: false, amount: 0, reason: 'no_fill' }],
    ['no_reward', { earned: false, amount: 0 }],
    ['load_failed', { earned: false, amount: 0, reason: 'load_failed' }],
  ])(
    'does not request a wallet credit for %s',
    async (expectedOutcome, adResult) => {
      mockShowRewardedAdDetailed.mockResolvedValue(adResult);

      render(<PaywallHost />);
      fireEvent.press(await screen.findByText('Watch sponsor'));

      expect(await screen.findByText(`failed:${expectedOutcome}`)).toBeTruthy();
      expect(mockClaimAdReward).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['daily-limit', 'daily_limit'],
    ['cooldown', 'cooldown'],
    ['unknown', 'reward_unconfirmed'],
  ])(
    'keeps the server %s result distinct',
    async (claimReason, expectedReason) => {
      mockClaimAdReward.mockResolvedValue({
        earned: false,
        amount: 0,
        reason: claimReason,
      });

      render(<PaywallHost />);
      fireEvent.press(await screen.findByText('Watch sponsor'));

      expect(await screen.findByText(`failed:${expectedReason}`)).toBeTruthy();
      expect(mockClaimAdReward).toHaveBeenCalledTimes(1);
    }
  );

  it('returns only the server-confirmed amount after the sponsor finishes', async () => {
    render(<PaywallHost />);
    fireEvent.press(await screen.findByText('Watch sponsor'));

    expect(await screen.findByText('earned:10')).toBeTruthy();
    expect(screen.queryByText('earned:999')).toBeNull();
    expect(mockClaimAdReward).toHaveBeenCalledTimes(1);
  });

  it('passes the confirmed Pro receipt back to the caller and closes', async () => {
    render(<PaywallHost />);

    expect(mockOnProConfirmed).not.toHaveBeenCalled();
    fireEvent.press(await screen.findByText('Start using Pro'));

    expect(mockOnProConfirmed).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Start using Pro')).toBeNull();
  });

  it('does not report Pro when the paywall closes without confirmation', async () => {
    render(<PaywallHost />);

    fireEvent.press(await screen.findByText('Close paywall'));

    expect(mockOnProConfirmed).not.toHaveBeenCalled();
  });
});
