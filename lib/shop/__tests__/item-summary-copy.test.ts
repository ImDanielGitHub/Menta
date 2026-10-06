import {
  getShopItemAccountSummary,
  getShopItemAccountTrail,
  getShopItemCategoryLabel,
} from '../item-summary-copy';

describe('shop item account summary copy', () => {
  it('names a streak-gated item as an unlock, not only a streak length', () => {
    const summary = getShopItemAccountSummary({
      category: 'theme',
      displayName: 'Ember Theme',
      primaryState: 'Available',
      hideTrail: false,
      unlockDays: 7,
      cost: 0,
    });

    expect(summary.categoryLabel).toBe('Style');
    expect(summary.trail).toBe('Unlocks after a 7-day streak');
    expect(summary.accessibilityLabel).toContain(
      'Unlocks after a 7-day streak'
    );
    expect(summary.trail).not.toBe('7-day streak');
  });

  it('names a paid boost and a free item without English leftovers', () => {
    expect(getShopItemCategoryLabel('power_up')).toBe('Boost');
    expect(getShopItemAccountTrail({ unlockDays: null, cost: 40 })).toBe(
      '40 Momenta'
    );
    expect(getShopItemAccountTrail({ cost: 0 })).toBe('Free');
  });
});
