import fs from 'node:fs';
import path from 'node:path';

const migration = fs
  .readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260828114500_proof_ad_break_cadence_v1.sql'
    ),
    'utf8'
  )
  .toLowerCase();

describe('proof ad break migration contract', () => {
  it('applies the private cadence ledger atomically', () => {
    expect(migration.indexOf('begin;')).toBeLessThan(
      migration.indexOf(
        'create table if not exists private.proof_ad_break_cadence'
      )
    );
    expect(migration.trimEnd().endsWith('commit;')).toBe(true);
    expect(migration).toContain('submission_id uuid primary key');
    expect(migration).toContain('unique (user_id, ordinal)');
    expect(migration).toContain('enable row level security');
    expect(migration).toContain(
      'revoke all on table private.proof_ad_break_cadence'
    );
    expect(migration).not.toContain(
      'grant select on table private.proof_ad_break_cadence'
    );
    expect(migration).not.toContain('revoke all on schema private');
  });

  it('allocates one per-user ordinal only for newly inserted direct proofs', () => {
    const trigger = migration.slice(
      migration.indexOf(
        'create or replace function private.record_proof_ad_break_cadence_v1()'
      ),
      migration.indexOf(
        'create or replace function public.get_proof_ad_break_hint('
      )
    );

    expect(trigger).toContain('new.replaces_submission_id is not null');
    expect(trigger).toContain('pg_catalog.pg_advisory_xact_lock');
    expect(trigger).toContain("'proof-ad-break:' || new.user_id::text");
    expect(trigger).toContain('coalesce(max(cadence.ordinal), 0) + 1');
    expect(trigger).toContain('on conflict (submission_id) do nothing');
    expect(trigger).toContain('after insert on public.challenge_submissions');
    expect(trigger).not.toMatch(
      /insert into private\.proof_ad_break_cadence\s*select/
    );
  });

  it('consumes an even due ordinal before returning a successful claim', () => {
    const claim = migration.slice(
      migration.indexOf(
        'create or replace function public.claim_proof_ad_break('
      )
    );
    const lock = claim.indexOf('for update');
    const evenGuard = claim.indexOf('v_cadence.ordinal % 2 <> 0');
    const consume = claim.indexOf('set claimed_at = pg_catalog.now()');
    const success = claim.indexOf("'code', 'claimed'");

    expect(lock).toBeGreaterThanOrEqual(0);
    expect(evenGuard).toBeGreaterThan(lock);
    expect(consume).toBeGreaterThan(evenGuard);
    expect(success).toBeGreaterThan(consume);
    expect(claim).toContain("'code', 'already_claimed'");
    expect(claim).toContain("'proof-ad-break-claim:' || v_user_id::text");
  });

  it('keeps both RPCs account-bound and unavailable to anonymous callers', () => {
    expect(migration).toContain('v_user_id uuid := auth.uid()');
    expect(migration).toContain('public.current_session_is_active()');
    expect(migration).toContain('cadence.user_id = v_user_id');
    expect(
      migration.match(/from public\.get_my_pro_authority\(\) authority/g)
    ).toHaveLength(2);
    expect(migration.match(/or coalesce\(v_is_pro, true\)/g)).toHaveLength(2);
    expect(
      migration.match(/or coalesce\(v_reconciliation_pending, true\)/g)
    ).toHaveLength(2);
    expect(migration).toContain(
      'revoke execute on function public.get_proof_ad_break_hint(uuid)\n  from public, anon'
    );
    expect(migration).toContain(
      'revoke execute on function public.claim_proof_ad_break(uuid)\n  from public, anon'
    );
    expect(migration).toContain(
      'grant execute on function public.claim_proof_ad_break(uuid)\n  to authenticated, service_role'
    );
  });

  it('does not award Momenta or mutate proof authority', () => {
    expect(migration).not.toContain('wallet_transactions');
    expect(migration).not.toContain('momenta_balance');
    expect(migration).not.toContain('claim_momenta_reward');
    expect(migration).not.toMatch(/update\s+public\.challenge_submissions/);
    expect(migration).not.toMatch(
      /delete\s+from\s+public\.challenge_submissions/
    );
  });
});
