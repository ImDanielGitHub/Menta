import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FreezeSlots } from '@/components/shop/FreezeSlots';
import { ShopItemArt, tokenAlpha } from '@/components/shop/ShopItemArt';
import { AppButton } from '@/components/ui/AppButton';
import { ShieldCheckIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';

interface ProtectedStreakReceiptProps {
  localDay: string;
  resultingStreak: number;
  freezeUsed: boolean;
  /** Server-confirmed freezes left after this protected day. */
  freezesRemaining?: number | null;
  /** Opens the Streak Freeze in the shop. */
  onRefill?: () => void;
}

const weekday = (localDay: string, locale: string): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match) return null;

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  ).toLocaleDateString(locale, { weekday: 'long', timeZone: 'UTC' });
};

/**
 * The moment after the server confirms a protected day. When a Streak Freeze
 * did the work, the freeze is named, the remaining freezes are shown as slots
 * and the person can get another one.
 */
export const ProtectedStreakReceipt: React.FC<ProtectedStreakReceiptProps> = ({
  localDay,
  resultingStreak,
  freezeUsed,
  freezesRemaining,
  onRefill,
}) => {
  const { locale, t } = useTranslation();
  const day = weekday(localDay, locale) ?? t('today.state.outcome.missed_day');
  const count =
    resultingStreak === 1
      ? t('todayProof.streak.day', { count: resultingStreak })
      : t('todayProof.streak.days', { count: resultingStreak });
  const detail = freezeUsed
    ? t('today.state.protected.freeze_detail', {
        weekday: day,
        countCopy: t('today.state.protected.count_continues', { count }),
      })
    : t('today.state.protected.detail', {
        weekday: day,
        countCopy: t('today.state.protected.count_continues', { count }),
      });
  const title =
    freezeUsed && resultingStreak > 0
      ? t('commerce.freeze.protectedTitle', { count: resultingStreak })
      : t('today.state.protected.title');
  const remaining =
    typeof freezesRemaining === 'number' && Number.isFinite(freezesRemaining)
      ? Math.max(0, Math.floor(freezesRemaining))
      : null;

  return (
    <View style={styles.card} testID="protected-streak-receipt">
      <View
        accessible
        accessibilityLabel={t('todayProof.today.protected_accessibility', {
          detail,
        })}
        style={styles.summary}
      >
        {freezeUsed ? (
          <ShopItemArt sku="streak_freeze_basic" size={52} />
        ) : (
          <View style={styles.shield}>
            <ShieldCheckIcon color={mentaColors.info} size={24} />
          </View>
        )}
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
      </View>

      {freezeUsed && remaining !== null ? (
        <View style={styles.remainingRow}>
          <FreezeSlots
            count={remaining}
            used={1}
            size={30}
            testID="protected-freeze-slots"
          />
          <Text style={styles.remainingText}>
            {t('commerce.freeze.remaining', { count: remaining })}
          </Text>
        </View>
      ) : null}

      {freezeUsed && onRefill ? (
        <AppButton
          title={
            remaining === 0
              ? t('commerce.freeze.getFirst')
              : t('commerce.freeze.getAnother')
          }
          variant={remaining === 0 ? 'accent' : 'outline'}
          size="medium"
          fullWidth
          haptic
          hapticIntent="selection"
          textStyle={remaining === 0 ? undefined : styles.outlineText}
          onPress={onRefill}
          testID="protected-streak-refill"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: mentaColors.surface,
    borderColor: tokenAlpha(mentaColors.info, 0.4),
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    gap: mentaSpacing[4],
    marginHorizontal: mentaSpacing[6],
    marginTop: mentaSpacing[5],
    padding: mentaSpacing[4],
  },
  summary: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  shield: {
    alignItems: 'center',
    backgroundColor: tokenAlpha(mentaColors.info, 0.14),
    borderRadius: mentaRadii.medium,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  remainingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  remainingText: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.info,
    flexShrink: 1,
  },
  outlineText: {
    color: mentaColors.action,
  },
});
