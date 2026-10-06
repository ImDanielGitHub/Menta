-- Enforce saved-group cooldown before any legacy-wrapper creation or debit.
begin;

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
  if exists (
    select 1 from public.team_members member
    join public.teams team on team.id = member.group_id
    where member.user_id = p_user_id and team.kind = 'saved'
      and team.cooldown_until is not null
      and team.cooldown_until > pg_catalog.now()
  ) then
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

revoke all on function public.create_group_with_payment(uuid,text,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.create_group_with_payment(uuid,text,text,integer,integer,text) to service_role;
commit;
