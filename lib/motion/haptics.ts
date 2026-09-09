import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticIntent =
  | 'press'
  | 'selection'
  | 'hold-start'
  | 'hold-tick'
  | 'hold-complete'
  | 'destructive-commit'
  | 'confirm'
  | 'warning'
  | 'error';

export type HapticReceiptSource =
  | 'proof'
  | 'review-decision'
  | 'event-check-in'
  | 'event-proof'
  | 'purchase'
  | 'subscription'
  | 'reward'
  | 'inventory'
  | 'promise-creation'
  | 'promise-membership'
  | 'group-membership'
  | 'invitation'
  | 'account-deletion'
  | 'destructive-change'
  | 'streak-milestone'
  | 'settings-save'
  | 'generic';

export type ConfirmedHapticOutcome =
  | 'promise-created'
  | 'proof-approved'
  | 'review-approved'
  | 'correction-requested'
  | 'event-check-in'
  | 'event-proof-approved'
  | 'group-joined'
  | 'promise-joined'
  | 'invite-created'
  | 'settings-saved'
  | 'purchase-confirmed'
  | 'subscription-activated'
  | 'purchase-restored'
  | 'reward-earned'
  | 'inventory-equipped'
  | 'account-deleted'
  | 'entity-deleted'
  | 'entity-left'
  | 'streak-milestone';

export type ConfirmedHapticTier = 'quiet' | 'achievement';

export type HapticBlockedReason =
  | 'validation'
  | 'permission'
  | 'insufficient-momenta'
  | 'quota';

export type HapticFailedOperation =
  | 'save'
  | 'submit'
  | 'join'
  | 'review'
  | 'purchase'
  | 'leave'
  | 'delete';

export type ConfirmedReceipt = Readonly<{
  confirmed: true;
  receiptId: string;
  source: HapticReceiptSource;
}>;

export type HapticEvent =
  | Readonly<{ type: HapticIntent }>
  | Readonly<{ type: 'success'; receipt: ConfirmedReceipt }>
  | Readonly<{
      type: 'confirmed';
      outcome: ConfirmedHapticOutcome;
      receipt: ConfirmedReceipt;
    }>
  | Readonly<{ type: 'blocked'; reason: HapticBlockedReason }>
  | Readonly<{ type: 'failed'; operation: HapticFailedOperation }>
  | Readonly<{ type: 'unknown' }>;

export type HapticPlanStep =
  | Readonly<{
      kind: 'ios-impact';
      style: 'light' | 'medium' | 'soft' | 'rigid';
    }>
  | Readonly<{ kind: 'ios-selection' }>
  | Readonly<{
      kind: 'ios-notification';
      type: 'success' | 'warning' | 'error';
    }>
  | Readonly<{
      kind: 'android';
      type:
        | 'keyboard-tap'
        | 'segment-tick'
        | 'segment-frequent-tick'
        | 'drag-start'
        | 'long-press'
        | 'confirm'
        | 'context-click'
        | 'reject';
    }>
  | Readonly<{ kind: 'wait'; ms: number }>;

const CONFIRMED_RECEIPT_HISTORY_LIMIT = 100;
const handledConfirmedReceiptKeys = new Set<string>();
const confirmedReceiptHistory: string[] = [];

/**
 * Gap between the reward prelude and the system success cue. Short enough to
 * read as one composition (Apple Pay's two-tap confirm), not two events.
 */
export const SUCCESS_PRELUDE_MS = 48;

const CELEBRATED_SUCCESS_SOURCES: ReadonlySet<HapticReceiptSource> = new Set([
  'proof',
  'purchase',
  'review-decision',
  'event-check-in',
]);

/**
 * The outcome, rather than its storage/provider source, owns emphasis for new
 * callers. The legacy source set above remains only so existing success calls
 * keep their current behaviour while routes migrate to emitConfirmedOutcome.
 */
const CONFIRMED_OUTCOME_TIER: Readonly<
  Record<ConfirmedHapticOutcome, ConfirmedHapticTier>
