import {
  accountabilityRoleCopy,
  buildPromiseAccountabilityShareMessage,
  decodePromiseAccountabilitySummary,
  fetchPromiseAccountability,
  resolveAccountabilityShareTitle,
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
const mockRefreshSession = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: { refreshSession: () => mockRefreshSession() },
  },
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
    mockRefreshSession.mockReset();
  });

  it.each([
    ['AUTH_REQUIRED', 401, 'todayProof.residual.sign_in_again'],
    [
      'PROMISE_NOT_FOUND',
      404,
      'todayProof.residual.menta_could_not_confirm_that_this_account_can_open_the_promise_a',
    ],
  ] as const)(
    'preserves the %s denial with localized recovery guidance',
    async (code, status, key) => {
      mockRpc.mockResolvedValue({
        data: { success: false, error: code },
        error: null,
      });
      const localise = (key: Parameters<typeof translate>[1]) =>
        translate('de-DE', key);

      await expect(
        fetchPromiseAccountability(PROMISE_ID, localise)
      ).rejects.toMatchObject({
        code,
        status,
        message: localise(key),
      });
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRefreshSession).not.toHaveBeenCalled();
    }
  );

  it.each([
    { success: true, result_code: 'PROMISE_ACCOUNTABILITY_V1' },
    { success: false, error: 'UNEXPECTED_SERVER_FAILURE' },
    { success: true, error: 'AUTH_REQUIRED' },
  ])('keeps malformed and unexpected responses actionable: %j', async data => {
    mockRpc.mockResolvedValue({ data, error: null });
    await expect(fetchPromiseAccountability(PROMISE_ID)).rejects.toThrow(
      'Menta returned incomplete promise accountability details.'
    );
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it('refreshes an expired token only once and preserves a subsequent server denial', async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST301', status: 401 },
      })
      .mockResolvedValueOnce({
        data: { success: false, error: 'AUTH_REQUIRED' },
        error: null,
      });
    mockRefreshSession.mockResolvedValue({ error: null });

    await expect(fetchPromiseAccountability(PROMISE_ID)).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
      status: 401,
    });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it('allows an explicit retry after access is restored without inventing a success', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { success: false, error: 'PROMISE_NOT_FOUND' },
      error: null,
    });
    await expect(fetchPromiseAccountability(PROMISE_ID)).rejects.toMatchObject({
      code: 'PROMISE_NOT_FOUND',
    });

    mockRpc.mockResolvedValueOnce({
      error: null,
      data: {
        success: true,
        result_code: 'PROMISE_ACCOUNTABILITY_V1',
        promise: {
          id: PROMISE_ID,
          title: 'Walk after work',
          description: null,
          verification_description: null,
          duration: null,
          allow_self_review: false,
        },
        group: null,
        members: [],
        accepted_count: 0,
        is_shared: false,
        can_invite: false,
        invite: null,
      },
    });
    await expect(fetchPromiseAccountability(PROMISE_ID)).resolves.toMatchObject(
      { promise: { id: PROMISE_ID }, members: [], canInvite: false }
    );
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it('retains the transport error if token refresh fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST301', status: 401 },
    });
    mockRefreshSession.mockResolvedValue({
      error: new Error('Session revoked'),
    });
    await expect(fetchPromiseAccountability(PROMISE_ID)).rejects.toMatchObject({
      code: 'PGRST301',
      status: 401,
    });
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
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
    expect(resolveAccountabilityShareTitle('Walk after work')).toBe(
      'Join Walk after work'
    );
    expect(
      buildPromiseAccountabilityShareMessage({
        challengeTitle: 'Walk after work',
        code: 'ABCD1234',
        role: 'supporter',
        shareUrl: 'https://menta.quest/join/challenge/ABCD1234',
      })
    ).toContain('support progress');
  });

  it('names a blank promise without empty quotation marks', () => {
    expect(resolveAccountabilityShareTitle('   ')).toBe('Join this promise');
    expect(
      buildPromiseAccountabilityShareMessage({
        challengeTitle: '  ',
        code: 'ABCD1234',
        role: 'reviewer',
        shareUrl: 'https://menta.quest/join/challenge/ABCD1234',
      })
    ).toBe(
      'Join this promise on Menta. I’m inviting you to review proof.\n\nhttps://menta.quest/join/challenge/ABCD1234\nInvite code: ABCD1234'
    );
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

  it('keeps a rejected preview request retryable instead of retiring the invite', async () => {
    mockRpc.mockRejectedValue(new Error('Network request failed'));
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

  it('leaves out promises that have ended even while the server still says active', () => {
    const now = new Date('2026-09-25T09:00:00.000Z');
    const row = (id: string, title: string, endDate: string) => ({
      status: 'active',
      challenges: {
        id,
        title,
        status: 'active',
        completion_status: 'active',
        is_expired: false,
        end_date: endDate,
        team_challenges: [],
      },
    });

    expect(
      decodeAccountabilityPickerPromises(
        [
          row(
            PROMISE_ID,
            'Read for 20 minutes before bed',
            '2026-09-06T11:59:59Z'
          ),
          row(SAVED_PROMISE_ID, 'Walk after work', '2026-10-09T11:59:59Z'),
        ],
        now
      ).map(promise => promise.title)
    ).toEqual(['Walk after work']);
  });
});
