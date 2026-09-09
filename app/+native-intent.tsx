import {
  isRejectedNativeEventIntent,
  normalizeNativeIntentPath,
} from '@/lib/app-intents/native-router-path';

type RedirectSystemPathInput = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({ path }: RedirectSystemPathInput) {
  const normalizedPath = normalizeNativeIntentPath(path);
  if (normalizedPath) return normalizedPath;
  if (isRejectedNativeEventIntent(path)) return '/events';
  return path;
}
