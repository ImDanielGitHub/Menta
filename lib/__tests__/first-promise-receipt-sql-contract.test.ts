import fs from 'node:fs';
import path from 'node:path';

const readMigration = () =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260804220956_first_promise_creation_receipt.sql'
    ),
    'utf8'
  );

describe('first-promise receipt SQL contract', () => {
  const migration = readMigration();

  it('enriches the authenticated create receipt without trusting client identity', () => {
    expect(migration).toContain(
      'function public.create_accountability_challenge'
    );
    expect(migration).toContain('v_user_id uuid := auth.uid()');
    expect(migration).not.toContain('p_user_id uuid');
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain('and c.creator_id = v_user_id');
  });

  it('keeps first-promise status stable and serialises competing creates', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain(
      'order by c.created_at asc nulls last, c.id asc'
    );
    expect(migration).toContain("'is_first_promise'");
  });

  it('returns the persisted UTC schedule with its configured grace window', () => {
    expect(migration).toContain("'daily_deadline_hour_utc'");
    expect(migration).toContain("'grace_minutes'");
    expect(migration).toContain("at time zone 'UTC'");
    expect(migration).toContain("'next_due_at'");
    expect(migration).toContain('v_next_due_at > v_challenge.end_date');
    expect(migration).toContain('v_next_due_at := null;');
  });

  it('keeps public and anonymous callers out while preserving service compatibility', () => {
    expect(migration).toContain('from public, anon;');
    expect(migration).toContain(') to authenticated, service_role;');
  });
});
