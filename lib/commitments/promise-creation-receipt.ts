export interface PromiseCreationReceipt {
  isFirstPromise: boolean;
  nextDueAt: string | null;
  activation: AccountActivationReceipt | null;
  referral: ReferralActivationReceipt | null;
}

export interface AccountActivationReceipt {
  confirmed: true;
  activated: boolean;
  activatedAt: string;
  firstPromiseId: string;
  firstPromiseTitle: string;
  source: 'first_promise_v1' | 'legacy_existing_promise';
  welcomeMomentaAmount: number;
  welcomeMomentaGranted: boolean;
  welcomeMomentaOutcome:
    | 'granted_now'
    | 'already_confirmed'
    | 'legacy_not_backfilled';
  referral: ReferralActivationReceipt | null;
}

export interface ReferralActivationReceipt {
  accepted: boolean;
  outcome: string;
  referralId: string | null;
  referralCode: string | null;
  status: 'pending' | 'completed' | 'cancelled' | null;
  rewardOutcome: string | null;
  inviterRewardAmount: number;
  referredRewardAmount: number;
}

export type AccountActivationLookup =
  | {
      kind: 'absent';
      stagedReferral: ReferralActivationReceipt | null;
    }
  | {
      kind: 'confirmed';
      receipt: AccountActivationReceipt;
    };

type UnknownRecord = Record<string, unknown>;

const timestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;

  const timestamp = new Date(value);
  return timestampPattern.test(value) && Number.isFinite(timestamp.getTime());
};

const asNonNegativeAmount = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
};

const referralOutcomes = new Set([
  'pending_activation',
  'both_rewarded',
  'inviter_capped',
  'program_disabled',
  'already_accepted',
  'referral_already_accepted',
  'account_not_eligible',
]);

const referralStatuses = new Set(['pending', 'completed', 'cancelled']);

export const decodeAccountActivationReceipt = (
  value: unknown
): AccountActivationReceipt | null => {
  if (!isRecord(value)) return null;
  if (value.confirmed !== true || typeof value.activated !== 'boolean') {
    return null;
  }

  const activatedAt = value.activated_at;
  if (!isTimestamp(activatedAt)) {
    return null;
  }

  const welcome = isRecord(value.welcome_momenta)
    ? value.welcome_momenta
    : null;
  const firstPromiseId = value.first_promise_id;
  const firstPromiseTitle = value.first_promise_title;
  const source = value.source;
  if (typeof firstPromiseId !== 'string' || !firstPromiseId.trim()) {
    return null;
  }
  if (typeof firstPromiseTitle !== 'string' || !firstPromiseTitle.trim()) {
    return null;
  }
  if (source !== 'first_promise_v1' && source !== 'legacy_existing_promise') {
    return null;
  }

  const welcomeOutcome = welcome?.outcome;
  const welcomeAmount = asNonNegativeAmount(welcome?.amount);
  const welcomeGranted = welcome?.granted;
  if (
    typeof welcomeGranted !== 'boolean' ||
    welcomeAmount === null ||
    (welcomeOutcome !== 'granted_now' &&
      welcomeOutcome !== 'already_confirmed' &&
      welcomeOutcome !== 'legacy_not_backfilled') ||
    (welcomeOutcome === 'granted_now' &&
      (!welcomeGranted || welcomeAmount !== 100)) ||
    (welcomeOutcome === 'already_confirmed' &&
      (welcomeGranted || welcomeAmount !== 100)) ||
    (welcomeOutcome === 'legacy_not_backfilled' &&
      (welcomeGranted || welcomeAmount !== 0))
  ) {
    return null;
  }

  const referral =
    value.referral === null || value.referral === undefined
      ? null
      : decodeReferralReceipt(value.referral);
  if (value.referral !== null && value.referral !== undefined && !referral) {
    return null;
  }

  return {
    confirmed: true,
    activated: value.activated,
    activatedAt,
    firstPromiseId: firstPromiseId.trim(),
    firstPromiseTitle: firstPromiseTitle.trim(),
    source,
    welcomeMomentaAmount: welcomeAmount,
    welcomeMomentaGranted: welcomeGranted,
    welcomeMomentaOutcome: welcomeOutcome,
    referral,
  };
};

