import { enNZ, type TranslationKey } from '@/lib/localization/en-NZ';

/**
 * Human-facing commerce states deliberately stay below the proof boundary.
 * A StoreKit return is evidence of a handoff, not evidence that Menta has
 * credited a wallet, added an inventory item, or unlocked an entitlement.
 */
export type CommerceState =
  | 'loading'
  | 'empty'
  | 'offline'
  | 'fetch-error'
  | 'insufficient-balance'
  | 'submitting'
  | 'unknown-result'
  | 'store-receipt-pending'
  | 'server-receipt-confirmed'
  | 'cancelled'
  | 'failed';

export type CommerceNotice = {
  kind: 'success' | 'error' | 'info';
  eyebrow?: string;
  title: string;
  message: string;
  refreshActionTitle?: string;
  facts?: { label: string; value: string }[];
};
type CommerceTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: CommerceTranslate = (key, values = {}) =>
  String(enNZ[key]).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name) =>
    values[name] === undefined ? match : String(values[name])
  );

type StorePurchaseOutcome = {
  success: boolean;
  cancelled?: boolean;
  receiptPending?: boolean;
  storeTransactionCompleted?: boolean;
};

const NETWORK_ERROR_PATTERN =
  /network|offline|internet|timed?\s*out|connection|unreachable/i;

export function isOfflineCommerceError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown })?.message === 'string'
        ? String((error as { message: string }).message)
        : String(error || '');

  return NETWORK_ERROR_PATTERN.test(message);
}

export function getStorePurchaseState(
  outcome: StorePurchaseOutcome
): CommerceState {
  if (outcome.success && outcome.receiptPending) {
    return 'store-receipt-pending';
  }
  if (outcome.success) return 'server-receipt-confirmed';
  if (outcome.cancelled) return 'cancelled';
  if (outcome.storeTransactionCompleted) return 'unknown-result';
  return 'failed';
}

export function getCommerceNotice(
  state: CommerceState,
  options?: { itemName?: string; shortfall?: number },
  t: CommerceTranslate = defaultTranslate
): CommerceNotice {
  switch (state) {
    case 'offline':
      return {
        kind: 'info',
        title: t('commerce.commerce.offline'),
        message: t('commerce.commerce.offlineDetail'),
        refreshActionTitle: t('commerce.action.checkAgain'),
      };
    case 'fetch-error':
      return {
        kind: 'error',
        title: t('commerce.commerce.fetchError'),
        message: t('commerce.commerce.fetchErrorDetail'),
        refreshActionTitle: t('commerce.action.tryAgain'),
      };
    case 'insufficient-balance':
      return {
        kind: 'info',
        title: t('commerce.commerce.insufficient'),
        message: options?.shortfall
          ? t('commerce.commerce.insufficientDetail', {
              amount: options.shortfall,
            })
          : t('commerce.commerce.insufficientGeneric'),
        facts: [
          {
            label: t('commerce.commerce.purchaseLabel'),
            value: t('commerce.commerce.notStarted'),
          },
          {
            label: t('commerce.commerce.momentaSpentLabel'),
            value: t('commerce.commerce.zero'),
          },
        ],
      };
    case 'submitting':
      return {
        kind: 'info',
        title: t('commerce.commerce.submitting'),
        message: t('commerce.commerce.submittingDetail'),
        facts: [
          {
            label: t('commerce.commerce.purchaseLabel'),
            value: t('commerce.commerce.checkingLabel'),
          },
          {
            label: t('commerce.commerce.balanceItemsLabel'),
            value: t('commerce.commerce.notChangedYet'),
          },
        ],
      };
    case 'unknown-result':
      return {
        kind: 'info',
        title: t('commerce.commerce.unknown'),
        message: t('commerce.commerce.unknownDetail'),
        refreshActionTitle: t('commerce.action.checkStatus'),
        facts: [
          {
            label: t('commerce.commerce.purchaseLabel'),
            value: t('commerce.commerce.stillCheckingLabel'),
          },
          {
            label: t('commerce.commerce.buyAgainLabel'),
            value: t('commerce.commerce.waitUntilChecked'),
          },
        ],
      };
    case 'store-receipt-pending':
      return {
        kind: 'info',
        title: t('commerce.commerce.storePending'),
        message: t('commerce.commerce.storePendingDetail'),
        refreshActionTitle: t('commerce.action.checkAgain'),
        facts: [
          {
            label: t('commerce.commerce.applePurchaseLabel'),
            value: t('commerce.commerce.purchaseStatusComplete'),
          },
          {
            label: t('commerce.commerce.momentaLabel'),
            value: t('commerce.commerce.waitingLabel'),
          },
        ],
      };
    case 'server-receipt-confirmed':
      return {
        kind: 'success',
        title: t('commerce.commerce.purchaseComplete'),
        message: options?.itemName
          ? t('commerce.commerce.purchaseCompleteForItem', {
              name: options.itemName,
            })
          : t('commerce.commerce.purchaseCompleteGeneric'),
        refreshActionTitle: t('commerce.action.checkStatus'),
        facts: [
          {
            label: t('commerce.commerce.purchaseLabel'),
            value: t('commerce.commerce.purchaseStatusComplete'),
          },
          {
            label: options?.itemName
              ? t('commerce.commerce.yourItemsLabel')
              : t('commerce.commerce.accountLabel'),
            value: t('commerce.commerce.updatedStatus'),
          },
        ],
      };
    case 'cancelled':
      return {
        kind: 'info',
        title: t('commerce.commerce.cancelled'),
        message: t('commerce.commerce.cancelledDetail'),
        facts: [
          {
            label: t('commerce.commerce.paymentLabel'),
            value: t('commerce.commerce.notMade'),
          },
          {
            label: t('commerce.commerce.momentaLabel'),
            value: t('commerce.commerce.notAdded'),
          },
        ],
      };
    case 'failed':
      return {
        kind: 'error',
        title: t('commerce.commerce.failed'),
        message: t('commerce.commerce.failedDetail'),
        refreshActionTitle: t('commerce.action.tryAgain'),
        facts: [
          {
            label: t('commerce.commerce.paymentLabel'),
            value: t('commerce.commerce.notMade'),
          },
          {
            label: t('commerce.commerce.itemsLabel'),
            value: t('commerce.commerce.unchanged'),
          },
        ],
      };
    case 'empty':
      return {
        kind: 'info',
        title: t('commerce.commerce.nothingHere'),
        message: t('commerce.commerce.completedAppear'),
      };
    case 'loading':
      return {
        kind: 'info',
        title: t('commerce.commerce.loadingTitle'),
        message: t('commerce.commerce.loadingDetail'),
      };
  }
}
