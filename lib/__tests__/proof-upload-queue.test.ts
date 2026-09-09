import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProofDraft, updateProofDraft } from '@/lib/proof-drafts';
import {
  PROOF_UPLOAD_QUEUE_STORAGE_KEY,
  dequeueProofUpload,
  enqueueProofUpload,
  getQueuedProofUpload,
  listForegroundResumableUploads,
  loadProofUploadQueue,
} from '@/lib/proof-upload-queue';

describe('proof-upload-queue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('enqueues and persists queue metadata for relaunch recovery', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'photo',
      proofValue: 'file:///tmp/a.jpg',
      clientTimeZone: 'Pacific/Auckland',
    });

    const item = await enqueueProofUpload(draft);
    expect(item.clientEventId).toBe(draft.clientEventId);

    const stored = await AsyncStorage.getItem(PROOF_UPLOAD_QUEUE_STORAGE_KEY);
    expect(stored).toContain(draft.clientEventId);

    const reloaded = await loadProofUploadQueue();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].challengeId).toBe('challenge-1');
  });

  it('updates the same queue row on re-enqueue instead of duplicating', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'photo',
      proofValue: 'file:///tmp/a.jpg',
      clientTimeZone: 'Pacific/Auckland',
    });

    await enqueueProofUpload(draft);
    const bumped = await updateProofDraft(draft.clientEventId, {
      attemptCount: 2,
      status: 'uploading',
    });
    await enqueueProofUpload(bumped);

    const queue = await loadProofUploadQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].attemptCount).toBe(2);
  });

  it('lists foreground-resumable uploads without claiming background work', async () => {
    const saved = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'photo',
      proofValue: 'file:///tmp/a.jpg',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: '11111111-1111-4111-8111-111111111111',
    });
    const consentedSaved = await updateProofDraft(saved.clientEventId, {
      sendRequestedAt: '2026-08-05T01:00:00.000Z',
    });
    await enqueueProofUpload(consentedSaved);

    const unknown = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-2',
      proofType: 'text',
      proofValue: 'Ran today',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: '22222222-2222-4222-8222-222222222222',
    });
    await updateProofDraft(unknown.clientEventId, {
      status: 'unknown-result',
    });
    await enqueueProofUpload({
      ...unknown,
      status: 'unknown-result',
    });

    const accepted = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-3',
      proofType: 'text',
      proofValue: 'Done',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: '33333333-3333-4333-8333-333333333333',
    });
    await updateProofDraft(accepted.clientEventId, { status: 'accepted' });
    await enqueueProofUpload(accepted);
    await dequeueProofUpload(accepted.clientEventId);

    const resumable = await listForegroundResumableUploads();
    expect(resumable.map(item => item.clientEventId).sort()).toEqual([
      saved.clientEventId,
      unknown.clientEventId,
    ]);
  });

  it('ignores a legacy queue row for a preview that was never sent', async () => {
    const preview = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'photo',
      proofValue: 'file:///documents/preview.jpg',
      localMediaUri: 'file:///documents/preview.jpg',
      clientTimeZone: 'Pacific/Auckland',
    });
    await enqueueProofUpload(preview);

    expect(await loadProofUploadQueue()).toHaveLength(1);
    expect(await listForegroundResumableUploads()).toEqual([]);
  });

  it('dequeues by client event id', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofType: 'photo',
      proofValue: 'user-1/a.jpg',
      clientTimeZone: 'UTC',
    });
    await enqueueProofUpload(draft);
    await dequeueProofUpload(draft.clientEventId);
    expect(await getQueuedProofUpload(draft.clientEventId)).toBeNull();
  });
});
