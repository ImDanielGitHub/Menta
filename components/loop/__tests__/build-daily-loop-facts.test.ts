import {
  buildInitialServerFacts,
  buildReadyServerFacts,
  markServerFactsFailed,
  markServerFactsRefreshing,
} from '@/components/loop/build-daily-loop-facts';
import { selectDailyLoopState } from '@/lib/loop';

const NOW = '2026-08-03T00:30:00.000Z';
const TIMEZONE = 'Pacific/Auckland';

describe('Today server facts', () => {
  it('carries only a valid server extension deadline into the obligation', () => {
    const build = (extensionProofDueAtIso: string | null) =>
      buildReadyServerFacts({
        nowIso: NOW,
        timezone: TIMEZONE,
        submissions: [
          {
            challengeId: 'promise-1',
            challengeTitle: 'Evening walk',
            isSolo: true,
          },
        ],
        statuses: [
          {
            challengeId: 'promise-1',
            proofStatus: 'none',
            extensionProofDueAtIso,
          },
        ],
        reviews: [],
        groupRisks: [],
      });

    expect(build('2026-08-04T12:00:00.000Z').obligations[0].dueAtIso).toBe(
      '2026-08-04T12:00:00.000Z'
    );
    expect(build('tomorrow at lunch').obligations[0].dueAtIso).toBeNull();
    expect(build(null).obligations[0].dueAtIso).toBeNull();
  });

  it('keeps a prior ready snapshot intact while refresh is in flight or fails', () => {
    const ready = buildReadyServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
      submissions: [],
      statuses: [],
      reviews: [],
      groupRisks: [],
    });

    const refreshing = markServerFactsRefreshing(ready);
    const failed = markServerFactsFailed(refreshing);

    expect(refreshing).toEqual({ ...ready, fetchStatus: 'loading' });
    expect(failed).toEqual({ ...ready, fetchStatus: 'failed' });

    expect(
      selectDailyLoopState({
        server: refreshing,
        local: { isOnline: true, overlays: [] },
        nowIso: NOW,
      })
    ).toMatchObject({
      state: 'no-promises',
      hasServerSnapshot: true,
      isStale: false,
    });

    const selection = selectDailyLoopState({
      server: failed,
      local: { isOnline: true, overlays: [] },
      nowIso: NOW,
    });

    expect(selection.state).toBe('load-failed');
    expect(selection.hasServerSnapshot).toBe(true);
    expect(selection.reason).toBe('stale-snapshot-fetch-failed-no-action');
  });

  it('never turns a first failed fetch into an all-clear day', () => {
    const initial = buildInitialServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
    });
    const failed = markServerFactsFailed(initial);

    const selection = selectDailyLoopState({
      server: failed,
      local: { isOnline: true, overlays: [] },
      nowIso: NOW,
    });

    expect(selection.state).toBe('load-failed');
    expect(selection.state).not.toBe('all-clear');
    expect(selection.state).not.toBe('no-promises');
  });

  it('keeps correction facts authoritative without inventing a receipt', () => {
    const facts = buildReadyServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
      submissions: [
        {
          challengeId: 'promise-1',
          challengeTitle: 'Dawn walk',
          groupId: 'group-1',
          isSolo: false,
        },
      ],
      statuses: [
        {
          challengeId: 'promise-1',
          proofStatus: 'rejected',
          verificationId: 'submission-1',
          correctionReason: 'Show the full route marker.',
          streakCount: 4,
        },
      ],
      reviews: [],
      groupRisks: [],
    });

    expect(facts.obligations).toEqual([
      expect.objectContaining({
        challengeId: 'promise-1',
        proofStatus: 'rejected',
        correctionReason: 'Show the full route marker.',
      }),
    ]);
    expect(facts.lastConfirmedReceipt).toBeNull();
    expect(
      selectDailyLoopState({
        server: facts,
        local: { isOnline: true, overlays: [] },
        nowIso: NOW,
      }).state
    ).toBe('correction-requested');
  });

  it('retains a server-confirmed outcome without deriving one from a zero streak', () => {
    const facts = buildReadyServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
      submissions: [
        {
          challengeId: 'promise-1',
          challengeTitle: 'Dawn walk',
          isSolo: true,
        },
        {
          challengeId: 'promise-2',
          challengeTitle: 'Evening note',
          isSolo: true,
        },
      ],
      statuses: [
        {
          challengeId: 'promise-1',
          proofStatus: 'none',
          streakCount: 0,
          streakOutcome: 'missed',
          outcomeLocalDay: '2026-08-02',
          previousStreak: 4,
          resultingStreak: 0,
          freezeUsed: false,
          freezesRemaining: 0,
        },
        {
          challengeId: 'promise-2',
          proofStatus: 'none',
          streakCount: 0,
        },
      ],
      reviews: [],
      groupRisks: [],
    });

    expect(facts.obligations[0]).toMatchObject({
      streakOutcome: 'missed',
      outcomeLocalDay: '2026-08-02',
      previousStreak: 4,
    });
    expect(facts.obligations[1].streakOutcome).toBeNull();
  });

  it('keeps v2 identity, status, day, and timezone separate for the same challenge in two groups', () => {
    const facts = buildReadyServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
      submissions: [
        {
          obligationKey: 'obligation-auckland',
          challengeId: 'shared-promise',
          challengeTitle: 'Morning walk',
          groupId: 'group-auckland',
          isSolo: false,
          localDay: '2026-08-03',
          effectiveTimezone: 'Pacific/Auckland',
        },
        {
          obligationKey: 'obligation-la',
          challengeId: 'shared-promise',
          challengeTitle: 'Morning walk',
          groupId: 'group-la',
          isSolo: false,
          localDay: '2026-08-02',
          effectiveTimezone: 'America/Los_Angeles',
        },
      ],
      statuses: [
        {
          obligationKey: 'obligation-auckland',
          challengeId: 'shared-promise',
          groupId: 'group-auckland',
          localDay: '2026-08-03',
          effectiveTimezone: 'Pacific/Auckland',
          proofStatus: 'approved',
          verificationId: 'proof-auckland',
        },
        {
          obligationKey: 'obligation-la',
          challengeId: 'shared-promise',
          groupId: 'group-la',
          localDay: '2026-08-02',
          effectiveTimezone: 'America/Los_Angeles',
          proofStatus: 'rejected',
          verificationId: 'proof-la',
          correctionReason: 'Show the route marker.',
        },
      ],
      reviews: [],
      groupRisks: [],
    });

    expect(facts.obligations).toEqual([
      expect.objectContaining({
        obligationKey: 'obligation-auckland',
        challengeId: 'shared-promise',
        groupId: 'group-auckland',
        localDay: '2026-08-03',
        timezone: 'Pacific/Auckland',
        proofStatus: 'approved',
        verificationId: 'proof-auckland',
      }),
      expect.objectContaining({
        obligationKey: 'obligation-la',
        challengeId: 'shared-promise',
        groupId: 'group-la',
        localDay: '2026-08-02',
        timezone: 'America/Los_Angeles',
        proofStatus: 'rejected',
        verificationId: 'proof-la',
        correctionReason: 'Show the route marker.',
      }),
    ]);
  });

  it('uses group-scoped obligation keys when the versioned key is unavailable', () => {
    const facts = buildReadyServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
      submissions: [
        {
          challengeId: 'shared-promise',
          challengeTitle: 'Morning walk',
          groupId: 'group-one',
          isSolo: false,
        },
        {
          challengeId: 'shared-promise',
          challengeTitle: 'Morning walk',
          groupId: 'group-two',
          isSolo: false,
        },
      ],
      statuses: [
        {
          challengeId: 'shared-promise',
          groupId: 'group-one',
          proofStatus: 'pending',
        },
        {
          challengeId: 'shared-promise',
          groupId: 'group-two',
          proofStatus: 'none',
        },
      ],
      reviews: [],
      groupRisks: [],
    });

    expect(facts.obligations).toEqual([
      expect.objectContaining({
        obligationKey: 'group-one:shared-promise',
        groupId: 'group-one',
        proofStatus: 'pending',
      }),
      expect.objectContaining({
        obligationKey: 'group-two:shared-promise',
        groupId: 'group-two',
        proofStatus: 'none',
      }),
    ]);
  });

  it('never promotes snapshot fetch time into an accepted receipt', () => {
    const facts = buildReadyServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
      submissions: [
        {
          challengeId: 'promise-1',
          challengeTitle: 'Dawn walk',
          isSolo: true,
        },
      ],
      statuses: [
        {
          challengeId: 'promise-1',
          proofStatus: 'approved',
          verificationId: 'submission-1',
        },
      ],
      reviews: [],
      groupRisks: [],
    });

    const selection = selectDailyLoopState({
      server: facts,
      local: { isOnline: true, overlays: [] },
      nowIso: NOW,
    });

    expect(facts.fetchedAtIso).toBe(NOW);
    expect(facts.lastConfirmedReceipt).toBeNull();
    expect(selection.state).toBe('all-clear');
    expect(selection.receiptIsFresh).toBe(false);
  });

  it('expires accepted-today from the server receipt time, not a later refresh', () => {
    const receiptConfirmedAtIso = '2026-08-03T00:00:00.000Z';
    const buildAcceptedFacts = (nowIso: string) =>
      buildReadyServerFacts({
        nowIso,
        timezone: TIMEZONE,
        submissions: [
          {
            challengeId: 'promise-1',
            challengeTitle: 'Dawn walk',
            isSolo: true,
          },
        ],
        statuses: [
          {
            challengeId: 'promise-1',
            proofStatus: 'approved',
            verificationId: 'submission-1',
            receiptConfirmedAtIso,
          },
        ],
        reviews: [],
        groupRisks: [],
      });

    const freshFacts = buildAcceptedFacts(NOW);
    const freshSelection = selectDailyLoopState({
      server: freshFacts,
      local: { isOnline: true, overlays: [] },
      nowIso: NOW,
    });

    expect(freshFacts.lastConfirmedReceipt).toMatchObject({
      kind: 'accepted',
      confirmedAtIso: receiptConfirmedAtIso,
    });
    expect(freshSelection.state).toBe('accepted-today');

    const laterNow = '2026-08-03T07:00:00.000Z';
    const laterFacts = buildAcceptedFacts(laterNow);
    const laterSelection = selectDailyLoopState({
      server: laterFacts,
      local: { isOnline: true, overlays: [] },
      nowIso: laterNow,
    });

    expect(laterFacts.lastConfirmedReceipt?.confirmedAtIso).toBe(
      receiptConfirmedAtIso
    );
    expect(laterSelection.state).toBe('all-clear');
    expect(laterSelection.receiptIsFresh).toBe(false);
  });

  it('retains authoritative group progress facts for the Today risk action', () => {
    const facts = buildReadyServerFacts({
      nowIso: NOW,
      timezone: TIMEZONE,
      submissions: [],
      statuses: [],
      reviews: [],
      groupRisks: [
        {
          groupId: 'group-1',
          groupName: 'Release Walk Crew',
          level: 'at_risk',
          totalMembers: 3,
          submittedToday: 2,
          pendingSubmissions: 1,
          pendingReviews: 1,
          endOfDayIso: '2026-08-03T11:00:00.000Z',
          secondsRemaining: 37_800,
          missesToBreakStreak: 2,
        },
      ],
    });

    expect(facts.groupRisks).toEqual([
      {
        groupId: 'group-1',
        groupName: 'Release Walk Crew',
        level: 'at_risk',
        totalMembers: 3,
        submittedToday: 2,
        pendingSubmissions: 1,
        pendingReviews: 1,
        endOfDayIso: '2026-08-03T11:00:00.000Z',
        secondsRemaining: 37_800,
        missesToBreakStreak: 2,
      },
    ]);
  });
});
