import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260813003000_enforce_legal_acceptance_on_challenge_creation.sql'
  ),
  'utf8'
);

describe('legal acceptance challenge authoring gate', () => {
  it('keeps the delegate rename and wrapper creation in one transaction', () => {
    expect(migration).toMatch(/server-owned legal gate\.\n\nbegin;/);
    expect(migration.trimEnd().endsWith('commit;')).toBe(true);
  });

  it('fails before mutation when the activation authority is not installed', () => {
    const preconditionPosition = migration.indexOf(
      "pg_catalog.to_regclass('private.account_activation_receipts')"
    );
    const renamePosition = migration.indexOf(
      ') rename to create_accountability_challenge_without_legal_gate;'
    );

    expect(preconditionPosition).toBeGreaterThan(-1);
    expect(migration).toContain(
      "v_activation_definition,\n    'private.account_activation_receipts'"
    );
    expect(migration).toContain(
      "raise exception 'LEGAL_ACTIVATION_MIGRATION_REQUIRED'"
    );
    expect(renamePosition).toBeGreaterThan(preconditionPosition);
  });

  it('gates the real challenge RPC before delegating to its final implementation', () => {
    const guardPosition = migration.indexOf(
      "perform public.require_current_legal_acceptance('promise_creation');"
    );
    const delegatePosition = migration.indexOf(
      'return public.create_accountability_challenge_without_legal_gate('
    );

    expect(migration).toContain(
      ') rename to create_accountability_challenge_without_legal_gate;'
    );
    expect(guardPosition).toBeGreaterThan(-1);
    expect(delegatePosition).toBeGreaterThan(guardPosition);
  });

  it('blocks direct app access to the ungated delegate without owning activation ACL', () => {
    expect(migration).toContain(
      'revoke all on function public.create_accountability_challenge_without_legal_gate('
    );
    expect(migration).toContain(
      ') from public, anon, authenticated, service_role;'
    );
    expect(migration).not.toContain(
      'revoke all on function public.create_challenge_with_payment('
    );
    expect(migration).toContain(
      'revoke insert on table public.challenges from public, anon, authenticated;'
    );
  });

  it('documents that enforcement remains default-off until rollout preconditions pass', () => {
    expect(migration).toContain('default observe mode');
    expect(migration).toMatch(
      /rollout may switch to enforce only after the[\s\S]*activation ACL/
    );
  });

  it('preserves the stable public signature and app grants', () => {
    expect(migration).toContain(
      'create or replace function public.create_accountability_challenge('
    );
    expect(migration).toContain('p_cost integer default 30');
    expect(migration).toContain('returns jsonb');
    expect(migration).toContain('security definer');
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(') to authenticated, service_role;');
  });
});
