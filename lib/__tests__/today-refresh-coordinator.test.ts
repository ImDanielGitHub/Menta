import { createTodayRefreshCoordinator } from '@/lib/today-refresh-coordinator';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(complete => {
    resolve = complete;
  });

  return { promise, resolve };
};

describe('Today refresh coordinator', () => {
  it('deduplicates concurrent refreshes for the same account', async () => {
    const coordinator = createTodayRefreshCoordinator();
    const refresh = deferred();
    const task = jest.fn(() => refresh.promise);

    const first = coordinator.run('user-1', task);
    const second = coordinator.run('user-1', task);

    expect(second).toBe(first);
    await Promise.resolve();
    expect(task).toHaveBeenCalledTimes(1);

    refresh.resolve();
    await first;
  });

  it('starts a new account refresh without waiting for the old account', async () => {
    const coordinator = createTodayRefreshCoordinator();
    const oldRefresh = deferred();
    const newRefresh = deferred();
    const oldTask = jest.fn(() => oldRefresh.promise);
    const newTask = jest.fn(() => newRefresh.promise);

    const oldResult = coordinator.run('old-user', oldTask);
    await Promise.resolve();
    expect(oldTask).toHaveBeenCalledTimes(1);

    const newResult = coordinator.run('new-user', newTask);
    await Promise.resolve();
    expect(newTask).toHaveBeenCalledTimes(1);

    newRefresh.resolve();
    await newResult;

    oldRefresh.resolve();
    await oldResult;
  });

  it('allows another refresh after a failed request', async () => {
    const coordinator = createTodayRefreshCoordinator();
    const retry = jest.fn(async () => {});

    await expect(
      coordinator.run('user-1', async () => {
        throw new Error('request failed');
      })
    ).rejects.toThrow('request failed');
    await coordinator.run('user-1', retry);

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
