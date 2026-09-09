import {
  filterSupportedCatalogItems,
  formatStreakUnlockCopy,
  getAvatarFrameAppearance,
  getEquipCategoryForCatalogItem,
  getThemeAppearance,
  getUnlockStreakDays,
  isSupportedCatalogItem,
  isSupportedCatalogSku,
  NEW_THEME_SKUS,
} from '@/lib/shop/catalogSupport';
import {
  getPowerUpDisplayCopy,
  powerUpIsAutoConsumed,
  powerUpRequiresChallengeId,
} from '@/lib/shop/powerUpSupport';

describe('catalog support registry', () => {
  const item = {
    id: 'item-1',
    sku: 'streak_freeze_basic',
    category: 'powerup',
    name: 'Streak Freeze',
    description: 'Protect one missed day',
    cost: 150,
    is_disabled: false,
  };

  it('keeps supported boosts visible', () => {
    expect(isSupportedCatalogSku('streak_freeze_basic')).toBe(true);
    expect(isSupportedCatalogItem(item)).toBe(true);
  });

  it('models freezes as automatic and extensions as challenge-scoped', () => {
    expect(powerUpIsAutoConsumed('streak_freeze_basic')).toBe(true);
    expect(powerUpRequiresChallengeId('streak_freeze_basic')).toBe(false);
    expect(powerUpRequiresChallengeId('time_extension_1')).toBe(true);
    expect(isSupportedCatalogSku('double_points_day')).toBe(false);
  });

  it('uses plain display copy that explains when each boost is consumed', () => {
    expect(getPowerUpDisplayCopy('streak_freeze_basic')).toMatchObject({
      label: 'Streak Freeze',
      description: 'Covers your next eligible missed day automatically.',
    });
    expect(getPowerUpDisplayCopy('time_extension_1')).toMatchObject({
      label: '12-hour Extension',
      useSummary:
        'Choose an active promise. One extension is used immediately.',
    });
  });

  it('keeps supported appearance items visible and maps equip category', () => {
    const themeItem = {
      ...item,
      id: 'theme-1',
      sku: 'profile_theme_ember',
      category: 'cosmetic',
      name: 'Ember Theme',
    };

    expect(isSupportedCatalogItem(themeItem)).toBe(true);
    expect(getEquipCategoryForCatalogItem(themeItem)).toBe('theme');
    expect(
      isSupportedCatalogItem({
        ...themeItem,
        id: 'frame-1',
        sku: 'avatar_frame_ice',
        name: 'Ice Frame',
      })
    ).toBe(true);
    expect(
      getEquipCategoryForCatalogItem({
        ...themeItem,
        sku: 'avatar_frame_week',
      })
    ).toBe('avatar_frame');
  });

  it('registers ten new themes with palettes distinct from Ember', () => {
    const ember = getThemeAppearance('profile_theme_ember');
    expect(ember).not.toBeNull();

    const primaries = NEW_THEME_SKUS.map(sku => {
      const theme = getThemeAppearance(sku);
      expect(theme).not.toBeNull();
      expect(theme?.primary).not.toBe(ember?.primary);
      expect(theme?.backgroundSecondary).not.toBe(ember?.backgroundSecondary);
      expect(theme?.surfacePrimary).not.toBe(ember?.surfacePrimary);
      return theme!.primary;
    });

    expect(new Set(primaries).size).toBe(NEW_THEME_SKUS.length);
  });

  it('keeps Momenta frames buyable and streak frames milestone-gated', () => {
    expect(getUnlockStreakDays('avatar_gold_frame')).toBeNull();
    expect(getUnlockStreakDays('avatar_frame_ice')).toBeNull();
    expect(getUnlockStreakDays('avatar_frame_spark')).toBe(3);
    expect(getUnlockStreakDays('avatar_frame_week')).toBe(7);
    expect(getUnlockStreakDays('avatar_frame_fortnight')).toBe(14);
    expect(getUnlockStreakDays('avatar_frame_month')).toBe(30);
    expect(getUnlockStreakDays('avatar_frame_season')).toBe(90);
    expect(getUnlockStreakDays('profile_theme_glacier')).toBe(3);
    expect(getUnlockStreakDays('profile_theme_aurora')).toBe(7);
    expect(getUnlockStreakDays('profile_theme_iris')).toBe(14);
    expect(
      getAvatarFrameAppearance('avatar_frame_season')?.gradientColors
    ).toEqual(['#5EEAD4', '#818CF8', '#E879F9']);
    expect(formatStreakUnlockCopy(7)).toBe('Unlocks after a 7-day streak');
  });

  it('prefers the catalogue unlock threshold when both sources are present', () => {
    expect(getUnlockStreakDays('avatar_frame_spark', 14)).toBe(14);
    expect(getUnlockStreakDays('avatar_gold_frame', 0)).toBeNull();
  });

  it('filters disabled and unsupported catalog rows out of production lists', () => {
    const rows = [
      item,
      {
        ...item,
        id: 'future-1',
        sku: 'future_banner',
        category: 'cosmetic',
        name: 'Future Banner',
      },
      {
        ...item,
        id: 'disabled-1',
        sku: 'double_points_day',
        name: 'Double Points',
        is_disabled: true,
      },
    ];

    expect(filterSupportedCatalogItems(rows).map(row => row.sku)).toEqual([
      'streak_freeze_basic',
    ]);
  });
});
