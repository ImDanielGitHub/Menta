/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, prefer-const -- Legacy store decoders remain outside this server-authority patch. */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { translate } from '@/lib/localization';
// import type { Database } from '@/lib/database.types';
import { notificationService } from '@/lib/services/notification-service';
import { isOperationalFeatureEnabled } from '@/lib/operational-flags';
import { withAuth } from '@/lib/auth-helper';
import { logCreationError, logCreationSuccess } from '@/lib/error-monitoring';
import { withTimeout } from '@/utils/api/index';
import { buildInviteShareUrl } from '@/lib/invite-links';
import {
  decodeGuestGroupInvitePreviewResponse,
  decodeGroupInvitePreviewFailure,
  decodeGroupInvitePreviewResponse,
  decodeGroupInviteResponse,
  isGuestGroupInvitePreviewUnavailable,
  type GuestGroupInvitePreview,
  type GroupInvitePreview,
} from '@/lib/groups/group-invite-contract';
import {
  confirmedGroupGovernance,
  getOwnerLeaveOutcome,
  rejectedGroupGovernance,
  unknownGroupGovernance,
  type GroupGovernanceOutcome,
} from '@/lib/group-governance';
import { decodeGroupRiskSnapshot, type GroupRiskSnapshot } from '@/lib/loop';
import type { GroupImagePresetKey } from '@/lib/groups/group-image-presets';
import {
  decodeOnboardingGroupLinkReceipt,
  onboardingGroupLinkErrorMessage,
  type OnboardingGroupLinkReceipt,
} from '@/lib/groups/onboarding-group-contract';
import {
  clearSavedGroupCreationAttempt,
  loadSavedGroupCreationAttempt,
  normaliseSavedGroupCreationRequest,
  prepareSavedGroupCreationAttempt,
  readSavedGroupCreationStatus,
  submitSavedGroupCreation,
  type SavedGroupCreationAttempt,
  type SavedGroupCreationFailureCode,
  type SavedGroupCreationReceipt,
} from '@/lib/groups/saved-group-creation-contract';

// Normalize server status to store vocabulary
const normalizeStatus = (status: unknown): 'active' | 'failed' | 'expired' => {
  const s = String(status || '').toLowerCase();
  if (s === 'failed') return 'failed';
  if (s === 'completed' || s === 'archived' || s === 'expired')
    return 'expired';
  return 'active';
};

const GROUP_UNAVAILABLE_MESSAGE =
  'This group is unavailable or invite-only. Refresh groups or use an invite code.';
const groupStoreDebugLog = (..._args: unknown[]) => {};

type GroupOperationScope = {
  accountId: string;
  epoch: number;
};

let groupOperationEpoch = 0;

const getActiveGroupAccountId = async (): Promise<string | null> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  return error ? null : (session?.user.id ?? null);
};

const captureGroupOperationScope = async (
  expectedAccountId: string
): Promise<GroupOperationScope | null> => {
  const epoch = groupOperationEpoch;
  const accountId = await getActiveGroupAccountId();

  return epoch === groupOperationEpoch && accountId === expectedAccountId
    ? { accountId, epoch }
    : null;
};

const captureActiveGroupOperationScope =
  async (): Promise<GroupOperationScope | null> => {
    const epoch = groupOperationEpoch;
    const accountId = await getActiveGroupAccountId();

    return epoch === groupOperationEpoch && accountId
      ? { accountId, epoch }
      : null;
  };

const isGroupOperationScopeCurrent = async (
  scope: GroupOperationScope
): Promise<boolean> => {
  if (scope.epoch !== groupOperationEpoch) return false;

  const accountId = await getActiveGroupAccountId();
  return scope.epoch === groupOperationEpoch && accountId === scope.accountId;
};

class GroupAccountChangedError extends Error {
  constructor() {
    super(
      'Your account changed before Menta could confirm the group. Reopen groups and try again.'
    );
    this.name = 'GroupAccountChangedError';
  }
}

export class SavedGroupCreationUnknownError extends Error {
  readonly clientEventId: string;

  constructor(clientEventId: string, message: string) {
    super(message);
    this.name = 'SavedGroupCreationUnknownError';
    this.clientEventId = clientEventId;
  }
}

export const isSavedGroupCreationUnknownError = (
  error: unknown
): error is SavedGroupCreationUnknownError =>
  error instanceof SavedGroupCreationUnknownError;

export class SavedGroupCreationFailureError extends Error {
  readonly code: SavedGroupCreationFailureCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: SavedGroupCreationFailureCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'SavedGroupCreationFailureError';
    this.code = code;
    this.details = details;
  }
}

export type SavedGroupCreationRecovery =
  | { kind: 'none' }
  | {
      kind: 'confirmed';
      group: Group;
      receipt: SavedGroupCreationReceipt;
    }
  | { kind: 'pending'; message: string }
  | {
      kind: 'safe-to-retry';
      attempt: SavedGroupCreationAttempt;
      message: string;
    }
  | {
      kind: 'failed';
      code: SavedGroupCreationFailureCode;
      message: string;
    };

const assertGroupOperationScopeCurrent = async (
  scope: GroupOperationScope
): Promise<void> => {
  if (!(await isGroupOperationScopeCurrent(scope))) {
    throw new GroupAccountChangedError();
  }
};

const decodeViewerInteger = (
  viewer: Record<string, unknown>,
  key: string
): number | null => {
  const value = viewer[key];
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;
};

const decodeCreateGroupCost = (value: unknown): number | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const viewer = (value as Record<string, unknown>).viewer;
  if (!viewer || typeof viewer !== 'object' || Array.isArray(viewer)) {
    return null;
  }

  return decodeViewerInteger(
    viewer as Record<string, unknown>,
    'createGroupCost'
  );
};

const decodeJoinGroupQuote = (
  value: unknown
): { cost: number; activeGroups: number | null; isPro: boolean } | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const viewer = (value as Record<string, unknown>).viewer;
  if (!viewer || typeof viewer !== 'object' || Array.isArray(viewer)) {
    return null;
  }

  const record = viewer as Record<string, unknown>;
  const cost = decodeViewerInteger(record, 'joinGroupCost');
  if (cost === null) return null;

  return {
    cost,
    activeGroups: decodeViewerInteger(record, 'activeGroups'),
    isPro: record.isPro === true,
  };
};

const isPostgrestNoRowsError = (error: unknown): boolean => {
  const err = error as { code?: unknown; message?: unknown } | null;
  return (
    err?.code === 'PGRST116' ||
    String(err?.message || '')
      .toLowerCase()
      .includes('the result contains 0 rows')
  );
};

const isPermissionError = (error: unknown): boolean => {
  const err = error as {
    code?: unknown;
    status?: unknown;
    message?: unknown;
  } | null;
  const code = String(err?.code ?? err?.status ?? '').toUpperCase();
  const message = String(err?.message || '').toLowerCase();

  return (
    code === '42501' ||
    code === '401' ||
    code === '403' ||
    message.includes('permission denied') ||
    message.includes('forbidden') ||
    message.includes('unauthorized') ||
    message.includes('rls')
  );
};

// Map a raw DB row to the strongly-typed Group used in the store
const normalizeGroupRow = (row: any, memberCount?: number): Group => {
  const links = Array.isArray(row.team_challenges)
    ? row.team_challenges
    : row.team_challenges
      ? [row.team_challenges]
      : [];
  const sharedPromises = links.flatMap((link: any) => {
    const relation = Array.isArray(link?.challenges)
      ? link.challenges[0]
      : link?.challenges;
    if (!relation?.id || !relation?.title) return [];
    return [
      {
        id: String(relation.id),
        title: String(relation.title),
        status: String(
          relation.completion_status ?? relation.status ?? 'active'
        ),
        durationDays:
          typeof relation.duration === 'number' ? relation.duration : null,
        startDate: relation.start_date ?? null,
        endDate: relation.end_date ?? null,
      },
    ];
  });

  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: row.description ?? null,
    owner_id: String(row.owner_id || ''),
    status: normalizeStatus(row.status),
    kind: row.kind === 'promise' ? 'promise' : 'saved',
    shared_promises: sharedPromises,
    duration_days: Number(row.duration_days ?? 0),
    current_streak: Number(row.current_streak ?? 0),
    created_at: row.created_at ?? new Date().toISOString(),
    member_count:
      typeof memberCount === 'number'
        ? memberCount
        : typeof row.member_count === 'number'
          ? row.member_count
          : undefined,
    invite_code: row.invite_code ?? undefined,
    privacy: row.privacy ?? null,
    privacy_level: row.privacy_level ?? null,
    image_url: row.image_url ?? null,
    streak_goal: row.streak_goal ?? null,
    min_participation_rate: row.min_participation_rate ?? null,
    failure_threshold_days: row.failure_threshold_days ?? null,
    notify_on_member_miss: row.notify_on_member_miss ?? null,
    daily_summaries: row.daily_summaries ?? null,
    allow_recovery: row.allow_recovery ?? null,
    last_success_date: row.last_success_date ?? null,
    last_failure_date: row.last_failure_date ?? null,
    failure_reason: row.failure_reason ?? null,
    extension_count: row.extension_count ?? null,
    max_extensions: row.max_extensions ?? null,
    min_streak_requirement: row.min_streak_requirement ?? null,
    is_expired: row.is_expired ?? null,
    updated_at: row.updated_at ?? null,
    timezone: row.timezone ?? null,
    cooldown_until: row.cooldown_until ?? null,
    archived_at: row.archived_at ?? null,
    start_date: row.start_date ?? undefined,
    end_date: row.end_date ?? undefined,
  };
};

