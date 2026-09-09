/**
 * A destructive group action is only complete when Menta has a trustworthy
 * receipt. A transport error is not proof that the action did not happen.
 */
export type GroupGovernanceAction =
  | 'delete-group'
  | 'leave-group'
  | 'change-role'
  | 'remove-member'
  | 'transfer-ownership';

export type GroupGovernanceReceipt = {
  action: GroupGovernanceAction;
  groupId: string;
  targetUserId?: string;
  verifiedBy: 'mutation-response' | 'state-check';
};

export type GroupGovernanceOutcome =
  | {
      kind: 'confirmed';
      receipt: GroupGovernanceReceipt;
    }
  | {
      kind: 'rejected';
      action: GroupGovernanceAction;
      message: string;
    }
  | {
      kind: 'unknown';
      action: GroupGovernanceAction;
      message: string;
      requiresStateCheck: true;
    }
  | {
      kind: 'blocked';
      action: GroupGovernanceAction;
      message: string;
      reason: 'owner-only' | 'sole-owner' | 'transfer-backend-missing';
    };

export const confirmedGroupGovernance = (
  receipt: GroupGovernanceReceipt
): GroupGovernanceOutcome => ({ kind: 'confirmed', receipt });

export const rejectedGroupGovernance = (
  action: GroupGovernanceAction,
  message: string
): GroupGovernanceOutcome => ({ kind: 'rejected', action, message });

export const unknownGroupGovernance = (
  action: GroupGovernanceAction,
  message: string
): GroupGovernanceOutcome => ({
  kind: 'unknown',
  action,
  message,
  requiresStateCheck: true,
});

export const blockedGroupGovernance = (
  action: GroupGovernanceAction,
  reason: Extract<GroupGovernanceOutcome, { kind: 'blocked' }>['reason'],
  message: string
): GroupGovernanceOutcome => ({ kind: 'blocked', action, reason, message });

export const needsGovernanceStateCheck = (outcome: GroupGovernanceOutcome) =>
  outcome.kind === 'unknown' && outcome.requiresStateCheck;

/**
 * There is no atomic owner-transfer endpoint in the current backend. Never
 * offer an owner a leave path which could orphan the group or pretend a role
 * update changed `teams.owner_id`.
 */
export const getOwnerLeaveOutcome = ({
  memberCount,
}: {
  memberCount: number;
}): GroupGovernanceOutcome => {
  if (memberCount <= 1) {
    return blockedGroupGovernance(
      'leave-group',
      'sole-owner',
      'Menta cannot transfer group ownership yet. You can keep the group or delete it permanently.'
    );
  }

  return blockedGroupGovernance(
    'transfer-ownership',
    'transfer-backend-missing',
    'Menta cannot transfer group ownership yet. You can keep the group or delete it permanently.'
  );
};
