import { formatMilestoneApprovedAt } from '../milestone-copy';

describe('milestone approved receipt', () => {
  it('names a missing or invalid time as approved now', () => {
    expect(formatMilestoneApprovedAt(null)).toBe('Approved now');
    expect(formatMilestoneApprovedAt('')).toBe('Approved now');
    expect(formatMilestoneApprovedAt('not-a-date')).toBe('Approved now');
  });

  it('names a confirmed approval time in product language', () => {
    const copy = formatMilestoneApprovedAt('2026-09-12T21:05:00.000Z', 'en-NZ');

    expect(copy.startsWith('Approved ')).toBe(true);
    expect(copy).not.toBe('Approved now');
    expect(copy.toLowerCase()).not.toMatch(/iso|timestamp|utc|server/);
  });
});
