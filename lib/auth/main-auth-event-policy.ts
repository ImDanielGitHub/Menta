import type { AuthChangeEvent } from '@supabase/supabase-js';

export type MainAuthEventAction =
  | 'accept_session'
  | 'clear_session'
  | 'refresh_user'
  | 'reject_password_recovery'
  | 'ignore';

export const getMainAuthEventAction = (
  event: AuthChangeEvent
): MainAuthEventAction => {
  switch (event) {
    case 'INITIAL_SESSION':
    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
      return 'accept_session';
    case 'SIGNED_OUT':
      return 'clear_session';
    case 'USER_UPDATED':
      return 'refresh_user';
    case 'PASSWORD_RECOVERY':
      return 'reject_password_recovery';
    default:
      return 'ignore';
  }
};

export const shouldRejectMainAuthEvent = ({
  action,
  hasRecoveryQuarantine,
}: {
  action: MainAuthEventAction;
  hasRecoveryQuarantine: boolean;
}) =>
  action === 'reject_password_recovery' ||
  (action === 'accept_session' && hasRecoveryQuarantine);
