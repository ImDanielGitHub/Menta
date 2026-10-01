/** What Menta decided, as the server stores it. */
export type MentaCheckOutcome =
  | 'counted'
  | 'counted_tip'
  | 'not_yet'
  | 'backup_counted'
  | 'unavailable'
  | 'access_ended'
  | 'hint_only'
  | 'left_for_people';

export type MentaCheckReason =
  | 'cant_see_rule'
  | 'shows_something_else'
  | 'too_unclear'
  | 'old_photo'
  | 'screenshot'
  | 'duplicate';

export type MentaCheckTip =
  | 'show_display'
  | 'get_closer'
  | 'more_light'
  | 'show_whole_activity'
  | 'add_detail'
  | 'video_counted';

export type MentaReviewSource =
  | 'human'
  | 'self'
  | 'menta'
  | 'menta_backup'
  | 'menta_unavailable'
  | 'self_override';

export type PromiseReviewMode = 'self' | 'people' | 'menta';

/** The one Today state a Menta-checked promise is in right now. */
export type MentaTodayState =
  | 'due'
  | 'checking'
  | 'slow'
  | 'counted'
  | 'counted_tip'
  | 'not_yet'
  | 'counted_by_you'
  | 'backup_counted'
  | 'unavailable'
  | 'access_ended'
  | 'with_people';

export type MentaTodayItem = {
  challengeId: string;
  title: string;
  /** The rule Menta checks against: the person's own words, or the promise. */
  rule: string;
  reviewMode: PromiseReviewMode | null;
  backupHours: number | null;
  proofKind: 'photo' | 'video' | 'text';
  localDay: string;
  submissionId: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  mediaType: 'photo' | 'video' | 'text' | null;
  mediaUrl: string | null;
  submittedAt: string | null;
  reviewSource: MentaReviewSource | null;
  outcome: MentaCheckOutcome | null;
  reason: MentaCheckReason | null;
  tip: MentaCheckTip | null;
  flagged: boolean;
  notYetsToday: number;
  overridesLeft: number;
  graceUntil: string | null;
  state: MentaTodayState;
};

export type MentaPromiseSetting = {
  challengeId: string;
  title: string;
  reviewMode: PromiseReviewMode;
  backupHours: number | null;
  isSolo: boolean;
  isCreator: boolean;
  passActiveUntil: string | null;
  passAutoRenew: boolean | null;
};

export type MentaHistoryItem = {
  submissionId: string;
  challengeId: string;
  title: string;
  localDay: string;
  submittedAt: string;
  mediaType: 'photo' | 'video' | 'text' | null;
  mediaUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewSource: MentaReviewSource | null;
  outcome: MentaCheckOutcome | null;
  reason: MentaCheckReason | null;
  tip: MentaCheckTip | null;
  flagged: boolean;
  wasSecondPhoto: boolean;
};

export type MentaCheckOverview = {
  consented: boolean;
  consentedAt: string | null;
  isPro: boolean;
  passCost: number;
  overrideCost: number;
  overridesLeft: number;
  stats: { checks: number; notYets: number; overrides: number };
  promises: MentaPromiseSetting[];
  history: MentaHistoryItem[];
};

export type MentaRpcResult<T extends object = object> =
  | ({ success: true } & T)
  | { success: false; code: string; cost?: number; limit?: number };
