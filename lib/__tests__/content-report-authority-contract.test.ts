import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260813150000_content_report_authority_v1.sql'
  ),
  'utf8'
);

describe('content report authority migration', () => {
  it('keeps the RPC authoritative while preserving build 117 own-row inserts', () => {
    expect(migration).toContain(
      'revoke all privileges on table public.content_reports\n  from public, anon, authenticated;'
    );
    expect(migration).toContain(
      'grant select on table public.content_reports to authenticated;'
    );
    expect(migration).toContain(
      'drop policy if exists content_reports_insert_own\n  on public.content_reports;'
    );
    expect(migration).toContain(
      'create or replace function public.submit_content_report_v1('
    );
    expect(migration).toContain(
      'create policy content_reports_insert_own\non public.content_reports\nfor insert\nto authenticated\nwith check (reporter_id = (select auth.uid()));'
    );
    expect(migration).toContain(
      'grant insert (\n  reporter_id,\n  target_type,\n  target_id,\n  reason,\n  notes\n) on table public.content_reports to authenticated;'
    );
    expect(migration).toContain('p_expected_reporter_id uuid');
    expect(migration).toContain('p_client_event_id uuid');
    expect(migration).toContain(
      ') from public, anon, authenticated;\ngrant execute on function public.submit_content_report_v1('
    );
  });

  it('binds immutable replay facts to reporter and client event ID', () => {
    expect(migration).toContain('primary key (reporter_id, client_event_id)');
    expect(migration).toContain(
      "v_reporter_id::text || ':' || p_client_event_id::text"
    );
    expect(migration).toContain("'code', 'REQUEST_FACT_MISMATCH'");
    expect(migration).toContain("'reporter_id', v_reporter_id");
    expect(migration).toContain("'client_event_id', p_client_event_id");
    expect(migration).toContain("'facts', p_facts");
  });

  it('checks that the account can see the exact target before inserting', () => {
    expect(migration).toContain('from public.challenge_submissions submission');
    expect(migration).toContain('from public.challenges challenge');
    expect(migration).toContain('from public.teams target_group');
    expect(migration).toContain('from public.profiles target_profile');
    expect(migration).toContain("'code', 'TARGET_NOT_AVAILABLE'");
    expect(migration).toContain('or not coalesce(v_target_facts_match, false)');
  });

  it('keeps blocking dormant while preserving blocker-owned build 117 writes', () => {
    expect(migration).toContain(
      'revoke all privileges on table public.blocked_users\n  from public, anon, authenticated;'
    );
    expect(migration).toContain(
      'create policy blocked_users_insert_own\non public.blocked_users\nfor insert\nto authenticated\nwith check (blocker_id = (select auth.uid()));'
    );
    expect(migration).toContain(
      'create policy blocked_users_delete_own\non public.blocked_users\nfor delete\nto authenticated\nusing (blocker_id = (select auth.uid()));'
    );
    expect(migration).toContain(
      'grant select, delete on table public.blocked_users to authenticated;'
    );
    expect(migration).toContain(
      'grant insert (\n  blocker_id,\n  blocked_user_id,\n  reason\n) on table public.blocked_users to authenticated;'
    );
    expect(migration).toContain(
      'create or replace function public.block_user_v1('
    );
    expect(migration).toContain(
      'on conflict (blocker_id, blocked_user_id) do nothing'
    );
    expect(migration).not.toContain(
      'grant update on table public.blocked_users to authenticated'
    );
  });
});
