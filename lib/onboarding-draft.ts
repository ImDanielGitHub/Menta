import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DRAFT_STORAGE_PREFIX = 'menta.onboarding.promise-draft.v3';
const LEGACY_ONBOARDING_DRAFT_V2_KEY = 'menta.onboarding.promise-draft.v2';
const LEGACY_ONBOARDING_DRAFT_V1_KEY = 'menta.onboarding.promise-draft.v1';

export const ONBOARDING_ANONYMOUS_DRAFT_KEY = `${ONBOARDING_DRAFT_STORAGE_PREFIX}.anonymous`;

/**
 * Backwards-compatible name for the anonymous draft key. Account-owned drafts
 * use getOnboardingDraftKeyForUser instead of sharing this key.
 */
export const ONBOARDING_DRAFT_KEY = ONBOARDING_ANONYMOUS_DRAFT_KEY;

export const getOnboardingDraftKeyForUser = (userId: string): string =>
  `${ONBOARDING_DRAFT_STORAGE_PREFIX}.user.${encodeURIComponent(userId)}`;

export type OnboardingProofType = 'photo' | 'video' | 'note';
export type OnboardingDuration = 7 | 14 | 30;
export type OnboardingAccountabilityChoice = 'just_me' | 'new_group';
export type OnboardingLegalConsentVersions = {
  terms: string;
  privacy: string;
  communityStandards: string;
};
export type OnboardingResumeStep =
  | 'preview'
  | 'auth_method'
  | 'auth_cancelled'
  | 'legal_acceptance';

export type OnboardingDraft = {
  version: 3;
  promise: string;
  proofType: OnboardingProofType | null;
  durationDays: OnboardingDuration;
  accountabilityChoice: OnboardingAccountabilityChoice;
  accountabilityChoiceConfirmed?: boolean;
  notificationEducationHandled?: boolean;
  legalConsentAt: string | null;
  legalConsentVersions: OnboardingLegalConsentVersions | null;
  referralCode: string;
  marketingOptIn: boolean;
  updatedAt: string;
  ownerUserId: string | null;
  resumeStep: OnboardingResumeStep | null;
};

type LegacyOnboardingDraft = Omit<
  OnboardingDraft,
  'version' | 'durationDays' | 'accountabilityChoice'
> & {
  version: 1 | 2;
  durationDays?: OnboardingDuration;
  accountabilityChoice?: OnboardingAccountabilityChoice;
};

const proofTypes: OnboardingProofType[] = ['photo', 'video', 'note'];
const durations: OnboardingDuration[] = [7, 14, 30];
const accountabilityChoices: OnboardingAccountabilityChoice[] = [
  'just_me',
  'new_group',
];
const resumeSteps: OnboardingResumeStep[] = [
  'preview',
  'auth_method',
  'auth_cancelled',
  'legal_acceptance',
];

let storageQueue: Promise<void> = Promise.resolve();

const runInStorageOrder = <Result>(
  operation: () => Promise<Result>
): Promise<Result> => {
  const result = storageQueue.then(operation, operation);
  storageQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
};

const normaliseOwnerUserId = (
  ownerUserId: string | null | undefined
): string | null =>
  typeof ownerUserId === 'string' && ownerUserId.trim() ? ownerUserId : null;

const getDraftKey = (ownerUserId: string | null): string =>
  ownerUserId
    ? getOnboardingDraftKeyForUser(ownerUserId)
    : ONBOARDING_ANONYMOUS_DRAFT_KEY;

const hasValidDraftFields = (
  value: Partial<OnboardingDraft | LegacyOnboardingDraft>
): boolean =>
  typeof value.promise === 'string' &&
  value.promise.length <= 160 &&
  (value.proofType === null ||
    proofTypes.includes(value.proofType as OnboardingProofType)) &&
  typeof value.updatedAt === 'string' &&
  !Number.isNaN(Date.parse(value.updatedAt)) &&
  (value.durationDays === undefined ||
    durations.includes(value.durationDays as OnboardingDuration)) &&
  (value.accountabilityChoice === undefined ||
    accountabilityChoices.includes(
      value.accountabilityChoice as OnboardingAccountabilityChoice
    )) &&
  (value.accountabilityChoiceConfirmed === undefined ||
    typeof value.accountabilityChoiceConfirmed === 'boolean') &&
  (value.notificationEducationHandled === undefined ||
    typeof value.notificationEducationHandled === 'boolean') &&
  (value.legalConsentAt === undefined ||
    value.legalConsentAt === null ||
    (typeof value.legalConsentAt === 'string' &&
      !Number.isNaN(Date.parse(value.legalConsentAt)))) &&
  (value.legalConsentVersions === undefined ||
    value.legalConsentVersions === null ||
    (typeof value.legalConsentVersions === 'object' &&
      !Array.isArray(value.legalConsentVersions) &&
      typeof value.legalConsentVersions.terms === 'string' &&
      typeof value.legalConsentVersions.privacy === 'string' &&
      typeof value.legalConsentVersions.communityStandards === 'string')) &&
  (value.referralCode === undefined ||
    (typeof value.referralCode === 'string' &&
      value.referralCode.length <= 40));

