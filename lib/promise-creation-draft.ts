import type {
  ReviewerChoice,
  CheckInPlan,
} from '@/components/challenge/create/PromiseFlow';
import type { CommitmentTemplateId } from '@/lib/commitments/templates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ChallengeDifficulty,
  ChallengeVerificationType,
} from '@/components/challenge/create/types';

const PROMISE_CREATION_DRAFT_PREFIX = 'menta.promise-creation-draft.v1';

const draftProofTypes: readonly ChallengeVerificationType[] = [
  'photo',
  'video',
  'text',
];
const draftDifficulties: readonly ChallengeDifficulty[] = [
  'easy',
  'medium',
  'hard',
];
const draftDurations = [7, 14, 30] as const;

export type PromiseCreationDraft = {
  version: 1;
  reviewer?: ReviewerChoice;
  checkInPlan?: CheckInPlan;
  templateId?: CommitmentTemplateId;
  mentaBackup?: boolean;
  mentaMomenta?: boolean;
  groupId?: string | null;
  stepId?: 'name' | 'proof' | 'who' | 'length' | 'review';
  pendingFriendChallengeId?: string | null;
  ownerUserId: string;
  currentStep: 0 | 1 | 2 | 3;
  title: string;
  description: string;
  proofType: Exclude<ChallengeVerificationType, 'none'>;
  proofDescription: string;
  submissionText: string;
  duration: (typeof draftDurations)[number];
  difficulty: ChallengeDifficulty;
  /**
   * A create RPC may have reached the server before the client lost its
   * response. This is not a receipt and must survive a route restart until
   * the person has checked Today and explicitly chooses a new request.
   */
  unknownCreateResultAt: string | null;
  /** Time when the person asked Today to read back authoritative obligations. */
  todayReadbackRequestedAt: string | null;
  updatedAt: string;
};

export type PromiseCreationDraftInput = Omit<
  PromiseCreationDraft,
  'version' | 'updatedAt'
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  !Number.isNaN(Date.parse(value));

const hasBoundedString = (
  value: unknown,
  maximumLength: number
): value is string =>
  typeof value === 'string' && value.length <= maximumLength;

const isNullableIsoDate = (value: unknown): value is string | null =>
  value === null || isIsoDate(value);

const isDraftStep = (value: unknown): value is 0 | 1 | 2 | 3 =>
  value === 0 || value === 1 || value === 2 || value === 3;

const isDraftProofType = (
  value: unknown
): value is Exclude<ChallengeVerificationType, 'none'> =>
  typeof value === 'string' &&
  draftProofTypes.includes(value as ChallengeVerificationType);

const isDraftDifficulty = (value: unknown): value is ChallengeDifficulty =>
  typeof value === 'string' &&
  draftDifficulties.includes(value as ChallengeDifficulty);

const isDraftDuration = (
  value: unknown
): value is (typeof draftDurations)[number] =>
  typeof value === 'number' && draftDurations.includes(value as 7 | 14 | 30);

