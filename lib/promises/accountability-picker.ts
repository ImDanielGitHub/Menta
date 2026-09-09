export type AccountabilityPickerPromise = {
  id: string;
  title: string;
  groupId: string | null;
  groupKind: 'saved' | 'promise' | null;
};

export type AccountabilityPickerDestination =
  | {
      pathname: '/groups/[id]';
      params: { id: string };
    }
  | {
      pathname: '/promise-accountability';
      params: { challengeId: string };
    };

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const firstRelation = (value: unknown): UnknownRecord | null => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isRecord(candidate) ? candidate : null;
};

const relationList = (value: unknown): UnknownRecord[] =>
  (Array.isArray(value) ? value : value ? [value] : []).filter(isRecord);

const decodeGroupLink = (
  value: UnknownRecord
): Pick<AccountabilityPickerPromise, 'groupId' | 'groupKind'> | null => {
  const groupId =
    typeof value.group_id === 'string' && value.group_id.trim()
      ? value.group_id.trim()
      : null;
  if (!groupId) return null;

  const team = firstRelation(value.team);
  const teamId =
    typeof team?.id === 'string' && team.id.trim() ? team.id.trim() : null;
  const groupKind =
    teamId === groupId && (team?.kind === 'saved' || team?.kind === 'promise')
      ? team.kind
      : null;

  return { groupId, groupKind };
};

export const decodeAccountabilityPickerPromises = (
  value: unknown
): AccountabilityPickerPromise[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap(rowValue => {
    if (!isRecord(rowValue) || rowValue.status !== 'active') return [];
    const challenge = firstRelation(rowValue.challenges);
    if (
      !challenge ||
      typeof challenge.id !== 'string' ||
      !challenge.id.trim() ||
      typeof challenge.title !== 'string' ||
      !challenge.title.trim() ||
      challenge.status !== 'active' ||
      challenge.completion_status !== 'active' ||
      challenge.is_expired === true
    ) {
      return [];
    }

    const links = relationList(challenge.team_challenges)
      .map(decodeGroupLink)
      .filter(
        (
          link
        ): link is Pick<AccountabilityPickerPromise, 'groupId' | 'groupKind'> =>
          link !== null
      );
    const group =
      links.find(link => link.groupKind === 'saved') ??
      links.find(link => link.groupKind === 'promise') ??
      links[0] ??
      null;

    return [
      {
        id: challenge.id.trim(),
        title: challenge.title.trim(),
        groupId: group?.groupId ?? null,
        groupKind: group?.groupKind ?? null,
      },
    ];
  });
};

export const getAccountabilityPickerDestination = (
  promise: AccountabilityPickerPromise
): AccountabilityPickerDestination =>
  promise.groupKind === 'saved' && promise.groupId
    ? { pathname: '/groups/[id]', params: { id: promise.groupId } }
    : {
        pathname: '/promise-accountability',
        params: { challengeId: promise.id },
      };

export const getAccountabilityPickerHintKey = (
  promise: AccountabilityPickerPromise
):
  | 'groups.tab.list_open_hint'
  | 'groups.source.accountability.picker.choose_hint' =>
  promise.groupKind === 'saved' && promise.groupId
    ? 'groups.tab.list_open_hint'
    : 'groups.source.accountability.picker.choose_hint';
