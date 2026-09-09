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

import {
  MomentaActionNoticeSheet,
  type MomentaActionNotice,
} from '@/components/momenta/MomentaActionNoticeSheet';
import {
  MomentaSectionNav,
  useMomentaSectionIsActive,
  useMomentaPrimaryTab,
  useMomentaSectionNavigation,
} from '@/components/momenta/MomentaSectionNav';
import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppShell';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  RefreshCcwIcon,
} from '@/components/ui/icons';
import {
  getShopCategoryId,
  getShopItemSku,
  ShopCollectionSkeleton,
  ShopFilterChips,
  ShopListRow,
  ShopMetricStrip,
  ShopSectionHeader,
  ShopStatePanel,
  type ShopCategoryId,
  type ShopFilter,
} from '@/components/shop/ShopPrimitives';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  getCommerceNotice,
  isOfflineCommerceError,
} from '@/lib/commerce/commerce-state';
import { decodeInventoryReadback } from '@/lib/commerce/commerce-readback';
import {
  getInventoryReadState,
  isCurrentInventoryAccount,
} from '@/lib/commerce/inventory-read-state';
import {
  getEquipCategoryForCatalogItem,
  isSupportedCatalogItem,
} from '@/lib/shop/catalogSupport';
import { claimStreakShopUnlocks } from '@/lib/shop/streak-unlocks';
import {
  getPowerUpDisplayCopy,
  isShopPowerUp,
  powerUpIsAutoConsumed,
  powerUpRequiresChallengeId,
} from '@/lib/shop/powerUpSupport';
import { getInventoryEmptyCopy } from '@/lib/economy/contract';
import { supabase } from '@/lib/supabase';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/localization/use-translation';
import { type ShopItem, useMomentaStore } from '@/store/momenta-store';

type InventoryRow = {
  item_sku: string;
  quantity: number;
};

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  category: Exclude<ShopCategoryId, 'all'>;
  quantity: number;
  isPowerUp: boolean;
  isAutoConsumed: boolean;
  isEquipped: boolean;
  requiresChallenge: boolean;
  equipCategory: string;
  source: ShopItem;
};

type NoticeSheet = MomentaActionNotice | null;

