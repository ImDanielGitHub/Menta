import { resolveTodayPresentation } from '@/components/loop/today-copy';
import type {
  DailyLoopPrimaryAction,
  DailyLoopSelection,
  DailyLoopState,
} from '@/lib/loop';

const actions: Record<DailyLoopState, DailyLoopPrimaryAction> = {
  loading: 'wait',
  'offline-stale': 'retry-load',
  'load-failed': 'retry-load',
  'streak-broken': 'submit-proof',
  returning: 'create-promise',
  'no-promises': 'create-promise',
  'proof-due': 'submit-proof',
  'proof-saved-local': 'resume-local-proof',
  'proof-uploading': 'wait-upload',
  'proof-pending-review': 'view-pending-proof',
  'correction-requested': 'resubmit-proof',
  'review-required': 'open-review',
  'group-at-risk': 'open-group',
  'accepted-today': 'none',
  'all-clear': 'none',
};

const createSelection = (
  state: DailyLoopState,
  reason = 'test-state'
): DailyLoopSelection => ({
  state,
  timezone: 'Pacific/Auckland',
  localDay: '2026-08-03',
  nowIso: '2026-08-03T00:30:00.000Z',
  hasServerSnapshot: state !== 'loading',
  isStale: state === 'offline-stale' || state === 'load-failed',
  primaryAction: actions[state],
  primaryChallengeId: null,
  primaryGroupId: null,
  primaryReviewId: null,
  primaryClientEventId: null,
  dueCount: 0,
  pendingOwnProofCount: 0,
  correctionCount: 0,
  pendingReviewCount: state === 'review-required' ? 1 : 0,
  atRiskGroupCount: state === 'group-at-risk' ? 1 : 0,
  lastConfirmedReceipt: null,
  receiptIsFresh: false,
  protectedOutcome: null,
  reason,
});

const resolve = (state: DailyLoopState, reason?: string) =>
  resolveTodayPresentation({
    selection: createSelection(state, reason),
    obligations: [],
    pendingReviews: [],
    groupRisks: [],
    now: new Date('2026-08-03T00:30:00.000Z'),
  });

