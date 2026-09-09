import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {
  useThemedStyles,
  useTheme,
  ThemeContextType,
} from '@/constants/ThemeContext';
import { DEFAULT_AD_REWARD } from '@/lib/hooks/useAdReward';
import { isAdUnavailableReason, type RewardAdResult } from '@/lib/ads';
import { useOperationalFlag } from '@/hooks/useOperationalFlag';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { showToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { withReadableLeading } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  REVENUECAT_SUPPORTED,
  purchasePlan,
  restorePurchases,
  RevenueCatAPI,
} from '@/lib/paywall/revenuecat';
import { XIcon } from '@/components/ui/icons';
import { MentaMascot } from '@/components/ui/MentaMascot';
import {
  addBreadcrumb as sentryBreadcrumb,
  captureError as sentryCapture,
} from '@/lib/sentry';
import { APP_PRIVACY_URL, APP_TERMS_URL } from '@/constants/LegalLinks';
import { getQuotaLimitCopy } from '@/lib/paywall/pro-copy';
import { CommerceReceiptRows } from '@/components/commerce/CommerceReceiptRows';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { getPaywallAnalyticsPlacement } from '@/lib/product-analytics';
import { trackProductEvent } from '@/lib/posthog';
import { setAmplitudeSessionReplayHold } from '@/lib/amplitude';
import { useTranslation } from '@/lib/localization/use-translation';

import {
  ProOfferJourney,
  type ProOffer,
} from '@/components/paywall/pro-offer-journey';
import { usePaywallAllowed } from '@/lib/paywall/use-paywall-allowed';
import { useAuthStore } from '@/store/auth-store';

export type PaywallVariant = 'default' | 'insufficient' | 'quota';

type PaywallStage =
  | 'plans'
  | 'opening-store'
  | 'checking-access'
  | 'pro-active'
  | 'access-delayed'
  | 'cancelled'
  | 'purchase-failed'
  | 'restoring'
  | 'restored'
  | 'nothing-to-restore'
  | 'restore-failed'
  | 'manage';

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  onBuyPro?: () => void;
  onBuyCredits?: () => void;
  onWatchAd?: () => Promise<RewardAdResult | boolean | void>;
  context?: 'challenge' | 'group' | 'member' | 'general';
  initialView?: 'plans' | 'active';
  /** Amount of Momenta still needed for the attempted action */
  shortfall?: number;
  /** Expected reward from the ad, used for clearer UI copy */
  adRewardAmount?: number;
  variant?: PaywallVariant;
  /** Free tier allowance for the relevant quota (if known) */
  quotaLimit?: number;
  quotaContext?: 'challenge' | 'group' | 'general';
};

