import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { readGroupResource } from '@/lib/groups/group-access-boundary';

import { fetchPromiseAccountability } from '@/lib/promises/accountability';

export const promiseAccountabilityQueryKey = (challengeId: string) =>
  ['promise-accountability', challengeId] as const;

export const usePromiseAccountability = (
  challengeId: string | null | undefined,
  groupId?: string
) => {
  const userId = useAuthStore(s => s.user?.id ?? '');
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();
  const authorityKey = [
    ...promiseAccountabilityQueryKey(challengeId ?? ''),
    'account',
    userId,
  ];
  const queryKey = [...authorityKey, 'group', groupId ?? ''];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      readGroupResource(
        queryClient,
        { userId, groupId: groupId ?? '', queryKey, authorityKey },
        () => fetchPromiseAccountability(challengeId as string)
      ),
    enabled: Boolean(challengeId && userId && isAuthenticated),
    staleTime: 30_000,
    // This route has an explicit retry action. Automatic retries leave the
    // onboarding handoff looking stuck when a session or network request has
    // already failed.
    retry: false,
  });
  return { ...query, accessDenied: query.data === null };
};
