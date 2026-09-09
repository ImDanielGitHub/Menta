import {
  GROUPS_ADMIN_ARCHIVE_PAPER_STATE_COUNT,
  GROUPS_ADMIN_ARCHIVE_PAPER_STATES,
} from '@/lib/paper-state-registry/groups-admin-archive';

describe('Groups administration and archive Paper registry', () => {
  it('covers the complete assigned twelve-state family exactly once', () => {
    expect(GROUPS_ADMIN_ARCHIVE_PAPER_STATE_COUNT).toBe(12);
    expect(
      GROUPS_ADMIN_ARCHIVE_PAPER_STATES.map(state => state.paperId)
    ).toEqual([
      '4U4-0',
      '4UF-0',
      '4UQ-0',
      '4VY-0',
      '4W9-0',
      '4WK-0',
      '4WV-0',
      '4X6-0',
      '4YE-0',
      '4YP-0',
      '4Z0-0',
      '4ZB-0',
    ]);
  });

  it('keeps deterministic gallery data separate from live group receipts', () => {
    expect(
      GROUPS_ADMIN_ARCHIVE_PAPER_STATES.every(
        state => state.sourceOfTruth.length > 0
      )
    ).toBe(true);
    expect(
      GROUPS_ADMIN_ARCHIVE_PAPER_STATES.some(state => state.kind === 'saving')
    ).toBe(true);
    expect(
      GROUPS_ADMIN_ARCHIVE_PAPER_STATES.some(
        state => state.kind === 'save-failed'
      )
    ).toBe(true);
  });
});
