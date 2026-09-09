import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClientEventId } from '@/lib/client-event-id';
import { supabase } from '@/lib/supabase';
import {
  isGroupImagePresetKey,
  type GroupImagePresetKey,
} from '@/lib/groups/group-image-presets';
import { withTimeout } from '@/utils/api';
import { translate } from '@/lib/localization/translate';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ATTEMPT_PREFIX = 'menta.saved-group-create-attempt.v1';
const RPC_TIMEOUT_MS = 15000;

type UnknownRecord = Record<string, unknown>;

export type SavedGroupCreationRequest = {
  name: string;
  description: string | null;
  durationDays: number;
  privacy: 'public' | 'private' | 'secret';
  imagePreset: GroupImagePresetKey | null;
  notifyOnMemberMiss: boolean;
};

export type SavedGroupCreationAttempt = {
  version: 1;
  accountId: string;
  clientEventId: string;
  requestFingerprint: string;
  request: SavedGroupCreationRequest;
  createdAt: string;
};

export type SavedGroupCreationReceipt = {
  source: 'server';
  receiptId: string;
  clientEventId: string;
  canonicalClientEventId: string;
  groupId: string;
  groupName: string;
  description: string | null;
  privacy: 'public' | 'private' | 'secret';
  durationDays: number;
  imageUrl: string | null;
  notifyOnMemberMiss: boolean;
  debitAmount: number;
  newBalance: number;
  createdAt: string;
  idempotent: boolean;
};

export type SavedGroupCreationFailureCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_SESSION_REVOKED'
  | 'INVALID_REQUEST'
  | 'INVALID_GROUP_NAME'
  | 'INVALID_DESCRIPTION'
  | 'INVALID_PRIVACY'
  | 'INVALID_IMAGE_PRESET'
  | 'IDEMPOTENCY_MISMATCH'
  | 'REQUEST_IN_PROGRESS'
  | 'GROUP_CREATION_COOLDOWN'
  | 'INSUFFICIENT_BALANCE'
  | 'QUOTA_ACTIVE_GROUPS'
  | 'QUOTA_GROUPS_MONTH'
  | 'USER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'GROUP_CREATION_FAILED';

export type SavedGroupCreationFailure = {
  operation: 'SAVED_GROUP_CREATE' | 'SAVED_GROUP_CREATE_STATUS';
  status: 'failed' | 'unknown_result';
  code: SavedGroupCreationFailureCode;
  message: string;
  retryable: boolean;
  details: Record<string, unknown>;
};

export type SavedGroupCreationStatusSnapshot = {
  clientEventId: string;
  safeToRetry: true;
  availableBalance: number;
};

export type SavedGroupCreationMutationResult =
  | { kind: 'confirmed'; receipt: SavedGroupCreationReceipt }
  | { kind: 'failure'; failure: SavedGroupCreationFailure }
  | { kind: 'unknown'; message: string };

export type SavedGroupCreationStatusResult =
  | { kind: 'confirmed'; receipt: SavedGroupCreationReceipt }
  | { kind: 'not-found'; snapshot: SavedGroupCreationStatusSnapshot }
  | { kind: 'failure'; failure: SavedGroupCreationFailure }
  | { kind: 'pending'; message: string }
  | { kind: 'unavailable'; message: string };

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.includes('T') &&
  Number.isFinite(new Date(value).getTime());

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const isPrivacy = (
  value: unknown
): value is SavedGroupCreationRequest['privacy'] =>
  value === 'public' || value === 'private' || value === 'secret';

const nullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const normaliseName = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

export const normaliseSavedGroupCreationRequest = (input: {
  name: string;
  description?: string | null;
  durationDays: number;
  privacy?: 'public' | 'private' | 'secret';
  imagePreset?: GroupImagePresetKey | null;
  notifyOnMemberMiss?: boolean;
}): SavedGroupCreationRequest => ({
  name: normaliseName(input.name),
  description: input.description?.trim() || null,
  durationDays: Math.min(
    365,
    Math.max(1, Math.trunc(input.durationDays || 30))
  ),
  privacy: input.privacy ?? 'private',
  imagePreset: input.imagePreset ?? null,
  notifyOnMemberMiss: input.notifyOnMemberMiss ?? true,
});

