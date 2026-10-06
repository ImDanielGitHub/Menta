import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getGroupDetailErrorKind,
  normalizeGroupReadError,
  readGroupResource,
} from '@/lib/groups/group-access-boundary';

import { useTranslation } from '@/lib/localization';
import { resolveAccountabilityMemberName } from '@/lib/loop/accountability-member-copy';
import {
  buildGroupAccountabilitySnapshot,
  type GroupAccountabilitySnapshot,
  type GroupBoardMediaProof,
  type GroupBoardMemberInput,
  type GroupBoardSubmissionInput,
} from '@/lib/loop/group-accountability-board';
import { interactiveQueryConfig } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

type SubmissionRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_current_user: boolean;
  submission_id: string | null;
  submission_status: string | null;
  media_type: string | null;
  submitted_at: string | null;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null => {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value !== null && typeof value === 'object'
    ? (value as UnknownRecord)
    : null;
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const encouragementIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const record = asRecord(item);
    const userId = asString(record?.user_id);
    return userId ? [userId] : [];
  });
};

const normaliseMediaProof = (
  value: unknown,
  memberNames: ReadonlyMap<string, string>,
  unnamedMemberName: string
): GroupBoardMediaProof | null => {
  const row = asRecord(value);
  if (!row) return null;

  const id = asString(row.id);
  const challengeId = asString(row.challenge_id);
  const contributorId = asString(row.user_id);
  const mediaUrl = asString(row.media_url);
  const submittedAt = asString(row.submission_date);
  const mediaType = row.media_type;
  const status = row.status;
  if (
    !id ||
    !challengeId ||
    !contributorId ||
    !mediaUrl ||
    !submittedAt ||
    (mediaType !== 'photo' && mediaType !== 'video') ||
    (status !== 'pending' && status !== 'approved' && status !== 'rejected')
  ) {
    return null;
  }

  const profile = asRecord(row.profiles);
  const contributorName =
    asString(profile?.display_name) ||
    asString(profile?.username) ||
    memberNames.get(contributorId) ||
    unnamedMemberName;

  return {
    id,
    challengeId,
    contributorId,
    contributorName,
    mediaType,
    mediaUrl,
    thumbnailUrl: null,
    reviewSource: asString(row.review_source),
    status,
    submittedAt,
    encouragementUserIds: encouragementIds(row.proof_encouragements),
  };
};

const emptySnapshot = (members: readonly GroupBoardMemberInput[]) =>
  buildGroupAccountabilitySnapshot({ members, submissions: [] });

const normaliseSubmission = (
  row: SubmissionRow
): GroupBoardSubmissionInput | null => {
  if (
    !row.submission_id ||
    (row.submission_status !== 'pending' &&
      row.submission_status !== 'approved' &&
      row.submission_status !== 'rejected')
  ) {
    return null;
  }

  const mediaType =
    row.media_type === 'video' || row.media_type === 'text'
      ? row.media_type
      : 'photo';

  return {
    id: row.submission_id,
    userId: row.user_id,
    status: row.submission_status,
    mediaType,
    submittedAt: row.submitted_at ?? new Date(0).toISOString(),
  };
};

