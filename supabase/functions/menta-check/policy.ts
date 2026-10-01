/**
 * Menta Check decision policy.
 *
 * Jev returns typed answers (probabilities and choices), never text. This file
 * turns those answers into one fixed outcome. People only ever see catalogue
 * copy chosen from the outcome, reason and tip, so every line Menta "says" is
 * reviewed in advance.
 *
 * It prefers asking for another photo over letting a weak proof through. A
 * photo is never turned down on one description: a stronger model takes a
 * second look first. Failures never become a rejection; the worker fails open.
 */

export const MENTA_CHECK_POLICY_VERSION = 1;

export const THRESHOLDS = Object.freeze({
  /** Menta counts a proof it checks alone. */
  count: 0.8,
  countReasonConfidence: 0.6,
  /** A tip is added when Menta was sure, but not very sure. */
  quietTip: 0.95,
  /** A text note must describe what was done. */
  specific: 0.5,
  /** Menta steps in for a busy group only when it is confident. */
  backup: 0.85,
  /** After three days with no person, a plausible proof counts. */
  backupLate: 0.5,
  backupLateMinutes: 72 * 60,
  /** Reviewer hints stay coarse. */
  hintMatches: 0.85,
  hintUnsure: 0.3,
  /** A screenshot counts only when the rule is about a screen. */
  screenOk: 0.5,
});

export type JevReason =
  'matches' | 'cant_see_rule' | 'shows_something_else' | 'too_unclear';

export type JevTip =
  'none' | 'show_display' | 'get_closer' | 'more_light' | 'show_whole_activity';

export type MentaReason =
  | 'cant_see_rule'
  | 'shows_something_else'
  | 'too_unclear'
  | 'screenshot'
  | 'duplicate';

export type MentaTip =
  | 'show_display'
  | 'get_closer'
  | 'more_light'
  | 'show_whole_activity'
  | 'add_detail'
  | 'video_counted';

export type MentaFlag = 'screenshot' | 'duplicate' | 'blank_or_stock';

export type MentaHint = 'matches' | 'unsure';

export type MentaAnswers = Readonly<{
  pMatch: number;
  reason: JevReason;
  reasonConfidence: number;
  tip: JevTip;
  /** Text proofs only. */
  specific?: number | null;
}>;

export type ProofKind = 'photo' | 'video' | 'text';
export type JobKind = 'check' | 'hint' | 'backup';

export type DecisionInput = Readonly<{
  kind: JobKind;
  proofKind: ProofKind;
  answers: MentaAnswers | null;
  flags: readonly MentaFlag[];
  secondLookDone: boolean;
  minutesPending: number;
}>;

export type Decision =
  | Readonly<{
      action: 'approve';
      outcome: 'counted' | 'counted_tip' | 'backup_counted';
      tip: MentaTip | null;
      hint: MentaHint | null;
    }>
  | Readonly<{
      action: 'reject';
      outcome: 'not_yet';
      reason: MentaReason;
      hint: MentaHint | null;
    }>
  | Readonly<{ action: 'second_look' }>
  | Readonly<{
      action: 'record';
      outcome: 'hint_only' | 'left_for_people';
      hint: MentaHint | null;
    }>;

/** Flags that come from the photo description, so a second look can clear them. */
const DESCRIPTION_FLAGS: ReadonlySet<MentaFlag> = new Set([
  'screenshot',
  'blank_or_stock',
]);

const clampProbability = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

export const hintFor = (
  answers: MentaAnswers | null,
  flags: readonly MentaFlag[]
): MentaHint | null => {
  if (!answers) return null;
  const pMatch = clampProbability(answers.pMatch);
  if (
    flags.length === 0 &&
    answers.reason === 'matches' &&
    pMatch >= THRESHOLDS.hintMatches
  ) {
    return 'matches';
  }
  if (pMatch <= THRESHOLDS.hintUnsure || flags.length > 0) return 'unsure';
  return null;
};

const flagReason = (flags: readonly MentaFlag[]): MentaReason | null => {
  if (flags.includes('duplicate')) return 'duplicate';
  if (flags.includes('screenshot')) return 'screenshot';
  if (flags.includes('blank_or_stock')) return 'too_unclear';
  return null;
};

