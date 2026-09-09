import type { PendingInvite } from '@/store/invite-store';
import {
  getPendingInviteProcessFeedback,
  type PendingInviteRecoveryFeedback,
} from '@/lib/navigation/pending-invite-recovery';
import { translate } from '@/lib/localization/translate';

export type PendingInviteOpenFeedbackStatus = 'none' | 'auth_required';

export type PendingInviteOpenAction =
  | { kind: 'open_manual_entry' }
  | { kind: 'open_group_invite'; code: string }
  | { kind: 'open_challenge_invite'; code: string }
  | {
      kind: 'feedback';
      feedback: PendingInviteRecoveryFeedback;
      status: PendingInviteOpenFeedbackStatus;
    }
  | { kind: 'quiet' };

export type PendingInviteNoPendingAction =
  | 'manual_entry'
  | 'feedback'
  | 'quiet';

export const resolvePendingInviteOpenAction = ({
  pendingInvite,
  userId,
  noPendingAction = 'manual_entry',
}: {
  pendingInvite: PendingInvite | null;
  userId?: string | null;
  noPendingAction?: PendingInviteNoPendingAction;
}): PendingInviteOpenAction => {
  if (!pendingInvite) {
    if (noPendingAction === 'manual_entry') {
      return { kind: 'open_manual_entry' };
    }

    if (noPendingAction === 'feedback') {
      const feedback = getPendingInviteProcessFeedback(
        { status: 'none' },
        { includeNone: true }
      );

      return feedback
        ? {
            kind: 'feedback',
            feedback,
            status: 'none',
          }
        : { kind: 'quiet' };
    }

    return { kind: 'quiet' };
  }

  if (pendingInvite.type === 'group') {
    return {
      kind: 'open_group_invite',
      code: pendingInvite.code,
    };
  }

  if (!userId) {
    return {
      kind: 'feedback',
      feedback: {
        title: translate('en-NZ', 'groups.navigation.sign_in_title'),
        message: translate('en-NZ', 'groups.navigation.sign_in_detail'),
        tone: 'error',
      },
      status: 'auth_required',
    };
  }

  return {
    kind: 'open_challenge_invite',
    code: pendingInvite.code,
  };
};
