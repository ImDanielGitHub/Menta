import { useCallback, useState } from 'react';

import {
  checkMemberRemoval,
  checkRoleChange,
  getMemberName,
} from '@/components/group/admin/group-member-governance';
import {
  canManageGroupMember,
  getGroupMemberLockReason,
  type GroupMemberRole,
} from '@/lib/group-member-policy';
import {
  confirmedGroupGovernance,
  type GroupGovernanceOutcome,
} from '@/lib/group-governance';
import {
  createConfirmedReceipt,
  emitConfirmedSuccess,
  emitHaptic as emitSemanticHaptic,
} from '@/lib/motion/haptics';
import { supabase } from '@/lib/supabase';
import type { GroupMember } from '@/store/group-store';

type RoleChange = 'admin' | 'member';
export type MemberAction =
  | { type: 'promote'; member: GroupMember }
  | { type: 'demote'; member: GroupMember }
  | { type: 'remove'; member: GroupMember };
export type MemberNotice = {
  kind: 'error' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
} | null;

export const useGroupMemberActions = ({
  canManageMembers,
  groupId,
  isOwner,
  loadMembers,
  role,
  userId,
}: {
  canManageMembers: boolean;
  groupId?: string;
  isOwner: boolean;
  loadMembers: () => Promise<void>;
  role?: GroupMemberRole;
  userId?: string;
}) => {
  const [notice, setNotice] = useState<MemberNotice>(null);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(
    null
  );
  const [pendingAction, setPendingAction] = useState<MemberAction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const memberLockReason = useCallback(
    (member: GroupMember) =>
      getGroupMemberLockReason({
        actorRole: role,
        actorUserId: userId,
        member,
      }),
    [role, userId]
  );

  const openMemberActions = useCallback(
    (member: GroupMember) => {
      const lockReason = memberLockReason(member);
      if (!canManageMembers || lockReason) {
        setNotice({
          kind: 'info',
          title: 'Member cannot be changed',
          message:
            lockReason ||
            'This member list is read-only for your current role.',
        });
        return;
      }
      setSelectedMember(member);
    },
    [canManageMembers, memberLockReason]
  );

  const completeAction = useCallback(
    async (action: MemberAction) => {
      if (!groupId || actionLoading) return;
      const member = action.member;
      if (
        !canManageGroupMember({
          actorRole: role,
          actorUserId: userId,
          member,
        })
      ) {
        setNotice({
          kind: 'error',
          title: 'Member not changed',
          message: memberLockReason(member) || 'You cannot change this member.',
        });
        return;
      }
      if ((action.type === 'promote' || action.type === 'demote') && !isOwner) {
        setNotice({
          kind: 'error',
          title: 'Owner approval needed',
          message: 'Only the group owner can change member roles.',
        });
        return;
      }

      setActionLoading(member.userId);
      setNotice(null);
      try {
        let outcome: GroupGovernanceOutcome;
        if (action.type === 'remove') {
          const { data, error } = await supabase
            .from('team_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', member.userId)
            .select('user_id')
            .maybeSingle();
          outcome =
            !error && data
              ? confirmedGroupGovernance({
                  action: 'remove-member',
                  groupId,
                  targetUserId: member.userId,
                  verifiedBy: 'mutation-response',
                })
              : await checkMemberRemoval({ groupId, member });
        } else {
          const nextRole: RoleChange =
            action.type === 'promote' ? 'admin' : 'member';
          const { data, error } = await supabase
            .from('team_members')
            .update({ role: nextRole })
            .eq('group_id', groupId)
            .eq('user_id', member.userId)
            .select('role')
            .maybeSingle();
          outcome =
            !error && (data as { role?: RoleChange } | null)?.role === nextRole
              ? confirmedGroupGovernance({
                  action: 'change-role',
                  groupId,
                  targetUserId: member.userId,
                  verifiedBy: 'mutation-response',
                })
              : await checkRoleChange({ groupId, member, nextRole });
        }
        if (outcome.kind !== 'confirmed') {
          if (outcome.kind === 'unknown') {
            void emitSemanticHaptic({ type: 'unknown' });
          } else if (outcome.kind === 'blocked') {
            void emitSemanticHaptic({ type: 'blocked', reason: 'permission' });
          } else {
            void emitSemanticHaptic({
              type: 'failed',
              operation: action.type === 'remove' ? 'delete' : 'save',
            });
          }
          setNotice({
            kind: outcome.kind === 'unknown' ? 'warning' : 'error',
            title:
              outcome.kind === 'unknown'
                ? 'Member change not confirmed'
                : 'Member not changed',
            message: outcome.message,
          });
          return;
        }
        await loadMembers();
        const targetUserId = outcome.receipt.targetUserId?.trim();
        if (targetUserId) {
          void emitConfirmedSuccess(
            createConfirmedReceipt(
              action.type === 'remove' ? 'group-membership' : 'settings-save',
              `${outcome.receipt.action}:${outcome.receipt.groupId}:${targetUserId}`
            )
          );
        } else {
          void emitSemanticHaptic({ type: 'unknown' });
        }
        setNotice({
          kind: 'success',
          title: action.type === 'remove' ? 'Member removed' : 'Role updated',
          message:
            action.type === 'remove'
              ? `${getMemberName(member)} no longer belongs to this group.`
              : `${getMemberName(member)} is now ${
                  action.type === 'promote' ? 'admin' : 'a member'
                }.`,
        });
        setSelectedMember(null);
        setPendingAction(null);
      } catch {
        void emitSemanticHaptic({ type: 'unknown' });
        setNotice({
          kind: 'error',
          title: 'Member not changed',
          message:
            'Check your connection, check the member list again, and then retry the change.',
        });
      } finally {
        setActionLoading(null);
      }
    },
    [
      actionLoading,
      groupId,
      isOwner,
      loadMembers,
      memberLockReason,
      role,
      userId,
    ]
  );

  return {
    actionLoading,
    completeAction,
    memberLockReason,
    notice,
    openMemberActions,
    pendingAction,
    selectedMember,
    setPendingAction,
    setSelectedMember,
  };
};