const PURCHASE_HANDOFF_CHECK_MS = 30_000;

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible: requestedVisible,
  onClose,
  onBuyPro,
  onBuyCredits: _onBuyCredits,
  onWatchAd,
  context = 'general',
  initialView = 'plans',
  shortfall,
  adRewardAmount = DEFAULT_AD_REWARD,
  variant = 'default',
  quotaLimit,
  quotaContext = 'general',
}) => {
  const allowed = usePaywallAllowed();
  const ownerId = useAuthStore(state => state.user?.id);
  const previousOwner = useRef(ownerId);
  const ownerChanged = previousOwner.current !== ownerId;
  const operationRevision = useRef(0);
  const visible = requestedVisible && allowed && !ownerChanged;
  useEffect(() => {
    if (requestedVisible && (!allowed || ownerChanged)) onClose();
    previousOwner.current = ownerId;
    if (!visible) operationRevision.current += 1;
  }, [requestedVisible, allowed, ownerChanged, ownerId, visible, onClose]);
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const { enabled: adsFlag } = useOperationalFlag('ads_enabled');
  const { enabled: safeMode } = useOperationalFlag('safe_mode');
  const adsEnabled = Boolean(onWatchAd) && adsFlag && !safeMode;
  const paywallViewedRef = useRef(false);
  const [offeringsUnavailable, setOfferingsUnavailable] = useState(false);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adFeedback, setAdFeedback] = useState<{
    variant: 'info' | 'warning' | 'error' | 'success';
    title?: string;
    message: string;
    confirmedAmount?: number;
  } | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(
    null
  );
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{
    tone: 'info' | 'warning' | 'success' | 'error';
    title: string;
    detail: string;
    action?: 'check-access' | 'continue';
  } | null>(null);
  // Internal state to switch to full paywall when user taps "Go Pro" from insufficient/quota variants
  const [showFullPaywall, setShowFullPaywall] = useState(false);
  const [paywallStage, setPaywallStage] = useState<PaywallStage>('plans');
  const purchaseInFlightRef = useRef(false);
  const restoreInFlightRef = useRef(false);

  // If the native purchase promise does not return, move to a recovery state
  // without guessing whether Apple charged the account.
  const purchaseWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    // Clear any previous watchdog on change
    if (purchaseWatchdogRef.current) {
      clearTimeout(purchaseWatchdogRef.current);
      purchaseWatchdogRef.current = null;
    }
    if (subscriptionLoading) {
      purchaseWatchdogRef.current = setTimeout(() => {
        setSubscriptionLoading(null);
        setPaywallStage('access-delayed');
        setPurchaseFeedback({
          tone: 'warning',
          title: t('commerce.paywall.checkoutStillOpen'),
          detail: t('commerce.paywall.checkoutStillOpenDetail'),
          action: 'check-access',
        });
      }, PURCHASE_HANDOFF_CHECK_MS);
    }
    return () => {
      if (purchaseWatchdogRef.current) {
        clearTimeout(purchaseWatchdogRef.current);
        purchaseWatchdogRef.current = null;
      }
    };
  }, [subscriptionLoading, t]);

  // Offer price metadata (from RevenueCat when available)
  const [offers, setOffers] = useState<ProOffer[]>([]);
  const offeringsRequest = useRef(0);

  // Extract offerings loading logic for reusability
  const loadOfferings = useCallback(async () => {
    const request = ++offeringsRequest.current;
    if (!REVENUECAT_SUPPORTED) {
      setOfferingsUnavailable(true);
      setOfferingsLoading(false);
      return;
    }

    setOfferingsLoading(true);
    setOfferingsUnavailable(false);

    try {
      const offerings = await RevenueCatAPI.getOfferings();
      if (request !== offeringsRequest.current) return;
      const current = offerings?.current;
      if (!current) {
        setOfferingsUnavailable(true);
        setOfferingsLoading(false);
        return;
      }
      const available: ProOffer[] = [];
      for (const plan of ['weekly', 'annual'] as const) {
        const pack = current.availablePackages.find(
          item =>
            item.packageType === plan.toUpperCase() ||
            item.identifier === '$rc_' + plan
        );
        if (!pack?.product.priceString) continue;
        const intro = pack.product.introPrice;
        const eligible =
          plan === 'weekly' &&
          intro &&
          intro.price > 0 &&
          intro.cycles === 1 &&
          ((intro.periodNumberOfUnits === 1 && intro.periodUnit === 'WEEK') ||
            (intro.periodNumberOfUnits === 7 && intro.periodUnit === 'DAY'))
            ? await RevenueCatAPI.isIntroEligible(pack.product.identifier)
            : false;
        available.push({
          plan,
          price: pack.product.priceString,
          ...(eligible && intro ? { introPrice: intro.priceString } : {}),
        });
      }
      if (request !== offeringsRequest.current) return;
      setOffers(available);
      setOfferingsUnavailable(false);
      setOfferingsLoading(false);

      try {
        sentryBreadcrumb('offerings_loaded', {
          availablePlans: available.map(offer => offer.plan),
        });
      } catch {}
    } catch (err) {
      if (request !== offeringsRequest.current) return;
      setOfferingsUnavailable(true);
      setOfferingsLoading(false);
      try {
        sentryCapture(err as Error, {
          context: { area: 'paywall_offerings_load' },
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (visible && (variant === 'default' || showFullPaywall)) {
      loadOfferings();
    }
    return () => {
      offeringsRequest.current += 1;
    };
  }, [loadOfferings, showFullPaywall, variant, visible]);

  useEffect(() => {
    if (!visible) {
      paywallViewedRef.current = false;
      return;
    }
    if (paywallViewedRef.current) return;
    paywallViewedRef.current = true;
    trackProductEvent('Paywall Viewed', {
      placement: getPaywallAnalyticsPlacement(context),
      variant: 'later',
    });
  }, [context, visible]);

  useEffect(() => {
    setAmplitudeSessionReplayHold('iap', visible);
    return () => {
      setAmplitudeSessionReplayHold('iap', false);
    };
  }, [visible]);

  const handleProConfirmedContinue = useCallback(() => {
    onBuyPro?.();
    onClose();
  }, [onBuyPro, onClose]);

  const handleBuyPlan = async (plan: 'weekly' | 'annual') => {
    if (!visible) return;
    const revision = operationRevision.current;
    if (purchaseInFlightRef.current) return;
    purchaseInFlightRef.current = true;
    setPaywallStage('opening-store');
    setPurchaseFeedback({
      tone: 'info',
      title: t('commerce.paywall.openingCheckout'),
      detail: t('commerce.paywall.appleConfirm'),
    });
    setSubscriptionLoading(plan);
    try {
      if (!REVENUECAT_SUPPORTED) {
        trackProductEvent('Subscription Outcome', {
          action: 'purchase',
          outcome: 'unsupported',
          plan,
        });
        setPaywallStage('purchase-failed');
        setPurchaseFeedback({
          tone: 'error',
          title: t('commerce.paywall.purchasesUnavailable'),
          detail: t('commerce.paywall.unsupportedDetail'),
        });
        return;
      }

      const result = await purchasePlan(plan);
      if (revision !== operationRevision.current) return;
      if (result.success) {
        trackProductEvent('Subscription Started', { plan });
        trackProductEvent('Subscription Outcome', {
          action: 'purchase',
          outcome: 'succeeded',
          plan,
        });
        // purchasePlan only returns success after the server profile reflects
        // the webhook entitlement. A client refresh can improve SDK freshness,
        // but it cannot create or revoke that receipt.
        try {
          await RevenueCatAPI.refreshCustomerInfo();
        } catch {}
        if (revision !== operationRevision.current) return;
        setPaywallStage('pro-active');
        setPurchaseFeedback({
          tone: 'success',
          title: t('commerce.paywall.proActive'),
          detail: t('commerce.paywall.proActiveDetail'),
          action: 'continue',
        });
      } else if (result.entitlementPending) {
        trackProductEvent('Subscription Outcome', {
          action: 'purchase',
          outcome: 'pending',
          plan,
        });
        setPaywallStage('access-delayed');
        setPurchaseFeedback({
          tone: 'warning',
          title: t('commerce.paywall.accessDelayed'),
          detail: t('sourceGate.paywall.purchaseStillFinishing'),
          action: 'check-access',
        });
      } else if (result.cancelled) {
        trackProductEvent('Subscription Outcome', {
          action: 'purchase',
          outcome: 'cancelled',
          plan,
        });
        setPaywallStage('cancelled');
        setPurchaseFeedback({
          tone: 'info',
          title: t('commerce.paywall.purchaseCancelled'),
          detail: t('commerce.paywall.notChargedChoose'),
        });
      } else {
        trackProductEvent('Subscription Outcome', {
          action: 'purchase',
          outcome: 'failed',
          plan,
        });
        setPaywallStage('purchase-failed');
        setPurchaseFeedback({
          tone: 'error',
          title: t('commerce.paywall.purchaseFailed'),
          detail: t('commerce.paywall.purchaseFailedDetail'),
        });
      }
    } catch {
      if (revision !== operationRevision.current) return;
      trackProductEvent('Subscription Outcome', {
        action: 'purchase',
        outcome: 'failed',
        plan,
      });
      setPaywallStage('purchase-failed');
      setPurchaseFeedback({
        tone: 'error',
        title: t('commerce.paywall.purchaseFailed'),
        detail: t('commerce.paywall.purchaseFailedDetail'),
      });
    } finally {
      purchaseInFlightRef.current = false;
      setSubscriptionLoading(null);
    }
  };

  const normalizeAdResult = (result: unknown): RewardAdResult | null => {
    if (result === undefined || result === null) return null;
    if (typeof result === 'boolean') {
      return { earned: result, amount: 0 };
    }

    if (
      typeof result === 'object' &&
      'earned' in (result as Record<string, unknown>)
    ) {
      const earned = Boolean((result as Record<string, unknown>).earned);
      const rawAmount = (result as Record<string, unknown>).amount;
      const amount =
        typeof rawAmount === 'number' && Number.isFinite(rawAmount)
          ? rawAmount
          : 0;
      const reason = (result as Record<string, unknown>).reason as
        | RewardAdResult['reason']
        | undefined;
      const type = (result as Record<string, unknown>).type as
        | string
        | undefined;
      return { earned, amount, reason, type };
    }

    return null;
  };

  const adFailureMessage = (
    reason?: RewardAdResult['reason']
  ): {
    variant: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  } => {
    switch (reason) {
      case 'module_missing':
        return {
          variant: 'info',
          title: t('commerce.paywall.adsUnavailable'),
          message: t('commerce.paywall.tryUpdate'),
        };
      case 'no_fill':
        return {
          variant: 'info',
          title: t('commerce.paywall.noAdIsAvailable'),
          message: t('commerce.wallet.tryAgainLater'),
        };
      case 'load_failed':
        return {
          variant: 'warning',
          title: t('commerce.paywall.adDidNotLoad'),
          message: t('commerce.wallet.tryAgainMoment'),
        };
      case 'show_failed':
        return {
          variant: 'warning',
          title: t('commerce.paywall.adDidNotPlay'),
          message: t('commerce.action.tryAgain'),
        };
      case 'daily_limit':
        return {
          variant: 'info',
          title: t('commerce.wallet.dailyLimit'),
          message: t('commerce.paywall.tryTomorrow'),
        };
      case 'cooldown':
        return {
          variant: 'info',
          title: t('commerce.paywall.rewardNotReady'),
          message: t('commerce.paywall.waitTwoMinutes'),
        };
      case 'reward_unconfirmed':
      case 'reward_pending':
      case 'verification_failed':
        return {
          variant: 'warning',
          title: t('commerce.wallet.rewardNotAdded'),
          message: t('commerce.paywall.refreshBeforeAd'),
        };
      case 'verification_unavailable':
      case 'error':
      default:
        return {
          variant: 'error',
          title: t('commerce.wallet.adUnavailable'),
          message: t('commerce.wallet.tryAgainLater'),
        };
    }
  };

  // Stabilize watchdog to persist across re-renders
  const adWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWatchAd = async () => {
    if (adLoading || !onWatchAd) return;

    try {
      sentryBreadcrumb('watch_ad_cta_pressed', {
        screen: 'paywall',
        variant,
        context,
      });
    } catch {}

    setAdFeedback(null);
    setAdLoading(true);
    if (adWatchdogRef.current) {
      clearTimeout(adWatchdogRef.current);
      adWatchdogRef.current = null;
    }
    let timedOut = false;
    adWatchdogRef.current = setTimeout(() => {
      timedOut = true;
      setAdLoading(false);
      try {
        sentryBreadcrumb('watch_ad_timeout', {
          screen: 'paywall',
          variant,
          context,
        });
      } catch {}
      const msg = t('commerce.paywall.adLoadTryAgain');
      setAdFeedback({
        variant: 'warning',
        message: msg,
      });
    }, 12000);
    try {
      const result = await onWatchAd();
      if (timedOut) return;
      const normalized = normalizeAdResult(result);

      if (!normalized) {
        try {
          sentryBreadcrumb('watch_ad_no_result', {
            screen: 'paywall',
            variant,
            context,
          });
        } catch {}
        const msg = t('commerce.wallet.noAdNow');
        setAdFeedback({
          variant: 'info',
          message: msg,
        });
        return;
      }

      if (!normalized.earned) {
        if (normalized.reason) {
          if (normalized.reason === 'no_fill') {
            try {
              sentryBreadcrumb('watch_ad_no_fill', {
                screen: 'paywall',
                variant,
                context,
              });
            } catch {}
          } else if (isAdUnavailableReason(normalized.reason)) {
            try {
              sentryBreadcrumb('watch_ad_unavailable', {
                screen: 'paywall',
                variant,
                context,
                reason: normalized.reason,
              });
            } catch {}
          } else {
            try {
              sentryBreadcrumb('watch_ad_credit_rejected', {
                screen: 'paywall',
                variant,
                context,
                reason: normalized.reason,
              });
            } catch {}
          }
          setAdFeedback(adFailureMessage(normalized.reason));
        } else {
          try {
            sentryBreadcrumb('watch_ad_no_reward', {
              screen: 'paywall',
              variant,
              context,
            });
          } catch {}
          const msg = t('commerce.wallet.watchFullAd');
          setAdFeedback({
            variant: 'warning',
            message: msg,
          });
        }
        return;
      }

      const confirmedAmount = Math.max(0, Math.floor(normalized.amount));
      if (confirmedAmount === 0) {
        setAdFeedback({
          variant: 'warning',
          message: t('commerce.paywall.rewardNotAddedDetail'),
        });
        return;
      }

      // onWatchAd resolves with earned=true only after the caller's server
      // credit succeeds. Show that confirmed result without guessing a balance.
      setAdFeedback({
        variant: 'success',
        message: t('commerce.wallet.addedToBalance', {
          amount: confirmedAmount.toLocaleString(),
        }),
        confirmedAmount,
      });
      try {
        sentryBreadcrumb('watch_ad_credit_confirmed', {
          screen: 'paywall',
          variant,
          context,
          amount: confirmedAmount,
        });
      } catch {}
    } catch (error) {
      if (timedOut) return;
      console.warn('[PaywallModal] watch ad failed:', error);
      try {
        sentryBreadcrumb('watch_ad_exception', {
          screen: 'paywall',
          variant,
          context,
        });
      } catch {}
      try {
        sentryCapture(error, {
          context: 'paywall_watch_ad_error',
          variant,
          paywallContext: context,
        });
      } catch {}
      const msg = t('commerce.wallet.noAdNow');
      setAdFeedback({
        variant: 'error',
        message: msg,
      });
    } finally {
      if (adWatchdogRef.current) {
        clearTimeout(adWatchdogRef.current);
        adWatchdogRef.current = null;
      }
      if (!timedOut) {
        setAdLoading(false);
      }
    }
  };
  useEffect(() => {
    if (visible && initialView === 'active') {
      setPaywallStage('pro-active');
      setShowFullPaywall(true);
      setPurchaseFeedback(null);
    } else if (!visible) {
      setAdFeedback(null);
      setPurchaseFeedback(null);
      setShowFullPaywall(false);
      setPaywallStage('plans');
      if (adWatchdogRef.current) {
        clearTimeout(adWatchdogRef.current);
        adWatchdogRef.current = null;
      }
    }
  }, [initialView, visible]);

  // Handler for "Go Pro" buttons - always show full paywall with purchase options
  const handleGoProPress = useCallback(() => {
    setPaywallStage('plans');
    setShowFullPaywall(true);
  }, []);

  // Restore outcomes stay visible until the person chooses to continue.
  const handleRestorePurchases = useCallback(async () => {
    const revision = operationRevision.current;
    if (!REVENUECAT_SUPPORTED || restoreInFlightRef.current) return;
    restoreInFlightRef.current = true;
    setPaywallStage('restoring');
    setRestoreLoading(true);
    try {
      const result = await restorePurchases();
      if (revision !== operationRevision.current) return;
      if (result.success) {
        trackProductEvent('Subscription Outcome', {
          action: 'restore',
          outcome: 'succeeded',
          plan: 'unknown',
        });
        setPaywallStage('restored');
        setPurchaseFeedback({
          tone: 'success',
          title: t('commerce.paywall.proActiveAgain'),
          detail: t('commerce.paywall.previousActive'),
          action: 'continue',
        });
      } else if (result.entitlementPending) {
        trackProductEvent('Subscription Outcome', {
          action: 'restore',
          outcome: 'pending',
          plan: 'unknown',
        });
        setPaywallStage('access-delayed');
        setPurchaseFeedback({
          tone: 'warning',
          title: t('sourceGate.paywall.previousPurchaseChecking'),
          detail: t('sourceGate.paywall.dontBuyProAgain'),
          action: 'check-access',
        });
      } else if (result.errorMessage) {
        trackProductEvent('Subscription Outcome', {
          action: 'restore',
          outcome: 'failed',
          plan: 'unknown',
        });
        setPaywallStage('restore-failed');
        setPurchaseFeedback({
          tone: 'error',
          title: t('commerce.paywall.restoreFailed'),
          detail: t('commerce.paywall.restoreFailedDetail'),
        });
      } else {
        trackProductEvent('Subscription Outcome', {
          action: 'restore',
          outcome: 'nothing_to_restore',
          plan: 'unknown',
        });
        setPaywallStage('nothing-to-restore');
        setPurchaseFeedback({
          tone: 'info',
          title: t('commerce.paywall.noMatchingPurchase'),
          detail: t('commerce.paywall.noMatchingPurchaseDetail'),
        });
      }
    } catch {
      if (revision !== operationRevision.current) return;
      trackProductEvent('Subscription Outcome', {
        action: 'restore',
        outcome: 'failed',
        plan: 'unknown',
      });
      setPaywallStage('restore-failed');
      setPurchaseFeedback({
        tone: 'error',
        title: t('commerce.paywall.restoreFailed'),
        detail: t('commerce.paywall.restoreFailedChanged'),
      });
    } finally {
      restoreInFlightRef.current = false;
      setRestoreLoading(false);
    }
  }, [t]);

  const handleCheckAccess = useCallback(async () => {
    const revision = operationRevision.current;
    setPaywallStage('checking-access');
    setPurchaseFeedback({
      tone: 'info',
      title: t('commerce.paywall.checkingAccess'),
      detail: t('commerce.paywall.checkingAccessDetail'),
    });
    try {
      await RevenueCatAPI.refreshCustomerInfo();
      const serverConfirmed = await RevenueCatAPI.confirmServerProAccess();
      if (revision !== operationRevision.current) return;
      if (serverConfirmed) {
        setPaywallStage('pro-active');
        setPurchaseFeedback({
          tone: 'success',
          title: t('commerce.paywall.proActive'),
          detail: t('commerce.paywall.proActiveDetail'),
          action: 'continue',
        });
        return;
      }

      setPaywallStage('access-delayed');
      setPurchaseFeedback({
        tone: 'warning',
        title: t('commerce.paywall.proNotActive'),
        detail: t('commerce.paywall.proNotActiveDetail'),
        action: 'check-access',
      });
    } catch {
      if (revision !== operationRevision.current) return;
      setPaywallStage('access-delayed');
      setPurchaseFeedback({
        tone: 'warning',
        title: t('commerce.paywall.couldNotCheck'),
        detail: t('commerce.paywall.couldNotCheckDetail'),
        action: 'check-access',
      });
    }
  }, [t]);

  const handleManageSubscription = useCallback(async () => {
    const revision = operationRevision.current;
    const opened = await RevenueCatAPI.showManageSubscriptions();
    if (revision !== operationRevision.current) return;
    if (!opened) {
      setPaywallStage('purchase-failed');
      setPurchaseFeedback({
        tone: 'warning',
        title: t('commerce.paywall.couldNotOpenSubscriptions'),
        detail: t('commerce.paywall.openAppleSettings'),
      });
    }
  }, [t]);

  useEffect(() => {
    return () => {
      if (adWatchdogRef.current) {
        clearTimeout(adWatchdogRef.current);
        adWatchdogRef.current = null;
      }
    };
  }, []);

  const renderAdFeedback = () => {
    if (!adFeedback) return null;

    if (
      adFeedback.variant === 'success' &&
      typeof adFeedback.confirmedAmount === 'number'
    ) {
      return (
        <View
          accessibilityLiveRegion="polite"
          style={styles.adConfirmedFeedback}
          testID="paywall-ad-feedback"
        >
          <CommerceReceiptRows
            facts={[
              {
                label: t('commerce.wallet.rewardAdded'),
                value: `+${adFeedback.confirmedAmount.toLocaleString()}`,
              },
            ]}
            testID="paywall-ad-success-receipt"
          />
          <Text style={styles.adConfirmedMessage}>{adFeedback.message}</Text>
        </View>
      );
    }

    const title: string =
      typeof adFeedback.title === 'string'
        ? adFeedback.title
        : adFeedback.variant === 'error'
          ? t('commerce.paywall.adError')
          : adFeedback.variant === 'warning'
            ? t('commerce.paywall.rewardNotEarned')
            : t('commerce.wallet.noAd');

    return (
      <AppInlineNotice
        title={title}
        description={adFeedback.message}
        tone={adFeedback.variant}
        style={styles.compactAdFeedbackNotice}
        testID="paywall-ad-feedback"
      />
    );
  };

  const renderLegalLinks = (align: 'center' | 'left' = 'center') => {
    return (
      <View
        style={[
          styles.legalLinksRow,
          align === 'left' ? { justifyContent: 'flex-start' } : null,
        ]}
      >
        <Pressable
          onPress={() =>
            void Linking.openURL(APP_TERMS_URL).catch(() => {
              showToast.error(
                t('commerce.paywall.termsDidNotOpen'),
                t('commerce.paywall.tryBrowserTerms')
              );
            })
          }
          accessibilityRole="link"
          accessibilityLabel={t('commerce.paywall.terms')}
        >
          <Text style={styles.legalLinkText}>
            {t('commerce.paywall.terms')}
          </Text>
        </Pressable>
        <Text style={styles.legalSeparator}> - </Text>
        <Pressable
          onPress={() =>
            void Linking.openURL(APP_PRIVACY_URL).catch(() => {
              showToast.error(
                t('commerce.paywall.privacyDidNotOpen'),
                t('commerce.paywall.tryBrowserPrivacy')
              );
            })
          }
          accessibilityRole="link"
          accessibilityLabel={t('commerce.paywall.privacy')}
        >
          <Text style={styles.legalLinkText}>
            {t('commerce.paywall.privacy')}
          </Text>
        </Pressable>
      </View>
    );
  };

  // Note: credit pack purchases are initiated from the Shop screen

  const shouldShowFullPaywall = variant === 'default' || showFullPaywall;
  const fullScreenContentInsets = {
    // Reserve a complete control row above the content. The former inset put
    // the first heading underneath the 44-point close control on notched
    // devices.
    paddingTop: insets.top + 64,
    paddingBottom: insets.bottom + 64,
  };
  // Outcomes hold a single decision, so they track the real safe area instead of
  // the taller plan-screen inset that can push the action below the fold.
  const outcomeContentInsets = {
    paddingTop: insets.top + mentaSpacing[6],
    paddingBottom: insets.bottom + mentaSpacing[6],
  };
  const paywallLaneInset = { paddingHorizontal: phoneLayout.screenInset };

  const quotaCopyForContext = useMemo(
    () => getQuotaLimitCopy(quotaContext, quotaLimit, t),
    [quotaContext, quotaLimit, t]
  );

  const knownShortfall =
    typeof shortfall === 'number' && Number.isFinite(shortfall) && shortfall > 0
      ? Math.ceil(shortfall)
      : null;
  const knownAdReward = Math.max(0, Math.floor(adRewardAmount));
  const remainingAfterAd =
    knownShortfall === null
      ? null
      : Math.max(0, knownShortfall - knownAdReward);
  const fundingSubject =
    context === 'group'
      ? 'group'
      : context === 'challenge'
        ? 'promise'
        : 'draft';
  const savedSubjectCopy =
    fundingSubject === 'group'
      ? t('commerce.paywall.savedSubject.group')
      : fundingSubject === 'promise'
        ? t('commerce.paywall.savedSubject.promise')
        : t('commerce.paywall.savedSubject.draft');
  const adFundingCopy =
    remainingAfterAd === null
      ? t('commerce.paywall.oneAd', { amount: knownAdReward.toLocaleString() })
      : remainingAfterAd > 0
        ? t('commerce.paywall.oneAdStillNeed', {
            amount: knownAdReward.toLocaleString(),
            remaining: remainingAfterAd.toLocaleString(),
          })
        : fundingSubject === 'group'
          ? t('commerce.paywall.oneAdEnough.group', {
              amount: knownAdReward.toLocaleString(),
            })
          : fundingSubject === 'promise'
            ? t('commerce.paywall.oneAdEnough.promise', {
                amount: knownAdReward.toLocaleString(),
              })
            : t('commerce.paywall.oneAdEnough.draft', {
                amount: knownAdReward.toLocaleString(),
              });

  const stageDetails: Record<
    Exclude<PaywallStage, 'plans'>,
    {
      title: string;
      detail: string;
      receipt?: { label: string; value: string };
      actionTitle?: string;
      secondaryTitle?: string;
    }
  > = {
    'opening-store': {
      title: t('commerce.paywall.openCheckout'),
      detail: t('commerce.paywall.purchaseTermsReturn'),
    },
    'checking-access': {
      title: t('commerce.paywall.checkingAccess'),
      detail: t('commerce.paywall.checkingAccessDetail'),
    },
    'pro-active': {
      title:
        initialView === 'active'
          ? t('commerce.paywall.havePro')
          : t('commerce.paywall.proActive'),
      detail:
        initialView === 'active'
          ? t('commerce.paywall.featuresReady')
          : t('commerce.paywall.proActiveDetail'),
      receipt: {
        label: t('commerce.paywall.proAccess'),
        value: t('commerce.paywall.active'),
      },
      actionTitle:
        initialView === 'active'
          ? t('commerce.paywall.manageSubscription')
          : t('commerce.paywall.startPro'),
    },
    'access-delayed': {
      title: t('commerce.paywall.accessDelayed'),
      detail:
        purchaseFeedback?.detail || t('commerce.paywall.accessDelayedDetail'),
      actionTitle: t('commerce.paywall.checkAccess'),
      secondaryTitle: t('commerce.paywall.restore'),
    },
    cancelled: {
      title: t('commerce.paywall.purchaseCancelled'),
      detail: t('commerce.paywall.notChargedChoose'),
      actionTitle: t('commerce.paywall.choosePlanAction'),
      secondaryTitle: t('commerce.paywall.returnMenta'),
    },
    'purchase-failed': {
      title: purchaseFeedback?.title || t('commerce.paywall.purchaseFailed'),
      detail:
        purchaseFeedback?.detail || t('commerce.paywall.purchaseFailedDetail'),
      actionTitle: t('commerce.paywall.backPlans'),
      secondaryTitle: t('commerce.paywall.checkAccess'),
    },
    restoring: {
      title: t('commerce.paywall.restoringPurchases'),
      detail: t('commerce.paywall.restoringDetail'),
    },
    restored: {
      title: t('commerce.paywall.proActiveAgain'),
      detail: t('commerce.paywall.previousActiveAccount'),
      receipt: {
        label: t('commerce.paywall.proAccess'),
        value: t('commerce.paywall.active'),
      },
      actionTitle: t('commerce.paywall.startPro'),
    },
    'nothing-to-restore': {
      title: t('commerce.paywall.noMatchingPurchase'),
      detail: t('commerce.paywall.noMatchingPurchaseDetail'),
      actionTitle: t('commerce.paywall.backPlans'),
    },
    'restore-failed': {
      title: t('commerce.paywall.restoreFailed'),
      detail:
        purchaseFeedback?.detail || t('commerce.paywall.restoreFailedChanged'),
      actionTitle: t('commerce.paywall.tryRestore'),
      secondaryTitle: t('commerce.paywall.backPlans'),
    },
    manage: {
      title: t('commerce.paywall.manage'),
      detail: t('commerce.paywall.manageDetail'),
      actionTitle: t('commerce.paywall.continueApple'),
      secondaryTitle: t('commerce.paywall.backPlans'),
    },
  };

  const runStagePrimaryAction = () => {
    switch (paywallStage) {
      case 'pro-active':
        if (initialView === 'active') {
          setPaywallStage('manage');
          return;
        }
        handleProConfirmedContinue();
        return;
      case 'restored':
        handleProConfirmedContinue();
        return;
      case 'access-delayed':
        void handleCheckAccess();
        return;
      case 'restore-failed':
        void handleRestorePurchases();
        return;
      case 'manage':
        void handleManageSubscription();
        return;
      default:
        setPaywallStage('plans');
    }
  };

  const runStageSecondaryAction = () => {
    if (paywallStage === 'access-delayed') {
      void handleRestorePurchases();
      return;
    }
    if (paywallStage === 'purchase-failed') {
      void handleCheckAccess();
      return;
    }
    if (paywallStage === 'cancelled') {
      onClose();
      return;
    }
    setPaywallStage('plans');
  };

  const isConfirmedProStage =
    paywallStage === 'pro-active' || paywallStage === 'restored';
  const paywallStateContent =
    paywallStage === 'plans' ? null : (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.paywallLane,
          paywallLaneInset,
          styles.paywallOutcomeContent,
          outcomeContentInsets,
        ]}
        showsVerticalScrollIndicator={false}
        testID={`paywall-state-${paywallStage}`}
      >
        <View style={styles.paywallOutcomeBody}>
          {isConfirmedProStage ? (
            <MentaMascot
              size="xl"
              state="pro-active"
              style={styles.paywallConfirmedMascot}
              testID="paywall-confirmed-mascot"
            />
          ) : null}
          <Text
            style={[
              styles.paywallStateTitle,
              withReadableLeading(mentaTypography.heading, phoneLayout),
              isConfirmedProStage ? styles.paywallConfirmedText : null,
            ]}
          >
            {stageDetails[paywallStage].title}
          </Text>
          <Text
            style={[
              styles.paywallStateDetail,
              withReadableLeading(mentaTypography.body, phoneLayout),
              isConfirmedProStage ? styles.paywallConfirmedText : null,
            ]}
          >
            {stageDetails[paywallStage].detail}
          </Text>

          {stageDetails[paywallStage].receipt ? (
            <CommerceReceiptRows
              facts={[stageDetails[paywallStage].receipt]}
              testID={`paywall-state-${paywallStage}-receipt`}
            />
          ) : null}

          {!stageDetails[paywallStage].actionTitle ? (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={stageDetails[paywallStage].title}
              style={styles.paywallOutcomeLoading}
            >
              <SkeletonLoader
                announce={false}
                borderRadius={mentaRadii.large}
                height={54}
              />
            </View>
          ) : null}
        </View>

        {stageDetails[paywallStage].actionTitle ? (
          <View style={styles.paywallOutcomeActions}>
            <AppButton
              title={stageDetails[paywallStage].actionTitle}
              onPress={runStagePrimaryAction}
              variant="accent"
              size="large"
              fullWidth
            />

            {stageDetails[paywallStage].secondaryTitle ? (
              <Pressable
                accessibilityRole="button"
                onPress={runStageSecondaryAction}
                style={styles.paywallSecondaryAction}
              >
                <Text style={styles.paywallSecondaryActionText}>
                  {stageDetails[paywallStage].secondaryTitle}
                </Text>
              </Pressable>
            ) : null}

            {paywallStage === 'access-delayed' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('commerce.paywall.checkAccessLater')}
                onPress={onClose}
                style={styles.paywallSecondaryAction}
                testID="paywall-access-delayed-close"
              >
                <Text style={styles.paywallSecondaryActionText}>
                  {t('commerce.paywall.checkAccessLater')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    );

  const defaultContent = (
    <ProOfferJourney
      visible={visible}
      offers={offers}
      loading={offeringsLoading}
      unavailable={offeringsUnavailable}
      context={context}
      onPurchase={plan => void handleBuyPlan(plan)}
      onClose={onClose}
      onRetry={() => void loadOfferings()}
      onRestore={() => void handleRestorePurchases()}
      restoring={restoreLoading}
      legalLinks={renderLegalLinks('center')}
    />
  );

  const insufficientContent = (
    <View
      style={[styles.paywallLane, paywallLaneInset, styles.compactContent]}
      testID="paywall-compact"
    >
      <View style={styles.compactHeader}>
        <Badge
          text={t('commerce.commerce.insufficient')}
          variant="warning"
          size="small"
        />
        <Pressable
          onPress={onClose}
          accessibilityLabel={t('commerce.paywall.close')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.compactClose,
            pressed && styles.closePressed,
          ]}
        >
          <XIcon size={18} color={theme.colors.text.secondary} />
        </Pressable>
      </View>
      <Text style={styles.compactTitle}>
        {knownShortfall !== null
          ? t('commerce.paywall.needMore', {
              amount: knownShortfall.toLocaleString(),
            })
          : t('commerce.paywall.needMomenta')}
      </Text>
      <Text style={styles.compactBody}>{savedSubjectCopy}</Text>
      {adsEnabled && onWatchAd ? (
        <View style={styles.compactCard}>
          <Text style={styles.compactSubtext}>{adFundingCopy}</Text>
          <AppButton
            title={
              adLoading
                ? t('commerce.paywall.adLoading')
                : t('commerce.paywall.watchAdFor', {
                    amount: knownAdReward.toLocaleString(),
                  })
            }
            onPress={handleWatchAd}
            variant="accent"
            size="large"
            disabled={adLoading}
            style={styles.compactButton}
            fullWidth
          />
          {renderAdFeedback()}
        </View>
      ) : null}
      <AppButton
        title={t('commerce.paywall.seePro')}
        onPress={handleGoProPress}
        variant="outline"
        size="large"
        fullWidth
      />
      <AppButton
        title={t('commerce.action.returnToDraft')}
        onPress={onClose}
        variant="ghost"
        size="large"
        fullWidth
      />
      <Pressable
        style={styles.restoreLink}
        onPress={handleRestorePurchases}
        disabled={!REVENUECAT_SUPPORTED || restoreLoading}
        accessibilityRole="button"
        accessibilityLabel={t('commerce.paywall.restore')}
        accessibilityState={{
          busy: restoreLoading,
          disabled: !REVENUECAT_SUPPORTED || restoreLoading,
        }}
      >
        <Text style={styles.restoreLinkText}>
          {restoreLoading
            ? t('commerce.paywall.restoring')
            : t('commerce.paywall.restore')}
        </Text>
      </Pressable>

      <View style={{ marginTop: 14 }}>{renderLegalLinks('center')}</View>
    </View>
  );

  const quotaContent = (
    <View
      style={[styles.paywallLane, paywallLaneInset, styles.compactContent]}
      testID="paywall-compact"
    >
      <View style={styles.compactHeader}>
        <Text style={styles.headerKicker}>
          {t('commerce.paywall.freeLimit')}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityLabel={t('commerce.paywall.close')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.compactClose,
            pressed && styles.closePressed,
          ]}
        >
          <XIcon size={18} color={theme.colors.text.secondary} />
        </Pressable>
      </View>
      <Text style={styles.compactTitle}>
        {t('commerce.paywall.reachedLimit')}
      </Text>
      <Text style={styles.compactBody}>
        {t('commerce.paywall.draftSaved', { message: quotaCopyForContext })}
      </Text>
      <AppButton
        title={t('commerce.paywall.seePro')}
        onPress={handleGoProPress}
        variant="accent"
        size="large"
        fullWidth
      />
      <AppButton
        title={t('commerce.action.returnToDraft')}
        onPress={onClose}
        variant="ghost"
        size="large"
        fullWidth
      />
      <Pressable
        style={styles.restoreLink}
        onPress={handleRestorePurchases}
        disabled={!REVENUECAT_SUPPORTED || restoreLoading}
        accessibilityRole="button"
        accessibilityLabel={t('commerce.paywall.restore')}
        accessibilityState={{
          busy: restoreLoading,
          disabled: !REVENUECAT_SUPPORTED || restoreLoading,
        }}
      >
        <Text style={styles.restoreLinkText}>
          {restoreLoading
            ? t('commerce.paywall.restoring')
            : t('commerce.paywall.restore')}
        </Text>
      </Pressable>

      <View style={{ marginTop: 14 }}>{renderLegalLinks('center')}</View>
    </View>
  );

  const variantContent =
    variant === 'insufficient' ? insufficientContent : quotaContent;

  return (
    <ModalCard
      testID="paywall-modal"
      visible={visible}
      animationType="fade"
      surface="full_screen"
      dismissOnBackdrop={false}
      onClose={onClose}
      accessibilityLabel={t('commerce.paywall.close')}
      overlayStyle={styles.overlay}
      cardStyle={styles.fullScreenCard}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: mentaColors.canvas },
        ]}
      />
      <View testID="paywall-shell" style={styles.fullScreenCard}>
        {shouldShowFullPaywall ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                styles.fullScreenCloseButton,
                { top: insets.top + theme.spacing.sm },
                pressed && styles.closePressed,
              ]}
              onPress={() => {
                setShowFullPaywall(false);
                onClose();
              }}
              accessibilityLabel={t('commerce.paywall.close')}
              accessibilityRole="button"
              testID="paywall-close"
            >
              <XIcon size={20} color={theme.colors.text.primary} />
            </Pressable>
            <View style={styles.fullScreenCard}>
              <View
                style={{
                  flex: 1,
                  display: paywallStateContent ? 'none' : 'flex',
                }}
                accessibilityElementsHidden={Boolean(paywallStateContent)}
                importantForAccessibility={
                  paywallStateContent ? 'no-hide-descendants' : 'auto'
                }
              >
                {defaultContent}
              </View>
              {paywallStateContent}
            </View>
          </>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.fullScreenVariantContent,
              fullScreenContentInsets,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {variantContent}
          </ScrollView>
        )}
      </View>
    </ModalCard>
  );
};

