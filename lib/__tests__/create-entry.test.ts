import {
  buildCreateChallengeHref,
  buildCreateGroupHref,
  buildCreateHubHref,
  consumeCreateHubOpen,
  isCreationIntent,
  openCreateHub,
  parseCreateHubFromNormalizedPath,
  queueCreateHubOpen,
  subscribeCreateHubOpen,
} from '@/lib/navigation/create-entry';

describe('create-entry navigation helpers', () => {
  it('builds home create-hub params with optional intent', () => {
    expect(buildCreateHubHref('home_quick_action')).toBe(
      '/(tabs)?openCreateModal=1&createSource=home_quick_action'
    );

    expect(buildCreateHubHref('home_quick_action', 'create_group')).toBe(
      '/(tabs)?openCreateModal=1&createSource=home_quick_action&createIntent=create_group'
    );

    expect(buildCreateHubHref('onboarding', 'create_solo_challenge')).toBe(
      '/(tabs)?openCreateModal=1&createSource=onboarding&createIntent=create_solo_challenge'
    );
  });

  it('builds group and challenge hrefs with canonical params', () => {
    expect(buildCreateGroupHref('create_tab')).toBe(
      '/create-group?createSource=create_tab'
    );
    expect(buildCreateGroupHref('groups_tab')).toBe(
      '/create-group?createSource=groups_tab'
    );
    expect(buildCreateGroupHref('groups_tab', 'move_daily')).toBe(
      '/create-group?createSource=groups_tab&templateId=move_daily'
    );

    expect(
      buildCreateChallengeHref({
        mode: 'solo',
        source: 'home_quick_action',
      })
    ).toBe('/create-challenge?mode=solo&createSource=home_quick_action');

    expect(
      buildCreateChallengeHref({
        mode: 'group',
        groupId: 'group-123',
        source: 'group_detail',
        templateId: 'study_block',
      })
    ).toBe(
      '/create-challenge?mode=group&createSource=group_detail&groupId=group-123&templateId=study_block'
    );
  });

  it('validates supported creation intents', () => {
    expect(isCreationIntent('create_group')).toBe(true);
    expect(isCreationIntent('create_group_challenge')).toBe(true);
    expect(isCreationIntent('create_solo_challenge')).toBe(true);
    expect(isCreationIntent('invite')).toBe(false);
  });

  it('parses create-hub params from normalized tab deep links', () => {
    expect(
      parseCreateHubFromNormalizedPath(
        '/(tabs)?openCreateModal=1&createSource=home_plus'
      )
    ).toEqual({
      openCreateModal: '1',
      createSource: 'home_plus',
    });

    expect(
      parseCreateHubFromNormalizedPath(
        '/(tabs)?openCreateModal=1&createSource=home_plus&createIntent=create_group'
      )
    ).toEqual({
      openCreateModal: '1',
      createSource: 'home_plus',
      createIntent: 'create_group',
    });

    expect(parseCreateHubFromNormalizedPath('/(tabs)')).toBeNull();
    expect(parseCreateHubFromNormalizedPath('/settings')).toBeNull();
  });

  it('queues and consumes create-hub deep link requests', () => {
    queueCreateHubOpen({
      openCreateModal: '1',
      createSource: 'home_plus',
      createIntent: 'create_group',
    });

    expect(consumeCreateHubOpen()).toEqual({
      openCreateModal: '1',
      createSource: 'home_plus',
      createIntent: 'create_group',
    });
    expect(consumeCreateHubOpen()).toBeNull();
  });

  it('opens the hub in place when the tab shell is already mounted', () => {
    const router = { push: jest.fn() };
    const received: unknown[] = [];
    const unsubscribe = subscribeCreateHubOpen(() => {
      received.push(consumeCreateHubOpen());
    });

    openCreateHub({
      router,
      source: 'home_quick_action',
      intent: 'create_solo_challenge',
    });

    expect(received).toEqual([
      {
        openCreateModal: '1',
        createSource: 'home_quick_action',
        createIntent: 'create_solo_challenge',
      },
    ]);
    expect(router.push).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('falls back to tab navigation when no hub listener is mounted', () => {
    const router = { push: jest.fn() };

    openCreateHub({ router, source: 'home_plus' });

    expect(router.push).toHaveBeenCalledWith(
      '/(tabs)?openCreateModal=1&createSource=home_plus'
    );
    expect(consumeCreateHubOpen()).toEqual({
      openCreateModal: '1',
      createSource: 'home_plus',
    });
  });
});
