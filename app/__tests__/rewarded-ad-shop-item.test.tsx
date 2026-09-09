import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import ShopItemDetailsScreen from '@/app/shop/[id]';
import { showRewardedAdDetailed } from '@/lib/ads';

const mockShowRewardedAdDetailed = showRewardedAdDetailed as jest.Mock;
const mockClaimAdReward = jest.fn();
let mockAdsEnabled = true;
let mockSafeMode = false;
let mockHistoricallyPurchased = false;
let mockEquipped = false;
let mockInventoryRows: { item_sku: string; quantity: number }[] = [];

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockMomentaState = {
  balance: 0,
  claimAdReward: mockClaimAdReward,
  equipItem: jest.fn(),
  fetchBalance: jest.fn().mockResolvedValue(undefined),
  fetchEquippedItems: jest.fn().mockResolvedValue(undefined),
  fetchOwnedItems: jest.fn().mockResolvedValue(undefined),
  fetchPurchasedItems: jest.fn().mockResolvedValue(undefined),
  fetchShopItems: jest.fn().mockResolvedValue(undefined),
  isEquipped: jest.fn(() => mockEquipped),
  isPurchased: jest.fn(() => mockHistoricallyPurchased),
  ownedItems: [],
  pendingPurchaseAttempt: null as null | {
    userId: string;
    itemId: string;
    clientEventId: string;
  },
  purchaseItem: jest.fn(),
  shopItems: [
    {
      id: 'item-1',
      sku: 'time_extension_1',
      name: 'Time extension',
      description: 'Adds 12 hours.',
      category: 'power_up',
      cost: 50,
    },
  ],
  unequipItem: jest.fn(),
  usePowerUp: jest.fn(),
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'item-1' }),
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: () => mockMomentaState,
}));

jest.mock('@/hooks/useOperationalFlag', () => ({
  useOperationalFlag: (key: string) => ({
    enabled: key === 'ads_enabled' ? mockAdsEnabled : mockSafeMode,
    loading: false,
  }),
}));

jest.mock('@/lib/product-config', () => ({
  getApprovedCreditSkus: () => [],
}));

jest.mock('@/lib/hooks/useAdReward', () => ({
  useAdRewardAmount: () => 50,
}));

jest.mock('@/lib/ads', () => ({
  showRewardedAdDetailed: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const query = {
        select: jest.fn(() => query),
        eq: jest.fn(async () => ({ data: mockInventoryRows, error: null })),
      };
      return query;
    }),
  },
}));

jest.mock('@/lib/paywall/revenuecat', () => ({
  REVENUECAT_SUPPORTED: false,
  RevenueCatAPI: { getCreditOfferings: jest.fn() },
  purchaseCredits: jest.fn(),
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

jest.mock('@/lib/posthog', () => ({
  trackProductEvent: jest.fn(),
  trackProductOperation: jest.fn(),
}));

jest.mock('@/components/ui/SkeletonLoader', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SkeletonLoader: () => ReactModule.createElement(View),
  };
});

jest.mock('@/components/ui/SimpleBottomSheet', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      scrollableBody,
      footer,
      testID,
      visible,
    }: {
      children: React.ReactNode;
      scrollableBody?: React.ReactNode;
      footer?: React.ReactNode;
      testID?: string;
      visible: boolean;
    }) =>
      visible
        ? ReactModule.createElement(
            View,
            null,
            scrollableBody ?? children,
            footer
              ? ReactModule.createElement(
                  View,
                  { testID: testID ? `${testID}-footer` : undefined },
                  footer
                )
              : null
          )
        : null,
  };
});

jest.mock('@/components/momenta/MomentaActionNoticeSheet', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    MomentaActionNoticeSheet: ({
      notice,
      visible,
    }: {
      notice: { title: string; message: string } | null;
      visible: boolean;
    }) =>
      visible && notice
        ? ReactModule.createElement(
            View,
            null,
            ReactModule.createElement(Text, null, notice.title),
            ReactModule.createElement(Text, null, notice.message)
          )
        : null,
  };
});

