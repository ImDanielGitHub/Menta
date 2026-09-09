import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260901030305_account_deletion_ownership_guard_v1.sql'
  ),
  'utf8'
);

describe('account deletion ownership SQL authority', () => {
  it('keeps the guard private and every RPC service-only', () => {
    expect(sql).toContain(
      'alter table private.account_deletion_guards_v1 force row level security'
    );
    expect(sql).toContain(
      'revoke all privileges on table private.account_deletion_guards_v1'
    );
    expect(sql).toContain(
      'grant execute on function public.prepare_account_deletion_v1(uuid, uuid)\n  to service_role'
    );
    expect(sql).toContain(
      'grant execute on function public.commit_account_deletion_v1(uuid, uuid)\n  to service_role'
    );
    expect(sql).not.toContain(
      'grant execute on function public.prepare_account_deletion_v1(uuid, uuid)\n  to authenticated'
    );
  });

  it('serialises membership writes around the guard decision', () => {
    const membershipTrigger = sql.indexOf(
      'create or replace function private.block_guarded_team_membership_write_v1'
    );
    const teamKeyLock = sql.indexOf('for key share;', membershipTrigger);
    const guardRead = sql.indexOf(
      'join private.account_deletion_guards_v1 guard',
      membershipTrigger
    );

    expect(membershipTrigger).toBeGreaterThan(-1);
    expect(teamKeyLock).toBeGreaterThan(membershipTrigger);
    expect(guardRead).toBeGreaterThan(teamKeyLock);
    expect(sql).toContain("message = 'ACCOUNT_DELETION_IN_PROGRESS'");
  });

  it('locks, rechecks, and rejects shared ownership before the profile cascade', () => {
    const commit = sql.indexOf(
      'create or replace function public.commit_account_deletion_v1'
    );
    const teamLock = sql.indexOf('for update;', commit);
    const otherMemberCheck = sql.indexOf(
      'and member.user_id <> p_actor_id;',
      teamLock
    );
    const blocker = sql.indexOf(
      "'code', 'OWNED_GROUP_HAS_OTHER_MEMBERS'",
      otherMemberCheck
    );
    const profileDelete = sql.indexOf(
      'delete from public.profiles profile',
      blocker
    );

    expect(commit).toBeGreaterThan(-1);
    expect(teamLock).toBeGreaterThan(commit);
    expect(otherMemberCheck).toBeGreaterThan(teamLock);
    expect(blocker).toBeGreaterThan(otherMemberCheck);
    expect(profileDelete).toBeGreaterThan(blocker);
  });
});
