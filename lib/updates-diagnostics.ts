import * as Updates from 'expo-updates';
import { addBreadcrumb as sentryBreadcrumb, captureError as sentryCapture, captureMessage as sentryMessage } from '@/lib/sentry';

/**
 * Log basic Updates context to Sentry for debugging OTA-related crashes.
 */
export async function logUpdatesContextAtStartup(): Promise<void> {
  try {
    const context: Record<string, unknown> = {};
    try { (context as any).updateId = (Updates as any).updateId ?? null; } catch {}
    try { (context as any).channel = (Updates as any).channel ?? null; } catch {}
    try { (context as any).runtimeVersion = (Updates as any).runtimeVersion ?? null; } catch {}
    try { (context as any).isEmbeddedLaunch = (Updates as any).isEmbeddedLaunch ?? null; } catch {}
    try { (context as any).manifest = (Updates as any).manifest ?? null; } catch {}

    sentryBreadcrumb('updates_startup_context', context as any);
    if (__DEV__) {
      sentryMessage('updates_startup_context', 'info', { extras: context as any });
    }
  } catch (e) {
    // best-effort
  }
}

/**
 * Attach Updates event listeners to capture update lifecycle in Sentry.
 * Returns an unsubscribe function.
 */
export function attachUpdatesListeners(): () => void {
  try {
    const subscription = (Updates as any).addListener?.((event: any) => {
      try {
        const type = String(event?.type || 'unknown');
        const data = event || {};
        sentryBreadcrumb(`updates_event_${type}`, data as any);
        if (type === 'error') {
          const err = (event && (event.error || event.message)) || new Error('Unknown Updates error');
          sentryCapture(err as any, { context: 'expo_updates_listener', ...(data || {}) });
        }
      } catch {}
    });
    return () => {
      try { subscription?.remove?.(); } catch {}
    };
  } catch (e) {
    return () => {};
  }
}