jest.mock('@/components/paywall/PaywallModal', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');
  const MockPaywall = ({
    onWatchAd,
    visible,
  }: {
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
        <Text>
          {onWatchAd ? 'Shop sponsor available' : 'Shop sponsor hidden'}
        </Text>
        {onWatchAd ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void onWatchAd().then(result =>
                setOutcome(
                  result.earned
                    ? `shop-earned:${result.amount}`
                    : `shop-failed:${result.reason || 'no_reward'}`
                )
              );
            }}
          >
            <Text>Play shop sponsor</Text>
          </Pressable>
        ) : null}
        <Text>{outcome}</Text>
      </View>
    );
  };
  return { __esModule: true, default: MockPaywall };
});

describe('shop item purchase and sponsor reward', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdsEnabled = true;
    mockSafeMode = false;
    mockHistoricallyPurchased = false;
    mockEquipped = false;
    mockInventoryRows = [];
    mockMomentaState.balance = 0;
    mockMomentaState.equipItem.mockImplementation(async () => {
      mockEquipped = true;
    });
    mockMomentaState.pendingPurchaseAttempt = null;
    mockMomentaState.shopItems = [
      {
        id: 'item-1',
        sku: 'time_extension_1',
        name: 'Time extension',
        description: 'Adds 12 hours.',
        category: 'power_up',
        cost: 50,
      },
    ];
    mockShowRewardedAdDetailed.mockResolvedValue({
      earned: true,
      amount: 999,
      type: 'test-ad-unit',
    });
    mockClaimAdReward.mockResolvedValue({ earned: true, amount: 10 });
  });

  it('shows the concrete item outcome before asking for payment', async () => {
    mockMomentaState.balance = 100;

    render(<ShopItemDetailsScreen />);

    expect(await screen.findByText('Promise deadline')).toBeTruthy();
    expect(screen.getByText('Moves one deadline 12 hours later.')).toBeTruthy();
    expect(
      screen.getByText(
        'Choose the active promise after purchase or later from Your items.'
      )
    ).toBeTruthy();

    expect(screen.getByTestId('shop-account-summary')).toBeTruthy();
    expect(screen.queryByText('How it works')).toBeNull();
    expect(screen.queryByText('Inventory')).toBeNull();
    expect(screen.getAllByText('Use')).toHaveLength(1);

    fireEvent.press(screen.getByText('Buy for 50 Momenta'));

    expect(
      screen.getByText('You only spend Momenta if the purchase goes through.')
    ).toBeTruthy();
    expect(screen.getByTestId('shop-confirm-impact-preview')).toBeTruthy();
  });

  it('offers another consumable after the previous unit was used', async () => {
    mockHistoricallyPurchased = true;
    mockMomentaState.balance = 100;

    render(<ShopItemDetailsScreen />);

    expect(await screen.findByText('Used up')).toBeTruthy();
    expect(screen.getByText('Buy again for 50 Momenta')).toBeTruthy();
    expect(screen.queryByText('None available')).toBeNull();
  });

  it('keeps an owned appearance item available to use', async () => {
    mockHistoricallyPurchased = true;
    mockMomentaState.balance = 100;
    mockMomentaState.shopItems = [
      {
        id: 'item-1',
        sku: 'profile_theme_ember',
        name: 'Ember Theme',
        description: 'A warm profile theme.',
        category: 'cosmetic',
        cost: 100,
      },
    ];

    render(<ShopItemDetailsScreen />);

    expect(await screen.findAllByText('Owned')).toHaveLength(1);
    expect(screen.getByText('Use this style')).toBeTruthy();
    expect(screen.queryByText(/Buy again/)).toBeNull();
  });

  it('activates a supported appearance as part of its confirmed purchase', async () => {
    mockMomentaState.balance = 100;
    mockMomentaState.shopItems = [
      {
        id: 'item-1',
        sku: 'profile_theme_ember',
        name: 'Ember Theme',
        description: 'A warm profile theme.',
        category: 'cosmetic',
        cost: 100,
      },
    ];
    mockMomentaState.purchaseItem.mockResolvedValueOnce({
      success: true,
      message: 'Successfully purchased Ember Theme!',
      outcome: 'confirmed',
      clientEventId: '11111111-1111-4111-8111-111111111111',
      receipt: {
        clientEventId: '11111111-1111-4111-8111-111111111111',
        itemId: 'item-1',
        itemName: 'Ember Theme',
        itemSku: 'profile_theme_ember',
        cost: 100,
        newBalance: 0,
        quantity: 1,
      },
    });

    render(<ShopItemDetailsScreen />);

    fireEvent.press(await screen.findByText('Buy for 100 Momenta'));
    expect(
      screen.getByTestId('shop-confirm-purchase-sheet-footer')
    ).toBeTruthy();
    fireEvent.press(await screen.findByTestId('shop-confirm-purchase'));

    await waitFor(() =>
      expect(mockMomentaState.equipItem).toHaveBeenCalledWith(
        'item-1',
        'theme',
        'profile_theme_ember'
      )
    );
    expect(await screen.findByText('Ember Theme is in use')).toBeTruthy();
    expect(
      screen.getByText('You bought Ember Theme, and Menta is now using it.')
    ).toBeTruthy();
  });

  it('keeps the purchase confirmed and explains how to recover when activation fails', async () => {
    mockMomentaState.balance = 100;
    mockMomentaState.shopItems = [
      {
        id: 'item-1',
        sku: 'profile_theme_ember',
        name: 'Ember Theme',
        description: 'A warm profile theme.',
        category: 'cosmetic',
        cost: 100,
      },
    ];
    mockMomentaState.purchaseItem.mockResolvedValueOnce({
      success: true,
      message: 'Successfully purchased Ember Theme!',
      outcome: 'confirmed',
      clientEventId: '22222222-2222-4222-8222-222222222222',
      receipt: {
        clientEventId: '22222222-2222-4222-8222-222222222222',
        itemId: 'item-1',
        itemName: 'Ember Theme',
        itemSku: 'profile_theme_ember',
        cost: 100,
        newBalance: 0,
        quantity: 1,
      },
    });
    mockMomentaState.equipItem.mockRejectedValueOnce(
      new Error('Equip temporarily unavailable')
    );

    render(<ShopItemDetailsScreen />);

    fireEvent.press(await screen.findByText('Buy for 100 Momenta'));
    fireEvent.press(await screen.findByTestId('shop-confirm-purchase'));

    expect(
      await screen.findByText(/Tap Use this style to apply it\.$/)
    ).toBeTruthy();
  });

  it('offers a durable receipt replay before checking the local balance', async () => {
    const clientEventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    mockMomentaState.pendingPurchaseAttempt = {
      userId: 'user-1',
      itemId: 'item-1',
      clientEventId,
    };
    mockMomentaState.purchaseItem.mockResolvedValueOnce({
      success: false,
      outcome: 'unknown',
      message: 'Receipt still pending.',
      clientEventId,
    });

    render(<ShopItemDetailsScreen />);

    fireEvent.press(await screen.findByText('Try purchase again'));
    expect(mockMomentaState.purchaseItem).toHaveBeenCalledWith(
      'user-1',
      'item-1'
    );
    expect(screen.queryByText('Get Momenta')).toBeNull();
  });

  async function openSponsorPaywall() {
    render(<ShopItemDetailsScreen />);
    fireEvent.press(await screen.findByText('Get Momenta'));
    fireEvent.press(screen.getByText('Watch an optional ad'));
    fireEvent.press(await screen.findByText('Play shop sponsor'));
  }

  it('does not expose a sponsor action when ads are disabled', async () => {
    mockAdsEnabled = false;
    render(<ShopItemDetailsScreen />);

    fireEvent.press(await screen.findByText('Get Momenta'));

    expect(screen.queryByText('Watch an optional ad')).toBeNull();
    expect(mockShowRewardedAdDetailed).not.toHaveBeenCalled();
    expect(mockClaimAdReward).not.toHaveBeenCalled();
  });

  it('hides the reserve pack when credit purchases are unavailable', async () => {
    render(<ShopItemDetailsScreen />);

    fireEvent.press(await screen.findByText('Get Momenta'));

    expect(screen.queryByText('Buy Momenta pack')).toBeNull();
    expect(screen.queryByText('Unavailable right now')).toBeNull();
  });

  it('does not request a credit when no sponsor video is available', async () => {
    mockShowRewardedAdDetailed.mockResolvedValue({
      earned: false,
      amount: 0,
      reason: 'no_fill',
    });

    await openSponsorPaywall();

    expect(await screen.findByText('shop-failed:no_fill')).toBeTruthy();
    expect(mockClaimAdReward).not.toHaveBeenCalled();
  });

  it('uses only the amount confirmed by the reward RPC', async () => {
    await openSponsorPaywall();

    expect(await screen.findByText('shop-earned:10')).toBeTruthy();
    expect(screen.queryByText('shop-earned:999')).toBeNull();
    expect(mockClaimAdReward).toHaveBeenCalledTimes(1);
  });
});
