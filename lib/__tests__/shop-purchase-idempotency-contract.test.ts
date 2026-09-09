import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260810014142_make_shop_purchases_idempotent.sql'
);
const repairMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260810015114_repair_shop_purchase_coalesce.sql'
);

describe('shop purchase idempotency SQL contract', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();
  const repairSql = fs.readFileSync(repairMigrationPath, 'utf8').toLowerCase();

  it('repairs the invalid schema-qualified coalesce expression', () => {
    expect(repairSql).toContain(
      "'public.purchase_shop_item(uuid,uuid,uuid)'::regprocedure"
    );
    expect(repairSql).toContain(
      "'public.purchase_shop_item(uuid,text)'::regprocedure"
    );
    expect(repairSql).toContain("'pg_catalog.coalesce'");
    expect(repairSql).toContain("'coalesce'");
    expect(repairSql).toContain('pg_catalog.pg_get_functiondef');
    expect(repairSql).toContain('shop_purchase_coalesce_repair_failed');
  });

  it('requires a client event ID on the canonical purchase overload', () => {
    expect(sql).toContain(
      'create or replace function public.purchase_shop_item(\n  p_user_id uuid,\n  p_item_id uuid,\n  p_client_event_id uuid\n)'
    );
    expect(sql).not.toContain('p_client_event_id uuid default');
    expect(sql).toContain('or p_client_event_id is null');
    expect(sql).toContain("'client_event_id', p_client_event_id");
  });

  it('serialises one account and replays only matching request facts', () => {
    const lockPosition = sql.indexOf('pg_catalog.pg_advisory_xact_lock');
    const replayPosition = sql.indexOf('return v_existing_payload');
    const debitPosition = sql.indexOf('update public.profiles profile');

    expect(lockPosition).toBeGreaterThan(-1);
    expect(sql).toContain('pg_catalog.hashtextextended(p_user_id::text, 0)');
    expect(sql).toContain('primary key (user_id, client_event_id)');
    expect(sql).toContain('receipt.client_event_id = p_client_event_id');
    expect(sql).toContain('v_existing_item_id <> p_item_id');
    expect(sql).toContain("'error', 'request_fact_mismatch'");
    expect(replayPosition).toBeGreaterThan(lockPosition);
    expect(debitPosition).toBeGreaterThan(replayPosition);
  });

  it('stores the exact atomic balance and inventory receipt', () => {
    expect(sql).toContain('insert into public.purchases');
    expect(sql).toContain('insert into public.wallet_transactions');
    expect(sql).toContain('insert into public.inventory_items as inventory');
    expect(sql).toContain('on conflict (user_id, item_sku)');
    expect(sql).toContain('returning inventory.quantity into v_quantity');
    expect(sql).toContain("'new_balance', v_new_balance");
    expect(sql).toContain("'quantity', v_quantity");
    expect(sql).toContain('result_payload,');
    expect(sql).toContain('v_result_payload,');
    expect(sql).toContain(
      "'shop_purchase:' || p_user_id::text || ':' || p_client_event_id::text"
    );
  });

  it('keeps receipts account-owned and read-only for app clients', () => {
    expect(sql).toContain(
      'alter table public.shop_purchase_receipts enable row level security'
    );
    expect(sql).toContain('create policy shop_purchase_receipts_select_own');
    expect(sql).toContain('using (user_id = (select auth.uid()))');
    expect(sql).toContain(
      'revoke all privileges on table public.shop_purchase_receipts'
    );
    expect(sql).toContain('from public, anon, authenticated');
    expect(sql).toContain(
      'grant select on table public.shop_purchase_receipts to authenticated'
    );
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain('auth.uid() <> p_user_id');
    expect(sql).toContain(
      'revoke execute on function public.purchase_shop_item(uuid, uuid, uuid)'
    );
    expect(sql).toContain(
      'grant execute on function public.purchase_shop_item(uuid, uuid, uuid)'
    );
  });

  it('preserves installed-client overloads while the new app uses the keyed RPC', () => {
    expect(sql).toContain(
      'create or replace function public.purchase_shop_item(\n  p_user_id uuid,\n  p_item_id uuid\n)'
    );
    expect(sql).toContain(
      'create or replace function public.purchase_shop_item(\n  p_user_id uuid,\n  p_item_sku text\n)'
    );
    expect(sql.match(/pg_catalog\.gen_random_uuid\(\)/g)).toHaveLength(2);
    expect(sql).toContain(
      'grant execute on function public.purchase_shop_item(uuid, uuid)'
    );
    expect(sql).toContain(
      'grant execute on function public.purchase_shop_item(uuid, text)'
    );
  });
});
