import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import {
  MomentaActionNoticeSheet,
  type MomentaActionNotice,
} from '@/components/momenta/MomentaActionNoticeSheet';
import PaywallModal from '@/components/paywall/PaywallModal';
import { IPadShopDetailWorkspace } from '@/components/ipad/IPadShopWorkspace';
import { useIPadPortraitWorkspace } from '@/components/ipad/ipad-workspace';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import SimpleBottomSheet from '@/components/ui/SimpleBottomSheet';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  GiftIcon,
  TargetIcon,
  WalletIcon,
} from '@/components/ui/icons';
import {
  formatShopCategory,
  getShopItemSku,
  ShopItemGlyph,
} from '@/components/shop/ShopPrimitives';
import {
  ShopItemImpactPreview,
  ShopItemImpactSkeleton,
} from '@/components/shop/ShopItemImpactPreview';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useOperationalFlag } from '@/hooks/useOperationalFlag';
import {
  areVerifiedAdRewardsEnabled,
  showRewardedAdDetailed,
  type RewardAdResult,
} from '@/lib/ads';
import {
  getCommerceNotice,
  getStorePurchaseState,
  isOfflineCommerceError,
} from '@/lib/commerce/commerce-state';
import {
  decodeInventoryReadback,
  didPurchaseReadbackAdvance,
} from '@/lib/commerce/commerce-readback';
import { createClientEventId } from '@/lib/client-event-id';
import { useAdRewardAmount } from '@/lib/hooks/useAdReward';
import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';
import { getApprovedCreditSkus } from '@/lib/product-config';
import {
  REVENUECAT_SUPPORTED,
  RevenueCatAPI,
  purchaseCredits,
} from '@/lib/paywall/revenuecat';
import { REVIEW_QUEUE_CLEAR_REWARD_AMOUNT } from '@/lib/review-rewards';
import {
  getCatalogItemSku,
  getEquipCategoryForCatalogItem,
  getUnlockStreakDays,
  isSupportedCatalogItem,
} from '@/lib/shop/catalogSupport';
import { claimStreakShopUnlocks } from '@/lib/shop/streak-unlocks';
import {
  getPowerUpSupport,
  isShopPowerUp,
  powerUpIsAutoConsumed,
  powerUpRequiresChallengeId,
} from '@/lib/shop/powerUpSupport';
import {
  addBreadcrumb as sentryBreadcrumb,
  captureError as sentryCapture,
} from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/localization/use-translation';
import {
  type ShopPurchaseResult,
  useMomentaStore,
} from '@/store/momenta-store';
import { trackProductOperation } from '@/lib/posthog';

type StatusSheet = MomentaActionNotice | null;

type InventoryRow = {
  item_sku: string;
  quantity: number;
};

type ChallengeOption = {
  id: string;
  title: string;
  currentStreak: number;
};

type RevenueCatPackage = {
  identifier?: string | null;
  packageType?: string | null;
  product?: { priceString?: string | null } | null;
};

const CREDIT_PACK = {
  id: 'credits_large',
  credits: 1000,
  bonus: 200,
} as const;

function getAuthoritativePurchaseMessage(
  result: ShopPurchaseResult,
  fallbackItemName: string,
  locale: string,
  t: (
    key: import('@/lib/localization/en-NZ').TranslationKey,
    values?: Record<string, string | number>
  ) => string
) {
  const itemName = fallbackItemName;
  const balance = result.receipt?.newBalance;
  const quantity = result.receipt?.quantity;
  const hasBalance = typeof balance === 'number';
  const hasInventory = typeof quantity === 'number';
  const values = {
    name: itemName,
    quantity: hasInventory
      ? new Intl.NumberFormat(locale).format(quantity)
      : '',
    balance: hasBalance ? new Intl.NumberFormat(locale).format(balance) : '',
  };
  if (hasInventory && hasBalance)
    return t('commerce.shop.purchaseReceiptWithInventoryAndBalance', values);
  if (hasInventory)
    return t('commerce.shop.purchaseReceiptWithInventory', values);
  if (hasBalance) return t('commerce.shop.purchaseReceiptWithBalance', values);
  return t('commerce.shop.purchaseReceipt', values);
}

function getPrimaryState({
  purchased,
  historicallyPurchased,
  equipped,
  isPowerUp,
  inventoryCount,
  insufficient,
  shortfall,
  t,
}: {
  purchased: boolean;
  historicallyPurchased: boolean;
  equipped: boolean;
  isPowerUp: boolean;
  inventoryCount: number;
  insufficient: boolean;
  shortfall: number;
  t: (
    key: import('@/lib/localization/en-NZ').TranslationKey,
    values?: Record<string, string | number>
  ) => string;
}) {
  if (equipped) return t('commerce.shop.inUse');
  if (isPowerUp && inventoryCount > 0) {
    return t('commerce.shop.availableCount', { count: inventoryCount });
  }
  if (isPowerUp && historicallyPurchased) return t('commerce.shop.usedUp');
  if (purchased) return t('commerce.shop.owned');
  if (insufficient)
    return t('commerce.shop.short', { amount: shortfall.toLocaleString() });
  return t('commerce.shop.available');
}

