import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  buildReferralShareUrl,
  isValidReferralCode,
  normalizeInviteCode,
} from '@/lib/invite-links';
import { supabase } from '@/lib/supabase';
import { translate } from '@/lib/localization';

export interface UserReferral {
  id: string;
  status: 'pending' | 'completed' | 'cancelled';
  rewardGranted: boolean;
  rewardOutcome: string | null;
  inviterRewardAmount: number;
  createdAt: string;
  completedAt: string | null;
}

interface PendingReferral {
  referralCode: string;
  timestamp: number;
  /**
   * Null means the link was saved before sign-in. The first authenticated
   * process attempt claims that draft for exactly one account.
   */
  ownerUserId: string | null;
}

type ReferralStatus = 'pending' | 'completed' | 'cancelled';

export interface ReferralProcessResult {
  accepted: boolean;
  outcome:
    | 'none'
    | 'pending_activation'
    | 'both_rewarded'
    | 'inviter_capped'
    | 'program_disabled'
    | 'already_accepted'
    | 'activation_required'
    | 'invalid_code'
    | 'self_referral'
    | 'account_not_eligible'
    | 'referral_already_accepted'
    | 'staged_code_mismatch'
    | 'cancelled'
    | 'unavailable';
  referralCode: string | null;
  status: ReferralStatus | null;
  inviterRewardAmount: number;
  referredRewardAmount: number;
}

export interface ReferralProgramStatus {
  programmeEnabled: boolean;
  rewardAmount: number;
  inviterAnnualCap: number;
  inviterRewardsThisYear: number;
  inviterCapResetsAt: string;
}

interface ReferralState {
  userReferrals: UserReferral[];
  pendingReferral: PendingReferral | null;
  lastProcessResult: ReferralProcessResult | null;
  isLoading: boolean;
  error: string | null;
  fetchUserReferrals: (userId: string) => Promise<void>;
  generateReferralLink: (userId: string) => Promise<string>;
  setPendingReferral: (
    referralCode: string,
    ownerUserId?: string | null
  ) => void;
  clearPendingReferral: (
    expectedUserId?: string,
    expectedReferralCode?: string
  ) => boolean;
  cancelPendingReferral: (expectedUserId: string) => Promise<boolean>;
  processReferral: (newUserId: string) => Promise<boolean>;
  shareReferralLink: (userId: string, username?: string) => Promise<void>;
  getReferralProgramStatus: () => Promise<ReferralProgramStatus>;
  getReferralStats: (userId: string) => Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalRewardsEarned: number;
  }>;
  clearState: (expectedUserId?: string) => void;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const firstRow = (value: unknown): UnknownRecord | null => {
  if (Array.isArray(value)) {
    return isRecord(value[0]) ? value[0] : null;
  }
  return isRecord(value) ? value : null;
};

const asCount = (value: unknown): number => {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

const parseIsoTimestamp = (value: unknown): string | null => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value
    )
  ) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const pickAmount = (
  row: UnknownRecord,
  snakeCaseKey: string,
  camelCaseKey: string
): number => asCount(row[snakeCaseKey] ?? row[camelCaseKey]);

const parseReferralCode = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const code = normalizeInviteCode(value);
  return isValidReferralCode(code) ? code : null;
};

const parseReferralStatus = (value: unknown): ReferralStatus | null =>
  value === 'pending' || value === 'completed' || value === 'cancelled'
    ? value
    : null;

