import {
  getEventActionUnknownCopy,
  resolveEventActionLocale,
} from '../event-action-copy';

describe('event action unknown copy', () => {
  it('names a lost request as unfinished, not leftover English', () => {
    expect(getEventActionUnknownCopy('transport', 'en-NZ')).toBe(
      'The event action may have gone through. Reconnect and check its status before trying again.'
    );
    expect(getEventActionUnknownCopy('transport', 'en-NZ')).toContain(
      'before trying again'
    );
  });

  it('names an unreadable receipt as still in place, not leftover English', () => {
    expect(getEventActionUnknownCopy('malformed', 'en-NZ')).toBe(
      'Menta could not read the result. Check what changed before trying again.'
    );
    expect(getEventActionUnknownCopy('malformed', 'en-NZ')).toContain(
      'Check what changed'
    );
  });

  it('follows the chosen language instead of leftover English', () => {
    expect(getEventActionUnknownCopy('transport', 'de-DE')).not.toBe(
      "We couldn't tell whether the event action went through. Check its status before trying again."
    );
    expect(getEventActionUnknownCopy('malformed', 'fr-FR')).not.toBe(
      "Menta couldn't read the result. Check what changed before trying again."
    );
    expect(resolveEventActionLocale('pt-BR')).toBe('pt-BR');
  });
});
