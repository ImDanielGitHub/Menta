begin;

create or replace function private.challenge_review_recipients_v1(
  p_challenge_id uuid,
  p_submitter_id uuid
)
returns table (reviewer_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  with candidates as (
    select challenge_row.creator_id as user_id
    from public.challenges challenge_row
    where challenge_row.id = p_challenge_id
    union
    select participant.user_id
    from public.challenge_participants participant
    where participant.challenge_id = p_challenge_id
      and coalesce(participant.status, 'active') = 'active'
    union
    select membership.user_id
    from public.team_challenges team_challenge
    join public.team_members membership
      on membership.group_id = team_challenge.group_id
    where team_challenge.challenge_id = p_challenge_id
  )
  select candidate.user_id
  from candidates candidate
  where candidate.user_id is not null
    and candidate.user_id is distinct from p_submitter_id
    -- Match the current review decision RPC: supporters cannot review proof,
    -- even when another membership would otherwise include them.
    and not exists (
      select 1
      from private.promise_accountability_members member
      where member.challenge_id = p_challenge_id
        and member.user_id = candidate.user_id
        and member.role = 'supporter'
    )
    and not private.users_have_block_relationship_v1(
      candidate.user_id,
      p_submitter_id
    );
$$;

revoke all on function private.challenge_review_recipients_v1(uuid, uuid)
  from public, anon, authenticated, service_role;

-- The processor rechecks individual queued requests after membership changes.
create or replace function public.is_challenge_review_recipient_v1(
  p_challenge_id uuid,
  p_submitter_id uuid,
  p_reviewer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.challenge_review_recipients_v1(p_challenge_id, p_submitter_id) recipient
    where recipient.reviewer_id = p_reviewer_id
  );
$$;

revoke all on function public.is_challenge_review_recipient_v1(uuid, uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.is_challenge_review_recipient_v1(uuid, uuid, uuid)
  to service_role;

commit;
