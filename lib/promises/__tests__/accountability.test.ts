import {
  accountabilityRoleCopy,
  buildPromiseAccountabilityShareMessage,
  decodePromiseAccountabilitySummary,
  leavePromiseWithRoleAwareFallback,
  loadPromiseAccountabilityInvitePreview,
} from '@/lib/promises/accountability';
import { translate } from '@/lib/localization';
import {
  decodeAccountabilityPickerPromises,
  getAccountabilityPickerDestination,
  getAccountabilityPickerHintKey,
} from '@/lib/promises/accountability-picker';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const USER_ID = '01234567-89ab-4def-8123-456789abcdef';
const PROMISE_ID = '11234567-89ab-4def-8123-456789abcdef';
const SAVED_PROMISE_ID = '21234567-89ab-4def-8123-456789abcdef';
const SAVED_GROUP_ID = '31234567-89ab-4def-8123-456789abcdef';
const PROMISE_GROUP_ID = '41234567-89ab-4def-8123-456789abcdef';
const CLIENT_EVENT_ID = '51234567-89ab-4def-8123-456789abcdef';

describe('promise accountability contract', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('decodes a promise that is still private while an invitation is pending', () => {
    expect(
      decodePromiseAccountabilitySummary({
        success: true,
        result_code: 'PROMISE_ACCOUNTABILITY_V1',
        promise: {
          id: PROMISE_ID,
          title: 'Walk after work',
          description: 'Walk for 20 minutes',
          verification_description: 'Add one note',
          duration: 14,
          allow_self_review: false,
        },
        group: {
          id: '21234567-89ab-4def-8123-456789abcdef',
          name: 'Walk after work',
          kind: 'promise',
        },
        members: [
          {
            id: USER_ID,
            name: 'Daniel',
            avatar_url: null,
            role: 'owner',
            participates: true,
            proof_status: 'none',
          },
        ],
        accepted_count: 0,
        is_shared: false,
        can_invite: true,
        invite: {
          code: 'ABCD1234',
          role: 'reviewer',
          expires_at: null,
        },
      })
    ).toMatchObject({
      acceptedCount: 0,
      isShared: false,
      invite: { role: 'reviewer' },
    });
  });

  it('keeps role promises distinct in copy and sharing', () => {
    expect(accountabilityRoleCopy('partner').title).toBe('Do it together');
    expect(accountabilityRoleCopy('reviewer').title).toBe('Review my proof');
    expect(accountabilityRoleCopy('supporter').title).toBe('Support me');
    expect(
      buildPromiseAccountabilityShareMessage({
        challengeTitle: 'Walk after work',
        code: 'ABCD1234',
        role: 'supporter',
        shareUrl: 'https://menta.quest/join/challenge/ABCD1234',
      })
    ).toContain('support progress');
  });

  it('uses the injected locale for role and complete share-message copy', () => {
    const localise = (
      key: Parameters<typeof translate>[1],
      values?: Parameters<typeof translate>[2]
    ) => translate('de-DE', key, values);

    expect(accountabilityRoleCopy('reviewer', localise).title).toBe(
      'Meinen Nachweis prüfen'
    );
    expect(
      buildPromiseAccountabilityShareMessage({
        challengeTitle: 'Nach der Arbeit spazieren',
        code: 'ABCD1234',
        role: 'reviewer',
        shareUrl: 'https://menta.quest/join/challenge/ABCD1234',
        localise,
      })
    ).toBe(
      'Mach bei „Nach der Arbeit spazieren“ in Menta mit. Ich lade dich dazu ein, meinen Nachweis zu prüfen.\n\nhttps://menta.quest/join/challenge/ABCD1234\nEinladungscode: ABCD1234'
    );
  });

  it('rejects incomplete member authority data', () => {
    expect(
      decodePromiseAccountabilitySummary({
        success: true,
        result_code: 'PROMISE_ACCOUNTABILITY_V1',
        promise: { id: PROMISE_ID, title: 'Walk after work' },
        members: [],
      })
    ).toBeNull();
  });

  it('treats a server-confirmed unavailable invite as terminal without guessing why', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, code: 'INVITE_UNAVAILABLE' },
      error: null,
    });

    await expect(
      loadPromiseAccountabilityInvitePreview('ABCD1234')
    ).resolves.toEqual({
      kind: 'terminal',
      message:
        'This promise invitation is no longer available. It may have expired or already been used.',
    });
  });

  it('keeps a transport failure retryable so the saved invite is not discarded', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Connection unavailable' },
    });

    await expect(
      loadPromiseAccountabilityInvitePreview('ABCD1234')
    ).resolves.toEqual({
      kind: 'retry',
      message: 'Menta could not check this promise invitation.',
    });
  });

  it('uses the role-aware leave receipt without calling the legacy mutation', async () => {
    const leaveLegacy = jest.fn();
    mockRpc.mockResolvedValue({
      data: {
        operation: 'PROMISE_ACCOUNTABILITY_LEAVE',
        outcome: 'confirmed',
        code: 'LEAVE_CONFIRMED',
        message: 'You left this promise.',
        challenge_id: PROMISE_ID,
        client_event_id: CLIENT_EVENT_ID,
        receipt: {
          receipt_id: CLIENT_EVENT_ID,
          challenge_id: PROMISE_ID,
          client_event_id: CLIENT_EVENT_ID,
          previous_role: 'partner',
        },
      },
      error: null,
    });

    await expect(
      leavePromiseWithRoleAwareFallback({
        challengeId: PROMISE_ID,
        userId: USER_ID,
        clientEventId: CLIENT_EVENT_ID,
        leaveLegacy,
      })
    ).resolves.toMatchObject({
      outcome: 'confirmed',
      code: 'LEAVE_CONFIRMED',
      receipt: { id: CLIENT_EVENT_ID },
    });
    expect(mockRpc).toHaveBeenCalledWith('leave_promise_accountability_v2', {
      p_challenge_id: PROMISE_ID,
      p_client_event_id: CLIENT_EVENT_ID,
      p_check_only: false,
    });
    expect(leaveLegacy).not.toHaveBeenCalled();
  });

  it('falls back to the legacy leave only after ROLE_NOT_FOUND', async () => {
    const legacyResult = {
      outcome: 'confirmed' as const,
      operation: 'leave' as const,
      challengeId: PROMISE_ID,
      code: 'LEAVE_CONFIRMED',
      message: 'You left this promise.',
      receipt: {
        id: 'legacy-receipt',
        challengeId: PROMISE_ID,
        clientEventId: null,
        idempotent: false,
        verifiedBy: 'mutation-response' as const,
      },
    };
    const leaveLegacy = jest.fn().mockResolvedValue(legacyResult);
    mockRpc.mockResolvedValue({
      data: {
        operation: 'PROMISE_ACCOUNTABILITY_LEAVE',
        outcome: 'failed',
        code: 'ROLE_NOT_FOUND',
        message: 'No role found.',
        challenge_id: PROMISE_ID,
        client_event_id: CLIENT_EVENT_ID,
        safe_to_retry: false,
      },
      error: null,
    });

    await expect(
      leavePromiseWithRoleAwareFallback({
        challengeId: PROMISE_ID,
        userId: USER_ID,
        clientEventId: CLIENT_EVENT_ID,
        leaveLegacy,
      })
    ).resolves.toEqual(legacyResult);
    expect(leaveLegacy).toHaveBeenCalledWith(USER_ID, PROMISE_ID);
  });

  it('does not run the legacy leave after an unknown role-aware result', async () => {
    const leaveLegacy = jest.fn();
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(
      leavePromiseWithRoleAwareFallback({
        challengeId: PROMISE_ID,
        userId: USER_ID,
        clientEventId: CLIENT_EVENT_ID,
        leaveLegacy,
      })
    ).resolves.toMatchObject({
      outcome: 'unknown',
      code: 'RECEIPT_MISMATCH',
    });
    expect(leaveLegacy).not.toHaveBeenCalled();
  });

  it('uses v1 only when PostgREST explicitly reports that v2 is unavailable', async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST202',
          message:
            'Could not find the function public.leave_promise_accountability_v2',
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          result_code: 'PROMISE_ACCOUNTABILITY_LEFT_V1',
          challenge_id: PROMISE_ID,
          role: 'reviewer',
        },
        error: null,
      });

    const result = await leavePromiseWithRoleAwareFallback({
      challengeId: PROMISE_ID,
      userId: USER_ID,
      clientEventId: CLIENT_EVENT_ID,
      leaveLegacy: jest.fn(),
    });

    expect(result).toMatchObject({
      outcome: 'confirmed',
      code: 'PROMISE_ACCOUNTABILITY_LEFT_V1',
    });
    expect(mockRpc).toHaveBeenNthCalledWith(
      2,
      'leave_promise_accountability_v1',
      { p_challenge_id: PROMISE_ID }
    );
  });
});

