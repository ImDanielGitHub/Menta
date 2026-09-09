export type SupportSystemPaperStateId =
  | 'ADM-00'
  | 'ADM-01'
  | 'ADM-02'
  | 'ADM-03'
  | 'ADM-04'
  | 'ADM-05'
  | 'ADM-06'
  | 'ADM-07'
  | 'ADM-08'
  | 'ADM-09'
  | 'OFF-01'
  | 'OFF-02'
  | 'SYS-01'
  | 'SYS-03'
  | 'SYS-04';

export type SupportSystemPaperState = {
  id: SupportSystemPaperStateId;
  paperNodeId: string;
  title: string;
  eyebrow: string;
  summary: string;
  kind:
    | 'admin-checking'
    | 'admin-required'
    | 'issue-queue'
    | 'issue-queue-empty'
    | 'issue-queue-unavailable'
    | 'issue-detail'
    | 'decision-progress'
    | 'issue-verified'
    | 'reject-issue'
    | 'decision-failed'
    | 'offline-saved-proof'
    | 'app-offline'
    | 'settings-handoff'
    | 'route-not-found'
    | 'account-loading';
  /** The source that must exist before a production route can show this state. */
  authority:
    | 'local-proof'
    | 'network'
    | 'server-role'
    | 'server-issue'
    | 'route';
  /**
   * Gallery-only states are deterministic presentation references, never
   * production fallbacks for an unavailable role, queue, issue, or decision.
   */
  availability: 'production' | 'gallery-only';
};

/**
 * Deterministic inputs for the support, offline, and system Paper family.
 * Gallery samples deliberately never supply an admin role, report, decision,
 * or account fact to a live route.
 */
export const SUPPORT_SYSTEM_PAPER_STATES: readonly SupportSystemPaperState[] = [
  {
    id: 'ADM-00',
    paperNodeId: 'BV7-0',
    title: 'Checking your access.',
    eyebrow: 'ADMIN · ROLE RECEIPT PENDING',
    summary:
      'Wait for the current support-role receipt before loading reports.',
    kind: 'admin-checking',
    authority: 'server-role',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-01',
    paperNodeId: 'BV8-0',
    title: 'Admin access required',
    eyebrow: 'ADMIN · ROLE UNAVAILABLE',
    summary: 'No local profile flag may unlock a support queue.',
    kind: 'admin-required',
    authority: 'server-role',
    availability: 'production',
  },
  {
    id: 'ADM-02',
    paperNodeId: 'BV9-0',
    title: 'Issue queue',
    eyebrow: 'ADMIN · LIVE REPORTS',
    summary:
      'Server-returned reports only, with compact filters and direct rows.',
    kind: 'issue-queue',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-03',
    paperNodeId: 'BVA-0',
    title: 'Issue queue empty',
    eyebrow: 'ADMIN · LIVE REPORTS',
    summary: 'An empty response is not an offline or all-clear claim.',
    kind: 'issue-queue-empty',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-04',
    paperNodeId: 'BVB-0',
    title: 'Issue queue unavailable',
    eyebrow: 'ADMIN · LIVE REPORTS',
    summary: 'The queue cannot support a decision until its contract returns.',
    kind: 'issue-queue-unavailable',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-05',
    paperNodeId: 'BVC-0',
    title: 'Issue detail',
    eyebrow: 'ADMIN · REPORT REVIEW',
    summary: 'A selected, server-returned report before any decision.',
    kind: 'issue-detail',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-06',
    paperNodeId: 'BVD-0',
    title: 'Decision in progress',
    eyebrow: 'ADMIN · DECISION PENDING',
    summary:
      'One server decision is pending; a duplicate action stays disabled.',
    kind: 'decision-progress',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-07',
    paperNodeId: 'BVE-0',
    title: 'Issue verified',
    eyebrow: 'ADMIN · DECISION RECEIPT',
    summary: 'A decision appears only after the server returns its receipt.',
    kind: 'issue-verified',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-08',
    paperNodeId: 'BVF-0',
    title: 'Reject issue',
    eyebrow: 'ADMIN · REVIEW DECISION',
    summary: 'A deliberate rejection requires an explicit, typed confirmation.',
    kind: 'reject-issue',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'ADM-09',
    paperNodeId: 'BVG-0',
    title: 'Decision failed',
    eyebrow: 'ADMIN · NO DECISION RECEIPT',
    summary:
      'The prior server status remains authoritative after a failed request.',
    kind: 'decision-failed',
    authority: 'server-issue',
    availability: 'gallery-only',
  },
  {
    id: 'OFF-01',
    paperNodeId: '6YG-0',
    title: 'Offline / Saved Proof',
    eyebrow: 'SAVED ON THIS PHONE',
    summary: 'Local proof is retained; delivery and review remain unconfirmed.',
    kind: 'offline-saved-proof',
    authority: 'local-proof',
    availability: 'production',
  },
  {
    id: 'OFF-02',
    paperNodeId: 'BVH-0',
    title: 'App offline',
    eyebrow: 'OFFLINE · LAST CONFIRMED STATE',
    summary: 'A network loss preserves stale data rather than clearing it.',
    kind: 'app-offline',
    authority: 'network',
    availability: 'production',
  },
  {
    id: 'SYS-01',
    paperNodeId: '6ZV-0',
    title: 'Open Settings Handoff',
    eyebrow: 'SYSTEM HANDOFF',
    summary:
      'Opening system settings does not assert that any setting changed.',
    kind: 'settings-handoff',
    authority: 'route',
    availability: 'production',
  },
  {
    id: 'SYS-03',
    paperNodeId: '7N7-0',
    title: 'Route Not Found',
    eyebrow: '404 · STALE OR UNKNOWN ROUTE',
    summary: 'A direct, safe recovery for routes outside the current app flow.',
    kind: 'route-not-found',
    authority: 'route',
    availability: 'production',
  },
  {
    id: 'SYS-04',
    paperNodeId: '7N8-0',
    title: 'Loading Account State',
    eyebrow: 'ACCOUNT · LOADING',
    summary: 'Canonical account geometry with static Reduce Motion guidance.',
    kind: 'account-loading',
    authority: 'server-role',
    availability: 'production',
  },
] as const;

export const getSupportSystemPaperState = (
  id: SupportSystemPaperStateId
): SupportSystemPaperState => {
  const state = SUPPORT_SYSTEM_PAPER_STATES.find(
    candidate => candidate.id === id
  );
  if (!state) {
    throw new Error(`Unknown Support/System Paper state: ${id}`);
  }
  return state;
};