export const useGroupAccountabilityBoard = ({
  userId,
  groupId,
  challengeIds,
  members,
  participantUserIds,
  enabled = true,
}: {
  userId?: string;
  groupId?: string;
  challengeIds: readonly string[];
  members: readonly GroupBoardMemberInput[];
  participantUserIds?: readonly string[];
  enabled?: boolean;
}) => {
  const { locale, t } = useTranslation();
  const unnamedMemberName = resolveAccountabilityMemberName(null, null, t);
  const namedMembers = members.map(member => ({
    ...member,
    name: resolveAccountabilityMemberName(member.name, null, t),
  }));
  const stableChallengeIds = [...challengeIds].sort();
  const stableMemberIds = namedMembers.map(member => member.userId).sort();
  const stableParticipantIds = participantUserIds
    ? [...participantUserIds].sort()
    : null;

  const queryClient = useQueryClient();
  const authorityKey = [
    'groupAccountabilityBoard',
    userId ?? '',
    groupId ?? '',
  ];
  const queryKey = [
    'groupAccountabilityBoard',
    userId ?? '',
    groupId ?? '',
    locale,
    stableChallengeIds,
    stableMemberIds,
    stableParticipantIds,
  ];
  const query = useQuery<GroupAccountabilitySnapshot | null>({
    queryKey,
    queryFn: () =>
      readGroupResource(
        queryClient,
        {
          userId: userId ?? '',
          groupId: groupId ?? '',
          queryKey,
          authorityKey,
        },
        async () => {
          const participants = stableParticipantIds
            ? new Set(stableParticipantIds)
            : null;
          const participantMembers = participants
            ? namedMembers.filter(member => participants.has(member.userId))
            : namedMembers;
          if (!groupId || stableChallengeIds.length === 0) {
            return emptySnapshot(participantMembers);
          }

          const [boardRead, proofRead] = await Promise.all([
            supabase.rpc('get_group_accountability_board', {
              p_group_id: groupId,
            }),
            supabase
              .from('challenge_submissions')
              .select(
                `
              id,
              challenge_id,
              user_id,
              media_type,
              media_url,
              status,
              submission_date,
              review_source,
              profiles!challenge_submissions_user_id_fkey (
                display_name,
                username
              ),
              proof_encouragements (
                user_id
              )
            `
              )
              .in('challenge_id', stableChallengeIds)
              .in('media_type', ['photo', 'video'])
              .in('status', ['pending', 'approved', 'rejected'])
              .not('media_url', 'is', null)
              .order('submission_date', { ascending: false })
              .limit(12),
          ]);

          if (boardRead.error) {
            throw normalizeGroupReadError(boardRead.error, boardRead.status);
          }
          if (proofRead.error) {
            const error = normalizeGroupReadError(
              proofRead.error,
              proofRead.status
            );
            const kind = getGroupDetailErrorKind(error);
            if (
              kind === 'permission' ||
              kind === 'not-found' ||
              queryClient.getQueryData(queryKey) === null
            )
              throw error;
          }

          const rows = (
            (boardRead.data ?? []) as unknown as SubmissionRow[]
          ).filter(row => !participants || participants.has(row.user_id));
          const boardMembers =
            rows.length > 0
              ? rows.map(row => ({
                  userId: row.user_id,
                  name: resolveAccountabilityMemberName(
                    row.display_name,
                    row.username,
                    t
                  ),
                  avatarUrl: row.avatar_url,
                  isCurrentUser: row.is_current_user,
                }))
              : participantMembers;
          const submissions = rows
            .map(normaliseSubmission)
            .filter(
              (submission): submission is GroupBoardSubmissionInput =>
                submission !== null
            );
          const memberNames = new Map(
            boardMembers.map(member => [member.userId, member.name] as const)
          );
          const recentProof = proofRead.error
            ? []
            : (proofRead.data ?? [])
                .map(row =>
                  normaliseMediaProof(row, memberNames, unnamedMemberName)
                )
                .filter(
                  (proof): proof is GroupBoardMediaProof => proof !== null
                );

          return buildGroupAccountabilitySnapshot({
            members: boardMembers,
            submissions,
            recentProof,
            proofReadState: proofRead.error ? 'unavailable' : 'available',
          });
        }
      ),
    enabled: Boolean(groupId) && enabled,
    ...interactiveQueryConfig,
  });

  return {
    ...query,
    hasSnapshot: query.data != null,
    accessDenied: query.data === null,
    isInitialLoading: query.isPending && query.data === undefined,
    isStaleSnapshot:
      query.data != null && (query.isError || query.fetchStatus === 'paused'),
    isUnavailable:
      query.data == null && (query.isError || query.fetchStatus === 'paused'),
    lastUpdatedAt: query.dataUpdatedAt || undefined,
  };
};
