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

import TransactionHistory from '@/components/momenta/TransactionHistory';
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
import PaywallModal from '@/components/paywall/PaywallModal';
import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppShell';
import SimpleBottomSheet from '@/components/ui/SimpleBottomSheet';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CoinsIcon,
  GiftIcon,
  PlusIcon,
  RefreshCcwIcon,
  ShoppingBagIcon,
  UserPlusIcon,
} from '@/components/ui/icons';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useOperationalFlag } from '@/hooks/useOperationalFlag';
import {
  areVerifiedAdRewardsEnabled,
  isAdUnavailableReason,
  showRewardedAdDetailed,
} from '@/lib/ads';
import {
  getCommerceNotice,
  getStorePurchaseState,
  isOfflineCommerceError,
} from '@/lib/commerce/commerce-state';
import { useAdRewardAmount } from '@/lib/hooks/useAdReward';
import { getApprovedCreditSkus } from '@/lib/product-config';
import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  REVENUECAT_SUPPORTED,
  RevenueCatAPI,
  purchaseCredits,
} from '@/lib/paywall/revenuecat';
import {
  getWalletBalanceNote,
  getWalletEarnSheetCopy,
  getWalletEmptyActivityCopy,
} from '@/lib/momenta/wallet-copy';
import { REVIEW_QUEUE_CLEAR_REWARD_AMOUNT } from '@/lib/review-rewards';
import {
  addBreadcrumb as sentryBreadcrumb,
  captureError as sentryCapture,
} from '@/lib/sentry';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/localization/use-translation';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { useMomentaStore } from '@/store/momenta-store';
import {
  useReferralStore,
  type ReferralProgramStatus,
} from '@/store/referral-store';
import { trackProductOperation } from '@/lib/posthog';

type RevenueCatPackage = {
  identifier?: string | null;
  packageType?: string | null;
  product?: {
    priceString?: string | null;
  } | null;
};

type NoticeSheet = MomentaActionNotice | null;

type Localise = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const getAdRewardCheckingNotice = (
  localise: Localise
): MomentaActionNotice => ({
  kind: 'progress',
  source: 'ad-reward',
  title: localise('commerce.wallet.rewardCheckingTitle'),
  message: localise('commerce.wallet.rewardCheckingDetail'),
});

const getAdRewardMissingNotice = (localise: Localise): MomentaActionNotice => ({
  kind: 'error',
  source: 'ad-reward',
  title: localise('commerce.wallet.rewardMissingTitle'),
  message: localise('commerce.wallet.rewardMissingDetail'),
  refreshActionTitle: localise('commerce.wallet.refreshBalanceAction'),
});

const getAdRewardDailyLimitNotice = (
  localise: Localise
): MomentaActionNotice => ({
  kind: 'info',
  source: 'ad-reward',
  title: localise('commerce.wallet.rewardDailyLimitTitle'),
  message: localise('commerce.wallet.rewardDailyLimitDetail'),
});

type ReferralProgrammeState =
  | { kind: 'checking' }
  | { kind: 'ready'; status: ReferralProgramStatus }
  | { kind: 'unavailable' };

const getReferralProgrammeRowCopy = (
  state: ReferralProgrammeState,
  locale: string,
  t: Localise
) => {
  if (state.kind === 'checking') {
    return {
      meta: t('commerce.wallet.checkingInviteRewards'),
      value: t('commerce.wallet.checking'),
    };
  }

  if (state.kind === 'unavailable') {
    return {
      meta: t('commerce.wallet.inviteUnavailable'),
      value: t('commerce.wallet.inviteValue'),
    };
  }

  if (!state.status.programmeEnabled) {
    return {
      meta: t('commerce.wallet.referralsPaused'),
      value: t('commerce.wallet.paused'),
    };
  }

  if (state.status.inviterRewardsThisYear >= state.status.inviterAnnualCap) {
    return {
      meta: t('commerce.wallet.inviteCap', {
        cap: new Intl.NumberFormat(locale).format(
          state.status.inviterAnnualCap
        ),
      }),
      value: `${state.status.inviterRewardsThisYear}/${state.status.inviterAnnualCap}`,
    };
  }

  return {
    meta: t('commerce.wallet.inviteEarn', {
      amount: new Intl.NumberFormat(locale).format(state.status.rewardAmount),
    }),
    value: `${state.status.inviterRewardsThisYear}/${state.status.inviterAnnualCap}`,
  };
};

