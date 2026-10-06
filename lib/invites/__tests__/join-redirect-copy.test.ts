import { translate } from '@/lib/localization';
import {
  getJoinRedirectMissingCodeCopy,
  resolveJoinRedirectDestination,
} from '@/lib/invites/join-redirect-copy';

describe('join redirect destination copy', () => {
  it('keeps a promise link a promise when the code is missing or invalid', () => {
    expect(resolveJoinRedirectDestination({ type: 'challenge' })).toBe(
      'promise'
    );
    expect(resolveJoinRedirectDestination({ challenge: 'bad!' })).toBe(
      'promise'
    );
    expect(
      resolveJoinRedirectDestination({ type: 'CHALLENGE', code: '??' })
    ).toBe('promise');
  });

  it('keeps a group link a group when the code is missing or invalid', () => {
    expect(resolveJoinRedirectDestination({ type: 'group' })).toBe('group');
    expect(resolveJoinRedirectDestination({ invite: 'bad!' })).toBe('group');
  });

  it('does not guess a destination from an empty link', () => {
    expect(resolveJoinRedirectDestination({})).toBe('unknown');
    expect(resolveJoinRedirectDestination({ code: '??' })).toBe('unknown');
  });

  it('does not send a broken promise invite to group-code entry', () => {
    const copy = getJoinRedirectMissingCodeCopy('promise');
    expect(copy.title).toBe('Promise invite needs a code');
    expect(copy.noticeDetail).toContain('Ask the sender for a new invitation');
    expect(copy.canEnterGroupCode).toBe(false);
    expect(copy.title).not.toMatch(/group/i);
  });

  it('keeps group-code entry for group and unknown missing codes', () => {
    expect(getJoinRedirectMissingCodeCopy('group').canEnterGroupCode).toBe(
      true
    );
    expect(getJoinRedirectMissingCodeCopy('unknown').canEnterGroupCode).toBe(
      true
    );
    expect(getJoinRedirectMissingCodeCopy('unknown').title).toBe(
      'Invite link needs a code'
    );
  });

  it('uses the injected locale for promise recovery copy', () => {
    const localise = (
      key: Parameters<typeof translate>[1],
      values?: Parameters<typeof translate>[2]
    ) => translate('de-DE', key, values);

    expect(getJoinRedirectMissingCodeCopy('promise', localise).title).toBe(
      'Versprechen-Einladung braucht einen Code'
    );
  });
});
