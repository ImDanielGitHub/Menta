-- You tab (Paper 19 / Y01–Y02): the current calendar month of kept, frozen
-- and missed days, plus the all-time count of days with approved proof.
-- Read-only and scoped to the signed-in owner, like
-- get_profile_follow_through_v1.
begin;

create or replace function public.get_profile_month_v1(p_timezone text)
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
  v_month_start date;
  v_month_end date;
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
  v_month_start := pg_catalog.date_trunc('month', v_today)::date;
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  return pg_catalog.jsonb_build_object(
    'today', v_today,
    'days_kept', (
      select pg_catalog.count(distinct submission.local_day)::integer
      from public.challenge_submissions submission
      where submission.user_id = v_user_id
        and submission.status = 'approved'
        and submission.local_day is not null
    ),
    'days', (
      with days as (
        select day_value::date as local_day
        from pg_catalog.generate_series(
          v_month_start, v_month_end, interval '1 day'
        ) day_series(day_value)
      ), proof_counts as (
        select submission.local_day,
          pg_catalog.count(*)::integer as approved_proofs
        from public.challenge_submissions submission
        where submission.user_id = v_user_id
          and submission.status = 'approved'
          and submission.local_day between v_month_start and v_today
        group by submission.local_day
      ), outcomes as (
        select distinct on (outcome.local_day)
          outcome.local_day,
          outcome.outcome::text as outcome
        from public.streak_day_outcomes outcome
        where outcome.user_id = v_user_id
          and outcome.local_day between v_month_start and v_today
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
    )
  );
end;
$$;

revoke all on function public.get_profile_month_v1(text)
  from public, anon;
grant execute on function public.get_profile_month_v1(text)
  to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
