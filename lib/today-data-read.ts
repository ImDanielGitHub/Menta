export type TodayOptionalSection = 'reviews' | 'group-progress';

export class TodayReadTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} did not finish within ${timeoutMs} ms`);
    this.name = 'TodayReadTimeoutError';
  }
}

export const withTodayReadTimeout = <T>(args: {
  label: string;
  timeoutMs: number;
  read: () => Promise<T>;
}): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new TodayReadTimeoutError(args.label, args.timeoutMs));
    }, args.timeoutMs);

    const clear = () => clearTimeout(timeout);
    void Promise.resolve()
      .then(args.read)
      .then(
        value => {
          clear();
          resolve(value);
        },
        error => {
          clear();
          reject(error);
        }
      );
  });

export const readOptionalTodayData = async <T>(args: {
  section: TodayOptionalSection;
  timeoutMs: number;
  fallback: T;
  read: () => Promise<T>;
}): Promise<{
  value: T;
  unavailableSection: TodayOptionalSection | null;
}> => {
  try {
    return {
      value: await withTodayReadTimeout({
        label: args.section,
        timeoutMs: args.timeoutMs,
        read: args.read,
      }),
      unavailableSection: null,
    };
  } catch {
    return {
      value: args.fallback,
      unavailableSection: args.section,
    };
  }
};

export const getTodayPartialDataNotice = (
  sections: readonly TodayOptionalSection[]
): string | null => {
  const unavailable = new Set(sections);
  const reviewsUnavailable = unavailable.has('reviews');
  const groupProgressUnavailable = unavailable.has('group-progress');

  if (reviewsUnavailable && groupProgressUnavailable) {
    return 'Your promises and proof status are current. Review requests and group progress are temporarily unavailable. Pull to refresh.';
  }
  if (reviewsUnavailable) {
    return 'Your promises and proof status are current. Review requests are temporarily unavailable. Pull to refresh.';
  }
  if (groupProgressUnavailable) {
    return 'Your promises and proof status are current. Group progress is temporarily unavailable. Pull to refresh.';
  }
  return null;
};
