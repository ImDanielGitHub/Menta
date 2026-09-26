import { paywallManager } from '../manager';

describe('paywall manager', () => {
  it('gives each open request a distinct runtime-local identifier', () => {
    const identifiers: string[] = [];
    const unsubscribe = paywallManager.subscribe(options => {
      identifiers.push(options.id);
    });

    paywallManager.open();
    paywallManager.open({ context: 'challenge' });
    unsubscribe();

    expect(identifiers).toHaveLength(2);
    expect(identifiers[0]).toMatch(/^paywall-\d+$/);
    expect(identifiers[1]).toMatch(/^paywall-\d+$/);
    expect(identifiers[0]).not.toBe(identifiers[1]);
  });
});
