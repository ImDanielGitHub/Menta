import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { translate } from '@/lib/localization';
import type { Database } from '@/lib/database.types';
import { logError } from '@/lib/sentry';
import { notificationService } from '@/lib/services/notification-service';
import { shareText, type ShareTextResult } from '@/lib/qr-utils';
import {
  buildInviteShareMessage,
  buildInviteShareUrl,
} from '@/lib/invite-links';
import { callEdgeFunction } from '@/lib/edge-function-helper';
import { withTimeout } from '@/utils/api/index';
import type { ProofMediaType } from '@/lib/proof-types';
import {
  submitChallengeProof,
  type SubmitProofResult,
} from '@/lib/services/proof-submission-service';
import {
  parseReviewDecision,
  ReviewDecisionError,
  type ReviewDecisionReceipt,
} from '@/lib/review-decision';
import {
  decodePromiseCreationReceipt,
  type PromiseCreationReceipt,
} from '@/lib/commitments/promise-creation-receipt';
import {
  decodeCreatePromiseQuote,
  type CreatePromiseQuote,
} from '@/lib/economy/create-promise-quote';
import { createClientEventId } from '@/lib/client-event-id';
import { encodePromiseScheduleBoundary } from '@/lib/time/promise-schedule';
import {
  confirmedPromiseMutation,
  failedPromiseMutation,
  readReceiptBoundPromiseMutationStatus,
  submitReceiptBoundPromiseMutation,
  unknownPromiseMutation,
  type PromiseMutationResult,
  type PromiseMutationTranslator,
} from '@/lib/promises/mutation-result';

type ChallengeRow = Database['public']['Tables']['challenges']['Row'];
type ChallengeParticipantRow =
  Database['public']['Tables']['challenge_participants']['Row'];
type ChallengeSubmissionRow =
  Database['public']['Tables']['challenge_submissions']['Row'];

type Relation<T> = T | T[] | null | undefined;

type ChallengeParticipantQueryRow = ChallengeParticipantRow & {
  used_extensions?: number | null;
  challenges?: Relation<ChallengeRow>;
};

type TeamChallengeQueryRow = {
  challenge_id: string;
  challenges?: Relation<ChallengeRow>;
};

type ReviewProfileRow = {
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type ReviewChallengeRow = {
  title?: string | null;
  description?: string | null;
  verification_description?: string | null;
  category?: string | null;
  allow_self_review?: boolean | null;
};

type ReviewVerificationRow = ChallengeSubmissionRow & {
  profiles?: Relation<ReviewProfileRow>;
  challenges?: Relation<ReviewChallengeRow>;
};

type ErrorDetails = {
  message: string;
  code?: unknown;
  hint?: unknown;
  title?: unknown;
};

const challengeStoreDebugLog = (..._args: unknown[]): void => undefined;

const defaultTranslate: PromiseMutationTranslator = (key, values) =>
  translate('en-NZ', key, values);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asRows = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const firstRelation = <T>(value: Relation<T>): T | undefined =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

const getErrorDetails = (
  value: unknown,
  fallbackMessage = 'An unexpected error occurred'
): ErrorDetails => {
  const record = isRecord(value) ? value : null;
  const message =
    value instanceof Error
      ? value.message
      : typeof record?.message === 'string'
        ? record.message
        : fallbackMessage;

  return {
    message,
    code: record?.code,
    hint: record?.hint,
    title: record?.title,
  };
};

const collectIds = (rows: unknown[], key: string): string[] => {
  const ids = new Set<string>();

  rows.forEach(row => {
    if (!row || typeof row !== 'object') return;
    const value = (row as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) {
      ids.add(value);
    }
  });

  return Array.from(ids);
};

const resolveReviewableChallengeIds = async ({
  challengeId,
  currentUserId,
  groupId,
}: {
  challengeId?: string;
  currentUserId?: string;
  groupId?: string;
}): Promise<string[]> => {
  if (!currentUserId) {
    return [];
  }

  if (groupId) {
    let groupChallengeQuery = supabase
      .from('team_challenges')
      .select('challenge_id')
      .eq('group_id', groupId);

    if (challengeId) {
      groupChallengeQuery = groupChallengeQuery.eq('challenge_id', challengeId);
    }

    const { data: groupChallenges, error: groupChallengeError } =
      await groupChallengeQuery;

    if (groupChallengeError) {
      console.error(
        'Error fetching group-scoped review challenges:',
        groupChallengeError
      );
      throw groupChallengeError;
    }

    return collectIds(groupChallenges || [], 'challenge_id');
  }

  const scopedChallengeIds = new Set<string>();

  let participantQuery = supabase
    .from('challenge_participants')
    .select('challenge_id')
    .eq('user_id', currentUserId)
    .eq('status', 'active');

  if (challengeId) {
    participantQuery = participantQuery.eq('challenge_id', challengeId);
  }

  const { data: participantRows, error: participantError } =
    await participantQuery;

  if (participantError) {
    console.error(
      'Error fetching participant-scoped review challenges:',
      participantError
    );
    throw participantError;
  }

  collectIds(participantRows || [], 'challenge_id').forEach(id =>
    scopedChallengeIds.add(id)
  );

  const { data: memberships, error: membershipError } = await supabase
    .from('team_members')
    .select('group_id')
    .eq('user_id', currentUserId);

  if (membershipError) {
    console.error(
      'Error fetching group memberships for review scope:',
      membershipError
    );
    throw membershipError;
  }

  const groupIds = collectIds(memberships || [], 'group_id');

  if (groupIds.length > 0) {
    let teamChallengeQuery = supabase
      .from('team_challenges')
      .select('challenge_id')
      .in('group_id', groupIds);

    if (challengeId) {
      teamChallengeQuery = teamChallengeQuery.eq('challenge_id', challengeId);
    }

    const { data: teamChallenges, error: teamChallengeError } =
      await teamChallengeQuery;

    if (teamChallengeError) {
      console.error(
        'Error fetching team-scoped review challenges:',
        teamChallengeError
      );
      throw teamChallengeError;
    }
    collectIds(teamChallenges || [], 'challenge_id').forEach(id =>
      scopedChallengeIds.add(id)
    );
  }

  return Array.from(scopedChallengeIds);
};

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: number | null;
  createdAt: string | null;
  creatorId: string;
  verificationType: string;
  verificationFrequency: string;
  isPublic: boolean | null;
  groupId?: string;
  groupName?: string;

  // Enhanced fields
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  pointsValue?: number | null;
  verificationDescription?: string | null;
  submissionText?: string | null; // Default submission text prompt for participants
  allowExtensions?: boolean | null;
  maxExtensions?: number | null;
  deadlineType?: 'fixed' | 'flexible' | 'rolling' | null;
  status?: string | null;
  extensionCount?: number | null;
  allowSelfReview?: boolean | null; // Enable participants to review their own submissions (solo challenges)
  // Explicit submission expectations replacing vague difficulty labels
  expectations?: {
    requiredDailySubmissions: number;
    requiresPeerReview: boolean;
    reviewersRequired: number;
    dailyDeadlineHourUtc: number; // 0-23
    graceMinutes: number;
  } | null;
}

