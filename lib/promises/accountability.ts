import { buildInviteShareUrl } from '@/lib/invite-links';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { supabase } from '@/lib/supabase';
import { createClientEventId } from '@/lib/client-event-id';
import { withTimeout } from '@/utils/api';
import {
  confirmedPromiseMutation,
  failedPromiseMutation,
  readReceiptBoundPromiseMutationStatus,
  submitReceiptBoundPromiseMutation,
  unknownPromiseMutation,
  type PromiseMutationResult,
} from '@/lib/promises/mutation-result';

export type PromiseAccountabilityRole = 'partner' | 'reviewer' | 'supporter';

export type PromiseAccountabilityMemberRole =
  | 'owner'
  | PromiseAccountabilityRole;

export type PromiseAccountabilityProofStatus =
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected';

export type PromiseAccountabilityMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: PromiseAccountabilityMemberRole;
  participates: boolean;
  proofStatus: PromiseAccountabilityProofStatus;
};

export type PromiseAccountabilitySummary = {
  promise: {
    id: string;
    title: string;
    description: string | null;
    verificationDescription: string | null;
    duration: number | null;
    allowSelfReview: boolean;
  };
  group: {
    id: string;
    name: string;
    kind: 'saved' | 'promise';
  } | null;
  members: PromiseAccountabilityMember[];
  acceptedCount: number;
  isShared: boolean;
  canInvite: boolean;
  invite: {
    code: string;
    role: PromiseAccountabilityRole;
    expiresAt: string | null;
  } | null;
};

export type PreparedPromiseAccountabilityInvite = {
  challengeId: string;
  challengeTitle: string;
  groupId: string;
  groupKind: 'saved' | 'promise';
  code: string;
  role: PromiseAccountabilityRole;
  shareUrl: string;
};

export type PromiseAccountabilityInvitePreview = {
  promiseTitle: string;
  promiseDescription: string | null;
  proofRule: string | null;
  durationDays: number | null;
  role: PromiseAccountabilityRole;
  inviterName: string;
};

export type PromiseAccountabilityInvitePreviewResult =
  | {
      kind: 'ready';
      preview: PromiseAccountabilityInvitePreview;
    }
  | {
      kind: 'terminal';
      message: string;
    }
  | {
      kind: 'retry';
      message: string;
    };

type UnknownRecord = Record<string, unknown>;

export type PromiseAccountabilityTranslator = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: PromiseAccountabilityTranslator = (key, values) =>
  translate('en-NZ', key, values);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVITE_PATTERN = /^[A-Z0-9]{4,32}$/;
const ACCOUNTABILITY_RPC_TIMEOUT_MS = 15_000;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown, maximum = 500): string | null =>
  typeof value === 'string' && value.trim() && value.trim().length <= maximum
    ? value.trim()
    : null;

const readNullableString = (
  value: unknown,
  maximum = 500
): string | null | undefined =>
  value === null ? null : (readString(value, maximum) ?? undefined);

const readUuid = (value: unknown): string | null => {
  const id = readString(value, 36);
  return id && UUID_PATTERN.test(id) ? id : null;
};

const readRole = (value: unknown): PromiseAccountabilityRole | null =>
  value === 'partner' || value === 'reviewer' || value === 'supporter'
    ? value
    : null;

const readMemberRole = (
  value: unknown
): PromiseAccountabilityMemberRole | null =>
  value === 'owner' ? 'owner' : readRole(value);

const readProofStatus = (value: unknown): PromiseAccountabilityProofStatus =>
  value === 'pending' || value === 'approved' || value === 'rejected'
    ? value
    : 'none';

const messageFromError = (value: unknown, fallback: string): string => {
  // Provider messages are diagnostic data and may be untranslated, unstable,
  // or implementation-facing. Visible recovery copy must use the literal
  // catalogue key supplied as the fallback.
  void value;
  return fallback;
};

const isAuthExpiryError = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  const status = value.status;
  const code = typeof value.code === 'string' ? value.code : '';
  const message = typeof value.message === 'string' ? value.message : '';
  return (
    status === 401 ||
    code === 'PGRST301' ||
    /jwt|token|auth session/i.test(message)
  );
};

