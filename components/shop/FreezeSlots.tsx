import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon, SnowflakeIcon } from '@/components/ui/icons';

import { tokenAlpha } from './ShopItemArt';

const VISIBLE_SLOTS = 3;

type FreezeSlotsProps = {
  /** Server-confirmed freezes the account still holds. */
  count: number;
  /** Freezes just consumed by a confirmed protected day. */
  used?: number;
  size?: number;
  /** Omit when a visible line beside the slots already states the count. */
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * Freezes as physical slots: one ice tile per freeze held, a spent tile for a
 * freeze that just protected a day, and a dashed slot when none are held.
 * There is no freeze cap, so empty slots appear only when the count is zero.
 */
export function FreezeSlots({
  count,
  used = 0,
  size = 36,
  accessibilityLabel,
  testID = 'freeze-slots',
}: FreezeSlotsProps) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const held = Math.max(0, Math.floor(count));
  const spent = Math.max(0, Math.floor(used));
  const visibleSpent = Math.min(spent, VISIBLE_SLOTS);
  const visibleHeld = Math.min(held, VISIBLE_SLOTS - visibleSpent);
  const overflow = held - visibleHeld;
  const radius = Math.round(size * 0.3);
  const tile = { width: size, height: size, borderRadius: radius };

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={
        accessibilityLabel ? 'yes' : 'no-hide-descendants'
      }
      style={styles.row}
      testID={testID}
    >
      {Array.from({ length: visibleSpent }, (_, index) => (
        <View
          key={`spent-${index}`}
          style={[styles.slot, styles.spent, tile]}
          testID={`${testID}-spent`}
        >
          <CheckIcon size={Math.round(size * 0.44)} color={mentaColors.info} />
        </View>
      ))}
      {Array.from({ length: visibleHeld }, (_, index) => (
        <View
          key={`held-${index}`}
          style={[styles.slot, styles.held, tile]}
          testID={`${testID}-held`}
        >
          <SnowflakeIcon
            size={Math.round(size * 0.52)}
            color={mentaColors.info}
          />
        </View>
      ))}
      {held === 0 ? (
        <View
          style={[styles.slot, styles.empty, tile]}
          testID={`${testID}-empty`}
        >
          <Text style={styles.emptyText}>0</Text>
        </View>
      ) : null}
      {overflow > 0 ? (
        <Text style={styles.overflow}>{`+${overflow}`}</Text>
      ) : null}
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: mentaSpacing[2],
    },
    slot: {
      alignItems: 'center',
      borderWidth: 1,
      justifyContent: 'center',
    },
    held: {
      backgroundColor: tokenAlpha(mentaColors.info, 0.16),
      borderColor: tokenAlpha(mentaColors.info, 0.5),
    },
    spent: {
      backgroundColor: 'transparent',
      borderColor: tokenAlpha(mentaColors.info, 0.3),
    },
    empty: {
      backgroundColor: 'transparent',
      borderColor: mentaColors.border,
      borderStyle: 'dashed',
      borderRadius: mentaRadii.medium,
    },
    emptyText: {
      color: mentaColors.text.muted,
      ...mentaTypography.captionMedium,
    },
    overflow: {
      color: mentaColors.info,
      ...mentaTypography.bodySmallMedium,
      fontVariant: ['tabular-nums'],
    },
  });
  return { styles };
};