export const savedGroupCreationRequestFingerprint = (
  request: SavedGroupCreationRequest
): string =>
  JSON.stringify({
    name: request.name,
    description: request.description,
    durationDays: request.durationDays,
    privacy: request.privacy,
    imagePreset: request.imagePreset,
    notifyOnMemberMiss: request.notifyOnMemberMiss,
    kind: 'saved',
  });

export const savedGroupCreationReceiptMatchesRequest = (
  receipt: SavedGroupCreationReceipt,
  attempt: SavedGroupCreationAttempt
): boolean =>
  receipt.clientEventId === attempt.clientEventId &&
  receipt.groupName === attempt.request.name &&
  receipt.description === attempt.request.description &&
  receipt.privacy === attempt.request.privacy &&
  receipt.durationDays === attempt.request.durationDays &&
  receipt.imageUrl ===
    (attempt.request.imagePreset
      ? `menta-preset:${attempt.request.imagePreset}`
      : null) &&
  receipt.notifyOnMemberMiss === attempt.request.notifyOnMemberMiss;

export const getSavedGroupCreationAttemptKey = (accountId: string): string =>
  `${ATTEMPT_PREFIX}:${accountId}`;

const decodeRequest = (value: unknown): SavedGroupCreationRequest | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.name !== 'string' ||
    value.name.length < 3 ||
    value.name.length > 80 ||
    !nullableString(value.description) ||
    (typeof value.description === 'string' && value.description.length > 500) ||
    typeof value.durationDays !== 'number' ||
    !Number.isInteger(value.durationDays) ||
    value.durationDays < 1 ||
    value.durationDays > 365 ||
    !isPrivacy(value.privacy) ||
    !(value.imagePreset === null || isGroupImagePresetKey(value.imagePreset)) ||
    typeof value.notifyOnMemberMiss !== 'boolean'
  ) {
    return null;
  }

  return {
    name: value.name,
    description: value.description,
    durationDays: value.durationDays,
    privacy: value.privacy,
    imagePreset: value.imagePreset,
    notifyOnMemberMiss: value.notifyOnMemberMiss,
  };
};

export const decodeSavedGroupCreationAttempt = (
  raw: string | null,
  expectedAccountId?: string
): SavedGroupCreationAttempt | null => {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1) return null;
    const request = decodeRequest(value.request);
    if (
      !request ||
      !isUuid(value.accountId) ||
      (expectedAccountId !== undefined &&
        value.accountId !== expectedAccountId) ||
      !isUuid(value.clientEventId) ||
      typeof value.requestFingerprint !== 'string' ||
      value.requestFingerprint !==
        savedGroupCreationRequestFingerprint(request) ||
      !isIsoTimestamp(value.createdAt)
    ) {
      return null;
    }

    return {
      version: 1,
      accountId: value.accountId,
      clientEventId: value.clientEventId,
      requestFingerprint: value.requestFingerprint,
      request,
      createdAt: value.createdAt,
    };
  } catch {
    return null;
  }
};

export const loadSavedGroupCreationAttempt = async (
  accountId: string
): Promise<SavedGroupCreationAttempt | null> => {
  const key = getSavedGroupCreationAttemptKey(accountId);
  const raw = await AsyncStorage.getItem(key);
  const attempt = decodeSavedGroupCreationAttempt(raw, accountId);
  if (raw && !attempt) await AsyncStorage.removeItem(key);
  return attempt;
};

export const prepareSavedGroupCreationAttempt = async (
  accountId: string,
  request: SavedGroupCreationRequest
): Promise<
  | { kind: 'ready'; attempt: SavedGroupCreationAttempt; reused: boolean }
  | { kind: 'blocked'; attempt: SavedGroupCreationAttempt }
> => {
  const existing = await loadSavedGroupCreationAttempt(accountId);
  const requestFingerprint = savedGroupCreationRequestFingerprint(request);
  if (existing) {
    return existing.requestFingerprint === requestFingerprint
      ? { kind: 'ready', attempt: existing, reused: true }
      : { kind: 'blocked', attempt: existing };
  }

  const attempt: SavedGroupCreationAttempt = {
    version: 1,
    accountId,
    clientEventId: createClientEventId(),
    requestFingerprint,
    request,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    getSavedGroupCreationAttemptKey(accountId),
    JSON.stringify(attempt)
  );
  return { kind: 'ready', attempt, reused: false };
};

export const clearSavedGroupCreationAttempt = async (
  accountId: string,
  clientEventId: string
): Promise<void> => {
  const current = await loadSavedGroupCreationAttempt(accountId);
  if (current?.clientEventId === clientEventId) {
    await AsyncStorage.removeItem(getSavedGroupCreationAttemptKey(accountId));
  }
};