type AccountabilityRequestError = Error & {
  code?: string;
  status?: number;
};

const createAccountabilityRequestError = (
  value: unknown,
  fallback: string
): AccountabilityRequestError => {
  const error = new Error(
    messageFromError(value, fallback)
  ) as AccountabilityRequestError;
  if (!isRecord(value)) return error;

  const code = readString(value.code, 40);
  const status = value.status;
  if (code) error.code = code;
  if (typeof status === 'number' && Number.isInteger(status)) {
    error.status = status;
  }
  return error;
};

export const accountabilityRoleCopy = (
  role: PromiseAccountabilityRole,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): { title: string; description: string; invitation: string } => {
  if (role === 'reviewer') {
    return {
      title: localise('groups.source.accountability.role.reviewer.title'),
      description: localise(
        'groups.source.accountability.role.reviewer.description'
      ),
      invitation: localise(
        'groups.source.accountability.role.reviewer.invitation'
      ),
    };
  }
  if (role === 'supporter') {
    return {
      title: localise('groups.source.accountability.role.supporter.title'),
      description: localise(
        'groups.source.accountability.role.supporter.description'
      ),
      invitation: localise(
        'groups.source.accountability.role.supporter.invitation'
      ),
    };
  }
  return {
    title: localise('groups.source.accountability.role.partner.title'),
    description: localise(
      'groups.source.accountability.role.partner.description'
    ),
    invitation: localise(
      'groups.source.accountability.role.partner.invitation'
    ),
  };
};

export const accountabilityOwnerConsequence = (
  role: PromiseAccountabilityRole,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): string => accountabilityRoleCopy(role, localise).description;

export const accountabilityOwnerInviteAction = (
  _role: PromiseAccountabilityRole,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): string => localise('groups.source.accountability.invite.prepare_action');

export const accountabilityInviteRoleCopy = (
  role: PromiseAccountabilityRole,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): { title: string; description: string; action: string } => {
  if (role === 'reviewer') {
    return {
      title: localise(
        'groups.source.accountability.role.reviewer.invitee_title'
      ),
      description: localise(
        'groups.source.accountability.role.reviewer.invitee_description'
      ),
      action: localise(
        'groups.source.accountability.role.reviewer.invitee_action'
      ),
    };
  }
  if (role === 'supporter') {
    return {
      title: localise(
        'groups.source.accountability.role.supporter.invitee_title'
      ),
      description: localise(
        'groups.source.accountability.role.supporter.invitee_description'
      ),
      action: localise(
        'groups.source.accountability.role.supporter.invitee_action'
      ),
    };
  }
  return {
    title: localise('groups.source.accountability.role.partner.invitee_title'),
    description: localise(
      'groups.source.accountability.role.partner.invitee_description'
    ),
    action: localise(
      'groups.source.accountability.role.partner.invitee_action'
    ),
  };
};

export const accountabilityInviteHeading = (
  _role: PromiseAccountabilityRole,
  inviter: string,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): string =>
  localise('groups.source.accountability.join_promise.invited_by', { inviter });

export const accountabilityInviteMeaning = (
  role: PromiseAccountabilityRole,
  _promise: string,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): string => accountabilityInviteRoleCopy(role, localise).description;

export const accountabilityInviteContinueLabel = (
  _role: PromiseAccountabilityRole,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): string => localise('groups.source.accountability.join_promise.review_join');

export const accountabilityInviteAcceptLabel = (
  role: PromiseAccountabilityRole,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): string => accountabilityInviteRoleCopy(role, localise).action;

export const buildPromiseAccountabilityShareMessage = ({
  challengeTitle,
  code,
  role,
  shareUrl,
  localise = defaultTranslate,
}: {
  challengeTitle: string;
  code: string;
  role: PromiseAccountabilityRole;
  shareUrl: string;
  localise?: PromiseAccountabilityTranslator;
}): string => {
  const roleCopy = accountabilityRoleCopy(role, localise);
  return localise('groups.source.accountability.share.message', {
    promise: challengeTitle,
    invitation: roleCopy.invitation,
    shareUrl,
    code,
  });
};

