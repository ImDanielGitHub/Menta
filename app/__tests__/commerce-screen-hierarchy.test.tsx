import React from 'react';
import { RefreshControl } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import InventoryScreen from '@/app/inventory';
import MomentaScreen from '@/app/momenta';
import ShopScreen from '@/app/shop';
import { showRewardedAdDetailed } from '@/lib/ads';
import { getInventoryEmptyCopy } from '@/lib/economy/contract';

const mockRouter = {
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

const mockAuthState = {
  isAuthenticated: true,
  user: { id: 'user-1' },
};

const mockShowRewardedAdDetailed = showRewardedAdDetailed as jest.Mock;

const mockMomentaState = {
  addMomenta: jest.fn().mockResolvedValue(true),
  balance: 0,
  claimAdReward: jest.fn().mockResolvedValue({ earned: true, amount: 10 }),
  equipItem: jest.fn().mockResolvedValue(undefined),
  fetchBalance: jest.fn().mockResolvedValue(undefined),
  fetchEquippedItems: jest.fn().mockResolvedValue(undefined),
  fetchOwnedItems: jest.fn().mockResolvedValue(undefined),
  fetchPurchasedItems: jest.fn().mockResolvedValue(undefined),
  fetchShopItems: jest.fn().mockResolvedValue(undefined),
  isEquipped: jest.fn(() => false),
  isPurchased: jest.fn(() => false),
  ownedItems: [] as unknown[],
  shopItems: [] as unknown[],
  syncWithBackend: jest.fn().mockResolvedValue(undefined),
  transactionHistoryError: null as string | null,
  transactions: [] as unknown[],
  unequipItem: jest.fn().mockResolvedValue(undefined),
};

const mockReferralState = {
  getReferralProgramStatus: jest.fn(),
};

let mockInventoryRows: unknown[] = [];
let mockInventoryError: { message: string } | null = null;
let mockAdsEnabled = true;
let mockSafeMode = false;

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthState,
}));

jest.mock('@/store/momenta-store', () => {
  const useMomentaStore = Object.assign(() => mockMomentaState, {
    getState: () => ({ walletSyncError: null }),
  });
  return { useMomentaStore };
});

jest.mock('@/store/referral-store', () => ({
  useReferralStore: (selector: (state: typeof mockReferralState) => unknown) =>
    selector(mockReferralState),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const query = {
        select: jest.fn(() => query),
        eq: jest.fn(async () => ({
          data: mockInventoryError ? null : mockInventoryRows,
          error: mockInventoryError,
        })),
      };
      return query;
    }),
  },
}));

jest.mock('@/components/ui/AppShell', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(View, null, children),
  };
});

jest.mock('@/components/ui/AppButton', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    AppButton: ({ onPress, title }: { onPress?: () => void; title: string }) =>
      ReactModule.createElement(
        Pressable,
        { accessibilityRole: 'button', onPress },
        ReactModule.createElement(Text, null, title)
      ),
  };
});

