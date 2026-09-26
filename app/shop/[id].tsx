import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import {
  MomentaActionNoticeSheet,
  type MomentaActionNotice,
} from '@/components/momenta/MomentaActionNoticeSheet';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { IPadShopDetailWorkspace } from '@/components/ipad/IPadShopWorkspace';
import { useIPadPortraitWorkspace } from '@/components/ipad/ipad-workspace';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CoinsIcon,
  GiftIcon,
  TargetIcon,
} from '@/components/ui/icons';
import { getShopItemSku } from '@/components/shop/ShopPrimitives';
import { MomentaBalanceChip } from '@/components/shop/MomentaBalanceChip';
import { ShopItemArt } from '@/components/shop/ShopItemArt';
import {
  ShopTrailPill,
  type ShopItemCardTrail,
} from '@/components/shop/ShopItemCard';
import { ShopMascotBubble } from '@/components/shop/ShopMascotBubble';
import { ShopPressable } from '@/components/shop/ShopPressable';
import { ShopPurchaseCelebration } from '@/components/shop/ShopPurchaseCelebration';
import {
  ShopReceiptCard,
  type ShopReceiptFact,
} from '@/components/shop/ShopReceiptCard';
import {
  ShopItemImpactPreview,
  ShopItemImpactSkeleton,
} from '@/components/shop/ShopItemImpactPreview';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaColors,
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
  formatStreakUnlockCopy,
  getShopItemDisplayCopy,
  getUnlockStreakDays,
  isSupportedCatalogItem,
} from '@/lib/shop/catalogSupport';
import { claimStreakShopUnlocks } from '@/lib/shop/streak-unlocks';
import {
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

type CelebrationState = {
  sku: string;
  title: string;
  detail: string;
  gainLabel: string | null;
  facts: ShopReceiptFact[];
  next: 'items' | 'choose-promise' | 'use-style';
};

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
  unlockDays,
  t,
}: {
  purchased: boolean;
  historicallyPurchased: boolean;
  equipped: boolean;
  isPowerUp: boolean;
  inventoryCount: number;
  insufficient: boolean;
  shortfall: number;
  unlockDays: number | null;
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
  // A streak-locked item cannot be bought, so the unlock rule is the state.
  if (unlockDays) return formatStreakUnlockCopy(unlockDays, t);
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
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
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
  const { name: displayName, description: displayDescription } = item
    ? getShopItemDisplayCopy(item, t)
    : { name: '', description: '' };
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
    unlockDays,
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
  }, [refreshState, user?.id, t]);

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
  }, [fetchShopItems, refreshAccountState, t]);

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
          staleMessage: t('commerce.shop.refreshCountIfStale', {
            message: result.message,
          }),
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
          message: t('commerce.shop.inYourItems', { name: attempt.itemName }),
          facts: [
            {
              label: t('commerce.shop.purchaseLabel'),
              value: t('commerce.shop.purchaseComplete'),
            },
            {
              label: t('commerce.shop.balance'),
              value: t('commerce.shop.spendBalance', {
                amount: new Intl.NumberFormat(locale).format(
                  currentStore.balance
                ),
              }),
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
    locale,
    refreshAfterCompletedAction,
    refreshState,
    sku,
    statusRefreshing,
    t,
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
            title: String(
              challengeRecord?.title || t('commerce.shop.activePromise')
            ),
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
  }, [user?.id, t]);

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
  }, [adLoading, canWatchSponsors, claimAdReward, user?.id, t]);

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
  }, [creditLoading, creditPurchaseReady, t]);

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

    setWorking(true);
    purchaseAttemptRef.current = {
      beforeOwned: purchased,
      beforeQuantity: inventoryCount,
      itemId: item.id,
      itemName: displayName,
      itemSku: sku,
    };
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
          message: t('commerce.shop.checkStatusIfStale', {
            message: receiptMessage,
          }),
          refreshActionTitle: t('commerce.shop.checkStatus'),
        });
        setPurchaseRecoveryPending(true);
        return;
      }
      purchaseAttemptRef.current = null;
      setPurchaseRecoveryPending(false);
      const formatNumber = (value: number) =>
        new Intl.NumberFormat(locale).format(value);
      const confirmedQuantity = result.receipt?.quantity;
      const confirmedBalance = result.receipt?.newBalance;
      const gained =
        isPowerUp && typeof confirmedQuantity === 'number'
          ? confirmedQuantity - inventoryCount
          : 0;
      const facts: ShopReceiptFact[] = [];
      if (isPowerUp && typeof confirmedQuantity === 'number') {
        facts.push({
          label: t('commerce.celebrate.youHave'),
          value: formatNumber(confirmedQuantity),
        });
      }
      if (typeof confirmedBalance === 'number') {
        facts.push({
          label: t('commerce.shop.balance'),
          value: t('commerce.shop.spendBalance', {
            amount: formatNumber(confirmedBalance),
          }),
          emphasis: true,
        });
      }
      const appearance = !isPowerUp && equipCategory !== 'catalog';
      setCelebration({
        sku,
        title: appearanceActivated
          ? t('commerce.shop.styleInUse', { name: displayName })
          : t('commerce.celebrate.added', { name: displayName }),
        detail: appearanceActivated
          ? t('commerce.shop.boughtAndUsing', { name: displayName })
          : appearance
            ? t('commerce.celebrate.styleNotActive')
            : autoConsumedPowerUp
              ? t('commerce.powerUp.freezeDescription')
              : requiresChallenge
                ? t('commerce.powerUp.extensionSummary')
                : receiptMessage,
        gainLabel:
          gained > 0 ? t('commerce.celebrate.gain', { count: gained }) : null,
        facts,
        next:
          appearance && !appearanceActivated
            ? 'use-style'
            : requiresChallenge
              ? 'choose-promise'
              : 'items',
      });
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
      setConfirmPurchaseVisible(false);
      setWorking(false);
    }
  }, [
    autoConsumedPowerUp,
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
    requiresChallenge,
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
        title: t('commerce.shop.styleInUse', { name: displayName }),
        message: t('commerce.shop.usingStyle'),
        staleMessage: t('commerce.shop.refreshIfMissing', {
          message: t('commerce.shop.styleInUse', { name: displayName }),
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
    displayName,
    t,
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
        title: t('commerce.shop.styleRemoved', { name: displayName }),
        message: t('commerce.shop.styleNoLongerUsed'),
        staleMessage: t('commerce.shop.refreshIfMissing', {
          message: t('commerce.shop.styleRemoved', { name: displayName }),
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
  }, [
    displayName,
    equipCategory,
    item,
    refreshAfterCompletedAction,
    unequipItem,
    working,
    t,
  ]);

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
          staleMessage: t('commerce.shop.refreshCountIfStale', {
            message: result.message,
          }),
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
      t,
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
    t,
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
    // The catalogue is usually cached already, but the person's inventory is
    // read fresh on this screen. Wait for that read so an item they hold is
    // not reported as unavailable before its count arrives.
    if (accountLoading || accountError) return;

    const actionKey = `${String(id)}:${sku}:use`;
    if (handledUseActionRef.current === actionKey) return;

    handledUseActionRef.current = actionKey;
    void openUseFlow();
  }, [
    accountError,
    accountLoading,
    action,
    id,
    isPowerUp,
    item,
    openUseFlow,
    sku,
  ]);

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
        // A freeze is never used by hand, so the useful action for one the
        // person already holds is buying another. The server still owns the
        // price and balance check.
        if (shortfall > 0) {
          return {
            title: t('commerce.shop.getMomenta'),
            variant: 'accent' as const,
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
          title: t('commerce.shop.buyAgainFor', {
            amount: cost.toLocaleString(),
          }),
          variant: 'accent' as const,
          disabled: false,
          onPress: () => setConfirmPurchaseVisible(true),
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
    shortfall,
    t,
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

  const formatAmount = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  const renderBackButton = () => (
    <ShopPressable
      accessibilityLabel={t('commerce.accessibility.goBack')}
      haptic={false}
      hitSlop={10}
      onPress={() => backOrReplace(router, '/shop')}
      pressedStyle={styles.iconButtonPressed}
      style={styles.iconButton}
    >
      <ArrowLeftIcon size={20} color={theme.colors.text.primary} />
    </ShopPressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.topBar, insetPadding]}>{renderBackButton()}</View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('commerce.accessibility.loadingItem')}
          style={[styles.detailLoadingState, insetPadding]}
          testID="shop-item-loading-state"
        >
          <SkeletonLoader announce={false} style={styles.detailSkeletonHero} />
          <SkeletonLoader announce={false} style={styles.detailSkeletonTitle} />
          <SkeletonLoader announce={false} style={styles.detailSkeletonBody} />
          <ShopItemImpactSkeleton testID="shop-item-impact-skeleton" />
          <SkeletonLoader
            announce={false}
            style={styles.detailSkeletonSummary}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.topBar, insetPadding]}>{renderBackButton()}</View>
        <View style={[styles.centerState, insetPadding]}>
          <ShopMascotBubble
            message={loadError || t('commerce.shop.notCurrentItem')}
            state="calm-warning"
          />
          <Text accessibilityRole="header" style={styles.stateTitle}>
            {t('commerce.shop.itemUnavailable')}
          </Text>
          <AppButton
            title={t('commerce.action.tryAgain')}
            variant="outline"
            size="large"
            fullWidth
            onPress={() => void load()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const itemKindLabel = isPowerUp
    ? t('commerce.shop.categoryBoost')
    : t('commerce.shop.categoryStyle');
  const priceLabel = unlockDays
    ? t('commerce.shop.streak', { days: unlockDays })
    : cost > 0
      ? t('commerce.shop.spendBalance', { amount: formatAmount(cost) })
      : t('commerce.shop.free');
  // Styles stop showing a price once owned; consumables keep theirs because
  // the person can buy another.
  const summaryTrail: ShopItemCardTrail | null =
    purchased && !isPowerUp
      ? null
      : unlockDays && !purchased
        ? { kind: 'locked', label: priceLabel, reason: '' }
        : shortfall > 0
          ? { kind: 'short', label: formatAmount(cost), reason: '' }
          : {
              kind: 'price',
              label: cost > 0 ? formatAmount(cost) : t('commerce.shop.free'),
            };

  const hero = (
    <View style={[styles.hero, usesIPadWorkspace && styles.ipadHero]}>
      <View style={[styles.artStage, usesIPadWorkspace && styles.ipadArtStage]}>
        <View style={styles.artGlow} />
        <View>
          <ShopItemArt
            sku={sku}
            size={usesIPadWorkspace ? 184 : 136}
            locked={Boolean(unlockDays) && !purchased}
            muted={insufficient && !unlockDays}
            testID="shop-item-hero-art"
          />
          {isPowerUp && inventoryCount > 0 ? (
            <View style={styles.heroQuantity}>
              <Text style={styles.heroQuantityText}>
                {t('commerce.shop.quantity', {
                  count: formatAmount(inventoryCount),
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {displayName}
      </Text>
      {displayDescription ? (
        <Text style={styles.description}>{displayDescription}</Text>
      ) : null}
    </View>
  );

  const accountDetails = (
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
          <View
            accessible
            accessibilityRole="summary"
            accessibilityLabel={t('commerce.shop.detailSummaryAccessibility', {
              kind: itemKindLabel,
              name: displayName,
              status: primaryState,
              price:
                purchased || repeatConsumablePurchase
                  ? primaryState
                  : priceLabel,
            })}
            style={styles.accountSummary}
            testID="shop-account-summary"
          >
            <View style={styles.accountSummaryCopy}>
              <Text style={styles.accountSummaryLabel}>{itemKindLabel}</Text>
              <Text style={styles.accountSummaryValue}>{primaryState}</Text>
            </View>
            {summaryTrail ? <ShopTrailPill trail={summaryTrail} /> : null}
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
          />
        </ErrorBoundary>
      ) : null}
    </>
  );

  const actions = (
    <>
      {primaryAction ? (
        <AppButton
          title={
            working ? t('commerce.accessibility.checking') : primaryAction.title
          }
          variant={primaryAction.variant}
          size="large"
          haptic
          hapticIntent="selection"
          onPress={() => void primaryAction.onPress()}
          disabled={primaryAction.disabled || working}
          loading={working && !confirmPurchaseVisible}
          preserveLabelPositionOnLoading
          fullWidth
          testID="shop-item-primary-action"
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
        textStyle={styles.secondaryActionText}
        onPress={() => router.push(purchased ? '/inventory' : '/shop')}
        fullWidth
      />
    </>
  );

  const celebrationActions = (() => {
    if (!celebration) return null;
    const backToShop = {
      label: t('commerce.action.backToShop'),
      onPress: () => {
        setCelebration(null);
        backOrReplace(router, '/shop');
      },
    };
    if (celebration.next === 'choose-promise') {
      return {
        primary: {
          label: t('commerce.shop.choosePromise'),
          onPress: () => {
            setCelebration(null);
            setTargetSheetVisible(true);
            void fetchTargets();
          },
        },
        secondary: backToShop,
      };
    }
    if (celebration.next === 'use-style') {
      return {
        primary: {
          label: t('commerce.shop.useStyle'),
          onPress: () => {
            setCelebration(null);
            void handleEquip();
          },
        },
        secondary: backToShop,
      };
    }
    return {
      primary: backToShop,
      secondary: {
        label: t('commerce.action.openItems'),
        onPress: () => {
          setCelebration(null);
          router.push('/inventory');
        },
      },
    };
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.topBar, insetPadding]}>
        {renderBackButton()}
        {!accountLoading && !accountError ? (
          <MomentaBalanceChip
            balance={balance}
            onPress={() => router.push('/momenta')}
            testID="shop-item-balance-chip"
          />
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
            visual={<ErrorBoundary level="component">{hero}</ErrorBoundary>}
            details={accountDetails}
            actions={actions}
          />
        ) : (
          <>
            <ErrorBoundary level="component">{hero}</ErrorBoundary>
            {accountDetails}
          </>
        )}
      </ScrollView>

      {!usesIPadWorkspace ? (
        <View style={[styles.footer, insetPadding]}>{actions}</View>
      ) : null}

      <SimpleBottomSheet
        visible={confirmPurchaseVisible}
        onClose={() => {
          if (!working) setConfirmPurchaseVisible(false);
        }}
        dismissOnBackdrop={!working}
        maxHeight={620}
        testID="shop-confirm-purchase-sheet"
        scrollHint={t('commerce.shop.costScrollHint')}
        scrollableBody={
          <>
            <View style={styles.sheetHeader}>
              <ShopItemArt sku={sku} size={72} />
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

            <View style={styles.confirmReceipt}>
              <ShopReceiptCard
                facts={[
                  {
                    label: t('commerce.shop.currentBalance'),
                    value: t('commerce.shop.spendBalance', {
                      amount: formatAmount(balance),
                    }),
                  },
                  {
                    label: t('commerce.shop.spend'),
                    value: t('commerce.shop.spendBalance', {
                      amount: formatAmount(cost),
                    }),
                  },
                  {
                    label: t('commerce.shop.balanceAfter'),
                    value: t('commerce.shop.spendBalance', {
                      amount: formatAmount(Math.max(balance - cost, 0)),
                    }),
                    emphasis: true,
                  },
                ]}
                testID="shop-confirm-receipt"
              />
            </View>
          </>
        }
        footer={
          <>
            <AppButton
              title={
                working
                  ? t('commerce.shop.buying')
                  : t('commerce.shop.buyFor', {
                      amount: formatAmount(cost),
                    })
              }
              accessibilityLabel={t('commerce.shop.buyNamedFor', {
                name: displayName,
                amount: formatAmount(cost),
              })}
              disabled={working}
              fullWidth
              loading={working}
              preserveLabelPositionOnLoading
              onPress={() => void handlePurchase()}
              size="large"
              testID="shop-confirm-purchase"
              variant="accent"
            />

            <AppButton
              title={t('commerce.action.cancelPurchase')}
              variant="ghost"
              size="large"
              disabled={working}
              textStyle={styles.secondaryActionText}
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
                style={styles.sheetSkeletonList}
              >
                {[0, 1].map(index => (
                  <SkeletonLoader
                    key={index}
                    announce={false}
                    style={styles.sheetSkeletonRow}
                  />
                ))}
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
              <View style={styles.choiceList}>
                {targets.map(target => (
                  <ShopPressable
                    key={target.id}
                    disabled={working}
                    onPress={() => void applyPowerUp(target.id)}
                    pressedStyle={styles.choiceRowPressed}
                    style={styles.choiceRow}
                  >
                    <View style={styles.choiceIcon}>
                      <TargetIcon size={18} color={mentaColors.action} />
                    </View>
                    <View style={styles.choiceCopy}>
                      <Text style={styles.choiceTitle}>{target.title}</Text>
                      <Text style={styles.choiceMeta}>
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
                  </ShopPressable>
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
            <View style={styles.topUpHeader}>
              <Text style={styles.sheetTitle}>
                {t('commerce.shop.addMomenta', {
                  amount: formatAmount(shortfall),
                })}
              </Text>
              <ShopMascotBubble
                message={t('commerce.shop.topUpBubble', {
                  amount: formatAmount(shortfall),
                  name: displayName,
                })}
                state="momenta-gift"
                testID="shop-top-up-bubble"
              />
            </View>

            <View style={styles.choiceList}>
              <EarnOptionRow
                accessibilityLabel={t('commerce.shop.earnReviewAccessibility', {
                  amount: REVIEW_QUEUE_CLEAR_REWARD_AMOUNT,
                })}
                icon={<CheckCircleIcon size={18} color={mentaColors.action} />}
                title={t('commerce.wallet.earnReview')}
                meta={t('commerce.wallet.reviewMeta', {
                  amount: REVIEW_QUEUE_CLEAR_REWARD_AMOUNT,
                })}
                value={`+${REVIEW_QUEUE_CLEAR_REWARD_AMOUNT}`}
                onPress={() => {
                  setTopUpVisible(false);
                  router.push('/review-queue');
                }}
              />

              {canWatchSponsors ? (
                <EarnOptionRow
                  accessibilityLabel={
                    adReward && adReward > 0
                      ? t('commerce.shop.watchAdAccessibility', {
                          amount: adReward,
                        })
                      : t('commerce.shop.watchAdNoAmountAccessibility')
                  }
                  icon={<GiftIcon size={18} color={mentaColors.action} />}
                  title={t('commerce.wallet.watchAd')}
                  meta={t('commerce.wallet.dailyLimits')}
                  value={
                    adReward
                      ? t('commerce.shop.upTo', { amount: adReward })
                      : t('commerce.wallet.open')
                  }
                  onPress={() => {
                    setTopUpVisible(false);
                    setPaywallVisible(true);
                  }}
                />
              ) : null}

              {canBuyCredits ? (
                <EarnOptionRow
                  accessibilityLabel={
                    creditPurchaseReady
                      ? t('commerce.shop.buyPackAccessibility', {
                          amount: formatAmount(creditTotal),
                          price: creditPrice || '',
                        })
                      : t('commerce.shop.buyPackChecking')
                  }
                  disabled={!creditPurchaseReady || creditLoading}
                  icon={<CoinsIcon size={18} color={mentaColors.action} />}
                  title={t('commerce.wallet.buyPack')}
                  meta={
                    creditPurchaseReady
                      ? t('commerce.shop.spendBalance', {
                          amount: formatAmount(creditTotal),
                        })
                      : t('commerce.wallet.checkingPrice')
                  }
                  value={
                    creditLoading || creditPriceLoading
                      ? t('commerce.accessibility.checking')
                      : creditPrice || t('commerce.wallet.unavailable')
                  }
                  onPress={() => void handleCreditPurchase()}
                />
              ) : null}
            </View>
          </>
        }
        footer={
          <View style={styles.sheetActions}>
            <AppButton
              title={t('commerce.action.seeWaysToEarn')}
              variant="accent"
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
              textStyle={styles.secondaryActionText}
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

      {celebration && celebrationActions ? (
        <ShopPurchaseCelebration
          visible
          sku={celebration.sku}
          title={celebration.title}
          detail={celebration.detail}
          gainLabel={celebration.gainLabel}
          facts={celebration.facts}
          primaryAction={celebrationActions.primary}
          secondaryAction={celebrationActions.secondary}
          onClose={() => setCelebration(null)}
        />
      ) : null}

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

function EarnOptionRow({
  accessibilityLabel,
  disabled = false,
  icon,
  meta,
  onPress,
  title,
  value,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: React.ReactNode;
  meta: string;
  onPress: () => void;
  title: string;
  value: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <ShopPressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      pressedStyle={styles.choiceRowPressed}
      style={[styles.choiceRow, disabled && styles.disabledRow]}
    >
      <View style={styles.choiceIcon}>{icon}</View>
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceMeta}>{meta}</Text>
      </View>
      <Text style={styles.choiceValue}>{value}</Text>
    </ShopPressable>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    topBar: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: mentaSpacing[6],
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
    },
    content: {
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[2],
      paddingBottom: mentaSpacing[8],
      gap: mentaSpacing[5],
    },
    ipadContent: {
      paddingBottom: mentaSpacing[8],
      paddingHorizontal: mentaSpacing[8],
      paddingTop: mentaSpacing[8],
    },
    hero: {
      gap: mentaSpacing[3],
    },
    ipadHero: {
      gap: mentaSpacing[4],
    },
    artStage: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: mentaSpacing[2],
      minHeight: 216,
      width: '100%',
    },
    ipadArtStage: {
      minHeight: 380,
    },
    artGlow: {
      backgroundColor: mentaColors.actionSoft,
      borderRadius: mentaRadii.round,
      height: 200,
      position: 'absolute',
      width: 200,
    },
    heroQuantity: {
      backgroundColor: mentaColors.action,
      borderColor: theme.colors.background.primary,
      borderRadius: mentaRadii.round,
      borderWidth: 3,
      paddingHorizontal: mentaSpacing[3],
      paddingVertical: 2,
      position: 'absolute',
      right: -mentaSpacing[3],
      top: -mentaSpacing[3],
    },
    heroQuantityText: {
      color: mentaColors.canvas,
      ...mentaTypography.bodySemibold,
      fontVariant: ['tabular-nums'],
    },
    title: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    description: {
      color: theme.colors.text.secondary,
      ...mentaTypography.lead,
    },
    accountSummary: {
      alignItems: 'center',
      backgroundColor: mentaColors.surface,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      flexDirection: 'row',
      gap: mentaSpacing[4],
      justifyContent: 'space-between',
      marginBottom: mentaSpacing[4],
      minHeight: 72,
      paddingHorizontal: mentaSpacing[4],
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
      ...mentaTypography.bodySemibold,
    },
    footer: {
      gap: mentaSpacing[1],
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[3],
      paddingBottom: mentaSpacing[4],
      backgroundColor: theme.colors.background.primary,
    },
    secondaryActionText: {
      color: mentaColors.action,
    },
    centerState: {
      flex: 1,
      gap: mentaSpacing[5],
      justifyContent: 'center',
      paddingHorizontal: mentaSpacing[6],
    },
    detailLoadingState: {
      flex: 1,
      gap: mentaSpacing[3],
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[2],
    },
    detailSkeletonHero: {
      alignSelf: 'center',
      width: 136,
      height: 136,
      marginVertical: mentaSpacing[10],
      borderRadius: mentaRadii.large * 2,
    },
    detailSkeletonTitle: {
      width: '64%',
      height: 34,
      borderRadius: mentaRadii.small,
    },
    detailSkeletonBody: {
      width: '88%',
      height: 18,
      borderRadius: mentaRadii.small,
    },
    detailSkeletonSummary: {
      width: '100%',
      height: 72,
      borderRadius: mentaRadii.large,
    },
    stateTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    sheetHeader: {
      alignItems: 'center',
      gap: mentaSpacing[2],
      paddingBottom: mentaSpacing[4],
    },
    topUpHeader: {
      gap: mentaSpacing[4],
      paddingBottom: mentaSpacing[4],
    },
    confirmReceipt: {
      marginBottom: mentaSpacing[4],
      marginTop: mentaSpacing[4],
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
      gap: mentaSpacing[3],
    },
    sheetSkeletonList: {
      gap: mentaSpacing[2],
      width: '100%',
    },
    sheetSkeletonRow: {
      borderRadius: mentaRadii.large,
      height: 76,
      width: '100%',
    },
    choiceList: {
      gap: mentaSpacing[2],
    },
    choiceRow: {
      alignItems: 'center',
      backgroundColor: mentaColors.surface,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      flexDirection: 'row',
      gap: mentaSpacing[3],
      minHeight: 76,
      paddingHorizontal: mentaSpacing[4],
      paddingVertical: mentaSpacing[3],
    },
    choiceRowPressed: {
      backgroundColor: mentaColors.actionSoft,
      borderColor: mentaColors.actionBorder,
    },
    choiceIcon: {
      alignItems: 'center',
      backgroundColor: mentaColors.actionSoft,
      borderRadius: mentaRadii.small,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    choiceCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    choiceTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
    },
    choiceMeta: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    choiceValue: {
      color: mentaColors.action,
      ...mentaTypography.bodySemibold,
      flexShrink: 0,
      fontVariant: ['tabular-nums'],
      maxWidth: 120,
      textAlign: 'right',
    },
    sheetActions: {
      paddingTop: mentaSpacing[3],
      gap: mentaSpacing[1],
    },
    disabledRow: {
      opacity: 0.46,
    },
  });
