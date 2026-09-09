import { findTimeZone, getZonedTime, getUnixTime } from 'timezone-support';

/**
 * Get the user's local timezone name
 */
export const getLocalTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not determine local timezone, falling back to UTC');
    return 'UTC';
  }
};

/**
 * Convert a UTC timestamp to local timezone for DISPLAY purposes only
 */
export const convertToLocalTime = (utcTimestamp: string | Date): Date => {
  try {
    const userTimezone = getLocalTimezone();
    const timeZone = findTimeZone(userTimezone);
    
    // Convert string to Date if needed
    const utcDate = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
    
    // Get zoned time in user's timezone
    const zonedTime = getZonedTime(utcDate, timeZone);
    
    // Convert back to a Date object in local time
    return new Date(
      zonedTime.year,
      zonedTime.month - 1, // JavaScript months are 0-based
      zonedTime.day,
      zonedTime.hours,
      zonedTime.minutes,
      zonedTime.seconds,
      zonedTime.milliseconds
    );
  } catch (error) {
    console.warn('Error converting to local time:', error);
    // Fallback to original date
    return typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
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
    const targetUtc = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    
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
export const getDaysRemainingInLocalTime = (targetDate: string | Date): number => {
  try {
    const userTimezone = getLocalTimezone();
    const timeZone = findTimeZone(userTimezone);
    
    // Get current time in user's timezone
    const nowUtc = new Date();
    const nowLocal = getZonedTime(nowUtc, timeZone);
    
    // Convert target date to local timezone
    const targetUtc = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const targetLocal = getZonedTime(targetUtc, timeZone);
    
    // Create Date objects for comparison (time part set to start of day)
    const nowLocalDate = new Date(nowLocal.year, nowLocal.month - 1, nowLocal.day);
    const targetLocalDate = new Date(targetLocal.year, targetLocal.month - 1, targetLocal.day);
    
    // Calculate difference in days
    const diffTime = targetLocalDate.getTime() - nowLocalDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
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
export const isTodayInLocalTime = (date: string | Date): boolean => {
  try {
    const userTimezone = getLocalTimezone();
    const timeZone = findTimeZone(userTimezone);
    
    // Get current date in local timezone
    const nowUtc = new Date();
    const nowLocal = getZonedTime(nowUtc, timeZone);
    
    // Get target date in local timezone
    const targetUtc = typeof date === 'string' ? new Date(date) : date;
    const targetLocal = getZonedTime(targetUtc, timeZone);
    
    return (
      nowLocal.year === targetLocal.year &&
      nowLocal.month === targetLocal.month &&
      nowLocal.day === targetLocal.day
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
export const getHoursRemainingInDay = (): number => {
  try {
    const userTimezone = getLocalTimezone();
    const timeZone = findTimeZone(userTimezone);
    
    // Get current time in user's timezone
    const nowUtc = new Date();
    const nowLocal = getZonedTime(nowUtc, timeZone);
    
    // Calculate end of day in local timezone
    const endOfDayUtc = getUnixTime({
      year: nowLocal.year,
      month: nowLocal.month,
      day: nowLocal.day,
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999
    }, timeZone);
    
    // Calculate hours remaining
    const diffTime = endOfDayUtc - nowUtc.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    
    return Math.max(0, diffHours);
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
      ...options
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
    const targetUtc = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    
    // Calculate difference in milliseconds
    const diffMs = targetUtc.getTime() - nowUtc.getTime();
    
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
  try {
    const userTimezone = getLocalTimezone();
    const timeZone = findTimeZone(userTimezone);
    
    // Get current time in user's timezone
    const nowUtc = new Date();
    const targetUtc = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    
    // Calculate difference in milliseconds
    const diffMs = targetUtc.getTime() - nowUtc.getTime();
    
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, isExpired: false };
  } catch (error) {
    console.warn('Error calculating detailed time remaining:', error);
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
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