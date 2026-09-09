import {
  canonicalCommandForHash,
  isCanonicalEventMediaPathFor,
  parseCanonicalEventMediaPath,
  parseEventFunctionCommand,
} from '../contracts.ts';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OCCURRENCE_ID = '22222222-2222-4222-8222-222222222222';
const POST_ID = '33333333-3333-4333-8333-333333333333';
const CLIENT_EVENT_ID = '44444444-4444-4444-8444-444444444444';

describe('event participation Edge contracts', () => {
  it('accepts bounded event facts but never caller-controlled actor, hash or capability secrets', () => {
    const input = {
      action: 'create_event',
      clientEventId: CLIENT_EVENT_ID,
      title: 'Harbour Run Club',
      description: 'An easy social loop.',
      venueName: 'Silo Park',
      timeZone: 'Pacific/Auckland',
      visibility: 'unlisted',
      startsAt: '2026-08-23T21:00:00.000Z',
      endsAt: '2026-08-23T22:30:00.000Z',
      capacity: 60,
    };

    const parsed = parseEventFunctionCommand(input);
    expect(parsed).toMatchObject({
      ok: true,
      command: {
        action: 'create_event',
        title: 'Harbour Run Club',
        visibility: 'unlisted',
        capacity: 60,
      },
    });
    expect(
      parseEventFunctionCommand({
        ...input,
        actorId: EVENT_ID,
        requestHash: 'f'.repeat(64),
        checkInToken: 'caller-secret-token',
      })
    ).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });

    const reordered = parseEventFunctionCommand({
      capacity: 60,
      endsAt: input.endsAt,
      visibility: 'unlisted',
      startsAt: input.startsAt,
      timeZone: 'Pacific/Auckland',
      venueName: 'Silo Park',
      description: 'An easy social loop.',
      title: 'Harbour Run Club',
      clientEventId: CLIENT_EVENT_ID,
      action: 'create_event',
    });
    if (!parsed.ok || !reordered.ok) {
      throw new Error('Expected valid create-event commands');
    }
    expect(canonicalCommandForHash(parsed.command)).toBe(
      canonicalCommandForHash(reordered.command)
    );
  });

  it('accepts only canonical UTC event timestamps with valid calendar dates', () => {
    const input = {
      action: 'create_event',
      clientEventId: CLIENT_EVENT_ID,
      title: 'Harbour Run Club',
      description: null,
      venueName: 'Silo Park',
      timeZone: 'Pacific/Auckland',
      visibility: 'public',
      startsAt: '2026-08-23T21:00:00.000Z',
      endsAt: '2026-08-23T22:30:00.000Z',
      capacity: null,
    };

    expect(parseEventFunctionCommand(input)).toMatchObject({
      ok: true,
      command: {
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
    });

    for (const startsAt of [
      '2026-02-30T21:00:00.000Z',
      '2026-08-23 21:00:00.000Z',
      '2026-08-23T21:00:00+00:00',
      '2026-08-23T21:00:00Z',
      '2026-08-23T24:00:00.000Z',
      '2026-8-23T21:00:00.000Z',
    ]) {
      expect(parseEventFunctionCommand({ ...input, startsAt })).toMatchObject({
        ok: false,
        code: 'INVALID_REQUEST',
      });
    }
  });

  it('permits bounded public discovery but rejects caller-controlled filters', () => {
    expect(parseEventFunctionCommand({ action: 'list_public_events' })).toEqual(
      { ok: true, command: { action: 'list_public_events' } }
    );
    expect(
      parseEventFunctionCommand({
        action: 'list_public_events',
        visibility: 'invite_only',
      })
    ).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
  });

  it('accepts only an occurrence id for the self-scoped organiser queue', () => {
    expect(
      parseEventFunctionCommand({
        action: 'get_organiser_review_queue',
        occurrenceId: OCCURRENCE_ID,
      })
    ).toEqual({
      ok: true,
      command: {
        action: 'get_organiser_review_queue',
        occurrenceId: OCCURRENCE_ID,
      },
    });

    expect(
      parseEventFunctionCommand({
        action: 'get_organiser_review_queue',
        occurrenceId: OCCURRENCE_ID,
        actorId: EVENT_ID,
      })
    ).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
  });

  it('accepts only the caller-scoped keys for attendee albums and organiser recaps', () => {
    expect(
      parseEventFunctionCommand({
        action: 'get_attendee_album',
        occurrenceId: OCCURRENCE_ID,
      })
    ).toEqual({
      ok: true,
      command: {
        action: 'get_attendee_album',
        occurrenceId: OCCURRENCE_ID,
      },
    });
    expect(
      parseEventFunctionCommand({
        action: 'get_organiser_recap',
        eventId: EVENT_ID,
      })
    ).toEqual({
      ok: true,
      command: { action: 'get_organiser_recap', eventId: EVENT_ID },
    });

    expect(
      parseEventFunctionCommand({
        action: 'get_attendee_album',
        occurrenceId: OCCURRENCE_ID,
        mediaPath: `v1/${EVENT_ID}/${OCCURRENCE_ID}/${POST_ID}.jpg`,
      })
    ).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
    expect(
      parseEventFunctionCommand({
        action: 'get_organiser_recap',
        eventId: EVENT_ID,
        actorId: EVENT_ID,
      })
    ).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
  });

  it('rejects a client-supplied storage path at finalisation', () => {
    const result = parseEventFunctionCommand({
      action: 'finalise_post',
      postId: POST_ID,
      clientEventId: CLIENT_EVENT_ID,
      storagePath: `v1/${EVENT_ID}/${OCCURRENCE_ID}/${POST_ID}.jpg`,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        action: 'finalise_post',
        code: 'INVALID_REQUEST',
      })
    );
  });

  it('does not accept caller-provided request hashes or loose review decisions', () => {
    const withClientHash = parseEventFunctionCommand({
      action: 'join',
      occurrenceId: OCCURRENCE_ID,
      clientEventId: CLIENT_EVENT_ID,
      consentVersion: 'attendance-v1',
      requestHash: 'f'.repeat(64),
    });
    const looseDecision = parseEventFunctionCommand({
      action: 'review_post',
      postId: POST_ID,
      clientEventId: CLIENT_EVENT_ID,
      expectedRevision: 2,
      decision: 'confirm',
      note: null,
    });

    expect(withClientHash.ok).toBe(false);
    expect(looseDecision.ok).toBe(false);
  });

  it('canonicalises parsed mutations independently of raw object key order', () => {
    const first = parseEventFunctionCommand({
      action: 'join',
      occurrenceId: OCCURRENCE_ID,
      clientEventId: CLIENT_EVENT_ID,
      consentVersion: 'attendance-v1',
      shareToken: null,
      inviteToken: null,
    });
    const second = parseEventFunctionCommand({
      inviteToken: null,
      clientEventId: CLIENT_EVENT_ID,
      action: 'join',
      consentVersion: 'attendance-v1',
      shareToken: null,
      occurrenceId: OCCURRENCE_ID,
    });

    if (!first.ok || !second.ok) {
      throw new Error('Expected valid join command contracts');
    }

    expect(canonicalCommandForHash(first.command)).toBe(
      canonicalCommandForHash(second.command)
    );
  });

  it('accepts only the server-owned canonical event media path', () => {
    const validPath = `v1/${EVENT_ID}/${OCCURRENCE_ID}/${POST_ID}.jpg`;

    expect(parseCanonicalEventMediaPath(validPath)).toEqual({
      ownerId: EVENT_ID,
      occurrenceId: OCCURRENCE_ID,
      postId: POST_ID,
      extension: 'jpg',
    });
    expect(
      isCanonicalEventMediaPathFor(validPath, EVENT_ID, OCCURRENCE_ID, POST_ID)
    ).toBe(true);
    expect(
      isCanonicalEventMediaPathFor(
        `v1/${EVENT_ID}/${OCCURRENCE_ID}/../${POST_ID}.jpg`,
        EVENT_ID,
        OCCURRENCE_ID,
        POST_ID
      )
    ).toBe(false);
    expect(
      isCanonicalEventMediaPathFor(
        validPath,
        '55555555-5555-4555-8555-555555555555',
        OCCURRENCE_ID,
        POST_ID
      )
    ).toBe(false);
  });
});
