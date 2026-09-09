const mockPostHogCapture = jest.fn();
const mockPostHogIdentify = jest.fn();
const mockPostHogReset = jest.fn();
const mockPostHogGetFeatureFlag = jest.fn(() => undefined);
const mockPostHogGetFeatureFlagPayload = jest.fn(() => undefined);
const mockPostHogOnFeatureFlags = jest.fn(() => () => undefined);
const mockPostHogReloadFeatureFlags = jest.fn();
const mockAmplitudeTrack = jest.fn();

const MockPostHog = jest.fn().mockImplementation(() => ({
  capture: mockPostHogCapture,
  identify: mockPostHogIdentify,
  reset: mockPostHogReset,
  getFeatureFlag: mockPostHogGetFeatureFlag,
  getFeatureFlagPayload: mockPostHogGetFeatureFlagPayload,
  onFeatureFlags: mockPostHogOnFeatureFlags,
  reloadFeatureFlags: mockPostHogReloadFeatureFlags,
}));

jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: MockPostHog,
  PostHog: MockPostHog,
  PostHogProvider: ({ children }: { children: unknown }) => children,
  useFeatureFlag: jest.fn((_flag?: string, _client?: unknown) => undefined),
  usePostHog: jest.fn(() => null),
}));

jest.mock('@amplitude/analytics-react-native', () => ({
  add: jest.fn(() => ({ promise: Promise.resolve() })),
  init: jest.fn(() => ({ promise: Promise.resolve() })),
  reset: jest.fn(),
  setUserId: jest.fn(),
  track: mockAmplitudeTrack,
}));

