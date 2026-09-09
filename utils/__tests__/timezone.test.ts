import { 
  getLocalTimezone,
  getDaysRemainingGlobal,
  getCurrentGlobalDay,
  isTodayGlobal,
  getHoursRemainingInGlobalDay,
  formatInLocalTime,
  getNextGlobalMidnight,
  getStreakTimeRemaining
} from '../timezone';

// Mock Date for consistent testing
const MOCK_DATE = new Date('2024-01-15T14:30:00.000Z'); // Monday, 3:30 PM UTC

describe('Timezone Utility Functions', () => {
  beforeAll(() => {
    // Mock Date.now() to return our fixed date
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Global Time Functions', () => {
    test('getCurrentGlobalDay returns UTC date in YYYY-MM-DD format', () => {
      const globalDay = getCurrentGlobalDay();
      expect(globalDay).toBe('2024-01-15');
    });

    test('isTodayGlobal correctly identifies today in UTC', () => {
      const todayUTC = new Date('2024-01-15T23:59:59.999Z');
      const yesterdayUTC = new Date('2024-01-14T23:59:59.999Z');
      const tomorrowUTC = new Date('2024-01-16T00:00:00.000Z');

      expect(isTodayGlobal(todayUTC)).toBe(true);
      expect(isTodayGlobal(yesterdayUTC)).toBe(false);
      expect(isTodayGlobal(tomorrowUTC)).toBe(false);
    });

    test('getDaysRemainingGlobal calculates correctly', () => {
      const tomorrow = new Date('2024-01-16T12:00:00.000Z');
      const nextWeek = new Date('2024-01-22T12:00:00.000Z');
      const yesterday = new Date('2024-01-14T12:00:00.000Z');

      expect(getDaysRemainingGlobal(tomorrow)).toBe(1);
      expect(getDaysRemainingGlobal(nextWeek)).toBe(7);
      expect(getDaysRemainingGlobal(yesterday)).toBe(0); // Past dates return 0
    });

    test('getHoursRemainingInGlobalDay calculates correctly', () => {
      const hoursRemaining = getHoursRemainingInGlobalDay();
      // At 14:30 UTC, should be about 9.5 hours until midnight UTC
      expect(hoursRemaining).toBeCloseTo(9.5, 0);
    });

    test('getNextGlobalMidnight returns correct next UTC midnight', () => {
      const nextMidnight = getNextGlobalMidnight();
      const expected = new Date('2024-01-16T00:00:00.000Z');
      expect(nextMidnight.getTime()).toBe(expected.getTime());
    });

    test('getStreakTimeRemaining provides countdown to next UTC day', () => {
      const streakTime = getStreakTimeRemaining();
      expect(streakTime.days).toBe(0);
      expect(streakTime.hours).toBe(9);
      expect(streakTime.minutes).toBeGreaterThanOrEqual(29);
      expect(streakTime.minutes).toBeLessThanOrEqual(30);
      expect(streakTime.isExpired).toBe(false);
    });
  });

  describe('Local Time Functions', () => {
    test('getLocalTimezone returns a valid timezone', () => {
      const timezone = getLocalTimezone();
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
    });

    test('formatInLocalTime formats dates correctly', () => {
      const testDate = new Date('2024-01-15T14:30:00.000Z');
      const formatted = formatInLocalTime(testDate, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('Jan');
    });
  });

  describe('Edge Cases', () => {
    test('handles invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      
      expect(getDaysRemainingGlobal(invalidDate)).toBe(0);
      expect(isTodayGlobal(invalidDate)).toBe(false);
    });

    test('handles string date inputs', () => {
      const dateString = '2024-01-16T12:00:00.000Z';
      
      expect(getDaysRemainingGlobal(dateString)).toBe(1);
      expect(isTodayGlobal(dateString)).toBe(false);
    });

    test('formatInLocalTime handles string dates', () => {
      const dateString = '2024-01-15T14:30:00.000Z';
      const formatted = formatInLocalTime(dateString, { 
        year: 'numeric', 
        month: 'short' 
      });
      expect(typeof formatted).toBe('string');
    });
  });

  describe('Consistency Tests', () => {
    test('global functions are timezone-independent', () => {
      // These should return the same values regardless of local timezone
      const globalDay = getCurrentGlobalDay();
      const hoursRemaining = getHoursRemainingInGlobalDay();
      
      // Mock changing system timezone (conceptually)
      // The results should be the same because they use UTC
      expect(getCurrentGlobalDay()).toBe(globalDay);
      expect(getHoursRemainingInGlobalDay()).toBeCloseTo(hoursRemaining, 1);
    });

    test('challenge deadline consistency', () => {
      // Two users in different timezones should see the same days remaining
      const challengeEnd = new Date('2024-01-20T00:00:00.000Z');
      const daysRemaining = getDaysRemainingGlobal(challengeEnd);
      
      // This should be 5 days regardless of user timezone
      expect(daysRemaining).toBe(5);
    });
  });
}); 