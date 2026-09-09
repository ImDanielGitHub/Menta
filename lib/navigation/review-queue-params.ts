export type ReviewQueueEntryPoint =
  | 'proof_receipt'
  | 'group_board'
  | 'today'
  | 'challenge_detail'
  | 'notification';

export type ReviewQueueParams = {
  challengeId?: string;
  groupId?: string;
  submissionId?: string;
  entryPoint?: ReviewQueueEntryPoint;
};

export type ReviewQueueParamSource = {
  challengeId?: unknown;
  groupId?: unknown;
  submissionId?: unknown;
  entryPoint?: unknown;
};

const getSingleParam = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return getSingleParam(value[0]);

  const text = typeof value === 'string' ? value.trim() : '';
  return text || undefined;
};

const REVIEW_QUEUE_ENTRY_POINTS: ReadonlySet<string> = new Set([
  'proof_receipt',
  'group_board',
  'today',
  'challenge_detail',
  'notification',
]);

const getEntryPoint = (value: unknown): ReviewQueueEntryPoint | undefined => {
  const entryPoint = getSingleParam(value);
  return entryPoint && REVIEW_QUEUE_ENTRY_POINTS.has(entryPoint)
    ? (entryPoint as ReviewQueueEntryPoint)
    : undefined;
};

export const normalizeReviewQueueParams = (
  params?: ReviewQueueParamSource | null
): ReviewQueueParams => ({
  challengeId: getSingleParam(params?.challengeId),
  groupId: getSingleParam(params?.groupId),
  submissionId: getSingleParam(params?.submissionId),
  entryPoint: getEntryPoint(params?.entryPoint),
});

export const buildReviewQueueRouteParams = (
  params: ReviewQueueParamSource
): ReviewQueueParams => {
  const normalized = normalizeReviewQueueParams(params);

  return {
    ...(normalized.groupId ? { groupId: normalized.groupId } : {}),
    ...(normalized.challengeId ? { challengeId: normalized.challengeId } : {}),
    ...(normalized.submissionId
      ? { submissionId: normalized.submissionId }
      : {}),
    ...(normalized.entryPoint ? { entryPoint: normalized.entryPoint } : {}),
  };
};

export const buildReviewQueueDeepLink = (
  params: ReviewQueueParamSource = {}
) => {
  const normalized = buildReviewQueueRouteParams(params);
  const searchParams = new URLSearchParams();

  if (normalized.groupId) searchParams.set('groupId', normalized.groupId);
  if (normalized.challengeId) {
    searchParams.set('challengeId', normalized.challengeId);
  }
  if (normalized.submissionId) {
    searchParams.set('submissionId', normalized.submissionId);
  }
  if (normalized.entryPoint) {
    searchParams.set('entryPoint', normalized.entryPoint);
  }

  const query = searchParams.toString();
  return query ? `review-queue?${query}` : 'review-queue';
};

export const buildReviewQueuePath = (params: ReviewQueueParamSource = {}) =>
  `/${buildReviewQueueDeepLink(params)}`;
