const mockAmplitudeInit = jest.fn(() => ({ promise: Promise.resolve() }));
const mockAmplitudeTrack = jest.fn();
const mockAmplitudeAdd = jest.fn(() => ({ promise: Promise.resolve() }));
const mockAmplitudeReset = jest.fn();
const mockAmplitudeSetUserId = jest.fn();
const mockReplayStart = jest.fn(async () => undefined);
const mockReplayStop = jest.fn(async () => undefined);
const MockSessionReplayPlugin = jest.fn().mockImplementation(() => ({
  start: mockReplayStart,
  stop: mockReplayStop,
}));

jest.mock('@amplitude/analytics-react-native', () => ({
  add: mockAmplitudeAdd,
  init: mockAmplitudeInit,
  reset: mockAmplitudeReset,
  setUserId: mockAmplitudeSetUserId,
  track: mockAmplitudeTrack,
}));

jest.mock('@amplitude/plugin-session-replay-react-native', () => ({
  SessionReplayPlugin: MockSessionReplayPlugin,
}));

const flushReplayState = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('Amplitude transport', () => {
  it('clears a persisted account without rotating the installation identity on cold start', () => {
    jest.isolateModules(() => {
      const { setAmplitudeUserId } = require('@/lib/amplitude');
      setAmplitudeUserId(null);
      setAmplitudeUserId(null);
    });
    expect(mockAmplitudeSetUserId).toHaveBeenCalledTimes(1);
    expect(mockAmplitudeSetUserId).toHaveBeenCalledWith(undefined);
    expect(mockAmplitudeReset).not.toHaveBeenCalled();
  });

  it('contains asynchronous event transport rejection', async () => {
    mockAmplitudeTrack.mockReturnValueOnce({
      promise: Promise.reject(new Error('offline')),
    });
    jest.isolateModules(() => {
      const { trackAmplitudeEvent } = require('@/lib/amplitude');
      trackAmplitudeEvent('App Opened');
    });
    await flushReplayState();
  });
  const originalApiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
  const originalReplayFlag = process.env.EXPO_PUBLIC_AMPLITUDE_REPLAY_ENABLED;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = 'public-test-key';
    process.env.EXPO_PUBLIC_AMPLITUDE_REPLAY_ENABLED = 'true';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY = originalApiKey;
    process.env.EXPO_PUBLIC_AMPLITUDE_REPLAY_ENABLED = originalReplayFlag;
  });

  it('starts masked replay for every eligible production session without a consent hold', async () => {
    let setAmplitudeSessionReplayHold: (
      reason: 'route' | 'iap',
      held: boolean
    ) => void;

    jest.isolateModules(() => {
      const transport = require('@/lib/amplitude');
      setAmplitudeSessionReplayHold = transport.setAmplitudeSessionReplayHold;
      transport.initializeAmplitude();
      setAmplitudeSessionReplayHold('route', false);
    });

    await flushReplayState();

    expect(MockSessionReplayPlugin).toHaveBeenCalledWith({
      autoStart: false,
      enableRemoteConfig: false,
      privacyConfig: { maskLevel: 'conservative' },
      sampleRate: 1,
    });
    expect(mockAmplitudeAdd).toHaveBeenCalledTimes(1);
    expect(mockReplayStart).toHaveBeenCalledTimes(1);

    setAmplitudeSessionReplayHold!('iap', true);
    await flushReplayState();
    expect(mockReplayStop).toHaveBeenCalledTimes(1);
  });

  it('keeps credential, proof-media and purchase routes out of replay', () => {
    const { shouldHoldAmplitudeReplayForPathname } = require('@/lib/amplitude');

    expect(shouldHoldAmplitudeReplayForPathname('/login')).toBe(true);
    expect(shouldHoldAmplitudeReplayForPathname('/menta-check')).toBe(true);
    expect(shouldHoldAmplitudeReplayForPathname('/events/event-1/proof')).toBe(
      true
    );
    expect(shouldHoldAmplitudeReplayForPathname('/shop/item-1')).toBe(true);
    expect(shouldHoldAmplitudeReplayForPathname('/onboarding')).toBe(false);
    expect(shouldHoldAmplitudeReplayForPathname('/(tabs)/today')).toBe(false);
  });

  const recoveryPaths = [
    '/forgot-password',
    '/password-recovery',
    '/password-recovery/callback',
  ];

  it.each(
    recoveryPaths.flatMap(path => [
      path,
      `${path}/`,
      `${path}?status=invalid`,
      `/(auth)${path}/?code=synthetic-code`,
    ])
  )('holds password recovery replay for %s', path => {
    const { shouldHoldAmplitudeReplayForPathname } = require('@/lib/amplitude');
    expect(shouldHoldAmplitudeReplayForPathname(path)).toBe(true);
  });

  it.each(recoveryPaths)(
    'never starts replay on a cold start at %s',
    async path => {
      jest.isolateModules(() => {
        const transport = require('@/lib/amplitude');
        transport.initializeAmplitude();
        transport.setAmplitudeSessionReplayHold(
          'route',
          transport.shouldHoldAmplitudeReplayForPathname(path)
        );
      });

      await flushReplayState();
      expect(mockAmplitudeAdd).toHaveBeenCalledTimes(1);
      expect(mockReplayStart).not.toHaveBeenCalled();
    }
  );

  it('stops on recovery entry and resumes only after recovery and purchase holds clear', async () => {
    const transport = require('@/lib/amplitude');
    const navigate = async (path: string) => {
      transport.setAmplitudeSessionReplayHold(
        'route',
        transport.shouldHoldAmplitudeReplayForPathname(path)
      );
      await flushReplayState();
    };
    transport.initializeAmplitude();
    await navigate('/(tabs)/today');
    expect(mockReplayStart).toHaveBeenCalledTimes(1);

    for (const path of recoveryPaths) {
      await navigate(path);
      expect(mockReplayStop).toHaveBeenCalledTimes(1);
      expect(mockReplayStart).toHaveBeenCalledTimes(1);
    }

    transport.setAmplitudeSessionReplayHold('iap', true);
    await navigate('/(tabs)/today');
    expect(mockReplayStart).toHaveBeenCalledTimes(1);
    transport.setAmplitudeSessionReplayHold('iap', false);
    await flushReplayState();
    expect(mockReplayStart).toHaveBeenCalledTimes(2);
  });

  it.each([
    '/onboarding',
    '/(tabs)/today',
    '/password-recovery-help',
    '/forgot-password-help',
  ])('preserves replay eligibility for %s', path => {
    const { shouldHoldAmplitudeReplayForPathname } = require('@/lib/amplitude');
    expect(shouldHoldAmplitudeReplayForPathname(path)).toBe(false);
  });

  it('does not initialise replay outside an enabled production profile', async () => {
    process.env.EXPO_PUBLIC_AMPLITUDE_REPLAY_ENABLED = 'false';

    jest.isolateModules(() => {
      const transport = require('@/lib/amplitude');
      transport.initializeAmplitude();
      transport.setAmplitudeSessionReplayHold('route', false);
    });

    await flushReplayState();
    expect(MockSessionReplayPlugin).not.toHaveBeenCalled();
    expect(mockReplayStart).not.toHaveBeenCalled();
  });

  it('initialises once with automatic sessions disabled', () => {
    jest.isolateModules(() => {
      const { initializeAmplitude } = require('@/lib/amplitude');
      initializeAmplitude();
      initializeAmplitude();
    });

    expect(mockAmplitudeInit).toHaveBeenCalledTimes(1);
    expect(mockAmplitudeInit).toHaveBeenCalledWith(
      'public-test-key',
      undefined,
      expect.objectContaining({
        autocapture: { sessions: false },
        trackingSessionEvents: false,
      })
    );
    expect(mockAmplitudeTrack).toHaveBeenCalledWith(
      'App Opened',
      expect.objectContaining({
        event_version: 3,
      })
    );
    expect(mockAmplitudeReset).not.toHaveBeenCalled();
    expect(mockAmplitudeSetUserId).toHaveBeenCalledWith(undefined);
    expect(mockAmplitudeSetUserId.mock.invocationCallOrder[0]).toBeLessThan(
      mockAmplitudeTrack.mock.invocationCallOrder[0]
    );
  });

  it('keeps analytics transport failures outside product behaviour', () => {
    mockAmplitudeTrack.mockImplementationOnce(() => {
      throw new Error('transport unavailable');
    });

    jest.isolateModules(() => {
      const { trackAmplitudeEvent } = require('@/lib/amplitude');
      expect(() =>
        trackAmplitudeEvent('Group Joined', { join_method: 'invite' })
      ).not.toThrow();
    });
  });

  it('identifies with the account id only and resets on sign-out', () => {
    jest.isolateModules(() => {
      const { setAmplitudeUserId } = require('@/lib/amplitude');
      setAmplitudeUserId('user-123');
      setAmplitudeUserId('user-123');
      setAmplitudeUserId(null);
    });

    expect(mockAmplitudeSetUserId).toHaveBeenCalledTimes(1);
    expect(mockAmplitudeSetUserId).toHaveBeenCalledWith('user-123');
    expect(mockAmplitudeReset).toHaveBeenCalledTimes(1);
  });
});
