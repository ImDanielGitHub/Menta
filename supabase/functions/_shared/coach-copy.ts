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

const DEFAULT_PROMISE_LABEL = 'your promise';
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

const hourPhrase = (hours: number): string =>
  `${Math.max(0, hours)} ${hours === 1 ? 'hour' : 'hours'}`;

const promiseCountPhrase = (count: number): string =>
  `${Math.max(1, count)} ${count === 1 ? 'promise' : 'promises'}`;

type CopyVariant = (tokens: CoachCopyTokens) => { title: string; body: string };

const ROUTINE_VARIANTS: readonly CopyVariant[] = [
  tokens => ({
    title: 'Proof is due.',
    body: `Add proof by ${tokens.proof_due_label} to finish today’s check-in.`,
  }),
  tokens => ({
    title: 'Today still counts.',
    body:
      tokens.hours_remaining > 0
        ? `${hourPhrase(tokens.hours_remaining)} left for today’s proof.`
        : 'Add today’s proof before the day ends.',
  }),
  tokens => ({
    title: 'Log today’s proof.',
    body:
      tokens.open_promise_count > 1
        ? `${promiseCountPhrase(tokens.open_promise_count)} still need proof. Start with one.`
        : 'Add proof to finish today.',
  }),
];

const SAVE_VARIANTS: readonly CopyVariant[] = [
  tokens => ({
    title: 'There’s still time today.',
    body: `Today’s proof stays open until ${tokens.proof_due_label}.`,
  }),
  _tokens => ({
    title: 'Today’s proof is still open.',
    body: 'If you completed your promise, add the proof before the day ends.',
  }),
  tokens => ({
    title: 'Choose the next small step.',
    body:
      tokens.hours_remaining > 0
        ? `${hourPhrase(tokens.hours_remaining)} left for today’s proof.`
        : 'Today’s proof remains open until the day ends.',
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
    proof_due_label: args.tokens.proof_due_label.trim() || '8:00 PM',
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
