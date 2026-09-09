import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { Group, useGroupStore } from '@/store/group-store';
import { interactiveQueryConfig, staticQueryConfig } from '@/lib/queryClient';
import { groupQueryKeys } from '@/lib/group-query-keys';

export { groupQueryKeys } from '@/lib/group-query-keys';

export type GroupDetailErrorKind =
  | 'permission'
  | 'not-found'
  | 'network'
  | 'unknown';

// Keep access failures distinct from a real, successfully loaded empty result.
export const getGroupDetailErrorKind = (
  error: unknown
): GroupDetailErrorKind => {
  try {
    const errObj = error as
      | { code?: unknown; status?: unknown; message?: unknown }
      | null
      | undefined;
    const code = String(
      (errObj && (errObj.code ?? errObj.status)) ?? ''
    ).toUpperCase();
    const msg = String(errObj?.message ?? '').toLowerCase();
    if (!code && !msg) return 'unknown';
    // Common Postgres / PostgREST / HTTP indicators
    if (
      code === '42501' ||
      code === '401' ||
      code === '403' ||
      code.startsWith('PGRST3')
    )
      return 'permission';
    if (
      msg.includes('permission denied') ||
      msg.includes('not allowed') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden') ||
      msg.includes('rls')
    ) {
      return 'permission';
    }
    if (
      code === 'PGRST116' ||
      code === '404' ||
      msg.includes('contains 0 rows') ||
      msg.includes('not found')
    ) {
      return 'not-found';
    }
    if (
      msg.includes('network') ||
      msg.includes('fetch failed') ||
      msg.includes('timed out') ||
      msg.includes('offline')
    ) {
      return 'network';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

const isPermissionError = (error: unknown): boolean =>
  getGroupDetailErrorKind(error) === 'permission';

// Local types for hook return shapes to avoid mismatches with store types
export type DetailMember = {
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    has_completed_onboarding: boolean | null;
  };
};

export type DisplayChallenge = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  verification_method?: string | null;
  verification_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_public?: boolean | null;
  allow_self_review?: boolean | null;
  creator_id?: string | null;
  added_to_group_at: string;
};

// RawGroup type no longer needed with store-first flow

// Optimized group detail query with proper indexing and realtime config
export const useGroupDetail = (id: string | undefined) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.user?.id ?? '');
  return useQuery({
    queryKey: groupQueryKeys.detail(userId, id || ''),
    queryFn: async (): Promise<Group | null> => {
      if (!id) return null;
      // Store-first approach: use cache, then store action. Permission failures
      // must reject so the screen never mistakes them for a missing group.
      const store = useGroupStore.getState();
      try {
        let group: Group | null = store.groups.find(g => g.id === id) || null;
        if (!group) {
          group = await store.fetchGroupDetails(id);
        }
        return group;
      } catch (err) {
        if (isPermissionError(err)) {
          try {
            console.warn(
              '[useGroupDetail] Permission-limited access to group detail',
              { id }
            );
          } catch {}
          throw err;
        }
        try {
          console.error('[useGroupDetail] Unexpected error loading group', {
            id,
            err,
          });
        } catch {}
        throw err;
      }
    },
    enabled: !!id && isAuthenticated,
    ...interactiveQueryConfig,
  });
};

/**
 * Read only the signed-in person's membership before asking for member,
 * promise-link, or proof-bearing group data. Public group rows are discoverable;
 * their private accountability graph is not.
 */
export const useGroupPrivateAccess = (groupId: string | undefined) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.user?.id ?? '');

  return useQuery({
    queryKey: [...groupQueryKeys.members(userId, groupId || ''), 'self-access'],
    queryFn: async (): Promise<boolean> => {
      if (!groupId || !userId) return false;
      const { data, error } = await supabase
        .from('team_members')
        .select('group_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data?.group_id);
    },
    enabled: Boolean(groupId && userId && isAuthenticated),
    ...interactiveQueryConfig,
  });
};

