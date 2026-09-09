import {
  decodeGuestGroupInvitePreviewResponse,
  decodeGroupInvitePreviewFailure,
  decodeGroupInvitePreviewResponse,
  decodeGroupInviteResponse,
  isGuestGroupInvitePreviewUnavailable,
} from '../group-invite-contract';

describe('group invite response contract', () => {
  it('decodes a stable active invite', () => {
    expect(
      decodeGroupInviteResponse({
        success: true,
        code: 'abcd2345',
        replaced: false,
        previous_code_invalidated: false,
      })
    ).toEqual({
      code: 'ABCD2345',
      replaced: false,
      previousCodeInvalidated: false,
    });
  });

  it('decodes a replacement receipt', () => {
    expect(
      decodeGroupInviteResponse({
        success: true,
        code: 'PQRS6789',
        replaced: true,
        previous_code_invalidated: true,
      })
    ).toEqual({
      code: 'PQRS6789',
      replaced: true,
      previousCodeInvalidated: true,
    });
  });

  it('accepts the secure 26-character code returned by the live generator', () => {
    expect(
      decodeGroupInviteResponse({
        success: true,
        code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23',
        replaced: false,
        previous_code_invalidated: false,
      })
    ).toEqual({
      code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23',
      replaced: false,
      previousCodeInvalidated: false,
    });
  });

  it.each([
    null,
    {},
    { success: true, code: 'I0O1', replaced: false },
    {
      success: true,
      code: 'ABCD2345',
      replaced: 'yes',
      previous_code_invalidated: false,
    },
  ])('rejects malformed server data', value => {
    expect(decodeGroupInviteResponse(value)).toBeNull();
  });
});

describe('non-consuming group invite preview contract', () => {
  const previewEnvelope = (overrides: Record<string, unknown> = {}) => ({
    success: true,
    operation: 'GROUP_INVITE_PREVIEW',
    code: 'PREVIEW_READY',
    preview: {
      status: 'ACTIVE',
      invite_code: 'ABCD2345',
      group_id: 'group-1',
      group_name: 'Morning Miles',
      group_description: 'Walk before work',
      privacy: 'private',
      member_count: 4,
      inviter_name: 'Maya',
      shared_promise: 'Walk for 20 minutes',
      expires_at: null,
      is_member: false,
      ...overrides,
    },
  });

  it('strictly decodes an active preview without a join receipt', () => {
    expect(decodeGroupInvitePreviewResponse(previewEnvelope())).toEqual({
      status: 'ACTIVE',
      inviteCode: 'ABCD2345',
      groupId: 'group-1',
      groupName: 'Morning Miles',
      groupDescription: 'Walk before work',
      privacy: 'private',
      memberCount: 4,
      inviterName: 'Maya',
      sharedPromise: 'Walk for 20 minutes',
      expiresAt: null,
      isMember: false,
    });
  });

  it.each(['EXPIRED', 'GROUP_INACTIVE'] as const)(
    'keeps %s distinct from an active invite',
    status => {
      expect(
        decodeGroupInvitePreviewResponse(previewEnvelope({ status }))
      ).toMatchObject({ status, isMember: false });
    }
  );

  it.each(['REPLACED', 'NOT_FOUND'] as const)(
    'accepts a non-leaking %s response',
    status => {
      expect(
        decodeGroupInvitePreviewResponse(
          previewEnvelope({
            status,
            group_id: null,
            group_name: null,
            group_description: null,
            privacy: null,
            member_count: 0,
            inviter_name: null,
            shared_promise: null,
          })
        )
      ).toMatchObject({ status, groupId: null, groupName: null });
    }
  );

  it('keeps already-member preview idempotent and navigable', () => {
    expect(
      decodeGroupInvitePreviewResponse(
        previewEnvelope({ status: 'ALREADY_MEMBER', is_member: true })
      )
    ).toMatchObject({
      status: 'ALREADY_MEMBER',
      groupId: 'group-1',
      isMember: true,
    });
  });

  it.each([
    null,
    {},
    previewEnvelope({ member_count: '4' }),
    previewEnvelope({ status: 'ACTIVE', is_member: true }),
    previewEnvelope({ status: 'NOT_FOUND', group_id: 'group-1' }),
    previewEnvelope({ expires_at: 'not-a-date' }),
  ])('rejects malformed or contradictory preview JSON', value => {
    expect(decodeGroupInvitePreviewResponse(value)).toBeNull();
  });

  it.each(['AUTH_REQUIRED', 'AUTH_SESSION_REVOKED', 'INVALID_CODE'] as const)(
    'decodes the bounded %s failure',
    code => {
      expect(
        decodeGroupInvitePreviewFailure({
          success: false,
          operation: 'GROUP_INVITE_PREVIEW',
          code,
        })
      ).toBe(code);
    }
  );
});

describe('guest group invite preview contract', () => {
  const activeEnvelope = (previewOverrides: Record<string, unknown> = {}) => ({
    success: true,
    operation: 'GROUP_INVITE_GUEST_PREVIEW',
    code: 'PREVIEW_READY',
    preview: {
      group_name: 'Morning Miles',
      inviter_name: 'Maya',
      shared_promise: 'Walk for 20 minutes',
      expires_at: '2026-09-01T00:00:00.000Z',
      ...previewOverrides,
    },
  });

  it('decodes only the limited guest-visible invitation facts', () => {
    expect(decodeGuestGroupInvitePreviewResponse(activeEnvelope())).toEqual({
      status: 'ACTIVE',
      groupName: 'Morning Miles',
      inviterName: 'Maya',
      sharedPromise: 'Walk for 20 minutes',
      expiresAt: '2026-09-01T00:00:00.000Z',
    });
  });

  it('accepts a bounded public or private visibility consequence when supplied', () => {
    expect(
      decodeGuestGroupInvitePreviewResponse(
        activeEnvelope({ privacy: 'private' })
      )
    ).toMatchObject({ privacy: 'private' });
    expect(
      decodeGuestGroupInvitePreviewResponse(
        activeEnvelope({ privacy: 'secret' })
      )
    ).toBeNull();
  });

  it('accepts the one non-leaking unavailable envelope', () => {
    expect(
      isGuestGroupInvitePreviewUnavailable({
        success: false,
        operation: 'GROUP_INVITE_GUEST_PREVIEW',
        code: 'UNAVAILABLE',
      })
    ).toBe(true);
  });

  it.each([
    activeEnvelope({ group_name: null }),
    activeEnvelope({ expires_at: 'not-a-date' }),
    activeEnvelope({ group_id: 'group-1' }),
    activeEnvelope({ member_count: 4 }),
    {
      ...activeEnvelope(),
      membership_receipt: { joined: true },
    },
  ])('rejects malformed or over-disclosing guest data', value => {
    expect(decodeGuestGroupInvitePreviewResponse(value)).toBeNull();
  });

  it('rejects unavailable envelopes that include leaked preview data', () => {
    expect(
      isGuestGroupInvitePreviewUnavailable({
        success: false,
        operation: 'GROUP_INVITE_GUEST_PREVIEW',
        code: 'UNAVAILABLE',
        preview: { group_name: 'Should not be here' },
      })
    ).toBe(false);
  });
});
