import { buildProfileFollowThroughDays } from '@/lib/profile/follow-through';

describe('profile follow-through series', () => {
  it('counts approved proofs by local day and keeps missed/protected outcomes', () => {
    const days = buildProfileFollowThroughDays({
      approvedRows: [{ local_day: '2026-08-31' }, { local_day: '2026-08-31' }],
      outcomeRows: [
        { local_day: '2026-08-30', outcome: 'missed' },
        { local_day: '2026-08-31', outcome: 'protected' },
      ],
      locale: 'en-NZ',
      now: new Date(2026, 8, 1, 12),
      count: 3,
    });

    expect(
      days.map(day => [day.localDay, day.approvedProofs, day.outcome])
    ).toEqual([
      ['2026-08-30', 0, 'missed'],
      ['2026-08-31', 2, 'protected'],
      ['2026-09-01', 0, null],
    ]);
  });
});
