export const DEFAULT_PROOF_DUE_TIME = '20:00:00';

export type ProofDuePhase = 'due' | 'last-chance' | 'ended';

export type ProofDueCountdownState = {
  phase: ProofDuePhase;
  target: 'reminder' | 'midnight' | 'extension';
  hours: number;
  minutes: number;
  proofDueLabel: string;
  remainingLabel: string;
  helperLabel: string;
  isVisible: boolean;
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const pad2 = (value: number): string =>
  value < 10 ? `0${value}` : String(value);

const readZonedParts = (date: Date, timeZone: string): ZonedParts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find(part => part.type === type)?.value;
    return Number(value);
  };

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
};

const parseLocalDay = (
  localDay: string
): { year: number; month: number; day: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const parseTimeHms = (
  value: string | null | undefined
): { hour: number; minute: number; second: number } => {
  const source =
    (value ?? DEFAULT_PROOF_DUE_TIME).trim() || DEFAULT_PROOF_DUE_TIME;
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

const addUtcDays = (
  year: number,
  month: number,
  day: number,
  days: number
): { year: number; month: number; day: number } => {
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
};

/**
 * Convert a civil date and clock time in `timeZone` to a UTC Date.
 * Invalid timezones fall back to interpreting the wall clock as UTC.
 */
export const zonedLocalToUtc = (
  localDay: string,
  timeHms: string,
  timeZone: string
): Date => {
  const day = parseLocalDay(localDay);
  const time = parseTimeHms(timeHms);
  if (!day) {
    return new Date(NaN);
  }

  const desiredAsUtc = Date.UTC(
    day.year,
    day.month - 1,
    day.day,
    time.hour,
    time.minute,
    time.second
  );

  try {
    let instant = new Date(desiredAsUtc);
    for (let pass = 0; pass < 2; pass += 1) {
      const parts = readZonedParts(instant, timeZone);
      const asUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
      );
      instant = new Date(instant.getTime() + (desiredAsUtc - asUtc));
    }
    return instant;
  } catch {
    return new Date(desiredAsUtc);
  }
};

export const formatProofDueLabel = (
  timeHms: string | null | undefined
): string => {
  const { hour, minute } = parseTimeHms(timeHms);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad2(minute)} ${period}`;
};

export const formatRemainingLabel = (
  hours: number,
  minutes: number
): string => {
  if (hours <= 0 && minutes <= 0) return '0 m';
  if (hours <= 0) return `${minutes} m`;
  if (minutes <= 0) return `${hours} h`;
  return `${hours} h ${minutes} m`;
};

export const resolveProofDueCountdown = (args: {
  now: Date;
  localDay: string;
  timeZone: string;
  preferredReminderTime?: string | null;
  dueAtIso?: string | null;
  hide?: boolean;
}): ProofDueCountdownState => {
  const preferredReminderTime =
    args.preferredReminderTime?.trim() || DEFAULT_PROOF_DUE_TIME;
  const proofDueAt = zonedLocalToUtc(
    args.localDay,
    preferredReminderTime,
    args.timeZone
  );
  const parsedDay = parseLocalDay(args.localDay);
  const nextDay = parsedDay
    ? addUtcDays(parsedDay.year, parsedDay.month, parsedDay.day, 1)
    : null;
  const nextMidnight = nextDay
    ? zonedLocalToUtc(
        `${nextDay.year}-${pad2(nextDay.month)}-${pad2(nextDay.day)}`,
        '00:00:00',
        args.timeZone
      )
    : new Date(NaN);

  const proofDueLabel = formatProofDueLabel(preferredReminderTime);
  const nowMs = args.now.getTime();
  const dueMs = proofDueAt.getTime();
  const midnightMs = nextMidnight.getTime();
  const extensionMs = args.dueAtIso?.trim()
    ? Date.parse(args.dueAtIso.trim())
    : Number.NaN;
  const hasExtensionDeadline = Number.isFinite(extensionMs);

  if (
    args.hide ||
    Number.isNaN(nowMs) ||
    Number.isNaN(dueMs) ||
    Number.isNaN(midnightMs)
  ) {
    return {
      phase: 'ended',
      target: 'midnight',
      hours: 0,
      minutes: 0,
      proofDueLabel,
      remainingLabel: '0 m',
      helperLabel: 'Proof counted until midnight.',
      isVisible: false,
    };
  }

  if (hasExtensionDeadline && nowMs >= extensionMs) {
    return {
      phase: 'ended',
      target: 'extension',
      hours: 0,
      minutes: 0,
      proofDueLabel,
      remainingLabel: '0 m',
      helperLabel: 'The extension has ended.',
      isVisible: false,
    };
  }

  if (!hasExtensionDeadline && nowMs >= midnightMs) {
    return {
      phase: 'ended',
      target: 'midnight',
      hours: 0,
      minutes: 0,
      proofDueLabel,
      remainingLabel: '0 m',
      helperLabel: 'Proof counted until midnight.',
      isVisible: false,
    };
  }

  const phase: ProofDuePhase = hasExtensionDeadline
    ? 'due'
    : nowMs < dueMs
      ? 'due'
      : 'last-chance';
  const target = hasExtensionDeadline
    ? 'extension'
    : phase === 'due'
      ? 'reminder'
      : 'midnight';
  const targetMs = hasExtensionDeadline
    ? extensionMs
    : phase === 'due'
      ? dueMs
      : midnightMs;
  const remainingMs = Math.max(0, targetMs - nowMs);
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    phase,
    target,
    hours,
    minutes,
    proofDueLabel,
    remainingLabel: formatRemainingLabel(hours, minutes),
    helperLabel: hasExtensionDeadline
      ? 'Proof counts until the extension ends.'
      : phase === 'due'
        ? `Aim to send by ${proofDueLabel}. Proof counts until midnight.`
        : 'Proof still counts until midnight.',
    isVisible: true,
  };
};
