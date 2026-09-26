import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { MentaMascot, type MascotState } from '@/components/ui/MentaMascot';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';
import { mentaFonts } from '@/lib/menta-fonts';
import {
  DEFAULT_PROOF_DUE_TIME,
  resolveProofDueCountdown,
} from '@/lib/time/proof-due';

const MINUTE_MS = 60 * 1000;
const LAST_HOUR_MS = 60 * MINUTE_MS;

export type TodayCountdownHeroProps = {
  localDay: string;
  timeZone: string;
  preferredReminderTime?: string | null;
  dueAtIso?: string | null;
  streak?: number | null;
  mascot: MascotState | null;
};

/**
 * Paper 19 / T01–T02: the time left today is the headline. It always counts to
 * the real deadline (midnight, or an extension), never to the reminder time,
 * and turns amber only in the last hour.
 */
export function TodayCountdownHero({
  localDay,
  timeZone,
  preferredReminderTime,
  dueAtIso,
  streak,
  mascot,
}: TodayCountdownHeroProps) {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => clearInterval(interval);
  }, []);

  const state = useMemo(
    () =>
      resolveProofDueCountdown({
        now,
        localDay,
        timeZone,
        preferredReminderTime: preferredReminderTime ?? DEFAULT_PROOF_DUE_TIME,
        dueAtIso,
        toDeadline: true,
      }),
    [dueAtIso, localDay, now, preferredReminderTime, timeZone]
  );

  if (!state.isVisible) return null;

  const remainingMs = (state.hours * 60 + state.minutes) * MINUTE_MS;
  const lastHour = remainingMs < LAST_HOUR_MS;
  const duration =
    state.hours === 0
      ? t('today.countdown.minutes', { minutes: state.minutes })
      : state.minutes === 0
        ? t('today.countdown.hours', { hours: state.hours })
        : t('today.countdown.hours_minutes', {
            hours: state.hours,
            minutes: state.minutes,
          });
  const caption =
    state.target === 'extension'
      ? t('today.countdown.left_extension')
      : lastHour && typeof streak === 'number' && streak > 0
        ? t('today.countdown.left_streak', { count: streak })
        : t('today.countdown.left_proof');
  const note =
    state.target === 'extension'
      ? t('today.countdown.note_extension')
      : lastHour
        ? t('today.countdown.note_last_hour')
        : t('today.countdown.note_midnight');
  const hidesMascot = phoneLayout.width <= 340;

  return (
    <View
      accessible
      accessibilityLabel={t('today.countdown.accessibility', {
        duration,
        caption,
        note,
      })}
      accessibilityRole="text"
      style={styles.hero}
      testID="today-countdown-hero"
    >
      <View style={styles.copy}>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.4}
          numberOfLines={1}
          style={[styles.duration, lastHour ? styles.durationUrgent : null]}
          testID="today-countdown-duration"
        >
          {duration}
        </Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      {mascot && !hidesMascot ? (
        <MentaMascot
          state={mascot}
          size={phoneLayout.isShortHeight ? 'lg' : 'xl'}
          style={styles.mascot}
        />
      ) : null}
    </View>
  );
}

/** The quiet line under the primary action on a due day. */
export function useTodayCountdownNote({
  localDay,
  timeZone,
  dueAtIso,
}: {
  localDay: string;
  timeZone: string;
  dueAtIso?: string | null;
}): string | null {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => clearInterval(interval);
  }, []);
  const state = resolveProofDueCountdown({
    now,
    localDay,
    timeZone,
    dueAtIso,
    toDeadline: true,
  });
  if (!state.isVisible) return null;
  if (state.target === 'extension') return t('today.countdown.note_extension');
  return (state.hours * 60 + state.minutes) * MINUTE_MS < LAST_HOUR_MS
    ? t('today.countdown.note_last_hour')
    : t('today.countdown.note_midnight');
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: mentaSpacing[1],
  },
  duration: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.semibold,
    fontSize: 68,
    letterSpacing: -2,
    lineHeight: 74,
  },
  durationUrgent: {
    color: mentaColors.warning,
  },
  caption: {
    ...mentaTypography.lead,
    color: mentaColors.text.secondary,
  },
  mascot: {
    flexShrink: 0,
  },
});
