import {
  type MentaPalette,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { TodaySpeechBubble } from '@/components/today/TodaySpeechBubble';

import { useAuthStore } from '@/store/auth-store';
import { getOnboardingInvitationReviewGate } from '@/lib/navigation/onboarding-invitation-lifecycle';
import { useTranslation } from '@/lib/localization/use-translation';
import { trackProductEvent } from '@/lib/posthog';
import {
  claimFirstMissRecovery,
  FirstMissRecoveryError,
  readFirstMissRecovery,
  type FirstMissOffer,
} from '@/lib/streak/first-miss-recovery';

/** A deliberate recovery action; it never interrupts invitation or review. */
export function FirstMissRecovery({
  ready,
  onRecovered,
  onVisibilityChange,
}: {
  ready: boolean;
  onRecovered: () => Promise<void>;
  onVisibilityChange: (visible: boolean) => void;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const ownerId = useAuthStore(state => state.user?.id);
  const { t, locale } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [offer, setOffer] = useState<FirstMissOffer | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmedStreak, setConfirmedStreak] = useState<number | null>(null);
  const [error, setError] = useState<'unconfirmed' | 'unavailable' | null>(
    null
  );
  const inFlight = useRef(false);
  const dismissed = useRef(false);
  const activeOwner = useRef(ownerId);
  activeOwner.current = ownerId;
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setVisible(false);
        onVisibilityChange(false);
      };
    }, [onVisibilityChange])
  );
  useEffect(() => {
    dismissed.current = false;
    setOffer(null);
    setVisible(false);
    setConfirmedStreak(null);
    setError(null);
    onVisibilityChange(false);
  }, [ownerId, onVisibilityChange]);
  useEffect(() => {
    if (!ready || !focused || !ownerId || confirmedStreak !== null) return;
    const gate = getOnboardingInvitationReviewGate(ownerId);
    if (gate === 'pending' || gate === 'loading') return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    void readFirstMissRecovery(controller.signal)
      .then(result => {
        if (!controller.signal.aborted && activeOwner.current === ownerId) {
          setOffer(result);
          if (result && !dismissed.current) setVisible(true);
        }
      })
      .catch(() => {
        /* Optional offer never blocks the existing Today read. */
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [focused, ownerId, ready, confirmedStreak]);
  // A server-issued gift stops being an offer at its local-day deadline.
  // Keep a successful claim receipt visible even if the deadline passes later.
  useEffect(() => {
    if (!offer || confirmedStreak !== null) return;
    const expires = Date.parse(offer.expiresAt);
    if (!Number.isFinite(expires)) return;
    const timer = setTimeout(
      () => {
        if (!inFlight.current) {
          setVisible(false);
          setOffer(null);
        }
      },
      Math.min(Math.max(0, expires - Date.now()), 2_147_483_647)
    );
    return () => clearTimeout(timer);
  }, [offer, confirmedStreak]);
  const offerIsCurrent = Boolean(
    offer &&
    Number.isFinite(Date.parse(offer.expiresAt)) &&
    Date.parse(offer.expiresAt) > Date.now()
  );
  const showing =
    Boolean(offer) &&
    (confirmedStreak !== null || offerIsCurrent) &&
    visible &&
    focused;
  useEffect(() => {
    onVisibilityChange(showing);
    if (showing)
      trackProductEvent('First Miss Recovery', {
        stage: 'opened',
        benefit: 'free_freeze',
      });
  }, [onVisibilityChange, showing]);
  const close = () => {
    if (inFlight.current) return;
    dismissed.current = true;
    setVisible(false);
    onVisibilityChange(false);
    if (confirmedStreak !== null) setOffer(null);
    trackProductEvent('First Miss Recovery', {
      stage: 'dismissed',
      benefit: 'free_freeze',
    });
  };
  const claim = async () => {
    if (!offer || !ownerId || inFlight.current) return;
    const claimOwner = ownerId;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    trackProductEvent('First Miss Recovery', {
      stage: 'claim_started',
      benefit: 'free_freeze',
    });
    try {
      const streak = await claimFirstMissRecovery(offer);
      if (activeOwner.current !== claimOwner) return;
      setConfirmedStreak(streak);
      trackProductEvent('First Miss Recovery', {
        stage: 'confirmed',
        benefit: 'free_freeze',
      });
      // Confirmation remains valid even when the following Today refresh fails.
      void onRecovered().catch(() => undefined);
    } catch (cause) {
      if (activeOwner.current !== claimOwner) return;
      setError(
        cause instanceof FirstMissRecoveryError ? cause.reason : 'unconfirmed'
      );
      trackProductEvent('First Miss Recovery', {
        stage: 'failed',
        benefit: 'free_freeze',
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const confirmed = confirmedStreak !== null;
  if (!offer || (!confirmed && !offerIsCurrent)) return null;
  if (!visible || !focused) {
    // "Start over" is not final while the gift is still valid.
    return (
      <AppButton
        title={t('commerce.firstMiss.open')}
        variant="outline"
        textStyle={styles.secondaryText}
        fullWidth
        onPress={() => setVisible(true)}
      />
    );
  }
  const weekday = formatWeekday(offer.localDay, locale);
  const count = offer.previousStreak;
  return (
    <View
      accessibilityLabel={t('commerce.firstMiss.accessibility')}
      style={styles.panel}
      testID="first-miss-recovery"
    >
      <View style={styles.stage}>
        {!confirmed ? (
          <TodaySpeechBubble
            testID="first-miss-bubble"
            text={t('commerce.firstMiss.bubble', { weekday })}
          />
        ) : null}
        <MentaMascot
          state={confirmed ? 'promise-confirmed' : 'first-miss-recovery'}
          size="xl"
        />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {confirmed
          ? t('commerce.firstMiss.titleConfirmed')
          : count > 0
            ? t('commerce.firstMiss.decisionTitle', { count })
            : t('commerce.firstMiss.titleOffer')}
      </Text>
      <Text style={styles.body}>
        {confirmed
          ? confirmedStreak > 0
            ? t('commerce.firstMiss.bodyConfirmedStreak', {
                count: confirmedStreak,
              })
            : t('commerce.firstMiss.bodyConfirmed')
          : count > 0
            ? t('commerce.firstMiss.decisionBody', { weekday, count })
            : t('commerce.firstMiss.decisionBodyNoCount', { weekday })}
      </Text>
      {confirmed ? (
        <Text style={styles.note}>{t('commerce.firstMiss.noteConfirmed')}</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error === 'unavailable'
            ? t('commerce.firstMiss.errorUnavailable')
            : t('commerce.firstMiss.errorUnconfirmed')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <AppButton
          title={
            confirmed
              ? t('commerce.firstMiss.backToToday')
              : t('commerce.firstMiss.keep')
          }
          variant="accent"
          size="large"
          haptic
          hapticIntent="selection"
          loading={busy}
          disabled={busy}
          fullWidth
          onPress={
            confirmed
              ? () => {
                  setVisible(false);
                  onVisibilityChange(false);
                  setOffer(null);
                }
              : () => {
                  void claim();
                }
          }
          testID="first-miss-keep"
        />
        {!confirmed ? (
          <AppButton
            title={t('commerce.firstMiss.startOver')}
            variant="outline"
            size="large"
            textStyle={styles.secondaryText}
            fullWidth
            disabled={busy}
            onPress={close}
            testID="first-miss-start-over"
          />
        ) : null}
      </View>
    </View>
  );
}

const formatWeekday = (localDay: string, locale: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match) return localDay;
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  ).toLocaleDateString(locale, { weekday: 'long', timeZone: 'UTC' });
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    panel: { gap: mentaSpacing[3], paddingBottom: mentaSpacing[4] },
    stage: { alignItems: 'center', gap: mentaSpacing[1] },
    title: {
      ...mentaTypography.journeyTitle,
      color: mentaColors.text.primary,
      marginTop: mentaSpacing[3],
      textAlign: 'center',
    },
    body: {
      ...mentaTypography.lead,
      color: mentaColors.text.secondary,
      textAlign: 'center',
    },
    note: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.muted,
      textAlign: 'center',
    },
    error: {
      ...mentaTypography.body,
      color: mentaColors.danger,
      textAlign: 'center',
    },
    secondaryText: { color: mentaColors.action },
    actions: { gap: mentaSpacing[3], marginTop: mentaSpacing[5] },
  });
  return { styles };
};
