import { translate } from '@/lib/localization';
import type { TranslationKey } from '@/lib/localization/en-NZ';

export type ProofMediaTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

export type ProofMediaErrorKind =
  'missing' | 'prepare' | 'too_large' | 'reopen';

const defaultTranslate: ProofMediaTranslate = (key, values) =>
  translate('en-NZ', key, values);

/** Names a local proof-file failure without leftover English or “media” jargon. */
export const getProofMediaErrorCopy = (
  kind: ProofMediaErrorKind,
  t: ProofMediaTranslate = defaultTranslate
): string => {
  switch (kind) {
    case 'missing':
    case 'reopen':
      return t('shared.camera.reopenSavedProofFailed');
    case 'prepare':
    case 'too_large':
      return t('shared.camera.proofPrepareFailed');
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
};
