import {
  makeStreakWidgetCountdownEntries,
  makeStreakWidgetSnapshot,
  makeWidgetFallback,
  readWidgetPromise,
  type WidgetPromise,
} from '../widget-model';

const now = Date.parse('2026-09-09T20:00:00Z');
const promise: WidgetPromise = {
  id: '10b09cc1-3bfb-4c13-82b1-c77b6fdfb759',
  title: 'Read my private journal',
  streak: 8,
  localDay: '2026-09-10',
  timezone: 'Pacific/Auckland',
  deadline: now + 2 * 60 * 60 * 1000,
  proofStatus: 'none',
  atRisk: true,
  outcome: null,
  groupId: null,
  proofType: 'text',
  isSolo: true,
};

const snapshot = (changes: Partial<WidgetPromise> = {}, showText = false) =>
  makeStreakWidgetSnapshot({
    promise: { ...promise, ...changes },
    showText,
    locale: 'en-NZ',
    now,
  });

describe('streak widget presentation authority', () => {
  it('keeps the promise text out of all shared fields until explicitly enabled', () => {
    expect(JSON.stringify(snapshot())).not.toContain(promise.title);
    expect(snapshot({}, true).title).toBe(promise.title);
  });

  it('keeps a pending review out of risk copy without inventing a streak increment', () => {
    expect(snapshot({ proofStatus: 'pending' })).toMatchObject({
      state: 'waiting',
      streak: '8',
    });
    expect(snapshot({ proofStatus: 'approved' })).toMatchObject({
      state: 'accepted',
      streak: '8',
    });
  });

  it.each([
    [{ outcome: 'protected' as const }, 'protected'],
    [{ outcome: 'missed' as const, streak: 0 }, 'missed'],
    [{ proofStatus: 'rejected' as const }, 'correction'],
  ])(
    'preserves the authoritative proof or recovery state %j',
    (changes, state) => {
      expect(snapshot(changes).state).toBe(state);
    }
  );

  it('expires stale data instead of claiming that the streak was lost', () => {
    expect(snapshot({ deadline: now - 1 })).toMatchObject({
      state: 'stale',
      streak: '',
      history: [],
    });
    expect(snapshot({ deadline: now + 12 * 60 * 60 * 1000 }).expiresAt).toBe(
      now + 4 * 60 * 60 * 1000
    );
  });

  it('clears history, title and promise destination when signed out', () => {
    const fallback = makeWidgetFallback('signed-out', 'en-NZ');
    expect(fallback).toMatchObject({
      streak: '',
      history: [],
      url: 'menta://home-widget',
    });
    expect(JSON.stringify(fallback)).not.toContain(promise.id);
    expect(JSON.stringify(fallback)).not.toContain(promise.title);
  });

  it('uses local midnight rather than the preferred reminder time for ordinary proof', () => {
    const decoded = readWidgetPromise({
      challenge_id: promise.id,
      challenge_title: promise.title,
      current_streak: 8,
      local_day: '2026-01-12',
      effective_timezone: 'Pacific/Auckland',
      proof_status: 'none',
      proof_due_at: '2026-01-12T06:00:00Z',
    });
    expect(decoded?.deadline).toBe(Date.parse('2026-01-12T11:00:00Z'));
  });

  it('honours a confirmed extension beyond midnight and rejects invalid authority data', () => {
    const row = {
      challenge_id: promise.id,
      challenge_title: promise.title,
      current_streak: 8,
      local_day: '2026-01-12',
      effective_timezone: 'Pacific/Auckland',
      extension_proof_due_at: '2026-01-13T00:00:00Z',
      proof_status: 'pending',
    };
    expect(readWidgetPromise(row)?.deadline).toBe(
      Date.parse(row.extension_proof_due_at)
    );
    expect(readWidgetPromise({ ...row, current_streak: -1 })).toBeNull();
    expect(readWidgetPromise({ ...row, local_day: '2026-02-30' })).toBeNull();
    expect(
      readWidgetPromise({ ...row, effective_timezone: 'invalid' })
    ).toBeNull();
  });
});

describe('widget countdown', () => {
  const HOUR = 60 * 60 * 1000;
  const MINUTE = 60 * 1000;
  const due: WidgetPromise = {
    ...promise,
    atRisk: false,
    streak: 12,
    deadline: now + 6 * HOUR + 20 * MINUTE,
  };

  it('shows the honest time left as a short status line', () => {
    expect(snapshot({ ...due }).status).toBe('6h left');
    expect(snapshot({ ...due }).statusTone).toBe('action');
    expect(
      snapshot({ ...due, deadline: now + 48 * MINUTE, atRisk: true }).status
    ).toBe('48 min left');
    expect(snapshot({ ...due, proofStatus: 'approved' }).status).toBe(
      'Done today'
    );
  });

  it('keeps counting on the Home Screen without the app open', () => {
    const entries = makeStreakWidgetCountdownEntries({
      promise: due,
      showText: false,
      locale: 'en-NZ',
      now,
    });
    // Hourly points inside the four-hour freshness window.
    expect(entries.map(entry => entry.props.status)).toEqual([
      '6h left',
      '5h left',
      '4h left',
      '3h left',
    ]);
    expect(entries[0].date.getTime()).toBe(due.deadline - 6 * HOUR);

    const lastHour = makeStreakWidgetCountdownEntries({
      promise: { ...due, deadline: now + 45 * MINUTE },
      showText: false,
      locale: 'en-NZ',
      now,
    });
    expect(lastHour.map(entry => entry.props.status)).toEqual([
      '40 min left',
      '30 min left',
      '20 min left',
      '10 min left',
    ]);
  });
});
