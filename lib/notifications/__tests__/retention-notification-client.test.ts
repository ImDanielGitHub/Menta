import {
  RetentionNotificationClient,
  sanitizeRetentionEventProperties,
  sanitizeRetentionInAppState,
  selectRetentionNotificationProvider,
  type RetentionNotificationProvider,
} from '@/lib/notifications/retention-notification-client';

const makeProvider = (): jest.Mocked<RetentionNotificationProvider> => ({
  configured: true,
  name: 'test-provider',
  initialize: jest.fn().mockResolvedValue(undefined),
  bindExternalUser: jest.fn().mockResolvedValue(undefined),
  removeInAppTriggers: jest.fn().mockResolvedValue(undefined),
  recordEvent: jest.fn().mockResolvedValue(undefined),
  requestPushPermission: jest.fn().mockResolvedValue(true),
  subscribePermissionChanges: jest.fn(() => () => undefined),
  syncAudienceTags: jest.fn().mockResolvedValue(undefined),
  syncEmailSubscription: jest.fn().mockResolvedValue(undefined),
  syncInAppTriggers: jest.fn().mockResolvedValue(undefined),
  unbindExternalUser: jest.fn().mockResolvedValue(undefined),
});

describe('retention notification client', () => {
  it('selects no provider when the feature is off or its adapter is absent', () => {
    const provider = makeProvider();

    expect(
      selectRetentionNotificationProvider({
        enabled: false,
        providerName: 'test',
        providers: { test: provider },
      }).configured
    ).toBe(false);
    expect(
      selectRetentionNotificationProvider({
        enabled: true,
        providerName: 'missing',
        providers: { test: provider },
      }).configured
    ).toBe(false);
  });

  it('binds only an explicitly confirmed database profile', async () => {
    const provider = makeProvider();
    const client = new RetentionNotificationClient(provider);

    await expect(
      client.bindConfirmedProfile({
        userId: 'user-1',
        profileConfirmed: false,
      } as unknown as Parameters<
        RetentionNotificationClient['bindConfirmedProfile']
      >[0])
    ).resolves.toBe(false);
    expect(provider.bindExternalUser).not.toHaveBeenCalled();

    await expect(
      client.bindConfirmedProfile({
        userId: 'user-1',
        profileConfirmed: true,
      })
    ).resolves.toBe(true);
    expect(provider.bindExternalUser).toHaveBeenCalledWith('user-1');
  });

  it('serialises account switches and removes a stale in-flight bind', async () => {
    const provider = makeProvider();
    let releaseFirstBind: (() => void) | undefined;
    provider.bindExternalUser
      .mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            releaseFirstBind = resolve;
          })
      )
      .mockResolvedValueOnce(undefined);
    const client = new RetentionNotificationClient(provider);

    const first = client.bindConfirmedProfile({
      userId: 'user-a',
      profileConfirmed: true,
    });
    await Promise.resolve();
    const second = client.bindConfirmedProfile({
      userId: 'user-b',
      profileConfirmed: true,
    });
    releaseFirstBind?.();

    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);
    expect(provider.bindExternalUser.mock.calls).toEqual([
      ['user-a'],
      ['user-b'],
    ]);
    expect(provider.unbindExternalUser).toHaveBeenCalledTimes(1);
  });

  it('does not let an old-account teardown unbind the current account', async () => {
    const provider = makeProvider();
    const client = new RetentionNotificationClient(provider);

    await client.bindConfirmedProfile({
      userId: 'user-b',
      profileConfirmed: true,
    });

    await expect(client.unbindAccount('user-a')).resolves.toBe(false);
    expect(provider.unbindExternalUser).not.toHaveBeenCalled();
  });

  it('sends only allowlisted event names and bounded non-identifying properties', async () => {
    const provider = makeProvider();
    const client = new RetentionNotificationClient(provider);
    await client.bindConfirmedProfile({
      userId: 'user-1',
      profileConfirmed: true,
    });

    await expect(
      client.recordEvent('proof_submitted', {
        source: 'today',
        has_active_promise: true,
        days_since_activity: 2,
        email: 'private@example.com',
        user_id: 'user-1',
      })
    ).resolves.toBe(true);
    await expect(
      client.recordEvent('arbitrary_event', { source: 'today' })
    ).resolves.toBe(false);

    expect(provider.recordEvent).toHaveBeenCalledWith('proof_submitted', {
      source: 'today',
      has_active_promise: true,
      days_since_activity: 2,
    });
    expect(provider.recordEvent).toHaveBeenCalledTimes(1);
  });

  it('sends only owned in-app trigger keys after profile binding', async () => {
    const provider = makeProvider();
    const client = new RetentionNotificationClient(provider);

    await expect(client.syncInAppState({ app_surface: 'today' })).resolves.toBe(
      false
    );
    await client.bindConfirmedProfile({
      userId: 'user-1',
      profileConfirmed: true,
    });
    await expect(
      client.syncInAppState({
        app_surface: 'today',
        has_active_promise: true,
        streak_state: 'at_risk',
        group_id: 'private-group',
        message: 'free text',
      })
    ).resolves.toBe(true);

    expect(provider.syncInAppTriggers).toHaveBeenCalledWith({
      app_surface: 'today',
      has_active_promise: 'true',
      streak_state: 'at_risk',
    });
  });

  it('owns permission prompting, audience tags, and email only after binding', async () => {
    const provider = makeProvider();
    const client = new RetentionNotificationClient(provider);

    await expect(client.requestPushPermission()).resolves.toBeNull();
    await expect(
      client.syncEmailSubscription('person@example.com', true)
    ).resolves.toBe(false);

    await client.bindConfirmedProfile({
      userId: 'user-1',
      profileConfirmed: true,
    });
    await expect(client.requestPushPermission()).resolves.toBe(true);
    await expect(
      client.syncEmailSubscription('Person@Example.com', true)
    ).resolves.toBe(true);
    await expect(
      client.syncEmailSubscription('not-an-email', true)
    ).resolves.toBe(false);
    await expect(
      client.syncAudienceTags({
        marketing_email_opt_in: true,
        notification_permission: 'granted',
        private_text: 'drop me',
      })
    ).resolves.toBe(true);
    await expect(
      client.clearInAppState(['notification_prompt_context'])
    ).resolves.toBe(true);

    expect(provider.requestPushPermission).toHaveBeenCalledWith(true);
    expect(provider.syncEmailSubscription).toHaveBeenCalledWith(
      'person@example.com',
      true
    );
    expect(provider.syncAudienceTags).toHaveBeenCalledWith({
      marketing_email_opt_in: true,
      notification_permission: 'granted',
    });
    expect(provider.removeInAppTriggers).toHaveBeenCalledWith([
      'notification_prompt_context',
    ]);
  });
});

describe('retention property allowlist', () => {
  it('drops free text, identifiers, invalid enums, and unbounded numbers', () => {
    expect(
      sanitizeRetentionEventProperties({
        source: 'marketing-import',
        permission_status: 'prompt',
        notification_type: '../external',
        days_since_activity: 400,
        is_pro: true,
        username: 'Daniel',
      })
    ).toEqual({ is_pro: true });
  });

  it('converts only bounded in-app state to string triggers', () => {
    expect(
      sanitizeRetentionInAppState({
        app_surface: 'today',
        has_active_promise: false,
        is_pro: true,
        notification_permission_status: 'denied',
        notification_prompt_context: 'first_promise',
        streak_state: 'missed',
        user_id: 'user-1',
        challenge_id: 'challenge-1',
        free_text: 'do not send',
      })
    ).toEqual({
      app_surface: 'today',
      has_active_promise: 'false',
      is_pro: 'true',
      notification_permission_status: 'denied',
      notification_prompt_context: 'first_promise',
      streak_state: 'missed',
    });
  });
});
