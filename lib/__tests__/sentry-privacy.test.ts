import * as Sentry from '@sentry/react-native';

const {
  bootstrapSentry,
  getAdvancedDiagnosticsSampleRate,
  getReplayOnErrorSampleRate,
  getReplaySessionSampleRate,
  initSentry,
  logEvent,
  recordProductAnalyticsEvent,
  sanitizeSentryData,
  SENTRY_REPLAY_RELEASE_APPROVED,
  setAdvancedDiagnosticsCollectionEnabled,
  setRouteContext,
  setUser,
} = jest.requireActual<typeof import('@/lib/sentry')>('@/lib/sentry');

jest.mock('expo-application', () => ({
  applicationId: 'com.anekedigitalapps.lockedin',
  nativeApplicationVersion: '2.0.0',
  nativeBuildVersion: '200',
}));

jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
  expoConfig: {
    version: '2.0.0',
    extra: { sentryDsn: 'https://public@example.ingest.sentry.io/1' },
  },
}));

jest.mock('@/lib/advanced-diagnostics-preference', () => ({
  getAdvancedDiagnosticsEnabled: jest.fn(async () => false),
}));

const { getAdvancedDiagnosticsEnabled } =
  require('@/lib/advanced-diagnostics-preference') as {
    getAdvancedDiagnosticsEnabled: jest.Mock<Promise<boolean>, []>;
  };

const sentryMock = Sentry as typeof Sentry & {
  init: jest.Mock;
  setUser: jest.Mock;
  setContext: jest.Mock;
  setTag: jest.Mock;
  addBreadcrumb: jest.Mock;
  mobileReplayIntegration: jest.Mock;
};

