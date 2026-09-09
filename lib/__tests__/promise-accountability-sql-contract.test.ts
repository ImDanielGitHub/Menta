import fs from 'node:fs';
import path from 'node:path';

const migration = () =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260831173000_promise_accountability_centre_v1.sql'
    ),
    'utf8'
  );

const functionBody = (source: string, name: string, nextName: string) =>
  source.slice(
    source.indexOf(`function ${name}`),
    source.indexOf(`function ${nextName}`)
  );

describe('promise accountability SQL contract', () => {
  it('separates promise containers from reusable saved groups', () => {
    const source = migration();
    expect(source).toContain("check (kind in ('saved', 'promise'))");
    expect(source).toContain("and team.kind = 'saved'");
    expect(source).toContain("and team.kind = 'saved'");
  });

  it('keeps actor, promise ownership, roles, and invite binding on the server', () => {
    const source = migration();
    expect(source).toContain('v_actor_id uuid := auth.uid()');
    expect(source).toContain('v_challenge.creator_id <> v_actor_id');
    expect(source).toContain(
      "role in ('owner', 'partner', 'reviewer', 'supporter')"
    );
    expect(source).toContain("invite.type = 'challenge'");
    expect(source).toContain('invite.ref_id = p_challenge_id');
    expect(source).toContain(
      'revoke all on table private.promise_accountability_members'
    );
  });

  it('cannot grant promise roles through a reusable saved group', () => {
    const source = migration();
    const setRole = functionBody(
      source,
      'public.set_promise_accountability_invite_role_v1',
      'public.begin_promise_accountability_invite_v1'
    );
    const begin = functionBody(
      source,
      'public.begin_promise_accountability_invite_v1',
      'public.get_promise_accountability_v1'
    );
    const resolve = functionBody(
      source,
      'private.resolve_promise_accountability_join_target_v2',
      'public.get_promise_accountability_invite_preview_v1'
    );

    expect(setRole).toContain("team.kind = 'promise'");
    expect(setRole).toContain("team.status = 'active'");
    expect(begin).toContain("team.kind = 'promise'");
    expect(begin).toContain("team.status = 'active'");
    expect(resolve).toContain(
      "and (not v_accountability_invite or team.kind = 'promise')"
    );
    expect(resolve).toContain(
      'if v_accountability_invite and group_id is null then'
    );
  });

  it('only gives daily proof participation to the do-it-together role', () => {
    const source = migration();
    expect(source).toContain("if v_role = 'partner' then");
    expect(source).not.toContain(
      "if v_role is null or v_role = 'partner' then"
    );
    expect(source).toContain('public.join_challenge_with_funding_v1(');
    expect(source).toContain('insert into public.challenge_participants');
    expect(source).toContain(
      'insert into private.promise_accountability_members'
    );
    expect(source).toContain(
      "coalesce(scoped_reviewer.role, 'reviewer') <> 'supporter'"
    );
    expect(source).toContain("and member.role = 'supporter'");
    expect(source).toContain(
      'Your role in this promise does not include proof review.'
    );
  });

  it('keeps self-review until a reviewer or partner actually accepts', () => {
    const source = migration();
    const prepare = functionBody(
      source,
      'public.ensure_promise_accountability_v1',
      'public.set_promise_accountability_invite_role_v1'
    );
    const join = functionBody(
      source,
      'public.join_promise_accountability_v2',
      'public.read_promise_accountability_join_status_v2'
    );

    expect(prepare).toContain('coalesce(v_challenge.is_public, false)');
    expect(prepare).toContain("'PUBLIC_PROMISE_USES_GROUP_INVITE'");
    expect(prepare).not.toContain('allow_self_review = false');
    expect(prepare).not.toContain("'requires_peer_review', true");
    expect(join).toContain("if v_role in ('partner', 'reviewer') then");
    expect(join).toContain('allow_self_review = false');
    expect(join).toContain("if v_role = 'partner' then");
  });

  it('keeps one live pending role link and restores solo review after peers leave', () => {
    const source = migration();
    const begin = functionBody(
      source,
      'public.begin_promise_accountability_invite_v1',
      'public.get_promise_accountability_v1'
    );
    const setRole = functionBody(
      source,
      'public.set_promise_accountability_invite_role_v1',
      'public.begin_promise_accountability_invite_v1'
    );
    const leave = functionBody(
      source,
      'public.leave_promise_accountability_v1',
      'public.get_today_pending_reviews'
    );

    expect(begin).toContain('and scoped.role = v_role');
    expect(begin).not.toContain('set expires_at = now()');
    expect(setRole).toContain('update public.invite_codes invite');
    expect(setRole).toContain('scoped.challenge_id = p_challenge_id');
    expect(setRole).toContain('invite.code <> v_code');
    expect(setRole).toContain('set expires_at = now()');
    expect(setRole).not.toContain(
      'delete from private.promise_accountability_members'
    );
    expect(leave).toContain("member.role in ('partner', 'reviewer')");
    expect(leave).toContain('allow_self_review = true');
    expect(leave).toContain("'requires_peer_review', false");
  });

  it('keeps preparation private, idempotent, and block-safe', () => {
    const source = migration();
    expect(source).toContain(
      "'promise-accountability:' || p_challenge_id::text"
    );
    expect(source).toContain('on conflict (challenge_id, user_id) do update');
    expect(source).toContain("'PROMISE_ACCOUNTABILITY_INVITE_REUSED_V1'");
    expect(source).toContain('private.users_have_block_relationship_v1');
    expect(source).toContain('This promise invitation is not available.');
    expect(source).toContain('join public.team_members member');
  });

  it('authorises visible proof and server-backed encouragement for members', () => {
    const source = migration();
    expect(source).toContain(
      'create table if not exists public.proof_encouragements'
    );
    expect(source).toContain('create policy proof_encouragements_insert_own');
    expect(source).toContain('challenge_submissions_select');
    expect(source).toContain('member.user_id = (select auth.uid())');

    const inviteEdge = fs.readFileSync(
      path.join(
        process.cwd(),
        'supabase/functions/generate-challenge-invite/index.ts'
      ),
      'utf8'
    );
    expect(inviteEdge).toContain(".eq('teams.kind', 'promise')");
    expect(inviteEdge).toContain('const forceNew = body?.forceNew === true');
  });
});
