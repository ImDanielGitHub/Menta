import { translate } from '@/lib/localization/translate';

describe('full commerce catalogue', () => {
  it('interpolates server-owned commerce facts without translating the values', () => {
    expect(
      translate('en-NZ', 'commerce.shop.buyNamedFor', {
        name: 'Streak Freeze',
        amount: '1,500',
      })
    ).toBe('Buy Streak Freeze for 1,500 Momenta');
  });

  it('selects singular and plural catalogue forms for item counts', () => {
    expect(translate('en-NZ', 'commerce.shop.itemsCount', { count: 1 })).toBe(
      '1 item'
    );
    expect(translate('en-NZ', 'commerce.shop.itemsCount', { count: 2 })).toBe(
      '2 items'
    );
  });

  it('keeps locale-formatted numeric values intact in translated receipts', () => {
    expect(
      translate('en-NZ', 'commerce.wallet.addedToBalance', { amount: '1,234' })
    ).toBe('1,234 Momenta was added to your balance.');
  });

  it('localises the sponsor reward recovery sheets in German', () => {
    expect(translate('de-DE', 'commerce.wallet.rewardCheckingTitle')).toBe(
      'Deine Belohnung wird geprüft'
    );
    expect(translate('de-DE', 'commerce.wallet.rewardMissingDetail')).toBe(
      'Aktualisiere dein Guthaben, bevor du einen weiteren Sponsor ansiehst.'
    );
  });
});
