import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import {
  MomentaSectionNav,
  useMomentaSectionIsActive,
  useMomentaPrimaryTab,
  useMomentaSectionNavigation,
} from '@/components/momenta/MomentaSectionNav';
import { ProEntry } from '@/components/paywall/pro-entry';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { IPadShopCatalogueWorkspace } from '@/components/ipad/IPadShopWorkspace';
import { useIPadPortraitWorkspace } from '@/components/ipad/ipad-workspace';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen } from '@/components/ui/AppShell';
import { BoostsRow, type BoostsRowItem } from '@/components/ui/BoostsRow';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ArrowLeftIcon } from '@/components/ui/icons';
import {
  getShopCategoryId,
  getShopItemSku,
  ShopCollectionSkeleton,
  ShopSectionHeader,
  ShopStatePanel,
  type ShopCategoryId,
} from '@/components/shop/ShopPrimitives';
import { MomentaBalanceChip } from '@/components/shop/MomentaBalanceChip';
import {
  ShopItemCard,
  type ShopItemCardTrail,
} from '@/components/shop/ShopItemCard';
import { ShopPressable } from '@/components/shop/ShopPressable';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  getCommerceNotice,
  isOfflineCommerceError,
} from '@/lib/commerce/commerce-state';
import { decodeInventoryReadback } from '@/lib/commerce/commerce-readback';
import {
  filterSupportedCatalogItems,
  formatStreakUnlockCopy,
  getAppearanceSupport,
  getShopItemDisplayCopy,
  getUnlockStreakDays,
  isSupportedCatalogSku,
  NEW_THEME_SKUS,
} from '@/lib/shop/catalogSupport';
import { claimStreakShopUnlocks } from '@/lib/shop/streak-unlocks';
import { isShopPowerUp } from '@/lib/shop/powerUpSupport';
import { supabase } from '@/lib/supabase';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/localization/use-translation';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { type ShopItem, useMomentaStore } from '@/store/momenta-store';

type InventoryRow = {
  item_sku: string;
  quantity: number;
};

type ShopShelfId = 'boosts' | 'themes' | 'frames' | 'ai';

const NEW_SKUS: ReadonlySet<string> = new Set(NEW_THEME_SKUS);

function getShopState({
  item,
  balance,
  inventoryCount,
  purchased,
  equipped,
  t,
  formatNumber,
}: {
  item: ShopItem;
  balance: number;
  inventoryCount: number;
  purchased: boolean;
  equipped: boolean;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
}) {
  const cost = Number(item.cost || 0);
  const powerUp = isShopPowerUp(item.category);
  const unlockDays = getUnlockStreakDays(item.sku, item.unlock_streak_days);

  if (inventoryCount > 0 && powerUp)
    return t('commerce.shop.availableCount', { count: inventoryCount });
  if (equipped) return t('commerce.shop.inUse');
  if (purchased || inventoryCount > 0) return t('commerce.shop.owned');
  if (unlockDays) return formatStreakUnlockCopy(unlockDays, t);
  if (balance < cost) {
    return t('commerce.shop.short', {
      amount: formatNumber(cost - balance),
    });
  }
  return t('commerce.shop.available');
}

function getShopTrail({
  accountDetailsReady,
  balance,
  cost,
  equipped,
  formatNumber,
  powerUp,
  purchased,
  t,
  unlockDays,
}: {
  accountDetailsReady: boolean;
  balance: number;
  cost: number;
  equipped: boolean;
  formatNumber: (value: number) => string;
  powerUp: boolean;
  purchased: boolean;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  unlockDays: number | null;
}): ShopItemCardTrail {
  const price = cost > 0 ? formatNumber(cost) : t('commerce.shop.free');
  const locked = unlockDays
    ? ({
        kind: 'locked',
        label: t('commerce.shop.streak', { days: unlockDays }),
        reason: formatStreakUnlockCopy(unlockDays, t),
      } as const)
    : null;

  if (!accountDetailsReady) return locked ?? { kind: 'price', label: price };
  if (!powerUp && equipped) {
    return { kind: 'owned', label: t('commerce.shop.inUse') };
  }
  if (!powerUp && purchased) {
    return { kind: 'owned', label: t('commerce.shop.owned') };
  }
  if (locked) return locked;
  if (balance < cost) {
    return {
      kind: 'short',
      label: price,
      reason: t('commerce.shop.short', {
        amount: formatNumber(cost - balance),
      }),
    };
  }
  return { kind: 'price', label: price };
}

