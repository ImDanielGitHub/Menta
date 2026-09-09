import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260901161500_attach_personal_promise_to_saved_group_v1.sql'
  ),
  'utf8'
);

const rpc = source.slice(
  source.indexOf(
    'create or replace function public.attach_personal_promise_to_saved_group_v1'
  ),
  source.indexOf(
    'revoke all on function public.attach_personal_promise_to_saved_group_v1'
  )
);

describe('personal promise to saved group authority', () => {
  it('keeps idempotency receipts private and owner-scoped', () => {
    expect(source).toContain(
      'create table if not exists private.promise_saved_group_link_receipts_v1'
    );
    expect(source).toContain('force row level security');
    expect(source).toMatch(
      /revoke all on table private\.promise_saved_group_link_receipts_v1[\s\S]*from public, anon, authenticated, service_role;/
    );
    expect(rpc).toContain('v_actor_id uuid := auth.uid()');
    expect(rpc).toContain('receipt.actor_id = v_actor_id');
    expect(rpc).toContain("'{receipt,idempotent}'");
    expect(rpc).toContain("'IDEMPOTENCY_MISMATCH'");
  });

  it('requires an active session, promise ownership and saved-group authority', () => {
    expect(rpc).toContain('not public.current_session_is_active()');
    expect(rpc).toContain('challenge.creator_id = v_actor_id');
    expect(rpc).toContain('not coalesce(challenge.is_public, false)');
    expect(rpc).toContain("team.kind = 'saved'");
    expect(rpc).toContain("team.status = 'active'");
    expect(rpc).toContain('team.archived_at is null');
    expect(rpc).toContain("membership.role in ('owner', 'admin')");
  });

  it('checks block safety before exposing the promise to confirmed members', () => {
    expect(rpc).toContain('v_group.owner_id <> v_actor_id');
    expect(rpc).toContain('membership.user_id <> v_actor_id');
    expect(rpc).toContain('private.users_have_block_relationship_v1(');
    expect(rpc).toContain("'code', 'GROUP_NOT_AVAILABLE'");
  });

  it('preserves the promise container and permits only one saved-group link', () => {
    expect(rpc).toContain('public.ensure_promise_accountability_v1(');
    expect(rpc).toContain("team.kind = 'promise'");
    expect(source).toContain(
      'create trigger team_challenges_single_saved_group_v1'
    );
    expect(source).toContain("team.kind = 'saved'");
    expect(source).toContain(
      "raise exception 'PROMISE_SAVED_GROUP_LINK_EXISTS'"
    );
  });

  it('activates the existing saved-group peer review contract without inventing roles', () => {
    expect(rpc).toContain('allow_self_review = false');
    expect(rpc).toContain("'requires_peer_review', true");
    expect(rpc).toContain("'reviewers_required', 1");
    expect(rpc).toContain(
      'insert into public.team_challenges (group_id, challenge_id)'
    );
    expect(rpc).not.toContain('insert into public.challenge_participants');
    expect(rpc).not.toContain('insert into public.team_members');
    expect(rpc).not.toContain(
      'insert into private.promise_accountability_members'
    );
    expect(rpc).toContain(
      "'review_authority', 'confirmed_saved_group_members'"
    );
  });

  it('exposes only the authenticated RPC and no receipt table access', () => {
    expect(source).toMatch(
      /revoke all on function public\.attach_personal_promise_to_saved_group_v1\([\s\S]*from public, anon, authenticated, service_role;[\s\S]*grant execute on function public\.attach_personal_promise_to_saved_group_v1\([\s\S]*\) to authenticated;/
    );
  });
});
