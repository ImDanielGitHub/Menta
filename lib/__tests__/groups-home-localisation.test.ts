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

describe('groups home localisation', () => {
  it.each(regionalLocales)('translates group actions for %s', locale => {
    expect(translate(locale, 'groupsHome.invites.open_saved')).not.toBe(
      translate('en-NZ', 'groupsHome.invites.open_saved')
    );
    expect(translate(locale, 'groupsHome.groupAction.review_action')).not.toBe(
      translate('en-NZ', 'groupsHome.groupAction.review_action')
    );
  });

  it('uses locale plurals for members and waiting work', () => {
    expect(translate('de-DE', 'groupsHome.count.members', { count: 1 })).toBe(
      '1 Mitglied'
    );
    expect(translate('de-DE', 'groupsHome.count.members', { count: 2 })).toBe(
      '2 Mitglieder'
    );
    expect(
      translate('es-ES', 'groupsHome.groupAction.waiting', { count: 1 })
    ).toBe('1 pendiente');
  });

  it('presents challenge invitations as promise invitations', () => {
    expect(translate('en-NZ', 'groupsHome.invites.type.promise')).toBe(
      'promise'
    );
    expect(translate('fr-FR', 'groupsHome.invites.type.promise')).toBe(
      'promesse'
    );
  });

  it('keeps member and group names unchanged', () => {
    expect(
      translate('pt-PT', 'groupsHome.groupAction.review_named', {
        possessiveName: 'Sam',
      })
    ).toContain('Sam');
    expect(
      translate('fr-CA', 'groupsHome.groupAction.pressure_named', {
        group: 'Sunday Crew',
      })
    ).toContain('Sunday Crew');
  });
});
