import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export type GroupMembershipActivityKind = 'joined' | 'left';

export const GROUP_MEMBERSHIP_JOINED_ACTIVITY = 'joined the group';
export const GROUP_MEMBERSHIP_LEFT_ACTIVITY = 'left the group';

const trimName = (value?: string | null): string =>
  typeof value === 'string' ? value.trim() : '';

export function resolveGroupActivityMemberName(
  name?: string | null,
  t: TranslateCopy = defaultTranslate
): string {
  const trimmed = trimName(name);
  return trimmed.length > 0 ? trimmed : t('groups.source.member.fallback');
}

export function resolveGroupActivityGroupName(
  name?: string | null,
  t: TranslateCopy = defaultTranslate
): string {
  const trimmed = trimName(name);
  return trimmed.length > 0 ? trimmed : t('groups.source.group.fallback');
}

export function describeGroupMembershipActivity(
  args: {
    memberName?: string | null;
    groupName?: string | null;
    kind: GroupMembershipActivityKind;
  },
  t: TranslateCopy = defaultTranslate
): {
  memberName: string;
  groupName: string;
  activity: string;
  body: string;
} {
  const memberName = resolveGroupActivityMemberName(args.memberName, t);
  const groupName = resolveGroupActivityGroupName(args.groupName, t);
  const left = args.kind === 'left';

  return {
    memberName,
    groupName,
    activity: left
      ? GROUP_MEMBERSHIP_LEFT_ACTIVITY
      : GROUP_MEMBERSHIP_JOINED_ACTIVITY,
    body: t(
      left ? 'groups.source.activity.left' : 'groups.source.activity.joined',
      { memberName, groupName }
    ),
  };
}
