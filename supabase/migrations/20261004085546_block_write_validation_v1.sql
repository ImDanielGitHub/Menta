-- Preserve installed-client block INSERT/DELETE while enforcing the RPC's
-- actor/session and insertion target boundary. Receipts remain RPC-owned.
begin;
create or replace function private.validate_block_write_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  -- FK cascades after authorised profile deletion must also remove incoming
  -- blocks. A direct client DELETE cannot enter this nested trigger path.
  if tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() > 1
    and (not exists(select 1 from public.profiles p where p.id=old.blocker_id)
      or not exists(select 1 from public.profiles p where p.id=old.blocked_user_id))
  then return old; end if;
  if auth.role() = 'service_role' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if v_actor is null or public.current_session_is_active() is not true then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    if old.blocker_id is distinct from v_actor then
      raise exception 'ACCOUNT_CHANGED' using errcode = '42501';
    end if;
    return old;
  end if;
  if new.blocker_id is distinct from v_actor then
    raise exception 'ACCOUNT_CHANGED' using errcode = '42501';
  end if;
  new.reason := nullif(pg_catalog.btrim(coalesce(new.reason, '')), '');
  if new.blocked_user_id is null or new.blocked_user_id = v_actor
    or pg_catalog.length(coalesce(new.reason, '')) > 500
    or not exists(select 1 from public.profiles p where p.id = new.blocked_user_id)
  then
    raise exception 'INVALID_BLOCK_REQUEST' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_block_write_v1()
  from public, anon, authenticated, service_role;
create trigger validate_block_write_v1 before insert or delete on public.blocked_users
  for each row execute function private.validate_block_write_v1();
commit;
