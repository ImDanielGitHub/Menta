-- Weekday check-in schedules.
--
-- A promise may count only some weekdays (ISO 1 = Monday ... 7 = Sunday).
-- NULL keeps the existing every-day behaviour, so existing promises and older
-- clients are unchanged. Rest days are neither kept nor missed: they are
-- skipped when misses are recorded, streaks treat the previous scheduled day
-- as "yesterday", and Today, reminders and group status ignore them.

alter table public.challenges
  add column if not exists check_in_weekdays smallint[];

alter table public.challenges
  drop constraint if exists challenges_check_in_weekdays_valid;

alter table public.challenges
  add constraint challenges_check_in_weekdays_valid check (
    check_in_weekdays is null
    or (
      pg_catalog.cardinality(check_in_weekdays) between 1 and 6
      and check_in_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    )
  );

comment on column public.challenges.check_in_weekdays is
  'ISO weekdays that need proof (1 = Monday). NULL means every day.';

-- A schedule changes which days count as missed, so clients must not edit it
-- after creation. Only server functions running as their owner may set it.
create or replace function private.guard_check_in_weekdays_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.check_in_weekdays is distinct from old.check_in_weekdays
    and current_user in ('anon', 'authenticated')
  then
    raise exception 'CHECK_IN_WEEKDAYS_READ_ONLY' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_check_in_weekdays_v1()
  from public, anon, authenticated;

drop trigger if exists guard_check_in_weekdays on public.challenges;
create trigger guard_check_in_weekdays
  before update of check_in_weekdays on public.challenges
  for each row
  execute function private.guard_check_in_weekdays_v1();

