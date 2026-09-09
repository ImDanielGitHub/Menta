import {
  canManageGroupMember,
  getGroupMemberLockReason,
  groupMemberRoleCopy,
  groupMemberRoleDescriptions,
  groupMemberRoleRank,
  type GroupMemberRole,
} from '@/lib/group-member-policy';

const member = (role: GroupMemberRole, userId = `${role}-user`) => ({
  role,
  userId,
});

describe('group member policy', () => {
  it('keeps the supported role hierarchy explicit', () => {
    expect(groupMemberRoleRank).toEqual({
      owner: 0,
      admin: 1,
      moderator: 2,
      member: 3,
    });
    expect(groupMemberRoleCopy.moderator).toBe('Moderator');
    expect(groupMemberRoleDescriptions.moderator).toContain('moderation');
  });

  it('allows owners to manage admins, moderators, and members but never owners or self', () => {
    expect(
      canManageGroupMember({
        actorRole: 'owner',
        actorUserId: 'owner-user',
        member: member('admin'),
      })
    ).toBe(true);
    expect(
      canManageGroupMember({
        actorRole: 'owner',
        actorUserId: 'owner-user',
        member: member('moderator'),
      })
    ).toBe(true);
    expect(
      canManageGroupMember({
        actorRole: 'owner',
        actorUserId: 'owner-user',
        member: member('member'),
      })
    ).toBe(true);
    expect(
      canManageGroupMember({
        actorRole: 'owner',
        actorUserId: 'owner-user',
        member: member('owner', 'other-owner'),
      })
    ).toBe(false);
    expect(
      canManageGroupMember({
        actorRole: 'owner',
        actorUserId: 'owner-user',
        member: member('owner', 'owner-user'),
      })
    ).toBe(false);
  });

  it('allows admins to manage moderators and members but not admins, owners, or self', () => {
    expect(
      canManageGroupMember({
        actorRole: 'admin',
        actorUserId: 'admin-user',
        member: member('moderator'),
      })
    ).toBe(true);
    expect(
      canManageGroupMember({
        actorRole: 'admin',
        actorUserId: 'admin-user',
        member: member('member'),
      })
    ).toBe(true);
    expect(
      canManageGroupMember({
        actorRole: 'admin',
        actorUserId: 'admin-user',
        member: member('admin', 'other-admin'),
      })
    ).toBe(false);
    expect(
      canManageGroupMember({
        actorRole: 'admin',
        actorUserId: 'admin-user',
        member: member('owner'),
      })
    ).toBe(false);
    expect(
      canManageGroupMember({
        actorRole: 'admin',
        actorUserId: 'admin-user',
        member: member('admin', 'admin-user'),
      })
    ).toBe(false);
  });

  it('keeps blocked-action reasons specific and user-facing', () => {
    expect(
      getGroupMemberLockReason({
        actorRole: 'owner',
        actorUserId: 'owner-user',
        member: member('owner', 'other-owner'),
      })
    ).toBe('Owners cannot be managed from this list.');
    expect(
      getGroupMemberLockReason({
        actorRole: 'admin',
        actorUserId: 'admin-user',
        member: member('admin', 'admin-user'),
      })
    ).toBe('This is you.');
    expect(
      getGroupMemberLockReason({
        actorRole: 'member',
        actorUserId: 'member-user',
        member: member('member', 'other-member'),
      })
    ).toBe('You do not have member management access.');
    expect(
      getGroupMemberLockReason({
        actorRole: 'admin',
        actorUserId: 'admin-user',
        member: member('admin', 'other-admin'),
      })
    ).toBe('Only owners can manage admins.');
  });
});
