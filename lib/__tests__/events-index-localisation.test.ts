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

describe('events index localisation', () => {
  it.each(regionalLocales)('translates event recovery for %s', locale => {
    expect(translate(locale, 'events.index.error.refresh_title')).not.toBe(
      translate('en-NZ', 'events.index.error.refresh_title')
    );
    expect(translate(locale, 'events.index.create')).not.toBe(
      translate('en-NZ', 'events.index.create')
    );
  });

  it('uses locale plurals for remaining capacity', () => {
    expect(
      translate('fr-FR', 'events.index.capacity.remaining', { count: 1 })
    ).toBe('1 place restante');
    expect(
      translate('fr-FR', 'events.index.capacity.remaining', { count: 3 })
    ).toBe('3 places restantes');
  });

  it('keeps event titles unchanged in accessibility copy', () => {
    expect(
      translate('de-DE', 'events.index.view', { event: 'Sunday Run' })
    ).toContain('Sunday Run');
  });

  it('uses regional capacity and device wording', () => {
    expect(translate('es-ES', 'events.index.capacity.full')).toBe(
      'Aforo completo'
    );
    expect(translate('es-MX', 'events.index.capacity.full')).toBe('Cupo lleno');
    expect(translate('pt-PT', 'events.index.organiser_hint')).toContain(
      'telemóvel'
    );
  });
});
