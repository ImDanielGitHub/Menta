import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import { translate } from '@/lib/localization';
import { getProBenefitCopy, getQuotaLimitCopy } from '../pro-copy';

describe('Pro paywall copy', () => {
  it('names the annual stipend and that Pro still spends Momenta', () => {
    const benefits = getProBenefitCopy();
    const stipend = benefits.find(
      benefit => benefit.title === 'Momenta each billing period'
    );

    expect(stipend?.text).toContain(
      `${ECONOMY_CONTRACT_V1.pro.monthlyCredits.toLocaleString()} each month`
    );
    expect(stipend?.text).toContain(
      ECONOMY_CONTRACT_V1.pro.annualCredits.toLocaleString()
    );
    expect(stipend?.text).toContain(
      'creates and joins still spend Momenta at the normal price'
    );
  });

  it('names both free promise caps instead of treating the active cap as monthly', () => {
    expect(getQuotaLimitCopy('challenge', 2)).toBe(
      'The free plan includes 2 live promises at a time, and up to 4 new promises each month.'
    );
    expect(getQuotaLimitCopy('challenge', 4)).toBe(
      'The free plan includes 2 live promises at a time, and up to 4 new promises each month.'
    );
  });

  it('keeps group copy as an active-membership cap', () => {
    expect(getQuotaLimitCopy('group', 2)).toBe(
      'The free plan includes up to 2 active groups at a time.'
    );
    expect(getQuotaLimitCopy('group', 1)).toBe(
      'The free plan includes up to 1 active group at a time.'
    );
  });

  it('selects complete German group quota variants without suffix assembly', () => {
    const german = (
      key: Parameters<typeof translate>[1],
      values?: Record<string, string | number>
    ) => translate('de-DE', key, values);

    expect(getQuotaLimitCopy('group', 1, german)).toBe(
      'Der kostenlose Tarif umfasst gleichzeitig bis zu 1 aktive Gruppe.'
    );
    expect(getQuotaLimitCopy('group', 2, german)).toBe(
      'Der kostenlose Tarif umfasst gleichzeitig bis zu 2 aktive Gruppen.'
    );
  });

  it('keeps saved-subject and one-ad copy complete for each funding subject', () => {
    expect(translate('en-NZ', 'commerce.paywall.savedSubject.group')).toBe(
      'Your group is saved while you choose what to do next.'
    );
    expect(translate('de-DE', 'commerce.paywall.savedSubject.promise')).toBe(
      'Dein Versprechen ist gespeichert, während du auswählst, was du als Nächstes tun möchtest.'
    );
    expect(
      translate('de-DE', 'commerce.paywall.oneAdEnough.draft', {
        amount: 50,
      })
    ).toBe('Eine Anzeige bringt dir 50 Momenta – genug für diesen Entwurf.');
  });
});
