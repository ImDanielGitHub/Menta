import type { ProofDraft } from '@/lib/proof-drafts';

/** Local durable proof is private to both its owner and its promise. */
export const isProofDraftForContext = (
  draft: ProofDraft | null | undefined,
  userId: string | null | undefined,
  challengeId: string | null | undefined
): draft is ProofDraft =>
  Boolean(
    draft &&
    userId &&
    challengeId &&
    draft.userId === userId &&
    draft.challengeId === challengeId
  );
