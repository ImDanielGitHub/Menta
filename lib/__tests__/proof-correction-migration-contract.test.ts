import fs from 'node:fs';
import path from 'node:path';

const readFile = (workspaceRelativePath: string): string =>
  fs
    .readFileSync(path.join(process.cwd(), workspaceRelativePath), 'utf8')
    .toLowerCase();

describe('proof correction migration contract', () => {
  const migration = readFile(
    'supabase/migrations/20260805123000_proof_correction_resubmission_contract.sql'
  );
  const submitFunction = migration.slice(
    migration.indexOf(
      'create or replace function public.submit_challenge_verification'
    )
  );
  const baseline = readFile(
    'supabase/migrations/20260214120000_lockedin_core_baseline_reset.sql'
  );
  const todaySnapshot = readFile(
    'supabase/migrations/20260804090000_today_snapshot_contract.sql'
  );
  const groupBoard = readFile(
    'supabase/migrations/20260804084500_group_accountability_board_ordering.sql'
  );
  const reviewCas = readFile(
    'supabase/migrations/20260805100000_review_decision_cas_contract.sql'
  );
  const reviewReward = readFile(
    'supabase/migrations/20260601093000_review_queue_reward_contract.sql'
  );
  const proofService = readFile('lib/services/proof-submission-service.ts');

  it('runs the additive schema and submit RPC transition atomically', () => {
    const transactionStart = migration.indexOf('begin;');
    const schemaChange = migration.indexOf(
      'alter table public.challenge_submissions'
    );

    expect(transactionStart).toBeGreaterThanOrEqual(0);
    expect(transactionStart).toBeLessThan(schemaChange);
    expect(migration.trimEnd().endsWith('commit;')).toBe(true);
  });

  it('retains rejected history and reuses the deployed daily indexes', () => {
    expect(baseline).toMatch(
      /status text not null default 'pending' check \(status in \('pending','approved','rejected'\)\)/
    );
    expect(migration).toContain(
      'add column if not exists replaces_submission_id uuid'
    );
    expect(migration).toContain(
      'constraint challenge_submissions_replaces_submission_id_fkey'
    );
    expect(migration).toContain(
      'references public.challenge_submissions(id)\n      on delete set null'
    );
    expect(migration).toContain(
      'create unique index if not exists uq_challenge_submissions_replacement'
    );
    expect(migration).toContain(
      'create unique index if not exists uq_challenge_submissions_active_daily'
    );
    expect(migration).toContain(
      'create index if not exists idx_challenge_submissions_daily_history'
    );
    expect(migration).toContain("where status in ('pending', 'approved')");
    expect(migration).not.toContain('uq_challenge_submissions_daily_active');
    expect(migration).not.toContain('idx_challenge_submissions_daily_latest');
    expect(migration).toContain(
      'drop index if exists public.uq_challenge_submissions_daily'
    );
    expect(migration).not.toContain(
      'drop index if exists public.uq_challenge_submissions_active_daily'
    );
    expect(migration).not.toContain(
      'drop index if exists public.idx_challenge_submissions_daily_history'
    );
    expect(migration).not.toContain('delete from public.challenge_submissions');
    expect(migration).not.toContain('update public.challenge_submissions');
  });

  it('resolves the exact event before active-day and rejection branches', () => {
    const exactRetry = submitFunction.indexOf(
      'and cs.client_event_id = v_client_event_id'
    );
    const activeDaily = submitFunction.indexOf(
      "and cs.status in ('pending', 'approved')"
    );
    const rejectedDaily = submitFunction.indexOf("and cs.status = 'rejected'");
    const insert = submitFunction.indexOf(
      'insert into public.challenge_submissions'
    );
    const exactBranch = submitFunction.slice(exactRetry, activeDaily);

    expect(exactRetry).toBeGreaterThanOrEqual(0);
    expect(activeDaily).toBeGreaterThan(exactRetry);
    expect(rejectedDaily).toBeGreaterThan(activeDaily);
    expect(insert).toBeGreaterThan(rejectedDaily);
    expect(exactBranch).not.toContain(
      'v_resolved_submission.local_day is distinct from v_today_local'
    );
    expect(exactBranch).toContain(
      'v_resolved_submission.media_type is distinct from v_media_type'
    );
    expect(exactBranch).toContain(
      'v_resolved_submission.media_url is distinct from v_stored_media_url'
    );
    expect(exactBranch).toContain('is distinct from v_stored_submission_text');
    expect(submitFunction).toContain("'code', 'idempotency_key_reused'");
    expect(submitFunction).toContain("'code', 'daily_submission_exists'");
    expect(submitFunction).toContain(
      'v_replaces_submission_id := v_latest_rejection.id'
    );
    expect(submitFunction).toContain(
      'on conflict (user_id, client_event_id)\n    do nothing'
    );
  });

  it('keeps submit authority bound to the authenticated active participant', () => {
    expect(submitFunction).toContain('security definer');
    expect(submitFunction).toContain("set search_path = ''");
    expect(submitFunction).toContain('v_user_id uuid := auth.uid()');
    expect(submitFunction).toContain(
      'if not public.current_session_is_active() then'
    );
    expect(submitFunction).toContain('cp.user_id = v_user_id');
    expect(submitFunction).toContain(
      "and coalesce(cp.status, 'active') = 'active'\n  for update"
    );
    expect(submitFunction).not.toContain('p_user_id');
    expect(submitFunction).toContain(
      ') from public, anon;\n\ngrant execute on function public.submit_challenge_verification('
    );
    expect(submitFunction).toContain(') to authenticated, service_role;');
  });

  it('delegates first accepted proof to the deployed streak authority only', () => {
    const approvedGuard = submitFunction.indexOf(
      "if v_submission_status = 'approved' then"
    );
    const applyApproved = submitFunction.indexOf(
      'public.apply_approved_streak_checkin('
    );

    expect(approvedGuard).toBeGreaterThanOrEqual(0);
    expect(applyApproved).toBeGreaterThan(approvedGuard);
    expect(submitFunction).toContain(
      "when v_resolved_submission.status = 'approved' then 'already_applied'"
    );
    expect(submitFunction).toContain("else 'pending_review'");
    expect(migration).not.toContain(
      'create or replace function public.apply_approved_streak_checkin'
    );
    expect(migration).not.toContain(
      'create or replace function public.review_challenge_verification'
    );
    expect(migration).not.toMatch(/update\s+public\.challenge_participants/);
    expect(migration).not.toContain('public.use_streak_freeze_for_user(');
    expect(submitFunction).not.toContain(
      "if v_submission_status = 'approved' and not v_is_correction then"
    );
  });

  it('preserves current receipts and adds correction identity fields', () => {
    const currentReceiptKeys = [
      'inputaccepted',
      'submissionid',
      'status',
      'allowselfreview',
      'newstreak',
      'longeststreak',
      'freezeused',
      'freezesremaining',
      'daystatus',
      'milestone',
      'effectivelocalday',
      'effectivetimezone',
      'data',
      'media_url',
    ];
    const correctionKeys = [
      'clienteventid',
      'client_event_id',
      'iscorrection',
      'replacessubmissionid',
      'replaces_submission_id',
    ];

    for (const key of [...currentReceiptKeys, ...correctionKeys]) {
      expect(submitFunction).toContain(`'${key}'`);
    }

    expect(submitFunction).toContain("'inputaccepted', false");
    expect(submitFunction).toContain("'inputaccepted', v_input_accepted");
    expect(submitFunction).toContain("'milestone', v_milestone");
  });

  it('keeps reviewer, board, reward, and exact-event readback integration', () => {
    expect(todaySnapshot).toContain(
      'order by cs.submission_date desc nulls last, cs.id desc'
    );
    expect(groupBoard).toContain(
      'order by cs.submission_date desc nulls last, cs.id desc'
    );
    expect(todaySnapshot).toContain("and cs.status = 'pending'");
    expect(reviewCas).toContain(
      "where id = $7 and status = ''pending'' returning *"
    );
    expect(reviewReward).toContain('where cs.id = p_reference_id');
    expect(proofService).toContain(
      ".eq('client_event_id', draft.clienteventid)"
    );
    expect(proofService).toContain('inputaccepted: boolean');
    expect(proofService).toContain('milestone: submitmilestonereceipt | null');
    expect(proofService).toContain('media_url: string | null');
  });

  it('preserves typed conflicts and never mutates proof media history', () => {
    const failures = [
      ...submitFunction.matchAll(
        /return pg_catalog\.jsonb_build_object\(\s*'success', false,([\s\S]*?)\n\s*\);/g
      ),
    ];

    expect(failures.length).toBeGreaterThanOrEqual(9);
    for (const failure of failures) {
      expect(failure[1]).toContain("'code'");
      expect(failure[1]).toContain("'error'");
      expect(failure[1]).toContain("'message'");
    }
    expect(submitFunction).toContain("'error', 'idempotency_key_reused'");
    expect(submitFunction).toContain("'error', 'daily_submission_exists'");
    expect(submitFunction).toContain(
      "'error', 'submission_idempotency_mismatch'"
    );
    expect(migration).not.toContain('storage.objects');
    expect(migration).not.toContain('media_url = null');
  });
});
