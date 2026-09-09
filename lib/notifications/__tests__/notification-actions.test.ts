jest.mock('expo-constants', () => ({
  expoConfig: { scheme: ['menta', 'lockedin'] },
}));

import {
  resolveNotificationActionPath,
  resolveNotificationActionUrl,
} from '@/lib/notifications/notification-actions';

describe('notification action allowlist', () => {
  it('builds only named in-app routes from typed notification actions', () => {
    expect(
      resolveNotificationActionUrl({
        action: 'open_challenge',
        challengeId: 'challenge-1',
      })
    ).toBe('menta://challenges/challenge-1');

    expect(
      resolveNotificationActionPath({
        action: 'open_review_queue',
        groupId: 'group-1',
        challengeId: 'challenge-1',
        submissionId: 'submission-1',
      })
    ).toBe(
      'review-queue?groupId=group-1&challengeId=challenge-1&submissionId=submission-1&entryPoint=notification'
    );
    expect(
      resolveNotificationActionPath({
        action: 'open_event',
        eventId: 'event-1',
      })
    ).toBe('events/event-1');
    expect(
      resolveNotificationActionPath({ action: 'open_notification_settings' })
    ).toBe('notification-settings');
  });

  it('rejects unknown actions instead of falling through to another payload URL', () => {
    expect(
      resolveNotificationActionUrl({
        action: 'open_external_url',
        deepLink: 'https://attacker.example/collect',
      })
    ).toBeNull();
  });

  it('retains only the narrow legacy routes needed by queued notifications', () => {
    expect(
      resolveNotificationActionPath({
        deepLink:
          'review-queue?challengeId=challenge-1&submissionId=submission-1',
      })
    ).toBe(
      'review-queue?challengeId=challenge-1&submissionId=submission-1&entryPoint=notification'
    );
    expect(
      resolveNotificationActionPath({ deepLink: 'verification/challenge-1' })
    ).toBe('challenges/challenge-1');
    expect(resolveNotificationActionPath({ deepLink: 'profile/badges' })).toBe(
      'profile'
    );
  });

  it('rejects schemes, path traversal, unknown query keys, and unsafe ids', () => {
    for (const payload of [
      { deepLink: 'https://attacker.example/collect' },
      { deepLink: 'challenges/../../settings' },
      { deepLink: 'review-queue?redirect=https%3A%2F%2Fattacker.example' },
      { action: 'open_group', groupId: 'group/../settings' },
      { action: 'open_challenge', challengeId: 'challenge?next=settings' },
      { action: 'open_event', eventId: '../settings' },
    ]) {
      expect(resolveNotificationActionUrl(payload)).toBeNull();
    }
  });
});
