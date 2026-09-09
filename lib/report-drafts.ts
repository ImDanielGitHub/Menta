import AsyncStorage from '@react-native-async-storage/async-storage';

import { createClientEventId } from '@/lib/client-event-id';
import { translate } from '@/lib/localization';

export const REPORT_DRAFTS_STORAGE_KEY = 'menta.support-report-drafts.v1';

export type ReportDraftStatus =
  | 'draft'
  | 'submitting'
  | 'not-sent'
  | 'result-unknown'
  | 'server-confirmed';

export type ReportAttachmentMetadata = {
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  localUri: string | null;
};

export type ReportSubmissionSnapshot = {
  title: string;
  description: string;
  observedBehavior: string | null;
  expectedBehavior: string | null;
  stepsToReproduce: string | null;
  source: string;
  reportKind: string | null;
  challengeId: string | null;
  groupId: string | null;
  submissionId: string | null;
  targetUserId: string | null;
  targetUserLabel: string | null;
  contextLabel: string | null;
  crashReference: string | null;
  attachments: ReportAttachmentMetadata[];
  createdAt: string;
};

export type ReportDraft = {
  id: string;
  userId: string;
  contextKey: string;
  status: ReportDraftStatus;
  title: string;
  description: string;
  observedBehavior: string;
  expectedBehavior: string;
  stepsToReproduce: string;
  source: string;
  reportKind: string | null;
  challengeId: string | null;
  groupId: string | null;
  submissionId: string | null;
  targetUserId: string | null;
  targetUserLabel: string | null;
  contextLabel: string | null;
  crashReference: string | null;
  attachments: ReportAttachmentMetadata[];
  submissionSnapshot: ReportSubmissionSnapshot | null;
  serverReceiptId: string | null;
  lastError: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateReportDraftInput = Pick<
  ReportDraft,
  | 'userId'
  | 'contextKey'
  | 'source'
  | 'reportKind'
  | 'challengeId'
  | 'groupId'
  | 'submissionId'
  | 'contextLabel'
  | 'crashReference'
  | 'attachments'
> & {
  targetUserId?: string | null;
  targetUserLabel?: string | null;
  title?: string;
  description?: string;
  observedBehavior?: string;
  expectedBehavior?: string;
  stepsToReproduce?: string;
};

const REPORT_STATUSES: readonly ReportDraftStatus[] = [
  'draft',
  'submitting',
  'not-sent',
  'result-unknown',
  'server-confirmed',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringOrNull = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null;

const hasStringFields = <Key extends string>(
  value: Record<string, unknown>,
  keys: readonly Key[]
): value is Record<string, unknown> & Record<Key, string> =>
  keys.every(key => typeof value[key] === 'string');

const hasNullableStringFields = <Key extends string>(
  value: Record<string, unknown>,
  keys: readonly Key[]
): value is Record<string, unknown> & Record<Key, string | null> =>
  keys.every(key => isStringOrNull(value[key]));

const isReportStatus = (value: unknown): value is ReportDraftStatus =>
  typeof value === 'string' &&
  (REPORT_STATUSES as readonly string[]).includes(value);

const parseAttachment = (value: unknown): ReportAttachmentMetadata | null => {
  if (!isRecord(value) || typeof value.name !== 'string' || !value.name) {
    return null;
  }
  if (!isStringOrNull(value.mimeType) || !isStringOrNull(value.localUri)) {
    return null;
  }
  if (value.sizeBytes !== null && typeof value.sizeBytes !== 'number') {
    return null;
  }
  return {
    name: value.name,
    mimeType: value.mimeType,
    sizeBytes: value.sizeBytes,
    localUri: value.localUri,
  };
};

const parseSnapshot = (value: unknown): ReportSubmissionSnapshot | null => {
  if (!isRecord(value)) return null;
  if (
    !hasStringFields(value, ['title', 'description', 'source', 'createdAt']) ||
    !hasNullableStringFields(value, [
      'observedBehavior',
      'expectedBehavior',
      'stepsToReproduce',
      'reportKind',
      'challengeId',
      'groupId',
      'submissionId',
      'contextLabel',
      'crashReference',
    ]) ||
    !Array.isArray(value.attachments)
  ) {
    return null;
  }
  const attachments = value.attachments
    .map(parseAttachment)
    .filter((item): item is ReportAttachmentMetadata => item !== null);
  if (attachments.length !== value.attachments.length) return null;
  const targetUserId = value.targetUserId ?? null;
  const targetUserLabel = value.targetUserLabel ?? null;
  if (!isStringOrNull(targetUserId) || !isStringOrNull(targetUserLabel)) {
    return null;
  }
  return {
    title: value.title,
    description: value.description,
    observedBehavior: value.observedBehavior,
    expectedBehavior: value.expectedBehavior,
    stepsToReproduce: value.stepsToReproduce,
    source: value.source,
    reportKind: value.reportKind,
    challengeId: value.challengeId,
    groupId: value.groupId,
    submissionId: value.submissionId,
    targetUserId,
    targetUserLabel,
    contextLabel: value.contextLabel,
    crashReference: value.crashReference,
    attachments,
    createdAt: value.createdAt,
  };
};

const parseReportDraft = (value: unknown): ReportDraft | null => {
  if (!isRecord(value)) return null;
  if (
    !hasStringFields(value, [
      'id',
      'userId',
      'contextKey',
      'title',
      'description',
      'observedBehavior',
      'expectedBehavior',
      'stepsToReproduce',
      'source',
      'createdAt',
      'updatedAt',
    ])
  ) {
    return null;
  }
  if (!isReportStatus(value.status) || !Array.isArray(value.attachments)) {
    return null;
  }
  if (
    !hasNullableStringFields(value, [
      'reportKind',
      'challengeId',
      'groupId',
      'submissionId',
      'contextLabel',
      'crashReference',
      'serverReceiptId',
      'lastError',
    ]) ||
    typeof value.attemptCount !== 'number'
  ) {
    return null;
  }
  const attachments = value.attachments
    .map(parseAttachment)
    .filter((item): item is ReportAttachmentMetadata => item !== null);
  if (attachments.length !== value.attachments.length) return null;
  const snapshot =
    value.submissionSnapshot === null
      ? null
      : parseSnapshot(value.submissionSnapshot);
  if (value.submissionSnapshot !== null && snapshot === null) return null;
  const targetUserId = value.targetUserId ?? null;
  const targetUserLabel = value.targetUserLabel ?? null;
  if (!isStringOrNull(targetUserId) || !isStringOrNull(targetUserLabel)) {
    return null;
  }
  return {
    id: value.id,
    userId: value.userId,
    contextKey: value.contextKey,
    status: value.status,
    title: value.title,
    description: value.description,
    observedBehavior: value.observedBehavior,
    expectedBehavior: value.expectedBehavior,
    stepsToReproduce: value.stepsToReproduce,
    source: value.source,
    reportKind: value.reportKind,
    challengeId: value.challengeId,
    groupId: value.groupId,
    submissionId: value.submissionId,
    targetUserId,
    targetUserLabel,
    contextLabel: value.contextLabel,
    crashReference: value.crashReference,
    attachments,
    submissionSnapshot: snapshot,
    serverReceiptId: value.serverReceiptId,
    lastError: value.lastError,
    attemptCount: value.attemptCount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

export const loadReportDrafts = async (): Promise<ReportDraft[]> => {
  const raw = await AsyncStorage.getItem(REPORT_DRAFTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseReportDraft)
      .filter((item): item is ReportDraft => item !== null);
  } catch {
    console.warn('[ReportDrafts] Could not read locally saved reports.');
    return [];
  }
};

const persistReportDrafts = async (drafts: ReportDraft[]): Promise<void> => {
  await AsyncStorage.setItem(REPORT_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
};

export const saveReportDraft = async (
  draft: ReportDraft
): Promise<ReportDraft> => {
  const drafts = await loadReportDrafts();
  const index = drafts.findIndex(item => item.id === draft.id);
  if (index >= 0) drafts[index] = draft;
  else drafts.push(draft);
  await persistReportDrafts(drafts);
  return draft;
};

export const removeReportDraft = async (
  expectedUserId: string,
  id: string
): Promise<void> => {
  const drafts = await loadReportDrafts();
  await persistReportDrafts(
    drafts.filter(draft => draft.id !== id || draft.userId !== expectedUserId)
  );
};

/**
 * Report drafts are created only for signed-in accounts. Confirmed account
 * deletion removes that account's drafts without touching another user's
 * local reports. Ordinary sign-out intentionally keeps namespaced drafts for
 * same-account recovery.
 */
export const clearReportDraftsForUser = async (
  userId: string | null | undefined
): Promise<void> => {
  if (!userId) return;

  const drafts = await loadReportDrafts();
  const retained = drafts.filter(draft => draft.userId !== userId);
  if (retained.length === 0) {
    await AsyncStorage.removeItem(REPORT_DRAFTS_STORAGE_KEY);
    return;
  }
  await persistReportDrafts(retained);
};

export const createReportDraft = async (
  input: CreateReportDraftInput
): Promise<ReportDraft> => {
  const now = new Date().toISOString();
  const draft: ReportDraft = {
    id: createClientEventId(),
    userId: input.userId,
    contextKey: input.contextKey,
    status: 'draft',
    title: input.title ?? '',
    description: input.description ?? '',
    observedBehavior: input.observedBehavior ?? '',
    expectedBehavior: input.expectedBehavior ?? '',
    stepsToReproduce: input.stepsToReproduce ?? '',
    source: input.source,
    reportKind: input.reportKind,
    challengeId: input.challengeId,
    groupId: input.groupId,
    submissionId: input.submissionId,
    targetUserId: input.targetUserId ?? null,
    targetUserLabel: input.targetUserLabel ?? null,
    contextLabel: input.contextLabel,
    crashReference: input.crashReference,
    attachments: input.attachments,
    submissionSnapshot: null,
    serverReceiptId: null,
    lastError: null,
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return saveReportDraft(draft);
};

export const getLatestOpenReportDraft = async (
  userId: string,
  contextKey: string
): Promise<ReportDraft | null> => {
  const drafts = await loadReportDrafts();
  return (
    drafts
      .filter(
        draft =>
          draft.userId === userId &&
          draft.contextKey === contextKey &&
          draft.status !== 'server-confirmed'
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
};

/**
 * Reopens one exact local report without letting a route cross account or
 * confirmed-receipt boundaries. The caller supplies both values deliberately:
 * a draft ID alone is never authority to reveal private report content.
 */
export const getOpenReportDraftByIdForUser = async (
  userId: string,
  id: string
): Promise<ReportDraft | null> => {
  const drafts = await loadReportDrafts();
  return (
    drafts.find(
      draft =>
        draft.id === id &&
        draft.userId === userId &&
        draft.status !== 'server-confirmed'
    ) ?? null
  );
};

export const listOpenReportDraftsForUser = async (
  userId: string
): Promise<ReportDraft[]> => {
  const drafts = await loadReportDrafts();
  return drafts
    .filter(
      draft => draft.userId === userId && draft.status !== 'server-confirmed'
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const updateReportDraft = async (
  expectedUserId: string,
  id: string,
  patch: Partial<
    Omit<ReportDraft, 'id' | 'userId' | 'createdAt' | 'submissionSnapshot'>
  >
): Promise<ReportDraft> => {
  const drafts = await loadReportDrafts();
  const existing = drafts.find(
    draft => draft.id === id && draft.userId === expectedUserId
  );
  if (!existing) throw new Error(`Report draft not found: ${id}`);
  const next: ReportDraft = {
    ...existing,
    ...patch,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    submissionSnapshot: existing.submissionSnapshot,
    updatedAt: new Date().toISOString(),
  };
  return saveReportDraft(next);
};

export const beginReportSubmission = async (
  expectedUserId: string,
  id: string
): Promise<ReportDraft> => {
  const drafts = await loadReportDrafts();
  const existing = drafts.find(
    draft =>
      draft.id === id &&
      draft.userId === expectedUserId &&
      draft.status !== 'server-confirmed'
  );
  if (!existing) throw new Error(`Report draft not found: ${id}`);
  const snapshot =
    existing.submissionSnapshot ??
    ({
      title: existing.title.trim(),
      description: existing.description.trim(),
      observedBehavior: existing.observedBehavior.trim() || null,
      expectedBehavior: existing.expectedBehavior.trim() || null,
      stepsToReproduce: existing.stepsToReproduce.trim() || null,
      source: existing.source,
      reportKind: existing.reportKind,
      challengeId: existing.challengeId,
      groupId: existing.groupId,
      submissionId: existing.submissionId,
      targetUserId: existing.targetUserId,
      targetUserLabel: existing.targetUserLabel,
      contextLabel: existing.contextLabel,
      crashReference: existing.crashReference,
      attachments: existing.attachments,
      createdAt: new Date().toISOString(),
    } satisfies ReportSubmissionSnapshot);
  const next: ReportDraft = {
    ...existing,
    status: 'submitting',
    submissionSnapshot: snapshot,
    attemptCount: existing.attemptCount + 1,
    lastError: null,
    updatedAt: new Date().toISOString(),
  };
  return saveReportDraft(next);
};

export const isResponseUnknownError = (error: unknown): boolean => {
  const message = String(
    (error as { message?: unknown } | null)?.message ?? error ?? ''
  ).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('connection')
  );
};

export const isDefinitiveReportRejection = (error: unknown): boolean => {
  const candidate = error as { code?: unknown; status?: unknown } | null;
  const code = String(candidate?.code ?? '');
  const status = String(candidate?.status ?? '');
  return (
    status === '400' ||
    status === '401' ||
    status === '403' ||
    code === '42501' ||
    code === '23502' ||
    code === '23503' ||
    code === '23514' ||
    code === '22P02' ||
    code === '22001'
  );
};

export const getReportDraftCopy = (
  status: ReportDraftStatus
): { title: string; description: string } => {
  switch (status) {
    case 'draft':
      return {
        title: translate('en-NZ', 'domain.report.draft_saved'),
        description: translate('en-NZ', 'domain.report.nothing_sent'),
      };
    case 'submitting':
      return {
        title: translate('en-NZ', 'domain.report.sending'),
        description: translate('en-NZ', 'domain.report.waiting_confirmation'),
      };
    case 'not-sent':
      return {
        title: translate('en-NZ', 'domain.report.not_sent'),
        description: translate('en-NZ', 'domain.report.remains_on_phone'),
      };
    case 'result-unknown':
      return {
        title: translate('en-NZ', 'domain.report.result_unknown'),
        description: translate('en-NZ', 'domain.report.could_not_confirm'),
      };
    case 'server-confirmed':
      return {
        title: translate('en-NZ', 'domain.report.received'),
        description: translate('en-NZ', 'domain.report.confirmed'),
      };
  }
};
