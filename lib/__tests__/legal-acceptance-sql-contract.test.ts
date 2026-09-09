import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260812142446_legal_acceptance_receipts.sql'
  ),
  'utf8'
);

describe('legal acceptance SQL contract', () => {
  it('applies the legal authority atomically', () => {
    expect(migration.trimStart().startsWith('-- Forward-only')).toBe(true);
    expect(migration).toMatch(
      /acknowledgement action\. Non-material copy corrections keep the same version\.\n\nbegin;/
    );
    expect(migration.trimEnd().endsWith('commit;')).toBe(true);
  });

  it('keeps current document versions server-owned and complete', () => {
    expect(migration).toContain(
      'create table if not exists public.legal_document_versions'
    );
    expect(migration).toContain(
      "'terms', '2026-05-13', 'https://menta.quest/terms', '2026-05-13 00:00:00+00'"
    );
    expect(migration).toContain(
      "'privacy', '2026-05-13', 'https://menta.quest/privacy', '2026-05-13 00:00:00+00'"
    );
    expect(migration).toContain(
      "'community_standards',\n    '2026-08-13',\n    'https://menta.quest/community-standards',\n    '2026-08-13 00:00:00+00'"
    );
    expect(migration).toContain(
      'create unique index if not exists legal_document_versions_unique_effective'
    );
    expect(migration).not.toContain('legal_document_versions_one_current');
    expect(migration).toContain('where documents.effective_at <= now()');
    expect(migration).toContain('or documents.retired_at > now()');
    expect(migration).toContain(
      'order by\n      documents.document_type,\n      documents.effective_at desc'
    );
    expect(migration).toContain(
      'revoke all privileges on table public.legal_document_versions'
    );
  });

  it('does not resurrect v1 after effective v2 is retired', () => {
    const resolver = migration.match(
      /create or replace function public\.get_current_legal_document_versions\(\)[\s\S]*?\n\$\$;/
    )?.[0];
    const rankLatestPosition = resolver?.indexOf(
      'with latest_effective_documents as ('
    );
    const filterRetirementPosition = resolver?.indexOf(
      'from latest_effective_documents as documents'
    );

    expect(resolver).toBeDefined();
    expect(rankLatestPosition).toBeGreaterThan(-1);
    expect(filterRetirementPosition).toBeGreaterThan(rankLatestPosition ?? -1);
    expect(
      resolver?.slice(rankLatestPosition, filterRetirementPosition)
    ).not.toContain('documents.retired_at is null');
    expect(resolver?.slice(filterRetirementPosition)).toContain(
      'where documents.retired_at is null\n      or documents.retired_at > now()'
    );
  });

  it('makes receipts append-only for app roles and readable only by their owner', () => {
    expect(migration).toContain(
      'create table if not exists public.legal_acceptance_receipts'
    );
    expect(migration).toContain(
      'user_id uuid not null references auth.users(id) on delete cascade'
    );
    expect(migration).toContain(
      'alter table public.legal_acceptance_receipts enable row level security'
    );
    expect(migration).toContain(
      'revoke all privileges on table public.legal_acceptance_receipts'
    );
    expect(migration).toContain(
      'grant select on table public.legal_acceptance_receipts'
    );
    expect(migration).toContain('using ((select auth.uid()) = user_id)');
    expect(migration).not.toMatch(
      /grant\s+(?:insert|update|delete|all)[\s\S]*legal_acceptance_receipts[\s\S]*authenticated/i
    );
  });

  it('rejects anonymous, stale, and forged acceptance attempts', () => {
    expect(migration).toContain(
      'create or replace function public.accept_current_legal_documents'
    );
    expect(migration).toContain('v_user_id uuid := auth.uid()');
    expect(migration).toContain(
      'p_expected_user_id is null or p_expected_user_id <> v_user_id'
    );
    expect(migration).toContain("message = 'ACCOUNT_SCOPE_CHANGED'");
    expect(migration).toContain("message = 'AUTHENTICATION_REQUIRED'");
    expect(migration).toContain(
      "p_terms_version is distinct from v_current #>> '{terms,version}'"
    );
    expect(migration).toContain("message = 'LEGAL_DOCUMENTS_CHANGED'");
    expect(migration).toContain(
      'on conflict (\n    user_id,\n    terms_version,\n    privacy_policy_version,\n    community_standards_version\n  ) do nothing'
    );
    expect(migration).toContain(
      'grant execute on function public.accept_current_legal_documents'
    );
    expect(migration).toContain('to authenticated, service_role');
  });

  it('rejects revoked sessions in both user-facing legal RPCs', () => {
    const statusFunction = migration.match(
      /create or replace function public\.get_my_legal_acceptance_status\([\s\S]*?\n\$\$;/
    )?.[0];
    const acceptanceFunction = migration.match(
      /create or replace function public\.accept_current_legal_documents\([\s\S]*?\n\$\$;/
    )?.[0];

    expect(statusFunction).toContain(
      'if not public.current_session_is_active() then'
    );
    expect(statusFunction).toContain("message = 'AUTH_SESSION_REVOKED'");
    expect(acceptanceFunction).toContain(
      'if not public.current_session_is_active() then'
    );
    expect(acceptanceFunction).toContain("message = 'AUTH_SESSION_REVOKED'");
  });

  it('provides a status RPC and an internal-only authoring guard', () => {
    expect(migration).toContain(
      'create or replace function public.get_my_legal_acceptance_status('
    );
    expect(migration).toContain("'userId', v_user_id");
    expect(migration).toContain("'promiseCreationRequired'");
    expect(migration).toContain("'requiresAcceptance', v_receipt.id is null");
    expect(migration).toContain(
      'create or replace function public.require_current_legal_acceptance('
    );
    expect(migration).toContain("message = 'LEGAL_ACCEPTANCE_REQUIRED'");
    expect(migration).toContain(
      'revoke all on function public.require_current_legal_acceptance(text)'
    );
    expect(migration).toContain(
      'from public, anon, authenticated, service_role'
    );
  });

  it('installs explicit non-blocking enforcement state for compatible rollout', () => {
    expect(migration).toContain(
      'create table if not exists public.legal_acceptance_enforcement_settings'
    );
    expect(migration).toContain("values ('promise_creation', 'observe', null)");
    expect(migration).toContain(
      "if v_enforcement_mode is distinct from 'enforce' then"
    );
    expect(migration).toContain(
      'revoke all privileges on table public.legal_acceptance_enforcement_settings'
    );
  });

  it('does not infer acceptance for existing users', () => {
    expect(migration).not.toMatch(
      /insert\s+into\s+public\.legal_acceptance_receipts[\s\S]*select[\s\S]*from\s+public\.(?:profiles|users)/i
    );
  });
});