export interface SharedPromiseSummary {
  id: string;
  title: string;
  status: string;
  durationDays: number | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: 'active' | 'failed' | 'expired';
  duration_days: number;
  current_streak: number;
  created_at: string;
  kind?: 'saved' | 'promise';
  shared_promises?: SharedPromiseSummary[];
  member_count?: number;
  invite_code?: string;

  // Database schema fields
  privacy?: string | null;
  privacy_level?: string | null;
  image_url?: string | null;
  streak_goal?: number | null;
  min_participation_rate?: number | null;
  failure_threshold_days?: number | null;
  notify_on_member_miss?: boolean | null;
  daily_summaries?: boolean | null;
  allow_recovery?: boolean | null;
  last_success_date?: string | null;
  last_failure_date?: string | null;
  failure_reason?: string | null;
  extension_count?: number | null;
  max_extensions?: number | null;
  min_streak_requirement?: number | null;
  is_expired?: boolean | null;
  updated_at?: string | null;
  timezone?: string | null;
  cooldown_until?: string | null; // Timestamp when failed group cooldown expires
  archived_at?: string | null; // Timestamp when user archived this failed group

  // Schedule alignment fields
  start_date?: string;
  end_date?: string;
}

export interface ScheduleAlignmentInfo {
  group_id: string;
  group_name: string;
  group_start_date: string;
  group_end_date: string;
  challenge_id: string;
  challenge_title: string;
  challenge_start_date: string;
  challenge_end_date: string;
  alignment_status: 'aligned' | 'misaligned' | 'incomplete';
  warnings: string[];
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface TodaysSubmission {
  id: string;
  groupId?: string; // Optional for solo challenges
  challengeId: string;
  groupName?: string; // Optional for solo challenges
  challengeTitle: string;
  dayNumber: number;
  totalDays: number;
  memberCount: number;
  submissionType: 'photo' | 'text' | 'video';
  isUrgent: boolean;
  timeRemaining: string;
  hasSubmittedToday: boolean;
  submissionStatus?:
    | 'not_submitted'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'unknown';
  isSolo: boolean; // New field to indicate if this is a solo challenge
}

export interface PendingReview {
  id: string;
  challengeId: string;
  challengeTitle: string;
  groupId?: string;
  groupName?: string;
  submitterName: string;
  submitterAvatar?: string;
  submissionDate: string;
  mediaUrl?: string;
  isSolo: boolean;
  hoursAgo: number;
}

type PostgrestRelation<T> = T | T[] | null | undefined;

interface ReviewGroupChallengeRow {
  group_id: string;
  challenge_id: string;
  teams?: PostgrestRelation<{ name: string | null }>;
}

interface ReviewSubmissionRow {
  id: string;
  challenge_id: string;
  user_id: string;
  submission_date: string;
  media_url?: string | null;
  profiles?: PostgrestRelation<{
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }>;
  challenges?: PostgrestRelation<{
    title: string | null;
    allow_self_review: boolean | null;
  }>;
}

const firstRelation = <T>(value: PostgrestRelation<T>): T | undefined => {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
};

interface GroupState {
  groups: Group[];
  userGroups: string[];
  discoverGroups: Group[];
  groupMembers: Record<string, GroupMember[]>;
  isLoading: boolean;
  clearGroupData: () => Promise<void>;

  // Simplified Actions
  fetchGroups: () => Promise<void>;
  fetchUserGroups: (userId: string) => Promise<void>;
  fetchDiscoverGroups: (userId: string) => Promise<void>;
  getCreateGroupCost: (userId: string) => Promise<number>;
  getJoinGroupQuote: (userId: string) => Promise<{
    cost: number;
    activeGroups: number | null;
    isPro: boolean;
  }>;
  fetchGroupMembers: (groupId: string) => Promise<void>;
  joinGroup: (
    userId: string,
    groupId: string,
    expectedCost: number
  ) => Promise<void>;
  previewGuestGroupInvite: (code: string) => Promise<GuestGroupInvitePreview>;
  previewGroupInvite: (code: string) => Promise<GroupInvitePreview>;
  joinGroupByInviteCode: (userId: string, code: string) => Promise<Group>;
  createGroup: (groupData: {
    name: string;
    description?: string;
    owner_id: string;
    duration_days: number;
    privacy?: 'public' | 'private' | 'secret';
    notify_on_member_miss?: boolean;
  }) => Promise<Group>;
  createGroupWithPayment: (groupData: {
    name: string;
    description?: string;
    owner_id: string;
    duration_days: number;
    cost: number;
    privacy?: 'public' | 'private' | 'secret';
    notify_on_member_miss?: boolean;
    image_preset?: GroupImagePresetKey;
  }) => Promise<Group>;
  reconcilePendingGroupCreation: (
    userId: string
  ) => Promise<SavedGroupCreationRecovery>;
  resumePendingGroupCreation: (userId: string) => Promise<Group>;
  clearPendingGroupCreation: (userId: string) => Promise<void>;
  createOnboardingGroupWithFirstPromise: (groupData: {
    first_promise_id: string;
    name: string;
    description?: string;
    owner_id: string;
    privacy: 'public' | 'private';
    notify_on_member_miss: boolean;
    image_preset: GroupImagePresetKey;
  }) => Promise<{ group: Group; receipt: OnboardingGroupLinkReceipt }>;
  generateGroupInviteCode: (groupId: string) => Promise<string>;
  getOrCreateGroupInviteCode: (groupId: string) => Promise<string>;
  rotateGroupInviteCode: (
    groupId: string,
    previousCode?: string
  ) => Promise<{ code: string; previousCodeInvalidated: boolean }>;
  shareGroup: (
    groupId: string,
    groupName: string
  ) => Promise<{ code: string; shareUrl: string }>;
  leaveGroup: (
    userId: string,
    groupId: string
  ) => Promise<GroupGovernanceOutcome>;
  deleteGroup: (groupId: string) => Promise<GroupGovernanceOutcome>;
  fetchGroupDetails: (groupId: string) => Promise<Group>;
  getTodaysSubmissions: (userId: string) => Promise<TodaysSubmission[]>;
  getPendingReviewsForUser: (userId: string) => Promise<PendingReview[]>;