create or replace function private.is_check_in_day_v1(
  p_weekdays smallint[],
  p_day date
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_weekdays is null
    or p_day is null
    or pg_catalog.date_part('isodow', p_day)::smallint = any (p_weekdays);
$$;

create or replace function private.previous_check_in_day_v1(
  p_weekdays smallint[],
  p_day date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case
    when p_weekdays is null then p_day - 1
    else (
      select pg_catalog.max(candidate::date)
      from pg_catalog.generate_series(
        (p_day - 7)::timestamp,
        (p_day - 1)::timestamp,
        interval '1 day'
      ) as candidate
      where pg_catalog.date_part('isodow', candidate)::smallint = any (p_weekdays)
    )
  end;
$$;

create or replace function private.next_check_in_day_v1(
  p_weekdays smallint[],
  p_day date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case
    when p_weekdays is null then p_day + 1
    else (
      select pg_catalog.min(candidate::date)
      from pg_catalog.generate_series(
        (p_day + 1)::timestamp,
        (p_day + 7)::timestamp,
        interval '1 day'
      ) as candidate
      where pg_catalog.date_part('isodow', candidate)::smallint = any (p_weekdays)
    )
  end;
$$;

-- Scheduled days strictly between two local days.
create or replace function private.scheduled_days_between_v1(
  p_weekdays smallint[],
  p_from_day date,
  p_to_day date
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from_day is null or p_to_day is null or p_to_day - p_from_day <= 1
      then 0
    when p_weekdays is null then p_to_day - p_from_day - 1
    else (
      select pg_catalog.count(*)::integer
      from pg_catalog.generate_series(
        (p_from_day + 1)::timestamp,
        (p_to_day - 1)::timestamp,
        interval '1 day'
      ) as candidate
      where pg_catalog.date_part('isodow', candidate)::smallint = any (p_weekdays)
    )
  end;
$$;

-- Canonical form: sorted, distinct ISO weekdays, NULL for every day.
create or replace function private.normalize_check_in_weekdays_v1(
  p_weekdays smallint[]
)
returns smallint[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_days smallint[];
begin
  if p_weekdays is null then
    return null;
  end if;

  select pg_catalog.array_agg(distinct day_value order by day_value)
  into v_days
  from pg_catalog.unnest(p_weekdays) as day_value
  where day_value is not null;

  if v_days is null
    or not (v_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[])
  then
    raise exception 'INVALID_CHECK_IN_WEEKDAYS' using errcode = '22023';
  end if;

  if pg_catalog.cardinality(v_days) = 7 then
    return null;
  end if;

  return v_days;
end;
$$;

revoke all on function private.is_check_in_day_v1(smallint[], date)
  from public, anon, authenticated;
revoke all on function private.previous_check_in_day_v1(smallint[], date)
  from public, anon, authenticated;
revoke all on function private.next_check_in_day_v1(smallint[], date)
  from public, anon, authenticated;
revoke all on function private.scheduled_days_between_v1(smallint[], date, date)
  from public, anon, authenticated;
revoke all on function private.normalize_check_in_weekdays_v1(smallint[])
  from public, anon, authenticated;

create or replace function public.resolve_streak_day_outcomes(
  p_user_id uuid,
  p_challenge_id uuid,
  p_through_local_day date default null,
  p_effective_tz text default null
)
returns table (
  resolved_count integer,
  missed_count integer,
  protected_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.challenge_participants%rowtype;
  v_challenge public.challenges%rowtype;
  v_effective_tz text;
  v_current_local_day date;
  v_start_day date;
  v_through_day date;
  v_challenge_end_day date;
  v_day date;
  v_previous_streak integer;
  v_resulting_streak integer;
  v_freeze_result jsonb;
  v_freeze_used boolean;
  v_freezes_remaining integer;
  v_resolved_count integer := 0;
  v_missed_count integer := 0;
  v_protected_count integer := 0;
begin
  if p_user_id is null or p_challenge_id is null then
    return query select 0, 0, 0;
    return;
  end if;

  select c.*
  into v_challenge
  from public.challenges c
  where c.id = p_challenge_id
    and coalesce(c.status, 'active') = 'active'
    and coalesce(c.completion_status, 'active') = 'active'
    and coalesce(c.is_expired, false) = false;

  if not found
    or coalesce(v_challenge.verification_frequency, '') <> 'daily'
  then
    return query select 0, 0, 0;
    return;
  end if;

  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.user_id = p_user_id
    and cp.challenge_id = p_challenge_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return query select 0, 0, 0;
    return;
  end if;

  if v_participant.streak_outcome_tracking_started_at is null then
    update public.challenge_participants cp
    set
      streak_outcome_tracking_started_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.now()
    where cp.id = v_participant.id
    returning cp.* into v_participant;

    return query select 0, 0, 0;
    return;
  end if;

  v_effective_tz := public.get_effective_streak_timezone(
    p_user_id,
    p_challenge_id,
    p_effective_tz
  );
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names timezone_name
    where timezone_name.name = v_effective_tz
  ) then
    v_effective_tz := 'UTC';
  end if;
  v_current_local_day := (pg_catalog.now() at time zone v_effective_tz)::date;
  v_through_day := least(
    coalesce(p_through_local_day, v_current_local_day - 1),
    v_current_local_day - 1
  );
  -- Each boundary day can be partial. Start with the first full local day
  -- after migration tracking, participant join, and challenge start.
  v_start_day := greatest(
    private.first_full_streak_local_day_v1(
      v_participant.streak_outcome_tracking_started_at,
      v_effective_tz
    ),
    private.first_full_streak_local_day_v1(
      v_participant.joined_at,
      v_effective_tz
    ),
    coalesce(
      private.first_full_streak_local_day_v1(
        v_challenge.start_date,
        v_effective_tz
      ),
      '-infinity'::date
    )
  );
  -- The calendar day containing an exact end instant can be partial. Resolve
  -- only through the last full local day before it.
  v_challenge_end_day := coalesce(
    (v_challenge.end_date at time zone v_effective_tz)::date - 1,
    'infinity'::date
  );
  v_through_day := least(v_through_day, v_challenge_end_day);

  if v_through_day < v_start_day then
    return query select 0, 0, 0;
    return;
  end if;

  -- Freeze inventory belongs to the user, not one promise. Serialise all
  -- promise-day resolutions for this user before reading or consuming it.
  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  ) then
    raise exception 'STREAK_RESOLUTION_BUSY';
  end if;

  for v_day in
    select day_value::date
    from pg_catalog.generate_series(
      v_start_day::timestamp,
      v_through_day::timestamp,
      interval '1 day'
    ) as day_value
    order by day_value
  loop
    -- Rest days in a weekday schedule are neither kept nor missed.
    if not private.is_check_in_day_v1(v_challenge.check_in_weekdays, v_day) then
      continue;
    end if;

    if exists (
      select 1
      from public.streak_day_outcomes outcome_row
      where outcome_row.user_id = p_user_id
        and outcome_row.challenge_id = p_challenge_id
        and outcome_row.local_day = v_day
    ) then
      continue;
    end if;

    -- A pending proof is unresolved authority. Do not call it a miss and do
    -- not resolve later days out of order.
    if exists (
      select 1
      from public.challenge_submissions cs
      where cs.user_id = p_user_id
        and cs.challenge_id = p_challenge_id
        and cs.local_day = v_day
        and cs.status = 'pending'
    ) then
      exit;
    end if;

    if exists (
      select 1
      from public.challenge_submissions cs
      where cs.user_id = p_user_id
        and cs.challenge_id = p_challenge_id
        and cs.local_day = v_day
        and cs.status = 'approved'
    ) then
      -- The approved-proof helper applies accepted days. If that day is not
      -- reflected yet, stop rather than resolving later days against stale
      -- streak state.
      if v_participant.last_check_in_local_date is null
        or v_participant.last_check_in_local_date < v_day
      then
        exit;
      end if;
      continue;
    end if;

    v_previous_streak := greatest(
      coalesce(v_participant.current_streak, 0),
      0
    );
    v_freezes_remaining := public.get_available_streak_freezes(p_user_id);
    v_freeze_used := false;

    -- Only the first missed day after an accepted check-in is freeze-eligible.
    -- A second consecutive absence resets the streak even when more inventory
    -- exists, matching the existing gap contract.
    if v_previous_streak > 0
      and v_participant.last_check_in_local_date >= private.previous_check_in_day_v1(
        v_challenge.check_in_weekdays,
        v_day
      )
      and v_participant.last_check_in_local_date < v_day
      and v_freezes_remaining > 0
    then
      v_freeze_result := public.use_streak_freeze_for_user(
        p_user_id,
        p_challenge_id
      );
      v_freeze_used := coalesce(
        (v_freeze_result ->> 'used')::boolean,
        false
      );
      v_freezes_remaining := coalesce(
        (v_freeze_result ->> 'remaining')::integer,
        public.get_available_streak_freezes(p_user_id)
      );
    end if;

    if v_freeze_used then
      v_resulting_streak := v_previous_streak;

      insert into public.streak_freeze_log (
        user_id,
        challenge_id,
        used_at,
        freeze_type,
        days_saved
      )
      values (
        p_user_id,
        p_challenge_id,
        pg_catalog.now() at time zone 'UTC',
        'auto',
        1
      );

      insert into public.streak_day_outcomes (
        user_id,
        challenge_id,
        local_day,
        effective_timezone,
        outcome,
        previous_streak,
        resulting_streak,
        freeze_used,
        freezes_remaining
      )
      values (
        p_user_id,
        p_challenge_id,
        v_day,
        v_effective_tz,
        'protected',
        v_previous_streak,
        v_resulting_streak,
        true,
        v_freezes_remaining
      );

      update public.challenge_participants cp
      set
        current_streak = v_resulting_streak,
        streak_count = v_resulting_streak,
        streak_freezes_remaining = v_freezes_remaining,
        last_freeze_used = pg_catalog.now(),
        at_risk = false,
        updated_at = pg_catalog.now()
      where cp.id = v_participant.id;

      v_protected_count := v_protected_count + 1;
    else
      v_resulting_streak := 0;
      v_freezes_remaining := public.get_available_streak_freezes(p_user_id);

      insert into public.streak_day_outcomes (
        user_id,
        challenge_id,
        local_day,
        effective_timezone,
        outcome,
        previous_streak,
        resulting_streak,
        freeze_used,
        freezes_remaining
      )
      values (
        p_user_id,
        p_challenge_id,
        v_day,
        v_effective_tz,
        'missed',
        v_previous_streak,
        v_resulting_streak,
        false,
        v_freezes_remaining
      );

      update public.challenge_participants cp
      set
        current_streak = 0,
        streak_count = 0,
        streak_freezes_remaining = v_freezes_remaining,
        at_risk = false,
        updated_at = pg_catalog.now()
      where cp.id = v_participant.id;

      if v_previous_streak > 0 then
        v_missed_count := v_missed_count + 1;
      end if;
    end if;

    v_resolved_count := v_resolved_count + 1;
    v_participant.current_streak := v_resulting_streak;
    v_participant.streak_count := v_resulting_streak;
    v_participant.streak_freezes_remaining := v_freezes_remaining;
  end loop;

  return query
  select v_resolved_count, v_missed_count, v_protected_count;
end;
$$;

create or replace function public.apply_approved_streak_checkin(
  p_user_id uuid,
  p_challenge_id uuid,
  p_local_day date,
  p_effective_tz text,
  p_submission_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.challenge_participants%rowtype;
  v_challenge public.challenges%rowtype;
  v_authority_submission public.challenge_submissions%rowtype;
  v_existing_application public.streak_checkin_applications%rowtype;
  v_previous_outcome public.streak_day_outcomes%rowtype;
  v_effective_tz text;
  v_new_streak integer;
  v_longest_streak integer;
  v_gap_days integer := 0;
  v_day_status text := 'done';
  v_freeze_result jsonb := pg_catalog.jsonb_build_object(
    'used', false,
    'remaining', 0
  );
  v_freeze_used boolean := false;
  v_freezes_remaining integer := 0;
  v_milestone_days integer;
  v_milestone_reward integer;
  v_milestone_result jsonb := 'null'::jsonb;
  v_external_reference text;
  v_transaction_id bigint;
  v_application_id uuid;
  v_cutover_assessment text;
  v_first_full_day date;
begin
  if p_user_id is null
    or p_challenge_id is null
    or p_local_day is null
    or p_submission_id is null
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_APPROVED_CHECKIN'
    );
  end if;

  select cs.*
  into v_authority_submission
  from public.challenge_submissions cs
  where cs.id = p_submission_id
    and cs.user_id = p_user_id
    and cs.challenge_id = p_challenge_id
    and cs.local_day = p_local_day
    and cs.status = 'approved';
  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'APPROVED_SUBMISSION_AUTHORITY_REQUIRED'
    );
  end if;

  v_effective_tz := public.get_effective_streak_timezone(
    p_user_id,
    p_challenge_id,
    p_effective_tz
  );

  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.challenge_id = p_challenge_id
    and cp.user_id = p_user_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PARTICIPANT_NOT_FOUND'
    );
  end if;

  if v_participant.streak_outcome_tracking_started_at is null then
    update public.challenge_participants cp
    set
      streak_outcome_tracking_started_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.now()
    where cp.challenge_id = p_challenge_id
      and cp.user_id = p_user_id
    returning cp.* into v_participant;
  end if;

  select challenge_row.*
  into v_challenge
  from public.challenges challenge_row
  where challenge_row.id = p_challenge_id;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CHALLENGE_NOT_FOUND'
    );
  end if;

  v_first_full_day := greatest(
    private.first_full_streak_local_day_v1(
      v_participant.streak_outcome_tracking_started_at,
      v_effective_tz
    ),
    private.first_full_streak_local_day_v1(
      v_participant.joined_at,
      v_effective_tz
    ),
    coalesce(
      private.first_full_streak_local_day_v1(
        v_challenge.start_date,
        v_effective_tz
      ),
      '-infinity'::date
    )
  );

  select application_row.*
  into v_existing_application
  from public.streak_checkin_applications application_row
  where application_row.submission_id = p_submission_id;

  if found then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'applied', false,
      'newStreak', v_existing_application.resulting_streak,
      'longestStreak', greatest(
        coalesce(v_participant.longest_streak, 0),
        v_existing_application.resulting_streak
      ),
      'freezeUsed', v_existing_application.freeze_used,
      'freezesRemaining', v_existing_application.freezes_remaining,
      'dayStatus', 'already_applied',
      'milestone', null
    );
  end if;

  -- Do not calculate a new gap across a real peer approval that predates the
  -- prospective cursor. Per-participant maintenance anchors it first.
  select candidate.assessment_status
  into v_cutover_assessment
  from private.streak_cutover_anchor_candidate(
    p_user_id,
    p_challenge_id,
    p_submission_id
  ) candidate;

  if v_cutover_assessment is distinct from 'none' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CUTOVER_ANCHOR_REQUIRED',
      'assessment', v_cutover_assessment
    );
  end if;

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'STREAK_RESOLUTION_BUSY'
    );
  end if;

  perform 1
  from public.resolve_streak_day_outcomes(
    p_user_id,
    p_challenge_id,
    p_local_day - 1,
    v_effective_tz
  );

  -- The resolver can advance or reset this participant. Reload the locked row
  -- before calculating the accepted day and recording its receipt.
  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.challenge_id = p_challenge_id
    and cp.user_id = p_user_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PARTICIPANT_NOT_FOUND'
    );
  end if;

  select cs.*
  into v_authority_submission
  from public.challenge_submissions cs
  where cs.id = p_submission_id
    and cs.user_id = p_user_id
    and cs.challenge_id = p_challenge_id
    and cs.local_day = p_local_day
    and cs.status = 'approved'
  for share;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'APPROVED_SUBMISSION_AUTHORITY_REQUIRED'
    );
  end if;

  v_freezes_remaining := public.get_available_streak_freezes(p_user_id);

  if v_participant.last_check_in_local_date is not null
    and v_participant.last_check_in_local_date >= p_local_day
  then
    insert into public.streak_checkin_applications (
      user_id,
      challenge_id,
      local_day,
      submission_id,
      application_type,
      effective_timezone,
      previous_streak,
      resulting_streak,
      freeze_used,
      freezes_remaining,
      day_status
    )
    values (
      p_user_id,
      p_challenge_id,
      p_local_day,
      p_submission_id,
      'accepted_horizon_covered',
      v_effective_tz,
      greatest(coalesce(v_participant.current_streak, 0), 0),
      greatest(coalesce(v_participant.current_streak, 0), 0),
      false,
      v_freezes_remaining,
      'accepted_horizon_covered'
    )
    on conflict do nothing;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'applied', false,
      'newStreak', coalesce(v_participant.current_streak, 0),
      'longestStreak', greatest(
        coalesce(v_participant.longest_streak, 0),
        coalesce(v_participant.current_streak, 0)
      ),
      'freezeUsed', false,
      'freezesRemaining', v_freezes_remaining,
      'dayStatus', 'already_applied',
      'milestone', null
    );
  end if;

  select outcome_row.*
  into v_previous_outcome
  from public.streak_day_outcomes outcome_row
  where outcome_row.user_id = p_user_id
    and outcome_row.challenge_id = p_challenge_id
    and outcome_row.local_day = private.previous_check_in_day_v1(
      v_challenge.check_in_weekdays,
      p_local_day
    );

  v_new_streak := coalesce(v_participant.current_streak, 0);
  v_longest_streak := coalesce(v_participant.longest_streak, 0);

  if v_previous_outcome.outcome = 'protected' then
    v_new_streak := greatest(v_new_streak, 0) + 1;
    v_freeze_used := true;
    v_freezes_remaining := v_previous_outcome.freezes_remaining;
    v_day_status := 'freeze_used';
  elsif v_previous_outcome.outcome = 'missed' then
    v_new_streak := 1;
    v_day_status := 'missed';
  elsif p_local_day <= v_first_full_day then
    -- There is no complete, prospectively governed day before this proof.
    -- Continue the accepted aggregate without inventing a historical miss.
    v_new_streak := greatest(v_new_streak, 0) + 1;
  elsif v_participant.last_check_in_local_date is null then
    v_new_streak := case when v_new_streak > 0 then v_new_streak + 1 else 1 end;
  else
    -- Count scheduled days, so rest days never break a weekday streak. With
    -- no schedule this equals the calendar gap.
    v_gap_days := case
      when p_local_day <= v_participant.last_check_in_local_date
        then p_local_day - v_participant.last_check_in_local_date
      else private.scheduled_days_between_v1(
        v_challenge.check_in_weekdays,
        v_participant.last_check_in_local_date,
        p_local_day
      ) + 1
    end;

    if v_gap_days <= 0 then
      null;
    elsif v_gap_days = 1 then
      v_new_streak := v_new_streak + 1;
    elsif v_gap_days = 2 then
      -- Preserve the pre-ledger compatibility path when the missed day is
      -- earlier than this participant's prospective tracking boundary.
      v_freeze_result := public.use_streak_freeze_for_user(
        p_user_id,
        p_challenge_id
      );
      v_freeze_used := coalesce(
        (v_freeze_result ->> 'used')::boolean,
        false
      );
      v_freezes_remaining := coalesce(
        (v_freeze_result ->> 'remaining')::integer,
        0
      );

      if v_freeze_used then
        insert into public.streak_freeze_log (
          user_id,
          challenge_id,
          used_at,
          freeze_type,
          days_saved
        )
        values (
          p_user_id,
          p_challenge_id,
          pg_catalog.now() at time zone 'UTC',
          'auto',
          1
        );

        v_new_streak := v_new_streak + 1;
        v_day_status := 'freeze_used';
      else
        v_new_streak := 1;
        v_day_status := 'missed';
      end if;
    else
      v_new_streak := 1;
      v_day_status := 'missed';
    end if;
  end if;

  v_longest_streak := greatest(v_longest_streak, v_new_streak);
  v_freezes_remaining := public.get_available_streak_freezes(p_user_id);

  update public.challenge_participants cp
  set
    current_streak = v_new_streak,
    longest_streak = greatest(
      coalesce(cp.longest_streak, 0),
      v_new_streak
    ),
    streak_count = v_new_streak,
    last_check_in_local_date = p_local_day,
    last_check_in = p_local_day,
    last_submission_date = v_authority_submission.submission_date,
    last_check_in_tz = v_effective_tz,
    at_risk = false,
    streak_freezes_remaining = v_freezes_remaining,
    last_freeze_used = case
      when v_freeze_used then pg_catalog.now()
      else cp.last_freeze_used
    end,
    updated_at = pg_catalog.now()
  where cp.challenge_id = p_challenge_id
    and cp.user_id = p_user_id;

  insert into public.streak_checkin_applications (
    user_id,
    challenge_id,
    local_day,
    submission_id,
    application_type,
    effective_timezone,
    previous_streak,
    resulting_streak,
    freeze_used,
    freezes_remaining,
    day_status
  )
  values (
    p_user_id,
    p_challenge_id,
    p_local_day,
    p_submission_id,
    'accepted',
    v_effective_tz,
    greatest(coalesce(v_participant.current_streak, 0), 0),
    v_new_streak,
    v_freeze_used,
    v_freezes_remaining,
    v_day_status
  )
  on conflict (user_id, challenge_id, local_day) do nothing
  returning id into v_application_id;

  if v_application_id is null then
    raise exception 'STREAK_APPLICATION_RECEIPT_CONFLICT';
  end if;

  select milestone.days, milestone.reward
  into v_milestone_days, v_milestone_reward
  from (
    values
      (3, 25),
      (7, 50),
      (14, 100),
      (30, 250),
      (50, 500),
      (100, 1000)
  ) as milestone(days, reward)
  where milestone.days > coalesce(v_participant.milestone_reached, 0)
    and v_new_streak >= milestone.days
  order by milestone.days
  limit 1;

  if v_milestone_days is not null then
    v_external_reference := pg_catalog.concat(
      'streak_milestone:',
      p_challenge_id::text,
      ':',
      p_user_id::text,
      ':',
      v_milestone_days::text
    );

    insert into public.wallet_transactions (
      user_id,
      amount,
      reason,
      source_uuid,
      transaction_type,
      description,
      reference_id,
      external_reference_id,
      created_at
    )
    values (
      p_user_id,
      v_milestone_reward,
      v_milestone_days::text || '-day streak milestone',
      p_submission_id,
      'earned',
      v_milestone_days::text || '-day streak milestone',
      p_submission_id,
      v_external_reference,
      pg_catalog.now()
    )
    on conflict (external_reference_id)
      where external_reference_id is not null
    do nothing
    returning id into v_transaction_id;

    if v_transaction_id is not null then
      update public.profiles profile_row
      set
        momenta_balance = coalesce(profile_row.momenta_balance, 0)
          + v_milestone_reward,
        updated_at = pg_catalog.now()
      where profile_row.id = p_user_id;

      if not found then
        raise exception 'MILESTONE_PROFILE_NOT_FOUND';
      end if;
    end if;

    update public.challenge_participants cp
    set
      milestone_reached = greatest(
        coalesce(cp.milestone_reached, 0),
        v_milestone_days
      ),
      updated_at = pg_catalog.now()
    where cp.challenge_id = p_challenge_id
      and cp.user_id = p_user_id;

    if v_transaction_id is not null then
      v_milestone_result := pg_catalog.jsonb_build_object(
        'reached', true,
        'milestone', v_milestone_days,
        'reward', v_milestone_reward,
        'rewardGranted', true
      );
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'applied', true,
    'newStreak', v_new_streak,
    'longestStreak', v_longest_streak,
    'freezeUsed', v_freeze_used,
    'freezesRemaining', v_freezes_remaining,
    'dayStatus', v_day_status,
    'milestone', v_milestone_result
  );
