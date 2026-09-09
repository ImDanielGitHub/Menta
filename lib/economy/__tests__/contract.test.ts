import {
  ECONOMY_CONTRACT_V1,
  DEFAULT_ACTION_COSTS,
  FREE_TIER_QUOTAS,
  getActionCost,
  getNextStreakUnlock,
  getEarnedFreezeGrantCopy,
  getInventoryEmptyCopy,
  getReviewRewardHint,
  getStreakUnlocksUpTo,
  grantsAccountFreeze,
} from '@/lib/economy/contract';

describe('economy contract v1', () => {
  it('keeps the first promise and first group free', () => {
    expect(ECONOMY_CONTRACT_V1.firsts.firstPromiseCost).toBe(0);
    expect(ECONOMY_CONTRACT_V1.firsts.firstGroupCreateCost).toBe(0);
    expect(ECONOMY_CONTRACT_V1.firsts.firstGroupJoinCost).toBe(0);
  });

  it('charges later starts without making Pro zero the loop', () => {
    expect(getActionCost('create_challenge')).toBe(30);
    expect(getActionCost('create_group')).toBe(50);
    expect(getActionCost('join_group')).toBe(10);
    expect(getActionCost('join_challenge')).toBe(0);
    expect(ECONOMY_CONTRACT_V1.pro.waivesActionCosts).toBe(false);
    expect(ECONOMY_CONTRACT_V1.pro.bypassesQuotas).toBe(true);
    expect(DEFAULT_ACTION_COSTS.create_challenge).toBe(30);
  });

  it('limits free capacity instead of blocking looking', () => {
    expect(FREE_TIER_QUOTAS.max_active_promises).toBe(2);
    expect(FREE_TIER_QUOTAS.max_active_groups).toBe(2);
    expect(FREE_TIER_QUOTAS.max_challenges_per_month).toBe(4);
  });

  it('treats streaks as the behaviour that earns freezes', () => {
    expect(getStreakUnlocksUpTo(6)).toEqual([]);
    expect(getStreakUnlocksUpTo(7).map(unlock => unlock.sku)).toEqual([
      'streak_freeze_basic',
    ]);
    expect(getNextStreakUnlock(7)?.days).toBe(30);
    expect(getNextStreakUnlock(30)).toBeNull();
    expect(grantsAccountFreeze(3)).toBe(false);
    expect(grantsAccountFreeze(7)).toBe(true);
    expect(grantsAccountFreeze(30)).toBe(true);
    expect(getEarnedFreezeGrantCopy()).toBe(
      'Keeping a 7-day or 30-day streak also grants a freeze.'
    );
    expect(getInventoryEmptyCopy()).toBe(
      'You have no items yet. Buy boosts and styles in the shop. Keeping a 7-day or 30-day streak also grants a freeze.'
    );
  });

  it('names review Momenta as a per-review earn, not a queue-clear bonus', () => {
    expect(getReviewRewardHint()).toBe(
      'Each confirmed review adds 8 Momenta, up to 20 a day.'
    );
  });
});
