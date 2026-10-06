import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClientEventId } from '@/lib/client-event-id';
import { getCorrectionFeedbackCopy } from '@/lib/proof/correction-copy';
import { isProofMediaType, type ProofMediaType } from '@/lib/proof-types';
import { translate } from '@/lib/localization';

export { createClientEventId };

export const PROOF_DRAFTS_STORAGE_KEY = 'menta.proof-drafts.v1';
const SAVED_LOCAL_STATUS: ProofReceiptStatus = 'saved-local';

/**
 * Truthful proof receipt states for the durable proof contract.
 * Never promote local-only state to server truth in UI copy.
 */
export type ProofReceiptStatus =
  | 'saved-local'
  | 'uploading'
  | 'sent'
  | 'pending-review'
  | 'accepted'
  | 'correction-requested'
  | 'unknown-result'
  | 'failed';

export const PROOF_RECEIPT_STATUSES: readonly ProofReceiptStatus[] = [
  'saved-local',
  'uploading',
  'sent',
  'pending-review',
  'accepted',
  'correction-requested',
  'unknown-result',
  'failed',
] as const;

export type ProofDraft = {
  clientEventId: string;
  userId: string;
  challengeId: string;
  /** Group origin retained across capture, restart, and receipt routing. */
  groupId: string | null;
  proofType: ProofMediaType;
  /** Local capture URI when available (photo/video). Null for text. */
  localMediaUri: string | null;
  /**
   * Submission payload: trimmed text for text proofs, or remote/local media
   * reference for photo/video.
   */
  proofValue: string;
  /** Uploaded storage URL/key once media has left the device. */
  remoteMediaUrl: string | null;
  clientTimeZone: string;
  status: ProofReceiptStatus;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  submissionId: string | null;
  serverStatus: string | null;
  allowSelfReview: boolean | null;
  /**
   * Set only after the person deliberately completes the send control.
   * A captured preview may be persisted before this point, but it must never
   * enter the foreground retry queue or reach the server without consent.
   */
  sendRequestedAt: string | null;
  /** New receipt tracking only; absent on legacy receipts already counted. */
  analyticsTrackingVersion?: 1;
};

