import { translate } from '@/lib/localization';
import { getProtectedAuthCopy } from '@/lib/auth/protected-gate-copy';

const t = (
  key: Parameters<typeof translate>[1],
  values?: Parameters<typeof translate>[2]
) => translate('en-NZ', key, values);

describe('protected auth gate copy', () => {
  it('names a promise join instead of a group join', () => {
    expect(
      getProtectedAuthCopy({ next: '/join-funding?code=FIT2026', t }).title
    ).toBe('Sign in to join this promise');
    expect(
      getProtectedAuthCopy({ next: '/join-promise?code=BOOK2026', t }).title
    ).toBe('Sign in to join this promise');
    expect(
      getProtectedAuthCopy({
        next: '/join?challenge=FIT2026',
        t,
      }).title
    ).toBe('Sign in to join this promise');
    expect(
      getProtectedAuthCopy({ next: '/join-funding?code=FIT2026', t })
        .description
    ).toContain('Nothing is joined yet');
  });

  it('still names an ordinary group join as a group', () => {
    expect(
      getProtectedAuthCopy({ next: '/join-group?code=ABC123', t }).title
    ).toBe('Sign in to join this group');
    expect(getProtectedAuthCopy({ next: '/groups/group-1', t }).title).toBe(
      'Sign in to join this group'
    );
  });

  it('names promise create and open destinations', () => {
    expect(getProtectedAuthCopy({ next: '/create-challenge', t }).title).toBe(
      'Sign in to create a promise'
    );
    expect(
      getProtectedAuthCopy({ next: '/challenges/challenge-1', t }).title
    ).toBe('Sign in to open this promise');
  });

  it('names event paths even without an events context param', () => {
    expect(
      getProtectedAuthCopy({
        next: '/events/11111111-1111-4111-8111-111111111111',
        t,
      }).title
    ).toBe('Sign in to continue with this event');
    expect(
      getProtectedAuthCopy({ next: '/join-event?eventId=event-1', t }).title
    ).toBe('Sign in to continue with this event');
  });

  it('keeps proof, review and Momenta destinations', () => {
    expect(getProtectedAuthCopy({ next: '/verification', t }).title).toBe(
      'Sign in to add proof'
    );
    expect(getProtectedAuthCopy({ next: '/review-queue', t }).title).toBe(
      'Sign in to review proof'
    );
    expect(getProtectedAuthCopy({ next: '/momenta', t }).title).toBe(
      'Sign in to use Momenta'
    );
  });
});
