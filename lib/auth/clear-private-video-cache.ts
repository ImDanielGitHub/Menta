import { clearVideoCacheAsync, getCurrentVideoCacheSize } from 'expo-video';

/** An absent/empty legacy cache already contains no private video bytes. */
export const clearPrivateVideoCache = async (): Promise<void> => {
  const cachedBytes = getCurrentVideoCacheSize();
  if (!Number.isFinite(cachedBytes) || cachedBytes < 0) {
    throw new Error('Private video cache size could not be verified.');
  }
  // The iOS library in installed 1.9.8 builds tries to enumerate a directory
  // that may never have been created. Its purge rejects for that empty state.
  if (cachedBytes === 0) return;
  await clearVideoCacheAsync();
};
