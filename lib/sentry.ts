import * as Sentry from '@sentry/react-native';
import type React from 'react';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { getAdvancedDiagnosticsEnabled } from '@/lib/advanced-diagnostics-preference';

type SentryRecord = Record<string, unknown>;
type SentryLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

let isInitialized = false;
let bootstrapPromise: Promise<void> | null = null;
let advancedDiagnosticsCollectionEnabled = false;
let currentRoutePath: string | null = null;
let currentRouteParams: SentryRecord | null = null;

export const getAdvancedDiagnosticsSampleRate = (enabled: boolean): number =>
  enabled ? 0.1 : 0;

/**
 * Session Replay has separate public-policy, App Store privacy, provider, and
 * device-validation gates. Consent alone must not activate it in a release.
 */
export const SENTRY_REPLAY_RELEASE_APPROVED = false;

export const isSentryReplayReleaseEnabled = (): boolean =>
  SENTRY_REPLAY_RELEASE_APPROVED &&
  process.env.EXPO_PUBLIC_SENTRY_REPLAY_ENABLED === 'true';

/** Full-session replay sampling for devices that opted into advanced diagnostics. */
export const getReplaySessionSampleRate = (
  enabled: boolean,
  releaseEnabled = isSentryReplayReleaseEnabled()
): number => (enabled && releaseEnabled ? 0.1 : 0);

/** Error-triggered replay sampling for opted-in devices. */
export const getReplayOnErrorSampleRate = (
  enabled: boolean,
  releaseEnabled = isSentryReplayReleaseEnabled()
): 0 | 1 => (enabled && releaseEnabled ? 1 : 0);

/**
 * Controls optional performance traces, sampled profiles, and masked Mobile
 * Session Replay. Crash reporting stays enabled independently of this
 * preference.
 *
 * Trace sampling applies immediately. Native session-replay sample rates are
 * read during Sentry init, so a mid-session change fully applies on the next
 * cold start after the preference is saved.
 */
export const setAdvancedDiagnosticsCollectionEnabled = (enabled: boolean) => {
  advancedDiagnosticsCollectionEnabled = enabled === true;
  Sentry.setTag?.(
    'advanced_diagnostics',
    advancedDiagnosticsCollectionEnabled ? 'enabled' : 'disabled'
  );
};

const buildMobileReplayIntegrations = (): unknown[] => {
  if (
    !isSentryReplayReleaseEnabled() ||
    (Platform.OS !== 'ios' && Platform.OS !== 'android')
  ) {
    return [];
  }

  return [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
      // Keep network bodies off unless a later review explicitly allow-lists
      // safe URLs. Default allow list is empty.
      networkDetailAllowUrls: [],
      networkDetailDenyUrls: [/.*/],
      networkCaptureBodies: false,
    }),
  ];
};

const sensitiveKeyPattern =
  /(^|[_-])(authorization|cookie|password|passcode|secret|token|access[_-]?token|refresh[_-]?token|identity[_-]?token|session([_-]?id)?|email|username|invite([_-]?(code|token))?|capability|share([_-]?(code|token))?|code[_-]?verifier|latitude|longitude|coordinates?|geo|location|address)($|[_-])/i;
const userContentKeyPattern =
  /(^|[_-])(promise|proof|caption|comment|note|body|content|user[_-]?text)($|[_-])/i;
const resourceIdentifierKeyPattern = /(^|[_-])([a-z0-9]+[_-])?ids?($|[_-])/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const jwtPattern =
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const urlPattern =
  /((?:https?|menta):\/\/[^\s?#)]+)(?:\?[^\s#)]*)?(?:#[^\s)]*)?/gi;

const isSensitiveKey = (key: string): boolean => {
  const normalized = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  return (
    sensitiveKeyPattern.test(normalized) ||
    userContentKeyPattern.test(normalized) ||
    resourceIdentifierKeyPattern.test(normalized)
  );
};

const sanitizeString = (value: string): string =>
  value
    .replace(emailPattern, '[redacted-email]')
    .replace(bearerPattern, 'Bearer [redacted]')
    .replace(jwtPattern, '[redacted-token]')
    .replace(urlPattern, '$1')
    .slice(0, 8192);

const sanitizeValue = (
  value: unknown,
  key?: string,
  depth = 0,
  seen = new WeakSet<object>()
): unknown => {
  if (key && isSensitiveKey(key)) {
    return '[Filtered]';
  }

  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: sanitizeString(value.name),
      message: sanitizeString(value.message),
      stack: value.stack ? sanitizeString(value.stack) : undefined,
    };
  }
  if (depth >= 5) return '[Truncated]';

  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map(item => sanitizeValue(item, undefined, depth + 1, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const result: SentryRecord = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      result[entryKey] = sanitizeValue(entryValue, entryKey, depth + 1, seen);
    }
    return result;
  }

  return sanitizeString(String(value));
};

