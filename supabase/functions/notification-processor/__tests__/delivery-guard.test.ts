import {
  evaluateDeliveryGuard,
  isInsideQuietHours,
  localMinutesAt,
  notificationCategoryEnabled,
} from '../delivery-guard';

describe('notification delivery guard', () => {
  it('evaluates quiet hours in the saved timezone across midnight', () => {
    const auckland2330 = new Date('2026-08-15T11:30:00.000Z');
    expect(localMinutesAt(auckland2330, 'Pacific/Auckland')).toBe(23 * 60 + 30);
    expect(
      isInsideQuietHours({
        now: auckland2330,
        quietHoursStart: '22:00:00',
        quietHoursEnd: '07:00:00',
        timezone: 'Pacific/Auckland',
      })
    ).toBe(true);
  });

  it('defers to the local end of quiet hours without claiming delivery', () => {
    const decision = evaluateDeliveryGuard({
      notificationType: 'review_reminder',
      now: new Date('2026-08-15T11:30:00.000Z'),
      preference: {
        challenge_reminders: true,
        device_permission_status: 'granted',
        push_enabled: true,
        quiet_hours_start: '22:00:00',
        quiet_hours_end: '07:00:00',
        timezone: 'Pacific/Auckland',
      },
    });
    expect(decision.kind).toBe('defer');
    if (decision.kind === 'defer') {
      expect(decision.until).toBe('2026-08-15T19:00:00.000Z');
    }
  });

  it('allows an explicit user-requested test during quiet hours', () => {
    expect(
      evaluateDeliveryGuard({
        notificationType: 'test_notification',
        now: new Date('2026-08-15T11:30:00.000Z'),
        preference: {
          device_permission_status: 'granted',
          push_enabled: true,
          quiet_hours_start: '22:00:00',
          quiet_hours_end: '07:00:00',
          timezone: 'Pacific/Auckland',
        },
      })
    ).toEqual({ kind: 'allow' });
  });

  it('does not deliver a proof reminder after its local day has ended', () => {
    expect(
      evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now: new Date('2026-08-15T11:30:00.000Z'),
        preference: {
          challenge_reminders: true,
          device_permission_status: 'granted',
          push_enabled: true,
          quiet_hours_start: '22:00:00',
          quiet_hours_end: '07:00:00',
          timezone: 'Pacific/Auckland',
        },
      })
    ).toEqual({
      kind: 'skip',
      reason: 'SKIPPED_QUIET_HOURS_WINDOW_EXPIRED',
    });
  });

  it('keeps account preference and device permission as separate gates', () => {
    expect(
      evaluateDeliveryGuard({
        notificationType: 'review_reminder',
        now: new Date(),
        preference: {
          device_permission_status: 'denied',
          group_updates: true,
          push_enabled: true,
        },
      })
    ).toEqual({ kind: 'skip', reason: 'SKIPPED_DEVICE_PERMISSION_OFF' });
  });

  it('applies the category preference again immediately before send', () => {
    expect(
      notificationCategoryEnabled('review_reminder', { group_updates: false })
    ).toBe(false);
    expect(
      notificationCategoryEnabled('streak_reminder', {
        challenge_reminders: false,
      })
    ).toBe(false);
    expect(
      notificationCategoryEnabled('missed_streak', { streak_alerts: false })
    ).toBe(false);
  });

  it('keeps legacy registrations eligible when no device fact exists yet', () => {
    expect(
      evaluateDeliveryGuard({
        notificationType: 'review_reminder',
        now: new Date('2026-08-15T01:00:00.000Z'),
        preference: { group_updates: true, push_enabled: true },
      })
    ).toEqual({ kind: 'allow' });
  });
});