end;
$$;

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
      and coalesce(ch.allow_self_review, false) = true
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

create or replace function public.get_today_home_v1(p_timezone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_obligations jsonb := '[]'::jsonb;
  v_reviews jsonb := '[]'::jsonb;
  v_group_risks jsonb := '[]'::jsonb;
  v_recent_media jsonb := '[]'::jsonb;
  v_rest_days jsonb := '[]'::jsonb;
  v_group_id uuid;
  v_risk jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  select coalesce(pg_catalog.jsonb_agg(
    pg_catalog.to_jsonb(obligation) || case
      when extension.obligation_local_day is null then '{}'::jsonb
      else pg_catalog.jsonb_build_object(
        'local_day', extension.obligation_local_day,
        'proof_status', coalesce(proof.status, 'none'),
        'submission_id', proof.id,
        'correction_reason', proof.review_notes,
        'extension_local_day', extension.obligation_local_day,
        'extension_proof_due_at', extension.proof_due_at,
        'extension_effective_timezone', extension.effective_timezone
      ) end
  ), '[]'::jsonb) into v_obligations
  from public.get_today_accountability_v2(p_timezone) obligation
  left join lateral (
    select usage.obligation_local_day, usage.proof_due_at, usage.effective_timezone
    from public.power_up_usage usage
    where usage.user_id = v_user_id
      and usage.challenge_id = obligation.challenge_id
      and usage.proof_due_at > pg_catalog.now()
      and usage.obligation_local_day is not null
      and not exists (
        select 1 from public.streak_day_outcomes outcome
        where outcome.user_id = usage.user_id
          and outcome.challenge_id = usage.challenge_id
          and outcome.local_day = usage.obligation_local_day
      )
    order by usage.obligation_local_day, usage.proof_due_at desc
    limit 1
  ) extension on true
  left join lateral (
    select submission.id, submission.status, submission.review_notes
    from public.challenge_submissions submission
    where submission.user_id = v_user_id
      and submission.challenge_id = obligation.challenge_id
      and submission.local_day = extension.obligation_local_day
      and submission.status in ('pending', 'approved', 'rejected')
    order by submission.submission_date desc, submission.id desc
    limit 1
  ) proof on extension.obligation_local_day is not null;

  select coalesce(
    pg_catalog.jsonb_agg(pg_catalog.to_jsonb(review)), '[]'::jsonb
  ) into v_reviews
  from public.get_today_pending_reviews(p_timezone) review;

  for v_group_id in
    select distinct (item ->> 'group_id')::uuid
    from pg_catalog.jsonb_array_elements(v_obligations) item
    where nullif(item ->> 'group_id', '') is not null
  loop
    begin
      v_risk := public.get_group_risk_data(v_group_id);
      if v_risk is not null then
        v_group_risks := v_group_risks
          || pg_catalog.jsonb_build_array(v_risk);
      end if;
    exception when sqlstate '42501' then continue;
    end;
  end loop;

  -- Only approved photo/video proof enters the connection mosaic. Personal
  -- proof is restricted to the current person. Shared proof requires both the
  -- viewer and contributor to belong to the promise's group. Pending and
  -- correction states remain in their review-owned surfaces.
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', recent.submission_id,
        'challenge_id', recent.challenge_id,
        'challenge_title', recent.challenge_title,
        'group_id', recent.group_id,
        'media_type', recent.media_type,
        'media_url', recent.media_url,
        'submitted_at', recent.submitted_at,
        'contributor_name', recent.contributor_name,
        'visibility', case
          when recent.group_id is null then 'only_you'
          else 'promise_people'
        end
      ) order by recent.submitted_at desc, recent.submission_id desc
    ),
    '[]'::jsonb
  ) into v_recent_media
  from (
    select *
    from (
      select distinct on (submission.id)
      submission.id as submission_id,
      submission.challenge_id,
      obligation ->> 'challenge_title' as challenge_title,
      nullif(obligation ->> 'group_id', '')::uuid as group_id,
      submission.media_type::text as media_type,
      submission.media_url,
      submission.submission_date as submitted_at,
      coalesce(
        nullif(pg_catalog.btrim(profile.display_name), ''),
        nullif(pg_catalog.btrim(profile.username), ''),
        'Menta member'
      ) as contributor_name
    from pg_catalog.jsonb_array_elements(v_obligations) obligation
    join public.challenge_submissions submission
      on submission.challenge_id = (obligation ->> 'challenge_id')::uuid
    left join public.profiles profile on profile.id = submission.user_id
    where submission.status = 'approved'
      and submission.media_type in ('photo', 'video')
      and nullif(pg_catalog.btrim(submission.media_url), '') is not null
      and submission.submission_date >= pg_catalog.now() - interval '30 days'
      and (
        (
          nullif(obligation ->> 'group_id', '') is null
          and submission.user_id = v_user_id
        )
        or (
          nullif(obligation ->> 'group_id', '') is not null
          and exists (
            select 1
            from public.team_members contributor_membership
            where contributor_membership.group_id =
              (obligation ->> 'group_id')::uuid
              and contributor_membership.user_id = submission.user_id
          )
        )
      )
      order by submission.id, submission.submission_date desc
    ) authorised_media
    order by authorised_media.submitted_at desc,
      authorised_media.submission_id desc
    limit 12
  ) recent
  ;

  -- Weekday promises on a rest day. Older clients ignore this key.
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'challenge_id', rest.challenge_id,
        'challenge_title', rest.challenge_title,
        'check_in_weekdays', pg_catalog.to_jsonb(rest.check_in_weekdays),
        'local_day', rest.local_day,
        'next_check_in_day', private.next_check_in_day_v1(
          rest.check_in_weekdays,
          rest.local_day
        )
      ) order by rest.challenge_title
    ),
    '[]'::jsonb
  ) into v_rest_days
  from (
    select
      ch.id as challenge_id,
      ch.title::text as challenge_title,
      ch.check_in_weekdays,
      (pg_catalog.now() at time zone public.get_effective_streak_timezone(
        v_user_id,
        ch.id,
        p_timezone
      ))::date as local_day
    from public.challenge_participants cp
    join public.challenges ch on ch.id = cp.challenge_id
    where cp.user_id = v_user_id
      and coalesce(cp.status, 'active') = 'active'
      and cp.joined_at <= pg_catalog.now()
      and ch.check_in_weekdays is not null
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= pg_catalog.now())
      and (ch.end_date is null or ch.end_date >= pg_catalog.now())
  ) rest
  where not private.is_check_in_day_v1(rest.check_in_weekdays, rest.local_day)
    and not exists (
      select 1
      from pg_catalog.jsonb_array_elements(v_obligations) obligation
      where (obligation ->> 'challenge_id')::uuid = rest.challenge_id
    );

  return pg_catalog.jsonb_build_object(
    'obligations', v_obligations,
    'reviews', v_reviews,
    'group_risks', v_group_risks,
    'recent_media', v_recent_media,
    'rest_days', v_rest_days
  );