/**
 * Redact identifiers, credentials and user-authored content before it reaches
 * Sentry. Exported so the privacy boundary can be protected with behavioural
 * tests and reused by explicit diagnostic call sites.
 */
export const sanitizeSentryData = <T>(value: T): T => sanitizeValue(value) as T;

const uuidSegment =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const opaqueSegment = /^[A-Za-z0-9_-]{20,}$/;

const sanitizeRoutePath = (path: string): string => {
  const clean = sanitizeString(path).split(/[?#]/, 1)[0] || '(unknown)';
  return clean
    .split('/')
    .map(segment =>
      uuidSegment.test(segment) ||
      /^\d+$/.test(segment) ||
      opaqueSegment.test(segment)
        ? '[id]'
        : segment
    )
    .join('/');
};

const sanitizeTelemetryUrl = (value: string): string => {
  const clean = sanitizeString(value);
  try {
    const parsed = new URL(clean);
    return `${parsed.protocol}//${parsed.host}${sanitizeRoutePath(parsed.pathname)}`;
  } catch {
    return sanitizeRoutePath(clean);
  }
};

const getSafeUpdateChannel = ():
  | 'production'
  | 'development'
  | 'preview'
  | 'unknown' => {
  const channel = String(Updates.channel ?? '').toLowerCase();
  if (channel === 'production') return 'production';
  if (channel === 'development') return 'development';
  if (channel === 'preview') return 'preview';
  return 'unknown';
};

const sanitizeSentryEvent = (event: SentryRecord): SentryRecord => {
  const sanitized = sanitizeSentryData(event);
  sanitized.user = undefined;

  if (sanitized.request && typeof sanitized.request === 'object') {
    const request = sanitized.request as SentryRecord;
    sanitized.request = {
      method: request.method,
      url:
        typeof request.url === 'string'
          ? sanitizeTelemetryUrl(request.url)
          : undefined,
    };
  }

  return sanitized;
};

const normalizeError = (
  input: unknown
): {
  error: Error;
  extras?: SentryRecord;
  tags?: Record<string, string>;
  fingerprint?: string[];
  wasObject: boolean;
} => {
  try {
    if (input instanceof Error) {
      const error = new Error(sanitizeString(input.message));
      error.name = sanitizeString(input.name || 'Error');
      if (input.stack) error.stack = sanitizeString(input.stack);
      return { error, wasObject: false };
    }

    if (typeof input === 'string') {
      return { error: new Error(sanitizeString(input)), wasObject: false };
    }

    if (input && typeof input === 'object') {
      const source = input as SentryRecord;
      const rawMessage =
        typeof source.message === 'string'
          ? source.message
          : 'Non-Error exception captured';
      const error = new Error(sanitizeString(rawMessage));
      if (typeof source.name === 'string') {
        error.name = sanitizeString(source.name);
      }
      if (typeof source.stack === 'string') {
        error.stack = sanitizeString(source.stack);
      }

      const code =
        typeof source.code === 'string' || typeof source.code === 'number'
          ? String(source.code)
          : undefined;
      const status =
        typeof source.status === 'number' ? String(source.status) : undefined;
      const hasSupabaseShape =
        Object.prototype.hasOwnProperty.call(source, 'code') &&
        Object.prototype.hasOwnProperty.call(source, 'details') &&
        Object.prototype.hasOwnProperty.call(source, 'hint');

      if (hasSupabaseShape) {
        error.name =
          error.name === 'Error' ? 'SupabasePostgrestError' : error.name;
        return {
          error,
          extras: code ? { errorCode: code } : undefined,
          tags: {
            supabase: 'true',
            supabase_error_code: code ?? 'unknown',
          },
          fingerprint: ['supabase', code ?? 'unknown', 'object-error'],
          wasObject: true,
        };
      }

      if (status) {
        error.name = error.name === 'Error' ? 'HttpLikeError' : error.name;
        return {
          error,
          extras: { httpStatus: status },
          tags: { http_status: status },
          fingerprint: ['http', status, 'object-error'],
          wasObject: true,
        };
      }

      return { error, wasObject: true };
    }

    return {
      error: new Error(
        sanitizeString(`Non-Error exception captured: ${String(input)}`)
      ),
      wasObject: true,
    };
  } catch {
    return { error: new Error('Failed to normalize error'), wasObject: true };
  }
};

const shouldDropEvent = (event: SentryRecord): boolean => {
  const message = String(event.message || '');
  const level = String(event.level || 'info');

  if (
    message === 'setUser' ||
    message === 'setRouteContext' ||
    message === 'Sentry.withScope$argument_0'
  ) {
    return true;
  }

  if (message === 'slow_supabase_request') {
    return !__DEV__ && Math.random() >= 0.02;
  }

  if (message !== 'supabase_request_error') return false;
  const tags = event.tags as SentryRecord | undefined;
  const extra = event.extra as SentryRecord | undefined;
  const statusValue = tags?.http_status ?? extra?.status;
  const status = statusValue === undefined ? NaN : Number(statusValue);

  if (level === 'error') return false;
  if (status === 401 || status === 403 || status === 404) return true;

  let sampleRate = 0.05;
  if (!Number.isNaN(status) && status >= 500) sampleRate = 1;
  return !__DEV__ && Math.random() >= sampleRate;
};

const prepareEvent = (event: SentryRecord, hint?: SentryRecord) => {
  try {
    if (currentRoutePath) {
      event.tags = { ...(event.tags as SentryRecord), route: currentRoutePath };
    }
    if (currentRouteParams && Object.keys(currentRouteParams).length > 0) {
      event.extra = {
        ...(event.extra as SentryRecord),
        routeParams: currentRouteParams,
      };
    }

    const original = hint?.originalException;
    if (
      original &&
      typeof original === 'object' &&
      !(original instanceof Error)
    ) {
      const source = original as SentryRecord;
      const hasSupabaseShape =
        Object.prototype.hasOwnProperty.call(source, 'code') &&
        Object.prototype.hasOwnProperty.call(source, 'details') &&
        Object.prototype.hasOwnProperty.call(source, 'hint');
      if (hasSupabaseShape) {
        const code = String(source.code ?? 'unknown');
        event.tags = {
          ...(event.tags as SentryRecord),
          supabase: 'true',
          supabase_error_code: code,
        };
        event.extra = {
          ...(event.extra as SentryRecord),
          normalized_from_object: true,
          errorCode: code,
        };
        event.fingerprint = ['supabase', code, 'object-error'];
      } else {
        event.tags = {
          ...(event.tags as SentryRecord),
          normalized_from_object: 'true',
        };
      }
    }
  } catch {}

  if (shouldDropEvent(event)) return null;

  const firstException = (
    event.exception as { values?: { type?: string; value?: string }[] }
  )?.values?.[0];
  if (!event.message && firstException) {
    event.message = firstException.value || firstException.type || 'Error';
  }

  return sanitizeSentryEvent(event);
};

export const initSentry = () => {
  if (isInitialized) return;

  try {
    if (
      __DEV__ &&
      (Constants as { appOwnership?: string }).appOwnership === 'expo'
    ) {
      isInitialized = true;
      return;
    }
  } catch {}

  const extra = (Constants.expoConfig?.extra as SentryRecord | undefined) ?? {};
  const dsn =
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    (typeof extra.sentryDsn === 'string' ? extra.sentryDsn : '');

  if (!dsn) {
    if (__DEV__) {
      console.warn(
        '[Sentry] DSN missing – diagnostics disabled. Set EXPO_PUBLIC_SENTRY_DSN before building.'
      );
    }
    isInitialized = true;
    return;
  }

  try {
    const applicationId = Application.applicationId ?? 'menta';
    const version =
      Application.nativeApplicationVersion ??
      Constants.expoConfig?.version ??
      'unknown';
    const build = Application.nativeBuildVersion ?? 'unknown';
    const environment = __DEV__
      ? 'development'
      : process.env.EXPO_PUBLIC_APP_ENV || 'production';
    const updateSource = Updates.isEmbeddedLaunch ? 'embedded' : 'ota';
    const runtimeVersion = String(Updates.runtimeVersion ?? 'unknown');
    const updateChannel = getSafeUpdateChannel();

    Sentry.init({
      dsn,
      debug: false,
      enabled: !__DEV__,
      environment,
      release: `${applicationId}@${version}+${build}`,
      dist: String(build),
      enableNative: true,
      enableNativeCrashHandling: true,
      enableWatchdogTerminationTracking: true,
      enableTombstone: true,
      sendDefaultPii: false,
      attachScreenshot: false,
      attachViewHierarchy: false,
      enableCaptureFailedRequests: false,
      // Sentry Logs is opt-in. Keep automatic console and native-log capture
      // disabled so only explicit, privacy-scrubbed application logs leave the
      // device.
      enableLogs: true,
      logsOrigin: 'js',
      enableAutoConsoleLogs: false,
      tracesSampler: () =>
        __DEV__
          ? 0
          : getAdvancedDiagnosticsSampleRate(
              advancedDiagnosticsCollectionEnabled
            ),
      // Profiles can only attach to a sampled transaction. The trace sampler
      // above therefore keeps both traces and profiles off until explicit
      // device-local consent is loaded.
      profilesSampleRate: __DEV__ ? 0 : 0.1,
      // Mobile Session Replay stays off until advanced diagnostics consent is
      // loaded into memory before init (see bootstrapSentry).
      replaysSessionSampleRate:
        __DEV__ || !isSentryReplayReleaseEnabled()
          ? 0
          : getReplaySessionSampleRate(advancedDiagnosticsCollectionEnabled),
      replaysOnErrorSampleRate:
        __DEV__ || !isSentryReplayReleaseEnabled()
          ? 0
          : getReplayOnErrorSampleRate(advancedDiagnosticsCollectionEnabled),
      integrations: buildMobileReplayIntegrations(),
      enableAutoSessionTracking: true,
      maxBreadcrumbs: 50,
      normalizeDepth: 5,
      tracePropagationTargets: [
        /supabase\.(co|in)/,
        /supabase\.com/,
        /\.supabase\./,
      ],
      beforeSend: (event: SentryRecord, hint: SentryRecord) =>
        prepareEvent(event, hint),
      beforeSendTransaction: (event: SentryRecord) =>
        sanitizeSentryEvent(event),
      beforeSendLog: (log: SentryRecord) => sanitizeSentryData(log),
      beforeBreadcrumb: (breadcrumb: SentryRecord) => {
        if (!__DEV__ && breadcrumb.category === 'console') return null;
        return sanitizeSentryData(breadcrumb);
      },
    } as never);

    Sentry.setTag?.('platform', Platform.OS);
    Sentry.setTag?.('buildType', environment);
    Sentry.setTag?.('app.version', String(version));
    Sentry.setTag?.('app.build', String(build));
    Sentry.setTag?.('runtime.version', runtimeVersion);
    Sentry.setTag?.('update.source', updateSource);
    Sentry.setTag?.('update.channel', updateChannel);
    Sentry.setTag?.(
      'advanced_diagnostics',
      advancedDiagnosticsCollectionEnabled ? 'enabled' : 'disabled'
    );
    Sentry.logger.info('menta_diagnostics_started', {
      platform: Platform.OS,
      environment,
      app_version: String(version),
      app_build: String(build),
      runtime_version: runtimeVersion,
      update_source: updateSource,
      update_channel: updateChannel,
    });
    isInitialized = true;
  } catch (error) {
    console.warn('[Sentry] Initialization failed:', error);
    isInitialized = true;
  }
};

/**
 * Load the device-local advanced-diagnostics preference, then start Sentry.
 * Crash reporting still starts as early as AsyncStorage allows. Replay sample
 * rates are fixed in the native layer at init, so this order is required for
 * returning opted-in devices to record masked sessions.
 */
export const bootstrapSentry = (): Promise<void> => {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const enabled = await getAdvancedDiagnosticsEnabled();
      setAdvancedDiagnosticsCollectionEnabled(enabled);
    } catch {
      setAdvancedDiagnosticsCollectionEnabled(false);
    }
    initSentry();
  })();

  return bootstrapPromise;
};

