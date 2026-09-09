import { enNZ, type TranslationKey } from '@/lib/localization/en-NZ';

export type DecodedShopPurchaseReceipt = {
  clientEventId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  cost: number;
  newBalance: number;
  quantity: number;
};

export type DecodedShopPurchase =
  | {
      success: true;
      receipt: DecodedShopPurchaseReceipt;
    }
  | {
      success: false;
      message: string;
      outcome: 'insufficient-balance' | 'failed' | 'unknown';
    };

export type InventoryReadbackRow = {
  item_sku: string;
  quantity: number;
};

export type PowerUpUseOutcome = 'confirmed' | 'failed' | 'unknown';

export type DecodedPowerUpUse = {
  success: boolean;
  outcome: PowerUpUseOutcome;
  clientEventId: string;
  message: string;
  effectType?: string;
  effects?: Record<string, unknown>;
};

const nonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const nonNegativeInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;

type CommerceTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: CommerceTranslate = (key, values = {}) =>
  String(enNZ[key]).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name) =>
    values[name] === undefined ? match : String(values[name])
  );

const shopPurchaseFailure = (code: string, t: CommerceTranslate): string => {
  switch (code) {
    case 'INSUFFICIENT_BALANCE':
      return t('commerce.readback.shop.insufficient');
    case 'INVALID_REQUEST':
      return t('commerce.readback.shop.invalidRequest');
    case 'ITEM_NOT_AVAILABLE':
      return t('commerce.readback.shop.itemUnavailable');
    case 'REQUEST_FACT_MISMATCH':
      return t('commerce.readback.shop.factMismatch');
    case 'UNAUTHORIZED':
      return t('commerce.readback.shop.unauthorized');
    case 'USER_NOT_FOUND':
      return t('commerce.readback.shop.userNotFound');
    default:
      return t('commerce.readback.shop.failed');
  }
};

const powerUpFailure = (code: string, t: CommerceTranslate): string => {
  switch (code) {
    case 'CHALLENGE_ACCESS_DENIED':
      return t('commerce.readback.powerUp.challengeAccessDenied');
    case 'CHALLENGE_NOT_EXTENDED':
      return t('commerce.readback.powerUp.challengeNotExtended');
    case 'CHALLENGE_REQUIRED':
      return t('commerce.readback.powerUp.challengeRequired');
    case 'IDEMPOTENCY_KEY_REUSED':
      return t('commerce.readback.powerUp.idempotencyReused');
    case 'INVALID_REQUEST':
      return t('commerce.readback.powerUp.invalidRequest');
    case 'NO_INVENTORY':
      return t('commerce.readback.powerUp.noInventory');
    case 'REQUEST_IN_PROGRESS':
      return t('commerce.readback.powerUp.requestInProgress');
    case 'UNAUTHORIZED':
      return t('commerce.readback.powerUp.unauthorized');
    case 'UNSUPPORTED_POWER_UP':
      return t('commerce.readback.powerUp.unsupported');
    default:
      return t('commerce.readback.powerUp.failed');
  }
};

/**
 * Decodes the mutation receipt returned by `use_power_up`. The client event ID
 * must match before the UI may claim that inventory was consumed or a promise
 * changed. Raw database codes never become user-facing copy.
 */
export function decodePowerUpUseResponse(
  raw: unknown,
  expectedClientEventId: string,
  t: CommerceTranslate = defaultTranslate
): DecodedPowerUpUse {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      outcome: 'unknown',
      clientEventId: expectedClientEventId,
      message: t('commerce.readback.powerUp.unknown'),
    };
  }

  const response = raw as Record<string, unknown>;
  const responseClientEventId = nonEmptyString(response.client_event_id);

  if (response.success !== true) {
    if (response.success !== false) {
      return {
        success: false,
        outcome: 'unknown',
        clientEventId: expectedClientEventId,
        message: t('commerce.readback.powerUp.unknown'),
      };
    }

    const code = nonEmptyString(response.error)?.toUpperCase() || '';
    return {
      success: false,
      outcome: code === 'REQUEST_IN_PROGRESS' ? 'unknown' : 'failed',
      clientEventId: expectedClientEventId,
      message: powerUpFailure(code, t),
    };
  }

  const itemSku = nonEmptyString(response.item_sku);
  const effectType = nonEmptyString(response.effect_type);
  const effects = response.effects;
  if (
    responseClientEventId !== expectedClientEventId ||
    !itemSku ||
    !effectType ||
    !effects ||
    typeof effects !== 'object' ||
    Array.isArray(effects)
  ) {
    return {
      success: false,
      outcome: 'unknown',
      clientEventId: expectedClientEventId,
      message: t('commerce.readback.powerUp.unknown'),
    };
  }

  return {
    success: true,
    outcome: 'confirmed',
    clientEventId: responseClientEventId,
    message: t('commerce.readback.powerUp.used'),
    effectType,
    effects: effects as Record<string, unknown>,
  };
}