describe('Sentry privacy boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_SENTRY_REPLAY_ENABLED = 'false';
    setAdvancedDiagnosticsCollectionEnabled(false);
    getAdvancedDiagnosticsEnabled.mockResolvedValue(false);
  });

  it('initialises native diagnostics with PII off and Sentry replay hard off', () => {
    process.env.EXPO_PUBLIC_SENTRY_REPLAY_ENABLED = 'true';
    initSentry();

    expect(SENTRY_REPLAY_RELEASE_APPROVED).toBe(false);
    expect(sentryMock.init).toHaveBeenCalledTimes(1);
    const options = sentryMock.init.mock.calls[0][0];
    expect(options).toMatchObject({
      sendDefaultPii: false,
      attachScreenshot: false,
      attachViewHierarchy: false,
      enableCaptureFailedRequests: false,
      enableNativeCrashHandling: true,
      enableWatchdogTerminationTracking: true,
      enableTombstone: true,
      enableAutoSessionTracking: true,
      enableLogs: true,
      logsOrigin: 'js',
      enableAutoConsoleLogs: false,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
    expect(options.integrations).toEqual([]);
    expect(sentryMock.mobileReplayIntegration).not.toHaveBeenCalled();
    expect(options).not.toHaveProperty('tracesSampleRate');
    expect(options.tracesSampler()).toBe(0);
    expect(sentryMock.logger.info).toHaveBeenCalledWith(
      'menta_diagnostics_started',
      expect.objectContaining({
        app_build: '200',
        app_version: '2.0.0',
        environment: expect.any(String),
        platform: expect.any(String),
      })
    );

    const safeLog = options.beforeSendLog({
      level: 'info',
      message: 'Invite for person@example.com',
      attributes: {
        inviteToken: 'invite-secret',
        proofCaption: 'Private proof content',
        endpoint: 'https://menta.quest/path?token=secret',
      },
    });
    expect(safeLog).toEqual({
      level: 'info',
      message: 'Invite for [redacted-email]',
      attributes: {
        inviteToken: '[Filtered]',
        proofCaption: '[Filtered]',
        endpoint: 'https://menta.quest/path',
      },
    });

    const runtime = globalThis as typeof globalThis & { __DEV__: boolean };
    const originalDevFlag = runtime.__DEV__;
    runtime.__DEV__ = false;
    try {
      setAdvancedDiagnosticsCollectionEnabled(true);
      expect(options.tracesSampler()).toBe(0.1);

      setAdvancedDiagnosticsCollectionEnabled(false);
      expect(options.tracesSampler()).toBe(0);
    } finally {
      runtime.__DEV__ = originalDevFlag;
      setAdvancedDiagnosticsCollectionEnabled(false);
    }

    const event = options.beforeSend(
      {
        message:
          'Failed for person@example.com at https://menta.quest/path?token=secret',
        user: {
          id: 'account-123',
          email: 'person@example.com',
          username: 'daniel',
          geo: { city: 'Hamilton' },
        },
        tags: { surface: 'today' },
        extra: {
          inviteToken: 'invite-secret',
          promiseText: 'Private promise content',
          nested: { authorization: 'Bearer transport-secret' },
        },
        request: {
          method: 'POST',
          url: 'https://menta.quest/path/123e4567-e89b-42d3-a456-426614174000?token=secret',
          headers: { authorization: 'Bearer transport-secret' },
          data: { proofCaption: 'Private proof content' },
        },
      },
      {}
    );

    expect(event.user).toBeUndefined();
    expect(event.tags).toEqual({ surface: 'today' });
    expect(event.request).toEqual({
      method: 'POST',
      url: 'https://menta.quest/path/[id]',
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain('person@example.com');
    expect(serialized).not.toContain('invite-secret');
    expect(serialized).not.toContain('Private promise content');
    expect(serialized).not.toContain('Private proof content');
    expect(serialized).not.toContain('transport-secret');
  });

  it('keeps Sentry replay off even when advanced diagnostics and the env flag are on', () => {
    expect(getAdvancedDiagnosticsSampleRate(false)).toBe(0);
    expect(getAdvancedDiagnosticsSampleRate(true)).toBe(0.1);
    expect(getReplaySessionSampleRate(false)).toBe(0);
    expect(getReplaySessionSampleRate(true)).toBe(0);
    expect(getReplayOnErrorSampleRate(false)).toBe(0);
    expect(getReplayOnErrorSampleRate(true)).toBe(0);

    process.env.EXPO_PUBLIC_SENTRY_REPLAY_ENABLED = 'true';
    expect(getReplaySessionSampleRate(true)).toBe(0);
    expect(getReplayOnErrorSampleRate(true)).toBe(0);

    setAdvancedDiagnosticsCollectionEnabled(false);
    expect(sentryMock.setTag).toHaveBeenLastCalledWith(
      'advanced_diagnostics',
      'disabled'
    );

    setAdvancedDiagnosticsCollectionEnabled(true);
    expect(sentryMock.setTag).toHaveBeenLastCalledWith(
      'advanced_diagnostics',
      'enabled'
    );
  });

  it('bootstrap loads the saved preference before treating consent as enabled', async () => {
    getAdvancedDiagnosticsEnabled.mockResolvedValueOnce(true);
    await bootstrapSentry();

    expect(getAdvancedDiagnosticsEnabled).toHaveBeenCalled();
    expect(sentryMock.setTag).toHaveBeenCalledWith(
      'advanced_diagnostics',
      'enabled'
    );
  });

  it('omits account identity from user scope', () => {
    setUser({ id: 'account-123' });

    expect(sentryMock.setUser).toHaveBeenCalledWith(null);
  });

  it('records unknown product outcomes as filtered information, not errors', () => {
    recordProductAnalyticsEvent('Product Operation', {
      area: 'group',
      operation: 'create_group',
      outcome: 'unknown',
      phase: 'reconciliation',
      user_id: 'account-123',
    });

    expect(sentryMock.addBreadcrumb).toHaveBeenCalledWith({
      category: 'product.lifecycle',
      level: 'info',
      message: 'Product Operation',
      data: expect.objectContaining({
        area: 'group',
        outcome: 'unknown',
        user_id: '[Filtered]',
      }),
    });
    expect(sentryMock.logger.info).toHaveBeenCalledWith(
      'product_operation_unknown',
      expect.objectContaining({ user_id: '[Filtered]' })
    );
    expect(sentryMock.logger.error).not.toHaveBeenCalledWith(
      'product_operation_unknown',
      expect.anything()
    );
  });

  it('redacts capability-bearing route context before creating a breadcrumb', () => {
    setRouteContext('event/check-in?capability=secret', {
      eventId: 'event-123',
      capabilityToken: 'secret-token',
      proofCaption: 'Private caption',
    });

    expect(sentryMock.setContext).toHaveBeenCalledWith('route', {
      path: 'event/check-in',
      eventId: '[Filtered]',
      capabilityToken: '[Filtered]',
      proofCaption: '[Filtered]',
    });
    expect(sentryMock.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          path: 'event/check-in',
          eventId: '[Filtered]',
          capabilityToken: '[Filtered]',
          proofCaption: '[Filtered]',
        },
      })
    );
  });

  it('templates resource identifiers in route paths', () => {
    setRouteContext('events/123e4567-e89b-42d3-a456-426614174000/proof/42');

    expect(sentryMock.setTag).toHaveBeenCalledWith(
      'route',
      'events/[id]/proof/[id]'
    );
  });

  it('sanitises nested values without mutating the input', () => {
    const input = {
      email: 'person@example.com',
      details: { url: 'https://menta.quest/proof?token=secret' },
    };

    expect(sanitizeSentryData(input)).toEqual({
      email: '[Filtered]',
      details: { url: 'https://menta.quest/proof' },
    });
    expect(input.email).toBe('person@example.com');
  });

  it('sanitises explicit structured logs before capture', () => {
    logEvent('warn', 'Retry for person@example.com', {
      sessionId: 'session-secret',
      route: 'events/summary',
    });

    expect(sentryMock.logger.warn).toHaveBeenCalledWith(
      'Retry for [redacted-email]',
      {
        sessionId: '[Filtered]',
        route: 'events/summary',
      }
    );
  });
});
