import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useAuthStore } from '@/store/auth-store';
import { getOnboardingInvitationReviewGate } from '@/lib/navigation/onboarding-invitation-lifecycle';
import { trackProductEvent } from '@/lib/posthog';
import {
  claimFirstMissRecovery,
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
  const ownerId = useAuthStore(state => state.user?.id);
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [offer, setOffer] = useState<FirstMissOffer | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmedStreak, setConfirmedStreak] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
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
        if (!controller.signal.aborted && activeOwner.current === ownerId)
          setOffer(result);
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
  const close = () => {
    if (inFlight.current) return;
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
        cause instanceof Error
          ? cause.message
          : 'Try again to confirm your freeze.'
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
  if (!offer || (!visible && Date.parse(offer.expiresAt) <= Date.now()))
    return null;
  const confirmed = confirmedStreak !== null;
  return (
    <>
      <AppButton
        title="Get your free streak freeze"
        variant="outline"
        fullWidth
        onPress={() => {
          setVisible(true);
          onVisibilityChange(true);
          trackProductEvent('First Miss Recovery', {
            stage: 'opened',
            benefit: 'free_freeze',
          });
        }}
      />
      <ModalCard
        visible={visible && focused}
        onClose={close}
        surface="full_screen"
        dismissOnBackdrop={!busy}
        accessibilityLabel="Your first missed day"
        testID="first-miss-recovery"
      >
        <AppScreen lane="focused" hasTabBar={false} padding={false}>
          <AppTopBar
            title="A little help"
            onBack={busy ? undefined : close}
            style={styles.topBar}
          />
          <ScrollView contentContainerStyle={styles.content}>
            <MentaMascot
              state={confirmed ? 'promise-confirmed' : 'first-miss-recovery'}
              size="hero"
              style={styles.mascot}
            />
            <Text accessibilityRole="header" style={styles.title}>
              {confirmed
                ? 'Your missed day is covered.'
                : 'Missed a day? Let’s keep going.'}
            </Text>
            <Text style={styles.promise}>{offer.challengeTitle}</Text>
            <Text style={styles.body}>
              {confirmed
                ? confirmedStreak > 0
                  ? `Your free freeze protected your ${confirmedStreak}-day streak. Add proof today to continue it.`
                  : 'Your free freeze covered the missed day. Add proof today to start building your streak.'
                : 'Missing a day normally breaks an existing streak. For your first missed day, Menta can cover it with one free streak freeze.'}
            </Text>
            <Text style={styles.note}>
              {confirmed
                ? 'The freeze covers the missed day only. It does not count as completed proof.'
                : 'This is a one-time gift. It covers yesterday, uses no Momenta, and leaves your saved freezes untouched.'}
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <AppButton
              title={confirmed ? 'Open my promise' : 'Use my free freeze'}
              variant="accent"
              loading={busy}
              disabled={busy}
              fullWidth
              onPress={
                confirmed
                  ? () => {
                      setVisible(false);
                      onVisibilityChange(false);
                      setOffer(null);
                      trackProductEvent('First Miss Recovery', {
                        stage: 'promise_opened',
                        benefit: 'free_freeze',
                      });
                      router.push({
                        pathname: '/challenges/[id]',
                        params: { id: offer.challengeId },
                      });
                    }
                  : () => {
                      void claim();
                    }
              }
            />
            <AppButton
              title={confirmed ? 'Back to Today' : 'Not now'}
              variant="ghost"
              fullWidth
              disabled={busy}
              onPress={close}
            />
          </View>
        </AppScreen>
      </ModalCard>
    </>
  );
}
const styles = StyleSheet.create({
  topBar: { paddingHorizontal: mentaSpacing[6], paddingTop: mentaSpacing[3] },
  content: { padding: mentaSpacing[6], gap: mentaSpacing[5] },
  mascot: { alignSelf: 'center', marginVertical: mentaSpacing[5] },
  title: { ...mentaTypography.journeyTitle, color: mentaColors.text.primary },
  promise: { ...mentaTypography.bodySemibold, color: mentaColors.text.primary },
  body: { ...mentaTypography.body, color: mentaColors.text.secondary },
  note: { ...mentaTypography.bodySmall, color: mentaColors.text.secondary },
  error: { ...mentaTypography.body, color: mentaColors.danger },
  actions: { padding: mentaSpacing[6], gap: mentaSpacing[2] },
});
