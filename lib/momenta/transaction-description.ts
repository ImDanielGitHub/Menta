import { enNZ, type TranslationKey } from '@/lib/localization/en-NZ';

/**
 * Wallet rows are written by server code and by the RevenueCat webhook, and some
 * of those descriptions embed the store product identifier
 * (`Subscription: com.example.app.pro_monthly`). A person reading their own
 * Momenta history should never be shown a reverse-DNS identifier.
 *
 * This only rephrases what the row already says. It never infers an amount, a
 * date, an entitlement, or a purchase that the ledger did not record, and it
 * leaves any description that is already ordinary language untouched.
 */

/** `com.example.app.pro_monthly` and friends, but not `Bought 3 freezes`. */
const looksLikeProductIdentifier = (value: string) =>
  /^[a-z0-9]+(?:[._-][a-z0-9]+){2,}$/i.test(value) && !value.includes(' ');

const lastIdentifierSegment = (value: string) => {
  const segments = value.split('.').filter(Boolean);
  return segments[segments.length - 1] ?? value;
};

type TransactionTranslate = (key: TranslationKey) => string;

const defaultTranslate: TransactionTranslate = key => String(enNZ[key]);

const planFromIdentifier = (
  identifier: string,
  t: TransactionTranslate
): string | null => {
  const tail = lastIdentifierSegment(identifier).toLowerCase();

  if (/year|annual/.test(tail)) return t('commerce.wallet.yearly');
  if (/month/.test(tail)) return t('commerce.wallet.monthly');
  if (/week/.test(tail)) return t('commerce.wallet.weekly');
  if (/life|forever|perpetual/.test(tail)) return t('commerce.wallet.oneOff');
  return null;
};

/**
 * `Momenta pack` rather than a SKU. The pack size is deliberately not guessed
 * from the identifier: the credited amount is already shown beside the row.
 */
const creditPackLabel = (t: TransactionTranslate) => t('commerce.wallet.pack');

const rewrite = (
  prefix: string,
  remainder: string,
  t: TransactionTranslate
): string | null => {
  const identifier = remainder.trim();
  if (!identifier || !looksLikeProductIdentifier(identifier)) return null;

  if (/^subscription$/i.test(prefix)) {
    return (
      planFromIdentifier(identifier, t) ?? t('commerce.wallet.subscription')
    );
  }

  if (/^credit pack$/i.test(prefix)) {
    return creditPackLabel(t);
  }

  return null;
};

const fallbackForType = (
  transactionType: string | null | undefined,
  t: TransactionTranslate
) => {
  switch ((transactionType ?? '').toLowerCase()) {
    case 'earned':
      return t('commerce.wallet.earnedDescription');
    case 'bonus':
      return t('commerce.wallet.bonusDescription');
    case 'spent':
      return t('commerce.wallet.spentDescription');
    case 'purchase':
    case 'credit':
      return t('commerce.wallet.purchaseDescription');
    case 'adjustment':
      return t('commerce.wallet.adjustmentDescription');
    default:
      return t('commerce.wallet.activityDescription');
  }
};

/**
 * Server-written phrases that use internal vocabulary. A promise is called a
 * promise everywhere a person can read it.
 */
export type DescribableTransaction = {
  description?: string | null;
  transaction_type?: string | null;
};

export const describeMomentaTransaction = (
  transaction: DescribableTransaction,
  t: TransactionTranslate = defaultTranslate
): string => {
  const raw = (transaction.description ?? '').trim();
  if (!raw) return fallbackForType(transaction.transaction_type, t);

  switch (raw.toLowerCase()) {
    case 'challenge creation':
      return t('commerce.wallet.promiseCreated');
    case 'group creation':
      return t('commerce.wallet.groupCreated');
    default:
      break;
  }

  const separatorIndex = raw.indexOf(':');
  if (separatorIndex > 0) {
    const rewritten = rewrite(
      raw.slice(0, separatorIndex),
      raw.slice(separatorIndex + 1),
      t
    );
    if (rewritten) return rewritten;
  }

  // A bare identifier with no prefix, e.g. an older row that stored only the SKU.
  if (looksLikeProductIdentifier(raw)) {
    return (
      planFromIdentifier(raw, t) ??
      fallbackForType(transaction.transaction_type, t)
    );
  }

  return raw;
};
