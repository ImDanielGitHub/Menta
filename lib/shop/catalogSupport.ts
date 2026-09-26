import {
  getPowerUpDisplayCopy,
  isPowerUpSupported,
  isShopPowerUp,
  normalizeShopCategory,
} from './powerUpSupport';
import type { ImageSourcePropType } from 'react-native';
import { enNZ, type TranslationKey } from '@/lib/localization/en-NZ';

type CatalogLike = {
  id?: string | null;
  sku?: string | null;
  category?: string | null;
  is_disabled?: boolean | null;
  unlock_streak_days?: number | null;
};

export type AppearanceCategory = 'theme' | 'avatar_frame';

export type ThemeAppearance = {
  primary: string;
  secondary: string;
  interactivePrimary: string;
  interactiveSecondary: string;
  backgroundSecondary: string;
  surfacePrimary: string;
  borderFocus: string;
};

export type AvatarFrameAppearance = {
  borderColor?: string;
  gradientColors?: readonly [string, string, string];
  artworkSource: ImageSourcePropType;
  width: number;
};

export type AppearanceSupport = {
  sku: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  equipCategory: AppearanceCategory;
  unlockStreakDays?: number;
  theme?: ThemeAppearance;
  avatarFrame?: AvatarFrameAppearance;
};

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function themeAppearance(
  primary: string,
  secondary: string,
  backgroundSecondary: string,
  surfacePrimary: string
): ThemeAppearance {
  return {
    primary,
    secondary,
    interactivePrimary: primary,
    interactiveSecondary: hexToRgba(primary, 0.14),
    backgroundSecondary,
    surfacePrimary,
    borderFocus: hexToRgba(primary, 0.55),
  };
}

