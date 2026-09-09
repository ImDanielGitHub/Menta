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

describe('sign-in localisation', () => {
  it.each(regionalLocales)('translates recovery actions for %s', locale => {
    expect(translate(locale, 'auth.login.cancelled.title')).not.toBe(
      translate('en-NZ', 'auth.login.cancelled.title')
    );
    expect(translate(locale, 'auth.login.action.keep_editing')).not.toBe(
      translate('en-NZ', 'auth.login.action.keep_editing')
    );
  });

  it('keeps provider brands unchanged', () => {
    expect(translate('de-DE', 'auth.login.action.apple')).toContain('Apple');
    expect(translate('fr-FR', 'auth.login.action.google')).toContain('Google');
  });

  it('interpolates the provider into a local recovery message', () => {
    expect(
      translate('pt-PT', 'auth.login.error.provider', {
        provider: 'Apple',
      })
    ).toContain('Apple');
  });

  it('uses regional device wording', () => {
    expect(translate('pt-BR', 'auth.login.draft_detail')).toContain('celular');
    expect(translate('pt-PT', 'auth.login.draft_detail')).toContain(
      'telemóvel'
    );
  });
});
