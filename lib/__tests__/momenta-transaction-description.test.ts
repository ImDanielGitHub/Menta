import { describeMomentaTransaction } from '@/lib/momenta/transaction-description';

describe('Momenta history descriptions', () => {
  it('never shows a store product identifier for a subscription credit', () => {
    // The exact shape stored by the RevenueCat webhook for historical rows.
    expect(
      describeMomentaTransaction({
        transaction_type: 'credit',
        description: 'Subscription: com.anekedigitalapps.lockedin.pro_yearly',
      })
    ).toBe('Menta Pro, yearly');

    expect(
      describeMomentaTransaction({
        transaction_type: 'credit',
        description: 'Subscription: com.anekedigitalapps.lockedin.pro_monthly',
      })
    ).toBe('Menta Pro, monthly');
  });

  it('describes a credit pack without inventing a pack size', () => {
    const described = describeMomentaTransaction({
      transaction_type: 'credit',
      description: 'Credit pack: com.anekedigitalapps.lockedin.momenta_500',
    });

    expect(described).toBe('Momenta pack');
    expect(described).not.toMatch(/500/);
  });

  it('leaves descriptions that are already ordinary language alone', () => {
    // Every one of these is a real stored value. A colon in the description does
    // not mean it hides an identifier.
    for (const description of [
      'Onboarding bonus',
      'Review queue reward',
      'Join group: Launch',
      'Shop purchase: Ember Theme',
    ]) {
      expect(
        describeMomentaTransaction({ transaction_type: 'spent', description })
      ).toBe(description);
    }
  });

  it('uses the product word for internal vocabulary', () => {
    expect(
      describeMomentaTransaction({
        transaction_type: 'spent',
        description: 'Challenge creation',
      })
    ).toBe('Promise created');
    expect(
      describeMomentaTransaction({
        transaction_type: 'spent',
        description: 'Group creation',
      })
    ).toBe('Group created');
  });

  it('falls back to the movement kind when a row has no description', () => {
    expect(
      describeMomentaTransaction({ transaction_type: 'bonus', description: '' })
    ).toBe('Momenta bonus');
    expect(
      describeMomentaTransaction({ transaction_type: 'spent' })
    ).toBe('Momenta spent');
    expect(describeMomentaTransaction({})).toBe('Momenta activity');
  });

  it('rewrites a bare identifier stored with no prefix', () => {
    expect(
      describeMomentaTransaction({
        transaction_type: 'credit',
        description: 'com.anekedigitalapps.lockedin.pro_monthly',
      })
    ).toBe('Menta Pro, monthly');
  });

  it('does not treat a hyphenated sentence as an identifier', () => {
    expect(
      describeMomentaTransaction({
        transaction_type: 'spent',
        description: 'Streak freeze used',
      })
    ).toBe('Streak freeze used');
  });
});
