export type GroupsAdminArchivePaperStateId =
  | '4U4-0'
  | '4UF-0'
  | '4UQ-0'
  | '4VY-0'
  | '4W9-0'
  | '4WK-0'
  | '4WV-0'
  | '4X6-0'
  | '4YE-0'
  | '4YP-0'
  | '4Z0-0'
  | '4ZB-0';

export type GroupsAdminArchivePaperState = {
  paperId: GroupsAdminArchivePaperStateId;
  route: '/group-members' | '/group-settings' | '/archived-groups';
  kind:
    | 'members-skeleton'
    | 'members-manage'
    | 'members-view'
    | 'settings-skeleton'
    | 'settings'
    | 'unsaved'
    | 'saving'
    | 'save-failed'
    | 'archive-skeleton'
    | 'archive-list'
    | 'archive-empty'
    | 'archive-unavailable';
  sourceOfTruth: string;
  title: string;
};

/**
 * Family-local Paper registry. These deterministic gallery facts are never a
 * fallback for real group/member data or server receipts.
 */
export const GROUPS_ADMIN_ARCHIVE_PAPER_STATES: readonly GroupsAdminArchivePaperState[] =
  [
    {
      paperId: '4U4-0',
      route: '/group-members',
      kind: 'members-skeleton',
      sourceOfTruth: 'list_authorized_group_members',
      title: 'Members Skeleton',
    },
    {
      paperId: '4UF-0',
      route: '/group-members',
      kind: 'members-manage',
      sourceOfTruth: 'authorised member roles',
      title: 'Manage Members',
    },
    {
      paperId: '4UQ-0',
      route: '/group-members',
      kind: 'members-view',
      sourceOfTruth: 'authorised member roles',
      title: 'Member View Only',
    },
    {
      paperId: '4VY-0',
      route: '/group-settings',
      kind: 'settings-skeleton',
      sourceOfTruth: 'groups and member roles',
      title: 'Settings Skeleton',
    },
    {
      paperId: '4W9-0',
      route: '/group-settings',
      kind: 'settings',
      sourceOfTruth: 'teams settings row',
      title: 'Group Settings',
    },
    {
      paperId: '4WK-0',
      route: '/group-settings',
      kind: 'unsaved',
      sourceOfTruth: 'local settings draft',
      title: 'Unsaved Changes',
    },
    {
      paperId: '4WV-0',
      route: '/group-settings',
      kind: 'saving',
      sourceOfTruth: 'pending teams update',
      title: 'Saving Changes',
    },
    {
      paperId: '4X6-0',
      route: '/group-settings',
      kind: 'save-failed',
      sourceOfTruth: 'retained local settings draft',
      title: 'Settings Not Saved',
    },
    {
      paperId: '4YE-0',
      route: '/archived-groups',
      kind: 'archive-skeleton',
      sourceOfTruth: 'member-scoped archive query',
      title: 'Archived Skeleton',
    },
    {
      paperId: '4YP-0',
      route: '/archived-groups',
      kind: 'archive-list',
      sourceOfTruth: 'member-scoped archive query',
      title: 'Archived Groups',
    },
    {
      paperId: '4Z0-0',
      route: '/archived-groups',
      kind: 'archive-empty',
      sourceOfTruth: 'member-scoped archive query',
      title: 'No Archived Groups',
    },
    {
      paperId: '4ZB-0',
      route: '/archived-groups',
      kind: 'archive-unavailable',
      sourceOfTruth: 'member-scoped archive query',
      title: 'Archive Unavailable',
    },
  ] as const;

export const GROUPS_ADMIN_ARCHIVE_PAPER_STATE_COUNT =
  GROUPS_ADMIN_ARCHIVE_PAPER_STATES.length;
