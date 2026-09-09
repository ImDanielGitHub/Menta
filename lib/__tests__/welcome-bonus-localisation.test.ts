import { translate } from '@/lib/localization';

const regionalLocales = [
  'de-DE',
  'es-ES',
  'es-MX',
  'fr-CA',
  'fr-FR',
  'pt-BR',
  'pt-PT',
] as const;

describe('welcome bonus localisation', () => {
  it.each(regionalLocales)('translates the confirmed receipt for %s', locale => {
    expect(
      translate(locale, 'economy.welcome.heading', { amount: 100 })
    ).not.toBe(
      translate('en-NZ', 'economy.welcome.heading', { amount: 100 })
    );
  });

  it('keeps Menta and Momenta unchanged', () => {
    expect(translate('de-DE', 'economy.welcome.body')).toContain('Menta');
    expect(translate('de-DE', 'economy.welcome.body')).toContain('Momenta');
  });

  it('keeps the no-cash-value limitation explicit', () => {
    expect(translate('es-MX', 'economy.welcome.body')).toContain(
      'valor en efectivo'
    );
    expect(translate('fr-FR', 'economy.welcome.body')).toContain(
      'valeur monétaire'
    );
  });
});
