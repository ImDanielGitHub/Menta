import { AppState } from 'react-native';

import { extractTrustedSupabaseStorageObject } from '@/lib/image-service';
import {
  createProofDraft,
  getProofDraft,
  mapServerStatusToReceipt,
  removeProofDraft,
  updateProofDraft,
  type ProofDraft,
  type ProofReceiptStatus,
} from '@/lib/proof-drafts';
import {
  dequeueProofUpload,
  enqueueProofUpload,
  listForegroundResumableUploads,
  updateProofUploadQueueItem,
} from '@/lib/proof-upload-queue';
import type { ProofMediaType } from '@/lib/proof-types';
import {
  releaseDurableProofMedia,
  uploadDurableProofMedia,
} from '@/lib/services/proof-media-service';
import { networkManager } from '@/lib/network';
import { recordTypicalProofHour } from '@/lib/notifications/revealed-habit';
import { STORAGE_BUCKETS, supabase } from '@/lib/supabase';
import type { MilestoneResult } from '@/lib/streak-manager';
import { trackProductEvent } from '@/lib/posthog';
import {
  getProofReceiptAnalyticsStatus,
  getStreakLengthBucket,
} from '@/lib/product-analytics';
import {
  decodeProofAdBreakHint,
  type ProofAdBreakHint,
} from '@/lib/proof-ad-break-contract';

type RpcSubmitProofPayload = {
  success?: boolean;
  error?: string;
  code?: string;
  message?: string;
  inputAccepted?: boolean;
  submissionId?: string;
  clientEventId?: string;
  pointsAwarded?: number;
  newStreak?: number;
  longestStreak?: number;
  status?: string | null;
  allowSelfReview?: boolean | null;
  freezeUsed?: boolean;
  freezesRemaining?: number;
  dayStatus?: string;
  milestone?: SubmitMilestoneReceipt | null;
  effectiveLocalDay?: string;
  effectiveTimezone?: string;
  isCorrection?: boolean;
  replacesSubmissionId?: string | null;
  proofAdBreakHint?: ProofAdBreakHint;
  data?: {
    id?: string;
    client_event_id?: string;
    status?: string | null;
    allowSelfReview?: boolean | null;
    media_url?: string | null;
    media_type?: string | null;
    submission_text?: string | null;
    replaces_submission_id?: string | null;
  } | null;
};

type ServerSubmissionStatus = 'pending' | 'approved' | 'rejected';
const UNKNOWN_RESULT_STATUS: ProofReceiptStatus = 'unknown-result';
const FAILED_STATUS: ProofReceiptStatus = 'failed';
const SAVED_LOCAL_STATUS: ProofReceiptStatus = 'saved-local';
const UPLOADING_STATUS: ProofReceiptStatus = 'uploading';
type SubmitDayStatus =
  | 'pending_review'
  | 'already_applied'
  | 'done'
  | 'freeze_used'
  | 'missed';

type SubmitMilestoneReceipt = MilestoneResult & {
  rewardGranted: boolean;
};

type DecodedSubmitProofSuccessPayload = RpcSubmitProofPayload & {
  success: true;
  inputAccepted: boolean;
  submissionId: string;
  clientEventId: string;
  newStreak: number;
  longestStreak: number;
  status: ServerSubmissionStatus;
  allowSelfReview: boolean;
  freezeUsed: boolean;
  freezesRemaining: number;
  dayStatus: SubmitDayStatus;
  milestone: SubmitMilestoneReceipt | null;
  effectiveLocalDay: string;
  effectiveTimezone: string;
  isCorrection: boolean;
  replacesSubmissionId: string | null;
  proofAdBreakHint?: ProofAdBreakHint;
  data: {
    id: string;
    client_event_id: string;
    status: ServerSubmissionStatus;
    allowSelfReview: boolean;
    media_url: string | null;
    media_type: ProofMediaType;
    submission_text: string | null;
    replaces_submission_id: string | null;
  };
};

type DecodedSubmitProofFailurePayload = RpcSubmitProofPayload & {
  success: false;
  error: string;
  code: string;
  message: string;
  submissionId?: string;
  status?: ServerSubmissionStatus;
};

export type DecodedSubmitProofPayload =
  | DecodedSubmitProofSuccessPayload
  | DecodedSubmitProofFailurePayload;

type ServerProofReceipt = {
  id: string;
  challengeId: string;
  clientEventId: string;
  mediaType: string;
  mediaUrl: string | null;
  submissionText: string | null;
  status: string;
};

export type SubmitProofResult = RpcSubmitProofPayload & {
  success: true;
  submissionId?: string;
  proofAdBreakHint?: ProofAdBreakHint;
  milestone: MilestoneResult | null;
  freezeUsed: boolean;
  freezesRemaining: number;
  clientEventId: string;
  receiptStatus: ProofReceiptStatus;
  draft: ProofDraft;
};