export default function InventoryScreen() {
  const selectSection = useMomentaSectionNavigation();
  const inPrimaryTab = useMomentaPrimaryTab();
  const sectionActive = useMomentaSectionIsActive('items');
  const sectionLoadedRef = useRef(false);
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const categoryLabels = useMemo<Record<ShopCategoryId, string>>(
    () => ({
      all: t('commerce.shop.all'),
      power_up: t('commerce.shop.boosts'),
      cosmetic: t('commerce.shop.categoryStyle'),
      ai_upgrade: t('commerce.shop.categoryAi'),
    }),
    [t]
  );
  const { isAuthenticated, user } = useAuthStore();
  const {
    equipItem,
    fetchEquippedItems,
    fetchOwnedItems,
    fetchPurchasedItems,
    fetchShopItems,
    isEquipped,
    ownedItems,
    shopItems,
    unequipItem,
  } = useMomentaStore();

  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ShopCategoryId>('all');
  const [loading, setLoading] = useState(true);
  const [hasConfirmedSnapshot, setHasConfirmedSnapshot] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [noticeRefreshing, setNoticeRefreshing] = useState(false);
  const [notice, setNotice] = useState<NoticeSheet>(null);
  const inventoryRequestRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  currentUserIdRef.current = isAuthenticated ? (user?.id ?? null) : null;

  const fetchInventoryRows = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('item_sku, quantity')
      .eq('user_id', userId);

    if (error) throw error;
    const decoded = decodeInventoryReadback(data);
    if (!decoded) throw new Error('Inventory readback could not be verified.');
    return decoded;
  }, []);

  const load = useCallback(
    async (showLoading = false) => {
      const requestId = ++inventoryRequestRef.current;
      const requestedUserId = isAuthenticated ? (user?.id ?? null) : null;
      const isLatestRequest = () => requestId === inventoryRequestRef.current;
      const isCurrentAccountRequest = () =>
        isLatestRequest() &&
        isCurrentInventoryAccount(requestedUserId, currentUserIdRef.current);

      if (showLoading && isLatestRequest()) {
        setLoading(true);
        setLoadError(null);
        setHasConfirmedSnapshot(false);
      } else if (isLatestRequest()) {
        setRefreshError(null);
      }

      if (!requestedUserId) {
        if (isLatestRequest()) {
          setHasConfirmedSnapshot(false);
          setLoadError('AUTH_REQUIRED');
          setRefreshError(null);
          setLoading(false);
        }
        return false;
      }

      try {
        await fetchShopItems({ throwOnError: true });
        await claimStreakShopUnlocks();
        const [, , , nextInventoryRows] = await Promise.all([
          fetchOwnedItems(requestedUserId, { throwOnError: true }),
          fetchEquippedItems(requestedUserId, { throwOnError: true }),
          fetchPurchasedItems(requestedUserId, { throwOnError: true }),
          fetchInventoryRows(requestedUserId),
        ]);
        if (!isCurrentAccountRequest()) return false;

        setInventoryRows(nextInventoryRows);
        setHasConfirmedSnapshot(true);
        setLoadError(null);
        setRefreshError(null);
        return true;
      } catch (error) {
        if (!isCurrentAccountRequest()) return false;

        console.error('[Inventory] Failed to load', error);
        const message = getCommerceNotice(
          isOfflineCommerceError(error) ? 'offline' : 'fetch-error',
          undefined,
          t
        ).message;
        if (showLoading) {
          setHasConfirmedSnapshot(false);
          setLoadError(message);
        } else {
          setRefreshError(message);
        }
        return false;
      } finally {
        if (isCurrentAccountRequest()) setLoading(false);
      }
    },
    [
      fetchEquippedItems,
      fetchOwnedItems,
      fetchPurchasedItems,
      fetchShopItems,
      fetchInventoryRows,
      isAuthenticated,
      t,
      user?.id,
    ]
  );

  useEffect(() => {
    if (!sectionActive) return;
    void load(!sectionLoadedRef.current);
    sectionLoadedRef.current = true;
  }, [load, sectionActive]);

  const refreshAfterCompletedAction = useCallback(
    async ({
      title,
      message,
      staleMessage,
    }: {
      title: string;
      message: string;
      staleMessage: string;
    }) => {
      const refreshed = await load(false);
      setNotice({
        kind: 'success',
        title,
        message: refreshed ? message : staleMessage,
        refreshActionTitle: refreshed
          ? undefined
          : t('commerce.action.refreshInventory'),
      });
    },
    [load, t]
  );

  const handleNoticeRefresh = useCallback(async () => {
    if (noticeRefreshing) return;

    setNoticeRefreshing(true);
    try {
      const refreshed = await load(false);
      if (refreshed) {
        setNotice({
          kind: 'success',
          title: t('commerce.shop.itemsUpdated'),
          message: t('commerce.shop.itemsRefreshed'),
        });
      } else {
        setNotice({
          kind: 'error',
          title: t('commerce.wallet.refreshFailed'),
          message: t('commerce.wallet.tryAgainMoment'),
          refreshActionTitle: t('commerce.shop.tryRefreshAgain'),
        });
      }
    } finally {
      setNoticeRefreshing(false);
    }
  }, [load, noticeRefreshing, t]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(false);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const items = useMemo<InventoryItem[]>(() => {
    const catalogBySku = new Map<string, ShopItem>();
    const catalogById = new Map<string, ShopItem>();

    for (const item of shopItems || []) {
      catalogBySku.set(getShopItemSku(item), item);
      catalogById.set(item.id, item);
    }

    const merged = new Map<string, InventoryItem>();

    const upsert = (source: ShopItem, quantity: number) => {
      if (!isSupportedCatalogItem(source)) return;

      const sku = getShopItemSku(source);
      const category = getShopCategoryId(source.category);
      const isPower = isShopPowerUp(source.category);
      const powerUpCopy = getPowerUpDisplayCopy(sku, t);
      const normalizedQuantity = isPower ? quantity : 1;

      if (normalizedQuantity <= 0 && isPower) return;

      const existing = merged.get(sku);
      const nextQuantity = Math.max(
        existing?.quantity || 0,
        normalizedQuantity
      );

      merged.set(sku, {
        id: source.id,
        sku,
        name: powerUpCopy?.label || source.name,
        description: powerUpCopy?.description || source.description,
        category,
        quantity: nextQuantity,
        isPowerUp: isPower,
        isAutoConsumed: isPower && powerUpIsAutoConsumed(sku),
        isEquipped: isEquipped(source.id),
        requiresChallenge: powerUpRequiresChallengeId(sku),
        equipCategory: getEquipCategoryForCatalogItem(source),
        source,
      });
    };

    for (const row of inventoryRows) {
      const source = catalogBySku.get(row.item_sku);
      if (!source) continue;
      upsert(source, Number(row.quantity || 0));
    }

    for (const purchase of ownedItems || []) {
      const source =
        purchase.catalog_items ||
        catalogById.get(purchase.item_id) ||
        catalogBySku.get(purchase.item_id);
      if (!source) continue;
      upsert(
        source,
        isShopPowerUp(source.category) ? Number(purchase.usage_count || 0) : 1
      );
    }

    return Array.from(merged.values()).sort((a, b) => {
      if (a.category !== b.category) {
        const order: Record<ShopCategoryId, number> = {
          all: 0,
          power_up: 1,
          cosmetic: 2,
          ai_upgrade: 3,
        };
        return order[a.category] - order[b.category];
      }
      return a.name.localeCompare(b.name);
    });
  }, [inventoryRows, isEquipped, ownedItems, shopItems, t]);

  const filters = useMemo<ShopFilter[]>(() => {
    const counts: Record<ShopCategoryId, number> = {
      all: items.length,
      power_up: 0,
      cosmetic: 0,
      ai_upgrade: 0,
    };

    for (const item of items) {
      counts[item.category] += 1;
    }

    return (Object.keys(categoryLabels) as ShopCategoryId[])
      .filter(id => id === 'all' || counts[id] > 0)
      .map(id => ({
        id,
        label: categoryLabels[id],
        count: counts[id],
      }));
  }, [categoryLabels, items]);

  useEffect(() => {
    if (!filters.some(filter => filter.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [filters, selectedCategory]);

  const visibleItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const inventorySections = useMemo(() => {
    if (selectedCategory !== 'all') {
      return [
        {
          id: selectedCategory,
          title: categoryLabels[selectedCategory],
          description:
            selectedCategory === 'power_up'
              ? t('commerce.shop.boostOwnedDetail')
              : selectedCategory === 'cosmetic'
                ? t('commerce.shop.styleOwnedDetail')
                : t('commerce.shop.aiOwnedDetail'),
          items: visibleItems,
        },
      ];
    }

    return [
      {
        id: 'automatic',
        title: t('commerce.shop.automaticProtection'),
        description: t('commerce.shop.automaticProtectionDetail'),
        items: items.filter(item => item.isAutoConsumed),
      },
      {
        id: 'ready',
        title: t('commerce.shop.readyToUse'),
        description: t('commerce.shop.readyToUseDetail'),
        items: items.filter(item => item.isPowerUp && !item.isAutoConsumed),
      },
      {
        id: 'appearance',
        title: t('commerce.shop.appearance'),
        description: t('commerce.shop.appearanceDetail'),
        items: items.filter(item => !item.isPowerUp),
      },
    ].filter(section => section.items.length > 0);
  }, [categoryLabels, items, selectedCategory, visibleItems, t]);

  const boostCount = useMemo(
    () =>
      items
        .filter(item => item.isPowerUp)
        .reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const styleCount = useMemo(
    () => items.filter(item => !item.isPowerUp).length,
    [items]
  );

  const handleUse = useCallback(
    (item: InventoryItem) => {
      router.push(`/shop/${item.id}?action=use`);
    },
    [router]
  );

  const handleEquip = useCallback(
    async (item: InventoryItem) => {
      setWorkingId(item.id);
      try {
        await equipItem(item.source.id, item.equipCategory, item.sku);
        await refreshAfterCompletedAction({
          title: `${item.name} is in use`,
          message: t('commerce.shop.usingStyle'),
          staleMessage: t('commerce.shop.refreshIfMissing', {
            message: t('commerce.shop.styleInUse', { name: item.name }),
          }),
        });
      } catch (error) {
        console.error('[Inventory] Equip failed', error);
        setNotice({
          kind: 'error',
          title: t('commerce.shop.couldNotUseStyle'),
          message: t('commerce.wallet.tryAgainMoment'),
        });
      } finally {
        setWorkingId(null);
      }
    },
    [equipItem, refreshAfterCompletedAction, t]
  );

  const handleUnequip = useCallback(
    async (item: InventoryItem) => {
      setWorkingId(item.id);
      try {
        await unequipItem(item.equipCategory);
        await refreshAfterCompletedAction({
          title: `${item.name} removed`,
          message: t('commerce.shop.styleNoLongerUsed'),
          staleMessage: t('commerce.shop.refreshIfMissing', {
            message: t('commerce.shop.styleRemoved', { name: item.name }),
          }),
        });
      } catch (error) {
        console.error('[Inventory] Unequip failed', error);
        setNotice({
          kind: 'error',
          title: t('commerce.shop.couldNotRemoveStyle'),
          message: t('commerce.wallet.tryAgainMoment'),
        });
      } finally {
        setWorkingId(null);
      }
    },
    [refreshAfterCompletedAction, t, unequipItem]
  );

  const inventoryState = getInventoryReadState({
    loading,
    hasConfirmedSnapshot,
    loadError,
    itemCount: items.length,
    visibleItemCount: visibleItems.length,
  });

  const renderInventory = () => {
    if (inventoryState === 'loading') {
      return (
        <ShopCollectionSkeleton
          title={t('commerce.shop.loadingItems')}
          message={t('commerce.shop.loadingItemsDetail')}
          metricCount={3}
          testID="inventory-loading-state"
        />
      );
    }

    if (inventoryState === 'unavailable') {
      return (
        <ShopStatePanel
          kind="error"
          title={t('commerce.shop.itemsUnavailable')}
          message={t('commerce.shop.itemsUnavailableDetail')}
          actionTitle={t('commerce.action.tryAgain')}
          onAction={() => void load(true)}
          testID="inventory-unavailable-state"
        />
      );
    }

    if (inventoryState === 'empty') {
      return (
        <View style={styles.emptyStateGroup}>
          <ShopStatePanel
            title={t('commerce.shop.noItemsYet')}
            message={getInventoryEmptyCopy(t)}
            actionTitle={t('commerce.action.openShop')}
            onAction={() => selectSection('shop')}
            testID="inventory-empty-state"
          />
        </View>
      );
    }

    if (inventoryState === 'filtered-empty') {
      return (
        <ShopStatePanel
          title={t('commerce.shop.nothingInSection')}
          message={t('commerce.shop.chooseAll')}
          actionTitle={t('commerce.shop.showAll')}
          onAction={() => setSelectedCategory('all')}
          testID="inventory-filtered-empty-state"
        />
      );
    }

    return (
      <View style={styles.sections}>
        {inventorySections.map(section => (
          <View
            key={section.id}
            style={styles.section}
            testID={`inventory-section-${section.id}`}
          >
            <ShopSectionHeader
              title={section.title}
              description={section.description}
              count={section.items.length}
            />
            <View style={styles.list}>
              {section.items.map(item => {
                const actionLabel = item.isPowerUp
                  ? item.isAutoConsumed
                    ? t('commerce.shop.howItWorks')
                    : item.requiresChallenge
                      ? t('commerce.shop.choose')
                      : t('commerce.shop.use')
                  : item.isEquipped
                    ? t('commerce.shop.remove')
                    : t('commerce.shop.use');
                const stateLabel = item.isPowerUp
                  ? t('commerce.shop.availableCount', { count: item.quantity })
                  : item.isEquipped
                    ? t('commerce.shop.inUse')
                    : t('commerce.shop.owned');

                return (
                  <ShopListRow
                    key={`${item.sku}-${item.id}`}
                    item={{
                      ...item.source,
                      name: item.name,
                      description: item.description || '',
                    }}
                    eyebrow={categoryLabels[item.category]}
                    stateLabel={stateLabel}
                    actionLabel={actionLabel}
                    actionVariant={item.isEquipped ? 'outline' : 'accent'}
                    actionDisabled={workingId === item.id}
                    actionLoading={workingId === item.id}
                    onPress={() => router.push(`/shop/${item.id}`)}
                    onAction={() => {
                      if (item.isPowerUp) {
                        handleUse(item);
                        return;
                      }
                      if (item.isEquipped) {
                        void handleUnequip(item);
                        return;
                      }
                      void handleEquip(item);
                    }}
                    testID={`inventory-item-${item.id}`}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <AppScreen lane="working" safeArea hasTabBar={inPrimaryTab}>
      <Stack.Screen options={{ headerShown: false }} />
      {!inPrimaryTab ? (
        <View style={styles.topBar}>
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text.secondary}
          />
        }
      >
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={styles.screenTitle}>
            {t('commerce.shop.yourItems')}
          </Text>
          <MomentaSectionNav active="items" />
          <Text style={styles.sectionHint}>
            {t('commerce.shop.yourItemsIntro')}
          </Text>
        </View>

        {refreshError && hasConfirmedSnapshot ? (
          <View style={styles.inlineWarning} testID="inventory-refresh-warning">
            <AlertTriangleIcon size={18} color={theme.colors.status.warning} />
            <View style={styles.warningCopy}>
              <Text style={styles.warningTitle}>
                {t('commerce.shop.itemsOutOfDate')}
              </Text>
              <Text style={styles.warningText}>{refreshError}</Text>
            </View>
            <AppButton
              title={t('commerce.action.tryAgain')}
              variant="ghost"
              size="small"
              icon={
                <RefreshCcwIcon size={14} color={theme.colors.text.primary} />
              }
              onPress={() => void load(false)}
            />
          </View>
        ) : null}

        {inventoryState === 'loading' ||
        inventoryState === 'unavailable' ||
        inventoryState === 'empty' ? (
          renderInventory()
        ) : (
          <>
            <ShopMetricStrip
              metrics={[
                {
                  label: t('commerce.shop.items'),
                  value: String(items.length),
                },
                { label: t('commerce.shop.boosts'), value: String(boostCount) },
                { label: t('commerce.shop.styles'), value: String(styleCount) },
              ]}
            />

            <ShopFilterChips
              filters={filters}
              selectedId={selectedCategory}
              onSelect={setSelectedCategory}
            />

            {renderInventory()}
          </>
        )}
      </ScrollView>

      <MomentaActionNoticeSheet
        visible={Boolean(notice)}
        notice={notice}
        onClose={() => setNotice(null)}
        onRefresh={handleNoticeRefresh}
        refreshing={noticeRefreshing}
        testID="inventory-notice-sheet"
      />
    </AppScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    topBar: {
      paddingTop: mentaSpacing[3],
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
    scroll: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      paddingTop: mentaSpacing[5],
      paddingBottom: 52,
      gap: mentaSpacing[8],
    },
    intro: {
      gap: mentaSpacing[3],
    },
    screenTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    sections: {
      gap: mentaSpacing[8],
    },
    section: {
      gap: mentaSpacing[3],
    },
    emptyStateGroup: {
      gap: mentaSpacing[3],
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
    sectionHint: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.bodySmall,
    },
    list: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    pressed: {
      opacity: 0.72,
    },
  });