export const ONBOARDING_LEGAL_CONSENT_TTL_MS = 30 * 60 * 1000;

export const hasFreshOnboardingLegalConsent = (
  legalConsentAt: string | null | undefined,
  now = Date.now()
): boolean => {
  if (!legalConsentAt) return false;
  const acceptedAt = Date.parse(legalConsentAt);
  return (
    Number.isFinite(acceptedAt) &&
    now >= acceptedAt &&
    now - acceptedAt <= ONBOARDING_LEGAL_CONSENT_TTL_MS
  );
};

const parseDraft = (value: unknown): OnboardingDraft | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<OnboardingDraft | LegacyOnboardingDraft>;
  if (!hasValidDraftFields(candidate)) return null;

  if (
    candidate.version === 3 &&
    durations.includes(candidate.durationDays as OnboardingDuration) &&
    (candidate.ownerUserId === undefined ||
      candidate.ownerUserId === null ||
      typeof candidate.ownerUserId === 'string') &&
    (candidate.resumeStep === undefined ||
      candidate.resumeStep === null ||
      resumeSteps.includes(candidate.resumeStep as OnboardingResumeStep))
  ) {
    return {
      version: 3,
      promise: candidate.promise ?? '',
      proofType: candidate.proofType ?? null,
      durationDays: candidate.durationDays as OnboardingDuration,
      accountabilityChoice:
        candidate.accountabilityChoice === 'new_group'
          ? 'new_group'
          : 'just_me',
      accountabilityChoiceConfirmed:
        candidate.accountabilityChoiceConfirmed === true ||
        candidate.resumeStep != null,
      notificationEducationHandled:
        candidate.notificationEducationHandled === true,
      legalConsentAt: candidate.legalConsentAt ?? null,
      legalConsentVersions: candidate.legalConsentVersions ?? null,
      referralCode: candidate.referralCode?.trim().toUpperCase() ?? '',
      marketingOptIn: candidate.marketingOptIn === true,
      updatedAt: candidate.updatedAt ?? new Date().toISOString(),
      ownerUserId: normaliseOwnerUserId(candidate.ownerUserId),
      resumeStep: candidate.resumeStep ?? null,
    };
  }

  if (
    candidate.version === 2 &&
    (candidate.ownerUserId === undefined ||
      candidate.ownerUserId === null ||
      typeof candidate.ownerUserId === 'string') &&
    (candidate.resumeStep === undefined ||
      candidate.resumeStep === null ||
      resumeSteps.includes(candidate.resumeStep as OnboardingResumeStep))
  ) {
    return {
      version: 3,
      promise: candidate.promise ?? '',
      proofType: candidate.proofType ?? null,
      durationDays: candidate.durationDays ?? 14,
      accountabilityChoice: 'just_me',
      accountabilityChoiceConfirmed: false,
      notificationEducationHandled: false,
      legalConsentAt: null,
      legalConsentVersions: null,
      referralCode: '',
      marketingOptIn: candidate.marketingOptIn === true,
      updatedAt: candidate.updatedAt ?? new Date().toISOString(),
      ownerUserId: normaliseOwnerUserId(candidate.ownerUserId),
      resumeStep: candidate.resumeStep ?? null,
    };
  }

  if (candidate.version === 1) {
    return {
      version: 3,
      promise: candidate.promise ?? '',
      proofType: candidate.proofType ?? null,
      durationDays: 14,
      accountabilityChoice: 'just_me',
      accountabilityChoiceConfirmed: false,
      notificationEducationHandled: false,
      legalConsentAt: null,
      legalConsentVersions: null,
      referralCode: '',
      marketingOptIn: false,
      updatedAt: candidate.updatedAt ?? new Date().toISOString(),
      ownerUserId: null,
      resumeStep: null,
    };
  }

  return null;
};

