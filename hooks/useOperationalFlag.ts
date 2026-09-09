import { useCallback } from 'react';
import {
  getOperationalFlag,
  type OperationalFlagKey,
} from '@/lib/operational-flags';

/**
 * Read an app-owned release switch using the same small shape as other async
 * configuration hooks. Values are synchronous and never depend on analytics
 * consent or a network request.
 */
export function useOperationalFlag(key: OperationalFlagKey): {
  enabled: boolean;
  loading: false;
  refresh: () => Promise<void>;
} {
  const refresh = useCallback(async () => undefined, []);
  return { enabled: getOperationalFlag(key), loading: false, refresh };
}
