import { buildProofWeek } from '@/lib/promise/proof-week';

const todayLocalDay = '2026-08-12';

describe('promise proof week', () => {
  it('reads proof states from server-attributed local days', () => {
    const week = buildProofWeek({
      records: [
        { localDay: '2026-08-10', status: 'approved' },
        { localDay: '2026-08-11', status: 'rejected' },
        { localDay: '2026-08-12', status: 'pending' },
      ],
      todayLocalDay,
    });

    expect(week.map(entry => entry.state)).toEqual([
      'approved',
      'needs-retry',
      'waiting',
      'future',
      'future',
      'future',
      'future',
    ]);
  });

  it('never converts blank past days into missed outcomes', () => {
    const week = buildProofWeek({ records: [], todayLocalDay });

    expect(week.map(entry => entry.state)).toEqual([
      'past',
      'past',
      'today',
      'future',
      'future',
      'future',
      'future',
    ]);
  });

  it('renders server-confirmed missed and protected days distinctly', () => {
    const week = buildProofWeek({
      records: [],
      outcomes: [
        {
          outcome: 'missed',
          localDay: '2026-08-10',
          previousStreak: 4,
          resultingStreak: 0,
          freezeUsed: false,
          freezesRemaining: 0,
        },
        {
          outcome: 'protected',
          localDay: '2026-08-11',
          previousStreak: 4,
          resultingStreak: 4,
          freezeUsed: true,
          freezesRemaining: 0,
        },
      ],
      todayLocalDay,
    });

    expect(week[0].state).toBe('missed');
    expect(week[1].state).toBe('protected');
  });

  it('lets a resolved outcome win over a late proof marker', () => {
    const week = buildProofWeek({
      records: [{ localDay: '2026-08-10', status: 'approved' }],
      outcomes: [
        {
          outcome: 'missed',
          localDay: '2026-08-10',
          previousStreak: 4,
          resultingStreak: 0,
          freezeUsed: false,
          freezesRemaining: 0,
        },
      ],
      todayLocalDay,
    });

    expect(week[0].state).toBe('missed');
  });

  it('marks pre-join days inactive and ignores invalid local days', () => {
    const week = buildProofWeek({
      records: [
        { localDay: null, status: 'approved' },
        { localDay: 'not-a-day', status: 'approved' },
      ],
      todayLocalDay,
      activeFromLocalDay: '2026-08-12',
    });

    expect(week.slice(0, 2).map(entry => entry.state)).toEqual([
      'inactive',
      'inactive',
    ]);
    expect(week.some(entry => entry.state === 'approved')).toBe(false);
  });
});
