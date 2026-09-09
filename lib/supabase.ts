/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy Sentry and ungenerated schema adapters remain outside this security patch. */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  type SupabaseClient,
  User as SupabaseUser,
} from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import type { Database } from './database.types';
import { getExpoExtraString, isE2EMode } from './e2e';
import { PASSWORD_RECOVERY_AUTH_STORAGE_KEY } from '@/lib/auth/password-recovery-config';

const e2eMode = isE2EMode();
const defaultSupabaseUrl = getExpoExtraString('supabaseUrl');
const defaultSupabaseAnonKey = getExpoExtraString('supabaseAnonKey');
const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Outside E2E we keep the existing precedence: app config first, env as fallback.
// In E2E we do the opposite so the build can point at an isolated Supabase project.
const resolvedSupabaseUrl = e2eMode
  ? envSupabaseUrl || defaultSupabaseUrl
  : defaultSupabaseUrl || envSupabaseUrl;
const supabaseAnonKey = e2eMode
  ? envSupabaseAnonKey || defaultSupabaseAnonKey
  : defaultSupabaseAnonKey || envSupabaseAnonKey;

if (e2eMode) {
  if (!envSupabaseUrl || !envSupabaseAnonKey) {
    throw new Error(
      'E2E mode requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to be set.'
    );
  }

  if (defaultSupabaseUrl && envSupabaseUrl === defaultSupabaseUrl) {
    throw new Error(
      'E2E mode must point at a dedicated Supabase project instead of the default app config URL.'
    );
  }
}

