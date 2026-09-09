import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
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
import { AppButton } from '@/components/ui/AppButton';
import { ProEntry } from '@/components/paywall/pro-entry';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { IPadShopCatalogueWorkspace } from '@/components/ipad/IPadShopWorkspace';
import { useIPadPortraitWorkspace } from '@/components/ipad/ipad-workspace';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen } from '@/components/ui/AppShell';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  RefreshCcwIcon,
  WalletIcon,
} from '@/components/ui/icons';
import {
  getShopCategoryId,
  getShopItemSku,
  ShopCollectionSkeleton,
  ShopListRow,
  ShopMetricStrip,
  ShopSectionHeader,
  ShopStatePanel,
  type ShopCategoryId,
} from '@/components/shop/ShopPrimitives';
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
  getUnlockStreakDays,
  isSupportedCatalogSku,
} from '@/lib/shop/catalogSupport';
import { claimStreakShopUnlocks } from '@/lib/shop/streak-unlocks';
import {
  getPowerUpDisplayCopy,
  isShopPowerUp,
} from '@/lib/shop/powerUpSupport';
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

  const renderItemRow = (item: ShopItem) => {
    const accountDetailsReady = !walletLoading && !walletError;
    const sku = getShopItemSku(item);
    const powerUpCopy = getPowerUpDisplayCopy(sku, t);
    const displayItem = powerUpCopy
      ? {
          ...item,
          name: powerUpCopy.label,
          description: powerUpCopy.description,
        }
      : item;
    const inventoryCount = inventoryCounts[sku] || 0;
    const purchased = purchasedItemIds.has(item.id) || inventoryCount > 0;
    const equipped = equippedItemIds.has(item.id);
    const cost = Number(item.cost || 0);
    const unlockDays = getUnlockStreakDays(sku, item.unlock_streak_days);
    const stateLabel = accountDetailsReady
      ? getShopState({
          item,
          balance,
          inventoryCount,
          purchased,
          equipped,
          t,
          formatNumber: value => numberFormatter.format(value),
        })
      : t('commerce.shop.loadingAccount');
    const rightLabel =
      accountDetailsReady && purchased && !isShopPowerUp(item.category)
        ? equipped
          ? t('commerce.shop.inUse')
          : t('commerce.shop.owned')
        : unlockDays
          ? t('commerce.shop.streak', { days: unlockDays })
          : cost > 0
            ? t('commerce.shop.spendBalance', { amount: cost.toLocaleString() })
            : t('commerce.shop.free');

    return (
      <ShopListRow
        key={item.id}
        item={displayItem}
        stateLabel={stateLabel}
        rightLabel={rightLabel}
        showCategoryLabel={false}
        onPress={() => router.push(`/shop/${item.id}`)}
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
          metricCount={1}
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
        {catalogSections.map(section => (
          <View
            key={section.id}
            style={styles.section}
            testID={`shop-section-${section.id}`}
          >
            <ShopSectionHeader
              title={section.title}
              description={section.description}
              count={section.items.length}
            />
            <View style={styles.list}>{section.items.map(renderItemRow)}</View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <AppScreen lane="working" safeArea padding={false} hasTabBar={inPrimaryTab}>
      <Stack.Screen options={{ headerShown: false }} />
      {!inPrimaryTab ? (
        <View style={[styles.topBar, insetPadding]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commerce.accessibility.goBack')}
            hitSlop={10}
            onPress={() => backOrReplace(router, '/(tabs)/profile')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeftIcon size={21} color={theme.colors.text.primary} />
          </Pressable>
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
                <Text accessibilityRole="header" style={styles.screenTitle}>
                  {t('commerce.shop.title')}
                </Text>
                <MomentaSectionNav active="shop" />
                <ProEntry />
                <Text style={styles.ipadIntro}>{t('commerce.shop.intro')}</Text>
                <ErrorBoundary level="component">
                  {!loading && !loadError && walletLoading ? (
                    <SkeletonLoader
                      width="100%"
                      height={76}
                      borderRadius={mentaRadii.large}
                      accessibilityLabel={t('commerce.shop.loadingAccount')}
                    />
                  ) : null}
                  {!loading && !loadError && !walletLoading && !walletError ? (
                    <ShopMetricStrip
                      metrics={[
                        {
                          label: t('commerce.shop.balance'),
                          value: t('commerce.shop.spendBalance', {
                            amount: balance.toLocaleString(),
                          }),
                          icon: (
                            <WalletIcon
                              size={15}
                              color={theme.colors.text.secondary}
                            />
                          ),
                          onPress: () => selectSection('wallet'),
                        },
                      ]}
                    />
                  ) : null}
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
                </ErrorBoundary>
              </>
            }
          >
            {refreshError ? (
              <View style={styles.inlineWarning}>
                <AlertTriangleIcon
                  size={18}
                  color={theme.colors.status.warning}
                />
                <View style={styles.warningCopy}>
                  <Text style={styles.warningTitle}>
                    {t('commerce.shop.outOfDate')}
                  </Text>
                  <Text style={styles.warningText}>{refreshError}</Text>
                </View>
                <AppButton
                  title={t('commerce.action.tryAgain')}
                  variant="ghost"
                  size="small"
                  icon={
                    <RefreshCcwIcon
                      size={14}
                      color={theme.colors.text.primary}
                    />
                  }
                  onPress={() => void load(false)}
                />
              </View>
            ) : null}
            <ErrorBoundary level="component">{renderCatalog()}</ErrorBoundary>
          </IPadShopCatalogueWorkspace>
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.screenTitle}>
              {t('commerce.shop.title')}
            </Text>
            <MomentaSectionNav active="shop" />
            <ProEntry />
            <ErrorBoundary level="component">
              {!loading && !loadError && walletLoading ? (
                <SkeletonLoader
                  width="100%"
                  height={76}
                  borderRadius={mentaRadii.large}
                  accessibilityLabel={t('commerce.shop.loadingAccount')}
                />
              ) : null}
              {!loading && !loadError && !walletLoading && !walletError ? (
                <ShopMetricStrip
                  metrics={[
                    {
                      label: t('commerce.shop.balance'),
                      value: t('commerce.shop.spendBalance', {
                        amount: balance.toLocaleString(),
                      }),
                      icon: (
                        <WalletIcon
                          size={15}
                          color={theme.colors.text.secondary}
                        />
                      ),
                      onPress: () => selectSection('wallet'),
                    },
                  ]}
                />
              ) : null}
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
            </ErrorBoundary>
            {refreshError ? (
              <View style={styles.inlineWarning}>
                <AlertTriangleIcon
                  size={18}
                  color={theme.colors.status.warning}
                />
                <View style={styles.warningCopy}>
                  <Text style={styles.warningTitle}>
                    {t('commerce.shop.outOfDate')}
                  </Text>
                  <Text style={styles.warningText}>{refreshError}</Text>
                </View>
                <AppButton
                  title={t('commerce.action.tryAgain')}
                  variant="ghost"
                  size="small"
                  icon={
                    <RefreshCcwIcon
                      size={14}
                      color={theme.colors.text.primary}
                    />
                  }
                  onPress={() => void load(false)}
                />
              </View>
            ) : null}
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
    pressed: {
      opacity: 0.72,
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
    screenTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    ipadIntro: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
      maxWidth: 260,
    },
    inlineWarning: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: mentaRadii.small,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.status.warning,
      backgroundColor: theme.colors.background.surface,
      padding: 14,
    },
    warningCopy: {
      flex: 1,
      minWidth: 0,
    },
    warningTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
    },
    warningText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.caption,
      marginTop: 2,
    },
    sections: {
      gap: mentaSpacing[8],
    },
    section: {
      gap: mentaSpacing[3],
    },
    list: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
  });
