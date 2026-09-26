import {
  buildTodayWeek,
  countApprovedWeekDays,
} from '@/lib/today-week-activity';

describe('Today week row', () => {
  it('never presents a day without records as missed', () => {
    const days = buildTodayWeek({
      localDay: '2026-09-24',
      locale: 'en-NZ',
      submissions: [],
    });

    expect(new Set(days.map(day => day.status))).toEqual(new Set(['open']));
    expect(countApprovedWeekDays(days)).toBe(0);
  });

  it('keeps the strongest server fact when several promises share a day', () => {
    const days = buildTodayWeek({
      localDay: '2026-09-24',
      locale: 'en-NZ',
      submissions: [
        { localDay: '2026-09-20', status: 'rejected' },
        { localDay: '2026-09-20', status: 'approved' },
        { localDay: '2026-09-21', status: 'rejected' },
        { localDay: '2026-09-21', status: 'pending' },
        { localDay: '2026-09-22', status: 'rejected' },
      ],
      outcomes: [
        { localDay: '2026-09-23', outcome: 'protected' },
        { localDay: '2026-09-22', outcome: 'missed' },
      ],
    });
    const byDay = Object.fromEntries(
      days.map(day => [day.localDay, day.status])
    );

    expect(byDay['2026-09-20']).toBe('approved');
    expect(byDay['2026-09-21']).toBe('pending');
    expect(byDay['2026-09-22']).toBe('correction');
    expect(byDay['2026-09-23']).toBe('protected');
    expect(countApprovedWeekDays(days)).toBe(1);
  });

  it('settles today from every live obligation, not from one record', () => {
    const build = (
      todayStatuses: ('none' | 'pending' | 'approved' | 'rejected')[]
    ) =>
      buildTodayWeek({
        localDay: '2026-09-24',
        locale: 'en-NZ',
        submissions: [{ localDay: '2026-09-24', status: 'approved' }],
        todayStatuses,
      })[6].status;

    expect(build(['approved', 'none'])).toBe('open');
    expect(build(['approved', 'pending'])).toBe('pending');
    expect(build(['approved', 'rejected'])).toBe('correction');
    expect(build(['approved', 'approved'])).toBe('approved');
    // Without live obligations the day falls back to its server records.
    expect(build([])).toBe('approved');
  });
});
