import {
  APP_STORE_LOCALE_COUNT,
  APP_STORE_LOCALES,
  getRegisteredCatalogueLocales,
  registerCatalogue,
  resolveCatalogueLocale,
  translate,
} from '@/lib/localization';

describe('localisation contract', () => {
  it('tracks every App Store Connect metadata localisation', () => {
    expect(APP_STORE_LOCALE_COUNT).toBe(50);
    expect(new Set(APP_STORE_LOCALES.map(locale => locale.code)).size).toBe(50);
    expect(
      APP_STORE_LOCALES.filter(locale => locale.direction === 'rtl').map(
        locale => locale.code
      )
    ).toEqual(['ar-SA', 'he', 'ur']);
  });

  it('falls back to canonical New Zealand English', () => {
    expect(resolveCatalogueLocale('ja-JP')).toBe('en-NZ');
    expect(translate('ja-JP', 'brand.tagline')).toBe(
      'Keep the promises you make to yourself.'
    );
  });

  it('resolves a registered regional catalogue by exact locale then language', () => {
    registerCatalogue('es-MX', {
      'term.promise': 'promesa',
    });

    expect(translate('es-MX', 'term.promise')).toBe('promesa');
    expect(resolveCatalogueLocale('es-US')).toBe('es-ES');
    expect(translate('es-US', 'term.promise')).toBe('promesa');
    expect(translate('es-MX', 'term.proof')).toBe('proof');
  });

  it('interpolates values and selects locale-aware plurals', () => {
    expect(translate('en-NZ', 'count.promise', { count: 1 })).toBe('1 promise');
    expect(translate('en-NZ', 'count.promise', { count: 3 })).toBe(
      '3 promises'
    );
  });

  it('translates counted copy when Hermes has no Intl.PluralRules', () => {
    const originalPluralRules = Intl.PluralRules;
    Object.defineProperty(Intl, 'PluralRules', {
      configurable: true,
      value: undefined,
    });

    try {
      for (const locale of getRegisteredCatalogueLocales()) {
        for (const count of [0, 1, 2, 5]) {
          const result = translate(locale, 'count.promise', { count });
          expect(result).toContain(String(count));
          expect(result).not.toMatch(/\{count\}/);
        }
      }
    } finally {
      Object.defineProperty(Intl, 'PluralRules', {
        configurable: true,
        value: originalPluralRules,
      });
    }
  });
});
