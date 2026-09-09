import {
  getRegisteredCatalogueLocales,
  LANGUAGE_OPTIONS,
} from '@/lib/localization';

describe('language preference catalogue contract', () => {
  it('offers exactly the catalogues registered in the localisation runtime', () => {
    expect(LANGUAGE_OPTIONS.map(option => option.locale).sort()).toEqual(
      getRegisteredCatalogueLocales()
    );
  });

  it('keeps each regional option distinct and visibly identified', () => {
    expect(new Set(LANGUAGE_OPTIONS.map(option => option.locale)).size).toBe(
      LANGUAGE_OPTIONS.length
    );
    expect(LANGUAGE_OPTIONS.every(option => option.flag.length > 0)).toBe(true);
    expect(
      LANGUAGE_OPTIONS.filter(option => option.nativeName === 'Español').map(
        option => option.regionalName
      )
    ).toEqual(['España', 'México']);
  });
});