function decodeReferralReceipt(
  value: unknown
): ReferralActivationReceipt | null {
  if (!isRecord(value)) return null;
  const accepted =
    typeof value.accepted === 'boolean'
      ? value.accepted
      : typeof value.success === 'boolean'
        ? value.success
        : null;
  const outcome =
    typeof value.outcome === 'string'
      ? value.outcome
      : typeof value.reward_outcome === 'string'
        ? value.reward_outcome
        : null;
  const referralId = value.referral_id ?? value.referralId;
  const referralCode = value.referral_code ?? value.referralCode;
  const status = value.status;
  const rewardOutcome = value.reward_outcome ?? value.rewardOutcome;
  const inviterRewardAmount = asNonNegativeAmount(
    value.inviter_reward_amount ?? value.inviterRewardAmount
  );
  const referredRewardAmount = asNonNegativeAmount(
    value.referred_reward_amount ?? value.referredRewardAmount
  );
  if (
    accepted === null ||
    (typeof value.accepted === 'boolean' &&
      typeof value.success === 'boolean' &&
      value.accepted !== value.success) ||
    !outcome ||
    !referralOutcomes.has(outcome) ||
    (referralId !== null &&
      referralId !== undefined &&
      typeof referralId !== 'string') ||
    (referralCode !== null &&
      referralCode !== undefined &&
      typeof referralCode !== 'string') ||
    (status !== null &&
      status !== undefined &&
      (typeof status !== 'string' || !referralStatuses.has(status))) ||
    (rewardOutcome !== null &&
      rewardOutcome !== undefined &&
      typeof rewardOutcome !== 'string') ||
    inviterRewardAmount === null ||
    referredRewardAmount === null
  ) {
    return null;
  }

  return {
    accepted,
    outcome,
    referralId: typeof referralId === 'string' ? referralId : null,
    referralCode: typeof referralCode === 'string' ? referralCode : null,
    status:
      typeof status === 'string'
        ? (status as ReferralActivationReceipt['status'])
        : null,
    rewardOutcome: typeof rewardOutcome === 'string' ? rewardOutcome : null,
    inviterRewardAmount,
    referredRewardAmount,
  };
}

export const decodeAccountActivationLookup = (
  value: unknown
): AccountActivationLookup | null => {
  if (!isRecord(value) || typeof value.confirmed !== 'boolean') return null;

  if (value.confirmed) {
    const receipt = decodeAccountActivationReceipt(value);
    return receipt ? { kind: 'confirmed', receipt } : null;
  }

  const stagedReferral =
    value.referral === null || value.referral === undefined
      ? null
      : decodeReferralReceipt(value.referral);
  if (
    value.referral !== null &&
    value.referral !== undefined &&
    (!stagedReferral ||
      stagedReferral.status !== 'pending' ||
      !stagedReferral.referralCode)
  ) {
    return null;
  }

  return { kind: 'absent', stagedReferral };
};

/**
 * Decodes only the receipt shape produced by the auth-owned creation RPC.
 * Deliberately do not derive a first-promise status or due time on device.
 */
export const decodePromiseCreationReceipt = (
  value: unknown
): PromiseCreationReceipt | null => {
  if (!isRecord(value)) return null;
  if (typeof value.is_first_promise !== 'boolean') return null;
  if (value.next_due_at !== null && !isTimestamp(value.next_due_at)) {
    return null;
  }

  const activation =
    value.activation === null || value.activation === undefined
      ? null
      : decodeAccountActivationReceipt(value.activation);
  if (
    value.activation !== null &&
    value.activation !== undefined &&
    !activation
  ) {
    return null;
  }

  const referralValue = isRecord(value.activation)
    ? (value.activation.referral ?? value.referral)
    : value.referral;
  const referral =
    referralValue === null || referralValue === undefined
      ? null
      : decodeReferralReceipt(referralValue);
  if (referralValue !== null && referralValue !== undefined && !referral) {
    return null;
  }

  return {
    isFirstPromise: value.is_first_promise,
    nextDueAt: value.next_due_at,
    activation,
    referral,
  };
};

export const formatPromiseDueWindow = (
  nextDueAt: string | null,
  timeZone?: string
): string | null => {
  if (!isTimestamp(nextDueAt)) return null;

  try {
    return new Intl.DateTimeFormat('en-NZ', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    }).format(new Date(nextDueAt));
  } catch {
    return null;
  }
};
