import { resolvePendingInviteOpenAction } from '@/lib/navigation/pending-invite-open';
import type { PendingInvite } from '@/store/invite-store';

const groupInvite: PendingInvite = {
  type: 'group',
  code: 'ABC123',
  timestamp: 1780270000000,
};

const challengeInvite: PendingInvite = {
  type: 'challenge',
  code: 'FIT2026',
  timestamp: 1780270000000,
};

describe('pending invite open action', () => {
  it('opens manual entry by default when no invite is saved', () => {
    expect(
      resolvePendingInviteOpenAction({
        pendingInvite: null,
      })
    ).toEqual({ kind: 'open_manual_entry' });
  });

  it('can return no-saved-invite feedback for visible retry surfaces', () => {
    expect(
      resolvePendingInviteOpenAction({
        pendingInvite: null,
        noPendingAction: 'feedback',
      })
    ).toEqual({
      kind: 'feedback',
      feedback: {
        title: 'No saved invite',
        message: 'Paste a code or open a new invite link.',
        tone: 'info',
      },
      status: 'none',
    });
  });

  it('opens a saved group invite as a pure preview decision', () => {
    expect(
      resolvePendingInviteOpenAction({
        pendingInvite: groupInvite,
        userId: 'user-1',
      })
    ).toEqual({
      kind: 'open_group_invite',
      code: 'ABC123',
    });
  });

  it('requires auth before opening saved challenge invites', () => {
    expect(
      resolvePendingInviteOpenAction({
        pendingInvite: challengeInvite,
      })
    ).toEqual({
      kind: 'feedback',
      feedback: {
        title: 'Sign in required',
        message: 'Log in before opening this invite.',
        tone: 'error',
      },
      status: 'auth_required',
    });
  });

  it('opens a saved challenge invite in funding preview without accepting it', () => {
    expect(
      resolvePendingInviteOpenAction({
        pendingInvite: challengeInvite,
        userId: 'user-1',
      })
    ).toEqual({
      kind: 'open_challenge_invite',
      code: 'FIT2026',
    });
  });
});
