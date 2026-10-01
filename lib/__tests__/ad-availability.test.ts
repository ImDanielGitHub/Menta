import {
  formatAdCountdown,
  resolveAdAvailability,
} from '@/lib/ad-availability';

const limits = { dailyLimit: 5, cooldownSeconds: 120 };
const now = Date.parse('2026-09-27T09:00:00Z');
const minutesAgo = (minutes: number) => now - minutes * 60 * 1000;

describe('resolveAdAvailability', () => {
  it('offers an ad when none has paid out recently', () => {
    expect(resolveAdAvailability([], now, limits)).toEqual({
      rest: null,
      readyAt: null,
    });
    expect(resolveAdAvailability([minutesAgo(3)], now, limits).rest).toBeNull();
  });

  it('rests inside the cooldown and says when the next ad is ready', () => {
    const last = minutesAgo(0.5);
    expect(resolveAdAvailability([last], now, limits)).toEqual({
      rest: 'cooldown',
      readyAt: last + 120_000,
    });
  });

  it('stops for the day at the limit until the oldest counted reward ages out', () => {
    const times = [600, 500, 400, 300, 200].map(minutesAgo);
    const result = resolveAdAvailability(times, now, limits);
    expect(result.rest).toBe('daily_limit');
    expect(result.readyAt).toBe(minutesAgo(600) + 24 * 60 * 60 * 1000);
  });

  it('ignores rewards older than a day', () => {
    const times = [26 * 60, 25 * 60, 24.5 * 60, 24.2 * 60, 24.1 * 60].map(
      minutesAgo
    );
    expect(resolveAdAvailability(times, now, limits).rest).toBeNull();
  });
});

describe('formatAdCountdown', () => {
  it('reads as minutes and seconds', () => {
    expect(formatAdCountdown(now + 102_000, now)).toBe('1:42');
    expect(formatAdCountdown(now + 5_000, now)).toBe('0:05');
    expect(formatAdCountdown(now - 1_000, now)).toBe('0:00');
  });
});