describe('Today copy contract', () => {
  it.each<DailyLoopState>([
    'loading',
    'offline-stale',
    'load-failed',
    'streak-broken',
    'returning',
    'no-promises',
    'proof-due',
    'proof-saved-local',
    'proof-uploading',
    'proof-pending-review',
    'correction-requested',
    'review-required',
    'group-at-risk',
    'accepted-today',
    'all-clear',
  ])('has a concrete presentation for %s', state => {
    const presentation = resolve(state);

    expect(presentation.state).toBe(state);
    expect(presentation.title).not.toHaveLength(0);
    expect(presentation.detail).not.toHaveLength(0);
  });

  it('keeps an unknown local send honest and resumable', () => {
    const presentation = resolve(
      'proof-saved-local',
      'local-proof-unknown-result'
    );

    expect(presentation.primaryLabel).toBe('Check proof status');
    expect(presentation.title).toBe('Menta could not confirm the send.');
    expect(presentation.detail).not.toContain('sent');
  });

  it('passes an authoritative extension deadline to the proof countdown', () => {
    const selection = {
      ...createSelection('proof-due'),
      primaryChallengeId: 'promise-1',
      dueCount: 1,
    };
    const presentation = resolveTodayPresentation({
      selection,
      obligations: [
        {
          obligationKey: 'solo:promise-1',
          challengeId: 'promise-1',
          title: 'Evening walk',
          verificationType: 'photo',
          localDay: '2026-08-03',
          timezone: 'Pacific/Auckland',
          proofStatus: 'none',
          isSolo: true,
          dueAtIso: '2026-08-04T12:00:00.000Z',
          atRisk: false,
        },
      ],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T10:00:00.000Z'),
    });

    expect(presentation.countdown?.dueAtIso).toBe('2026-08-04T12:00:00.000Z');
  });

  it('keeps a terminal local send factually distinct from server acceptance', () => {
    const presentation = resolve(
      'proof-saved-local',
      'local-proof-terminal-failure'
    );

    expect(presentation.primaryLabel).toBe('Try sending again');
    expect(presentation.title).toBe('Proof stayed on this phone.');
  });

  it('keeps the empty Today aligned with the Paper orientation and actions', () => {
    const presentation = resolve('no-promises');

    expect(presentation.layout).toBe('empty');
    expect(presentation.title).toBe('Nothing is due yet.');
    expect(presentation.detail).toBe(
      'Make one promise and Menta will show you what needs attention each day.'
    );
    expect(presentation.primaryLabel).toBe('Make a promise');
    expect(presentation.secondaryLabel).toBe('Join an existing group');
    expect(presentation.mascot).toBe('promise-guide');
  });

  it('offers one real recovery action when a refresh fails', () => {
    const presentation = resolve('load-failed');

    expect(presentation.primaryLabel).toBe('Try again');
    expect(presentation.secondaryLabel).toBeNull();
  });

  it('uses the exact server day and prior run for the broken state', () => {
    const selection = {
      ...createSelection('streak-broken'),
      primaryChallengeId: 'challenge-1',
    };
    const presentation = resolveTodayPresentation({
      selection,
      obligations: [
        {
          obligationKey: 'solo:challenge-1',
          challengeId: 'challenge-1',
          title: 'Morning focus',
          localDay: selection.localDay,
          timezone: selection.timezone,
          proofStatus: 'none',
          isSolo: true,
          streakCount: 0,
          streakOutcome: 'missed',
          outcomeLocalDay: '2026-08-01',
          previousStreak: 4,
          resultingStreak: 0,
        },
      ],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T00:30:00.000Z'),
    });

    expect(presentation.title).toBe('Saturday was missed. Start again today.');
    expect(presentation.mascot).toBe('calm-warning');
    expect(presentation.detail).toContain(
      'Saturday’s proof was not received in time'
    );
    expect(presentation.detail).toContain('last run ended at 4 days');
    expect(presentation.primaryLabel).toBe('Start a one-day return');
    expect(presentation.secondaryLabel).toBe('View 4-day history');
  });

  it('uses the server inactivity count without claiming a quest', () => {
    const selection = {
      ...createSelection('returning'),
      primaryChallengeId: 'challenge-1',
    };
    const presentation = resolveTodayPresentation({
      selection,
      obligations: [
        {
          obligationKey: 'solo:challenge-1',
          challengeId: 'challenge-1',
          title: 'Morning focus',
          localDay: selection.localDay,
          timezone: selection.timezone,
          proofStatus: 'none',
          isSolo: true,
          daysSinceAcceptedCheckIn: 6,
        },
      ],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T00:30:00.000Z'),
    });

    expect(presentation.title).toBe('Ready to start again?');
    expect(presentation.detail).toBe(
      'It’s been 6 days since your last check-in. Start a new promise, or go back to one you were working on.'
    );
    expect(presentation.detail).not.toMatch(/quest/i);
    expect(presentation.primaryLabel).toBe('Start a new promise');
    expect(presentation.facts).toEqual([]);
    expect(presentation.supportingNote).toBeNull();
  });

  it.each([
    ['text', 'Add note proof', 'Add the note you agreed on'],
    ['video', 'Add proof video', 'Add the video you agreed on'],
    ['photo', 'Add proof photo', 'Add the photo you agreed on'],
  ] as const)(
    'names the agreed %s proof type in the due action',
    (verificationType, primaryLabel, detail) => {
      const selection = {
        ...createSelection('proof-due'),
        primaryChallengeId: 'challenge-1',
      };
      const presentation = resolveTodayPresentation({
        selection,
        obligations: [
          {
            obligationKey: 'solo:challenge-1',
            challengeId: 'challenge-1',
            title: 'Morning focus',
            verificationType,
            localDay: selection.localDay,
            timezone: selection.timezone,
            proofStatus: 'none',
            isSolo: true,
          },
        ],
        pendingReviews: [],
        groupRisks: [],
        now: new Date('2026-08-03T00:30:00.000Z'),
      });

      expect(presentation.primaryLabel).toBe(primaryLabel);
      expect(presentation.detail).toContain(detail);
    }
  );

  it('uses the selected group obligation when one challenge belongs to two groups', () => {
    const selection = {
      ...createSelection('proof-due'),
      primaryChallengeId: 'shared-challenge',
      primaryGroupId: 'group-two',
    };
    const presentation = resolveTodayPresentation({
      selection,
      obligations: [
        {
          obligationKey: 'group-one:shared-challenge',
          challengeId: 'shared-challenge',
          title: 'Morning focus',
          verificationType: 'text',
          groupId: 'group-one',
          localDay: selection.localDay,
          timezone: selection.timezone,
          proofStatus: 'none',
          isSolo: false,
        },
        {
          obligationKey: 'group-two:shared-challenge',
          challengeId: 'shared-challenge',
          title: 'Morning focus',
          verificationType: 'video',
          groupId: 'group-two',
          localDay: selection.localDay,
          timezone: selection.timezone,
          proofStatus: 'none',
          isSolo: false,
        },
      ],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T00:30:00.000Z'),
    });

    expect(presentation.primaryLabel).toBe('Add proof video');
    expect(presentation.detail).toContain('Add the video you agreed on');
  });

  it('attaches a local proof-due countdown only when Today is at risk', () => {
    const selection = {
      ...createSelection('proof-due'),
      primaryChallengeId: 'challenge-1',
    };
    const atRisk = resolveTodayPresentation({
      selection,
      obligations: [
        {
          obligationKey: 'solo:challenge-1',
          challengeId: 'challenge-1',
          title: 'Walk before dusk',
          localDay: selection.localDay,
          timezone: selection.timezone,
          proofStatus: 'none',
          isSolo: true,
          atRisk: true,
          streakCount: 12,
        },
      ],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T00:30:00.000Z'),
      preferredReminderTime: '20:00:00',
    });
    const due = resolveTodayPresentation({
      selection,
      obligations: [
        {
          obligationKey: 'solo:challenge-1',
          challengeId: 'challenge-1',
          title: 'Walk before dusk',
          localDay: selection.localDay,
          timezone: selection.timezone,
          proofStatus: 'none',
          isSolo: true,
          atRisk: false,
        },
      ],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T00:30:00.000Z'),
      preferredReminderTime: '20:00:00',
    });

    expect(atRisk.accent).toBe('warning');
    expect(atRisk.title).toBe('Walk before dusk');
    expect(atRisk.detail).toBe(
      'Your 12-day streak is still active. Aim to add a photo by 8:00 PM. Proof still counts until midnight.'
    );
    expect(atRisk.primaryLabel).toBe('Add proof photo');
    expect(atRisk.secondaryLabel).toBe('View promise');
    expect(atRisk.mascot).toBe('today-at-risk');
    expect(atRisk.supportingNote).toBeUndefined();
    expect(atRisk.countdown).toEqual({
      localDay: '2026-08-03',
      timeZone: 'Pacific/Auckland',
      preferredReminderTime: '20:00:00',
      promiseLabel: 'Walk before dusk',
      dueAtIso: null,
    });
    expect(due.countdown).toBeUndefined();
  });

  it.each([
    ['proof-saved-local', null],
    ['proof-uploading', null],
    ['proof-pending-review', null],
    ['correction-requested', null],
    ['review-required', null],
    ['group-at-risk', 'today-at-risk'],
    ['accepted-today', 'today-accepted'],
    ['all-clear', null],
  ] as const)('uses purposeful Today artwork for %s', (state, mascot) => {
    expect(resolve(state).mascot).toBe(mascot);
  });

  it('names the accepted promise from the fresh server-selected receipt', () => {
    const selection = {
      ...createSelection('accepted-today'),
      primaryChallengeId: 'challenge-1',
      receiptIsFresh: true,
      lastConfirmedReceipt: {
        kind: 'accepted' as const,
        challengeId: 'challenge-1',
        localDay: '2026-08-03',
        confirmedAtIso: '2026-08-03T00:20:00.000Z',
      },
    };
    const presentation = resolveTodayPresentation({
      selection,
      obligations: [
        {
          obligationKey: 'solo:challenge-1',
          challengeId: 'challenge-1',
          title: 'Read for 20 minutes',
          localDay: selection.localDay,
          timezone: selection.timezone,
          proofStatus: 'approved',
          isSolo: true,
        },
      ],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T00:30:00.000Z'),
    });

    expect(presentation.title).toBe('Read for 20 minutes is complete.');
    expect(presentation.accountabilityReceipt).toEqual({
      title: 'Read for 20 minutes approved',
      detail: 'Today’s result is confirmed in your promise history.',
    });
    expect(presentation.detail).toContain('approved');
    expect(presentation.detail).toContain('history');
  });

  it('shows all-clear as zero due without decorative artwork', () => {
    const presentation = resolve('all-clear');

    expect(presentation.title).toBe('Nothing needs you right now.');
    expect(presentation.mascot).toBeNull();
    expect(presentation.primaryAction).toBe('none');
    expect(presentation.reviewStatus).toBe(
      'No proof is waiting for your review.'
    );
  });

  it('does not claim the review queue is empty when review facts are unavailable', () => {
    const presentation = resolveTodayPresentation({
      selection: createSelection('all-clear'),
      obligations: [],
      pendingReviews: [],
      groupRisks: [],
      now: new Date('2026-08-03T00:30:00.000Z'),
      reviewFactsAvailable: false,
    });

    expect(presentation.reviewStatus).toBeNull();
    expect(presentation.title).toBe('No proof is due right now.');
    expect(presentation.detail).toBe(
      'Menta could not check review requests. Try refreshing Today.'
    );
    expect(presentation.title).not.toContain('Nothing needs you');
    expect(presentation.detail).not.toContain('someone sends proof');
  });

  it('names the Momenta earn when a proof needs review', () => {
    const presentation = resolve('review-required');

    expect(presentation.detail).toContain(
      'Check the photo, then approve it or ask for one clear correction.'
    );
    expect(presentation.detail).toContain(
      'Each confirmed review adds 8 Momenta, up to 20 a day.'
    );
  });

  it.each([
    ['text', 'promise-guide'],
    ['photo', 'today-proof-due'],
    ['video', 'today-proof-due'],
  ] as const)(
    'uses proof-medium-appropriate artwork for %s proof',
    (verificationType, mascot) => {
      const selection = {
        ...createSelection('proof-due'),
        primaryChallengeId: 'challenge-1',
      };

      const presentation = resolveTodayPresentation({
        selection,
        obligations: [
          {
            obligationKey: 'solo:challenge-1',
            challengeId: 'challenge-1',
            title: 'Morning focus',
            verificationType,
            localDay: selection.localDay,
            timezone: selection.timezone,
            proofStatus: 'none',
            isSolo: true,
          },
        ],
        pendingReviews: [],
        groupRisks: [],
        now: new Date('2026-08-03T00:30:00.000Z'),
      });

      expect(presentation.mascot).toBe(mascot);
    }
  );
});
