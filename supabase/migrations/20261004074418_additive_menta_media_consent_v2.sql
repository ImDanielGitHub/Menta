-- Latest explicit v2 acknowledgement, independent of the mutable legacy receipt.
-- No backfill or eligibility cutover. V1 functions and checks remain unchanged.
create table private.menta_check_media_acknowledgements_v2 (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  acknowledgement_id uuid not null unique,
  policy_version integer not null check (policy_version = 2),
  acknowledged_at timestamptz not null,
  withdrawn_at timestamptz,
  source text not null
    check (source in ('onboarding', 'create', 'settings', 'intro', 'group'))
);

alter table private.menta_check_media_acknowledgements_v2 enable row level security;
alter table private.menta_check_media_acknowledgements_v2 force row level security;
revoke all on table private.menta_check_media_acknowledgements_v2
  from public, anon, authenticated, service_role;

-- Legacy withdrawal invalidates acknowledgement, but legacy acceptance cannot
-- create it or clear its revocation. Both paths lock legacy receipt before ack.
create function private.invalidate_menta_media_acknowledgement_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
  elsif new.withdrawn_at is not null or new.accepted_at is null then
    v_user_id := new.user_id;
  else
    return new;
  end if;

  update private.menta_check_media_acknowledgements_v2 acknowledgement
  set withdrawn_at = pg_catalog.clock_timestamp()
  where acknowledgement.user_id = v_user_id
    and acknowledgement.withdrawn_at is null;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.invalidate_menta_media_acknowledgement_v2()
  from public, anon, authenticated, service_role;

create trigger invalidate_menta_media_acknowledgement_v2
  after update of accepted_at, withdrawn_at or delete
  on private.menta_check_consents
  for each row execute function private.invalidate_menta_media_acknowledgement_v2();

create or replace function public.set_menta_check_consent_v2(
  p_accept boolean,
  p_source text,
  p_policy_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_acknowledgement_id uuid;
  v_acknowledged_at timestamptz;
  v_source text := case
    when p_source in ('onboarding', 'create', 'settings', 'intro', 'group')
      then p_source
    else 'settings'
  end;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;

  -- Withdrawal remains available regardless of the supplied policy version.
  if not coalesce(p_accept, false) then
    return public.set_menta_check_consent_v1(false, p_source);
  end if;
  if p_policy_version is distinct from 2 then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'CONSENT_RENEWAL_REQUIRED', 'consented', false
    );
  end if;

  insert into private.menta_check_consents (
    user_id, accepted_at, withdrawn_at, policy_version, source, updated_at
  ) values (
    v_user_id, pg_catalog.now(), null, 2, v_source, pg_catalog.now()
  )
  on conflict (user_id) do update set
    accepted_at = case
      when private.menta_check_consents.policy_version = 2
        and private.menta_check_consents.withdrawn_at is null
        and private.menta_check_consents.accepted_at is not null
      then private.menta_check_consents.accepted_at
      else pg_catalog.now()
    end,
    withdrawn_at = null,
    policy_version = 2,
    source = excluded.source,
    updated_at = pg_catalog.now();

  -- The preceding upsert holds the legacy row lock until this transaction ends.
  -- Always mint fresh explicit evidence, even if v1 retained policy_version=2.
  insert into private.menta_check_media_acknowledgements_v2 (
    user_id, acknowledgement_id, policy_version, acknowledged_at, withdrawn_at, source
  ) values (
    v_user_id, pg_catalog.gen_random_uuid(), 2, pg_catalog.clock_timestamp(), null, v_source
  )
  on conflict (user_id) do update set
    acknowledgement_id = excluded.acknowledgement_id,
    policy_version = 2,
    acknowledged_at = excluded.acknowledged_at,
    withdrawn_at = null,
    source = excluded.source
  returning acknowledgement_id, acknowledged_at
  into v_acknowledgement_id, v_acknowledged_at;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'consented', true,
    'policy_version', 2,
    'acknowledgement_id', v_acknowledgement_id,
    'acknowledged_at', v_acknowledged_at
  );
end;
$$;

revoke all on function public.set_menta_check_consent_v2(boolean, text, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.set_menta_check_consent_v2(boolean, text, integer)
  to authenticated;
