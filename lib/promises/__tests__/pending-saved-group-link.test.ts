import {
  decodePendingSavedGroupLink,
  getPendingSavedGroupLinkKey,
} from '../pending-saved-group-link';

describe('pending saved-group link persistence', () => {
  const now = Date.parse('2026-09-01T12:00:00.000Z');

  it('restores the same link event before and after group creation', () => {
    const request = {
      challengeId: '10000000-0000-4000-8000-000000000001',
      clientEventId: '20000000-0000-4000-8000-000000000002',
    };

    expect(
      decodePendingSavedGroupLink(
        JSON.stringify({
          version: 1,
          request,
          createdAt: '2026-09-01T11:00:00.000Z',
          group: {
            id: '30000000-0000-4000-8000-000000000003',
            name: 'Sunday crew',
          },
        }),
        now
      )
    ).toEqual({
      version: 1,
      request,
      createdAt: '2026-09-01T11:00:00.000Z',
      group: {
        id: '30000000-0000-4000-8000-000000000003',
        name: 'Sunday crew',
      },
    });
  });

  it('isolates the durable handoff by authenticated user', () => {
    expect(getPendingSavedGroupLinkKey('actor-a')).not.toBe(
      getPendingSavedGroupLinkKey('actor-b')
    );
  });

  it.each([
    null,
    'not-json',
    '{}',
    JSON.stringify({ version: 2 }),
    JSON.stringify({
      version: 1,
      request: { challengeId: 'promise', clientEventId: 'event' },
      createdAt: '2026-08-01T00:00:00.000Z',
    }),
    JSON.stringify({
      version: 1,
      request: { challengeId: 'promise', clientEventId: 'event' },
      createdAt: '2026-09-01T11:00:00.000Z',
      group: { id: 'group' },
    }),
  ])('rejects incomplete, stale, or corrupt handoffs', raw => {
    expect(decodePendingSavedGroupLink(raw, now)).toBeNull();
  });
});