const mapChallengeRow = (row: ChallengeRow, groupId?: string): Challenge => {
  const expectations = isRecord(row.submission_expectations)
    ? row.submission_expectations
    : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'general',
    startDate: row.start_date,
    endDate: row.end_date,
    duration: row.duration || 30,
    createdAt: row.created_at,
    creatorId: row.creator_id,
    verificationType: row.verification_type,
    verificationFrequency: row.verification_frequency,
    verificationDescription: row.verification_description,
    submissionText: row.submission_text,
    isPublic: row.is_public,
    ...(groupId !== undefined ? { groupId } : {}),
    difficulty:
      (row.difficulty as 'easy' | 'medium' | 'hard' | null) || 'medium',
    pointsValue: row.points_value || 200,
    allowExtensions:
      row.allow_extensions !== undefined ? row.allow_extensions : true,
    maxExtensions: row.max_extensions || 2,
    deadlineType:
      (row.deadline_type as 'fixed' | 'flexible' | 'rolling' | null) || 'fixed',
    status: row.status || 'active',
    extensionCount: row.extension_count || 0,
    allowSelfReview: row.allow_self_review || false,
    expectations: expectations
      ? {
          requiredDailySubmissions: Number(
            expectations.required_daily_submissions ?? 1
          ),
          requiresPeerReview: Boolean(
            expectations.requires_peer_review ?? !row.allow_self_review
          ),
          reviewersRequired: Number(
            expectations.reviewers_required ?? (row.allow_self_review ? 0 : 1)
          ),
          dailyDeadlineHourUtc: Number(
            expectations.daily_deadline_hour_utc ?? 23
          ),
          graceMinutes: Number(expectations.grace_minutes ?? 0),
        }
      : {
          requiredDailySubmissions: 1,
          requiresPeerReview: !row.allow_self_review,
          reviewersRequired: row.allow_self_review ? 0 : 1,
          dailyDeadlineHourUtc: 23,
          graceMinutes: 0,
        },
  };
};

export interface UserChallenge {
  userId: string;
  challengeId: string;
  currentStreak: number;
  lastCheckIn?: string;
  joinedAt: string;
  status?: 'active' | 'completed' | 'failed';
  usedExtensions?: number; // Number of streak freezes auto-consumed (lives used)
}

export interface ChallengeCreationResult {
  challenge: Challenge;
  receipt: PromiseCreationReceipt | null;
}

export type PaidChallengeInput = Omit<Challenge, 'id' | 'createdAt'> & {
  cost: number;
};

type ChallengeOperationScope = {
  accountId: string;
  epoch: number;
};

let challengeOperationEpoch = 0;

const getActiveChallengeAccountId = async (): Promise<string | null> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  return error ? null : (session?.user.id ?? null);
};

const captureChallengeOperationScope = async (
  expectedAccountId?: string
): Promise<ChallengeOperationScope | null> => {
  const epoch = challengeOperationEpoch;
  const accountId = await getActiveChallengeAccountId();

  return epoch === challengeOperationEpoch &&
    accountId &&
    (expectedAccountId === undefined || accountId === expectedAccountId)
    ? { accountId, epoch }
    : null;
};

const isChallengeOperationScopeCurrent = async (
  scope: ChallengeOperationScope
): Promise<boolean> => {
  if (scope.epoch !== challengeOperationEpoch) return false;

  const accountId = await getActiveChallengeAccountId();
  return (
    scope.epoch === challengeOperationEpoch && accountId === scope.accountId
  );
};

class ChallengeAccountChangedError extends Error {
  constructor() {
    super(
      'Your account changed before Menta could confirm the promise. Reopen the promise flow to recover it.'
    );
    this.name = 'ChallengeAccountChangedError';
  }
}

const createPaidChallengeRpcArgs = (challenge: PaidChallengeInput) => ({
  p_title: challenge.title,
  p_description: challenge.description || null,
  p_category: challenge.category || null,
  p_duration: challenge.duration,
  p_start_date: encodePromiseScheduleBoundary(challenge.startDate, 'start'),
  p_end_date: encodePromiseScheduleBoundary(challenge.endDate, 'end'),
  p_is_public: challenge.isPublic,
  p_difficulty: challenge.difficulty || 'medium',
  p_points: challenge.pointsValue || 200,
  p_verification_type: challenge.verificationType,
  p_verification_frequency: challenge.verificationFrequency,
  p_verification_description: challenge.verificationDescription || null,
  p_submission_text: challenge.submissionText || null,
  p_allow_extensions: challenge.allowExtensions ?? true,
  p_max_extensions: challenge.maxExtensions ?? 2,
  p_deadline_type: challenge.deadlineType || 'fixed',
  p_allow_self_review: challenge.allowSelfReview ?? false,
  p_group_id: challenge.groupId || null,
  p_cost: challenge.cost,
});