end;
$$;

create or replace function public.get_group_daily_status(p_group_id uuid)
returns table (
  group_id uuid,
  total_members integer,
  submitted_today integer,
  pending_submissions integer,
  pending_reviews integer,
  end_of_day_utc timestamptz,
  seconds_remaining integer,
  group_at_risk boolean,
  misses_to_break_streak integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_eligible integer := 0;
  v_submitted integer := 0;
  v_pending_reviews integer := 0;
  v_end_of_day timestamptz;
  v_misses_rule integer := 2;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.group_id = p_group_id
      and tm.user_id = auth.uid()
  ) then
    raise exception 'GROUP_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;

  with eligible as materialized (
    select
      tc.challenge_id,
      cp.user_id,
      ch.streak_timezone,
      ch.allow_self_review
    from public.team_challenges tc
    join public.challenges ch
      on ch.id = tc.challenge_id
    join public.challenge_participants cp
      on cp.challenge_id = tc.challenge_id
     and coalesce(cp.status, 'active') = 'active'
    join public.team_members tm
      on tm.group_id = tc.group_id
     and tm.user_id = cp.user_id
    where tc.group_id = p_group_id
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= v_now)
      and (ch.end_date is null or ch.end_date >= v_now)
      and private.is_check_in_day_v1(
        ch.check_in_weekdays,
        (v_now at time zone ch.streak_timezone)::date
      )
  ), participant_days as (
    select
      e.user_id,
      min(
        (
          pg_catalog.date_trunc(
            'day',
            v_now at time zone e.streak_timezone
          ) + interval '1 day'
        ) at time zone e.streak_timezone
      ) as end_of_day_utc,
      pg_catalog.bool_or(
        exists (
          select 1
          from public.challenge_submissions cs
          where cs.challenge_id = e.challenge_id
            and cs.user_id = e.user_id
            and cs.local_day =
              (v_now at time zone e.streak_timezone)::date
            and cs.status in ('pending', 'approved')
        )
      ) as submitted_today
    from eligible e
    group by e.user_id
  ), review_backlog as (
    select count(distinct cs.id)::integer as pending_reviews
    from eligible e
    join public.challenge_submissions cs
      on cs.challenge_id = e.challenge_id
     and cs.user_id = e.user_id
     and cs.status = 'pending'
    where coalesce(e.allow_self_review, false) = false
  )
  select
    count(*)::integer,
    count(*) filter (where pd.submitted_today)::integer,
    coalesce(
      min(pd.end_of_day_utc),
      (
        pg_catalog.date_trunc('day', v_now at time zone 'UTC')
        + interval '1 day'
        - interval '1 second'
      ) at time zone 'UTC'
    ),
    coalesce((select rb.pending_reviews from review_backlog rb), 0)
  into
    v_eligible,
    v_submitted,
    v_end_of_day,
    v_pending_reviews
  from participant_days pd;

  return query
  select
    p_group_id,
    v_eligible,
    v_submitted,
    greatest(v_eligible - v_submitted, 0),
    v_pending_reviews,
    v_end_of_day,
    greatest(
      0,
      pg_catalog.floor(
        extract(epoch from (v_end_of_day - v_now))
      )::integer
    ),
    (v_eligible > 0 and v_eligible > v_submitted),
    v_misses_rule;