export const captureError = (error: unknown, extras?: SentryRecord) => {
  try {
    if (!isInitialized) initSentry();
    Sentry.withScope(scope => {
      if (currentRoutePath) scope.setTag('route', currentRoutePath);
      if (currentRouteParams) {
        scope.setContext('route', {
          path: currentRoutePath,
          ...currentRouteParams,
        });
      }

      const normalized = normalizeError(error);
      const safeExtras = sanitizeSentryData(extras ?? {});
      for (const [key, value] of Object.entries(safeExtras)) {
        scope.setExtra(key, value);
      }
      for (const [key, value] of Object.entries(normalized.extras ?? {})) {
        scope.setExtra(key, value);
      }
      for (const [key, value] of Object.entries(normalized.tags ?? {})) {
        scope.setTag(key, value);
      }
      if (normalized.fingerprint?.length) {
        scope.setFingerprint?.(normalized.fingerprint);
      }
      if (normalized.wasObject) {
        scope.setTag('normalized_from_object', 'true');
      }
      Sentry.captureException(normalized.error);
    });
  } catch {}
};

export const logError = captureError;

export const logCrash = (
  error: unknown,
  details?: {
    isFatal?: boolean;
    type?: string;
    context?: string;
    userAction?: string;
    screenName?: string;
    additionalContext?: SentryRecord;
  }
) => {
  captureError(error, {
    isFatal: details?.isFatal ?? false,
    crashType: details?.type ?? 'unknown',
    context: details?.context ?? 'unknown',
    userAction: details?.userAction,
    screenName: details?.screenName,
    ...(details?.additionalContext ?? {}),
  });
};

