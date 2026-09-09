import {
  accountStorageDeletionTargets,
  chunkStoragePaths,
  eventMediaPrefixForUser,
  isPathWithinStoragePrefix,
  joinStorageChildPath,
} from '../media-paths.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('account media deletion paths', () => {
  it('adds the isolated event-media namespace to the exact user scope', () => {
    const targets = accountStorageDeletionTargets(USER_ID);

    expect(targets).toContainEqual({
      bucket: 'event-media',
      prefix: `v1/${USER_ID}`,
    });
    expect(eventMediaPrefixForUser(USER_ID)).toBe(`v1/${USER_ID}`);
  });

  it('never expands a destructive path outside the supplied user prefix', () => {
    const prefix = `v1/${USER_ID}`;

    expect(joinStorageChildPath(prefix, 'post.jpg')).toBe(`${prefix}/post.jpg`);
    expect(joinStorageChildPath(prefix, '../other-user')).toBeNull();
    expect(joinStorageChildPath(prefix, 'nested/post.jpg')).toBeNull();
    expect(isPathWithinStoragePrefix(`${prefix}/post.jpg`, prefix)).toBe(true);
    expect(isPathWithinStoragePrefix(`v1/other-user/post.jpg`, prefix)).toBe(
      false
    );
  });

  it('batches deletions without dropping or widening paths', () => {
    const paths = Array.from(
      { length: 205 },
      (_, index) => `v1/${USER_ID}/post-${index}.jpg`
    );
    const chunks = chunkStoragePaths(paths, 100);

    expect(chunks).toHaveLength(3);
    expect(chunks.flat()).toEqual(paths);
    expect(() => chunkStoragePaths(paths, 0)).toThrow('chunkSize');
  });
});