const parseStoredDraft = (raw: string | null): OnboardingDraft | null => {
  if (!raw) return null;
  try {
    return parseDraft(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
};

const readDraftAtKey = async (key: string): Promise<OnboardingDraft | null> => {
  const raw = await AsyncStorage.getItem(key);
  const draft = parseStoredDraft(raw);
  if (!draft || !raw) return draft;

  try {
    const stored = JSON.parse(raw) as {
      version?: unknown;
      accountabilityChoice?: unknown;
      accountabilityChoiceConfirmed?: unknown;
      notificationEducationHandled?: unknown;
    };
    if (
      stored.version !== 3 ||
      !accountabilityChoices.includes(
        stored.accountabilityChoice as OnboardingAccountabilityChoice
      ) ||
      typeof stored.accountabilityChoiceConfirmed !== 'boolean' ||
      typeof stored.notificationEducationHandled !== 'boolean'
    ) {
      await AsyncStorage.setItem(key, JSON.stringify(draft));
    }
  } catch {
    return null;
  }

  return draft;
};

const writeDraftAtKey = async (
  key: string,
  draft: OnboardingDraft
): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(draft));
};

const shouldReplaceDraft = (
  existing: OnboardingDraft | null,
  candidate: OnboardingDraft
): boolean =>
  !existing ||
  (existing.ownerUserId === candidate.ownerUserId &&
    Date.parse(candidate.updatedAt) > Date.parse(existing.updatedAt));

/**
 * Move drafts written by v1/v2 clients into owner-scoped v3 keys. The legacy
 * keys are removed only after every valid draft has been preserved. Repeated
 * calls are safe and also handle an older installed client writing v2 again.
 */
const migrateLegacyDrafts = async (): Promise<void> => {
  const [legacyV2Raw, legacyV1Raw] = await Promise.all([
    AsyncStorage.getItem(LEGACY_ONBOARDING_DRAFT_V2_KEY),
    AsyncStorage.getItem(LEGACY_ONBOARDING_DRAFT_V1_KEY),
  ]);

  if (!legacyV2Raw && !legacyV1Raw) return;

  const candidates = [
    parseStoredDraft(legacyV1Raw),
    parseStoredDraft(legacyV2Raw),
  ].filter((draft): draft is OnboardingDraft => draft !== null);

  for (const candidate of candidates) {
    const key = getDraftKey(candidate.ownerUserId);
    const existing = await readDraftAtKey(key);
    if (shouldReplaceDraft(existing, candidate)) {
      await writeDraftAtKey(key, candidate);
    }
  }

  await AsyncStorage.multiRemove([
    LEGACY_ONBOARDING_DRAFT_V2_KEY,
    LEGACY_ONBOARDING_DRAFT_V1_KEY,
  ]);
};

const readScopedDraft = async (
  ownerUserId: string | null
): Promise<OnboardingDraft | null> => {
  const draft = await readDraftAtKey(getDraftKey(ownerUserId));
  return draft?.ownerUserId === ownerUserId ? draft : null;
};

const normaliseAuthenticatedResumeStep = (
  draft: OnboardingDraft
): OnboardingDraft => {
  const shouldResumePreview =
    Boolean(draft.promise.trim()) &&
    Boolean(draft.proofType) &&
    draft.resumeStep === 'auth_cancelled';

  return shouldResumePreview ? { ...draft, resumeStep: 'preview' } : draft;
};

const removeScopedDraft = async (ownerUserId: string | null): Promise<void> => {
  const key = getDraftKey(ownerUserId);
  const scopedDraft = await readDraftAtKey(key);
  if (scopedDraft?.ownerUserId === ownerUserId) {
    await AsyncStorage.removeItem(key);
  }

  if (ownerUserId) {
    // A failed claim can leave an owner-marked recovery copy in the anonymous
    // slot. Only the matching account is allowed to remove that copy.
    const anonymousRecovery = await readDraftAtKey(
      ONBOARDING_ANONYMOUS_DRAFT_KEY
    );
    if (anonymousRecovery?.ownerUserId === ownerUserId) {
      await AsyncStorage.removeItem(ONBOARDING_ANONYMOUS_DRAFT_KEY);
    }
  }
};

export const loadOnboardingDraft = (): Promise<OnboardingDraft | null> =>
  runInStorageOrder(async () => {
    await migrateLegacyDrafts();
    return readScopedDraft(null);
  });

