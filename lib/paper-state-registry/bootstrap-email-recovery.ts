export const BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES = [
  { id: 'BOOT-00', paperNodeId: '3DH-0', kind: 'bootstrap-loading' },
  { id: 'BOOT-01', paperNodeId: '3EE-0', kind: 'draft-found' },
  { id: 'BOOT-01B', paperNodeId: '3F7-0', kind: 'remove-draft' },
  { id: 'BOOT-02', paperNodeId: '3G0-0', kind: 'bootstrap-error' },
  { id: 'AUTH-02B', paperNodeId: '3VS-0', kind: 'apple-system-sheet' },
  { id: 'AUTH-03B', paperNodeId: '3Y7-0', kind: 'email-sign-in' },
  { id: 'AUTH-03C', paperNodeId: '3Z0-0', kind: 'email-busy' },
  { id: 'AUTH-03D', paperNodeId: '3ZT-0', kind: 'email-error' },
  { id: 'AUTH-03E', paperNodeId: '49I-0', kind: 'draft-resume' },
  { id: 'AUTH-04', paperNodeId: '4AK-0', kind: 'reset-request' },
  { id: 'AUTH-04B', paperNodeId: '4BS-0', kind: 'reset-sending' },
  { id: 'AUTH-05', paperNodeId: '4CS-0', kind: 'reset-receipt' },
  { id: 'AUTH-05B', paperNodeId: '4DU-0', kind: 'reset-cooldown' },
  { id: 'AUTH-06A', paperNodeId: '4EW-0', kind: 'new-password' },
  { id: 'AUTH-06B', paperNodeId: '4GG-0', kind: 'reset-expired' },
  { id: 'AUTH-06C', paperNodeId: '4HB-0', kind: 'password-updated' },
] as const;

export type BootstrapEmailRecoveryPaperStateId =
  (typeof BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES)[number]['id'];

export type BootstrapEmailRecoveryPaperState =
  (typeof BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES)[number];

export const getBootstrapEmailRecoveryPaperState = (
  id: BootstrapEmailRecoveryPaperStateId
): BootstrapEmailRecoveryPaperState => {
  const state = BOOTSTRAP_EMAIL_RECOVERY_PAPER_STATES.find(
    candidate => candidate.id === id
  );

  if (!state) {
    throw new Error(`Unknown Bootstrap/email recovery Paper state: ${id}`);
  }

  return state;
};
