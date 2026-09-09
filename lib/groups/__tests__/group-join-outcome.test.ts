import {
  resolveGroupJoinError,
  resolveGroupJoinOutcome,
} from '../group-join-outcome';

describe('group join outcome contract', () => {
  it('keeps the server-confirmed group receipt', () => {
    expect(
      resolveGroupJoinOutcome({
        success: true,
        group_id: 'group-1',
        group_name: 'Morning Miles',
        cost: 0,
      })
    ).toEqual({
      kind: 'joined',
      groupId: 'group-1',
      groupName: 'Morning Miles',
      cost: 0,
    });
  });

  it('keeps the already-member board destination without charging again', () => {
    expect(
      resolveGroupJoinOutcome({
        success: false,
        code: 'ALREADY_MEMBER',
        group_id: 'group-1',
        group_name: 'Morning Miles',
      })
    ).toMatchObject({
      kind: 'already_member',
      groupId: 'group-1',
      groupName: 'Morning Miles',
    });
  });

  it.each(['INVALID_CODE', 'EXPIRED_CODE', 'STALE_CODE', 'INVITE_NOT_ACTIVE'])(
    'describes %s as a stale invite without pretending it joined',
    code => {
      expect(resolveGroupJoinOutcome({ success: false, code })).toMatchObject({
        kind: 'stale_code',
        title: 'This invite is no longer active',
      });
    }
  );

  it('keeps insufficient balance distinct from a failed join', () => {
    expect(
      resolveGroupJoinOutcome({ success: false, code: 'INSUFFICIENT_BALANCE' })
    ).toMatchObject({ kind: 'funding_required' });
  });

  it('names the free active-group cap instead of asking the person to retry', () => {
    expect(
      resolveGroupJoinOutcome({ success: false, code: 'QUOTA_ACTIVE_GROUPS' })
    ).toMatchObject({
      kind: 'quota_limit',
      title: 'You’re at the free group limit',
    });
    expect(
      resolveGroupJoinError({ code: 'QUOTA_ACTIVE_GROUPS' })
    ).toMatchObject({ kind: 'quota_limit' });
  });

  it('maps a recovered auth error to a sign-in recovery state', () => {
    expect(
      resolveGroupJoinError({ status: 401, message: 'JWT session expired' })
    ).toMatchObject({ kind: 'session_required' });
  });

  it('keeps transport ambiguity as unconfirmed rather than claiming failure', () => {
    expect(
      resolveGroupJoinError(new Error('network unavailable'))
    ).toMatchObject({ kind: 'retryable_error', title: 'Join not confirmed' });
  });
});
