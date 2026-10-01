import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ShopItemArt } from '@/components/shop/ShopItemArt';
import { ShopPressable } from '@/components/shop/ShopPressable';

import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization/use-translation';

export type BoostsRowItem = {
  sku: string;
  label: string;
  /** Visible quantity or state, for example "×2" or "In use". */
  badge: string;
  badgeTone?: 'action' | 'success' | 'empty';
  accessibilityLabel: string;
  onPress: () => void;
};

type BoostsRowProps = {
  title?: string;
  items: readonly BoostsRowItem[];
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/**
 * Owned items at a glance: square tiles with large art and the quantity the
 * account holds. Renders nothing when there is nothing to show, so it never
 * reserves an empty band on the screen.
 */
export const BoostsRow: React.FC<BoostsRowProps> = ({
  title,
  items,
  actionLabel,
  onAction,
  testID = 'owned-items-row',
}) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  if (items.length === 0) return null;

  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title ?? t('shared.boosts.title')}
        </Text>
        {actionLabel && onAction ? (
          <ShopPressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={onAction}
            pressedStyle={styles.linkPressed}
            style={styles.link}
          >
            <Text style={styles.linkText}>{actionLabel}</Text>
          </ShopPressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -phoneLayout.screenInset }}
        contentContainerStyle={[
          styles.row,
          { paddingHorizontal: phoneLayout.screenInset },
        ]}
      >
        {items.map(item => (
          <ShopPressable
            key={item.sku}
            accessibilityLabel={item.accessibilityLabel}
            onPress={item.onPress}
            pressedStyle={styles.tilePressed}
            style={styles.tile}
            testID={`owned-item-${item.sku}`}
          >
            <ShopItemArt sku={item.sku} size={56} />
            <Text numberOfLines={2} style={styles.tileLabel}>
              {item.label}
            </Text>
            <View
              style={[
                styles.badge,
                item.badgeTone === 'success' && styles.badgeSuccess,
                item.badgeTone === 'empty' && styles.badgeEmpty,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  item.badgeTone === 'success' && styles.badgeTextSuccess,
                  item.badgeTone === 'empty' && styles.badgeTextEmpty,
                ]}
              >
                {item.badge}
              </Text>
            </View>
          </ShopPressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default BoostsRow;

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    section: {
      gap: mentaSpacing[3],
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: mentaSpacing[3],
    },
    title: {
      color: mentaColors.text.primary,
      ...mentaTypography.title,
    },
    link: {
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: mentaSpacing[1],
    },
    linkPressed: {
      opacity: 0.72,
    },
    linkText: {
      color: mentaColors.action,
      ...mentaTypography.bodySmallMedium,
    },
    row: {
      gap: mentaSpacing[3],
    },
    tile: {
      alignItems: 'center',
      backgroundColor: mentaColors.surface,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      gap: mentaSpacing[2],
      minHeight: 152,
      paddingHorizontal: mentaSpacing[3],
      paddingVertical: mentaSpacing[4],
      width: 120,
    },
    tilePressed: {
      backgroundColor: mentaColors.raised,
    },
    tileLabel: {
      color: mentaColors.text.primary,
      ...mentaTypography.captionMedium,
      minHeight: mentaTypography.captionMedium.lineHeight * 2,
      textAlign: 'center',
    },
    badge: {
      backgroundColor: mentaColors.actionSoft,
      borderColor: mentaColors.actionBorder,
      borderRadius: mentaRadii.round,
      borderWidth: 1,
      marginTop: 'auto',
      paddingHorizontal: mentaSpacing[3],
      paddingVertical: 2,
    },
    badgeSuccess: {
      backgroundColor: mentaColors.successSoft,
      borderColor: 'transparent',
    },
    badgeEmpty: {
      backgroundColor: 'transparent',
      borderColor: mentaColors.border,
    },
    badgeText: {
      color: mentaColors.action,
      ...mentaTypography.labelBold,
      fontVariant: ['tabular-nums'],
    },
    badgeTextSuccess: {
      color: mentaColors.success,
    },
    badgeTextEmpty: {
      color: mentaColors.text.muted,
    },
  });
  return { styles };
};
