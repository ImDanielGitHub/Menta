import {
  hasTodaySecondaryContent,
  resolveTodayDashboardLayout,
  type TodaySecondaryContent,
} from '@/lib/today-dashboard-layout';

const emptySecondary: TodaySecondaryContent = {
  hasLoadingLedger: false,
  hasPartialDataNotice: false,
  hasStaleSnapshotNotice: false,
  hasSupportingLedger: false,
};

describe('Today dashboard layout', () => {
  it.each([
    'missed day',
    'no promises',
    'simple return',
    'invite handoff',
    'recovery choice',
    'empty state',
  ])('keeps a wide %s state in one full primary lane', () => {
    expect(
      resolveTodayDashboardLayout({
        wideWindowEligible: true,
        secondary: emptySecondary,
      })
    ).toBe('stacked');
    expect(hasTodaySecondaryContent(emptySecondary)).toBe(false);
  });

  it.each<keyof TodaySecondaryContent>([
    'hasLoadingLedger',
    'hasPartialDataNotice',
    'hasStaleSnapshotNotice',
    'hasSupportingLedger',
  ])('uses adjacent lanes when wide and %s is visible', source => {
    const secondary = { ...emptySecondary, [source]: true };

    expect(hasTodaySecondaryContent(secondary)).toBe(true);
    expect(
      resolveTodayDashboardLayout({
        wideWindowEligible: true,
        secondary,
      })
    ).toBe('adjacent');
  });

  it('stacks real secondary content when the window cannot fit two lanes', () => {
    expect(
      resolveTodayDashboardLayout({
        wideWindowEligible: false,
        secondary: { ...emptySecondary, hasSupportingLedger: true },
      })
    ).toBe('stacked');
  });
});
