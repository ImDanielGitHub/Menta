import {
  getNotificationsPrivacyPaperState,
  NOTIFICATIONS_PRIVACY_PAPER_STATES,
} from '@/lib/paper-state-registry/notifications-privacy';

describe('notification and privacy Paper state registry', () => {
  it('registers the complete settings and onboarding contract with exact Paper nodes', () => {
    expect(
      NOTIFICATIONS_PRIVACY_PAPER_STATES.map(
        state => `${state.id}:${state.paperNodeId}`
      )
    ).toEqual([
      'NOT-03:C9O-0',
      'NOT-06:CB7-0',
      'NOT-07:CCQ-0',
      'NOT-08:CE9-0',
      'NOT-10:CHB-0',
      'NOT-11:CIU-0',
      'NOT-13:CLW-0',
      'NOT-16:CQH-0',
      'NOT-17:CS0-0',
      'INV-06:B4M-0',
      'YOU-05:AFT-0',
      'AUTH-07:8PO-0',
      'AUTH-08:8QU-0',
      'AUTH-09:8S0-0',
    ]);
  });

  it('keeps all references unique and every state tied to a live authority', () => {
    const ids = NOTIFICATIONS_PRIVACY_PAPER_STATES.map(state => state.id);
    const nodes = NOTIFICATIONS_PRIVACY_PAPER_STATES.map(
      state => state.paperNodeId
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(nodes).size).toBe(nodes.length);
    for (const state of NOTIFICATIONS_PRIVACY_PAPER_STATES) {
      expect(state.authority).not.toBe('');
      expect(getNotificationsPrivacyPaperState(state.id)).toBe(state);
    }
  });
});
