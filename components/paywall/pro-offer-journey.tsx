import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, View, ScrollView, StyleSheet } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';
import { CheckIcon, ChevronLeftIcon, XIcon } from '@/components/ui/icons';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { resolveChoicePalette } from '@/components/ui/AppChoice';
import { useTheme } from '@/constants/ThemeContext';

import { useTranslation } from '@/lib/localization/use-translation';
import { trackProductEvent } from '@/lib/posthog';
import type { PaywallContext } from '@/lib/paywall/manager';
import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import {
  annualSavingsPercent,
  formatLikeStorePrice,
  formatStorePrice,
  weeklyEquivalent,
} from '@/lib/paywall/pro-plan-pricing';

export type ProOffer = {
  plan: 'weekly' | 'annual';
  price: string;
  introPrice?: string;
  freeTrialDays?: number;
  freeTrialMonth?: boolean;
  /** Store price as a number, for per-week and savings maths. */
  amount?: number;
  currencyCode?: string;
};

const PAGES = ['benefits', 'plans', 'offer'] as const;

type Props = {
  visible: boolean;
  offers: ProOffer[];
  loading: boolean;
  unavailable: boolean;
  context: PaywallContext | 'onboarding';
  onPurchase: (plan: ProOffer['plan']) => void;
  onClose: () => void;
  onContinueFree?: () => void;
  freeDisabled?: boolean;
  onRetry: () => void;
  onRestore: () => void;
  restoring: boolean;
  legalLinks: React.ReactNode;
};

