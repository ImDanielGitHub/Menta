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

describe('proof recovery localisation', () => {
  it.each(regionalLocales)(
    'keeps queued and pending proof states translated for %s',
    locale => {
      expect(translate(locale, 'proofRecovery.pending.not_counted')).not.toBe(
        translate('en-NZ', 'proofRecovery.pending.not_counted')
      );
      expect(translate(locale, 'proofRecovery.queued.not_sent')).not.toBe(
        translate('en-NZ', 'proofRecovery.queued.not_sent')
      );
    }
  );

  it('keeps one and many recovery counts grammatical', () => {
    expect(
      translate('de-DE', 'proofRecovery.pending.more_waiting', { count: 1 })
    ).toBe('1 weiterer wartet');
    expect(
      translate('de-DE', 'proofRecovery.pending.more_waiting', { count: 2 })
    ).toBe('2 weitere warten');
  });

  it('keeps Portuguese proof terminology regional', () => {
    expect(translate('pt-BR', 'proofRecovery.queued.title')).toContain(
      'Comprovação'
    );
    expect(translate('pt-PT', 'proofRecovery.queued.title')).toContain(
      'Comprovativo'
    );
  });

  it('interpolates the promise without changing its name', () => {
    expect(
      translate('es-ES', 'proofRecovery.pending.description', {
        promise: 'Run 5K',
      })
    ).toContain('Run 5K');
  });
});
