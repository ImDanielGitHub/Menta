import {
  getSupportSystemPaperState,
  SUPPORT_SYSTEM_PAPER_STATES,
} from '@/lib/paper-state-registry/support-system';

describe('Support/System Paper state registry', () => {
  it('keeps the complete 15-state support and system family available', () => {
    expect(SUPPORT_SYSTEM_PAPER_STATES).toHaveLength(15);
    expect(
      SUPPORT_SYSTEM_PAPER_STATES.map(
        state => `${state.id}:${state.paperNodeId}`
      )
    ).toEqual([
      'ADM-00:BV7-0',
      'ADM-01:BV8-0',
      'ADM-02:BV9-0',
      'ADM-03:BVA-0',
      'ADM-04:BVB-0',
      'ADM-05:BVC-0',
      'ADM-06:BVD-0',
      'ADM-07:BVE-0',
      'ADM-08:BVF-0',
      'ADM-09:BVG-0',
      'OFF-01:6YG-0',
      'OFF-02:BVH-0',
      'SYS-01:6ZV-0',
      'SYS-03:7N7-0',
      'SYS-04:7N8-0',
    ]);
  });

  it('does not permit local data to authorise an admin state', () => {
    expect(getSupportSystemPaperState('ADM-00').authority).toBe('server-role');
    expect(getSupportSystemPaperState('ADM-02').authority).toBe('server-issue');
    expect(getSupportSystemPaperState('ADM-02').availability).toBe(
      'gallery-only'
    );
    expect(getSupportSystemPaperState('ADM-09').availability).toBe(
      'gallery-only'
    );
    expect(getSupportSystemPaperState('ADM-01').availability).toBe(
      'production'
    );
    expect(getSupportSystemPaperState('OFF-01').authority).toBe('local-proof');
  });

  it('keeps the production recovery states separate from admin gallery samples', () => {
    expect(
      SUPPORT_SYSTEM_PAPER_STATES.filter(
        state => state.availability === 'production'
      ).map(state => state.id)
    ).toEqual(['ADM-01', 'OFF-01', 'OFF-02', 'SYS-01', 'SYS-03', 'SYS-04']);
  });
});
