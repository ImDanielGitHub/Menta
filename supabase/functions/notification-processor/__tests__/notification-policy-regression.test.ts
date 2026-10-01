import assert from 'node:assert/strict';
import { renderCoachCopy } from '../../_shared/coach-copy.ts';
import * as guard from '../delivery-guard.ts';
import {
  buildOneSignalRequest,
  parseOneSignalSendResponse,
  buildSafePushCopy,
} from '../onesignal-sender.ts';

const now = new Date('2026-09-13T11:00:00.000Z');
const preference = {
  push_enabled: true,
  device_permission_status: 'granted',
  timezone: 'Pacific/Auckland',
};
const request = (overrides: Record<string, unknown> = {}) =>
  buildOneSignalRequest({
    appId: '11111111-2222-4333-8444-555555555555',
    restApiKey: 'test-key',
    externalUserId: 'opaque-test-account',
    idempotencyKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    title: 'PRIVATE_PROMISE_TITLE',
    body: 'PRIVATE_PROOF_BODY',
    data: {
      notificationId: 42,
      type: 'review_reminder',
      action: 'open_review_queue',
      challengeTitle: 'PRIVATE_PROMISE_TITLE',
    },
    ...overrides,
  });

describe('notification deadline and review regressions', () => {
  it('does not treat ambiguous provider responses as permission to send twice', () => {
    for (const value of [
      {},
      { errors: [] },
      { errors: {} },
      [],
      { id: null },
      { id: 123 },
    ]) {
      assert.throws(() => parseOneSignalSendResponse(value));
    }
  });
  it('preserves explicit no-recipient fallback and partial acceptance', () => {
    assert.deepEqual(
      parseOneSignalSendResponse({
        id: null,
        errors: ['All included players are not subscribed'],
      }),
      { kind: 'no-valid-subscription' }
    );
    assert.deepEqual(parseOneSignalSendResponse({ id: '' }), {
      kind: 'no-valid-subscription',
    });
    assert.deepEqual(
      parseOneSignalSendResponse({
        errors: ['All included players are not subscribed'],
      }),
      { kind: 'no-valid-subscription' }
    );
    assert.deepEqual(
      parseOneSignalSendResponse({
        id: 'accepted-id',
        errors: { invalid_aliases: {} },
      }),
      { kind: 'accepted', providerMessageId: 'accepted-id' }
    );
  });
  it('does not convert a validation error into a compatibility send', () => {
    assert.throws(() =>
      parseOneSignalSendResponse({ id: '', errors: ['Invalid app_id'] })
    );
    assert.throws(() =>
      parseOneSignalSendResponse({
        errors: ['All included players are not subscribed', 'Invalid app_id'],
      })
    );
  });
  it('keeps private inbox content out of the entire OneSignal request', () => {
    const result = request();
    assert.equal(JSON.stringify(result.body).includes('PRIVATE_'), false);
    assert.deepEqual(result.body.data, {
      notificationId: 42,
      type: 'review_reminder',
      action: 'open_review_queue',
    });
    assert.deepEqual(result.body.headings, { en: 'A proof needs your review' });
  });
  it.each([
    'menta_check_counted',
    'menta_check_not_yet',
    'menta_check_stepped_in',
  ])(
    'sends safe MentaCheck copy for %s without exposing proof content',
    type => {
      const result = request({
        data: {
          notificationId: 42,
          type,
          action: 'open_challenge',
          challengeId: 'PRIVATE_PROMISE_ID',
        },
      });
      assert.deepEqual(result.body.data, {
        notificationId: 42,
        type,
        action: 'open_today',
      });
      assert.equal(JSON.stringify(result.body).includes('PRIVATE_'), false);
      assert.notDeepEqual(result.body.headings, { en: 'Menta update' });
    }
  );
  it('sets a bounded explicit provider TTL', () => {
    assert.equal(request({ ttlSeconds: 120 }).body.ttl, 120);
    assert.equal(request().body.ttl, 3600);
    for (const ttlSeconds of [-1, 1.5, NaN, Infinity, 2419201])
      assert.throws(() => request({ ttlSeconds }));
  });
  it.each([
    'streak_reminder',
    'challenge_expiring',
    'low_activity',
    'daily_inspiration',
  ])(
    'honours the smart reminder opt-out for an already queued %s',
    notificationType => {
      assert.deepEqual(
        guard.evaluateDeliveryGuard({
          notificationType,
          now,
          preference: { ...preference, challenge_reminders: false },
        }),
        { kind: 'skip', reason: 'SKIPPED_NOTIFICATION_CATEGORY_OFF' }
      );
    }
  );
  it('honours a snooze applied after a coach job was queued', () => {
    assert.deepEqual(
      guard.evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now,
        preference: {
          ...preference,
          ignore_coach_until: '2026-09-13T11:30:00.000Z',
        },
        expiresAt: '2026-09-13T12:00:00.000Z',
      }),
      { kind: 'defer', until: '2026-09-13T11:30:00.000Z' }
    );
  });
  it('does not snooze a review request with the coach', () => {
    assert.deepEqual(
      guard.evaluateDeliveryGuard({
        notificationType: 'review_reminder',
        now,
        preference: {
          ...preference,
          ignore_coach_until: '2026-09-13T11:30:00.000Z',
        },
      }),
      { kind: 'allow' }
    );
  });
  it('drops an expired reminder without attempting delivery', () => {
    assert.deepEqual(
      guard.evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now,
        preference,
        expiresAt: now.toISOString(),
      }),
      { kind: 'skip', reason: 'SKIPPED_MESSAGE_EXPIRED' }
    );
  });
  it('does not defer past a same-day proof deadline', () => {
    assert.deepEqual(
      guard.evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now: new Date('2026-09-13T06:00:00.000Z'),
        expiresAt: '2026-09-13T08:00:00.000Z',
        preference: {
          ...preference,
          quiet_hours_start: '18:00',
          quiet_hours_end: '21:00',
        },
      }),
      { kind: 'skip', reason: 'SKIPPED_QUIET_HOURS_WINDOW_EXPIRED' }
    );
  });
  it('allows an extended proof to wait through quiet hours into the next day', () => {
    const result = guard.evaluateDeliveryGuard({
      notificationType: 'streak_reminder',
      now,
      expiresAt: '2026-09-14T00:00:00.000Z',
      preference: {
        ...preference,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      },
    });
    assert.equal(result.kind, 'defer');
    if (result.kind === 'defer')
      assert.equal(result.until, '2026-09-13T20:00:00.000Z');
  });
  it('uses the real local-day deadline across Auckland daylight saving', () => {
    assert.equal(
      guard.getProofDeadline('2026-09-13', 'Pacific/Auckland'),
      '2026-09-13T12:00:00.000Z'
    );
    assert.equal(
      guard.getProofDeadline('2026-09-27', 'Pacific/Auckland'),
      '2026-09-27T11:00:00.000Z'
    );
    assert.equal(
      guard.getProofDeadline('2026-04-05', 'Pacific/Auckland'),
      '2026-04-05T12:00:00.000Z'
    );
    assert.equal(
      guard.getProofDeadline('2026-09-13', 'Asia/Kolkata'),
      '2026-09-13T18:30:00.000Z'
    );
  });
  it('uses an explicit extension, never a preferred reminder hour', () => {
    assert.equal(
      guard.getProofDeadline(
        '2026-09-13',
        'Pacific/Auckland',
        '2026-09-14T00:00:00.000Z'
      ),
      '2026-09-14T00:00:00.000Z'
    );
  });
  it('retains permission and category suppression', () => {
    assert.equal(
      guard.evaluateDeliveryGuard({
        notificationType: 'review_reminder',
        now,
        preference: { ...preference, group_updates: false },
      }).kind,
      'skip'
    );
    assert.equal(
      guard.evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now,
        preference: { ...preference, device_permission_status: 'denied' },
      }).kind,
      'skip'
    );
  });
});

