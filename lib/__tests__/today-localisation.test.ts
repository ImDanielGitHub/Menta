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

describe('Today dashboard localisation', () => {
  it.each(regionalLocales)(
    'does not fall back to English for %s Today copy',
    locale => {
      expect(translate(locale, 'today.progress.current_streak')).not.toBe(
        translate('en-NZ', 'today.progress.current_streak')
      );
      expect(translate(locale, 'today.proof.empty.body')).not.toBe(
        translate('en-NZ', 'today.proof.empty.body')
      );
      expect(translate(locale, 'today.state.offline.detail')).not.toBe(
        translate('en-NZ', 'today.state.offline.detail')
      );
      expect(translate(locale, 'today.state.correction.action')).not.toBe(
        translate('en-NZ', 'today.state.correction.action')
      );
    }
  );

  it('uses the locale plural rule for streak days', () => {
    expect(
      translate('de-DE', 'today.progress.streak_days', { count: 1 })
    ).toBe('1 Tag');
    expect(
      translate('de-DE', 'today.progress.streak_days', { count: 2 })
    ).toBe('2 Tage');
  });

  it('keeps regional action wording distinct', () => {
    expect(translate('es-ES', 'today.proof.action.add_photo')).toBe(
      'Añadir foto'
    );
    expect(translate('es-MX', 'today.proof.action.add_photo')).toBe(
      'Agregar foto'
    );
    expect(translate('pt-BR', 'today.proof.action.add_proof')).toContain(
      'comprovação'
    );
    expect(translate('pt-PT', 'today.proof.action.add_proof')).toContain(
      'comprovativo'
    );
  });

  it('interpolates names and economy amounts without changing state meaning', () => {
    expect(
      translate('fr-FR', 'today.state.review.named_title', {
        name: 'Sam',
      })
    ).toBe('Sam a envoyé une preuve.');
    expect(
      translate('de-DE', 'today.state.review.detail', {
        reward: 8,
        dailyLimit: 20,
      })
    ).toContain('8 Momenta');
  });

  it('uses regional proof terms in Portuguese', () => {
    expect(translate('pt-BR', 'today.state.pending.title')).toContain(
      'comprovação'
    );
    expect(translate('pt-PT', 'today.state.pending.title')).toContain(
      'comprovativo'
    );
  });
});
