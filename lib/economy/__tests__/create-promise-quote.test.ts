import {
  decodeCreatePromiseQuote,
  describeCreatePromiseCost,
  describeCreatePromiseQuota,
  describeCreatePromiseQuotaError,
  resolveCreatePromiseGate,
} from '../create-promise-quote';

describe('create promise quote', () => {
  it('reads the server viewer cost instead of counting local participations', () => {
    expect(
      decodeCreatePromiseQuote({
        viewer: {
          createChallengeCost: 0,
          activePromises: 0,
          isPro: false,
        },
      })
    ).toEqual({
      cost: 0,
      activePromises: 0,
      challengesCreatedThisMonth: null,
      isPro: false,
    });
  });

  it('keeps the monthly count only when quota_status is present', () => {
    expect(
      decodeCreatePromiseQuote(
        {
          viewer: {
            createChallengeCost: 30,
            activePromises: 1,
            isPro: false,
          },
        },
        { challenges_created_this_month: 4 }
      )
    ).toMatchObject({
      cost: 30,
      challengesCreatedThisMonth: 4,
    });
  });

  it('blocks a third live promise before inventing a monthly wall', () => {
    expect(
      resolveCreatePromiseGate({
        cost: 30,
        activePromises: 2,
        challengesCreatedThisMonth: 1,
        isPro: false,
      })
    ).toEqual({ allowed: false, reason: 'active', limit: 2 });
  });

  it('blocks a fifth monthly create when the server count is known', () => {
    expect(
      resolveCreatePromiseGate({
        cost: 30,
        activePromises: 1,
        challengesCreatedThisMonth: 4,
        isPro: false,
      })
    ).toEqual({ allowed: false, reason: 'monthly', limit: 4 });
  });

  it('lets Pro skip both free caps', () => {
    expect(
      resolveCreatePromiseGate({
        cost: 30,
        activePromises: 6,
        challengesCreatedThisMonth: 9,
        isPro: true,
      })
    ).toEqual({ allowed: true });
  });

  it('names a first promise as free', () => {
    expect(describeCreatePromiseCost(0)).toBe('Free — first promise');
    expect(describeCreatePromiseCost(30)).toBe('30 Momenta');
  });

  it('maps server quota codes to the matching free limit', () => {
    expect(
      describeCreatePromiseQuotaError(null, 'QUOTA_ACTIVE_PROMISES')
    ).toMatchObject({ reason: 'active' });
    expect(
      describeCreatePromiseQuotaError('P0001', 'QUOTA_CHALLENGES_MONTH')
    ).toMatchObject({ reason: 'monthly' });
    expect(describeCreatePromiseQuota('active').title).toContain(
      'free promise limit'
    );
  });
});
