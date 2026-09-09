import { useQuery } from '@tanstack/react-query';

import {
  loadPromiseAccountabilityInvitePreview,
  type PromiseAccountabilityInvitePreviewResult,
} from '@/lib/promises/accountability';
import { useTranslation } from '@/lib/localization';
import { useAuthStore } from '@/store/auth-store';
import { useInviteStore } from '@/store/invite-store';

export function usePendingPromiseInvitePreview() {
  const { t } = useTranslation();
  const userId = useAuthStore(state => state.user?.id ?? null);
  const pending = useInviteStore(state => state.pending);
  const pendingPromise =
    pending?.type === 'challenge' &&
    (!pending.ownerUserId || pending.ownerUserId === userId)
      ? pending
      : null;

  const query = useQuery<PromiseAccountabilityInvitePreviewResult>({
    queryKey: ['pending-promise-invite-preview', pendingPromise?.code ?? ''],
    queryFn: () =>
      loadPromiseAccountabilityInvitePreview(pendingPromise?.code ?? '', t),
    enabled: Boolean(pendingPromise?.code),
    retry: false,
    staleTime: 30_000,
  });

  return {
    pendingInvite: pendingPromise,
    preview: query.data?.kind === 'ready' ? query.data.preview : null,
    result: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
