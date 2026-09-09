export type ProofRecoveryPaperId =
  | 'PROOF-00A'
  | 'PROOF-01TB'
  | 'PROOF-04B'
  | 'PROOF-08B'
  | 'PROOF-08R'
  | 'PROOF-11D'
  | 'PROOF-12L'
  | 'REV-02B'
  | 'STREAK-04'
  | 'STREAK-05';

export type ProofRecoveryAuthority =
  | 'local-input'
  | 'local-proof'
  | 'server-receipt'
  | 'server-derived';

export type ProofRecoveryAction = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type ProofRecoveryState = {
  id: ProofRecoveryPaperId;
  paperNodeId: string;
  family: 'proof' | 'review' | 'streak';
  overline: string;
  title: string;
  detail: string;
  authority: ProofRecoveryAuthority;
  facts: readonly { label: string; value: string }[];
  primaryAction: ProofRecoveryAction;
  secondaryAction?: ProofRecoveryAction;
  mediaRole?: 'walking-proof-crop' | 'walking-proof-full';
  decisionGate?: 'input-specific' | 'hold-complete' | 'evidence-opened';
};

/**
 * Exact deterministic contracts for the assigned Paper nodes. These fixtures
 * can render independently of live account data and do not imply that a route,
 * upload, review, reward, or recovery mutation has happened.
 */
