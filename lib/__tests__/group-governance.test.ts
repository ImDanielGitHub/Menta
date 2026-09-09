import {
  confirmedGroupGovernance,
  getOwnerLeaveOutcome,
  needsGovernanceStateCheck,
  rejectedGroupGovernance,
  unknownGroupGovernance,
} from '@/lib/group-governance';

describe('group governance outcomes', () => {
  it('keeps confirmed actions distinct from a response-loss state check', () => {
    const directReceipt = confirmedGroupGovernance({
      action: 'delete-group',
      groupId: 'group-1',
      verifiedBy: 'mutation-response',
    });
    const recoveredReceipt = confirmedGroupGovernance({
      action: 'delete-group',
      groupId: 'group-1',
      verifiedBy: 'state-check',
    });

    expect(directReceipt).toMatchObject({
      kind: 'confirmed',
      receipt: { verifiedBy: 'mutation-response' },
    });
    expect(recoveredReceipt).toMatchObject({
      kind: 'confirmed',
      receipt: { verifiedBy: 'state-check' },
    });
  });

  it('requires a state check before replaying an unknown destructive action', () => {
    const outcome = unknownGroupGovernance(
      'remove-member',
      'The response was lost.'
    );

    expect(needsGovernanceStateCheck(outcome)).toBe(true);
    expect(
      needsGovernanceStateCheck(
        rejectedGroupGovernance('remove-member', 'The member is still here.')
      )
    ).toBe(false);
  });

  it('blocks an owner from leaving truthfully until a transfer backend exists', () => {
    expect(getOwnerLeaveOutcome({ memberCount: 1 })).toEqual(
      expect.objectContaining({
        kind: 'blocked',
        reason: 'sole-owner',
      })
    );
    expect(getOwnerLeaveOutcome({ memberCount: 3 })).toEqual(
      expect.objectContaining({
        kind: 'blocked',
        action: 'transfer-ownership',
        reason: 'transfer-backend-missing',
      })
    );
  });
});
