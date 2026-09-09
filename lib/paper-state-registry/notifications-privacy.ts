export const NOTIFICATIONS_PRIVACY_PAPER_STATES = [
  {
    id: 'NOT-03',
    paperNodeId: 'C9O-0',
    surface: 'settings',
    kind: 'native-permission-handoff',
    authority: 'native-permission',
  },
  {
    id: 'NOT-06',
    paperNodeId: 'CB7-0',
    surface: 'settings',
    kind: 'opening-device-settings',
    authority: 'native-settings',
  },
  {
    id: 'NOT-07',
    paperNodeId: 'CCQ-0',
    surface: 'settings',
    kind: 'returned-granted',
    authority: 'native-permission',
  },
  {
    id: 'NOT-08',
    paperNodeId: 'CE9-0',
    surface: 'settings',
    kind: 'returned-still-off',
    authority: 'native-permission',
  },
  {
    id: 'NOT-10',
    paperNodeId: 'CHB-0',
    surface: 'settings',
    kind: 'preference-saving',
    authority: 'account-preference',
  },
  {
    id: 'NOT-11',
    paperNodeId: 'CIU-0',
    surface: 'settings',
    kind: 'preference-saved',
    authority: 'account-preference',
  },
  {
    id: 'NOT-13',
    paperNodeId: 'CLW-0',
    surface: 'settings',
    kind: 'schedule-reconciling',
    authority: 'local-schedule',
  },
  {
    id: 'NOT-16',
    paperNodeId: 'CQH-0',
    surface: 'settings',
    kind: 'quiet-hours-edit',
    authority: 'device-local',
  },
  {
    id: 'NOT-17',
    paperNodeId: 'CS0-0',
    surface: 'settings',
    kind: 'quiet-hours-not-saved',
    authority: 'device-local',
  },
  {
    id: 'INV-06',
    paperNodeId: 'B4M-0',
    surface: 'settings',
    kind: 'invite-unavailable',
    authority: 'account-service',
  },
  {
    id: 'YOU-05',
    paperNodeId: 'AFT-0',
    surface: 'settings',
    kind: 'pro-unavailable',
    authority: 'entitlement-service',
  },
  {
    id: 'AUTH-07',
    paperNodeId: '8PO-0',
    surface: 'auth',
    kind: 'notification-education',
    authority: 'user-choice',
  },
  {
    id: 'AUTH-08',
    paperNodeId: '8QU-0',
    surface: 'auth',
    kind: 'notification-granted',
    authority: 'native-permission',
  },
  {
    id: 'AUTH-09',
    paperNodeId: '8S0-0',
    surface: 'auth',
    kind: 'push-token-pending',
    authority: 'device-registration',
  },
] as const;

export type NotificationsPrivacyPaperStateId =
  (typeof NOTIFICATIONS_PRIVACY_PAPER_STATES)[number]['id'];

export type NotificationsPrivacyPaperState =
  (typeof NOTIFICATIONS_PRIVACY_PAPER_STATES)[number];

export const getNotificationsPrivacyPaperState = (
  id: NotificationsPrivacyPaperStateId
): NotificationsPrivacyPaperState => {
  const state = NOTIFICATIONS_PRIVACY_PAPER_STATES.find(
    candidate => candidate.id === id
  );

  if (!state) {
    throw new Error(`Unknown notification/privacy Paper state: ${id}`);
  }

  return state;
};
