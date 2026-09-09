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

    return {
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

export const loadPromiseCreationDraft = async (
  userId: string
): Promise<PromiseCreationDraft | null> => {
  const raw = await AsyncStorage.getItem(getPromiseCreationDraftKey(userId));
  return getOwnedPromiseCreationDraft({ raw, userId });
};

export const buildPromiseCreationDraft = (
  input: PromiseCreationDraftInput
): PromiseCreationDraft => ({
  version: 1,
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
  const draft = buildPromiseCreationDraft(input);
  await AsyncStorage.setItem(
    getPromiseCreationDraftKey(input.ownerUserId),
    JSON.stringify(draft)
  );
  return draft;
};

/** A deliberate create receipt is the only condition that removes a draft. */
export const clearPromiseCreationDraft = async (
  userId: string
): Promise<void> => AsyncStorage.removeItem(getPromiseCreationDraftKey(userId));
