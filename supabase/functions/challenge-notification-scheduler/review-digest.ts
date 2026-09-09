export type ReviewReminderRow = Readonly<{
  reviewer_id: string;
  pending_count: number;
}>;

export type ReviewReminderDigest = Readonly<{
  reviewerId: string;
  pendingCount: number;
}>;

/**
 * One factual review digest per reviewer. Names, promise titles, and proof
 * details stay off the lock screen and repeated rows cannot create push spam.
 */
export const buildReviewReminderDigests = (
  rows: readonly ReviewReminderRow[]
): ReviewReminderDigest[] => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const reviewerId = row.reviewer_id?.trim();
    if (!reviewerId) continue;
    const pendingCount = Number.isSafeInteger(row.pending_count)
      ? Math.max(1, row.pending_count)
      : 1;
    counts.set(reviewerId, (counts.get(reviewerId) ?? 0) + pendingCount);
  }
  return Array.from(counts, ([reviewerId, pendingCount]) => ({
    reviewerId,
    pendingCount,
  }));
};
