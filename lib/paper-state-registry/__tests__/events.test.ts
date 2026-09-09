import {
  eventPaperStateContracts,
  eventPaperStateIds,
} from '@/lib/paper-state-registry/events';

describe('eventPaperStateContracts', () => {
  it('keeps each remaining Events Paper state explicit and unique', () => {
    expect(eventPaperStateIds).toHaveLength(20);
    expect(new Set(eventPaperStateIds).size).toBe(eventPaperStateIds.length);
    expect(eventPaperStateIds).toEqual(
      expect.arrayContaining(['89T-0', '922-0', 'H1I-0', 'H2L-0', 'H3O-0'])
    );
  });

  it('keeps only non-product system references contract-only', () => {
    const contractOnly = eventPaperStateContracts.filter(
      state => state.status === 'contract_only'
    );

    expect(contractOnly.map(state => state.paperId)).toEqual([
      'F9G-0',
      'F9H-0',
    ]);
  });

  it('records recovery, album, recap, and organiser worksheets as implemented', () => {
    const implemented = eventPaperStateContracts
      .filter(state => state.status === 'implemented')
      .map(state => state.paperId);

    expect(implemented).toEqual(
      expect.arrayContaining([
        '89Z-0',
        '922-0',
        'H1I-0',
        '923-0',
        'H4R-0',
        '924-0',
      ])
    );
  });
});
