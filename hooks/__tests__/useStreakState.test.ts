import { resolveServerStreakDayStatus } from '@/hooks/useStreakState';

describe('useStreakState server status mapping', () => {
  it('keeps approved, pending, rejected, at-risk and due states distinct', () => {
    expect(
      resolveServerStreakDayStatus({
        submissionStatus: 'approved',
        atRisk: false,
      })
    ).toBe('done');
    expect(
      resolveServerStreakDayStatus({
        submissionStatus: 'pending',
        atRisk: false,
      })
    ).toBe('waiting');
    expect(
      resolveServerStreakDayStatus({
        submissionStatus: 'rejected',
        atRisk: false,
      })
    ).toBe('correction');
    expect(
      resolveServerStreakDayStatus({
        submissionStatus: 'none',
        atRisk: true,
      })
    ).toBe('at_risk');
    expect(
      resolveServerStreakDayStatus({
        submissionStatus: 'none',
        atRisk: false,
      })
    ).toBe('due');
  });

  it('does not accept a last check-in date and cannot infer a missed day', () => {
    expect(
      resolveServerStreakDayStatus({
        submissionStatus: 'none',
        atRisk: false,
      })
    ).toBe('due');
  });
});
