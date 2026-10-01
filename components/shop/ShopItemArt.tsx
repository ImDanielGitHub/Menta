import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { LockIcon } from '@/components/ui/icons';

import { getAppearanceSupport } from '@/lib/shop/catalogSupport';
import {
  powerUpIsAutoConsumed,
  powerUpRequiresChallengeId,
} from '@/lib/shop/powerUpSupport';

export type ShopArtKind = 'freeze' | 'extension' | 'theme' | 'frame' | 'item';

/** Adds alpha to a six-digit token colour without introducing new palette values. */
export function tokenAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getShopArtKind(sku?: string | null): ShopArtKind {
  const value = String(sku || '');
  if (powerUpIsAutoConsumed(value) || value.includes('freeze')) return 'freeze';
  if (powerUpRequiresChallengeId(value) || value.includes('extension')) {
    return 'extension';
  }
  const appearance = getAppearanceSupport(value);
  if (appearance?.equipCategory === 'theme') return 'theme';
  if (appearance?.equipCategory === 'avatar_frame') return 'frame';
  return 'item';
}

/**
 * Tactile item illustrations drawn in Paper to match the mascot's props: the
 * ice cube a freeze protects you with, the hourglass for extra time, and a
 * Momenta coin for everything else.
 */
const kindIllustration: Record<'freeze' | 'extension' | 'item', number> = {
  freeze: require('@/assets/images/shop/item-freeze.png'),
  extension: require('@/assets/images/shop/item-extension.png'),
  item: require('@/assets/images/shop/item-momenta-item.png'),
};

/** Ice for freezes, violet for time, mint for everything else. */

type ShopItemArtProps = {
  sku?: string | null;
  size?: number;
  locked?: boolean;
  /** Greys the art when the item cannot be bought right now. */
  muted?: boolean;
  testID?: string;
};

/**
 * Large decorative item art. Themes use their real palette, frames use their
 * real artwork, and boosts use a tinted tile with a large symbol. The art is
 * hidden from assistive technology; the row or heading names the item.
 */
export function ShopItemArt({
  sku,
  size = 64,
  locked = false,
  muted = false,
  testID,
}: ShopItemArtProps) {
  const mentaColors = useMentaPalette();
  const { kindTint, styles } = useMentaStyles(createPaletteStyles);

  const kind = getShopArtKind(sku);
  const appearance = getAppearanceSupport(sku);
  const tint = kindTint[kind];
  const radius = Math.round(size * 0.28);
  const illustrationSize = Math.round(size * 0.78);

  let art: React.ReactNode;
  if (kind === 'theme' && appearance?.theme) {
    const theme = appearance.theme;
    art = (
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: theme.surfacePrimary,
            borderColor: tokenAlpha(theme.primary, 0.45),
          },
        ]}
      >
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={{
            width: size * 0.56,
            height: size * 0.56,
            borderRadius: size,
          }}
        />
        <View
          style={[
            styles.themeAccent,
            {
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: size,
              right: size * 0.14,
              bottom: size * 0.14,
              backgroundColor: theme.secondary,
              borderColor: theme.surfacePrimary,
            },
          ]}
        />
      </View>
    );
  } else if (kind === 'frame' && appearance?.avatarFrame) {
    art = (
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: tokenAlpha(tint, 0.08),
            borderColor: tokenAlpha(tint, 0.28),
          },
        ]}
      >
        <Image
          source={appearance.avatarFrame.artworkSource}
          resizeMode="contain"
          style={{ width: size * 0.86, height: size * 0.86 }}
        />
      </View>
    );
  } else {
    const illustration =
      kind === 'freeze' || kind === 'extension'
        ? kindIllustration[kind]
        : kindIllustration.item;
    art = (
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: tokenAlpha(tint, 0.1),
            borderColor: tokenAlpha(tint, 0.32),
          },
        ]}
      >
        <Image
          resizeMode="contain"
          source={illustration}
          style={{ width: illustrationSize, height: illustrationSize }}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
      testID={testID}
    >
      <View style={(locked || muted) && styles.muted}>{art}</View>
      {locked ? (
        <View
          style={[
            styles.lockBadge,
            {
              width: Math.max(22, size * 0.34),
              height: Math.max(22, size * 0.34),
            },
          ]}
          testID={testID ? `${testID}-lock` : undefined}
        >
          <LockIcon
            size={Math.max(12, Math.round(size * 0.17))}
            color={mentaColors.text.primary}
          />
        </View>
      ) : null}
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const kindTint: Record<ShopArtKind, string> = {
    freeze: mentaColors.info,
    extension: mentaColors.action,
    theme: mentaColors.action,
    frame: mentaColors.action,
    item: mentaColors.success,
  };
  const styles = StyleSheet.create({
    tile: {
      alignItems: 'center',
      borderWidth: 1,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    themeAccent: {
      borderWidth: 2,
      position: 'absolute',
    },
    muted: {
      opacity: 0.45,
    },
    lockBadge: {
      alignItems: 'center',
      backgroundColor: mentaColors.raised,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.round,
      borderWidth: 1,
      bottom: -mentaSpacing[1],
      justifyContent: 'center',
      position: 'absolute',
      right: -mentaSpacing[1],
    },
  });
  return { kindTint, styles };
};