interface PaywallStyles {
  overlay: ViewStyle;
  fullScreenCard: ViewStyle;
  scrollContainer: ViewStyle;
  paywallLane: ViewStyle;
  cardContent: ViewStyle;
  paywallOutcomeContent: ViewStyle;
  paywallOutcomeBody: ViewStyle;
  paywallOutcomeActions: ViewStyle;
  paywallOutcomeLoading: ViewStyle;
  paywallConfirmedMascot: ViewStyle;
  paywallConfirmedText: TextStyle;
  paywallStateTitle: TextStyle;
  paywallStateDetail: TextStyle;
  paywallSecondaryAction: ViewStyle;
  paywallSecondaryActionText: TextStyle;
  planLoading: ViewStyle;
  planLoadingLabel: TextStyle;
  planSkeletonRow: ViewStyle;
  planSkeletonRadio: ViewStyle;
  planSkeletonCopy: ViewStyle;
  planSkeletonTitle: ViewStyle;
  planSkeletonDetail: ViewStyle;
  planSkeletonPrice: ViewStyle;
  closeButton: ViewStyle;
  fullScreenCloseButton: ViewStyle;
  headerSection: ViewStyle;
  headerIconContainer: ViewStyle;
  headerKicker: TextStyle;
  heroIcon: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  perksList: ViewStyle;
  perkItem: ViewStyle;
  perkText: TextStyle;
  momentumLedger: ViewStyle;
  momentumRow: ViewStyle;
  momentumRowLast: ViewStyle;
  momentumIcon: ViewStyle;
  momentumCopy: ViewStyle;
  momentumTitle: TextStyle;
  momentumText: TextStyle;
  offersSection: ViewStyle;
  planStack: ViewStyle;
  planDisclaimer: TextStyle;
  postCtaActions: ViewStyle;
  heroCta: ViewStyle;
  heroCtaRow: ViewStyle;
  heroCtaText: TextStyle;
  heroButton: ViewStyle;
  heroFooter: TextStyle;
  retryButton: ViewStyle;
  retryButtonLoading: ViewStyle;
  retryButtonText: TextStyle;
  compactAdFeedbackNotice: ViewStyle;
  adConfirmedFeedback: ViewStyle;
  adConfirmedMessage: TextStyle;
  restoreLink: ViewStyle;
  restoreLinkText: TextStyle;
  utilitySeparator: TextStyle;
  benefitsSection: ViewStyle;
  sectionHeading: TextStyle;
  freePlanNote: ViewStyle;
  freePlanNoteText: TextStyle;
  fullScreenVariantContent: ViewStyle;
  compactContent: ViewStyle;
  compactHeader: ViewStyle;
  compactClose: ViewStyle;
  closePressed: ViewStyle;
  compactTitle: TextStyle;
  compactBody: TextStyle;
  compactCard: ViewStyle;
  compactSubtext: TextStyle;
  compactButton: ViewStyle;
  legalFooter: ViewStyle;
  legalLinksRow: ViewStyle;
  legalLinkText: TextStyle;
  legalSeparator: TextStyle;
  legalDisclaimer: TextStyle;
}

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create<PaywallStyles>({
    overlay: {
      flex: 1,
    },
    fullScreenCard: {
      flex: 1,
      minHeight: 0,
      width: '100%',
      backgroundColor: mentaColors.canvas,
      borderRadius: 0,
      borderWidth: 0,
      overflow: 'hidden',
    },
    scrollContainer: {
      flex: 1,
    },
    paywallLane: {
      width: '100%',
      maxWidth: mentaLayout.phoneFrameMax,
      alignSelf: 'center',
      paddingHorizontal: mentaSpacing[6],
    },
    cardContent: {
      gap: mentaSpacing[6],
    },
    paywallOutcomeContent: {
      flexGrow: 1,
      gap: mentaSpacing[4],
    },
    paywallOutcomeBody: {
      width: '100%',
      flexGrow: 1,
      justifyContent: 'center',
      gap: mentaSpacing[4],
    },
    paywallOutcomeActions: {
      width: '100%',
      gap: mentaSpacing[3],
    },
    paywallOutcomeLoading: {
      marginTop: mentaSpacing[2],
    },
    paywallConfirmedMascot: {
      alignSelf: 'center',
      marginBottom: mentaSpacing[2],
    },
    paywallConfirmedText: {
      textAlign: 'center',
    },
    paywallStateTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.heading,
    },
    paywallStateDetail: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
    },
    paywallSecondaryAction: {
      minHeight: 46,
      borderRadius: mentaRadii.medium,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
    },
    paywallSecondaryActionText: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
    },
    planLoading: {
      gap: mentaSpacing[3],
    },
    planLoadingLabel: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmallMedium,
    },
    planSkeletonRow: {
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[3],
      borderWidth: 1,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
      paddingHorizontal: mentaSpacing[4],
    },
    planSkeletonRadio: {
      width: 22,
      height: 22,
      borderRadius: mentaRadii.round,
    },
    planSkeletonCopy: {
      flex: 1,
      gap: mentaSpacing[2],
    },
    planSkeletonTitle: {
      width: 92,
      height: 13,
      borderRadius: mentaRadii.small,
    },
    planSkeletonDetail: {
      width: 138,
      height: 9,
      borderRadius: mentaRadii.small,
    },
    planSkeletonPrice: {
      width: 52,
      height: 15,
      borderRadius: mentaRadii.small,
    },
    closeButton: {
      position: 'absolute',
      right: mentaSpacing[4],
      top: mentaSpacing[4],
      padding: mentaSpacing[2],
      zIndex: 1,
    },
    fullScreenCloseButton: {
      left: undefined,
      right: theme.spacing.md,
      width: 44,
      minHeight: 44,
      borderRadius: mentaRadii.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.interactive.secondary,
      borderWidth: 1,
      borderColor:
        theme.colors.border.focus ?? theme.colors.interactive.primary,
    },
    headerSection: {
      alignItems: 'stretch',
      marginBottom: 0,
    },
    headerIconContainer: {
      marginBottom: theme.spacing.md,
    },
    headerKicker: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.bodySmallMedium,
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: mentaRadii.round,
      backgroundColor: theme.colors.interactive.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.medium,
    },
    title: {
      ...mentaTypography.paywallHero,
      color: theme.colors.text.primary,
      textAlign: 'left',
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
      textAlign: 'left',
    },
    perksList: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
      gap: 8,
    },
    perkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    perkText: {
      color: theme.colors.text.primary,
      ...mentaTypography.body,
    },
    momentumLedger: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border.primary,
    },
    momentumRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.primary,
      paddingVertical: theme.spacing.md,
    },
    momentumRowLast: {
      borderBottomWidth: 0,
    },
    momentumIcon: {
      width: 28,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    momentumCopy: {
      flex: 1,
      gap: 3,
    },
    momentumTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
    },
    momentumText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    offersSection: {
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    planStack: {
      gap: mentaSpacing[3],
    },
    planDisclaimer: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.caption,
      textAlign: 'center',
    },
    postCtaActions: {
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    heroCta: {
      paddingVertical: mentaSpacing[4],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.primary,
    },
    heroCtaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    heroCtaText: {
      flex: 1,
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
    },
    heroButton: {
      marginTop: theme.spacing.xs,
    },
    heroFooter: {
      marginTop: theme.spacing.xs,
      color: theme.colors.text.tertiary,
      ...mentaTypography.bodySmall,
    },
    retryButton: {
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.interactive.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: mentaRadii.large,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryButtonLoading: {
      opacity: 0.6,
    },
    retryButtonText: {
      color: theme.colors.text.inverse,
      ...mentaTypography.bodySemibold,
    },
    compactAdFeedbackNotice: {
      alignSelf: 'stretch',
    },
    adConfirmedFeedback: {
      gap: mentaSpacing[2],
    },
    adConfirmedMessage: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
      textAlign: 'center',
    },
    restoreLink: {
      alignItems: 'center',
      padding: mentaSpacing[2],
    },
    restoreLinkText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
      textDecorationLine: 'underline',
    },
    utilitySeparator: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.bodySmall,
    },
    benefitsSection: {
      gap: theme.spacing.sm,
    },
    sectionHeading: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
    },
    freePlanNote: {
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
    },
    freePlanNoteText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.caption,
      textAlign: 'center',
    },
    fullScreenVariantContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    compactContent: {
      gap: theme.spacing.lg,
    },
    compactHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    compactClose: {
      alignItems: 'center',
      borderRadius: mentaRadii.round,
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 44,
      padding: 8,
    },
    closePressed: {
      opacity: 0.72,
      transform: [{ scale: 0.96 }],
    },
    compactTitle: {
      ...mentaTypography.title,
      color: theme.colors.text.primary,
    },
    compactBody: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
    },
    compactCard: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.primary,
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    compactSubtext: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    compactButton: {
      marginTop: theme.spacing.xs,
    },
    legalFooter: {
      marginTop: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.primary,
      gap: theme.spacing.md,
    },
    legalLinksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    legalLinkText: {
      color: mentaColors.text.secondary,
      ...mentaTypography.caption,
      textDecorationLine: 'underline',
    },
    legalSeparator: {
      color: theme.colors.text.secondary,
      ...mentaTypography.caption,
    },
    legalDisclaimer: {
      color: theme.colors.text.secondary,
      ...mentaTypography.caption,
      textAlign: 'center',
    },
  });

export default PaywallModal;
