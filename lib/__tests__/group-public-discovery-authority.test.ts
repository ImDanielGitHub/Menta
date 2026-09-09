import fs from 'node:fs';
import path from 'node:path';

const readMigration = (name: string) =>
  fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations', name),
    'utf8'
  );

describe('public group discovery authority', () => {
  it('exposes the public group shell without exposing its people or promise links', () => {
    const currentTeamPolicies = readMigration(
      '20260430111500_fix_team_member_rls_recursion.sql'
    );
    const currentLinkPolicies = readMigration(
      '20260815100043_harden_security_scan_authority_v1.sql'
    );

    expect(currentTeamPolicies).toContain("privacy = 'public'");
    expect(currentTeamPolicies).toContain(
      'or public.is_current_user_team_member(id)'
    );

    const memberPolicy = currentTeamPolicies.slice(
      currentTeamPolicies.indexOf('create policy team_members_select'),
      currentTeamPolicies.indexOf('drop policy if exists team_members_insert')
    );
    expect(memberPolicy).toContain(
      'public.is_current_user_team_member(group_id)'
    );
    expect(memberPolicy).not.toContain("privacy = 'public'");

    expect(currentLinkPolicies).toContain(
      'revoke insert, update, delete on table public.team_challenges'
    );

    const groupStore = fs.readFileSync(
      path.join(process.cwd(), 'store/group-store.ts'),
      'utf8'
    );
    const discoveryRead = groupStore.slice(
      groupStore.indexOf('fetchDiscoverGroups: async'),
      groupStore.indexOf('getCreateGroupCost: async')
    );
    expect(discoveryRead).toContain(
      'id, name, description, status, kind, duration_days, created_at, privacy, image_url, start_date, end_date'
    );
    expect(discoveryRead).not.toContain('team_challenges(');
    expect(discoveryRead).not.toContain('invite_code');
  });

  it('keeps proof media and encouragement inside an authenticated membership boundary', () => {
    const accountability = readMigration(
      '20260831173000_promise_accountability_centre_v1.sql'
    );
    const proofPolicy = accountability.slice(
      accountability.indexOf('create policy challenge_submissions_select'),
      accountability.indexOf(
        '-- Promise-scoped containers do not consume the quota'
      )
    );

    expect(proofPolicy).toContain('join public.team_members member');
    expect(proofPolicy).toContain('member.user_id = (select auth.uid())');
    expect(proofPolicy).not.toContain('challenge.is_public');

    const encouragementPolicy = accountability.slice(
      accountability.indexOf('create policy proof_encouragements_insert_own'),
      accountability.indexOf(
        'drop policy if exists proof_encouragements_delete_own'
      )
    );
    expect(encouragementPolicy).toContain(
      'submission.user_id <> (select auth.uid())'
    );
    expect(encouragementPolicy).toContain('join public.team_members member');
  });
});
