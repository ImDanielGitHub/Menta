export type SettingsAccountPaperStateId =
  | 'YOU-00'
  | 'YOU-01'
  | 'YOU-03'
  | 'YOU-04'
  | 'OUT-02'
  | 'OUT-04'
  | 'DEL-01'
  | 'DEL-02'
  | 'DEL-03'
  | 'DEL-04'
  | 'DEL-06'
  | 'DEL-07'
  | 'DEL-09'
  | 'DEL-14'
  | 'NOT-01'
  | 'SET-00'
  | 'SET-01'
  | 'SET-02'
  | 'SET-03'
  | 'INV-01'
  | 'INV-02'
  | 'INV-03'
  | 'INV-04'
  | 'INV-05'
  | 'INV-06';

export type SettingsAccountPaperState = {
  id: SettingsAccountPaperStateId;
  paperNodeId: string;
  route: 'profile' | 'settings' | 'notifications' | 'public';
  title: string;
  eyebrow: string;
  summary: string;
  kind:
    | 'skeleton'
    | 'first-use'
    | 'pro'
    | 'partial-refresh'
    | 'signing-out'
    | 'sign-out-failed'
    | 'deletion-preflight'
    | 'ownership-blocked'
    | 'subscription-notice'
    | 'consequence-review'
    | 'typed-confirmation'
    | 'reauthentication'
    | 'rate-limited'
    | 'signed-out'
    | 'notifications-error'
    | 'settings-skeleton'
    | 'settings-loaded'
    | 'settings-cached-offline'
    | 'settings-partial-error'
    | 'invite-ready'
    | 'invite-preparing'
    | 'invite-handoff'
    | 'invite-returned'
    | 'invite-copied'
    | 'invite-unavailable';
};

/**
 * Family-scoped deterministic inputs for the Paper gallery. These values are
 * deliberately presentation-only: real routes supply account/server data and
 * must never use the sample ownership, entitlement, retention, or retry facts
 * as a fallback.
 */