  // Group failure and accessibility functions
  checkGroupAccessibility: (groupId: string) => Promise<boolean>;
  getGroupRiskData: (groupId: string) => Promise<GroupRiskSnapshot | null>;
  useGroupFreeze: (
    groupId: string,
    challengeId: string,
    userId: string
  ) => Promise<{ success: boolean; error?: string; remaining?: number }>;
  checkUserCooldown: (userId: string) => Promise<{
    inCooldown: boolean;
    cooldownUntil?: string;
    groupName?: string;
  }>;
  archiveFailedGroup: (
    groupId: string,
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
  fetchArchivedGroups: (userId: string) => Promise<Group[]>;

  // Schedule alignment functions
  getScheduleAlignmentInfo: (
    groupId?: string
  ) => Promise<ScheduleAlignmentInfo[]>;
  fixScheduleAlignment: (
    groupId: string,
    fixStrategy?: 'shorten_challenge' | 'extend_group' | 'report_only'
  ) => Promise<any>;
  validateChallengeSchedule: (
    groupId: string,
    challengeId: string
  ) => Promise<boolean>;
  getGroupScheduleData: (groupId: string) => Promise<any>;
  updateGroupStatus: (
    groupId: string,
    status: 'active' | 'failed' | 'expired',
    failureReason?: string
  ) => Promise<boolean>;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      userGroups: [],
      discoverGroups: [],
      groupMembers: {},
      isLoading: false,

      clearGroupData: async () => {
        groupOperationEpoch += 1;
        set({
          groups: [],
          userGroups: [],
          discoverGroups: [],
          groupMembers: {},
          isLoading: false,
        });
        await AsyncStorage.removeItem('group-store');
      },

      fetchGroups: async () => {
        const operationScope = await captureActiveGroupOperationScope();
        if (!operationScope) return;

        set({ isLoading: true });
        try {
          const { data: groupsData, error } = await supabase.from('teams')
            .select(`
              *,
              group_streak_tracking (
                current_streak,
                longest_streak,
                total_successful_days
              )
            `);

          if (error) throw error;

          // Batch load member counts via group_stats view
          const ids = (groupsData || [])
            .map(g => (g as { id?: string | null }).id)
            .filter(
              (id): id is string => typeof id === 'string' && id.length > 0
            );
          const countsMap: Record<string, number> = {};
          if (ids.length > 0) {
            const { data: statsRows, error: statsErr } = await supabase
              .from('group_stats')
              .select('group_id,total_members')
              .in('group_id', ids);
            if (!statsErr && Array.isArray(statsRows)) {
              for (const row of statsRows as {
                group_id: string | null;
                total_members: number | null;
              }[]) {
                const gid = row.group_id;
                if (typeof gid === 'string' && gid.length > 0) {
                  countsMap[gid] = Number(row.total_members || 0);
                }
              }
            }
          }

          const groups = (groupsData || []).map((row: any) => {
            const gid = (row as { id: string }).id;
            return normalizeGroupRow(row, countsMap[gid] ?? 0);
          });

          if (await isGroupOperationScopeCurrent(operationScope)) {
            set({ groups });
          }
        } catch (error) {
          if (await isGroupOperationScopeCurrent(operationScope)) {
            console.error('Error fetching all groups:', error);
            throw error;
          }
        } finally {
          if (await isGroupOperationScopeCurrent(operationScope)) {
            set({ isLoading: false });
          }
        }
      },

      fetchUserGroups: async (userId: string) => {
        // Validate userId before proceeding
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
          console.warn(
            '[GroupStore] fetchUserGroups called with invalid userId:',
            userId
          );
          set({ isLoading: false });
          return;
        }

        const operationScope = await captureGroupOperationScope(userId);
        if (!operationScope) return;

        set({ isLoading: true });
        try {
          const { data: memberData, error: memberError } = await supabase
            .from('team_members')
            .select(
              `
              group_id,
              teams:group_id (
                id,
                name,
                description,
                owner_id,
                status,
                duration_days,
                current_streak,
                created_at,
                kind,
                privacy,
                image_url,
                start_date,
                end_date,
                team_challenges (
                  challenge_id,
                  challenges:challenge_id (
                    id,
                    title,
                    status,
                    completion_status,
                    duration,
                    start_date,
                    end_date
                  )
                ),
                group_streak_tracking (
                  current_streak,
                  longest_streak,
                  total_successful_days
                )
              )
            `
            )
            .eq('user_id', userId);

          if (memberError) throw memberError;

          // Filter out null groups and ensure all required fields exist
          const validGroups =
            memberData
              ?.map((member: any) => member.teams as any)
              .filter((group: any) =>
                Boolean(
                  group &&
                  typeof group.id === 'string' &&
                  group.id.length > 0 &&
                  typeof group.name === 'string'
                )
              ) || [];

          const groupIds = validGroups.map(g => g.id);

          // Batch load member counts via group_stats view for user's groups
          const countsMap: Record<string, number> = {};
          if (groupIds.length > 0) {
            const { data: statsRows, error: statsErr } = await supabase
              .from('group_stats')
              .select('group_id,total_members')
              .in('group_id', groupIds);
            if (!statsErr && Array.isArray(statsRows)) {
              for (const row of statsRows as {
                group_id: string | null;
                total_members: number | null;
              }[]) {
                const gid = row.group_id;
                if (typeof gid === 'string' && gid.length > 0) {
                  countsMap[gid] = Number(row.total_members || 0);
                }
              }
            }
          }

          // Enrich with current streak and member counts
          const groupsWithCounts = validGroups.map((row: any) => {
            const gid = (row as { id: string }).id;
            return normalizeGroupRow(row, countsMap[gid] ?? 0);
          });

          groupStoreDebugLog(
            `[GroupStore] Fetched ${groupsWithCounts.length} valid groups for user ${userId}`
          );

          if (await isGroupOperationScopeCurrent(operationScope)) {
            set({
              groups: groupsWithCounts,
              userGroups: groupIds,
              isLoading: false,
            });
          }
        } catch (error) {
          if (await isGroupOperationScopeCurrent(operationScope)) {
            console.error('Error fetching user groups:', error);
            set({ isLoading: false });
            throw error;
          }
        }
      },

      fetchDiscoverGroups: async (userId: string) => {
        const operationScope = await captureGroupOperationScope(userId);
        if (!operationScope) return;

        try {
          set({ isLoading: true });
          // 1) Get user's current group IDs
          const { data: memberships, error: memberErr } = await supabase
            .from('team_members')
            .select('group_id')
            .eq('user_id', userId);
          if (memberErr) throw memberErr;
          const joinedIds = new Set((memberships || []).map(m => m.group_id));

          // 2) Fetch public groups the user is not a member of
          const { data: groupsData, error: groupsErr } = await supabase
            .from('teams')
            .select(
              `id, name, description, status, kind, duration_days, created_at, privacy, image_url, start_date, end_date`
            )
            .eq('privacy', 'public')
            .eq('kind', 'saved')
            .order('created_at', { ascending: false })
            .limit(50);
          if (groupsErr) throw groupsErr;

          const candidates = (groupsData || []).filter(group => {
            const normalized = normalizeGroupRow(group);
            const endDate = normalized.end_date
              ? new Date(normalized.end_date)
              : null;
            const hasEnded = Boolean(endDate && endDate.getTime() < Date.now());

            return (
              !joinedIds.has(normalized.id) &&
              normalized.status === 'active' &&
              !hasEnded
            );
          });

          // 3) Attach member_count for display via group_stats in one batch
          const candidateIds = candidates
            .map(g => (g as { id?: string | null }).id)
            .filter(
              (id): id is string => typeof id === 'string' && id.length > 0
            );
          const countsMap: Record<string, number> = {};
          if (candidateIds.length > 0) {
            const { data: statsRows, error: statsErr } = await supabase
              .from('group_stats')
              .select('group_id,total_members')
              .in('group_id', candidateIds);
            if (!statsErr && Array.isArray(statsRows)) {
              for (const row of statsRows as {
                group_id: string | null;
                total_members: number | null;
              }[]) {
                const gid = row.group_id;
                if (typeof gid === 'string' && gid.length > 0) {
                  countsMap[gid] = Number(row.total_members || 0);
                }
              }
            }
          }

          const withCounts = candidates.map(group => {
            const normalized = normalizeGroupRow(group);
            return normalizeGroupRow(group, countsMap[normalized.id] ?? 0);
          });

          // 4) Sort by member_count desc, then recent
          withCounts.sort(
            (a, b) => (b.member_count || 0) - (a.member_count || 0)
          );

          if (await isGroupOperationScopeCurrent(operationScope)) {
            set({ discoverGroups: withCounts });
          }
        } catch (e) {
          if (await isGroupOperationScopeCurrent(operationScope)) {
            console.error('Error fetching discover groups:', e);
            throw e;
          }
        } finally {
          if (await isGroupOperationScopeCurrent(operationScope)) {
            set({ isLoading: false });
          }
        }
      },

      getCreateGroupCost: async (userId: string) => {
        const operationScope = await captureGroupOperationScope(userId);
        if (!operationScope) throw new GroupAccountChangedError();

        const { data, error } = await supabase.rpc('get_economy_contract_v1');
        await assertGroupOperationScopeCurrent(operationScope);
        if (error) throw error;

        const cost = decodeCreateGroupCost(data);
        if (cost === null) {
          throw new Error('Menta could not confirm the current group cost.');
        }
        return cost;
      },

      getJoinGroupQuote: async (userId: string) => {
        const operationScope = await captureGroupOperationScope(userId);
        if (!operationScope) throw new GroupAccountChangedError();

        const { data, error } = await supabase.rpc('get_economy_contract_v1');
        await assertGroupOperationScopeCurrent(operationScope);
        if (error) throw error;

        const quote = decodeJoinGroupQuote(data);
        if (quote === null) {
          throw new Error('Menta could not confirm the current join cost.');
        }
        return quote;
      },

      fetchGroupMembers: async (groupId: string) => {
        const operationScope = await captureActiveGroupOperationScope();
        if (!operationScope) return;

        try {
          const { data: membersData, error } = await supabase.rpc(
            'list_authorized_group_members',
            { p_group_id: groupId }
          );

          if (error) throw error;

          const members = (membersData || []).map((member: any) => {
            const username = member.username ?? member.display_name ?? null;
            const displayName = member.display_name ?? member.username ?? null;

            return {
              groupId,
              userId: member.user_id,
              role: (member.role as GroupMember['role']) || 'member',
              joinedAt: member.joined_at,
              username,
              displayName,
              avatarUrl: member.avatar_url ?? null,
            } as GroupMember;
          });

          if (await isGroupOperationScopeCurrent(operationScope)) {
            set(state => ({
              groupMembers: {
                ...state.groupMembers,
                [groupId]: members,
              },
            }));
          }
        } catch (error) {
          if (await isGroupOperationScopeCurrent(operationScope)) {
            console.error('Error fetching group members:', error);
            throw error;
          }
        }
      },

