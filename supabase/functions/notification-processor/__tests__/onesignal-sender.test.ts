import { webcrypto } from 'node:crypto';

import {
  buildOneSignalAuthorization,
  buildOneSignalDataPayload,
  buildOneSignalRequest,
  createOneSignalIdempotencyKey,
  isValidOneSignalAppId,
  parseOneSignalSendResponse,
} from '../onesignal-sender.ts';

Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: webcrypto,
});

describe('OneSignal coach sender', () => {
  it('builds a single push request targeted by external id', () => {
    const request = buildOneSignalRequest({
      appId: '11111111-2222-4333-8444-555555555555',
      restApiKey: 'rest-key',
      externalUserId: 'user-1',
      idempotencyKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      title: 'Proof is due.',
      body: 'Submit Walk before dusk by 8:00 PM.',
      data: { type: 'streak_reminder' },
    });

    expect(request.url).toBe('https://api.onesignal.com/notifications');
    expect(request.authorization).toBe('Basic rest-key');
    expect(request.body).toEqual({
      app_id: '11111111-2222-4333-8444-555555555555',
      target_channel: 'push',
      isIos: true,
      isAndroid: false,
      isAnyWeb: false,
      include_aliases: { external_id: ['user-1'] },
      headings: { en: 'Proof is due.' },
      contents: { en: 'Submit Walk before dusk by 8:00 PM.' },
      data: { type: 'streak_reminder' },
      idempotency_key: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    });
    expect(JSON.stringify(request.body)).not.toContain('delayed_option');
    expect(JSON.stringify(request.body)).not.toContain('include_aliases":{}"');
  });

  it('derives one stable RFC UUID for every logical notification', async () => {
    const first = await createOneSignalIdempotencyKey(42);
    const retry = await createOneSignalIdempotencyKey(42);
    const next = await createOneSignalIdempotencyKey(43);

    expect(first).toBe(retry);
    expect(first).not.toBe(next);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('keeps OneSignal data bounded and removes private route context', () => {
    expect(
      buildOneSignalDataPayload({
        action: 'open_challenge',
        notificationId: 42,
        notificationType: 'streak_reminder',
      })
    ).toEqual({
      action: 'open_today',
      notificationId: 42,
      type: 'streak_reminder',
    });
    expect(
      buildOneSignalDataPayload({
        action: 'open_review_queue',
        notificationId: 43,
        notificationType: 'review_reminder',
      })
    ).toEqual({
      action: 'open_review_queue',
      notificationId: 43,
      type: 'review_reminder',
    });
    expect(
      buildOneSignalDataPayload({
        action: 'open_notification_settings',
        notificationId: 44,
        notificationType: 'test_notification',
      })
    ).toEqual({
      action: 'open_notification_settings',
      notificationId: 44,
      type: 'test_notification',
    });
    expect(() =>
      buildOneSignalDataPayload({
        action: 'open_today',
        notificationId: 45,
        notificationType: 'private_custom_type',
      })
    ).toThrow(/not allowlisted/);
  });

  it('uses Key auth for OneSignal v2 REST keys', () => {
    expect(buildOneSignalAuthorization('os_v2_abc')).toBe('Key os_v2_abc');
    expect(isValidOneSignalAppId('not-an-id')).toBe(false);
  });

  it('uses the provider message id as the OneSignal acceptance boundary', () => {
    expect(parseOneSignalSendResponse({ id: 'notif-1' })).toEqual({
      kind: 'accepted',
      providerMessageId: 'notif-1',
    });
    expect(parseOneSignalSendResponse({})).toEqual({
      kind: 'no-valid-subscription',
    });
    expect(parseOneSignalSendResponse({ errors: [] })).toEqual({
      kind: 'no-valid-subscription',
    });
    expect(parseOneSignalSendResponse({ errors: {} })).toEqual({
      kind: 'no-valid-subscription',
    });
    expect(
      parseOneSignalSendResponse({
        errors: ['All included players are not subscribed'],
      })
    ).toEqual({ kind: 'no-valid-subscription' });
    expect(
      parseOneSignalSendResponse({
        id: 'notif-partial',
        errors: { invalid_aliases: { external_id: ['missing-user'] } },
      })
    ).toEqual({
      kind: 'accepted',
      providerMessageId: 'notif-partial',
    });
    expect(() => parseOneSignalSendResponse('not-an-object')).toThrow(
      /not an object/
    );
  });
});
