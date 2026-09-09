import {
  decodeTodaysSubmissionStatus,
  getLegacyTodayStatus,
  getSoloTodayAction,
  hasAuthoritativeLocalDay,
} from '@/lib/solo-submission-status';

describe('solo submission status helpers', () => {
  it('uses the server status result for the server local-day uniqueness key', () => {
    expect(
      decodeTodaysSubmissionStatus([
        { has_submitted: true, submission_status: 'approved' },
      ])
    ).toBe('approved');
    expect(
      decodeTodaysSubmissionStatus([
        { has_submitted: true, submission_status: 'rejected' },
      ])
    ).toBe('rejected');
    expect(
      decodeTodaysSubmissionStatus([
        { has_submitted: true, submission_status: 'pending' },
      ])
    ).toBe('pending');
  });

  it('never decodes a malformed submitted response as no proof', () => {
    expect(
      decodeTodaysSubmissionStatus([
        { has_submitted: true, submission_status: 'processing' },
      ])
    ).toBeNull();
    expect(
      decodeTodaysSubmissionStatus([
        { has_submitted: false, submission_status: 'not_submitted' },
      ])
    ).toBe('none');
  });

  it('uses timestamp matching only for rows that predate local_day', () => {
    const now = new Date('2026-08-04T12:30:00.000Z');

    expect(
      getLegacyTodayStatus(
        [
          {
            status: 'pending',
            submission_date: '2026-08-04T12:00:00.000Z',
            local_day: null,
          },
        ],
        { timezone: 'Pacific/Auckland', now }
      )
    ).toBe('pending');

    expect(
      getLegacyTodayStatus(
        [
          {
            status: 'approved',
            submission_date: '2026-08-04T12:00:00.000Z',
            local_day: '2026-08-04',
          },
        ],
        { timezone: 'Pacific/Auckland', now }
      )
    ).toBe('none');
  });

  it('treats any stored local_day as authoritative instead of a fallback row', () => {
    expect(
      hasAuthoritativeLocalDay([
        {
          status: 'approved',
          submission_date: '2026-08-04T12:00:00.000Z',
          local_day: '2026-08-05',
        },
      ])
    ).toBe(true);
    expect(
      hasAuthoritativeLocalDay([
        {
          status: 'approved',
          submission_date: '2026-08-04T12:00:00.000Z',
          local_day: null,
        },
      ])
    ).toBe(false);
  });

  it('does not present an existing submission as another check-in', () => {
    expect(getSoloTodayAction('none')).toBe('submit');
    expect(getSoloTodayAction('pending')).toBe('view-details');
    expect(getSoloTodayAction('approved')).toBe('view-details');
    expect(getSoloTodayAction('rejected')).toBe('view-details');
  });
});