      joinGroup: async (
        userId: string,
        groupId: string,
        expectedCost: number
      ) => {
        const operationScope = await captureGroupOperationScope(userId);
        if (!operationScope) throw new GroupAccountChangedError();

        try {
          // Enforce group status and privacy rules before joining
          const { data: groupRow, error: groupErr } = await supabase
            .from('teams')
            .select('id,status,privacy')
            .eq('id', groupId)
            .maybeSingle();

          if (groupErr && !isPostgrestNoRowsError(groupErr)) {
            if (isPermissionError(groupErr)) {
              throw new Error(GROUP_UNAVAILABLE_MESSAGE);
            }
            throw groupErr;
          }

          if (!groupRow) {
            set(state => ({
              discoverGroups: state.discoverGroups.filter(
                group => group.id !== groupId
              ),
            }));
            throw new Error(GROUP_UNAVAILABLE_MESSAGE);
          }

          const rawStatus = (groupRow as any).status as string | undefined;
          const status: Group['status'] =
            rawStatus === 'failed'
              ? 'failed'
              : rawStatus === 'completed' || rawStatus === 'archived'
                ? 'expired'
                : 'active';
          const privacy = String(
            (groupRow as any).privacy || 'public'
          ).toLowerCase();
          if (status !== 'active') {
            throw new Error('This group is not active');
          }
          if (privacy === 'secret') {
            throw new Error('This group is invite-only. Use an invite code.');
          }
          if (privacy === 'private') {
            throw new Error('This group requires approval to join');
          }

          const { data: joinResult, error } = await supabase.rpc(
            'join_public_group_v2',
            { p_group_id: groupId, p_expected_cost: expectedCost }
          );

          await assertGroupOperationScopeCurrent(operationScope);

          if (error) throw error;
          if (!joinResult || joinResult.success !== true) {
            throw new Error(joinResult?.error || 'Failed to join group');
          }

          // Refresh user groups and group members
          await get().fetchUserGroups(userId);
          await get().fetchGroupMembers(groupId);
          await assertGroupOperationScopeCurrent(operationScope);
          try {
            await get().fetchDiscoverGroups(userId);
          } catch (refreshErr) {
            console.warn(
              '[GroupStore] Failed to refresh discover groups after join:',
              refreshErr
            );
          }

          // Notify other members through the app-owned operational switch.
          try {
            const enabled = await isOperationalFeatureEnabled(
              'group_notifications_enabled'
            );
            if (enabled) {
              const [{ data: members }, { data: group }, { data: joiner }] =
                await Promise.all([
                  supabase
                    .from('team_members')
                    .select('user_id')
                    .eq('group_id', groupId),
                  supabase
                    .from('teams')
                    .select('name')
                    .eq('id', groupId)
                    .single(),
                  supabase
                    .from('profiles')
                    .select('username, display_name')
                    .eq('id', userId)
                    .single(),
                ]);
              const jp = joiner as any;
              const memberName = jp?.username || jp?.display_name || 'A member';
              const groupName = (group as any)?.name || 'Group';
              const targets = (members || [])
                .map((m: any) => m.user_id)
                .filter((id: string) => id !== userId);
              await Promise.allSettled(
                targets.map((targetId: string) =>
                  notificationService.sendGroupActivity(
                    targetId,
                    memberName,
                    groupName,
                    groupId,
                    'joined the group'
                  )
                )
              );
            }
          } catch (notifyErr) {
            console.warn('[GroupStore] joinGroup notify failed:', notifyErr);
          }
        } catch (error) {
          console.error('Error joining group:', error);
          throw error;
        }
      },

      previewGuestGroupInvite: async (code: string) => {
        const normalizedCode = code.trim().toUpperCase();
        const { data, error } = await supabase.rpc(
          'preview_group_invite_guest_v1',
          { p_invite_code: normalizedCode }
        );

        if (error) {
          throw error;
        }

        if (isGuestGroupInvitePreviewUnavailable(data)) {
          const previewError = new Error('UNAVAILABLE');
          previewError.name = 'GuestGroupInvitePreviewUnavailableError';
          Object.assign(previewError, { code: 'UNAVAILABLE' });
          throw previewError;
        }

        const preview = decodeGuestGroupInvitePreviewResponse(data);
        if (!preview) {
          const previewError = new Error(
            'Menta received an invalid guest invite preview response.'
          );
          previewError.name = 'GuestGroupInvitePreviewContractError';
          Object.assign(previewError, { code: 'INVALID_PREVIEW_RESPONSE' });
          throw previewError;
        }

        return preview;
      },

      previewGroupInvite: async (code: string) => {
        const normalizedCode = code.trim().toUpperCase();
        const { data, error } = await supabase.rpc('preview_group_invite_v2', {
          p_invite_code: normalizedCode,
        });

        if (error) {
          throw error;
        }

        const failureCode = decodeGroupInvitePreviewFailure(data);
        if (failureCode) {
          const previewError = new Error(failureCode);
          previewError.name = 'GroupInvitePreviewError';
          Object.assign(previewError, { code: failureCode });
          throw previewError;
        }

        const preview = decodeGroupInvitePreviewResponse(data);
        if (!preview) {
          const previewError = new Error(
            'Menta received an invalid invite preview response.'
          );
          previewError.name = 'GroupInvitePreviewContractError';
          Object.assign(previewError, { code: 'INVALID_PREVIEW_RESPONSE' });
          throw previewError;
        }

        return preview;
      },

      joinGroupByInviteCode: async (userId: string, code: string) => {
        const operationScope = await captureGroupOperationScope(userId);
        if (!operationScope) throw new GroupAccountChangedError();

        try {
          const normalizedCode = code.trim().toUpperCase();
          const { data, error } = await supabase.functions.invoke(
            'consume-join-code',
            {
              body: {
                code: normalizedCode,
                type: 'group',
                cost: 0,
              },
            }
          );

          await assertGroupOperationScopeCurrent(operationScope);

          if (error) {
            throw error;
          }

          if (!data || data.success !== true) {
            const errorCode = data?.code || data?.error || 'JOIN_FAILED';
            if (errorCode === 'INVALID_CODE' || errorCode === 'EXPIRED_CODE') {
              throw new Error('Invalid invite code');
            }
            if (errorCode === 'GROUP_INACTIVE') {
              throw new Error('This group is no longer active');
            }
            if (errorCode === 'ALREADY_MEMBER') {
              throw new Error('You are already a member of this group');
            }
            throw new Error('Failed to join group');
          }

          const group = (data.group || {}) as any;
          if (!group.id) {
            throw new Error('Group details were not returned');
          }

          // Refresh user groups
          await get().fetchUserGroups(userId);
          await assertGroupOperationScopeCurrent(operationScope);

          // Notify other members through the app-owned operational switch.
          try {
            const enabled = await isOperationalFeatureEnabled(
              'group_notifications_enabled'
            );
            if (enabled) {
              const [{ data: members }, { data: joiner }] = await Promise.all([
                supabase
                  .from('team_members')
                  .select('user_id')
                  .eq('group_id', group.id),
                supabase
                  .from('profiles')
                  .select('username, display_name')
                  .eq('id', userId)
                  .single(),
              ]);
              const jp = joiner as any;
              const memberName = jp?.username || jp?.display_name || 'A member';
              const targets = (members || [])
                .map((m: any) => m.user_id)
                .filter((id: string) => id !== userId);
              await Promise.allSettled(
                targets.map((targetId: string) =>
                  notificationService.sendGroupActivity(
                    targetId,
                    memberName,
                    group.name,
                    group.id,
                    'joined the group'
                  )
                )
              );
            }
          } catch (notifyErr) {
            console.warn(
              '[GroupStore] joinGroupByInviteCode notify failed:',
              notifyErr
            );
          }

          return normalizeGroupRow(group);
        } catch (error) {
          console.error('Error joining group:', error);
          throw error;
        }
      },

      createGroup: async groupData => {
        try {
          groupStoreDebugLog('[GroupStore] Creating group:', groupData.name);

          // Check if user is already creating a group with the same name (debounce protection)
          const recentGroups = get().groups.filter(
            g =>
              g.name === groupData.name &&
              g.owner_id === groupData.owner_id &&
              new Date(g.created_at).getTime() > Date.now() - 5000 // Within last 5 seconds
          );

          if (recentGroups.length > 0) {
            groupStoreDebugLog(
              '[GroupStore] Duplicate group creation attempt detected, returning existing group'
            );
            return recentGroups[0];
          }

          return get().createGroupWithPayment({
            name: groupData.name,
            description: groupData.description,
            owner_id: groupData.owner_id,
            duration_days: groupData.duration_days,
            cost: 50,
            privacy: groupData.privacy,
            notify_on_member_miss: groupData.notify_on_member_miss,
          });
        } catch (error) {
          console.error('Error creating group:', error);
          throw error;
        }
      },

      createOnboardingGroupWithFirstPromise: async groupData => {
        return withAuth(async userId => {
          if (userId !== groupData.owner_id) {
            throw new GroupAccountChangedError();
          }
          const operationScope = await captureGroupOperationScope(userId);
          if (!operationScope) throw new GroupAccountChangedError();

          const { data, error }: any = await withTimeout(
            (supabase as any).rpc(
              'create_onboarding_group_with_first_promise_v1',
              {
                p_first_promise_id: groupData.first_promise_id,
                p_name: groupData.name,
                p_description: groupData.description || null,
                p_privacy: groupData.privacy,
                p_image_preset: groupData.image_preset,
                p_member_nudges: groupData.notify_on_member_miss,
              }
            ),
            15000,
            'create_onboarding_group_with_first_promise_v1'
          );

          if (error?.message || error?.code) {
            throw new Error(
              onboardingGroupLinkErrorMessage(error.code ?? error.message)
            );
          }
          if (data?.success !== true) {
            throw new Error(onboardingGroupLinkErrorMessage(data?.error));
          }

          const receipt = decodeOnboardingGroupLinkReceipt(data);
          const expectedName = groupData.name.trim().replace(/\s+/g, ' ');
          const expectedDescription = groupData.description?.trim() || null;
          const expectedImage = `menta-preset:${groupData.image_preset}`;
          if (
            !receipt ||
            receipt.firstPromise.id !== groupData.first_promise_id ||
            receipt.group.name !== expectedName ||
            receipt.group.description !== expectedDescription ||
            receipt.group.privacy !== groupData.privacy ||
            receipt.group.imageUrl !== expectedImage ||
            receipt.group.notifyOnMemberMiss !== groupData.notify_on_member_miss
          ) {
            throw new Error(
              'Menta returned an incomplete onboarding group receipt. Do not create another group; reopen this draft to recover it.'
            );
          }

          await assertGroupOperationScopeCurrent(operationScope);
          const group = await get().fetchGroupDetails(receipt.group.id);
          await assertGroupOperationScopeCurrent(operationScope);
          if (
            group.id !== receipt.group.id ||
            group.owner_id !== groupData.owner_id
          ) {
            throw new Error(
              'Menta could not confirm this group for the current account.'
            );
          }

          set(state => ({
            groups: [
              ...state.groups.filter(item => item.id !== group.id),
              group,
            ],
            userGroups: state.userGroups.includes(group.id)
              ? state.userGroups
              : [...state.userGroups, group.id],
          }));

          return { group, receipt };
        }, 'createOnboardingGroupWithFirstPromise');
      },

