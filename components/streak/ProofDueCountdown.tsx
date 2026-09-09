import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ClockIcon } from '@/components/ui/icons';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  DEFAULT_PROOF_DUE_TIME,
  resolveProofDueCountdown,
} from '@/lib/time/proof-due';
import { useTranslation } from '@/lib/localization';

type ProofDueCountdownProps = {
  visible: boolean;
  localDay: string | null | undefined;
  timeZone: string | null | undefined;
  preferredReminderTime?: string | null;
  dueAtIso?: string | null;
  promiseLabel?: string | null;
  variant?: 'card' | 'hero';
};

const MINUTE_MS = 60 * 1000;

export const ProofDueCountdown: React.FC<ProofDueCountdownProps> = ({
  visible,
  localDay,
  timeZone,
  preferredReminderTime,
  dueAtIso,
  promiseLabel,
  variant = 'card',
}) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!visible || !localDay || !timeZone) return undefined;

    const interval = setInterval(() => {
      setNow(new Date());
    }, MINUTE_MS);

    return () => clearInterval(interval);
  }, [localDay, timeZone, visible]);

  const state = useMemo(
    () =>
      resolveProofDueCountdown({
        now,
        localDay: localDay ?? '',
        timeZone: timeZone ?? 'UTC',
        preferredReminderTime: preferredReminderTime ?? DEFAULT_PROOF_DUE_TIME,
        dueAtIso,
        hide: !visible || !localDay || !timeZone,
      }),
    [dueAtIso, localDay, now, preferredReminderTime, timeZone, visible]
  );

  if (!state.isVisible) return null;

  const eyebrow =
    state.target === 'extension'
      ? t('todayProof.streak.extension_ends')
      : state.phase === 'due'
        ? t('todayProof.streak.reminder_in')
        : t('todayProof.streak.proof_counts');
  const helper = promiseLabel
    ? t('todayProof.streak.promise_countdown_helper', {
        promise: promiseLabel,
        helper: state.helperLabel.replace(/\.$/, ''),
      })
    : state.helperLabel;
  const durationLabel =
    state.hours === 0
      ? state.minutes === 1
        ? t('todayProof.streak.minute', { count: state.minutes })
        : t('todayProof.streak.minutes', { count: state.minutes })
      : state.remainingLabel;
  const heroSuffix =
    state.target === 'extension'
      ? t('todayProof.streak.until_extension')
      : state.phase === 'due'
        ? t('todayProof.streak.to_reminder')
        : t('todayProof.streak.until_midnight');
  const heroRemainingLabel = t('todayProof.streak.remaining_with_suffix', {
    duration: durationLabel,
    suffix: heroSuffix,
  });

  if (variant === 'hero') {
    return (
      <View
        accessibilityLabel={t('todayProof.streak.hero_accessibility', {
          eyebrow,
          remaining: heroRemainingLabel,
          helper,
        })}
        accessibilityRole="text"
        style={styles.hero}
        testID="proof-due-countdown"
      >
        <ClockIcon color={mentaColors.warning} size={24} />
        <Text style={styles.heroRemaining}>
          {state.hours === 0 ? (
            <>
              <Text style={styles.heroRemainingAccent}>{state.minutes}</Text>{' '}
              {state.minutes === 1
                ? t('todayProof.source.streak.minute_unit')
                : t('todayProof.source.streak.minutes_unit')}{' '}
              {heroSuffix}
            </>
          ) : (
            heroRemainingLabel
          )}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={t('todayProof.streak.card_accessibility', {
        eyebrow,
        remaining: state.remainingLabel,
        helper,
      })}
      accessibilityRole="text"
      style={styles.card}
      testID="proof-due-countdown"
    >
      <View style={styles.eyebrowRow}>
        <ClockIcon color={mentaColors.warning} size={22} />
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </View>
      <Text style={styles.remaining}>{state.remainingLabel}</Text>
      <Text style={styles.helper}>{helper}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  heroRemaining: {
    color: mentaColors.text.primary,
    ...mentaTypography.display,
  },
  heroRemainingAccent: { color: mentaColors.warning },
  card: {
    backgroundColor: mentaColors.canvas,
    borderColor: mentaColors.warningBorder,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    padding: mentaSpacing[5],
  },
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  eyebrow: {
    color: mentaColors.warning,
    ...mentaTypography.label,
  },
  remaining: {
    color: mentaColors.text.primary,
    ...mentaTypography.title,
  },
  helper: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
});
