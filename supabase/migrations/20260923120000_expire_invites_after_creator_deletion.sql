-- Invite codes survive profile deletion through ON DELETE SET NULL. Keep the
-- historical row, but revoke its capability when the issuing account is gone.
-- This applies equally to group and legacy challenge invite readers.
create or replace function private.expire_invite_after_creator_deletion_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.created_by is not null and new.created_by is null then
    new.expires_at := least(
      coalesce(new.expires_at, pg_catalog.now()),
      pg_catalog.now()
    );
  end if;
  return new;
end;
$$;

revoke all on function private.expire_invite_after_creator_deletion_v1()
from public, anon, authenticated;

drop trigger if exists expire_invite_after_creator_deletion_v1
on public.invite_codes;

create trigger expire_invite_after_creator_deletion_v1
before update of created_by on public.invite_codes
for each row
execute function private.expire_invite_after_creator_deletion_v1();

-- Repair links issued before the trigger existed. No account or promise data
-- is removed, and links belonging to an existing account are unchanged.
update public.invite_codes
set expires_at = pg_catalog.now()
where created_by is null
  and (expires_at is null or expires_at > pg_catalog.now());