const decodeExtras = (
  value: Record<string, unknown>
): Partial<PromiseCreationDraft> | null => {
  const result: Partial<PromiseCreationDraft> = {};
  if (value.reviewer !== undefined) {
    const r = value.reviewer;
    if (
      !isRecord(r) ||
      !['self', 'friend', 'menta', 'group'].includes(String(r.kind))
    )
      return null;
    if (
      r.kind === 'group' &&
      (!hasBoundedString(r.groupId, 128) || !hasBoundedString(r.name, 200))
    )
      return null;
    result.reviewer =
      r.kind === 'group'
        ? {
            kind: 'group',
            groupId: r.groupId as string,
            name: r.name as string,
          }
        : ({ kind: r.kind } as ReviewerChoice);
  }
  if (value.checkInPlan !== undefined) {
    const plan = value.checkInPlan;
    if (
      !isRecord(plan) ||
      !['every', 'weekdays', 'custom'].includes(String(plan.kind))
    )
      return null;
    if (
      plan.kind === 'custom' &&
      (!Array.isArray(plan.days) ||
        plan.days.length > 7 ||
        plan.days.some(day => !Number.isInteger(day) || day < 1 || day > 7) ||
        new Set(plan.days).size !== plan.days.length)
    )
      return null;
    result.checkInPlan =
      plan.kind === 'custom'
        ? { kind: 'custom', days: [...(plan.days as number[])] }
        : ({ kind: plan.kind } as CheckInPlan);
  }
  for (const key of ['mentaBackup', 'mentaMomenta'] as const) {
    if (value[key] !== undefined) {
      if (typeof value[key] !== 'boolean') return null;
      result[key] = value[key];
    }
  }
  for (const key of [
    'templateId',
    'groupId',
    'pendingFriendChallengeId',
  ] as const) {
    if (value[key] === undefined) continue;
    if (key === 'templateId' && value[key] === null) return null;
    if (value[key] !== null && !hasBoundedString(value[key], 128)) return null;
    if (
      key === 'pendingFriendChallengeId' &&
      value[key] !== null &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value[key] as string
      )
    )
      return null;
    Object.assign(result, { [key]: value[key] });
  }
  if (value.stepId !== undefined) {
    if (
      !['name', 'proof', 'who', 'length', 'review'].includes(
        String(value.stepId)
      )
    )
      return null;
    result.stepId = value.stepId as PromiseCreationDraft['stepId'];
  }
  return result;
};

export const getPromiseCreationDraftKey = (userId: string): string =>
  `${PROMISE_CREATION_DRAFT_PREFIX}:${userId}`;

/**
 * Strictly decode only the current, bounded local contract. Invalid or stale
 * data is ignored rather than partially restoring fields into a new promise.
 */
export const decodePromiseCreationDraft = (
  raw: string | null
): PromiseCreationDraft | null => {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return null;

    if (
      value.version !== 1 ||
      !hasBoundedString(value.ownerUserId, 128) ||
      value.ownerUserId.trim().length === 0 ||
      !isDraftStep(value.currentStep) ||
      !hasBoundedString(value.title, 100) ||
      !hasBoundedString(value.description, 500) ||
      !isDraftProofType(value.proofType) ||
      !hasBoundedString(value.proofDescription, 300) ||
      !hasBoundedString(value.submissionText, 200) ||
      !isDraftDuration(value.duration) ||
      !isDraftDifficulty(value.difficulty) ||
      !isNullableIsoDate(value.unknownCreateResultAt) ||
      !isNullableIsoDate(value.todayReadbackRequestedAt) ||
      !isIsoDate(value.updatedAt)
    ) {
      return null;
    }

    const extras = decodeExtras(value);
    if (!extras) return null;
    return {
      ...extras,
      version: 1,
      ownerUserId: value.ownerUserId,
      currentStep: value.currentStep,
      title: value.title,
      description: value.description,
      proofType: value.proofType,
      proofDescription: value.proofDescription,
      submissionText: value.submissionText,
      duration: value.duration,
      difficulty: value.difficulty,
      unknownCreateResultAt: value.unknownCreateResultAt,
      todayReadbackRequestedAt: value.todayReadbackRequestedAt,
      updatedAt: value.updatedAt,
    };
  } catch {
    return null;
  }
};

export const getOwnedPromiseCreationDraft = (args: {
  raw: string | null;
  userId: string;
}): PromiseCreationDraft | null => {
  const draft = decodePromiseCreationDraft(args.raw);
  return draft?.ownerUserId === args.userId ? draft : null;
};