> = {
  'promise-created': 'achievement',
  'proof-approved': 'achievement',
  'review-approved': 'quiet',
  'correction-requested': 'quiet',
  'event-check-in': 'quiet',
  'event-proof-approved': 'achievement',
  'group-joined': 'achievement',
  'promise-joined': 'achievement',
  'invite-created': 'quiet',
  'settings-saved': 'quiet',
  'purchase-confirmed': 'quiet',
  'subscription-activated': 'quiet',
  'purchase-restored': 'quiet',
  'reward-earned': 'achievement',
  'inventory-equipped': 'quiet',
  'account-deleted': 'quiet',
  'entity-deleted': 'quiet',
  'entity-left': 'quiet',
  'streak-milestone': 'achievement',
};

const impactFeedbackStyle =
  Haptics.ImpactFeedbackStyle ??
  ({
    Light: 'light',
    Medium: 'medium',
    Soft: 'soft',
    Rigid: 'rigid',
  } as typeof Haptics.ImpactFeedbackStyle);

const notificationFeedbackType =
  Haptics.NotificationFeedbackType ??
  ({
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  } as typeof Haptics.NotificationFeedbackType);

const androidHaptics =
  Haptics.AndroidHaptics ??
  ({
    Keyboard_Tap: 'keyboard-tap',
    Segment_Tick: 'segment-tick',
    Segment_Frequent_Tick: 'segment-frequent-tick',
    Drag_Start: 'drag-start',
    Long_Press: 'long-press',
    Confirm: 'confirm',
    Context_Click: 'context-click',
    Reject: 'reject',
  } as typeof Haptics.AndroidHaptics);

const IOS_IMPACT_STYLE = {
  light: impactFeedbackStyle.Light,
  medium: impactFeedbackStyle.Medium,
  soft: impactFeedbackStyle.Soft,
  rigid: impactFeedbackStyle.Rigid,
} as const;

const IOS_NOTIFICATION_TYPE = {
  success: notificationFeedbackType.Success,
  warning: notificationFeedbackType.Warning,
  error: notificationFeedbackType.Error,
} as const;

const ANDROID_HAPTIC_TYPE = {
  'keyboard-tap': androidHaptics.Keyboard_Tap,
  'segment-tick': androidHaptics.Segment_Tick,
  'segment-frequent-tick': androidHaptics.Segment_Frequent_Tick,
  'drag-start': androidHaptics.Drag_Start,
  'long-press': androidHaptics.Long_Press,
  confirm: androidHaptics.Confirm,
  'context-click': androidHaptics.Context_Click,
  reject: androidHaptics.Reject,
} as const;

function getConfirmedReceiptKey(receipt: ConfirmedReceipt): string {
  return `${receipt.source}:${receipt.receiptId}`;
}

