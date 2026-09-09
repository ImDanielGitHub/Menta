import fs from 'node:fs';
import path from 'node:path';

const readFile = (workspaceRelativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), workspaceRelativePath), 'utf8');

describe('Today snapshot SQL contract', () => {
  const migration = readFile(
    'supabase/migrations/20260804090000_today_snapshot_contract.sql'
  );
  const todayScreen = readFile('app/(tabs)/index.tsx');
  const accountabilityReader = readFile('lib/loop/accountability.ts');

  it('derives obligations and pending reviews from the active auth session', () => {
    expect(migration).toContain(
      'function public.get_today_obligations(p_timezone text)'
    );
    expect(migration).toContain(
      'function public.get_today_pending_reviews(p_timezone text)'
    );
    expect(migration.match(/v_user_id uuid := auth\.uid\(\)/g)).toHaveLength(2);
    expect(
      migration.match(/if not public\.current_session_is_active\(\) then/g)
    ).toHaveLength(2);
    expect(migration).toContain("set search_path = ''");
  });

  it('keeps proof status bound to each challenge local day', () => {
    expect(migration).toContain('cs.user_id = v_user_id');
    expect(migration).toContain('cs.local_day = obligation.local_day');
    expect(migration).toContain(
      "cs.status in ('pending', 'approved', 'rejected')"
    );
    expect(migration).toContain('latest_submission.review_notes');
  });

  it('limits execution to authenticated clients', () => {
    expect(migration).toContain(
      'revoke all on function public.get_today_obligations(text) from anon'
    );
    expect(migration).toContain(
      'grant execute on function public.get_today_obligations(text) to authenticated'
    );
    expect(migration).toContain(
      'revoke all on function public.get_today_pending_reviews(text) from anon'
    );
    expect(migration).toContain(
      'grant execute on function public.get_today_pending_reviews(text) to authenticated'
    );
  });

  it('uses the snapshot RPCs instead of direct hardened-table reads', () => {
    const snapshotBody = todayScreen.match(
      /const fetchTodaySnapshot = async[\s\S]*?^};/m
    )?.[0];

    expect(snapshotBody).toContain('readTodayAccountability(args.timezone)');
    expect(snapshotBody).toContain("'get_today_pending_reviews'");
    expect(accountabilityReader).toContain("'get_today_accountability_v2'");
    expect(accountabilityReader).toContain("'get_today_obligations'");
    expect(snapshotBody).not.toContain(".from('challenge_participants')");
    expect(snapshotBody).not.toContain(".from('challenge_submissions')");
    expect(snapshotBody).not.toContain('admin_feedback');
  });
});