export const SUPPORTED_APPEARANCE_ITEMS: Record<string, AppearanceSupport> = {
  profile_theme_ember: {
    sku: 'profile_theme_ember',
    labelKey: 'commerce.shop.appearance.ember',
    descriptionKey: 'commerce.shop.appearance.emberDescription',
    equipCategory: 'theme',
    theme: {
      primary: '#E7A86D',
      secondary: '#A78BFA',
      interactivePrimary: '#E7A86D',
      interactiveSecondary: 'rgba(231, 168, 109, 0.14)',
      backgroundSecondary: '#17120F',
      surfacePrimary: '#1D1713',
      borderFocus: 'rgba(231, 168, 109, 0.55)',
    },
  },
  profile_theme_glacier: {
    sku: 'profile_theme_glacier',
    labelKey: 'commerce.shop.appearance.glacier',
    descriptionKey: 'commerce.shop.appearance.glacierDescription',
    equipCategory: 'theme',
    unlockStreakDays: 3,
    theme: themeAppearance('#67E8F9', '#38BDF8', '#07141C', '#0C1C26'),
  },
  profile_theme_aurora: {
    sku: 'profile_theme_aurora',
    labelKey: 'commerce.shop.appearance.aurora',
    descriptionKey: 'commerce.shop.appearance.auroraDescription',
    equipCategory: 'theme',
    unlockStreakDays: 7,
    theme: themeAppearance('#5EEAD4', '#86EFAC', '#071510', '#0C1F18'),
  },
  profile_theme_iris: {
    sku: 'profile_theme_iris',
    labelKey: 'commerce.shop.appearance.iris',
    descriptionKey: 'commerce.shop.appearance.irisDescription',
    equipCategory: 'theme',
    unlockStreakDays: 14,
    theme: themeAppearance('#818CF8', '#C4B5FD', '#0C0B1A', '#14132A'),
  },
  profile_theme_cobalt: {
    sku: 'profile_theme_cobalt',
    labelKey: 'commerce.shop.appearance.cobalt',
    descriptionKey: 'commerce.shop.appearance.cobaltDescription',
    equipCategory: 'theme',
    theme: themeAppearance('#3B82F6', '#93C5FD', '#070B16', '#0D1424'),
  },
  profile_theme_jade: {
    sku: 'profile_theme_jade',
    labelKey: 'commerce.shop.appearance.jade',
    descriptionKey: 'commerce.shop.appearance.jadeDescription',
    equipCategory: 'theme',
    theme: themeAppearance('#34D399', '#6EE7B7', '#06120C', '#0B1C14'),
  },
  profile_theme_orchid: {
    sku: 'profile_theme_orchid',
    labelKey: 'commerce.shop.appearance.orchid',
    descriptionKey: 'commerce.shop.appearance.orchidDescription',
    equipCategory: 'theme',
    theme: themeAppearance('#E879F9', '#F0ABFC', '#140814', '#1E0E1E'),
  },
  profile_theme_horizon: {
    sku: 'profile_theme_horizon',
    labelKey: 'commerce.shop.appearance.horizon',
    descriptionKey: 'commerce.shop.appearance.horizonDescription',
    equipCategory: 'theme',
    theme: themeAppearance('#0EA5E9', '#7DD3FC', '#07131C', '#0C1A26'),
  },
  profile_theme_graphite: {
    sku: 'profile_theme_graphite',
    labelKey: 'commerce.shop.appearance.graphite',
    descriptionKey: 'commerce.shop.appearance.graphiteDescription',
    equipCategory: 'theme',
    theme: themeAppearance('#94A3B8', '#CBD5E1', '#10141A', '#171C24'),
  },
  profile_theme_neon: {
    sku: 'profile_theme_neon',
    labelKey: 'commerce.shop.appearance.neon',
    descriptionKey: 'commerce.shop.appearance.neonDescription',
    equipCategory: 'theme',
    theme: themeAppearance('#22D3EE', '#A3E635', '#05080A', '#0A1214'),
  },
  profile_theme_tidepool: {
    sku: 'profile_theme_tidepool',
    labelKey: 'commerce.shop.appearance.tidepool',
    descriptionKey: 'commerce.shop.appearance.tidepoolDescription',
    equipCategory: 'theme',
    theme: themeAppearance('#14B8A6', '#2DD4BF', '#051412', '#0A1F1C'),
  },
  avatar_gold_frame: {
    sku: 'avatar_gold_frame',
    labelKey: 'commerce.shop.appearance.goldFrame',
    descriptionKey: 'commerce.shop.appearance.goldFrameDescription',
    equipCategory: 'avatar_frame',
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-gold-frame.png'),
      borderColor: '#E7A86D',
      width: 3,
    },
  },
  avatar_gradient_frame: {
    sku: 'avatar_gradient_frame',
    labelKey: 'commerce.shop.appearance.violetFrame',
    descriptionKey: 'commerce.shop.appearance.violetFrameDescription',
    equipCategory: 'avatar_frame',
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-gradient-frame.png'),
      gradientColors: ['#E7A86D', '#A78BFA', '#F5F3FF'],
      width: 3,
    },
  },
  avatar_frame_ice: {
    sku: 'avatar_frame_ice',
    labelKey: 'commerce.shop.appearance.iceFrame',
    descriptionKey: 'commerce.shop.appearance.iceFrameDescription',
    equipCategory: 'avatar_frame',
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-ice.png'),
      borderColor: '#67E8F9',
      width: 3,
    },
  },
  avatar_frame_neon: {
    sku: 'avatar_frame_neon',
    labelKey: 'commerce.shop.appearance.neonFrame',
    descriptionKey: 'commerce.shop.appearance.neonFrameDescription',
    equipCategory: 'avatar_frame',
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-neon.png'),
      gradientColors: ['#22D3EE', '#A3E635', '#F0ABFC'],
      width: 3,
    },
  },
  avatar_frame_obsidian: {
    sku: 'avatar_frame_obsidian',
    labelKey: 'commerce.shop.appearance.obsidianFrame',
    descriptionKey: 'commerce.shop.appearance.obsidianFrameDescription',
    equipCategory: 'avatar_frame',
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-obsidian.png'),
      borderColor: '#64748B',
      width: 3,
    },
  },
  avatar_frame_spark: {
    sku: 'avatar_frame_spark',
    labelKey: 'commerce.shop.appearance.sparkFrame',
    descriptionKey: 'commerce.shop.appearance.sparkFrameDescription',
    equipCategory: 'avatar_frame',
    unlockStreakDays: 3,
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-spark.png'),
      borderColor: '#5EEAD4',
      width: 3,
    },
  },
  avatar_frame_week: {
    sku: 'avatar_frame_week',
    labelKey: 'commerce.shop.appearance.weekFrame',
    descriptionKey: 'commerce.shop.appearance.weekFrameDescription',
    equipCategory: 'avatar_frame',
    unlockStreakDays: 7,
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-week.png'),
      gradientColors: ['#5EEAD4', '#818CF8', '#E0F2FE'],
      width: 3,
    },
  },
  avatar_frame_fortnight: {
    sku: 'avatar_frame_fortnight',
    labelKey: 'commerce.shop.appearance.fortnightFrame',
    descriptionKey: 'commerce.shop.appearance.fortnightFrameDescription',
    equipCategory: 'avatar_frame',
    unlockStreakDays: 14,
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-fortnight.png'),
      borderColor: '#818CF8',
      width: 4,
    },
  },
  avatar_frame_month: {
    sku: 'avatar_frame_month',
    labelKey: 'commerce.shop.appearance.monthFrame',
    descriptionKey: 'commerce.shop.appearance.monthFrameDescription',
    equipCategory: 'avatar_frame',
    unlockStreakDays: 30,
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-month.png'),
      gradientColors: ['#3B82F6', '#22D3EE', '#C4B5FD'],
      width: 4,
    },
  },
  avatar_frame_season: {
    sku: 'avatar_frame_season',
    labelKey: 'commerce.shop.appearance.seasonFrame',
    descriptionKey: 'commerce.shop.appearance.seasonFrameDescription',
    equipCategory: 'avatar_frame',
    unlockStreakDays: 90,
    avatarFrame: {
      artworkSource: require('../../assets/images/profile-frames/avatar-frame-season.png'),
      gradientColors: ['#5EEAD4', '#818CF8', '#E879F9'],
      width: 4,
    },
  },
};

