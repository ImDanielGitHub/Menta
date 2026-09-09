type TodayRefreshTask = () => Promise<void>;

type InFlightRefresh = {
  userId: string;
  promise: Promise<void>;
};

/**
 * Deduplicate refreshes for one account without making a newly signed-in
 * account wait for an abandoned request from the previous account.
 */
export type TodayRefreshCoordinator = {
  run: (userId: string, task: TodayRefreshTask) => Promise<void>;
};

/**
 * Keep refresh ownership in a closure so Today does not depend on constructing
 * an imported class while the production bundle is mounting.
 */
export const createTodayRefreshCoordinator = (): TodayRefreshCoordinator => {
  let inFlight: InFlightRefresh | null = null;

  return {
    run(userId: string, task: TodayRefreshTask): Promise<void> {
      if (inFlight?.userId === userId) {
        return inFlight.promise;
      }

      const promise = Promise.resolve().then(task);
      const refresh = { userId, promise };
      inFlight = refresh;

      const clearIfCurrent = () => {
        if (inFlight === refresh) {
          inFlight = null;
        }
      };
      void promise.then(clearIfCurrent, clearIfCurrent);

      return promise;
    },
  };
};
