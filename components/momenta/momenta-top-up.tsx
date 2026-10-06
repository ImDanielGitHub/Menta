import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppOptionCard } from '@/components/ui/AppChoice';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { MentaMascot, type MascotState } from '@/components/ui/MentaMascot';
import { CheckIcon, CrownIcon, PlayIcon, XIcon } from '@/components/ui/icons';

import { formatAdCountdown } from '@/lib/ad-availability';
import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import { useTranslation } from '@/lib/localization/use-translation';
import { useTheme } from '@/constants/ThemeContext';

export type MomentaTopUpSubject = 'promise' | 'group' | 'join' | 'general';

/** Why the rewarded ad cannot be offered right now, when it is paused. */
export type MomentaTopUpAdRest = 'cooldown' | 'daily_limit' | null;

type Option = 'ad' | 'pro' | 'review';

type Props = {
  subject: MomentaTopUpSubject;
  /** Momenta still needed. Null when the server has not said. */
  shortfall: number | null;
  balance?: number;
  required?: number;
  adReward: number;
  /** Undefined when rewarded ads cannot pay out on this build or account. */
  onWatchAd?: () => void;
  adLoading: boolean;
  adRest: MomentaTopUpAdRest;
  /** When a resting ad can pay out again (epoch ms), for the countdown. */
  adReadyAt?: number | null;
  /** Momenta confirmed from ads while this sheet has been open. */
  credited: number;
  /** The paywall's ad outcome (receipt or one plain notice), shown under the options. */
  feedback?: React.ReactNode;
  onGoPro: () => void;
  onOpenWallet?: () => void;
  onCheckProof?: () => void;
  onClose: () => void;
};

/** Lead with the ad when a few ads close the gap; beyond that, lead with Pro. */
const AD_FIRST_MAX_ADS = 3;
const noop = () => undefined;

const {
  pro: PRO,
  review: REVIEW,
  ads: ADS,
  referral: REFERRAL,
} = ECONOMY_CONTRACT_V1;

/**
 * One sheet for every "not enough Momenta" moment: a short ad, Menta Pro, or
 * checking a friend's proof. Menta stands on the sheet edge so the moment
 * reads as a small detour, not an error.
 */
