-- pg_timezone_names enumerates every zone and computes its current offset.
-- Profile reads need only exact name membership, so retain that allowlist in
-- an indexed private catalogue rather than materialising it on every read.
begin;

create table if not exists private.timezone_names_v1 (
  name text primary key
);

alter table private.timezone_names_v1 enable row level security;
alter table private.timezone_names_v1 force row level security;
revoke all on table private.timezone_names_v1
  from public, anon, authenticated, service_role;

create or replace function private.refresh_timezone_names_v1()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name_count integer;
begin
  -- Serialise maintenance calls. MVCC readers retain the complete old set
  -- until this transaction commits; they never observe a partially loaded set.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('private.timezone_names_v1', 0)
  );
  delete from private.timezone_names_v1;
  insert into private.timezone_names_v1 (name)
  select distinct zone.name
  from pg_catalog.pg_timezone_names zone;
  get diagnostics v_name_count = row_count;
  if v_name_count = 0 then
    raise exception 'TIMEZONE_CATALOGUE_EMPTY';
  end if;
  analyze private.timezone_names_v1;
  return v_name_count;
end;
$$;

revoke all on function private.refresh_timezone_names_v1()
  from public, anon, authenticated, service_role;
grant execute on function private.refresh_timezone_names_v1() to service_role;

comment on table private.timezone_names_v1 is
  'Exact pg_timezone_names name allowlist. No offsets or user data. Run private.refresh_timezone_names_v1() after PostgreSQL or tzdata updates and verify set equality with pg_catalog.pg_timezone_names before reopening traffic.';
comment on function private.refresh_timezone_names_v1() is
  'Service-only maintenance: atomically replace the timezone-name allowlist after PostgreSQL/tzdata updates; returns the loaded name count. Removes retired names as well as adding new names.';

select private.refresh_timezone_names_v1();

create or replace function public.get_profile_follow_through_v1(p_timezone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text := 'UTC';
  v_today date;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if exists (
    select 1
    from private.timezone_names_v1 zone
    where zone.name = nullif(pg_catalog.btrim(p_timezone), '')
  ) then
    v_timezone := pg_catalog.btrim(p_timezone);
  end if;
  v_today := (pg_catalog.now() at time zone v_timezone)::date;

  return (
    with days as (
      select (v_today - day_offset.value)::date as local_day
      from pg_catalog.generate_series(0, 6) day_offset(value)
    ), proof_counts as (
      select submission.local_day, pg_catalog.count(*)::integer as approved_proofs
      from public.challenge_submissions submission
      where submission.user_id = v_user_id
        and submission.status = 'approved'
        and submission.local_day between v_today - 6 and v_today
      group by submission.local_day
    ), outcomes as (
      select distinct on (outcome.local_day)
        outcome.local_day,
        outcome.outcome::text as outcome
      from public.streak_day_outcomes outcome
      where outcome.user_id = v_user_id
        and outcome.local_day between v_today - 6 and v_today
      order by outcome.local_day, outcome.created_at desc, outcome.id desc
    )
    select coalesce(
      pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'local_day', day.local_day,
          'approved_proofs', coalesce(proof.approved_proofs, 0),
          'outcome', outcome.outcome
        ) order by day.local_day
      ),
      '[]'::jsonb
    )
    from days day
    left join proof_counts proof on proof.local_day = day.local_day
    left join outcomes outcome on outcome.local_day = day.local_day
  );
end;
$$;

revoke all on function public.get_profile_follow_through_v1(text)
  from public, anon;
grant execute on function public.get_profile_follow_through_v1(text)
  to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
