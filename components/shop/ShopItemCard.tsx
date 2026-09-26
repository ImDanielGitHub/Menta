import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, type AppButtonProps } from '@/components/ui/AppButton';
import { LockIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { usePhoneLayout } from '@/constants/use-phone-layout';

import { MomentaMark } from './MomentaBalanceChip';
import { ShopItemArt } from './ShopItemArt';
import { ShopPressable } from './ShopPressable';

export type ShopItemCardTrail =
  /** Affordable price in violet. */
  | { kind: 'price'; label: string }
  /** Price the person cannot cover yet, greyed with the shortfall below. */
  | { kind: 'short'; label: string; reason: string }
  /** Streak-locked item, greyed with the unlock rule below. */
  | { kind: 'locked'; label: string; reason: string }
  /** Server-confirmed ownership. */
  | { kind: 'owned'; label: string }
  /** Account details are still loading or unavailable. */
  | { kind: 'quiet'; label: string };

export type ShopItemCardTag = { label: string; tone: 'action' | 'success' };

type ShopItemCardProps = {
  sku: string;
  name: string;
  description?: string | null;
  /** Short owned-state fact such as "2 available" or "In use". */
  meta?: string | null;
  trail?: ShopItemCardTrail;
  tag?: ShopItemCardTag | null;
  /** Owned quantity for consumable boosts, shown on the art. */
  quantity?: number | null;
  quantityLabel?: string;
  selected?: boolean;
  action?: {
    label: string;
    onPress: () => void;
    variant?: AppButtonProps['variant'];
    loading?: boolean;
    disabled?: boolean;
    accessibilityLabel?: string;
  };
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
};

/**
 * A shop or owned item in the onboarding choice-card language: hairline card,
 * large art, one clear price or state on the right, and a small pill on the
 * top edge only for real facts such as "New" or "In use".
 */
export function ShopItemCard({
  sku,
  name,
  description,
  meta,
  trail,
  tag,
  quantity,
  quantityLabel,
  selected = false,
  action,
  onPress,
  accessibilityLabel,
  testID,
}: ShopItemCardProps) {
  const phoneLayout = usePhoneLayout();
  const stackAction =
    Boolean(action) &&
    (phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2);
  const titleLines = useLargeTypeLineLimit(2);
  const descriptionLines = useLargeTypeLineLimit(2);
  const unavailable = trail?.kind === 'short' || trail?.kind === 'locked';
  const reason =
    trail?.kind === 'short' || trail?.kind === 'locked' ? trail.reason : null;
  const artSize = phoneLayout.isCompactWidth ? 56 : 64;

  const identity = (
    <>
      <View>
        <ShopItemArt
          sku={sku}
          size={artSize}
          locked={trail?.kind === 'locked'}
          muted={trail?.kind === 'short'}
        />
        {typeof quantity === 'number' && quantityLabel ? (
          <View
            style={[styles.quantity, quantity <= 0 && styles.quantityEmpty]}
          >
            <Text
              style={[
                styles.quantityText,
                quantity <= 0 && styles.quantityTextEmpty,
              ]}
            >
              {quantityLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <Text
          numberOfLines={titleLines}
          style={[styles.title, unavailable && styles.titleMuted]}
        >
          {name}
        </Text>
        {description ? (
          <Text numberOfLines={descriptionLines} style={styles.description}>
            {description}
          </Text>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {reason ? <Text style={styles.reason}>{reason}</Text> : null}
      </View>

      {!action && trail ? <ShopTrailPill trail={trail} /> : null}
    </>
  );

  const tagPill = tag ? (
    <View
      pointerEvents="none"
      style={[styles.tag, tag.tone === 'success' && styles.tagSuccess]}
    >
      <Text style={styles.tagText}>{tag.label}</Text>
    </View>
  ) : null;

  if (!action) {
    return (
      <View style={styles.wrap} testID={testID}>
        <ShopPressable
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          pressedStyle={styles.cardPressed}
          style={[
            styles.card,
            styles.identity,
            selected && styles.cardSelected,
          ]}
        >
          {identity}
        </ShopPressable>
        {tagPill}
      </View>
    );
  }

  // Opening the item and its action stay separate controls, so assistive
  // technology can reach both and web never nests one button in another.
  const actionButton = (
    <AppButton
      accessibilityLabel={action.accessibilityLabel}
      disabled={action.disabled}
      fullWidth={stackAction}
      loading={action.loading}
      onPress={action.onPress}
      preserveLabelPositionOnLoading
      size="small"
      title={action.label}
      variant={action.variant ?? 'accent'}
    />
  );

  return (
    <View style={styles.wrap} testID={testID}>
      <View
        style={[
          styles.card,
          !stackAction && styles.identity,
          selected && styles.cardSelected,
          stackAction && styles.cardStacked,
        ]}
      >
        <ShopPressable
          accessibilityLabel={accessibilityLabel}
          containerStyle={styles.identityAction}
          onPress={onPress}
          pressedStyle={styles.identityPressed}
          style={styles.identity}
        >
          {identity}
        </ShopPressable>
        {actionButton}
      </View>
      {tagPill}
    </View>
  );
}

export function ShopTrailPill({ trail }: { trail: ShopItemCardTrail }) {
  if (trail.kind === 'quiet') {
    return <Text style={styles.quietTrail}>{trail.label}</Text>;
  }

  if (trail.kind === 'owned') {
    return (
      <View style={[styles.pill, styles.pillOwned]}>
        <Text style={[styles.pillText, styles.pillTextOwned]}>
          {trail.label}
        </Text>
      </View>
    );
  }

  if (trail.kind === 'locked') {
    return (
      <View style={[styles.pill, styles.pillGrey, styles.pillIconOnly]}>
        <LockIcon size={15} color={mentaColors.text.muted} />
      </View>
    );
  }

  const greyed = trail.kind !== 'price';
  return (
    <View style={[styles.pill, greyed ? styles.pillGrey : styles.pillPrice]}>
      <MomentaMark size={16} tone={greyed ? 'muted' : 'action'} />
      <Text
        numberOfLines={1}
        style={[
          styles.pillText,
          greyed ? styles.pillTextGrey : styles.pillTextPrice,
        ]}
      >
        {trail.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: mentaSpacing[2],
  },
  card: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    gap: mentaSpacing[3],
    minHeight: 96,
    justifyContent: 'center',
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[4],
  },
  cardSelected: {
    backgroundColor: mentaColors.actionSoft,
    borderColor: mentaColors.actionBorder,
    borderWidth: 2,
  },
  cardStacked: {
    gap: mentaSpacing[4],
  },
  cardPressed: {
    backgroundColor: mentaColors.raised,
  },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  identityAction: {
    flex: 1,
    minWidth: 0,
  },
  identityPressed: {
    opacity: 0.8,
  },
  copy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
    fontSize: 17,
    lineHeight: 23,
  },
  titleMuted: {
    color: mentaColors.text.secondary,
  },
  description: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
  },
  meta: {
    color: mentaColors.action,
    ...mentaTypography.captionMedium,
  },
  reason: {
    color: mentaColors.text.muted,
    ...mentaTypography.captionMedium,
  },
  quantity: {
    backgroundColor: mentaColors.action,
    borderColor: mentaColors.surface,
    borderRadius: mentaRadii.round,
    borderWidth: 2,
    minWidth: 28,
    paddingHorizontal: mentaSpacing[2],
    paddingVertical: 1,
    position: 'absolute',
    right: -mentaSpacing[2],
    top: -mentaSpacing[2],
  },
  quantityEmpty: {
    backgroundColor: mentaColors.raised,
  },
  quantityText: {
    color: mentaColors.canvas,
    ...mentaTypography.labelBold,
    textAlign: 'center',
  },
  quantityTextEmpty: {
    color: mentaColors.text.muted,
  },
  pill: {
    alignItems: 'center',
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 0,
    gap: mentaSpacing[1] + 2,
    maxWidth: 148,
    minHeight: 36,
    paddingLeft: mentaSpacing[2],
    paddingRight: mentaSpacing[3],
  },
  pillIconOnly: {
    justifyContent: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    width: 36,
  },
  pillPrice: {
    backgroundColor: mentaColors.actionSoft,
    borderColor: mentaColors.actionBorder,
  },
  pillGrey: {
    backgroundColor: 'transparent',
    borderColor: mentaColors.border,
  },
  pillOwned: {
    backgroundColor: mentaColors.successSoft,
    borderColor: 'transparent',
    paddingLeft: mentaSpacing[3],
  },
  pillText: {
    ...mentaTypography.bodySmallMedium,
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
  },
  pillTextPrice: {
    color: mentaColors.action,
  },
  pillTextGrey: {
    color: mentaColors.text.muted,
  },
  pillTextOwned: {
    color: mentaColors.success,
  },
  quietTrail: {
    color: mentaColors.text.muted,
    ...mentaTypography.caption,
    flexShrink: 0,
    maxWidth: 108,
    textAlign: 'right',
  },
  tag: {
    backgroundColor: mentaColors.action,
    borderRadius: mentaRadii.round,
    paddingHorizontal: mentaSpacing[2] + 2,
    paddingVertical: 2,
    position: 'absolute',
    right: mentaSpacing[4],
    top: 0,
  },
  tagSuccess: {
    backgroundColor: mentaColors.success,
  },
  tagText: {
    color: mentaColors.canvas,
    ...mentaTypography.labelBold,
  },
});
