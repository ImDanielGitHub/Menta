import { supabase } from '@/lib/supabase';

export const DEFAULT_PROOF_HOUR = '20:00:00';
export const DEFAULT_COACH_SNOOZE_HOURS = 4;
export const MIN_COACH_SNOOZE_HOURS = 1;
export const MAX_COACH_SNOOZE_HOURS = 12;

const RESCUE_OFFSET_SECONDS = 3 * 60 * 60;
const RESCUE_CAP_SECONDS = 23 * 60 * 60 + 30 * 60;

const pad2 = (value: number): string =>
  value < 10 ? `0${value}` : String(value);

const parseTimeHms = (
  value: string | null | undefined
): { hour: number; minute: number; second: number } => {
  const source = (value ?? DEFAULT_PROOF_HOUR).trim() || DEFAULT_PROOF_HOUR;
  const [hourRaw, minuteRaw, secondRaw] = source.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const second = Number(secondRaw);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 20,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
    second: Number.isFinite(second) ? Math.min(59, Math.max(0, second)) : 0,
  };
};

const timeToSeconds = (value: string | null | undefined): number => {
  const parsed = parseTimeHms(value);
  return parsed.hour * 3600 + parsed.minute * 60 + parsed.second;
};

const secondsToTime = (totalSeconds: number): string => {
  const bounded = Math.min(RESCUE_CAP_SECONDS, Math.max(0, totalSeconds));
  const hour = Math.floor(bounded / 3600);
  const minute = Math.floor((bounded % 3600) / 60);
  const second = bounded % 60;
  return `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
};

export const formatTimeHms = (value: string | null | undefined): string => {
  const parsed = parseTimeHms(value);
  return `${pad2(parsed.hour)}:${pad2(parsed.minute)}:${pad2(parsed.second)}`;
};

export const localHourAsTime = (now: Date, timeZone: string): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone.trim() || 'UTC',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  const hourValue = formatter
    .formatToParts(now)
    .find(part => part.type === 'hour')?.value;
  const hour = Number(hourValue);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return DEFAULT_PROOF_HOUR;
  }
  return `${pad2(hour)}:00:00`;
};

export const resolveRescueTime = (
  preferredReminderTime: string | null | undefined
): string => {
  const preferredSeconds = timeToSeconds(preferredReminderTime);
  return secondsToTime(
    Math.min(preferredSeconds + RESCUE_OFFSET_SECONDS, RESCUE_CAP_SECONDS)
  );
};

export const resolveRoutineSlot = (args: {
  typicalProofHour?: string | null;
  preferredReminderTime?: string | null;
}): string => {
  const preferred = formatTimeHms(args.preferredReminderTime);
  const rescue = resolveRescueTime(preferred);
  const typical = args.typicalProofHour?.trim();
  if (!typical) return preferred;
  if (timeToSeconds(typical) < timeToSeconds(rescue)) {
    return formatTimeHms(typical);
  }
  return preferred;
};

type CoachSnoozeReceipt = {
  success?: boolean;
};

const isSuccessfulSnooze = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false;
  return (value as CoachSnoozeReceipt).success === true;
};

export const recordTypicalProofHour = async (args: {
  userId: string;
  timeZone: string;
  now?: Date;
}): Promise<void> => {
  const typicalProofHour = localHourAsTime(
    args.now ?? new Date(),
    args.timeZone
  );
  const { error } = await supabase
    .from('notification_preferences')
    .update({
      typical_proof_hour: typicalProofHour,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', args.userId);

  if (error) {
    throw error;
  }
};

export const snoozeCoachMessages = async (
  hours: number = DEFAULT_COACH_SNOOZE_HOURS
): Promise<void> => {
  if (
    !Number.isInteger(hours) ||
    hours < MIN_COACH_SNOOZE_HOURS ||
    hours > MAX_COACH_SNOOZE_HOURS
  ) {
    throw new Error('Choose between 1 and 12 hours.');
  }

  const { data, error } = await supabase.rpc('snooze_coach_messages', {
    p_hours: hours,
  });

  if (error) {
    throw error;
  }

  if (!isSuccessfulSnooze(data)) {
    throw new Error('Could not pause reminders.');
  }
};