      createGroupWithPayment: async groupData => {
        return withAuth(async userId => {
          if (userId !== groupData.owner_id) {
            throw new GroupAccountChangedError();
          }

          const operationScope = await captureGroupOperationScope(userId);
          if (!operationScope) throw new GroupAccountChangedError();
          const request = normaliseSavedGroupCreationRequest({
            name: groupData.name,
            description: groupData.description,
            durationDays: groupData.duration_days,
            privacy: groupData.privacy ?? 'private',
            imagePreset: groupData.image_preset ?? null,
            notifyOnMemberMiss: groupData.notify_on_member_miss ?? true,
          });
          const prepared = await prepareSavedGroupCreationAttempt(
            userId,
            request
          );

          if (prepared.kind === 'blocked') {
            throw new SavedGroupCreationUnknownError(
              prepared.attempt.clientEventId,
              'Menta must check your previous group request before creating another group.'
            );
          }

          const { attempt } = prepared;
          const result = await submitSavedGroupCreation(attempt);
          await assertGroupOperationScopeCurrent(operationScope);

          if (result.kind === 'unknown') {
            const error = new SavedGroupCreationUnknownError(
              attempt.clientEventId,
              `${result.message} Check its status before creating another group.`
            );
            logCreationError(
              error,
              {
                component: 'GroupStore',
                action: 'createGroupWithPayment',
                userId,
                additionalData: {
                  clientEventId: attempt.clientEventId,
                  result: 'unknown',
                },
              },
              groupData
            );
            throw error;
          }

          if (result.kind === 'failure') {
            if (result.failure.code === 'IDEMPOTENCY_MISMATCH') {
              throw new SavedGroupCreationUnknownError(
                attempt.clientEventId,
                'Menta found a different request with this saved ID. Check its status before creating another group.'
              );
            }

            await clearSavedGroupCreationAttempt(userId, attempt.clientEventId);
            const error = new SavedGroupCreationFailureError(
              result.failure.code,
              result.failure.message,
              result.failure.details
            );
            logCreationError(
              error,
              {
                component: 'GroupStore',
                action: 'createGroupWithPayment',
                userId,
                additionalData: {
                  clientEventId: attempt.clientEventId,
                  code: result.failure.code,
                },
              },
              groupData
            );
            throw error;
          }

          let group: Group;
          try {
            group = await get().fetchGroupDetails(result.receipt.groupId);
            await assertGroupOperationScopeCurrent(operationScope);
          } catch (error) {
            if (error instanceof GroupAccountChangedError) throw error;
            throw new SavedGroupCreationUnknownError(
              attempt.clientEventId,
              'The group receipt is confirmed, but Menta could not load the group yet. Check its status to finish.'
            );
          }

          if (
            group.id !== result.receipt.groupId ||
            group.owner_id !== userId ||
            group.kind === 'promise'
          ) {
            throw new SavedGroupCreationUnknownError(
              attempt.clientEventId,
              'Menta returned a group that did not match this saved-group receipt. Check its status before continuing.'
            );
          }

          await clearSavedGroupCreationAttempt(userId, attempt.clientEventId);
          set(state => ({
            groups: [
              ...state.groups.filter(item => item.id !== group.id),
              group,
            ],
            userGroups: state.userGroups.includes(group.id)
              ? state.userGroups
              : [...state.userGroups, group.id],
          }));

          logCreationSuccess(
            {
              component: 'GroupStore',
              action: 'createGroupWithPayment',
              userId,
              groupId: group.id,
            },
            groupData
          );

          return group;
        }, 'createGroupWithPayment');
      },

      reconcilePendingGroupCreation: async expectedUserId => {
        return withAuth(async userId => {
          if (userId !== expectedUserId) throw new GroupAccountChangedError();
          const operationScope = await captureGroupOperationScope(userId);
          if (!operationScope) throw new GroupAccountChangedError();

          const attempt = await loadSavedGroupCreationAttempt(userId);
          if (!attempt) return { kind: 'none' };

          const result = await readSavedGroupCreationStatus(attempt);
          await assertGroupOperationScopeCurrent(operationScope);

          if (result.kind === 'pending' || result.kind === 'unavailable') {
            return { kind: 'pending', message: result.message };
          }

          if (result.kind === 'not-found') {
            return {
              kind: 'safe-to-retry',
              attempt,
              message: translate(
                'en-NZ',
                'groups.source.accountability.safe_to_retry'
              ),
            };
          }

          if (result.kind === 'failure') {
            if (
              result.failure.code === 'AUTH_REQUIRED' ||
              result.failure.code === 'AUTH_SESSION_REVOKED' ||
              result.failure.code === 'IDEMPOTENCY_MISMATCH'
            ) {
              return { kind: 'pending', message: result.failure.message };
            }

            await clearSavedGroupCreationAttempt(userId, attempt.clientEventId);
            return {
              kind: 'failed',
              code: result.failure.code,
              message: result.failure.message,
            };
          }

          let group: Group;
          try {
            group = await get().fetchGroupDetails(result.receipt.groupId);
            await assertGroupOperationScopeCurrent(operationScope);
          } catch (error) {
            if (error instanceof GroupAccountChangedError) throw error;
            return {
              kind: 'pending',
              message: translate(
                'en-NZ',
                'groups.source.accountability.receipt_load_pending'
              ),
            };
          }

          if (
            group.id !== result.receipt.groupId ||
            group.owner_id !== userId ||
            group.kind === 'promise'
          ) {
            return {
              kind: 'pending',
              message: translate(
                'en-NZ',
                'groups.source.accountability.receipt_account_mismatch'
              ),
            };
          }

          await clearSavedGroupCreationAttempt(userId, attempt.clientEventId);
          set(state => ({
            groups: [
              ...state.groups.filter(item => item.id !== group.id),
              group,
            ],
            userGroups: state.userGroups.includes(group.id)
              ? state.userGroups
              : [...state.userGroups, group.id],
          }));

          return { kind: 'confirmed', group, receipt: result.receipt };
        }, 'reconcilePendingGroupCreation');
      },

      resumePendingGroupCreation: async expectedUserId => {
        const attempt = await loadSavedGroupCreationAttempt(expectedUserId);
        if (!attempt || attempt.accountId !== expectedUserId) {
          throw new Error(
            'This saved group request is no longer available. Review the group and create it again.'
          );
        }

        return get().createGroupWithPayment({
          name: attempt.request.name,
          description: attempt.request.description ?? undefined,
          owner_id: expectedUserId,
          duration_days: attempt.request.durationDays,
          cost: 0,
          privacy: attempt.request.privacy,
          notify_on_member_miss: attempt.request.notifyOnMemberMiss,
          image_preset: attempt.request.imagePreset ?? undefined,
        });
      },

      clearPendingGroupCreation: async expectedUserId => {
        return withAuth(async userId => {
          if (userId !== expectedUserId) throw new GroupAccountChangedError();
          const attempt = await loadSavedGroupCreationAttempt(userId);
          if (attempt) {
            await clearSavedGroupCreationAttempt(userId, attempt.clientEventId);
          }
        }, 'clearPendingGroupCreation');
      },

      generateGroupInviteCode: async (groupId: string) => {
        try {
          return await get().getOrCreateGroupInviteCode(groupId);
        } catch (error) {
          console.error('Error generating invite code:', error);
          throw error;
        }
      },

      getOrCreateGroupInviteCode: async (groupId: string) => {
        try {
          groupStoreDebugLog(
            `[Group Store] Generating invite code for group: ${groupId}`
          );

          // Call the edge function
          const { data, error } = await supabase.functions.invoke(
            'generate-group-invite',
            {
              body: { groupId, replace: false },
            }
          );

          if (error) {
            console.error('[Group Store] Edge function error:', error);
            throw error;
          }

          const invite = decodeGroupInviteResponse(data);
          if (!invite) {
            console.error(
              '[Group Store] Invalid response from edge function:',
              data
            );
            throw new Error(
              'Failed to generate invite code - invalid response'
            );
          }

          groupStoreDebugLog(
            `[Group Store] Successfully generated invite code: ${data.code}`
          );
          return invite.code;
        } catch (error) {
          console.error(
            '[Group Store] Error in getOrCreateGroupInviteCode:',
            error
          );
          throw error;
        }
      },

      rotateGroupInviteCode: async (groupId: string, previousCode?: string) => {
        try {
          const { data, error } = await supabase.functions.invoke(
            'generate-group-invite',
            {
              body: { groupId, replace: true },
            }
          );

          if (error) throw error;

          const invite = decodeGroupInviteResponse(data);
          if (!invite || !invite.replaced) {
            throw new Error('The invite code was not replaced. Try again.');
          }

          return {
            code: invite.code,
            previousCodeInvalidated: invite.previousCodeInvalidated,
          };
        } catch (error) {
          if (previousCode) {
            const activeCode = await get().getOrCreateGroupInviteCode(groupId);
            if (activeCode !== previousCode) {
              return { code: activeCode, previousCodeInvalidated: true };
            }
          }
          throw error;
        }
      },

