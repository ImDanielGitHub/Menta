import { supabase } from '@/lib/supabase';

export type AttachableSavedGroup = {
  id: string;
  name: string;
  privacy: 'public' | 'private';
  imageUrl: string | null;
  memberCount: number | null;
  viewerRole: 'owner' | 'admin';
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const firstRelation = (value: unknown): UnknownRecord | null => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isRecord(candidate) ? candidate : null;
};

const text = (value: unknown, maximum = 120): string | null =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= maximum
    ? value.trim()
    : null;

export const decodeAttachableSavedGroups = (
  memberships: unknown,
  stats: unknown
): AttachableSavedGroup[] => {
  const counts = new Map<string, number>();
  if (Array.isArray(stats)) {
    for (const value of stats) {
      if (!isRecord(value)) continue;
      const groupId = text(value.group_id, 36);
      const count = value.total_members;
      if (
        groupId &&
        typeof count === 'number' &&
        Number.isInteger(count) &&
        count >= 0
      ) {
        counts.set(groupId, count);
      }
    }
  }

  if (!Array.isArray(memberships)) return [];

  const seen = new Set<string>();
  return memberships
    .flatMap(value => {
      if (!isRecord(value)) return [];
      const viewerRole = value.role;
      if (viewerRole !== 'owner' && viewerRole !== 'admin') return [];
      const group = firstRelation(value.teams);
      if (
        !group ||
        group.kind !== 'saved' ||
        group.status !== 'active' ||
        group.archived_at !== null
      ) {
        return [];
      }

      const id = text(group.id, 36);
      const name = text(group.name);
      const imageUrl =
        group.image_url === null ? null : text(group.image_url, 500);
      if (
        !id ||
        !name ||
        (imageUrl === null && group.image_url !== null) ||
        seen.has(id)
      ) {
        return [];
      }
      seen.add(id);

      return [
        {
          id,
          name,
          privacy: group.privacy === 'public' ? 'public' : 'private',
          imageUrl,
          memberCount: counts.get(id) ?? null,
          viewerRole,
        } satisfies AttachableSavedGroup,
      ];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
};

export const readAttachableSavedGroups = async (
  actorId: string
): Promise<AttachableSavedGroup[]> => {
  const { data: memberships, error } = await supabase
    .from('team_members')
    .select(
      `
        role,
        teams!inner (
          id,
          name,
          privacy,
          status,
          kind,
          archived_at,
          image_url
        )
      `
    )
    .eq('user_id', actorId)
    .in('role', ['owner', 'admin']);

  if (error) throw error;
  const groupIds = decodeAttachableSavedGroups(memberships, []).map(
    group => group.id
  );
  if (groupIds.length === 0) return [];

  const { data: stats } = await supabase
    .from('group_stats')
    .select('group_id,total_members')
    .in('group_id', groupIds);

  return decodeAttachableSavedGroups(memberships, stats);
};
