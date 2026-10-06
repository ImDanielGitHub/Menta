import { getMomentaSpendSignInCopy } from '@/lib/momenta/spend-auth-copy';

describe('momenta spend sign-in copy', () => {
  it('names spending Momenta instead of a generic login required toast', () => {
    const copy = getMomentaSpendSignInCopy();

    expect(copy.title).toBe('Sign in before spending Momenta.');
    expect(copy.detail).toBe(
      'This spend was not made. Sign in, then try again.'
    );
    expect(copy.title.toLowerCase()).not.toContain('login required');
    expect(copy.detail.toLowerCase()).not.toContain('please log in');
  });
});