const decodeReceipt = (value: unknown): SavedGroupCreationReceipt | null => {
  if (!isRecord(value)) return null;
  if (
    !isUuid(value.receipt_id) ||
    !isUuid(value.client_event_id) ||
    !isUuid(value.canonical_client_event_id) ||
    !isUuid(value.group_id) ||
    typeof value.group_name !== 'string' ||
    value.group_name.trim().length < 3 ||
    value.group_name.trim().length > 80 ||
    !nullableString(value.description) ||
    (typeof value.description === 'string' && value.description.length > 500) ||
    !isPrivacy(value.privacy) ||
    !isNonNegativeInteger(value.duration_days) ||
    value.duration_days < 1 ||
    value.duration_days > 365 ||
    !nullableString(value.image_url) ||
    typeof value.notify_on_member_miss !== 'boolean' ||
    !isNonNegativeInteger(value.debit_amount) ||
    !isNonNegativeInteger(value.new_balance) ||
    !isIsoTimestamp(value.created_at) ||
    typeof value.idempotent !== 'boolean'
  ) {
    return null;
  }

  return {
    source: 'server',
    receiptId: value.receipt_id,
    clientEventId: value.client_event_id,
    canonicalClientEventId: value.canonical_client_event_id,
    groupId: value.group_id,
    groupName: value.group_name.trim(),
    description: value.description,
    privacy: value.privacy,
    durationDays: value.duration_days,
    imageUrl: value.image_url,
    notifyOnMemberMiss: value.notify_on_member_miss,
    debitAmount: value.debit_amount,
    newBalance: value.new_balance,
    createdAt: value.created_at,
    idempotent: value.idempotent,
  };
};

const failureCodes = new Set<SavedGroupCreationFailureCode>([
  'AUTH_REQUIRED',
  'AUTH_SESSION_REVOKED',
  'INVALID_REQUEST',
  'INVALID_GROUP_NAME',
  'INVALID_DESCRIPTION',
  'INVALID_PRIVACY',
  'INVALID_IMAGE_PRESET',
  'IDEMPOTENCY_MISMATCH',
  'REQUEST_IN_PROGRESS',
  'GROUP_CREATION_COOLDOWN',
  'INSUFFICIENT_BALANCE',
  'QUOTA_ACTIVE_GROUPS',
  'QUOTA_GROUPS_MONTH',
  'USER_NOT_FOUND',
  'UNAUTHORIZED',
  'GROUP_CREATION_FAILED',
]);

const decodeFailure = (
  value: unknown,
  expectedOperation?: SavedGroupCreationFailure['operation']
): SavedGroupCreationFailure | null => {
  if (!isRecord(value)) return null;
  if (
    value.success !== false ||
    (value.operation !== 'SAVED_GROUP_CREATE' &&
      value.operation !== 'SAVED_GROUP_CREATE_STATUS') ||
    (expectedOperation !== undefined &&
      value.operation !== expectedOperation) ||
    (value.status !== 'failed' && value.status !== 'unknown_result') ||
    typeof value.code !== 'string' ||
    !failureCodes.has(value.code as SavedGroupCreationFailureCode) ||
    typeof value.message !== 'string' ||
    value.message.trim().length === 0 ||
    typeof value.retryable !== 'boolean' ||
    !isRecord(value.details)
  ) {
    return null;
  }

  return {
    operation: value.operation,
    status: value.status,
    code: value.code as SavedGroupCreationFailureCode,
    message: value.message.trim(),
    retryable: value.retryable,
    details: value.details,
  };
};

const decodeReceiptEnvelope = (
  value: unknown,
  operation: 'SAVED_GROUP_CREATE' | 'SAVED_GROUP_CREATE_STATUS'
): SavedGroupCreationReceipt | null => {
  if (
    !isRecord(value) ||
    value.success !== true ||
    value.operation !== operation ||
    value.status !== 'confirmed' ||
    !(
      value.code === 'GROUP_CREATED' ||
      value.code === 'GROUP_CREATION_REPLAYED' ||
      value.code === 'RECEIPT_FOUND'
    )
  ) {
    return null;
  }
  return decodeReceipt(value.receipt);
};