export const PROOF_RECOVERY_PAPER_STATES: readonly ProofRecoveryState[] = [
  {
    id: 'PROOF-00A',
    paperNodeId: '99K-0',
    family: 'proof',
    overline: 'PROOF METHOD',
    title: 'Show what counts today',
    detail: 'Choose one of the proof methods allowed by this promise.',
    authority: 'local-input',
    facts: [
      { label: 'Photo', value: 'Allowed' },
      { label: 'Text', value: 'Allowed' },
      { label: 'Upload', value: 'Allowed' },
    ],
    primaryAction: { id: 'use-photo-proof', label: 'Use photo proof' },
    secondaryAction: {
      id: 'choose-another-method',
      label: 'Choose another method',
    },
  },
  {
    id: 'PROOF-01TB',
    paperNodeId: 'A4I-0',
    family: 'proof',
    overline: 'TEXT PROOF · 4 / 240',
    title: 'Give it one fact',
    detail:
      'One more useful detail makes the check-in fair to review. “Done” alone is not enough.',
    authority: 'local-input',
    facts: [
      {
        label: 'Example',
        value: 'Walked 20 minutes after work at 6:10 PM.',
      },
    ],
    primaryAction: {
      id: 'add-detail',
      label: 'Add a detail to continue',
      disabled: true,
    },
    decisionGate: 'input-specific',
  },
  {
    id: 'PROOF-04B',
    paperNodeId: 'KY-0',
    family: 'proof',
    overline: 'PRIVATE · TAKEN JUST NOW',
    title: 'Ready to send',
    detail: 'Check the photo, then hold to send it securely.',
    authority: 'local-proof',
    facts: [
      { label: 'PROOF FOR', value: 'Walk for 20 minutes after work.' },
      { label: 'Hold progress', value: '62%' },
    ],
    primaryAction: { id: 'hold-to-send', label: 'Keep holding…' },
    secondaryAction: { id: 'cancel-hold', label: 'Release to cancel' },
    mediaRole: 'walking-proof-crop',
    decisionGate: 'hold-complete',
  },
  {
    id: 'PROOF-08B',
    paperNodeId: 'A4N-0',
    family: 'proof',
    overline: 'SENDING SECURELY',
    title: 'The original stays safe',
    detail: 'Uploading proof 68%',
    authority: 'local-proof',
    facts: [
      { label: 'Transfer', value: '3.2 MB of 4.7 MB · encrypted transfer' },
      { label: 'Proof prepared on this phone', value: 'Done' },
      { label: 'Transfer', value: 'In progress' },
    ],
    primaryAction: {
      id: 'cancel-upload',
      label: 'Cancel upload — keep original',
    },
  },
  {
    id: 'PROOF-08R',
    paperNodeId: 'A4O-0',
    family: 'proof',
    overline: 'MENTA · CONFIRMED',
    title: '12 days',
    detail: 'Locked In',
    authority: 'server-receipt',
    facts: [
      { label: 'APPROVED', value: '06 AUG · 7:52 PM' },
      { label: 'Proof', value: 'Walk after work' },
      { label: 'Reviewer', value: 'Jamie' },
      { label: 'Privacy', value: 'Sharing never reveals proof' },
    ],
    primaryAction: { id: 'share-milestone', label: 'Share milestone' },
  },
  {
    id: 'PROOF-11D',
    paperNodeId: 'A4P-0',
    family: 'proof',
    overline: 'CAPTURED TODAY · 6:31 PM',
    title: 'Proof detail',
    detail: 'Review Approved by Jamie',
    authority: 'server-derived',
    facts: [],
    primaryAction: { id: 'open-full-view', label: 'Open full view' },
    secondaryAction: { id: 'report-issue', label: 'Report an issue' },
    mediaRole: 'walking-proof-crop',
  },
  {
    id: 'PROOF-12L',
    paperNodeId: 'A4Q-0',
    family: 'proof',
    overline: 'PRIVATE PROOF · VIEWED BY YOU',
    title: 'Full proof view',
    detail: 'The proof stays private unless you save a private copy.',
    authority: 'server-derived',
    facts: [],
    primaryAction: { id: 'done', label: 'Done' },
    secondaryAction: {
      id: 'save-private-copy',
      label: 'Save a private copy',
    },
    mediaRole: 'walking-proof-full',
  },
  {
    id: 'REV-02B',
    paperNodeId: '2CN-0',
    family: 'review',
    overline: 'NO DECISION RECORDED',
    title: 'The proof cannot be opened right now',
    detail:
      'The media link expired. The submission is preserved and no review decision has been recorded.',
    authority: 'server-derived',
    facts: [],
    primaryAction: { id: 'retry-evidence', label: 'Try evidence again' },
    secondaryAction: {
      id: 'back-to-review-queue',
      label: 'Back to review queue',
    },
    decisionGate: 'evidence-opened',
  },
  {
    id: 'STREAK-04',
    paperNodeId: '9FM-0',
    family: 'streak',
    overline: 'RECOVERY QUEST · DAY 1 OF 3',
    title: 'A new choice, not a rewrite',
    detail:
      'Do 10 minutes and use any allowed proof. The missed day stays in your history.',
    authority: 'server-derived',
    facts: [
      {
        label: 'Streak rule',
        value: 'The streak moves only after proof approval.',
      },
    ],
    primaryAction: { id: 'start-recovery', label: 'Start day 1' },
    secondaryAction: { id: 'leave-missed', label: 'Leave as missed' },
  },
  {
    id: 'STREAK-05',
    paperNodeId: '9FN-0',
    family: 'streak',
    overline: 'RECOVERY MILESTONE · CONFIRMED',
    title: 'Recovery approved',
    detail:
      'This milestone exists because the approval receipt is authoritative.',
    authority: 'server-receipt',
    facts: [
      {
        label: 'Sharing',
        value: 'Sharing or exporting never changes the streak.',
      },
    ],
    primaryAction: { id: 'share-recovery', label: 'Share milestone' },
    secondaryAction: { id: 'done', label: 'Done' },
  },
] as const;

export const getProofRecoveryPaperState = (
  id: ProofRecoveryPaperId
): ProofRecoveryState => {
  const state = PROOF_RECOVERY_PAPER_STATES.find(
    candidate => candidate.id === id
  );
  if (!state) throw new Error(`Missing proof recovery Paper state: ${id}`);
  return state;
};
