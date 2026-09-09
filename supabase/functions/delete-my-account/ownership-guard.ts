type JsonRecord = Record<string, unknown>;

export type AccountDeletionPreparation =
  | {
      accountDeleted: false;
      code: 'ACCOUNT_DELETION_READY';
      state: 'ready';
    }
  | {
      accountDeleted: false;
      code: 'OWNED_GROUP_HAS_OTHER_MEMBERS';
      state: 'blocked';
    }
  | {
      accountDeleted: false;
      code: string;
      state: 'failed';
    };

export type AccountDeletionCommit =
  | {
      accountDeleted: true;
      code: 'ACCOUNT_PROFILE_DELETED';
      state: 'confirmed';
    }
  | {
      accountDeleted: false;
      code: 'OWNED_GROUP_HAS_OTHER_MEMBERS';
      state: 'blocked';
    }
  | {
      accountDeleted: false;
      code: string;
      state: 'failed';
    };

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasBaseFailureShape = (value: JsonRecord): boolean =>
  value.account_deleted === false && typeof value.code === 'string';

export const parseAccountDeletionPreparation = (
  value: unknown,
  expectedClientEventId: string
): AccountDeletionPreparation | null => {
  if (!isRecord(value)) return null;

  if (
    value.state === 'ready' &&
    value.code === 'ACCOUNT_DELETION_READY' &&
    value.account_deleted === false &&
    value.client_event_id === expectedClientEventId &&
    typeof value.expires_at === 'string' &&
    typeof value.idempotent === 'boolean'
  ) {
    return {
      accountDeleted: false,
      code: 'ACCOUNT_DELETION_READY',
      state: 'ready',
    };
  }

  if (
    value.state === 'blocked' &&
    value.code === 'OWNED_GROUP_HAS_OTHER_MEMBERS' &&
    value.account_deleted === false
  ) {
    return {
      accountDeleted: false,
      code: 'OWNED_GROUP_HAS_OTHER_MEMBERS',
      state: 'blocked',
    };
  }

  if (value.state === 'failed' && hasBaseFailureShape(value)) {
    return {
      accountDeleted: false,
      code: value.code as string,
      state: 'failed',
    };
  }

  return null;
};

export const parseAccountDeletionCommit = (
  value: unknown,
  expectedClientEventId: string
): AccountDeletionCommit | null => {
  if (!isRecord(value)) return null;

  if (
    value.state === 'confirmed' &&
    value.code === 'ACCOUNT_PROFILE_DELETED' &&
    value.account_deleted === true &&
    value.client_event_id === expectedClientEventId
  ) {
    return {
      accountDeleted: true,
      code: 'ACCOUNT_PROFILE_DELETED',
      state: 'confirmed',
    };
  }

  if (
    value.state === 'blocked' &&
    value.code === 'OWNED_GROUP_HAS_OTHER_MEMBERS' &&
    value.account_deleted === false
  ) {
    return {
      accountDeleted: false,
      code: 'OWNED_GROUP_HAS_OTHER_MEMBERS',
      state: 'blocked',
    };
  }

  if (value.state === 'failed' && hasBaseFailureShape(value)) {
    return {
      accountDeleted: false,
      code: value.code as string,
      state: 'failed',
    };
  }

  return null;
};
