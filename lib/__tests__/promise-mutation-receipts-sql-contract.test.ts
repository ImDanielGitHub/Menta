import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260901103000_promise_mutation_receipts_v2.sql'
  ),
  'utf8'
);

describe('promise mutation receipt SQL authority', () => {
  it('keeps receipts private, actor-scoped, and idempotent', () => {
    expect(sql).toContain('primary key (actor_id, client_event_id)');
    expect(sql).toContain(
      'alter table private.promise_mutation_receipts_v1 force row level security'
    );
    expect(sql).toContain(
      'revoke all privileges on table private.promise_mutation_receipts_v1'
    );
    expect(sql).toContain("v_existing.operation <> 'leave'");
    expect(sql).toContain("v_existing.operation <> 'delete'");
    expect(sql).toContain("'IDEMPOTENCY_KEY_REUSED'");
  });

  it('makes status checks read-only and the only safe-retry gate', () => {
    const checkOnly = sql.indexOf('if coalesce(p_check_only, false) then');
    const leaveDelete = sql.indexOf(
      'delete from private.promise_accountability_members member'
    );
    const challengeDelete = sql.indexOf(
      'delete from public.challenges challenge'
    );
    expect(checkOnly).toBeGreaterThan(-1);
    expect(leaveDelete).toBeGreaterThan(checkOnly);
    expect(challengeDelete).toBeGreaterThan(checkOnly);
    expect(sql).toContain("'LEAVE_NOT_APPLIED'");
    expect(sql).toContain("'DELETE_NOT_APPLIED'");
    expect(sql).toContain("'safe_to_retry', p_safe_to_retry");
  });

  it('deletes the promise and writes its receipt in one database transaction', () => {
    expect(sql).toMatch(/^begin;/m);
    expect(sql).toMatch(/commit;\s*$/m);
    expect(sql).toContain('delete from public.power_up_usage usage');
    expect(sql).toContain('delete from public.invite_codes invite');
    expect(sql).toContain('delete from public.challenges challenge');
    expect(sql).toContain('private.record_promise_mutation_result_v1');
  });
});
