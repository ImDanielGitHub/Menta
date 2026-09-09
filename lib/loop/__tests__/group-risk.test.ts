import { decodeGroupRiskSnapshot } from '@/lib/loop';

const authoritativeRisk = {
  group_id: 'group-1',
  risk_level: 'at_risk',
  total_members: 5,
  submitted_today: 4,
  pending_submissions: 1,
  pending_reviews: 2,
  end_of_day_utc: '2026-08-10T08:00:00.000Z',
  seconds_remaining: 7200,
  misses_to_break_streak: 2,
};

describe('group risk RPC contract', () => {
  it('keeps the server-owned member, submission, review, and deadline facts', () => {
    expect(decodeGroupRiskSnapshot(authoritativeRisk, 'group-1')).toEqual({
      groupId: 'group-1',
      level: 'at_risk',
      totalMembers: 5,
      submittedToday: 4,
      pendingSubmissions: 1,
      pendingReviews: 2,
      endOfDayIso: '2026-08-10T08:00:00.000Z',
      secondsRemaining: 7200,
      missesToBreakStreak: 2,
    });
  });

  it('accepts the single-row relation shape used by older PostgREST types', () => {
    expect(decodeGroupRiskSnapshot([authoritativeRisk], 'group-1')).toEqual(
      expect.objectContaining({ level: 'at_risk' })
    );
  });

  it('does not turn the legacy low stub or missing facts into all-clear', () => {
    expect(
      decodeGroupRiskSnapshot({
        group_id: 'group-1',
        risk_level: 'low',
        missed_count: 0,
      })
    ).toBeNull();
  });

  it('rejects inconsistent counts, risk labels, or a different group', () => {
    expect(
      decodeGroupRiskSnapshot(
        { ...authoritativeRisk, submitted_today: 5 },
        'group-1'
      )
    ).toBeNull();
    expect(
      decodeGroupRiskSnapshot(
        { ...authoritativeRisk, risk_level: 'critical' },
        'group-1'
      )
    ).toBeNull();
    expect(
      decodeGroupRiskSnapshot(authoritativeRisk, 'different-group')
    ).toBeNull();
  });
});
