import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getMentaCheckMediaPermissionV2 } from '@/lib/menta-check/api';

export type MediaPermissionState =
  'loading' | 'error' | 'allowed' | 'needs-review';

/** Read the current account's server receipt afresh on each permission visit.
 * No persisted client acceptance flag or legacy consent fallback is used.
 */
export function useMentaMediaPermission(visible: boolean) {
  const owner = useAuthStore(state => state.user?.id);
  const generation = useRef(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    owner: string;
    revision: number;
    request: number;
    state: MediaPermissionState;
  } | null>(null);
  const refresh = useCallback(() => {
    generation.current += 1;
    setResult(null);
    setRevision(value => value + 1);
  }, []);
  useEffect(() => {
    const request = ++generation.current;
    setResult(null);
    if (!visible || !owner) return;
    const current = () =>
      generation.current === request &&
      useAuthStore.getState().user?.id === owner;
    void getMentaCheckMediaPermissionV2()
      .then(state => {
        if (!current()) return;
        setResult({
          owner,
          revision,
          request,
          state:
            state === 'allowed' || state === 'needs-review' ? state : 'error',
        });
      })
      .catch(() => {
        if (current()) setResult({ owner, revision, request, state: 'error' });
      });
    return () => {
      generation.current += 1;
    };
  }, [visible, owner, revision]);
  return {
    state: (visible &&
    result !== null &&
    result.owner === owner &&
    result.revision === revision &&
    result.request === generation.current
      ? result.state
      : 'loading') as MediaPermissionState,
    refresh,
  };
}
