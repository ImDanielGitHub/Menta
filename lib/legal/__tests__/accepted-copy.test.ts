import { getLegalAcceptedTitleCopy } from '@/lib/legal/accepted-copy';
import { translate } from '@/lib/localization/translate';

describe('legal accepted title copy', () => {
  it('names current agreements instead of a hardcoded English heading', () => {
    expect(getLegalAcceptedTitleCopy()).toBe('Your agreements are up to date');
    expect(getLegalAcceptedTitleCopy()).toBe(
      translate(
        'en-NZ',
        'fullAuth.source.accountability.agreements_current_title'
      )
    );
  });

  it('uses the active translator so accepted legal copy can localise', () => {
    expect(getLegalAcceptedTitleCopy(key => translate('de-DE', key))).toBe(
      translate(
        'de-DE',
        'fullAuth.source.accountability.agreements_current_title'
      )
    );
  });
});
