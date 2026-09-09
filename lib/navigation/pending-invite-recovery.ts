import type { InviteProcessResult } from '@/store/invite-store';
import { translate } from '@/lib/localization/translate';

type PendingInviteRecoveryTone = 'info' | 'error';

export type PendingInviteRecoveryFeedback = {
  title: string;
  message: string;
  tone: PendingInviteRecoveryTone;
};

export const getPendingInviteProcessFeedback = (
  result: InviteProcessResult,
  options: {
    includeNone?: boolean;
  } = {}
): PendingInviteRecoveryFeedback | null => {
  if (result.status === 'none') {
    if (!options.includeNone) return null;

    return {
      title: translate('en-NZ', 'groups.navigation.no_saved_title'),
      message: translate('en-NZ', 'groups.navigation.no_saved_detail'),
      tone: 'info',
    };
  }

  if (result.status === 'preview_required') {
    const inviteType = result.invite.type;
    return {
      title: translate('en-NZ', 'groups.navigation.ready_title'),
      message:
        inviteType === 'challenge'
          ? translate('en-NZ', 'groups.navigation.promise_ready_detail')
          : translate('en-NZ', 'groups.navigation.group_ready_detail'),
      tone: 'info',
    };
  }

  return {
    title: translate('en-NZ', 'groups.navigation.invalid_title'),
    message: translate('en-NZ', 'groups.navigation.invalid_detail'),
    tone: 'error',
  };
};

export const getSavedInviteClearedFeedback =
  (): PendingInviteRecoveryFeedback => ({
    title: translate('en-NZ', 'groups.navigation.cleared_title'),
    message: translate('en-NZ', 'groups.navigation.cleared_detail'),
    tone: 'info',
  });
