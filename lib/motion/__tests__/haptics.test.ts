import * as Haptics from 'expo-haptics';

import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitConfirmedSuccess,
  emitHaptic,
  isConfirmedReceipt,
  resolveConfirmedHapticTier,
  resolveHapticPlan,
  SUCCESS_PRELUDE_MS,
  type ConfirmedHapticOutcome,
  type ConfirmedHapticTier,
  type HapticBlockedReason,
  type HapticEvent,
  type HapticFailedOperation,
  type HapticIntent,
  type HapticPlanStep,
} from '@/lib/motion/haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  performAndroidHapticsAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Soft: 'soft',
    Rigid: 'rigid',
  },
  NotificationFeedbackType: {
    Warning: 'warning',
    Error: 'error',
    Success: 'success',
  },
  AndroidHaptics: {
    Confirm: 'confirm',
    Reject: 'reject',
    Keyboard_Tap: 'keyboard-tap',
    Segment_Tick: 'segment-tick',
    Segment_Frequent_Tick: 'segment-frequent-tick',
    Drag_Start: 'drag-start',
    Long_Press: 'long-press',
    Context_Click: 'context-click',
  },
}));

const intentPlans: Readonly<
  Record<
    HapticIntent,
    Readonly<{ ios: HapticPlanStep; android: HapticPlanStep }>
  >
> = {
  press: {
    ios: { kind: 'ios-impact', style: 'light' },
    android: { kind: 'android', type: 'keyboard-tap' },
  },
  selection: {
    ios: { kind: 'ios-selection' },
    android: { kind: 'android', type: 'segment-tick' },
  },
  'hold-start': {
    ios: { kind: 'ios-impact', style: 'soft' },
    android: { kind: 'android', type: 'drag-start' },
  },
  'hold-tick': {
    ios: { kind: 'ios-impact', style: 'light' },
    android: { kind: 'android', type: 'segment-frequent-tick' },
  },
  'hold-complete': {
    ios: { kind: 'ios-impact', style: 'rigid' },
    android: { kind: 'android', type: 'long-press' },
  },
  'destructive-commit': {
    ios: { kind: 'ios-impact', style: 'rigid' },
    android: { kind: 'android', type: 'long-press' },
  },
  confirm: {
    ios: { kind: 'ios-impact', style: 'medium' },
    android: { kind: 'android', type: 'confirm' },
  },
  warning: {
    ios: { kind: 'ios-notification', type: 'warning' },
    android: { kind: 'android', type: 'reject' },
  },
  error: {
    ios: { kind: 'ios-notification', type: 'error' },
    android: { kind: 'android', type: 'reject' },
  },
};

const outcomeTiers: Readonly<
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

const blockedReasons: readonly HapticBlockedReason[] = [
  'validation',
  'permission',
  'insufficient-momenta',
  'quota',
];

const failedOperations: readonly HapticFailedOperation[] = [
  'save',
  'submit',
  'join',
  'review',
  'purchase',
  'leave',
  'delete',
];

