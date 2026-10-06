import { clearVideoCacheAsync, getCurrentVideoCacheSize } from 'expo-video';
import { clearPrivateVideoCache } from '../clear-private-video-cache';

beforeEach(() => {
  jest.mocked(clearVideoCacheAsync).mockReset().mockResolvedValue(undefined);
  jest.mocked(getCurrentVideoCacheSize).mockReset().mockReturnValue(0);
});

it('accepts an empty legacy cache without invoking the installed native purge that rejects a missing directory', async () => {
  jest
    .mocked(clearVideoCacheAsync)
    .mockRejectedValue(
      new Error('NSCocoaErrorDomain Code=260: The folder does not exist.')
    );
  await expect(clearPrivateVideoCache()).resolves.toBeUndefined();
  expect(clearVideoCacheAsync).not.toHaveBeenCalled();
});

it('clears existing private video data before account acceptance can continue', async () => {
  jest.mocked(getCurrentVideoCacheSize).mockReturnValue(1024);
  let release!: () => void;
  jest.mocked(clearVideoCacheAsync).mockReturnValue(
    new Promise<void>(resolve => {
      release = resolve;
    })
  );
  let finished = false;
  const clearing = clearPrivateVideoCache().then(() => {
    finished = true;
  });
  await Promise.resolve();
  expect(finished).toBe(false);
  release();
  await clearing;
  expect(finished).toBe(true);
});

it('still blocks account acceptance when a non-empty cache cannot be cleared', async () => {
  jest.mocked(getCurrentVideoCacheSize).mockReturnValue(1024);
  jest
    .mocked(clearVideoCacheAsync)
    .mockRejectedValue(new Error('video cache busy'));
  await expect(clearPrivateVideoCache()).rejects.toThrow('video cache busy');
});

it.each([NaN, -1, undefined])(
  'does not treat an unknown cache size %s as empty',
  async size => {
    jest.mocked(getCurrentVideoCacheSize).mockReturnValue(size as number);
    await expect(clearPrivateVideoCache()).rejects.toThrow(
      'could not be verified'
    );
    expect(clearVideoCacheAsync).not.toHaveBeenCalled();
  }
);