/** Value, choice and exact terms are separate pages, with an always-visible action. */
export function ProOfferJourney({
  visible,
  offers,
  loading,
  unavailable,
  context,
  onPurchase,
  onClose,
  onContinueFree,
  freeDisabled = false,
  onRetry,
  onRestore,
  restoring,
  legalLinks,
}: Props) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<'benefits' | 'plans' | 'offer'>('benefits');
  const [selected, setSelected] = useState<ProOffer['plan'] | null>(null);
  const offer = offers.find(item => item.plan === selected);
  // Paper J02 leads with yearly, the plan most people keep.
  useEffect(() => {
    if (selected || !offers.length) return;
    setSelected(
      (context === 'menta_check' || context === 'onboarding') &&
        offers.some(item => item.plan === 'weekly')
        ? 'weekly'
        : offers.some(item => item.plan === 'annual')
          ? 'annual'
          : offers[0].plan
    );
  }, [offers, selected, context]);
  const annualOffer = offers.find(item => item.plan === 'annual');
  const weeklyOffer = offers.find(item => item.plan === 'weekly');
  const savings =
    annualOffer?.amount && weeklyOffer?.amount
      ? annualSavingsPercent(annualOffer.amount, weeklyOffer.amount)
      : null;
  const stepIndex = PAGES.indexOf(page);
  // Paper J01-J02 close with an X; J03 steps back to the plan choice.
  const showsBack = page === 'offer';
  const closeLabel =
    context === 'onboarding'
      ? t('commerce.proJourney.back')
      : t('commerce.paywall.close');
  const theme = useTheme();
  const accent = theme.colors.accent.primary;
  useEffect(() => {
    if (!visible) {
      setPage('benefits');
      setSelected(null);
    }
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    trackProductEvent('Paywall Journey', {
      stage: page,
      context,
      plan: selected ?? 'none',
    });
  }, [page, context, selected, visible]);
  const terms = (item: ProOffer) =>
    item.freeTrialMonth
      ? t('mentaCheck.trial.monthTerms', { price: item.price })
      : item.freeTrialDays
        ? t('mentaCheck.trial.liveTerms', {
            days: item.freeTrialDays,
            price: item.price,
          })
        : item.plan === 'annual'
          ? t('commerce.proJourney.annualTerms', { price: item.price })
          : item.introPrice
            ? t('commerce.proJourney.introTerms', {
                intro: item.introPrice,
                price: item.price,
              })
            : t('commerce.proJourney.weeklyTerms', { price: item.price });
  const next = () => {
    if (page === 'benefits') setPage('plans');
    else if (page === 'plans' && offer) setPage('offer');
    else if (page === 'offer' && offer) {
      trackProductEvent('Paywall Journey', {
        stage: 'purchase_tapped',
        context,
        plan: offer.plan,
      });
      onPurchase(offer.plan);
    }
  };
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + mentaSpacing[2],
          paddingBottom: Math.max(insets.bottom, mentaSpacing[5]),
        },
      ]}
      testID="pro-offer-journey"
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            showsBack ? t('commerce.proJourney.back') : closeLabel
          }
          hitSlop={10}
          onPress={() => (showsBack ? setPage('plans') : onClose())}
          style={({ pressed }) => [
            styles.headerControl,
            pressed && styles.pressed,
          ]}
          testID="pro-journey-back"
        >
          {showsBack || context === 'onboarding' ? (
            <ChevronLeftIcon size={22} color={mentaColors.text.muted} />
          ) : (
            <XIcon size={22} color={mentaColors.text.muted} />
          )}
        </Pressable>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: PAGES.length, now: stepIndex + 1 }}
          style={styles.progress}
        >
          {PAGES.map((item, index) => (
            <View
              key={item}
              style={[
                styles.progressStep,
                index <= stepIndex && { backgroundColor: accent },
              ]}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('commerce.proJourney.restore')}
          disabled={restoring}
          hitSlop={10}
          onPress={onRestore}
          style={({ pressed }) => pressed && styles.pressed}
          testID="pro-journey-restore"
        >
          <Text style={styles.restore}>
            {t('commerce.proJourney.restoreShort')}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        key={page}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        indicatorStyle="white"
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.pageContent}>
          {page === 'benefits' ? (
            <>
              <MentaMascot
                state="pro-crown"
                size="hero"
                style={styles.mascot}
              />
              <Text
                style={[styles.title, styles.centred]}
                accessibilityRole="header"
              >
                {t('commerce.proJourney.title')}
              </Text>
              <Text style={[styles.lead, styles.centred]}>
                {context === 'onboarding' || context === 'menta_check'
                  ? t('mentaCheck.pro.benefitBody')
                  : t('commerce.proJourney.subtitle')}
              </Text>
              <View style={styles.benefits}>
                <Benefit
                  icon={
                    <Image
                      source={require('@/assets/images/paywall/pro-benefit-check.png')}
                      style={styles.benefitAsset}
                      resizeMode="contain"
                    />
                  }
                  title={t('mentaCheck.pro.benefitTitle')}
                  detail={t('mentaCheck.pro.benefitBody')}
                />
                <Benefit
                  icon={
                    <Image
                      source={require('@/assets/images/paywall/pro-benefit-momenta.png')}
                      style={styles.benefitAsset}
                      resizeMode="contain"
                    />
                  }
                  title={t('commerce.proJourney.momenta')}
                  detail={t('commerce.proJourney.momentaDetail')}
                />
                <Benefit
                  icon={
                    <Image
                      source={require('@/assets/images/paywall/pro-benefit-capacity.png')}
                      style={styles.benefitAsset}
                      resizeMode="contain"
                    />
                  }
                  title={t('commerce.proJourney.capacity')}
                  detail={
                    context === 'onboarding'
                      ? t('onboarding.paywall.capacity')
                      : t('commerce.proJourney.capacityDetail')
                  }
                />
                <Benefit
                  icon={
                    <Image
                      source={require('@/assets/images/paywall/pro-benefit-no-ads.png')}
                      style={styles.benefitAsset}
                      resizeMode="contain"
                    />
                  }
                  title={t('commerce.proJourney.ads')}
                  detail={t('commerce.proJourney.adsDetail')}
                />
              </View>
            </>
          ) : page === 'plans' ? (
            <>
              <Text style={styles.srOnly} accessibilityRole="header">
                {t('commerce.proJourney.choose')}
              </Text>
              <MentaNarrator
                state="pro-crown"
                message={t('commerce.proJourney.planQuestion')}
                testID="pro-plan-narrator"
              />
              {loading ? (
                <View
                  accessible
                  accessibilityLabel={t('commerce.proJourney.loading')}
                  accessibilityRole="progressbar"
                  style={styles.options}
                >
                  <SkeletonLoader height={136} width="100%" />
                  <SkeletonLoader height={136} width="100%" />
                </View>
              ) : unavailable || !offers.length ? (
                <AppInlineNotice
                  title={t('commerce.proJourney.unavailable')}
                  description={t('commerce.proJourney.retryDetail')}
                  actionLabel={t('commerce.proJourney.retry')}
                  onAction={onRetry}
                />
              ) : (
                <View style={styles.plans} accessibilityRole="radiogroup">
                  {(context === 'menta_check' || context === 'onboarding'
                    ? [weeklyOffer, annualOffer]
                    : [annualOffer, weeklyOffer]
                  )
                    .filter((item): item is ProOffer => Boolean(item))
                    .map(item => (
                      <PlanCard
                        key={item.plan}
                        offer={item}
                        locale={locale}
                        selected={selected === item.plan}
                        savings={item.plan === 'annual' ? savings : null}
                        renewalTerms={terms(item)}
                        onPress={() => setSelected(item.plan)}
                      />
                    ))}
                </View>
              )}
            </>
          ) : offer ? (
            <>
              <MentaMascot
                state={offer.introPrice ? 'momenta-gift' : 'pro-crown'}
                size="xl"
                style={styles.mascot}
              />
              <Text
                style={[styles.title, styles.centred]}
                accessibilityRole="header"
              >
                {t(
                  offer.introPrice
                    ? 'commerce.proJourney.introTitle'
                    : 'commerce.proJourney.confirmTitle'
                )}
              </Text>
              <Text style={[styles.lead, styles.centred]}>
                {context === 'challenge'
                  ? t('commerce.proJourney.backToPromise')
                  : context === 'group'
                    ? t('commerce.proJourney.backToGroup')
                    : t('commerce.proJourney.allIncluded')}
              </Text>
              <View style={styles.receipt}>
                <ReceiptRow
                  label={t('commerce.proJourney.today')}
                  value={
                    offer.freeTrialDays || offer.freeTrialMonth
                      ? t('mentaCheck.trial.freeToday')
                      : (offer.introPrice ?? offer.price)
                  }
                  strong
                />
                <ReceiptRow
                  label={t('commerce.proJourney.momentaRow')}
                  value={
                    offer.plan === 'annual'
                      ? t('commerce.proJourney.momentaYear', {
                          amount:
                            ECONOMY_CONTRACT_V1.pro.annualCredits.toLocaleString(),
                        })
                      : t('commerce.proJourney.momentaWeek', {
                          amount:
                            ECONOMY_CONTRACT_V1.pro.weeklyCredits.toLocaleString(),
                        })
                  }
                  accent
                />
                <ReceiptRow
                  label={t('commerce.proJourney.cancelRow')}
                  value={t('commerce.proJourney.cancelAnytime')}
                  last
                />
              </View>
              <View style={styles.benefit}>
                <Text style={styles.heading}>
                  {t('commerce.proJourney.renewal')}
                </Text>
                <Text style={styles.body}>{terms(offer)}</Text>
                <Text style={styles.body}>
                  {t('commerce.proJourney.cancel')}
                </Text>
              </View>
            </>
          ) : null}
          {page === 'offer' ? (
            <View style={styles.secondaryActions}>{legalLinks}</View>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {page === 'offer' && offer ? (
          <Text style={styles.detail}>{terms(offer)}</Text>
        ) : page === 'plans' ? (
          <Text style={[styles.detail, styles.centred]}>
            {t('commerce.proJourney.cancelInSettings')}
          </Text>
        ) : null}
        <AppButton
          title={t(
            page === 'benefits'
              ? 'commerce.proJourney.seePlans'
              : page === 'plans'
                ? selected === 'weekly'
                  ? 'commerce.proJourney.continueWeekly'
                  : 'commerce.proJourney.continueYearly'
                : offer?.freeTrialDays || offer?.freeTrialMonth
                  ? 'mentaCheck.trial.start'
                  : 'commerce.proJourney.subscribe'
          )}
          variant="accent"
          size="large"
          fullWidth
          disabled={page !== 'benefits' && (!offer || loading || unavailable)}
          onPress={next}
        />
        {(context !== 'onboarding' && onContinueFree) || page === 'benefits' ? (
          <AppButton
            title={
              context === 'onboarding'
                ? t('commerce.proJourney.back')
                : onContinueFree
                  ? t('commerce.proJourney.continueFree')
                  : t('commerce.proJourney.stayFree')
            }
            variant="ghost"
            size="large"
            onPress={
              context === 'onboarding' ? onClose : (onContinueFree ?? onClose)
            }
            disabled={freeDisabled}
          />
        ) : null}
        {page === 'plans' ? legalLinks : null}
      </View>
    </View>
  );
}

/** Paper J02 plan card: name and terms, per-week price, Momenta, radio. */
function PlanCard({
  offer,
  locale,
  selected,
  savings,
  renewalTerms,
  onPress,
}: {
  offer: ProOffer;
  locale: string;
  selected: boolean;
  savings: number | null;
  /** The exact store renewal terms, always read out with the choice. */
  renewalTerms: string;
  onPress: () => void;
}) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const theme = useTheme();
  // Paper J02's violet for the default look; an equipped theme supplies its
  // own tint, edge and mark, like every other choice in the app.
  const palette = resolveChoicePalette(theme.colors);
  const defaultLook = theme.colors.border.focus === mentaColors.action;
  const tone = {
    fill: defaultLook && theme.isDark ? '#231B33' : palette.selectedFill,
    edge: defaultLook ? mentaColors.action : palette.selectedBorder,
    ledge: defaultLook ? '#7750B6' : palette.mark,
    rule: defaultLook && theme.isDark ? '#3A3050' : palette.selectedBorder,
    mark: palette.mark,
    onMark: palette.onMark,
  };
  const annual = offer.plan === 'annual';
  const perWeek =
    annual && offer.amount
      ? (formatLikeStorePrice(offer.price, weeklyEquivalent(offer.amount)) ??
        (offer.currencyCode
          ? formatStorePrice(
              weeklyEquivalent(offer.amount),
              offer.currencyCode,
              locale
            )
          : null))
      : null;
  // Yearly leads with its weekly cost when the store gives a number; the
  // full yearly price always stays on the card.
  const headline = annual
    ? (perWeek ?? offer.price)
    : offer.freeTrialMonth || offer.freeTrialDays
      ? t('mentaCheck.trial.freeToday')
      : (offer.introPrice ?? offer.price);
  const caption = annual
    ? perWeek
      ? t('commerce.proJourney.aWeek')
      : null
    : offer.freeTrialMonth
      ? t('mentaCheck.trial.monthCaption')
      : offer.freeTrialDays
        ? t('mentaCheck.trial.daysCaption', { days: offer.freeTrialDays })
        : offer.introPrice
          ? t('commerce.proJourney.firstWeekCaption')
          : t('commerce.proJourney.aWeek');
  const terms = annual
    ? t('commerce.proJourney.yearlyPrice', { price: offer.price })
    : offer.freeTrialMonth || offer.freeTrialDays
      ? t('commerce.proJourney.thenPerWeek', { price: offer.price })
      : offer.introPrice
        ? t('commerce.proJourney.thenPerWeek', { price: offer.price })
        : t('commerce.proJourney.renewsWeekly');
  const momenta = annual
    ? t('commerce.proJourney.momentaAcrossYear', {
        amount: ECONOMY_CONTRACT_V1.pro.annualCredits.toLocaleString(locale),
      })
    : t('commerce.proJourney.momentaEveryWeek', {
        amount: ECONOMY_CONTRACT_V1.pro.weeklyCredits.toLocaleString(locale),
      });
  const title = annual
    ? t('commerce.proJourney.yearlyTitle')
    : t('commerce.proJourney.weeklyTitle');

  return (
    <View
      style={[styles.planLedge, selected && { backgroundColor: tone.ledge }]}
    >
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={[
          title,
          savings
            ? t('commerce.proJourney.savePercent', { percent: savings })
            : null,
          headline,
          caption,
          terms,
          momenta,
          renewalTerms,
        ]
          .filter(Boolean)
          .join('. ')}
        onPress={onPress}
        testID={`pro-plan-${offer.plan}`}
      >
        <View
          style={[
            styles.plan,
            selected && { backgroundColor: tone.fill, borderColor: tone.edge },
          ]}
        >
          <View style={styles.planTop}>
            <View style={styles.planName}>
              <Text style={styles.planTitle}>{title}</Text>
              <Text style={styles.planTerms}>{terms}</Text>
            </View>
            <View style={styles.planPrice}>
              <Text style={styles.planHeadline}>{headline}</Text>
              {caption ? (
                <Text style={styles.planCaption}>{caption}</Text>
              ) : null}
            </View>
          </View>
          <View
            style={[
              styles.planRule,
              selected && { backgroundColor: tone.rule },
            ]}
          />
          <View style={styles.planBottom}>
            <Text style={styles.planMomenta}>{momenta}</Text>
            <View
              style={[
                styles.radio,
                selected && {
                  backgroundColor: tone.mark,
                  borderColor: tone.mark,
                },
              ]}
            >
              {selected ? <CheckIcon size={14} color={tone.onMark} /> : null}
            </View>
          </View>
          {savings ? (
            <View style={[styles.badge, { backgroundColor: tone.mark }]}>
              <Text style={[styles.badgeText, { color: tone.onMark }]}>
                {t('commerce.proJourney.savePercent', { percent: savings })}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function Benefit({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  return (
    <View style={styles.benefitRow}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.benefitIcon}
      >
        {icon}
      </View>
      <View style={styles.benefitCopy}>
        <Text style={styles.heading}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </View>
  );
}

function ReceiptRow({
  label,
  value,
  strong = false,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
  last?: boolean;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const accentColor = useTheme().colors.accent.primary;
  return (
    <View style={[styles.receiptRow, last && styles.receiptRowLast]}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text
        style={[
          styles.receiptValue,
          strong && styles.receiptValueStrong,
          accent && [styles.receiptValueAccent, { color: accentColor }],
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    header: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingLeft: 20,
      paddingRight: mentaSpacing[6],
    },
    headerControl: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
    progress: { flex: 1, flexDirection: 'row', gap: 6 },
    progressStep: {
      flex: 1,
      height: 6,
      borderRadius: mentaRadii.round,
      backgroundColor: mentaColors.raised,
    },
    restore: {
      ...mentaTypography.bodySmallMedium,
      color: mentaColors.text.muted,
    },
    plans: { gap: 16, paddingTop: 18 },
    planLedge: {
      borderRadius: 20,
      paddingBottom: 3,
      backgroundColor: mentaColors.raised,
    },
    plan: {
      padding: 20,
      gap: 14,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: mentaColors.border,
      backgroundColor: mentaColors.raised,
    },
    planTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: mentaSpacing[3],
    },
    planName: { flex: 1, minWidth: 0, gap: 4 },
    planTitle: {
      ...mentaTypography.control,
      fontFamily: mentaTypography.bodySemibold.fontFamily,
      color: mentaColors.text.primary,
    },
    planTerms: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
    },
    planPrice: { alignItems: 'flex-end', gap: 2 },
    planHeadline: {
      fontFamily: mentaTypography.heading.fontFamily,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -0.68,
      color: mentaColors.text.primary,
    },
    planCaption: {
      ...mentaTypography.bodySmall,
      fontSize: 14,
      lineHeight: 19,
      color: mentaColors.text.secondary,
    },
    planRule: { height: 1, backgroundColor: mentaColors.border },
    planBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: mentaSpacing[3],
    },
    planMomenta: {
      ...mentaTypography.bodySmall,
      flex: 1,
      color: mentaColors.text.primary,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: mentaColors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -13,
      left: 20,
      height: 26,
      paddingHorizontal: 10,
      borderRadius: mentaRadii.round,
      justifyContent: 'center',
      backgroundColor: mentaColors.action,
    },
    badgeText: {
      ...mentaTypography.caption,
      fontFamily: mentaTypography.labelBold.fontFamily,
      color: mentaColors.canvas,
    },
    screen: {
      flex: 1,
      minHeight: 0,
      width: '100%',
      backgroundColor: mentaColors.canvas,
    },
    scroll: { flex: 1, minHeight: 0, width: '100%' },
    content: {
      flexGrow: 1,
      flexShrink: 0,
    },
    pageContent: {
      paddingHorizontal: mentaSpacing[6],
      paddingBottom: mentaSpacing[6],
      gap: mentaSpacing[5],
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
    },
    mascot: { alignSelf: 'center' },
    centred: { textAlign: 'center' },
    lead: { ...mentaTypography.lead, color: mentaColors.text.secondary },
    srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0 },
    benefits: { gap: mentaSpacing[5], paddingTop: mentaSpacing[3] },
    benefitRow: { flexDirection: 'row', gap: mentaSpacing[4] },
    benefitIcon: {
      width: 52,
      height: 52,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitAsset: { width: 52, height: 52 },
    benefitCopy: { flex: 1, minWidth: 0, gap: mentaSpacing[1] },
    receiptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: mentaSpacing[3],
      minHeight: 56,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: mentaColors.border,
    },
    receiptRowLast: { borderBottomWidth: StyleSheet.hairlineWidth },
    receiptLabel: {
      ...mentaTypography.body,
      color: mentaColors.text.secondary,
    },
    receiptValue: {
      ...mentaTypography.bodyMedium,
      color: mentaColors.text.primary,
      flexShrink: 1,
      textAlign: 'right',
    },
    receiptValueStrong: {
      ...mentaTypography.control,
      fontFamily: mentaTypography.labelBold.fontFamily,
      fontSize: 20,
      lineHeight: 26,
    },
    receiptValueAccent: { color: mentaColors.action },
    secondaryActions: { gap: mentaSpacing[2] },
    title: { ...mentaTypography.paywallHero, color: mentaColors.text.primary },
    heading: {
      ...mentaTypography.bodySemibold,
      color: mentaColors.text.primary,
    },
    body: { ...mentaTypography.body, color: mentaColors.text.secondary },
    detail: { ...mentaTypography.bodySmall, color: mentaColors.text.secondary },
    price: { ...mentaTypography.heading, color: mentaColors.text.primary },
    benefit: {
      gap: mentaSpacing[2],
      paddingVertical: mentaSpacing[4],
      borderTopWidth: 1,
      borderTopColor: mentaColors.border,
    },
    options: { gap: mentaSpacing[5] },
    receipt: { marginTop: mentaSpacing[2] },
    footer: {
      flexShrink: 0,
      paddingHorizontal: mentaSpacing[6],
      paddingTop: mentaSpacing[4],
      gap: mentaSpacing[2],
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
    },
  });
  return { styles };
};
