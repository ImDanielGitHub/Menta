import {
  COMMERCE_FAMILY_PAPER_STATES,
  getCommercePaperState,
} from '@/lib/paper-state-registry/commerce';

describe('Commerce Paper state registry', () => {
  it('registers the complete Pro, Momenta, Shop and Inventory block', () => {
    expect(
      COMMERCE_FAMILY_PAPER_STATES.map(
        state => `${state.id}:${state.paperNodeId}`
      )
    ).toEqual([
      'PAY-01:1EE-0',
      'PAY-02:16R-0',
      'PAY-03A:TM-0',
      'PAY-03B:Y4-0',
      'PAY-04A:106-0',
      'PAY-04B:1FY-0',
      'PAY-04C:1IU-0',
      'PAY-05:12G-0',
      'PAY-06:13X-0',
      'PAY-07:1KW-0',
      'PAY-08A:15G-0',
      'PAY-08B:18U-0',
      'PAY-09A:1A5-0',
      'PAY-09B:1BM-0',
      'PAY-09C:1CW-0',
      'PAY-10:1MT-0',
      'MOM-01:71J-0',
      'MOM-02:71M-0',
      'MOM-03:7BK-0',
      'MOM-04:7BM-0',
      'MOM-05:9QH-0',
      'TOP-01:7BN-0',
      'TOP-02:7BL-0',
      'SHP-01:71K-0',
      'SHP-02:7HP-0',
      'SHP-03:7HO-0',
      'SHP-04:7HM-0',
      'SHP-05:9Q5-0',
      'SHP-06:9Q6-0',
      'SHP-07:9Q7-0',
      'SHP-08:9Q8-0',
      'SHP-09:9Q9-0',
      'SHP-10:9QA-0',
      'INV-01:71L-0',
      'INV-02:7HN-0',
      'INV-03:9QB-0',
      'INV-04:9QC-0',
      'INV-05:9QD-0',
      'ADV-01:9QE-0',
      'ADV-02:9QF-0',
      'ADV-03:9QG-0',
    ]);
  });

  it('keeps identifiers and Paper roots unique', () => {
    const ids = COMMERCE_FAMILY_PAPER_STATES.map(state => state.id);
    const roots = COMMERCE_FAMILY_PAPER_STATES.map(state => state.paperNodeId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(roots).size).toBe(roots.length);
  });

  it('records a proof boundary and at least one deterministic action per state', () => {
    for (const state of COMMERCE_FAMILY_PAPER_STATES) {
      expect(state.proofBoundary.trim()).not.toBe('');
      expect(state.primaryAction.id.trim()).not.toBe('');
      expect(state.primaryAction.label.trim()).not.toBe('');
      expect(getCommercePaperState(state.id)).toBe(state);
    }
  });

  it('contains no hard-coded App Store amount', () => {
    const serialized = JSON.stringify(COMMERCE_FAMILY_PAPER_STATES);

    expect(serialized).not.toMatch(/(?:NZ\$|[$£€])\s*\d/i);
    expect(serialized).toContain('Live App Store price');
  });
});
