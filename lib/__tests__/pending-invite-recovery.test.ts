import {
  getPendingInviteProcessFeedback,
  getSavedInviteClearedFeedback,
} from '@/lib/navigation/pending-invite-recovery';
import type { InviteProcessResult } from '@/store/invite-store';

const pendingGroup = {
  type: 'group' as const,
  code: 'ABC123',
  timestamp: 1780270000000,
};

const pendingChallenge = {
  type: 'challenge' as const,
  code: 'FIT2026',
  timestamp: 1780270000000,
};

describe('pending invite recovery feedback', () => {
  it('keeps an empty queue quiet by default', () => {
    expect(getPendingInviteProcessFeedback({ status: 'none' })).toBeNull();
  });

  it('can explain an empty queue for explicit retry surfaces', () => {
    expect(
      getPendingInviteProcessFeedback({ status: 'none' }, { includeNone: true })
    ).toEqual({
      title: 'No saved invite',
      message: 'Paste a code or open a new invite link.',
      tone: 'info',
    });
  });

  it('describes saved group invites as preview-only recovery', () => {
    expect(
      getPendingInviteProcessFeedback({
        status: 'preview_required',
        invite: pendingGroup,
      })
    ).toEqual({
      title: 'Invite ready to check',
      message: 'See the group before you decide whether to join.',
      tone: 'info',
    });
  });

  it('describes saved challenge invites as join-terms preview recovery', () => {
    const result: InviteProcessResult = {
      status: 'preview_required',
      invite: pendingChallenge,
    };

    expect(getPendingInviteProcessFeedback(result)).toEqual({
      title: 'Invite ready to check',
      message: 'See the promise and its join terms before anything changes.',
      tone: 'info',
    });
  });

  it('explains malformed saved invites as stale recovery', () => {
    const result: InviteProcessResult = {
      status: 'cleared',
      reason: 'malformed',
      invite: pendingGroup,
    };

    expect(getPendingInviteProcessFeedback(result)).toEqual({
      title: 'Invite no longer valid',
      message: 'The saved code cannot be used. Ask for a new invite link.',
      tone: 'error',
    });
  });

  it('keeps manual clear feedback consistent', () => {
    expect(getSavedInviteClearedFeedback()).toEqual({
      title: 'Saved invite cleared',
      message: 'Menta will wait for a new link.',
      tone: 'info',
    });
  });
});
