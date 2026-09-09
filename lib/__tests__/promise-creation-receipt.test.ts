import {
  decodeAccountActivationLookup,
  decodePromiseCreationReceipt,
  formatPromiseDueWindow,
} from '@/lib/commitments/promise-creation-receipt';

describe('promise creation receipt decoder', () => {
  it('accepts only the server-owned first-promise and due-window shape', () => {
    expect(
      decodePromiseCreationReceipt({
        is_first_promise: true,
        next_due_at: '2026-08-05T23:00:00+00:00',
      })
    ).toEqual({
      isFirstPromise: true,
      nextDueAt: '2026-08-05T23:00:00+00:00',
      activation: null,
      referral: null,
    });

    expect(
      decodePromiseCreationReceipt({
        is_first_promise: false,
        next_due_at: null,
      })
    ).toEqual({
      isFirstPromise: false,
      nextDueAt: null,
      activation: null,
      referral: null,
    });
  });

  it('keeps activation and referral reward facts from their server receipts', () => {
    const creationReceipt = decodePromiseCreationReceipt({
      is_first_promise: true,
      next_due_at: '2026-08-05T23:00:00+00:00',
      activation: {
        confirmed: true,
        activated: true,
        activated_at: '2026-08-05T22:00:00+00:00',
        first_promise_id: 'first-promise-id',
        first_promise_title: 'Walk after work',
        source: 'first_promise_v1',
        welcome_momenta: {
          granted: true,
          amount: 100,
          outcome: 'granted_now',
        },
        referral: {
          accepted: true,
          outcome: 'inviter_capped',
          referral_id: 'referral-id',
          referral_code: '00112233445566778899AABBCCDDEEFF',
          status: 'completed',
          reward_outcome: 'inviter_capped_v2',
          inviter_reward_amount: 0,
          referred_reward_amount: 50,
        },
      },
    });

    expect(creationReceipt).toEqual({
      isFirstPromise: true,
      nextDueAt: '2026-08-05T23:00:00+00:00',
      activation: {
        confirmed: true,
        activated: true,
        activatedAt: '2026-08-05T22:00:00+00:00',
        firstPromiseId: 'first-promise-id',
        firstPromiseTitle: 'Walk after work',
        source: 'first_promise_v1',
        welcomeMomentaAmount: 100,
        welcomeMomentaGranted: true,
        welcomeMomentaOutcome: 'granted_now',
        referral: {
          accepted: true,
          outcome: 'inviter_capped',
          referralId: 'referral-id',
          referralCode: '00112233445566778899AABBCCDDEEFF',
          status: 'completed',
          rewardOutcome: 'inviter_capped_v2',
          inviterRewardAmount: 0,
          referredRewardAmount: 50,
        },
      },
      referral: {
        accepted: true,
        outcome: 'inviter_capped',
        referralId: 'referral-id',
        referralCode: '00112233445566778899AABBCCDDEEFF',
        status: 'completed',
        rewardOutcome: 'inviter_capped_v2',
        inviterRewardAmount: 0,
        referredRewardAmount: 50,
      },
    });
  });

  it('rejects malformed data instead of inferring a first status or due time', () => {
    expect(
      decodePromiseCreationReceipt({
        is_first_promise: 'true',
        next_due_at: '2026-08-05T23:00:00+00:00',
      })
    ).toBeNull();
    expect(
      decodePromiseCreationReceipt({
        is_first_promise: false,
        next_due_at: 'tomorrow evening',
      })
    ).toBeNull();
    expect(
      decodePromiseCreationReceipt({
        is_first_promise: false,
        next_due_at: null,
        activation: {
          activated: false,
          first_promise_id: 'not-confirmed',
        },
      })
    ).toBeNull();
  });

  it('keeps absent activation and its exact staged referral distinct', () => {
    expect(
      decodeAccountActivationLookup({
        confirmed: false,
        referral: {
          success: false,
          accepted: false,
          outcome: 'pending_activation',
          referral_id: 'referral-id',
          referral_code: '00112233445566778899AABBCCDDEEFF',
          status: 'pending',
          reward_outcome: 'pending_activation_v2',
          inviter_reward_amount: 0,
          referred_reward_amount: 0,
        },
      })
    ).toEqual({
      kind: 'absent',
      stagedReferral: {
        accepted: false,
        outcome: 'pending_activation',
        referralId: 'referral-id',
        referralCode: '00112233445566778899AABBCCDDEEFF',
        status: 'pending',
        rewardOutcome: 'pending_activation_v2',
        inviterRewardAmount: 0,
        referredRewardAmount: 0,
      },
    });
  });

  it('rejects malformed confirmed reward facts instead of showing success', () => {
    expect(
      decodeAccountActivationLookup({
        confirmed: true,
        activated: true,
        activated_at: '2026-08-05T22:00:00+00:00',
        first_promise_id: 'first-promise-id',
        first_promise_title: 'Walk after work',
        source: 'first_promise_v1',
        welcome_momenta: {
          granted: true,
          amount: 50,
          outcome: 'granted_now',
        },
        referral: null,
      })
    ).toBeNull();

    expect(
      decodeAccountActivationLookup({
        confirmed: false,
        referral: {
          accepted: false,
          outcome: 'pending_activation',
          referral_id: 'referral-id',
          referral_code: '00112233445566778899AABBCCDDEEFF',
          status: 'pending',
          reward_outcome: 'pending_activation_v2',
          inviter_reward_amount: '0',
          referred_reward_amount: 0,
        },
      })
    ).toBeNull();

    expect(
      decodeAccountActivationLookup({
        confirmed: false,
        referral: {
          outcome: 'pending_activation',
          referral_id: 'referral-id',
          referral_code: '00112233445566778899AABBCCDDEEFF',
          status: 'pending',
          reward_outcome: 'pending_activation_v2',
          inviter_reward_amount: 0,
          referred_reward_amount: 0,
        },
      })
    ).toBeNull();
  });

  it('formats a verified timestamp without changing the due fact', () => {
    expect(
      formatPromiseDueWindow('2026-08-05T23:00:00+00:00', 'UTC')
    ).toContain('Wednesday');
  });
});
