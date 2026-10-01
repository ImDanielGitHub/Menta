import {
  type MentaPalette,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/lib/localization/use-translation';

import { useCountUp } from './shop-motion';
import { ShopPressable } from './ShopPressable';

const momentaCoin = require('@/assets/images/shop/item-momenta-item.png');

/** The Momenta coin used beside balances and prices. */
export function MomentaMark({
  size = 22,
  tone = 'action',
}: {
  size?: number;
  tone?: 'action' | 'muted' | 'onPaper';
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.mark,
        { width: size, height: size },
        tone === 'muted' && styles.markMuted,
      ]}
    >
      <Image
        resizeMode="contain"
        source={momentaCoin}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

type MomentaBalanceChipProps = {
  balance: number;
  onPress?: () => void;
  testID?: string;
};

/**
 * Header balance for commerce screens. The number counts to each newly
 * confirmed balance; the accessibility label always carries the exact value.
 */
export function MomentaBalanceChip({
  balance,
  onPress,
  testID = 'momenta-balance-chip',
}: MomentaBalanceChipProps) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { locale, t } = useTranslation();
  const displayed = useCountUp(balance);
  const format = (value: number) => new Intl.NumberFormat(locale).format(value);
  const label = t('commerce.shop.balanceChipAccessibility', {
    amount: format(balance),
  });

  const content = (
    <>
      <MomentaMark size={22} />
      <Text style={styles.value}>{format(displayed)}</Text>
    </>
  );

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityLabel={label}
        style={styles.chip}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  return (
    <ShopPressable
      accessibilityLabel={label}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.chip}
      testID={testID}
    >
      {content}
    </ShopPressable>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    mark: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    markMuted: {
      opacity: 0.45,
    },
    chip: {
      alignItems: 'center',
      backgroundColor: mentaColors.actionSoft,
      borderColor: mentaColors.actionBorder,
      borderRadius: mentaRadii.round,
      borderWidth: 1,
      flexDirection: 'row',
      gap: mentaSpacing[2],
      minHeight: mentaLayout.minimumTouchTarget,
      paddingLeft: mentaSpacing[2],
      paddingRight: mentaSpacing[4],
    },
    pressed: {
      backgroundColor: mentaColors.raised,
    },
    value: {
      color: mentaColors.text.primary,
      ...mentaTypography.control,
      fontVariant: ['tabular-nums'],
    },
  });
  return { styles };
};