const parseProcessResult = (value: unknown): ReferralProcessResult | null => {
  const row = firstRow(value);
  if (!row) return null;

  const accepted =
    typeof row.accepted === 'boolean'
      ? row.accepted
      : typeof row.success === 'boolean'
        ? row.success
        : null;
  if (accepted === null) return null;

  const rawOutcomeValue =
    typeof row.outcome === 'string'
      ? row.outcome
      : typeof row.reward_outcome === 'string'
        ? row.reward_outcome
        : typeof row.result_code === 'string'
          ? row.result_code
          : 'unavailable';
  const outcomeAliases: Record<string, ReferralProcessResult['outcome']> = {
    rewards_granted_v2: 'both_rewarded',
    inviter_capped_v2: 'inviter_capped',
    programme_disabled_v2: 'program_disabled',
    program_disabled_v2: 'program_disabled',
    pending_activation_v2: 'pending_activation',
    referral_accepted_v2: 'both_rewarded',
    referral_code_mismatch: 'staged_code_mismatch',
    referral_cancelled: 'cancelled',
    already_claimed: 'already_accepted',
    invalid_referral_code: 'invalid_code',
  };
  const rawOutcome = rawOutcomeValue.toLowerCase();
  const allowedOutcomes = new Set<ReferralProcessResult['outcome']>([
    'pending_activation',
    'both_rewarded',
    'inviter_capped',
    'program_disabled',
    'already_accepted',
    'activation_required',
    'invalid_code',
    'self_referral',
    'account_not_eligible',
    'referral_already_accepted',
    'staged_code_mismatch',
    'cancelled',
  ]);
  const outcome =
    outcomeAliases[rawOutcome] ??
    (allowedOutcomes.has(rawOutcome as ReferralProcessResult['outcome'])
      ? (rawOutcome as ReferralProcessResult['outcome'])
      : row.already_claimed === true
        ? 'already_accepted'
        : 'unavailable');

  return {
    accepted,
    outcome,
    referralCode: parseReferralCode(
      row.authoritative_referral_code ?? row.referral_code
    ),
    status: parseReferralStatus(row.authoritative_status ?? row.status),
    inviterRewardAmount: pickAmount(
      row,
      'inviter_reward_amount',
      'inviterRewardAmount'
    ),
    referredRewardAmount: pickAmount(
      row,
      'referred_reward_amount',
      'referredRewardAmount'
    ),
  };
};

const isTerminalReferralOutcome = (
  outcome: ReferralProcessResult['outcome']
): boolean =>
  outcome !== 'activation_required' &&
  outcome !== 'pending_activation' &&
  outcome !== 'unavailable';

const rpc = async (
  functionName: string,
  args?: Record<string, unknown>
): Promise<{ data: unknown; error: unknown }> =>
  (
    supabase.rpc as unknown as (
      name: string,
      parameters?: Record<string, unknown>
    ) => Promise<{ data: unknown; error: unknown }>
  ).call(supabase, functionName, args);

type ReferralOperation =
  | 'fetch'
  | 'generate'
  | 'process'
  | 'cancel'
  | 'programme'
  | 'stats';

type ReferralRequestScope = {
  accountId: string;
  operation: ReferralOperation;
  operationEpoch: number;
  stateEpoch: number;
};

const referralOperationEpochs: Record<ReferralOperation, number> = {
  fetch: 0,
  generate: 0,
  process: 0,
  cancel: 0,
  programme: 0,
  stats: 0,
};

let referralStateEpoch = 0;

const invalidateReferralState = () => {
  referralStateEpoch += 1;
};

const invalidatePendingReferralOperations = () => {
  referralOperationEpochs.process += 1;
  referralOperationEpochs.cancel += 1;
};

const activeUserId = async (): Promise<string | null> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // The session scopes only local state. PostgreSQL still authorises every
  // referral read and mutation from the request JWT.
  return error ? null : (session?.user.id ?? null);
};

const captureReferralRequestScope = async (
  operation: ReferralOperation,
  expectedUserId?: string
): Promise<ReferralRequestScope | null> => {
  const stateEpoch = referralStateEpoch;
  const accountId = await activeUserId();

  if (
    stateEpoch !== referralStateEpoch ||
    !accountId ||
    (expectedUserId !== undefined && accountId !== expectedUserId)
  ) {
    return null;
  }

  const operationEpoch = ++referralOperationEpochs[operation];
  return {
    accountId,
    operation,
    operationEpoch,
    stateEpoch,
  };
};

const isReferralRequestScopeCurrent = async (
  scope: ReferralRequestScope
): Promise<boolean> => {
  if (
    scope.stateEpoch !== referralStateEpoch ||
    scope.operationEpoch !== referralOperationEpochs[scope.operation]
  ) {
    return false;
  }

  const accountId = await activeUserId();
  return (
    scope.stateEpoch === referralStateEpoch &&
    scope.operationEpoch === referralOperationEpochs[scope.operation] &&
    accountId === scope.accountId
  );
};

