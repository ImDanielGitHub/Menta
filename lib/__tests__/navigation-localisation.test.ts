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

describe('primary navigation localisation', () => {
  it.each(regionalLocales)('translates primary destinations for %s', locale => {
    expect(translate(locale, 'navigation.tab.profile')).not.toBe(
      translate('en-NZ', 'navigation.tab.profile')
    );
    expect(translate(locale, 'navigation.create.solo.action')).not.toBe(
      translate('en-NZ', 'navigation.create.solo.action')
    );
  });

  it('keeps personal promise counts grammatical', () => {
    expect(
      translate('fr-FR', 'navigation.personal.active', { count: 1 })
    ).toBe('1 promesse active');
    expect(
      translate('fr-FR', 'navigation.personal.active', { count: 2 })
    ).toBe('2 promesses actives');
  });

  it('uses the local settings term', () => {
    expect(
      translate('es-ES', 'navigation.notifications.accessibility')
    ).toContain('Ajustes');
    expect(
      translate('es-MX', 'navigation.notifications.accessibility')
    ).toContain('Configuración');
    expect(
      translate('pt-PT', 'navigation.notifications.accessibility')
    ).toContain('Definições');
  });
});