export const NEW_THEME_SKUS = [
  'profile_theme_glacier',
  'profile_theme_aurora',
  'profile_theme_iris',
  'profile_theme_cobalt',
  'profile_theme_jade',
  'profile_theme_orchid',
  'profile_theme_horizon',
  'profile_theme_graphite',
  'profile_theme_neon',
  'profile_theme_tidepool',
] as const;

export function getCatalogItemSku(item: CatalogLike): string {
  return String(item.sku || item.id || '');
}

export function getAppearanceSupport(
  sku?: string | null
): AppearanceSupport | null {
  if (!sku) return null;
  return SUPPORTED_APPEARANCE_ITEMS[String(sku)] || null;
}

type ShopItemTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

/**
 * The name and description a person sees for a shop item. Known SKUs use the
 * app catalogue so they follow the chosen language; the database text is only
 * a fallback for items this build does not know yet.
 */
export function getShopItemDisplayCopy(
  item: CatalogLike & {
    name?: string | null;
    description?: string | null;
  },
  t: ShopItemTranslate
): { name: string; description: string } {
  const sku = getCatalogItemSku(item);
  const powerUp = getPowerUpDisplayCopy(sku, t);
  if (powerUp) {
    return {
      name: powerUp.label,
      description: powerUp.description || item.description || '',
    };
  }
  const appearance = getAppearanceSupport(sku);
  if (appearance) {
    return {
      name: t(appearance.labelKey),
      description: t(appearance.descriptionKey),
    };
  }
  return { name: item.name || '', description: item.description || '' };
}

export function getAvatarFrameAppearance(
  sku?: string | null
): AvatarFrameAppearance | null {
  return getAppearanceSupport(sku)?.avatarFrame || null;
}

export function getThemeAppearance(
  sku?: string | null
): ThemeAppearance | null {
  return getAppearanceSupport(sku)?.theme || null;
}

export function getUnlockStreakDays(
  sku?: string | null,
  catalogDays?: number | null
): number | null {
  if (typeof catalogDays === 'number' && catalogDays > 0) {
    return catalogDays;
  }
  const days = getAppearanceSupport(sku)?.unlockStreakDays;
  return days && days > 0 ? days : null;
}

export function formatStreakUnlockCopy(
  days: number,
  t: (
    key: TranslationKey,
    values?: Record<string, string | number>
  ) => string = (key, values = {}) => {
    return String(enNZ[key]).replace(
      /\{([A-Za-z][A-Za-z0-9_]*)\}/g,
      (match, name) =>
        values[name] === undefined ? match : String(values[name])
    );
  }
): string {
  return t('commerce.shop.unlocksAfter', { days });
}

export function getEquipCategoryForCatalogItem(
  item: CatalogLike
): AppearanceCategory | 'power_up' | 'ai_upgrade' | 'catalog' {
  const appearance = getAppearanceSupport(getCatalogItemSku(item));
  if (appearance) return appearance.equipCategory;

  const category = normalizeShopCategory(item.category);
  if (category === 'power_up') return 'power_up';
  if (category === 'ai_upgrade') return 'ai_upgrade';
  return 'catalog';
}

export function isSupportedCatalogSku(sku?: string | null): boolean {
  return Boolean(sku && (isPowerUpSupported(sku) || getAppearanceSupport(sku)));
}

export function isSupportedCatalogItem(item: CatalogLike): boolean {
  if (!item || item.is_disabled) return false;

  const sku = getCatalogItemSku(item);
  const category = normalizeShopCategory(item.category);

  if (isShopPowerUp(category)) return isPowerUpSupported(sku);
  if (category === 'cosmetic') return Boolean(getAppearanceSupport(sku));

  return false;
}

export function filterSupportedCatalogItems<T extends CatalogLike>(
  items: T[] | null | undefined
): T[] {
  return (items || []).filter(isSupportedCatalogItem);
}
