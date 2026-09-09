import {
  getTodayPartialDataNotice,
  readOptionalTodayData,
  TodayReadTimeoutError,
  withTodayReadTimeout,
} from '@/lib/today-data-read';
import { createTodayRefreshCoordinator } from '@/lib/today-refresh-coordinator';

describe('Today data reads', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('bounds a core read and releases the account for retry', async () => {
    jest.useFakeTimers();
    const coordinator = createTodayRefreshCoordinator();
    const result = coordinator.run('user-1', () =>
      withTodayReadTimeout({
        label: 'accountability',
        timeoutMs: 5_000,
        read: () => new Promise<void>(() => {}),
      })
    );

    await Promise.resolve();
    jest.advanceTimersByTime(5_000);

    await expect(result).rejects.toEqual(
      new TodayReadTimeoutError('accountability', 5_000)
    );

    const retry = jest.fn(async () => {});
    await coordinator.run('user-1', retry);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('degrades an ancillary failure without failing core Today data', async () => {
    const result = await readOptionalTodayData<string[]>({
      section: 'reviews',
      timeoutMs: 5_000,
      fallback: [],
      read: async () => {
        throw new Error('review service unavailable');
      },
    });

    expect(result).toEqual({
      value: [],
      unavailableSection: 'reviews',
    });
  });

  it('degrades a hung ancillary read after its deadline', async () => {
    jest.useFakeTimers();
    const result = readOptionalTodayData<string[]>({
      section: 'group-progress',
      timeoutMs: 4_000,
      fallback: [],
      read: () => new Promise<string[]>(() => {}),
    });

    jest.advanceTimersByTime(4_000);

    await expect(result).resolves.toEqual({
      value: [],
      unavailableSection: 'group-progress',
    });
  });

  it('keeps successful ancillary data available', async () => {
    const result = await readOptionalTodayData({
      section: 'group-progress',
      timeoutMs: 5_000,
      fallback: [],
      read: async () => ['group-1'],
    });

    expect(result).toEqual({
      value: ['group-1'],
      unavailableSection: null,
    });
  });

  it('names the unavailable details without questioning core proof status', () => {
    expect(getTodayPartialDataNotice([])).toBeNull();
    expect(getTodayPartialDataNotice(['reviews'])).toBe(
      'Your promises and proof status are current. Review requests are temporarily unavailable. Pull to refresh.'
    );
    expect(getTodayPartialDataNotice(['reviews', 'group-progress'])).toBe(
      'Your promises and proof status are current. Review requests and group progress are temporarily unavailable. Pull to refresh.'
    );
  });
});