// Optimized group members query with sorting - use static config (members don't change often)
export const useGroupMembers = (
  groupId: string | undefined,
  privateAccessConfirmed = true
) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.user?.id ?? '');
  return useQuery({
    queryKey: groupQueryKeys.members(userId, groupId || ''),
    queryFn: async (): Promise<DetailMember[]> => {
      if (!groupId) return [];
      const store = useGroupStore.getState();
      try {
        await store.fetchGroupMembers(groupId);
        const cached = useGroupStore.getState().groupMembers[groupId];
        if (cached && Array.isArray(cached)) {
          return cached.map(m => ({
            group_id: m.groupId,
            user_id: m.userId,
            role: (m.role ?? 'member') as DetailMember['role'],
            joined_at: m.joinedAt || new Date().toISOString(),
            user: {
              id: m.userId,
              username: m.username ?? null,
              display_name: m.displayName ?? m.username ?? null,
              avatar_url: m.avatarUrl ?? null,
              has_completed_onboarding: null,
            },
          }));
        }

        return [];
      } catch (err) {
        if (isPermissionError(err)) {
          try {
            console.warn('[useGroupMembers] Permission-limited members', {
              groupId,
            });
          } catch {}
          throw err;
        }
        try {
          console.error('[useGroupMembers] Unexpected error', { groupId, err });
        } catch {}
        throw err;
      }
    },
    enabled: !!groupId && isAuthenticated && privateAccessConfirmed,
    ...staticQueryConfig, // Use static config - members don't change frequently
  });
};

// Optimized group challenges query - use realtime config for active data
export const useGroupChallenges = (
  groupId: string | undefined,
  privateAccessConfirmed = true
) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.user?.id ?? '');
  return useQuery({
    queryKey: groupQueryKeys.challenges(userId, groupId || ''),
    queryFn: async (): Promise<DisplayChallenge[]> => {
      if (!groupId) return [];
      try {
        const { data, error } = await supabase
          .from('team_challenges')
          .select(
            `
            created_at,
            challenge:challenges(
              id,
              title,
              description,
              category,
              difficulty,
              verification_type,
              allow_self_review,
              start_date,
              end_date,
              is_public,
              creator_id
            )
          `
          )
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = (data || []) as unknown as {
          created_at: string | null;
          challenge:
            | (Partial<DisplayChallenge> & { id?: string; title?: string })
            | null;
        }[];

        return rows
          .filter(
            item => !!item.challenge && typeof item.challenge.id === 'string'
          )
          .map(item => ({
            ...(item.challenge as Partial<DisplayChallenge>),
            // id/title are safe due to the filter above
            added_to_group_at: item.created_at || new Date().toISOString(),
          })) as DisplayChallenge[];
      } catch (err) {
        if (isPermissionError(err)) throw err;
        throw err;
      }
    },
    enabled: !!groupId && isAuthenticated && privateAccessConfirmed,
    ...interactiveQueryConfig,
  });
};

// Combined hook for group detail data
export const useGroupDetailData = (id: string | undefined) => {
  const groupQuery = useGroupDetail(id);
  const accessQuery = useGroupPrivateAccess(id);
  const privateAccessConfirmed = accessQuery.data === true;
  const membersQuery = useGroupMembers(id, privateAccessConfirmed);
  const challengesQuery = useGroupChallenges(id, privateAccessConfirmed);
  const privateQueries = privateAccessConfirmed
    ? [membersQuery, challengesQuery]
    : [];
  const queries = [groupQuery, accessQuery, ...privateQueries];
  const error =
    groupQuery.error ||
    accessQuery.error ||
    membersQuery.error ||
    challengesQuery.error ||
    null;
  const dataUpdatedAtValues = queries
    .filter(query => query.data !== undefined && query.dataUpdatedAt > 0)
    .map(query => query.dataUpdatedAt);
  const hasCachedData = queries.some(query => query.data !== undefined);
  const isError = queries.some(query => query.isError);
  const isPaused = queries.some(query => query.fetchStatus === 'paused');
  const isInitialLoading = queries.some(
    query => query.isPending && query.data === undefined
  );

  return {
    group: groupQuery.data,
    members: membersQuery.data || [],
    challenges: challengesQuery.data || [],
    privateAccessConfirmed,
    isLoading: isInitialLoading,
    isInitialLoading,
    isRefreshing: queries.some(query => query.isFetching) && hasCachedData,
    isError,
    isPaused,
    isStale: hasCachedData && (isError || isPaused),
    hasCachedData,
    error,
    errorKind: error ? getGroupDetailErrorKind(error) : null,
    lastUpdatedAt:
      dataUpdatedAtValues.length > 0
        ? Math.min(...dataUpdatedAtValues)
        : undefined,
    refetch: async () => {
      await Promise.all([
        groupQuery.refetch(),
        accessQuery.refetch(),
        ...(privateAccessConfirmed
          ? [membersQuery.refetch(), challengesQuery.refetch()]
          : []),
      ]);
    },
  };
};
