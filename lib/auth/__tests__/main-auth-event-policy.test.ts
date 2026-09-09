import {
  getMainAuthEventAction,
  shouldRejectMainAuthEvent,
} from '@/lib/auth/main-auth-event-policy';

describe('main auth event policy', () => {
  it('accepts an ordinary INITIAL_SESSION', () => {
    expect(getMainAuthEventAction('INITIAL_SESSION')).toBe('accept_session');
  });

  it('fails closed when PASSWORD_RECOVERY reaches the ordinary client', () => {
    expect(getMainAuthEventAction('PASSWORD_RECOVERY')).toBe(
      'reject_password_recovery'
    );
  });

  it('rejects INITIAL_SESSION after restart while recovery quarantine remains', () => {
    expect(
      shouldRejectMainAuthEvent({
        action: getMainAuthEventAction('INITIAL_SESSION'),
        hasRecoveryQuarantine: true,
      })
    ).toBe(true);
  });
});
