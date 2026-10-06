-- LOCAL CANDIDATE ONLY. Not applied; requires root review, synthetic tests, and an additive CLI-created migration.
-- Uses cached live definitions; does not touch the already-applied quota helper.

CREATE OR REPLACE FUNCTION public.buy_menta_check_pass_v1(p_challenge_id uuid, p_auto_renew boolean, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_cost constant integer := 20;
  v_existing jsonb;
  v_challenge public.challenges%rowtype;
  v_pass private.menta_check_passes%rowtype;
  v_new_balance integer;
  v_response jsonb;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;
  if p_client_event_id is null then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'EVENT_REQUIRED');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('menta-check-pass:' || v_user_id::text, 0)
  );

  select receipt.response into v_existing
  from private.menta_check_receipts receipt
  where receipt.user_id = v_user_id
    and receipt.client_event_id = p_client_event_id;
  if found then
    return v_existing;
  end if;

  select challenge.* into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id
  for update;
  if not found or v_challenge.creator_id is distinct from v_user_id then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_ALLOWED');
  end if;

  -- Starting paid/automated review cannot revive an ended promise.
  -- Existing purchase receipts above remain idempotent and never charge again.
  if true and (
    coalesce(v_challenge.status, 'active') <> 'active'
    or coalesce(v_challenge.completion_status, 'active') <> 'active'
    or coalesce(v_challenge.is_expired, false)
    or (v_challenge.end_date is not null and v_challenge.end_date < pg_catalog.now())
  ) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'PROMISE_ENDED');
  end if;

  if not private.menta_check_has_consent_v1(v_user_id) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'CONSENT_REQUIRED');
  end if;
  if not private.menta_check_promise_is_solo_v1(p_challenge_id, v_user_id) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_SOLO');
  end if;
  if public.user_is_pro(v_user_id) then
    return public.set_promise_menta_check_v1(p_challenge_id, 'menta', null);
  end if;

  select pass.* into v_pass
  from private.menta_check_passes pass
  where pass.user_id = v_user_id and pass.challenge_id = p_challenge_id
  for update;

  if found and v_pass.active_until > pg_catalog.now() then
    update private.menta_check_passes pass
    set auto_renew = coalesce(p_auto_renew, true), updated_at = pg_catalog.now()
    where pass.user_id = v_user_id and pass.challenge_id = p_challenge_id;
    v_response := pg_catalog.jsonb_build_object(
      'success', true, 'code', 'ALREADY_ACTIVE',
      'active_until', v_pass.active_until,
      'auto_renew', coalesce(p_auto_renew, true)
    );
  else
    update public.profiles profile
    set
      momenta_balance = coalesce(profile.momenta_balance, 0) - v_cost,
      updated_at = pg_catalog.now()
    where profile.id = v_user_id
      and coalesce(profile.momenta_balance, 0) >= v_cost
    returning profile.momenta_balance into v_new_balance;

    if v_new_balance is null then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'INSUFFICIENT_BALANCE', 'cost', v_cost
      );
    end if;

    insert into public.wallet_transactions (
      user_id, amount, reason, source_uuid, transaction_type, description,
      reference_id, created_at
    ) values (
      v_user_id, -v_cost, 'menta_check_pass', p_client_event_id, 'spent',
      'Menta Check for one promise, one week', p_challenge_id, pg_catalog.now()
    );

    insert into private.menta_check_passes (
      user_id, challenge_id, active_until, auto_renew
    ) values (
      v_user_id, p_challenge_id, pg_catalog.now() + interval '7 days',
      coalesce(p_auto_renew, true)
    )
    on conflict (user_id, challenge_id) do update set
      active_until = pg_catalog.now() + interval '7 days',
      auto_renew = excluded.auto_renew,
      updated_at = pg_catalog.now();

    v_response := pg_catalog.jsonb_build_object(
      'success', true, 'code', 'BOUGHT',
      'active_until', pg_catalog.now() + interval '7 days',
      'auto_renew', coalesce(p_auto_renew, true),
      'new_balance', v_new_balance,
      'cost', v_cost
    );
  end if;

  if not coalesce((public.set_promise_menta_check_v1(p_challenge_id, 'menta', null) ->> 'success')::boolean, false) then
    raise exception 'MENTA_CHECK_ACTIVATION_FAILED';
  end if;

  insert into private.menta_check_receipts (
    user_id, client_event_id, operation, response
  ) values (v_user_id, p_client_event_id, 'buy_pass', v_response);

  return v_response;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_promise_menta_check_v1(p_challenge_id uuid, p_mode text, p_backup_hours integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.challenges%rowtype;
  v_backup integer := case
    when p_backup_hours in (12, 24, 48) then p_backup_hours
    else null
  end;
  v_solo boolean;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;

  if p_mode not in ('menta', 'self', 'people') then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'INVALID_MODE');
  end if;

  select challenge.* into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id
  for update;

  if not found or v_challenge.creator_id is distinct from v_user_id then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_ALLOWED');
  end if;

  -- Starting paid/automated review cannot revive an ended promise.
  -- Existing purchase receipts above remain idempotent and never charge again.
  if (p_mode = 'menta' or (p_mode = 'people' and v_backup is not null)) and (
    coalesce(v_challenge.status, 'active') <> 'active'
    or coalesce(v_challenge.completion_status, 'active') <> 'active'
    or coalesce(v_challenge.is_expired, false)
    or (v_challenge.end_date is not null and v_challenge.end_date < pg_catalog.now())
  ) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'PROMISE_ENDED');
  end if;

  v_solo := private.menta_check_promise_is_solo_v1(p_challenge_id, v_user_id);

  if p_mode = 'menta' then
    if not v_solo then
      return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_SOLO');
    end if;
    if not private.menta_check_has_consent_v1(v_user_id) then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'CONSENT_REQUIRED'
      );
    end if;
    if private.menta_check_access_v1(v_user_id, p_challenge_id, false) is null then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'ACCESS_REQUIRED'
      );
    end if;
  elsif p_mode = 'self' and not v_solo then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_SOLO');
  elsif p_mode = 'people' and v_backup is not null
    and not private.menta_check_has_consent_v1(v_user_id)
  then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'CONSENT_REQUIRED'
    );
  end if;

  perform pg_catalog.set_config('menta.check_write', 'on', true);
  update public.challenges challenge
  set
    review_mode = p_mode,
    allow_self_review = (p_mode = 'self'),
    menta_backup_hours = case when p_mode = 'people' then v_backup else null end,
    updated_at = pg_catalog.now()
  where challenge.id = p_challenge_id;
  perform pg_catalog.set_config('menta.check_write', 'off', true);

  return pg_catalog.jsonb_build_object(
    'success', true,
    'review_mode', p_mode,
    'backup_hours', case when p_mode = 'people' then v_backup else null end
  );
end;
$function$;
