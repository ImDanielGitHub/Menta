import type { MascotState } from '@/components/ui/MentaMascot';
import type {
  DailyLoopPrimaryAction,
  DailyLoopSelection,
  DailyLoopState,
  ServerGroupRiskFact,
  ServerObligationFact,
  ServerReviewFact,
} from '@/lib/loop';
import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import { getReviewRequiredDetail } from '@/lib/loop/review-required-copy';
import {
  resolveCatalogueLocale,
  translate,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/localization';
import { getCorrectionFeedbackCopy } from '@/lib/proof/correction-copy';
import {
  DEFAULT_PROOF_DUE_TIME,
  formatProofDueLabel,
} from '@/lib/time/proof-due';

export type TodayAccent = 'action' | 'warning' | 'success' | 'danger' | 'muted';

export type TodayPresentation = {
  state: DailyLoopState;
  layout: 'empty' | 'hero' | 'system' | 'accountability';
  dateLabel: string;
  accent: TodayAccent;
  title: string;
  detail: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  primaryAction: DailyLoopPrimaryAction;
  mascot: MascotState | null;
  animateMascot: boolean;
  facts?: readonly {
    label: string;
    value: string;
    tone?: TodayAccent;
  }[];
  supportingNote?: string | null;
  /** Mascot speech bubble: why this state happened, in Menta's voice. */
  prompt?: string | null;
  countdown?: {
    localDay: string;
    timeZone: string;
    preferredReminderTime: string;
    promiseLabel: string | null;
    dueAtIso: string | null;
    streak?: number | null;
  } | null;
  accountabilityReceipt?: {
    title: string;
    detail: string;
  } | null;
  reviewStatus?: string | null;
};

export type TodayCopyContext = {
  selection: DailyLoopSelection;
  obligations: readonly ServerObligationFact[];
  pendingReviews: readonly ServerReviewFact[];
  groupRisks: readonly ServerGroupRiskFact[];
  now: Date;
  preferredReminderTime?: string | null;
  reviewFactsAvailable?: boolean;
};

export type TodayCopyOptions = {
  locale?: string | null;
};

type TodayTranslate = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

type TodayPresentationInput = Omit<
  TodayPresentation,
  'state' | 'dateLabel' | 'primaryAction' | 'accentColor'
> & { accent: TodayAccent };

const formatDateLabel = (
  localDay: string,
  now: Date,
  locale: string
): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  const date = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        12,
        0,
        0
      )
    : now;

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const formatOutcomeDay = (
  localDay: string | null | undefined,
  locale: string,
  t: TodayTranslate
): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay ?? '');
  if (!match) return t('today.state.outcome.missed_day');

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  );
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    timeZone: 'UTC',
  });
};

const dayCount = (value: number, t: TodayTranslate): string =>
  t('today.progress.streak_days', { count: value });

const proofActionLabel = (
  verificationType: string | null | undefined,
  t: TodayTranslate
): string =>
  verificationType === 'text'
    ? t('today.state.proof_due.text_action')
    : verificationType === 'video'
      ? t('today.state.proof_due.video_action')
      : t('today.state.proof_due.photo_action');

const findObligation = (
  obligations: readonly ServerObligationFact[],
  challengeId: string | null,
  groupId: string | null
): ServerObligationFact | null => {
  if (!challengeId) return null;
  return (
    obligations.find(
      item =>
        item.challengeId === challengeId &&
        (groupId ? item.groupId === groupId : !item.groupId)
    ) ?? null
  );
};

const findReview = (
  reviews: readonly ServerReviewFact[],
  reviewId: string | null
): ServerReviewFact | null => {
  if (!reviewId) return null;
  return reviews.find(item => item.reviewId === reviewId) ?? null;
};

const findRisk = (
  risks: readonly ServerGroupRiskFact[],
  groupId: string | null
): ServerGroupRiskFact | null => {
  if (!groupId) return null;
  return risks.find(item => item.groupId === groupId) ?? null;
};

