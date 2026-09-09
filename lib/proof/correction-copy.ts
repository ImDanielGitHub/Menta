import type { ProofMediaType } from '@/lib/proof-types';
import { translate } from '@/lib/localization';

export type CorrectionProofKind = 'note' | 'photo' | 'video' | 'proof';

/** Names the proof the reviewer asked to see again. Unknown types stay generic. */
export const correctionProofKind = (
  proofType?: ProofMediaType | string | null
): CorrectionProofKind => {
  if (proofType === 'text') return 'note';
  if (proofType === 'video') return 'video';
  if (proofType === 'photo') return 'photo';
  return 'proof';
};

export const getCorrectionFeedbackCopy = ({
  proofType,
  correctionReason,
  locale = 'en-NZ',
}: {
  proofType?: ProofMediaType | string | null;
  correctionReason?: string | null;
  locale?: string | null;
}): { title: string; detail: string; primaryLabel: string } => {
  const kind = correctionProofKind(proofType);
  const reason = correctionReason?.trim() || null;
  const resolvedLocale = locale ?? 'en-NZ';
  const copy = (() => {
    switch (kind) {
      case 'note':
        return {
          title: translate(resolvedLocale, 'todayProof.correction.title_note'),
          detail: translate(
            resolvedLocale,
            'todayProof.correction.detail_note'
          ),
          primaryLabel: translate(
            resolvedLocale,
            'todayProof.correction.action_note'
          ),
        };
      case 'photo':
        return {
          title: translate(resolvedLocale, 'todayProof.correction.title_photo'),
          detail: translate(
            resolvedLocale,
            'todayProof.correction.detail_photo'
          ),
          primaryLabel: translate(
            resolvedLocale,
            'todayProof.correction.action_photo'
          ),
        };
      case 'video':
        return {
          title: translate(resolvedLocale, 'todayProof.correction.title_video'),
          detail: translate(
            resolvedLocale,
            'todayProof.correction.detail_video'
          ),
          primaryLabel: translate(
            resolvedLocale,
            'todayProof.correction.action_video'
          ),
        };
      case 'proof':
      default:
        return {
          title: translate(resolvedLocale, 'todayProof.correction.title_proof'),
          detail: translate(
            resolvedLocale,
            'todayProof.correction.detail_proof'
          ),
          primaryLabel: translate(
            resolvedLocale,
            'todayProof.correction.action_proof'
          ),
        };
    }
  })();

  return {
    title: copy.title,
    detail: reason ?? copy.detail,
    primaryLabel: copy.primaryLabel,
  };
};