      shareGroup: async (groupId: string, _groupName: string) => {
        try {
          const code = await get().generateGroupInviteCode(groupId);
          const shareUrl = buildInviteShareUrl('group', code);

          return { code, shareUrl };
        } catch (error) {
          console.error('Error sharing group:', error);
          throw error;
        }
      },

      leaveGroup: async (userId: string, groupId: string) => {
        const operationScope = await captureGroupOperationScope(userId);
        if (!operationScope) {
          return unknownGroupGovernance(
            'leave-group',
            'Your account changed before Menta could confirm the group. Reopen groups and check the membership state.'
          );
        }

        const membershipQuery = await supabase
          .from('team_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!(await isGroupOperationScopeCurrent(operationScope))) {
          return unknownGroupGovernance(
            'leave-group',
            'Your account changed before Menta could confirm the group. Reopen groups and check the membership state.'
          );
        }

        if (membershipQuery.error) {
          return unknownGroupGovernance(
            'leave-group',
            'Menta could not check your membership before leaving. Refresh the group before trying again.'
          );
        }

        const currentMembership = membershipQuery.data as {
          role?: GroupMember['role'];
        } | null;
        if (!currentMembership) {
          return rejectedGroupGovernance(
            'leave-group',
            'You are no longer a member of this group. Nothing was changed.'
          );
        }

        if (currentMembership.role === 'owner') {
          const { count, error: countError } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId);

          if (!(await isGroupOperationScopeCurrent(operationScope))) {
            return unknownGroupGovernance(
              'leave-group',
              'Your account changed before Menta could confirm the group. Reopen groups and check the membership state.'
            );
          }

          if (countError) {
            return unknownGroupGovernance(
              'leave-group',
              'Menta could not verify the ownership state. Refresh before trying again.'
            );
          }

          return getOwnerLeaveOutcome({
            memberCount: count ?? 0,
          });
        }

        try {
          const { data: deletedMembership, error } = await supabase
            .from('team_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .select('user_id')
            .maybeSingle();

          await assertGroupOperationScopeCurrent(operationScope);

          let verifiedBy: 'mutation-response' | 'state-check' =
            'mutation-response';

          if (error || !deletedMembership) {
            const { data: stateCheck, error: stateCheckError } = await supabase
              .from('team_members')
              .select('user_id')
              .eq('group_id', groupId)
              .eq('user_id', userId)
              .maybeSingle();

            await assertGroupOperationScopeCurrent(operationScope);

            if (stateCheckError) {
              return unknownGroupGovernance(
                'leave-group',
                'The leave request ended without a trustworthy receipt. Check the group state before trying again.'
              );
            }

            if (stateCheck) {
              return rejectedGroupGovernance(
                'leave-group',
                'You are still a member of this group. Nothing changed.'
              );
            }

            verifiedBy = 'state-check';
          }

          // Refresh user groups
          await get().fetchUserGroups(userId);
          await assertGroupOperationScopeCurrent(operationScope);

          // Notify other members through the app-owned operational switch.
          try {
            const enabled = await isOperationalFeatureEnabled(
              'group_notifications_enabled'
            );
            await assertGroupOperationScopeCurrent(operationScope);
            if (enabled) {
              const [{ data: members }, { data: group }, { data: leaver }] =
                await Promise.all([
                  supabase
                    .from('team_members')
                    .select('user_id')
                    .eq('group_id', groupId),
                  supabase
                    .from('teams')
                    .select('name')
                    .eq('id', groupId)
                    .single(),
                  supabase
                    .from('profiles')
                    .select('username, display_name')
                    .eq('id', userId)
                    .single(),
                ]);
              await assertGroupOperationScopeCurrent(operationScope);
              const lp = leaver as any;
              const memberName = lp?.username || lp?.display_name || 'A member';
              const groupName = (group as any)?.name || 'Group';
              const targets = (members || [])
                .map((m: any) => m.user_id)
                .filter((id: string) => id !== userId);
              await Promise.allSettled(
                targets.map((targetId: string) =>
                  notificationService.sendGroupActivity(
                    targetId,
                    memberName,
                    groupName,
                    groupId,
                    'left the group'
                  )
                )
              );
            }
          } catch (notifyErr) {
            if (notifyErr instanceof GroupAccountChangedError) {
              throw notifyErr;
            }
            console.warn('[GroupStore] leaveGroup notify failed:', notifyErr);
          }

          await assertGroupOperationScopeCurrent(operationScope);

          return confirmedGroupGovernance({
            action: 'leave-group',
            groupId,
            targetUserId: userId,
            verifiedBy,
          });
        } catch (error) {
          if (error instanceof GroupAccountChangedError) {
            return unknownGroupGovernance(
              'leave-group',
              'Your account changed before Menta could confirm the group. Reopen groups and check the membership state.'
            );
          }
          console.error('Error leaving group:', error);
          return unknownGroupGovernance(
            'leave-group',
            'The leave request ended without a trustworthy receipt. Check the group state before trying again.'
          );
        }
      },

      deleteGroup: async (groupId: string) => {
        // Allow deletion even if group is not in local cache (e.g., deep link)

        let operationScope: GroupOperationScope | null = null;

        try {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          const session = sessionData?.session;
          const accessToken = session?.access_token;

          if (sessionError || !session || !accessToken) {
            return rejectedGroupGovernance(
              'delete-group',
              'Authentication is required before a group can be deleted. Nothing changed.'
            );
          }

          operationScope = await captureGroupOperationScope(session.user.id);
          if (!operationScope) {
            return unknownGroupGovernance(
              'delete-group',
              'Your account changed before Menta could confirm the group. Reopen groups and check whether it still exists.'
            );
          }

          set({ isLoading: true });

          const { data, error } = await supabase.functions.invoke(
            'delete-group',
            {
              body: { groupId },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          await assertGroupOperationScopeCurrent(operationScope);

          const response = data as { success?: boolean } | null;
          if (error || response?.success !== true) {
            const { data: stateCheck, error: stateCheckError } = await supabase
              .from('teams')
              .select('id')
              .eq('id', groupId)
              .maybeSingle();

            await assertGroupOperationScopeCurrent(operationScope);

            if (stateCheckError) {
              return unknownGroupGovernance(
                'delete-group',
                'Menta did not receive a trustworthy deletion receipt. Check the group status before trying again.'
              );
            }

            if (stateCheck) {
              return rejectedGroupGovernance(
                'delete-group',
                'The group is still here. The delete request made no confirmed group change.'
              );
            }

            set(state => {
              const remainingMembers = { ...state.groupMembers };
              delete remainingMembers[groupId];
              return {
                groups: state.groups.filter(group => group.id !== groupId),
                userGroups: state.userGroups.filter(id => id !== groupId),
                groupMembers: remainingMembers,
                isLoading: false,
              };
            });
            return confirmedGroupGovernance({
              action: 'delete-group',
              groupId,
              verifiedBy: 'state-check',
            });
          }

          set(state => {
            const remainingMembers = { ...state.groupMembers };
            delete remainingMembers[groupId];
            return {
              groups: state.groups.filter(group => group.id !== groupId),
              userGroups: state.userGroups.filter(id => id !== groupId),
              groupMembers: remainingMembers,
              isLoading: false,
            };
          });
          return confirmedGroupGovernance({
            action: 'delete-group',
            groupId,
            verifiedBy: 'mutation-response',
          });
        } catch (error) {
          if (error instanceof GroupAccountChangedError) {
            return unknownGroupGovernance(
              'delete-group',
              'Your account changed before Menta could confirm the group. Reopen groups and check whether it still exists.'
            );
          }
          console.error('Error deleting group:', error);
          return unknownGroupGovernance(
            'delete-group',
            'Menta could not determine whether the group changed. Check the group status before trying again.'
          );
        } finally {
          if (
            operationScope &&
            (await isGroupOperationScopeCurrent(operationScope))
          ) {
            set({ isLoading: false });
          }
        }
      },

      fetchGroupDetails: async (groupId: string) => {
        try {
          const { data: group, error } = await supabase
            .from('teams')
            .select(
              `
              *,
              group_streak_tracking (
                current_streak,
                longest_streak,
                total_successful_days
              )
            `
            )
            .eq('id', groupId)
            .single();

          if (error) throw error;

          // Get member count
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'planned', head: true })
            .eq('group_id', groupId);

          return normalizeGroupRow(group as any, count || 0);
        } catch (error) {
          console.error('Error fetching group details:', error);
          throw error;
        }
      },

