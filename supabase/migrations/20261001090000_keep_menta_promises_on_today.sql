-- Keep confirmed personal Menta Check promises visible after onboarding.
-- No records are changed: bundled Home and legacy Today reads share this RPC.

create or replace function public.get_today_accountability_v2(p_timezone text)
returns table (
  challenge_id uuid,
  challenge_title text,
  verification_type text,
  start_date timestamptz,
  duration integer,
  group_id uuid,
  group_name text,
  is_solo boolean,
  current_streak integer,
  local_day date,
  proof_status text,
  submission_id uuid,
  correction_reason text,
  effective_timezone text,
  longest_streak integer,
  at_risk boolean,
  streak_outcome text,
  outcome_local_day date,
  previous_streak integer,
  resulting_streak integer,
  freeze_used boolean,
  freezes_remaining integer,
  days_since_accepted_check_in integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  return query
  with user_context as (
    select public.get_available_streak_freezes(v_user_id) as freeze_count
  ), group_obligations as (
    select
      ch.id as challenge_id,
      ch.title::text as challenge_title,
      ch.verification_type::text as verification_type,
      ch.start_date,
      ch.duration,
      team.id as group_id,
      team.name::text as group_name,
      false as is_solo,
      greatest(coalesce(cp.current_streak, 0), 0) as current_streak,
      cp.longest_streak,
      cp.at_risk,
      cp.last_check_in_local_date,
      ch.check_in_weekdays,
      timezone_context.effective_timezone,
      (pg_catalog.now() at time zone
        timezone_context.effective_timezone)::date as local_day
    from public.team_members membership
    join public.teams team on team.id = membership.group_id
    join public.team_challenges team_challenge
      on team_challenge.group_id = team.id
    join public.challenges ch on ch.id = team_challenge.challenge_id
    join public.challenge_participants cp
      on cp.challenge_id = ch.id
     and cp.user_id = v_user_id
     and coalesce(cp.status, 'active') = 'active'
    cross join lateral (
      select public.get_effective_streak_timezone(
        v_user_id,
        ch.id,
        p_timezone
      ) as effective_timezone
    ) timezone_context
    where membership.user_id = v_user_id
      and cp.joined_at <= pg_catalog.now()
      and coalesce(team.status, 'active') = 'active'
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= pg_catalog.now())
      and (ch.end_date is null or ch.end_date >= pg_catalog.now())
  ), solo_obligations as (
    select
      ch.id as challenge_id,
      ch.title::text as challenge_title,
      ch.verification_type::text as verification_type,
      ch.start_date,
      ch.duration,
      null::uuid as group_id,
      null::text as group_name,
      true as is_solo,
      greatest(coalesce(cp.current_streak, 0), 0) as current_streak,
      cp.longest_streak,
      cp.at_risk,
      cp.last_check_in_local_date,
      ch.check_in_weekdays,
      timezone_context.effective_timezone,
      (pg_catalog.now() at time zone
        timezone_context.effective_timezone)::date as local_day
    from public.challenge_participants cp
    join public.challenges ch on ch.id = cp.challenge_id
    cross join lateral (
      select public.get_effective_streak_timezone(
        v_user_id,
        ch.id,
        p_timezone
      ) as effective_timezone
    ) timezone_context
    where cp.user_id = v_user_id
      and coalesce(cp.status, 'active') = 'active'
      and cp.joined_at <= pg_catalog.now()
      -- Review authority is independent of participation. Menta Check turns
      -- self-review off, but the owner's daily proof is still due on Today.
      and (
        coalesce(ch.allow_self_review, false) = true
        or ch.review_mode = 'menta'
      )
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= pg_catalog.now())
      and (ch.end_date is null or ch.end_date >= pg_catalog.now())
      and not exists (
        select 1
        from public.team_challenges team_challenge
        where team_challenge.challenge_id = ch.id
      )
  ), obligations as (
    select * from group_obligations
    union all
    select * from solo_obligations
  )
  select
    obligation.challenge_id,
    obligation.challenge_title,
    obligation.verification_type,
    obligation.start_date,
    obligation.duration,
    obligation.group_id,
    obligation.group_name,
    obligation.is_solo,
    obligation.current_streak,
    obligation.local_day,
    coalesce(latest_submission.status, 'none')::text as proof_status,
    latest_submission.id as submission_id,
    latest_submission.review_notes as correction_reason,
    obligation.effective_timezone,
    greatest(coalesce(obligation.longest_streak, 0), 0),
    coalesce(obligation.at_risk, false),
    latest_outcome.outcome,
    latest_outcome.local_day,
    latest_outcome.previous_streak,
    latest_outcome.resulting_streak,
    coalesce(latest_outcome.freeze_used, false),
    user_context.freeze_count,
    case
      when obligation.last_check_in_local_date is null then null
      else greatest(
        obligation.local_day - obligation.last_check_in_local_date,
        0
      )
    end
  from obligations obligation
  cross join user_context
  left join lateral (
    select cs.id, cs.status, cs.review_notes, cs.submission_date
    from public.challenge_submissions cs
    where cs.challenge_id = obligation.challenge_id
      and cs.user_id = v_user_id
      and cs.local_day = obligation.local_day
      and cs.status in ('pending', 'approved', 'rejected')
    order by cs.submission_date desc nulls last, cs.id desc
    limit 1
  ) latest_submission on true
  left join lateral (
    select outcome_row.*
    from public.streak_day_outcomes outcome_row
    where outcome_row.challenge_id = obligation.challenge_id
      and outcome_row.user_id = v_user_id
    order by outcome_row.local_day desc, outcome_row.created_at desc
    limit 1
  ) latest_outcome on true
  -- A rest day has no proof due, unless an extension still carries an earlier
  -- scheduled day's proof into it.
  where private.is_check_in_day_v1(
      obligation.check_in_weekdays,
      obligation.local_day
    )
    or exists (
      select 1
      from public.power_up_usage usage
      where usage.user_id = v_user_id
        and usage.challenge_id = obligation.challenge_id
        and usage.proof_due_at > pg_catalog.now()
        and usage.obligation_local_day is not null
    )
  order by obligation.group_name nulls last, obligation.challenge_title;
end;
$$;