const decodeMember = (value: unknown): PromiseAccountabilityMember | null => {
  if (!isRecord(value)) return null;
  const id = readUuid(value.id);
  const name = readString(value.name, 120);
  const avatarUrl = readNullableString(value.avatar_url, 500);
  const role = readMemberRole(value.role);
  if (
    !id ||
    !name ||
    avatarUrl === undefined ||
    !role ||
    typeof value.participates !== 'boolean'
  ) {
    return null;
  }
  return {
    id,
    name,
    avatarUrl,
    role,
    participates: value.participates,
    proofStatus: readProofStatus(value.proof_status),
  };
};

export const decodePromiseAccountabilitySummary = (
  value: unknown
): PromiseAccountabilitySummary | null => {
  if (
    !isRecord(value) ||
    value.success !== true ||
    value.result_code !== 'PROMISE_ACCOUNTABILITY_V1' ||
    !isRecord(value.promise) ||
    !Array.isArray(value.members)
  ) {
    return null;
  }

  const promiseId = readUuid(value.promise.id);
  const title = readString(value.promise.title, 200);
  const description = readNullableString(value.promise.description);
  const verificationDescription = readNullableString(
    value.promise.verification_description
  );
  const duration =
    value.promise.duration === null
      ? null
      : typeof value.promise.duration === 'number' &&
          Number.isInteger(value.promise.duration) &&
          value.promise.duration > 0
        ? value.promise.duration
        : undefined;
  const members = value.members.map(decodeMember);
  const acceptedCount = value.accepted_count;

  if (
    !promiseId ||
    !title ||
    description === undefined ||
    verificationDescription === undefined ||
    duration === undefined ||
    typeof value.promise.allow_self_review !== 'boolean' ||
    members.some(member => member === null) ||
    typeof acceptedCount !== 'number' ||
    !Number.isInteger(acceptedCount) ||
    acceptedCount < 0 ||
    typeof value.is_shared !== 'boolean' ||
    typeof value.can_invite !== 'boolean'
  ) {
    return null;
  }

  let group: PromiseAccountabilitySummary['group'] = null;
  if (value.group !== null) {
    if (!isRecord(value.group)) return null;
    const groupId = readUuid(value.group.id);
    const groupName = readString(value.group.name, 100);
    const groupKind = value.group.kind;
    if (
      !groupId ||
      !groupName ||
      (groupKind !== 'saved' && groupKind !== 'promise')
    ) {
      return null;
    }
    group = { id: groupId, name: groupName, kind: groupKind };
  }

  let invite: PromiseAccountabilitySummary['invite'] = null;
  if (value.invite !== null) {
    if (!isRecord(value.invite)) return null;
    const code = readString(value.invite.code, 32)?.toUpperCase() ?? null;
    const role = readRole(value.invite.role);
    const expiresAt = readNullableString(value.invite.expires_at, 60);
    if (
      !code ||
      !INVITE_PATTERN.test(code) ||
      !role ||
      expiresAt === undefined
    ) {
      return null;
    }
    invite = { code, role, expiresAt };
  }

  return {
    promise: {
      id: promiseId,
      title,
      description,
      verificationDescription,
      duration,
      allowSelfReview: value.promise.allow_self_review,
    },
    group,
    members: members as PromiseAccountabilityMember[],
    acceptedCount,
    isShared: value.is_shared,
    canInvite: value.can_invite,
    invite,
  };
};

export const fetchPromiseAccountability = async (
  challengeId: string,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): Promise<PromiseAccountabilitySummary> => {
  const readSummary = () =>
    withTimeout(
      Promise.resolve(
        supabase.rpc('get_promise_accountability_v1', {
          p_challenge_id: challengeId,
        })
      ),
      ACCOUNTABILITY_RPC_TIMEOUT_MS,
      'get_promise_accountability_v1'
    );

  let response = await readSummary();
  // A Supabase access token can expire while RootLayout is handing the user
  // into this route. Refresh once for an auth response, then make one bounded
  // retry with the new session. Reusing the same rejected token would leave
  // the destination looking like an endless loader.
  if (response.error && isAuthExpiryError(response.error)) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError) response = await readSummary();
  }
  const { data, error } = response;
  if (error) {
    throw createAccountabilityRequestError(
      error,
      localise('groups.source.accountability.error.people_load')
    );
  }
  const summary = decodePromiseAccountabilitySummary(data);
  if (!summary) {
    throw new Error(
      localise('groups.source.accountability.error.people_incomplete')
    );
  }
  return summary;
};

