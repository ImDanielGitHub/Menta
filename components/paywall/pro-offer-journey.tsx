import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppOptionCard } from '@/components/ui/AppChoice';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';
import { CoinsIcon, EyeOffIcon, ListIcon } from '@/components/ui/icons';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization/use-translation';
import { trackProductEvent } from '@/lib/posthog';
import type { PaywallContext } from '@/lib/paywall/manager';
import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';

export type ProOffer = {
  plan: 'weekly' | 'annual';
  price: string;
  introPrice?: string;
};

type Props = {
  visible: boolean;
  offers: ProOffer[];
  loading: boolean;
  unavailable: boolean;
  context: PaywallContext | 'onboarding';
  onPurchase: (plan: ProOffer['plan']) => void;
  onClose: () => void;
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
  onRetry,
  onRestore,
  restoring,
  legalLinks,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<'benefits' | 'plans' | 'offer'>('benefits');
  const [selected, setSelected] = useState<ProOffer['plan'] | null>(null);
  const offer = offers.find(item => item.plan === selected);
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
    item.plan === 'annual'
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
          paddingTop: insets.top + 64,
          paddingBottom: Math.max(insets.bottom, mentaSpacing[5]),
        },
      ]}
      testID="pro-offer-journey"
    >
      <ScrollView
        key={page}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        indicatorStyle="white"
        contentInsetAdjustmentBehavior="never"
      >
        {page !== 'benefits' ? (
          <AppButton
            title={t('commerce.proJourney.back')}
            variant="ghost"
            onPress={() => setPage(page === 'offer' ? 'plans' : 'benefits')}
          />
        ) : null}
        {page === 'benefits' ? (
          <>
            <MentaMascot state="pro-crown" size="hero" style={styles.mascot} />
            <Text
              style={[styles.title, styles.centred]}
              accessibilityRole="header"
            >
              {t('commerce.proJourney.title')}
            </Text>
            <Text style={[styles.lead, styles.centred]}>
              {context === 'onboarding'
                ? t('onboarding.paywall.required')
                : t('commerce.proJourney.subtitle')}
            </Text>
            <View style={styles.benefits}>
              <Benefit
                icon={<CoinsIcon size={18} color={mentaColors.canvas} />}
                filled
                title={t('commerce.proJourney.momenta')}
                detail={t('commerce.proJourney.momentaDetail')}
              />
              <Benefit
                icon={<ListIcon size={18} color={mentaColors.action} />}
                title={t('commerce.proJourney.capacity')}
                detail={
                  context === 'onboarding'
                    ? t('onboarding.paywall.capacity')
                    : t('commerce.proJourney.capacityDetail')
                }
              />
              <Benefit
                icon={<EyeOffIcon size={18} color={mentaColors.action} />}
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
              <View style={styles.options} accessibilityRole="radiogroup">
                {offers.map(item => (
                  <AppOptionCard
                    key={item.plan}
                    title={t(
                      item.plan === 'annual'
                        ? 'commerce.proJourney.annual'
                        : item.introPrice
                          ? 'commerce.proJourney.intro'
                          : 'commerce.proJourney.weekly'
                    )}
                    selected={selected === item.plan}
                    description={terms(item)}
                    trailing={item.introPrice ?? item.price}
                    onPress={() => setSelected(item.plan)}
                  >
                    <Text style={styles.detail}>
                      {t(
                        item.plan === 'annual'
                          ? 'commerce.proJourney.annualCredits'
                          : 'commerce.proJourney.weeklyCredits',
                        {
                          amount: (item.plan === 'annual'
                            ? ECONOMY_CONTRACT_V1.pro.annualCredits
                            : ECONOMY_CONTRACT_V1.pro.weeklyCredits
                          ).toLocaleString(),
                        }
                      )}
                    </Text>
                  </AppOptionCard>
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
                value={offer.introPrice ?? offer.price}
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
              <Text style={styles.body}>{t('commerce.proJourney.cancel')}</Text>
            </View>
          </>
        ) : null}
        {page === 'offer' ? (
          <View style={styles.secondaryActions}>
            <AppButton
              title={t('commerce.proJourney.restore')}
              variant="ghost"
              loading={restoring}
              onPress={onRestore}
            />
            {legalLinks}
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        {page === 'offer' && offer ? (
          <Text style={styles.detail}>{terms(offer)}</Text>
        ) : null}
        <AppButton
          title={t(
            page === 'benefits'
              ? 'commerce.proJourney.seePlans'
              : page === 'plans'
                ? 'commerce.proJourney.seeOffer'
                : 'commerce.proJourney.subscribe'
          )}
          variant="accent"
          size="large"
          fullWidth
          disabled={page !== 'benefits' && (!offer || loading || unavailable)}
          onPress={next}
        />
        {page === 'benefits' ? (
          <AppButton
            title={
              context === 'onboarding'
                ? t('commerce.proJourney.back')
                : t('commerce.proJourney.stayFree')
            }
            variant="ghost"
            onPress={onClose}
          />
        ) : page === 'plans' ? (
          <AppButton
            title={t('commerce.proJourney.restore')}
            variant="ghost"
            loading={restoring}
            onPress={onRestore}
          />
        ) : null}
      </View>
    </View>
  );
}

function Benefit({
  icon,
  title,
  detail,
  filled = false,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  filled?: boolean;
}) {
  return (
    <View style={styles.benefitRow}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.benefitIcon, filled && styles.benefitIconFilled]}
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
  return (
    <View style={[styles.receiptRow, last && styles.receiptRowLast]}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text
        style={[
          styles.receiptValue,
          strong && styles.receiptValueStrong,
          accent && styles.receiptValueAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    backgroundColor: mentaColors.canvas,
  },
  scroll: { flex: 1, minHeight: 0 },
  content: {
    flexGrow: 1,
    flexShrink: 0,
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
    width: 36,
    height: 36,
    borderRadius: mentaRadii.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mentaColors.actionSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.actionBorder,
  },
  benefitIconFilled: {
    backgroundColor: mentaColors.action,
    borderColor: mentaColors.action,
  },
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
  receiptLabel: { ...mentaTypography.body, color: mentaColors.text.secondary },
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
  heading: { ...mentaTypography.bodySemibold, color: mentaColors.text.primary },
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
    borderTopWidth: 1,
    borderTopColor: mentaColors.border,
  },
});
