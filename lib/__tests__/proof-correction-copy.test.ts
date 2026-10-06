import {
  getCorrectionComposeNotice,
  getCorrectionFollowUpNote,
  pickTodayRejectedReviewNote,
  sanitizeCorrectionReason,
  withCorrectionReasonParams,
} from '@/lib/proof-correction-copy';

describe('proof correction copy', () => {
  it('keeps only a real reviewer note', () => {
    expect(sanitizeCorrectionReason('  Show the full route marker.  ')).toBe(
      'Show the full route marker.'
    );
    expect(sanitizeCorrectionReason('   ')).toBeNull();
    expect(sanitizeCorrectionReason(null)).toBeNull();
  });

  it('repeats the reviewer note on the next capture', () => {
    expect(getCorrectionComposeNotice('Show the full route marker.')).toEqual({
      title: 'What to change',
      description: 'Show the full route marker.',
    });
    expect(getCorrectionComposeNotice(null)).toBeNull();
  });

  it('uses the reviewer note as the follow-up fact when one exists', () => {
    expect(getCorrectionFollowUpNote('Show the finish line.')).toBe(
      'Show the finish line.'
    );
    expect(getCorrectionFollowUpNote(null)).toContain('clearer follow-up');
  });

  it('keeps only a real reviewer note on compose params', () => {
    expect(
      withCorrectionReasonParams(
        { challengeId: 'promise-1', source: 'solo' },
        '  Add the finish time.  '
      )
    ).toEqual({
      challengeId: 'promise-1',
      source: 'solo',
      correctionReason: 'Add the finish time.',
    });
    expect(
      withCorrectionReasonParams(
        { challengeId: 'promise-1', source: 'solo' },
        '   '
      )
    ).toEqual({
      challengeId: 'promise-1',
      source: 'solo',
    });
  });

  it('picks today’s rejected reviewer note and ignores older days', () => {
    expect(
      pickTodayRejectedReviewNote(
        [
          {
            status: 'rejected',
            review_notes: 'Yesterday’s note',
            local_day: '2026-09-06',
            submission_date: '2026-09-06T18:00:00.000Z',
          },
          {
            status: 'rejected',
            review_notes: '  Show the route marker.  ',
            local_day: '2026-09-07',
            submission_date: '2026-09-07T09:00:00.000Z',
          },
          {
            status: 'pending',
            review_notes: 'Not a rejection',
            local_day: '2026-09-07',
            submission_date: '2026-09-07T10:00:00.000Z',
          },
        ],
        {
          timezone: 'Pacific/Auckland',
          now: new Date('2026-09-07T20:00:00+12:00'),
        }
      )
    ).toBe('Show the route marker.');
    expect(
      pickTodayRejectedReviewNote(
        [
          {
            status: 'approved',
            review_notes: 'Looks good',
            local_day: '2026-09-07',
            submission_date: '2026-09-07T09:00:00.000Z',
          },
        ],
        {
          timezone: 'Pacific/Auckland',
          now: new Date('2026-09-07T20:00:00+12:00'),
        }
      )
    ).toBeNull();
  });
});
