import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { useReferralStore } from '../referral-store';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

const mockRpc = supabase.rpc as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const CODE_A = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const CODE_B = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe('referral-store server authority', () => {
  let activeUserId: string | null;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    activeUserId = USER_A;
    mockGetSession.mockImplementation(async () => ({
      data: {
        session: activeUserId ? { user: { id: activeUserId } } : null,
      },
      error: null,
    }));
    useReferralStore.setState({
      userReferrals: [],
      pendingReferral: null,
      lastProcessResult: null,
      isLoading: false,
      error: null,
    });
  });

  it('normalises a pending code for activation', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() =>
      result.current.setPendingReferral(' aaaaaaaa-aaaaaaaa-aaaaaaaa-aaaaaaaa ')
    );

    expect(result.current.pendingReferral?.referralCode).toBe(CODE_A);
    expect(result.current.pendingReferral?.ownerUserId).toBeNull();
  });

  it('rejects invite-like text that is not a referral capability', () => {
    const { result } = renderHook(() => useReferralStore());

    expect(() =>
      act(() => result.current.setPendingReferral('FRIEND42'))
    ).toThrow('Referral code is invalid.');
    expect(result.current.pendingReferral).toBeNull();
  });

  it('clears only the matching account-owned pending code', () => {
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A, USER_A));

    let anonymousClear = true;
    let wrongOwnerClear = true;
    act(() => {
      anonymousClear = result.current.clearPendingReferral();
      wrongOwnerClear = result.current.clearPendingReferral(USER_B);
    });
    expect(anonymousClear).toBe(false);
    expect(wrongOwnerClear).toBe(false);
    expect(result.current.pendingReferral?.ownerUserId).toBe(USER_A);

    let ownerClear = false;
    act(() => {
      ownerClear = result.current.clearPendingReferral(USER_A);
    });
    expect(ownerClear).toBe(true);
    expect(result.current.pendingReferral).toBeNull();
  });

  it('does not let a stale route clear a newer matching-account code', () => {
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_B, USER_A));

    let staleClear = true;
    act(() => {
      staleClear = result.current.clearPendingReferral(USER_A, CODE_A);
    });
    expect(staleClear).toBe(false);
    expect(result.current.pendingReferral?.referralCode).toBe(CODE_B);

    let exactClear = false;
    act(() => {
      exactClear = result.current.clearPendingReferral(USER_A, CODE_B);
    });
    expect(exactClear).toBe(true);
    expect(result.current.pendingReferral).toBeNull();
  });

  it('lets an anonymous code be discarded or claimed once after auth', () => {
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A));

    let anonymousClear = false;
    act(() => {
      anonymousClear = result.current.clearPendingReferral();
    });
    expect(anonymousClear).toBe(true);
    expect(result.current.pendingReferral).toBeNull();

    act(() => result.current.setPendingReferral(CODE_B));
    let claimedClear = false;
    act(() => {
      claimedClear = result.current.clearPendingReferral(USER_A);
    });
    expect(claimedClear).toBe(true);
    expect(result.current.pendingReferral).toBeNull();
  });

  it("clears account state without erasing another owner's pending code", () => {
    const { result } = renderHook(() => useReferralStore());
    act(() => {
      result.current.setPendingReferral(CODE_B, USER_B);
      useReferralStore.setState({
        userReferrals: [
          {
            id: '33333333-3333-4333-8333-333333333333',
            status: 'completed',
            rewardGranted: true,
            rewardOutcome: 'rewards_granted_v2',
            inviterRewardAmount: 50,
            createdAt: '2026-08-13T00:00:00Z',
            completedAt: '2026-08-13T00:01:00Z',
          },
        ],
        isLoading: true,
        error: 'old account error',
      });
      result.current.clearState(USER_A);
    });

    expect(result.current.userReferrals).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_B,
      ownerUserId: USER_B,
    });

    act(() => result.current.clearState(USER_B));
    expect(result.current.pendingReferral).toBeNull();
  });

  it('preserves an anonymous pending code during owned account teardown', () => {
    const { result } = renderHook(() => useReferralStore());
    act(() => {
      result.current.setPendingReferral(CODE_A);
      result.current.clearState(USER_A);
    });

    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_A,
      ownerUserId: null,
    });

    act(() => result.current.clearState());
    expect(result.current.pendingReferral).toBeNull();
  });

  it('accepts one server receipt and never authors referral rows on device', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        result_code: 'referral_accepted_v2',
        reward_outcome: 'rewards_granted_v2',
        referral_code: CODE_A,
        status: 'completed',
        inviter_reward_amount: 50,
        referred_reward_amount: 50,
      },
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A, USER_A));

    await act(async () => {
      await expect(result.current.processReferral(USER_A)).resolves.toBe(true);
    });

    expect(mockRpc).toHaveBeenCalledWith('accept_referral_v2', {
      p_referral_code: CODE_A,
    });
    expect(mockRpc.mock.contexts[0]).toBe(supabase);
    expect(result.current.pendingReferral).toBeNull();
    expect(result.current.lastProcessResult).toEqual({
      accepted: true,
      outcome: 'both_rewarded',
      referralCode: CODE_A,
      status: 'completed',
      inviterRewardAmount: 50,
      referredRewardAmount: 50,
    });
  });

  it('keeps a code when activation has not been confirmed', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        result_code: 'activation_required',
        outcome: 'pending_activation',
        reward_outcome: 'pending_activation_v2',
        referral_code: CODE_A,
        status: 'pending',
      },
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A));

    await act(async () => {
      await result.current.processReferral(USER_A);
    });

    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_A,
      ownerUserId: USER_A,
    });
    expect(result.current.lastProcessResult?.outcome).toBe(
      'pending_activation'
    );
  });

  it('hydrates the authoritative staged code and reports a mismatch', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        accepted: false,
        result_code: 'referral_code_mismatch',
        outcome: 'referral_code_mismatch',
        reward_outcome: 'pending_activation_v2',
        referral_code: CODE_A,
        authoritative_referral_code: CODE_A,
        status: 'pending',
        authoritative_status: 'pending',
      },
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_B, USER_A));

    await act(async () => {
      await expect(result.current.processReferral(USER_A)).resolves.toBe(false);
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('accept_referral_v2', {
      p_referral_code: CODE_B,
    });
    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_A,
      ownerUserId: USER_A,
    });
    expect(result.current.lastProcessResult).toMatchObject({
      accepted: false,
      outcome: 'staged_code_mismatch',
      referralCode: CODE_A,
      status: 'pending',
    });
  });

  it('rejects an incomplete pending receipt instead of inventing hydration', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        outcome: 'pending_activation',
        reward_outcome: 'pending_activation_v2',
      },
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A));

    await act(async () => {
      await expect(result.current.processReferral(USER_A)).resolves.toBe(false);
    });

    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_A,
      ownerUserId: USER_A,
    });
    expect(result.current.lastProcessResult?.outcome).toBe('unavailable');
  });

  it('keeps a code after a transport failure', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'network unavailable' },
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A));

    await act(async () => {
      await expect(result.current.processReferral(USER_A)).resolves.toBe(false);
    });

    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_A,
      ownerUserId: USER_A,
    });
    expect(result.current.lastProcessResult?.outcome).toBe('unavailable');
  });

  it('uses the public outcome for a legacy referral replay', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        accepted: false,
        result_code: 'already_claimed',
        outcome: 'referral_already_accepted',
        reward_outcome: 'legacy_no_reward',
        referral_code: CODE_A,
        status: 'cancelled',
      },
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A, USER_A));

    await act(async () => {
      await expect(result.current.processReferral(USER_A)).resolves.toBe(false);
    });

    expect(result.current.pendingReferral).toBeNull();
    expect(result.current.lastProcessResult?.outcome).toBe(
      'referral_already_accepted'
    );
  });

  it('clears the local draft from an authoritative cancelled replay', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        accepted: false,
        result_code: 'referral_cancelled',
        outcome: 'cancelled',
        reward_outcome: 'cancelled_before_activation_v2',
        referral_code: CODE_A,
        authoritative_referral_code: CODE_A,
        status: 'cancelled',
        authoritative_status: 'cancelled',
      },
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A, USER_A));

    await act(async () => {
      await expect(result.current.processReferral(USER_A)).resolves.toBe(false);
    });

    expect(result.current.pendingReferral).toBeNull();
    expect(result.current.lastProcessResult).toMatchObject({
      accepted: false,
      outcome: 'cancelled',
      referralCode: CODE_A,
      status: 'cancelled',
    });
  });

  it('cancels a staged referral before activation', async () => {
    mockRpc.mockResolvedValue({
      data: {
        cancelled: true,
        outcome: 'cancelled_before_activation',
      },
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A, USER_A));

    await act(async () => {
      await expect(result.current.cancelPendingReferral(USER_A)).resolves.toBe(
        true
      );
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'cancel_pending_referral_v2',
      undefined
    );
    expect(result.current.pendingReferral).toBeNull();
  });

  it.each(['already_cancelled', 'no_pending_referral'])(
    'treats %s as a successful cancellation replay',
    async outcome => {
      mockRpc.mockResolvedValue({
        data: { cancelled: false, outcome },
        error: null,
      });
      const { result } = renderHook(() => useReferralStore());
      act(() => result.current.setPendingReferral(CODE_A, USER_A));

      await act(async () => {
        await expect(
          result.current.cancelPendingReferral(USER_A)
        ).resolves.toBe(true);
      });

      expect(result.current.pendingReferral).toBeNull();
      expect(result.current.error).toBeNull();
    }
  );

  it('does not process an anonymous draft for the wrong expected account', async () => {
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A));

    await act(async () => {
      await expect(result.current.processReferral(USER_B)).resolves.toBe(false);
    });

    expect(mockRpc).not.toHaveBeenCalled();
    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_A,
      ownerUserId: null,
    });
    expect(result.current.lastProcessResult).toBeNull();
  });

  it('ignores a process receipt after the active account changes', async () => {
    const request = deferred<{ data: unknown; error: null }>();
    mockRpc.mockReturnValue(request.promise);
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A, USER_A));

    let processPromise!: Promise<boolean>;
    await act(async () => {
      processPromise = result.current.processReferral(USER_A);
      await Promise.resolve();
    });
    expect(mockRpc).toHaveBeenCalledTimes(1);

    activeUserId = USER_B;
    request.resolve({
      data: {
        success: true,
        accepted: true,
        outcome: 'both_rewarded',
        referral_code: CODE_A,
        status: 'completed',
        inviter_reward_amount: 50,
        referred_reward_amount: 50,
      },
      error: null,
    });

    await act(async () => {
      await expect(processPromise).resolves.toBe(false);
    });

    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_A,
      ownerUserId: USER_A,
    });
    expect(result.current.lastProcessResult).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('does not restore fetched account data after clearState', async () => {
    const request = deferred<{ data: unknown; error: null }>();
    mockRpc.mockReturnValue(request.promise);
    const { result } = renderHook(() => useReferralStore());

    let fetchPromise!: Promise<void>;
    await act(async () => {
      fetchPromise = result.current.fetchUserReferrals(USER_A);
      await Promise.resolve();
    });
    expect(result.current.isLoading).toBe(true);

    activeUserId = USER_B;
    act(() => result.current.clearState());
    request.resolve({
      data: [
        {
          referral_id: '33333333-3333-4333-8333-333333333333',
          status: 'completed',
          reward_granted: true,
          created_at: '2026-08-13T00:00:00Z',
          completed_at: '2026-08-13T00:01:00Z',
        },
      ],
      error: null,
    });

    await act(async () => {
      await fetchPromise;
    });

    expect(result.current.userReferrals).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('hydrates exact inviter reward receipts from the v2 list RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          referral_id: '33333333-3333-4333-8333-333333333333',
          status: 'completed',
          reward_outcome: 'inviter_capped_v2',
          reward_granted: false,
          inviter_reward_amount: 0,
          created_at: '2026-08-13T00:00:00Z',
          completed_at: '2026-08-13T00:01:00Z',
        },
        {
          referral_id: '44444444-4444-4444-8444-444444444444',
          status: 'completed',
          reward_outcome: 'rewards_granted_v2',
          reward_granted: true,
          inviter_reward_amount: 50,
          created_at: '2026-08-12T00:00:00Z',
          completed_at: '2026-08-12T00:01:00Z',
        },
        {
          referral_id: '55555555-5555-4555-8555-555555555555',
          status: 'cancelled',
          reward_outcome: 'legacy_no_reward',
          reward_granted: true,
          inviter_reward_amount: 50,
          created_at: '2026-08-11T00:00:00Z',
          completed_at: '2026-08-11T00:01:00Z',
        },
      ],
      error: null,
    });
    const { result } = renderHook(() => useReferralStore());

    await act(async () => {
      await result.current.fetchUserReferrals(USER_A);
    });

    expect(mockRpc).toHaveBeenCalledWith('list_my_referrals_v2', {
      p_limit: 100,
    });
    expect(result.current.userReferrals).toEqual([
      expect.objectContaining({
        rewardOutcome: 'inviter_capped_v2',
        rewardGranted: false,
        inviterRewardAmount: 0,
      }),
      expect.objectContaining({
        rewardOutcome: 'rewards_granted_v2',
        rewardGranted: true,
        inviterRewardAmount: 50,
      }),
      expect.objectContaining({
        status: 'cancelled',
        rewardOutcome: null,
        rewardGranted: false,
        inviterRewardAmount: 0,
      }),
    ]);
  });

  it('returns the exact annual cap reset from the programme receipt', async () => {
    mockRpc.mockResolvedValue({
      data: {
        programme_enabled: true,
        reward_amount: 50,
        inviter_annual_cap: 10,
        inviter_rewards_this_year: 3,
        inviter_cap_resets_at: '2027-01-01T00:00:00+00:00',
      },
      error: null,
    });

    await expect(
      useReferralStore.getState().getReferralProgramStatus()
    ).resolves.toEqual({
      programmeEnabled: true,
      rewardAmount: 50,
      inviterAnnualCap: 10,
      inviterRewardsThisYear: 3,
      inviterCapResetsAt: '2027-01-01T00:00:00.000Z',
    });
  });

  it.each([undefined, 'not-a-timestamp', '01/01/2027'])(
    'fails closed when the annual cap reset is %s',
    async inviterCapResetsAt => {
      mockRpc.mockResolvedValue({
        data: {
          programme_enabled: true,
          reward_amount: 50,
          inviter_annual_cap: 10,
          inviter_rewards_this_year: 3,
          inviter_cap_resets_at: inviterCapResetsAt,
        },
        error: null,
      });

      await expect(
        useReferralStore.getState().getReferralProgramStatus()
      ).rejects.toThrow('Referral reward status is unavailable.');
    }
  );

  it('does not clear a new account draft after a late cancel receipt', async () => {
    const request = deferred<{ data: unknown; error: null }>();
    mockRpc.mockReturnValue(request.promise);
    const { result } = renderHook(() => useReferralStore());
    act(() => result.current.setPendingReferral(CODE_A, USER_A));

    let cancelPromise!: Promise<boolean>;
    await act(async () => {
      cancelPromise = result.current.cancelPendingReferral(USER_A);
      await Promise.resolve();
    });

    activeUserId = USER_B;
    act(() => {
      result.current.clearState();
      result.current.setPendingReferral(CODE_B, USER_B);
    });
    request.resolve({
      data: { cancelled: true, outcome: 'cancelled_before_activation' },
      error: null,
    });

    await act(async () => {
      await expect(cancelPromise).rejects.toThrow('account changed');
    });

    expect(result.current.pendingReferral).toMatchObject({
      referralCode: CODE_B,
      ownerUserId: USER_B,
    });
  });

  it('gets the owner code through the referral RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          referral_code: '00112233445566778899AABBCCDDEEFF',
          created_at: '2026-08-13T00:00:00Z',
        },
      ],
      error: null,
    });

    await expect(
      useReferralStore.getState().generateReferralLink(USER_A)
    ).resolves.toContain('00112233445566778899AABBCCDDEEFF');
    expect(mockRpc).toHaveBeenCalledWith(
      'get_or_create_my_referral_code',
      undefined
    );
  });

  it('does not return an invite link after the account changes', async () => {
    const request = deferred<{ data: unknown; error: null }>();
    mockRpc.mockReturnValue(request.promise);

    const linkPromise = useReferralStore
      .getState()
      .generateReferralLink(USER_A);
    await Promise.resolve();
    activeUserId = USER_B;
    request.resolve({
      data: [{ referral_code: CODE_A }],
      error: null,
    });

    await expect(linkPromise).rejects.toThrow('account changed');
  });
});
