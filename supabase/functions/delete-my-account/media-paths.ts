export type AccountStorageDeletionTarget = {
  bucket: string;
  prefix: string;
};

const DEFAULT_USER_BUCKETS = [
  'profile-pictures',
  'challenge-verifications',
  'challenges-images',
  'group-images',
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hasSafeSegments = (value: string): boolean =>
  value.length > 0 &&
  value
    .split('/')
    .every(
      segment => segment.length > 0 && segment !== '.' && segment !== '..'
    );

export const eventMediaPrefixForUser = (userId: string): string =>
  `v1/${userId}`;

/**
 * Keep the event-media namespace separate from legacy user-prefix buckets.
 * The caller's UUID is produced by Supabase Auth, but we still validate before
 * constructing a destructive Storage scope.
 */
export const accountStorageDeletionTargets = (
  userId: string
): AccountStorageDeletionTarget[] => {
  if (!UUID_PATTERN.test(userId)) return [];

  return [
    ...DEFAULT_USER_BUCKETS.map(bucket => ({ bucket, prefix: userId })),
    { bucket: 'event-media', prefix: eventMediaPrefixForUser(userId) },
  ];
};

export const isPathWithinStoragePrefix = (
  path: string,
  prefix: string
): boolean =>
  hasSafeSegments(path) &&
  hasSafeSegments(prefix) &&
  (path === prefix || path.startsWith(`${prefix}/`));

/**
 * Storage list entries are child names. Reject a malformed response instead
 * of accidentally expanding a destructive path outside the user prefix.
 */
export const joinStorageChildPath = (
  prefix: string,
  childName: string
): string | null => {
  if (
    !hasSafeSegments(prefix) ||
    childName.length === 0 ||
    childName.includes('/') ||
    childName === '.' ||
    childName === '..'
  ) {
    return null;
  }

  const path = `${prefix}/${childName}`;
  return isPathWithinStoragePrefix(path, prefix) ? path : null;
};

export const chunkStoragePaths = (
  paths: readonly string[],
  chunkSize = 100
): string[][] => {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new Error('chunkSize must be a positive integer');
  }

  const chunks: string[][] = [];
  for (let index = 0; index < paths.length; index += chunkSize) {
    chunks.push(paths.slice(index, index + chunkSize));
  }
  return chunks;
};
