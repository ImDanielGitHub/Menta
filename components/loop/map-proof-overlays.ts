import {
  formatLocalDay,
  type LocalProofOverlayFact,
  type LocalProofOverlayStatus,
} from '@/lib/loop';
import type { ProofDraft, ProofReceiptStatus } from '@/lib/proof-drafts';

const OVERLAY_STATUS_BY_RECEIPT: Partial<
  Record<ProofReceiptStatus, LocalProofOverlayStatus>
> = {
  'saved-local': 'saved-local',
  uploading: 'uploading',
  'unknown-result': 'unknown-result',
  failed: 'terminal-failure',
};

/**
 * Map durable proof drafts into local overlays.
 * Server-confirmed receipts never become overlays.
 */
export const mapProofDraftsToOverlays = (
  drafts: readonly ProofDraft[],
  args: {
    userId: string;
    fallbackTimezone: string;
    fallbackLocalDay: string;
  }
): LocalProofOverlayFact[] => {
  const overlays: LocalProofOverlayFact[] = [];

  for (const draft of drafts) {
    if (draft.userId !== args.userId) continue;

    const overlayStatus = OVERLAY_STATUS_BY_RECEIPT[draft.status];
    if (!overlayStatus) continue;

    const timezone = draft.clientTimeZone || args.fallbackTimezone;
    let localDay = args.fallbackLocalDay;
    try {
      localDay = formatLocalDay(draft.updatedAt, timezone);
    } catch {
      localDay = args.fallbackLocalDay;
    }

    overlays.push({
      clientEventId: draft.clientEventId,
      challengeId: draft.challengeId,
      status: overlayStatus,
      localDay,
      updatedAtIso: draft.updatedAt,
      localMediaUri: draft.localMediaUri,
      groupId: null,
    });
  }

  return overlays.sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
};
