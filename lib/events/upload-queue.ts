import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClientEventId } from '@/lib/client-event-id';
import {
  EVENT_MEDIA_CONTENT_TYPES,
  type EventMediaContentType,
  type EventPostQueueStatus,
  type EventUploadQueueItem,
} from '@/types/event';

const STORAGE_VERSION = 'menta.event-upload-queue.v2';

type QueueMutator<T> = () => Promise<T>;

const storageLocks = new Map<string, Promise<void>>();
const uploadPipelines = new Map<string, Promise<void>>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMediaContentType = (value: unknown): value is EventMediaContentType =>
  typeof value === 'string' &&
  EVENT_MEDIA_CONTENT_TYPES.includes(value as EventMediaContentType);

const isQueueStatus = (value: unknown): value is EventPostQueueStatus =>
  value === 'saved_local' ||
  value === 'uploading' ||
  value === 'pending_review' ||
  value === 'failed' ||
  value === 'unknown_result';

const queueIndexKey = (userId: string): string =>
  `${STORAGE_VERSION}.${userId}.index`;

const queueItemKey = (userId: string, clientEventId: string): string =>
  `${STORAGE_VERSION}.${userId}.${clientEventId}`;

const parseQueueItem = (value: unknown): EventUploadQueueItem | null => {
  if (!isRecord(value)) return null;

  if (
    typeof value.userId !== 'string' ||
    typeof value.clientEventId !== 'string' ||
    typeof value.eventId !== 'string' ||
    typeof value.occurrenceId !== 'string' ||
    typeof value.localUri !== 'string' ||
    typeof value.byteSize !== 'number' ||
    !Number.isInteger(value.byteSize) ||
    !isMediaContentType(value.contentType) ||
    !isQueueStatus(value.status) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null;
  }

  const nullableString = (candidate: unknown): string | null =>
    typeof candidate === 'string' ? candidate : null;

  return {
    userId: value.userId,
    clientEventId: value.clientEventId,
    eventId: value.eventId,
    occurrenceId: value.occurrenceId,
    localUri: value.localUri,
    caption: nullableString(value.caption),
    contentType: value.contentType,
    byteSize: value.byteSize,
    status: value.status,
    postId: nullableString(value.postId),
    storagePath: nullableString(value.storagePath),
    lastReceiptCode: nullableString(value.lastReceiptCode),
    lastError: nullableString(value.lastError),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const readIndex = async (userId: string): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(queueIndexKey(userId));
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
};

const writeIndex = async (userId: string, ids: string[]): Promise<void> => {
  await AsyncStorage.setItem(queueIndexKey(userId), JSON.stringify(ids));
};

const enqueueStorageMutation = <T>(
  userId: string,
  operation: QueueMutator<T>
): Promise<T> => {
  const previous = storageLocks.get(userId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  const settled = current.then(
    () => undefined,
    () => undefined
  );

  storageLocks.set(userId, settled);
  return current;
};

/**
 * Serialises actual upload workflows for one account. The durable records are
 * separate per client event ID, so account A can never drain account B's work.
 */
export const serialiseEventUploadForUser = <T>(
  userId: string,
  operation: QueueMutator<T>
): Promise<T> => {
  const previous = uploadPipelines.get(userId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  const settled = current.then(
    () => undefined,
    () => undefined
  );

  uploadPipelines.set(userId, settled);
  return current;
};

export { createClientEventId };

export const listEventUploadQueue = async (
  userId: string
): Promise<EventUploadQueueItem[]> => {
  const ids = await readIndex(userId);
  const rows = await Promise.all(
    ids.map(async clientEventId => {
      const raw = await AsyncStorage.getItem(
        queueItemKey(userId, clientEventId)
      );
      if (!raw) return null;

      try {
        const item = parseQueueItem(JSON.parse(raw) as unknown);
        return item?.userId === userId ? item : null;
      } catch {
        return null;
      }
    })
  );

  return rows
    .filter((row): row is EventUploadQueueItem => row !== null)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
};

export const getEventUploadDraft = async (
  userId: string,
  clientEventId: string
): Promise<EventUploadQueueItem | null> => {
  const raw = await AsyncStorage.getItem(queueItemKey(userId, clientEventId));
  if (!raw) return null;

  try {
    const item = parseQueueItem(JSON.parse(raw) as unknown);
    return item?.userId === userId ? item : null;
  } catch {
    return null;
  }
};

export const upsertEventUploadDraft = async (
  input: Omit<
    EventUploadQueueItem,
    | 'createdAt'
    | 'updatedAt'
    | 'postId'
    | 'storagePath'
    | 'lastReceiptCode'
    | 'lastError'
  > &
    Partial<
      Pick<
        EventUploadQueueItem,
        'postId' | 'storagePath' | 'lastReceiptCode' | 'lastError'
      >
    >
): Promise<EventUploadQueueItem> =>
  enqueueStorageMutation(input.userId, async () => {
    const existing = await getEventUploadDraft(
      input.userId,
      input.clientEventId
    );
    const now = new Date().toISOString();
    const item: EventUploadQueueItem = {
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      postId: input.postId ?? existing?.postId ?? null,
      storagePath: input.storagePath ?? existing?.storagePath ?? null,
      lastReceiptCode:
        input.lastReceiptCode ?? existing?.lastReceiptCode ?? null,
      lastError: input.lastError ?? existing?.lastError ?? null,
    };

    await AsyncStorage.setItem(
      queueItemKey(input.userId, input.clientEventId),
      JSON.stringify(item)
    );

    const ids = await readIndex(input.userId);
    if (!ids.includes(input.clientEventId)) {
      await writeIndex(input.userId, [...ids, input.clientEventId]);
    }

    return item;
  });

export const updateEventUploadDraft = async (
  userId: string,
  clientEventId: string,
  patch: Partial<
    Omit<
      EventUploadQueueItem,
      | 'userId'
      | 'clientEventId'
      | 'eventId'
      | 'occurrenceId'
      | 'localUri'
      | 'createdAt'
    >
  >
): Promise<EventUploadQueueItem | null> =>
  enqueueStorageMutation(userId, async () => {
    const existing = await getEventUploadDraft(userId, clientEventId);
    if (!existing) return null;

    const updated: EventUploadQueueItem = {
      ...existing,
      ...patch,
      userId: existing.userId,
      clientEventId: existing.clientEventId,
      eventId: existing.eventId,
      occurrenceId: existing.occurrenceId,
      localUri: existing.localUri,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      queueItemKey(userId, clientEventId),
      JSON.stringify(updated)
    );
    return updated;
  });

export const removeEventUploadDraft = async (
  userId: string,
  clientEventId: string
): Promise<void> =>
  enqueueStorageMutation(userId, async () => {
    await AsyncStorage.removeItem(queueItemKey(userId, clientEventId));
    const ids = await readIndex(userId);
    await writeIndex(
      userId,
      ids.filter(id => id !== clientEventId)
    );
  });

export const clearEventUploadQueue = async (userId: string): Promise<void> =>
  enqueueStorageMutation(userId, async () => {
    const ids = await readIndex(userId);
    await Promise.all(
      ids.map(clientEventId =>
        AsyncStorage.removeItem(queueItemKey(userId, clientEventId))
      )
    );
    await AsyncStorage.removeItem(queueIndexKey(userId));
  });

export const drainEventUploadQueue = async <T>(
  userId: string,
  processItem: (item: EventUploadQueueItem) => Promise<T>
): Promise<T[]> =>
  serialiseEventUploadForUser(userId, async () => {
    const items = await listEventUploadQueue(userId);
    const results: T[] = [];

    for (const item of items) {
      results.push(await processItem(item));
    }

    return results;
  });
