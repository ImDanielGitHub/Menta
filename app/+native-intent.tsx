import { requireOptionalNativeModule } from 'expo-modules-core';
import {
  isRejectedNativeEventIntent,
  normalizeNativeIntentPath,
} from '@/lib/app-intents/native-router-path';

type RedirectSystemPathInput = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({ path, initial }: RedirectSystemPathInput) {
  const normalizedPath = normalizeNativeIntentPath(path);
  const widgetSetupPath = path
    .replace(/^(?:menta|lockedin|lockedinprod):\/\//i, '')
    .split(/[?#]/, 1)[0]
    ?.replace(/^\/+|\/+$/g, '');
  if (initial && widgetSetupPath === 'home-widget') {
    // Older OTA restart buttons did not clear iOS's cached launch URL. The
    // native counter survives JS reloads, unlike any in-memory navigation flag.
    // Only suppress that replay; cold widget taps and warm links still open setup.
    const updates = requireOptionalNativeModule<{
      initialContext?: { restartCount?: number };
    }>('ExpoUpdates');
    if ((updates?.initialContext?.restartCount ?? 0) > 0) return '/(tabs)';
  }
  if (normalizedPath) return normalizedPath;
  if (isRejectedNativeEventIntent(path)) return '/events';
  return path;
}
