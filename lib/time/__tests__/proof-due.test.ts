import {
  DEFAULT_PROOF_DUE_TIME,
  formatProofDueLabel,
  formatRemainingLabel,
  resolveProofDueCountdown,
  zonedLocalToUtc,
} from '../proof-due';

describe('proof due clock', () => {
  it('formats the default 8:00 PM coaching cutoff', () => {
    expect(formatProofDueLabel(DEFAULT_PROOF_DUE_TIME)).toBe('8:00 PM');
    expect(formatProofDueLabel('09:05:00')).toBe('9:05 AM');
    expect(formatRemainingLabel(2, 14)).toBe('2 h 14 m');
    expect(formatRemainingLabel(0, 9)).toBe('9 m');
  });

  it('converts Pacific/Auckland wall time to UTC', () => {
    const instant = zonedLocalToUtc(
      '2026-08-14',
      '20:00:00',
      'Pacific/Auckland'
    );

    expect(instant.toISOString()).toBe('2026-08-14T08:00:00.000Z');
  });

  it('counts hours and minutes to the cutoff without seconds', () => {
    const state = resolveProofDueCountdown({
      now: new Date('2026-08-14T05:46:00.000Z'),
      localDay: '2026-08-14',
      timeZone: 'Pacific/Auckland',
      preferredReminderTime: '20:00:00',
    });

    expect(state.phase).toBe('due');
    expect(state.isVisible).toBe(true);
    expect(state.hours).toBe(2);
    expect(state.minutes).toBe(14);
    expect(state.remainingLabel).toBe('2 h 14 m');
    expect(state.helperLabel).toBe(
      'Aim to send by 8:00 PM. Proof counts until midnight.'
    );
  });

  it('switches to last-chance copy after the cutoff and before midnight', () => {
    const state = resolveProofDueCountdown({
      now: new Date('2026-08-14T09:30:00.000Z'),
      localDay: '2026-08-14',
      timeZone: 'Pacific/Auckland',
      preferredReminderTime: '20:00:00',
    });

    expect(state.phase).toBe('last-chance');
    expect(state.isVisible).toBe(true);
    expect(state.hours).toBe(2);
    expect(state.minutes).toBe(30);
    expect(state.helperLabel).toBe('Proof still counts until midnight.');
  });

  it('counts to an authoritative extension deadline beyond local midnight', () => {
    const state = resolveProofDueCountdown({
      now: new Date('2026-08-14T09:30:00.000Z'),
      localDay: '2026-08-14',
      timeZone: 'Pacific/Auckland',
      preferredReminderTime: '20:00:00',
      dueAtIso: '2026-08-14T21:30:00.000Z',
    });

    expect(state.target).toBe('extension');
    expect(state.phase).toBe('due');
    expect(state.isVisible).toBe(true);
    expect(state.hours).toBe(12);
    expect(state.minutes).toBe(0);
    expect(state.remainingLabel).toBe('12 h');
    expect(state.helperLabel).toBe('Proof counts until the extension ends.');
  });

  it('falls back safely when an optional extension deadline is malformed', () => {
    const state = resolveProofDueCountdown({
      now: new Date('2026-08-14T09:30:00.000Z'),
      localDay: '2026-08-14',
      timeZone: 'Pacific/Auckland',
      preferredReminderTime: '20:00:00',
      dueAtIso: 'not-a-timestamp',
    });

    expect(state.target).toBe('midnight');
    expect(state.phase).toBe('last-chance');
    expect(state.hours).toBe(2);
    expect(state.minutes).toBe(30);
  });

  it('hides the countdown after local midnight or when proof is already in', () => {
    const ended = resolveProofDueCountdown({
      now: new Date('2026-08-14T12:01:00.000Z'),
      localDay: '2026-08-14',
      timeZone: 'Pacific/Auckland',
    });
    const hidden = resolveProofDueCountdown({
      now: new Date('2026-08-14T05:46:00.000Z'),
      localDay: '2026-08-14',
      timeZone: 'Pacific/Auckland',
      hide: true,
    });

    expect(ended.isVisible).toBe(false);
    expect(ended.phase).toBe('ended');
    expect(hidden.isVisible).toBe(false);
  });
});
