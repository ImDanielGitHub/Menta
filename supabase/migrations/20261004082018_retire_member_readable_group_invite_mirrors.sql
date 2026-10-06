-- Preserve installed clients' teams SELECT * shape while removing invite secrets.
-- Previously mirrored group links stop working. Owners/admins must reissue them
-- through generate-group-invite; unmatched managed invite_codes remain valid.
begin;

lock table public.teams in share row exclusive mode;

update public.invite_codes invite
set expires_at = pg_catalog.now()
from public.teams team
where invite.type = 'group'
  and invite.ref_id = team.id
  and team.invite_code is not null
  and invite.code = team.invite_code
  and (invite.expires_at is null or invite.expires_at > pg_catalog.now());

create or replace function private.remove_legacy_team_invite_mirror_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.invite_code := null;
  return new;
end;
$$;

revoke all on function private.remove_legacy_team_invite_mirror_v1()
  from public, anon, authenticated, service_role;

create trigger teams_remove_legacy_invite_mirror_v1
before insert or update of invite_code on public.teams
for each row execute function private.remove_legacy_team_invite_mirror_v1();

update public.teams set invite_code = null where invite_code is not null;

alter table public.teams
  add constraint teams_legacy_invite_mirror_null_v1
  check (invite_code is null);

commit;
