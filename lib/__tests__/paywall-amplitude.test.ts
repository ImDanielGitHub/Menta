const mockTrack = jest.fn(() => ({ promise: Promise.resolve() }));
const mockPostHogCapture = jest.fn();
const mockIdentify = jest.fn(() => ({ promise: Promise.resolve() }));
const mockSet = jest.fn().mockReturnThis();
const mockSetOnce = jest.fn().mockReturnThis();

jest.mock('@amplitude/analytics-react-native', () => ({
  track: mockTrack,
  identify: mockIdentify,
  Identify: jest
    .fn()
    .mockImplementation(() => ({ set: mockSet, setOnce: mockSetOnce })),
  setUserId: jest.fn(),
  reset: jest.fn(),
}));
jest.mock('@amplitude/plugin-session-replay-react-native', () => ({
  SessionReplayPlugin: jest.fn(),
}));
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(() => ({ capture: mockPostHogCapture })),
  PostHogProvider: jest.fn(),
}));
jest.mock('@/lib/sentry', () => ({ recordProductAnalyticsEvent: jest.fn() }));
jest.mock('@/lib/notifications/retention-event-bridge', () => ({
  forwardProductEventToRetentionProvider: jest.fn(),
}));

const settle = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
const originalAmplitudeKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
const originalPostHogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = 'public-test-key';
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'public-test-key';
  await require('@react-native-async-storage/async-storage').clear();
});
afterAll(() => {
  process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = originalAmplitudeKey;
  process.env.EXPO_PUBLIC_POSTHOG_KEY = originalPostHogKey;
});

it.each(['control', 'hard_paywall'] as const)(
  'sends %s exposure and downstream conversion events to Amplitude with the allocation',
  async variant => {
    const amplitude = require('@/lib/amplitude');
    const context = require('@/lib/analytics/onboarding-paywall-context');
    const { trackProductEvent } = require('@/lib/posthog');
    amplitude.setAmplitudeUserId('member');
    await settle();
    await context.rememberPaywallAnalyticsAssignment('member', variant);
    amplitude.setAmplitudePaywallAssignment(variant);
    trackProductEvent('Experiment Exposed', {
      experiment_key: 'onboarding_hard_paywall_v1',
      experiment_variant: variant,
      experiment_surface: 'onboarding',
    });
    trackProductEvent('Paywall Viewed', {
      placement: 'onboarding',
      variant: 'onboarding',
    });
    trackProductEvent('Onboarding Completed', {
      activation_path: 'first_promise',
      referral_used: false,
    });
    trackProductEvent('Subscription Started', { plan: 'annual' });
    trackProductEvent('Subscription Outcome', {
      action: 'purchase',
      outcome: 'cancelled',
      plan: 'annual',
    });
    trackProductEvent('Subscription Outcome', {
      action: 'restore',
      outcome: 'succeeded',
      plan: 'unknown',
    });
    trackProductEvent('Promise Created', {
      creation_source: 'onboarding',
      duration_bucket: '14_days',
      is_first_promise: true,
      proof_type: 'text',
    });
    trackProductEvent('Proof Submitted', {
      day_status: 'done',
      is_correction: false,
      proof_type: 'text',
      receipt_status: 'accepted',
      review_mode: 'self',
      streak_length_bucket: '1_2',
    });
    expect(mockTrack).toHaveBeenCalledTimes(8);
    for (const [, properties] of mockTrack.mock.calls as unknown as Array<
      [string, Record<string, unknown>]
    >) {
      expect(properties).toMatchObject({
        onboarding_paywall_experiment: 'onboarding_hard_paywall_v1',
        onboarding_paywall_variant: variant,
      });
    }
    expect(mockPostHogCapture).toHaveBeenCalledWith(
      'Experiment Exposed',
      expect.objectContaining({
        experiment_variant: variant,
        onboarding_paywall_variant: variant,
      })
    );
    expect(mockSetOnce).toHaveBeenCalledWith(
      'onboarding_paywall_variant',
      variant
    );
  }
);

it('restores cohort attribution after a restart and does not leak it to another account', async () => {
  const amplitude = require('@/lib/amplitude'),
    context = require('@/lib/analytics/onboarding-paywall-context');
  amplitude.setAmplitudeUserId('first');
  await settle();
  await context.rememberPaywallAnalyticsAssignment('first', 'hard_paywall');
  amplitude.setAmplitudeUserId(null);
  amplitude.trackAmplitudeEvent('App Opened');
  expect(mockTrack).toHaveBeenLastCalledWith(
    'App Opened',
    expect.not.objectContaining({ onboarding_paywall_variant: 'hard_paywall' })
  );
  amplitude.setAmplitudeUserId('second');
  await settle();
  amplitude.trackAmplitudeEvent('App Opened');
  expect(mockTrack).toHaveBeenLastCalledWith(
    'App Opened',
    expect.not.objectContaining({ onboarding_paywall_variant: 'hard_paywall' })
  );
  amplitude.setAmplitudeUserId('first');
  await settle();
  amplitude.trackAmplitudeEvent('Subscription Started', { plan: 'annual' });
  expect(mockTrack).toHaveBeenLastCalledWith(
    'Subscription Started',
    expect.objectContaining({ onboarding_paywall_variant: 'hard_paywall' })
  );
});

it('retains the original analysis cohort when the experiment is disabled', async () => {
  const amplitude = require('@/lib/amplitude'),
    context = require('@/lib/analytics/onboarding-paywall-context');
  amplitude.setAmplitudeUserId('member');
  await settle();
  await context.rememberPaywallAnalyticsAssignment('member', 'hard_paywall');
  await context.rememberPaywallAnalyticsAssignment('member', 'control');
  expect(
    context.getPaywallAnalyticsProperties().onboarding_paywall_variant
  ).toBe('hard_paywall');
});
