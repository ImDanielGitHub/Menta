import * as Updates from 'expo-updates';
import {
  addBreadcrumb as sentryBreadcrumb,
  captureError as sentryCapture,
  captureMessage as sentryMessage,
} from '@/lib/sentry';

interface LegacyUpdatesEvent {
  type?: unknown;
  error?: unknown;
  message?: unknown;
}

// Current Expo versions omit this API; retain best-effort older-client support.
const updatesWithLegacyListener = Updates as typeof Updates & {
  addListener?: (
    listener: (event: LegacyUpdatesEvent | null | undefined) => void
  ) => { remove?: () => void };
};

/**
 * Log basic Updates context to Sentry for debugging OTA-related crashes.
 */
export async function logUpdatesContextAtStartup(): Promise<void> {
  try {
    const context: Record<string, unknown> = {};
    try {
      context.updateId = Updates.updateId ?? null;
    } catch {}
    try {
      context.channel = Updates.channel ?? null;
    } catch {}
    try {
      context.runtimeVersion = Updates.runtimeVersion ?? null;
    } catch {}
    try {
      context.isEmbeddedLaunch = Updates.isEmbeddedLaunch ?? null;
    } catch {}

    sentryBreadcrumb('updates_startup_context', context);
    if (__DEV__) {
      sentryMessage('updates_startup_context', 'info', {
        extras: context,
      });
    }
  } catch {
    // best-effort
  }
}

/**
 * Attach Updates event listeners to capture update lifecycle in Sentry.
 * Returns an unsubscribe function.
 */
export function attachUpdatesListeners(): () => void {
  try {
    const subscription = updatesWithLegacyListener.addListener?.(event => {
      try {
        const type = String(event?.type || 'unknown');
        const data = { type };
        sentryBreadcrumb(`updates_event_${type}`, data);
        if (type === 'error') {
          const err =
            (event && (event.error || event.message)) ||
            new Error('Unknown Updates error');
          sentryCapture(err, {
            context: 'expo_updates_listener',
            ...data,
          });
        }
      } catch {}
    });
    return () => {
      try {
        subscription?.remove?.();
      } catch {}
    };
  } catch {
    return () => undefined;
  }
}
