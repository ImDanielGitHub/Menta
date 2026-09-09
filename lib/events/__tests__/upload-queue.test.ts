import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearEventUploadQueue,
  drainEventUploadQueue,
  getEventUploadDraft,
  listEventUploadQueue,
  serialiseEventUploadForUser,
  updateEventUploadDraft,
  upsertEventUploadDraft,
} from '@/lib/events/upload-queue';

const baseDraft = (input: { userId: string; clientEventId: string }) => ({
  userId: input.userId,
  clientEventId: input.clientEventId,
  eventId: '11111111-1111-4111-8111-111111111111',
  occurrenceId: '22222222-2222-4222-8222-222222222222',
  localUri: `file:///tmp/${input.clientEventId}.jpg`,
  caption: 'I made it',
  contentType: 'image/jpeg' as const,
  byteSize: 42,
  status: 'saved_local' as const,
});

describe('event upload queue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await clearEventUploadQueue('user-a');
    await clearEventUploadQueue('user-b');
  });

  it('persists one record per client event and serialises concurrent queue writes', async () => {
    const first = '33333333-3333-4333-8333-333333333333';
    const second = '44444444-4444-4444-8444-444444444444';

    await Promise.all([
      upsertEventUploadDraft(
        baseDraft({ userId: 'user-a', clientEventId: first })
      ),
      upsertEventUploadDraft(
        baseDraft({ userId: 'user-a', clientEventId: second })
      ),
      updateEventUploadDraft('user-a', first, { status: 'uploading' }),
    ]);

    expect(await listEventUploadQueue('user-a')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clientEventId: first, status: 'uploading' }),
        expect.objectContaining({
          clientEventId: second,
          status: 'saved_local',
        }),
      ])
    );
    expect(await getEventUploadDraft('user-a', first)).toEqual(
      expect.objectContaining({ userId: 'user-a', clientEventId: first })
    );
  });

  it('does not expose or clear another account’s retained event media', async () => {
    await upsertEventUploadDraft(
      baseDraft({
        userId: 'user-a',
        clientEventId: '55555555-5555-4555-8555-555555555555',
      })
    );
    await upsertEventUploadDraft(
      baseDraft({
        userId: 'user-b',
        clientEventId: '66666666-6666-4666-8666-666666666666',
      })
    );

    await clearEventUploadQueue('user-a');

    expect(await listEventUploadQueue('user-a')).toEqual([]);
    expect(await listEventUploadQueue('user-b')).toHaveLength(1);
  });

  it('runs actual upload work one item at a time for one user', async () => {
    await upsertEventUploadDraft(
      baseDraft({
        userId: 'user-a',
        clientEventId: '77777777-7777-4777-8777-777777777777',
      })
    );
    await upsertEventUploadDraft(
      baseDraft({
        userId: 'user-a',
        clientEventId: '88888888-8888-4888-8888-888888888888',
      })
    );

    const order: string[] = [];
    const receipt = await drainEventUploadQueue('user-a', async item => {
      order.push(`start:${item.clientEventId}`);
      await Promise.resolve();
      order.push(`finish:${item.clientEventId}`);
      return item.clientEventId;
    });

    expect(receipt).toHaveLength(2);
    expect(order).toEqual([
      'start:77777777-7777-4777-8777-777777777777',
      'finish:77777777-7777-4777-8777-777777777777',
      'start:88888888-8888-4888-8888-888888888888',
      'finish:88888888-8888-4888-8888-888888888888',
    ]);

    const pipeline: string[] = [];
    await Promise.all([
      serialiseEventUploadForUser('user-a', async () => {
        pipeline.push('first:start');
        await Promise.resolve();
        pipeline.push('first:finish');
      }),
      serialiseEventUploadForUser('user-a', async () => {
        pipeline.push('second:start');
        pipeline.push('second:finish');
      }),
    ]);
    expect(pipeline).toEqual([
      'first:start',
      'first:finish',
      'second:start',
      'second:finish',
    ]);
  });
});
