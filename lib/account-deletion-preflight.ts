import { getMyProAuthority, type MyProAuthority } from '@/lib/profile-api';
import { supabase } from '@/lib/supabase';

export type AccountDeletionOwnedGroup = {
  id: string;
  kind: 'promise' | 'saved';
  name: string;
  otherMemberCount: number;
  status: string;
  /** The current deletion function removes this owner-linked group. */
  willBeDeleted: true;
};

export type AccountDeletionPreflightUnknownReason =
  | 'offline'
  | 'session-unavailable'
  | 'account-changed'
  | 'ownership-unavailable'
  | 'subscription-unavailable'
  | 'subscription-reconciling';

export type AccountDeletionPreflight =
  | {
      canProceed: false;
      reason: AccountDeletionPreflightUnknownReason;
      status: 'unknown';
    }
  | {
      account: { status: 'verified'; userId: string };
      canProceed: boolean;
      ownership:
        | {
            groups: AccountDeletionOwnedGroup[];
            status: 'clear';
          }
        | {
            blockingGroups: AccountDeletionOwnedGroup[];
            groups: AccountDeletionOwnedGroup[];
            status: 'blocked';
          };
      status: 'resolved';
      subscription: { status: 'active' | 'inactive' };
    };

type AccountDeletionPreflightDependencies = {
  readCurrentUserId: () => Promise<string | null>;
  readOwnedGroups: (
    expectedUserId: string
  ) => Promise<AccountDeletionOwnedGroup[]>;
  readProAuthority: () => Promise<MyProAuthority | null>;
};

type AccountDeletionPreflightInput = {
  expectedUserId: string;
  isOnline: boolean;
};

type OwnedGroupRow = {
  id: string;
  kind: string;
  name: string;
  status: string;
};

type GroupMemberRow = {
  group_id: string;
  user_id: string;
};

const isOwnedGroupRow = (value: unknown): value is OwnedGroupRow => {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Partial<OwnedGroupRow>;
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    (row.kind === 'saved' || row.kind === 'promise') &&
    typeof row.name === 'string' &&
    row.name.trim().length > 0 &&
    typeof row.status === 'string' &&
    row.status.length > 0
  );
};

const isGroupMemberRow = (value: unknown): value is GroupMemberRow => {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Partial<GroupMemberRow>;
  return (
    typeof row.group_id === 'string' &&
    row.group_id.length > 0 &&
    typeof row.user_id === 'string' &&
    row.user_id.length > 0
  );
};

const readCurrentUserId = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
};

const readOwnedGroups = async (
  expectedUserId: string
): Promise<AccountDeletionOwnedGroup[]> => {
  const { data: groupData, error: groupError } = await supabase
    .from('teams')
    .select('id, name, kind, status')
    .eq('owner_id', expectedUserId)
    .order('created_at', { ascending: true });

  if (groupError) throw groupError;

  const rawGroups: unknown[] = Array.isArray(groupData) ? groupData : [];
  if (!rawGroups.every(isOwnedGroupRow)) {
    throw new Error('ACCOUNT_DELETION_OWNERSHIP_UNREADABLE');
  }
  const groups = rawGroups as OwnedGroupRow[];
  if (groups.length === 0) return [];

  const groupIds = groups.map(group => group.id);
  const { data: memberData, error: memberError } = await supabase
    .from('team_members')
    .select('group_id, user_id')
    .in('group_id', groupIds);

  if (memberError) throw memberError;

  const rawMembers: unknown[] = Array.isArray(memberData) ? memberData : [];
  if (!rawMembers.every(isGroupMemberRow)) {
    throw new Error('ACCOUNT_DELETION_MEMBERSHIP_UNREADABLE');
  }
  const members = rawMembers as GroupMemberRow[];

  return groups.map(group => {
    const groupMembers = members.filter(member => member.group_id === group.id);
    // Every supported group-creation path records the owner as a member. If
    // that invariant is missing, fail closed instead of mistaking hidden or
    // malformed membership data for a safe-to-delete private group.
    if (!groupMembers.some(member => member.user_id === expectedUserId)) {
      throw new Error('ACCOUNT_DELETION_OWNER_MEMBERSHIP_UNCONFIRMED');
    }

    return {
      id: group.id,
      kind: group.kind as 'promise' | 'saved',
      name: group.name.trim(),
      otherMemberCount: groupMembers.filter(
        member => member.user_id !== expectedUserId
      ).length,
      status: group.status,
      willBeDeleted: true,
    };
  });
};

const defaultDependencies: AccountDeletionPreflightDependencies = {
  readCurrentUserId,
  readOwnedGroups,
  readProAuthority: getMyProAuthority,
};

/**
 * Builds one read-only account-deletion preflight reader. The injected form
 * keeps the authority and gating states independently testable without
 * replacing the production Supabase client.
 */
export const createAccountDeletionPreflightReader =
  (dependencies: AccountDeletionPreflightDependencies) =>
  async ({
    expectedUserId,
    isOnline,
  }: AccountDeletionPreflightInput): Promise<AccountDeletionPreflight> => {
    if (!isOnline) {
      return { canProceed: false, reason: 'offline', status: 'unknown' };
    }

    let currentUserId: string | null;
    try {
      currentUserId = await dependencies.readCurrentUserId();
    } catch {
      return {
        canProceed: false,
        reason: 'session-unavailable',
        status: 'unknown',
      };
    }

    if (!currentUserId) {
      return {
        canProceed: false,
        reason: 'session-unavailable',
        status: 'unknown',
      };
    }
    if (currentUserId !== expectedUserId) {
      return {
        canProceed: false,
        reason: 'account-changed',
        status: 'unknown',
      };
    }

    const [ownedGroupsResult, proAuthorityResult] = await Promise.allSettled([
      dependencies.readOwnedGroups(expectedUserId),
      dependencies.readProAuthority(),
    ]);

    if (ownedGroupsResult.status === 'rejected') {
      return {
        canProceed: false,
        reason: 'ownership-unavailable',
        status: 'unknown',
      };
    }
    if (
      proAuthorityResult.status === 'rejected' ||
      proAuthorityResult.value === null
    ) {
      return {
        canProceed: false,
        reason: 'subscription-unavailable',
        status: 'unknown',
      };
    }
    if (proAuthorityResult.value.reconciliation_pending) {
      return {
        canProceed: false,
        reason: 'subscription-reconciling',
        status: 'unknown',
      };
    }

    const groups = ownedGroupsResult.value;
    const blockingGroups = groups.filter(group => group.otherMemberCount > 0);
    const ownership =
      blockingGroups.length > 0
        ? ({ blockingGroups, groups, status: 'blocked' } as const)
        : ({ groups, status: 'clear' } as const);

    return {
      account: { status: 'verified', userId: expectedUserId },
      canProceed: ownership.status === 'clear',
      ownership,
      status: 'resolved',
      subscription: {
        status: proAuthorityResult.value.is_pro ? 'active' : 'inactive',
      },
    };
  };

export const readAccountDeletionPreflight =
  createAccountDeletionPreflightReader(defaultDependencies);

export const canOpenAccountDeletionConfirmation = (
  preflight: AccountDeletionPreflight | null
): boolean => preflight?.status === 'resolved' && preflight.canProceed;
