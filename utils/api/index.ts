export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        const err = new Error(`${label} timed out after ${ms}ms`);
        // @ts-ignore
        err.code = 'TIMEOUT';
        reject(err);
      }, ms);
    });

    // Race the original promise against the timeout
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}