if (!resolvedSupabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const SUPABASE_URL: string = resolvedSupabaseUrl;

/**
 * Create an instrumented fetch that wraps requests in a Sentry span and adds breadcrumbs.
 * Only requests to the provided base URL are instrumented as "supabase" calls.
 */
function createInstrumentedFetch(baseUrl: string) {
  // Resolve fetch lazily at call-time to avoid early-evaluation issues on native
  const getFetch = (): typeof fetch => {
    const f = (globalThis as any)?.fetch;
    if (typeof f === 'function') {
      try {
        return f.bind(globalThis) as typeof fetch;
      } catch {
        return f as typeof fetch;
      }
    }
    throw new Error('Fetch API is not available in this environment');
  };

  return async (input: any, init?: RequestInit) => {
    const start = Date.now();

    // Resolve URL and method for logging/attributes
    const url: string = (() => {
      if (typeof input === 'string') return input;
      try {
        if (typeof URL !== 'undefined' && input instanceof URL)
          return input.toString();
      } catch {}
      try {
        if (input && typeof input.url === 'string') return input.url;
      } catch {}
      return String(input);
    })();

    const method = String(
      (init as any)?.method || (input as any)?.method || 'GET'
    ).toUpperCase();
    const isSupabaseCall = typeof url === 'string' && url.startsWith(baseUrl);
    const path = isSupabaseCall ? url.slice(baseUrl.length) || '/' : url;

    // Extract host/service/resource/operation for labeling
    let host = '';
    try {
      const u = new URL(url);
      host = u.host;
    } catch {}

    const cleanPath = (path || '').split('?')[0];
    const segments = cleanPath.split('/').filter(Boolean);
    let service: string = 'external';
    if (segments[0] === 'rest' && segments[1] === 'v1') service = 'rest';
    else if (segments[0] === 'auth' && segments[1] === 'v1') service = 'auth';
    else if (segments[0] === 'storage' && segments[1] === 'v1')
      service = 'storage';
    else if (segments[0] === 'functions' && segments[1] === 'v1')
      service = 'functions';
    else if (segments[0] === 'graphql' && segments[1] === 'v1')
      service = 'graphql';

    let resource: string | undefined;
    let operation: string | undefined;

    if (service === 'rest') {
      if (segments[2] === 'rpc') {
        operation = 'rpc';
        resource = segments[3] || 'unknown';
      } else {
        resource = segments[2] || 'unknown';
        // Heuristic mapping for PostgREST
        if (method === 'GET' || method === 'HEAD') operation = 'select';
        else if (method === 'POST') operation = 'insert';
        else if (method === 'PATCH') operation = 'update';
        else if (method === 'DELETE') operation = 'delete';
      }
    } else if (service === 'storage') {
      // /storage/v1/object/<bucket>/path or /storage/v1/object/sign/<bucket>/path
      const afterObjectIdx = segments.indexOf('object') + 1;
      if (segments.includes('sign')) operation = 'sign';
      else if (method === 'POST') operation = 'upload';
      else if (method === 'DELETE') operation = 'remove';
      else if (method === 'GET') operation = 'download';
      resource = segments[afterObjectIdx] || 'object'; // bucket name if present
    } else if (service === 'auth') {
      operation = `${method.toLowerCase()}_${segments.slice(2).join('_') || 'auth'}`;
      resource = segments[2] || 'auth';
    } else if (service === 'functions') {
      operation = 'invoke';
      resource = segments[2] === 'v1' ? segments[3] : segments[2];
    } else if (service === 'graphql') {
      operation = 'query';
      resource = 'graphql';
    }

    const requestType = isSupabaseCall
      ? `supabase:${service}:${operation || method.toLowerCase()}:${resource || 'unknown'}`
      : `external:${method.toLowerCase()}`;
    const telemetryTarget = isSupabaseCall
      ? `/${service}/${operation || method.toLowerCase()}/${resource || 'unknown'}`
      : '/external';

    const spanContext = {
      name: isSupabaseCall
        ? `supabase ${service} ${operation || method.toLowerCase()} ${resource || 'unknown'}`
        : `fetch ${method} ${host || 'external'}`,
      op: 'http.client',
      attributes: {
        'http.method': method,
        'net.peer.name': isSupabaseCall ? 'supabase' : 'external',
        'server.address': host,
        'http.target': telemetryTarget,
        'supabase.service': service,
        'supabase.resource': resource || '',
        'supabase.operation': operation || '',
        'supabase.request_type': requestType,
        ...(service === 'rest'
          ? ({
              'db.system': 'postgres',
              'db.operation': operation || '',
            } as any)
          : ({} as any)),
      } as Record<string, string | number | boolean>,
    } as any;

    // Prefer startSpan when available; fall back to manual timing + breadcrumb.
    const run = async () => {
      const activeFetch = getFetch();
      const response = await activeFetch(input, init as any);
      const durationMs = Date.now() - start;
      try {
        Sentry.addBreadcrumb?.({
          category: 'http',
          level: durationMs > 1000 ? ('warning' as any) : ('info' as any),
          message: isSupabaseCall ? 'Supabase request' : 'Network request',
          data: {
            method,
            status: (response as any)?.status,
            duration_ms: durationMs,
            target: telemetryTarget,
            service,
            resource,
            operation,
            request_type: requestType,
          },
        });
        // Emit a lightweight performance event for very slow calls (downsampled)
        if (isSupabaseCall && durationMs > 2000) {
          const slowSampleRate = __DEV__ ? 1.0 : 0.05; // keep 5% in prod
          if (Math.random() < slowSampleRate) {
            Sentry.withScope?.((scope: any) => {
              scope.setTag?.('supabase', 'true');
              scope.setTag?.('supabase.service', service);
              scope.setTag?.('supabase.resource', String(resource || ''));
              scope.setTag?.('supabase.operation', String(operation || ''));
              scope.setExtra?.('duration_ms', durationMs);
              scope.setExtra?.('method', method);
              scope.setExtra?.('target', telemetryTarget);
              scope.setFingerprint?.([
                'supabase',
                'slow_request',
                service,
                String(resource || ''),
                String(operation || ''),
              ]);
              Sentry.captureMessage?.('slow_supabase_request', {
                level: 'info' as any,
              } as any);
            });
          }
        }
        // Detect cases where Supabase unexpectedly returns HTML instead of JSON (common root cause of JSON parse errors)
        try {
          if (isSupabaseCall) {
            const contentType = String(
              (response as any)?.headers?.get?.('content-type') || ''
            ).toLowerCase();
            if (contentType.includes('text/html')) {
              Sentry.withScope?.((scope: any) => {
                scope.setTag?.('supabase', 'true');
                scope.setTag?.('supabase.service', service);
                scope.setTag?.('supabase.operation', String(operation || ''));
                scope.setTag?.(
                  'http_status',
                  String((response as any)?.status ?? '')
                );
                scope.setExtra?.('target', telemetryTarget);
                scope.setExtra?.(
                  'note',
                  'Received HTML from Supabase endpoint; clients may hit JSON parse error'
                );
                Sentry.captureMessage?.('supabase_html_response', {
                  level: 'warning' as any,
                } as any);
              });
            }
          }
        } catch {}

        // Flag non-2xx responses for visibility (sampled and enriched)
        if (isSupabaseCall && !(response as any)?.ok) {
          const status = Number((response as any)?.status ?? 0);
          let sampleRate = 0.05; // default
          if (status >= 500)
            sampleRate = 1.0; // keep all server errors
          else if (status === 404)
            sampleRate = 0.0; // drop not founds
          else if (status === 401 || status === 403)
            sampleRate = 0.01; // rare sample auth
          else if (status === 429) sampleRate = 0.05; // light sample rate limits
          if (__DEV__ || Math.random() < sampleRate) {
            Sentry.withScope?.((scope: any) => {
              scope.setTag?.('supabase', 'true');
              scope.setTag?.('supabase.service', service);
              scope.setTag?.('supabase.resource', String(resource || ''));
              scope.setTag?.('supabase.operation', String(operation || ''));
              if (!Number.isNaN(status))
                scope.setTag?.('http_status', String(status));
              scope.setExtra?.('duration_ms', durationMs);
              scope.setExtra?.('method', method);
              scope.setExtra?.('target', telemetryTarget);
              scope.setFingerprint?.([
                'supabase',
                'request_error',
                String(status || 'unknown'),
                service,
                String(operation || ''),
                String(resource || 'unknown'),
              ]);
              Sentry.captureMessage?.('supabase_request_error', {
                level: 'warning' as any,
              } as any);
            });
          }
        }
      } catch {}
      return response as Response;
    };

    // Prefer modern startSpan API when available
    const startSpan = (Sentry as any)?.startSpan as
      | ((
          ctx: any,
          cb: (span: any, finish?: () => void) => Promise<Response>
        ) => Promise<Response>)
      | undefined;
    if (typeof startSpan === 'function') {
      return startSpan(spanContext, async (span: any) => {
        const response = await run();
        try {
          const status = (response as any)?.status;
          span?.setAttribute?.('http.response.status_code', status);
          span?.setAttribute?.('supabase.request_type', requestType);
          if (typeof status === 'number') {
            span?.setStatus?.(status >= 400 ? 'error' : 'ok');
          }
        } catch {}
        return response;
      });
    }

    // Fallback for environments exposing only startSpanManual
    const startSpanManual = (Sentry as any)?.startSpanManual as
      | ((
          ctx: any,
          cb: (span: any, finish: () => void) => Promise<Response>
        ) => Promise<Response>)
      | undefined;
    if (typeof startSpanManual === 'function') {
      return startSpanManual(
        spanContext,
        async (span: any, finish: () => void) => {
          try {
            const response = await run();
            try {
              const status = (response as any)?.status;
              span?.setAttribute?.('http.response.status_code', status);
              span?.setAttribute?.('supabase.request_type', requestType);
              if (typeof status === 'number') {
                span?.setStatus?.(status >= 400 ? 'error' : 'ok');
              }
            } catch {}
            return response;
          } finally {
            try {
              finish?.();
            } catch {}
          }
        }
      );
    }

    // Fallback: no span API; just run and breadcrumb
    return run();
  };
}

export type TypedSupabaseClient = SupabaseClient<Database>;

// Existing stores still contain legacy domain models that do not yet match the
// generated schema exactly. Keep their runtime boundary stable while new and
// migrated data access can opt into TypedSupabaseClient.
export const supabase = createClient<any>(SUPABASE_URL, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
  // Instrument all Supabase network calls with Sentry spans for performance tracing
  global: {
    fetch: createInstrumentedFetch(SUPABASE_URL),
  },
});

