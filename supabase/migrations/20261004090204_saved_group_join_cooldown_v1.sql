-- Shared saved-group cooldown boundary; promise containers retain their own contract.
begin;
-- Broad historical team UPDATE grants must not let clients erase the deadline
-- or turn a cooling-down saved group into a promise container.
create or replace function private.protect_saved_group_cooldown_fields_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if auth.role() = 'service_role' then return new; end if;
 if auth.role() in ('authenticated','anon') or auth.uid() is not null then
  if new.cooldown_until is distinct from old.cooldown_until
   or (coalesce(old.kind,'saved')='saved' and old.cooldown_until>pg_catalog.now()
       and new.kind is distinct from old.kind)
  then raise exception 'COOLDOWN_SERVER_OWNED' using errcode='42501'; end if;
 end if;
 return new;
end;
$$;
revoke all on function private.protect_saved_group_cooldown_fields_v1() from public,anon,authenticated,service_role;
create trigger protect_saved_group_cooldown_fields_v1 before update of cooldown_until,kind on public.teams
for each row execute function private.protect_saved_group_cooldown_fields_v1();
-- Preserve deadlines across leave, reassignment and group deletion.
create table private.saved_group_account_cooldowns_v1(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 cooldown_until timestamptz not null
);
alter table private.saved_group_account_cooldowns_v1 enable row level security;
alter table private.saved_group_account_cooldowns_v1 force row level security;
revoke all on private.saved_group_account_cooldowns_v1 from public,anon,authenticated,service_role;
create or replace function private.preserve_saved_group_cooldown_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if tg_table_name='teams' then
  if coalesce(old.kind,'saved')='saved' and old.cooldown_until>pg_catalog.now() then
   insert into private.saved_group_account_cooldowns_v1(user_id,cooldown_until)
   select m.user_id,old.cooldown_until from public.team_members m join public.profiles p on p.id=m.user_id
   where m.group_id=old.id order by m.user_id
   on conflict(user_id) do update set cooldown_until=greatest(private.saved_group_account_cooldowns_v1.cooldown_until,excluded.cooldown_until);
  end if;
 elsif tg_op='DELETE' or new.user_id is distinct from old.user_id or new.group_id is distinct from old.group_id then
  insert into private.saved_group_account_cooldowns_v1(user_id,cooldown_until)
  select old.user_id,t.cooldown_until from public.teams t join public.profiles p on p.id=old.user_id
  where t.id=old.group_id and coalesce(t.kind,'saved')='saved' and t.cooldown_until>pg_catalog.now()
  on conflict(user_id) do update set cooldown_until=greatest(private.saved_group_account_cooldowns_v1.cooldown_until,excluded.cooldown_until);
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.preserve_saved_group_cooldown_v1() from public,anon,authenticated,service_role;
create trigger preserve_saved_group_cooldown_v1 before delete or update of group_id,user_id on public.team_members
for each row execute function private.preserve_saved_group_cooldown_v1();
create trigger preserve_saved_group_deletion_cooldown_v1 before delete on public.teams
for each row execute function private.preserve_saved_group_cooldown_v1();

