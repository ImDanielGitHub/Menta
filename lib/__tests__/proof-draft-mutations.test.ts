import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createProofDraft,
  getProofDraft,
  loadProofDrafts,
  removeProofDraft,
  releaseUnreferencedProofMedia,
  saveProofDraft,
  updateProofDraft,
  PROOF_DRAFTS_STORAGE_KEY,
} from '@/lib/proof-drafts';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve };
};
const input = (id: string) => ({
  clientEventId: id,
  userId: 'owner',
  challengeId: 'promise',
  proofType: 'photo' as const,
  proofValue: `file:///fresh/${id}.jpg`,
  clientTimeZone: 'Pacific/Auckland',
});
const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;
const normalGet = getItem.getMockImplementation()!;
const normalSet = setItem.getMockImplementation()!;

beforeEach(async () => {
  getItem.mockImplementation(normalGet);
  setItem.mockImplementation(normalSet);
  await AsyncStorage.clear();
});

it('serializes concurrent create, receipt updates, save and remove without losing other drafts', async () => {
  await Promise.all([
    createProofDraft(input('a')),
    createProofDraft(input('b')),
  ]);
  const a = (await getProofDraft('a'))!;
  await Promise.all([
    updateProofDraft('b', {
      sendRequestedAt: 'deliberate-send',
      status: 'uploading',
    }),
    saveProofDraft({ ...a, proofValue: 'retake', status: 'saved-local' }),
    createProofDraft(input('c')),
    removeProofDraft('a'),
  ]);
  expect((await loadProofDrafts()).map(d => d.clientEventId).sort()).toEqual([
    'b',
    'c',
  ]);
  expect(await getProofDraft('b')).toMatchObject({
    status: 'uploading',
    sendRequestedAt: 'deliberate-send',
  });
});

it.each(['create', 'update'] as const)(
  'rechecks authority after the final %s read before writing',
  async kind => {
    if (kind === 'update') await createProofDraft(input('guarded'));
    const before = await getProofDraft('guarded');
    const read = deferred<string | null>();
    getItem.mockImplementationOnce(() => read.promise);
    let current = true;
    const result =
      kind === 'create'
        ? createProofDraft(input('guarded'), () => current)
        : updateProofDraft('guarded', { proofValue: 'foreign' }, () => current);
    const rejected = expect(result).rejects.toThrow('no longer current');
    await Promise.resolve();
    current = false;
    read.resolve(before ? JSON.stringify([before]) : null);
    await rejected;
    expect(await getProofDraft('guarded')).toEqual(before);
  }
);

it('rejects replacement of another account or promise with the same event ID', async () => {
  const original = await createProofDraft(input('identity'));
  await expect(
    createProofDraft({ ...input('identity'), userId: 'other' })
  ).rejects.toThrow('different account');
  await expect(
    saveProofDraft({ ...original, challengeId: 'other' })
  ).rejects.toThrow('different account');
  expect(await getProofDraft('identity')).toEqual(original);
});

it('waits for an outstanding writer and retains its adopted URI during cleanup', async () => {
  const write = deferred<void>();
  setItem.mockImplementationOnce(async (...args) => {
    await normalSet(...args);
    await write.promise;
  });
  const saving = createProofDraft(input('inflight'));
  const release = jest.fn();
  const cleaning = releaseUnreferencedProofMedia(
    input('inflight').proofValue,
    release
  );
  await Promise.resolve();
  expect(release).not.toHaveBeenCalled();
  write.resolve();
  await saving;
  expect(await cleaning).toBe(false);
  expect(release).not.toHaveBeenCalled();
});

it.each([true, false])(
  'retains ambiguous metadata write media when native storage persisted=%s',
  async persisted => {
    const id = `ambiguous-${persisted}`;
    setItem.mockImplementationOnce(async (...args) => {
      if (persisted) await normalSet(...args);
      throw new Error('native write response lost');
    });
    await expect(createProofDraft(input(id))).rejects.toThrow('response lost');
    const release = jest.fn();
    expect(
      await releaseUnreferencedProofMedia(input(id).proofValue, release)
    ).toBe(false);
    expect(release).not.toHaveBeenCalled();
  }
);

it('retains media on malformed reference storage or read failure and refuses destructive writes', async () => {
  await AsyncStorage.setItem(PROOF_DRAFTS_STORAGE_KEY, '{broken');
  const release = jest.fn();
  expect(
    await releaseUnreferencedProofMedia('file:///fresh/unreadable.jpg', release)
  ).toBe(false);
  await expect(createProofDraft(input('new'))).rejects.toThrow();
  getItem.mockRejectedValueOnce(new Error('read failed'));
  expect(
    await releaseUnreferencedProofMedia('file:///fresh/unreadable.jpg', release)
  ).toBe(false);
  expect(release).not.toHaveBeenCalled();
});

it('contains cleanup errors and only releases a proven unreferenced URI', async () => {
  const adopted = await createProofDraft(input('saved-retry'));
  const release = jest.fn().mockImplementationOnce(() => {
    throw new Error('delete failed');
  });
  expect(
    await releaseUnreferencedProofMedia('file:///fresh/rejected.jpg', release)
  ).toBe(false);
  expect(
    await releaseUnreferencedProofMedia(adopted.localMediaUri!, release)
  ).toBe(false);
  expect(
    await releaseUnreferencedProofMedia('file:///fresh/rejected.jpg', release)
  ).toBe(true);
  expect(release.mock.calls).toEqual([
    ['file:///fresh/rejected.jpg'],
    ['file:///fresh/rejected.jpg'],
  ]);
});