export const settingsAccountPaperStates: readonly SettingsAccountPaperState[] =
  [
    {
      id: 'YOU-00',
      paperNodeId: '9US-0',
      route: 'profile',
      title: 'You',
      eyebrow: 'YOU',
      summary: 'Structure-shaped account loading.',
      kind: 'skeleton',
    },
    {
      id: 'YOU-01',
      paperNodeId: 'AC7-0',
      route: 'profile',
      title: 'A fresh start',
      eyebrow: 'YOU',
      summary: 'First-use profile without invented progress.',
      kind: 'first-use',
    },
    {
      id: 'YOU-03',
      paperNodeId: 'ADR-0',
      route: 'profile',
      title: 'Pro active',
      eyebrow: 'MENTA PRO',
      summary: 'Confirmed entitlement only.',
      kind: 'pro',
    },
    {
      id: 'YOU-04',
      paperNodeId: '82G-0',
      route: 'profile',
      title: 'Partial refresh',
      eyebrow: 'PARTIAL REFRESH',
      summary: 'Confirmed profile totals with a stale activity receipt.',
      kind: 'partial-refresh',
    },
    {
      id: 'OUT-02',
      paperNodeId: 'CTJ-0',
      route: 'settings',
      title: 'Sign out',
      eyebrow: 'SIGNING OUT',
      summary: 'Device-session sign-out in progress.',
      kind: 'signing-out',
    },
    {
      id: 'OUT-04',
      paperNodeId: 'CWL-0',
      route: 'settings',
      title: 'Still signed in',
      eyebrow: 'STILL SIGNED IN',
      summary: 'A failed local clear leaves the signed-in state authoritative.',
      kind: 'sign-out-failed',
    },
    {
      id: 'DEL-01',
      paperNodeId: 'CY4-0',
      route: 'settings',
      title: 'Checking first',
      eyebrow: 'CHECKING FIRST',
      summary: 'Read-only ownership, subscription, and account preflight.',
      kind: 'deletion-preflight',
    },
    {
      id: 'DEL-02',
      paperNodeId: 'CZN-0',
      route: 'settings',
      title: 'Resolve ownership',
      eyebrow: 'RESOLVE OWNERSHIP',
      summary: 'Server-owned deletion blockers.',
      kind: 'ownership-blocked',
    },
    {
      id: 'DEL-03',
      paperNodeId: 'D16-0',
      route: 'settings',
      title: 'Subscription notice',
      eyebrow: 'SUBSCRIPTION NOTICE',
      summary:
        'A system subscription handoff does not cancel an account deletion.',
      kind: 'subscription-notice',
    },
    {
      id: 'DEL-04',
      paperNodeId: 'D2P-0',
      route: 'settings',
      title: 'Review consequences',
      eyebrow: 'REVIEW CONSEQUENCES',
      summary: 'Server-specific deletion consequences.',
      kind: 'consequence-review',
    },
    {
      id: 'DEL-06',
      paperNodeId: '6OW-0',
      route: 'settings',
      title: 'Delete account',
      eyebrow: 'PERMANENT ACTION',
      summary: 'Typed confirmation before the final request.',
      kind: 'typed-confirmation',
    },
    {
      id: 'DEL-07',
      paperNodeId: 'D48-0',
      route: 'settings',
      title: 'Verify identity',
      eyebrow: 'VERIFY IDENTITY',
      summary: 'Fresh sign-in preserves intent only for the same account.',
      kind: 'reauthentication',
    },
    {
      id: 'DEL-09',
      paperNodeId: 'D7A-0',
      route: 'settings',
      title: 'Try again later',
      eyebrow: 'TRY AGAIN LATER',
      summary: 'Server-owned deletion retry cooldown.',
      kind: 'rate-limited',
    },
    {
      id: 'DEL-14',
      paperNodeId: 'DDE-0',
      route: 'public',
      title: 'Signed out',
      eyebrow: 'PUBLIC DESTINATION',
      summary: 'Public/auth entry without data from a former account.',
      kind: 'signed-out',
    },
    {
      id: 'NOT-01',
      paperNodeId: 'C85-0',
      route: 'notifications',
      title: 'Notifications',
      eyebrow: 'NOT AVAILABLE',
      summary: 'Notification preferences fetch failure.',
      kind: 'notifications-error',
    },
    {
      id: 'SET-00',
      paperNodeId: '6PW-0',
      route: 'settings',
      title: 'Settings',
      eyebrow: 'SETTINGS',
      summary: 'Structure-shaped settings loading with six direct-row groups.',
      kind: 'settings-skeleton',
    },
    {
      id: 'SET-01',
      paperNodeId: '6GS-0',
      route: 'settings',
      title: 'Settings',
      eyebrow: 'SETTINGS',
      summary: 'Known account controls in the live direct-row system.',
      kind: 'settings-loaded',
    },
    {
      id: 'SET-02',
      paperNodeId: 'B6L-0',
      route: 'settings',
      title: 'Known settings are still here.',
      eyebrow: 'CACHED OFFLINE',
      summary:
        'Cached details remain visible without pretending destinations work.',
      kind: 'settings-cached-offline',
    },
    {
      id: 'SET-03',
      paperNodeId: 'B8V-0',
      route: 'settings',
      title: 'One settings region needs another try.',
      eyebrow: 'PARTIAL ERROR',
      summary:
        'Available routes stay visible while notification settings retry.',
      kind: 'settings-partial-error',
    },
    {
      id: 'INV-01',
      paperNodeId: 'AVS-0',
      route: 'profile',
      title: 'Invite someone to Menta.',
      eyebrow: 'INVITE LINK',
      summary: 'An active link can be handed to share or copied locally.',
      kind: 'invite-ready',
    },
    {
      id: 'INV-02',
      paperNodeId: 'AXX-0',
      route: 'profile',
      title: 'Getting the invite ready.',
      eyebrow: 'PREPARING LINK',
      summary: 'The account service is preparing a shareable link.',
      kind: 'invite-preparing',
    },
    {
      id: 'INV-03',
      paperNodeId: 'AZC-0',
      route: 'profile',
      title: 'Choose where to share.',
      eyebrow: 'SYSTEM HANDOFF',
      summary: 'The native share sheet owns recipients and delivery.',
      kind: 'invite-handoff',
    },
    {
      id: 'INV-04',
      paperNodeId: 'B0X-0',
      route: 'profile',
      title: 'Back to your invite.',
      eyebrow: 'SHARE SHEET CLOSED',
      summary: 'Return from share is not a recipient or delivery receipt.',
      kind: 'invite-returned',
    },
    {
      id: 'INV-05',
      paperNodeId: 'B32-0',
      route: 'profile',
      title: 'Link copied.',
      eyebrow: 'COPIED ON THIS DEVICE',
      summary: 'Clipboard write succeeded locally; no delivery is claimed.',
      kind: 'invite-copied',
    },
    {
      id: 'INV-06',
      paperNodeId: 'B4M-0',
      route: 'profile',
      title: 'The invite link is not ready.',
      eyebrow: 'LINK UNAVAILABLE',
      summary: 'Session stays unchanged and no link was copied or shared.',
      kind: 'invite-unavailable',
    },
  ] as const;

export const getSettingsAccountPaperState = (
  id: SettingsAccountPaperStateId
): SettingsAccountPaperState => {
  const state = settingsAccountPaperStates.find(
    candidate => candidate.id === id
  );
  if (!state) {
    throw new Error(`Unknown Settings/account Paper state: ${id}`);
  }
  return state;
};