jest.mock('@/components/shop/ShopPrimitives', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');

  return {
    getShopCategoryId: (category?: string | null) => {
      if (category === 'cosmetic') return 'cosmetic';
      if (category === 'ai_upgrade') return 'ai_upgrade';
      return 'power_up';
    },
    getShopItemSku: (item: { id: string; sku?: string | null }) =>
      item.sku || item.id,
    ShopCollectionSkeleton: ({
      message,
      testID,
      title,
    }: {
      message?: string;
      testID?: string;
      title: string;
    }) =>
      ReactModule.createElement(
        View,
        { accessibilityRole: 'progressbar', accessibilityLabel: title, testID },
        ReactModule.createElement(Text, null, title),
        message ? ReactModule.createElement(Text, null, message) : null
      ),
    ShopFilterChips: ({
      filters,
    }: {
      filters: { id: string; label: string; count: number }[];
    }) =>
      ReactModule.createElement(
        View,
        { testID: 'shop-filters' },
        filters.map(filter =>
          ReactModule.createElement(
            Text,
            { key: filter.id },
            `${filter.label} ${filter.count}`
          )
        )
      ),
    ShopHeaderBlock: ({
      label,
      subtitle,
      title,
    }: {
      label: string;
      subtitle?: string;
      title: string;
    }) =>
      ReactModule.createElement(
        View,
        null,
        ReactModule.createElement(Text, null, label),
        ReactModule.createElement(Text, null, title),
        subtitle ? ReactModule.createElement(Text, null, subtitle) : null
      ),
    ShopSectionHeader: ({
      count,
      description,
      title,
    }: {
      count?: number;
      description?: string;
      title: string;
    }) =>
      ReactModule.createElement(
        View,
        null,
        ReactModule.createElement(Text, null, title),
        description ? ReactModule.createElement(Text, null, description) : null,
        typeof count === 'number'
          ? ReactModule.createElement(Text, null, `${count} items`)
          : null
      ),
    ShopListRow: ({
      actionLabel,
      item,
      rightLabel,
      stateLabel,
    }: {
      actionLabel?: string;
      item: { name: string };
      rightLabel?: string;
      stateLabel?: string;
    }) =>
      ReactModule.createElement(
        View,
        null,
        ReactModule.createElement(Text, null, item.name),
        stateLabel ? ReactModule.createElement(Text, null, stateLabel) : null,
        rightLabel ? ReactModule.createElement(Text, null, rightLabel) : null,
        actionLabel ? ReactModule.createElement(Text, null, actionLabel) : null
      ),
    ShopMetricStrip: ({
      metrics,
    }: {
      metrics: { label: string; value: string }[];
    }) =>
      ReactModule.createElement(
        View,
        { testID: 'shop-metrics' },
        metrics.map(metric =>
          ReactModule.createElement(
            View,
            { key: metric.label },
            ReactModule.createElement(Text, null, metric.label),
            ReactModule.createElement(Text, null, metric.value)
          )
        )
      ),
    ShopStatePanel: ({
      actionTitle,
      message,
      onAction,
      testID,
      title,
    }: {
      actionTitle?: string;
      message?: string;
      onAction?: () => void;
      testID?: string;
      title: string;
    }) =>
      ReactModule.createElement(
        View,
        { testID },
        ReactModule.createElement(Text, null, title),
        message ? ReactModule.createElement(Text, null, message) : null,
        actionTitle
          ? ReactModule.createElement(
              Pressable,
              { accessibilityRole: 'button', onPress: onAction },
              ReactModule.createElement(Text, null, actionTitle)
            )
          : null
      ),
  };
});

jest.mock('@/components/momenta/TransactionHistory', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    __esModule: true,
    default: ({
      error,
      onRefresh,
      title,
    }: {
      error?: string | null;
      onRefresh?: () => void;
      title: string;
    }) =>
      ReactModule.createElement(
        View,
        null,
        ReactModule.createElement(Text, null, title),
        error
          ? ReactModule.createElement(
              ReactModule.Fragment,
              null,
              ReactModule.createElement(
                Text,
                null,
                'Wallet activity did not load'
              ),
              ReactModule.createElement(
                Pressable,
                { accessibilityRole: 'button', onPress: onRefresh },
                ReactModule.createElement(Text, null, 'Check again')
              )
            )
          : null
      ),
  };
});

jest.mock('@/components/momenta/MomentaActionNoticeSheet', () => {
  const ReactModule = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    MomentaActionNoticeSheet: ({
      notice,
      onClose,
      onRefresh,
      refreshing,
      testID,
      visible,
    }: {
      notice?: {
        message?: string;
        refreshActionTitle?: string;
        title?: string;
      } | null;
      onClose: () => void;
      onRefresh?: () => void;
      refreshing?: boolean;
      testID?: string;
      visible: boolean;
    }) =>
      visible
        ? ReactModule.createElement(
            View,
            { testID },
            ReactModule.createElement(Text, null, notice?.title),
            ReactModule.createElement(Text, null, notice?.message),
            notice?.refreshActionTitle && onRefresh
              ? ReactModule.createElement(
                  Pressable,
                  {
                    accessibilityRole: 'button',
                    disabled: refreshing,
                    onPress: onRefresh,
                  },
                  ReactModule.createElement(
                    Text,
                    null,
                    refreshing
                      ? 'Refreshing balance…'
                      : notice.refreshActionTitle
                  )
                )
              : null,
            ReactModule.createElement(
              Pressable,
              {
                accessibilityRole: 'button',
                disabled: refreshing,
                onPress: onClose,
              },
              ReactModule.createElement(Text, null, 'Close')
            )
          )
        : null,
  };
});

