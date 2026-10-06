import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';

type Translate = (key: TranslationKey, values?: TranslationValues) => string;

const defaultTranslate: Translate = (key, values) =>
  translate('en-NZ', key, values);

export type PromiseStatusKind =
  | 'reviewer'
  | 'supporter'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'at-risk'
  | 'due'
  | 'join';

export type PromiseActiveBranch =
  'queued' | 'correction' | 'approved' | 'recovery' | 'unknown' | 'active';

/** Daily status notes already in the catalogue, but unused by the promise route. */
export const getPromiseStatusNote = (
  kind: PromiseStatusKind,
  t: Translate = defaultTranslate
): string => {
  switch (kind) {
    case 'reviewer':
      return t('todayProof.source.accountability.reviewer_note');
    case 'supporter':
      return t('todayProof.source.accountability.supporter_note');
    case 'pending':
      return t('todayProof.promise.waiting_review_detail');
    case 'approved':
      return t('todayProof.promise.done_today_detail');
    case 'at-risk':
      return t('todayProof.promise.checkin_needed_detail');
    case 'due':
      return t('todayProof.promise.proof_due_detail');
    case 'join':
      return t('todayProof.promise.join_to_start_detail');
    case 'rejected':
      return t('todayProof.promise.retry_detail');
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
};

export const getPromiseRecoveryCopy = (
  input: { rejected: boolean; atRiskWithoutToday: boolean },
  t: Translate = defaultTranslate
): string | null => {
  if (input.rejected) return t('todayProof.promise.retry_detail');
  if (input.atRiskWithoutToday) return t('todayProof.promise.today_counts');
  return null;
};

export const getPromiseVisibilityLabel = (
  input: { isSolo: boolean; groupName?: string | null },
  t: Translate = defaultTranslate
): string => {
  if (input.isSolo) return t('todayProof.promise.only_you');
  const groupName = input.groupName?.trim();
  return groupName || t('todayProof.promise.group_fallback');
};

export const getPromiseProgressLabel = (
  input: { approvedDays?: number; totalDays: number },
  t: Translate = defaultTranslate
): string => {
  if (typeof input.approvedDays === 'number') {
    return t('todayProof.promise.progress_approved', {
      approved: input.approvedDays,
      total: input.totalDays,
    });
  }
  return t('todayProof.promise.duration_days', { days: input.totalDays });
};

export const getPromiseReviewModelCopy = (
  input: {
    isSolo: boolean;
    requiresPeerReview: boolean;
    reviewersRequired: number;
  },
  t: Translate = defaultTranslate
): string => {
  if (input.isSolo) return t('todayProof.promise.self_review');
  if (!input.requiresPeerReview) return t('todayProof.promise.no_peer_review');
  const count = input.reviewersRequired;
  return count === 1
    ? t('todayProof.promise.peer_review_one', { count })
    : t('todayProof.promise.peer_review_other', { count });
};

export const getPromiseActiveSheetCopy = (
  branch: PromiseActiveBranch,
  input: { protectedOutcome?: boolean; correctionPrompt?: string | null },
  t: Translate = defaultTranslate
): { dueLabel: string; prompt: string } => {
  switch (branch) {
    case 'queued':
      return {
        dueLabel: t('todayProof.source.lifecycle.saved'),
        prompt: t('todayProof.promise.queued_prompt'),
      };
    case 'correction':
      return {
        dueLabel: t('todayProof.promise.one_change'),
        prompt:
          input.correctionPrompt?.trim() ||
          t('todayProof.promise.correction_prompt'),
      };
    case 'approved':
      return {
        dueLabel: t('todayProof.promise.done_today'),
        prompt: t('todayProof.promise.approved_prompt'),
      };
    case 'recovery':
      return {
        dueLabel: t('todayProof.promise.missed_in_history'),
        prompt: t('todayProof.promise.recovery_prompt'),
      };
    case 'unknown':
      return {
        dueLabel: t('todayProof.promise.status_unavailable'),
        prompt: t('todayProof.promise.unknown_paused_prompt'),
      };
    case 'active':
      return {
        dueLabel: input.protectedOutcome
          ? t('todayProof.promise.protected_due')
          : t('todayProof.promise.proof_due'),
        prompt: t('todayProof.promise.active_prompt'),
      };
    default: {
      const exhaustive: never = branch;
      return exhaustive;
    }
  }
};

export const getPromiseCompleteCopy = (
  input: {
    title: string;
    approvedDays: number;
    totalDays: number;
    isSolo: boolean;
    groupName?: string | null;
  },
  t: Translate = defaultTranslate
) => ({
  cue: t('todayProof.promise.complete'),
  title: t('todayProof.promise.complete_title', {
    approved: input.approvedDays,
    total: input.totalDays,
  }),
  visibility: input.isSolo
    ? t('todayProof.promise.private')
    : input.groupName?.trim() || t('todayProof.promise.group_fallback'),
  reviewerSummary: input.isSolo
    ? t('todayProof.promise.reviewed_own')
    : t('todayProof.promise.reviewed_group'),
  shareMessage: t('todayProof.promise.share_complete', {
    title: input.title,
    approved: input.approvedDays,
    total: input.totalDays,
  }),
  tallyLabel: t('todayProof.promise.complete_tally', {
    approved: input.approvedDays,
    total: input.totalDays,
  }),
});

export const getPromiseWaitingTitle = (
  reviewerName: string | null | undefined,
  t: Translate = defaultTranslate
): string => {
  const name = reviewerName?.trim();
  return name
    ? t('todayProof.promise.reviewer_has_proof', { name })
    : t('todayProof.residual.your_proof_is_waiting_for_a_reviewer');
};
