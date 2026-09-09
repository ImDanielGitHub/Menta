import {
  DAILY_LOOP_STATE_PRECEDENCE,
  dailyLoopStateRank,
  selectDailyLoopState,
} from '@/lib/loop';
import type {
  ConfirmedReceipt,
  DailyLoopInput,
  DailyLoopLocalOverlay,
  DailyLoopServerFacts,
  DailyLoopState,
  LocalProofOverlayFact,
  ServerGroupRiskFact,
  ServerObligationFact,
  ServerReviewFact,
} from '@/lib/loop';

const NOW = '2026-08-02T10:00:00.000Z';
const TIMEZONE = 'Pacific/Auckland';
const LOCAL_DAY = '2026-08-02';

const baseServer = (
  overrides: Partial<DailyLoopServerFacts> = {}
): DailyLoopServerFacts => ({
  fetchStatus: 'ready',
  hasServerSnapshot: true,
  fetchedAtIso: NOW,
  timezone: TIMEZONE,
  localDay: LOCAL_DAY,
  obligations: [],
  pendingReviews: [],
  groupRisks: [],
  lastConfirmedReceipt: null,
  ...overrides,
});

const baseLocal = (
  overrides: Partial<DailyLoopLocalOverlay> = {}
): DailyLoopLocalOverlay => ({
  isOnline: true,
  overlays: [],
  ...overrides,
});

const input = (
  server: Partial<DailyLoopServerFacts> = {},
  local: Partial<DailyLoopLocalOverlay> = {}
): DailyLoopInput => ({
  server: baseServer(server),
  local: baseLocal(local),
  nowIso: NOW,
});

const obligation = (
  overrides: Partial<ServerObligationFact> &
    Pick<ServerObligationFact, 'challengeId' | 'proofStatus'>
): ServerObligationFact => ({
  obligationKey: `${overrides.groupId ?? 'solo'}:${overrides.challengeId}`,
  title: 'Morning walk',
  localDay: LOCAL_DAY,
  timezone: TIMEZONE,
  isSolo: true,
  ...overrides,
});

const overlay = (
  overrides: Partial<LocalProofOverlayFact> &
    Pick<LocalProofOverlayFact, 'clientEventId' | 'challengeId' | 'status'>
): LocalProofOverlayFact => ({
  localDay: LOCAL_DAY,
  updatedAtIso: NOW,
  ...overrides,
});

const review = (
  overrides: Partial<ServerReviewFact> = {}
): ServerReviewFact => ({
  reviewId: 'rev-1',
  challengeId: 'ch-1',
  challengeTitle: 'Morning walk',
  submitterName: 'Alex',
  submittedAtIso: NOW,
  ...overrides,
});

const risk = (
  overrides: Partial<ServerGroupRiskFact> &
    Pick<ServerGroupRiskFact, 'groupId' | 'level'>
): ServerGroupRiskFact => ({
  groupName: 'Walk crew',
  ...overrides,
});

const acceptedReceipt = (
  overrides: Partial<ConfirmedReceipt> = {}
): ConfirmedReceipt => ({
  kind: 'accepted',
  challengeId: 'ch-1',
  localDay: LOCAL_DAY,
  confirmedAtIso: '2026-08-02T09:00:00.000Z',
  ...overrides,
});

