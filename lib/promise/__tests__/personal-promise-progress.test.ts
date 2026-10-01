import {
  applyTodayStatus,
  countKeptDays,
  mondayFirstDayIndex,
  resolvePromiseDay,
} from '@/lib/promise/personal-promise-progress';
import { buildProofWeek } from '@/lib/promise/proof-week';

describe('personal promise progress', () => {
  it('places a Sunday last in a Monday-first week', () => {
    expect(mondayFirstDayIndex('2026-09-27')).toBe(6);
    expect(mondayFirstDayIndex('2026-09-21')).toBe(0);
  });

  it('counts promise days from the first local day and holds at the term', () => {
    expect(
      resolvePromiseDay({
        startLocalDay: '2026-09-24',
        todayLocalDay: '2026-09-27',
        duration: 30,
      })
    ).toBe(4);
    expect(
      resolvePromiseDay({
        startLocalDay: '2026-10-02T00:00:00.000Z',
        todayLocalDay: '2026-09-27',
        duration: 30,
      })
    ).toBe(1);
    expect(
      resolvePromiseDay({
        startLocalDay: '2026-08-01',
        todayLocalDay: '2026-09-27',
        duration: 14,
      })
    ).toBe(14);
  });

  it('leaves an open today and days before the start out of the kept count', () => {
    const week = buildProofWeek({
      records: [
        { localDay: '2026-09-24', status: 'approved' },
        { localDay: '2026-09-25', status: 'approved' },
        { localDay: '2026-09-26', status: 'approved' },
      ],
      todayLocalDay: '2026-09-27',
      activeFromLocalDay: '2026-09-24',
    });

    expect(week.map(day => day.state)).toEqual([
      'inactive',
      'inactive',
      'inactive',
      'approved',
      'approved',
      'approved',
      'today',
    ]);
    expect(countKeptDays(week, 6)).toEqual({ kept: 3, total: 3 });
  });

  it('counts a blank past day against the week but not a proof still waiting today', () => {
    const week = applyTodayStatus(
      buildProofWeek({
        records: [
          { localDay: '2026-09-21', status: 'approved' },
          { localDay: '2026-09-22', status: 'approved' },
          { localDay: '2026-09-23', status: 'rejected' },
        ],
        todayLocalDay: '2026-09-27',
        activeFromLocalDay: '2026-09-01',
      }),
      6,
      'pending'
    );

    expect(week[6].state).toBe('waiting');
    expect(countKeptDays(week, 6)).toEqual({ kept: 2, total: 6 });
  });

  it('counts today once the server says it was approved', () => {
    const week = applyTodayStatus(
      buildProofWeek({
        records: [],
        todayLocalDay: '2026-09-21',
        activeFromLocalDay: '2026-09-21',
      }),
      0,
      'approved'
    );

    expect(week[0].state).toBe('approved');
    expect(countKeptDays(week, 0)).toEqual({ kept: 1, total: 1 });
  });
});