function retainConfirmedReceipt(receiptKey: string): void {
  confirmedReceiptHistory.push(receiptKey);

  while (confirmedReceiptHistory.length > CONFIRMED_RECEIPT_HISTORY_LIMIT) {
    const expiredReceiptKey = confirmedReceiptHistory.shift();
    if (expiredReceiptKey) {
      handledConfirmedReceiptKeys.delete(expiredReceiptKey);
    }
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function isCelebratedSuccess(source: HapticReceiptSource): boolean {
  return CELEBRATED_SUCCESS_SOURCES.has(source);
}

function resolveIosIntent(type: HapticIntent): HapticPlanStep {
  switch (type) {
    case 'press':
      return { kind: 'ios-impact', style: 'light' };
    case 'selection':
      return { kind: 'ios-selection' };
    case 'hold-start':
      return { kind: 'ios-impact', style: 'soft' };
    case 'hold-tick':
      return { kind: 'ios-impact', style: 'light' };
    case 'hold-complete':
      return { kind: 'ios-impact', style: 'rigid' };
    case 'destructive-commit':
      return { kind: 'ios-impact', style: 'rigid' };
    case 'confirm':
      return { kind: 'ios-impact', style: 'medium' };
    case 'warning':
      return { kind: 'ios-notification', type: 'warning' };
    case 'error':
      return { kind: 'ios-notification', type: 'error' };
    default: {
      const exhaustive: never = type;
      throw new Error(`Unhandled haptic intent: ${exhaustive}`);
    }
  }
}

function resolveAndroidIntent(type: HapticIntent): HapticPlanStep {
  switch (type) {
    case 'press':
      return { kind: 'android', type: 'keyboard-tap' };
    case 'selection':
      return { kind: 'android', type: 'segment-tick' };
    case 'hold-start':
      return { kind: 'android', type: 'drag-start' };
    case 'hold-tick':
      return { kind: 'android', type: 'segment-frequent-tick' };
    case 'hold-complete':
      return { kind: 'android', type: 'long-press' };
    case 'destructive-commit':
      return { kind: 'android', type: 'long-press' };
    case 'confirm':
      return { kind: 'android', type: 'confirm' };
    case 'warning':
      return { kind: 'android', type: 'reject' };
    case 'error':
      return { kind: 'android', type: 'reject' };
    default: {
      const exhaustive: never = type;
      throw new Error(`Unhandled haptic intent: ${exhaustive}`);
    }
  }
}

function resolveConfirmedTierPlan(
  tier: ConfirmedHapticTier,
  os: string
): readonly HapticPlanStep[] {
  const celebrated = tier === 'achievement';

  if (os === 'android') {
    if (celebrated) {
      return [
        { kind: 'android', type: 'confirm' },
        { kind: 'wait', ms: SUCCESS_PRELUDE_MS },
        { kind: 'android', type: 'segment-tick' },
      ];
    }

    return [{ kind: 'android', type: 'confirm' }];
  }

  if (celebrated) {
    return [
      { kind: 'ios-impact', style: 'soft' },
      { kind: 'wait', ms: SUCCESS_PRELUDE_MS },
      { kind: 'ios-notification', type: 'success' },
    ];
  }

  return [{ kind: 'ios-notification', type: 'success' }];
}

function resolveSuccessPlan(
  source: HapticReceiptSource,
  os: string
): readonly HapticPlanStep[] {
  return resolveConfirmedTierPlan(
    isCelebratedSuccess(source) ? 'achievement' : 'quiet',
    os
  );
}

export function resolveConfirmedHapticTier(
  outcome: ConfirmedHapticOutcome
): ConfirmedHapticTier {
  return CONFIRMED_OUTCOME_TIER[outcome];
}

/**
 * Resolves the native playback plan for a semantic haptic. Used by emitHaptic
 * and by tests so iOS/Android mappings stay honest without mutating Platform.
 */
export function resolveHapticPlan(
  event: HapticEvent,
  os: string
): readonly HapticPlanStep[] {
  if (os === 'web') {
    return [];
  }

  if (event.type === 'success') {
    return resolveSuccessPlan(event.receipt.source, os);
  }

  if (event.type === 'confirmed') {
    return resolveConfirmedTierPlan(
      resolveConfirmedHapticTier(event.outcome),
      os
    );
  }

  if (event.type === 'unknown') {
    return [];
  }

  if (event.type === 'blocked') {
    return os === 'android'
      ? [{ kind: 'android', type: 'reject' }]
      : [{ kind: 'ios-notification', type: 'warning' }];
  }

  if (event.type === 'failed') {
    return os === 'android'
      ? [{ kind: 'android', type: 'reject' }]
      : [{ kind: 'ios-notification', type: 'error' }];
  }

  if (os === 'android') {
    return [resolveAndroidIntent(event.type)];
  }

  return [resolveIosIntent(event.type)];
}

async function playPlan(plan: readonly HapticPlanStep[]): Promise<void> {
  for (const step of plan) {
    switch (step.kind) {
      case 'wait':
        await wait(step.ms);
        break;
      case 'ios-impact':
        await Haptics.impactAsync(IOS_IMPACT_STYLE[step.style]);
        break;
      case 'ios-selection':
        await Haptics.selectionAsync();
        break;
      case 'ios-notification':
        await Haptics.notificationAsync(IOS_NOTIFICATION_TYPE[step.type]);
        break;
      case 'android':
        await Haptics.performAndroidHapticsAsync(
          ANDROID_HAPTIC_TYPE[step.type]
        );
        break;
      default: {
        const exhaustive: never = step;
        throw new Error(`Unhandled haptic step: ${JSON.stringify(exhaustive)}`);
      }
    }
  }
}

/**
 * Creates the only receipt shape accepted by a success haptic.
 */
export function createConfirmedReceipt(
  source: HapticReceiptSource,
  receiptId: string
): ConfirmedReceipt {
  const trimmedReceiptId = receiptId.trim();

  if (!trimmedReceiptId) {
    throw new Error('A confirmed receipt requires a non-empty id.');
  }

  return {
    confirmed: true,
    receiptId: trimmedReceiptId,
    source,
  };
}

/**
 * Runtime guard for boundaries where receipt data came from a network or
 * native purchase SDK rather than from createConfirmedReceipt.
 */
export function isConfirmedReceipt(value: unknown): value is ConfirmedReceipt {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.confirmed === true &&
    typeof candidate.receiptId === 'string' &&
    candidate.receiptId.trim().length > 0 &&
    typeof candidate.source === 'string'
  );
}

/**
 * Emits a semantic haptic. Confirmed events are intentionally receipt-bound so
 * optimistic UI cannot announce a proof, check-in, purchase, or save as done.
 * Unknown outcomes are explicit no-ops; blocked and failed events are reserved
 * for known constraints and definitive failures respectively.
 *
 * Native mapping is intentionally uneven: ordinary presses stay light, the
 * hold gesture has a distinct charge-up, and only confirmed receipts get the
 * reward pattern. Fun here comes from scarcity and contrast, not more buzzes.
 */
export async function emitHaptic(event: HapticEvent): Promise<boolean> {
  if (Platform.OS === 'web' || event.type === 'unknown') {
    return false;
  }

  const confirmedReceipt =
    event.type === 'success' || event.type === 'confirmed'
      ? event.receipt
      : undefined;

  if (confirmedReceipt && !isConfirmedReceipt(confirmedReceipt)) {
    return false;
  }

  const confirmedReceiptKey = confirmedReceipt
    ? getConfirmedReceiptKey(confirmedReceipt)
    : undefined;

  if (
    confirmedReceiptKey &&
    handledConfirmedReceiptKeys.has(confirmedReceiptKey)
  ) {
    return false;
  }

  if (confirmedReceiptKey) {
    // Reserve before awaiting native feedback so concurrent subscribers cannot
    // emit the same server-confirmed receipt twice.
    handledConfirmedReceiptKeys.add(confirmedReceiptKey);
  }

  try {
    await playPlan(resolveHapticPlan(event, Platform.OS));

    if (confirmedReceiptKey) {
      retainConfirmedReceipt(confirmedReceiptKey);
    }

    return true;
  } catch {
    if (confirmedReceiptKey) {
      // Native feedback can fail transiently. Do not consume the receipt when
      // no haptic was delivered, so a later subscriber can retry it.
      handledConfirmedReceiptKeys.delete(confirmedReceiptKey);
    }
    return false;
  }
}

export function emitConfirmedSuccess(
  receipt: ConfirmedReceipt
): Promise<boolean> {
  return emitHaptic({ type: 'success', receipt });
}

/**
 * Preferred confirmed-result API. It keeps tactile emphasis attached to the
 * product outcome while retaining the receipt guard and duplicate protection.
 */
export function emitConfirmedOutcome(
  outcome: ConfirmedHapticOutcome,
  receipt: ConfirmedReceipt
): Promise<boolean> {
  return emitHaptic({ type: 'confirmed', outcome, receipt });
}