describe('promise accountability picker contract', () => {
  it('decodes active private and saved-group promises from one account read', () => {
    expect(
      decodeAccountabilityPickerPromises([
        {
          status: 'active',
          challenges: {
            id: PROMISE_ID,
            title: 'Walk after work',
            status: 'active',
            completion_status: 'active',
            is_expired: false,
            team_challenges: [],
          },
        },
        {
          status: 'active',
          challenges: [
            {
              id: SAVED_PROMISE_ID,
              title: 'Read before bed',
              status: 'active',
              completion_status: 'active',
              is_expired: false,
              team_challenges: [
                {
                  group_id: PROMISE_GROUP_ID,
                  team: { id: PROMISE_GROUP_ID, kind: 'promise' },
                },
                {
                  group_id: SAVED_GROUP_ID,
                  team: [{ id: SAVED_GROUP_ID, kind: 'saved' }],
                },
              ],
            },
          ],
        },
      ])
    ).toEqual([
      {
        id: PROMISE_ID,
        title: 'Walk after work',
        groupId: null,
        groupKind: null,
      },
      {
        id: SAVED_PROMISE_ID,
        title: 'Read before bed',
        groupId: SAVED_GROUP_ID,
        groupKind: 'saved',
      },
    ]);
  });

  it('routes saved-group promises to their group and private promises to role setup', () => {
    expect(
      getAccountabilityPickerDestination({
        id: SAVED_PROMISE_ID,
        title: 'Read before bed',
        groupId: SAVED_GROUP_ID,
        groupKind: 'saved',
      })
    ).toEqual({
      pathname: '/groups/[id]',
      params: { id: SAVED_GROUP_ID },
    });

    expect(
      getAccountabilityPickerDestination({
        id: PROMISE_ID,
        title: 'Walk after work',
        groupId: null,
        groupKind: null,
      })
    ).toEqual({
      pathname: '/promise-accountability',
      params: { challengeId: PROMISE_ID },
    });

    expect(
      getAccountabilityPickerHintKey({
        id: SAVED_PROMISE_ID,
        title: 'Read before bed',
        groupId: SAVED_GROUP_ID,
        groupKind: 'saved',
      })
    ).toBe('groups.tab.list_open_hint');
    expect(
      getAccountabilityPickerHintKey({
        id: PROMISE_ID,
        title: 'Walk after work',
        groupId: null,
        groupKind: null,
      })
    ).toBe('groups.source.accountability.picker.choose_hint');
  });

  it('excludes inactive participation and ended promise records', () => {
    expect(
      decodeAccountabilityPickerPromises([
        {
          status: 'dropped',
          challenges: {
            id: PROMISE_ID,
            title: 'Dropped promise',
            status: 'active',
            completion_status: 'active',
            is_expired: false,
          },
        },
        {
          status: 'active',
          challenges: {
            id: SAVED_PROMISE_ID,
            title: 'Finished promise',
            status: 'active',
            completion_status: 'completed',
            is_expired: false,
          },
        },
      ])
    ).toEqual([]);
  });
});