export type CreateProofDraftInput = {
  userId: string;
  challengeId: string;
  groupId?: string | null;
  proofType: ProofMediaType;
  proofValue: string;
  clientTimeZone: string;
  clientEventId?: string;
  localMediaUri?: string | null;
  remoteMediaUrl?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isProofReceiptStatus = (
  value: unknown
): value is ProofReceiptStatus =>
  typeof value === 'string' &&
  (PROOF_RECEIPT_STATUSES as readonly string[]).includes(value);

export const mapServerStatusToReceipt = (
  serverStatus: string | null | undefined
): ProofReceiptStatus => {
  if (serverStatus === 'approved') return 'accepted';
  if (serverStatus === 'pending') return 'pending-review';
  if (serverStatus === 'rejected') return 'correction-requested';
  if (serverStatus === 'submitted' || serverStatus === 'sent') return 'sent';
  return 'unknown-result';
};

/**
 * Calm NZ-facing receipt labels. Does not claim background upload.
 */
export const getProofReceiptCopy = (
  status: ProofReceiptStatus,
  options?: {
    proofType?: ProofMediaType | null;
    correctionReason?: string | null;
    locale?: string | null;
  }
): { title: string; detail: string } => {
  const locale = options?.locale ?? 'en-NZ';
  switch (status) {
    case 'saved-local':
      return {
        title: translate(locale, 'todayProof.residual.saved_on_this_phone'),
        detail: translate(
          locale,
          'todayProof.residual.your_draft_stays_on_this_phone_open_menta_when_you_are_online_to'
        ),
      };
    case 'uploading':
      return {
        title: translate(locale, 'todayProof.proof.sending'),
        detail: translate(locale, 'todayProof.proof.uploading_detail'),
      };
    case 'sent':
      return {
        title: translate(locale, 'todayProof.residual.proof_sent'),
        detail: translate(locale, 'todayProof.proof.sent_detail'),
      };
    case 'pending-review':
      return {
        title: translate(locale, 'todayProof.today.status_pending'),
        detail: translate(
          locale,
          'todayProof.residual.your_proof_is_in_but_it_does_not_count_yet_it_counts_after_a_rev'
        ),
      };
    case 'accepted':
      return {
        title: translate(locale, 'todayProof.residual.proof_approved'),
        detail: translate(
          locale,
          'todayProof.residual.it_now_counts_for_today_s_promise'
        ),
      };
    case 'correction-requested': {
      const correction = getCorrectionFeedbackCopy({
        proofType: options?.proofType,
        correctionReason: options?.correctionReason,
        locale,
      });
      return { title: correction.title, detail: correction.detail };
    }
    case 'unknown-result':
      return {
        title: translate(
          locale,
          'todayProof.residual.we_couldn_t_confirm_the_send'
        ),
        detail: translate(
          locale,
          'todayProof.residual.menta_could_not_confirm_whether_your_proof_was_sent_your_origina'
        ),
      };
    case 'failed':
      return {
        title: translate(locale, 'todayProof.residual.not_sent'),
        detail: translate(
          locale,
          'todayProof.residual.check_your_connection_then_try_again'
        ),
      };
  }
};

export const isTerminalProofReceipt = (status: ProofReceiptStatus): boolean =>
  status === 'accepted' ||
  status === 'pending-review' ||
  status === 'correction-requested';

/** Only server-backed receipts are suitable for outward-facing sharing. */
export const isShareableProofReceipt = (
  status: ProofReceiptStatus | null | undefined
): status is 'pending-review' | 'accepted' =>
  status === 'pending-review' || status === 'accepted';

export const isForegroundResumableReceipt = (
  status: ProofReceiptStatus
): boolean =>
  status === 'saved-local' ||
  status === 'uploading' ||
  status === 'sent' ||
  status === 'unknown-result';

const parseProofDraft = (value: unknown): ProofDraft | null => {
  if (!isRecord(value)) return null;
  if (typeof value.clientEventId !== 'string' || !value.clientEventId) {
    return null;
  }
  if (typeof value.userId !== 'string' || !value.userId) return null;
  if (typeof value.challengeId !== 'string' || !value.challengeId) return null;
  if (!isProofMediaType(value.proofType)) return null;
  if (typeof value.proofValue !== 'string') return null;
  if (typeof value.clientTimeZone !== 'string' || !value.clientTimeZone) {
    return null;
  }
  if (!isProofReceiptStatus(value.status)) return null;
  if (
    typeof value.attemptCount !== 'number' ||
    !Number.isFinite(value.attemptCount)
  ) {
    return null;
  }
  if (
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    ...(value.analyticsTrackingVersion === 1
      ? { analyticsTrackingVersion: 1 as const }
      : {}),
    clientEventId: value.clientEventId,
    userId: value.userId,
    challengeId: value.challengeId,
    groupId: typeof value.groupId === 'string' ? value.groupId : null,
    proofType: value.proofType,
    localMediaUri:
      typeof value.localMediaUri === 'string' ? value.localMediaUri : null,
    proofValue: value.proofValue,
    remoteMediaUrl:
      typeof value.remoteMediaUrl === 'string' ? value.remoteMediaUrl : null,
    clientTimeZone: value.clientTimeZone,
    status: value.status,
    attemptCount: value.attemptCount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    lastError: typeof value.lastError === 'string' ? value.lastError : null,
    submissionId:
      typeof value.submissionId === 'string' ? value.submissionId : null,
    serverStatus:
      typeof value.serverStatus === 'string' ? value.serverStatus : null,
    allowSelfReview:
      typeof value.allowSelfReview === 'boolean' ? value.allowSelfReview : null,
    sendRequestedAt:
      typeof value.sendRequestedAt === 'string' ? value.sendRequestedAt : null,
  };
};

const readProofDrafts = async (strict = false): Promise<ProofDraft[]> => {
  const raw = await AsyncStorage.getItem(PROOF_DRAFTS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      if (strict) throw new Error('Stored proof drafts are unreadable.');
      return [];
    }
    if (strict && parsed.some(value => !parseProofDraft(value))) {
      throw new Error('Stored proof drafts are unreadable.');
    }
    return parsed
      .map(parseProofDraft)
      .filter((draft): draft is ProofDraft => draft !== null);
  } catch (error) {
    if (strict) throw error;
    console.warn('[ProofDrafts] Failed to parse stored drafts; resetting.');
    return [];
  }
};

export const loadProofDrafts = (): Promise<ProofDraft[]> => readProofDrafts();

export type ProofDraftWriteGuard = (existing: ProofDraft | null) => boolean;
let mutationTail: Promise<unknown> = Promise.resolve();
// A rejected native storage write may have committed. Never infer non-adoption
// from rejection, even if a subsequent read appears empty.
const uncertainMedia = new Set<string>();
const serializeMutation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = mutationTail.then(operation);
  mutationTail = result.catch(() => undefined);
  return result;
};

const persistProofDrafts = async (drafts: ProofDraft[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      PROOF_DRAFTS_STORAGE_KEY,
      JSON.stringify(drafts)
    );
  } catch (error) {
    for (const draft of drafts) {
      if (draft.localMediaUri) uncertainMedia.add(draft.localMediaUri);
    }
    throw error;
  }
};

const assertWriteAllowed = (
  existing: ProofDraft | null,
  guard?: ProofDraftWriteGuard
): void => {
  if (guard && !guard(existing)) {
    throw new Error('This proof capture is no longer current.');
  }
};

