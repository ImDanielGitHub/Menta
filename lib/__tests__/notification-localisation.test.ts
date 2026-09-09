import {
  getRegisteredCatalogueLocales,
  translate,
} from '@/lib/localization';

describe('notification localisation', () => {
  it('registers the first regional catalogue family', () => {
    expect(getRegisteredCatalogueLocales()).toEqual([
      'de-DE',
      'en-NZ',
      'es-ES',
      'es-MX',
      'fr-CA',
      'fr-FR',
      'pt-BR',
      'pt-PT',
    ]);
  });

  it.each(['de-DE', 'es-ES', 'es-MX', 'fr-CA', 'fr-FR', 'pt-BR', 'pt-PT'])(
    'does not fall back to English for %s notification copy',
    locale => {
      expect(translate(locale, 'notifications.education.title')).not.toBe(
        translate('en-NZ', 'notifications.education.title')
      );
      expect(translate(locale, 'notifications.notice.settings_failed.body')).not.toBe(
        translate('en-NZ', 'notifications.notice.settings_failed.body')
      );
    }
  );

  it('keeps regional wording distinct where usage differs', () => {
    expect(translate('es-ES', 'notifications.action.open_settings')).toContain(
      'ajustes'
    );
    expect(translate('es-MX', 'notifications.action.open_settings')).toContain(
      'configuración'
    );
    expect(translate('pt-BR', 'notifications.phone.title')).toContain('celular');
    expect(translate('pt-PT', 'notifications.phone.title')).toContain(
      'telemóvel'
    );
  });
});
