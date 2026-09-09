import type { ProofMediaType } from '@/lib/proof-types';

export type ReviewEvidenceStatus = 'loading' | 'available' | 'unavailable';

type ReviewEvidenceInput = {
  mediaType: ProofMediaType;
  mediaUrl: string;
  submissionText?: string;
};

/**
 * A reviewer can decide only after usable evidence is present. An unavailable
 * link preserves the submission record but never becomes an empty or failed
 * submission, and never unlocks approve/reject actions.
 */
export const getReviewEvidenceStatus = (
  input: ReviewEvidenceInput,
  observedMediaStatus?: ReviewEvidenceStatus
): ReviewEvidenceStatus => {
  if (input.mediaType === 'text') {
    const body = (input.submissionText || input.mediaUrl).trim();
    return body ? 'available' : 'unavailable';
  }

  if (!input.mediaUrl.trim()) return 'unavailable';
  return observedMediaStatus ?? 'loading';
};
