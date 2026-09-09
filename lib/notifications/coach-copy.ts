import { translate } from '@/lib/localization';

export const COACH_COPY_CATALOG_VERSION = 1;

export type CoachKind = 'routine' | 'save';

export type CoachCopyTokens = {
  promise_label: string;
  streak_length: number;
  hours_remaining: number;
  freeze_remaining: number;
  proof_due_label: string;
  open_promise_count: number;
};

export type CoachCopyResult = {
  title: string;
  body: string;
  variantIndex: number;
  catalogVersion: number;
  kind: CoachKind;
};

const DEFAULT_PROMISE_LABEL = translate(
  'en-NZ',
  'domain.coach.default_promise'
);
const MAX_PROMISE_LABEL_LENGTH = 80;

const fnv1a = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const sanitizePromiseLabel = (
  value: string | null | undefined
): string => {
  const trimmed = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return DEFAULT_PROMISE_LABEL;
  if (trimmed.length <= MAX_PROMISE_LABEL_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_PROMISE_LABEL_LENGTH - 1)}…`;
};

export const pickCatalogIndex = (
  userId: string,
  localDay: string,
  kind: CoachKind,
  length: number
): number => {
  if (length <= 0) return 0;
  const key = `${userId}|${localDay}|${kind}|${COACH_COPY_CATALOG_VERSION}`;
  return fnv1a(key) % length;
};

type CopyVariant = (tokens: CoachCopyTokens) => { title: string; body: string };

const ROUTINE_VARIANTS: readonly CopyVariant[] = [
  tokens => ({
    title: translate('en-NZ', 'domain.coach.proof_due'),
    body: translate('en-NZ', 'domain.coach.proof_due_body', {
      proofDueLabel: tokens.proof_due_label,
    }),
  }),
  tokens => ({
    title: translate('en-NZ', 'domain.coach.today_counts'),
    body:
      tokens.hours_remaining > 0
        ? translate('en-NZ', 'domain.coach.hours_left', {
            hours: Math.max(0, tokens.hours_remaining),
            hourLabel:
              tokens.hours_remaining === 1
                ? translate('en-NZ', 'domain.coach.hour')
                : translate('en-NZ', 'domain.coach.hours'),
          })
        : translate('en-NZ', 'domain.coach.add_before_day_end'),
  }),
  tokens => ({
    title: translate('en-NZ', 'domain.coach.log_proof'),
    body:
      tokens.open_promise_count > 1
        ? translate('en-NZ', 'domain.coach.promises_need_proof', {
            count: Math.max(1, tokens.open_promise_count),
            promiseLabel:
              tokens.open_promise_count === 1
                ? translate('en-NZ', 'domain.coach.promise')
                : translate('en-NZ', 'domain.coach.promises'),
          })
        : translate('en-NZ', 'domain.coach.add_to_finish'),
  }),
];

const SAVE_VARIANTS: readonly CopyVariant[] = [
  tokens => ({
    title: translate('en-NZ', 'domain.coach.still_time'),
    body: translate('en-NZ', 'domain.coach.proof_open_until', {
      proofDueLabel: tokens.proof_due_label,
    }),
  }),
  _tokens => ({
    title: translate('en-NZ', 'domain.coach.proof_still_open'),
    body: translate('en-NZ', 'domain.coach.completed_add_proof'),
  }),
  tokens => ({
    title: translate('en-NZ', 'domain.coach.next_small_step'),
    body:
      tokens.hours_remaining > 0
        ? translate('en-NZ', 'domain.coach.hours_left', {
            hours: Math.max(0, tokens.hours_remaining),
            hourLabel:
              tokens.hours_remaining === 1
                ? translate('en-NZ', 'domain.coach.hour')
                : translate('en-NZ', 'domain.coach.hours'),
          })
        : translate('en-NZ', 'domain.coach.proof_remains_open'),
  }),
];

const CATALOG: Record<CoachKind, readonly CopyVariant[]> = {
  routine: ROUTINE_VARIANTS,
  save: SAVE_VARIANTS,
};

export const reminderKindToCoachKind = (
  reminderKind: string | null | undefined
): CoachKind => (reminderKind === 'rescue' ? 'save' : 'routine');

export const renderCoachCopy = (args: {
  userId: string;
  localDay: string;
  kind: CoachKind;
  tokens: CoachCopyTokens;
}): CoachCopyResult => {
  const catalog = CATALOG[args.kind];
  const variantIndex = pickCatalogIndex(
    args.userId,
    args.localDay,
    args.kind,
    catalog.length
  );
  const tokens: CoachCopyTokens = {
    ...args.tokens,
    promise_label: sanitizePromiseLabel(args.tokens.promise_label),
    streak_length: Math.max(0, Math.floor(args.tokens.streak_length)),
    hours_remaining: Math.max(0, Math.floor(args.tokens.hours_remaining)),
    freeze_remaining: Math.max(0, Math.floor(args.tokens.freeze_remaining)),
    proof_due_label:
      args.tokens.proof_due_label.trim() ||
      translate('en-NZ', 'domain.coach.default_due_time'),
    open_promise_count: Math.max(1, Math.floor(args.tokens.open_promise_count)),
  };
  const rendered = catalog[variantIndex](tokens);

  return {
    title: rendered.title,
    body: rendered.body,
    variantIndex,
    catalogVersion: COACH_COPY_CATALOG_VERSION,
    kind: args.kind,
  };
};
