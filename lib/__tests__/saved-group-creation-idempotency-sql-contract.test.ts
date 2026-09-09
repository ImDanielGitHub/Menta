import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260831220000_saved_group_creation_idempotency_v3.sql'
);
const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

const functionBody = (name: string, nextName: string): string => {
  const start = sql.indexOf(`create or replace function ${name}`);
  const end = sql.indexOf(`create or replace function ${nextName}`, start + 1);
  if (start < 0 || end < 0) throw new Error(`Missing SQL function ${name}`);
  return sql.slice(start, end);
};

const createV3 = functionBody(
  'public.create_accountability_group_v3',
  'public.read_saved_group_creation_status_v1'
);
const statusV1 = functionBody(
  'public.read_saved_group_creation_status_v1',
  'public.create_accountability_group_v2'
);

describe('saved group creation v3 SQL authority', () => {
  it('binds one event receipt to the authenticated actor and server hash', () => {
    expect(sql).toContain('private.saved_group_creation_receipts');
    expect(sql).toContain('unique (actor_id, client_event_id)');
    expect(sql).toContain(
      "request_hash text not null check (request_hash ~ '^[a-f0-9]{32}$')"
    );
    expect(createV3).toContain('v_actor_id uuid := auth.uid()');
    expect(createV3).not.toContain('p_user_id');
    expect(createV3.slice(0, createV3.indexOf('returns jsonb'))).not.toContain(
      'p_cost'
    );
    expect(createV3).toContain('v_request_hash := pg_catalog.md5(');
  });

  it('returns in-progress for concurrent use of the same event ID', () => {
    expect(createV3).toContain('pg_catalog.pg_try_advisory_xact_lock(');
    expect(createV3).toContain("'saved-group-create-event:'");
    expect(createV3).toContain("'request_in_progress'");
    expect(createV3).toContain("v_existing.state = 'confirmed'");
    expect(createV3).toContain("'group_creation_replayed'");
  });

  it('rejects the same event ID with a different request', () => {
    expect(createV3).toContain(
      'if v_existing.request_hash <> v_request_hash then'
    );
    expect(createV3).toContain("'idempotency_mismatch'");
  });

  it('deduplicates two event IDs for one active logical saved group', () => {
    expect(createV3).toContain("'saved-group-create-request:'");
    expect(createV3).toContain('receipt.request_hash = v_request_hash');
    expect(createV3).toContain("receipt.state = 'confirmed'");
    expect(createV3).toContain("team.kind = 'saved'");
    expect(createV3).toContain('v_canonical.canonical_client_event_id');
  });

  it('serialises account pricing and persists the receipt before returning', () => {
    expect(createV3).toContain("'saved-group-create-account:'");
    expect(createV3).toContain('public.create_group_with_payment(');
    expect(createV3).toContain("kind = 'saved'");
    expect(createV3).toContain("state = 'confirmed'");
    expect(createV3.indexOf("state = 'confirmed'")).toBeLessThan(
      createV3.lastIndexOf('return v_response;')
    );
  });

  it('persists definitive balance, quota, and cooldown outcomes', () => {
    for (const code of [
      'insufficient_balance',
      'quota_active_groups',
      'quota_groups_month',
      'group_creation_cooldown',
    ]) {
      expect(createV3).toContain(`'${code}'`);
    }
    expect(createV3).toContain('team.cooldown_until > now()');
    expect(createV3).toContain("team.kind = 'saved'");
    expect(createV3).toContain("set state = 'failed'");
  });

  it('keeps promise containers outside saved-group cost and quotas', () => {
    expect(sql).toContain(
      'create or replace function private.economy_active_group_count_v1'
    );
    expect(sql).toContain(
      'create or replace function private.economy_action_cost_v1'
    );
    expect(sql).toContain(
      'create or replace function private.economy_quota_error_v1'
    );
    expect(sql.match(/team\.kind = 'saved'/g)?.length).toBeGreaterThanOrEqual(
      7
    );
  });

  it('provides status-only timeout reconciliation and a safe retry receipt', () => {
    expect(statusV1).toContain("'saved_group_create_status'");
    expect(statusV1).toContain("'receipt_found'");
    expect(statusV1).toContain("'no_receipt'");
    expect(statusV1).toContain("'safe_to_retry', true");
    expect(statusV1).not.toContain('public.create_group_with_payment(');
  });

  it('routes installed-client v2 retries through the idempotent authority', () => {
    const v2 = sql.slice(
      sql.indexOf(
        'create or replace function public.create_accountability_group_v2'
      )
    );
    expect(v2).toContain('public.create_accountability_group_v3(');
    expect(v2).toContain('pg_catalog.gen_random_uuid()');
    expect(v2).toContain("'idempotent'");
  });

  it('keeps receipt tables private and grants only the RPCs', () => {
    expect(sql).toContain(
      'revoke all on table private.saved_group_creation_receipts'
    );
    expect(sql).toContain(
      'alter table private.saved_group_creation_receipts force row level security'
    );
    expect(sql).toContain(
      'grant execute on function public.create_accountability_group_v3('
    );
    expect(sql).toContain(
      'grant execute on function public.read_saved_group_creation_status_v1(uuid)'
    );
  });
});