/** Keep a small, non-identifying lifecycle snapshot with Sentry diagnostics. */
export const setRuntimeContext = (context: SentryRecord) => {
  try {
    Sentry.setContext?.('runtime', sanitizeSentryData(context));
  } catch {}
};

export const addBreadcrumb = (message: string, data?: SentryRecord) => {
  try {
    Sentry.addBreadcrumb({
      message: sanitizeString(message),
      data: sanitizeSentryData(data ?? {}),
      level: 'info',
      category: 'app',
    });
  } catch {}
};

/**
 * Send an explicit structured application log through the same privacy
 * boundary as errors and breadcrumbs. Keep messages stable and put searchable
 * values in attributes; never pass customer-authored content.
 */
export const logEvent = (
  level: SentryLogLevel,
  message: string,
  attributes?: SentryRecord
) => {
  try {
    if (!isInitialized) initSentry();
    Sentry.logger[level](
      sanitizeString(message),
      sanitizeSentryData(attributes ?? {})
    );
  } catch {}
};

/**
 * Mirror governed, low-cardinality product events into Sentry breadcrumbs so a
 * diagnostic timeline can explain the last consequential action without
 * receiving customer content or identifiers. Unknown results are information
 * that requires reconciliation; they are never promoted to error events.
 */
export const recordProductAnalyticsEvent = (
  event: string,
  properties?: unknown
) => {
  try {
    if (!isInitialized) initSentry();
    const safeEvent = sanitizeString(event);
    const safeProperties = sanitizeSentryData(
      properties && typeof properties === 'object' ? properties : {}
    ) as SentryRecord;
    const outcome =
      typeof safeProperties.outcome === 'string'
        ? safeProperties.outcome
        : undefined;

    Sentry.addBreadcrumb({
      category: 'product.lifecycle',
      level: outcome === 'failed' ? 'warning' : 'info',
      message: safeEvent,
      data: safeProperties,
    });

    if (event === 'Product Operation') {
      const area = String(safeProperties.area ?? 'unknown');
      const operation = String(safeProperties.operation ?? 'unknown');
      Sentry.setTag?.('product.area', area);
      Sentry.setTag?.('product.operation', operation);
      Sentry.setContext?.('last_product_operation', safeProperties);
    }

    if (outcome === 'failed') {
      Sentry.logger.warn('product_operation_failed', safeProperties);
    } else if (outcome === 'unknown') {
      Sentry.logger.info('product_operation_unknown', safeProperties);
    } else if (outcome === 'recovered' || outcome === 'safe_to_retry') {
      Sentry.logger.info('product_operation_recovered', safeProperties);
    }
  } catch {}
};