const base = (
  ctx: TodayCopyContext,
  locale: string,
  t: TodayTranslate,
  partial: TodayPresentationInput
): TodayPresentation => ({
  state: ctx.selection.state,
  dateLabel: formatDateLabel(ctx.selection.localDay, ctx.now, locale),
  primaryAction: ctx.selection.primaryAction,
  accountabilityReceipt: (() => {
    const protectedDay = ctx.selection.protectedOutcome;
    if (!protectedDay || protectedDay.streakOutcome !== 'protected') {
      return null;
    }

    const weekday = formatOutcomeDay(protectedDay.outcomeLocalDay, locale, t);
    const continuedAt =
      protectedDay.resultingStreak ?? protectedDay.streakCount;
    const countCopy =
      typeof continuedAt === 'number'
        ? t('today.state.protected.count_continues', {
            count: dayCount(continuedAt, t),
          })
        : '';
    return {
      title: t('today.state.protected.title'),
      detail: protectedDay.freezeUsed
        ? t('today.state.protected.freeze_detail', {
            weekday,
            countCopy,
          })
        : t('today.state.protected.detail', { weekday, countCopy }),
    };
  })(),
  ...partial,
});

/**
 * Paper-aligned Today copy. Names the fact before the feeling.
 * Local-only states never claim a server receipt.
 */
