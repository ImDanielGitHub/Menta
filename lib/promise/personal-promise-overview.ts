export type PersonalPromiseLifecycle = 'active' | 'past';

export type PersonalPromiseLifecycleInput = {
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  duration?: number | null;
  now?: Date;
};

const parseDay = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

/**
 * Classify only from durable challenge facts. A missing date or status remains
 * active instead of inventing a completed promise.
 */
export const resolvePersonalPromiseLifecycle = ({
  status,
  startDate,
  endDate,
  duration,
  now = new Date(),
}: PersonalPromiseLifecycleInput): PersonalPromiseLifecycle => {
  const normalizedStatus = status?.trim().toLocaleLowerCase('en-NZ');
  if (
    normalizedStatus === 'completed' ||
    normalizedStatus === 'expired' ||
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'archived'
  ) {
    return 'past';
  }

  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const explicitEnd = parseDay(endDate);
  if (explicitEnd !== null && explicitEnd < today) return 'past';

  const start = parseDay(startDate);
  if (start !== null && duration && duration > 0) {
    const firstDayAfterTerm = start + duration * 24 * 60 * 60 * 1000;
    if (firstDayAfterTerm <= today) return 'past';
  }

  return 'active';
};
