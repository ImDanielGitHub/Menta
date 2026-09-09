import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260825124952_create_onboarding_group_with_first_promise_v1.sql'
  ),
  'utf8'
);

describe('onboarding group first-promise SQL authority', () => {
  it('keeps the receipt private, app-immutable and cascade-compatible', () => {
    expect(migration).toContain(
      'create table private.onboarding_group_first_promise_receipts'
    );
    expect(migration).toContain('user_id uuid primary key');
    expect(migration).toContain('first_promise_id uuid not null unique');
    expect(migration).toContain('group_id uuid not null unique');
    expect(migration).toContain('force row level security');
    expect(migration).toContain(
      'from public, anon, authenticated, service_role'
    );
    expect(migration).toContain(
      'references public.challenges(id) on delete cascade'
    );
    expect(migration).toContain(
      'references public.teams(id) on delete cascade'
    );
    expect(migration).not.toContain('onboarding_group_receipt_immutable');
  });

  it('validates the pristine activation promise before economy mutation', () => {
    const activationCheck = migration.indexOf(
      "v_activation.source <> 'first_promise_v1'"
    );
    const submissionCheck = migration.indexOf(
      'from public.challenge_submissions submission'
    );
    const streakCheck = migration.indexOf(
      'from public.streak_day_outcomes outcome'
    );
    const economyMutation = migration.indexOf(
      'v_group_result := public.create_group_with_payment('
    );
    expect(activationCheck).toBeGreaterThan(0);
    expect(submissionCheck).toBeGreaterThan(activationCheck);
    expect(streakCheck).toBeGreaterThan(activationCheck);
    expect(economyMutation).toBeGreaterThan(submissionCheck);
    expect(economyMutation).toBeGreaterThan(streakCheck);
  });

  it('replays an exact receipt before checking the current legal version', () => {
    const actorLock = migration.indexOf('pg_catalog.pg_advisory_xact_lock');
    const replay = migration.indexOf("'replayed', true");
    const legalGate = migration.indexOf(
      "perform public.require_current_legal_acceptance('promise_creation');"
    );
    expect(actorLock).toBeGreaterThan(0);
    expect(replay).toBeGreaterThan(actorLock);
    expect(legalGate).toBeGreaterThan(replay);
  });

  it('validates the locked promise schedule before economy mutation', () => {
    const challengeLock = migration.indexOf('select challenge.*');
    const timezoneCheck = migration.indexOf(
      'from pg_catalog.pg_timezone_names timezone'
    );
    const spanCheck = migration.indexOf(
      'v_promise_end_date - v_promise_start_date + 1'
    );
    const economyCheck = migration.indexOf(
      "private.economy_action_cost_v1(v_actor_id, 'create_group')"
    );
    expect(migration).toContain(
      'v_promise.duration <> all (array[7, 14, 30]::integer[])'
    );
    expect(migration).toContain('or v_promise.start_date is null');
    expect(challengeLock).toBeGreaterThan(0);
    expect(timezoneCheck).toBeGreaterThan(challengeLock);
    expect(spanCheck).toBeGreaterThan(timezoneCheck);
    expect(economyCheck).toBeGreaterThan(spanCheck);
    expect(migration).not.toContain('coalesce(v_promise.duration, 30)');
  });

  it('allows an initial tracking boundary when no real activity exists', () => {
    expect(migration).not.toContain(
      'v_participant.streak_outcome_tracking_started_at is not null'
    );
    expect(migration).toContain('v_participant.last_check_in is not null');
    expect(migration).toContain('from public.challenge_submissions submission');
    expect(migration).toContain('from public.streak_day_outcomes outcome');
    expect(migration).toContain(
      'from public.streak_checkin_applications application'
    );
  });

  it('requires a free first-group quote and validates its delegate receipt', () => {
    const freeGate = migration.indexOf('if v_cost is distinct from 0 then');
    const groupCreate = migration.indexOf(
      'v_group_result := public.create_group_with_payment('
    );
    const delegateValidation = migration.indexOf(
      "pg_catalog.jsonb_typeof(v_group_result -> 'group_id')"
    );
    const promiseMutation = migration.indexOf('update public.challenges');
    expect(freeGate).toBeGreaterThan(0);
    expect(groupCreate).toBeGreaterThan(freeGate);
    expect(delegateValidation).toBeGreaterThan(groupCreate);
    expect(promiseMutation).toBeGreaterThan(delegateValidation);
    expect(migration).toContain("'ONBOARDING_FIRST_GROUP_UNAVAILABLE'");
    expect(migration).toContain(
      "v_cost := (v_group_result ->> 'cost')::integer"
    );
    expect(migration).toContain(
      "v_balance := (v_group_result ->> 'new_balance')::integer"
    );
    expect(migration).toContain("is distinct from 'string'");
    expect(migration.match(/is distinct from 'number'/g)).toHaveLength(2);
  });

  it('atomically converts review rules, links once and records replay facts', () => {
    expect(migration).toContain('allow_self_review = false');
    expect(migration).toContain("'requires_peer_review', true");
    expect(migration).toContain("'reviewers_required', 1");
    expect(migration).toContain('insert into public.team_challenges');
    expect(migration).toContain("'IDEMPOTENCY_CONFLICT'");
    expect(migration).toContain("'replayed', true");
    expect(migration).toContain("'replayed', false");
  });

  it('keeps every INSERT column list aligned with its VALUES tuple', () => {
    const receiptInsert = migration.match(
      /insert into private\.onboarding_group_first_promise_receipts \(([\s\S]*?)\) values \(([\s\S]*?)\);/
    );
    expect(receiptInsert).not.toBeNull();
    const columns = receiptInsert?.[1]
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    const values = receiptInsert?.[2]
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    expect(columns).toHaveLength(20);
    expect(values).toHaveLength(20);
    expect(values?.slice(-4)).toEqual([
      'v_promise.title',
      'v_expectations',
      'v_cost',
      'v_balance',
    ]);

    const linkInsert = migration.match(
      /insert into public\.team_challenges \(([^)]*)\)\s+values \(([^)]*)\);/
    );
    expect(linkInsert).not.toBeNull();
    expect(linkInsert?.[1].split(',')).toHaveLength(2);
    expect(linkInsert?.[2].split(',')).toHaveLength(2);
  });
});
