import { translate as resolveCopy } from '@/lib/localization';

export type ReviewDecisionStatus = 'approved' | 'rejected';

export type ReviewDecisionErrorCode =
  | 'already_decided'
  | 'changed_while_reviewing'
  | 'not_authenticated'
  | 'not_allowed'
  | 'not_found'
  | 'invalid_status'
  | 'unknown';

export type ReviewDecisionReceipt = {
  id: string;
  status: ReviewDecisionStatus;
  reviewNotes: string | null;
  reviewerId: string;
  reviewedAt: string;
};

type ParsedReviewDecision =
  | { success: true; receipt: ReviewDecisionReceipt }
  | {
      success: false;
      code: ReviewDecisionErrorCode;
      message: string;
      currentStatus: string | null;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringOrNull = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeErrorCode = (value: unknown): ReviewDecisionErrorCode => {
  const code = stringOrNull(value)?.toLowerCase();
  if (code === 'already_decided') return 'already_decided';
  if (code === 'changed_while_reviewing') return 'changed_while_reviewing';
  if (code === 'not_authenticated') return 'not_authenticated';
  if (code === 'not_allowed') return 'not_allowed';
  if (code === 'not_found') return 'not_found';
  if (code === 'invalid_status') return 'invalid_status';
  return 'unknown';
};

export const parseReviewDecision = (
  value: unknown,
  locale = 'en-NZ'
): ParsedReviewDecision => {
  if (!isRecord(value)) {
    return {
      success: false,
      code: 'unknown',
      message: resolveCopy(locale, 'todayProof.review.decision_unconfirmed'),
      currentStatus: null,
    };
  }

  if (value.success !== true) {
    return {
      success: false,
      code: normalizeErrorCode(value.code ?? value.error),
      message:
        stringOrNull(value.message) ??
        stringOrNull(value.error) ??
        resolveCopy(locale, 'todayProof.review.decision_unconfirmed'),
      currentStatus: stringOrNull(value.current_status),
    };
  }

  const data = isRecord(value.data) ? value.data : null;
  const id = stringOrNull(data?.id);
  const status = stringOrNull(data?.status);
  const reviewerId = stringOrNull(data?.reviewer_id ?? data?.reviewed_by);
  const reviewedAt = stringOrNull(data?.reviewed_at ?? data?.verification_date);

  if (
    !id ||
    (status !== 'approved' && status !== 'rejected') ||
    !reviewerId ||
    !reviewedAt
  ) {
    return {
      success: false,
      code: 'unknown',
      message: resolveCopy(locale, 'todayProof.review.incomplete_receipt'),
      currentStatus: status,
    };
  }

  return {
    success: true,
    receipt: {
      id,
      status,
      reviewNotes: stringOrNull(data?.review_notes),
      reviewerId,
      reviewedAt,
    },
  };
};

export class ReviewDecisionError extends Error {
  readonly code: ReviewDecisionErrorCode;
  readonly currentStatus: string | null;

  constructor(
    message: string,
    options: {
      code: ReviewDecisionErrorCode;
      currentStatus?: string | null;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'ReviewDecisionError';
    this.code = options.code;
    this.currentStatus = options.currentStatus ?? null;
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}
