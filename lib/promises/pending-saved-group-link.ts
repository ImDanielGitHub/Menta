import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PromiseSavedGroupLinkRequest } from './saved-group-link';

export type PendingSavedGroupLink = {
  version: 1;
  request: Omit<PromiseSavedGroupLinkRequest, 'groupId'>;
  createdAt: string;
  group?: {
    id: string;
    name: string;
  };
};

const STORAGE_PREFIX = 'menta.pending-saved-group-link.v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const boundedText = (value: unknown, maximum: number): string | null =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= maximum
    ? value.trim()
    : null;

export const getPendingSavedGroupLinkKey = (actorId: string): string =>
  `${STORAGE_PREFIX}:${actorId}`;

export const decodePendingSavedGroupLink = (
  raw: string | null,
  now = Date.now()
): PendingSavedGroupLink | null => {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Record<string, unknown>;
    const request = candidate.request;
    if (!request || typeof request !== 'object' || candidate.version !== 1) {
      return null;
    }

    const requestRecord = request as Record<string, unknown>;
    const challengeId = boundedText(requestRecord.challengeId, 64);
    const clientEventId = boundedText(requestRecord.clientEventId, 64);
    const createdAt = boundedText(candidate.createdAt, 80);
    const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN;
    if (
      !challengeId ||
      !UUID_PATTERN.test(challengeId) ||
      !clientEventId ||
      !UUID_PATTERN.test(clientEventId) ||
      !createdAt ||
      Number.isNaN(createdAtMs) ||
      now - createdAtMs > MAX_AGE_MS ||
      createdAtMs - now > 5 * 60 * 1000
    ) {
      return null;
    }

    let group: PendingSavedGroupLink['group'];
    if (candidate.group !== undefined) {
      if (!candidate.group || typeof candidate.group !== 'object') return null;
      const groupRecord = candidate.group as Record<string, unknown>;
      const id = boundedText(groupRecord.id, 64);
      const name = boundedText(groupRecord.name, 120);
      if (!id || !UUID_PATTERN.test(id) || !name) return null;
      group = { id, name };
    }

    return {
      version: 1,
      request: { challengeId, clientEventId },
      createdAt,
      ...(group ? { group } : {}),
    };
  } catch {
    return null;
  }
};

export const loadPendingSavedGroupLink = async (
  actorId: string
): Promise<PendingSavedGroupLink | null> =>
  decodePendingSavedGroupLink(
    await AsyncStorage.getItem(getPendingSavedGroupLinkKey(actorId))
  );

export const savePendingSavedGroupLink = async (
  actorId: string,
  value: PendingSavedGroupLink
): Promise<void> =>
  AsyncStorage.setItem(
    getPendingSavedGroupLinkKey(actorId),
    JSON.stringify(value)
  );

export const beginPendingSavedGroupLink = async (
  actorId: string,
  request: Omit<PromiseSavedGroupLinkRequest, 'groupId'>
): Promise<PendingSavedGroupLink> => {
  const value: PendingSavedGroupLink = {
    version: 1,
    request,
    createdAt: new Date().toISOString(),
  };
  await savePendingSavedGroupLink(actorId, value);
  return value;
};

export const markPendingSavedGroupCreated = async (
  actorId: string,
  pending: PendingSavedGroupLink,
  group: { id: string; name: string }
): Promise<PendingSavedGroupLink> => {
  const next: PendingSavedGroupLink = { ...pending, group };
  await savePendingSavedGroupLink(actorId, next);
  return next;
};

export const clearPendingSavedGroupLink = async (
  actorId: string
): Promise<void> =>
  AsyncStorage.removeItem(getPendingSavedGroupLinkKey(actorId));
