import { useEffect, useMemo, useState } from 'react';

import type { ObligationProofStatus } from '@/lib/loop';
import {
  buildTodayWeek,
  readTodayWeekActivity,
  type TodayWeekDay,
  type TodayWeekOutcomeRow,
  type TodayWeekSubmissionRow,
} from '@/lib/today-week-activity';

type WeekActivity = {
  key: string;
  submissions: TodayWeekSubmissionRow[];
  outcomes: TodayWeekOutcomeRow[];
};

export type TodayWeekState =
  | { phase: 'loading'; days: null }
  | { phase: 'ready'; days: TodayWeekDay[] }
  | { phase: 'unavailable'; days: null };

/**
 * Reads the person's own proof history for the rolling week once per Today
 * refresh. A failed refresh keeps the last confirmed week. When no week has
 * been confirmed, the row is withheld instead of showing invented empty days.
 */
export function useTodayWeek(args: {
  userId: string | null;
  localDay: string;
  locale: string;
  refreshToken: string | null;
  todayStatuses: readonly ObligationProofStatus[];
}): TodayWeekState {
  const { locale, localDay, refreshToken, todayStatuses, userId } = args;
  const [activity, setActivity] = useState<WeekActivity | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const key = userId ? `${userId}:${localDay}` : null;

  useEffect(() => {
    if (!userId || !refreshToken) return;
    const requestKey = `${userId}:${localDay}`;
    let cancelled = false;
    readTodayWeekActivity({ userId, localDay })
      .then(result => {
        if (cancelled) return;
        setActivity({ key: requestKey, ...result });
        setFailedKey(null);
      })
      .catch(() => {
        // Optional history: Today's obligations remain authoritative.
        if (!cancelled) setFailedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [localDay, refreshToken, userId]);

  return useMemo<TodayWeekState>(() => {
    if (activity && activity.key === key) {
      return {
        phase: 'ready',
        days: buildTodayWeek({
          localDay,
          locale,
          submissions: activity.submissions,
          outcomes: activity.outcomes,
          todayStatuses,
        }),
      };
    }
    if (failedKey && failedKey === key) {
      return { phase: 'unavailable', days: null };
    }
    return { phase: 'loading', days: null };
  }, [activity, failedKey, key, locale, localDay, todayStatuses]);
}