export const loadPromiseAccountabilityInvitePreview = async (
  code: string,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): Promise<PromiseAccountabilityInvitePreviewResult> => {
  const { data, error } = await withTimeout(
    Promise.resolve(
      supabase.rpc('get_promise_accountability_invite_preview_v1', {
        p_invite_code: code,
      })
    ),
    ACCOUNTABILITY_RPC_TIMEOUT_MS,
    'get_promise_accountability_invite_preview_v1'
  );
  if (error) {
    return {
      kind: 'retry',
      message: messageFromError(
        error,
        localise('groups.source.accountability.error.invite_check')
      ),
    };
  }
  if (
    isRecord(data) &&
    data.success === false &&
    data.code === 'INVITE_UNAVAILABLE'
  ) {
    return {
      kind: 'terminal',
      message: localise(
        'groups.source.accountability.error.invite_unavailable'
      ),
    };
  }
  if (!isRecord(data) || data.success !== true || !isRecord(data.preview)) {
    return {
      kind: 'retry',
      message: localise('groups.source.accountability.error.invite_verify'),
    };
  }
  const title = readString(data.preview.promise_title, 200);
  const description = readNullableString(data.preview.promise_description);
  const proofRule = readNullableString(data.preview.proof_rule);
  const role = readRole(data.preview.role);
  const inviterName = readString(data.preview.inviter_name, 120);
  const durationDays =
    data.preview.duration_days === null
      ? null
      : typeof data.preview.duration_days === 'number' &&
          Number.isInteger(data.preview.duration_days) &&
          data.preview.duration_days > 0
        ? data.preview.duration_days
        : undefined;
  if (
    !title ||
    description === undefined ||
    proofRule === undefined ||
    !role ||
    !inviterName ||
    durationDays === undefined
  ) {
    return {
      kind: 'retry',
      message: localise('groups.source.accountability.error.invite_incomplete'),
    };
  }
  return {
    kind: 'ready',
    preview: {
      promiseTitle: title,
      promiseDescription: description,
      proofRule,
      durationDays,
      role,
      inviterName,
    },
  };
};

export const fetchPromiseAccountabilityInvitePreview = async (
  code: string,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): Promise<PromiseAccountabilityInvitePreview> => {
  const result = await loadPromiseAccountabilityInvitePreview(code, localise);
  if (result.kind === 'ready') return result.preview;
  throw new Error(result.message);
};

type EnsureResponse = {
  success?: boolean;
  error?: string;
  promise?: { id?: string; title?: string };
  group?: { id?: string; kind?: string };
  group_name?: string;
  invite_role?: string;
};

type GenerateInviteResponse = {
  success?: boolean;
  code?: string;
  challengeId?: string;
  challengeTitle?: string;
  error?: string;
};