const buildCreatedChallenge = ({
  challengeId,
  challenge,
  row,
}: {
  challengeId: string;
  challenge: PaidChallengeInput;
  row: ChallengeRow | null;
}): Challenge =>
  row
    ? {
        id: row.id,
        title: row.title,
        description: row.description || '',
        category: row.category || 'general',
        startDate: row.start_date,
        endDate: row.end_date,
        duration: row.duration || challenge.duration,
        createdAt: row.created_at,
        creatorId: row.creator_id,
        verificationType: row.verification_type,
        verificationFrequency: row.verification_frequency,
        isPublic: row.is_public,
        groupId: challenge.groupId,
        difficulty: (row.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        pointsValue: row.points_value || 200,
        verificationDescription: row.verification_description,
        submissionText: row.submission_text,
        allowExtensions: row.allow_extensions ?? true,
        maxExtensions: row.max_extensions ?? 2,
        deadlineType:
          (row.deadline_type as 'fixed' | 'flexible' | 'rolling') || 'fixed',
        status: row.status || 'active',
        extensionCount: row.extension_count || 0,
        allowSelfReview: row.allow_self_review || false,
      }
    : {
        id: challengeId,
        title: challenge.title,
        description: challenge.description || '',
        category: challenge.category || 'general',
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        duration: challenge.duration,
        createdAt: new Date().toISOString(),
        creatorId: challenge.creatorId,
        verificationType: challenge.verificationType,
        verificationFrequency: challenge.verificationFrequency,
        isPublic: !!challenge.isPublic,
        groupId: challenge.groupId,
        difficulty: challenge.difficulty || 'medium',
        pointsValue: challenge.pointsValue || 200,
        verificationDescription: challenge.verificationDescription || null,
        submissionText: challenge.submissionText || null,
        allowExtensions: challenge.allowExtensions ?? true,
        maxExtensions: challenge.maxExtensions ?? 2,
        deadlineType: challenge.deadlineType || 'fixed',
        status: 'active',
        extensionCount: 0,
        allowSelfReview: challenge.allowSelfReview ?? false,
      };

const assertChallengeOperationScopeCurrent = async (
  scope: ChallengeOperationScope
): Promise<void> => {
  if (!(await isChallengeOperationScopeCurrent(scope))) {
    throw new ChallengeAccountChangedError();
  }
};

const createPaidChallengeOnServer = async ({
  challenge,
  operationScope,
  rpcName,
  requireFirstPromiseReceipt,
}: {
  challenge: PaidChallengeInput;
  operationScope: ChallengeOperationScope;
  rpcName: 'create_accountability_challenge' | 'ensure_first_promise_v1';
  requireFirstPromiseReceipt: boolean;
}): Promise<ChallengeCreationResult> => {
  await assertChallengeOperationScopeCurrent(operationScope);

  const { data, error } = await withTimeout(
    Promise.resolve(
      supabase.rpc(rpcName, createPaidChallengeRpcArgs(challenge))
    ) as Promise<{ data: unknown; error: unknown }>,
    15000,
    rpcName
  );

  await assertChallengeOperationScopeCurrent(operationScope);

  if (error) {
    const rpcError = error as {
      message?: string;
      code?: string;
      hint?: string;
    };
    const enriched = new Error(
      rpcError.message || 'Challenge creation failed'
    ) as Error & { code?: string; hint?: string };
    enriched.code = rpcError.code;
    enriched.hint = rpcError.hint;
    throw enriched;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Menta returned an invalid promise receipt');
  }

  const response = data as Record<string, unknown>;
  if (response.success !== true || typeof response.challenge_id !== 'string') {
    throw new Error(
      typeof response.error === 'string'
        ? response.error
        : 'Failed to create challenge'
    );
  }

  const challengeId = response.challenge_id;
  const receipt = decodePromiseCreationReceipt(response.receipt);

  if (
    requireFirstPromiseReceipt &&
    (!receipt?.isFirstPromise ||
      receipt.activation?.confirmed !== true ||
      receipt.activation.firstPromiseId !== challengeId)
  ) {
    throw new Error(
      'Menta did not return a complete first-promise activation receipt. Reopen onboarding to recover the promise before trying again.'
    );
  }

  const { data: row, error: fetchError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  await assertChallengeOperationScopeCurrent(operationScope);

  return {
    challenge: buildCreatedChallenge({
      challengeId,
      challenge,
      row: fetchError || !row ? null : row,
    }),
    receipt,
  };
};

interface ChallengeState {
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchChallenges: () => Promise<void>;
  fetchGroupChallenges: (groupId: string) => Promise<Challenge[]>;
  fetchUserChallenges: (userId: string) => Promise<void>;
  joinChallengeByInviteCode: (
    userId: string,
    code: string
  ) => Promise<
    | {
        id: string;
        title: string;
        description: string | null;
        name?: string;
        type?: string;
      }
    | undefined
  >;
  generateChallengeInviteCode: (
    challengeId: string
  ) => Promise<string | undefined>;
  getOrCreateChallengeInviteCode: (
    challengeId: string
  ) => Promise<string | undefined>;
  shareChallenge: (
    challengeId: string,
    challengeTitle: string
  ) => Promise<{
    code: string;
    shareUrl: string;
    shareResult: ShareTextResult;
  }>;
  leaveChallenge: (
    userId: string,
    challengeId: string,
    localise?: PromiseMutationTranslator
  ) => Promise<PromiseMutationResult>;
  deleteChallenge: (
    challengeId: string,
    clientEventId?: string,
    localise?: PromiseMutationTranslator
  ) => Promise<PromiseMutationResult>;
  reconcileDeleteChallenge: (
    challengeId: string,
    clientEventId: string,
    localise?: PromiseMutationTranslator
  ) => Promise<PromiseMutationResult>;
  getCreatePromiseQuote: (userId: string) => Promise<CreatePromiseQuote>;
  createChallengeWithPayment: (
    challenge: PaidChallengeInput
  ) => Promise<ChallengeCreationResult>;
  createFirstPromiseWithPayment: (
    challenge: PaidChallengeInput,
    expectedAccountId: string
  ) => Promise<ChallengeCreationResult>;
  submitProof: (
    userId: string,
    challengeId: string,
    mediaUrl: string,
    mediaType: ProofMediaType
  ) => Promise<SubmitProofResult>;
  hasSubmittedToday: (userId: string, challengeId: string) => Promise<boolean>;
  getTodaysSubmissionStatus: (
    userId: string,
    challengeId: string
  ) => Promise<'none' | 'pending' | 'approved' | 'rejected'>;
  getPendingVerifications: (
    challengeId?: string,
    currentUserId?: string
  ) => Promise<ReviewVerificationRow[]>;
  getVerificationsByStatus: (
    challengeId?: string,
    status?: 'pending' | 'approved' | 'rejected' | 'all',
    currentUserId?: string,
    groupId?: string
  ) => Promise<ReviewVerificationRow[]>;
  reviewVerification: (
    verificationId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string,
    reviewerId?: string
  ) => Promise<ReviewDecisionReceipt>;
  fetchGroupProgress: (groupId: string) => Promise<unknown>;
  clearPersistedState: () => Promise<void>;
  getChallengeCompletion: (
    userId: string,
    challengeId: string
  ) => Promise<unknown>;
  getServerTime: () => Promise<Date>;
  archiveCompletedChallenges: () => Promise<number>;
  getComprehensiveSubmissionStatus: (
    userId: string,
    challengeId: string
  ) => Promise<{
    hasSubmittedToday: boolean;
    submissionStatus: 'none' | 'pending' | 'approved' | 'rejected';
    completion: unknown;
    canSubmit: boolean;
    shouldShowPending: boolean;
    shouldShowApproved: boolean;
    shouldShowRejected: boolean;
  }>;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      challenges: [],
      userChallenges: [],
      isLoading: false,
      error: null,

      fetchChallenges: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('challenges')
            .select(
              `
              id, 
              title, 
              description, 
              category, 
              start_date, 
              end_date, 
              duration,
              creator_id, 
              created_at,
              verification_type,
              verification_frequency,
              verification_description,
              submission_text,
              is_public,
              difficulty,
              points_value,
              allow_extensions,
              max_extensions,
              deadline_type,
              status,
              extension_count,
              allow_self_review
              ,submission_expectations
            `
            )
            .eq('is_public', true) // Only fetch public challenges
            .order('created_at', { ascending: false });

          if (error) throw error;

          const challenges = asRows<ChallengeRow>(data).map(row =>
            mapChallengeRow(row)
          );

          set({ challenges, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Error fetching challenges:', error);
          throw error;
        }
      },

      fetchGroupChallenges: async (groupId: string) => {
        try {
          const { data, error } = await supabase
            .from('team_challenges')
            .select(
              `
              challenge_id,
              challenges!inner(
                id, 
                title, 
                description, 
                category, 
                start_date, 
                end_date, 
                duration,
                creator_id, 
                created_at,
                verification_type,
                verification_frequency,
                verification_description,
                submission_text,
                is_public,
                difficulty,
                points_value,
                allow_extensions,
                max_extensions,
                deadline_type,
                status,
                extension_count,
                allow_self_review
                ,submission_expectations
              )
            `
            )
            .eq('group_id', groupId)
            .order('created_at', {
              ascending: false,
              foreignTable: 'challenges',
            });

          if (error) throw error;

          const groupChallenges = asRows<TeamChallengeQueryRow>(data).flatMap(
            row => {
              const challenge = firstRelation(row.challenges);
              return challenge ? [mapChallengeRow(challenge, groupId)] : [];
            }
          );

          return groupChallenges;
        } catch (error) {
          console.error('Error fetching group challenges:', error);
          throw error;
        }
      },

      fetchUserChallenges: async userId => {
        const operationScope = await captureChallengeOperationScope(userId);
        if (!operationScope) return;

        set({ isLoading: true });
        try {
          // Get user challenges with enhanced challenge data for state sync
          const { data, error } = await supabase
            .from('challenge_participants')
            .select(
              `
              user_id,
              challenge_id, 
              current_streak, 
              last_check_in, 
              joined_at,
              status,
              used_extensions,
              challenges!inner (
                id,
                title,
                description,
                start_date,
                end_date,
                duration,
                completion_status,
                is_expired,
                status,
                verification_type,
                verification_frequency,
                difficulty,
                points_value
              )
            `
            )
            .eq('user_id', userId);

          if (error) throw error;

          if (!(await isChallengeOperationScopeCurrent(operationScope))) {
            return;
          }

          const userChallenges: UserChallenge[] =
            asRows<ChallengeParticipantQueryRow>(data).map(row => {
              const challenge = firstRelation(row.challenges);
              const now = new Date();
              let isExpired = false;

              // Check if challenge is expired based on end_date or calculated end date
              if (challenge?.end_date) {
                isExpired = new Date(challenge.end_date) < now;
              } else if (challenge?.start_date && challenge?.duration) {
                const startDate = new Date(challenge.start_date);
                const endDate = new Date(
                  startDate.getTime() + challenge.duration * 24 * 60 * 60 * 1000
                );
                isExpired = endDate < now;
              }

              // Expiry is projected for display here. Server maintenance owns
              // stored status; a list refresh must not write every expired row.

              return {
                userId: row.user_id,
                challengeId: row.challenge_id,
                currentStreak: row.current_streak ?? 0,
                lastCheckIn: row.last_check_in as string | undefined,
                joinedAt: row.joined_at as string,
                status: isExpired
                  ? 'failed'
                  : ((row.status || 'active') as UserChallenge['status']),
                usedExtensions: row.used_extensions ?? 0,
              };
            });

          if (await isChallengeOperationScopeCurrent(operationScope)) {
            set({ userChallenges, isLoading: false });
          }
        } catch (error) {
          if (await isChallengeOperationScopeCurrent(operationScope)) {
            set({ isLoading: false });
            console.error('Error fetching user challenges:', error);
            throw error;
          }
        }
      },

      joinChallengeByInviteCode: async (userId: string, code: string) => {
        set({ isLoading: true });
        try {
          const upperCode = code.trim().toUpperCase();
          const { data, error } = await supabase.functions.invoke(
            'consume-join-code',
            {
              body: {
                code: upperCode,
                type: 'challenge',
              },
            }
          );

          if (error) {
            throw error;
          }

          if (!data || data.success !== true) {
            const errorCode = data?.code || data?.error || 'JOIN_FAILED';

            if (errorCode === 'INVALID_CODE' || errorCode === 'EXPIRED_CODE') {
              throw new Error('Invalid or expired invite code');
            }

            if (errorCode === 'CHALLENGE_NOT_FOUND') {
              throw new Error('Challenge not found');
            }

            if (errorCode === 'SOLO_CHALLENGE') {
              throw new Error(
                'This is a solo challenge and cannot be joined by other members'
              );
            }

            if (errorCode === 'ALREADY_MEMBER') {
              throw new Error(
                'You are already participating in this challenge'
              );
            }

            if (errorCode === 'CHALLENGE_INACTIVE') {
              throw new Error('This challenge is no longer active');
            }

            throw new Error(
              'Failed to join challenge. Please contact the challenge creator.'
            );
          }

          const challenge = data.challenge as {
            id: string;
            title: string;
            description: string | null;
          } | null;

          if (!challenge?.id) {
            throw new Error('Challenge details were not returned');
          }

          // Add to local state
          const newUserChallenge: UserChallenge = {
            userId,
            challengeId: challenge.id,
            currentStreak: 0,
            joinedAt: new Date().toISOString(),
          };

          set(state => ({
            userChallenges: [...state.userChallenges, newUserChallenge],
            isLoading: false,
          }));

          // NEW: Set up submission reminders for the joined challenge
          try {
            await notificationService.setupChallengeReminders(
              userId,
              challenge.id,
              challenge.title
            );
          } catch (reminderError) {
            console.error(
              'Failed to set up challenge reminders:',
              reminderError
            );
            // Don't fail the join operation if reminder setup fails
          }

          return {
            id: challenge.id,
            name: challenge.title,
            title: challenge.title,
            description: challenge.description,
            type: 'challenge',
          };
        } catch (error) {
          set({ isLoading: false });
          console.error('Error joining challenge by invite code:', error);
          throw error;
        }
      },

      generateChallengeInviteCode: async (challengeId: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.functions.invoke(
            'generate-challenge-invite',
            {
              body: { challengeId },
            }
          );

          if (error) {
            throw new Error(error.message || 'Failed to generate invite code');
          }

          if (!data || data.success !== true || !data.code) {
            throw new Error('Failed to generate invite code');
          }

          set({ isLoading: false });
          return data.code as string;
        } catch (error) {
          set({ isLoading: false });
          console.error('Error generating challenge invite code:', error);
          throw error;
        }
      },

      getOrCreateChallengeInviteCode: async (challengeId: string) => {
        set({ isLoading: true });
        try {
          return await get().generateChallengeInviteCode(challengeId);
        } catch (error) {
          set({ isLoading: false });
          console.error('Error getting/creating challenge invite code:', error);
          throw error;
        }
      },

      shareChallenge: async (challengeId: string, challengeTitle: string) => {
        try {
          // Get or create invite code
          const code = await get().getOrCreateChallengeInviteCode(challengeId);
          if (!code) {
            throw new Error('Failed to generate invite code');
          }

          const shareUrl = buildInviteShareUrl('challenge', code);

          // Share the challenge
          const shareMessage = buildInviteShareMessage({
            kind: 'challenge',
            code,
            title: challengeTitle,
          });
          const shareResult = await shareText(
            shareMessage,
            `Join ${challengeTitle}`
          );

          return {
            code,
            shareUrl,
            shareResult,
          };
        } catch (error) {
          console.error('Error sharing challenge:', error);
          throw error;
        }
      },

      leaveChallenge: async (
        userId,
        challengeId,
        localise = defaultTranslate
      ) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.rpc(
            'leave_accountability_challenge_v1',
            { p_challenge_id: challengeId }
          );

          if (error) {
            return unknownPromiseMutation({
              operation: 'leave',
              challengeId,
              clientEventId: null,
              recovery: 'safe-retry',
              message: localise('todayProof.promise.leave_result_unknown'),
            });
          }

          const result =
            data && typeof data === 'object' && !Array.isArray(data)
              ? (data as Record<string, unknown>)
              : null;
          const receipt =
            result?.receipt &&
            typeof result.receipt === 'object' &&
            !Array.isArray(result.receipt)
              ? (result.receipt as Record<string, unknown>)
              : null;

          if (result?.success === false) {
            return failedPromiseMutation({
              operation: 'leave',
              challengeId,
              clientEventId: null,
              code:
                typeof result.code === 'string'
                  ? result.code
                  : 'LEAVE_REJECTED',
              message: localise('todayProof.promise.not_changed'),
            });
          }

          if (
            result?.success !== true ||
            result.operation !== 'CHALLENGE_LEAVE' ||
            (result.code !== 'LEAVE_CONFIRMED' &&
              result.code !== 'ALREADY_LEFT') ||
            receipt?.challenge_id !== challengeId ||
            receipt.user_id !== userId
          ) {
            return unknownPromiseMutation({
              operation: 'leave',
              challengeId,
              clientEventId: null,
              recovery: 'safe-retry',
              code: 'RECEIPT_MISMATCH',
              message: localise('todayProof.promise.leave_receipt_mismatch'),
            });
          }

          // Update local state
          set(state => ({
            userChallenges: state.userChallenges.filter(
              uc => uc.userId !== userId || uc.challengeId !== challengeId
            ),
            isLoading: false,
          }));

          return confirmedPromiseMutation({
            operation: 'leave',
            challengeId,
            clientEventId: null,
            code: result.code,
            message:
              result.code === 'ALREADY_LEFT'
                ? localise('todayProof.promise.already_left')
                : localise('todayProof.promise.left_detail'),
            receiptId: `${challengeId}:${userId}:${String(receipt.left_at ?? result.code)}`,
            idempotent:
              result.code === 'ALREADY_LEFT' || receipt.idempotent === true,
          });
        } catch (error) {
          void error;
          return unknownPromiseMutation({
            operation: 'leave',
            challengeId,
            clientEventId: null,
            recovery: 'safe-retry',
            message: localise('todayProof.promise.leave_result_unknown'),
          });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteChallenge: async (
        challengeId: string,
        clientEventId: string = createClientEventId(),
        localise: PromiseMutationTranslator = defaultTranslate
      ) => {
        // Allow deletion even if not in local cache (e.g., deep link)
        const operationEpoch = challengeOperationEpoch;
        let operationScope: ChallengeOperationScope | null = null;
        set({ isLoading: true, error: null });

        try {
          const request = {
            operation: 'delete' as const,
            challengeId,
            clientEventId,
          };
          operationScope = await captureChallengeOperationScope();
          if (!operationScope) {
            return failedPromiseMutation({
              ...request,
              code: 'AUTH_REQUIRED',
              message: localise('domain.auth.authentication_required'),
            });
          }
          const v2Attempt = await submitReceiptBoundPromiseMutation(
            request,
            localise
          );
          await assertChallengeOperationScopeCurrent(operationScope);
          let mutationResult: PromiseMutationResult;

          if (v2Attempt.contract === 'available') {
            mutationResult = v2Attempt.result;
          } else {
            // Existing installations can precede the v2 database migration.
            // Fall back only after PostgREST explicitly says the new RPC does
            // not exist. A timeout or response loss must never trigger a
            // second deletion through the legacy Edge Function.
            const { data: sessionData, error: sessionError } =
              await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            await assertChallengeOperationScopeCurrent(operationScope);

            if (sessionError || !accessToken) {
              mutationResult = failedPromiseMutation({
                ...request,
                code: 'AUTH_REQUIRED',
                message: localise('domain.auth.authentication_required'),
              });
            } else {
              const { data, error } = await supabase.functions.invoke(
                'delete-challenge',
                {
                  body: { challengeId },
                  headers: { Authorization: `Bearer ${accessToken}` },
                }
              );

              if (error) {
                mutationResult = unknownPromiseMutation({
                  ...request,
                  message: localise('todayProof.promise.delete_result_unknown'),
                });
              } else {
                const result = isRecord(data) ? data : null;
                mutationResult =
                  result?.success === true
                    ? confirmedPromiseMutation({
                        operation: 'delete',
                        challengeId,
                        clientEventId: null,
                        code: 'LEGACY_DELETE_CONFIRMED',
                        message: localise('todayProof.promise.deleted'),
                        receiptId: `legacy-delete:${challengeId}`,
                      })
                    : failedPromiseMutation({
                        ...request,
                        code: 'DELETE_REJECTED',
                        message: localise('todayProof.promise.not_changed'),
                      });
              }
            }
          }

          await assertChallengeOperationScopeCurrent(operationScope);
          if (mutationResult.outcome === 'confirmed') {
            set(state => ({
              challenges: state.challenges.filter(
                challenge => challenge.id !== challengeId
              ),
              userChallenges: state.userChallenges.filter(
                uc => uc.challengeId !== challengeId
              ),
            }));
          }

          return mutationResult;
        } catch (error) {
          void error;
          return unknownPromiseMutation({
            operation: 'delete',
            challengeId,
            clientEventId,
            message: localise('todayProof.promise.delete_result_unknown'),
          });
        } finally {
          if (
            operationScope
              ? await isChallengeOperationScopeCurrent(operationScope)
              : operationEpoch === challengeOperationEpoch
          ) {
            set({ isLoading: false });
          }
        }
      },

      reconcileDeleteChallenge: async (
        challengeId,
        clientEventId,
        localise = defaultTranslate
      ) => {
        const operationEpoch = challengeOperationEpoch;
        let operationScope: ChallengeOperationScope | null = null;
        set({ isLoading: true });
        try {
          const request = {
            operation: 'delete' as const,
            challengeId,
            clientEventId,
          };
          operationScope = await captureChallengeOperationScope();
          if (!operationScope) {
            return unknownPromiseMutation({
              ...request,
              code: 'AUTH_REQUIRED',
              message: localise('domain.auth.authentication_required'),
            });
          }
          const attempt = await readReceiptBoundPromiseMutationStatus(
            request,
            localise
          );
          await assertChallengeOperationScopeCurrent(operationScope);
          const result =
            attempt.contract === 'available'
              ? attempt.result
              : unknownPromiseMutation({
                  ...request,
                  code: 'STATUS_CONTRACT_UNAVAILABLE',
                  message: localise(
                    'todayProof.promise.delete_check_unavailable'
                  ),
                });

          if (result.outcome === 'confirmed') {
            set(state => ({
              challenges: state.challenges.filter(
                challenge => challenge.id !== challengeId
              ),
              userChallenges: state.userChallenges.filter(
                participant => participant.challengeId !== challengeId
              ),
            }));
          }

          return result;
        } catch (error) {
          void error;
          return unknownPromiseMutation({
            operation: 'delete',
            challengeId,
            clientEventId,
            message: localise('todayProof.promise.delete_status_unavailable'),
          });
        } finally {
          if (
            operationScope
              ? await isChallengeOperationScopeCurrent(operationScope)
              : operationEpoch === challengeOperationEpoch
          ) {
            set({ isLoading: false });
          }
        }
      },

      getCreatePromiseQuote: async (userId: string) => {
        const operationScope = await captureChallengeOperationScope(userId);
        if (!operationScope) {
          throw new ChallengeAccountChangedError();
        }

        const { data, error } = await supabase.rpc('get_economy_contract_v1');
        await assertChallengeOperationScopeCurrent(operationScope);
        if (error) {
          throw error;
        }

        let quotaStatus: unknown = null;
        try {
          const quota = await supabase.rpc('quota_status');
          await assertChallengeOperationScopeCurrent(operationScope);
          if (!quota.error) {
            quotaStatus = quota.data;
          }
        } catch {
          quotaStatus = null;
        }

        const quote = decodeCreatePromiseQuote(data, quotaStatus);
        if (quote === null) {
          throw new Error('Menta could not confirm the current promise cost.');
        }
        return quote;
      },

      createChallengeWithPayment: async challengeDataWithCost => {
        const operationScope = await captureChallengeOperationScope(
          challengeDataWithCost.creatorId
        );
        if (!operationScope) {
          throw new ChallengeAccountChangedError();
        }

        set({ isLoading: true, error: null });
        try {
          const creationResult = await createPaidChallengeOnServer({
            challenge: challengeDataWithCost,
            operationScope,
            rpcName: 'create_accountability_challenge',
            requireFirstPromiseReceipt: false,
          });

          await assertChallengeOperationScopeCurrent(operationScope);

          const newUserChallenge: UserChallenge = {
            userId: challengeDataWithCost.creatorId,
            challengeId: creationResult.challenge.id,
            currentStreak: 0,
            joinedAt: new Date().toISOString(),
          };

          set(state => ({
            challenges: [...state.challenges, creationResult.challenge],
            userChallenges: [...state.userChallenges, newUserChallenge],
            isLoading: false,
          }));

          if (await isChallengeOperationScopeCurrent(operationScope)) {
            try {
              await notificationService.setupChallengeReminders(
                challengeDataWithCost.creatorId,
                creationResult.challenge.id,
                creationResult.challenge.title
              );
            } catch (reminderError) {
              console.error(
                'Failed to set up creator reminders:',
                reminderError
              );
            }
          }

          return creationResult;
        } catch (error: unknown) {
          if (error instanceof ChallengeAccountChangedError) {
            throw error;
          }

          if (!(await isChallengeOperationScopeCurrent(operationScope))) {
            throw new ChallengeAccountChangedError();
          }

          set({
            isLoading: false,
            error: translate('en-NZ', 'sourceGate.challenge.createFailed'),
          });
          console.error('Error in createChallengeWithPayment:', error);

          const creationError = getErrorDetails(error);

          try {
            logError(error, {
              component: 'ChallengeStore',
              action: 'createChallengeWithPayment',
              code: creationError.code,
              hint: creationError.hint,
              title: creationError.title,
            });
          } catch {}

          try {
            const message = String(creationError.message || '');
            const code = String(creationError.code || '');
            if (
              code === '23505' ||
              /duplicate key|conflict|409/i.test(message)
            ) {
              const { data: existing } = await supabase
                .from('challenges')
                .select('id, created_at')
                .eq('creator_id', challengeDataWithCost.creatorId)
                .eq('title', challengeDataWithCost.title)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              await assertChallengeOperationScopeCurrent(operationScope);

              if (existing?.id) {
                const { data: row } = await supabase
                  .from('challenges')
                  .select('*')
                  .eq('id', existing.id)
                  .single();

                await assertChallengeOperationScopeCurrent(operationScope);

                if (row) {
                  const recovered = buildCreatedChallenge({
                    challengeId: existing.id,
                    challenge: challengeDataWithCost,
                    row,
                  });
                  const recoveredUserChallenge: UserChallenge = {
                    userId: challengeDataWithCost.creatorId,
                    challengeId: recovered.id,
                    currentStreak: 0,
                    joinedAt: new Date().toISOString(),
                  };

                  set(state => ({
                    challenges: [...state.challenges, recovered],
                    userChallenges: [
                      ...state.userChallenges,
                      recoveredUserChallenge,
                    ],
                    isLoading: false,
                  }));

                  if (await isChallengeOperationScopeCurrent(operationScope)) {
                    try {
                      await notificationService.setupChallengeReminders(
                        challengeDataWithCost.creatorId,
                        recovered.id,
                        recovered.title
                      );
                    } catch (reminderError) {
                      console.error(
                        'Failed to set up recovered challenge reminders:',
                        reminderError
                      );
                    }
                  }

                  return { challenge: recovered, receipt: null };
                }
              }
            }
          } catch (recoveryError) {
            if (recoveryError instanceof ChallengeAccountChangedError) {
              throw recoveryError;
            }
          }
          throw error;
        }
      },

      createFirstPromiseWithPayment: async (
        challengeDataWithCost,
        expectedAccountId
      ) => {
        if (challengeDataWithCost.creatorId !== expectedAccountId) {
          throw new ChallengeAccountChangedError();
        }

        const operationScope =
          await captureChallengeOperationScope(expectedAccountId);
        if (!operationScope) {
          throw new ChallengeAccountChangedError();
        }

        set({ isLoading: true, error: null });
        try {
          const creationResult = await createPaidChallengeOnServer({
            challenge: challengeDataWithCost,
            operationScope,
            rpcName: 'ensure_first_promise_v1',
            requireFirstPromiseReceipt: true,
          });

          await assertChallengeOperationScopeCurrent(operationScope);

          const newUserChallenge: UserChallenge = {
            userId: expectedAccountId,
            challengeId: creationResult.challenge.id,
            currentStreak: 0,
            joinedAt: new Date().toISOString(),
          };

          set(state => ({
            challenges: [
              ...state.challenges.filter(
                challenge => challenge.id !== creationResult.challenge.id
              ),
              creationResult.challenge,
            ],
            userChallenges: [
              ...state.userChallenges.filter(
                challenge =>
                  challenge.userId !== expectedAccountId ||
                  challenge.challengeId !== creationResult.challenge.id
              ),
              newUserChallenge,
            ],
            isLoading: false,
          }));

          if (await isChallengeOperationScopeCurrent(operationScope)) {
            try {
              await notificationService.setupChallengeReminders(
                expectedAccountId,
                creationResult.challenge.id,
                creationResult.challenge.title
              );
            } catch (reminderError) {
              console.error(
                'Failed to set up first-promise reminders:',
                reminderError
              );
            }
          }

          return creationResult;
        } catch (error: unknown) {
          if (error instanceof ChallengeAccountChangedError) {
            throw error;
          }

          if (!(await isChallengeOperationScopeCurrent(operationScope))) {
            throw new ChallengeAccountChangedError();
          }

          set({
            isLoading: false,
            error: translate(
              'en-NZ',
              'sourceGate.challenge.firstPromiseUnconfirmed'
            ),
          });
          console.error('Error ensuring first promise:', error);
          throw error;
        }
      },
      submitProof: async (
        userId: string,
        challengeId: string,
        mediaUrl: string,
        mediaType: ProofMediaType
      ) => {
        set({ isLoading: true });
        try {
          // Find the user challenge to validate they're joined
          const userChallenge = get().userChallenges.find(
            uc => uc.userId === userId && uc.challengeId === challengeId
          );

          if (!userChallenge) {
            throw new Error(
              'User challenge not found. Please join the challenge first.'
            );
          }

          const data = await submitChallengeProof({
            userId,
            challengeId,
            proofValue: mediaUrl,
            proofType: mediaType,
          });

          // Update local state with new streak if provided
          const newStreak = data.newStreak;
          if (typeof newStreak === 'number') {
            set(state => ({
              userChallenges: state.userChallenges.map(uc =>
                uc.userId === userId && uc.challengeId === challengeId
                  ? {
                      ...uc,
                      currentStreak: newStreak,
                      lastCheckIn:
                        data.effectiveLocalDay ||
                        new Date().toISOString().split('T')[0],
                    }
                  : uc
              ),
              isLoading: false,
            }));
          } else {
            // Refresh user challenges to get updated streak data
            await get().fetchUserChallenges(userId);
            set({ isLoading: false });
          }

          challengeStoreDebugLog(
            'Challenge proof submitted successfully:',
            data
          );

          // Return data with milestone and freeze info
          return {
            ...data,
            freezeUsed: data.freezeUsed ?? false,
            freezesRemaining: data.freezesRemaining ?? 0,
          };
        } catch (error) {
          set({ isLoading: false });
          console.error('Error submitting proof:', error);
          throw error;
        }
      },

      // Check if user has submitted proof today for a specific challenge (SERVER-SIDE)
      hasSubmittedToday: async (
        userId: string,
        challengeId: string
      ): Promise<boolean> => {
        try {
          const { data, error } = await supabase.rpc('has_submitted_today', {
            p_challenge_id: challengeId,
            p_user_id: userId,
            p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          });

          if (error) {
            console.error('Error checking daily submission:', error);
            return false;
          }

          return data === true;
        } catch (error) {
          console.error('Error checking daily submission:', error);
          return false;
        }
      },

      // Get today's submission status for a specific challenge (SERVER-SIDE)
      getTodaysSubmissionStatus: async (
        userId: string,
        challengeId: string
      ): Promise<'none' | 'pending' | 'approved' | 'rejected'> => {
        try {
          const { data, error } = await supabase.rpc(
            'get_todays_submission_status',
            {
              p_challenge_id: challengeId,
              p_user_id: userId,
              p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            }
          );

          if (error) {
            console.error('Error checking daily submission status:', error);
            return 'none';
          }

          // The function returns a table with has_submitted, submission_status, submission_url
          if (data && data.length > 0) {
            const status = data[0].submission_status;
            // Map 'not_submitted' to 'none' for consistency
            if (status === 'not_submitted') {
              return 'none';
            }
            return status || 'none';
          }

          return 'none';
        } catch (error) {
          console.error('Error checking daily submission status:', error);
          return 'none';
        }
      },

      // Get challenge completion percentage and statistics (SERVER-SIDE)
      getChallengeCompletion: async (userId: string, challengeId: string) => {
        try {
          const { data, error } = await supabase.rpc(
            'get_challenge_completion_percentage',
            {
              challenge_id_param: challengeId,
              user_id_param: userId,
            }
          );

          if (error) {
            console.error('Error getting challenge completion:', error);
            return null;
          }

          return data;
        } catch (error) {
          console.error('Error getting challenge completion:', error);
          return null;
        }
      },

      // Get server time for synchronization
      getServerTime: async (): Promise<Date> => {
        try {
          const { data, error } = await supabase.rpc('get_server_time');

          if (error) {
            console.error('Error getting server time:', error);
            return new Date(); // Fallback to client time
          }

          return new Date(data);
        } catch (error) {
          console.error('Error getting server time:', error);
          return new Date(); // Fallback to client time
        }
      },

      // Archive completed challenges
      archiveCompletedChallenges: async () => {
        try {
          const { data, error } = await supabase.rpc(
            'archive_completed_challenges'
          );

          if (error) {
            console.error('Error archiving challenges:', error);
            throw error;
          }

          return data;
        } catch (error) {
          console.error('Error archiving challenges:', error);
          throw error;
        }
      },

      // Enhanced submission status checking with comprehensive validation
      getComprehensiveSubmissionStatus: async (
        userId: string,
        challengeId: string
      ) => {
        try {
          const [hasSubmitted, status, completion] = await Promise.all([
            get().hasSubmittedToday(userId, challengeId),
            get().getTodaysSubmissionStatus(userId, challengeId),
            get().getChallengeCompletion(userId, challengeId),
          ]);

          return {
            hasSubmittedToday: hasSubmitted,
            submissionStatus: status,
            completion: completion,
            canSubmit: !hasSubmitted || status === 'rejected',
            shouldShowPending: status === 'pending',
            shouldShowApproved: status === 'approved',
            shouldShowRejected: status === 'rejected',
          };
        } catch (error) {
          console.error(
            'Error getting comprehensive submission status:',
            error
          );
          return {
            hasSubmittedToday: false,
            submissionStatus: 'none' as const,
            completion: null,
            canSubmit: true,
            shouldShowPending: false,
            shouldShowApproved: false,
            shouldShowRejected: false,
          };
        }
      },

      // Get pending verifications that the signed-in reviewer can actually access.
      getPendingVerifications: async (
        challengeId?: string,
        currentUserId?: string
      ) => {
        try {
          const scopedChallengeIds = await resolveReviewableChallengeIds({
            challengeId,
            currentUserId,
          });

          if (scopedChallengeIds.length === 0) {
            return [];
          }

          let query = supabase
            .from('challenge_submissions')
            .select(
              `
              *,
              profiles!challenge_submissions_user_id_fkey (
                username,
                display_name,
                avatar_url
              ),
              challenges!challenge_submissions_challenge_id_fkey (
                title,
                description,
                verification_description,
                category,
                allow_self_review
              )
            `
            )
            .eq('status', 'pending')
            .in('challenge_id', scopedChallengeIds)
            .order('submission_date', { ascending: false });

          if (challengeId) {
            query = query.eq('challenge_id', challengeId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching pending verifications:', error);
            throw error;
          }

          // Filter out current user's own submissions unless challenge allows self-review
          const filteredData = asRows<ReviewVerificationRow>(data).filter(
            verification => {
              const challenge = firstRelation(verification.challenges);
              // If challenge allows self-review, include user's own submissions
              if (challenge?.allow_self_review) {
                return true;
              }
              // Otherwise, exclude user's own submissions (no self-review allowed)
              return verification.user_id !== currentUserId;
            }
          );

          return filteredData;
        } catch (error) {
          console.error('Error fetching pending verifications:', error);
          throw error;
        }
      },

      // Get verifications by status with reviewer scope and self-review gating.
      getVerificationsByStatus: async (
        challengeId?: string,
        status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
        currentUserId?: string,
        groupId?: string
      ) => {
        try {
          const scopedChallengeIds = await resolveReviewableChallengeIds({
            challengeId,
            currentUserId,
            groupId,
          });

          if (scopedChallengeIds.length === 0) {
            return [];
          }

          let query = supabase
            .from('challenge_submissions')
            .select(
              `
              *,
              profiles!challenge_submissions_user_id_fkey (
                username,
                display_name,
                avatar_url
              ),
              challenges!challenge_submissions_challenge_id_fkey (
                title,
                description,
                verification_description,
                category,
                allow_self_review
              )
            `
            )
            .order('submission_date', { ascending: false });

          if (challengeId) {
            query = query.eq('challenge_id', challengeId);
          }
          query = query.in('challenge_id', scopedChallengeIds);
          if (status !== 'all') {
            query = query.eq('status', status);
          }

          const { data, error } = await query;
          if (error) {
            console.error('Error fetching verifications by status:', error);
            throw error;
          }

          // Apply self-review gating for non-solo challenges
          const filteredData = asRows<ReviewVerificationRow>(data).filter(
            verification => {
              const challenge = firstRelation(verification.challenges);
              if (challenge?.allow_self_review) return true;
              return verification.user_id !== currentUserId;
            }
          );

          return filteredData;
        } catch (error) {
          console.error('Error fetching verifications by status:', error);
          throw error;
        }
      },

      // Approve or reject a verification (via secure RPC)
      reviewVerification: async (
        verificationId: string,
        status: 'approved' | 'rejected',
        reviewNotes?: string,
        _reviewerId?: string
      ) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.rpc(
            'review_challenge_verification',
            {
              p_verification_id: verificationId,
              p_status: status,
              p_review_notes: reviewNotes ?? null,
            }
          );

          if (error) {
            throw error;
          }

          const result = parseReviewDecision(data);
          if (!result.success) {
            throw new ReviewDecisionError(result.message, {
              code: result.code,
              currentStatus: result.currentStatus,
            });
          }

          set({ isLoading: false });
          return result.receipt;
        } catch (error) {
          const errorDetails = getErrorDetails(
            error,
            'Failed to review verification. Please try again.'
          );
          set({
            isLoading: false,
            error: errorDetails.message,
          });
          console.error('Verification review failed:', error);
          throw error;
        }
      },

      fetchGroupProgress: async (groupId: string) => {
        try {
          // Use centralized error handling
          const data = await callEdgeFunction<{ groupId: string }, unknown>(
            'group-progress',
            {
              groupId,
            }
          );

          return data;
        } catch (error) {
          console.error('Error fetching group progress:', error);
          // Error already handled by callEdgeFunction
          throw error;
        }
      },

      clearPersistedState: async () => {
        challengeOperationEpoch += 1;
        set({
          challenges: [],
          userChallenges: [],
          isLoading: false,
          error: null,
        });
        try {
          await AsyncStorage.removeItem('challenge-storage');
          challengeStoreDebugLog('Persisted challenge state cleared.');
        } catch (error) {
          console.error('Error clearing persisted challenge state:', error);
          // Decide if you want to throw the error or handle it silently
        }
      },
    }),
    {
      name: 'challenge-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Challenges and participation rows are server-owned and account-scoped.
      // Rehydrating them before the active Supabase session is confirmed can
      // expose a deleted account's promise to a newly created account on the
      // same device. Keep the middleware only so version 2 clears legacy
      // payloads; future writes deliberately contain no server rows.
      partialize: () => ({
        challenges: [],
        userChallenges: [],
        isLoading: false,
        error: null,
      }),
      version: 2,
      migrate: () => ({
        challenges: [],
        userChallenges: [],
        isLoading: false,
        error: null,
      }),
    }
  )
);
