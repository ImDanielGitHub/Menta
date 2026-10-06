import { processLock } from '@supabase/supabase-js';

/** Use the same namespace as the pinned SDK's custom-lock path. */
export const withAuthStorageLock = <T>(
  storageKey: string,
  operation: () => Promise<T>
): Promise<T> => processLock(`lock:${storageKey}`, -1, operation);
