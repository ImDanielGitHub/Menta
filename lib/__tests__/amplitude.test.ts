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
    expect(shouldHoldAmplitudeReplayForPathname('/events/event-1/proof')).toBe(
      true
    );
    expect(shouldHoldAmplitudeReplayForPathname('/shop/item-1')).toBe(true);
    expect(shouldHoldAmplitudeReplayForPathname('/onboarding')).toBe(false);
    expect(shouldHoldAmplitudeReplayForPathname('/(tabs)/today')).toBe(false);
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
