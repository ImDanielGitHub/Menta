export type EventMediaPath = {
  ownerId: string;
  occurrenceId: string;
  postId: string;
  extension: 'jpg' | 'png' | 'webp';
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

/**
 * Mirrors the database's total event_media_path_parts parser. This is used
 * before the service role creates a signed upload URL or removes an object.
 */
export const parseEventMediaPath = (value: unknown): EventMediaPath | null => {
  if (typeof value !== 'string') return null;

  const match = value.match(
    /^v1\/([0-9a-f-]{36})\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.(jpg|png|webp)$/
  );
  if (!match) return null;

  const [, ownerId, occurrenceId, postId, extension] = match;
  if (!isUuid(ownerId) || !isUuid(occurrenceId) || !isUuid(postId)) {
    return null;
  }

  return {
    ownerId,
    occurrenceId,
    postId,
    extension: extension as EventMediaPath['extension'],
  };
};

export const isOwnedEventMediaPath = (
  value: unknown,
  actorId: string,
  occurrenceId: string,
  postId: string
): boolean => {
  const parsed = parseEventMediaPath(value);
  return (
    parsed !== null &&
    parsed.ownerId === actorId &&
    parsed.occurrenceId === occurrenceId &&
    parsed.postId === postId
  );
};
