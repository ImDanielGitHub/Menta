import type {
  StreakOutcomeFact,
  StreakOutcomeHistoryFact,
} from '@/lib/loop/accountability';

export type StreakDayStatus =
  | 'done'
  | 'due'
  | 'at_risk'
  | 'waiting'
  | 'correction';

export interface StreakStateV2 {
  challengeId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  atRisk: boolean;
  hasSubmittedToday: boolean;
  submissionStatus: 'none' | 'pending' | 'approved' | 'rejected';
  dayStatus: StreakDayStatus;
  accountabilityAvailable: boolean;
  latestOutcome: StreakOutcomeFact | null;
  recentOutcomes: readonly StreakOutcomeHistoryFact[];
  daysSinceAcceptedCheckIn: number | null;
  effectiveLocalDay: string;
  effectiveTimezone: string;
  preferredReminderTime: string | null;
  remindersEnabled: boolean;
}