      getTodaysSubmissions: async (
        userId: string
      ): Promise<TodaysSubmission[]> => {
        try {
          const submissions: TodaysSubmission[] = [];
          const challengeChecks: Promise<TodaysSubmission | null>[] = [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { data: participantRows, error: participantError } =
            await supabase
              .from('challenge_participants')
              .select('challenge_id')
              .eq('user_id', userId);

          if (participantError) {
            console.error(
              'Error fetching challenge participants:',
              participantError
            );
          }

          const enrolledChallengeIds = new Set(
            (participantRows || []).map(row => row.challenge_id)
          );

          // Helper function to process challenges - defined first
          const processChallenge = async (
            challenge: any,
            userId: string,
            today: Date,
            options: {
              groupId?: string;
              groupName?: string;
              memberCount: number;
              isSolo: boolean;
            }
          ): Promise<TodaysSubmission | null> => {
            // Calculate day number based on challenge start date
            const startDate = new Date(challenge.start_date);
            startDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor(
              (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const dayNumber = daysDiff + 1;

            // Skip if challenge hasn't started yet or is beyond duration
            if (dayNumber < 1 || dayNumber > challenge.duration) return null;

            // Check if user has already submitted today using server-side RPC (UTC consistent)
            const { data: hasSubmittedData, error: verError } =
              await supabase.rpc('has_submitted_today', {
                p_challenge_id: challenge.id,
                p_user_id: userId,
                p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              });

            if (verError) {
              console.error(
                "Error checking today's verification (RPC):",
                verError
              );
              return null;
            }

            const hasSubmittedToday = hasSubmittedData === true;
            let submissionStatus: TodaysSubmission['submissionStatus'] =
              hasSubmittedToday ? 'unknown' : 'not_submitted';

            if (hasSubmittedToday) {
              const { data: statusData, error: statusError } =
                await supabase.rpc('get_todays_submission_status', {
                  p_challenge_id: challenge.id,
                  p_user_id: userId,
                  p_tz:
                    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                });

              if (statusError) {
                console.error(
                  "Error checking today's submission status (RPC):",
                  statusError
                );
              } else {
                const rawStatus = Array.isArray(statusData)
                  ? statusData[0]?.submission_status
                  : undefined;
                submissionStatus =
                  rawStatus === 'pending' ||
                  rawStatus === 'approved' ||
                  rawStatus === 'rejected' ||
                  rawStatus === 'not_submitted'
                    ? rawStatus
                    : 'unknown';
              }
            }

            const now = new Date();
            let deadline = new Date(now);
            const expectation =
              challenge.submission_expectations || challenge.expectations || {};
            const deadlineHourUtc = Number(
              expectation.daily_deadline_hour_utc ?? 23
            );
            const graceMinutes = Number(expectation.grace_minutes ?? 0);

            deadline.setUTCHours(deadlineHourUtc, graceMinutes, 0, 0);
            if (deadline.getTime() <= now.getTime()) {
              deadline.setUTCDate(deadline.getUTCDate() + 1);
            }

            const diffMs = Math.max(0, deadline.getTime() - now.getTime());
            const totalMinutes = Math.floor(diffMs / (1000 * 60));
            const hoursRemaining = Math.floor(totalMinutes / 60);
            const minutesRemaining = totalMinutes % 60;

            let timeRemaining = '';
            let isUrgent = false;

            if (!hasSubmittedToday) {
              isUrgent = diffMs <= 3 * 60 * 60 * 1000;
              if (hoursRemaining > 0) {
                timeRemaining = `${hoursRemaining}h${minutesRemaining > 0 ? ` ${minutesRemaining}m` : ''}`;
              } else {
                timeRemaining = `${minutesRemaining}m`;
              }
            }

            return {
              id: options.groupId
                ? `${options.groupId}-${challenge.id}`
                : `solo-${challenge.id}`,
              groupId: options.groupId,
              challengeId: challenge.id,
              groupName: options.groupName,
              challengeTitle: challenge.title,
              dayNumber,
              totalDays: challenge.duration,
              memberCount: options.memberCount,
              submissionType: challenge.verification_type as
                | 'photo'
                | 'text'
                | 'video',
              isUrgent,
              timeRemaining,
              hasSubmittedToday,
              submissionStatus,
              isSolo: options.isSolo,
            };
          };

          // 1. Get group challenges
          const { data: groupData, error: groupError } = await supabase
            .from('team_members')
            .select(
              `
              group_id,
              teams!inner(
                id,
                name,
                current_streak,
                duration_days,
                status,
                team_challenges!inner(
                  challenge_id,
                  challenges!inner(
                    id,
                    title,
                    verification_type,
                    start_date,
                    duration,
                    status,
                    submission_expectations
                  )
                )
              )
            `
            )
            .eq('user_id', userId);
          if (groupError) {
            console.error('Error fetching group challenges:', groupError);
          } else if (groupData) {
            // Process group challenges
            for (const membership of groupData) {
              const membershipRow = membership as any;
              const group = Array.isArray(membershipRow.teams)
                ? membershipRow.teams[0]
                : membershipRow.teams;
              if (!group || !group.team_challenges) continue;
              if (group.status !== 'active') continue;

              // Get member count for this group from store
              const storeGroup = get().groups.find(g => g.id === group.id);
              const memberCount = storeGroup?.member_count || 1;

              const teamChallenges = Array.isArray(group.team_challenges)
                ? group.team_challenges
                : [];
              for (const groupChallenge of teamChallenges) {
                const challenge = Array.isArray(groupChallenge.challenges)
                  ? groupChallenge.challenges[0]
                  : groupChallenge.challenges;
                if (!challenge) continue;
                if (challenge.status !== 'active') continue;
                if (!enrolledChallengeIds.has(challenge.id)) continue;

                challengeChecks.push(
                  processChallenge(challenge, userId, today, {
                    groupId: group.id,
                    groupName: group.name,
                    memberCount,
                    isSolo: false,
                  })
                );
              }
            }
          }

          // 2. Get solo challenges
          const { data: soloData, error: soloError } = await supabase
            .from('challenge_participants')
            .select(
              `
              challenge_id,
              challenges!inner(
                id,
                title,
                verification_type,
                start_date,
                duration,
                status,
                allow_self_review,
                submission_expectations
              )
            `
            )
            .eq('user_id', userId)
            .eq('challenges.status', 'active')
            .eq('challenges.allow_self_review', true);

          if (soloError) {
            console.error('Error fetching solo challenges:', soloError);
          } else if (soloData) {
            // Process solo challenges
            for (const userChallenge of soloData) {
              const challenge = Array.isArray(userChallenge.challenges)
                ? userChallenge.challenges[0]
                : userChallenge.challenges;
              if (!challenge) continue;
              if (challenge.status !== 'active') continue;

              challengeChecks.push(
                processChallenge(challenge, userId, today, {
                  memberCount: 1,
                  isSolo: true,
                })
              );
            }
          }

          const resolvedSubmissions = await Promise.allSettled(challengeChecks);
          resolvedSubmissions.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
              submissions.push(result.value);
            }
          });

          // Sort by urgency first, then by time remaining
          return submissions.sort((a, b) => {
            if (a.isUrgent && !b.isUrgent) return -1;
            if (!a.isUrgent && b.isUrgent) return 1;
            if (a.hasSubmittedToday && !b.hasSubmittedToday) return 1;
            if (!a.hasSubmittedToday && b.hasSubmittedToday) return -1;
            return 0;
          });
        } catch (error) {
          console.error('Error in getTodaysSubmissions:', error);
          return [];
        }
      },

      getPendingReviewsForUser: async (
        userId: string
      ): Promise<PendingReview[]> => {
        try {
          const now = new Date();

          const { data: memberships, error: membershipError } = await supabase
            .from('team_members')
            .select('group_id')
            .eq('user_id', userId);

          if (membershipError) throw membershipError;

          const groupIds = (memberships || []).map(m => m.group_id);
          if (groupIds.length === 0) {
            return [];
          }

          const { data: groupChallenges, error: groupChallengeError } =
            await supabase
              .from('team_challenges')
              .select('group_id, challenge_id, teams:group_id(name)')
              .in('group_id', groupIds);

          if (groupChallengeError) throw groupChallengeError;

          const challengeIds = (groupChallenges || []).map(
            gc => gc.challenge_id
          );
          if (challengeIds.length === 0) {
            return [];
          }

          const {
            data: reviewerParticipations,
            error: reviewerParticipationError,
          } = await supabase
            .from('challenge_participants')
            .select('challenge_id')
            .eq('user_id', userId)
            .in('challenge_id', challengeIds);

          if (reviewerParticipationError) throw reviewerParticipationError;

          const reviewableChallengeIds = (reviewerParticipations || []).map(
            row => row.challenge_id
          );
          if (reviewableChallengeIds.length === 0) {
            return [];
          }

          const { data: verifications, error: verificationError } =
            await supabase
              .from('challenge_submissions')
              .select(
                `
                id,
                challenge_id,
                user_id,
                status,
                submission_date,
                media_type,
                media_url,
                submission_text,
                profiles:user_id(username, display_name, avatar_url),
                challenges:challenge_id(title, allow_self_review)
              `
              )
              .eq('status', 'pending')
              .in('challenge_id', reviewableChallengeIds)
              .order('submission_date', { ascending: false })
              .limit(100);

          if (verificationError) throw verificationError;

          const groupByChallenge: Record<
            string,
            { id?: string; name?: string }
          > = {};
          const groupChallengeRows = (groupChallenges ||
            []) as ReviewGroupChallengeRow[];
          groupChallengeRows.forEach(gc => {
            const team = firstRelation(gc.teams);
            groupByChallenge[gc.challenge_id] = {
              id: gc.group_id,
              name: team?.name || undefined,
            };
          });

          const verificationRows = (verifications ||
            []) as ReviewSubmissionRow[];
          const reviews = verificationRows
            .filter(
              v =>
                firstRelation(v.challenges)?.allow_self_review ||
                v.user_id !== userId
            )
            .map(v => {
              const submissionTime = new Date(v.submission_date);
              const hoursAgo = Math.floor(
                (now.getTime() - submissionTime.getTime()) / (1000 * 60 * 60)
              );
              const g = groupByChallenge[v.challenge_id];
              const profile = firstRelation(v.profiles);
              const challenge = firstRelation(v.challenges);
              const submitterName =
                profile?.display_name || profile?.username || 'Unknown User';
              return {
                id: v.id,
                challengeId: v.challenge_id,
                challengeTitle: challenge?.title || 'Challenge',
                groupId: g?.id,
                groupName: g?.name,
                submitterName,
                submitterAvatar: profile?.avatar_url || undefined,
                submissionDate: v.submission_date,
                mediaUrl: v.media_url || undefined,
                isSolo: !g?.id,
                hoursAgo,
              } as PendingReview;
            });

          return reviews.sort(
            (a, b) =>
              new Date(b.submissionDate).getTime() -
              new Date(a.submissionDate).getTime()
          );
        } catch (error) {
          console.error('Error in getPendingReviewsForUser:', error);
          return [];
        }
      },

