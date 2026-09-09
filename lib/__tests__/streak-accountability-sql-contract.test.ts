import fs from 'node:fs';
import path from 'node:path';

const readMigration = (): string =>
  fs
    .readFileSync(
      path.join(
        process.cwd(),
        'supabase/migrations/20260812235000_add_streak_day_outcome_authority.sql'
      ),
      'utf8'
    )
    .toLowerCase();

const readDailyMaintenance = (): string =>
  fs
    .readFileSync(
      path.join(process.cwd(), 'supabase/functions/daily-maintenance/index.ts'),
      'utf8'
    )
    .toLowerCase();

const functionBlock = (sql: string, name: string, nextName: string): string => {
  const start = sql.indexOf(`create or replace function public.${name}`);
  const end = sql.indexOf(
    `create or replace function public.${nextName}`,
    start
  );

  expect(start).toBeGreaterThanOrEqual(0);
  if (end < 0 && nextName === '__no_later_function__') {
    return sql.slice(start);
  }
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
};

describe('streak accountability SQL contract', () => {
  const migration = readMigration();
  const dailyMaintenance = readDailyMaintenance();

  it('stores prospective account-owned outcome receipts without client writes', () => {
    expect(migration).toContain(
      'add column if not exists streak_outcome_tracking_started_at'
    );
    expect(migration).toContain('set default pg_catalog.clock_timestamp()');
    expect(migration).not.toContain(
      'streak_outcome_tracking_started_at timestamptz\n  not null default pg_catalog.now()'
    );
    expect(migration).toContain(
      'create table if not exists public.streak_day_outcomes'
    );
    expect(migration).toContain('unique (user_id, challenge_id, local_day)');
    expect(migration).toContain("outcome in ('missed', 'protected')");
    expect(migration).toContain(
      "outcome = 'protected' and resulting_streak = previous_streak"
    );
    expect(migration).toContain("outcome = 'missed' and resulting_streak = 0");
    expect(migration).toContain(
      'alter table public.streak_day_outcomes enable row level security'
    );
    expect(migration).toContain('create policy streak_day_outcomes_select_own');
    expect(migration).toContain('using (user_id = (select auth.uid()))');
    expect(migration).toContain(
      'grant select on table public.streak_day_outcomes to authenticated'
    );
    expect(migration).toContain(
      'grant all privileges on table public.streak_day_outcomes to service_role'
    );
    expect(migration).toContain(
      'create table if not exists public.streak_checkin_applications'
    );
    expect(migration).toContain(
      'constraint streak_checkin_applications_submission_key'
    );
    expect(migration).not.toContain(
      'grant insert on table public.streak_day_outcomes to authenticated'
    );
    expect(migration).not.toContain(
      'grant update on table public.streak_day_outcomes to authenticated'
    );
    expect(migration).toContain(
      'drop policy if exists inventory_items_upsert_self'
    );
    expect(migration).toContain(
      'revoke all privileges on table public.inventory_items'
    );
    expect(migration).toContain(
      'grant select on table public.inventory_items to authenticated'
    );
  });

  it('resolves closed days once under user and participant locks', () => {
    const resolver = functionBlock(
      migration,
      'resolve_streak_day_outcomes',
      'apply_approved_streak_checkin'
    );

    expect(resolver).toContain('security definer');
    expect(resolver).toContain("set search_path = ''");
    expect(resolver).toContain('pg_catalog.pg_try_advisory_xact_lock');
    expect(resolver).toContain("raise exception 'streak_resolution_busy'");
    expect(resolver).toContain('for update');
    expect(resolver).toContain('streak_outcome_tracking_started_at');
    expect(resolver).toContain('v_participant.joined_at');
    expect(resolver).toContain('v_challenge.start_date');
    expect(resolver).toContain('v_current_local_day - 1');
    expect(resolver).toContain(
      'streak_outcome_tracking_started_at = pg_catalog.clock_timestamp()'
    );
    expect(resolver).toContain(
      '(v_challenge.end_date at time zone v_effective_tz)::date - 1'
    );
    expect(resolver).toContain("and cs.status = 'pending'");
    expect(resolver).toContain("and cs.status = 'approved'");
    expect(resolver).toContain('order by day_value');
    expect(resolver.indexOf('from public.streak_day_outcomes')).toBeLessThan(
      resolver.indexOf('public.use_streak_freeze_for_user(')
    );
    expect(resolver).toContain(
      'revoke all on function public.resolve_streak_day_outcomes('
    );
    expect(resolver).toContain(') from public, anon, authenticated');
    expect(resolver).toContain(
      'grant execute on function public.resolve_streak_day_outcomes('
    );
    expect(resolver).toContain(') to service_role');
  });

  it('uses one bounded evidence predicate for cutover guard and anchor', () => {
    const helperStart = migration.indexOf(
      'create or replace function private.streak_cutover_anchor_candidate'
    );
    const anchorStart = migration.indexOf(
      'create or replace function public.anchor_unapplied_approved_checkin'
    );
    const applyStart = migration.indexOf(
      'create or replace function public.apply_approved_streak_checkin'
    );
    const helper = migration.slice(helperStart, anchorStart);
    const anchor = migration.slice(anchorStart, applyStart);
    const apply = migration.slice(
      applyStart,
      migration.indexOf(
        'create or replace function public.review_challenge_verification',
        applyStart
      )
    );

    expect(helperStart).toBeGreaterThanOrEqual(0);
    expect(helper).toContain("submission_row.status = 'approved'");
    expect(helper).toContain('submission_row.local_day is not null');
    expect(helper).toContain(
      'submission_row.reviewer_id = submission_row.reviewed_by'
    );
    expect(helper).toContain(
      'submission_row.reviewer_id <> submission_row.user_id'
    );
    expect(helper).toContain("timestamptz '2026-08-05 10:00:00+00'");
    expect(helper).toMatch(
      /submission_row\.reviewed_at\s*< participant_row\.streak_outcome_tracking_started_at/
    );
    expect(helper).toContain(
      'submission_row.id is distinct from p_exclude_submission_id'
    );
    expect(helper).toContain(
      'submission_row.verification_date = submission_row.reviewed_at'
    );
    expect(helper).not.toMatch(
      /and \(\s*submission_row\.verification_date = submission_row\.reviewed_at\s*or submission_row\.verification_date is null\s*\)/
    );
    expect(helper).toContain('candidate.verification_date is null');
    expect(helper).toContain('participant_row.last_check_in_local_date');
    expect(helper).toContain('participant_row.joined_at at time zone');
    expect(helper).toContain('challenge_row.start_date at time zone');
    expect(helper).toContain('challenge_row.end_date at time zone');
    expect(helper).toContain(
      "coalesce(challenge_row.verification_frequency, '') = 'daily'"
    );
    expect(helper).toContain('coalesce(participant_row.current_streak, 0) > 0');
    expect(helper).toContain(
      'count(*) filter (where is_exact_cas)::integer as exact_cas_count'
    );
    expect(helper).toContain('aggregate_count.bounded_count = 1');
    expect(helper).toContain('aggregate_count.exact_cas_count = 0');
    expect(helper).toContain("then 'anchorable_ambiguous'::text");
    expect(helper).toContain("then 'exact_cas_requires_manual_review'::text");

    expect(anchor).toContain(
      'from private.streak_cutover_anchor_candidate(\n    p_user_id,\n    p_challenge_id,\n    p_exclude_submission_id'
    );
    expect(anchor).toContain(
      "v_assessment_status is distinct from 'anchorable_ambiguous'"
    );
    expect(anchor).toContain(
      "'error', 'cutover_anchor_requires_manual_review'"
    );
    expect(anchor).not.toContain('at_risk = false');
    expect(apply).toContain(
      'from private.streak_cutover_anchor_candidate(\n    p_user_id,\n    p_challenge_id,\n    p_submission_id'
    );
    expect(anchor).not.toContain('from public.challenge_submissions unapplied');
    expect(apply).not.toContain('from public.challenge_submissions unapplied');
    expect(apply).toContain("'error', 'cutover_anchor_required'");
  });

  it('excludes every potentially partial start-boundary day', () => {
    const resolver = functionBlock(
      migration,
      'resolve_streak_day_outcomes',
      'apply_approved_streak_checkin'
    );

    expect(migration).toContain(
      'create or replace function private.first_full_streak_local_day_v1('
    );
    expect(resolver).toMatch(
      /v_start_day := greatest\(\s*private\.first_full_streak_local_day_v1\(\s*v_participant\.streak_outcome_tracking_started_at,\s*v_effective_tz\s*\),\s*private\.first_full_streak_local_day_v1\(\s*v_participant\.joined_at,\s*v_effective_tz\s*\),\s*coalesce\(\s*private\.first_full_streak_local_day_v1\(\s*v_challenge\.start_date,\s*v_effective_tz\s*\),\s*'-infinity'::date\s*\)\s*\);/
    );
    expect(resolver).toContain('if v_through_day < v_start_day then');
    expect(resolver.indexOf('v_start_day := greatest(')).toBeLessThan(
      resolver.indexOf('from pg_catalog.generate_series(')
    );
  });

  it('credits an approved peer proof through the shared helper transaction', () => {
    const applyHelper = functionBlock(
      migration,
      'apply_approved_streak_checkin',
      'review_challenge_verification'
    );
    const review = functionBlock(
      migration,
      'review_challenge_verification',
      'list_streak_maintenance_candidates'
    );
    const compareAndSet = review.indexOf(
      "where id = $7 and status = ''pending'' returning *"
    );
    const helperCall = review.indexOf(
      'v_streak_result := public.apply_approved_streak_checkin('
    );

    expect(applyHelper).toContain('security definer');
    expect(applyHelper).toContain("set search_path = ''");
    expect(applyHelper).toContain("and cs.status = 'approved'");
    expect(applyHelper).toContain("'daystatus', 'already_applied'");
    expect(applyHelper).toContain('on conflict (external_reference_id)');
    expect(applyHelper).toContain(
      'grant execute on function public.apply_approved_streak_checkin('
    );
    expect(applyHelper).toContain(') to service_role');

    expect(compareAndSet).toBeGreaterThanOrEqual(0);
    expect(helperCall).toBeGreaterThan(compareAndSet);
    expect(review).toContain("if p_status = 'approved' then");
    expect(review).toContain('security definer');
    expect(review).toContain("set search_path = ''");
    expect(review).toContain('v_reviewer_id uuid := auth.uid()');
    expect(review).toContain('public.current_session_is_active()');
    expect(review).toContain(
      "raise exception 'approved_streak_apply_failed: %'"
    );
    expect(review).toContain("'code', 'earlier_proof_review_required'");
    expect(review).toContain("'code', 'already_decided'");
    expect(review).toContain("'code', 'changed_while_reviewing'");
    expect(review).toContain("'code', 'streak_apply_failed'");

    const participantLock = review.indexOf(
      'from public.challenge_participants cp'
    );
    const submissionLock = review.indexOf(
      'where cs.id = p_verification_id\n  for update',
      participantLock
    );
    const blockedRelationship = review.indexOf(
      'private.users_have_block_relationship_v1(',
      submissionLock
    );
    expect(participantLock).toBeGreaterThanOrEqual(0);
    expect(submissionLock).toBeGreaterThan(participantLock);
    expect(blockedRelationship).toBeGreaterThan(submissionLock);
    expect(blockedRelationship).toBeLessThan(compareAndSet);
    expect(review).toContain("'code', 'accountability_relationship_blocked'");
    expect(migration).toContain(
      'create or replace function private.users_have_block_relationship_v1('
    );
  });

  it('runs bounded maintenance in separate participant transactions', () => {
    const listCandidates = functionBlock(
      migration,
      'list_streak_maintenance_candidates',
      'maintain_streak_participant'
    );
    const maintainParticipant = functionBlock(
      migration,
      'maintain_streak_participant',
      'reset_missed_streaks'
    );
    const compatibilityReset = functionBlock(
      migration,
      'reset_missed_streaks',
      'get_today_accountability_v2'
    );

    expect(listCandidates).toContain(
      "coalesce(challenge_row.verification_frequency, '') = 'daily'"
    );
    expect(listCandidates).toContain('limit least(greatest(coalesce(p_limit');
    expect(listCandidates).toContain(') from public, anon, authenticated');
    expect(listCandidates).toContain(') to service_role');

    expect(maintainParticipant).toContain(
      'public.anchor_unapplied_approved_checkin('
    );
    expect(maintainParticipant).toContain(
      'public.resolve_streak_day_outcomes('
    );
    expect(maintainParticipant).toContain(
      'private.first_full_streak_local_day_v1(\n          cp.streak_outcome_tracking_started_at,\n          v_effective_tz'
    );
    expect(maintainParticipant).toContain(
      'challenge_row.end_date at time zone v_effective_tz'
    );
    expect(maintainParticipant).toMatch(/\)\s*to service_role/);

    expect(compatibilityReset).toContain('language sql');
    expect(compatibilityReset).toContain('stable');
    expect(compatibilityReset).toContain('0::integer as reset_count');
    expect(compatibilityReset).not.toContain(
      'public.resolve_streak_day_outcomes('
    );
    expect(compatibilityReset).not.toContain(
      'update public.challenge_participants'
    );

    expect(dailyMaintenance).toContain(
      "rpc('list_streak_maintenance_candidates'"
    );
    expect(dailyMaintenance).toContain("rpc('maintain_streak_participant'");
    expect(dailyMaintenance).not.toContain(
      "rpc(\n      'reset_missed_streaks'"
    );
    expect(dailyMaintenance).toContain('for (const candidate of candidates)');
  });

  it('adds an authenticated Today v2 without changing the installed v1 RPC', () => {
    const today = functionBlock(
      migration,
      'get_today_accountability_v2',
      '__no_later_function__'
    );
    const fields = [
      'effective_timezone text',
      'longest_streak integer',
      'at_risk boolean',
      'streak_outcome text',
      'outcome_local_day date',
      'previous_streak integer',
      'resulting_streak integer',
      'freeze_used boolean',
      'freezes_remaining integer',
      'days_since_accepted_check_in integer',
    ];

    for (const field of fields) expect(today).toContain(field);
    expect(today).toContain('stable');
    expect(today).toContain('security definer');
    expect(today).toContain("set search_path = ''");
    expect(today).toContain('v_user_id uuid := auth.uid()');
    expect(today).toContain("raise exception 'auth_required'");
    expect(today).toContain('public.current_session_is_active()');
    expect(today).toContain("raise exception 'auth_session_revoked'");
    expect(today).toContain('outcome_row.user_id = v_user_id');
    expect(today).toContain('cp.user_id = v_user_id');
    expect(today).not.toContain('p_user_id');
    expect(today).toContain(
      'grant execute on function public.get_today_accountability_v2(text)'
    );
    expect(migration).not.toContain(
      'create or replace function public.get_today_obligations'
    );
  });
});
