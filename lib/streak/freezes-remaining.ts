/**
 * Streak freeze counts come from `challenge_participants.streak_freezes_remaining`.
 * That column is NOT NULL with default 0. Missing or unreadable values must not
 * invent two freezes a person has not earned or bought.
 */
export function resolveFreezesRemaining(
  value: number | null | undefined
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}
