import {
  buildEventLink,
  buildEventRoutePath,
  parseEventLink,
  resolveEventLink,
} from '@/lib/events/links';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const CAPABILITY = 'a'.repeat(32);

describe('event access links', () => {
  it('keeps an unlisted capability explicit and opaque', () => {
    const link = buildEventLink({
      eventId: EVENT_ID,
      capability: { kind: 'share', token: CAPABILITY },
    });

    expect(parseEventLink(link)).toEqual({
      eventId: EVENT_ID,
      capability: { kind: 'share', token: CAPABILITY },
      source: 'https',
    });

    const parsed = parseEventLink(link);
    expect(parsed && buildEventRoutePath(parsed)).toBe(
      `/events/${EVENT_ID}?shareToken=${CAPABILITY}`
    );
  });

  it('maps custom-scheme event links to the same capability contract', () => {
    const parsed = parseEventLink(
      `menta://event/${EVENT_ID}?invite=${CAPABILITY}`
    );

    expect(parsed).toEqual({
      eventId: EVENT_ID,
      capability: { kind: 'invite', token: CAPABILITY },
      source: 'custom_scheme',
    });
    expect(parsed && buildEventRoutePath(parsed)).toBe(
      `/events/${EVENT_ID}?inviteToken=${CAPABILITY}`
    );
  });

  it('does not treat an event id as an invite-only capability', () => {
    expect(parseEventLink(`https://menta.quest/event/${EVENT_ID}`)).toEqual({
      eventId: EVENT_ID,
      capability: null,
      source: 'https',
    });
  });

  it('rejects malformed, conflicting and untrusted capabilities', () => {
    expect(
      parseEventLink(`https://menta.quest/event/${EVENT_ID}?share=short-token`)
    ).toBeNull();
    expect(
      parseEventLink(
        `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}&invite=${CAPABILITY}`
      )
    ).toBeNull();
    expect(
      parseEventLink(`https://not-menta.example/event/${EVENT_ID}`)
    ).toBeNull();
    expect(
      parseEventLink(`https://menta.quest/event/${EVENT_ID}?share=`)
    ).toBeNull();
    expect(
      parseEventLink(
        `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}&share=${CAPABILITY}`
      )
    ).toBeNull();
    expect(
      parseEventLink(`https://menta.quest/event/${EVENT_ID}/check-in`)
    ).toBeNull();
  });

  it('distinguishes an invalid owned event link from an unrelated link', () => {
    expect(
      resolveEventLink(`https://menta.quest/event/${EVENT_ID}?invite=short`)
    ).toEqual({ status: 'invalid_event' });
    expect(resolveEventLink(`https://menta.quest/join/${EVENT_ID}`)).toEqual({
      status: 'not_event',
    });
  });
});
