import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildEventCreateDraft,
  buildEventCreateSchedule,
  canReuseEventCreatePublishClientEventId,
  clearEventCreateDraft,
  decodeEventCreateDraft,
  getEventCreateDraftKey,
  isActiveEventCreateDraftRequest,
  loadEventCreateDraft,
  saveEventCreateDraft,
} from '@/lib/events/create-draft';

const input = {
  ownerUserId: 'person-1',
  name: 'Sunday Social Run',
  date: '2026-08-23',
  startTime: '09:00',
  durationMinutes: 90 as const,
  description: 'A relaxed run and coffee after.',
  visibility: 'public' as const,
  location: 'Waterfront steps',
  capacity: '60',
};

describe('event creation draft', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keys drafts to the owning account', () => {
    expect(getEventCreateDraftKey('person-1')).toContain('person-1');
    expect(getEventCreateDraftKey('person-1')).not.toBe(
      getEventCreateDraftKey('person-2')
    );
  });

  it('builds a bounded private draft and rejects a malformed source', () => {
    const draft = buildEventCreateDraft(input);

    expect(draft.ownerUserId).toBe('person-1');
    expect(draft.description).toBe('A relaxed run and coffee after.');
    expect(draft.version).toBe(3);
    expect(draft.publishClientEventId).toBeNull();
    expect(decodeEventCreateDraft(JSON.stringify(draft))).toEqual(draft);
    expect(decodeEventCreateDraft('{"version":3}')).toBeNull();
  });

  it('upgrades the safe fields from a legacy device worksheet', () => {
    const legacy = decodeEventCreateDraft(
      JSON.stringify({
        version: 1,
        ownerUserId: 'person-1',
        name: 'Old draft',
        when: 'Sunday morning',
        description: '',
        visibility: 'unlisted',
        autoVerification: 'organiser_review',
        location: 'Waterfront',
        checkInWindow: '',
        photoPosting: 'attendees',
        reviewPolicy: 'required',
        updatedAt: '2026-08-05T01:00:00.000Z',
      })
    );

    expect(legacy).toMatchObject({
      version: 3,
      name: 'Old draft',
      visibility: 'unlisted',
      date: '',
      startTime: '',
      publishClientEventId: null,
    });
  });

  it('upgrades a v2 event worksheet without inventing a publish key', () => {
    const previous = decodeEventCreateDraft(
      JSON.stringify({
        version: 2,
        ...input,
        updatedAt: '2026-08-05T01:00:00.000Z',
      })
    );

    expect(previous).toMatchObject({
      version: 3,
      name: input.name,
      publishClientEventId: null,
    });
  });

  it('loads the previous storage key and rewrites it as the current draft', async () => {
    const previousKey = `menta.event-create-draft.v2:${input.ownerUserId}`;
    await AsyncStorage.setItem(
      previousKey,
      JSON.stringify({
        version: 2,
        ...input,
        updatedAt: '2026-08-05T01:00:00.000Z',
      })
    );

    const migrated = await loadEventCreateDraft(input.ownerUserId);
    expect(migrated).toMatchObject({
      version: 3,
      publishClientEventId: null,
    });

    await saveEventCreateDraft(input);
    expect(await AsyncStorage.getItem(previousKey)).toBeNull();
    expect(
      await AsyncStorage.getItem(getEventCreateDraftKey(input.ownerUserId))
    ).not.toBeNull();
  });

  it('reuses one persisted publish key after an unknown result and reload', async () => {
    const clientEventId = '22222222-2222-4222-8222-222222222222';
    await saveEventCreateDraft({
      ...input,
      publishClientEventId: clientEventId,
    });

    // An unknown result deliberately leaves the private draft in place.
    const reloaded = await loadEventCreateDraft(input.ownerUserId);
    expect(reloaded?.publishClientEventId).toBe(clientEventId);
    expect(canReuseEventCreatePublishClientEventId(reloaded, input)).toBe(true);

    // Returning through step one without editing must not rotate the request.
    const resaved = await saveEventCreateDraft(input);
    expect(resaved.publishClientEventId).toBe(clientEventId);
  });

  it('rotates only when publish facts change and then keeps the new key', async () => {
    const firstClientEventId = '22222222-2222-4222-8222-222222222222';
    const nextClientEventId = '33333333-3333-4333-8333-333333333333';
    await saveEventCreateDraft({
      ...input,
      publishClientEventId: firstClientEventId,
    });

    const changedInput = { ...input, location: 'Western Springs' };
    const reloaded = await loadEventCreateDraft(input.ownerUserId);
    expect(
      canReuseEventCreatePublishClientEventId(reloaded, changedInput)
    ).toBe(false);

    const reset = await saveEventCreateDraft(changedInput);
    expect(reset.publishClientEventId).toBeNull();

    const nextAttempt = await saveEventCreateDraft({
      ...changedInput,
      publishClientEventId: nextClientEventId,
    });
    expect(nextAttempt.publishClientEventId).toBe(nextClientEventId);
    expect(
      canReuseEventCreatePublishClientEventId(nextAttempt, changedInput)
    ).toBe(true);
  });

  it('clears the completed publish key before the next event draft', async () => {
    await saveEventCreateDraft({
      ...input,
      publishClientEventId: '22222222-2222-4222-8222-222222222222',
    });

    // Authoritative completion clears the full draft after recovery is saved.
    await clearEventCreateDraft(input.ownerUserId);
    expect(await loadEventCreateDraft(input.ownerUserId)).toBeNull();

    const nextDraft = await saveEventCreateDraft({
      ...input,
      name: 'A different event',
    });
    expect(nextDraft.publishClientEventId).toBeNull();
  });

  it('rejects a persisted publish key that is not a UUID', () => {
    const draft = buildEventCreateDraft(input);
    expect(
      decodeEventCreateDraft(
        JSON.stringify({ ...draft, publishClientEventId: 'not-a-uuid' })
      )
    ).toBeNull();
  });

  it('turns a valid local schedule into an exact server timestamp window', () => {
    const schedule = buildEventCreateSchedule({
      date: '2026-08-23',
      startTime: '09:00',
      durationMinutes: 90,
      now: new Date('2026-08-01T00:00:00.000Z'),
    });

    expect(schedule).toMatchObject({ ok: true });
    if (!schedule.ok) throw new Error('Expected a valid schedule');
    expect(Date.parse(schedule.endsAt) - Date.parse(schedule.startsAt)).toBe(
      90 * 60 * 1000
    );
  });

  it('rejects malformed and past schedules before any network action', () => {
    expect(
      buildEventCreateSchedule({
        date: '23/08/2026',
        startTime: '9am',
        durationMinutes: 90,
      })
    ).toMatchObject({ ok: false });
    expect(
      buildEventCreateSchedule({
        date: '2026-08-01',
        startTime: '09:00',
        durationMinutes: 90,
        now: new Date('2026-08-02T00:00:00.000Z'),
      })
    ).toMatchObject({
      ok: false,
      message: 'Choose a start time in the future.',
    });
  });

  it('rejects a stale account A read after account B becomes active', () => {
    const staleAccountA = { ownerUserId: 'person-a', requestId: 1 };
    const activeAccountB = { ownerUserId: 'person-b', requestId: 2 };

    expect(isActiveEventCreateDraftRequest(activeAccountB, staleAccountA)).toBe(
      false
    );
    expect(
      isActiveEventCreateDraftRequest(activeAccountB, activeAccountB)
    ).toBe(true);
  });
});
