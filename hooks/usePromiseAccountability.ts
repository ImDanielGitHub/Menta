import { useQuery } from '@tanstack/react-query';

import { fetchPromiseAccountability } from '@/lib/promises/accountability';

export const promiseAccountabilityQueryKey = (challengeId: string) =>
  ['promise-accountability', challengeId] as const;

export const usePromiseAccountability = (
  challengeId: string | null | undefined
) =>
  useQuery({
    queryKey: promiseAccountabilityQueryKey(challengeId ?? ''),
    queryFn: () => fetchPromiseAccountability(challengeId as string),
    enabled: Boolean(challengeId),
    staleTime: 30_000,
    // This route has an explicit retry action. Automatic retries leave the
    // onboarding handoff looking stuck when a session or network request has
    // already failed.
    retry: false,
  });
