import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  parseStreakOutcomeFact,
  readStreakOutcomeHistory,
  readTodayAccountability,
} from '@/lib/loop/accountability';
import { notificationService } from '@/lib/services/notification-service';
import { supabase } from '@/lib/supabase';
import type { StreakDayStatus, StreakStateV2 } from '@/types/streak-state-v2';

interface UseStreakStateArgs {
  userId?: string;
  challengeId?: string;
}

interface UseStreakStateReturn {
  streakState: StreakStateV2 | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (
    typeof value === 'string' &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
};

const proofStatus = (value: unknown): StreakStateV2['submissionStatus'] => {
  if (value === 'pending' || value === 'approved' || value === 'rejected') {
    return value;
  }
  return 'none';
};

export const resolveServerStreakDayStatus = (args: {
  submissionStatus: StreakStateV2['submissionStatus'];
  atRisk: boolean;
}): StreakDayStatus => {
  if (args.submissionStatus === 'approved') return 'done';
  if (args.submissionStatus === 'pending') return 'waiting';
  if (args.submissionStatus === 'rejected') return 'correction';
  if (args.atRisk) return 'at_risk';
  return 'due';
};

export const useStreakState = ({
  userId,
  challengeId,
}: UseStreakStateArgs): UseStreakStateReturn => {
  const [streakState, setStreakState] = useState<StreakStateV2 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    []
  );

  const refresh = useCallback(async () => {
    if (!userId || !challengeId) {
      setStreakState(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [accountability, userPrefs, participantRes] = await Promise.all([
        readTodayAccountability(deviceTimezone),
        notificationService.getUserPreferences(userId),
        supabase
          .from('challenge_participants')
          .select(
            `
              current_streak,
              longest_streak,
              streak_freezes_remaining,
              at_risk,
              last_check_in_tz
            `
          )
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .maybeSingle(),
      ]);

      if (participantRes.error) throw participantRes.error;

      const participant = isRecord(participantRes.data)
        ? participantRes.data
        : null;
      const row =
        accountability.rows.find(
          candidate => stringValue(candidate.challenge_id) === challengeId
        ) ?? null;
      const accountabilityAvailable = accountability.source === 'v2';
      const latestOutcome =
        accountabilityAvailable && row ? parseStreakOutcomeFact(row) : null;
      const recentOutcomes = accountabilityAvailable
        ? await readStreakOutcomeHistory({ userId, challengeId }).catch(
            () => []
          )
        : [];

      const resolvedProofStatus = proofStatus(row?.proof_status);
      const resolvedAtRisk =
        typeof row?.at_risk === 'boolean'
          ? row.at_risk
          : participant?.at_risk === true;
      const fallbackLocalDay =
        new Date().toLocaleDateString('en-CA', {
          timeZone: deviceTimezone,
        }) || new Date().toISOString().split('T')[0];
      const resolvedLocalDay = stringValue(row?.local_day) ?? fallbackLocalDay;
      const resolvedTimezone =
        stringValue(row?.effective_timezone) ??
        stringValue(participant?.last_check_in_tz) ??
        deviceTimezone;
      const currentStreak =
        numberValue(row?.current_streak) ??
        numberValue(participant?.current_streak) ??
        0;

      setStreakState({
        challengeId,
        userId,
        currentStreak,
        longestStreak:
          numberValue(row?.longest_streak) ??
          numberValue(participant?.longest_streak) ??
          currentStreak,
        freezeCount:
          numberValue(row?.freezes_remaining) ??
          numberValue(participant?.streak_freezes_remaining) ??
          0,
        atRisk: resolvedAtRisk,
        hasSubmittedToday: resolvedProofStatus !== 'none',
        submissionStatus: resolvedProofStatus,
        dayStatus: resolveServerStreakDayStatus({
          submissionStatus: resolvedProofStatus,
          atRisk: resolvedAtRisk,
        }),
        accountabilityAvailable,
        latestOutcome,
        recentOutcomes,
        daysSinceAcceptedCheckIn: numberValue(
          row?.days_since_accepted_check_in
        ),
        effectiveLocalDay: resolvedLocalDay,
        effectiveTimezone: resolvedTimezone,
        preferredReminderTime: userPrefs?.preferred_reminder_time ?? null,
        remindersEnabled: userPrefs?.challenge_reminders ?? true,
      });
    } catch {
      // Keep the last confirmed state. A read failure cannot create or erase a
      // missed/protected outcome on the client.
      setError('Failed to load streak state');
    } finally {
      setIsLoading(false);
    }
  }, [challengeId, deviceTimezone, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { streakState, isLoading, error, refresh };
};
