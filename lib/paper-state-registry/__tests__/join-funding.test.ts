import {
  getJoinFundingRuntimeState,
  JOIN_FUNDING_RUNTIME_STATES,
} from '@/lib/paper-state-registry/join-funding';

describe('join funding Paper/runtime registry', () => {
  it('maps the four exact Paper states once', () => {
    expect(
      JOIN_FUNDING_RUNTIME_STATES.filter(state => state.paperNodeId).map(
        state => `${state.id}:${state.paperNodeId}`
      )
    ).toEqual([
      'JOIN-00:FL1-0',
      'JOIN-01:FL2-0',
      'JOIN-02:GTW-0',
      'JOIN-03:GTX-0',
    ]);
  });

  it('keeps adjacent loading, validation, failure, and retry states explicit', () => {
    expect(JOIN_FUNDING_RUNTIME_STATES.map(state => state.phase)).toEqual(
      expect.arrayContaining(['loading', 'validation', 'failed', 'retry'])
    );
    expect(getJoinFundingRuntimeState('JOIN-02').authority).toBe(
      'server-receipt'
    );
    expect(getJoinFundingRuntimeState('JOIN-03').proofBoundary).toContain(
      'No second mutation'
    );
  });
});