end;
$$;

-- Reminders: copied from the live definition, adding the schedule so a rest
-- day never sends a proof reminder.
create or replace function public.get_submit_reminders_due()
returns table(
  user_id uuid,
  username text,
  challenge_id text,
  challenge_title text,
  reminder_kind text,
  idempotency_key text
)
language sql
security definer
set search_path to 'public'
as $function$
  with valid_timezones as materialized (
    select array_agg(name) as names from pg_timezone_names
  ),
  active_challenges as (
    select cp.user_id, coalesce(p.username, 'member') as username,
      c.id as challenge_id, c.title as challenge_title,
      c.check_in_weekdays,
      exists (select 1 from public.team_challenges tc where tc.challenge_id = c.id) as is_group_challenge,
      case when nullif(c.streak_timezone, '') = any(valid_timezones.names) then nullif(c.streak_timezone, '') end as challenge_tz,
      coalesce(np.preferred_reminder_time, '20:00:00'::time) as preferred_reminder_time,
      case when nullif(np.timezone, '') = any(valid_timezones.names) then nullif(np.timezone, '') end as pref_tz
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id and c.status = 'active'
    left join public.profiles p on p.id = cp.user_id
    left join public.notification_preferences np on np.user_id = cp.user_id
    cross join valid_timezones
    where coalesce(cp.status, 'active') = 'active'
      and (c.start_date is null or c.start_date <= now())
      and (c.end_date is null or c.end_date > now())
      and coalesce(np.push_enabled, true)
      and coalesce(np.challenge_reminders, true)
  ),
  resolved as (
    select active_challenges.*,
      case when active_challenges.is_group_challenge
        then coalesce(active_challenges.challenge_tz, active_challenges.pref_tz, 'UTC')
        else coalesce(active_challenges.pref_tz, active_challenges.challenge_tz, 'UTC')
      end as effective_tz
    from active_challenges
  ),
  due_clock as (
    select resolved.*,
      (now() at time zone resolved.effective_tz)::date as user_local_day,
      (now() at time zone resolved.effective_tz)::time as user_local_time,
      (time '00:00' + make_interval(secs => least(extract(epoch from resolved.preferred_reminder_time)::integer + 10800, 84600)))::time as rescue_time
    from resolved
    where not exists (
      select 1 from public.challenge_submissions submission
      where submission.challenge_id = resolved.challenge_id
        and submission.user_id = resolved.user_id
        and submission.local_day = (now() at time zone resolved.effective_tz)::date
    )
      and private.is_check_in_day_v1(
        resolved.check_in_weekdays,
        (now() at time zone resolved.effective_tz)::date
      )
  ),
  reminders as (
    select due_clock.*, 'primary'::text as reminder_kind
    from due_clock
    where due_clock.user_local_time >= due_clock.preferred_reminder_time
      and due_clock.user_local_time < due_clock.rescue_time
    union all
    select due_clock.*, 'rescue'::text as reminder_kind
    from due_clock
    where due_clock.user_local_time >= due_clock.rescue_time
  )
  select reminder.user_id, reminder.username, reminder.challenge_id::text,
    reminder.challenge_title::text, reminder.reminder_kind,
    format('streak:%s:%s:%s:%s', reminder.user_id::text, reminder.challenge_id::text, reminder.user_local_day::text, reminder.reminder_kind)
  from reminders reminder
  where not exists (
    select 1 from public.notification_jobs job
    where job.idempotency_key = format('streak:%s:%s:%s:%s', reminder.user_id::text, reminder.challenge_id::text, reminder.user_local_day::text, reminder.reminder_kind)
  );
