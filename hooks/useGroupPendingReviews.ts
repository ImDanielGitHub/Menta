import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { interactiveQueryConfig } from '@/lib/queryClient';
import type { Database } from '@/lib/database.types';

/**
 * Optimized hook to fetch pending review count for a group
 * Replaces the heavy useEffect in GroupDetailScreen
 * Cached with React Query for better performance
 */
export const useGroupPendingReviews = (
  groupId: string | undefined,
  userId: string | undefined,
  challengeIds?: readonly string[]
) => {
  return useQuery({
    queryKey: [
      'groupPendingReviews',
      groupId,
      userId,
      [...(challengeIds ?? [])].sort(),
    ],
    queryFn: async (): Promise<number> => {
      if (!groupId || !userId) return 0;

      try {
        const { data, error } = await supabase.rpc(
          'get_today_pending_reviews',
          {
            p_timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          }
        );
        if (error) throw error;
        const reviews = (data ??
          []) as Database['public']['Functions']['get_today_pending_reviews']['Returns'];
        // Group backlog is not reviewer authority: supporters can see proof
        // but must never receive an approval action. Use the role-aware RPC.
        const scopedIds = challengeIds ? new Set(challengeIds) : null;
        return new Set(
          reviews
            .filter(review =>
              scopedIds
                ? scopedIds.has(review.challenge_id)
                : review.group_id === groupId
            )
            .map(review => review.review_id)
        ).size;
      } catch (error) {
        console.error('[useGroupPendingReviews] Error:', error);
        throw error;
      }
    },
    enabled: !!groupId && !!userId,
    ...interactiveQueryConfig,
  });
};
