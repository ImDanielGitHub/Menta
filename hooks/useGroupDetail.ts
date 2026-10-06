import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { Group, useGroupStore } from '@/store/group-store';
import { interactiveQueryConfig, staticQueryConfig } from '@/lib/queryClient';
import { groupQueryKeys } from '@/lib/group-query-keys';
import {
  getGroupDetailErrorKind,
  normalizeGroupReadError,
  readGroupResource,
} from '@/lib/groups/group-access-boundary';

export { groupQueryKeys } from '@/lib/group-query-keys';

export {
  getGroupDetailErrorKind,
  type GroupDetailErrorKind,
} from '@/lib/groups/group-access-boundary';

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
  const queryClient = useQueryClient();
  const queryKey = groupQueryKeys.detail(userId, id || '');
  return useQuery({
    queryKey,
    queryFn: () =>
      readGroupResource(
        queryClient,
        { userId, groupId: id || '', queryKey },
        async (): Promise<Group | null> => {
          if (!id) return null;
          // React Query owns stale data. Revalidate current server authority on
          // every fetch instead of satisfying the request from the group store.
          const store = useGroupStore.getState();
          try {
            return await store.fetchGroupDetails(id);
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
        }
      ),
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
  const queryClient = useQueryClient();
  const queryKey = [
    ...groupQueryKeys.members(userId, groupId || ''),
    'self-access',
  ];

  return useQuery({
    queryKey,
    queryFn: () =>
      readGroupResource(
        queryClient,
        { userId, groupId: groupId || '', queryKey, selfAccess: true },
        async (): Promise<boolean> => {
          if (!groupId || !userId) return false;
          try {
            const { data, error, status } = await supabase
              .from('team_members')
              .select('group_id')
              .eq('group_id', groupId)
              .eq('user_id', userId)
              .maybeSingle();
            if (error) throw normalizeGroupReadError(error, status);
            return Boolean(data?.group_id);
          } catch (error) {
            if (getGroupDetailErrorKind(error) !== 'network') {
              // A later transport failure must not revive authority rejected by
              // this read. Preserve the error while clearing its cached grant.
              queryClient.setQueryData(queryKey, false);
            }
            throw error;
          }
        }
      ),
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
  const queryClient = useQueryClient();
  const queryKey = groupQueryKeys.members(userId, groupId || '');
  return useQuery<DetailMember[] | null>({
    queryKey,
    queryFn: () =>
      readGroupResource(
        queryClient,
        { userId, groupId: groupId || '', queryKey },
        async (): Promise<DetailMember[]> => {
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
              console.error('[useGroupMembers] Unexpected error', {
                groupId,
                err,
              });
            } catch {}
            throw err;
          }
        }
      ),
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
  const queryClient = useQueryClient();
  const queryKey = groupQueryKeys.challenges(userId, groupId || '');
  return useQuery<DisplayChallenge[] | null>({
    queryKey,
    queryFn: () =>
      readGroupResource(
        queryClient,
        { userId, groupId: groupId || '', queryKey },
        async (): Promise<DisplayChallenge[]> => {
          if (!groupId) return [];
          try {
            const { data, error, status } = await supabase
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

            if (error) throw normalizeGroupReadError(error, status);

            const rows = (data || []) as unknown as {
              created_at: string | null;
              challenge:
                | (Partial<DisplayChallenge> & { id?: string; title?: string })
                | null;
            }[];

            return rows
              .filter(
                item =>
                  !!item.challenge && typeof item.challenge.id === 'string'
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
        }
      ),
    enabled: !!groupId && isAuthenticated && privateAccessConfirmed,
    ...interactiveQueryConfig,
  });
};

// Combined hook for group detail data
export const useGroupDetailData = (id: string | undefined) => {
  const hasAuthenticatedAccount = useAuthStore(
    s => s.isAuthenticated && Boolean(s.user?.id)
  );
  const groupQuery = useGroupDetail(id);
  const accessQuery = useGroupPrivateAccess(id);
  const privateAccessConfirmed =
    hasAuthenticatedAccount &&
    accessQuery.data === true &&
    (!accessQuery.isError ||
      getGroupDetailErrorKind(accessQuery.error) === 'network');
  const membersQuery = useGroupMembers(id, privateAccessConfirmed);
  const challengesQuery = useGroupChallenges(id, privateAccessConfirmed);
  const privateQueries = privateAccessConfirmed
    ? [membersQuery, challengesQuery]
    : [];
  const queries = [groupQuery, accessQuery, ...privateQueries];
  const errors = queries.map(query => query.error).filter(Boolean);
  const accessError = errors.find(error => {
    const kind = getGroupDetailErrorKind(error);
    return kind === 'permission' || kind === 'not-found';
  });
  const error = accessError || errors[0] || null;
  const accessDenied = Boolean(accessError);
  const isPublicGroup =
    groupQuery.data?.privacy === 'public' ||
    groupQuery.data?.privacy === 'discoverable';
  const canShowPrivateData =
    privateAccessConfirmed &&
    Boolean(groupQuery.data) &&
    !accessDenied &&
    membersQuery.data !== null &&
    challengesQuery.data !== null;
  const visibleGroup =
    !accessDenied && (isPublicGroup || canShowPrivateData)
      ? groupQuery.data
      : null;
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
    group: visibleGroup,
    members: canShowPrivateData ? membersQuery.data || [] : [],
    challenges: canShowPrivateData ? challengesQuery.data || [] : [],
    privateAccessConfirmed: canShowPrivateData,
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
      const [, access] = await Promise.all([
        groupQuery.refetch(),
        accessQuery.refetch(),
      ]);
      if (access.data === true && !access.isError) {
        await Promise.all([membersQuery.refetch(), challengesQuery.refetch()]);
      }
    },
  };
};