$function$;

-- Coach messages: copied from the live definition, adding the schedule.
create or replace function public.get_coach_messages_due_unfiltered_v1()
returns table(
  user_id uuid,
  username text,
  challenge_id text,
  challenge_title text,
  reminder_kind text,
  idempotency_key text,
  local_day date,
  streak_length integer,
  hours_remaining integer,
  freeze_remaining integer,
  proof_due_label text,
  open_promise_count integer
)
language sql
stable
security definer
set search_path to ''
as $function$
  with active_challenges as (
    select
      cp.user_id,
      coalesce(p.username, 'member') as username,
      c.id as challenge_id,
      c.title as challenge_title,
      c.check_in_weekdays,
      coalesce(cp.current_streak, 0) as current_streak,
      coalesce(cp.streak_freezes_remaining, 0) as freeze_remaining,
      exists (
        select 1
        from public.team_challenges tc
        where tc.challenge_id = c.id
      ) as is_group_challenge,
      nullif(c.streak_timezone, '') as challenge_tz,
      coalesce(np.push_enabled, true) as push_enabled,
      coalesce(np.challenge_reminders, true) as challenge_reminders,
      coalesce(np.preferred_reminder_time, '20:00:00'::time) as preferred_reminder_time,
      np.typical_proof_hour,
      nullif(np.timezone, '') as pref_tz
    from public.challenge_participants cp
    join public.challenges c
      on c.id = cp.challenge_id
     and coalesce(c.status, 'active') = 'active'
    left join public.profiles p
      on p.id = cp.user_id
    left join public.notification_preferences np
      on np.user_id = cp.user_id
    where coalesce(cp.status, 'active') = 'active'
      and (c.start_date is null or c.start_date <= now())
      and (c.end_date is null or c.end_date > now())
      and coalesce(np.push_enabled, true) = true
      and coalesce(np.challenge_reminders, true) = true
      and (
        np.ignore_coach_until is null
        or np.ignore_coach_until <= now()
      )
  ),
  resolved as (
    select
      ac.*,
      case
        when ac.is_group_challenge then coalesce(
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.challenge_tz
            ) then ac.challenge_tz
          end,
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.pref_tz
            ) then ac.pref_tz
          end,
          'UTC'
        )
        else coalesce(
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.pref_tz
            ) then ac.pref_tz
          end,
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.challenge_tz
            ) then ac.challenge_tz
          end,
          'UTC'
        )
      end as effective_tz
    from active_challenges ac
  ),
  due_clock as (
    select
      r.*,
      (now() at time zone r.effective_tz)::date as user_local_day,
      (now() at time zone r.effective_tz)::time as user_local_time,
      (
        time '00:00' + pg_catalog.make_interval(
          secs => least(
            extract(epoch from r.preferred_reminder_time)::integer + 10800,
            84600
          )
        )
      )::time as rescue_time
    from resolved r
    where not exists (
      select 1
      from public.challenge_submissions cs
      where cs.challenge_id = r.challenge_id
        and cs.user_id = r.user_id
        and cs.local_day = (now() at time zone r.effective_tz)::date
        and cs.status in ('pending', 'approved')
    )
      and private.is_check_in_day_v1(
        r.check_in_weekdays,
        (now() at time zone r.effective_tz)::date
      )
  ),
  due_slots as (
    select
      dc.*,
      case
        when dc.typical_proof_hour is not null
          and dc.typical_proof_hour < dc.rescue_time
        then dc.typical_proof_hour
        else dc.preferred_reminder_time
      end as routine_time
    from due_clock dc
  ),
  ranked as (
    select
      ds.*,
      count(*) over (partition by ds.user_id) as open_promise_count
    from due_slots ds
  ),
  chosen as (
    select distinct on (ranked.user_id)
      ranked.*
    from ranked
    order by
      ranked.user_id,
      ranked.current_streak desc nulls last,
      ranked.preferred_reminder_time asc,
      ranked.is_group_challenge desc,
      ranked.challenge_id asc
  ),
  primary_due as (
    select
      chosen.user_id,
      chosen.username,
      chosen.challenge_id::text as challenge_id,
      chosen.challenge_title::text as challenge_title,
      'primary'::text as reminder_kind,
      pg_catalog.format(
        'coach:%s:%s:primary',
        chosen.user_id::text,
        chosen.user_local_day::text
      ) as idempotency_key,
      chosen.user_local_day as local_day,
      chosen.current_streak as streak_length,
      greatest(
        0,
        floor(
          extract(
            epoch from (
              (
                (chosen.user_local_day::timestamp + chosen.preferred_reminder_time)
                at time zone chosen.effective_tz
              ) - now()
            )
          ) / 3600
        )
      )::integer as hours_remaining,
      chosen.freeze_remaining,
      pg_catalog.to_char(chosen.preferred_reminder_time, 'FMHH12:MI AM') as proof_due_label,
      chosen.open_promise_count::integer as open_promise_count
    from chosen
    where chosen.user_local_time >= chosen.routine_time
      and chosen.user_local_time < chosen.rescue_time
      and not exists (
        select 1
        from public.notification_jobs nj
        where nj.idempotency_key = pg_catalog.format(
          'coach:%s:%s:primary',
          chosen.user_id::text,
          chosen.user_local_day::text
        )
      )
  ),
  rescue_due as (
    select
      chosen.user_id,
      chosen.username,
      chosen.challenge_id::text as challenge_id,
      chosen.challenge_title::text as challenge_title,
      'rescue'::text as reminder_kind,
      pg_catalog.format(
        'coach:%s:%s:rescue',
        chosen.user_id::text,
        chosen.user_local_day::text
      ) as idempotency_key,
      chosen.user_local_day as local_day,
      chosen.current_streak as streak_length,
      greatest(
        0,
        floor(
          extract(
            epoch from (
              (
                (chosen.user_local_day::timestamp + interval '1 day')
                at time zone chosen.effective_tz
              ) - now()
            )
          ) / 3600
        )
      )::integer as hours_remaining,
      chosen.freeze_remaining,
      pg_catalog.to_char(chosen.preferred_reminder_time, 'FMHH12:MI AM') as proof_due_label,
      chosen.open_promise_count::integer as open_promise_count
    from chosen
    where chosen.user_local_time >= chosen.rescue_time
      and not exists (
        select 1
        from public.notification_jobs nj
        where nj.idempotency_key = pg_catalog.format(
          'coach:%s:%s:rescue',
          chosen.user_id::text,
          chosen.user_local_day::text
        )
      )
  )
  select * from primary_due
  union all
  select * from rescue_due;