export function MomentaTopUp({
  subject,
  shortfall,
  balance,
  required,
  adReward,
  onWatchAd,
  adLoading,
  adRest,
  adReadyAt = null,
  credited,
  feedback,
  onGoPro,
  onOpenWallet,
  onCheckProof,
  onClose,
}: Props) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // The equipped theme's accent; Menta violet when none is equipped.
  const accent = useTheme().colors.accent.primary;
  const [guidePage, setGuidePage] = useState<0 | 1 | 2>(0);
  const copy = useSubjectCopy(subject);
  const cooldownCountdown = useCountdown(
    adRest === 'cooldown' ? adReadyAt : null
  );

  const remaining =
    shortfall === null ? null : Math.max(0, shortfall - credited);
  const enough = credited > 0 && remaining === 0;
  const adUsable = Boolean(onWatchAd) && !adRest;

  const adsToClose =
    remaining !== null && adReward > 0 ? Math.ceil(remaining / adReward) : null;
  // A short cooldown after an ad this person just watched keeps the ad
  // selected with a countdown (Paper M06). Opening while ads rest, or hitting
  // the daily limit, leads with Pro instead (Paper M03).
  const adResumesSoon =
    Boolean(onWatchAd) && adRest === 'cooldown' && credited > 0;
  const defaultOption: Option =
    (adUsable || adResumesSoon) &&
    (adsToClose === null || adsToClose <= AD_FIRST_MAX_ADS)
      ? 'ad'
      : 'pro';
  const [selected, setSelected] = useState<Option>(defaultOption);
  useEffect(() => {
    if (selected === 'ad' && !adUsable && !adResumesSoon) setSelected('pro');
  }, [adResumesSoon, adUsable, selected]);

  const adsNeeded =
    remaining !== null && adReward > 0 ? Math.ceil(remaining / adReward) : null;

  const title = enough
    ? t('commerce.topUp.allSet')
    : adLoading
      ? t('commerce.topUp.adding')
      : credited > 0 && remaining !== null
        ? t('commerce.topUp.inAndToGo', {
            credited: credited.toLocaleString(),
            remaining: remaining.toLocaleString(),
          })
        : remaining !== null
          ? t('commerce.topUp.toGo', { amount: remaining.toLocaleString() })
          : t('commerce.topUp.getMore');

  const body = enough
    ? copy.allSet
    : adLoading
      ? t('commerce.topUp.addingDetail')
      : adRest && onWatchAd && !adResumesSoon
        ? t('commerce.topUp.adsResting')
        : credited > 0 && adsNeeded !== null && (adUsable || adResumesSoon)
          ? adsNeeded === 1
            ? t('commerce.topUp.oneMoreAd')
            : t('commerce.topUp.moreAds', { count: adsNeeded })
          : copy.waits;

  const mascot: MascotState = enough
    ? 'momenta-gift'
    : adLoading || credited > 0
      ? 'momenta-ad-watch'
      : 'momenta-short';

  const knownRequired =
    typeof required === 'number' && required > 0 ? required : null;
  const knownBalance =
    typeof balance === 'number' && balance >= 0 ? balance + credited : null;
  const meter = useMemo(() => {
    if (knownRequired === null || knownBalance === null) return null;
    return Math.min(1, knownBalance / knownRequired);
  }, [knownBalance, knownRequired]);

  if (guidePage > 0) {
    return (
      <MomentaGuide
        page={guidePage === 1 ? 1 : 2}
        onNext={() => setGuidePage(2)}
        onGetMomenta={() => setGuidePage(0)}
        onGoPro={onGoPro}
        onClose={() => setGuidePage(0)}
      />
    );
  }

  const primary = (() => {
    if (enough) {
      return {
        title: copy.back,
        onPress: onClose,
        icon: null,
      };
    }
    if (adLoading) {
      return { title: t('commerce.topUp.addingCta'), onPress: undefined };
    }
    if (selected === 'ad' && onWatchAd && adResumesSoon) {
      // The server will not pay for another ad until the cooldown ends.
      return {
        title: cooldownCountdown
          ? t('commerce.topUp.watchAnotherIn', { time: cooldownCountdown })
          : t('commerce.topUp.watchAnotherTitle'),
        onPress: undefined,
        icon: <PlayIcon size={16} color={mentaColors.canvas} />,
      };
    }
    if (selected === 'ad' && onWatchAd) {
      return {
        title:
          credited > 0
            ? t('commerce.topUp.watchAnotherTitle')
            : t('commerce.topUp.watchCta', {
                amount: adReward.toLocaleString(),
              }),
        onPress: onWatchAd,
        icon: <PlayIcon size={16} color={mentaColors.canvas} />,
      };
    }
    if (selected === 'review' && onCheckProof) {
      return { title: t('commerce.topUp.reviewCta'), onPress: onCheckProof };
    }
    return { title: t('commerce.topUp.proCta'), onPress: onGoPro };
  })();

  return (
    <View style={styles.scrimLayer} testID="momenta-top-up">
      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, mentaSpacing[5]) },
        ]}
      >
        <View style={styles.grabber} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('commerce.topUp.notNow')}
          onPress={onClose}
          hitSlop={12}
          style={styles.close}
          testID="momenta-top-up-close"
        >
          <XIcon size={20} color={mentaColors.text.muted} />
        </Pressable>
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            accessible
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            style={styles.headline}
          >
            <Text style={styles.title} testID="momenta-top-up-title">
              {title}
            </Text>
            <Text style={styles.body}>{body}</Text>
          </View>

          {meter !== null && knownBalance !== null && knownRequired !== null ? (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: knownRequired,
                now: Math.min(knownBalance, knownRequired),
              }}
              style={styles.meterBlock}
              testID="momenta-top-up-meter"
            >
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    { backgroundColor: accent },
                    { width: `${Math.round(meter * 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.meterLabels}>
                <Text style={styles.meterHave}>
                  {t('commerce.topUp.youHave', {
                    amount: knownBalance.toLocaleString(),
                  })}
                </Text>
                <Text style={styles.meterNeed}>
                  {copy.need(knownRequired.toLocaleString())}
                </Text>
              </View>
            </View>
          ) : null}

          {enough ? (
            <AppOptionCard
              title={t('commerce.topUp.fromAds')}
              description={t('commerce.topUp.addedNow')}
              trailing={`+${credited.toLocaleString()}`}
              icon={<CheckIcon size={18} color={mentaColors.success} />}
              selected={false}
              testID="momenta-top-up-credited"
            />
          ) : adLoading ? (
            <AppOptionCard
              title={t('commerce.topUp.watchTitle')}
              description={t('commerce.topUp.addingCta')}
              trailing={`+${adReward.toLocaleString()}`}
              icon={<PlayIcon size={18} color={accent} />}
              selected
              disabled
              testID="momenta-top-up-pending"
            />
          ) : (
            <View
              accessibilityRole="radiogroup"
              style={styles.options}
              testID="momenta-top-up-options"
            >
              {onWatchAd ? (
                <AppOptionCard
                  title={
                    credited > 0
                      ? t('commerce.topUp.watchAnotherTitle')
                      : t('commerce.topUp.watchTitle')
                  }
                  description={
                    adRest === 'daily_limit'
                      ? t('commerce.topUp.watchDailyLimit')
                      : adRest === 'cooldown'
                        ? cooldownCountdown
                          ? t('commerce.topUp.watchReadyIn', {
                              time: cooldownCountdown,
                            })
                          : t('commerce.topUp.watchCooldown')
                        : t('commerce.topUp.watchDetail')
                  }
                  trailing={`+${adReward.toLocaleString()}`}
                  icon={<PlayIcon size={18} color={accent} />}
                  selected={selected === 'ad'}
                  disabled={!adUsable}
                  onPress={() => setSelected('ad')}
                  testID="momenta-top-up-option-ad"
                />
              ) : null}
              <AppOptionCard
                title={t('commerce.topUp.proTitle')}
                description={t('commerce.topUp.proDetail', {
                  amount: PRO.weeklyCredits.toLocaleString(),
                })}
                trailing={`+${PRO.weeklyCredits.toLocaleString()}`}
                icon={<CrownIcon size={18} color={accent} />}
                selected={selected === 'pro'}
                onPress={() => setSelected('pro')}
                testID="momenta-top-up-option-pro"
              />
              {onCheckProof ? (
                <AppOptionCard
                  title={t('commerce.topUp.reviewTitle')}
                  description={t('commerce.topUp.reviewDetail', {
                    amount: REVIEW.reward.toLocaleString(),
                  })}
                  trailing={`+${REVIEW.reward.toLocaleString()}`}
                  icon={<CheckIcon size={18} color={mentaColors.success} />}
                  selected={selected === 'review'}
                  onPress={() => setSelected('review')}
                  testID="momenta-top-up-option-review"
                />
              ) : null}
            </View>
          )}

          {feedback && !adLoading && !enough ? feedback : null}
        </ScrollView>

        <View style={styles.footer}>
          {selected === 'pro' && !enough && !adLoading ? (
            <Text style={styles.hint}>{t('commerce.topUp.proHint')}</Text>
          ) : adLoading ? (
            <Text style={styles.hint}>{t('commerce.topUp.safeToClose')}</Text>
          ) : null}
          <AppButton
            title={primary.title}
            onPress={primary.onPress ?? noop}
            disabled={!primary.onPress}
            leftIcon={'icon' in primary ? primary.icon : undefined}
            variant="accent"
            size="large"
            fullWidth
            testID="momenta-top-up-primary"
          />
          {onOpenWallet && !enough && !adLoading ? (
            <AppButton
              title={t('commerce.wallet.buyPack')}
              onPress={onOpenWallet}
              variant="ghost"
              fullWidth
              testID="momenta-top-up-wallet"
            />
          ) : null}
          {!enough ? (
            <View style={styles.links}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setGuidePage(1)}
                hitSlop={8}
                testID="momenta-top-up-guide"
              >
                <Text style={[styles.linkAccent, { color: accent }]}>
                  {t('commerce.topUp.whatAre')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                hitSlop={8}
                testID="momenta-top-up-not-now"
              >
                <Text style={styles.linkQuiet}>
                  {t('commerce.topUp.notNow')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View pointerEvents="none" style={styles.mascotSlot}>
          <MentaMascot
            state={mascot}
            size="xl"
            testID="momenta-top-up-mascot"
          />
        </View>
      </View>
    </View>
  );
}

/** Every subject spelled out, so each translation key stays statically provable. */
/** "1:42" until `readyAt`, ticking each second; null when nothing is resting. */
function useCountdown(readyAt: number | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (readyAt === null) return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [readyAt]);
  if (readyAt === null || readyAt <= now) return null;
  return formatAdCountdown(readyAt, now);
}

function useSubjectCopy(subject: MomentaTopUpSubject) {
  const { t } = useTranslation();
  switch (subject) {
    case 'promise':
      return {
        allSet: t('commerce.topUp.allSet.promise'),
        waits: t('commerce.topUp.waits.promise'),
        back: t('commerce.topUp.back.promise'),
        need: (amount: string) => t('commerce.topUp.need.promise', { amount }),
      };
    case 'group':
      return {
        allSet: t('commerce.topUp.allSet.group'),
        waits: t('commerce.topUp.waits.group'),
        back: t('commerce.topUp.back.group'),
        need: (amount: string) => t('commerce.topUp.need.group', { amount }),
      };
    case 'join':
      return {
        allSet: t('commerce.topUp.allSet.join'),
        waits: t('commerce.topUp.waits.join'),
        back: t('commerce.topUp.back.join'),
        need: (amount: string) => t('commerce.topUp.need.join', { amount }),
      };
    default:
      return {
        allSet: t('commerce.topUp.allSet.general'),
        waits: t('commerce.topUp.waits.general'),
        back: t('commerce.topUp.back.general'),
        need: (amount: string) => t('commerce.topUp.need.general', { amount }),
      };
  }
}

type GuideProps = {
  page: 1 | 2;
  onNext: () => void;
  onGetMomenta: () => void;
  onGoPro: () => void;
  onOpenWallet?: () => void;
  onClose: () => void;
};

const streakGrants = ECONOMY_CONTRACT_V1.challengeMilestones;

/** Two short pages: what Momenta are for, then how people earn them. */
function MomentaGuide({
  page,
  onNext,
  onGetMomenta,
  onGoPro,
  onClose,
}: GuideProps) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accent = useTheme().colors.accent.primary;
  const costs = ECONOMY_CONTRACT_V1.costs;

  const rows =
    page === 1
      ? [
          {
            label: t('commerce.momentaGuide.promise'),
            detail: t('commerce.momentaGuide.firstFree'),
            value: costs.create_challenge.toLocaleString(),
          },
          {
            label: t('commerce.momentaGuide.group'),
            detail: t('commerce.momentaGuide.firstFree'),
            value: costs.create_group.toLocaleString(),
          },
          {
            label: t('commerce.momentaGuide.join'),
            detail: t('commerce.momentaGuide.firstJoinFree'),
            value: costs.join_group.toLocaleString(),
          },
          {
            label: t('commerce.momentaGuide.free'),
            detail: t('commerce.momentaGuide.alwaysFree'),
            value: t('commerce.momentaGuide.freeValue'),
            free: true,
          },
        ]
      : [
          {
            label: t('commerce.momentaGuide.streak'),
            detail: t('commerce.momentaGuide.streakDetail', {
              days: streakGrants.map(grant => grant.days).join(', '),
            }),
            value: t('commerce.momentaGuide.range', {
              min: streakGrants[0].momenta.toLocaleString(),
              max: streakGrants[
                streakGrants.length - 1
              ].momenta.toLocaleString(),
            }),
          },
          {
            label: t('commerce.momentaGuide.review'),
            detail: t('commerce.momentaGuide.perDay', {
              count: REVIEW.dailyLimit,
            }),
            value: `+${REVIEW.reward.toLocaleString()}`,
          },
          {
            label: t('commerce.momentaGuide.invite'),
            detail: t('commerce.momentaGuide.perYear', {
              count: REFERRAL.annualCap,
            }),
            value: `+${REFERRAL.reward.toLocaleString()}`,
          },
          {
            label: t('commerce.momentaGuide.ad'),
            detail: t('commerce.momentaGuide.perDay', {
              count: ADS.dailyLimit,
            }),
            value: `+${ADS.reward.toLocaleString()}`,
          },
        ];

  return (
    <View
      style={[
        styles.guide,
        {
          paddingTop: insets.top + mentaSpacing[2],
          paddingBottom: Math.max(insets.bottom, mentaSpacing[5]),
        },
      ]}
      testID={`momenta-guide-${page}`}
    >
      <View style={styles.guideHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('commerce.momentaGuide.close')}
          onPress={onClose}
          hitSlop={12}
          style={styles.guideClose}
        >
          <XIcon size={22} color={mentaColors.text.muted} />
        </Pressable>
        <View style={styles.pager} accessibilityElementsHidden>
          <View
            style={[
              styles.pagerDot,
              page === 1 && [styles.pagerActive, { backgroundColor: accent }],
            ]}
          />
          <View
            style={[
              styles.pagerDot,
              page === 2 && [styles.pagerActive, { backgroundColor: accent }],
            ]}
          />
        </View>
        <View style={styles.guideClose} />
      </View>
      <ScrollView
        contentContainerStyle={styles.guideContent}
        showsVerticalScrollIndicator={false}
      >
        <MentaMascot
          state={page === 1 ? 'momenta-gift' : 'welcome-back'}
          size="hero"
          style={styles.guideMascot}
        />
        <Text accessibilityRole="header" style={styles.guideTitle}>
          {page === 1
            ? t('commerce.momentaGuide.forTitle')
            : t('commerce.momentaGuide.earnTitle')}
        </Text>
        <Text style={styles.guideBody}>
          {page === 1
            ? t('commerce.momentaGuide.forBody')
            : t('commerce.momentaGuide.earnBody')}
        </Text>
        <View style={styles.guideRows}>
          {rows.map(row => (
            <View key={row.label} style={styles.guideRow}>
              <View style={styles.guideRowCopy}>
                <Text style={styles.guideRowLabel}>{row.label}</Text>
                <Text style={styles.guideRowDetail}>{row.detail}</Text>
              </View>
              <Text
                style={[
                  styles.guideRowValue,
                  page === 2 && [styles.guideRowValueEarn, { color: accent }],
                  'free' in row && row.free ? styles.guideRowValueFree : null,
                ]}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.guideFooter}>
        <AppButton
          title={
            page === 1
              ? t('commerce.momentaGuide.howCta')
              : t('commerce.momentaGuide.getCta')
          }
          onPress={page === 1 ? onNext : onGetMomenta}
          variant="accent"
          size="large"
          fullWidth
          testID="momenta-guide-primary"
        />
        {page === 2 ? (
          <Pressable accessibilityRole="button" onPress={onGoPro} hitSlop={8}>
            <Text style={[styles.linkAccent, { color: accent }]}>
              {t('commerce.momentaGuide.orPro', {
                amount: PRO.weeklyCredits.toLocaleString(),
              })}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const SHEET_RADIUS = 28;
const MASCOT_SIZE = 180;
const MASCOT_OVERLAP = 96;

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    scrimLayer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: mentaColors.surface,
      borderTopLeftRadius: SHEET_RADIUS,
      borderTopRightRadius: SHEET_RADIUS,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: mentaColors.border,
      paddingTop: mentaSpacing[3],
      paddingHorizontal: mentaSpacing[6],
      maxHeight: '88%',
      marginTop: MASCOT_OVERLAP,
    },
    grabber: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: mentaRadii.round,
      backgroundColor: '#3A3B3B',
    },
    close: {
      position: 'absolute',
      top: mentaSpacing[4],
      right: mentaSpacing[5],
      zIndex: 2,
    },
    mascotSlot: {
      position: 'absolute',
      top: -MASCOT_OVERLAP,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    sheetContent: {
      paddingTop: MASCOT_SIZE - MASCOT_OVERLAP + mentaSpacing[1],
      gap: mentaSpacing[5],
    },
    headline: {
      alignItems: 'center',
      gap: mentaSpacing[2],
    },
    title: {
      ...mentaTypography.paywallHero,
      color: mentaColors.text.primary,
      textAlign: 'center',
    },
    body: {
      ...mentaTypography.lead,
      color: mentaColors.text.secondary,
      textAlign: 'center',
    },
    meterBlock: {
      gap: mentaSpacing[2],
    },
    meterTrack: {
      height: 12,
      borderRadius: mentaRadii.round,
      backgroundColor: '#232424',
      overflow: 'hidden',
    },
    meterFill: {
      height: 12,
      borderRadius: mentaRadii.round,
      backgroundColor: mentaColors.action,
    },
    meterLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: mentaSpacing[3],
    },
    meterHave: {
      ...mentaTypography.bodySmallMedium,
      color: mentaColors.text.primary,
    },
    meterNeed: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.muted,
    },
    options: {
      gap: mentaSpacing[3],
    },
    footer: {
      gap: mentaSpacing[3],
      paddingTop: mentaSpacing[5],
    },
    hint: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
      textAlign: 'center',
    },
    links: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: mentaSpacing[1],
      minHeight: 44,
      alignItems: 'center',
    },
    linkAccent: {
      ...mentaTypography.bodyMedium,
      color: mentaColors.action,
      textAlign: 'center',
    },
    linkQuiet: {
      ...mentaTypography.bodyMedium,
      color: mentaColors.text.muted,
    },
    guide: {
      flex: 1,
      backgroundColor: mentaColors.canvas,
    },
    guideHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: mentaSpacing[5],
      minHeight: 44,
    },
    guideClose: {
      width: 44,
      height: 44,
      justifyContent: 'center',
    },
    pager: {
      flexDirection: 'row',
      gap: mentaSpacing[2],
      alignItems: 'center',
    },
    pagerDot: {
      width: 8,
      height: 8,
      borderRadius: mentaRadii.round,
      backgroundColor: '#3A3B3B',
    },
    pagerActive: {
      width: 22,
      backgroundColor: mentaColors.action,
    },
    guideContent: {
      paddingHorizontal: mentaSpacing[6],
      paddingBottom: mentaSpacing[6],
      gap: mentaSpacing[3],
    },
    guideMascot: {
      alignSelf: 'center',
    },
    guideTitle: {
      ...mentaTypography.paywallHero,
      color: mentaColors.text.primary,
      textAlign: 'center',
    },
    guideBody: {
      ...mentaTypography.lead,
      color: mentaColors.text.secondary,
      textAlign: 'center',
    },
    guideRows: {
      marginTop: mentaSpacing[4],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: mentaColors.border,
    },
    guideRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[3],
      minHeight: 60,
      paddingVertical: mentaSpacing[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: mentaColors.border,
    },
    guideRowCopy: {
      flex: 1,
      minWidth: 0,
    },
    guideRowLabel: {
      ...mentaTypography.bodyMedium,
      color: mentaColors.text.primary,
    },
    guideRowDetail: {
      ...mentaTypography.caption,
      color: mentaColors.text.muted,
    },
    guideRowValue: {
      ...mentaTypography.control,
      fontFamily: mentaTypography.labelBold.fontFamily,
      color: mentaColors.text.primary,
      flexShrink: 0,
    },
    guideRowValueEarn: {
      color: mentaColors.action,
    },
    guideRowValueFree: {
      color: mentaColors.success,
    },
    guideFooter: {
      paddingHorizontal: mentaSpacing[6],
      gap: mentaSpacing[4],
      alignItems: 'center',
    },
  });
  return { styles };
};