export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info',
  options?: { extras?: SentryRecord; tags?: Record<string, string> }
) => {
  try {
    if (!isInitialized) initSentry();
    Sentry.withScope(scope => {
      for (const [key, value] of Object.entries(
        sanitizeSentryData(options?.extras ?? {})
      )) {
        scope.setExtra(key, value);
      }
      for (const [key, value] of Object.entries(
        sanitizeSentryData(options?.tags ?? {})
      )) {
        scope.setTag(key, String(value));
      }
      Sentry.captureMessage(sanitizeString(message), level);
    });
  } catch {}
};

export const setRouteContext = (path: string, params?: SentryRecord) => {
  try {
    currentRoutePath = sanitizeRoutePath(path || '(unknown)');
    currentRouteParams = params ? sanitizeSentryData(params) : null;
    Sentry.setTag?.('route', currentRoutePath);
    Sentry.setContext?.('route', {
      path: currentRoutePath,
      ...(currentRouteParams ?? {}),
    });
    Sentry.addBreadcrumb?.({
      category: 'navigation',
      level: 'info',
      message: 'Navigated',
      data: { path: currentRoutePath, ...(currentRouteParams ?? {}) },
    });
  } catch {}
};

export const setUser = (_user: { id: string }) => {
  try {
    Sentry.setUser(null);
  } catch {}
};

export const clearUser = () => {
  try {
    Sentry.setUser(null);
  } catch {}
};

export const isSentryReady = () => isInitialized;

export const wrap = <P extends Record<string, unknown>>(
  RootComponent: React.ComponentType<P>
) => Sentry.wrap(RootComponent) as React.ComponentType<P>;

export default { logError };
