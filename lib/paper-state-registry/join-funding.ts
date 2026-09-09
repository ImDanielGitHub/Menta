export type JoinFundingRuntimeState = {
  id:
    | 'JOIN-LOAD'
    | 'JOIN-VALIDATION'
    | 'JOIN-00'
    | 'JOIN-01'
    | 'JOIN-02'
    | 'JOIN-03'
    | 'JOIN-FAILED'
    | 'JOIN-RETRY';
  paperNodeId: 'FL1-0' | 'FL2-0' | 'GTW-0' | 'GTX-0' | null;
  phase:
    | 'loading'
    | 'validation'
    | 'ready'
    | 'insufficient'
    | 'confirmed'
    | 'unknown'
    | 'failed'
    | 'retry';
  authority: 'local-validation' | 'server-quote' | 'server-receipt';
  proofBoundary: string;
};

/**
 * Production-state coverage for the four exact Paper artboards and the
 * adjacent non-Paper states needed to reach and recover from them safely.
 */
export const JOIN_FUNDING_RUNTIME_STATES = [
  {
    id: 'JOIN-LOAD',
    paperNodeId: null,
    phase: 'loading',
    authority: 'server-quote',
    proofBoundary: 'No cost, balance, membership, or debit is claimed yet.',
  },
  {
    id: 'JOIN-VALIDATION',
    paperNodeId: null,
    phase: 'validation',
    authority: 'local-validation',
    proofBoundary: 'Malformed IDs and invite codes never reach the RPC.',
  },
  {
    id: 'JOIN-00',
    paperNodeId: 'FL1-0',
    phase: 'ready',
    authority: 'server-quote',
    proofBoundary:
      'Cost, challenge, eligibility, and wallet are server quoted.',
  },
  {
    id: 'JOIN-01',
    paperNodeId: 'FL2-0',
    phase: 'insufficient',
    authority: 'server-quote',
    proofBoundary: 'No participant, wallet transaction, or receipt exists.',
  },
  {
    id: 'JOIN-02',
    paperNodeId: 'GTW-0',
    phase: 'confirmed',
    authority: 'server-receipt',
    proofBoundary: 'Membership and debit are claimed only from one receipt.',
  },
  {
    id: 'JOIN-03',
    paperNodeId: 'GTX-0',
    phase: 'unknown',
    authority: 'server-receipt',
    proofBoundary: 'No second mutation runs before status readback.',
  },
  {
    id: 'JOIN-FAILED',
    paperNodeId: null,
    phase: 'failed',
    authority: 'server-receipt',
    proofBoundary: 'A failed join never renders confirmed membership or debit.',
  },
  {
    id: 'JOIN-RETRY',
    paperNodeId: null,
    phase: 'retry',
    authority: 'server-receipt',
    proofBoundary:
      'The same client event ID is reused after a no-receipt read.',
  },
] as const satisfies readonly JoinFundingRuntimeState[];

export const getJoinFundingRuntimeState = (
  id: JoinFundingRuntimeState['id']
): JoinFundingRuntimeState => {
  const state = JOIN_FUNDING_RUNTIME_STATES.find(
    candidate => candidate.id === id
  );
  if (!state) throw new Error(`Unknown join funding state: ${id}`);
  return state;
};
