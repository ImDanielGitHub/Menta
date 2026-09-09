import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260831224000_event_invite_entry_authority_v2.sql'
  ),
  'utf8'
);
const edgeFunction = readFileSync(
  join(process.cwd(), 'supabase/functions/event-participation/index.ts'),
  'utf8'
);

describe('event invite entry authority v2', () => {
  it('requires an unrevoked, unexpired and unexhausted invite for preview', () => {
    expect(migration).toMatch(/invite\.revoked_at is null/);
    expect(migration).toMatch(
      /invite\.expires_at is null[\s\S]*invite\.expires_at > now\(\)/
    );
    expect(migration).toContain('invite.use_count < invite.max_uses');
  });

  it('keeps account-scoped invitations bound to the authenticated account', () => {
    expect(migration).toMatch(
      /invite\.issued_to_user_id is null[\s\S]*invite\.issued_to_user_id = p_actor_id/
    );
  });

  it('checks the bidirectional block relationship before preview or a new join', () => {
    expect(
      migration.match(/private\.users_have_block_relationship_v1\(/g)
    ).toHaveLength(2);
    expect(migration).toMatch(/p_actor_id,[\s\S]*v_event\.organiser_id/);
    expect(migration).toMatch(/p_actor_id,[\s\S]*v_organiser_id/);
  });

  it('preserves an existing idempotent join receipt before applying a later block', () => {
    const existingReceipt = migration.indexOf("receipt.action = 'join'");
    const blockCheck = migration.lastIndexOf(
      'private.users_have_block_relationship_v1('
    );
    expect(existingReceipt).toBeGreaterThan(0);
    expect(existingReceipt).toBeLessThan(blockCheck);
    expect(migration).toMatch(
      /receipt\.client_event_id = p_client_event_id[\s\S]*return public\.event_join_v1/
    );
  });

  it('does not create a receipt or participation mutation for a pre-auth join', () => {
    const unauthenticated = migration.match(
      /if p_actor_id is null then([\s\S]*?)end if;/
    )?.[1];
    expect(unauthenticated).toContain("'AUTHENTICATION_REQUIRED'");
    expect(unauthenticated).not.toMatch(/insert|update|delete/i);
  });

  it('exposes both wrappers only to the service role', () => {
    expect(migration).toMatch(
      /revoke all on function public\.event_get_invite_entry_summary_v2\([\s\S]*from public, anon, authenticated;/
    );
    expect(migration).toMatch(
      /grant execute on function public\.event_get_invite_entry_summary_v2\([\s\S]*to service_role;/
    );
    expect(migration).toMatch(
      /revoke all on function public\.event_join_invite_entry_v2\([\s\S]*from public, anon, authenticated;/
    );
    expect(migration).toMatch(
      /grant execute on function public\.event_join_invite_entry_v2\([\s\S]*to service_role;/
    );
  });

  it('routes summary and join through the v2 wrappers without logging capabilities', () => {
    expect(edgeFunction).toContain("'event_get_invite_entry_summary_v2'");
    expect(edgeFunction).toContain("'event_join_invite_entry_v2'");
    expect(edgeFunction).toContain('p_actor_id: context.user?.id ?? null');
    expect(edgeFunction).not.toMatch(
      /console\.(?:log|warn|error)\([^)]*(?:shareToken|inviteToken)/
    );
  });
});