const rejectionReason = (
  answers: MentaAnswers,
  flags: readonly MentaFlag[]
): MentaReason => {
  const fromFlags = flagReason(flags);
  if (fromFlags) return fromFlags;
  // Jev called it a match but was not sure enough: the thing the rule asks
  // for was not clearly visible.
  return answers.reason === 'matches' ? 'cant_see_rule' : answers.reason;
};

const tipFor = (
  answers: MentaAnswers,
  proofKind: ProofKind
): MentaTip | null => {
  if (
    proofKind === 'text' &&
    typeof answers.specific === 'number' &&
    clampProbability(answers.specific) < THRESHOLDS.specific
  ) {
    return 'add_detail';
  }
  if (proofKind === 'text') return null;
  if (
    answers.tip !== 'none' &&
    clampProbability(answers.pMatch) < THRESHOLDS.quietTip
  ) {
    return answers.tip;
  }
  return null;
};

const passes = (
  answers: MentaAnswers,
  flags: readonly MentaFlag[],
  threshold: number
): boolean =>
  flags.length === 0 &&
  answers.reason === 'matches' &&
  clampProbability(answers.pMatch) >= threshold &&
  clampProbability(answers.reasonConfidence) >=
    THRESHOLDS.countReasonConfidence;

export function decide(input: DecisionInput): Decision {
  const hint = hintFor(input.answers, input.flags);

  if (input.kind === 'hint') {
    return { action: 'record', outcome: 'hint_only', hint };
  }

  if (input.kind === 'backup') {
    // Menta never turns proof down on a group's behalf.
    if (
      input.answers &&
      passes(input.answers, input.flags, THRESHOLDS.backup)
    ) {
      return { action: 'approve', outcome: 'backup_counted', tip: null, hint };
    }
    if (
      input.minutesPending >= THRESHOLDS.backupLateMinutes &&
      input.flags.length === 0 &&
      input.answers &&
      clampProbability(input.answers.pMatch) >= THRESHOLDS.backupLate
    ) {
      return { action: 'approve', outcome: 'backup_counted', tip: null, hint };
    }
    return { action: 'record', outcome: 'left_for_people', hint };
  }

  if (!input.answers) {
    throw new Error('MENTA_CHECK_ANSWERS_REQUIRED');
  }

  const answers = input.answers;
  const specificEnough =
    input.proofKind !== 'text' ||
    typeof answers.specific !== 'number' ||
    clampProbability(answers.specific) >= THRESHOLDS.specific;

  if (passes(answers, input.flags, THRESHOLDS.count)) {
    const tip = specificEnough
      ? tipFor(answers, input.proofKind)
      : 'add_detail';
    return {
      action: 'approve',
      outcome: tip ? 'counted_tip' : 'counted',
      tip,
      hint,
    };
  }

  const onlyDescriptionFlags = input.flags.every(flag =>
    DESCRIPTION_FLAGS.has(flag)
  );
  if (
    (input.proofKind === 'photo' || input.proofKind === 'video') &&
    !input.secondLookDone &&
    onlyDescriptionFlags
  ) {
    return { action: 'second_look' };
  }

  return {
    action: 'reject',
    outcome: 'not_yet',
    reason: rejectionReason(answers, input.flags),
    hint,
  };
}

export type PhotoDescription = Readonly<{
  scene?: string;
  main_activity?: string;
  relevant_objects?: string[];
  visible_text?: string;
  people_visible?: number;
  image_kind?:
    | 'camera_photo'
    | 'screenshot'
    | 'photo_of_screen'
    | 'document'
    | 'stock_or_web_image'
    | 'blank_or_unusable';
  quality?: 'clear' | 'blurry' | 'dark' | 'partial';
  evidence_notes?: string;
}>;

export const isScreenImage = (description: PhotoDescription | null): boolean =>
  description?.image_kind === 'screenshot' ||
  description?.image_kind === 'photo_of_screen';

/** Flags from the description, the duplicate check and whether screens count. */
export function flagsFor(input: {
  description: PhotoDescription | null;
  screenOk: number | null;
  isDuplicate: boolean;
}): MentaFlag[] {
  const flags: MentaFlag[] = [];
  if (input.isDuplicate) flags.push('duplicate');
  const kind = input.description?.image_kind;
  if (kind === 'stock_or_web_image' || kind === 'blank_or_unusable') {
    flags.push('blank_or_stock');
  }
  if (
    isScreenImage(input.description) &&
    clampProbability(input.screenOk ?? 0) < THRESHOLDS.screenOk
  ) {
    flags.push('screenshot');
  }
  return flags;
}
