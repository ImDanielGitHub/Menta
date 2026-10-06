import { translate } from '@/lib/localization';
import { getPromiseStateErrorCopy } from '@/lib/errors/promise-state-copy';

describe('promise state error copy', () => {
  it('names a failed promise refresh without saying challenge', () => {
    const copy = getPromiseStateErrorCopy();
    expect(copy.title).toBe('This promise could not update');
    expect(copy.body).toBe('Menta could not refresh this promise. Try again.');
    expect(copy.title).not.toMatch(/challenge/i);
    expect(copy.body).not.toMatch(/challenge/i);
  });

  it('uses the injected locale for the promise-state toast', () => {
    const localise = (
      key: Parameters<typeof translate>[1],
      values?: Parameters<typeof translate>[2]
    ) => translate('fr-FR', key, values);

    const copy = getPromiseStateErrorCopy(localise);
    expect(copy.title).toBe('Cette promesse n’a pas pu se mettre à jour');
    expect(copy.title).not.toMatch(/test/i);
    expect(copy.body).not.toMatch(/challenge/i);
  });
});