export type SubmitProofInput = {
  userId: string;
  challengeId: string;
  groupId?: string | null;
  proofValue: string;
  proofType: ProofMediaType;
  clientTimeZone?: string;
  /** Stable idempotency key. Generated once before network work when omitted. */
  clientEventId?: string;
  localMediaUri?: string | null;
  /**
   * Only applied for definitive application failures.
   * Never deletes media when the final server state is unknown.
   */
  cleanupUploadedMediaOnFailure?: boolean;
};

/**
 * Compatibility view for surfaces that only need to show locally queued
 * proof. The durable source remains ProofDraft plus proof-upload-queue.
 */
export type QueuedProofSubmission = {
  id: string;
  userId: string;
  challengeId: string;
  proofValue: string;
  proofType: ProofMediaType;
  clientTimeZone: string;
  clientEventId: string;
  createdAt: string;
  /** Device-reported tap time for display only; never a streak-day input. */
  sendRequestedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
};

export class ProofSubmissionError extends Error {
  readonly receiptStatus: ProofReceiptStatus;
  readonly clientEventId: string;
  readonly draft: ProofDraft | null;
  readonly code: string | null;

  constructor(
    message: string,
    options: {
      receiptStatus: ProofReceiptStatus;
      clientEventId: string;
      draft?: ProofDraft | null;
      code?: string | null;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'ProofSubmissionError';
    this.receiptStatus = options.receiptStatus;
    this.clientEventId = options.clientEventId;
    this.draft = options.draft ?? null;
    this.code = options.code ?? null;
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const isDefinitiveProofRpcRejection = (value: unknown): boolean => {
  if (!isRecord(value) || typeof value.code !== 'string') return false;
  const code = value.code.trim().toUpperCase();
  return /^(22|23|42)[0-9A-Z]{3}$/.test(code) || code.startsWith('PGRST');
};

const isServerSubmissionStatus = (
  value: unknown
): value is ServerSubmissionStatus =>
  value === 'pending' || value === 'approved' || value === 'rejected';

const isProofMediaType = (value: unknown): value is ProofMediaType =>
  value === 'photo' || value === 'video' || value === 'text';

const isSubmitDayStatus = (value: unknown): value is SubmitDayStatus =>
  value === 'pending_review' ||
  value === 'already_applied' ||
  value === 'done' ||
  value === 'freeze_used' ||
  value === 'missed';

const isSubmitMilestoneReceipt = (
  value: unknown
): value is SubmitMilestoneReceipt | null =>
  value === null ||
  (isRecord(value) &&
    value.reached === true &&
    isNonNegativeInteger(value.milestone) &&
    value.milestone > 0 &&
    isNonNegativeInteger(value.reward) &&
    value.rewardGranted === true);

const isIsoLocalDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const isNullableUuid = (value: unknown): value is string | null =>
  value === null || isUuid(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

/**
 * Decode the complete server receipt. A malformed response is deliberately
 * not coerced into `success: false`: after the RPC starts, an unrecognised
 * payload is an unknown result and uploaded proof must remain recoverable.
 */
export const decodeSubmitProofPayload = (
  value: unknown
): DecodedSubmitProofPayload | null => {
  if (!isRecord(value) || typeof value.success !== 'boolean') return null;

  if (value.success === false) {
    if (
      !isNonEmptyString(value.error) ||
      !isNonEmptyString(value.code) ||
      !isNonEmptyString(value.message)
    ) {
      return null;
    }

    const failure: DecodedSubmitProofFailurePayload = {
      success: false,
      error: value.error,
      code: value.code,
      message: value.message,
    };

    if (value.code === 'DAILY_SUBMISSION_EXISTS') {
      if (
        !isUuid(value.submissionId) ||
        (value.status !== 'pending' && value.status !== 'approved')
      ) {
        return null;
      }
      failure.submissionId = value.submissionId;
      failure.status = value.status;
    }

    return failure;
  }

  if (
    typeof value.inputAccepted !== 'boolean' ||
    !isUuid(value.submissionId) ||
    !isUuid(value.clientEventId) ||
    !isNonNegativeInteger(value.newStreak) ||
    !isNonNegativeInteger(value.longestStreak) ||
    value.longestStreak < value.newStreak ||
    !isServerSubmissionStatus(value.status) ||
    typeof value.allowSelfReview !== 'boolean' ||
    typeof value.freezeUsed !== 'boolean' ||
    !isNonNegativeInteger(value.freezesRemaining) ||
    !isSubmitDayStatus(value.dayStatus) ||
    !isSubmitMilestoneReceipt(value.milestone) ||
    !isIsoLocalDate(value.effectiveLocalDay) ||
    !isNonEmptyString(value.effectiveTimezone) ||
    typeof value.isCorrection !== 'boolean' ||
    !isNullableUuid(value.replacesSubmissionId) ||
    !isRecord(value.data) ||
    !isUuid(value.data.id) ||
    !isUuid(value.data.client_event_id) ||
    !isServerSubmissionStatus(value.data.status) ||
    typeof value.data.allowSelfReview !== 'boolean' ||
    !isNullableString(value.data.media_url) ||
    !isProofMediaType(value.data.media_type) ||
    !isNullableString(value.data.submission_text) ||
    !isNullableUuid(value.data.replaces_submission_id) ||
    (value.pointsAwarded !== undefined &&
      (typeof value.pointsAwarded !== 'number' ||
        !Number.isFinite(value.pointsAwarded)))
  ) {
    return null;
  }

  if (
    value.data.id !== value.submissionId ||
    value.data.client_event_id !== value.clientEventId ||
    value.data.status !== value.status ||
    value.data.allowSelfReview !== value.allowSelfReview ||
    value.data.replaces_submission_id !== value.replacesSubmissionId ||
    value.isCorrection !== (value.replacesSubmissionId !== null) ||
    ((value.status === 'pending' || value.status === 'rejected') &&
      (value.dayStatus !== 'pending_review' ||
        value.freezeUsed ||
        value.milestone !== null))
  ) {
    return null;
  }

  const proofAdBreakHint = decodeProofAdBreakHint(value.proofAdBreakHint);

  return {
    success: true,
    inputAccepted: value.inputAccepted,
    submissionId: value.submissionId,
    clientEventId: value.clientEventId,
    pointsAwarded: value.pointsAwarded,
    newStreak: value.newStreak,
    longestStreak: value.longestStreak,
    status: value.status,
    allowSelfReview: value.allowSelfReview,
    freezeUsed: value.freezeUsed,
    freezesRemaining: value.freezesRemaining,
    dayStatus: value.dayStatus,
    milestone: value.milestone,
    effectiveLocalDay: value.effectiveLocalDay,
    effectiveTimezone: value.effectiveTimezone,
    isCorrection: value.isCorrection,
    replacesSubmissionId: value.replacesSubmissionId,
    ...(proofAdBreakHint ? { proofAdBreakHint } : {}),
    data: {
      id: value.data.id,
      client_event_id: value.data.client_event_id,
      status: value.data.status,
      allowSelfReview: value.data.allowSelfReview,
      media_url: value.data.media_url,
      media_type: value.data.media_type,
      submission_text: value.data.submission_text,
      replaces_submission_id: value.data.replaces_submission_id,
    },
  };
};

const getCleanTextProof = (proofValue: string) => proofValue.trim();

export const canReleaseConfirmedLocalProofMedia = (
  receiptStatus: ProofReceiptStatus
): boolean =>
  receiptStatus === 'accepted' || receiptStatus === 'pending-review';

const resolveUploadedMediaLocation = (mediaUrl: string) => {
  const parsed = extractTrustedSupabaseStorageObject(
    mediaUrl,
    STORAGE_BUCKETS?.CHALLENGE_VERIFICATIONS ?? 'challenge-verifications'
  );
  if (parsed) return parsed;

  return {
    bucket:
      STORAGE_BUCKETS?.CHALLENGE_VERIFICATIONS ?? 'challenge-verifications',
    objectKey: mediaUrl,
  };
};

export const cleanupUploadedProofMedia = async (
  mediaUrl: string,
  mediaType: ProofMediaType
) => {
  if (mediaType === 'text' || !mediaUrl.trim()) return;

  const { bucket, objectKey } = resolveUploadedMediaLocation(mediaUrl);
  const { error } = await supabase.storage.from(bucket).remove([objectKey]);
  if (error) {
    console.warn('[ProofSubmission] Could not remove orphaned proof media:', {
      bucket,
      objectKey,
      error,
    });
  }
};

const resolveMediaForRpc = (
  draft: ProofDraft
): { mediaUrl: string | null; submissionText: string | null } => {
  if (draft.proofType === 'text') {
    return {
      mediaUrl: null,
      submissionText: getCleanTextProof(draft.proofValue),
    };
  }

  const mediaUrl = draft.remoteMediaUrl ?? draft.proofValue;
  return {
    mediaUrl,
    submissionText: null,
  };
};

const markUnknownResult = async (
  draft: ProofDraft,
  message: string
): Promise<ProofDraft> => {
  const updated = await updateProofDraft(draft.clientEventId, {
    status: UNKNOWN_RESULT_STATUS,
    lastError: message,
  });
  await enqueueProofUpload(updated);
  try {
    await updateProofUploadQueueItem(updated.clientEventId, {
      attemptCount: updated.attemptCount,
      lastError: message,
      nextAttemptAt: new Date().toISOString(),
    });
  } catch {
    // Queue row may already exist from enqueue.
  }
  return updated;
};

const markFailed = async (
  draft: ProofDraft,
  message: string
): Promise<ProofDraft> => {
  const updated = await updateProofDraft(draft.clientEventId, {
    status: FAILED_STATUS,
    lastError: message,
  });
  await dequeueProofUpload(draft.clientEventId);
  return updated;
};

const assertProofTargetIsCurrent = async (draft: ProofDraft): Promise<void> => {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('challenge_id,status,challenges!inner(id,status)')
    .eq('user_id', draft.userId)
    .eq('challenge_id', draft.challengeId)
    .eq('status', 'active')
    .maybeSingle();

  if (!error && data) return;

  const message = error
    ? 'Menta could not confirm that this promise still belongs to your account. No proof was uploaded.'
    : 'This promise is no longer active for your account. No proof was uploaded.';
  const failedDraft = await markFailed(draft, message);
  const errorCode =
    isRecord(error) && typeof error.code === 'string'
      ? error.code
      : data
        ? 'PROOF_TARGET_CHECK_FAILED'
        : 'NOT_JOINED';

  throw new ProofSubmissionError(message, {
    receiptStatus: 'failed',
    clientEventId: draft.clientEventId,
    draft: failedDraft,
    code: errorCode,
    cause: error ?? undefined,
  });
};

const assertMatchingDraftIdentity = (
  existing: ProofDraft,
  input: SubmitProofInput
): void => {
  const incomingGroupId = input.groupId?.trim() || null;
  const identityChanged =
    existing.userId !== input.userId ||
    existing.challengeId !== input.challengeId ||
    existing.proofType !== input.proofType ||
    (existing.groupId !== null &&
      incomingGroupId !== null &&
      existing.groupId !== incomingGroupId);

  const incomingProofValue =
    input.proofType === 'text'
      ? getCleanTextProof(input.proofValue)
      : input.proofValue;
  const boundProofValues = new Set(
    [
      existing.proofValue,
      existing.remoteMediaUrl,
      existing.localMediaUri,
    ].filter((value): value is string => Boolean(value))
  );
  const submittedPayloadChanged =
    existing.sendRequestedAt !== null &&
    !boundProofValues.has(incomingProofValue);

  if (!identityChanged && !submittedPayloadChanged) return;

  throw new ProofSubmissionError(
    'This send key already belongs to a different proof. Reopen the saved draft before trying again.',
    {
      receiptStatus: 'failed',
      clientEventId: existing.clientEventId,
      draft: existing,
      code: 'CLIENT_EVENT_ID_REUSED',
    }
  );
};

const ensureDraft = async (input: SubmitProofInput): Promise<ProofDraft> => {
  const clientTimeZone =
    input.clientTimeZone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC';

  if (input.clientEventId) {
    const existing = await getProofDraft(input.clientEventId);
    if (existing) {
      assertMatchingDraftIdentity(existing, input);
      return updateProofDraft(existing.clientEventId, {
        proofValue:
          input.proofType === 'text'
            ? getCleanTextProof(input.proofValue)
            : input.proofValue,
        proofType: input.proofType,
        localMediaUri: input.localMediaUri ?? existing.localMediaUri,
        remoteMediaUrl:
          input.proofType === 'text'
            ? null
            : input.proofValue.startsWith('file:')
              ? existing.remoteMediaUrl
              : input.proofValue,
        clientTimeZone,
        groupId: input.groupId ?? existing.groupId,
      });
    }
  }

  return createProofDraft({
    userId: input.userId,
    challengeId: input.challengeId,
    groupId: input.groupId,
    proofType: input.proofType,
    proofValue: input.proofValue,
    clientTimeZone,
    clientEventId: input.clientEventId,
    localMediaUri: input.localMediaUri,
  });
};

const parseServerProofReceipt = (value: unknown): ServerProofReceipt | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.challenge_id !== 'string' ||
    typeof value.client_event_id !== 'string' ||
    typeof value.media_type !== 'string' ||
    typeof value.status !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    challengeId: value.challenge_id,
    clientEventId: value.client_event_id,
    mediaType: value.media_type,
    mediaUrl: typeof value.media_url === 'string' ? value.media_url : null,
    submissionText:
      typeof value.submission_text === 'string' ? value.submission_text : null,
    status: value.status,
  };
};

const receiptMatchesDraft = (
  receipt: ServerProofReceipt,
  draft: ProofDraft,
  rpcSubmissionId: string | undefined
): boolean => {
  if (
    receipt.challengeId !== draft.challengeId ||
    receipt.clientEventId !== draft.clientEventId ||
    receipt.mediaType !== draft.proofType ||
    (rpcSubmissionId !== undefined && receipt.id !== rpcSubmissionId)
  ) {
    return false;
  }

  if (draft.proofType === 'text') {
    return (
      receipt.submissionText?.trim() === getCleanTextProof(draft.proofValue)
    );
  }

  return receipt.mediaUrl !== null && receipt.mediaUrl === draft.remoteMediaUrl;
};

/**
 * The submit RPC has a daily-row shortcut, so its JSON alone cannot prove that
 * the row belongs to this exact send key. Read the committed row back by the
 * stable client event id before showing a server receipt or releasing media.
 */
const reconcileSuccessfulProofReceipt = async (
  draft: ProofDraft,
  payload: RpcSubmitProofPayload & { success: true }
): Promise<RpcSubmitProofPayload & { success: true }> => {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select(
      'id, challenge_id, client_event_id, media_type, media_url, submission_text, status'
    )
    .eq('user_id', draft.userId)
    .eq('client_event_id', draft.clientEventId)
    .maybeSingle();

  const receipt = parseServerProofReceipt(data);
  if (
    (payload.clientEventId !== undefined &&
      payload.clientEventId !== draft.clientEventId) ||
    error ||
    !receipt ||
    !receiptMatchesDraft(receipt, draft, payload.submissionId)
  ) {
    const message = error?.message
      ? `Menta received a response but could not read back this proof: ${error.message}`
      : 'Menta received a response but could not match it to this exact proof. Your saved proof has been kept.';
    const unknownDraft = await markUnknownResult(draft, message);
    throw new ProofSubmissionError(message, {
      receiptStatus: 'unknown-result',
      clientEventId: draft.clientEventId,
      draft: unknownDraft,
      code: 'RECEIPT_RECONCILIATION_REQUIRED',
      cause: error ?? undefined,
    });
  }

  return {
    ...payload,
    submissionId: receipt.id,
    status: receipt.status,
    data: {
      ...(payload.data ?? {}),
      id: receipt.id,
      status: receipt.status,
      media_type: receipt.mediaType,
      submission_text: receipt.submissionText,
    },
  };
};

const ensureRemoteMedia = async (draft: ProofDraft): Promise<ProofDraft> => {
  if (draft.proofType === 'text') return draft;
  if (draft.remoteMediaUrl) return draft;
  const mediaType = draft.proofType;

  if (!draft.localMediaUri) {
    const failedDraft = await markFailed(
      draft,
      'The saved proof file is no longer available on this phone.'
    );
    throw new ProofSubmissionError(failedDraft.lastError ?? 'Proof not found', {
      receiptStatus: 'failed',
      clientEventId: failedDraft.clientEventId,
      draft: failedDraft,
      code: 'LOCAL_MEDIA_MISSING',
    });
  }

  const queuedDraft = await updateProofDraft(draft.clientEventId, {
    status: SAVED_LOCAL_STATUS,
    sendRequestedAt: draft.sendRequestedAt ?? new Date().toISOString(),
    lastError: null,
  });
  await enqueueProofUpload(queuedDraft);

  try {
    const objectKey = await uploadDurableProofMedia({
      userId: queuedDraft.userId,
      challengeId: queuedDraft.challengeId,
      clientEventId: queuedDraft.clientEventId,
      localMediaUri: queuedDraft.localMediaUri!,
      mediaType,
    });
    return updateProofDraft(queuedDraft.clientEventId, {
      proofValue: objectKey,
      remoteMediaUrl: objectKey,
      lastError: null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Proof was not uploaded. Your saved capture is still on this phone.';
    const preservedDraft = await updateProofDraft(queuedDraft.clientEventId, {
      status: SAVED_LOCAL_STATUS,
      lastError: message,
    });
    await enqueueProofUpload(preservedDraft);
    throw new ProofSubmissionError(message, {
      receiptStatus: 'saved-local',
      clientEventId: preservedDraft.clientEventId,
      draft: preservedDraft,
      code: 'MEDIA_UPLOAD_DEFERRED',
      cause: error,
    });
  }
};

const releaseConfirmedLocalMedia = async (
  draft: ProofDraft
): Promise<ProofDraft> => {
  if (!draft.localMediaUri) return draft;

  try {
    releaseDurableProofMedia(draft.localMediaUri);
    return updateProofDraft(draft.clientEventId, { localMediaUri: null });
  } catch (releaseError) {
    console.warn(
      '[ProofSubmission] Confirmed proof local-file release failed:',
      releaseError
    );
    return draft;
  }
};

const finalizeSuccessfulSubmission = async (
  draft: ProofDraft,
  payload: RpcSubmitProofPayload & { success: true }
): Promise<SubmitProofResult> => {
  const serverStatus = payload.data?.status ?? payload.status ?? null;
  const mappedReceipt = mapServerStatusToReceipt(serverStatus);
  const receiptStatus = payload.submissionId ? mappedReceipt : 'unknown-result';
  let updated = await updateProofDraft(draft.clientEventId, {
    status: receiptStatus,
    submissionId: payload.submissionId ?? null,
    serverStatus,
    allowSelfReview:
      payload.allowSelfReview ?? payload.data?.allowSelfReview ?? null,
    lastError:
      receiptStatus === 'unknown-result'
        ? 'The server response did not include a recognised proof receipt.'
        : null,
  });
  if (receiptStatus === 'unknown-result' || receiptStatus === 'sent') {
    await enqueueProofUpload(updated);
  } else {
    await dequeueProofUpload(draft.clientEventId);
  }

  if (canReleaseConfirmedLocalProofMedia(receiptStatus)) {
    updated = await releaseConfirmedLocalMedia(updated);
  }

  void recordTypicalProofHour({
    userId: draft.userId,
    timeZone: draft.clientTimeZone,
  }).catch(() => undefined);

  const milestone = payload.milestone ?? null;

  return {
    ...payload,
    success: true,
    milestone,
    freezeUsed: payload.freezeUsed ?? false,
    freezesRemaining: payload.freezesRemaining ?? 0,
    clientEventId: draft.clientEventId,
    receiptStatus,
    draft: updated,
  };
};

/**
 * Submit challenge proof with durable local draft + stable client event id.
 * Retries must reuse the same clientEventId. Foreground resume only.
 */
export const submitChallengeProof = async ({
  userId,
  challengeId,
  groupId,
  proofValue,
  proofType,
  clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  clientEventId,
  localMediaUri = null,
  cleanupUploadedMediaOnFailure = true,
}: SubmitProofInput): Promise<SubmitProofResult> => {
  let draft: ProofDraft | null = null;
  let requestStarted = false;

  try {
    draft = await ensureDraft({
      userId,
      challengeId,
      groupId,
      proofValue,
      proofType,
      clientTimeZone,
      clientEventId,
      localMediaUri,
    });

    await assertProofTargetIsCurrent(draft);

    draft = await ensureRemoteMedia(draft);

    draft = await updateProofDraft(draft.clientEventId, {
      status: UPLOADING_STATUS,
      attemptCount: draft.attemptCount + 1,
      sendRequestedAt: draft.sendRequestedAt ?? new Date().toISOString(),
      lastError: null,
    });
    await enqueueProofUpload(draft);

    const { mediaUrl, submissionText } = resolveMediaForRpc(draft);
    const rpcArgs = {
      p_challenge_id: challengeId,
      p_media_url: mediaUrl,
      p_media_type: proofType,
      p_client_event_id: draft.clientEventId,
      p_client_tz: clientTimeZone,
      p_submission_text: submissionText,
    };

    requestStarted = true;
    const { data, error } = await supabase.rpc(
      'submit_challenge_verification',
      rpcArgs
    );

    if (error) {
      const message =
        error.message || 'Proof submission failed before a clear server result';
      if (isDefinitiveProofRpcRejection(error)) {
        let failedDraft = await markFailed(draft, message);
        if (cleanupUploadedMediaOnFailure && mediaUrl) {
          try {
            await cleanupUploadedProofMedia(mediaUrl, proofType);
            if (failedDraft.proofType !== 'text' && failedDraft.localMediaUri) {
              failedDraft = await updateProofDraft(failedDraft.clientEventId, {
                proofValue: failedDraft.localMediaUri,
                remoteMediaUrl: null,
              });
            }
          } catch (cleanupError) {
            console.warn(
              '[ProofSubmission] Rejected proof media cleanup failed:',
              cleanupError
            );
          }
        }
        throw new ProofSubmissionError(message, {
          receiptStatus: 'failed',
          clientEventId: draft.clientEventId,
          draft: failedDraft,
          code: error.code,
          cause: error,
        });
      }
      const unknownDraft = await markUnknownResult(draft, message);
      throw new ProofSubmissionError(message, {
        receiptStatus: 'unknown-result',
        clientEventId: draft.clientEventId,
        draft: unknownDraft,
        code: 'UNKNOWN_RESULT',
        cause: error,
      });
    }

    const payload = decodeSubmitProofPayload(data);
    if (!payload) {
      const message =
        'Menta received an unrecognised proof receipt. Your saved proof has been kept for reconciliation.';
      const unknownDraft = await markUnknownResult(draft, message);
      throw new ProofSubmissionError(message, {
        receiptStatus: 'unknown-result',
        clientEventId: draft.clientEventId,
        draft: unknownDraft,
        code: 'INVALID_SUBMIT_RECEIPT',
      });
    }

    if (payload.success === false) {
      const message =
        payload.message || payload.error || 'Failed to submit challenge proof';

      if (
        payload.code === 'DAILY_SUBMISSION_EXISTS' &&
        payload.submissionId &&
        (payload.status === 'pending' || payload.status === 'approved')
      ) {
        if (cleanupUploadedMediaOnFailure && mediaUrl) {
          try {
            await cleanupUploadedProofMedia(mediaUrl, proofType);
          } catch (cleanupError) {
            console.warn(
              '[ProofSubmission] Unexpected duplicate proof media cleanup failure:',
              cleanupError
            );
          }
        }

        if (draft.localMediaUri) {
          try {
            releaseDurableProofMedia(draft.localMediaUri);
          } catch (releaseError) {
            console.warn(
              '[ProofSubmission] Duplicate proof local-file release failed:',
              releaseError
            );
          }
        }

        await dequeueProofUpload(draft.clientEventId);
        await removeProofDraft(draft.clientEventId);

        throw new ProofSubmissionError(message, {
          receiptStatus: mapServerStatusToReceipt(payload.status),
          clientEventId: draft.clientEventId,
          draft: null,
          code: payload.code,
        });
      }

      let failedDraft = await markFailed(draft, message);

      if (cleanupUploadedMediaOnFailure && mediaUrl) {
        try {
          await cleanupUploadedProofMedia(mediaUrl, proofType);
          if (failedDraft.proofType !== 'text' && failedDraft.localMediaUri) {
            failedDraft = await updateProofDraft(failedDraft.clientEventId, {
              proofValue: failedDraft.localMediaUri,
              remoteMediaUrl: null,
            });
          }
        } catch (cleanupError) {
          console.warn(
            '[ProofSubmission] Unexpected proof media cleanup failure:',
            cleanupError
          );
        }
      }

      throw new ProofSubmissionError(message, {
        receiptStatus: 'failed',
        clientEventId: draft.clientEventId,
        draft: failedDraft,
        code: payload.code ?? 'SUBMIT_FAILED',
      });
    }

    const reconciledPayload = await reconcileSuccessfulProofReceipt(
      draft,
      payload
    );
    const result = await finalizeSuccessfulSubmission(draft, reconciledPayload);
    const receiptStatus = getProofReceiptAnalyticsStatus(result.receiptStatus);
    if (receiptStatus) {
      trackProductEvent('Proof Submitted', {
        day_status: payload.dayStatus,
        is_correction: payload.isCorrection,
        proof_type: draft.proofType,
        receipt_status: receiptStatus,
        review_mode: payload.allowSelfReview ? 'self' : 'peer',
        streak_length_bucket: getStreakLengthBucket(payload.newStreak),
      });
    }
    return result;
  } catch (error) {
    if (error instanceof ProofSubmissionError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Proof submission failed with an unknown error';
    const eventId = draft?.clientEventId ?? clientEventId ?? 'unknown';

    // Ambiguous after network work may have begun: keep media and mark unknown.
    if (requestStarted && draft) {
      const unknownDraft = await markUnknownResult(draft, message);
      throw new ProofSubmissionError(message, {
        receiptStatus: 'unknown-result',
        clientEventId: draft.clientEventId,
        draft: unknownDraft,
        code: 'UNKNOWN_RESULT',
        cause: error,
      });
    }

    if (draft) {
      const failedDraft = await markFailed(draft, message);
      throw new ProofSubmissionError(message, {
        receiptStatus: 'failed',
        clientEventId: draft.clientEventId,
        draft: failedDraft,
        code: 'SUBMIT_FAILED',
        cause: error,
      });
    }

    throw new ProofSubmissionError(message, {
      receiptStatus: 'failed',
      clientEventId: eventId,
      draft: null,
      code: 'SUBMIT_FAILED',
      cause: error,
    });
  }
};

/**
 * Resume a single queued/unknown proof in the foreground using the same
 * client event id. Does not claim background execution.
 */
export const resumeProofSubmission = async (
  clientEventId: string,
  options?: { cleanupUploadedMediaOnFailure?: boolean }
): Promise<SubmitProofResult> => {
  const draft = await getProofDraft(clientEventId);
  if (!draft) {
    throw new ProofSubmissionError('Proof draft not found for resume', {
      receiptStatus: 'failed',
      clientEventId,
      draft: null,
      code: 'DRAFT_NOT_FOUND',
    });
  }

  if (
    draft.status === 'accepted' ||
    draft.status === 'pending-review' ||
    draft.status === 'correction-requested'
  ) {
    return {
      success: true,
      submissionId: draft.submissionId ?? undefined,
      status: draft.serverStatus,
      allowSelfReview: draft.allowSelfReview,
      freezeUsed: false,
      freezesRemaining: 0,
      milestone: null,
      clientEventId: draft.clientEventId,
      receiptStatus: draft.status,
      draft,
      data: {
        id: draft.submissionId ?? undefined,
        status: draft.serverStatus,
        allowSelfReview: draft.allowSelfReview,
      },
    };
  }

  if (draft.status === 'sent') {
    const reconciledPayload = await reconcileSuccessfulProofReceipt(draft, {
      success: true,
      submissionId: draft.submissionId ?? undefined,
      status: draft.serverStatus,
      allowSelfReview: draft.allowSelfReview,
    });
    return finalizeSuccessfulSubmission(draft, reconciledPayload);
  }

  return submitChallengeProof({
    userId: draft.userId,
    challengeId: draft.challengeId,
    groupId: draft.groupId,
    proofValue: draft.remoteMediaUrl ?? draft.proofValue,
    proofType: draft.proofType,
    clientTimeZone: draft.clientTimeZone,
    clientEventId: draft.clientEventId,
    localMediaUri: draft.localMediaUri,
    // Unknown-result retries must not delete media until reconciled.
    cleanupUploadedMediaOnFailure:
      options?.cleanupUploadedMediaOnFailure ??
      draft.status !== 'unknown-result',
  });
};

/**
 * Drain resumable proofs while the app is open. Callers must invoke this on
 * foreground / manual retry — this module does not schedule background work.
 */
export const resumeAllQueuedProofSubmissions = async (): Promise<{
  succeeded: SubmitProofResult[];
  failed: ProofSubmissionError[];
}> => {
  const drafts = await listForegroundResumableUploads();
  const succeeded: SubmitProofResult[] = [];
  const failed: ProofSubmissionError[] = [];

  for (const draft of drafts) {
    try {
      const result = await resumeProofSubmission(draft.clientEventId);
      succeeded.push(result);
    } catch (error) {
      if (error instanceof ProofSubmissionError) {
        failed.push(error);
      } else {
        failed.push(
          new ProofSubmissionError(
            error instanceof Error ? error.message : 'Resume failed',
            {
              receiptStatus: 'unknown-result',
              clientEventId: draft.clientEventId,
              draft,
              code: 'RESUME_FAILED',
              cause: error,
            }
          )
        );
      }
    }
  }

  return { succeeded, failed };
};

const toQueuedProofSubmission = (draft: ProofDraft): QueuedProofSubmission => ({
  id: draft.clientEventId,
  userId: draft.userId,
  challengeId: draft.challengeId,
  proofValue: draft.proofValue,
  proofType: draft.proofType,
  clientTimeZone: draft.clientTimeZone,
  clientEventId: draft.clientEventId,
  createdAt: draft.createdAt,
  sendRequestedAt: draft.sendRequestedAt ?? draft.createdAt,
  attempts: draft.attemptCount,
  lastError: draft.lastError ?? undefined,
});

export const getQueuedProofSubmissions = async (): Promise<
  QueuedProofSubmission[]
> => (await listForegroundResumableUploads()).map(toQueuedProofSubmission);

export type ProcessQueuedProofSubmissionsResult = {
  attempted: number;
  submitted: number;
  remaining: number;
  failed: number;
};

let isProcessingQueuedProofs = false;

export const processQueuedProofSubmissions = async ({
  userId,
}: {
  userId?: string;
} = {}): Promise<ProcessQueuedProofSubmissionsResult> => {
  const drafts = (await listForegroundResumableUploads()).filter(draft =>
    userId ? draft.userId === userId : true
  );

  if (
    !drafts.length ||
    isProcessingQueuedProofs ||
    !networkManager.isOnline()
  ) {
    return {
      attempted: 0,
      submitted: 0,
      remaining: drafts.length,
      failed: 0,
    };
  }

  isProcessingQueuedProofs = true;
  let submitted = 0;
  let failed = 0;
  try {
    for (const draft of drafts) {
      if (!networkManager.isOnline()) break;
      try {
        await resumeProofSubmission(draft.clientEventId);
        submitted += 1;
      } catch {
        failed += 1;
      }
    }
  } finally {
    isProcessingQueuedProofs = false;
  }

  const remaining = (await listForegroundResumableUploads()).filter(draft =>
    userId ? draft.userId === userId : true
  ).length;
  return {
    attempted: submitted + failed,
    submitted,
    remaining,
    failed,
  };
};

export const attachQueuedProofSubmissionProcessor = (
  userId?: string,
  onProcessed?: (result: ProcessQueuedProofSubmissionsResult) => void
) => {
  let disposed = false;
  const run = async () => {
    if (disposed) return;
    const result = await processQueuedProofSubmissions({ userId });
    if (!disposed && result.attempted > 0) onProcessed?.(result);
  };

  const unsubscribe = networkManager.addListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) void run();
  });
  const appStateSubscription = AppState.addEventListener('change', state => {
    if (state === 'active') void run();
  });
  void networkManager.checkConnectivity().then(run);

  return () => {
    disposed = true;
    unsubscribe();
    appStateSubscription.remove();
  };
};
