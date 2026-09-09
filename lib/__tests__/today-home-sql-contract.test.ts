import fs from 'node:fs';
import path from 'node:path';

const readFile = (workspaceRelativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), workspaceRelativePath), 'utf8');

describe('Today home SQL contract', () => {
  const migration = readFile(
    'supabase/migrations/20260814200000_today_home_and_read_indexes.sql'
  );
  const todayScreen = readFile('app/(tabs)/index.tsx');
  const mediaMigration = readFile(
    'supabase/migrations/20260901132000_today_recent_proof_media_v1.sql'
  );

  it('keeps the bundled home RPC session-scoped and grant-limited', () => {
    expect(migration).toContain(
      'create or replace function public.get_today_home_v1(p_timezone text)'
    );
    expect(migration).toContain("raise exception 'AUTH_REQUIRED'");
    expect(migration).toContain("raise exception 'AUTH_SESSION_REVOKED'");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      'from public.get_today_accountability_v2(p_timezone)'
    );
    expect(migration).toContain(
      'from public.get_today_pending_reviews(p_timezone)'
    );
    expect(migration).toContain('public.get_group_risk_data(v_group_id)');
    expect(migration).toContain(
      'revoke all on function public.get_today_home_v1(text) from anon'
    );
    expect(migration).toContain(
      'grant execute on function public.get_today_home_v1(text) to authenticated'
    );
  });

  it('adds covering indexes for Today and group membership reads', () => {
    expect(migration).toContain(
      'idx_challenge_submissions_user_local_day_status'
    );
    expect(migration).toContain('idx_team_members_user_group');
    expect(migration).toContain('idx_challenge_participants_user_status');
  });

  it('prefers the bundled home RPC before the legacy multi-hop read', () => {
    const snapshotBody = todayScreen.match(
      /const fetchTodaySnapshot = async[\s\S]*?^};/m
    )?.[0];

    expect(snapshotBody).toContain("'get_today_home_v1'");
    expect(snapshotBody).toContain('readTodayAccountability(args.timezone)');
    expect(snapshotBody).toContain("'get_today_pending_reviews'");
    expect(snapshotBody).not.toContain(".from('challenge_participants')");
    expect(snapshotBody).not.toContain(".from('challenge_submissions')");
  });

  it('adds only approved, membership-scoped photo and video proof to Today', () => {
    expect(mediaMigration).toContain("'recent_media', v_recent_media");
    expect(mediaMigration).toContain("submission.status = 'approved'");
    expect(mediaMigration).toContain(
      "submission.media_type in ('photo', 'video')"
    );
    expect(mediaMigration).toContain('submission.user_id = v_user_id');
    expect(mediaMigration).toContain('contributor_membership.user_id');
    expect(mediaMigration).toContain('public.current_session_is_active()');
    expect(mediaMigration).toContain("set search_path = ''");
    expect(mediaMigration).toContain(
      'revoke all on function public.get_today_home_v1(text) from public, anon'
    );
  });

  it('keeps the profile follow-through series behind an authenticated receipt', () => {
    expect(mediaMigration).toContain(
      'public.get_profile_follow_through_v1(p_timezone text)'
    );
    expect(mediaMigration).toContain('public.current_session_is_active()');
    expect(mediaMigration).toContain(
      'from public.challenge_submissions submission'
    );
    expect(mediaMigration).toContain('from public.streak_day_outcomes outcome');
    expect(mediaMigration).toContain(
      'pg_catalog.generate_series(0, 6) day_offset(value)'
    );
    expect(mediaMigration).not.toContain(' offset(value)');
    expect(mediaMigration).toContain(
      'revoke all on function public.get_profile_follow_through_v1(text)'
    );
    expect(mediaMigration).toContain(
      'grant execute on function public.get_profile_follow_through_v1(text)'
    );
  });
});
