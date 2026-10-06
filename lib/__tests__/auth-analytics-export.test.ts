const mockAmplitudeTrack = jest.fn();
const mockPostHogCapture = jest.fn();
const mockRecordProductEvent = jest.fn();
const mockForwardToRetention = jest.fn(async () => true);

jest.mock('@amplitude/analytics-react-native', () => ({
  track: mockAmplitudeTrack,
}));
jest.mock('@amplitude/plugin-session-replay-react-native', () => ({
  SessionReplayPlugin: jest.fn(),
}));
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest.fn(() => ({ capture: mockPostHogCapture })),
  PostHogProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock('@/lib/sentry', () => ({
  recordProductAnalyticsEvent: mockRecordProductEvent,
}));
jest.mock('@/lib/notifications/retention-event-bridge', () => ({
  forwardProductEventToRetentionProvider: mockForwardToRetention,
}));

const blockedJourneys: [string, Record<string, unknown>][] = [
  ['Onboarding Journey', { stage: 'auth', selection: 'not_applicable' }],
  ['Onboarding Journey', { stage: 'auth_cancelled' }],
  ...['apple', 'google', 'password', 'existing_account'].map(
    selection =>
      ['Onboarding Journey', { stage: 'save_gate', selection }] as [
        string,
        Record<string, unknown>,
      ]
  ),
  ['Promise Invite Journey', { stage: 'auth_handoff' }],
  ['Promise Invite Journey', { entry_point: 'authentication' }],
  ['Promise Invite Journey', { entry_point: 'password_authentication' }],
  ['Promise Invite Journey', { stage: 'preview', method: 'google' }],
  ['Promise Invite Journey', { stage: 'preview', mode: 'signup' }],
];

describe('authentication analytics export boundary', () => {
  const previousAmplitudeKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
  const previousPostHogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = 'test-amplitude-key';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'test-posthog-key';
  });
  afterAll(() => {
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = previousAmplitudeKey;
    process.env.EXPO_PUBLIC_POSTHOG_KEY = previousPostHogKey;
  });

  it('blocks every authentication result and equivalent journey before all sinks', async () => {
    const { trackProductEvent } = require('@/lib/posthog');
    const { trackAmplitudeEvent } = require('@/lib/amplitude');
    for (const flow of ['login', 'signup']) {
      for (const method of ['apple', 'google', 'password']) {
        for (const outcome of [
          'started',
          'handoff',
          'succeeded',
          'cancelled',
          'failed',
        ]) {
          const properties = { flow, method, outcome };
          trackProductEvent('Authentication Result', properties);
          trackAmplitudeEvent('Authentication Result', properties);
        }
      }
    }
    for (const [event, properties] of blockedJourneys) {
      trackProductEvent(event, properties);
      trackAmplitudeEvent(event, properties);
    }
    await Promise.resolve();
    await Promise.resolve();
    expect(mockAmplitudeTrack).not.toHaveBeenCalled();
    expect(mockPostHogCapture).not.toHaveBeenCalled();
    expect(mockRecordProductEvent).not.toHaveBeenCalled();
    expect(mockForwardToRetention).not.toHaveBeenCalled();
  });

  it('continues exporting non-authentication product and journey events', async () => {
    const { trackProductEvent } = require('@/lib/posthog');
    const { trackAmplitudeEvent } = require('@/lib/amplitude');
    const permitted: [string, Record<string, unknown>][] = [
      ['Group Joined', { join_method: 'invite' }],
      ['Onboarding Journey', { stage: 'proof', selection: 'photo' }],
      [
        'Promise Invite Journey',
        { stage: 'acceptance', entry_point: 'acceptance_receipt' },
      ],
    ];
    for (const [event, properties] of permitted) {
      trackProductEvent(event, properties);
    }
    trackAmplitudeEvent('Group Joined', { join_method: 'invite' });
    await Promise.resolve();
    await Promise.resolve();
    for (const [event, properties] of permitted) {
      expect(mockAmplitudeTrack).toHaveBeenCalledWith(
        event,
        expect.objectContaining(properties)
      );
      expect(mockPostHogCapture).toHaveBeenCalledWith(
        event,
        expect.objectContaining(properties)
      );
      expect(mockRecordProductEvent).toHaveBeenCalledWith(event, properties);
      expect(mockForwardToRetention).toHaveBeenCalledWith(event, properties);
    }
    expect(mockAmplitudeTrack).toHaveBeenCalledTimes(4);
  });
});
