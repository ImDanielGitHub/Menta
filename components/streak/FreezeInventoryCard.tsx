import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FreezeSlots } from '@/components/shop/FreezeSlots';
import { ShopItemArt } from '@/components/shop/ShopItemArt';
import { ShopPressable } from '@/components/shop/ShopPressable';
import { AppButton } from '@/components/ui/AppButton';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { getEarnedFreezeGrantCopy } from '@/lib/economy/contract';
import { useTranslation } from '@/lib/localization';

interface FreezeInventoryCardProps {
  freezeCount: number;
  onPress?: () => void;
  /** Opens the Streak Freeze in the shop. */
  onGetMore?: () => void;
}

export const FreezeInventoryCard: React.FC<FreezeInventoryCardProps> = ({
  freezeCount,
  onPress,
  onGetMore,
}) => {
  const { t } = useTranslation();
  const availableLabel = t('todayProof.streak.freezes_left', {
    count: freezeCount,
  });

  return (
    <View style={styles.card} testID="freeze-inventory-card">
      <ShopPressable
        accessibilityRole={onPress ? 'button' : 'summary'}
        accessibilityLabel={t('todayProof.streak.freeze_accessibility', {
          available: availableLabel,
        })}
        disabled={!onPress}
        haptic={Boolean(onPress)}
        onPress={onPress}
        pressedStyle={styles.cardPressed}
        style={styles.body}
      >
        <View style={styles.headerRow}>
          <ShopItemArt sku="streak_freeze_basic" size={52} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>
              {t('todayProof.streak.freeze_title')}
            </Text>
            <Text style={styles.subtitle}>{availableLabel}</Text>
          </View>
          {onPress ? (
            <Text style={styles.action}>
              {t('todayProof.streak.open_items')}
            </Text>
          ) : null}
        </View>

        <FreezeSlots count={freezeCount} />

        <Text style={styles.copy}>
          {t('todayProof.streak.freeze_copy', {
            grant: getEarnedFreezeGrantCopy(t),
          })}
        </Text>
      </ShopPressable>

      {onGetMore ? (
        <AppButton
          title={
            freezeCount > 0
              ? t('commerce.freeze.getAnother')
              : t('commerce.freeze.getFirst')
          }
          variant="outline"
          size="medium"
          fullWidth
          textStyle={styles.getMoreText}
          onPress={onGetMore}
          testID="freeze-inventory-get-more"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    gap: mentaSpacing[4],
    padding: mentaSpacing[4],
  },
  body: {
    gap: mentaSpacing[4],
  },
  cardPressed: {
    opacity: 0.8,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  subtitle: {
    color: mentaColors.info,
    ...mentaTypography.captionMedium,
    marginTop: 2,
  },
  action: {
    color: mentaColors.action,
    ...mentaTypography.bodySmallMedium,
  },
  copy: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
  },
  getMoreText: {
    color: mentaColors.action,
  },
});
