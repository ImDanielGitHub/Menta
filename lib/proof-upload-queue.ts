import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getProofDraft,
  isForegroundResumableReceipt,
  listResumableProofDrafts,
  type ProofDraft,
  type ProofReceiptStatus,
} from '@/lib/proof-drafts';

export const PROOF_UPLOAD_QUEUE_STORAGE_KEY = 'menta.proof-upload-queue.v1';

/**
 * Queue metadata for foreground-resumable proof submission.
 * This is not a background execution claim — drain only while the app is open.
 */
export type ProofUploadQueueItem = {
  clientEventId: string;
  userId: string;
  challengeId: string;
  enqueuedAt: string;
  nextAttemptAt: string | null;
  attemptCount: number;
  lastError: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseQueueItem = (value: unknown): ProofUploadQueueItem | null => {
  if (!isRecord(value)) return null;
  if (typeof value.clientEventId !== 'string' || !value.clientEventId) {
    return null;
  }
  if (typeof value.userId !== 'string' || !value.userId) return null;
  if (typeof value.challengeId !== 'string' || !value.challengeId) return null;
  if (typeof value.enqueuedAt !== 'string') return null;
  if (
    typeof value.attemptCount !== 'number' ||
    !Number.isFinite(value.attemptCount)
  ) {
    return null;
  }

  return {
    clientEventId: value.clientEventId,
    userId: value.userId,
    challengeId: value.challengeId,
    enqueuedAt: value.enqueuedAt,
    nextAttemptAt:
      typeof value.nextAttemptAt === 'string' ? value.nextAttemptAt : null,
    attemptCount: value.attemptCount,
    lastError: typeof value.lastError === 'string' ? value.lastError : null,
  };
};

export const loadProofUploadQueue = async (): Promise<
  ProofUploadQueueItem[]
> => {
  const raw = await AsyncStorage.getItem(PROOF_UPLOAD_QUEUE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseQueueItem)
      .filter((item): item is ProofUploadQueueItem => item !== null);
  } catch {
    console.warn('[ProofUploadQueue] Failed to parse queue; resetting.');
    return [];
  }
};

const persistProofUploadQueue = async (
  items: ProofUploadQueueItem[]
): Promise<void> => {
  await AsyncStorage.setItem(
    PROOF_UPLOAD_QUEUE_STORAGE_KEY,
    JSON.stringify(items)
  );
};

export const getQueuedProofUpload = async (
  clientEventId: string
): Promise<ProofUploadQueueItem | null> => {
  const items = await loadProofUploadQueue();
  return items.find(item => item.clientEventId === clientEventId) ?? null;
};

export const enqueueProofUpload = async (
  draft: Pick<
    ProofDraft,
    'clientEventId' | 'userId' | 'challengeId' | 'attemptCount' | 'lastError'
  >
): Promise<ProofUploadQueueItem> => {
  const items = await loadProofUploadQueue();
  const existingIndex = items.findIndex(
    item => item.clientEventId === draft.clientEventId
  );
  const now = new Date().toISOString();
  const next: ProofUploadQueueItem = {
    clientEventId: draft.clientEventId,
    userId: draft.userId,
    challengeId: draft.challengeId,
    enqueuedAt: existingIndex >= 0 ? items[existingIndex].enqueuedAt : now,
    nextAttemptAt: now,
    attemptCount: draft.attemptCount,
    lastError: draft.lastError,
  };

  if (existingIndex >= 0) {
    items[existingIndex] = next;
  } else {
    items.push(next);
  }

  await persistProofUploadQueue(items);
  return next;
};

export const updateProofUploadQueueItem = async (
  clientEventId: string,
  patch: Partial<
    Omit<
      ProofUploadQueueItem,
      'clientEventId' | 'userId' | 'challengeId' | 'enqueuedAt'
    >
  >
): Promise<ProofUploadQueueItem> => {
  const items = await loadProofUploadQueue();
  const index = items.findIndex(item => item.clientEventId === clientEventId);
  if (index < 0) {
    throw new Error(`Proof upload queue item not found: ${clientEventId}`);
  }

  const updated: ProofUploadQueueItem = {
    ...items[index],
    ...patch,
    clientEventId: items[index].clientEventId,
    userId: items[index].userId,
    challengeId: items[index].challengeId,
    enqueuedAt: items[index].enqueuedAt,
  };
  items[index] = updated;
  await persistProofUploadQueue(items);
  return updated;
};

export const dequeueProofUpload = async (
  clientEventId: string
): Promise<void> => {
  const items = await loadProofUploadQueue();
  const next = items.filter(item => item.clientEventId !== clientEventId);
  await persistProofUploadQueue(next);
};

export const canQueueReceiptStatus = (status: ProofReceiptStatus): boolean =>
  isForegroundResumableReceipt(status);

/**
 * Drafts that should be drained only while the app is in the foreground.
 * Does not schedule background work.
 */
export const listForegroundResumableUploads = async (): Promise<
  ProofDraft[]
> => {
  const [queue, drafts] = await Promise.all([
    loadProofUploadQueue(),
    listResumableProofDrafts(),
  ]);
  const queuedIds = new Set(queue.map(item => item.clientEventId));

  const fromQueue: ProofDraft[] = [];
  for (const item of queue) {
    const draft = await getProofDraft(item.clientEventId);
    if (
      draft &&
      isForegroundResumableReceipt(draft.status) &&
      (draft.status !== 'saved-local' || draft.sendRequestedAt !== null)
    ) {
      fromQueue.push(draft);
    }
  }

  const orphanDrafts = drafts.filter(
    draft => !queuedIds.has(draft.clientEventId)
  );

  return [...fromQueue, ...orphanDrafts].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
};
