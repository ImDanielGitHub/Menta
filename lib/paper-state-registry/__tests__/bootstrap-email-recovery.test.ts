import {
  BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES,
  getBootstrapEmailRecoveryPaperState,
} from '@/lib/paper-state-registry/bootstrap-email-recovery';

describe('Bootstrap and email-recovery Paper state registry', () => {
  it('keeps the complete 16-state family mapped to its exact Paper artboards', () => {
    expect(BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES).toHaveLength(16);
    expect(
      BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES.map(
        state => `${state.id}:${state.paperNodeId}`
      )
    ).toEqual([
      'BOOT-00:3DH-0',
      'BOOT-01:3EE-0',
      'BOOT-01B:3F7-0',
      'BOOT-02:3G0-0',
      'AUTH-02B:3VS-0',
      'AUTH-03B:3Y7-0',
      'AUTH-03C:3Z0-0',
      'AUTH-03D:3ZT-0',
      'AUTH-03E:49I-0',
      'AUTH-04:4AK-0',
      'AUTH-04B:4BS-0',
      'AUTH-05:4CS-0',
      'AUTH-05B:4DU-0',
      'AUTH-06A:4EW-0',
      'AUTH-06B:4GG-0',
      'AUTH-06C:4HB-0',
    ]);
  });

  it('exposes no fake recovery authority beyond the explicitly mapped state', () => {
    expect(getBootstrapEmailRecoveryPaperState('AUTH-06B').kind).toBe(
      'reset-expired'
    );
    expect(getBootstrapEmailRecoveryPaperState('AUTH-06C').kind).toBe(
      'password-updated'
    );
  });
});
