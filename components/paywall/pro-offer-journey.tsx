import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppOptionCard } from '@/components/ui/AppChoice';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
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
  context: PaywallContext;
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
            <MentaMascot state="pro-active" size="xl" style={styles.mascot} />
            <Text style={styles.title} accessibilityRole="header">
              {t('commerce.proJourney.title')}
            </Text>
            <Text style={styles.body}>{t('commerce.proJourney.subtitle')}</Text>
            <View style={styles.benefit}>
              <Text style={styles.heading}>
                {t('commerce.proJourney.capacity')}
              </Text>
              <Text style={styles.body}>
                {t('commerce.proJourney.capacityDetail')}
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.heading}>
                {t('commerce.proJourney.momenta')}
              </Text>
              <Text style={styles.body}>
                {t('commerce.proJourney.momentaDetail')}
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.heading}>{t('commerce.proJourney.ads')}</Text>
              <Text style={styles.body}>
                {t('commerce.proJourney.adsDetail')}
              </Text>
            </View>
          </>
        ) : page === 'plans' ? (
          <>
            <Text style={styles.title} accessibilityRole="header">
              {t('commerce.proJourney.choose')}
            </Text>
            <Text style={styles.body}>
              {t('commerce.proJourney.sameFeatures')}
            </Text>
            {loading ? (
              <View
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
                    onPress={() => setSelected(item.plan)}
                  >
                    <Text style={styles.price}>
                      {item.introPrice ?? item.price}
                      <Text style={styles.body}>
                        {' '}
                        {t(
                          item.plan === 'annual'
                            ? 'commerce.proJourney.perYear'
                            : item.introPrice
                              ? 'commerce.proJourney.firstWeek'
                              : 'commerce.proJourney.perWeek'
                        )}
                      </Text>
                    </Text>
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
              state={offer.introPrice ? 'momenta-gift' : 'pro-active'}
              size="lg"
              style={styles.mascot}
            />
            <Text style={styles.title} accessibilityRole="header">
              {t(
                offer.introPrice
                  ? 'commerce.proJourney.introTitle'
                  : 'commerce.proJourney.confirmTitle'
              )}
            </Text>
            <Text style={styles.body}>
              {t('commerce.proJourney.allIncluded')}
            </Text>
            <View style={styles.receipt}>
              <Text style={styles.heading}>
                {t('commerce.proJourney.today')}
              </Text>
              <Text style={styles.price}>
                {offer.introPrice ?? offer.price}
              </Text>
              <Text style={styles.body}>
                {t(
                  offer.plan === 'annual'
                    ? 'commerce.proJourney.yearAccess'
                    : 'commerce.proJourney.weekAccess'
                )}
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.heading}>
                {t('commerce.proJourney.renewal')}
              </Text>
              <Text style={styles.body}>{terms(offer)}</Text>
            </View>
            <Text style={styles.body}>{t('commerce.proJourney.cancel')}</Text>
            <Text style={styles.detail}>
              {t(
                offer.plan === 'annual'
                  ? 'commerce.proJourney.annualCredits'
                  : 'commerce.proJourney.weeklyCredits',
                {
                  amount: (offer.plan === 'annual'
                    ? ECONOMY_CONTRACT_V1.pro.annualCredits
                    : ECONOMY_CONTRACT_V1.pro.weeklyCredits
                  ).toLocaleString(),
                }
              )}
            </Text>
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
            title={t('commerce.proJourney.stayFree')}
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
  receipt: {
    paddingVertical: mentaSpacing[5],
    gap: mentaSpacing[2],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: mentaColors.border,
  },
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
