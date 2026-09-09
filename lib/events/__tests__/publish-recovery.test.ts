import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  decodeEventPublishRecovery,
  getEventPublishRecoveryKey,
  listEventPublishRecoveries,
  saveEventPublishRecovery,
} from '@/lib/events/publish-recovery';

const USER_ID = 'person-1';
const EVENT_ID = '11111111-1111-4111-8111-111111111111';

describe('event publishing receipt recovery', () => {
  const recovery = {
    version: 1,
    ownerUserId: USER_ID,
    eventId: EVENT_ID,
    input: {
      clientEventId: '22222222-2222-4222-8222-222222222222',
      title: 'Harbour Run Club',
      description: null,
      venueName: 'Silo Park',
      timeZone: 'Pacific/Auckland',
      visibility: 'unlisted',
      startsAt: '2026-08-23T21:00:00.000Z',
      endsAt: '2026-08-23T22:30:00.000Z',
      capacity: 60,
    },
    updatedAt: '2026-08-09T01:00:00.000Z',
  } as const;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('stores only the original request facts needed to recover a cached receipt', () => {
    expect(decodeEventPublishRecovery(JSON.stringify(recovery))).toEqual(
      recovery
    );
    expect(JSON.stringify(recovery)).not.toContain('organiserCheckInCode');
    expect(JSON.stringify(recovery)).not.toContain('shareToken');
    expect(JSON.stringify(recovery)).not.toContain('inviteToken');
  });

  it('keys recovery to both the organiser and event', () => {
    expect(getEventPublishRecoveryKey(USER_ID, EVENT_ID)).toContain(USER_ID);
    expect(getEventPublishRecoveryKey(USER_ID, EVENT_ID)).toContain(EVENT_ID);
  });

  it('rejects an unbounded or malformed recovery record', () => {
    expect(
      decodeEventPublishRecovery(
        JSON.stringify({
          ...recovery,
          input: { ...recovery.input, capacity: 10001 },
        })
      )
    ).toBeNull();
  });

  it('rediscovers this account’s private organiser pass after a cold start without knowing the event id', async () => {
    await saveEventPublishRecovery({
      ownerUserId: recovery.ownerUserId,
      eventId: recovery.eventId,
      publishInput: recovery.input,
    });
    await saveEventPublishRecovery({
      ownerUserId: USER_ID,
      eventId: '33333333-3333-4333-8333-333333333333',
      publishInput: {
        ...recovery.input,
        clientEventId: '44444444-4444-4444-8444-444444444444',
        title: 'Invite-only studio session',
        visibility: 'invite_only',
      },
    });
    await saveEventPublishRecovery({
      ownerUserId: 'person-2',
      eventId: '55555555-5555-4555-8555-555555555555',
      publishInput: {
        ...recovery.input,
        clientEventId: '66666666-6666-4666-8666-666666666666',
      },
    });

    const restartedAccountRecoveries =
      await listEventPublishRecoveries(USER_ID);

    expect(restartedAccountRecoveries).toHaveLength(2);
    expect(restartedAccountRecoveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerUserId: USER_ID,
          eventId: EVENT_ID,
          input: expect.objectContaining({
            title: 'Harbour Run Club',
            visibility: 'unlisted',
          }),
        }),
        expect.objectContaining({
          ownerUserId: USER_ID,
          eventId: '33333333-3333-4333-8333-333333333333',
          input: expect.objectContaining({
            title: 'Invite-only studio session',
            visibility: 'invite_only',
          }),
        }),
      ])
    );
  });
});