export const preparePromiseAccountabilityInvite = async ({
  challengeId,
  role,
  localise = defaultTranslate,
}: {
  challengeId: string;
  role: PromiseAccountabilityRole;
  localise?: PromiseAccountabilityTranslator;
}): Promise<PreparedPromiseAccountabilityInvite> => {
  const { data: ensuredValue, error: ensureError } = await withTimeout(
    Promise.resolve(
      supabase.rpc('ensure_promise_accountability_v1', {
        p_challenge_id: challengeId,
        p_role: role,
      })
    ),
    ACCOUNTABILITY_RPC_TIMEOUT_MS,
    'ensure_promise_accountability_v1'
  );
  if (ensureError) {
    throw createAccountabilityRequestError(
      ensureError,
      localise('groups.source.accountability.error.prepare')
    );
  }

  const ensured = ensuredValue as EnsureResponse | null;
  if (ensured?.success !== true) {
    throw new Error(
      ensured?.error === 'PROMISE_INACTIVE'
        ? localise('groups.source.accountability.error.promise_inactive')
        : ensured?.error === 'PUBLIC_PROMISE_USES_GROUP_INVITE'
          ? localise(
              'groups.source.accountability.error.public_uses_group_invite'
            )
          : ensured?.error === 'USE_SAVED_GROUP_INVITE'
            ? localise('groups.source.accountability.error.saved_group_owns', {
                group:
                  readString(ensured.group_name, 100) ??
                  localise(
                    'groups.source.accountability.error.saved_group_fallback'
                  ),
              })
            : localise('groups.source.accountability.error.prepare')
    );
  }

  const promiseId = readUuid(ensured.promise?.id);
  const promiseTitle = readString(ensured.promise?.title, 200);
  const groupId = readUuid(ensured.group?.id);
  const groupKind = ensured.group?.kind;
  if (
    promiseId !== challengeId ||
    !promiseTitle ||
    !groupId ||
    (groupKind !== 'saved' && groupKind !== 'promise') ||
    ensured.invite_role !== role
  ) {
    throw new Error(
      localise('groups.source.accountability.error.setup_unconfirmed')
    );
  }

  const { data: beginValue, error: beginError } = await withTimeout(
    Promise.resolve(
      supabase.rpc('begin_promise_accountability_invite_v1', {
        p_challenge_id: challengeId,
        p_role: role,
      })
    ),
    ACCOUNTABILITY_RPC_TIMEOUT_MS,
    'begin_promise_accountability_invite_v1'
  );
  const beginReceipt = isRecord(beginValue) ? beginValue : null;
  if (
    beginError ||
    beginReceipt?.success !== true ||
    beginReceipt.role !== role
  ) {
    throw createAccountabilityRequestError(
      beginError,
      localise('groups.source.accountability.error.role_unconfirmed')
    );
  }

  let code = readString(beginReceipt.invite_code, 32)?.toUpperCase() ?? null;
  if (!code) {
    const { data: generatedValue, error: generateError } = await withTimeout(
      Promise.resolve(
        supabase.functions.invoke<GenerateInviteResponse>(
          'generate-challenge-invite',
          { body: { challengeId, forceNew: true } }
        )
      ),
      ACCOUNTABILITY_RPC_TIMEOUT_MS,
      'generate-challenge-invite'
    );
    if (generateError || generatedValue?.success !== true) {
      throw createAccountabilityRequestError(
        generateError ?? generatedValue,
        localise('groups.source.accountability.error.link_unavailable')
      );
    }
    code = readString(generatedValue.code, 32)?.toUpperCase() ?? null;
  }

  if (!code || !INVITE_PATTERN.test(code)) {
    throw new Error(
      localise('groups.source.accountability.error.invalid_code')
    );
  }

  const { data: roleValue, error: roleError } = await withTimeout(
    Promise.resolve(
      supabase.rpc('set_promise_accountability_invite_role_v1', {
        p_challenge_id: challengeId,
        p_invite_code: code,
        p_role: role,
      })
    ),
    ACCOUNTABILITY_RPC_TIMEOUT_MS,
    'set_promise_accountability_invite_role_v1'
  );
  const roleReceipt = isRecord(roleValue) ? roleValue : null;
  if (
    roleError ||
    roleReceipt?.success !== true ||
    roleReceipt.role !== role ||
    roleReceipt.invite_code !== code
  ) {
    throw createAccountabilityRequestError(
      roleError,
      localise('groups.source.accountability.error.role_attach')
    );
  }

  return {
    challengeId,
    challengeTitle: promiseTitle,
    groupId,
    groupKind,
    code,
    role,
    shareUrl: buildInviteShareUrl('challenge', code),
  };
};

export const managePromiseAccountabilityMember = async ({
  challengeId,
  memberId,
  role,
  localise = defaultTranslate,
}: {
  challengeId: string;
  memberId: string;
  role: PromiseAccountabilityRole | null;
  localise?: PromiseAccountabilityTranslator;
}): Promise<void> => {
  const { data, error } = await supabase.rpc(
    'manage_promise_accountability_member_v1',
    {
      p_challenge_id: challengeId,
      p_member_id: memberId,
      p_remove: role === null,
      p_role: role,
    }
  );
  const receipt = isRecord(data) ? data : null;
  if (error || receipt?.success !== true) {
    throw new Error(
      messageFromError(
        error,
        localise('groups.source.accountability.error.member_update')
      )
    );
  }
};