describe('deadline-specific delivery', () => {
  it('defers the rescue slot until the last hour of the actual proof window', () => {
    assert.deepEqual(
      guard.evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now: new Date('2026-09-13T09:00:00Z'),
        preference,
        expiresAt: '2026-09-13T12:00:00Z',
        notBefore: '2026-09-13T11:00:00Z',
      }),
      { kind: 'defer', until: '2026-09-13T11:00:00.000Z' }
    );
  });
  it('bounds TTL by the actual remaining lifetime, including sub-second expiry', () => {
    assert.equal(guard.remainingPushTtl(undefined, now), 3600);
    assert.equal(guard.remainingPushTtl('2026-09-13T11:02:00Z', now), 120);
    assert.equal(guard.remainingPushTtl('2026-09-13T11:00:00.500Z', now), 0);
    assert.equal(guard.remainingPushTtl(now.toISOString(), now), null);
    assert.throws(() => guard.remainingPushTtl('not-a-date', now));
  });
  it('does not turn a reminder preference into a past deadline', () => {
    const result = buildSafePushCopy({
      notificationType: 'streak_reminder',
      now,
      deadline: {
        expiresAt: '2026-09-13T12:00:00Z',
        timezone: 'Pacific/Auckland',
      },
    });
    assert.equal(result.title, 'Proof closes soon');
    assert.equal(result.body.includes('8:00'), false);
    assert.match(result.body, /14 Sept?/);
  });
  it('describes promise expiry without claiming proof is missing', () => {
    const result = buildSafePushCopy({
      notificationType: 'challenge_expiring',
      now,
      deadline: {
        expiresAt: '2026-09-13T12:00:00Z',
        timezone: 'Pacific/Auckland',
      },
    });
    assert.match(result.body, /promise ends/);
    assert.doesNotMatch(result.body, /Add your proof/);
  });
  it('uses the current review count without exposing individual proof content', () => {
    assert.equal(
      buildSafePushCopy({
        notificationType: 'review_reminder',
        pendingReviews: 3,
      }).title,
      '3 proofs need your review'
    );
    assert.equal(
      buildSafePushCopy({
        notificationType: 'review_reminder',
        pendingReviews: -1,
      }).title,
      'A proof needs your review'
    );
  });
  it('rejects invalid dates and timezones rather than guessing a deadline', () => {
    assert.throws(() =>
      guard.getProofDeadline('2026-02-31', 'Pacific/Auckland')
    );
    assert.throws(() =>
      guard.getProofDeadline('2026-09-13', 'Invalid/Timezone')
    );
  });
});

describe('queued coach copy', () => {
  it('never presents a preferred reminder time as the proof deadline', () => {
    for (const kind of ['routine', 'save'] as const) {
      for (let index = 0; index < 12; index += 1) {
        const copy = renderCoachCopy({
          userId: `account-${index}`,
          localDay: '2026-09-13',
          kind,
          tokens: {
            promise_label: 'PRIVATE_PROMISE',
            streak_length: 4,
            hours_remaining: 2,
            freeze_remaining: 1,
            proof_due_label: '8:00 PM',
            open_promise_count: 1,
          },
        });
        assert.doesNotMatch(copy.body, /8:00|2 hours|PRIVATE_PROMISE/);
      }
    }
  });
});
