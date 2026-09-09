export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'reported';

export const REVIEWABLE_STATUSES: ModerationStatus[] = [
  'pending',
  'approved',
  'rejected',
  'reported',
];