const CREDIT_PACK = {
  credits: 1000,
  bonus: 200,
};

export default function WalletScreen() {
  const selectSection = useMomentaSectionNavigation();
  const inPrimaryTab = useMomentaPrimaryTab();
  const sectionActive = useMomentaSectionIsActive('wallet');
  const sectionLoadedRef = useRef(false);
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useTranslation();
  const { user } = useAuthStore();
  const {
    balance,
    claimAdReward,
    syncWithBackend,
    transactionHistoryError,
    transactions,
  } = useMomentaStore();
  const getReferralProgramStatus = useReferralStore(
    state => state.getReferralProgramStatus
  );
  const adReward = useAdRewardAmount();
  const { enabled: adsEnabled } = useOperationalFlag('ads_enabled');
  const { enabled: safeMode } = useOperationalFlag('safe_mode');
  const canWatchSponsors =
    adsEnabled && !safeMode && areVerifiedAdRewardsEnabled();
  const approvedCreditSkus = getApprovedCreditSkus();

  const [loading, setLoading] = useState(true);
  const [hasConfirmedWallet, setHasConfirmedWallet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [creditPrice, setCreditPrice] = useState<string | null>(null);
  const [creditPriceLoading, setCreditPriceLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [noticeRefreshing, setNoticeRefreshing] = useState(false);
  const [notice, setNotice] = useState<NoticeSheet>(null);
  const [referralProgramme, setReferralProgramme] =
    useState<ReferralProgrammeState>({ kind: 'checking' });
  const referralRequestRef = useRef(0);
  const adFlowInFlightRef = useRef(false);
  const noticeRefreshInFlightRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  currentUserIdRef.current = user?.id ?? null;

  const approvedCreditSkuSet = useMemo(
    () => new Set(approvedCreditSkus),
    [approvedCreditSkus]
  );

  const canBuyCredits =
    REVENUECAT_SUPPORTED &&
    (approvedCreditSkuSet.has('credits_large') ||
      approvedCreditSkuSet.has('com.anekedigitalapps.lockedin.credits_large'));

  const creditTotal = CREDIT_PACK.credits + CREDIT_PACK.bonus;
  const creditPurchaseReady = canBuyCredits && Boolean(creditPrice);

  const showNotice = useCallback((nextNotice: MomentaActionNotice) => {
    setTopUpVisible(false);
    setPaywallVisible(false);
    setNotice(nextNotice);
  }, []);

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
        setLoadError(null);
      } else {
        setRefreshError(null);
      }
      try {
        if (user?.id) {
          await syncWithBackend(user.id);
          const currentWalletSyncError =
            useMomentaStore.getState().walletSyncError;
          if (currentWalletSyncError) throw new Error(currentWalletSyncError);
        }
        setHasConfirmedWallet(true);
        setLoadError(null);
        setRefreshError(null);
        return true;
      } catch (error) {
        console.error('[Momenta] Wallet load failed', error);
        const feedback = getCommerceNotice(
          isOfflineCommerceError(error) ? 'offline' : 'fetch-error',
          undefined,
          t
        );
        const message = feedback.message;
        if (showLoading) {
          setLoadError(message);
        } else {
          setRefreshError(message);
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [syncWithBackend, t, user?.id]
  );

  useEffect(() => {
    setHasConfirmedWallet(false);
    referralRequestRef.current += 1;
    setReferralProgramme({ kind: 'checking' });
  }, [user?.id]);

  useEffect(() => {
    if (!sectionActive) return;
    void load(!sectionLoadedRef.current);
    sectionLoadedRef.current = true;
  }, [load, sectionActive]);

  const handleNoticeRefresh = useCallback(async () => {
    if (noticeRefreshInFlightRef.current) return;

    noticeRefreshInFlightRef.current = true;
    setNoticeRefreshing(true);
    try {
      const refreshed = await load(false);
      if (refreshed) {
        setNotice({
          kind: 'success',
          title: t('commerce.wallet.updated'),
          message: t('commerce.wallet.updatedDetail'),
        });
      } else {
        setNotice(
          notice?.source === 'ad-reward'
            ? getAdRewardMissingNotice(t)
            : {
                kind: 'error',
                title: t('commerce.wallet.refreshFailed'),
                message: t('commerce.wallet.tryAgainMoment'),
                refreshActionTitle: t('commerce.action.tryAgain'),
              }
        );
      }
    } finally {
      noticeRefreshInFlightRef.current = false;
      setNoticeRefreshing(false);
    }
  }, [load, notice?.source, t]);

  useEffect(() => {
    if (!canBuyCredits) {
      setCreditPrice(null);
      setCreditPriceLoading(false);
      return;
    }

    let mounted = true;
    setCreditPriceLoading(true);
    (async () => {
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
        console.error('[Momenta] Credit price load failed', error);
        if (mounted) setCreditPrice(null);
      } finally {
        if (mounted) setCreditPriceLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [canBuyCredits]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(false);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const loadReferralProgramme = useCallback(async () => {
    const accountId = user?.id ?? null;
    const requestId = ++referralRequestRef.current;
    setReferralProgramme({ kind: 'checking' });

    if (!accountId) {
      setReferralProgramme({ kind: 'unavailable' });
      return;
    }

    try {
      const status = await getReferralProgramStatus();
      if (
        requestId !== referralRequestRef.current ||
        currentUserIdRef.current !== accountId
      ) {
        return;
      }
      setReferralProgramme({ kind: 'ready', status });
    } catch {
      if (
        requestId === referralRequestRef.current &&
        currentUserIdRef.current === accountId
      ) {
        setReferralProgramme({ kind: 'unavailable' });
      }
    }
  }, [getReferralProgramStatus, user?.id]);

  useEffect(() => {
    if (sectionActive && hasConfirmedWallet && balance === 0) {
      void loadReferralProgramme();
    }
  }, [balance, hasConfirmedWallet, loadReferralProgramme, sectionActive]);

  const openEarningOptions = useCallback(() => {
    if (adFlowInFlightRef.current) {
      setNotice(getAdRewardCheckingNotice(t));
      return;
    }
    setNotice(null);
    setTopUpVisible(true);
    void loadReferralProgramme();
  }, [loadReferralProgramme, t]);

  const handleWatchAd = useCallback(async () => {
    if (!canWatchSponsors) {
      return { earned: false, amount: 0, reason: 'error' as const };
    }
    if (adFlowInFlightRef.current)
      return { earned: false, amount: 0, reason: 'error' as const };
    if (!user?.id) {
      trackProductOperation({
        area: 'momenta',
        authority: 'client',
        operation: 'earn_momenta',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'shop',
      });
      showNotice({
        kind: 'error',
        title: t('commerce.wallet.logInFirst'),
        message: t('commerce.wallet.logInToEarn'),
      });
      return { earned: false, amount: 0, reason: 'error' as const };
    }

    adFlowInFlightRef.current = true;
    trackProductOperation({
      area: 'momenta',
      authority: 'provider',
      operation: 'earn_momenta',
      outcome: 'started',
      phase: 'intent',
      source: 'shop',
    });
    setAdLoading(true);
    let sponsorRewardEarned = false;
    try {
      sentryBreadcrumb('watch_ad_cta_pressed', { screen: 'momenta_wallet' });
      const result = await showRewardedAdDetailed({
        appUserId: user?.id ?? '',
        placement: 'wallet',
      });
      if (!result?.earned) {
        if (
          result?.reason === 'reward_pending' ||
          result?.reason === 'verification_failed'
        ) {
          showNotice(getAdRewardMissingNotice(t));
          return result;
        }
        trackProductOperation({
          area: 'momenta',
          authority: 'provider',
          operation: 'earn_momenta',
          outcome: 'ineligible',
          phase: 'eligibility',
          source: 'shop',
        });
        showNotice({
          kind: 'info',
          title: isAdUnavailableReason(result?.reason)
            ? t('commerce.wallet.noAd')
            : t('commerce.wallet.noReward'),
          message: isAdUnavailableReason(result?.reason)
            ? t('commerce.wallet.tryAgainLater')
            : t('commerce.wallet.watchFullAd'),
        });
        return result || { earned: false, amount: 0, reason: 'error' as const };
      }

      sponsorRewardEarned = true;
      showNotice(getAdRewardCheckingNotice(t));
      const claim = await claimAdReward(result.clientTransactionId);
      if (!claim.earned) {
        trackProductOperation({
          area: 'momenta',
          authority: 'server',
          operation: 'earn_momenta',
          outcome:
            claim.reason === 'daily-limit' || claim.reason === 'cooldown'
              ? 'ineligible'
              : 'unknown',
          phase:
            claim.reason === 'daily-limit' || claim.reason === 'cooldown'
              ? 'eligibility'
              : 'reconciliation',
          source: 'shop',
        });
        if (claim.reason === 'daily-limit') {
          showNotice(getAdRewardDailyLimitNotice(t));
        } else if (claim.reason === 'cooldown') {
          showNotice({
            kind: 'info',
            title: t('commerce.wallet.cooldown'),
            message: claim.message || t('commerce.wallet.refreshBeforeAd'),
          });
        } else if (claim.reason === 'in-progress') {
          showNotice(getAdRewardCheckingNotice(t));
        } else {
          showNotice(getAdRewardMissingNotice(t));
        }
        return { earned: false, amount: 0, reason: 'error' as const };
      }

      showNotice({
        kind: 'success',
        title: t('commerce.wallet.rewardAdded'),
        message: t('commerce.wallet.addedToBalance', {
          amount: new Intl.NumberFormat(locale).format(claim.amount),
        }),
        facts: [
          {
            label: t('brand.currency'),
            value: `+${claim.amount.toLocaleString()}`,
          },
          {
            label: t('commerce.wallet.status'),
            value: t('commerce.wallet.added'),
          },
        ],
      });
      trackProductOperation({
        area: 'momenta',
        authority: 'server',
        operation: 'earn_momenta',
        outcome: 'confirmed',
        phase: 'authority',
        source: 'shop',
      });
      return { earned: true, amount: claim.amount, type: result.type };
    } catch (error) {
      trackProductOperation({
        area: 'momenta',
        authority: sponsorRewardEarned ? 'server' : 'provider',
        operation: 'earn_momenta',
        outcome: sponsorRewardEarned ? 'unknown' : 'failed',
        phase: sponsorRewardEarned ? 'reconciliation' : 'authority',
        source: 'shop',
      });
      console.error('[Momenta] Rewarded ad failed', error);
      sentryCapture(error as Error, { context: 'momenta_wallet_ad' });
      showNotice(
        sponsorRewardEarned
          ? getAdRewardMissingNotice(t)
          : {
              kind: 'error',
              title: t('commerce.wallet.adUnavailable'),
              message: t('commerce.wallet.noAdNow'),
            }
      );
      return { earned: false, amount: 0, reason: 'error' as const };
    } finally {
      adFlowInFlightRef.current = false;
      setAdLoading(false);
    }
  }, [canWatchSponsors, claimAdReward, locale, showNotice, t, user?.id]);

  const handleCreditPurchase = useCallback(async () => {
    if (creditLoading) return;
    if (!creditPurchaseReady) {
      setPaywallVisible(true);
      return;
    }

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
        showNotice(getCommerceNotice(state, undefined, t));
      } else if (state === 'cancelled') {
        showNotice(getCommerceNotice(state, undefined, t));
      } else {
        const notice = getCommerceNotice(state, undefined, t);
        showNotice({
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
      console.error('[Momenta] Credit purchase failed', error);
      showNotice(
        getCommerceNotice(
          isOfflineCommerceError(error) ? 'unknown-result' : 'failed',
          undefined,
          t
        )
      );
    } finally {
      setCreditLoading(false);
    }
  }, [creditLoading, creditPurchaseReady, showNotice, t]);

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
          <Text accessibilityRole="header" style={styles.title}>
            {t('commerce.wallet.title')}
          </Text>
          <MomentaSectionNav active="wallet" />
        </View>

        <View style={styles.balanceBlock}>
          {loading ? (
            <WalletBalanceSkeleton />
          ) : !hasConfirmedWallet ? (
            <View style={styles.balanceUnavailable}>
              <Text style={styles.balanceLabel}>
                {t('commerce.wallet.balance')}
              </Text>
              <Text style={styles.balanceUnavailableTitle}>
                {t('commerce.wallet.balanceUnavailable')}
              </Text>
              <Text style={styles.balanceNote}>
                {t('commerce.wallet.balanceUnavailableDetail')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.balanceLabel}>
                {t('commerce.wallet.balance')}
              </Text>
              <View
                accessible
                accessibilityLabel={t('commerce.wallet.balanceAccessibility', {
                  balance: balance.toLocaleString(),
                })}
                style={styles.balanceValueRow}
              >
                <Text style={styles.balanceValue}>
                  {balance.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.balanceNote}>{getWalletBalanceNote(t)}</Text>
            </>
          )}
        </View>

        {loadError || refreshError ? (
          <WalletWarningPanel
            title={
              loadError
                ? t('commerce.wallet.refreshBalance')
                : t('commerce.wallet.refreshDidNotFinish')
            }
            message={
              loadError || refreshError || t('commerce.wallet.refreshFallback')
            }
            onRetry={() => void load(true)}
            hasConfirmedSnapshot={hasConfirmedWallet}
          />
        ) : null}

        {hasConfirmedWallet &&
        balance === 0 &&
        referralProgramme.kind === 'ready' &&
        referralProgramme.status.programmeEnabled &&
        referralProgramme.status.inviterRewardsThisYear <
          referralProgramme.status.inviterAnnualCap ? (
          <TopUpOptionRow
            icon={
              <UserPlusIcon size={20} color={theme.colors.accent.primary} />
            }
            title={t('fullAuth.tabs_profile.invite_friends')}
            meta={
              getReferralProgrammeRowCopy(referralProgramme, locale, t).meta
            }
            value={`+${referralProgramme.status.rewardAmount}`}
            onPress={() => router.push('/share-invite')}
            showDivider={false}
          />
        ) : null}
        <View style={styles.actionGrid}>
          <AppButton
            title={t('commerce.wallet.earn')}
            variant="primary"
            size="large"
            icon={<PlusIcon size={17} color={theme.colors.text.inverse} />}
            onPress={openEarningOptions}
            fullWidth
          />
          <AppButton
            title={t('commerce.wallet.openShop')}
            variant="outline"
            size="large"
            icon={
              <ShoppingBagIcon size={17} color={theme.colors.text.primary} />
            }
            onPress={() => selectSection('shop')}
            fullWidth
          />
        </View>

        {hasConfirmedWallet &&
        !loading &&
        transactions.length === 0 &&
        !transactionHistoryError ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.activityTitle}>
              {getWalletEmptyActivityCopy(t).title}
            </Text>
            <Text style={styles.activityEmptyText}>
              {getWalletEmptyActivityCopy(t).detail}
            </Text>
          </View>
        ) : hasConfirmedWallet ? (
          <TransactionHistory
            transactions={transactions}
            error={transactionHistoryError}
            loading={loading}
            onRefresh={handleRefresh}
            limit={3}
            title={t('commerce.wallet.recentActivity')}
            subtitle={null}
            showRefresh={false}
          />
        ) : null}
      </ScrollView>

      <SimpleBottomSheet
        visible={topUpVisible && !notice && !paywallVisible}
        onClose={() => {
          if (!adFlowInFlightRef.current) setTopUpVisible(false);
        }}
        dismissOnBackdrop={!adLoading}
        testID="momenta-top-up-sheet"
        scrollableBody={
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>
              {getWalletEarnSheetCopy(t).title}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {getWalletEarnSheetCopy(t).subtitle}
            </Text>

            <View style={styles.topUpList}>
              <TopUpOptionRow
                icon={
                  <UserPlusIcon size={18} color={theme.colors.text.secondary} />
                }
                title={t('commerce.wallet.invite')}
                meta={
                  getReferralProgrammeRowCopy(referralProgramme, locale, t).meta
                }
                value={
                  getReferralProgrammeRowCopy(referralProgramme, locale, t)
                    .value
                }
                onPress={() => {
                  setTopUpVisible(false);
                  router.push('/share-invite');
                }}
              />
              <TopUpOptionRow
                icon={
                  <CheckCircleIcon
                    size={18}
                    color={theme.colors.text.secondary}
                  />
                }
                title={t('commerce.wallet.earnReview')}
                meta={t('commerce.wallet.reviewMeta', {
                  amount: REVIEW_QUEUE_CLEAR_REWARD_AMOUNT,
                })}
                value={`+${REVIEW_QUEUE_CLEAR_REWARD_AMOUNT}`}
                onPress={() => {
                  setTopUpVisible(false);
                  router.push('/review-queue');
                }}
                showDivider={canWatchSponsors || canBuyCredits}
              />
              {canWatchSponsors ? (
                <TopUpOptionRow
                  icon={
                    <GiftIcon size={18} color={theme.colors.text.secondary} />
                  }
                  title={t('commerce.wallet.watchAd')}
                  meta={t('commerce.wallet.dailyLimits')}
                  value={adReward ? `+${adReward}` : t('commerce.wallet.open')}
                  loading={adLoading}
                  disabled={adLoading}
                  onPress={() => void handleWatchAd()}
                  showDivider={canBuyCredits}
                />
              ) : null}
              {canBuyCredits ? (
                <TopUpOptionRow
                  icon={
                    <CoinsIcon size={18} color={theme.colors.text.secondary} />
                  }
                  title={t('commerce.wallet.buyPack')}
                  meta={
                    creditPurchaseReady
                      ? `${creditTotal.toLocaleString()} Momenta`
                      : t('commerce.wallet.checkingPrice')
                  }
                  value={
                    creditPriceLoading
                      ? t('commerce.wallet.checking')
                      : creditPrice || t('commerce.wallet.unavailable')
                  }
                  loading={creditLoading || creditPriceLoading}
                  disabled={!creditPurchaseReady || creditLoading}
                  onPress={handleCreditPurchase}
                  showDivider={false}
                />
              ) : null}
            </View>
          </View>
        }
        footer={
          <View style={styles.sheetActions}>
            <AppButton
              title={t('commerce.wallet.viewPro')}
              variant="ghost"
              size="large"
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
        visible={Boolean(notice)}
        notice={notice}
        onClose={() => {
          if (!noticeRefreshInFlightRef.current) setNotice(null);
        }}
        onRefresh={() => void handleNoticeRefresh()}
        refreshing={noticeRefreshing}
        testID="momenta-notice-sheet"
      />

      <PaywallModal
        visible={paywallVisible && !notice && !topUpVisible}
        onClose={() => setPaywallVisible(false)}
        onBuyPro={() => setPaywallVisible(false)}
        onBuyCredits={() => setPaywallVisible(false)}
        onWatchAd={canWatchSponsors ? handleWatchAd : undefined}
        context="general"
        adRewardAmount={adReward}
      />
    </AppScreen>
  );
}

function WalletBalanceSkeleton() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  return (
    <View
      style={styles.walletBalanceSkeleton}
      accessibilityRole="progressbar"
      accessibilityLabel={t('commerce.accessibility.loadingWallet')}
    >
      <Text style={styles.balanceUnavailableTitle}>
        {t('commerce.wallet.refreshing')}
      </Text>
      <Text style={styles.balanceNote}>
        {t('commerce.wallet.loadingDetails')}
      </Text>
      <SkeletonLoader announce={false} style={styles.skeletonLabel} />
      <SkeletonLoader announce={false} style={styles.skeletonBalanceValue} />
      <SkeletonLoader announce={false} style={styles.skeletonBalanceUnit} />
    </View>
  );
}

function WalletWarningPanel({
  hasConfirmedSnapshot,
  message,
  onRetry,
  title,
}: {
  hasConfirmedSnapshot: boolean;
  message: string;
  onRetry: () => void;
  title: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.warningPanel}>
      <View style={styles.warningIcon}>
        <AlertTriangleIcon size={18} color={theme.colors.status.warning} />
      </View>
      <Text style={styles.warningTitle}>{title}</Text>
      <Text style={styles.warningText}>
        {message}{' '}
        {hasConfirmedSnapshot
          ? t('commerce.wallet.lastBalance')
          : t('commerce.wallet.noBalance')}
      </Text>
      <AppButton
        title={t('commerce.action.tryAgain')}
        variant="secondary"
        size="large"
        icon={<RefreshCcwIcon size={16} color={theme.colors.text.primary} />}
        onPress={onRetry}
        fullWidth
      />
    </View>
  );
}

function TopUpOptionRow({
  disabled = false,
  icon,
  loading = false,
  meta,
  onPress,
  showDivider = true,
  title,
  value,
}: {
  disabled?: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  meta: string;
  onPress: () => void;
  showDivider?: boolean;
  title: string;
  value: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${meta}. ${value}.`}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.topUpOption,
        showDivider && styles.topUpOptionDivider,
        disabled && styles.disabledRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topUpOptionIcon}>{icon}</View>
      <View style={styles.topUpOptionCopy}>
        <Text style={styles.topUpOptionTitle}>{title}</Text>
        <Text style={styles.topUpOptionMeta}>{meta}</Text>
      </View>
      {loading ? (
        <Text style={styles.topUpOptionValue}>
          {t('commerce.accessibility.checking')}
        </Text>
      ) : (
        <Text style={styles.topUpOptionValue}>{value}</Text>
      )}
      <ChevronRightIcon size={17} color={theme.colors.text.tertiary} />
    </Pressable>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingTop: mentaSpacing[3],
      paddingBottom: mentaSpacing[1],
      backgroundColor: theme.colors.background.primary,
    },
    iconButton: {
      width: 46,
      height: 46,
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
      paddingTop: mentaSpacing[5],
      paddingBottom: mentaSpacing[12],
      gap: mentaSpacing[8],
    },
    intro: {
      gap: mentaSpacing[3],
    },
    title: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    balanceBlock: {
      minHeight: 148,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      paddingVertical: mentaSpacing[4],
    },
    balanceUnavailable: {
      flex: 1,
      gap: 12,
    },
    balanceUnavailableTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.journeyTitle,
    },
    walletBalanceSkeleton: {
      gap: 12,
      alignItems: 'flex-start',
    },
    skeletonLabel: {
      width: 92,
      height: 14,
    },
    skeletonBalanceValue: {
      width: 188,
      height: 62,
      borderRadius: mentaRadii.large,
    },
    skeletonBalanceUnit: {
      width: 132,
      height: 18,
    },
    balanceLabel: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.labelBold,
    },
    balanceValueRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: 12,
      marginTop: 10,
    },
    balanceValue: {
      color: theme.colors.text.primary,
      ...mentaTypography.display,
    },
    balanceNote: {
      color: theme.colors.text.secondary,
      ...mentaTypography.caption,
      marginTop: 14,
    },
    emptyActivity: {
      gap: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      paddingVertical: mentaSpacing[5],
    },
    activityTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
    },
    activityEmptyText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    actionGrid: {
      gap: 10,
    },
    warningPanel: {
      gap: mentaSpacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.status.warning,
      paddingVertical: mentaSpacing[5],
    },
    warningIcon: {
      width: 34,
      height: 34,
      borderRadius: mentaRadii.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mentaColors.warningSoft,
    },
    warningTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
    },
    warningText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    sheetContent: {
      alignItems: 'center',
      gap: 14,
      paddingBottom: 6,
    },
    sheetTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
      textAlign: 'center',
    },
    sheetSubtitle: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
      textAlign: 'center',
    },
    topUpList: {
      width: '100%',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    topUpOption: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    topUpOptionDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    disabledRow: {
      opacity: 0.56,
    },
    topUpOptionIcon: {
      width: 30,
      alignItems: 'flex-start',
    },
    topUpOptionCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    topUpOptionTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
    },
    topUpOptionMeta: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    topUpOptionValue: {
      minWidth: 42,
      color: mentaColors.action,
      ...mentaTypography.bodySemibold,
      textAlign: 'right',
    },
    packRow: {
      width: '100%',
      minHeight: 116,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      borderRadius: mentaRadii.small,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 14,
      backgroundColor: theme.colors.background.secondary,
    },
    packAmount: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
      fontVariant: ['tabular-nums'],
    },
    packLabel: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      marginTop: 4,
    },
    packPrice: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.base,
      marginTop: 8,
    },
    sheetActions: {
      width: '100%',
      gap: 10,
      paddingTop: 4,
    },
  });