/** Called only with the exact fresh URI returned to an attempt, never a retry.
 * The queue waits for every draft writer and holds the reference check through
 * synchronous deletion. Failed reads/deletes and uncertain writes retain media.
 */
export const releaseUnreferencedProofMedia = (
  uri: string,
  release: (uri: string) => void
): Promise<boolean> =>
  serializeMutation(async () => {
    try {
      if (uncertainMedia.has(uri)) return false;
      const drafts = await readProofDrafts(true);
      if (
        drafts.some(
          draft => draft.localMediaUri === uri || draft.proofValue === uri
        )
      ) {
        return false;
      }
      release(uri);
      return true;
    } catch {
      return false;
    }
  });

export const getProofDraft = async (
  clientEventId: string
): Promise<ProofDraft | null> => {
  const drafts = await loadProofDrafts();
  return drafts.find(draft => draft.clientEventId === clientEventId) ?? null;
};

export const getActiveProofDraftForChallenge = async (
  userId: string,
  challengeId: string
): Promise<ProofDraft | null> => {
  const drafts = await loadProofDrafts();
  const matches = drafts
    .filter(
      draft =>
        draft.userId === userId &&
        draft.challengeId === challengeId &&
        !isTerminalProofReceipt(draft.status)
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return matches[0] ?? null;
};

export const listResumableProofDrafts = async (): Promise<ProofDraft[]> => {
  const drafts = await loadProofDrafts();
  return drafts
    .filter(
      draft =>
        isForegroundResumableReceipt(draft.status) &&
        (draft.status !== 'saved-local' || draft.sendRequestedAt !== null)
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

const saveDraftInTransaction = async (
  draft: ProofDraft,
  guard?: ProofDraftWriteGuard
): Promise<ProofDraft> => {
  const drafts = await readProofDrafts(true);
  const index = drafts.findIndex(
    existing => existing.clientEventId === draft.clientEventId
  );
  const existing = index >= 0 ? drafts[index] : null;
  if (
    existing &&
    (existing.userId !== draft.userId ||
      existing.challengeId !== draft.challengeId)
  ) {
    throw new Error('This proof belongs to a different account or promise.');
  }
  if (index >= 0) drafts[index] = draft;
  else drafts.push(draft);
  assertWriteAllowed(existing, guard);
  await persistProofDrafts(drafts);
  return draft;
};

export const saveProofDraft = (
  draft: ProofDraft,
  guard?: ProofDraftWriteGuard
): Promise<ProofDraft> =>
  serializeMutation(() => saveDraftInTransaction(draft, guard));

export const createProofDraft = async (
  input: CreateProofDraftInput,
  guard?: ProofDraftWriteGuard
): Promise<ProofDraft> => {
  const now = new Date().toISOString();
  const proofType = input.proofType;
  const cleanedValue =
    proofType === 'text' ? input.proofValue.trim() : input.proofValue;
  const remoteMediaUrl =
    input.remoteMediaUrl ??
    (proofType === 'text'
      ? null
      : input.proofValue.startsWith('file:')
        ? null
        : input.proofValue);

  const draft: ProofDraft = {
    clientEventId: input.clientEventId ?? createClientEventId(),
    userId: input.userId,
    challengeId: input.challengeId,
    groupId: input.groupId?.trim() || null,
    proofType,
    localMediaUri:
      input.localMediaUri ??
      (proofType !== 'text' && input.proofValue.startsWith('file:')
        ? input.proofValue
        : null),
    proofValue: cleanedValue,
    remoteMediaUrl,
    clientTimeZone: input.clientTimeZone,
    status: SAVED_LOCAL_STATUS,
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
    lastError: null,
    submissionId: null,
    serverStatus: null,
    allowSelfReview: null,
    sendRequestedAt: null,
  };

  return saveProofDraft(draft, guard);
};

export const updateProofDraft = (
  clientEventId: string,
  patch: Partial<
    Omit<ProofDraft, 'clientEventId' | 'userId' | 'challengeId' | 'createdAt'>
  >,
  guard?: ProofDraftWriteGuard
): Promise<ProofDraft> =>
  serializeMutation(async () => {
    const drafts = await readProofDrafts(true);
    const index = drafts.findIndex(
      draft => draft.clientEventId === clientEventId
    );
    const existing = drafts[index];
    if (!existing) throw new Error(`Proof draft not found: ${clientEventId}`);
    const updated: ProofDraft = {
      ...existing,
      ...patch,
      clientEventId: existing.clientEventId,
      userId: existing.userId,
      challengeId: existing.challengeId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    drafts[index] = updated;
    assertWriteAllowed(existing, guard);
    await persistProofDrafts(drafts);
    return updated;
  });

export const removeProofDraft = (clientEventId: string): Promise<void> =>
  serializeMutation(async () => {
    const drafts = await readProofDrafts(true);
    await persistProofDrafts(
      drafts.filter(draft => draft.clientEventId !== clientEventId)
    );
  });