describe('semantic haptics', () => {
  beforeEach(() => {
    jest.mocked(Haptics.impactAsync).mockClear();
    jest.mocked(Haptics.selectionAsync).mockClear();
    jest.mocked(Haptics.notificationAsync).mockClear();
    jest.mocked(Haptics.performAndroidHapticsAsync).mockClear();
    jest.mocked(Haptics.notificationAsync).mockResolvedValue(undefined);
    jest.mocked(Haptics.impactAsync).mockResolvedValue(undefined);
    jest.mocked(Haptics.selectionAsync).mockResolvedValue(undefined);
    jest
      .mocked(Haptics.performAndroidHapticsAsync)
      .mockResolvedValue(undefined);
  });

  it('requires a non-empty confirmed receipt id', () => {
    expect(() => createConfirmedReceipt('proof', '  ')).toThrow(
      'A confirmed receipt requires a non-empty id.'
    );

    const receipt = createConfirmedReceipt('proof', ' proof-123 ');

    expect(receipt).toEqual({
      confirmed: true,
      receiptId: 'proof-123',
      source: 'proof',
    });
    expect(isConfirmedReceipt(receipt)).toBe(true);
  });

  it('does not emit success for an unconfirmed runtime receipt', async () => {
    const result = await emitHaptic({
      type: 'success',
      receipt: {
        confirmed: false,
        receiptId: 'optimistic-proof',
        source: 'proof',
      } as unknown as ReturnType<typeof createConfirmedReceipt>,
    });

    expect(result).toBe(false);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(
      isConfirmedReceipt({
        confirmed: false,
        receiptId: 'optimistic-proof',
        source: 'proof',
      })
    ).toBe(false);
  });

  it('does not emit a typed confirmed outcome for an unconfirmed runtime receipt', async () => {
    const result = await emitHaptic({
      type: 'confirmed',
      outcome: 'proof-approved',
      receipt: {
        confirmed: false,
        receiptId: 'optimistic-proof',
        source: 'proof',
      } as unknown as ReturnType<typeof createConfirmedReceipt>,
    });

    expect(result).toBe(false);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('resolves every interaction intent on iOS and Android and no-ops on web', () => {
    for (const [intent, plans] of Object.entries(intentPlans) as [
      HapticIntent,
      { ios: HapticPlanStep; android: HapticPlanStep },
    ][]) {
      const event: HapticEvent = { type: intent };
      expect(resolveHapticPlan(event, 'ios')).toEqual([plans.ios]);
      expect(resolveHapticPlan(event, 'android')).toEqual([plans.android]);
      expect(resolveHapticPlan(event, 'web')).toEqual([]);
    }
  });

  it('maps every blocked reason to warning on iOS, reject on Android, and silence on web', () => {
    for (const reason of blockedReasons) {
      const event: HapticEvent = { type: 'blocked', reason };
      expect(resolveHapticPlan(event, 'ios')).toEqual([
        { kind: 'ios-notification', type: 'warning' },
      ]);
      expect(resolveHapticPlan(event, 'android')).toEqual([
        { kind: 'android', type: 'reject' },
      ]);
      expect(resolveHapticPlan(event, 'web')).toEqual([]);
    }
  });

  it('maps every definitive failure to error on iOS, reject on Android, and silence on web', () => {
    for (const operation of failedOperations) {
      const event: HapticEvent = { type: 'failed', operation };
      expect(resolveHapticPlan(event, 'ios')).toEqual([
        { kind: 'ios-notification', type: 'error' },
      ]);
      expect(resolveHapticPlan(event, 'android')).toEqual([
        { kind: 'android', type: 'reject' },
      ]);
      expect(resolveHapticPlan(event, 'web')).toEqual([]);
    }
  });

  it('keeps unknown outcomes silent on every platform', async () => {
    const event: HapticEvent = { type: 'unknown' };

    expect(resolveHapticPlan(event, 'ios')).toEqual([]);
    expect(resolveHapticPlan(event, 'android')).toEqual([]);
    expect(resolveHapticPlan(event, 'web')).toEqual([]);
    expect(await emitHaptic(event)).toBe(false);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(Haptics.performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('maps every confirmed outcome to an exhaustive quiet or achievement tier', () => {
    for (const [outcome, tier] of Object.entries(outcomeTiers) as [
      ConfirmedHapticOutcome,
      ConfirmedHapticTier,
    ][]) {
      expect(resolveConfirmedHapticTier(outcome)).toBe(tier);

      const event: HapticEvent = {
        type: 'confirmed',
        outcome,
        receipt: createConfirmedReceipt(
          tier === 'achievement' ? 'reward' : 'generic',
          `outcome-${outcome}`
        ),
      };

      expect(resolveHapticPlan(event, 'ios')).toEqual(
        tier === 'achievement'
          ? [
              { kind: 'ios-impact', style: 'soft' },
              { kind: 'wait', ms: SUCCESS_PRELUDE_MS },
              { kind: 'ios-notification', type: 'success' },
            ]
          : [{ kind: 'ios-notification', type: 'success' }]
      );
      expect(resolveHapticPlan(event, 'android')).toEqual(
        tier === 'achievement'
          ? [
              { kind: 'android', type: 'confirm' },
              { kind: 'wait', ms: SUCCESS_PRELUDE_MS },
              { kind: 'android', type: 'segment-tick' },
            ]
          : [{ kind: 'android', type: 'confirm' }]
      );
      expect(resolveHapticPlan(event, 'web')).toEqual([]);
    }
  });

  it('keeps correction requests quiet while reserving achievement feedback for approved proof', () => {
    const receipt = createConfirmedReceipt(
      'review-decision',
      'review-contrast'
    );

    expect(
      resolveHapticPlan(
        { type: 'confirmed', outcome: 'correction-requested', receipt },
        'ios'
      )
    ).toEqual([{ kind: 'ios-notification', type: 'success' }]);
    expect(
      resolveHapticPlan(
        { type: 'confirmed', outcome: 'proof-approved', receipt },
        'ios'
      )
    ).toEqual([
      { kind: 'ios-impact', style: 'soft' },
      { kind: 'wait', ms: SUCCESS_PRELUDE_MS },
      { kind: 'ios-notification', type: 'success' },
    ]);
  });

  it('maps hold, selection, and quiet success to distinct native cues', async () => {
    expect(await emitHaptic({ type: 'hold-start' })).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('soft');

    expect(await emitHaptic({ type: 'hold-tick' })).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');

    expect(await emitHaptic({ type: 'hold-complete' })).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('rigid');

    expect(await emitHaptic({ type: 'confirm' })).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');

    expect(await emitHaptic({ type: 'selection' })).toBe(true);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

    expect(await emitHaptic({ type: 'destructive-commit' })).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('rigid');
  });

  it('keeps generic and settings receipts on the quiet success cue', async () => {
    const quietReceipt = createConfirmedReceipt(
      'settings-save',
      'settings-123'
    );
    expect(await emitConfirmedSuccess(quietReceipt)).toBe(true);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('plays a rising reward only for celebrated confirmed receipts', async () => {
    const receipt = createConfirmedReceipt('proof', 'proof-reward');
    expect(await emitConfirmedSuccess(receipt)).toBe(true);

    expect(Haptics.impactAsync).toHaveBeenCalledWith('soft');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('emits the new typed confirmed outcome API', async () => {
    const receipt = createConfirmedReceipt('promise-creation', 'promise-new');

    expect(await emitConfirmedOutcome('promise-created', receipt)).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('soft');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('uses Android engine cues instead of the legacy vibrator path', () => {
    expect(resolveHapticPlan({ type: 'hold-complete' }, 'android')).toEqual([
      { kind: 'android', type: 'long-press' },
    ]);
    expect(
      resolveHapticPlan(
        {
          type: 'success',
          receipt: createConfirmedReceipt('generic', 'android-quiet'),
        },
        'android'
      )
    ).toEqual([{ kind: 'android', type: 'confirm' }]);
    expect(
      resolveHapticPlan(
        {
          type: 'success',
          receipt: createConfirmedReceipt('proof', 'android-proof'),
        },
        'android'
      )
    ).toEqual([
      { kind: 'android', type: 'confirm' },
      { kind: 'wait', ms: SUCCESS_PRELUDE_MS },
      { kind: 'android', type: 'segment-tick' },
    ]);
    expect(resolveHapticPlan({ type: 'hold-start' }, 'web')).toEqual([]);
    expect(resolveHapticPlan({ type: 'warning' }, 'android')).toEqual([
      { kind: 'android', type: 'reject' },
    ]);
    expect(
      resolveHapticPlan({ type: 'destructive-commit' }, 'android')
    ).toEqual([{ kind: 'android', type: 'long-press' }]);
  });

  it('emits a confirmed receipt once across concurrent subscribers', async () => {
    const receipt = createConfirmedReceipt('generic', 'proof-shared-receipt');

    const [firstResult, concurrentResult] = await Promise.all([
      emitConfirmedSuccess(receipt),
      emitConfirmedSuccess(receipt),
    ]);
    const laterResult = await emitConfirmedSuccess(receipt);

    expect(firstResult).toBe(true);
    expect(concurrentResult).toBe(false);
    expect(laterResult).toBe(false);
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('deduplicates legacy and typed success calls for the same receipt', async () => {
    const receipt = createConfirmedReceipt('proof', 'shared-api-receipt');

    expect(await emitConfirmedOutcome('proof-approved', receipt)).toBe(true);
    expect(await emitConfirmedSuccess(receipt)).toBe(false);
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  it('does not consume a receipt when native feedback fails', async () => {
    const receipt = createConfirmedReceipt(
      'review-decision',
      'review-retry-receipt'
    );
    jest
      .mocked(Haptics.impactAsync)
      .mockRejectedValueOnce(new Error('Native haptics unavailable'));

    expect(await emitConfirmedSuccess(receipt)).toBe(false);
    expect(await emitConfirmedSuccess(receipt)).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
  });
});