describe('today-state daily loop contract', () => {
  it('exports a complete deterministic precedence list', () => {
    const expected: DailyLoopState[] = [
      'loading',
      'offline-stale',
      'load-failed',
      'correction-requested',
      'proof-saved-local',
      'proof-uploading',
      'returning',
      'streak-broken',
      'proof-due',
      'proof-pending-review',
      'review-required',
      'group-at-risk',
      'no-promises',
      'accepted-today',
      'all-clear',
    ];

    expect([...DAILY_LOOP_STATE_PRECEDENCE]).toEqual(expected);
    expect(dailyLoopStateRank('loading')).toBeLessThan(
      dailyLoopStateRank('all-clear')
    );
    expect(dailyLoopStateRank('correction-requested')).toBeLessThan(
      dailyLoopStateRank('proof-due')
    );
    expect(dailyLoopStateRank('proof-due')).toBeLessThan(
      dailyLoopStateRank('review-required')
    );
  });

  it('returns loading before first successful snapshot', () => {
    expect(
      selectDailyLoopState(
        input({
          fetchStatus: 'loading',
          hasServerSnapshot: false,
          fetchedAtIso: null,
        })
      ).state
    ).toBe('loading');

    expect(
      selectDailyLoopState(
        input({
          fetchStatus: 'idle',
          hasServerSnapshot: false,
          fetchedAtIso: null,
        })
      ).state
    ).toBe('loading');
  });

  it.each([
    {
      expectedState: 'no-promises' as const,
      obligations: [],
    },
    {
      expectedState: 'all-clear' as const,
      obligations: [
        obligation({ challengeId: 'ch-clear', proofStatus: 'approved' }),
      ],
    },
  ])(
    'keeps confirmed $expectedState content visible during pull-to-refresh',
    ({ expectedState, obligations }) => {
      const selection = selectDailyLoopState(
        input({
          fetchStatus: 'loading',
          hasServerSnapshot: true,
          obligations,
        })
      );

      expect(selection).toMatchObject({
        state: expectedState,
        hasServerSnapshot: true,
        isStale: false,
      });
      expect(selection.state).not.toBe('loading');
    }
  );

  it('never collapses fetch failure without a snapshot to all-clear', () => {
    const selection = selectDailyLoopState(
      input({
        fetchStatus: 'failed',
        hasServerSnapshot: false,
        fetchedAtIso: null,
        obligations: [],
        pendingReviews: [],
        groupRisks: [],
      })
    );

    expect(selection.state).toBe('load-failed');
    expect(selection.state).not.toBe('all-clear');
    expect(selection.state).not.toBe('no-promises');
    expect(selection.primaryAction).toBe('retry-load');
  });

  it('never collapses offline without a snapshot to all-clear', () => {
    const selection = selectDailyLoopState(
      input(
        {
          fetchStatus: 'failed',
          hasServerSnapshot: false,
          fetchedAtIso: null,
        },
        { isOnline: false }
      )
    );

    expect(selection.state).toBe('offline-stale');
    expect(selection.isStale).toBe(true);
  });

  it('keeps actionable stale content when offline with a snapshot', () => {
    const selection = selectDailyLoopState(
      input(
        {
          fetchStatus: 'failed',
          hasServerSnapshot: true,
          obligations: [
            obligation({ challengeId: 'ch-1', proofStatus: 'none' }),
          ],
        },
        { isOnline: false }
      )
    );

    expect(selection.state).toBe('proof-due');
    expect(selection.isStale).toBe(true);
    expect(selection.primaryChallengeId).toBe('ch-1');
  });

  it('blocks all-clear when a stale snapshot has no actionable work', () => {
    expect(
      selectDailyLoopState(
        input(
          {
            fetchStatus: 'failed',
            hasServerSnapshot: true,
            obligations: [
              obligation({ challengeId: 'ch-1', proofStatus: 'approved' }),
            ],
          },
          { isOnline: true }
        )
      ).state
    ).toBe('load-failed');

    expect(
      selectDailyLoopState(
        input(
          {
            fetchStatus: 'ready',
            hasServerSnapshot: true,
            obligations: [
              obligation({ challengeId: 'ch-1', proofStatus: 'approved' }),
            ],
          },
          { isOnline: false }
        )
      ).state
    ).toBe('offline-stale');
  });

  it('selects no-promises only after a ready empty snapshot', () => {
    const selection = selectDailyLoopState(
      input({
        fetchStatus: 'ready',
        hasServerSnapshot: true,
        obligations: [],
      })
    );

    expect(selection.state).toBe('no-promises');
    expect(selection.primaryAction).toBe('create-promise');
  });

  it('selects proof-due for none status and ignores boolean-style done leaks', () => {
    const selection = selectDailyLoopState(
      input({
        obligations: [
          obligation({ challengeId: 'ch-due', proofStatus: 'none' }),
          obligation({
            challengeId: 'ch-pending',
            proofStatus: 'pending',
            isSolo: false,
          }),
        ],
        pendingReviews: [review()],
      })
    );

    expect(selection.state).toBe('proof-due');
    expect(selection.dueCount).toBe(1);
    expect(selection.pendingOwnProofCount).toBe(1);
    expect(selection.pendingReviewCount).toBe(1);
    expect(selection.primaryChallengeId).toBe('ch-due');
  });

  it('selects a confirmed broken streak over ordinary proof due', () => {
    const selection = selectDailyLoopState(
      input({
        obligations: [
          obligation({
            challengeId: 'ch-broken',
            proofStatus: 'none',
            streakCount: 0,
            streakOutcome: 'missed',
            outcomeLocalDay: '2026-08-01',
            previousStreak: 4,
            resultingStreak: 0,
            daysSinceAcceptedCheckIn: 1,
          }),
        ],
      })
    );

    expect(selection).toMatchObject({
      state: 'streak-broken',
      primaryAction: 'submit-proof',
      primaryChallengeId: 'ch-broken',
    });
  });

  it('uses returning only for a confirmed unresolved break after inactivity', () => {
    const selection = selectDailyLoopState(
      input({
        obligations: [
          obligation({
            challengeId: 'ch-return',
            proofStatus: 'none',
            streakCount: 0,
            streakOutcome: 'missed',
            outcomeLocalDay: '2026-07-26',
            previousStreak: 8,
            resultingStreak: 0,
            daysSinceAcceptedCheckIn: 6,
          }),
        ],
      })
    );

    expect(selection).toMatchObject({
      state: 'returning',
      primaryAction: 'create-promise',
    });
  });

  it('never invents a miss and stops the break from staying dominant after restart', () => {
    const noOutcome = selectDailyLoopState(
      input({
        obligations: [
          obligation({
            challengeId: 'ch-no-outcome',
            proofStatus: 'none',
            streakCount: 0,
            streakOutcome: null,
          }),
        ],
      })
    );
    const restarted = selectDailyLoopState(
      input({
        obligations: [
          obligation({
            challengeId: 'ch-restarted',
            proofStatus: 'none',
            streakCount: 2,
            streakOutcome: 'missed',
            outcomeLocalDay: '2026-07-28',
            previousStreak: 4,
            resultingStreak: 0,
            daysSinceAcceptedCheckIn: 1,
          }),
        ],
      })
    );

    expect(noOutcome.state).toBe('proof-due');
    expect(restarted.state).toBe('proof-due');
  });

  it('keeps a protected receipt without hiding today’s proof', () => {
    const selection = selectDailyLoopState(
      input({
        obligations: [
          obligation({
            challengeId: 'ch-protected',
            proofStatus: 'none',
            streakCount: 4,
            streakOutcome: 'protected',
            outcomeLocalDay: '2026-08-01',
            previousStreak: 4,
            resultingStreak: 4,
            freezeUsed: true,
          }),
        ],
      })
    );

    expect(selection.state).toBe('proof-due');
    expect(selection.protectedOutcome).toMatchObject({
      challengeId: 'ch-protected',
      streakOutcome: 'protected',
    });
  });

  it('prefers correction-requested over due, local, and review', () => {
    const selection = selectDailyLoopState(
      input(
        {
          obligations: [
            obligation({ challengeId: 'ch-fix', proofStatus: 'rejected' }),
            obligation({ challengeId: 'ch-due', proofStatus: 'none' }),
          ],
          pendingReviews: [review()],
        },
        {
          overlays: [
            overlay({
              clientEventId: 'evt-1',
              challengeId: 'ch-due',
              status: 'saved-local',
            }),
          ],
        }
      )
    );

    expect(selection.state).toBe('correction-requested');
    expect(selection.primaryChallengeId).toBe('ch-fix');
    expect(selection.primaryAction).toBe('resubmit-proof');
  });

  it('prefers local saved and uploading overlays over server due', () => {
    expect(
      selectDailyLoopState(
        input(
          {
            obligations: [
              obligation({ challengeId: 'ch-1', proofStatus: 'none' }),
            ],
          },
          {
            overlays: [
              overlay({
                clientEventId: 'evt-saved',
                challengeId: 'ch-1',
                status: 'saved-local',
              }),
            ],
          }
        )
      )
    ).toMatchObject({
      state: 'proof-saved-local',
      primaryClientEventId: 'evt-saved',
      primaryAction: 'resume-local-proof',
    });

    expect(
      selectDailyLoopState(
        input(
          {
            obligations: [
              obligation({ challengeId: 'ch-1', proofStatus: 'none' }),
            ],
          },
          {
            overlays: [
              overlay({
                clientEventId: 'evt-up',
                challengeId: 'ch-1',
                status: 'uploading',
              }),
            ],
          }
        )
      )
    ).toMatchObject({
      state: 'proof-uploading',
      primaryClientEventId: 'evt-up',
      primaryAction: 'wait-upload',
    });
  });

  it('maps unknown-result and terminal-failure overlays to saved-local attention', () => {
    expect(
      selectDailyLoopState(
        input(
          {
            obligations: [
              obligation({ challengeId: 'ch-1', proofStatus: 'none' }),
            ],
          },
          {
            overlays: [
              overlay({
                clientEventId: 'evt-unk',
                challengeId: 'ch-1',
                status: 'unknown-result',
              }),
            ],
          }
        )
      ).reason
    ).toBe('local-proof-unknown-result');
  });

  it('selects pending review before peer review and group risk', () => {
    const selection = selectDailyLoopState(
      input({
        obligations: [
          obligation({
            challengeId: 'ch-pending',
            proofStatus: 'pending',
            isSolo: false,
            groupId: 'g-1',
          }),
        ],
        pendingReviews: [review({ reviewId: 'rev-9' })],
        groupRisks: [risk({ groupId: 'g-1', level: 'critical' })],
      })
    );

    expect(selection.state).toBe('proof-pending-review');
    expect(selection.primaryChallengeId).toBe('ch-pending');
  });

  it('selects review-required when own proofs are clear', () => {
    const selection = selectDailyLoopState(
      input({
        obligations: [
          obligation({ challengeId: 'ch-1', proofStatus: 'approved' }),
        ],
        pendingReviews: [review({ reviewId: 'rev-22' })],
      })
    );

    expect(selection.state).toBe('review-required');
    expect(selection.primaryReviewId).toBe('rev-22');
    expect(selection.primaryAction).toBe('open-review');
  });

  it('selects group-at-risk only for at_risk or critical levels', () => {
    expect(
      selectDailyLoopState(
        input({
          obligations: [
            obligation({ challengeId: 'ch-1', proofStatus: 'approved' }),
          ],
          groupRisks: [risk({ groupId: 'g-safe', level: 'safe' })],
        })
      ).state
    ).toBe('all-clear');

    const selection = selectDailyLoopState(
      input({
        obligations: [
          obligation({ challengeId: 'ch-1', proofStatus: 'approved' }),
        ],
        groupRisks: [risk({ groupId: 'g-risk', level: 'at_risk' })],
      })
    );

    expect(selection.state).toBe('group-at-risk');
    expect(selection.primaryGroupId).toBe('g-risk');
    expect(selection.atRiskGroupCount).toBe(1);
  });

  it('selects accepted-today only for a fresh same-day accepted receipt', () => {
    const fresh = selectDailyLoopState(
      input({
        obligations: [
          obligation({ challengeId: 'ch-1', proofStatus: 'approved' }),
        ],
        lastConfirmedReceipt: acceptedReceipt(),
      })
    );

    expect(fresh.state).toBe('accepted-today');
    expect(fresh.receiptIsFresh).toBe(true);
    expect(fresh.primaryChallengeId).toBe('ch-1');

    const staleReceipt = selectDailyLoopState({
      ...input({
        obligations: [
          obligation({ challengeId: 'ch-1', proofStatus: 'approved' }),
        ],
        lastConfirmedReceipt: acceptedReceipt({
          confirmedAtIso: '2026-08-01T10:00:00.000Z',
          localDay: '2026-08-01',
        }),
      }),
      nowIso: NOW,
    });

    expect(staleReceipt.state).toBe('all-clear');
    expect(staleReceipt.receiptIsFresh).toBe(false);
  });

  it('exposes day and timezone fields for Today integration', () => {
    const selection = selectDailyLoopState(
      input({
        obligations: [obligation({ challengeId: 'ch-1', proofStatus: 'none' })],
      })
    );

    expect(selection.timezone).toBe(TIMEZONE);
    expect(selection.localDay).toBe(LOCAL_DAY);
    expect(selection.nowIso).toBe(NOW);
    expect(selection.hasServerSnapshot).toBe(true);
  });

  it('ignores overlays from a different local day', () => {
    const selection = selectDailyLoopState(
      input(
        {
          obligations: [
            obligation({ challengeId: 'ch-1', proofStatus: 'none' }),
          ],
        },
        {
          overlays: [
            overlay({
              clientEventId: 'evt-old',
              challengeId: 'ch-1',
              status: 'saved-local',
              localDay: '2026-08-01',
            }),
          ],
        }
      )
    );

    expect(selection.state).toBe('proof-due');
  });

  it('keeps a confirmed empty day on screen while a refresh runs', () => {
    // Pull-to-refresh used to replace a confirmed all-clear with a full skeleton,
    // which threw away a known result and read as a cold load. The native
    // RefreshControl owns progress, so the confirmed snapshot is not stale.
    const selection = selectDailyLoopState(
      input({ fetchStatus: 'loading', hasServerSnapshot: true })
    );

    expect(selection.state).toBe('no-promises');
    expect(selection.isStale).toBe(false);
  });

  it('still shows loading when no snapshot has ever arrived', () => {
    const selection = selectDailyLoopState(
      input({
        fetchStatus: 'loading',
        hasServerSnapshot: false,
        fetchedAtIso: null,
      })
    );

    expect(selection.state).toBe('loading');
  });

  it('does not claim an empty day when a refresh failed or went offline', () => {
    expect(selectDailyLoopState(input({ fetchStatus: 'failed' })).state).toBe(
      'load-failed'
    );
    expect(selectDailyLoopState(input({}, { isOnline: false })).state).toBe(
      'offline-stale'
    );
  });
});