export const resolveTodayPresentation = (
  ctx: TodayCopyContext,
  options: TodayCopyOptions = {}
): TodayPresentation => {
  const locale = resolveCatalogueLocale(options.locale);
  const t: TodayTranslate = (key, values = {}) =>
    translate(locale, key, values);
  const present = (partial: TodayPresentationInput): TodayPresentation =>
    base(ctx, locale, t, partial);
  const { selection, obligations, pendingReviews, groupRisks } = ctx;
  const primary = findObligation(
    obligations,
    selection.primaryChallengeId,
    selection.primaryGroupId
  );
  const review = findReview(pendingReviews, selection.primaryReviewId);
  const risk = findRisk(groupRisks, selection.primaryGroupId);

  switch (selection.state) {
    case 'loading':
      return present({
        layout: 'system',
        accent: 'muted',
        title: t('today.state.loading.title'),
        detail: t('today.state.loading.detail'),
        primaryLabel: t('today.state.loading.action'),
        secondaryLabel: selection.hasServerSnapshot
          ? t('today.state.loading.last_confirmed')
          : null,
        mascot: null,
        animateMascot: false,
      });

    case 'offline-stale':
      return present({
        layout: 'system',
        accent: 'warning',
        title: primary
          ? t('today.state.offline.promise_title')
          : t('today.state.offline.title'),
        detail: primary
          ? t('today.state.offline.promise_detail')
          : t('today.state.offline.detail'),
        primaryLabel: primary
          ? t('today.state.offline.prepare_proof')
          : t('today.state.action.try_again'),
        secondaryLabel: primary ? t('today.state.action.try_again') : null,
        mascot: null,
        animateMascot: false,
      });

    case 'load-failed':
      return present({
        layout: 'system',
        accent: 'warning',
        title: selection.hasServerSnapshot
          ? t('today.state.load_failed.refresh_title')
          : t('today.state.load_failed.title'),
        detail: selection.hasServerSnapshot
          ? t('today.state.load_failed.refresh_detail')
          : t('today.state.load_failed.detail'),
        primaryLabel: t('today.state.action.try_again'),
        secondaryLabel: null,
        mascot: null,
        animateMascot: false,
      });

    case 'streak-broken': {
      // Paper 19 / T04: say what happened once (in the bubble), then name the
      // only thing that matters now. The earlier run is history, not a choice.
      const previous = primary?.previousStreak;
      const weekday = formatOutcomeDay(primary?.outcomeLocalDay, locale, t);
      const hasPreviousRun = typeof previous === 'number' && previous > 0;
      return present({
        layout: 'accountability',
        accent: 'action',
        title: t('today.state.streak.day_one_title'),
        detail: t('today.state.streak.day_one_detail'),
        prompt: hasPreviousRun
          ? t('today.state.streak.bubble_run_ended', {
              weekday,
              count: previous,
            })
          : t('today.state.streak.bubble_missed', { weekday }),
        primaryLabel: proofActionLabel(primary?.verificationType, t),
        secondaryLabel: hasPreviousRun
          ? t('today.state.streak.see_run', { count: previous })
          : t('today.state.streak.history'),
        mascot: 'fresh-start',
        animateMascot: false,
        facts: [],
        supportingNote: null,
      });
    }

    case 'returning': {
      const awayDays = primary?.daysSinceAcceptedCheckIn;
      const awayCopy =
        typeof awayDays === 'number'
          ? t('today.state.returning.away_days', {
              count: dayCount(awayDays, t),
            })
          : t('today.state.returning.away');
      return present({
        layout: 'accountability',
        accent: 'action',
        title: t('today.state.returning.title'),
        detail: t('today.state.returning.detail', { awayCopy }),
        primaryLabel: t('today.state.returning.action'),
        secondaryLabel: t('today.state.returning.history'),
        mascot: 'promise-guide',
        animateMascot: false,
        facts: [],
        supportingNote: null,
      });
    }

    case 'no-promises':
      return present({
        layout: 'empty',
        accent: 'action',
        title: t('today.state.no_promises.title'),
        detail: t('today.state.no_promises.detail'),
        primaryLabel: t('today.state.action.make_promise'),
        secondaryLabel: t('today.state.no_promises.join_group'),
        mascot: 'first-promise',
        animateMascot: false,
      });

    case 'proof-due': {
      const proofInstruction =
        primary?.verificationType === 'text'
          ? {
              detail: t('today.state.proof_due.text_detail'),
              label: t('today.state.proof_due.text_action'),
            }
          : primary?.verificationType === 'video'
            ? {
                detail: t('today.state.proof_due.video_detail'),
                label: t('today.state.proof_due.video_action'),
              }
            : {
                detail: t('today.state.proof_due.photo_detail'),
                label: t('today.state.proof_due.photo_action'),
              };
      if (primary?.atRisk || primary?.dueAtIso) {
        const timeUntilDue = primary.dueAtIso
          ? Date.parse(primary.dueAtIso) - ctx.now.getTime()
          : Number.POSITIVE_INFINITY;
        const streak = primary.streakCount;
        const preferredReminderTime =
          ctx.preferredReminderTime?.trim() || DEFAULT_PROOF_DUE_TIME;
        const proofNoun =
          primary.verificationType === 'text'
            ? t('term.note')
            : primary.verificationType === 'video'
              ? t('term.video')
              : t('term.photo');
        const dueLabel = formatProofDueLabel(preferredReminderTime);
        return present({
          layout: 'hero',
          accent: 'warning',
          title: primary.title ?? t('today.state.proof_due.risk_title'),
          detail:
            typeof streak === 'number' && streak > 0
              ? t('today.state.proof_due.streak_risk_detail', {
                  streak:
                    locale === 'en-NZ' ? `${streak}-day` : dayCount(streak, t),
                  proofNoun,
                  dueLabel,
                })
              : t('today.state.proof_due.risk_detail', {
                  proofNoun,
                  dueLabel,
                }),
          primaryLabel: proofInstruction.label,
          secondaryLabel: t('today.state.action.see_promise'),
          mascot:
            timeUntilDue > 0 && timeUntilDue <= 2 * 60 * 60 * 1000
              ? 'closing-soon'
              : 'today-at-risk',
          animateMascot: false,
          countdown: {
            localDay: ctx.selection.localDay,
            timeZone: primary.timezone || ctx.selection.timezone,
            preferredReminderTime,
            promiseLabel: primary.title ?? null,
            dueAtIso: primary.dueAtIso ?? null,
            streak: typeof streak === 'number' ? streak : null,
          },
        });
      }

      // Paper 19 / T01: every due day leads with the honest time left.
      return present({
        layout: 'hero',
        accent: 'action',
        title: primary?.title ?? t('today.state.proof_due.title'),
        detail: proofInstruction.detail,
        primaryLabel: proofInstruction.label,
        secondaryLabel: t('today.state.action.see_promise'),
        mascot:
          primary?.verificationType === 'text'
            ? 'promise-guide'
            : 'today-proof-due',
        animateMascot: false,
        countdown: {
          localDay: ctx.selection.localDay,
          timeZone: primary?.timezone || ctx.selection.timezone,
          preferredReminderTime:
            ctx.preferredReminderTime?.trim() || DEFAULT_PROOF_DUE_TIME,
          promiseLabel: primary?.title ?? null,
          dueAtIso: primary?.dueAtIso ?? null,
          streak:
            typeof primary?.streakCount === 'number'
              ? primary.streakCount
              : null,
        },
      });
    }

    case 'proof-saved-local': {
      const isUnknown = selection.reason === 'local-proof-unknown-result';
      const isFailed = selection.reason === 'local-proof-terminal-failure';
      return present({
        layout: 'hero',
        accent: 'warning',
        title: isUnknown
          ? t('today.state.saved.unknown_title')
          : isFailed
            ? t('today.state.saved.failed_title')
            : t('today.state.saved.title'),
        detail: isUnknown
          ? t('today.state.saved.unknown_detail')
          : isFailed
            ? t('today.state.saved.failed_detail')
            : t('today.state.saved.detail'),
        primaryLabel: isUnknown
          ? t('today.state.saved.check_action')
          : isFailed
            ? t('today.state.saved.retry_action')
            : t('today.state.saved.send_action'),
        secondaryLabel: t('today.state.action.see_promise'),
        mascot: null,
        animateMascot: false,
      });
    }

    case 'proof-uploading':
      return present({
        layout: 'hero',
        accent: 'action',
        title: t('today.state.uploading.title'),
        detail: t('today.state.uploading.detail'),
        primaryLabel: t('today.state.uploading.action'),
        secondaryLabel: t('today.state.action.see_promise'),
        mascot: null,
        animateMascot: false,
      });

    case 'proof-pending-review':
      return present({
        layout: 'hero',
        accent: 'muted',
        title: primary?.title
          ? t('today.state.pending.named_title', { promise: primary.title })
          : t('today.state.pending.title'),
        detail: t('today.state.pending.detail'),
        primaryLabel: t('today.state.pending.action'),
        secondaryLabel: t('today.state.action.see_promise'),
        mascot: null,
        animateMascot: false,
      });

    case 'correction-requested': {
      const correction = getCorrectionFeedbackCopy({
        proofType: primary?.verificationType,
        correctionReason: primary?.correctionReason,
        locale,
      });
      return present({
        layout: 'hero',
        accent: 'danger',
        title: correction.title,
        detail: correction.detail,
        primaryLabel: correction.primaryLabel,
        secondaryLabel: t('today.state.correction.feedback'),
        mascot: null,
        animateMascot: false,
      });
    }

    case 'review-required':
      return present({
        layout: 'hero',
        accent: 'action',
        title: review
          ? t('today.state.review.named_title', {
              name: review.submitterName,
            })
          : t('today.state.review.title'),
        detail: getReviewRequiredDetail({
          proofType: review?.verificationType,
          reward: ECONOMY_CONTRACT_V1.review.reward,
          dailyLimit: ECONOMY_CONTRACT_V1.review.dailyLimit,
          t,
        }),
        primaryLabel: t('today.state.review.action'),
        secondaryLabel: review?.groupId
          ? t('today.state.review.see_group')
          : t('today.state.review.open_queue'),
        mascot: null,
        animateMascot: false,
      });

    case 'group-at-risk':
      return present({
        layout: 'system',
        accent: 'warning',
        title: risk
          ? t('today.state.group_risk.named_title', {
              group: risk.groupName,
            })
          : t('today.state.group_risk.title'),
        detail: risk
          ? t('today.state.group_risk.named_detail')
          : t('today.state.group_risk.detail'),
        primaryLabel: t('today.state.group_risk.action'),
        secondaryLabel: t('today.state.action.browse_groups'),
        mascot: 'today-at-risk',
        animateMascot: false,
      });

    case 'accepted-today':
      return present({
        layout: 'hero',
        accent: 'success',
        title: primary?.title
          ? t('today.state.accepted.named_title', {
              promise: primary.title,
            })
          : t('today.state.accepted.title'),
        detail: t('today.state.accepted.detail'),
        primaryLabel: t('today.state.action.see_promise'),
        secondaryLabel: t('today.state.action.browse_groups'),
        mascot: 'today-accepted',
        animateMascot: true,
        accountabilityReceipt: {
          title: primary?.title
            ? t('today.state.accepted.named_receipt', {
                promise: primary.title,
              })
            : t('today.state.accepted.receipt'),
          detail: t('today.state.accepted.receipt_detail'),
        },
      });

    case 'all-clear':
      return present({
        layout: 'hero',
        // All clear means there is no pending action. It is not a receipt.
        accent: 'muted',
        title:
          ctx.reviewFactsAvailable === false
            ? t('today.state.all_clear.review_unknown_title')
            : t('today.state.all_clear.title'),
        detail:
          ctx.reviewFactsAvailable === false
            ? t('today.state.all_clear.review_unknown_detail')
            : t('today.state.all_clear.detail'),
        primaryLabel: t('today.state.action.make_promise'),
        secondaryLabel: t('today.state.action.browse_groups'),
        mascot: null,
        animateMascot: false,
        reviewStatus:
          ctx.reviewFactsAvailable === false
            ? null
            : t('today.state.all_clear.review_status'),
      });

    default: {
      const _exhaustive: never = selection.state;
      return _exhaustive;
    }
  }
};