export default function ShopItemDetailsScreen() {
  const { id, action } = useLocalSearchParams<{
    id: string;
    action?: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const usesIPadWorkspace = useIPadPortraitWorkspace();
  const insetPadding = screenInsetPadding(phoneLayout);
  const { user } = useAuthStore();
  const {
    balance,
    claimAdReward,
    equipItem,
    fetchBalance,
    fetchEquippedItems,
    fetchOwnedItems,
    fetchPurchasedItems,
    fetchShopItems,
    isEquipped,
    isPurchased,
    ownedItems,
    pendingPurchaseAttempt,
    purchaseItem,
    shopItems,
    unequipItem,
    usePowerUp: applyInventoryPowerUp,
  } = useMomentaStore();
  const adReward = useAdRewardAmount();
  const { enabled: adsEnabled } = useOperationalFlag('ads_enabled');
  const { enabled: safeMode } = useOperationalFlag('safe_mode');
  const canWatchSponsors =
    adsEnabled && !safeMode && areVerifiedAdRewardsEnabled();
  const approvedCreditSkus = getApprovedCreditSkus();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(Boolean(user?.id));
  const [accountError, setAccountError] = useState<string | null>(null);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [working, setWorking] = useState(false);
  const [confirmPurchaseVisible, setConfirmPurchaseVisible] = useState(false);
  const [targetSheetVisible, setTargetSheetVisible] = useState(false);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [targets, setTargets] = useState<ChallengeOption[]>([]);
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditPrice, setCreditPrice] = useState<string | null>(null);
  const [creditPriceLoading, setCreditPriceLoading] = useState(false);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [statusSheet, setStatusSheet] = useState<StatusSheet>(null);
  const handledUseActionRef = useRef<string | null>(null);
  const purchaseAttemptRef = useRef<{
    beforeOwned: boolean;
    beforeQuantity: number;
    itemId: string;
    itemName: string;
    itemSku: string;
  } | null>(null);
  const powerUpAttemptRef = useRef<{
    challengeId: string;
    clientEventId: string;
  } | null>(null);
  const [purchaseRecoveryPending, setPurchaseRecoveryPending] = useState(false);

  const item = useMemo(() => {
    const match = (shopItems || []).find(
      candidate =>
        String(candidate.id) === String(id) ||
        String(candidate.sku || '') === String(id)
    );
    return match && isSupportedCatalogItem(match) ? match : undefined;
  }, [shopItems, id]);

  const approvedCreditSkuSet = useMemo(() => {
    return new Set(approvedCreditSkus);
  }, [approvedCreditSkus]);

  const canBuyCredits =
    REVENUECAT_SUPPORTED &&
    (approvedCreditSkuSet.has(CREDIT_PACK.id) ||
      approvedCreditSkuSet.has('com.anekedigitalapps.lockedin.credits_large'));
  const creditPurchaseReady = canBuyCredits && Boolean(creditPrice);

  const sku = item ? getCatalogItemSku(item) : '';
  const isPowerUp = item ? isShopPowerUp(item.category) : false;
  const equipped = item ? isEquipped(item.id) : false;
  const cost = Number(item?.cost || 0);
  const unlockDays = item
    ? getUnlockStreakDays(sku, item.unlock_streak_days)
    : null;
  const equipCategory = item ? getEquipCategoryForCatalogItem(item) : 'catalog';
  const support = getPowerUpSupport(sku);
  const displayName = support?.label || item?.name || '';
  const displayDescription = support?.description || item?.description || '';
  const requiresChallenge = isPowerUp && powerUpRequiresChallengeId(sku);
  const autoConsumedPowerUp = isPowerUp && powerUpIsAutoConsumed(sku);
  const creditTotal = CREDIT_PACK.credits + CREDIT_PACK.bonus;

  useEffect(() => {
    if (!canBuyCredits) {
      setCreditPrice(null);
      setCreditPriceLoading(false);
      return;
    }

    let mounted = true;
    setCreditPriceLoading(true);
    void (async () => {
      try {
        const offerings = await RevenueCatAPI.getCreditOfferings();
        const packages: RevenueCatPackage[] =
          offerings?.availablePackages || [];
        const match = packages.find(pkg => {
          const identifier = String(pkg?.identifier || pkg?.packageType || '');
          return identifier.includes('credits_large');
        });
        if (mounted) setCreditPrice(match?.product?.priceString || null);
      } catch (error) {
        console.error('[ShopItem] Credit price load failed', error);
        if (mounted) setCreditPrice(null);
      } finally {
        if (mounted) setCreditPriceLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [canBuyCredits]);

  const inventoryCount = useMemo(() => {
    if (!item) return 0;
    const itemSku = getShopItemSku(item);
    const fromInventory = inventoryRows.reduce((total, row) => {
      if (row.item_sku !== itemSku) return total;
      return total + Number(row.quantity || 0);
    }, 0);

    const fromPurchases = (ownedItems || []).reduce((total, owned) => {
      const ownedItem = owned.catalog_items;
      if (!ownedItem || getShopItemSku(ownedItem) !== itemSku) return total;
      return Math.max(total, Number(owned.usage_count || 0));
    }, 0);

    return Math.max(fromInventory, fromPurchases);
  }, [inventoryRows, item, ownedItems]);

  const historicallyPurchased = item ? isPurchased(item.id) : false;
  const purchased = item
    ? isPowerUp
      ? inventoryCount > 0
      : historicallyPurchased || inventoryCount > 0
    : false;
  const purchaseRetryPending = Boolean(
    item &&
    user?.id &&
    pendingPurchaseAttempt?.userId === user.id &&
    pendingPurchaseAttempt.itemId === item.id
  );
  const repeatConsumablePurchase =
    Boolean(item) && isPowerUp && historicallyPurchased && inventoryCount <= 0;
  const shortfall = Math.max(cost - balance, 0);
  const insufficient = !purchased && shortfall > 0;
  const primaryState = getPrimaryState({
    purchased,
    historicallyPurchased,
    equipped,
    isPowerUp,
    inventoryCount,
    insufficient,
    shortfall,
    t,
  });

  const loadInventory = useCallback(async () => {
    if (!user?.id) {
      setInventoryRows([]);
      return [];
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('item_sku, quantity')
      .eq('user_id', user.id);

    if (error) throw error;
    const decoded = decodeInventoryReadback(data);
    if (!decoded) throw new Error('Inventory readback could not be verified.');
    setInventoryRows(decoded);
    return decoded;
  }, [user?.id]);

  const refreshState = useCallback(async (): Promise<InventoryRow[]> => {
    if (!user?.id) return [];
    await claimStreakShopUnlocks();
    const [, , , , inventory] = await Promise.all([
      fetchBalance(user.id, { throwOnError: true }),
      fetchOwnedItems(user.id, { throwOnError: true }),
      fetchPurchasedItems(user.id, { throwOnError: true }),
      fetchEquippedItems(user.id, { throwOnError: true }),
      loadInventory(),
    ]);
    return inventory;
  }, [
    fetchBalance,
    fetchEquippedItems,
    fetchOwnedItems,
    fetchPurchasedItems,
    loadInventory,
    user?.id,
  ]);

  const refreshAccountState = useCallback(async () => {
    if (!user?.id) {
      setAccountLoading(false);
      setAccountError(null);
      return;
    }

    setAccountLoading(true);
    try {
      await refreshState();
      setAccountError(null);
    } catch (error) {
      setAccountError(
        getCommerceNotice(
          isOfflineCommerceError(error) ? 'offline' : 'fetch-error',
          undefined,
          t
        ).message
      );
    } finally {
      setAccountLoading(false);
    }
  }, [refreshState, user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const accountLoad = refreshAccountState();
    try {
      await fetchShopItems({ throwOnError: true });
    } catch (error) {
      console.error('[ShopItem] Catalog load failed', error);
      setLoadError(
        getCommerceNotice(
          isOfflineCommerceError(error) ? 'offline' : 'fetch-error',
          undefined,
          t
        ).message
      );
    } finally {
      void accountLoad;
      setLoading(false);
    }
  }, [fetchShopItems, refreshAccountState]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshAfterCompletedAction = useCallback(
    async ({
      title,
      message,
      staleMessage,
      logContext,
      refreshActionTitle,
      eyebrow,
      facts,
    }: {
      title: string;
      message: string;
      staleMessage: string;
      logContext: string;
      refreshActionTitle?: string;
      eyebrow?: string;
      facts?: { label: string; value: string }[];
    }) => {
      try {
        await refreshState();
        setStatusSheet({
          kind: 'success',
          eyebrow,
          title,
          message,
          facts,
        });
      } catch (refreshError) {
        console.error(
          `[ShopItem] Refresh after ${logContext} failed`,
          refreshError
        );
        setStatusSheet({
          kind: 'success',
          eyebrow,
          title,
          message: staleMessage,
          refreshActionTitle,
          facts,
        });
      }
    },
    [refreshState]
  );

  const handleStatusRefresh = useCallback(async () => {
    if (statusRefreshing) return;

    setStatusRefreshing(true);
    try {
      const powerUpAttempt = powerUpAttemptRef.current;
      if (powerUpAttempt && item && user?.id) {
        const result = await applyInventoryPowerUp(
          user.id,
          sku,
          powerUpAttempt.challengeId,
          undefined,
          powerUpAttempt.clientEventId
        );

        if (!result.success) {
          if (result.outcome !== 'unknown') powerUpAttemptRef.current = null;
          setStatusSheet({
            kind: result.outcome === 'unknown' ? 'info' : 'error',
            title:
              result.outcome === 'unknown'
                ? t('commerce.shop.extensionStillChecking')
                : t('commerce.shop.extensionNotUsed'),
            message: result.message,
            refreshActionTitle:
              result.outcome === 'unknown'
                ? t('commerce.action.checkAgain')
                : undefined,
          });
          return;
        }

        powerUpAttemptRef.current = null;
        await refreshAfterCompletedAction({
          title: t('commerce.shop.deadlineExtended'),
          message: result.message,
          staleMessage: `${result.message} Refresh your items if the available count has not updated.`,
          logContext: 'extension receipt check',
          refreshActionTitle: t('commerce.shop.refreshItemsAction'),
          facts: [
            {
              label: t('commerce.shop.promiseDeadline'),
              value: t('commerce.shop.twelveHoursLater'),
            },
            {
              label: t('commerce.shop.extension'),
              value: t('commerce.shop.usedOnce'),
            },
          ],
        });
        return;
      }

      const latestInventory = await refreshState();
      const attempt = purchaseAttemptRef.current;
      if (attempt) {
        const currentStore = useMomentaStore.getState();
        const currentQuantity = latestInventory.reduce(
          (total, row) =>
            row.item_sku === attempt.itemSku ? total + row.quantity : total,
          0
        );
        const confirmed = didPurchaseReadbackAdvance({
          beforeOwned: attempt.beforeOwned,
          beforeQuantity: attempt.beforeQuantity,
          currentOwned: currentStore.isPurchased(attempt.itemId),
          currentQuantity,
        });

        if (!confirmed) {
          setStatusSheet(getCommerceNotice('unknown-result', undefined, t));
          return;
        }

        purchaseAttemptRef.current = null;
        setPurchaseRecoveryPending(false);
        setStatusSheet({
          ...getCommerceNotice(
            'server-receipt-confirmed',
            {
              itemName: attempt.itemName,
            },
            t
          ),
          message: `${attempt.itemName} is in Your items. Your balance has been updated.`,
          facts: [
            {
              label: t('commerce.shop.purchaseLabel'),
              value: t('commerce.shop.purchaseComplete'),
            },
            {
              label: t('commerce.shop.balance'),
              value: `${currentStore.balance.toLocaleString()} Momenta`,
            },
          ],
        });
        return;
      }

      setStatusSheet({
        kind: 'success',
        title: t('commerce.shop.refreshStatus'),
        message: t('commerce.shop.balanceItemsCurrent'),
      });
    } catch (error) {
      console.error('[ShopItem] Manual status refresh failed', error);
      setStatusSheet({
        kind: 'error',
        title: t('commerce.wallet.refreshFailed'),
        message: t('commerce.wallet.tryAgainMoment'),
        refreshActionTitle: t('commerce.action.tryAgain'),
      });
    } finally {
      setStatusRefreshing(false);
    }
  }, [
    applyInventoryPowerUp,
    item,
    refreshAfterCompletedAction,
    refreshState,
    sku,
    statusRefreshing,
    user?.id,
  ]);

  const fetchTargets = useCallback(async () => {
    if (!user?.id) return [];
    setTargetsLoading(true);
    setTargetError(null);
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(
          `
          challenge_id,
          status,
          current_streak,
          challenges!inner (
            id,
            title
          )
        `
        )
        .eq('user_id', user.id);

      if (error) throw error;

      const options = (Array.isArray(data) ? data : [])
        .filter(row => String(row.status || 'active') === 'active')
        .map(row => {
          const challengeRecord = Array.isArray(row.challenges)
            ? row.challenges[0]
            : row.challenges;
          return {
            id: String(row.challenge_id),
            title: String(challengeRecord?.title || 'Active promise'),
            currentStreak: Number(row.current_streak || 0),
          };
        });

      setTargets(options);
      return options;
    } catch (error) {
      console.error('[ShopItem] Target load failed', error);
      const message = t('commerce.shop.promisesDidNotLoad');
      setTargetError(message);
      setStatusSheet({
        kind: 'error',
        title: t('commerce.shop.couldNotLoadPromises'),
        message,
      });
      setTargets([]);
      return [];
    } finally {
      setTargetsLoading(false);
    }
  }, [user?.id]);

  const handleWatchAd = useCallback(async (): Promise<RewardAdResult> => {
    if (!canWatchSponsors) {
      return { earned: false, amount: 0, reason: 'module_missing' };
    }
    if (adLoading) return { earned: false, amount: 0, reason: 'error' };
    if (!user?.id) {
      return { earned: false, amount: 0, reason: 'reward_unconfirmed' };
    }

    setAdLoading(true);
    try {
      sentryBreadcrumb('watch_ad_cta_pressed', { screen: 'shop_item' });
      const result = await showRewardedAdDetailed({
        appUserId: user?.id ?? '',
        placement: 'shop_item',
      });
      if (!result?.earned) {
        return result || { earned: false, amount: 0, reason: 'error' };
      }

      const claim = await claimAdReward(result.clientTransactionId);
      if (!claim.earned) {
        const reason: RewardAdResult['reason'] =
          claim.reason === 'daily-limit'
            ? 'daily_limit'
            : claim.reason === 'cooldown'
              ? 'cooldown'
              : 'reward_unconfirmed';
        return { earned: false, amount: 0, reason };
      }

      return { earned: true, amount: claim.amount, type: result.type };
    } catch (error) {
      console.error('[ShopItem] Rewarded ad failed', error);
      sentryCapture(error as Error, { context: 'watch_ad_shop_item' });
      setStatusSheet({
        kind: 'error',
        title: t('commerce.wallet.adUnavailable'),
        message: t('commerce.wallet.noAdNow'),
      });
      return { earned: false, amount: 0, reason: 'error' };
    } finally {
      setAdLoading(false);
    }
  }, [adLoading, canWatchSponsors, claimAdReward, user?.id]);

  const handleCreditPurchase = useCallback(async () => {
    if (!creditPurchaseReady || creditLoading) return;

    setCreditLoading(true);
    trackProductOperation({
      area: 'momenta',
      authority: 'provider',
      operation: 'purchase_item',
      outcome: 'started',
      phase: 'intent',
      source: 'shop',
    });
    try {
      const result = await purchaseCredits('large');
      const state = getStorePurchaseState(result);
      trackProductOperation({
        area: 'momenta',
        authority: 'provider',
        operation: 'purchase_item',
        outcome:
          state === 'store-receipt-pending'
            ? 'unknown'
            : state === 'cancelled'
              ? 'cancelled'
              : state === 'failed'
                ? 'failed'
                : 'confirmed',
        phase:
          state === 'store-receipt-pending' ? 'reconciliation' : 'authority',
        source: 'shop',
      });

      if (state === 'store-receipt-pending') {
        setTopUpVisible(false);
        setStatusSheet(getCommerceNotice(state, undefined, t));
      } else if (state === 'cancelled') {
        setStatusSheet(getCommerceNotice(state, undefined, t));
      } else {
        const notice = getCommerceNotice(state, undefined, t);
        setStatusSheet({
          ...notice,
          message:
            state === 'failed'
              ? t('commerce.wallet.packUnavailable')
              : notice.message,
        });
      }
    } catch (error) {
      trackProductOperation({
        area: 'momenta',
        authority: 'provider',
        operation: 'purchase_item',
        outcome: isOfflineCommerceError(error) ? 'unknown' : 'failed',
        phase: isOfflineCommerceError(error) ? 'reconciliation' : 'authority',
        source: 'shop',
      });
      console.error('[ShopItem] Credit purchase failed', error);
      setStatusSheet(
        getCommerceNotice(
          isOfflineCommerceError(error) ? 'unknown-result' : 'failed',
          undefined,
          t
        )
      );
    } finally {
      setCreditLoading(false);
    }
  }, [creditLoading, creditPurchaseReady]);

  const handlePurchase = useCallback(async () => {
    if (
      !item ||
      !user?.id ||
      working ||
      (purchaseRecoveryPending && !purchaseRetryPending)
    ) {
      return;
    }
    if (insufficient && !purchaseRetryPending) {
      void emitHaptic({
        type: 'blocked',
        reason: 'insufficient-momenta',
      });
      trackProductOperation({
        area: 'shop',
        authority: 'server',
        operation: 'purchase_item',
        outcome: 'ineligible',
        phase: 'eligibility',
        source: 'shop',
      });
      setTopUpVisible(true);
      return;
    }

    setConfirmPurchaseVisible(false);
    setWorking(true);
    purchaseAttemptRef.current = {
      beforeOwned: purchased,
      beforeQuantity: inventoryCount,
      itemId: item.id,
      itemName: displayName,
      itemSku: sku,
    };
    setStatusSheet(getCommerceNotice('submitting', undefined, t));
    trackProductOperation({
      area: 'shop',
      authority: 'server',
      operation: 'purchase_item',
      outcome: 'started',
      phase: purchaseRetryPending ? 'recovery' : 'intent',
      source: 'shop',
    });
    try {
      const result = await purchaseItem(user.id, item.id);
      if (!result.success) {
        const message =
          result.message || t('commerce.shop.purchasePendingDetail');
        if (result.outcome === 'insufficient-balance') {
          void emitHaptic({
            type: 'blocked',
            reason: 'insufficient-momenta',
          });
          trackProductOperation({
            area: 'shop',
            authority: 'server',
            operation: 'purchase_item',
            outcome: 'ineligible',
            phase: 'eligibility',
            source: 'shop',
          });
          purchaseAttemptRef.current = null;
          setStatusSheet(null);
          setTopUpVisible(true);
          return;
        }
        const notice = getCommerceNotice(
          result.outcome === 'unknown' ? 'unknown-result' : 'failed',
          undefined,
          t
        );
        setStatusSheet(
          result.outcome === 'unknown'
            ? {
                ...notice,
                message: t('commerce.shop.purchasePendingDetail'),
                refreshActionTitle: t('commerce.shop.checkPurchaseAgain'),
              }
            : { ...notice, message }
        );
        setPurchaseRecoveryPending(result.outcome === 'unknown');
        void emitHaptic(
          result.outcome === 'unknown'
            ? { type: 'unknown' }
            : { type: 'failed', operation: 'purchase' }
        );
        trackProductOperation({
          area: 'shop',
          authority: 'server',
          operation: 'purchase_item',
          outcome: result.outcome === 'unknown' ? 'unknown' : 'failed',
          phase: result.outcome === 'unknown' ? 'reconciliation' : 'authority',
          source: 'shop',
        });
        if (result.outcome !== 'unknown') purchaseAttemptRef.current = null;
        return;
      }

      const purchaseReceiptId =
        result.receipt?.clientEventId ?? result.clientEventId;
      void emitConfirmedOutcome(
        'purchase-confirmed',
        createConfirmedReceipt('purchase', purchaseReceiptId)
      );
      trackProductOperation({
        area: 'shop',
        authority: 'server',
        operation: 'purchase_item',
        outcome: purchaseRetryPending ? 'recovered' : 'confirmed',
        phase: purchaseRetryPending ? 'recovery' : 'authority',
        source: 'shop',
      });
      const notice = getCommerceNotice(
        'server-receipt-confirmed',
        {
          itemName: displayName,
        },
        t
      );
      const receiptMessage = getAuthoritativePurchaseMessage(
        result,
        displayName,
        locale,
        t
      );
      let appearanceActivated = false;
      try {
        await refreshState();
        if (!isPowerUp && equipCategory !== 'catalog') {
          try {
            await equipItem(item.id, equipCategory, sku);
            appearanceActivated = isEquipped(item.id);
          } catch (equipError) {
            console.error(
              '[ShopItem] Purchased appearance could not be activated',
              equipError
            );
          }
        }
      } catch (refreshError) {
        trackProductOperation({
          area: 'shop',
          authority: 'client',
          operation: 'purchase_item',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'shop',
        });
        console.error('[ShopItem] Refresh after purchase failed', refreshError);
        setStatusSheet({
          ...notice,
          message: `${receiptMessage} Check status if the balance or inventory does not update immediately.`,
          refreshActionTitle: 'Check status',
        });
        setPurchaseRecoveryPending(true);
        return;
      }
      purchaseAttemptRef.current = null;
      setPurchaseRecoveryPending(false);
      setStatusSheet(
        appearanceActivated
          ? {
              ...notice,
              title: `${displayName} is in use`,
              message: `You bought ${displayName}, and Menta is now using it.`,
              facts: [
                {
                  label: t('commerce.shop.purchaseLabel'),
                  value: t('commerce.commerce.purchaseStatusComplete'),
                },
                {
                  label: t('commerce.shop.styleLabel'),
                  value: t('commerce.shop.inUse'),
                },
              ],
            }
          : {
              ...notice,
              message:
                !isPowerUp && equipCategory !== 'catalog'
                  ? `${receiptMessage} Tap Use this style to apply it.`
                  : receiptMessage,
            }
      );
    } catch (error) {
      trackProductOperation({
        area: 'shop',
        authority: 'server',
        operation: 'purchase_item',
        outcome: isOfflineCommerceError(error) ? 'unknown' : 'failed',
        phase: isOfflineCommerceError(error) ? 'reconciliation' : 'authority',
        source: 'shop',
      });
      console.error('[ShopItem] Purchase failed', error);
      setStatusSheet(
        getCommerceNotice(
          isOfflineCommerceError(error) ? 'unknown-result' : 'failed',
          undefined,
          t
        )
      );
      const unknown = isOfflineCommerceError(error);
      void emitHaptic(
        unknown
          ? { type: 'unknown' }
          : { type: 'failed', operation: 'purchase' }
      );
      setPurchaseRecoveryPending(unknown);
      if (!unknown) purchaseAttemptRef.current = null;
    } finally {
      setWorking(false);
    }
  }, [
    insufficient,
    displayName,
    equipCategory,
    equipItem,
    inventoryCount,
    isEquipped,
    isPowerUp,
    item,
    purchaseItem,
    purchaseRecoveryPending,
    purchaseRetryPending,
    purchased,
    refreshState,
    sku,
    user?.id,
    working,
    locale,
    t,
  ]);

  const handleEquip = useCallback(async () => {
    if (!item || working) return;

    setWorking(true);
    try {
      await equipItem(item.id, equipCategory, sku);
      await refreshAfterCompletedAction({
        title: t('commerce.shop.styleInUse', { name: item.name }),
        message: t('commerce.shop.usingStyle'),
        staleMessage: t('commerce.shop.refreshIfMissing', {
          message: t('commerce.shop.styleInUse', { name: item.name }),
        }),
        logContext: 'equip',
        refreshActionTitle: t('commerce.shop.refreshItemsAction'),
      });
    } catch (error) {
      console.error('[ShopItem] Equip failed', error);
      setStatusSheet({
        kind: 'error',
        title: t('commerce.shop.couldNotUseStyle'),
        message: t('commerce.wallet.tryAgainMoment'),
      });
    } finally {
      setWorking(false);
    }
  }, [
    equipCategory,
    equipItem,
    item,
    refreshAfterCompletedAction,
    sku,
    working,
  ]);

  const handleUnequip = useCallback(async () => {
    if (!item || working) return;

    setWorking(true);
    try {
      await unequipItem(equipCategory);
      await refreshAfterCompletedAction({
        title: t('commerce.shop.styleRemoved', { name: item.name }),
        message: t('commerce.shop.styleNoLongerUsed'),
        staleMessage: t('commerce.shop.refreshIfMissing', {
          message: t('commerce.shop.styleRemoved', { name: item.name }),
        }),
        logContext: 'unequip',
        refreshActionTitle: t('commerce.shop.refreshItemsAction'),
      });
    } catch (error) {
      console.error('[ShopItem] Unequip failed', error);
      setStatusSheet({
        kind: 'error',
        title: t('commerce.shop.couldNotRemoveStyle'),
        message: t('commerce.wallet.tryAgainMoment'),
      });
    } finally {
      setWorking(false);
    }
  }, [equipCategory, item, refreshAfterCompletedAction, unequipItem, working]);

  const applyPowerUp = useCallback(
    async (challengeId?: string) => {
      if (!item || !user?.id || working) return;
      if (requiresChallenge && !challengeId) {
        setTargetSheetVisible(true);
        await fetchTargets();
        return;
      }

      setWorking(true);
      const clientEventId = createClientEventId();
      powerUpAttemptRef.current = challengeId
        ? { challengeId, clientEventId }
        : null;
      try {
        const result = await applyInventoryPowerUp(
          user.id,
          sku,
          challengeId,
          undefined,
          clientEventId
        );
        if (!result.success) {
          if (result.outcome !== 'unknown') powerUpAttemptRef.current = null;
          setStatusSheet({
            kind: result.outcome === 'unknown' ? 'info' : 'error',
            title:
              result.outcome === 'unknown'
                ? t('commerce.shop.extensionUnknown')
                : t('commerce.shop.extensionNotUsed'),
            message: result.message,
            refreshActionTitle:
              result.outcome === 'unknown'
                ? t('commerce.shop.checkExtensionStatus')
                : undefined,
          });
          return;
        }

        powerUpAttemptRef.current = null;
        setTargetSheetVisible(false);
        await refreshAfterCompletedAction({
          title: t('commerce.shop.deadlineExtended'),
          message: result.message,
          staleMessage: `${result.message} Refresh your items if the available count has not updated.`,
          logContext: 'extension use',
          refreshActionTitle: t('commerce.shop.refreshItemsAction'),
          facts: [
            {
              label: t('commerce.shop.promiseDeadline'),
              value: t('commerce.shop.twelveHoursLater'),
            },
            {
              label: t('commerce.shop.extension'),
              value: t('commerce.shop.usedOnce'),
            },
          ],
        });
      } catch (error) {
        console.error('[ShopItem] Use failed', error);
        setStatusSheet({
          kind: 'error',
          title: t('commerce.shop.extensionNotUsed'),
          message: t('commerce.shop.refreshBeforeUse'),
        });
      } finally {
        setWorking(false);
      }
    },
    [
      fetchTargets,
      item,
      refreshAfterCompletedAction,
      requiresChallenge,
      sku,
      applyInventoryPowerUp,
      user?.id,
      working,
    ]
  );

  const openUseFlow = useCallback(async () => {
    if (!item) return;

    if (!purchased) {
      setStatusSheet({
        kind: 'info',
        title: t('commerce.shop.notAvailable', { name: displayName }),
        message: t('commerce.shop.returnToShop'),
        refreshActionTitle: t('commerce.shop.refreshItemsAction'),
      });
      return;
    }

    if (!isPowerUp) {
      if (equipped) {
        await handleUnequip();
        return;
      }
      await handleEquip();
      return;
    }

    if (inventoryCount <= 0) {
      setStatusSheet({
        kind: 'info',
        title: t('commerce.shop.noAvailable', {
          name: displayName.toLowerCase(),
        }),
        message: t('commerce.shop.refreshBeforeUse'),
        refreshActionTitle: t('commerce.shop.refreshItemsAction'),
      });
      return;
    }

    if (autoConsumedPowerUp) {
      setStatusSheet({
        kind: 'info',
        title: t('commerce.shop.freezeReady'),
        message: t('commerce.shop.freezeDetail'),
        facts: [
          {
            label: t('commerce.shop.availableLabel'),
            value: inventoryCount.toLocaleString(),
          },
          {
            label: t('commerce.shop.use'),
            value: t('commerce.shop.automatic'),
          },
        ],
      });
      return;
    }

    setTargetSheetVisible(true);
    await fetchTargets();
  }, [
    autoConsumedPowerUp,
    displayName,
    equipped,
    fetchTargets,
    handleEquip,
    handleUnequip,
    inventoryCount,
    isPowerUp,
    item,
    purchased,
  ]);

  useEffect(() => {
    if (!item || action !== 'use' || !isPowerUp) return;

    const actionKey = `${String(id)}:${sku}:use`;
    if (handledUseActionRef.current === actionKey) return;

    handledUseActionRef.current = actionKey;
    void openUseFlow();
  }, [action, id, isPowerUp, item, openUseFlow, sku]);

  const primaryAction = useMemo(() => {
    if (!item) return null;
    if (accountLoading || accountError) {
      return {
        title: accountLoading
          ? t('commerce.shop.loadingBalanceItems')
          : t('commerce.shop.balanceUnavailable'),
        variant: 'outline' as const,
        disabled: true,
        onPress: () => undefined,
      };
    }
    if (purchaseRetryPending) {
      return {
        title: t('commerce.shop.checkPurchaseAgain'),
        variant: 'primary' as const,
        disabled: false,
        onPress: handlePurchase,
      };
    }
    if (!purchased) {
      if (purchaseRecoveryPending) {
        return {
          title: t('commerce.shop.checkStatus'),
          variant: 'primary' as const,
          disabled: statusRefreshing,
          onPress: () => void handleStatusRefresh(),
        };
      }
      if (unlockDays) {
        return {
          title: t('commerce.shop.keepStreak', { days: unlockDays }),
          variant: 'outline' as const,
          disabled: true,
          onPress: () => undefined,
        };
      }
      if (insufficient) {
        return {
          title: t('commerce.shop.getMomenta'),
          variant: 'primary' as const,
          disabled: false,
          onPress: () => {
            void emitHaptic({
              type: 'blocked',
              reason: 'insufficient-momenta',
            });
            setTopUpVisible(true);
          },
        };
      }
      return {
        title: repeatConsumablePurchase
          ? t('commerce.shop.buyAgainFor', { amount: cost.toLocaleString() })
          : t('commerce.shop.buyFor', { amount: cost.toLocaleString() }),
        variant: 'accent' as const,
        disabled: false,
        onPress: () => setConfirmPurchaseVisible(true),
      };
    }

    if (isPowerUp) {
      if (autoConsumedPowerUp) {
        return {
          title:
            inventoryCount > 0
              ? t('commerce.shop.howItWorks')
              : t('commerce.shop.noneAvailable'),
          variant: 'primary' as const,
          disabled: inventoryCount <= 0,
          onPress: openUseFlow,
        };
      }

      return {
        title:
          inventoryCount > 0
            ? requiresChallenge
              ? t('commerce.shop.choosePromise')
              : t('commerce.shop.useExtension')
            : t('commerce.shop.noneAvailable'),
        variant: 'accent' as const,
        disabled: inventoryCount <= 0,
        onPress: openUseFlow,
      };
    }

    return {
      title: equipped
        ? t('commerce.shop.removeStyle')
        : t('commerce.shop.useStyle'),
      variant: equipped ? ('outline' as const) : ('accent' as const),
      disabled: false,
      onPress: openUseFlow,
    };
  }, [
    cost,
    equipped,
    insufficient,
    inventoryCount,
    isPowerUp,
    item,
    handleStatusRefresh,
    handlePurchase,
    openUseFlow,
    purchased,
    purchaseRecoveryPending,
    purchaseRetryPending,
    repeatConsumablePurchase,
    requiresChallenge,
    statusRefreshing,
    autoConsumedPowerUp,
    accountError,
    accountLoading,
    unlockDays,
  ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.topBar, insetPadding]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commerce.accessibility.goBack')}
            hitSlop={10}
            onPress={() => backOrReplace(router, '/shop')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeftIcon size={20} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('commerce.accessibility.loadingItem')}
          style={[styles.detailLoadingState, insetPadding]}
          testID="shop-item-loading-state"
        >
          <Text style={styles.kicker}>{t('commerce.shop.currentItem')}</Text>
          <SkeletonLoader announce={false} style={styles.detailSkeletonHero} />
          <SkeletonLoader announce={false} style={styles.detailSkeletonTitle} />
          <SkeletonLoader announce={false} style={styles.detailSkeletonBody} />
          <ShopItemImpactSkeleton testID="shop-item-impact-skeleton" />
          <View style={styles.detailSkeletonRows}>
            <View style={styles.detailSkeletonRow}>
              <SkeletonLoader
                announce={false}
                style={styles.detailSkeletonLabel}
              />
              <SkeletonLoader
                announce={false}
                style={styles.detailSkeletonValue}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.topBar, insetPadding]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commerce.accessibility.goBack')}
            hitSlop={10}
            onPress={() => backOrReplace(router, '/shop')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeftIcon size={20} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <View style={[styles.centerState, insetPadding]}>
          <Text style={styles.stateTitle}>
            {t('commerce.shop.itemUnavailable')}
          </Text>
          <Text style={styles.stateText}>
            {loadError || t('commerce.shop.notCurrentItem')}
          </Text>
          <AppButton
            title={t('commerce.action.tryAgain')}
            variant="outline"
            onPress={() => void load()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.topBar, insetPadding]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('commerce.accessibility.goBack')}
          hitSlop={10}
          onPress={() => backOrReplace(router, '/shop')}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeftIcon size={20} color={theme.colors.text.primary} />
        </Pressable>

        {!accountLoading && !accountError ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/momenta')}
            style={({ pressed }) => [
              styles.balancePill,
              pressed && styles.pressed,
            ]}
          >
            <WalletIcon size={14} color={theme.colors.text.primary} />
            <Text style={styles.balanceText}>
              {new Intl.NumberFormat(locale).format(balance)}{' '}
              {t('commerce.shop.currency')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          usesIPadWorkspace && styles.ipadContent,
          insetPadding,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {usesIPadWorkspace ? (
          <IPadShopDetailWorkspace
            visual={
              <ErrorBoundary level="component">
                <View style={[styles.hero, styles.ipadHero]}>
                  <View style={[styles.objectPlane, styles.ipadObjectPlane]}>
                    <ShopItemGlyph
                      item={item}
                      color={theme.colors.text.primary}
                      size={112}
                    />
                  </View>
                  <Text style={styles.kicker}>
                    {formatShopCategory(item.category, t)}
                  </Text>
                  <Text style={styles.title}>{displayName}</Text>
                  {displayDescription ? (
                    <Text style={styles.description}>{displayDescription}</Text>
                  ) : null}
                </View>
              </ErrorBoundary>
            }
            details={
              <>
                {accountError ? (
                  <AppInlineNotice
                    title={t('commerce.shop.balanceUnavailable')}
                    description={t('commerce.shop.itemAccountDetail')}
                    tone="warning"
                    actionLabel={t('commerce.action.tryAgain')}
                    onAction={() => void refreshAccountState()}
                    testID="shop-item-account-unavailable"
                  />
                ) : null}
                {!accountLoading && !accountError ? (
                  <ErrorBoundary level="component">
                    <ShopItemImpactPreview
                      item={{
                        id: item.id,
                        sku: item.sku,
                        name: displayName,
                        description: displayDescription,
                        category: item.category,
                        unlock_streak_days: item.unlock_streak_days,
                      }}
                      inventoryCount={inventoryCount}
                      owned={purchased}
                      equipped={equipped}
                      profileImageUrl={user?.avatarUrl}
                      profileName={user?.username}
                    />
                    <View
                      accessible
                      accessibilityRole="summary"
                      accessibilityLabel={`${isPowerUp ? 'Boost' : 'Style'}. ${displayName}. ${primaryState}. ${
                        purchased || repeatConsumablePurchase
                          ? primaryState
                          : unlockDays
                            ? `Unlocks at a ${unlockDays}-day streak`
                            : cost > 0
                              ? `${cost.toLocaleString()} Momenta`
                              : 'Free'
                      }.`}
                      style={styles.accountSummary}
                      testID="shop-account-summary"
                    >
                      <View style={styles.accountSummaryCopy}>
                        <Text style={styles.accountSummaryLabel}>
                          {isPowerUp ? 'Boost' : 'Style'}
                        </Text>
                        <Text style={styles.accountSummaryValue}>
                          {primaryState}
                        </Text>
                      </View>
                      {!purchased && !repeatConsumablePurchase ? (
                        <Text style={styles.accountSummaryTrail}>
                          {unlockDays
                            ? `${unlockDays}-day streak`
                            : cost > 0
                              ? `${cost.toLocaleString()} Momenta`
                              : 'Free'}
                        </Text>
                      ) : null}
                    </View>
                  </ErrorBoundary>
                ) : null}
              </>
            }
            actions={
              <>
                {primaryAction ? (
                  <AppButton
                    title={
                      working
                        ? t('commerce.accessibility.checking')
                        : primaryAction.title
                    }
                    variant={primaryAction.variant}
                    size="large"
                    onPress={() => void primaryAction.onPress()}
                    disabled={primaryAction.disabled || working}
                    fullWidth
                  />
                ) : null}
                <AppButton
                  title={
                    purchased
                      ? t('commerce.action.openItems')
                      : t('commerce.action.backToShop')
                  }
                  variant="ghost"
                  size="medium"
                  onPress={() =>
                    router.push(purchased ? '/inventory' : '/shop')
                  }
                  fullWidth
                />
              </>
            }
          />
        ) : (
          <>
            <ErrorBoundary level="component">
              <View style={styles.hero}>
                <View style={styles.objectPlane}>
                  <ShopItemGlyph
                    item={item}
                    color={theme.colors.text.primary}
                    size={84}
                  />
                </View>
                <Text style={styles.kicker}>
                  {formatShopCategory(item.category, t)}
                </Text>
                <Text style={styles.title}>{displayName}</Text>
                {displayDescription ? (
                  <Text style={styles.description}>{displayDescription}</Text>
                ) : null}
              </View>
            </ErrorBoundary>

            {accountError ? (
              <AppInlineNotice
                title={t('commerce.shop.balanceUnavailable')}
                description={t('commerce.shop.itemAccountDetail')}
                tone="warning"
                actionLabel={t('commerce.action.tryAgain')}
                onAction={() => void refreshAccountState()}
                testID="shop-item-account-unavailable"
              />
            ) : null}

            {!accountLoading && !accountError ? (
              <ErrorBoundary level="component">
                <ShopItemImpactPreview
                  item={{
                    id: item.id,
                    sku: item.sku,
                    name: displayName,
                    description: displayDescription,
                    category: item.category,
                    unlock_streak_days: item.unlock_streak_days,
                  }}
                  inventoryCount={inventoryCount}
                  owned={purchased}
                  equipped={equipped}
                  profileImageUrl={user?.avatarUrl}
                  profileName={user?.username}
                />

                <View
                  accessible
                  accessibilityRole="summary"
                  accessibilityLabel={`${isPowerUp ? 'Boost' : 'Style'}. ${displayName}. ${primaryState}. ${
                    purchased || repeatConsumablePurchase
                      ? primaryState
                      : unlockDays
                        ? `Unlocks at a ${unlockDays}-day streak`
                        : cost > 0
                          ? `${cost.toLocaleString()} Momenta`
                          : 'Free'
                  }.`}
                  style={styles.accountSummary}
                  testID="shop-account-summary"
                >
                  <View style={styles.accountSummaryCopy}>
                    <Text style={styles.accountSummaryLabel}>
                      {isPowerUp ? 'Boost' : 'Style'}
                    </Text>
                    <Text style={styles.accountSummaryValue}>
                      {primaryState}
                    </Text>
                  </View>
                  {!purchased && !repeatConsumablePurchase ? (
                    <Text style={styles.accountSummaryTrail}>
                      {unlockDays
                        ? `${unlockDays}-day streak`
                        : cost > 0
                          ? `${cost.toLocaleString()} Momenta`
                          : 'Free'}
                    </Text>
                  ) : null}
                </View>
              </ErrorBoundary>
            ) : null}
          </>
        )}
      </ScrollView>

      {!usesIPadWorkspace ? (
        <View style={[styles.footer, insetPadding]}>
          {primaryAction ? (
            <AppButton
              title={
                working
                  ? t('commerce.accessibility.checking')
                  : primaryAction.title
              }
              variant={primaryAction.variant}
              size="large"
              onPress={() => void primaryAction.onPress()}
              disabled={primaryAction.disabled || working}
              fullWidth
            />
          ) : null}
          <AppButton
            title={
              purchased
                ? t('commerce.action.openItems')
                : t('commerce.action.backToShop')
            }
            variant="ghost"
            size="medium"
            onPress={() => router.push(purchased ? '/inventory' : '/shop')}
            fullWidth
          />
        </View>
      ) : null}

      <SimpleBottomSheet
        visible={confirmPurchaseVisible}
        onClose={() => setConfirmPurchaseVisible(false)}
        maxHeight={520}
        testID="shop-confirm-purchase-sheet"
        scrollHint={t('commerce.shop.costScrollHint')}
        scrollableBody={
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {t('commerce.shop.buyQuestion', { name: displayName })}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {t('commerce.shop.buyDetail')}
              </Text>
            </View>

            <ShopItemImpactPreview
              item={{
                id: item.id,
                sku: item.sku,
                name: displayName,
                description: displayDescription,
                category: item.category,
                unlock_streak_days: item.unlock_streak_days,
              }}
              inventoryCount={inventoryCount}
              owned={purchased}
              equipped={equipped}
              profileImageUrl={user?.avatarUrl}
              profileName={user?.username}
              compact
              testID="shop-confirm-impact-preview"
            />

            <View style={styles.confirmRows}>
              <DetailRow
                label={t('commerce.shop.currentBalance')}
                value={t('commerce.shop.spendBalance', {
                  amount: balance.toLocaleString(),
                })}
              />
              <DetailRow
                label={t('commerce.shop.spend')}
                value={t('commerce.shop.spendBalance', {
                  amount: cost.toLocaleString(),
                })}
              />
              <DetailRow
                label={t('commerce.shop.balanceAfter')}
                value={t('commerce.shop.spendBalance', {
                  amount: Math.max(balance - cost, 0).toLocaleString(),
                })}
              />
            </View>
          </>
        }
        footer={
          <>
            <AppButton
              title={t('commerce.shop.buyFor', {
                amount: cost.toLocaleString(),
              })}
              accessibilityLabel={t('commerce.shop.buyNamedFor', {
                name: displayName,
                amount: cost.toLocaleString(),
              })}
              disabled={working}
              fullWidth
              loading={working}
              onPress={() => void handlePurchase()}
              size="large"
              testID="shop-confirm-purchase"
              variant="accent"
            />

            <AppButton
              title={t('commerce.action.cancelPurchase')}
              variant="ghost"
              size="large"
              onPress={() => setConfirmPurchaseVisible(false)}
              fullWidth
            />
          </>
        }
      />

      <SimpleBottomSheet
        visible={targetSheetVisible}
        onClose={() => setTargetSheetVisible(false)}
        testID="shop-target-sheet"
        scrollableBody={
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {t('commerce.shop.choosePromise')}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {t('commerce.shop.extensionDetail')}
              </Text>
            </View>

            {targetsLoading ? (
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={t('commerce.accessibility.loadingPromises')}
                style={styles.centerSheet}
              >
                <Text style={styles.sheetTitleSmall}>
                  {t('commerce.shop.loadingPromises')}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {t('commerce.shop.findingPromises')}
                </Text>
                <View style={styles.sheetSkeletonList}>
                  {[0, 1].map(index => (
                    <View key={index} style={styles.sheetSkeletonRow}>
                      <SkeletonLoader
                        announce={false}
                        style={styles.sheetSkeletonCopy}
                      />
                      <SkeletonLoader
                        announce={false}
                        style={styles.sheetSkeletonTrail}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : targetError ? (
              <View style={styles.centerSheet}>
                <TargetIcon size={24} color={theme.colors.status.error} />
                <Text style={styles.sheetTitleSmall}>
                  {t('commerce.shop.promiseTargetsMissing')}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {t('commerce.shop.extensionStillAvailable')}
                </Text>
                <AppButton
                  title={t('commerce.action.tryAgain')}
                  variant="outline"
                  onPress={() => void fetchTargets()}
                />
              </View>
            ) : targets.length === 0 ? (
              <View style={styles.centerSheet}>
                <TargetIcon size={24} color={theme.colors.text.primary} />
                <Text style={styles.sheetTitleSmall}>
                  {t('commerce.shop.noActivePromises')}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {t('commerce.shop.startBeforeExtension')}
                </Text>
                <AppButton
                  title={t('commerce.shop.startPromise')}
                  variant="outline"
                  onPress={() => {
                    setTargetSheetVisible(false);
                    router.push('/create-challenge');
                  }}
                />
              </View>
            ) : (
              <View style={styles.sheetList}>
                {targets.map(target => (
                  <Pressable
                    key={target.id}
                    accessibilityRole="button"
                    disabled={working}
                    onPress={() => void applyPowerUp(target.id)}
                    style={({ pressed }) => [
                      styles.sheetRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.sheetRowCopy}>
                      <Text style={styles.sheetRowTitle}>{target.title}</Text>
                      <Text style={styles.sheetRowMeta}>
                        {target.currentStreak > 0
                          ? t('commerce.shop.dayStreak', {
                              count: target.currentStreak,
                            })
                          : t('commerce.shop.activePromise')}
                      </Text>
                    </View>
                    <ChevronRightIcon
                      size={18}
                      color={theme.colors.text.tertiary}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        }
      />

      <SimpleBottomSheet
        visible={topUpVisible}
        onClose={() => setTopUpVisible(false)}
        testID="shop-item-top-up-sheet"
        scrollableBody={
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {t('commerce.shop.addMomenta', {
                  amount: shortfall.toLocaleString(),
                })}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {t('commerce.shop.coverDifference', {
                  balance: balance.toLocaleString(),
                  name: displayName,
                })}
              </Text>
            </View>

            <View style={styles.earnFirstCard}>
              <View style={styles.earnFirstIcon}>
                <GiftIcon size={18} color={theme.colors.text.primary} />
              </View>
              <View style={styles.earnFirstCopy}>
                <Text style={styles.earnFirstTitle}>
                  {t('commerce.shop.itemStillHere')}
                </Text>
                <Text style={styles.earnFirstText}>
                  {t('commerce.shop.comeBack')}
                </Text>
              </View>
            </View>

            <View style={styles.sheetList}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('commerce.shop.earnReviewAccessibility', {
                  amount: REVIEW_QUEUE_CLEAR_REWARD_AMOUNT,
                })}
                onPress={() => {
                  setTopUpVisible(false);
                  router.push('/review-queue');
                }}
                style={({ pressed }) => [
                  styles.sheetRow,
                  !canWatchSponsors && !canBuyCredits && styles.sheetRowLast,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.sheetRowIcon}>
                  <CheckCircleIcon
                    size={18}
                    color={theme.colors.text.secondary}
                  />
                </View>
                <View style={styles.sheetRowCopy}>
                  <Text style={styles.sheetRowTitle}>
                    {t('commerce.wallet.earnReview')}
                  </Text>
                  <Text style={styles.sheetRowMeta}>
                    {t('commerce.wallet.reviewMeta', {
                      amount: REVIEW_QUEUE_CLEAR_REWARD_AMOUNT,
                    })}
                  </Text>
                </View>
                <Text style={styles.sheetRowValue}>
                  +{REVIEW_QUEUE_CLEAR_REWARD_AMOUNT}
                </Text>
                <ChevronRightIcon
                  size={18}
                  color={theme.colors.text.tertiary}
                />
              </Pressable>

              {canWatchSponsors ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    adReward && adReward > 0
                      ? t('commerce.shop.watchAdAccessibility', {
                          amount: adReward,
                        })
                      : t('commerce.shop.watchAdNoAmountAccessibility')
                  }
                  onPress={() => {
                    setTopUpVisible(false);
                    setPaywallVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    !canBuyCredits && styles.sheetRowLast,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.sheetRowIcon}>
                    <GiftIcon size={18} color={theme.colors.text.secondary} />
                  </View>
                  <View style={styles.sheetRowCopy}>
                    <Text style={styles.sheetRowTitle}>
                      {t('commerce.wallet.watchAd')}
                    </Text>
                    <Text style={styles.sheetRowMeta}>
                      {t('commerce.wallet.dailyLimits')}
                    </Text>
                  </View>
                  <Text style={styles.sheetRowValue}>
                    {adReward
                      ? t('commerce.shop.upTo', { amount: adReward })
                      : t('commerce.wallet.open')}
                  </Text>
                  <ChevronRightIcon
                    size={18}
                    color={theme.colors.text.tertiary}
                  />
                </Pressable>
              ) : null}

              {canBuyCredits ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    creditPurchaseReady
                      ? t('commerce.shop.buyPackAccessibility', {
                          amount: creditTotal.toLocaleString(),
                          price: creditPrice || '',
                        })
                      : t('commerce.shop.buyPackChecking')
                  }
                  disabled={!creditPurchaseReady || creditLoading}
                  onPress={() => void handleCreditPurchase()}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    styles.sheetRowLast,
                    (!creditPurchaseReady || creditLoading) &&
                      styles.disabledRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.sheetRowIcon}>
                    <WalletIcon size={18} color={theme.colors.text.secondary} />
                  </View>
                  <View style={styles.sheetRowCopy}>
                    <Text style={styles.sheetRowTitle}>
                      {t('commerce.wallet.buyPack')}
                    </Text>
                    <Text style={styles.sheetRowMeta}>
                      {creditPurchaseReady
                        ? `${creditTotal.toLocaleString()} Momenta`
                        : t('commerce.wallet.checkingPrice')}
                    </Text>
                  </View>
                  {creditLoading || creditPriceLoading ? (
                    <Text style={styles.sheetRowValue}>
                      {t('commerce.accessibility.checking')}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.sheetRowValue}>
                        {creditPrice || t('commerce.wallet.unavailable')}
                      </Text>
                      <ChevronRightIcon
                        size={18}
                        color={theme.colors.text.tertiary}
                      />
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          </>
        }
        footer={
          <View style={styles.sheetActions}>
            <AppButton
              title={t('commerce.action.seeWaysToEarn')}
              variant="primary"
              size="large"
              onPress={() => {
                setTopUpVisible(false);
                router.push('/review-queue');
              }}
              fullWidth
            />
            <AppButton
              title={t('commerce.paywall.seePro')}
              variant="ghost"
              size="medium"
              onPress={() => {
                setTopUpVisible(false);
                setPaywallVisible(true);
              }}
              fullWidth
            />
          </View>
        }
      />

      <MomentaActionNoticeSheet
        visible={Boolean(statusSheet)}
        notice={statusSheet}
        onClose={() => setStatusSheet(null)}
        onRefresh={() =>
          void (purchaseRetryPending ? handlePurchase() : handleStatusRefresh())
        }
        refreshing={working || statusRefreshing}
        testID="shop-item-status-sheet"
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onBuyPro={() => setPaywallVisible(false)}
        onBuyCredits={() => setPaywallVisible(false)}
        onWatchAd={canWatchSponsors ? handleWatchAd : undefined}
        context="general"
        shortfall={shortfall}
        adRewardAmount={canWatchSponsors ? adReward : 0}
      />
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    topBar: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: mentaSpacing[6],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
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
    balancePill: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      borderRadius: mentaRadii.round,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      paddingHorizontal: 12,
    },
    balanceText: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[6],
      paddingBottom: mentaSpacing[8],
      gap: mentaSpacing[6],
    },
    ipadContent: {
      paddingBottom: mentaSpacing[8],
      paddingHorizontal: mentaSpacing[8],
      paddingTop: mentaSpacing[8],
    },
    hero: {
      gap: 12,
    },
    ipadHero: {
      gap: mentaSpacing[4],
    },
    objectPlane: {
      width: '100%',
      minHeight: 220,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: mentaSpacing[3],
    },
    ipadObjectPlane: {
      minHeight: 400,
    },
    kicker: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.labelBold,
    },
    title: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    description: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
    },
    accountSummary: {
      alignItems: 'center',
      borderBottomColor: theme.colors.border.secondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: mentaSpacing[4],
      justifyContent: 'space-between',
      minHeight: 72,
      paddingVertical: mentaSpacing[3],
    },
    accountSummaryCopy: {
      flex: 1,
      gap: mentaSpacing[1],
      minWidth: 0,
    },
    accountSummaryLabel: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.bodySmall,
    },
    accountSummaryValue: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
    },
    accountSummaryTrail: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
      flexShrink: 0,
      fontVariant: ['tabular-nums'],
      textAlign: 'right',
    },
    detailRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    detailLabel: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    detailValue: {
      flex: 1,
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
      textAlign: 'right',
    },
    footer: {
      gap: 8,
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[3],
      paddingBottom: mentaSpacing[6],
      backgroundColor: theme.colors.background.primary,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 24,
    },
    detailLoadingState: {
      flex: 1,
      gap: 12,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    detailSkeletonHero: {
      width: '100%',
      height: 190,
      marginVertical: 8,
      borderRadius: mentaRadii.small,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
    },
    detailSkeletonTitle: {
      width: '64%',
      height: 28,
      borderRadius: mentaRadii.small,
    },
    detailSkeletonBody: {
      width: '88%',
      height: 14,
      borderRadius: mentaRadii.small,
    },
    detailSkeletonRows: {
      marginTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    detailSkeletonRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    detailSkeletonLabel: {
      width: 58,
      height: 11,
      borderRadius: mentaRadii.small,
    },
    detailSkeletonValue: {
      width: 104,
      height: 13,
      borderRadius: mentaRadii.small,
    },
    stateTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
      textAlign: 'center',
    },
    stateText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
      textAlign: 'center',
    },
    sheetHeader: {
      gap: 6,
      paddingBottom: 16,
    },
    confirmRows: {
      marginBottom: 18,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    sheetTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
      textAlign: 'center',
    },
    sheetTitleSmall: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
      textAlign: 'center',
    },
    sheetSubtitle: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
      textAlign: 'center',
    },
    centerSheet: {
      minHeight: 180,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    sheetSkeletonList: {
      width: '100%',
      marginTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    sheetSkeletonRow: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    sheetSkeletonCopy: {
      width: '58%',
      height: 14,
      borderRadius: mentaRadii.small,
    },
    sheetSkeletonTrail: {
      width: 42,
      height: 14,
      borderRadius: mentaRadii.small,
    },
    sheetList: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    sheetRow: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    sheetRowLast: {
      borderBottomWidth: 0,
    },
    sheetRowIcon: {
      width: 28,
      alignItems: 'flex-start',
    },
    sheetRowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    sheetRowTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
    },
    sheetRowMeta: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    sheetRowValue: {
      minWidth: 42,
      color: theme.colors.accent.primary,
      ...mentaTypography.bodySemibold,
      textAlign: 'right',
    },
    earnFirstCard: {
      minHeight: 66,
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      paddingVertical: mentaSpacing[4],
      marginBottom: mentaSpacing[4],
    },
    earnFirstIcon: {
      width: 34,
      height: 34,
      borderRadius: mentaRadii.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent.background,
    },
    earnFirstCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    earnFirstTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
    },
    earnFirstText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    sheetActions: {
      paddingTop: 14,
      gap: 10,
    },
    pressed: {
      opacity: 0.72,
    },
    disabledRow: {
      opacity: 0.46,
    },
  });
