const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

/**
 * Get the user's local timezone name
 */
export const getLocalTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    console.warn('Could not determine local timezone, falling back to UTC');
    return 'UTC';
  }
};

const getZonedDateParts = (date: Date, timeZone: string): ZonedDateParts => {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid date');
  }

  const values = new Map(
    new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(part => [part.type, part.value])
  );

  const readPart = (name: Intl.DateTimeFormatPartTypes): number => {
    const value = Number(values.get(name));
    if (!Number.isFinite(value)) {
      throw new RangeError(`Could not read ${name} in ${timeZone}`);
    }
    return value;
  };

  return {
    year: readPart('year'),
    month: readPart('month'),
    day: readPart('day'),
    hours: readPart('hour'),
    minutes: readPart('minute'),
    seconds: readPart('second'),
    milliseconds: date.getUTCMilliseconds(),
  };
};

const getLocalDayOrdinal = (date: Date, timeZone: string): number => {
  const parts = getZonedDateParts(date, timeZone);
  return (
    Date.UTC(parts.year, parts.month - 1, parts.day) / MILLISECONDS_PER_DAY
  );
};

const getNextLocalDayBoundary = (now: Date, timeZone: string): number => {
  const currentDay = getLocalDayOrdinal(now, timeZone);
  const maximumSearchTime = now.getTime() + 48 * MILLISECONDS_PER_HOUR;
  let upperBound = now.getTime() + 6 * MILLISECONDS_PER_HOUR;

  while (
    upperBound <= maximumSearchTime &&
    getLocalDayOrdinal(new Date(upperBound), timeZone) === currentDay
  ) {
    upperBound += 6 * MILLISECONDS_PER_HOUR;
  }

  if (upperBound > maximumSearchTime) {
    throw new RangeError(`Could not find the next local day in ${timeZone}`);
  }

  let lowerBound = now.getTime();
  while (upperBound - lowerBound > 1) {
    const midpoint = Math.floor((lowerBound + upperBound) / 2);
    if (getLocalDayOrdinal(new Date(midpoint), timeZone) === currentDay) {
      lowerBound = midpoint;
    } else {
      upperBound = midpoint;
    }
  }

  return upperBound;
};

/**
 * Convert a UTC timestamp to local timezone for DISPLAY purposes only
 */
export const convertToLocalTime = (
  utcTimestamp: string | Date,
  timeZone = getLocalTimezone()
): Date => {
  try {
    const utcDate =
      typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
    const zonedTime = getZonedDateParts(utcDate, timeZone);

    return new Date(
      zonedTime.year,
      zonedTime.month - 1,
      zonedTime.day,
      zonedTime.hours,
      zonedTime.minutes,
      zonedTime.seconds,
      zonedTime.milliseconds
    );
  } catch (error) {
    console.warn('Error converting to local time:', error);
    // Fallback to original date
    return typeof utcTimestamp === 'string'
      ? new Date(utcTimestamp)
      : utcTimestamp;
  }
};

/**
 * Calculate days remaining until a target date using GLOBAL UTC time
 * This ensures all users see the same countdown regardless of timezone
 */
export const getDaysRemainingGlobal = (targetDate: string | Date): number => {
  try {
    // Always use UTC for global day calculations
    const nowUtc = new Date();
    const targetUtc =
      typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

    // Check for invalid dates
    if (isNaN(targetUtc.getTime()) || isNaN(nowUtc.getTime())) {
      return 0;
    }

    // Calculate difference in days based on UTC
    const diffTime = targetUtc.getTime() - nowUtc.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  } catch (error) {
    console.warn('Error calculating global days remaining:', error);
    return 0;
  }
};

/**
 * Calculate days remaining until a target date in local timezone (for DISPLAY only)
 */