describe('PostHog transport', () => {
  const originalApiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const originalHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  const originalAmplitudeKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'public-test-key';
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = 'public-amplitude-key';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = originalApiKey;
    process.env.EXPO_PUBLIC_POSTHOG_HOST = originalHost;
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = originalAmplitudeKey;
  });

  it('treats a blank PostHog key as unusable', () => {
    const { canStartPostHog } = require('@/lib/posthog');
    expect(canStartPostHog(undefined)).toBe(false);
    expect(canStartPostHog('')).toBe(false);
    expect(canStartPostHog('  ')).toBe(false);
    expect(canStartPostHog('public-test-key')).toBe(true);
  });

  it('initialises once with lifecycle autocapture and replay off', () => {
    jest.isolateModules(() => {
      const {
        initializeProductAnalytics,
        isPostHogReplayEnabled,
        POSTHOG_REPLAY_RELEASE_APPROVED,
      } = require('@/lib/posthog');
      expect(POSTHOG_REPLAY_RELEASE_APPROVED).toBe(false);
      expect(isPostHogReplayEnabled()).toBe(false);
      initializeProductAnalytics();
      initializeProductAnalytics();
    });

    expect(MockPostHog).toHaveBeenCalledTimes(1);
    expect(MockPostHog).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        host: 'https://us.i.posthog.com',
        disableGeoip: true,
        sendFeatureFlagEvent: true,
        captureAppLifecycleEvents: false,
        enableSessionReplay: false,
      })
    );
    expect(mockPostHogCapture).toHaveBeenCalledWith(
      'App Opened',
      expect.objectContaining({
        event_version: 2,
      })
    );
    expect(mockAmplitudeTrack).not.toHaveBeenCalled();
  });

  it('fails closed when the PostHog key is missing', async () => {
    const previousKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    delete process.env.EXPO_PUBLIC_POSTHOG_KEY;

    try {
      if (process.env.EXPO_PUBLIC_POSTHOG_KEY) {
        const { canStartPostHog } = require('@/lib/posthog');
        expect(canStartPostHog('')).toBe(false);
        return;
      }

      jest.isolateModules(() => {
        const {
          initializeProductAnalytics,
          trackProductEvent,
          setProductAnalyticsUserId,
          getPostHogClient,
        } = require('@/lib/posthog');

        expect(() => initializeProductAnalytics()).not.toThrow();
        expect(() =>
          trackProductEvent('Group Joined', { join_method: 'invite' })
        ).not.toThrow();
        expect(() => setProductAnalyticsUserId('user-1')).not.toThrow();
        expect(getPostHogClient()).toBeNull();
      });

      expect(MockPostHog).not.toHaveBeenCalled();
      expect(mockPostHogCapture).not.toHaveBeenCalled();
      expect(mockAmplitudeTrack).toHaveBeenCalledWith(
        'Group Joined',
        expect.objectContaining({
          join_method: 'invite',
          event_version: 2,
        })
      );
    } finally {
      process.env.EXPO_PUBLIC_POSTHOG_KEY = previousKey;
    }
  });

  it('dual-writes governed events to Amplitude and PostHog', () => {
    jest.isolateModules(() => {
      const { trackProductEvent } = require('@/lib/posthog');
      trackProductEvent('Group Joined', { join_method: 'invite' });
    });

    expect(mockAmplitudeTrack).toHaveBeenCalledWith(
      'Group Joined',
      expect.objectContaining({
        join_method: 'invite',
        event_version: 2,
        app_platform: expect.any(String),
      })
    );
    expect(mockPostHogCapture).toHaveBeenCalledWith(
      'Group Joined',
      expect.objectContaining({
        join_method: 'invite',
        event_version: 2,
        app_platform: expect.any(String),
      })
    );
  });

  it('still captures PostHog events when the Amplitude key is missing', () => {
    delete process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;

    jest.isolateModules(() => {
      const { trackProductEvent } = require('@/lib/posthog');
      expect(() =>
        trackProductEvent('Group Joined', { join_method: 'invite' })
      ).not.toThrow();
    });

    expect(mockAmplitudeTrack).not.toHaveBeenCalled();
    expect(mockPostHogCapture).toHaveBeenCalledWith(
      'Group Joined',
      expect.objectContaining({
        join_method: 'invite',
      })
    );
  });

  it('keeps PostHog transport failures outside product behaviour and still writes Amplitude', () => {
    mockPostHogCapture.mockImplementationOnce(() => {
      throw new Error('transport unavailable');
    });

    jest.isolateModules(() => {
      const { trackProductEvent } = require('@/lib/posthog');
      expect(() =>
        trackProductEvent('Group Joined', { join_method: 'invite' })
      ).not.toThrow();
    });

    expect(mockAmplitudeTrack).toHaveBeenCalledWith(
      'Group Joined',
      expect.objectContaining({
        join_method: 'invite',
        event_version: 2,
      })
    );
  });

  it('identifies with the account id only and resets on sign-out', () => {
    jest.isolateModules(() => {
      const { setProductAnalyticsUserId } = require('@/lib/posthog');
      setProductAnalyticsUserId('user-123');
      setProductAnalyticsUserId('user-123');
      setProductAnalyticsUserId(null);
    });

    expect(mockPostHogIdentify).toHaveBeenCalledTimes(1);
    expect(mockPostHogIdentify).toHaveBeenCalledWith('user-123');
    expect(mockPostHogReset).toHaveBeenCalledTimes(1);
  });

  it('resets persisted identity before a signed-out first hydration', () => {
    jest.isolateModules(() => {
      const { setProductAnalyticsUserId } = require('@/lib/posthog');
      setProductAnalyticsUserId(null);
      setProductAnalyticsUserId(null);
    });

    expect(mockPostHogReset).toHaveBeenCalledTimes(1);
    expect(mockPostHogIdentify).not.toHaveBeenCalled();
  });

  it('resets before switching between signed-in accounts', () => {
    jest.isolateModules(() => {
      const { setProductAnalyticsUserId } = require('@/lib/posthog');
      setProductAnalyticsUserId('user-1');
      setProductAnalyticsUserId('user-2');
    });

    expect(mockPostHogReset).toHaveBeenCalledTimes(1);
    expect(mockPostHogIdentify).toHaveBeenNthCalledWith(1, 'user-1');
    expect(mockPostHogIdentify).toHaveBeenNthCalledWith(2, 'user-2');
  });

  it('treats a missing paywall placement flag as unset', () => {
    mockPostHogGetFeatureFlag.mockReturnValueOnce(undefined);

    jest.isolateModules(() => {
      const { getPaywallPlacementFlag } = require('@/lib/posthog');
      expect(getPaywallPlacementFlag()).toBe('unset');
    });

    expect(mockPostHogGetFeatureFlag).toHaveBeenCalledWith('paywall_placement');
  });

  it('fails the paywall flag subscription closed without a client', () => {
    const onChange = jest.fn();
    const { subscribePaywallPlacementFlag } = require('@/lib/posthog');

    const unsubscribe = subscribePaywallPlacementFlag(null, onChange);

    expect(onChange).toHaveBeenCalledWith('unset');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('updates the paywall placement when direct client flags change', () => {
    let notifyFlags: (() => void) | undefined;
    const unsubscribe = jest.fn();
    const getFeatureFlag = jest
      .fn()
      .mockReturnValueOnce('onboarding')
      .mockReturnValueOnce('later');
    const onFeatureFlags = jest.fn((callback: () => void) => {
      notifyFlags = callback;
      return unsubscribe;
    });
    const onChange = jest.fn();
    const { subscribePaywallPlacementFlag } = require('@/lib/posthog');

    const stop = subscribePaywallPlacementFlag(
      { getFeatureFlag, onFeatureFlags },
      onChange
    );
    notifyFlags?.();

    expect(onChange).toHaveBeenNthCalledWith(1, 'onboarding');
    expect(onChange).toHaveBeenNthCalledWith(2, 'later');
    expect(onFeatureFlags).toHaveBeenCalledTimes(1);
    expect(stop).toBe(unsubscribe);
  });

  it('keeps update authority unknown until fresh flags arrive', () => {
    let notifyFlags: (() => void) | undefined;
    const unsubscribe = jest.fn();
    const flagClient = {
      getFeatureFlag: jest.fn(() => 'required'),
      getFeatureFlagPayload: jest.fn(() => ({
        schema_version: 1,
        release: '1.9.2',
        platforms: {
          ios: { minimum_version: '1.9.2', store_available: true },
          android: { minimum_version: '1.9.2', store_available: false },
        },
      })),
      onFeatureFlags: jest.fn((callback: () => void) => {
        notifyFlags = callback;
        return unsubscribe;
      }),
      reloadFeatureFlags: jest.fn(),
    };
    const onChange = jest.fn();
    const { subscribeAppUpdatePolicy } = require('@/lib/posthog');

    const stop = subscribeAppUpdatePolicy(
      flagClient,
      { currentVersion: '1.9.1', platform: 'ios' },
      onChange
    );

    expect(onChange).toHaveBeenNthCalledWith(1, {
      status: 'authority_unknown',
    });
    notifyFlags?.();
    expect(onChange).toHaveBeenNthCalledWith(2, {
      status: 'offer',
      mode: 'required',
      minimumVersion: '1.9.2',
      storeUrl: 'https://apps.apple.com/app/id6747362646',
    });
    expect(stop).toBe(unsubscribe);
  });

  it('keeps draft experiments on control without evaluating remote flags', () => {
    jest.isolateModules(() => {
      const {
        TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT,
      } = require('@/lib/experiments');
      const { getExperimentAssignment } = require('@/lib/posthog');

      expect(
        getExperimentAssignment(
          TODAY_PROOF_LOGGING_LAYOUT_EXPERIMENT,
          'user-123',
          { getFeatureFlag: mockPostHogGetFeatureFlag }
        )
      ).toMatchObject({
        variant: 'timer_hero',
        source: 'draft_control',
        isRemoteAssignment: false,
      });
    });

    expect(mockPostHogGetFeatureFlag).not.toHaveBeenCalled();
  });

  it('requires a ready registry entry and stable identity for remote assignment', () => {
    const definition = {
      key: 'test_layout',
      status: 'ready',
      surface: 'today',
      variants: ['control', 'treatment'],
      control: 'control',
      owner: 'Menta product',
      reviewAfter: '2026-10-01',
      hypothesis: 'Treatment improves the primary outcome.',
      eligibility: 'Authenticated eligible people only.',
      primaryMetric: 'confirmed outcome',
      guardrails: ['error rate'],
      authority: 'presentation_only',
    } as const;
    mockPostHogGetFeatureFlag.mockReturnValueOnce('treatment');

    jest.isolateModules(() => {
      const { getExperimentAssignment } = require('@/lib/posthog');

      expect(
        getExperimentAssignment(definition, 'user-123', {
          getFeatureFlag: mockPostHogGetFeatureFlag,
        })
      ).toMatchObject({
        variant: 'treatment',
        source: 'remote',
        isRemoteAssignment: true,
      });
      expect(
        getExperimentAssignment(definition, null, {
          getFeatureFlag: mockPostHogGetFeatureFlag,
        })
      ).toMatchObject({
        variant: 'control',
        source: 'anonymous_control',
        isRemoteAssignment: false,
      });
    });

    expect(mockPostHogGetFeatureFlag).toHaveBeenCalledTimes(1);
    expect(mockPostHogGetFeatureFlag).toHaveBeenCalledWith('test_layout');
  });

  it('records one PostHog exposure per explicit eligible scope', () => {
    const assignment = {
      key: 'test_layout',
      surface: 'today',
      variant: 'treatment',
      source: 'remote',
      isRemoteAssignment: true,
    } as const;

    jest.isolateModules(() => {
      const { createExperimentExposureRecorder } = require('@/lib/posthog');
      const recordExposure = createExperimentExposureRecorder({
        capture: mockPostHogCapture,
      });

      expect(recordExposure(assignment, 'today-session-1')).toBe(true);
      expect(recordExposure(assignment, 'today-session-1')).toBe(false);
      expect(recordExposure(assignment, 'today-session-2')).toBe(true);
      expect(
        recordExposure(
          {
            ...assignment,
            source: 'missing_or_invalid_control',
            isRemoteAssignment: false,
          },
          'today-session-3'
        )
      ).toBe(false);
    });

    expect(mockPostHogCapture).toHaveBeenCalledTimes(2);
    expect(mockPostHogCapture).toHaveBeenCalledWith('Experiment Exposed', {
      event_version: 2,
      app_platform: 'ios',
      experiment_key: 'test_layout',
      experiment_variant: 'treatment',
      experiment_surface: 'today',
    });
  });
});
