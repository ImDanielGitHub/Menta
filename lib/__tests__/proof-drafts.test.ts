import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PROOF_DRAFTS_STORAGE_KEY,
  createClientEventId,
  createProofDraft,
  getActiveProofDraftForChallenge,
  getProofDraft,
  getProofReceiptCopy,
  isShareableProofReceipt,
  listResumableProofDrafts,
  loadProofDrafts,
  mapServerStatusToReceipt,
  removeProofDraft,
  updateProofDraft,
} from '@/lib/proof-drafts';

describe('proof-drafts', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('creates a stable client event id shaped like a uuid', () => {
    const id = createClientEventId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('maps server statuses to truthful receipts', () => {
    expect(mapServerStatusToReceipt('approved')).toBe('accepted');
    expect(mapServerStatusToReceipt('pending')).toBe('pending-review');
    expect(mapServerStatusToReceipt('rejected')).toBe('correction-requested');
    expect(mapServerStatusToReceipt('submitted')).toBe('sent');
    expect(mapServerStatusToReceipt(null)).toBe('unknown-result');
    expect(mapServerStatusToReceipt('unexpected')).toBe('unknown-result');
  });

  it('does not claim background upload in saved-local copy', () => {
    const copy = getProofReceiptCopy('saved-local');
    expect(copy.title).toBe('Saved on this phone');
    expect(copy.detail.toLowerCase()).not.toContain('background');
    expect(getProofReceiptCopy('uploading').detail.toLowerCase()).not.toContain(
      'keep the app open'
    );
    expect(getProofReceiptCopy('uploading').detail).toContain(
      'You can leave this screen'
    );
    expect(getProofReceiptCopy('accepted')).toEqual({
      title: 'Proof approved',
      detail: "It now counts for today's promise.",
    });
    expect(
      getProofReceiptCopy('correction-requested', { proofType: 'photo' })
    ).toEqual({
      title: 'One clearer photo, then you’re done',
      detail: 'Add a clearer photo to finish today.',
    });
  });

  it('only exposes server-backed pending and accepted receipts for sharing', () => {
    expect(isShareableProofReceipt('pending-review')).toBe(true);
    expect(isShareableProofReceipt('accepted')).toBe(true);
    expect(isShareableProofReceipt('saved-local')).toBe(false);
    expect(isShareableProofReceipt('uploading')).toBe(false);
    expect(isShareableProofReceipt('unknown-result')).toBe(false);
    expect(isShareableProofReceipt('failed')).toBe(false);
  });

  it('persists drafts and recovers them after reload', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      groupId: 'group-1',
      proofType: 'photo',
      proofValue: 'file:///tmp/proof.jpg',
      clientTimeZone: 'Pacific/Auckland',
      localMediaUri: 'file:///tmp/proof.jpg',
    });

    expect(draft.status).toBe('saved-local');
    expect(draft.sendRequestedAt).toBeNull();
    expect(draft.clientEventId).toBeTruthy();
    expect(draft.localMediaUri).toBe('file:///tmp/proof.jpg');
    expect(draft.groupId).toBe('group-1');

    const reloaded = await loadProofDrafts();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].clientEventId).toBe(draft.clientEventId);
    expect(reloaded[0].groupId).toBe('group-1');

    const stored = await AsyncStorage.getItem(PROOF_DRAFTS_STORAGE_KEY);
    expect(stored).toContain(draft.clientEventId);
  });

  it('does not resume a captured preview until send is deliberately requested', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'photo',
      proofValue: 'file:///documents/proof.jpg',
      clientTimeZone: 'Pacific/Auckland',
      localMediaUri: 'file:///documents/proof.jpg',
    });

    expect(await listResumableProofDrafts()).toEqual([]);

    const consented = await updateProofDraft(draft.clientEventId, {
      sendRequestedAt: '2026-08-05T01:00:00.000Z',
    });
    expect(
      (await listResumableProofDrafts()).map(item => item.clientEventId)
    ).toEqual([consented.clientEventId]);
  });

  it('updates status and lists resumable drafts', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'text',
      proofValue: '  Walked 30 minutes  ',
      clientTimeZone: 'Pacific/Auckland',
    });

    expect(draft.proofValue).toBe('Walked 30 minutes');

    await updateProofDraft(draft.clientEventId, {
      status: 'unknown-result',
      lastError: 'network dropped',
    });

    const active = await getActiveProofDraftForChallenge(
      'user-1',
      'challenge-1'
    );
    expect(active?.status).toBe('unknown-result');

    const resumable = await listResumableProofDrafts();
    expect(resumable.map(item => item.clientEventId)).toEqual([
      draft.clientEventId,
    ]);

    await updateProofDraft(draft.clientEventId, { status: 'accepted' });
    expect(await listResumableProofDrafts()).toEqual([]);
    expect(
      await getActiveProofDraftForChallenge('user-1', 'challenge-1')
    ).toBeNull();
  });

  it('reopens a failed local draft for manual recovery after relaunch', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'photo',
      proofValue: 'file:///documents/proof.jpg',
      localMediaUri: 'file:///documents/proof.jpg',
      clientTimeZone: 'Pacific/Auckland',
    });
    await updateProofDraft(draft.clientEventId, {
      status: 'failed',
      sendRequestedAt: '2026-08-05T01:00:00.000Z',
      lastError: 'Challenge temporarily unavailable',
    });

    const recovered = await getActiveProofDraftForChallenge(
      'user-1',
      'challenge-1'
    );
    expect(recovered).toMatchObject({
      clientEventId: draft.clientEventId,
      status: 'failed',
      localMediaUri: 'file:///documents/proof.jpg',
    });
    expect(await listResumableProofDrafts()).toEqual([]);
  });

  it('removes drafts by client event id', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'video',
      proofValue: 'user-1/proof.mp4',
      clientTimeZone: 'UTC',
    });

    await removeProofDraft(draft.clientEventId);
    expect(await getProofDraft(draft.clientEventId)).toBeNull();
  });
});
