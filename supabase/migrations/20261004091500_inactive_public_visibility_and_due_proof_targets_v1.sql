-- Keep ended public groups and promises out of unaffiliated discovery reads,
-- while preserving archive/history access for owners and existing members.
-- Quick check-in receives only the minimal currently-due proof authority.

begin;

create or replace function private.challenge_has_active_team_context_v1(
  p_challenge_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    not exists (
      select 1
      from public.team_challenges link
      where link.challenge_id = p_challenge_id
    )
    or exists (
      select 1
      from public.team_challenges link
      join public.teams team on team.id = link.group_id
      where link.challenge_id = p_challenge_id
        and team.status = 'active'
        and team.archived_at is null
        and (team.end_date is null or team.end_date >= current_date)
        and (
          team.end_date is not null
          or team.start_date is null
          or team.start_date + team.duration_days >= current_date
        )
    );
$$;

revoke all on function private.challenge_has_active_team_context_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.challenge_has_active_team_context_v1(uuid)
  to anon, authenticated, service_role;

drop policy if exists teams_select on public.teams;
create policy teams_select
on public.teams
for select
to public
using (
  (
    privacy = 'public'
    and status = 'active'
    and archived_at is null
    and (end_date is null or end_date >= current_date)
    and (
      end_date is not null
      or start_date is null
      or start_date + duration_days >= current_date
    )
  )
  or owner_id = (select auth.uid())
  or public.is_current_user_team_member(id)
);

drop policy if exists challenges_select on public.challenges;
create policy challenges_select
on public.challenges
for select
to public
using (
  (
    is_public
    and status = 'active'
    and completion_status = 'active'
    and coalesce(is_expired, false) = false
    and (end_date is null or end_date >= pg_catalog.now())
    and private.challenge_has_active_team_context_v1(id)
  )
  or creator_id = (select auth.uid())
  or exists (
    select 1
    from public.challenge_participants participant
    where participant.challenge_id = challenges.id
      and participant.user_id = (select auth.uid())
      and participant.status = 'active'
  )
  or exists (
    select 1
    from public.team_challenges link
    join public.team_members member
      on member.group_id = link.group_id
    join public.teams team
      on team.id = link.group_id
    where link.challenge_id = challenges.id
      and member.user_id = (select auth.uid())
      and (
        team.kind = 'saved'
        or (
          team.status = 'active'
          and team.archived_at is null
          and (
            team.end_date is null
            or team.end_date >= current_date
          )
          and challenges.status = 'active'
          and challenges.completion_status = 'active'
          and coalesce(challenges.is_expired, false) = false
          and (
            challenges.end_date is null
            or challenges.end_date >= pg_catalog.now()
          )
        )
      )
  )
);

create or replace function public.get_my_due_proof_targets_v1(
  p_timezone text
)
returns table (
  challenge_id uuid,
  verification_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_home jsonb;
begin
  if v_actor_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  v_home := public.get_today_home_v1(p_timezone);

  return query
  select
    nullif(obligation.item ->> 'challenge_id', '')::uuid,
    nullif(obligation.item ->> 'verification_type', '')::text
  from pg_catalog.jsonb_array_elements(
    coalesce(v_home -> 'obligations', '[]'::jsonb)
  ) with ordinality as obligation(item, position)
  where nullif(obligation.item ->> 'challenge_id', '') is not null
    and coalesce(obligation.item ->> 'proof_status', 'none') = 'none'
    and exists (
      select 1
      from public.challenge_participants participant
      join public.challenges challenge
        on challenge.id = participant.challenge_id
      where participant.challenge_id =
          nullif(obligation.item ->> 'challenge_id', '')::uuid
        and participant.user_id = v_actor_id
        and participant.status = 'active'
        and challenge.status = 'active'
        and challenge.completion_status = 'active'
        and coalesce(challenge.is_expired, false) = false
        and (
          challenge.start_date is null
          or challenge.start_date <= pg_catalog.now()
        )
        and (
          challenge.end_date is null
          or challenge.end_date >= pg_catalog.now()
        )
    )
    and (
      nullif(obligation.item ->> 'group_id', '') is null
      or exists (
        select 1
        from public.team_challenges link
        join public.teams team on team.id = link.group_id
        join public.team_members member on member.group_id = team.id
        where link.challenge_id =
            nullif(obligation.item ->> 'challenge_id', '')::uuid
          and team.id = nullif(obligation.item ->> 'group_id', '')::uuid
          and member.user_id = v_actor_id
          and team.status = 'active'
          and team.archived_at is null
          and (team.end_date is null or team.end_date >= current_date)
          and (
            team.end_date is not null
            or team.start_date is null
            or team.start_date + team.duration_days >= current_date
          )
      )
    )
  order by
    case when obligation.item ->> 'group_id' is null then 1 else 0 end,
    obligation.item ->> 'group_name' nulls last,
    obligation.item ->> 'challenge_title',
    obligation.position;
end;
$$;

revoke all on function public.get_my_due_proof_targets_v1(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_my_due_proof_targets_v1(text)
  to authenticated, service_role;

comment on function public.get_my_due_proof_targets_v1(text) is
  'Returns only active, enrolled, currently due proof target identifiers for the authenticated session.';

commit;