      // Schedule alignment functions
      getScheduleAlignmentInfo: async (
        groupId?: string
      ): Promise<ScheduleAlignmentInfo[]> => {
        try {
          const { data, error } = await supabase.rpc(
            'get_schedule_alignment_info',
            {
              p_group_id: groupId || null,
            }
          );

          if (error) {
            console.error('Error getting schedule alignment info:', error);
            return [];
          }

          return (data || []).map((item: any) => ({
            group_id: item.group_id,
            group_name: item.group_name,
            group_start_date: item.group_start_date,
            group_end_date: item.group_end_date,
            challenge_id: item.challenge_id,
            challenge_title: item.challenge_title,
            challenge_start_date: item.challenge_start_date,
            challenge_end_date: item.challenge_end_date,
            alignment_status: item.alignment_status,
            warnings: item.warnings || [],
          }));
        } catch (error) {
          console.error('Error in getScheduleAlignmentInfo:', error);
          return [];
        }
      },

      fixScheduleAlignment: async (
        groupId: string,
        fixStrategy:
          | 'shorten_challenge'
          | 'extend_group'
          | 'report_only' = 'report_only'
      ): Promise<any> => {
        try {
          const { data, error } = await supabase.rpc('fix_schedule_alignment', {
            p_group_id: groupId,
            p_fix_strategy: fixStrategy,
          });

          if (error) {
            console.error('Error fixing schedule alignment:', error);
            throw error;
          }

          return data;
        } catch (error) {
          console.error('Error in fixScheduleAlignment:', error);
          throw error;
        }
      },

      validateChallengeSchedule: async (
        groupId: string,
        challengeId: string
      ): Promise<boolean> => {
        try {
          const alignmentInfo = await get().getScheduleAlignmentInfo(groupId);
          const challengeInfo = alignmentInfo.find(
            item => item.challenge_id === challengeId
          );

          if (!challengeInfo) {
            return false;
          }

          return challengeInfo.alignment_status === 'aligned';
        } catch (error) {
          console.error('Error in validateChallengeSchedule:', error);
          return false;
        }
      },

      getGroupScheduleData: async (groupId: string): Promise<any> => {
        try {
          const group = get().groups.find(g => g.id === groupId);
          const alignmentInfo = await get().getScheduleAlignmentInfo(groupId);

          return {
            group,
            alignmentInfo,
            totalChallenges: alignmentInfo.length,
            alignedChallenges: alignmentInfo.filter(
              item => item.alignment_status === 'aligned'
            ).length,
            misalignedChallenges: alignmentInfo.filter(
              item => item.alignment_status === 'misaligned'
            ).length,
            incompleteChallenges: alignmentInfo.filter(
              item => item.alignment_status === 'incomplete'
            ).length,
          };
        } catch (error) {
          console.error('Error in getGroupScheduleData:', error);
          return null;
        }
      },

      // Group accessibility and failure handling functions
      checkGroupAccessibility: async (groupId: string): Promise<boolean> => {
        try {
          const { data, error } = await supabase.rpc('is_group_accessible', {
            p_group_id: groupId,
          });

          if (error) {
            console.error('Error checking group accessibility:', error);
            return false;
          }

          return data === true;
        } catch (error) {
          console.error('Error in checkGroupAccessibility:', error);
          return false;
        }
      },

      getGroupRiskData: async (groupId: string) => {
        try {
          const { data, error } = await supabase.rpc('get_group_risk_data', {
            p_group_id: groupId,
          });

          if (error) {
            console.error('Error getting group risk data:', error);
            return null;
          }

          return decodeGroupRiskSnapshot(data, groupId);
        } catch (error) {
          console.error('Error in getGroupRiskData:', error);
          return null;
        }
      },

      updateGroupStatus: async (
        groupId: string,
        status: 'active' | 'failed' | 'expired',
        failureReason?: string
      ) => {
        try {
          const { error } = await supabase
            .from('teams')
            .update({
              status,
              failure_reason: failureReason || null,
              last_failure_date:
                status === 'failed'
                  ? new Date().toISOString().split('T')[0]
                  : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', groupId);

          if (error) {
            console.error('Error updating group status:', error);
            return false;
          }

          // Update local state
          set(state => ({
            groups: state.groups.map(group =>
              group.id === groupId
                ? { ...group, status, failure_reason: failureReason }
                : group
            ),
            userGroups: state.userGroups,
          }));

          return true;
        } catch (error) {
          console.error('Error in updateGroupStatus:', error);
          return false;
        }
      },

      useGroupFreeze: async (
        groupId: string,
        challengeId: string,
        userId: string
      ) => {
        try {
          const { data, error } = await supabase.rpc('use_group_freeze', {
            p_group_id: groupId,
            p_challenge_id: challengeId,
            p_user_id: userId,
          });

          if (error) {
            console.error('Error using group freeze:', error);
            return { success: false, error: error.message };
          }

          if (data && typeof data === 'object') {
            if (data.success) {
              return {
                success: true,
                remaining: data.remaining_freezes,
              };
            } else {
              return {
                success: false,
                error: data.error || 'Unknown error',
              };
            }
          }

          return {
            success: false,
            error: translate(
              'en-NZ',
              'sourceGate.groups.invalidServerResponse'
            ),
          };
        } catch (error) {
          console.error('Exception using group freeze:', error);
          return { success: false, error: (error as Error).message };
        }
      },

      checkUserCooldown: async (userId: string) => {
        try {
          // Check all groups user owns or is a member of for active cooldowns
          const { data: userGroupsData, error } = await supabase
            .from('team_members')
            .select('group_id, teams!inner(name, status, cooldown_until, kind)')
            .eq('user_id', userId);

          if (error) {
            console.error('Error checking user cooldown:', error);
            return { inCooldown: false };
          }

          const now = new Date();
          for (const row of userGroupsData || []) {
            const group = (row as any).teams;
            if (group?.kind === 'promise') continue;
            if (group?.cooldown_until && new Date(group.cooldown_until) > now) {
              return {
                inCooldown: true,
                cooldownUntil: group.cooldown_until,
                groupName: group.name,
              };
            }
          }

          return { inCooldown: false };
        } catch (error) {
          console.error('Exception checking user cooldown:', error);
          return { inCooldown: false };
        }
      },

      archiveFailedGroup: async (groupId: string, userId: string) => {
        try {
          const { data, error } = await supabase.rpc('archive_failed_group', {
            p_group_id: groupId,
            p_user_id: userId,
          });

          if (error) {
            console.error('Error archiving failed group:', error);
            return { success: false, error: error.message };
          }

          if (data && typeof data === 'object') {
            if (data.success) {
              // Update local state - move from active to archived
              set(state => ({
                groups: state.groups.map(g =>
                  g.id === groupId ? { ...g, archived_at: data.archived_at } : g
                ),
              }));
              return { success: true };
            } else {
              return {
                success: false,
                error: data.error || 'Unknown error',
              };
            }
          }

          return {
            success: false,
            error: translate(
              'en-NZ',
              'sourceGate.groups.invalidServerResponse'
            ),
          };
        } catch (error) {
          console.error('Exception archiving failed group:', error);
          return { success: false, error: (error as Error).message };
        }
      },

      fetchArchivedGroups: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('team_members')
            .select(
              `
              group_id,
              teams!inner(
                *
              )
            `
            )
            .eq('user_id', userId)
            .not('teams.archived_at', 'is', null)
            .order('archived_at', {
              ascending: false,
              foreignTable: 'teams',
            });

          if (error) {
            console.error('Error fetching archived groups:', error);
            throw new Error(error.message || 'Could not load archived groups.');
          }

          const archivedGroups = (data || [])
            .map((row: any) => row.teams)
            .filter(Boolean)
            .map((group: any) => normalizeGroupRow(group));

          return archivedGroups;
        } catch (error) {
          console.error('Exception fetching archived groups:', error);
          throw error instanceof Error
            ? error
            : new Error('Could not load archived groups.');
        }
      },
    }),
    {
      name: 'group-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Group membership is authoritative in Supabase and belongs to one
      // account. Do not rehydrate another account's groups while auth is still
      // resolving after an account is deleted and recreated on this device.
      partialize: () => ({
        groups: [],
        userGroups: [],
      }),
      version: 1,
      migrate: () => ({ groups: [], userGroups: [] }),
    }
  )
);
