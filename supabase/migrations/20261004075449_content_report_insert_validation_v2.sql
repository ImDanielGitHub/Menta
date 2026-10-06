-- Build 117 retains its own-row column-scoped INSERT grant. Enforce the
-- report RPC's session and target boundary at the common row insertion point.
-- Legacy notes remain plain text; stable client-event receipts remain RPC-owned.
begin;

create or replace function private.validate_content_report_insert_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_visible boolean := false;
  v_target_type text := new.target_type::text;
begin
  -- Trusted moderation/import integrations retain their service-role authority.
  if auth.role() = 'service_role' then
    return new;
  end if;
  if v_actor is null or public.current_session_is_active() is not true then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;
  if new.reporter_id is distinct from v_actor then
    raise exception 'ACCOUNT_CHANGED' using errcode = '42501';
  end if;
  if new.target_id is null
    or coalesce(v_target_type, '') not in ('verification', 'group', 'challenge', 'user')
    or coalesce(new.reason::text, '') not in (
      'spam', 'inappropriate', 'harassment', 'copyright', 'misleading', 'other'
    )
    -- RPC facts may be 32 KiB plus their server-created envelope. Preserve
    -- that representation while bounding the legacy free-text input too.
    or pg_catalog.octet_length(coalesce(new.notes, '')) > 65536
  then
    raise exception 'INVALID_REPORT_REQUEST' using errcode = '22023';
  end if;

  if v_target_type = 'verification' then
    select submission.user_id = v_actor or exists (
      select 1 from public.challenge_participants participant
      where participant.challenge_id = submission.challenge_id
        and participant.user_id = v_actor
    ) into v_visible
    from public.challenge_submissions submission where submission.id = new.target_id;
  elsif v_target_type = 'challenge' then
    select challenge.is_public or challenge.creator_id = v_actor or exists (
      select 1 from public.challenge_participants participant
      where participant.challenge_id = challenge.id and participant.user_id = v_actor
    ) into v_visible
    from public.challenges challenge where challenge.id = new.target_id;
  elsif v_target_type = 'group' then
    select target_group.privacy = 'public' or target_group.owner_id = v_actor or exists (
      select 1 from public.team_members membership
      where membership.group_id = target_group.id and membership.user_id = v_actor
    ) into v_visible
    from public.teams target_group where target_group.id = new.target_id;
  else
    select true into v_visible from public.profiles target_profile
    where target_profile.id = new.target_id and target_profile.id <> v_actor;
  end if;
  if not coalesce(v_visible, false) then
    raise exception 'TARGET_NOT_AVAILABLE' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_content_report_insert_v2()
  from public, anon, authenticated, service_role;
create trigger validate_content_report_insert_v2
  before insert on public.content_reports
  for each row execute function private.validate_content_report_insert_v2();

commit;
