import {
  getProofRecoveryPaperState,
  PROOF_RECOVERY_PAPER_STATES,
} from '@/lib/paper-state-registry/proof-recovery';

describe('proof recovery Paper registry', () => {
  it('keeps all ten assigned Paper states explicit and unique', () => {
    expect(PROOF_RECOVERY_PAPER_STATES).toHaveLength(10);
    expect(
      PROOF_RECOVERY_PAPER_STATES.map(
        state => `${state.id}:${state.paperNodeId}`
      )
    ).toEqual([
      'PROOF-00A:99K-0',
      'PROOF-01TB:A4I-0',
      'PROOF-04B:KY-0',
      'PROOF-08B:A4N-0',
      'PROOF-08R:A4O-0',
      'PROOF-11D:A4P-0',
      'PROOF-12L:A4Q-0',
      'REV-02B:2CN-0',
      'STREAK-04:9FM-0',
      'STREAK-05:9FN-0',
    ]);
  });

  it('keeps decisions and milestones behind their required authority', () => {
    expect(getProofRecoveryPaperState('REV-02B').decisionGate).toBe(
      'evidence-opened'
    );
    expect(getProofRecoveryPaperState('PROOF-08R').authority).toBe(
      'server-receipt'
    );
    expect(getProofRecoveryPaperState('STREAK-05').authority).toBe(
      'server-receipt'
    );
  });

  it('uses separate crop and full-view media roles', () => {
    expect(getProofRecoveryPaperState('PROOF-11D').mediaRole).toBe(
      'walking-proof-crop'
    );
    expect(getProofRecoveryPaperState('PROOF-12L').mediaRole).toBe(
      'walking-proof-full'
    );
  });
});