const accountChangedError = () =>
  new Error('The signed-in account changed. Try this referral again.');

const migrateReferralPersistedState = (
  persistedState: unknown
): Partial<ReferralState> => {
  if (!isRecord(persistedState)) return { pendingReferral: null };

  const rawPending = persistedState.pendingReferral;
  if (!isRecord(rawPending)) {
    return { ...persistedState, pendingReferral: null };
  }

  const referralCode = parseReferralCode(rawPending.referralCode);
  if (!referralCode) {
    return { ...persistedState, pendingReferral: null };
  }

  const timestamp = Number(rawPending.timestamp);
  return {
    ...persistedState,
    pendingReferral: {
      referralCode,
      timestamp: Number.isFinite(timestamp) && timestamp >= 0 ? timestamp : 0,
      ownerUserId:
        typeof rawPending.ownerUserId === 'string' &&
        rawPending.ownerUserId.length > 0
          ? rawPending.ownerUserId
          : null,
    },
  };
};

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      userReferrals: [],
      pendingReferral: null,
      lastProcessResult: null,
      isLoading: false,
      error: null,

      fetchUserReferrals: async (userId: string) => {
        const requestScope = await captureReferralRequestScope('fetch', userId);
        if (!requestScope) return;

        set({ isLoading: true, error: null });

        try {
          const { data, error } = await rpc('list_my_referrals_v2', {
            p_limit: 100,
          });
          if (error) throw error;

          if (!(await isReferralRequestScopeCurrent(requestScope))) return;

          const referrals: UserReferral[] = Array.isArray(data)
            ? data.flatMap(value => {
                if (!isRecord(value) || typeof value.referral_id !== 'string') {
                  return [];
                }
                const status = value.status;
                if (
                  status !== 'pending' &&
                  status !== 'completed' &&
                  status !== 'cancelled'
                ) {
                  return [];
                }
                const isCancelled = status === 'cancelled';
                return [
                  {
                    id: value.referral_id,
                    status,
                    rewardGranted:
                      !isCancelled && value.reward_granted === true,
                    rewardOutcome:
                      !isCancelled && typeof value.reward_outcome === 'string'
                        ? value.reward_outcome
                        : null,
                    inviterRewardAmount: isCancelled
                      ? 0
                      : asCount(value.inviter_reward_amount),
                    createdAt:
                      typeof value.created_at === 'string'
                        ? value.created_at
                        : '',
                    completedAt:
                      typeof value.completed_at === 'string'
                        ? value.completed_at
                        : null,
                  },
                ];
              })
            : [];

          set({ userReferrals: referrals, isLoading: false });
        } catch (error: unknown) {
          if (!(await isReferralRequestScopeCurrent(requestScope))) return;
          set({
            error:
              error instanceof Error
                ? error.message
                : translate('en-NZ', 'sourceGate.referral.statusUnavailable'),
            isLoading: false,
          });
        }
      },

      generateReferralLink: async (userId: string) => {
        const requestScope = await captureReferralRequestScope(
          'generate',
          userId
        );
        if (!requestScope) throw accountChangedError();

        const { data, error } = await rpc('get_or_create_my_referral_code');
        if (error) throw error;

        if (!(await isReferralRequestScopeCurrent(requestScope))) {
          throw accountChangedError();
        }

        const row = firstRow(data);
        if (!row || typeof row.referral_code !== 'string') {
          throw new Error('Menta could not confirm an invite code.');
        }

        return buildReferralShareUrl(row.referral_code);
      },

      setPendingReferral: (
        referralCode: string,
        ownerUserId: string | null = null
      ) => {
        const normalized = normalizeInviteCode(referralCode);
        if (!isValidReferralCode(normalized)) {
          throw new Error('Referral code is invalid.');
        }

        invalidatePendingReferralOperations();
        set({
          pendingReferral: {
            referralCode: normalized,
            timestamp: Date.now(),
            ownerUserId,
          },
          lastProcessResult: null,
          error: null,
        });
      },

      clearPendingReferral: (expectedUserId, expectedReferralCode) => {
        const { pendingReferral } = get();
        if (!pendingReferral) return true;

        if (
          expectedReferralCode !== undefined &&
          pendingReferral.referralCode !==
            normalizeInviteCode(expectedReferralCode)
        ) {
          return false;
        }

        const canClear = pendingReferral.ownerUserId
          ? pendingReferral.ownerUserId === expectedUserId
          : expectedUserId === undefined || expectedUserId.length > 0;
        if (!canClear) return false;

        invalidatePendingReferralOperations();
        set({ pendingReferral: null });
        return true;
      },

      cancelPendingReferral: async expectedUserId => {
        const requestScope = await captureReferralRequestScope(
          'cancel',
          expectedUserId
        );
        if (!requestScope) throw accountChangedError();

        const pendingOwner = get().pendingReferral?.ownerUserId ?? null;
        if (pendingOwner && pendingOwner !== requestScope.accountId) {
          throw accountChangedError();
        }

        // The current SQL RPC is account-bound but does not accept an expected
        // code. Its one-row-per-referred-account constraint makes a retry target
        // stable. If restaging is ever allowed, the RPC must add an expected
        // code before the client can clear a replay receipt safely.
        const { data, error } = await rpc('cancel_pending_referral_v2');
        if (error) throw error;

        if (!(await isReferralRequestScopeCurrent(requestScope))) {
          throw accountChangedError();
        }

        const row = firstRow(data);
        const cancelled = row?.cancelled === true;
        const replayed =
          row?.outcome === 'no_pending_referral' ||
          row?.outcome === 'already_cancelled';
        if (!cancelled && !replayed) {
          throw new Error('This referral can no longer be skipped.');
        }

        invalidatePendingReferralOperations();
        set({
          pendingReferral: null,
          lastProcessResult: null,
          error: null,
        });
        return true;
      },

      processReferral: async (newUserId: string) => {
        let { pendingReferral } = get();
        if (!pendingReferral) {
          const emptyScope = await captureReferralRequestScope(
            'process',
            newUserId
          );
          if (!emptyScope) return false;

          set({
            lastProcessResult: {
              accepted: false,
              outcome: 'none',
              referralCode: null,
              status: null,
              inviterRewardAmount: 0,
              referredRewardAmount: 0,
            },
          });
          return false;
        }

        if (
          pendingReferral.ownerUserId &&
          pendingReferral.ownerUserId !== newUserId
        ) {
          return false;
        }

        // An anonymous invite can cross the sign-in boundary once. Claim it
        // only after the active Supabase session matches the expected user.
        if (pendingReferral.ownerUserId === null) {
          const claimScope = await captureReferralRequestScope(
            'process',
            newUserId
          );
          if (!claimScope) return false;

          const currentPending = get().pendingReferral;
          if (
            !currentPending ||
            currentPending.ownerUserId !== null ||
            currentPending.referralCode !== pendingReferral.referralCode ||
            currentPending.timestamp !== pendingReferral.timestamp
          ) {
            return false;
          }

          invalidatePendingReferralOperations();
          pendingReferral = {
            ...currentPending,
            ownerUserId: newUserId,
          };
          set({ pendingReferral });
        }

        const requestScope = await captureReferralRequestScope(
          'process',
          newUserId
        );
        if (!requestScope) return false;

        pendingReferral = get().pendingReferral;
        if (!pendingReferral || pendingReferral.ownerUserId !== newUserId) {
          return false;
        }

        try {
          const { data, error } = await rpc('accept_referral_v2', {
            p_referral_code: pendingReferral.referralCode,
          });
          if (error) throw error;

          if (!(await isReferralRequestScopeCurrent(requestScope))) {
            return false;
          }

          let result = parseProcessResult(data);
          if (!result) throw new Error('Referral receipt was not confirmed.');

          if (result.outcome === 'pending_activation') {
            if (result.status !== 'pending' || !result.referralCode) {
              throw new Error('Referral receipt was not confirmed.');
            }

            if (result.referralCode !== pendingReferral.referralCode) {
              result = {
                ...result,
                accepted: false,
                outcome: 'staged_code_mismatch',
              };
            }
          }

          if (result.status === 'pending' && result.referralCode) {
            set({
              pendingReferral: {
                referralCode: result.referralCode,
                timestamp: pendingReferral.timestamp,
                ownerUserId: newUserId,
              },
              lastProcessResult: result,
              error: null,
            });
          } else if (
            result.accepted ||
            isTerminalReferralOutcome(result.outcome)
          ) {
            invalidatePendingReferralOperations();
            set({
              pendingReferral: null,
              lastProcessResult: result,
              error: null,
            });
          } else {
            set({ lastProcessResult: result, error: null });
          }
          return result.accepted;
        } catch (error: unknown) {
          if (!(await isReferralRequestScopeCurrent(requestScope))) {
            return false;
          }

          set({
            error:
              error instanceof Error
                ? error.message
                : translate('en-NZ', 'sourceGate.referral.receiptUnavailable'),
            lastProcessResult: {
              accepted: false,
              outcome: 'unavailable',
              referralCode: null,
              status: null,
              inviterRewardAmount: 0,
              referredRewardAmount: 0,
            },
          });
          // Keep the code so a transport or server failure can be retried after
          // the activation receipt is available.
          return false;
        }
      },

      shareReferralLink: async (userId: string, username?: string) => {
        const referralLink = await get().generateReferralLink(userId);
        const shareTitle = `Join ${username ? `${username} on ` : ''}Menta`;
        const shareMessage = `Join me on Menta. Create your first promise to complete the referral.\n\n${referralLink}`;

        await Share.share({
          message: shareMessage,
          title: shareTitle,
          url: referralLink,
        });
      },

      getReferralProgramStatus: async () => {
        const requestScope = await captureReferralRequestScope('programme');
        if (!requestScope) throw accountChangedError();

        const { data, error } = await rpc('get_my_referral_program_v2');
        if (error) throw error;
        if (!(await isReferralRequestScopeCurrent(requestScope))) {
          throw accountChangedError();
        }

        const row = firstRow(data);
        const inviterCapResetsAt = parseIsoTimestamp(
          row?.inviter_cap_resets_at
        );
        if (
          !row ||
          typeof row.programme_enabled !== 'boolean' ||
          !inviterCapResetsAt
        ) {
          throw new Error('Referral reward status is unavailable.');
        }

        return {
          programmeEnabled: row.programme_enabled,
          rewardAmount: asCount(row.reward_amount),
          inviterAnnualCap: asCount(row.inviter_annual_cap),
          inviterRewardsThisYear: asCount(row.inviter_rewards_this_year),
          inviterCapResetsAt,
        };
      },

      getReferralStats: async (userId: string) => {
        const requestScope = await captureReferralRequestScope('stats', userId);
        if (!requestScope) {
          return {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            totalRewardsEarned: 0,
          };
        }

        try {
          const { data, error } = await rpc('get_my_referral_stats');
          if (error) throw error;
          if (!(await isReferralRequestScopeCurrent(requestScope))) {
            return {
              totalReferrals: 0,
              completedReferrals: 0,
              pendingReferrals: 0,
              totalRewardsEarned: 0,
            };
          }

          const row = firstRow(data);
          return {
            totalReferrals: asCount(row?.total_referrals),
            completedReferrals: asCount(row?.completed_referrals),
            pendingReferrals: asCount(row?.pending_referrals),
            totalRewardsEarned: asCount(row?.rewards_granted),
          };
        } catch {
          return {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            totalRewardsEarned: 0,
          };
        }
      },

      clearState: expectedUserId => {
        invalidateReferralState();
        const { pendingReferral } = get();
        const shouldClearPending = pendingReferral
          ? expectedUserId === undefined
            ? pendingReferral.ownerUserId === null
            : pendingReferral.ownerUserId === expectedUserId
          : false;
        set({
          userReferrals: [],
          pendingReferral: shouldClearPending ? null : pendingReferral,
          lastProcessResult: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'referral-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ pendingReferral: state.pendingReferral }),
      version: 1,
      migrate: migrateReferralPersistedState,
    }
  )
);