jest.mock('@/components/paywall/PaywallModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/SimpleBottomSheet', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      testID,
      scrollableBody,
      footer,
      visible,
    }: {
      children: React.ReactNode;
      testID?: string;
      scrollableBody?: React.ReactNode;
      footer?: React.ReactNode;
      visible: boolean;
    }) =>
      visible
        ? ReactModule.createElement(
            View,
            { testID },
            scrollableBody ?? children,
            footer
          )
        : null,
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => {
  const ReactModule = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SkeletonLoader: () => ReactModule.createElement(View),
  };
});

jest.mock('@/hooks/useOperationalFlag', () => ({
  useOperationalFlag: (key: string) => ({
    enabled:
      key === 'ads_enabled'
        ? mockAdsEnabled
        : key === 'safe_mode'
          ? mockSafeMode
          : false,
    loading: false,
  }),
}));

jest.mock('@/lib/hooks/useAdReward', () => ({
  useAdRewardAmount: () => 10,
}));

jest.mock('@/lib/ads', () => ({
  isAdUnavailableReason: () => false,
  showRewardedAdDetailed: jest.fn(),
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
  recordProductAnalyticsEvent: jest.fn(),
}));

jest.mock('@/lib/paywall/revenuecat', () => ({
  REVENUECAT_SUPPORTED: false,
  RevenueCatAPI: { getCreditOfferings: jest.fn() },
  purchaseCredits: jest.fn(),
}));