const decodeStatusSnapshot = (
  value: unknown
): SavedGroupCreationStatusSnapshot | null => {
  if (
    !isRecord(value) ||
    value.success !== true ||
    value.operation !== 'SAVED_GROUP_CREATE_STATUS' ||
    value.status !== 'not_found' ||
    value.code !== 'NO_RECEIPT' ||
    !isRecord(value.snapshot) ||
    !isUuid(value.snapshot.client_event_id) ||
    value.snapshot.safe_to_retry !== true ||
    !isNonNegativeInteger(value.snapshot.available_balance)
  ) {
    return null;
  }

  return {
    clientEventId: value.snapshot.client_event_id,
    safeToRetry: true,
    availableBalance: value.snapshot.available_balance,
  };
};

const errorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (
    isRecord(error) &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message.trim();
  }
  return fallback;
};

export const submitSavedGroupCreation = async (
  attempt: SavedGroupCreationAttempt
): Promise<SavedGroupCreationMutationResult> => {
  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        supabase.rpc('create_accountability_group_v3', {
          p_client_event_id: attempt.clientEventId,
          p_name: attempt.request.name,
          p_description: attempt.request.description,
          p_duration_days: attempt.request.durationDays,
          p_privacy: attempt.request.privacy,
          p_image_preset: attempt.request.imagePreset,
          p_notify_on_member_miss: attempt.request.notifyOnMemberMiss,
        })
      ),
      RPC_TIMEOUT_MS,
      'create_accountability_group_v3'
    );

    if (error) {
      return {
        kind: 'unknown',
        message: errorMessage(
          error,
          'Menta could not confirm whether the group was created.'
        ),
      };
    }

    const receipt = decodeReceiptEnvelope(data, 'SAVED_GROUP_CREATE');
    if (receipt && savedGroupCreationReceiptMatchesRequest(receipt, attempt)) {
      return { kind: 'confirmed', receipt };
    }
    if (receipt) {
      return {
        kind: 'unknown',
        message: translate(
          'en-NZ',
          'groups.source.accountability.receipt_mismatch_create'
        ),
      };
    }

    const failure = decodeFailure(data, 'SAVED_GROUP_CREATE');
    if (failure?.code === 'REQUEST_IN_PROGRESS') {
      return { kind: 'unknown', message: failure.message };
    }
    if (failure) return { kind: 'failure', failure };

    return {
      kind: 'unknown',
      message: translate(
        'en-NZ',
        'groups.source.accountability.create_unknown'
      ),
    };
  } catch (error) {
    return {
      kind: 'unknown',
      message: errorMessage(
        error,
        'Menta could not confirm whether the group was created.'
      ),
    };
  }
};

export const readSavedGroupCreationStatus = async (
  attempt: SavedGroupCreationAttempt
): Promise<SavedGroupCreationStatusResult> => {
  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        supabase.rpc('read_saved_group_creation_status_v1', {
          p_client_event_id: attempt.clientEventId,
        })
      ),
      RPC_TIMEOUT_MS,
      'read_saved_group_creation_status_v1'
    );

    if (error) {
      return {
        kind: 'unavailable',
        message: errorMessage(error, 'Menta could not check this group yet.'),
      };
    }

    const receipt = decodeReceiptEnvelope(data, 'SAVED_GROUP_CREATE_STATUS');
    if (receipt && savedGroupCreationReceiptMatchesRequest(receipt, attempt)) {
      return { kind: 'confirmed', receipt };
    }
    if (receipt) {
      return {
        kind: 'unavailable',
        message: translate(
          'en-NZ',
          'groups.source.accountability.receipt_mismatch_status'
        ),
      };
    }

    const snapshot = decodeStatusSnapshot(data);
    if (snapshot?.clientEventId === attempt.clientEventId) {
      return { kind: 'not-found', snapshot };
    }
    if (snapshot) {
      return {
        kind: 'unavailable',
        message: translate(
          'en-NZ',
          'groups.source.accountability.status_different_request'
        ),
      };
    }

    const failure = decodeFailure(data, 'SAVED_GROUP_CREATE_STATUS');
    if (failure?.code === 'REQUEST_IN_PROGRESS') {
      return { kind: 'pending', message: failure.message };
    }
    if (failure) return { kind: 'failure', failure };

    return {
      kind: 'unavailable',
      message: translate(
        'en-NZ',
        'groups.source.accountability.status_unavailable'
      ),
    };
  } catch (error) {
    return {
      kind: 'unavailable',
      message: errorMessage(error, 'Menta could not check this group yet.'),
    };
  }
};
