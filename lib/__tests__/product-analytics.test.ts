import {
  getAnalyticsWidthBucket,
  getPaywallAnalyticsPlacement,
  getPaywallAnalyticsVariant,
  getPromiseDurationBucket,
  getProofReceiptAnalyticsStatus,
  getProofReceiptActionStatus,
  getProofOutcomeReason,
  getProofSubmissionOutcome,
  getStreakLengthBucket,
  MENTA_ANALYTICS_EVENT_NAMES,
  MENTA_ANALYTICS_SCHEMA_VERSION,
  PAYWALL_PLACEMENT_FLAG_KEY,
} from '@/lib/product-analytics';

describe('product analytics contract', () => {
  it('keeps one small, reviewable event registry', () => {
    expect(MENTA_ANALYTICS_SCHEMA_VERSION).toBe(3);
    expect(MENTA_ANALYTICS_EVENT_NAMES).toEqual([
      'App Opened',
      'App Layout Classified',
      'Authentication Result',
      'Language Selected',
      'Product Operation',
      'Onboarding Completed',
      'Onboarding Journey',
      'Accountability Invite Journey',
      'Promise Created',
      'Today Action Selected',
      'Proof Capture Result',
      'Proof Submitted',
      'Proof Submission Outcome',
      'Proof Receipt Action',
      'Proof Reviewed',
      'Group Joined',
      'Notification Opened',
      'Notification Permission Updated',
      'Notification In-App Outcome',
      'Notification Provider Outcome',
      'Notification Test Journey',
      'App Update Journey',
      'Store Review Request',
      'Ad Outcome',
      'Paywall Viewed',
      'Subscription Started',
      'Subscription Outcome',
    ]);
    expect(PAYWALL_PLACEMENT_FLAG_KEY).toBe('paywall_placement');
  });

  it('uses fixed layout buckets instead of raw screen dimensions', () => {
    expect(getAnalyticsWidthBucket(390)).toBe('compact');
    expect(getAnalyticsWidthBucket(768)).toBe('medium');
    expect(getAnalyticsWidthBucket(1024)).toBe('expanded');
  });

  it('buckets promise durations without creating high-cardinality values', () => {
    expect(getPromiseDurationBucket(7)).toBe('7_days');
    expect(getPromiseDurationBucket(14)).toBe('14_days');
    expect(getPromiseDurationBucket(30)).toBe('30_days');
    expect(getPromiseDurationBucket(365)).toBe('other');
  });

  it('buckets streak length for useful retention segments', () => {
    expect(getStreakLengthBucket(0)).toBe('0');
    expect(getStreakLengthBucket(2)).toBe('1_2');
    expect(getStreakLengthBucket(6)).toBe('3_6');
    expect(getStreakLengthBucket(13)).toBe('7_13');
    expect(getStreakLengthBucket(29)).toBe('14_29');
    expect(getStreakLengthBucket(30)).toBe('30_plus');
  });

  it('reduces server receipt states to three actionable outcomes', () => {
    expect(getProofReceiptAnalyticsStatus('accepted')).toBe('accepted');
    expect(getProofReceiptAnalyticsStatus('pending-review')).toBe(
      'pending_review'
    );
    expect(getProofReceiptAnalyticsStatus('correction-requested')).toBe(
      'correction_requested'
    );
    expect(getProofReceiptAnalyticsStatus('failed')).toBeNull();
  });

  it('maps proof failures and receipts to closed outcome enums', () => {
    expect(getProofOutcomeReason('MISSING_SESSION')).toBe('missing_session');
    expect(getProofOutcomeReason('DAILY_SUBMISSION_EXISTS')).toBe(
      'daily_submission_exists'
    );
    expect(getProofOutcomeReason('NOT_JOINED')).toBe('not_joined');
    expect(getProofOutcomeReason('UNEXPECTED')).toBe('network_or_server');
    expect(getProofOutcomeReason(null)).toBe('none');

    expect(getProofSubmissionOutcome('accepted')).toBe('accepted');
    expect(getProofSubmissionOutcome('pending-review')).toBe('pending_review');
    expect(getProofSubmissionOutcome('correction-requested')).toBe(
      'correction_requested'
    );
    expect(getProofSubmissionOutcome('sent')).toBe('sent');
    expect(getProofSubmissionOutcome('uploading')).toBe('in_progress');
    expect(getProofSubmissionOutcome('saved-local')).toBe('saved_local');
    expect(getProofSubmissionOutcome('unknown-result')).toBe('unknown_result');
    expect(getProofSubmissionOutcome('failed')).toBe('failed');
    expect(getProofReceiptActionStatus('saved-local')).toBe('saved_local');
    expect(getProofReceiptActionStatus('pending-review')).toBe(
      'pending_review'
    );
  });

  it('maps paywall placement and flag values to closed enums', () => {
    expect(getPaywallAnalyticsPlacement('challenge')).toBe('challenge');
    expect(getPaywallAnalyticsPlacement('group')).toBe('group');
    expect(getPaywallAnalyticsPlacement('unknown')).toBe('general');
    expect(getPaywallAnalyticsVariant('onboarding')).toBe('onboarding');
    expect(getPaywallAnalyticsVariant('later')).toBe('later');
    expect(getPaywallAnalyticsVariant(true)).toBe('unset');
    expect(getPaywallAnalyticsVariant(undefined)).toBe('unset');
  });
});
