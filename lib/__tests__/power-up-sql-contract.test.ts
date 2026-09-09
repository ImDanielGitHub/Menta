import fs from 'node:fs';
import path from 'node:path';

const readFile = (workspaceRelativePath: string): string => {
  const absolutePath = path.join(process.cwd(), workspaceRelativePath);
  return fs.readFileSync(absolutePath, 'utf-8');
};

describe('power-up SQL contract', () => {
  const migration = () =>
    readFile(
      'supabase/migrations/20260810003903_make_power_ups_truthful_and_idempotent.sql'
    );

  it('counts every streak-freeze SKU alias used by the app and catalog', () => {
    const sql = migration();

    for (const sku of [
      'streak_freeze',
      'streak_freeze_1',
      'streak_freeze_basic',
      'power_freeze_1',
    ]) {
      expect(sql).toContain(`'${sku}'`);
    }

    expect(sql).toContain('public.is_streak_freeze_sku(normalized_sku)');
  });

  it('does not burn streak-freeze inventory from the manual use RPC', () => {
    const sql = migration();
    const freezeStart = sql.indexOf(
      'if public.is_streak_freeze_sku(normalized_sku) then'
    );
    const freezeEnd = sql.indexOf('if normalized_sku not in (', freezeStart);
    const freezeBranch = sql.slice(freezeStart, freezeEnd);

    expect(freezeStart).toBeGreaterThan(-1);
    expect(freezeEnd).toBeGreaterThan(freezeStart);
    expect(freezeBranch).not.toContain('quantity = quantity - 1');
    expect(freezeBranch).toContain("'auto_consumed', true");
  });

  it('keeps freeze inventory decrements inside the missed-day consumer', () => {
    const freezeConsumerMigration = readFile(
      'supabase/migrations/20260512021026_repair_power_up_sku_contract.sql'
    );
    const hardening = readFile(
      'supabase/migrations/20260512034500_harden_app_store_release_rpcs.sql'
    );
    const consumerBranch = freezeConsumerMigration.match(
      /create or replace function public\.use_streak_freeze_for_user\([\s\S]*?create or replace function public\.use_power_up/i
    );

    expect(consumerBranch).not.toBeNull();
    expect(consumerBranch?.[0] || '').toContain('quantity = quantity - 1');
    expect(hardening).toContain(
      'revoke execute on function public.use_streak_freeze_for_user(uuid, uuid)'
    );
    expect(hardening).toContain(
      'grant execute on function public.use_streak_freeze_for_user(uuid, uuid)'
    );
    expect(hardening).toContain('to service_role');
  });

  it('does not count an automatic freeze as a deadline extension', () => {
    const separation = readFile(
      'supabase/migrations/20260822144200_separate_freeze_and_extension_usage.sql'
    ).toLowerCase();

    expect(separation).toContain(
      'create or replace function public.use_streak_freeze_for_user'
    );
    expect(separation).toContain('quantity = quantity - 1');
    expect(separation).toContain('streak_freezes_remaining = remaining_total');
    expect(separation).not.toContain('used_extensions =');
    expect(separation).toContain('to service_role');
  });

  it('retires inert multipliers without discarding owned quantities', () => {
    const sql = migration();

    for (const sku of [
      'challenge_booster_1',
      'double_momenta_1',
      'double_checkin_1',
      'double_points',
      'double_points_day',
    ]) {
      expect(sql).toContain(`'${sku}'`);
    }

    expect(sql).toContain("'time_extension_1'");
    expect(sql).toContain('quantity = inventory.quantity + excluded.quantity');
    expect(sql).toContain('is_disabled = true');
  });

  it('makes extension use retry-safe and ties the receipt to the signed-in account', () => {
    const sql = migration().toLowerCase();

    expect(sql).toContain('client_event_id uuid');
    expect(sql).toContain('power_up_usage_user_client_event_key');
    expect(sql).toContain('pg_catalog.pg_advisory_xact_lock');
    expect(sql).toContain('return existing_payload');
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain('auth.uid() <> p_user_id');
    expect(sql).toContain('cp.user_id = p_user_id');
    expect(sql).toContain(
      "normalized_sku not in ('time_extension_1', 'booster_extension_12h')"
    );
    expect(sql).toContain('set is_active = false');
    expect(sql).toMatch(
      /insert into public\.power_up_usage[\s\S]*?result_payload[\s\S]*?false,[\s\S]*?result_payload/
    );
  });

  it('treats power-up usage as a read-only receipt for app clients', () => {
    const sql = migration().toLowerCase();

    expect(sql).toContain('create policy power_up_usage_select_own');
    expect(sql).toContain('using (user_id = (select auth.uid()))');
    expect(sql).toContain(
      'revoke all privileges on table public.power_up_usage'
    );
    expect(sql).toContain('from public, anon, authenticated');
    expect(sql).toContain(
      'grant execute on function public.use_power_up(uuid, text, uuid, jsonb, uuid)'
    );
  });
});
