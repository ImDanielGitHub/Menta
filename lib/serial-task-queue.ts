/** Serialize read-modify-write operations without blocking later work on failure. */
export const createSerialTaskQueue = () => {
  let pending: Promise<void> = Promise.resolve();

  return <T>(task: () => Promise<T>): Promise<T> => {
    const result = pending.then(task);
    pending = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
};
