import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260828101526_proof_extension_deadline_authority.sql'
);
const repairMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260828150025_repair_pre_trigger_open_extension_receipts.sql'
);
const legacyCompatibilityMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260828152154_keep_legacy_today_extension_compatible.sql'
);

describe('proof extension deadline SQL contract', () => {
  it('stores a user, challenge, and local-day scoped proof deadline', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

    expect(sql).toContain('obligation_local_day');
    expect(sql).toContain('proof_due_at');
    expect(sql).toContain('effective_timezone');
    expect(sql).toContain('new.user_id');
    expect(sql).toContain('new.challenge_id');
    expect(sql).toContain('pg_catalog.pg_advisory_xact_lock');
    expect(sql).toContain("'time_extension_1'");
    expect(sql).toContain("'booster_extension_12h'");
  });

  it('keeps the extension receipt idempotent and private', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

    expect(sql).toContain('client_event_id');
    expect(sql).toContain('power_up_usage_user_client_event_key');
    expect(sql).toContain('power_up_usage_select_own');
    expect(sql).toContain('grant select on table public.power_up_usage');
    expect(sql).not.toContain('grant insert on table public.power_up_usage');
  });

  it('defers missed-day resolution and accepts proof through the exact deadline', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

    expect(sql).toContain('public.resolve_extension_submission_local_day_v1');
    expect(sql).toContain('extension.proof_due_at > pg_catalog.now()');
    expect(sql).toContain('public.resolve_streak_day_outcomes(');
    expect(sql).toContain('v_extension_through_day');
  });

  it('adds optional extension facts only to the JSON Today home envelope', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

    expect(sql).toContain('public.get_today_home_v1(p_timezone text)');
    expect(sql).toContain("'extension_proof_due_at'");
    expect(sql).toContain("'extension_local_day'");
    expect(sql).not.toContain(
      'create or replace function public.get_today_obligations'
    );
    expect(sql).not.toContain(
      'create or replace function public.get_today_accountability_v2'
    );
  });

  it('repairs only still-open receipts and reverses only the matching false miss', () => {
    expect(fs.existsSync(repairMigrationPath)).toBe(true);
    const sql = fs.readFileSync(repairMigrationPath, 'utf8').toLowerCase();

    expect(sql).toContain('usage.proof_due_at is null');
    expect(sql).toContain('usage.obligation_local_day is null');
    expect(sql).toContain(
      "usage.used_at >= pg_catalog.now() - interval '72 hours'"
    );
    expect(sql).toContain('if v_proof_due_at <= pg_catalog.now()');
    expect(sql).toContain("v_outcome.outcome <> 'missed'");
    expect(sql).toContain('coalesce(v_outcome.freeze_used, false)');
    expect(sql).toContain('current_streak = v_outcome.previous_streak');
    expect(sql).toContain('provider_delivered_at is null');
    expect(sql).toContain('provider_opened_at is null');
    expect(sql).toContain('delete from public.streak_day_outcomes');
    expect(sql).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
    );
  });

  it('keeps the legacy Today RPC compatible without changing its result shape', () => {
    expect(fs.existsSync(legacyCompatibilityMigrationPath)).toBe(true);
    const sql = fs.readFileSync(legacyCompatibilityMigrationPath, 'utf8');
    const normalizedSql = sql.toLowerCase();

    expect(normalizedSql).toContain(
      'create or replace function public.get_today_obligations(p_timezone text)'
    );
    expect(normalizedSql).toContain(
      'from public.get_today_accountability_v2(p_timezone) obligation'
    );
    expect(normalizedSql).toContain(
      'coalesce(extension.obligation_local_day, obligation.local_day)'
    );
    expect(normalizedSql).toContain('usage.proof_due_at > pg_catalog.now()');
    expect(normalizedSql).toContain(
      'outcome.local_day = usage.obligation_local_day'
    );
    expect(normalizedSql).toContain(
      "submission.status in ('pending', 'approved', 'rejected')"
    );
    expect(normalizedSql).toContain(
      'grant execute on function public.get_today_obligations(text)'
    );
    expect(normalizedSql).not.toContain(
      'drop function public.get_today_obligations'
    );
  });
});
