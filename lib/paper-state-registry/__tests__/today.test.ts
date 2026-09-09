import {
  getTodayFamilyPaperState,
  TODAY_FAMILY_PAPER_STATES,
} from '@/lib/paper-state-registry/today';

describe('Today Paper state registry', () => {
  it('keeps the complete 15-state 03 Today family available to a dev gallery', () => {
    expect(TODAY_FAMILY_PAPER_STATES).toHaveLength(15);
    expect(TODAY_FAMILY_PAPER_STATES.map(state => state.id)).toEqual([
      'HOME-01',
      'HOME-03',
      'HOME-03A',
      'HOME-04',
      'HOME-06',
      'HOME-07',
      'HOME-08',
      'HOME-09',
      'HOME-10',
      'HOME-11',
      'HOME-12',
      'HOME-13',
      'STREAK-01',
      'STREAK-02',
      'STREAK-03',
    ]);
    expect(
      TODAY_FAMILY_PAPER_STATES.map(state => `${state.id}:${state.paperNodeId}`)
    ).toEqual([
      'HOME-01:8WN-0',
      'HOME-03:8XP-0',
      'HOME-03A:9FF-0',
      'HOME-04:8N-0',
      'HOME-06:AI-0',
      'HOME-07:8ZW-0',
      'HOME-08:CD-0',
      'HOME-09:9FG-0',
      'HOME-10:E8-0',
      'HOME-11:911-0',
      'HOME-12:9FH-0',
      'HOME-13:9FI-0',
      'STREAK-01:9FJ-0',
      'STREAK-02:9FK-0',
      'STREAK-03:9FL-0',
    ]);
  });

  it('does not expose derived states as local proof authority', () => {
    expect(getTodayFamilyPaperState('HOME-04').authority).toBe('local-proof');
    expect(getTodayFamilyPaperState('HOME-13').authority).toBe(
      'server-derived'
    );
    expect(getTodayFamilyPaperState('STREAK-03').authority).toBe(
      'server-derived'
    );
  });
});