export const getDaysRemainingInLocalTime = (
  targetDate: string | Date,
  timeZone = getLocalTimezone()
): number => {
  try {
    const target =
      typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const dayDifference =
      getLocalDayOrdinal(target, timeZone) -
      getLocalDayOrdinal(new Date(), timeZone);

    return Math.max(0, dayDifference);
  } catch (error) {
    console.warn('Error calculating days remaining in local time:', error);
    // Fallback to global calculation
    return getDaysRemainingGlobal(targetDate);
  }
};

/**
 * Get the current UTC day (YYYY-MM-DD format) - used for global day tracking
 */
export const getCurrentGlobalDay = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Check if a date is today in GLOBAL UTC time (for streaks and daily challenges)
 */
export const isTodayGlobal = (date: string | Date): boolean => {
  try {
    const today = getCurrentGlobalDay();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const targetDay = targetDate.toISOString().split('T')[0];

    return today === targetDay;
  } catch (error) {
    console.warn('Error checking if date is today globally:', error);
    return false;
  }
};

/**
 * Check if a date is today in local timezone (for DISPLAY purposes)
 */
export const isTodayInLocalTime = (
  date: string | Date,
  timeZone = getLocalTimezone()
): boolean => {
  try {
    const target = typeof date === 'string' ? new Date(date) : date;
    return (
      getLocalDayOrdinal(new Date(), timeZone) ===
      getLocalDayOrdinal(target, timeZone)
    );
  } catch (error) {
    console.warn('Error checking if date is today in local time:', error);
    // Fallback to global check
    return isTodayGlobal(date);
  }
};

/**
 * Calculate hours remaining until end of day in GLOBAL UTC time
 * This ensures daily challenges reset at the same time globally
 */
export const getHoursRemainingInGlobalDay = (): number => {
  try {
    const now = new Date();
    const endOfDayUtc = new Date(now);
    endOfDayUtc.setUTCHours(23, 59, 59, 999);

    const diffTime = endOfDayUtc.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    return Math.max(0, diffHours);
  } catch (error) {
    console.warn('Error calculating hours remaining in global day:', error);
    return 0;
  }
};

/**
 * Calculate hours remaining until end of day in local timezone (for DISPLAY)
 */
export const getHoursRemainingInDay = (
  timeZone = getLocalTimezone()
): number => {
  try {
    const now = new Date();
    const nextDay = getNextLocalDayBoundary(now, timeZone);
    return Math.max(0, (nextDay - now.getTime()) / MILLISECONDS_PER_HOUR);
  } catch (error) {
    console.warn('Error calculating hours remaining in day:', error);
    // Fallback to global calculation
    return getHoursRemainingInGlobalDay();
  }
};

/**
 * Format a date in the user's local timezone
 */
export const formatInLocalTime = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const userTimezone = getLocalTimezone();
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      ...options,
    }).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date in local time:', error);
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
};

/**
 * Calculate time remaining with detailed breakdown using GLOBAL time
 */
export const getTimeRemainingGlobal = (targetDate: string | Date) => {
  try {
    const nowUtc = new Date();
    const targetUtc =
      typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

    // Calculate difference in milliseconds
    const diffMs = targetUtc.getTime() - nowUtc.getTime();

    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isExpired: false };
  } catch (error) {
    console.warn('Error calculating global time remaining:', error);
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
};

/**
 * Calculate time remaining with detailed breakdown (for DISPLAY purposes)
 */
export const getTimeRemainingDetailed = (targetDate: string | Date) => {
  return getTimeRemainingGlobal(targetDate);
};

/**
 * Get the next global UTC midnight timestamp
 * Used for determining when daily challenges reset
 */
export const getNextGlobalMidnight = (): Date => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
};

/**
 * Calculate streak-safe time remaining (always based on global UTC)
 * This ensures streaks are consistent across all timezones
 */
export const getStreakTimeRemaining = () => {
  const nextMidnight = getNextGlobalMidnight();
  return getTimeRemainingGlobal(nextMidnight);
};