/**
 * Decodes the JSON contract returned by `purchase_shop_item`. A transport or
 * malformed response is deliberately unknown: clients must reconcile it from
 * account readback instead of treating a partial JSON object as a receipt.
 */
export function decodeShopPurchaseResponse(
  raw: unknown,
  expectedItemId: string,
  expectedClientEventId: string,
  t: CommerceTranslate = defaultTranslate
): DecodedShopPurchase {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      message: t('commerce.readback.shop.unknown'),
      outcome: 'unknown',
    };
  }

  const response = raw as Record<string, unknown>;
  if (response.success !== true) {
    if (response.success !== false) {
      return {
        success: false,
        message: t('commerce.readback.shop.unknown'),
        outcome: 'unknown',
      };
    }

    const error = nonEmptyString(response.error)?.toUpperCase() || '';
    return {
      success: false,
      message: shopPurchaseFailure(error, t),
      outcome: error.includes('INSUFFICIENT')
        ? 'insufficient-balance'
        : 'failed',
    };
  }

  const clientEventId = nonEmptyString(response.client_event_id);
  const itemId = nonEmptyString(response.item_id);
  const itemName = nonEmptyString(response.item_name);
  const itemSku = nonEmptyString(response.item_sku);
  const cost = nonNegativeInteger(response.cost);
  const newBalance = nonNegativeInteger(response.new_balance);
  const quantity = nonNegativeInteger(response.quantity);

  if (
    clientEventId !== expectedClientEventId ||
    itemId !== expectedItemId ||
    !itemName ||
    !itemSku ||
    cost === null ||
    newBalance === null ||
    quantity === null ||
    quantity < 1
  ) {
    return {
      success: false,
      message: t('commerce.readback.shop.unknown'),
      outcome: 'unknown',
    };
  }

  return {
    success: true,
    receipt: {
      clientEventId,
      itemId,
      itemName,
      itemSku,
      cost,
      newBalance,
      quantity,
    },
  };
}

/**
 * Inventory is a server-owned quantity ledger. Empty is meaningful only when
 * the full response is valid, and a malformed row is never silently coerced
 * into zero or omitted.
 */
export function decodeInventoryReadback(
  raw: unknown
): InventoryReadbackRow[] | null {
  if (!Array.isArray(raw)) return null;

  const seenSkus = new Set<string>();
  const rows: InventoryReadbackRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    const source = row as Record<string, unknown>;
    const sku = nonEmptyString(source.item_sku);
    const quantity = nonNegativeInteger(source.quantity);
    if (!sku || quantity === null || seenSkus.has(sku)) return null;
    seenSkus.add(sku);
    rows.push({ item_sku: sku, quantity });
  }

  return rows;
}

export function decodeMomentaBalance(value: unknown): number | null {
  return nonNegativeInteger(value);
}

/**
 * A response-loss recovery can only be marked confirmed when this attempt
 * acquired an item the account did not have before it began. The caller keeps
 * an unresolved attempt blocked when the readback is inconclusive.
 */
export function didPurchaseReadbackAdvance({
  beforeOwned,
  beforeQuantity,
  currentOwned,
  currentQuantity,
}: {
  beforeOwned: boolean;
  beforeQuantity: number;
  currentOwned: boolean;
  currentQuantity: number;
}) {
  return (
    (!beforeOwned && currentOwned) ||
    currentQuantity > Math.max(0, beforeQuantity)
  );
}