create or replace function private.saved_group_membership_in_cooldown_v1(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
select exists(select 1 from public.team_members m join public.teams t on t.id=m.group_id
 where m.user_id=p_user_id and coalesce(t.kind,'saved')='saved' and t.cooldown_until>pg_catalog.now())
 or exists(select 1 from private.saved_group_account_cooldowns_v1 c where c.user_id=p_user_id and c.cooldown_until>pg_catalog.now());
$$;
revoke all on function private.saved_group_membership_in_cooldown_v1(uuid) from public,anon,authenticated,service_role;
create or replace function private.enforce_saved_group_join_cooldown_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if tg_op='UPDATE' and new.group_id is not distinct from old.group_id and new.user_id is not distinct from old.user_id then return new; end if;
 if exists(select 1 from public.teams t where t.id=new.group_id and coalesce(t.kind,'saved')='saved')
  and not exists(select 1 from public.team_members m where m.group_id=new.group_id and m.user_id=new.user_id)
  and private.saved_group_membership_in_cooldown_v1(new.user_id)
 then raise exception 'GROUP_JOIN_COOLDOWN' using errcode='42501'; end if;
 return new;
end;
$$;
revoke all on function private.enforce_saved_group_join_cooldown_v1() from public,anon,authenticated,service_role;
create trigger enforce_saved_group_join_cooldown_v1 before insert or update of group_id,user_id on public.team_members
for each row execute function private.enforce_saved_group_join_cooldown_v1();
CREATE OR REPLACE FUNCTION public.join_group_with_payment(p_user_id uuid, p_invite_code text, p_cost integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_code text;
  v_group_id uuid;
  v_group_name text;
  v_group_status text;
  v_existing boolean;
  v_balance integer;
  v_new_balance integer;
  v_rows integer;
  v_effective_cost integer;
  v_quota_error text;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'USER_REQUIRED');
  end if;

  if auth.uid() is not null and auth.uid() <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;


  -- Serialise the free allowance across every group and promise join.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('participation-join:' || p_user_id::text, 0));

  v_code := upper(trim(coalesce(p_invite_code, '')));
  if v_code = '' then
    return jsonb_build_object('success', false, 'error', 'INVALID_CODE');
  end if;

  select ic.ref_id
  into v_group_id
  from public.invite_codes ic
  where ic.code = v_code
    and ic.type = 'group'
    and (ic.expires_at is null or ic.expires_at > now())
  limit 1;

  if v_group_id is null then
    return jsonb_build_object('success', false, 'error', 'INVALID_CODE');
  end if;

  select t.name, t.status
  into v_group_name, v_group_status
  from public.teams t
  where t.id = v_group_id
  limit 1;

  if v_group_status is null then
    return jsonb_build_object('success', false, 'error', 'GROUP_NOT_FOUND');
  end if;

  if v_group_status <> 'active' then
    return jsonb_build_object('success', false, 'error', 'GROUP_INACTIVE');
  end if;

  -- Serialise retries for one user and group before checking membership or
  -- charging Momenta. Without this lock, concurrent joins can both charge
  -- before one insert loses the unique-key race.
  perform pg_advisory_xact_lock(
    hashtextextended('join-group:' || p_user_id::text || ':' || v_group_id::text, 0)
  );

  select exists (
    select 1
    from public.team_members tm
    where tm.group_id = v_group_id
      and tm.user_id = p_user_id
  )
  into v_existing;

  if v_existing then
    return jsonb_build_object(
      'success', false,
      'error', 'ALREADY_MEMBER',
      'group_id', v_group_id,
      'group_name', v_group_name
    );
  end if;

  if exists(select 1 from public.teams t where t.id=v_group_id and coalesce(t.kind,'saved')='saved')
    and private.saved_group_membership_in_cooldown_v1(p_user_id) then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'GROUP_JOIN_COOLDOWN');
  end if;

  v_quota_error := private.economy_quota_error_v1(p_user_id, 'join_group');
  if v_quota_error is not null then
    return jsonb_build_object('success', false, 'error', v_quota_error);
  end if;

  v_effective_cost := private.economy_action_cost_v1(p_user_id, 'join_group');

  if p_cost is distinct from v_effective_cost then
    return jsonb_build_object('success', false, 'error', 'QUOTE_STALE');
  end if;

  if v_effective_cost > 0 then
    select p.momenta_balance
    into v_balance
    from public.profiles p
    where p.id = p_user_id
    for update;

    if v_balance is null then
      return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
    end if;

    if v_balance < v_effective_cost then
      return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
    end if;

    update public.profiles
    set
      momenta_balance = coalesce(momenta_balance, 0) - v_effective_cost,
      updated_at = now()
    where id = p_user_id
    returning momenta_balance into v_new_balance;

    insert into public.wallet_transactions (
      user_id,
      amount,
      reason,
      transaction_type,
      description,
      reference_id,
      created_at
    )
    values (
      p_user_id,
      -v_effective_cost,
      'join_group',
      'spent',
      'Join group: ' || coalesce(v_group_name, 'group'),
      v_group_id,
      now()
    );
  else
    select coalesce(p.momenta_balance, 0)
    into v_new_balance
    from public.profiles p
    where p.id = p_user_id;
  end if;

  insert into public.team_members (group_id, user_id, role)
  values (v_group_id, p_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'ALREADY_MEMBER',
      'group_id', v_group_id,
      'group_name', v_group_name,
      'new_balance', coalesce(v_new_balance, 0)
    );
  end if;

  perform private.record_participation_join_v1(p_user_id);

  return jsonb_build_object(
    'success', true,
    'group_id', v_group_id,
    'group_name', v_group_name,
    'new_balance', coalesce(v_new_balance, 0),
    'cost', v_effective_cost
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.join_public_group_v2(p_group_id uuid, p_expected_cost integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_group public.teams%rowtype;
  v_balance integer;
  v_cost integer;
  v_quota_error text;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;


  -- Serialise the free allowance across every group and promise join.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('participation-join:' || v_actor_id::text, 0));

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'join-public-group:' || v_actor_id::text || ':' || p_group_id::text,
      0
    )
  );

  select team_row.*
  into v_group
  from public.teams team_row
  where team_row.id = p_group_id
  for update;

  if not found or v_group.status <> 'active' then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'GROUP_UNAVAILABLE');
  end if;
  if coalesce(v_group.privacy, 'private') <> 'public' then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'INVITE_REQUIRED');
  end if;
  if exists (
    select 1 from public.team_members membership
    where membership.group_id = p_group_id and membership.user_id = v_actor_id
  ) then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'ALREADY_MEMBER');
  end if;

  if coalesce(v_group.kind,'saved')='saved' and private.saved_group_membership_in_cooldown_v1(v_actor_id) then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'GROUP_JOIN_COOLDOWN');
  end if;

  v_quota_error := private.economy_quota_error_v1(v_actor_id, 'join_group');
  if v_quota_error is not null then
    return pg_catalog.jsonb_build_object('success', false, 'error', v_quota_error);
  end if;
  v_cost := private.economy_action_cost_v1(v_actor_id, 'join_group');

  if p_expected_cost is distinct from v_cost then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'QUOTE_STALE');
  end if;

  select coalesce(profile.momenta_balance, 0)
  into v_balance
  from public.profiles profile
  where profile.id = v_actor_id
  for update;

  if v_balance is null then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;
  if v_balance < v_cost then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
  end if;

  insert into public.team_members (group_id, user_id, role)
  values (p_group_id, v_actor_id, 'member');

  if v_cost > 0 then
    perform public.add_momenta_transaction(
      v_actor_id, -v_cost, 'Group join', 'spent', p_group_id
    );
  end if;

  perform private.record_participation_join_v1(v_actor_id);

  return pg_catalog.jsonb_build_object(
    'success', true,
    'group_id', p_group_id,
    'group_name', v_group.name,
    'cost', v_cost,
    'new_balance', v_balance - v_cost
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_group_with_payment(p_user_id uuid, p_name text, p_description text, p_duration_days integer, p_cost integer, p_privacy text DEFAULT 'private'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  new_group_id uuid;
  balance integer;
  effective_cost integer;
  new_balance integer;
  quota_error text;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'USER_REQUIRED');
  end if;

  if auth.uid() is null or auth.uid() <> p_user_id
    or not public.current_session_is_active() then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'error', 'GROUP_NAME_REQUIRED');
  end if;

  -- Match the outer saved-group lock order; advisory locks are reentrant.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'saved-group-create-account:' || p_user_id::text, 0
  ));

  select coalesce(momenta_balance, 0)
  into balance
  from public.profiles
  where id = p_user_id
  for update;

  if balance is null then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  -- Every authenticated wrapper must respect the same saved-team cooldown.
  if private.saved_group_membership_in_cooldown_v1(p_user_id) then
    return pg_catalog.jsonb_build_object(
      'success', false, 'error', 'GROUP_CREATION_COOLDOWN'
    );
  end if;

  quota_error := private.economy_quota_error_v1(p_user_id, 'create_group');
  if quota_error is not null then
    return jsonb_build_object('success', false, 'error', quota_error);
  end if;

  effective_cost := private.economy_action_cost_v1(p_user_id, 'create_group');

  if balance < effective_cost then
    return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
  end if;

  insert into public.teams(
    owner_id,
    name,
    description,
    privacy,
    status,
    duration_days
  )
  values (
    p_user_id,
    p_name,
    p_description,
    coalesce(nullif(p_privacy, ''), 'private'),
    'active',
    least(365, greatest(coalesce(p_duration_days, 30), 1))
  )
  returning id into new_group_id;

  insert into public.team_members(group_id, user_id, role)
  values (new_group_id, p_user_id, 'owner')
  on conflict (group_id, user_id) do nothing;

  if effective_cost > 0 then
    perform public.add_momenta_transaction(
      p_user_id,
      -effective_cost,
      'Group creation',
      'spent',
      new_group_id
    );
  end if;

  select coalesce(momenta_balance, 0)
  into new_balance
  from public.profiles
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'group_id', new_group_id,
    'new_balance', coalesce(new_balance, 0),
    'cost', effective_cost
  );
end;
$function$;
commit;
