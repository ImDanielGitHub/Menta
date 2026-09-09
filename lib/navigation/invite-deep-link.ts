import { parseInviteLink } from '@/lib/invite-links';

export type InviteDeepLinkAction =
  | {
      kind: 'open_group_join';
      code: string;
    }
  | {
      kind: 'save_group';
      code: string;
    }
  | {
      kind: 'open_challenge_preview';
      code: string;
    }
  | {
      kind: 'save_challenge';
      code: string;
    };

export const getInviteDeepLinkAction = (
  url: string,
  readyToAccept: boolean
): InviteDeepLinkAction | null => {
  const invite = parseInviteLink(url, 'group');
  if (!invite) return null;

  if (invite.kind === 'group') {
    return {
      kind: readyToAccept ? 'open_group_join' : 'save_group',
      code: invite.code,
    };
  }

  return {
    kind: readyToAccept ? 'open_challenge_preview' : 'save_challenge',
    code: invite.code,
  };
};
