import {
  annualSavingsPercent,
  formatLikeStorePrice,
  formatStorePrice,
  weeklyEquivalent,
} from '@/lib/paywall/pro-plan-pricing';

describe('pro plan pricing', () => {
  it('spreads the yearly price across the year', () => {
    expect(formatStorePrice(weeklyEquivalent(79.99), 'USD', 'en-US')).toBe(
      '$1.54'
    );
  });

  it('rounds the saving down so the badge never overstates it', () => {
    // 79.99 against 52 weeks of 9.99 is an 84.6% saving.
    expect(annualSavingsPercent(79.99, 9.99)).toBe(84);
  });

  it('shows no badge when yearly does not save anything', () => {
    expect(annualSavingsPercent(600, 9.99)).toBeNull();
    expect(annualSavingsPercent(0, 9.99)).toBeNull();
  });

  it('formats in the store currency and the person’s locale', () => {
    expect(formatStorePrice(79.99, 'NZD', 'en-NZ')).toBe('$79.99');
    expect(formatStorePrice(1.54, 'EUR', 'de-DE')).toMatch(/^1,54\s€$/u);
    expect(formatStorePrice(1, 'not-a-currency', 'en-NZ')).toBeNull();
  });

  it('writes a derived price the way the store writes its own', () => {
    expect(formatLikeStorePrice('$79.99', 1.538)).toBe('$1.54');
    expect(formatLikeStorePrice('NZ$129.99', 2.4998)).toBe('NZ$2.50');
    expect(formatLikeStorePrice('79,99 €', 1.538)).toBe('1,54 €');
    expect(formatLikeStorePrice('Rp1.590.000,00', 30576.92)).toBe(
      'Rp30.576,92'
    );
    expect(formatLikeStorePrice('¥1,200', 23.07)).toBe('¥23');
    expect(formatLikeStorePrice('Free', 1)).toBeNull();
  });
});