// Serialize account-owned local storage operations and create requests separately.
// A new route can wait for an earlier request without blocking its receipt save.
const draftOperations = new Map<string, Promise<void>>();
const creationRequests = new Map<string, Promise<void>>();
const withOwnedOperation = async <Result>(
  operations: Map<string, Promise<void>>,
  owner: string,
  operation: () => Promise<Result>
): Promise<Result> => {
  const previous = operations.get(owner) ?? Promise.resolve();
  const result = previous.then(operation);
  const settled = result.then(
    () => undefined,
    () => undefined
  );
  operations.set(owner, settled);
  try {
    return await result;
  } finally {
    if (operations.get(owner) === settled) operations.delete(owner);
  }
};

/** A remounted route must finish reading an earlier receipt before creating. */
export const withPromiseCreationRequest = <Result>(
  owner: string,
  operation: () => Promise<Result>
): Promise<Result> => withOwnedOperation(creationRequests, owner, operation);

export type PromiseReceiptRecovery = {
  draft: PromiseCreationDraft;
  persistence: 'pending' | 'saved' | 'failed';
};
const confirmedReceipts = new Map<string, PromiseReceiptRecovery>();
const receiptListeners = new Map<
  string,
  Set<(receipt: PromiseReceiptRecovery) => void>
>();
const notifyReceipt = (owner: string) => {
  const receipt = confirmedReceipts.get(owner);
  if (receipt)
    receiptListeners.get(owner)?.forEach(listener => listener(receipt));
};

/** Process-local recovery, always keyed by the request owner; not durable storage. */
export const retainPromiseCreationReceipt = (
  input: PromiseCreationDraftInput,
  persistence: PromiseReceiptRecovery['persistence'] = 'pending'
): PromiseCreationDraft => {
  const existing = confirmedReceipts.get(input.ownerUserId);
  if (existing) return existing.draft;
  const draft = decodePromiseCreationDraft(
    JSON.stringify(
      buildPromiseCreationDraft({
        ...input,
        unknownCreateResultAt: null,
        todayReadbackRequestedAt: null,
      })
    )
  );
  if (!draft?.pendingFriendChallengeId)
    throw new Error('Invalid owned promise receipt');
  confirmedReceipts.set(input.ownerUserId, { draft, persistence });
  notifyReceipt(input.ownerUserId);
  return draft;
};

export const getPromiseCreationReceiptRecovery = (
  owner: string
): PromiseReceiptRecovery | null => confirmedReceipts.get(owner) ?? null;

export const subscribePromiseCreationReceipts = (
  owner: string,
  listener: (receipt: PromiseReceiptRecovery) => void
): (() => void) => {
  const listeners = receiptListeners.get(owner) ?? new Set();
  receiptListeners.set(owner, listeners);
  listeners.add(listener);
  const receipt = confirmedReceipts.get(owner);
  if (receipt) listener(receipt);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) receiptListeners.delete(owner);
  };
};

const readStoredDraft = async (
  owner: string
): Promise<PromiseCreationDraft | null> => {
  const raw = await AsyncStorage.getItem(getPromiseCreationDraftKey(owner));
  if (raw === null) return null;
  const draft = getOwnedPromiseCreationDraft({ raw, userId: owner });
  if (!draft)
    throw new Error('Saved promise recovery could not be read safely');
  return draft;
};

export const loadPromiseCreationDraft = async (
  userId: string
): Promise<PromiseCreationDraft | null> => {
  const receipt = confirmedReceipts.get(userId);
  if (receipt) return receipt.draft;
  return withOwnedOperation(draftOperations, userId, async () => {
    const currentReceipt = confirmedReceipts.get(userId);
    if (currentReceipt) return currentReceipt.draft;
    const draft = await readStoredDraft(userId);
    const lateReceipt = confirmedReceipts.get(userId);
    if (lateReceipt) return lateReceipt.draft;
    if (draft?.pendingFriendChallengeId)
      return retainPromiseCreationReceipt(draft, 'saved');
    return draft;
  });
};

