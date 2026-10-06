import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { groupQueryKeys } from '@/lib/group-query-keys';

export type GroupDetailErrorKind =
  'permission' | 'not-found' | 'network' | 'unknown';

// Keep access failures distinct from a real, successfully loaded empty result.
export const getGroupDetailErrorKind = (
  error: unknown
): GroupDetailErrorKind => {
  try {
    const errObj = error as
      | { code?: unknown; status?: unknown; message?: unknown; name?: unknown }
      | null
      | undefined;
    const code = String(errObj?.code ?? '').toUpperCase();
    const status = String(errObj?.status ?? '');
    const name = String(errObj?.name ?? '').toLowerCase();
    const msg = String(errObj?.message ?? '').toLowerCase();
    if (!code && !status && !name && !msg) return 'unknown';
    // Common Postgres / PostgREST / HTTP indicators
    if (
      code === '42501' ||
      code === '401' ||
      code === '403' ||
      status === '401' ||
      status === '403' ||
      code.startsWith('PGRST3') ||
      code.includes('SESSION') ||
      code.includes('JWT') ||
      name.startsWith('auth')
    )
      return 'permission';
    if (
      msg.includes('permission denied') ||
      msg.includes('not allowed') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden') ||
      msg.includes('session') ||
      msg.includes('jwt') ||
      msg.includes('membership required') ||
      msg.includes('group_membership_required') ||
      /(?:access|refresh)[ _-]token/.test(msg) ||
      msg.includes('rls')
    ) {
      return 'permission';
    }
    if (
      code === 'PGRST116' ||
      code === '404' ||
      status === '404' ||
      msg.includes('contains 0 rows') ||
      msg.includes('not found')
    ) {
      return 'not-found';
    }
    // Only transport failures can retain previously confirmed authority.
    // An upstream error code/status must not become "network" just because
    // its message happens to mention a timeout or connectivity.
    const transportCodes = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'EAI_AGAIN',
    ];
    if (
      (!status || status === '0') &&
      (!code || transportCodes.includes(code)) &&
      (transportCodes.includes(code) ||
        msg.includes('network') ||
        msg.includes('fetch failed') ||
        msg.includes('failed to fetch') ||
        msg.includes('timed out') ||
        msg.includes('offline'))
    ) {
      return 'network';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

// PostgREST keeps HTTP status on the response, outside response.error.
export const normalizeGroupReadError = (error: unknown, status?: number) => {
  const value = error as {
    code?: unknown;
    message?: unknown;
    name?: unknown;
    status?: unknown;
  } | null;
  return {
    code: value?.code,
    message: value?.message,
    name: value?.name,
    status: status ?? value?.status,
  };
};

const generations = new WeakMap<QueryClient, Map<string, number>>();
const generationKey = (userId: string, groupId: string) =>
  JSON.stringify([userId, groupId]);
const generationMap = (client: QueryClient) => {
  let state = generations.get(client);
  if (!state) {
    state = new Map();
    generations.set(client, state);
  }
  return state;
};

const interruptedRead = () =>
  Object.assign(new Error('Group authority changed during this read'), {
    code: 'GROUP_AUTHORITY_CHANGED',
  });

/** Null is a denial marker, retained through failed refetches. Only a read
 * started after the rejection can replace it with authorised data. */
export const readGroupResource = async <T>(
  client: QueryClient,
  scope: {
    userId: string;
    groupId: string;
    queryKey: QueryKey;
    selfAccess?: boolean;
    // Stable authority/cache prefix when concrete queries have shape/context variants.
    authorityKey?: QueryKey;
  },
  read: () => Promise<T>
): Promise<T> => {
  const state = generationMap(client);
  const key = generationKey(scope.userId, scope.groupId);
  const resourceKey = JSON.stringify([
    'resource',
    scope.authorityKey ?? scope.queryKey,
  ]);
  const startedAtGeneration = state.get(key) ?? 0;
  const startedAtResourceGeneration = state.get(resourceKey) ?? 0;
  try {
    const result = await read();
    if (
      (state.get(key) ?? 0) !== startedAtGeneration ||
      (state.get(resourceKey) ?? 0) !== startedAtResourceGeneration
    )
      throw interruptedRead();
    return result;
  } catch (error) {
    const kind = getGroupDetailErrorKind(error);
    if (scope.userId && (kind === 'permission' || kind === 'not-found')) {
      state.set(resourceKey, (state.get(resourceKey) ?? 0) + 1);
      if (scope.groupId) {
        state.set(key, (state.get(key) ?? 0) + 1);
        client.setQueryData(
          groupQueryKeys.detail(scope.userId, scope.groupId),
          null,
          { updatedAt: 0 }
        );
        client.setQueryData(
          [
            ...groupQueryKeys.members(scope.userId, scope.groupId),
            'self-access',
          ],
          false,
          { updatedAt: 0 }
        );
      }
      if (scope.authorityKey) {
        client.setQueriesData({ queryKey: scope.authorityKey }, null, {
          updatedAt: 0,
        });
      }
      client.setQueryData(scope.queryKey, scope.selfAccess ? false : null, {
        updatedAt: 0,
      });
    }
    throw error;
  }
};