describe('commerce screen hierarchy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInventoryRows = [];
    mockInventoryError = null;
    mockAdsEnabled = true;
    mockSafeMode = false;
    mockMomentaState.balance = 0;
    mockMomentaState.ownedItems = [];
    mockMomentaState.shopItems = [];
    mockMomentaState.transactionHistoryError = null;
    mockMomentaState.transactions = [];
    mockMomentaState.fetchShopItems.mockResolvedValue(undefined);
    mockMomentaState.fetchBalance.mockResolvedValue(undefined);
    mockMomentaState.fetchEquippedItems.mockResolvedValue(undefined);
    mockMomentaState.fetchOwnedItems.mockResolvedValue(undefined);
    mockMomentaState.fetchPurchasedItems.mockResolvedValue(undefined);
    mockMomentaState.syncWithBackend.mockResolvedValue(undefined);
    mockMomentaState.claimAdReward.mockResolvedValue({
      earned: true,
      amount: 10,
    });
    mockReferralState.getReferralProgramStatus.mockResolvedValue({
      programmeEnabled: true,
      rewardAmount: 50,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 3,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });
    mockShowRewardedAdDetailed.mockResolvedValue({
      earned: true,
      amount: 10,
      type: 'Momenta',
    });
  });

  it('shows one clear Boosts shelf with plain item affordability', async () => {
    mockMomentaState.balance = 20;
    mockMomentaState.shopItems = [
      {
        id: 'item-1',
        sku: 'time_extension_1',
        name: 'Time extension',
        description: 'Adds more time.',
        category: 'power_up',
        cost: 50,
      },
    ];

    render(<ShopScreen />);

    expect(await screen.findByRole('header', { name: 'Shop' })).toBeTruthy();
    expect(screen.getByText('Momenta balance')).toBeTruthy();
    expect(screen.getByText('20 Momenta')).toBeTruthy();
    expect(screen.queryByTestId('shop-filters')).toBeNull();
    expect(screen.getByText('12-hour Extension')).toBeTruthy();
    expect(screen.getByText('30 Momenta short')).toBeTruthy();
    expect(screen.getByTestId('shop-section-boosts')).toBeTruthy();
    expect(
      screen.getByText('Protection and extra time for active promises.')
    ).toBeTruthy();
    expect(screen.queryByText('Choose an item')).toBeNull();
    expect(screen.queryByText('Support shelf')).toBeNull();
    expect(screen.queryByText(/protect the habit/i)).toBeNull();
  });

  it('gives boosts, themes, and profile frames one top-level shelf each', async () => {
    mockMomentaState.balance = 500;
    mockMomentaState.shopItems = [
      {
        id: 'extension-1',
        sku: 'time_extension_1',
        name: 'Time extension',
        description: 'Adds more time.',
        category: 'power_up',
        cost: 50,
      },
      {
        id: 'theme-1',
        sku: 'profile_theme_ember',
        name: 'Ember Theme',
        description: 'Changes the Menta accent.',
        category: 'cosmetic',
        cost: 100,
      },
      {
        id: 'frame-1',
        sku: 'avatar_frame_week',
        name: 'Week Frame',
        description: 'Frames your profile photo.',
        category: 'cosmetic',
        cost: 0,
      },
    ];

    render(<ShopScreen />);

    expect(await screen.findByTestId('shop-section-boosts')).toBeTruthy();
    expect(screen.getByTestId('shop-section-themes')).toBeTruthy();
    expect(screen.getByTestId('shop-section-frames')).toBeTruthy();
    expect(screen.getAllByText('Boosts')).toHaveLength(1);
    expect(screen.getAllByText('Themes')).toHaveLength(1);
    expect(screen.getAllByText('Profile frames')).toHaveLength(1);
    expect(
      screen.getByText('Change Menta’s colour and surface style.')
    ).toBeTruthy();
    expect(
      screen.getByText('Add a distinctive frame around your profile photo.')
    ).toBeTruthy();
    expect(screen.queryByText('Style')).toBeNull();
    expect(screen.queryByTestId('shop-section-cosmetic')).toBeNull();
  });

  it('keeps an empty shop direct and recoverable', async () => {
    render(<ShopScreen />);

    expect(await screen.findByTestId('shop-empty-state')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Shop' })).toBeTruthy();
    expect(screen.getByText('0 Momenta')).toBeTruthy();
    expect(screen.getByText('No items are available right now')).toBeTruthy();
    expect(screen.getByText('Check again')).toBeTruthy();
    expect(screen.queryByText('Support shelf')).toBeNull();
  });

  it('keeps the catalogue browsable when wallet details fail', async () => {
    mockMomentaState.shopItems = [
      {
        id: 'item-1',
        sku: 'time_extension_1',
        name: 'Time extension',
        description: 'Adds more time.',
        category: 'power_up',
        cost: 50,
      },
    ];
    mockMomentaState.fetchBalance.mockRejectedValueOnce(
      new Error('Wallet unavailable')
    );

    render(<ShopScreen />);

    expect(await screen.findByText('12-hour Extension')).toBeTruthy();
    expect(
      (await screen.findAllByText('Balance and items unavailable')).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Momenta balance')).toBeNull();
    expect(screen.getByTestId('shop-section-boosts')).toBeTruthy();
  });

  it('shows one empty inventory hierarchy without zero metrics or filters', async () => {
    render(<InventoryScreen />);

    expect(await screen.findByTestId('inventory-empty-state')).toBeTruthy();
    expect(screen.getByText('Your items')).toBeTruthy();
    expect(screen.getByText(getInventoryEmptyCopy())).toBeTruthy();
    expect(screen.getByText('Open shop')).toBeTruthy();
    expect(screen.getByText('Wallet')).toBeTruthy();
    expect(screen.getByText('Shop')).toBeTruthy();
    expect(
      screen.getByTestId('momenta-section-nav-items').props.accessibilityState
    ).toEqual({ selected: true });
    expect(screen.queryByText('Momenta')).toBeNull();
    expect(screen.queryByText('MOMENTA')).toBeNull();
    expect(screen.queryByTestId('shop-metrics')).toBeNull();
    expect(screen.queryByTestId('shop-filters')).toBeNull();
    expect(screen.queryByText(/rescue consistency/i)).toBeNull();

    fireEvent.press(screen.getByText('Open shop'));
  });

  it('preserves controls and actions when inventory has an item', async () => {
    mockMomentaState.shopItems = [
      {
        id: 'item-1',
        sku: 'time_extension_1',
        name: 'Time extension',
        description: 'Adds more time.',
        category: 'power_up',
        cost: 50,
      },
    ];
    mockInventoryRows = [{ item_sku: 'time_extension_1', quantity: 2 }];

    render(<InventoryScreen />);

    await waitFor(() =>
      expect(screen.getByText('12-hour Extension')).toBeTruthy()
    );
    expect(screen.getByText('Your items')).toBeTruthy();
    expect(screen.getAllByText('Items')).toHaveLength(2);
    expect(
      screen.getByTestId('momenta-section-nav-items').props.accessibilityState
    ).toEqual({ selected: true });
    expect(screen.getByText('Boosts')).toBeTruthy();
    expect(screen.getByText('All 1')).toBeTruthy();
    expect(screen.getByText('2 available')).toBeTruthy();
    expect(screen.getByText('Choose')).toBeTruthy();
  });

  it('separates automatic protection, ready boosts and appearance in the owned kit', async () => {
    mockMomentaState.shopItems = [
      {
        id: 'freeze-1',
        sku: 'streak_freeze_basic',
        name: 'Streak Freeze',
        description: 'Protect one missed day.',
        category: 'power_up',
        cost: 150,
      },
      {
        id: 'extension-1',
        sku: 'time_extension_1',
        name: 'Time extension',
        description: 'Adds more time.',
        category: 'power_up',
        cost: 50,
      },
      {
        id: 'theme-1',
        sku: 'profile_theme_ember',
        name: 'Ember Theme',
        description: 'Changes the Menta accent.',
        category: 'cosmetic',
        cost: 100,
      },
    ];
    mockInventoryRows = [
      { item_sku: 'streak_freeze_basic', quantity: 1 },
      { item_sku: 'time_extension_1', quantity: 2 },
      { item_sku: 'profile_theme_ember', quantity: 1 },
    ];

    render(<InventoryScreen />);

    expect(
      await screen.findByTestId('inventory-section-automatic')
    ).toBeTruthy();
    expect(screen.getByTestId('inventory-section-ready')).toBeTruthy();
    expect(screen.getByTestId('inventory-section-appearance')).toBeTruthy();
    expect(screen.getByText('Automatic protection')).toBeTruthy();
    expect(screen.getByText('Ready to use')).toBeTruthy();
    expect(screen.getByText('Appearance')).toBeTruthy();
  });

  it('describes streak freezes as automatic instead of offering manual use', async () => {
    mockMomentaState.shopItems = [
      {
        id: 'freeze-1',
        sku: 'streak_freeze_basic',
        name: 'Streak Freeze',
        description: 'Protect one missed day.',
        category: 'power_up',
        cost: 150,
      },
    ];
    mockInventoryRows = [{ item_sku: 'streak_freeze_basic', quantity: 1 }];

    render(<InventoryScreen />);

    expect(await screen.findByText('Streak Freeze')).toBeTruthy();
    expect(screen.getByText('1 available')).toBeTruthy();
    expect(screen.getByText('How it works')).toBeTruthy();
    expect(screen.queryByText('Use')).toBeNull();
  });

  it('keeps an empty confirmed inventory visible while showing refresh failure', async () => {
    const view = render(<InventoryScreen />);

    expect(await screen.findByTestId('inventory-empty-state')).toBeTruthy();
    mockInventoryError = { message: 'Network request failed' };

    await act(async () => {
      await view.UNSAFE_getByType(RefreshControl).props.onRefresh();
    });

    expect(await screen.findByTestId('inventory-refresh-warning')).toBeTruthy();
    expect(screen.getByText('Items may be out of date')).toBeTruthy();
    expect(
      screen.getByText(/last balance and items are still shown/i)
    ).toBeTruthy();
    expect(screen.getByTestId('inventory-empty-state')).toBeTruthy();
  });

  it('shows a zero Momenta balance with one explanation and a plain empty activity state', async () => {
    render(<MomentaScreen />);

    expect(await screen.findByRole('header', { name: 'Momenta' })).toBeTruthy();
    expect(screen.getByText('Balance')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(
      screen.getByText(
        'Your first promise and group are free. Use Momenta for extra promises, groups, freezes and shop items. It has no cash value.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Activity')).toBeTruthy();
    expect(
      screen.getByText(
        'Confirmed rewards, purchases and spending will appear here.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Earn Momenta')).toBeTruthy();
    expect(screen.getByText('Open shop')).toBeTruthy();
    expect(screen.getByText('Momenta')).toBeTruthy();
    expect(screen.queryByText('MOMENTA')).toBeNull();
    expect(screen.queryByText('Your support balance')).toBeNull();
    expect(screen.queryByText('ACCOUNT LEDGER')).toBeNull();
    expect(screen.queryByText('AVAILABLE')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Open shop' }));
  });

  it('shows wallet history failure before the genuine-empty message', async () => {
    mockMomentaState.transactionHistoryError = 'History request failed';

    render(<MomentaScreen />);

    expect(
      await screen.findByText('Wallet activity did not load')
    ).toBeTruthy();
    expect(screen.getByText('Check again')).toBeTruthy();
    expect(
      screen.queryByText(
        'Confirmed rewards, purchases and spending will appear here.'
      )
    ).toBeNull();
  });

  it('does not offer a reserve pack when native credit purchases are unavailable', async () => {
    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));

    expect(screen.getByText('Invite someone')).toBeTruthy();
    expect(screen.getByText('Earn by reviewing')).toBeTruthy();
    expect(screen.queryByText('Buy Momenta pack')).toBeNull();
    expect(screen.queryByText('Buy reserve pack')).toBeNull();
    expect(screen.queryByText(/App Store price/i)).toBeNull();
  });

  it('hides sponsor rewards when ads are disabled', async () => {
    mockAdsEnabled = false;

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));

    expect(
      screen.getByText(
        'Menta can add it after confirmed reviews or streak milestones. You can also choose an optional sponsor or buy a pack.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Buy Momenta pack')).toBeNull();
    expect(screen.queryByText('Buy reserve pack')).toBeNull();
    expect(screen.getByText('Invite someone')).toBeTruthy();
    expect(
      await screen.findByText(
        '50 each when a new member joins and makes their first promise'
      )
    ).toBeTruthy();
    expect(screen.getByText('3/10')).toBeTruthy();
    expect(screen.queryByText('See earning paths')).toBeNull();
    expect(screen.queryByText('Watch an optional ad')).toBeNull();
    expect(mockShowRewardedAdDetailed).not.toHaveBeenCalled();
    expect(mockMomentaState.claimAdReward).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Invite someone'));
    expect(mockRouter.push).toHaveBeenCalledWith('/share-invite');
  });

  it('does not promise referral rewards when the programme is paused', async () => {
    mockReferralState.getReferralProgramStatus.mockResolvedValueOnce({
      programmeEnabled: false,
      rewardAmount: 50,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 3,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });

    render(<MomentaScreen />);
    fireEvent.press(await screen.findByText('Earn Momenta'));

    expect(await screen.findByText('Referral rewards are paused')).toBeTruthy();
    expect(screen.getByText('Paused')).toBeTruthy();
    expect(screen.queryByText(/You both earn/)).toBeNull();
  });

  it('hides sponsor rewards while safe mode is active', async () => {
    mockSafeMode = true;

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));

    expect(screen.queryByText('Watch an optional ad')).toBeNull();
  });

  it('shows one receipt using the server-confirmed sponsor amount', async () => {
    mockShowRewardedAdDetailed.mockResolvedValue({
      earned: true,
      amount: 999,
      type: 'test-ad-unit',
    });
    mockMomentaState.claimAdReward.mockResolvedValue({
      earned: true,
      amount: 10,
    });

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));
    fireEvent.press(screen.getByText('Watch an optional ad'));

    expect(await screen.findByText('Momenta added')).toBeTruthy();
    expect(
      screen.getByText('10 Momenta was added to your balance.')
    ).toBeTruthy();
    expect(screen.queryByText(/999 Momenta/)).toBeNull();
    expect(mockMomentaState.claimAdReward).toHaveBeenCalledTimes(1);
  });

  it('closes earning options and shows one checking sheet while the authoritative claim is pending', async () => {
    let resolveClaim:
      | ((value: { earned: true; amount: 10 }) => void)
      | undefined;
    const pendingClaim = new Promise<{ earned: true; amount: 10 }>(resolve => {
      resolveClaim = resolve;
    });
    mockMomentaState.claimAdReward.mockReturnValueOnce(pendingClaim);

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));
    const watchSponsor = screen.getByText('Watch an optional ad');
    fireEvent.press(watchSponsor);
    fireEvent.press(watchSponsor);

    expect(await screen.findByText('Checking your reward')).toBeTruthy();
    expect(screen.getByText('Keep this open until it finishes.')).toBeTruthy();
    expect(screen.queryByTestId('momenta-top-up-sheet')).toBeNull();
    expect(screen.getByTestId('momenta-notice-sheet')).toBeTruthy();
    expect(mockShowRewardedAdDetailed).toHaveBeenCalledTimes(1);
    expect(mockMomentaState.claimAdReward).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Momenta added')).toBeNull();

    await act(async () => {
      resolveClaim?.({ earned: true, amount: 10 });
      await pendingClaim;
    });

    expect(await screen.findByText('Momenta added')).toBeTruthy();
  });

  it('replaces earning options with one notice when the sponsor earns nothing', async () => {
    mockShowRewardedAdDetailed.mockResolvedValueOnce({
      earned: false,
      amount: 0,
      reason: 'error',
    });

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));
    fireEvent.press(screen.getByText('Watch an optional ad'));

    expect(await screen.findByText('No reward earned')).toBeTruthy();
    expect(screen.queryByTestId('momenta-top-up-sheet')).toBeNull();
    expect(screen.getByTestId('momenta-notice-sheet')).toBeTruthy();
    expect(mockMomentaState.claimAdReward).not.toHaveBeenCalled();
  });

  it('shows the missing-reward recovery and refreshes the wallet without a second claim', async () => {
    mockMomentaState.claimAdReward.mockResolvedValueOnce({
      earned: false,
      amount: 0,
      reason: 'unknown',
    });

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));
    fireEvent.press(screen.getByText('Watch an optional ad'));

    expect(
      await screen.findByText('The reward hasn\u2019t arrived')
    ).toBeTruthy();
    expect(
      screen.getByText('Refresh your balance before watching another sponsor.')
    ).toBeTruthy();
    expect(screen.queryByTestId('momenta-top-up-sheet')).toBeNull();
    expect(mockMomentaState.claimAdReward).toHaveBeenCalledTimes(1);

    const walletSyncCalls = mockMomentaState.syncWithBackend.mock.calls.length;
    fireEvent.press(screen.getByRole('button', { name: 'Refresh balance' }));

    await waitFor(() =>
      expect(mockMomentaState.syncWithBackend).toHaveBeenCalledTimes(
        walletSyncCalls + 1
      )
    );
    expect(mockMomentaState.claimAdReward).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Wallet updated')).toBeTruthy();
  });

  it('uses the definitive daily sponsor limit sheet copy', async () => {
    mockMomentaState.claimAdReward.mockResolvedValueOnce({
      earned: false,
      amount: 0,
      reason: 'daily-limit',
      message: "You've collected today's sponsor rewards. Try again tomorrow.",
    });

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));
    fireEvent.press(screen.getByText('Watch an optional ad'));

    expect(await screen.findByText('That\u2019s all for today')).toBeTruthy();
    expect(
      screen.getByText('You\u2019ve collected today\u2019s sponsor rewards.')
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
    expect(screen.queryByText('Momenta added')).toBeNull();
    expect(mockMomentaState.claimAdReward).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('That\u2019s all for today')).toBeNull();
  });

  it('treats a rejected authoritative claim as missing instead of ad failure', async () => {
    mockMomentaState.claimAdReward.mockRejectedValueOnce(
      new Error('claim unavailable')
    );

    render(<MomentaScreen />);

    fireEvent.press(await screen.findByText('Earn Momenta'));
    fireEvent.press(screen.getByText('Watch an optional ad'));

    expect(
      await screen.findByText('The reward hasn\u2019t arrived')
    ).toBeTruthy();
    expect(screen.queryByText('Ad unavailable')).toBeNull();
    expect(mockMomentaState.claimAdReward).toHaveBeenCalledTimes(1);
  });
});