$function$;

-- Creation accepts an optional schedule. The new parameter is last and
-- defaults to NULL, so every existing caller keeps the every-day behaviour.
drop function if exists public.create_accountability_challenge(
  text, text, text, integer, timestamp with time zone,
  timestamp with time zone, boolean, text, integer, text, text, text, text,
  boolean, integer, text, boolean, uuid, integer
);

create or replace function public.create_accountability_challenge(
  p_title text,
  p_description text default null,
  p_category text default null,
  p_duration integer default 30,
  p_start_date timestamp with time zone default null,
  p_end_date timestamp with time zone default null,
  p_is_public boolean default true,
  p_difficulty text default 'medium',
  p_points integer default 200,
  p_verification_type text default 'photo',
  p_verification_frequency text default 'daily',
  p_verification_description text default null,
  p_submission_text text default null,
  p_allow_extensions boolean default true,
  p_max_extensions integer default 2,
  p_deadline_type text default 'fixed',
  p_allow_self_review boolean default false,
  p_group_id uuid default null,
  p_cost integer default 30,
  p_check_in_weekdays smallint[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_weekdays smallint[];
  v_result jsonb;
  v_challenge_id uuid;
begin
  perform public.require_current_legal_acceptance('promise_creation');

  v_weekdays := private.normalize_check_in_weekdays_v1(p_check_in_weekdays);
  if v_weekdays is not null
    and coalesce(p_verification_frequency, 'daily') <> 'daily'
  then
    raise exception 'CHECK_IN_WEEKDAYS_REQUIRE_DAILY' using errcode = '22023';
  end if;

  -- Preserve the activation/referral receipt and every other delegate field.
  v_result := public.create_accountability_challenge_without_legal_gate(
    p_title,
    p_description,
    p_category,
    p_duration,
    p_start_date,
    p_end_date,
    p_is_public,
    p_difficulty,
    p_points,
    p_verification_type,
    p_verification_frequency,
    p_verification_description,
    p_submission_text,
    p_allow_extensions,
    p_max_extensions,
    p_deadline_type,
    p_allow_self_review,
    p_group_id,
    p_cost
  );

  if v_weekdays is not null
    and coalesce((v_result ->> 'success')::boolean, false)
  then
    v_challenge_id := nullif(v_result ->> 'challenge_id', '')::uuid;
    update public.challenges challenge_row
    set check_in_weekdays = v_weekdays
    where challenge_row.id = v_challenge_id;

    v_result := v_result || pg_catalog.jsonb_build_object(
      'check_in_weekdays',
      pg_catalog.to_jsonb(v_weekdays)
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.create_accountability_challenge(
  text, text, text, integer, timestamp with time zone,
  timestamp with time zone, boolean, text, integer, text, text, text, text,
  boolean, integer, text, boolean, uuid, integer, smallint[]
) from public, anon;

grant execute on function public.create_accountability_challenge(
  text, text, text, integer, timestamp with time zone,
  timestamp with time zone, boolean, text, integer, text, text, text, text,
  boolean, integer, text, boolean, uuid, integer, smallint[]
) to authenticated, service_role;

comment on function public.create_accountability_challenge(
  text, text, text, integer, timestamp with time zone,
  timestamp with time zone, boolean, text, integer, text, text, text, text,
  boolean, integer, text, boolean, uuid, integer, smallint[]
) is 'Creates a promise through the canonical authority. Legal acceptance is required only when the server-owned promise_creation setting is explicitly switched to enforce. p_check_in_weekdays limits proof to ISO weekdays; NULL means every day.';

notify pgrst, 'reload schema';