export const loadOnboardingDraftForUser = async (options: {
  userId: string | null;
  hasCompletedOnboarding: boolean;
}): Promise<OnboardingDraft | null> =>
  runInStorageOrder(async () => {
    await migrateLegacyDrafts();
    const userId = normaliseOwnerUserId(options.userId);

    if (options.hasCompletedOnboarding) {
      if (userId) {
        await removeScopedDraft(userId);
      }
      return null;
    }

    if (!userId) {
      return readScopedDraft(null);
    }

    const ownedDraft = await readScopedDraft(userId);
    if (ownedDraft) {
      const normalisedDraft = normaliseAuthenticatedResumeStep(ownedDraft);
      if (normalisedDraft.resumeStep !== ownedDraft.resumeStep) {
        await writeDraftAtKey(
          getOnboardingDraftKeyForUser(userId),
          normalisedDraft
        );
      }

      return normalisedDraft;
    }

    const anonymousDraft = await readDraftAtKey(ONBOARDING_ANONYMOUS_DRAFT_KEY);
    if (
      !anonymousDraft ||
      (anonymousDraft.ownerUserId !== null &&
        anonymousDraft.ownerUserId !== userId)
    ) {
      return null;
    }

    const claimedDraft = normaliseAuthenticatedResumeStep({
      ...anonymousDraft,
      ownerUserId: userId,
    });

    // Mark the anonymous copy as claimed before copying it. If storage fails
    // between operations, no other account can read or claim this draft, while
    // the intended account can retry and recover it.
    await writeDraftAtKey(ONBOARDING_ANONYMOUS_DRAFT_KEY, claimedDraft);
    await writeDraftAtKey(getOnboardingDraftKeyForUser(userId), claimedDraft);
    return claimedDraft;
  });

export const saveOnboardingDraft = async (
  input: Pick<OnboardingDraft, 'promise' | 'proofType'> & {
    durationDays?: OnboardingDuration;
    accountabilityChoice?: OnboardingAccountabilityChoice;
    accountabilityChoiceConfirmed?: boolean;
    notificationEducationHandled?: boolean;
    legalConsentAt?: string | null;
    legalConsentVersions?: OnboardingLegalConsentVersions | null;
    referralCode?: string;
    marketingOptIn?: boolean;
  },
  ownerUserId?: string | null,
  resumeStep?: OnboardingResumeStep | null
): Promise<OnboardingDraft> =>
  runInStorageOrder(async () => {
    await migrateLegacyDrafts();
    const requestedOwner = normaliseOwnerUserId(ownerUserId);
    const anonymousClaim = requestedOwner
      ? null
      : await readDraftAtKey(ONBOARDING_ANONYMOUS_DRAFT_KEY);
    // A provider handoff can finish while an anonymous debounced write is
    // already queued. Keep that late write with the account that claimed the
    // draft instead of reopening it for whichever account appears next.
    const owner = anonymousClaim?.ownerUserId ?? requestedOwner;
    const existing = await readScopedDraft(owner);
    const draft: OnboardingDraft = {
      version: 3,
      promise: input.promise.slice(0, 160),
      proofType: input.proofType,
      durationDays: input.durationDays ?? existing?.durationDays ?? 14,
      accountabilityChoice:
        input.accountabilityChoice ??
        existing?.accountabilityChoice ??
        'just_me',
      accountabilityChoiceConfirmed:
        input.accountabilityChoiceConfirmed ??
        existing?.accountabilityChoiceConfirmed ??
        false,
      notificationEducationHandled:
        input.notificationEducationHandled ??
        existing?.notificationEducationHandled ??
        false,
      legalConsentAt:
        input.legalConsentAt === undefined
          ? (existing?.legalConsentAt ?? null)
          : input.legalConsentAt,
      legalConsentVersions:
        input.legalConsentVersions === undefined
          ? (existing?.legalConsentVersions ?? null)
          : input.legalConsentVersions,
      referralCode:
        input.referralCode === undefined
          ? (existing?.referralCode ?? '')
          : input.referralCode.trim().toUpperCase().slice(0, 40),
      marketingOptIn: input.marketingOptIn ?? existing?.marketingOptIn ?? false,
      updatedAt: new Date().toISOString(),
      ownerUserId: owner,
      resumeStep:
        resumeStep === undefined ? (existing?.resumeStep ?? null) : resumeStep,
    };
    await writeDraftAtKey(getDraftKey(owner), draft);
    return draft;
  });

export const clearOwnedOnboardingDraft = async (
  userId: string
): Promise<void> => {
  if (!userId.trim()) return;
  await clearOnboardingDraft(userId);
};

/**
 * Remove only the draft owned by the expected account. Omitting the argument
 * clears the anonymous draft for compatibility with signed-out callers.
 */
export const clearOnboardingDraft = async (
  expectedOwnerUserId: string | null = null
): Promise<void> =>
  runInStorageOrder(async () => {
    await migrateLegacyDrafts();
    if (
      typeof expectedOwnerUserId === 'string' &&
      !expectedOwnerUserId.trim()
    ) {
      return;
    }
    await removeScopedDraft(normaliseOwnerUserId(expectedOwnerUserId));
  });
