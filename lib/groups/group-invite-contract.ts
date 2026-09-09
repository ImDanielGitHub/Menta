export type GroupInviteResponse = {
  code: string;
  replaced: boolean;
  previousCodeInvalidated: boolean;
};

export type GroupInvitePreviewStatus =
  | 'ACTIVE'
  | 'ALREADY_MEMBER'
  | 'EXPIRED'
  | 'REPLACED'
  | 'GROUP_INACTIVE'
  | 'NOT_FOUND';

export type GroupInvitePreview = {
  status: GroupInvitePreviewStatus;
  inviteCode: string;
  groupId: string | null;
  groupName: string | null;
  groupDescription: string | null;
  privacy: 'public' | 'private' | 'secret' | null;
  memberCount: number;
  inviterName: string | null;
  sharedPromise: string | null;
  expiresAt: string | null;
  isMember: boolean;
};

export type GuestGroupInvitePreview = {
  status: 'ACTIVE';
  groupName: string;
  inviterName: string | null;
  sharedPromise: string | null;
  privacy?: 'public' | 'private';
  expiresAt: string;
};

export type GroupInvitePreviewFailureCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_SESSION_REVOKED'
  | 'INVALID_CODE';

const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6,32}$/;
const PREVIEW_INVITE_CODE_PATTERN = /^[A-Z0-9]{4,32}$/;
const previewStatuses = new Set<GroupInvitePreviewStatus>([
  'ACTIVE',
  'ALREADY_MEMBER',
  'EXPIRED',
  'REPLACED',
  'GROUP_INACTIVE',
  'NOT_FOUND',
]);
const previewFailureCodes = new Set<GroupInvitePreviewFailureCode>([
  'AUTH_REQUIRED',
  'AUTH_SESSION_REVOKED',
  'INVALID_CODE',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const nullableString = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isNullableIsoDate = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === 'string' && !Number.isNaN(Date.parse(value)));

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[]
) => Object.keys(value).every(key => allowedKeys.includes(key));

export const isGuestGroupInvitePreviewUnavailable = (value: unknown): boolean =>
  isRecord(value) &&
  hasOnlyKeys(value, ['success', 'operation', 'code']) &&
  value.success === false &&
  value.operation === 'GROUP_INVITE_GUEST_PREVIEW' &&
  value.code === 'UNAVAILABLE';

export const decodeGuestGroupInvitePreviewResponse = (
  value: unknown
): GuestGroupInvitePreview | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['success', 'operation', 'code', 'preview']) ||
    value.success !== true ||
    value.operation !== 'GROUP_INVITE_GUEST_PREVIEW' ||
    value.code !== 'PREVIEW_READY' ||
    !isRecord(value.preview) ||
    !hasOnlyKeys(value.preview, [
      'group_name',
      'inviter_name',
      'shared_promise',
      'privacy',
      'expires_at',
    ])
  ) {
    return null;
  }

  const groupName = nullableString(value.preview.group_name);
  const inviterName = nullableString(value.preview.inviter_name);
  const sharedPromise = nullableString(value.preview.shared_promise);
  const privacy = value.preview.privacy;
  const expiresAt = value.preview.expires_at;

  if (
    !groupName ||
    inviterName === undefined ||
    sharedPromise === undefined ||
    !(
      privacy === undefined ||
      privacy === null ||
      privacy === 'public' ||
      privacy === 'private'
    ) ||
    typeof expiresAt !== 'string' ||
    Number.isNaN(Date.parse(expiresAt))
  ) {
    return null;
  }

  return {
    status: 'ACTIVE',
    groupName,
    inviterName,
    sharedPromise,
    ...(privacy === 'public' || privacy === 'private' ? { privacy } : {}),
    expiresAt,
  };
};

export const decodeGroupInviteResponse = (
  value: unknown
): GroupInviteResponse | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  if (
    candidate.success !== true ||
    typeof candidate.code !== 'string' ||
    !INVITE_CODE_PATTERN.test(candidate.code.trim().toUpperCase()) ||
    typeof candidate.replaced !== 'boolean' ||
    typeof candidate.previous_code_invalidated !== 'boolean'
  ) {
    return null;
  }

  return {
    code: candidate.code.trim().toUpperCase(),
    replaced: candidate.replaced,
    previousCodeInvalidated: candidate.previous_code_invalidated,
  };
};

export const decodeGroupInvitePreviewFailure = (
  value: unknown
): GroupInvitePreviewFailureCode | null => {
  if (!isRecord(value) || value.success !== false) return null;
  if (value.operation !== 'GROUP_INVITE_PREVIEW') return null;

  const code =
    typeof value.code === 'string' ? value.code.trim().toUpperCase() : '';

  return previewFailureCodes.has(code as GroupInvitePreviewFailureCode)
    ? (code as GroupInvitePreviewFailureCode)
    : null;
};

export const decodeGroupInvitePreviewResponse = (
  value: unknown
): GroupInvitePreview | null => {
  if (!isRecord(value) || value.success !== true) return null;
  if (
    value.operation !== 'GROUP_INVITE_PREVIEW' ||
    value.code !== 'PREVIEW_READY' ||
    !isRecord(value.preview)
  ) {
    return null;
  }

  const candidate = value.preview;
  const status = candidate.status;
  const inviteCode = nullableString(candidate.invite_code)?.toUpperCase();
  const groupId = nullableString(candidate.group_id);
  const groupName = nullableString(candidate.group_name);
  const groupDescription = nullableString(candidate.group_description);
  const inviterName = nullableString(candidate.inviter_name);
  const sharedPromise = nullableString(candidate.shared_promise);
  const privacy = candidate.privacy;
  const memberCount = candidate.member_count;
  const isMember = candidate.is_member;
  const expiresAt = candidate.expires_at;

  if (
    typeof status !== 'string' ||
    !previewStatuses.has(status as GroupInvitePreviewStatus) ||
    !inviteCode ||
    !PREVIEW_INVITE_CODE_PATTERN.test(inviteCode) ||
    groupId === undefined ||
    groupName === undefined ||
    groupDescription === undefined ||
    inviterName === undefined ||
    sharedPromise === undefined ||
    !(
      privacy === null ||
      privacy === 'public' ||
      privacy === 'private' ||
      privacy === 'secret'
    ) ||
    !Number.isInteger(memberCount) ||
    (memberCount as number) < 0 ||
    typeof isMember !== 'boolean' ||
    !isNullableIsoDate(expiresAt)
  ) {
    return null;
  }

  if (
    (status === 'ACTIVE' && (isMember || !groupId || !groupName)) ||
    (status === 'ALREADY_MEMBER' && (!isMember || !groupId || !groupName)) ||
    (status === 'NOT_FOUND' && (groupId !== null || groupName !== null))
  ) {
    return null;
  }

  return {
    status: status as GroupInvitePreviewStatus,
    inviteCode,
    groupId,
    groupName,
    groupDescription,
    privacy,
    memberCount: memberCount as number,
    inviterName,
    sharedPromise,
    expiresAt,
    isMember,
  };
};