export const buildPromiseCreationDraft = (
  input: PromiseCreationDraftInput
): PromiseCreationDraft => ({
  version: 1,
  ...(decodeExtras(input as unknown as Record<string, unknown>) ?? {}),
  ownerUserId: input.ownerUserId,
  currentStep: input.currentStep,
  title: input.title.slice(0, 100),
  description: input.description.slice(0, 500),
  proofType: input.proofType,
  proofDescription: input.proofDescription.slice(0, 300),
  submissionText: input.submissionText.slice(0, 200),
  duration: input.duration,
  difficulty: input.difficulty,
  unknownCreateResultAt: input.unknownCreateResultAt,
  todayReadbackRequestedAt: input.todayReadbackRequestedAt,
  updatedAt: new Date().toISOString(),
});

export const savePromiseCreationDraft = async (
  input: PromiseCreationDraftInput
): Promise<PromiseCreationDraft> => {
  // Capture before any storage await, so write/read failure cannot discard an ID.
  if (input.pendingFriendChallengeId) retainPromiseCreationReceipt(input);
  return withOwnedOperation(draftOperations, input.ownerUserId, async () => {
    const owner = input.ownerUserId;
    try {
      const memory = confirmedReceipts.get(owner);
      const existing = memory ? memory.draft : await readStoredDraft(owner);
      const protectedDraft = existing?.pendingFriendChallengeId
        ? existing
        : existing?.unknownCreateResultAt &&
            existing.unknownCreateResultAt !== input.unknownCreateResultAt
          ? existing
          : null;
      const draft = protectedDraft ?? buildPromiseCreationDraft(input);
      await AsyncStorage.setItem(
        getPromiseCreationDraftKey(owner),
        JSON.stringify(draft)
      );
      const receipt = confirmedReceipts.get(owner);
      if (receipt) {
        confirmedReceipts.set(owner, { ...receipt, persistence: 'saved' });
        notifyReceipt(owner);
      }
      return draft;
    } catch (error) {
      const receipt = confirmedReceipts.get(owner);
      if (receipt) {
        confirmedReceipts.set(owner, { ...receipt, persistence: 'failed' });
        notifyReceipt(owner);
      }
      throw error;
    }
  });
};

/** Clear only this known failed attempt, never a newer attempt or receipt. */
export const cancelPromiseCreationAttempt = async (
  input: PromiseCreationDraftInput,
  attemptAt: string
): Promise<void> =>
  withOwnedOperation(draftOperations, input.ownerUserId, async () => {
    if (confirmedReceipts.has(input.ownerUserId)) return;
    const existing = await readStoredDraft(input.ownerUserId);
    if (
      existing?.pendingFriendChallengeId ||
      existing?.unknownCreateResultAt !== attemptAt
    )
      return;
    await AsyncStorage.setItem(
      getPromiseCreationDraftKey(input.ownerUserId),
      JSON.stringify(buildPromiseCreationDraft(input))
    );
  });

/** Explicit new request after the person has checked Today; never erase an ID. */
export const saveFreshPromiseCreationDraft = async (
  input: PromiseCreationDraftInput
): Promise<void> =>
  withOwnedOperation(draftOperations, input.ownerUserId, async () => {
    const existing = await readStoredDraft(input.ownerUserId);
    if (
      confirmedReceipts.has(input.ownerUserId) ||
      existing?.pendingFriendChallengeId ||
      (existing?.unknownCreateResultAt && !existing.todayReadbackRequestedAt)
    )
      throw new Error(
        'Check the owned promise before starting another request'
      );
    await AsyncStorage.setItem(
      getPromiseCreationDraftKey(input.ownerUserId),
      JSON.stringify(buildPromiseCreationDraft(input))
    );
  });

/** Confirmed completion of the owned flow. Failed clears retain recovery memory. */
export const clearPromiseCreationDraft = async (
  userId: string
): Promise<void> =>
  withOwnedOperation(draftOperations, userId, async () => {
    await AsyncStorage.removeItem(getPromiseCreationDraftKey(userId));
    confirmedReceipts.delete(userId);
  });