export default function ShopScreen() {
  const selectSection = useMomentaSectionNavigation();
  const inPrimaryTab = useMomentaPrimaryTab();
  const sectionActive = useMomentaSectionIsActive('shop');
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { locale, t } = useTranslation();
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  );
  const formatNumber = useCallback(
    (value: number) => numberFormatter.format(value),
    [numberFormatter]
  );
  const phoneLayout = usePhoneLayout();
  const usesIPadWorkspace = useIPadPortraitWorkspace();
  const insetPadding = screenInsetPadding(phoneLayout);
  const user = useAuthStore(state => state.user);
  const {
    balance,
    fetchBalance,
    fetchEquippedItems,
    fetchOwnedItems,
    fetchPurchasedItems,
    fetchShopItems,
    equippedItems,
    purchasedItems,
    ownedItems,
    shopItems,
  } = useMomentaStore(
    useShallow(state => ({
      balance: state.balance,
      fetchBalance: state.fetchBalance,
      fetchEquippedItems: state.fetchEquippedItems,
      fetchOwnedItems: state.fetchOwnedItems,
      fetchPurchasedItems: state.fetchPurchasedItems,
      fetchShopItems: state.fetchShopItems,
      equippedItems: state.equippedItems,
      purchasedItems: state.purchasedItems,
      ownedItems: state.ownedItems,
      shopItems: state.shopItems,
    }))
  );

  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const hasPersistedCatalogRef = useRef(shopItems.length > 0);
  const [loading, setLoading] = useState(!hasPersistedCatalogRef.current);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(Boolean(user?.id));
  const [walletError, setWalletError] = useState<string | null>(null);
  const hasLoadedCatalogRef = useRef(false);

  const loadInventory = useCallback(async () => {
    if (!user?.id) {
      setInventoryRows([]);
      return;
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('item_sku, quantity')
      .eq('user_id', user.id);

    if (error) throw error;
    const decoded = decodeInventoryReadback(data);
    if (!decoded) throw new Error('Inventory readback could not be verified.');
    setInventoryRows(decoded);
  }, [user?.id]);

  const loadWallet = useCallback(async () => {
    if (!user?.id) {
      setWalletLoading(false);
      setWalletError(null);
      return;
    }

    setWalletLoading(true);
    const reads = () =>
      Promise.allSettled([
        fetchBalance(user.id, { throwOnError: true }),
        fetchEquippedItems(user.id, { throwOnError: true }),
        fetchOwnedItems(user.id, { throwOnError: true }),
        fetchPurchasedItems(user.id, { throwOnError: true }),
        loadInventory(),
      ]);

    try {
      const firstRead = await reads();
      const firstFailure = firstRead.find(
        result => result.status === 'rejected'
      );
      if (firstFailure?.status === 'rejected') throw firstFailure.reason;

      await claimStreakShopUnlocks();
      const confirmedRead = await reads();
      const confirmedFailure = confirmedRead.find(
        result => result.status === 'rejected'
      );
      if (confirmedFailure?.status === 'rejected') {
        throw confirmedFailure.reason;
      }
      setWalletError(null);
    } catch (error) {
      setWalletError(
        getCommerceNotice(
          isOfflineCommerceError(error) ? 'offline' : 'fetch-error',
          undefined,
          t
        ).message
      );
    } finally {
      setWalletLoading(false);
    }
  }, [
    fetchBalance,
    fetchEquippedItems,
    fetchOwnedItems,
    fetchPurchasedItems,
    loadInventory,
    t,
    user?.id,
  ]);

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
        setLoadError(null);
      } else {
        setRefreshError(null);
      }

      const catalogLoad = fetchShopItems({ throwOnError: true });
      const walletLoad = loadWallet();
      try {
        await catalogLoad;
        hasLoadedCatalogRef.current = true;
        setLoadError(null);
        setRefreshError(null);
      } catch (error) {
        console.error('[Shop] Failed to load catalog', error);
        const message = getCommerceNotice(
          isOfflineCommerceError(error) ? 'offline' : 'fetch-error',
          undefined,
          t
        ).message;
        if (showLoading || !hasLoadedCatalogRef.current) {
          setLoadError(message);
        } else {
          setRefreshError(message);
        }
      } finally {
        void walletLoad;
        setLoading(false);
      }
    },
    [fetchShopItems, loadWallet, t]
  );

  useEffect(() => {
    if (!sectionActive) return;
    void load(!hasLoadedCatalogRef.current && !hasPersistedCatalogRef.current);
  }, [load, sectionActive]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(false);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const inventoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const row of inventoryRows) {
      const quantity = Number(row.quantity || 0);
      if (quantity > 0 && isSupportedCatalogSku(row.item_sku)) {
        counts[row.item_sku] = quantity;
      }
    }

    for (const row of ownedItems || []) {
      const item = row.catalog_items;
      if (!item) continue;
      const sku = getShopItemSku(item);
      const quantity = isShopPowerUp(item.category)
        ? Number(row.usage_count || 0)
        : 1;
      counts[sku] = Math.max(counts[sku] || 0, quantity);
    }

    return counts;
  }, [inventoryRows, ownedItems]);

  const availableItems = useMemo(
    () =>
      filterSupportedCatalogItems(shopItems || []).sort((a, b) => {
        const categoryOrder: Record<ShopCategoryId, number> = {
          all: 0,
          power_up: 1,
          cosmetic: 2,
          ai_upgrade: 3,
        };
        const aCategory = getShopCategoryId(a.category);
        const bCategory = getShopCategoryId(b.category);

        if (aCategory !== bCategory) {
          return categoryOrder[aCategory] - categoryOrder[bCategory];
        }

        return Number(a.cost || 0) - Number(b.cost || 0);
      }),
    [shopItems]
  );

  const catalogSections = useMemo(() => {
    const shelves: { id: ShopShelfId; items: ShopItem[] }[] = [
      {
        id: 'boosts',
        items: availableItems.filter(
          item => getShopCategoryId(item.category) === 'power_up'
        ),
      },
      {
        id: 'themes',
        items: availableItems.filter(
          item =>
            getAppearanceSupport(getShopItemSku(item))?.equipCategory ===
            'theme'
        ),
      },
      {
        id: 'frames',
        items: availableItems.filter(
          item =>
            getAppearanceSupport(getShopItemSku(item))?.equipCategory ===
            'avatar_frame'
        ),
      },
      {
        id: 'ai',
        items: availableItems.filter(
          item => getShopCategoryId(item.category) === 'ai_upgrade'
        ),
      },
    ];

    return shelves
      .filter(section => section.items.length > 0)
      .map(section => ({
        ...section,
        title:
          section.id === 'boosts'
            ? t('commerce.shop.boosts')
            : section.id === 'themes'
              ? t('commerce.shop.themes')
              : section.id === 'frames'
                ? t('commerce.shop.frames')
                : t('commerce.shop.aiTools'),
        description:
          section.id === 'boosts'
            ? t('commerce.shop.boostsDetail')
            : section.id === 'themes'
              ? t('commerce.shop.themesDetail')
              : section.id === 'frames'
                ? t('commerce.shop.framesDetail')
                : t('commerce.shop.aiToolsDetail'),
      }));
  }, [availableItems, t]);

  const purchasedItemIds = useMemo(
    () => new Set(purchasedItems),
    [purchasedItems]
  );
  const equippedItemIds = useMemo(
    () => new Set(Object.values(equippedItems)),
    [equippedItems]
  );
  const accountDetailsReady = !walletLoading && !walletError;

  const ownedRowItems = useMemo<BoostsRowItem[]>(() => {
    if (!accountDetailsReady) return [];
    return availableItems.flatMap(item => {
      const sku = getShopItemSku(item);
      const count = inventoryCounts[sku] || 0;
      const powerUp = isShopPowerUp(item.category);
      const equipped = equippedItemIds.has(item.id);
      const owned = purchasedItemIds.has(item.id) || count > 0;
      if (powerUp ? count <= 0 : !owned) return [];
      const { name } = getShopItemDisplayCopy(item, t);
      const badge = powerUp
        ? t('commerce.shop.quantity', { count: formatNumber(count) })
        : equipped
          ? t('commerce.shop.inUse')
          : t('commerce.shop.owned');
      const row: BoostsRowItem = {
        sku,
        label: name,
        badge,
        badgeTone: !powerUp && equipped ? 'success' : 'action',
        accessibilityLabel: t('commerce.shop.ownedTileAccessibility', {
          name,
          state: powerUp ? t('commerce.shop.availableCount', { count }) : badge,
        }),
        onPress: () => router.push(`/shop/${item.id}`),
      };
      return [row];
    });
  }, [
    accountDetailsReady,
    availableItems,
    equippedItemIds,
    formatNumber,
    inventoryCounts,
    purchasedItemIds,
    router,
    t,
  ]);

  const renderItemCard = (item: ShopItem) => {
    const sku = getShopItemSku(item);
    const { name, description } = getShopItemDisplayCopy(item, t);
    const inventoryCount = inventoryCounts[sku] || 0;
    const powerUp = isShopPowerUp(item.category);
    const purchased = purchasedItemIds.has(item.id) || inventoryCount > 0;
    const equipped = equippedItemIds.has(item.id);
    const cost = Number(item.cost || 0);
    const unlockDays = getUnlockStreakDays(sku, item.unlock_streak_days);
    const status = accountDetailsReady
      ? getShopState({
          item,
          balance,
          inventoryCount,
          purchased,
          equipped,
          t,
          formatNumber,
        })
      : t('commerce.shop.loadingAccount');
    const trail = getShopTrail({
      accountDetailsReady,
      balance,
      cost,
      equipped,
      formatNumber,
      powerUp,
      purchased,
      t,
      unlockDays,
    });
    const isNew = accountDetailsReady && !purchased && NEW_SKUS.has(sku);

    return (
      <ShopItemCard
        key={item.id}
        sku={sku}
        name={name}
        description={description}
        trail={trail}
        tag={
          isNew ? { label: t('commerce.shop.tagNew'), tone: 'action' } : null
        }
        quantity={
          accountDetailsReady && powerUp && inventoryCount > 0
            ? inventoryCount
            : null
        }
        quantityLabel={t('commerce.shop.quantity', {
          count: formatNumber(inventoryCount),
        })}
        selected={accountDetailsReady && !powerUp && equipped}
        onPress={() => router.push(`/shop/${item.id}`)}
        accessibilityLabel={t('commerce.shop.cardAccessibility', {
          name,
          price: unlockDays
            ? t('commerce.shop.streak', { days: unlockDays })
            : cost > 0
              ? t('commerce.shop.spendBalance', { amount: formatNumber(cost) })
              : t('commerce.shop.free'),
          status,
        })}
        testID={`shop-item-${item.id}`}
      />
    );
  };

  const renderCatalog = () => {
    if (loading) {
      return (
        <ShopCollectionSkeleton
          title={t('commerce.shop.loading')}
          message={t('commerce.shop.loadingDetail')}
          metricCount={0}
          rowCount={4}
          showFilters={false}
          testID="shop-loading-state"
        />
      );
    }

    if (loadError) {
      return (
        <ShopStatePanel
          kind="error"
          title={t('commerce.shop.unavailable')}
          message={t('commerce.shop.nothingChanged', { message: loadError })}
          actionTitle={t('commerce.action.tryAgain')}
          onAction={() => void load(true)}
          testID="shop-unavailable-state"
        />
      );
    }

    if (availableItems.length === 0) {
      return (
        <ShopStatePanel
          title={t('commerce.shop.noItems')}
          message={t('commerce.shop.noItemsDetail')}
          actionTitle={t('commerce.action.checkAgain')}
          onAction={() => void load(true)}
          testID="shop-empty-state"
        />
      );
    }

    return (
      <View style={styles.sections}>
        <BoostsRow
          title={t('commerce.shop.yourItems')}
          items={ownedRowItems}
          actionLabel={t('commerce.shop.seeAllItems')}
          onAction={() => selectSection('items')}
          testID="shop-owned-items"
        />
        {catalogSections.map(section => (
          <View
            key={section.id}
            style={styles.section}
            testID={`shop-section-${section.id}`}
          >
            <ShopSectionHeader
              title={section.title}
              description={section.description}
            />
            <View style={styles.list}>{section.items.map(renderItemCard)}</View>
          </View>
        ))}
      </View>
    );
  };

  const walletNotices = (
    <ErrorBoundary level="component">
      {!loading && !loadError && walletError ? (
        <AppInlineNotice
          title={t('commerce.shop.balanceUnavailable')}
          description={t('commerce.shop.balanceUnavailableDetail')}
          tone="warning"
          actionLabel={t('commerce.action.tryAgain')}
          onAction={() => void loadWallet()}
          testID="shop-wallet-unavailable"
        />
      ) : null}
      {refreshError ? (
        <AppInlineNotice
          title={t('commerce.shop.outOfDate')}
          description={refreshError}
          tone="warning"
          actionLabel={t('commerce.action.tryAgain')}
          onAction={() => void load(false)}
          testID="shop-refresh-warning"
        />
      ) : null}
    </ErrorBoundary>
  );

  const balanceSlot =
    user?.id && !loadError ? (
      walletLoading ? (
        <SkeletonLoader
          width={104}
          height={44}
          borderRadius={mentaRadii.round}
          accessibilityLabel={t('commerce.accessibility.loadingWallet')}
        />
      ) : !walletError ? (
        <MomentaBalanceChip
          balance={balance}
          onPress={() => selectSection('wallet')}
          testID="shop-balance-chip"
        />
      ) : null
    ) : null;

  const heading = (
    <View style={styles.headingRow}>
      <Text accessibilityRole="header" style={styles.screenTitle}>
        {t('commerce.shop.title')}
      </Text>
      {balanceSlot}
    </View>
  );

  return (
    <AppScreen lane="working" safeArea padding={false} hasTabBar={inPrimaryTab}>
      <Stack.Screen options={{ headerShown: false }} />
      {!inPrimaryTab ? (
        <View style={[styles.topBar, insetPadding]}>
          <ShopPressable
            accessibilityLabel={t('commerce.accessibility.goBack')}
            haptic={false}
            hitSlop={10}
            onPress={() => backOrReplace(router, '/(tabs)/profile')}
            pressedStyle={styles.iconButtonPressed}
            style={styles.iconButton}
          >
            <ArrowLeftIcon size={21} color={theme.colors.text.primary} />
          </ShopPressable>
        </View>
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, insetPadding]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text.secondary}
          />
        }
      >
        {usesIPadWorkspace ? (
          <IPadShopCatalogueWorkspace
            sidebar={
              <>
                {heading}
                <MomentaSectionNav active="shop" />
                <ProEntry />
                <Text style={styles.ipadIntro}>{t('commerce.shop.intro')}</Text>
                {walletNotices}
              </>
            }
          >
            <ErrorBoundary level="component">{renderCatalog()}</ErrorBoundary>
          </IPadShopCatalogueWorkspace>
        ) : (
          <>
            {heading}
            <MomentaSectionNav active="shop" />
            <ProEntry />
            {walletNotices}
            <ErrorBoundary level="component">{renderCatalog()}</ErrorBoundary>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    topBar: {
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[2],
      paddingBottom: mentaSpacing[1],
      backgroundColor: theme.colors.background.primary,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: mentaRadii.round,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonPressed: {
      backgroundColor: theme.colors.background.secondary,
    },
    scroll: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[4],
      paddingBottom: mentaSpacing[12],
      gap: mentaSpacing[5],
    },
    headingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: mentaSpacing[3],
      justifyContent: 'space-between',
    },
    screenTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
      flexShrink: 1,
    },
    ipadIntro: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
      maxWidth: 260,
    },
    sections: {
      gap: mentaSpacing[8],
    },
    section: {
      gap: mentaSpacing[2],
    },
    list: {
      gap: mentaSpacing[2],
    },
  });
