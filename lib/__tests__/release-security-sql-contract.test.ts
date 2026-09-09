import fs from 'node:fs';
import path from 'node:path';

const readFile = (workspaceRelativePath: string): string => {
  const absolutePath = path.join(process.cwd(), workspaceRelativePath);
  return fs.readFileSync(absolutePath, 'utf-8');
};

describe('release security SQL contract', () => {
  const migration = () =>
    readFile(
      'supabase/migrations/20260512034500_harden_app_store_release_rpcs.sql'
    );
  const appStoreSafetyMigration = () =>
    readFile(
      'supabase/migrations/20260513090000_app_store_readiness_account_safety.sql'
    ).toLowerCase();
  const securityDefinerHelperMigration = () =>
    readFile(
      'supabase/migrations/20260601110000_revoke_public_security_definer_helpers.sql'
    ).toLowerCase();
  const processGroupFailuresMigration = () =>
    readFile(
      'supabase/migrations/20260601113000_restrict_process_group_failures_rpc.sql'
    ).toLowerCase();

  it('keeps user-scoped notification and submission RPCs limited to auth.uid()', () => {
    const sql = migration();

    for (const functionName of [
      'get_notification_preferences',
      'has_submitted_today',
      'get_todays_submission_status',
    ]) {
      const start = sql.indexOf(
        `function public.${functionName}(`.toLowerCase()
      );
      expect(start).toBeGreaterThanOrEqual(0);

      const nextFunction = sql.indexOf('create or replace function', start + 1);
      const body = sql.slice(
        start,
        nextFunction > -1 ? nextFunction : sql.length
      );

      expect(body).toContain('auth.uid() is null or auth.uid() <> p_user_id');
      expect(body).toContain("errcode = '42501'");
    }
  });

  it('does not grant direct streak-freeze helper execution to normal clients', () => {
    const sql = migration();

    expect(sql).toContain(
      'revoke execute on function public.use_streak_freeze_for_user(uuid, uuid)'
    );
    expect(sql).toContain(
      'grant execute on function public.use_streak_freeze_for_user(uuid, uuid)\n  to service_role'
    );
    expect(sql).not.toContain(
      'grant execute on function public.use_streak_freeze_for_user(uuid, uuid)\n  to authenticated'
    );
  });

  it('adds user blocking with user-scoped RLS policies', () => {
    const sql = appStoreSafetyMigration();

    expect(sql).toContain('create table if not exists public.blocked_users');
    expect(sql).toContain(
      'alter table public.blocked_users enable row level security'
    );
    expect(sql).toContain('with check ((select auth.uid()) = blocker_id)');
    expect(sql).toContain('using ((select auth.uid()) = blocker_id)');
    expect(sql).toContain('constraint blocked_users_no_self_block');
  });

  it('removes anonymous execution from high-risk security definer helpers', () => {
    const sql = appStoreSafetyMigration();

    for (const snippet of [
      'revoke execute on function public.claim_momenta_reward(uuid, text, uuid)',
      'revoke execute on function public.equip_owned_item(uuid, uuid, text)',
      'revoke execute on function public.get_submit_reminders_due()',
      'revoke execute on function public.reset_missed_streaks()',
      'revoke execute on function public.unequip_item(uuid, text)',
    ]) {
      expect(sql).toContain(snippet);
    }
    expect(sql).toContain('from public, anon');
  });

  it('keeps maintenance-only RPCs service-role scoped', () => {
    const sql = securityDefinerHelperMigration();
    const followUpSql = processGroupFailuresMigration();
    const groupStore = readFile('store/group-store.ts');

    for (const snippet of [
      'revoke execute on function public.get_submit_reminders_due()',
      'revoke execute on function public.reset_missed_streaks()',
      'revoke execute on function public.process_group_failures_enhanced()',
      'from public, anon, authenticated',
      'to service_role',
    ]) {
      expect(sql).toContain(snippet);
    }

    expect(followUpSql).toContain(
      'revoke execute on function public.process_group_failures_enhanced()'
    );
    expect(followUpSql).toContain('from public, anon, authenticated');
    expect(followUpSql).toContain('to service_role');
    expect(groupStore).not.toContain('process_group_failures_enhanced');
    expect(groupStore).not.toContain('processGroupFailures');
  });

  it('prevents direct client mutation of challenge submissions', () => {
    const sql = appStoreSafetyMigration();

    expect(sql).toContain(
      'revoke all on table public.challenge_submissions from authenticated'
    );
    expect(sql).toContain(
      'revoke all on table public.challenge_submissions from anon'
    );
    expect(sql).toContain(
      'grant select on table public.challenge_submissions to authenticated'
    );
  });

  it('uses the guarded service-role deletion function instead of direct profile mutation', () => {
    const clientHelper = readFile('lib/account-deletion.ts');
    const deleteFunction = readFile(
      'supabase/functions/delete-my-account/index.ts'
    );
    const mediaPaths = readFile(
      'supabase/functions/delete-my-account/media-paths.ts'
    );

    expect(clientHelper).toContain(
      "supabase.functions.invoke('delete-my-account'"
    );
    expect(clientHelper).not.toContain("rpc('delete_my_account')");
    expect(deleteFunction).toContain('auth.admin.deleteUser');
    expect(deleteFunction).toContain("rpc('prepare_account_deletion_v1'");
    expect(deleteFunction).toContain("rpc('commit_account_deletion_v1'");
    expect(deleteFunction).toContain("rpc('cancel_account_deletion_v1'");
    expect(deleteFunction).not.toContain(".from('profiles')");
    expect(deleteFunction).toContain('accountStorageDeletionTargets');
    expect(mediaPaths).toContain('profile-pictures');
    expect(mediaPaths).toContain('challenge-verifications');
    expect(mediaPaths).toContain('event-media');
  });

  it('deletes account-scoped welcome flags with the auth user', () => {
    const sql = readFile(
      'supabase/migrations/20260805204500_cascade_user_flags_on_account_deletion.sql'
    ).toLowerCase();

    expect(sql).toContain('delete from public.user_flags');
    expect(sql).toContain('references auth.users(id)');
    expect(sql).toContain('on delete cascade');
  });
});
