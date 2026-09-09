import {
  buildGroupAccountabilitySnapshot,
  GROUP_BOARD_NUDGE_UNAVAILABLE,
  selectGroupBoardState,
  type SelectGroupBoardStateInput,
} from '../group-accountability-board';

const members = [
  {
    userId: 'maya',
    name: 'Maya',
    avatarUrl: null,
    isCurrentUser: false,
  },
  {
    userId: 'ari',
    name: 'Ari',
    avatarUrl: null,
    isCurrentUser: false,
  },
  {
    userId: 'you',
    name: 'You',
    avatarUrl: null,
    isCurrentUser: true,
  },
];

describe('buildGroupAccountabilitySnapshot', () => {
  it('maps the newest daily proof into each visible board state', () => {
    const snapshot = buildGroupAccountabilitySnapshot({
      members,
      submissions: [
        {
          id: 'maya-old',
          userId: 'maya',
          status: 'pending',
          mediaType: 'photo',
          submittedAt: '2026-08-04T08:00:00.000Z',
        },
        {
          id: 'maya-approved',
          userId: 'maya',
          status: 'approved',
          mediaType: 'photo',
          submittedAt: '2026-08-04T09:00:00.000Z',
        },
        {
          id: 'ari-pending',
          userId: 'ari',
          status: 'pending',
          mediaType: 'text',
          submittedAt: '2026-08-04T08:30:00.000Z',
        },
      ],
    });

    expect(snapshot).toMatchObject({
      completedCount: 1,
      pendingCount: 1,
      dueCount: 1,
      retryCount: 0,
      remainingCount: 2,
      totalCount: 3,
      approvedRate: 33,
    });
    expect(snapshot.members).toEqual([
      expect.objectContaining({
        name: 'Maya',
        status: 'done',
        statusLabel: 'Approved',
        detail: 'Photo proof',
        submissionId: 'maya-approved',
      }),
      expect.objectContaining({
        name: 'Ari',
        status: 'pending',
        statusLabel: 'Waiting for review',
        detail: 'Text check-in · does not count yet',
      }),
      expect.objectContaining({
        name: 'You',
        status: 'due',
        statusLabel: 'Proof due',
        detail: 'No proof submitted yet',
      }),
    ]);
  });

  it('distinguishes another member who needs a nudge from a rejected retry', () => {
    const snapshot = buildGroupAccountabilitySnapshot({
      members,
      submissions: [
        {
          id: 'you-rejected',
          userId: 'you',
          status: 'rejected',
          mediaType: 'video',
          submittedAt: '2026-08-04T10:00:00.000Z',
        },
      ],
    });

    expect(snapshot.members[0]).toMatchObject({
      status: 'nudge',
      statusLabel: 'Proof due',
    });
    expect(snapshot.members[2]).toMatchObject({
      status: 'retry',
      statusLabel: 'Needs a clearer proof',
      detail: 'Send a clearer proof to finish today',
    });
    expect(snapshot).toMatchObject({ dueCount: 2, retryCount: 1 });
  });
});

const baseSelection: SelectGroupBoardStateInput = {
  hasGroup: true,
  groupStatus: 'active',
  groupPrivacy: 'private',
  isMember: true,
  isOwner: false,
  hasPromise: true,
  isInitialLoading: false,
  hasCachedData: true,
  hasError: false,
  isPaused: false,
};

describe('selectGroupBoardState', () => {
  it.each([
    [
      'loading',
      {
        ...baseSelection,
        hasGroup: false,
        hasCachedData: false,
        isInitialLoading: true,
      },
    ],
    ['active-member', baseSelection],
    ['owner', { ...baseSelection, isOwner: true }],
    ['empty', { ...baseSelection, hasPromise: false }],
    [
      'public-preview',
      {
        ...baseSelection,
        groupPrivacy: 'public',
        isMember: false,
        hasPromise: false,
      },
    ],
    ['read-only', { ...baseSelection, groupStatus: 'expired' }],
    ['stale', { ...baseSelection, hasError: true }],
    [
      'unavailable',
      {
        ...baseSelection,
        hasGroup: false,
        hasCachedData: false,
        hasError: true,
      },
    ],
  ] satisfies ReadonlyArray<[string, SelectGroupBoardStateInput]>)(
    'selects %s without collapsing an error into empty',
    (expected, input) => {
      expect(selectGroupBoardState(input)).toBe(expected);
    }
  );

  it('uses stale only when a paused read has known data', () => {
    expect(selectGroupBoardState({ ...baseSelection, isPaused: true })).toBe(
      'stale'
    );
    expect(
      selectGroupBoardState({
        ...baseSelection,
        hasGroup: false,
        hasCachedData: false,
        isPaused: true,
      })
    ).toBe('unavailable');
  });
});

describe('group nudge boundary', () => {
  it('records the server contracts required before a nudge action can ship', () => {
    expect(GROUP_BOARD_NUDGE_UNAVAILABLE).toMatchObject({
      status: 'unavailable',
      code: 'server-owned-nudge-receipt-contract-missing',
      label: 'Reminders unavailable',
    });
    expect(GROUP_BOARD_NUDGE_UNAVAILABLE.missingContract).toEqual([
      'group-scoped target permission',
      'server-owned daily idempotency',
      'requester-visible delivery receipt',
      'push-provider receipt reconciliation',
    ]);
  });
});
