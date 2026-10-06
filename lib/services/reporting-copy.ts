import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export type ReportReceiptCopyKind =
  | 'unverified'
  | 'not_sent'
  | 'sign_in'
  | 'account_changed'
  | 'account_changed_after_send';

/**
 * Customer-facing report send receipts. Reuse existing report keys so a
 * failed send never shows leftover English or a raw server message.
 */
export function getReportReceiptCopy(
  kind: ReportReceiptCopyKind,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  switch (kind) {
    case 'unverified':
      return translateCopy('domain.report.could_not_confirm');
    case 'not_sent':
      return translateCopy('domain.report.remains_on_phone');
    case 'sign_in':
      return translateCopy(
        'fullAuth.report_issue.sign_in_again_before_sending_this_private_report'
      );
    case 'account_changed':
      return translateCopy('fullAuth.residual.report.other_account');
    case 'account_changed_after_send':
      return translateCopy('fullAuth.residual.report.return_description');
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
