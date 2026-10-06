-- REVIEW CANDIDATE ONLY. Not applied or runtime-verified.
-- Generate a forward migration using the Supabase CLI before integration.
-- Does not modify economy_quota_error_v1 or the applied 20261002232945 fix.
begin;

CREATE OR REPLACE FUNCTION private.resolve_challenge_join_target_v1(p_actor_id uuid, p_challenge_id uuid, p_invite_code text)
 RETURNS TABLE(resolution_code text, resolved_challenge_id uuid, challenge_title text, challenge_description text, group_id uuid, group_name text, is_member boolean, verification_description text, submission_text text, start_date timestamp with time zone, end_date timestamp with time zone, submission_expectations jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_invite public.invite_codes%rowtype;
  v_challenge public.challenges%rowtype;
  v_resolved_group_id uuid;
  v_group_status text;
  v_invite_authorised boolean := false;
  v_can_view boolean := false;
begin
  if p_actor_id is null or (p_challenge_id is null and v_code = '') then
    resolution_code := 'INVALID_REQUEST';
    return next;
    return;
  end if;

  if v_code <> '' then
    if v_code !~ '^[A-Z0-9]{4,32}$' then
      resolution_code := 'INVALID_INVITE';
      return next;
      return;
    end if;

    select invite.*
    into v_invite
    from public.invite_codes invite
    where invite.code = v_code
      and invite.type = 'challenge'
    limit 1;

    if not found then
      resolution_code := 'INVALID_INVITE';
      return next;
      return;
    end if;

    if v_invite.expires_at is not null and v_invite.expires_at <= now() then
      resolution_code := 'INVITE_EXPIRED';
      return next;
      return;
    end if;

    if p_challenge_id is not null and p_challenge_id <> v_invite.ref_id then
      resolution_code := 'INVALID_REQUEST';
      return next;
      return;
    end if;

    resolved_challenge_id := v_invite.ref_id;
    v_invite_authorised := true;
  else
    resolved_challenge_id := p_challenge_id;
  end if;

  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.id = resolved_challenge_id
  limit 1;

  if not found then
    resolution_code := 'CHALLENGE_NOT_FOUND';
    return next;
    return;
  end if;

  select team.id, team.name, team.status
  into v_resolved_group_id, group_name, v_group_status
  from public.team_challenges linked
  join public.teams team on team.id = linked.group_id
  where linked.challenge_id = v_challenge.id
  order by linked.created_at asc, linked.group_id asc
  limit 1;

  group_id := v_resolved_group_id;

  select exists (
    select 1
    from public.challenge_participants participant
    where participant.challenge_id = v_challenge.id
      and participant.user_id = p_actor_id
  ) into is_member;

  -- Generic private-promise invites cannot bypass role-bound acceptance.
  if not is_member and v_challenge.creator_id is distinct from p_actor_id then
    if exists (
      select 1 from public.team_challenges link
      join public.teams team on team.id = link.group_id
      where link.challenge_id = v_challenge.id and team.kind = 'promise'
    ) then
      resolution_code := 'INVITE_ROLE_REQUIRED';
      resolved_challenge_id := null;
      group_id := null;
      group_name := null;
      return next;
      return;
    end if;

  end if;

  v_can_view :=
    v_invite_authorised
    or v_challenge.is_public
    or v_challenge.creator_id = p_actor_id
    or is_member
    or (
      v_resolved_group_id is not null
      and exists (
        select 1
        from public.team_members member
        where member.group_id = v_resolved_group_id
          and member.user_id = p_actor_id
      )
    );

  if not v_can_view then
    resolution_code := 'CHALLENGE_NOT_FOUND';
    resolved_challenge_id := null;
    group_id := null;
    group_name := null;
    return next;
    return;
  end if;

  if v_challenge.status <> 'active'
     or v_challenge.completion_status <> 'active'
     or (v_challenge.end_date is not null and v_challenge.end_date <= now()) then
    resolution_code := 'CHALLENGE_INACTIVE';
    return next;
    return;
  end if;

  if v_resolved_group_id is not null and v_group_status <> 'active' then
    resolution_code := 'GROUP_INACTIVE';
    return next;
    return;
  end if;

  if v_challenge.allow_self_review
     and v_challenge.creator_id <> p_actor_id then
    resolution_code := 'SOLO_CHALLENGE';
    return next;
    return;
  end if;

  resolution_code := 'READY';
  challenge_title := v_challenge.title;
  challenge_description := v_challenge.description;
  verification_description := v_challenge.verification_description;
  submission_text := v_challenge.submission_text;
  start_date := v_challenge.start_date;
  end_date := v_challenge.end_date;
  submission_expectations := v_challenge.submission_expectations;
  return next;
end;
$function$;

CREATE OR REPLACE FUNCTION public.manage_promise_accountability_member_v1(p_challenge_id uuid, p_member_id uuid, p_role text DEFAULT NULL::text, p_remove boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_next_role text := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_role, ''))
  );
  v_previous_role text;
  v_group_id uuid;
  v_group_kind text;
  v_peer_roles_remaining integer;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if p_challenge_id is null
     or p_member_id is null
     or p_member_id = v_actor_id
     or (
       not coalesce(p_remove, false)
       and v_next_role not in ('partner', 'reviewer', 'supporter')
     ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_REQUEST'
    );
  end if;

  if not exists (
    select 1
    from public.challenges challenge
    where challenge.id = p_challenge_id
      and challenge.creator_id = v_actor_id
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_NOT_FOUND'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability-member:' || p_member_id::text || ':' ||
        p_challenge_id::text,
      0
    )
  );

  select member.role
  into v_previous_role
  from private.promise_accountability_members member
  where member.challenge_id = p_challenge_id
    and member.user_id = p_member_id
    and member.role <> 'owner'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'ROLE_NOT_FOUND'
    );
  end if;

  -- A creator cannot accept a priced participation change for another user.
  -- Same-role success is a genuine no-op: it must not race a target's leave
  -- and reactivate that participant after this snapshot was read.
  if not coalesce(p_remove, false) and v_next_role = 'partner' then
    if v_previous_role is distinct from 'partner'
      or not exists (
        select 1 from public.challenge_participants participant
        where participant.challenge_id = p_challenge_id
          and participant.user_id = p_member_id
          and coalesce(participant.status, 'active') = 'active'
      ) then
      return pg_catalog.jsonb_build_object(
        'success', false, 'error', 'PARTNER_ACCEPTANCE_REQUIRED'
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'result_code', 'PROMISE_ACCOUNTABILITY_MEMBER_UPDATED_V1',
      'challenge_id', p_challenge_id,
      'member_id', p_member_id,
      'role', 'partner',
      'peer_review_active', true
    );
  end if;

  select team.id, team.kind
  into v_group_id, v_group_kind
  from public.team_challenges link
  join public.teams team on team.id = link.group_id
  where link.challenge_id = p_challenge_id
  order by link.created_at asc, link.group_id asc
  limit 1;

  if coalesce(p_remove, false) then
    delete from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.user_id = p_member_id;
  else
    update private.promise_accountability_members member
    set role = v_next_role, updated_at = now()
    where member.challenge_id = p_challenge_id
      and member.user_id = p_member_id;
  end if;

  if v_previous_role = 'partner'
     and (coalesce(p_remove, false) or v_next_role <> 'partner') then
    update public.challenge_participants participant
    set status = 'dropped', updated_at = now()
    where participant.challenge_id = p_challenge_id
      and participant.user_id = p_member_id;
  end if;

  if coalesce(p_remove, false) and v_group_kind = 'promise' then
    delete from public.team_members member
    where member.group_id = v_group_id
      and member.user_id = p_member_id;
  end if;

  if v_group_kind = 'promise' then
    select pg_catalog.count(*)::integer
    into v_peer_roles_remaining
    from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.role in ('partner', 'reviewer');

    update public.challenges challenge
    set
      allow_self_review = v_peer_roles_remaining = 0,
      submission_expectations =
        coalesce(challenge.submission_expectations, '{}'::jsonb)
        || pg_catalog.jsonb_build_object(
          'requires_peer_review', v_peer_roles_remaining > 0,
          'reviewers_required', case
            when v_peer_roles_remaining > 0 then 1
            else 0
          end
        ),
      updated_at = now()
    where challenge.id = p_challenge_id;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', case
      when coalesce(p_remove, false) then 'PROMISE_ACCOUNTABILITY_MEMBER_REMOVED_V1'
      else 'PROMISE_ACCOUNTABILITY_MEMBER_UPDATED_V1'
    end,
    'challenge_id', p_challenge_id,
    'member_id', p_member_id,
    'role', case when coalesce(p_remove, false) then null else v_next_role end,
    'peer_review_active', coalesce(v_peer_roles_remaining, 1) > 0
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.preview_group_invite_v2(p_invite_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_invite public.invite_codes%rowtype;
  v_group_id uuid;
  v_group_name text;
  v_group_description text;
  v_group_privacy text;
  v_group_status text;
  v_member_count integer := 0;
  v_inviter_name text;
  v_shared_promise text;
  v_is_member boolean := false;
  v_preview_status text;
begin
  if v_user_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'AUTH_REQUIRED'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'AUTH_SESSION_REVOKED'
    );
  end if;

  if v_code !~ '^[A-Z0-9]{4,32}$' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'INVALID_CODE'
    );
  end if;

  select invite.*
  into v_invite
  from public.invite_codes invite
  where invite.code = v_code
    and invite.type = 'group'
  limit 1;

  if found then
    v_group_id := v_invite.ref_id;
  else
    select replacement.group_id
    into v_group_id
    from private.group_invite_replacements replacement
    where replacement.invite_code = v_code
    limit 1;

    if not found then
      return pg_catalog.jsonb_build_object(
        'success', true,
        'operation', 'GROUP_INVITE_PREVIEW',
        'code', 'PREVIEW_READY',
        'preview', pg_catalog.jsonb_build_object(
          'status', 'NOT_FOUND',
          'invite_code', v_code,
          'group_id', null,
          'group_name', null,
          'group_description', null,
          'privacy', null,
          'member_count', 0,
          'inviter_name', null,
          'shared_promise', null,
          'expires_at', null,
          'is_member', false
        )
      );
    end if;

    -- A replaced code proves only that this exact capability is stale. Do not
    -- leak the private group's metadata through an invalidated capability.
    return pg_catalog.jsonb_build_object(
      'success', true,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'PREVIEW_READY',
      'preview', pg_catalog.jsonb_build_object(
        'status', 'REPLACED',
        'invite_code', v_code,
        'group_id', null,
        'group_name', null,
        'group_description', null,
        'privacy', null,
        'member_count', 0,
        'inviter_name', null,
        'shared_promise', null,
        'expires_at', null,
        'is_member', false
      )
    );
  end if;

  -- An expired capability grants no metadata, including to signed-in callers.
  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    return pg_catalog.jsonb_build_object(
      'success', true, 'operation', 'GROUP_INVITE_PREVIEW', 'code', 'PREVIEW_READY',
      'preview', pg_catalog.jsonb_build_object(
        'status', 'EXPIRED', 'invite_code', v_code,
        'group_id', null, 'group_name', null, 'group_description', null,
        'privacy', null, 'member_count', 0, 'inviter_name', null,
        'shared_promise', null, 'expires_at', v_invite.expires_at,
        'is_member', false
      )
    );
  end if;

  select
    group_row.name,
    group_row.description,
    group_row.privacy,
    group_row.status
  into
    v_group_name,
    v_group_description,
    v_group_privacy,
    v_group_status
  from public.teams group_row
  where group_row.id = v_group_id
  limit 1;

  if v_group_status is distinct from 'active' then
    return pg_catalog.jsonb_build_object(
      'success', true, 'operation', 'GROUP_INVITE_PREVIEW', 'code', 'PREVIEW_READY',
      'preview', pg_catalog.jsonb_build_object(
        'status', 'GROUP_INACTIVE', 'invite_code', v_code,
        'group_id', null, 'group_name', null, 'group_description', null,
        'privacy', null, 'member_count', 0, 'inviter_name', null,
        'shared_promise', null, 'expires_at', v_invite.expires_at,
        'is_member', false
      )
    );
  end if;

  select pg_catalog.count(*)::integer
  into v_member_count
  from public.team_members member
  where member.group_id = v_group_id;

  if v_invite.created_by is not null then
    select coalesce(
      nullif(pg_catalog.btrim(profile.display_name), ''),
      nullif(pg_catalog.btrim(profile.username), ''),
      'A group member'
    )
    into v_inviter_name
    from public.profiles profile
    where profile.id = v_invite.created_by
    limit 1;
  end if;

  select challenge.title
  into v_shared_promise
  from public.team_challenges group_challenge
  join public.challenges challenge
    on challenge.id = group_challenge.challenge_id
  where group_challenge.group_id = v_group_id
    and challenge.status = 'active'
    and challenge.completion_status = 'active'
  order by challenge.created_at asc, challenge.id asc
  limit 1;

  select exists (
    select 1
    from public.team_members member
    where member.group_id = v_group_id
      and member.user_id = v_user_id
  )
  into v_is_member;

  if v_preview_status is null then
    v_preview_status := case
      when v_invite.expires_at is not null
        and v_invite.expires_at <= now()
        then 'EXPIRED'
      when v_group_status <> 'active'
        then 'GROUP_INACTIVE'
      when v_is_member
        then 'ALREADY_MEMBER'
      else 'ACTIVE'
    end;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'GROUP_INVITE_PREVIEW',
    'code', 'PREVIEW_READY',
    'preview', pg_catalog.jsonb_build_object(
      'status', v_preview_status,
      'invite_code', v_code,
      'group_id', v_group_id,
      'group_name', v_group_name,
      'group_description', v_group_description,
      'privacy', v_group_privacy,
      'member_count', v_member_count,
      'inviter_name', v_inviter_name,
      'shared_promise', v_shared_promise,
      'expires_at', v_invite.expires_at,
      'is_member', v_is_member
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_get_attendee_album_v1(p_occurrence_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_is_organiser boolean := false;
  v_is_joined boolean := false;
  v_is_checked_in boolean := false;
  v_viewer_can_post boolean := false;
  v_approved_post_count integer := 0;
  v_items jsonb := '[]'::jsonb;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'AUTHENTICATION_REQUIRED',
      'Sign in to open the attendee album.',
      null
    );
  end if;

  select occurrence.*
  into v_occurrence
  from public.event_occurrences as occurrence
  where occurrence.id = p_occurrence_id;

  if not found then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'OCCURRENCE_UNAVAILABLE',
      'This event occurrence is not available.',
      null
    );
  end if;

  select event.*
  into v_event
  from public.event_events as event
  where event.id = v_occurrence.event_id;

  if not found
     or v_event.status not in ('published', 'archived')
     or v_occurrence.state not in ('live', 'ended') then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'ALBUM_UNAVAILABLE',
      'The attendee album is not available for this occurrence.',
      null
    );
  end if;

  v_is_organiser := v_event.organiser_id is not distinct from v_actor_id;

  select exists (
    select 1
    from public.event_attendances as attendance
    where attendance.occurrence_id = v_occurrence.id
      and attendance.user_id = v_actor_id
      and attendance.state = 'joined'
  )
  into v_is_joined;

  select exists (
    select 1
    from public.event_attendances as attendance
    join public.event_checkins as checkin
      on checkin.attendance_id = attendance.id
      and checkin.revoked_at is null
    where attendance.occurrence_id = v_occurrence.id
      and attendance.user_id = v_actor_id
      and attendance.state = 'joined'
  )
  into v_is_checked_in;

  if not v_is_organiser and not v_is_checked_in then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'ALBUM_NOT_ELIGIBLE',
      'A confirmed check-in is required to open this attendee album.',
      null
    );
  end if;

  v_viewer_can_post :=
    v_is_joined
    and v_is_checked_in
    and private.event_posting_is_open_v1(v_occurrence);

  select count(*)::integer
  into v_approved_post_count
  from public.event_posts as post
  join public.event_attendances as attendance
    on attendance.occurrence_id = post.occurrence_id
    and attendance.user_id = post.user_id
    and attendance.state = 'joined'
  join public.event_checkins as checkin
    on checkin.attendance_id = attendance.id
    and checkin.revoked_at is null
  where post.occurrence_id = v_occurrence.id
    and post.status = 'approved'
    and post.media_path is not null
    and post.reviewed_at is not null;

  select coalesce(
    jsonb_agg(
      album_row.item
      order by album_row.created_at desc, album_row.post_id desc
    ),
    '[]'::jsonb
  )
  into v_items
  from (
    select
      post.id as post_id,
      post.created_at,
      private.event_album_item_json_v1(post, profile, checkin) as item
    from public.event_posts as post
    join public.profiles as profile on profile.id = post.user_id
    join public.event_attendances as attendance
      on attendance.occurrence_id = post.occurrence_id
      and attendance.user_id = post.user_id
      and attendance.state = 'joined'
    join public.event_checkins as checkin
      on checkin.attendance_id = attendance.id
      and checkin.revoked_at is null
    where post.occurrence_id = v_occurrence.id
      and post.status = 'approved'
      and post.media_path is not null
      and post.reviewed_at is not null
    order by post.created_at desc, post.id desc
    limit 24
  ) as album_row;

  return private.event_result_v1(
    'get_attendee_album',
    null,
    'completed',
    'ATTENDEE_ALBUM_READY',
    'The attendee album is ready.',
    jsonb_build_object(
      'eventId', v_event.id,
      'occurrenceId', v_occurrence.id,
      'eventTitle', v_event.title,
      'viewerRole', case when v_is_organiser then 'organiser' else 'attendee' end,
      'viewerCanPost', v_viewer_can_post,
      'downloadsAllowed', false,
      'approvedPostCount', v_approved_post_count,
      'items', v_items
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_get_organiser_recap_v1(p_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_joined_count integer := 0;
  v_checked_in_count integer := 0;
  v_posted_count integer := 0;
  v_verified_count integer := 0;
  v_approved_post_count integer := 0;
  v_album_items jsonb := '[]'::jsonb;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'AUTHENTICATION_REQUIRED',
      'Sign in to open the event recap.',
      null
    );
  end if;

  select event.*
  into v_event
  from public.event_events as event
  where event.id = p_event_id;

  if not found or v_event.organiser_id is distinct from v_actor_id then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'FORBIDDEN',
      'Only this event organiser can open the recap.',
      null
    );
  end if;

  if v_event.status not in ('published', 'archived') then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event does not have an available recap.',
      null
    );
  end if;

  -- A recurring event can have multiple completed occurrences. The latest
  -- ended occurrence is selected deterministically; a caller cannot widen or
  -- substitute the organiser-owned event scope.
  select occurrence.*
  into v_occurrence
  from public.event_occurrences as occurrence
  where occurrence.event_id = v_event.id
    and occurrence.state = 'ended'
  order by occurrence.ends_at desc, occurrence.id desc
  limit 1;

  if not found then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'RECAP_NOT_READY',
      'The event recap is available after an occurrence ends.',
      null
    );
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where exists (
        select 1
        from public.event_checkins as checkin
        where checkin.attendance_id = attendance.id
          and checkin.revoked_at is null
      )
    )::integer,
    count(*) filter (
      where exists (
        select 1
        from public.event_posts as post
        where post.occurrence_id = attendance.occurrence_id
          and post.user_id = attendance.user_id
          and post.status in ('pending_review', 'approved', 'rejected')
          and post.media_path is not null
      )
    )::integer,
    count(*) filter (
      where exists (
        select 1
        from public.event_posts as post
        where post.occurrence_id = attendance.occurrence_id
          and post.user_id = attendance.user_id
          and post.status = 'approved'
          and post.media_path is not null
          and post.reviewed_at is not null
      )
    )::integer
  into
    v_joined_count,
    v_checked_in_count,
    v_posted_count,
    v_verified_count
  from public.event_attendances as attendance
  where attendance.occurrence_id = v_occurrence.id
    and attendance.state = 'joined';

  select count(*)::integer
  into v_approved_post_count
  from public.event_posts as post
  join public.event_attendances as attendance
    on attendance.occurrence_id = post.occurrence_id
    and attendance.user_id = post.user_id
    and attendance.state = 'joined'
  join public.event_checkins as checkin
    on checkin.attendance_id = attendance.id
    and checkin.revoked_at is null
  where post.occurrence_id = v_occurrence.id
    and post.status = 'approved'
    and post.media_path is not null
    and post.reviewed_at is not null;

  select coalesce(
    jsonb_agg(
      album_row.item
      order by album_row.created_at desc, album_row.post_id desc
    ),
    '[]'::jsonb
  )
  into v_album_items
  from (
    select
      post.id as post_id,
      post.created_at,
      private.event_album_item_json_v1(post, profile, checkin) as item
    from public.event_posts as post
    join public.profiles as profile on profile.id = post.user_id
    join public.event_attendances as attendance
      on attendance.occurrence_id = post.occurrence_id
      and attendance.user_id = post.user_id
      and attendance.state = 'joined'
    join public.event_checkins as checkin
      on checkin.attendance_id = attendance.id
      and checkin.revoked_at is null
    where post.occurrence_id = v_occurrence.id
      and post.status = 'approved'
      and post.media_path is not null
      and post.reviewed_at is not null
    order by post.created_at desc, post.id desc
    limit 12
  ) as album_row;

  return private.event_result_v1(
    'get_organiser_recap',
    null,
    'completed',
    'ORGANISER_RECAP_READY',
    'The organiser recap is ready.',
    jsonb_build_object(
      'eventId', v_event.id,
      'occurrenceId', v_occurrence.id,
      'eventTitle', v_event.title,
      'endedAt', v_occurrence.ends_at,
      'timeZone', v_event.time_zone,
      'counts', jsonb_build_object(
        'joined', v_joined_count,
        'checkedIn', v_checked_in_count,
        'posted', v_posted_count,
        'verified', v_verified_count
      ),
      'approvedPostCount', v_approved_post_count,
      'albumItems', v_album_items
    )
  );
end;
$function$;

commit;
