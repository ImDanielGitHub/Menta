import fs from 'node:fs';
import path from 'node:path';

describe('notification pipeline contract', () => {
  const appConfig = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf8')
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );
  const easConfig = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'eas.json'), 'utf8')
  );
  const processorSource = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/functions/notification-processor/index.ts'
    ),
    'utf8'
  );
  const schedulerSource = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/functions/challenge-notification-scheduler/index.ts'
    ),
    'utf8'
  );

  it('sends visible Expo notification messages with Android display hints', () => {
    expect(processorSource).toContain('interface NotificationRecord');
    expect(processorSource).toContain('title: record.title');
    expect(processorSource).toContain('body: record.body');
    expect(processorSource).toContain('priority: getExpoPriority(record)');
    expect(processorSource).toContain('channelId: getAndroidChannelId(record)');
    expect(processorSource).toMatch(
      /case 'streak_reminder':[\s\S]*return 'reminders';/
    );
  });

  it('records provider acceptance without claiming provider delivery', () => {
    expect(processorSource).toContain('provider_accepted_at: acceptedAt');
    expect(processorSource).toContain('provider_message_id: providerMessageId');
    expect(processorSource).toContain("provider_status: 'accepted'");
    expect(processorSource).toContain('providerMessageId: ticket.id');
    expect(processorSource).toContain('receipts,');
    expect(processorSource).toContain('receiptError,');
    expect(processorSource).toContain(
      'createOneSignalIdempotencyKey(record.id)'
    );
  });

  it('reconciles Expo receipts and retires only the matching stale token', () => {
    expect(processorSource).toContain('/api/v2/push/getReceipts');
    expect(processorSource).toContain("provider_status: 'delivered'");
    expect(processorSource).toContain(
      "providerError === 'DeviceNotRegistered'"
    );
    expect(processorSource).toContain('provider_token_fingerprint');
    expect(processorSource).toContain(
      'if (currentFingerprint !== expectedFingerprint) return false;'
    );
    expect(processorSource).toContain('expo_push_token: null');
    expect(processorSource).not.toContain('push_enabled: false');
  });

  it('rechecks category, device permission, and quiet hours before send', () => {
    expect(processorSource).toContain('evaluateDeliveryGuard');
    expect(processorSource).toContain('DEFERRED_QUIET_HOURS');
    expect(processorSource).toContain('markDeferred');
  });

  it('handles missing push preferences as skips instead of processor crashes', () => {
    expect(processorSource).toContain('.maybeSingle()');
    expect(processorSource).toContain('SKIPPED_NO_NOTIFICATION_PREFERENCES');
    expect(processorSource).toContain('SKIPPED_PUSH_DISABLED');
    expect(processorSource).toContain('SKIPPED_NO_EXPO_PUSH_TOKEN');
    expect(processorSource).toContain("status: 'cancelled'");
  });

  it('claims one atomic batch instead of selecting sendable rows directly', () => {
    expect(processorSource).toContain(
      "supabase.rpc('claim_notification_batch_v1'"
    );
    expect(processorSource).not.toContain(
      ".from('notifications')\n    .select(\n      'id, user_id, notification_type, title, body, payload, metadata, priority, delivery_attempts'"
    );
    expect(processorSource).toContain('assertMutation(');
  });

  it('gates remote coach sends on an activated handover contract', () => {
    expect(processorSource).toContain('remote_coach_contract_version');
    expect(processorSource).toContain('SKIPPED_REMOTE_COACH_NOT_ACTIVATED');
  });

  it('keeps daily reminders idempotent and review reminders private', () => {
    expect(schedulerSource).toContain("notification_type: 'streak_reminder'");
    expect(schedulerSource).toContain('reminderKind');
    expect(schedulerSource).toContain('idempotency_key: row.idempotency_key');
    expect(schedulerSource).toContain("type: 'streak_reminder'");
    expect(schedulerSource).toContain('get_coach_messages_due');
    expect(schedulerSource).toContain('renderCoachCopy');
    expect(schedulerSource).not.toContain('Daily Check-in Reminder');
    expect(schedulerSource).not.toContain('Quest Awaits');
    expect(schedulerSource).not.toContain('Challenge Ending Soon!');
    expect(schedulerSource).not.toContain('Challenge Expired!');
    expect(schedulerSource).toContain('buildReviewReminderDigests');
    expect(schedulerSource).toContain('review-digest:${digest.reviewerId}');
    expect(schedulerSource).not.toContain('review.submitter_name');
    expect(schedulerSource).not.toContain('review.challenge_title');
  });

  it('keeps notification fallbacks user-facing and delivery-neutral', () => {
    expect(schedulerSource).toContain('Send proof before it ends.');
    expect(schedulerSource).not.toContain('Add proof before it closes.');
    expect(processorSource).toContain('Open Menta to see the update.');
    expect(processorSource).not.toContain('You have a new update.');
  });

  it('cancels streak reminders when pending or approved proof already exists', () => {
    expect(processorSource).toContain('SKIPPED_PROOF_ALREADY_RECORDED');
    expect(processorSource).toContain(".in('status', ['pending', 'approved'])");
    expect(processorSource).toContain(
      "record.notification_type !== 'streak_reminder'"
    );
  });

  it('keeps EAS notification config wired for production push registration', () => {
    const expoConfig = appConfig.expo;
    const easProjectId = expoConfig.extra?.eas?.projectId;

    expect(easProjectId).toBe('');
    expect(expoConfig.updates?.url).toContain(easProjectId);
    expect(expoConfig.android?.permissions).toContain(
      'android.permission.POST_NOTIFICATIONS'
    );
    expect(packageJson.dependencies?.['expo-notifications']).toBe('~57.0.14');
  });

  it('keeps the approved OneSignal production cut-over single-provider and gated', () => {
    const expoConfig = appConfig.expo;
    const productionEnv = easConfig.build?.production?.env;
    const oneSignalPlugin = expoConfig.plugins?.[0];
    const retentionClient = fs.readFileSync(
      path.join(
        process.cwd(),
        'lib/notifications/retention-notification-client.ts'
      ),
      'utf8'
    );

    expect(oneSignalPlugin?.[0]).toBe('onesignal-expo-plugin');
    expect(oneSignalPlugin?.[1]).toMatchObject({
      mode: 'production',
      iPhoneDeploymentTarget: '16.4',
      disableLocation: true,
    });
    expect(expoConfig.ios?.infoPlist?.UIBackgroundModes).toContain(
      'remote-notification'
    );
    expect(expoConfig.ios?.entitlements?.['aps-environment']).toBe(
      'production'
    );
    expect(packageJson.dependencies?.['onesignal-expo-plugin']).toBe('^2.7.1');
    expect(packageJson.dependencies?.['react-native-onesignal']).toBe('^5.5.8');
    expect(expoConfig.extra?.oneSignalAppId).toBeUndefined();
    expect(retentionClient).toContain(
      'const ONESIGNAL_USER_DATA_RELEASE_APPROVED = true'
    );
    expect(productionEnv).toMatchObject({
      EXPO_PUBLIC_RETENTION_NOTIFICATIONS_ENABLED: 'true',
      EXPO_PUBLIC_RETENTION_NOTIFICATION_PROVIDER: 'onesignal',
      EXPO_PUBLIC_ONESIGNAL_USER_DATA_ENABLED: 'true',
    });
    expect(processorSource).toContain("'notification_delivery_policy_v1'");
    expect(processorSource).toContain('resolveNotificationDeliveryProvider');
    expect(processorSource).toContain('sendWithOneSignalCompatibilityFallback');
    expect(processorSource).toContain('buildOneSignalRequest');
    expect(processorSource).not.toContain('NOTIFICATION_DELIVERY_PROVIDER');
  });
});
