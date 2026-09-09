import {
  parseAccountDeletionCommit,
  parseAccountDeletionPreparation,
} from '../ownership-guard.ts';

const CLIENT_EVENT_ID = '11111111-1111-4111-8111-111111111111';

describe('account deletion ownership guard receipts', () => {
  it('accepts a matching ready preparation without exposing group identity', () => {
    expect(
      parseAccountDeletionPreparation(
        {
          account_deleted: false,
          client_event_id: CLIENT_EVENT_ID,
          code: 'ACCOUNT_DELETION_READY',
          expires_at: '2026-09-01T03:10:00.000Z',
          idempotent: false,
          state: 'ready',
        },
        CLIENT_EVENT_ID
      )
    ).toEqual({
      accountDeleted: false,
      code: 'ACCOUNT_DELETION_READY',
      state: 'ready',
    });
  });

  it('keeps a shared-group blocker typed and privacy-safe', () => {
    expect(
      parseAccountDeletionPreparation(
        {
          account_deleted: false,
          code: 'OWNED_GROUP_HAS_OTHER_MEMBERS',
          state: 'blocked',
        },
        CLIENT_EVENT_ID
      )
    ).toEqual({
      accountDeleted: false,
      code: 'OWNED_GROUP_HAS_OTHER_MEMBERS',
      state: 'blocked',
    });
  });

  it('rejects a mismatched or malformed preparation as unknown', () => {
    expect(
      parseAccountDeletionPreparation(
        {
          account_deleted: false,
          client_event_id: '22222222-2222-4222-8222-222222222222',
          code: 'ACCOUNT_DELETION_READY',
          expires_at: '2026-09-01T03:10:00.000Z',
          idempotent: false,
          state: 'ready',
        },
        CLIENT_EVENT_ID
      )
    ).toBeNull();
  });

  it('accepts only the matching confirmed profile-deletion receipt', () => {
    expect(
      parseAccountDeletionCommit(
        {
          account_deleted: true,
          client_event_id: CLIENT_EVENT_ID,
          code: 'ACCOUNT_PROFILE_DELETED',
          state: 'confirmed',
        },
        CLIENT_EVENT_ID
      )
    ).toEqual({
      accountDeleted: true,
      code: 'ACCOUNT_PROFILE_DELETED',
      state: 'confirmed',
    });

    expect(
      parseAccountDeletionCommit(
        {
          account_deleted: true,
          client_event_id: '22222222-2222-4222-8222-222222222222',
          code: 'ACCOUNT_PROFILE_DELETED',
          state: 'confirmed',
        },
        CLIENT_EVENT_ID
      )
    ).toBeNull();
  });
});
