import type { GroupMember } from '@/store/group-store';

export type GroupMemberRole = GroupMember['role'];

export const groupMemberRoleRank: Record<GroupMemberRole, number> = {
  owner: 0,
  admin: 1,
  moderator: 2,
  member: 3,
};

export const groupMemberRoleCopy: Record<GroupMemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  moderator: 'Moderator',
  member: 'Member',
};

export const groupMemberRoleDescriptions: Record<GroupMemberRole, string> = {
  owner: 'Controls roles, settings, invites, and deletion.',
  admin: 'Can help manage members without owning the group.',
  moderator: 'Can support group moderation where enabled.',
  member: 'Can join challenges and submit proof.',
};

export function canManageGroupMember({
  actorRole,
  actorUserId,
  member,
}: {
  actorRole?: GroupMemberRole | null;
  actorUserId?: string | null;
  member: Pick<GroupMember, 'role' | 'userId'>;
}) {
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return false;
  }
  if (member.role === 'owner') {
    return false;
  }
  if (member.userId === actorUserId) {
    return false;
  }
  if (actorRole === 'owner') {
    return true;
  }
  return member.role !== 'admin';
}

export function getGroupMemberLockReason({
  actorRole,
  actorUserId,
  member,
}: {
  actorRole?: GroupMemberRole | null;
  actorUserId?: string | null;
  member: Pick<GroupMember, 'role' | 'userId'>;
}) {
  if (member.role === 'owner') {
    return 'Owners cannot be managed from this list.';
  }
  if (member.userId === actorUserId) {
    return 'This is you.';
  }
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return 'You do not have member management access.';
  }
  if (actorRole !== 'owner' && member.role === 'admin') {
    return 'Only owners can manage admins.';
  }
  return null;
}
