import {
  confirmedGroupGovernance,
  rejectedGroupGovernance,
  unknownGroupGovernance,
  type GroupGovernanceOutcome,
} from '@/lib/group-governance';
import { resolveGroupMemberIdentityName } from '@/lib/groups/member-identity-copy';
import {
  groupMemberRoleCopy,
  type GroupMemberRole,
} from '@/lib/group-member-policy';
import { supabase } from '@/lib/supabase';
import type { GroupMember } from '@/store/group-store';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

type RoleChange = 'admin' | 'member';

export const getMemberName = (
  member: GroupMember,
  translateCopy?: TranslateCopy
) => resolveGroupMemberIdentityName(member, translateCopy);

export const checkRoleChange = async ({
  groupId,
  member,
  nextRole,
}: {
  groupId: string;
  member: GroupMember;
  nextRole: RoleChange;
}): Promise<GroupGovernanceOutcome> => {
  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', member.userId)
    .maybeSingle();
  if (error) {
    return unknownGroupGovernance(
      'change-role',
      'Menta could not verify the member role. Refresh members before trying again.'
    );
  }
  const role = (data as { role?: GroupMemberRole } | null)?.role;
  if (role === nextRole) {
    return confirmedGroupGovernance({
      action: 'change-role',
      groupId,
      targetUserId: member.userId,
      verifiedBy: 'state-check',
    });
  }
  if (role === member.role) {
    return rejectedGroupGovernance(
      'change-role',
      `${getMemberName(member)} is still ${groupMemberRoleCopy[member.role].toLowerCase()}. Nothing changed.`
    );
  }
  return unknownGroupGovernance(
    'change-role',
    'The member role changed unexpectedly. Refresh members before making another change.'
  );
};

export const checkMemberRemoval = async ({
  groupId,
  member,
}: {
  groupId: string;
  member: GroupMember;
}): Promise<GroupGovernanceOutcome> => {
  const { data, error } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', member.userId)
    .maybeSingle();
  if (error) {
    return unknownGroupGovernance(
      'remove-member',
      'Menta could not verify this membership. Refresh members before trying again.'
    );
  }
  if (!data) {
    return confirmedGroupGovernance({
      action: 'remove-member',
      groupId,
      targetUserId: member.userId,
      verifiedBy: 'state-check',
    });
  }
  return rejectedGroupGovernance(
    'remove-member',
    `${getMemberName(member)} is still a member. Nothing changed.`
  );
};
