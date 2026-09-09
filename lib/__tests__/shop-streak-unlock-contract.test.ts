import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260815120000_shop_themes_frames_streak_unlocks.sql'
);

describe('shop theme and streak-unlock SQL contract', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  it('adds an unlock threshold on catalogue rows and reuses streak unlock receipts', () => {
    expect(sql).toContain('add column if not exists unlock_streak_days');
    expect(sql).toContain('catalog_items_unlock_streak_days_check');
    expect(sql).toContain(
      'create table if not exists public.streak_unlock_receipts'
    );
    expect(sql).not.toContain(
      'drop table if exists public.streak_unlock_receipts'
    );
  });

  it('seeds ten new themes and both Momenta and streak frames', () => {
    expect(sql).toContain("'profile_theme_glacier'");
    expect(sql).toContain("'profile_theme_aurora'");
    expect(sql).toContain("'profile_theme_iris'");
    expect(sql).toContain("'profile_theme_cobalt'");
    expect(sql).toContain("'profile_theme_jade'");
    expect(sql).toContain("'profile_theme_orchid'");
    expect(sql).toContain("'profile_theme_horizon'");
    expect(sql).toContain("'profile_theme_graphite'");
    expect(sql).toContain("'profile_theme_neon'");
    expect(sql).toContain("'profile_theme_tidepool'");
    expect(sql).toContain("'avatar_gold_frame'");
    expect(sql).toContain("'avatar_frame_ice'");
    expect(sql).toContain("'avatar_frame_spark'");
    expect(sql).toContain("'avatar_frame_season'");
  });

  it('grants streak cosmetics without replacing economy freeze grants', () => {
    expect(sql).toContain(
      'create or replace function private.grant_account_streak_shop_unlocks_v1'
    );
    expect(sql).not.toContain(
      'create or replace function private.grant_account_streak_unlocks_v1'
    );
    expect(sql).toContain('item.unlock_streak_days <= v_qualifying');
    expect(sql).toContain(
      'insert into public.purchases (user_id, item_id, purchased_at)'
    );
    expect(sql).toContain(
      'create or replace function public.claim_streak_shop_unlocks()'
    );
    expect(sql).toContain(
      'grant execute on function public.claim_streak_shop_unlocks()'
    );
    expect(sql).toContain(
      'perform private.grant_account_streak_shop_unlocks_v1(auth.uid())'
    );
    expect(sql).not.toContain('profile.current_streak');
    expect(sql).not.toContain('profile.longest_streak');
    expect(sql).toContain(
      'create trigger challenge_participants_streak_shop_unlocks_v1'
    );
  });

  it('rejects Momenta purchases of streak-only items', () => {
    expect(sql).toContain("'error', 'streak_unlock_only'");
    expect(sql).toContain('if v_unlock_streak_days is not null then');
  });
});