export const attemptLeavePromiseAccountability = async (
  challengeId: string,
  clientEventId: string = createClientEventId(),
  localise: PromiseAccountabilityTranslator = defaultTranslate
): Promise<PromiseMutationResult> => {
  const request = {
    operation: 'leave' as const,
    challengeId,
    clientEventId,
  };
  const v2Attempt = await submitReceiptBoundPromiseMutation(request, localise);
  if (v2Attempt.contract === 'available') return v2Attempt.result;

  // The v1 response is authoritative when it returns, but it has no durable
  // idempotency receipt. Keep it only as an installed-backend compatibility
  // path and never use it as a status check after response loss.
  const { data, error } = await supabase.rpc(
    'leave_promise_accountability_v1',
    { p_challenge_id: challengeId }
  );
  const receipt = isRecord(data) ? data : null;

  if (error) {
    return unknownPromiseMutation({
      ...request,
      message: messageFromError(
        error,
        localise('groups.source.accountability.error.leave_unconfirmed')
      ),
    });
  }

  if (receipt?.success === false) {
    return failedPromiseMutation({
      ...request,
      code: readString(receipt.error) ?? 'LEAVE_REJECTED',
      message:
        receipt.error === 'OWNER_CANNOT_LEAVE'
          ? localise('groups.source.accountability.people.leave_failed_title')
          : localise('groups.source.accountability.error.leave_unconfirmed'),
    });
  }

  if (
    receipt?.success !== true ||
    receipt.result_code !== 'PROMISE_ACCOUNTABILITY_LEFT_V1' ||
    receipt.challenge_id !== challengeId
  ) {
    return unknownPromiseMutation({
      ...request,
      code: 'RECEIPT_MISMATCH',
      message: localise('groups.source.accountability.error.leave_unconfirmed'),
    });
  }

  return confirmedPromiseMutation({
    operation: 'leave',
    challengeId,
    clientEventId: null,
    code: 'PROMISE_ACCOUNTABILITY_LEFT_V1',
    message: localise('groups.source.accountability.people.leave_confirm'),
    receiptId: `legacy-role:${challengeId}:${readString(receipt.role) ?? 'member'}`,
  });
};

export const leavePromiseAccountability = async (
  challengeId: string,
  localise: PromiseAccountabilityTranslator = defaultTranslate,
  clientEventId: string = createClientEventId()
): Promise<PromiseMutationResult> =>
  attemptLeavePromiseAccountability(challengeId, clientEventId, localise);

export const reconcilePromiseAccountabilityLeave = async (
  challengeId: string,
  clientEventId: string,
  localise: PromiseAccountabilityTranslator = defaultTranslate
): Promise<PromiseMutationResult> => {
  const request = {
    operation: 'leave' as const,
    challengeId,
    clientEventId,
  };
  const attempt = await readReceiptBoundPromiseMutationStatus(
    request,
    localise
  );
  return attempt.contract === 'available'
    ? attempt.result
    : unknownPromiseMutation({
        ...request,
        code: 'STATUS_CONTRACT_UNAVAILABLE',
        message: localise('todayProof.promise.leave_check_unavailable'),
      });
};

export const leavePromiseWithRoleAwareFallback = async ({
  challengeId,
  userId,
  clientEventId = createClientEventId(),
  leaveLegacy,
  localise = defaultTranslate,
}: {
  challengeId: string;
  userId: string;
  clientEventId?: string;
  leaveLegacy: (
    userId: string,
    challengeId: string
  ) => Promise<PromiseMutationResult>;
  localise?: PromiseAccountabilityTranslator;
}): Promise<PromiseMutationResult> => {
  const outcome = await attemptLeavePromiseAccountability(
    challengeId,
    clientEventId,
    localise
  );
  if (outcome.outcome !== 'failed' || outcome.code !== 'ROLE_NOT_FOUND') {
    return outcome;
  }

  return leaveLegacy(userId, challengeId);
};