/**
 * Email signup confirmation exchanges through a listener-free client that
 * shares the ordinary PKCE verifier and session storage. This lets the
 * callback validate the confirmed email/account before the main auth store is
 * updated, while a valid session remains available after a process restart.
 */
let emailConfirmationSupabase: SupabaseClient<any> | null = null;

export const getEmailConfirmationSupabase = (): SupabaseClient<any> => {
  if (!emailConfirmationSupabase) {
    emailConfirmationSupabase = createClient<any>(
      SUPABASE_URL,
      supabaseAnonKey,
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: false,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
        global: {
          fetch: createInstrumentedFetch(SUPABASE_URL),
        },
      }
    );
  }
  return emailConfirmationSupabase;
};

/**
 * Password recovery uses an isolated PKCE verifier and session. A recovery
 * exchange must never populate the ordinary app client's persisted session or
 * emit authentication events into the main auth store.
 */
export const passwordRecoverySupabase = createClient<any>(
  SUPABASE_URL,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      storageKey: PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      fetch: createInstrumentedFetch(SUPABASE_URL),
    },
  }
);

// Note: AppState listener moved to app initialization to avoid conflicts
// with other native event emitters

// Storage bucket constants
export const STORAGE_BUCKETS = {
  CHALLENGE_VERIFICATIONS: 'challenge-verifications',
  CHALLENGES_IMAGES: 'challenges-images',
  PROFILE_PICTURES: 'profile-pictures',
  GROUP_IMAGES: 'group-images',
} as const;

type StorageBucket = keyof typeof STORAGE_BUCKETS;

// Helper functions for storage operations
export const supabaseHelper = {
  uploadMedia: async (
    bucket: StorageBucket,
    filePath: string,
    fileData: string | Blob,
    contentType: string
  ) => {
    const bucketName = STORAGE_BUCKETS[bucket];

    let uploadData: string | Blob;
    const options: any = { contentType };

    if (typeof fileData === 'string') {
      // Base64 string for images
      uploadData = fileData;
      options.base64 = true;
    } else {
      // Blob for videos
      uploadData = fileData;
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uploadData, options);

    if (error) {
      throw error;
    }

    return data;
  },

  getPublicUrl: (bucket: StorageBucket, filePath: string) => {
    const bucketName = STORAGE_BUCKETS[bucket];
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return data?.publicUrl || null;
  },

  deleteFile: async (bucket: StorageBucket, filePath: string) => {
    const bucketName = STORAGE_BUCKETS[bucket];
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return data;
  },

  getSignedUrl: async (
    bucket: StorageBucket,
    filePath: string,
    expiresIn: number = 3600, // seconds
    transform?: {
      width?: number;
      height?: number;
      quality?: number;
      resize?: 'cover' | 'contain' | 'fill';
      format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'auto';
    }
  ) => {
    const bucketName = STORAGE_BUCKETS[bucket];

    const options: any = {};
    if (transform) {
      options.transform = transform;
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn, options);

    if (error) {
      throw error;
    }

    return data?.signedUrl || null;
  },
};

// Export the User type for convenience
export type { SupabaseUser };
