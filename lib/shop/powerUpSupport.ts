import { enNZ, type TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

// UI-facing support map for catalog boosts. The backend still owns the
// purchase/use contracts; this file only keeps screens honest about which
// boosts need a target and which older SKUs are safe to present.

export type PowerUpSupport = {
  sku: string;
  label: string;
  description: string;
  useSummary: string;
  successMessage?: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  useSummaryKey: TranslationKey;
  successMessageKey?: TranslationKey;
  requiresChallengeId?: boolean;
  autoConsumed?: boolean;
};
type CommerceTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: CommerceTranslate = (key, values = {}) =>
  String(enNZ[key]).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name) =>
    values[name] === undefined ? match : String(values[name])
  );

const STREAK_FREEZE_KEYS = {
  labelKey: 'commerce.powerUp.freezeLabel',
  descriptionKey: 'commerce.powerUp.freezeDescription',
  useSummaryKey: 'commerce.powerUp.freezeSummary',
} as const;

const STREAK_FREEZE_COPY = {
  label: translate('en-NZ', 'commerce.powerUp.freezeLabel'),
  description: translate('en-NZ', 'commerce.powerUp.freezeDescription'),
  useSummary: translate('en-NZ', 'commerce.powerUp.freezeSummary'),
  labelKey: STREAK_FREEZE_KEYS.labelKey,
  descriptionKey: STREAK_FREEZE_KEYS.descriptionKey,
  useSummaryKey: STREAK_FREEZE_KEYS.useSummaryKey,
} satisfies Pick<
  PowerUpSupport,
  | 'label'
  | 'description'
  | 'useSummary'
  | 'labelKey'
  | 'descriptionKey'
  | 'useSummaryKey'
>;

const DEADLINE_EXTENSION_KEYS = {
  labelKey: 'commerce.powerUp.extensionLabel',
  descriptionKey: 'commerce.powerUp.extensionDescription',
  useSummaryKey: 'commerce.powerUp.extensionSummary',
  successMessageKey: 'commerce.powerUp.extensionSuccess',
} as const;

const DEADLINE_EXTENSION_COPY = {
  label: translate('en-NZ', 'commerce.powerUp.extensionLabel'),
  description: translate('en-NZ', 'commerce.powerUp.extensionDescription'),
  useSummary: translate('en-NZ', 'commerce.powerUp.extensionSummary'),
  successMessage: translate('en-NZ', 'commerce.powerUp.extensionSuccess'),
  labelKey: DEADLINE_EXTENSION_KEYS.labelKey,
  descriptionKey: DEADLINE_EXTENSION_KEYS.descriptionKey,
  useSummaryKey: DEADLINE_EXTENSION_KEYS.useSummaryKey,
  successMessageKey: DEADLINE_EXTENSION_KEYS.successMessageKey,
} satisfies Pick<
  PowerUpSupport,
  | 'label'
  | 'description'
  | 'useSummary'
  | 'successMessage'
  | 'labelKey'
  | 'descriptionKey'
  | 'useSummaryKey'
  | 'successMessageKey'
>;

export const SUPPORTED_POWER_UPS: Record<string, PowerUpSupport> = {
  streak_freeze: {
    sku: 'streak_freeze',
    ...STREAK_FREEZE_COPY,
    autoConsumed: true,
  },
  streak_freeze_1: {
    sku: 'streak_freeze_1',
    ...STREAK_FREEZE_COPY,
    autoConsumed: true,
  },
  streak_freeze_basic: {
    sku: 'streak_freeze_basic',
    ...STREAK_FREEZE_COPY,
    autoConsumed: true,
  },
  power_freeze_1: {
    sku: 'power_freeze_1',
    ...STREAK_FREEZE_COPY,
    autoConsumed: true,
  },
  time_extension_1: {
    sku: 'time_extension_1',
    ...DEADLINE_EXTENSION_COPY,
    requiresChallengeId: true,
  },
  booster_extension_12h: {
    sku: 'booster_extension_12h',
    ...DEADLINE_EXTENSION_COPY,
    requiresChallengeId: true,
  },
};

export function normalizeShopCategory(category?: string | null): string {
  const value = String(category || '').toLowerCase();
  if (value === 'powerup' || value === 'power-up' || value === 'booster') {
    return 'power_up';
  }
  if (
    value === 'avatar' ||
    value === 'avatar_skin' ||
    value === 'avatar_frame' ||
    value === 'badge' ||
    value === 'name_style' ||
    value === 'theme'
  ) {
    return 'cosmetic';
  }
  return value || 'catalog';
}

export function isShopPowerUp(category?: string | null): boolean {
  return normalizeShopCategory(category) === 'power_up';
}

export function getPowerUpSupport(sku?: string | null): PowerUpSupport | null {
  if (!sku) return null;
  return SUPPORTED_POWER_UPS[String(sku)];
}

export function isPowerUpSupported(sku?: string | null): boolean {
  return Boolean(getPowerUpSupport(sku));
}

export function powerUpRequiresChallengeId(sku?: string | null): boolean {
  return Boolean(getPowerUpSupport(sku)?.requiresChallengeId);
}

export function powerUpIsAutoConsumed(sku?: string | null): boolean {
  return Boolean(getPowerUpSupport(sku)?.autoConsumed);
}

export function getPowerUpDisplayCopy(
  sku?: string | null,
  t: CommerceTranslate = defaultTranslate
): Pick<
  PowerUpSupport,
  'label' | 'description' | 'useSummary' | 'successMessage'
> | null {
  const support = getPowerUpSupport(sku);
  if (!support) return null;

  if (
    sku === 'streak_freeze' ||
    sku === 'streak_freeze_1' ||
    sku === 'streak_freeze_basic' ||
    sku === 'power_freeze_1'
  ) {
    return {
      label: t('commerce.powerUp.freezeLabel'),
      description: t('commerce.powerUp.freezeDescription'),
      useSummary: t('commerce.powerUp.freezeSummary'),
      successMessage: undefined,
    };
  }

  return {
    label: t('commerce.powerUp.extensionLabel'),
    description: t('commerce.powerUp.extensionDescription'),
    useSummary: t('commerce.powerUp.extensionSummary'),
    successMessage: t('commerce.powerUp.extensionSuccess'),
  };
}
