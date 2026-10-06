-- Keep saved-group visibility; promise supporters see approved proof only.
begin;

create or replace function private.proof_submission_visible_v1(
  p_challenge_id uuid,
  p_submitter_id uuid,
  p_status text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or public.current_session_is_active() is not true then
    return false;
  end if;
  if p_submitter_id = v_actor then
    return true;
  end if;

  -- A real saved-group membership retains the documented view-only contract.
  -- Promise-scoped containers do not confer this independent authority.
  if exists (
    select 1
    from public.team_challenges link
    join public.teams team on team.id = link.group_id and team.kind = 'saved'
    join public.team_members member on member.group_id = team.id
    where link.challenge_id = p_challenge_id and member.user_id = v_actor
  ) then
    return true;
  end if;

  if not (
    exists (
      select 1 from public.challenges challenge
      where challenge.id = p_challenge_id and challenge.creator_id = v_actor
    )
    or exists (
      select 1 from public.challenge_participants participant
      where participant.challenge_id = p_challenge_id
        and participant.user_id = v_actor
        and coalesce(participant.status, 'active') = 'active'
    )
    or exists (
      select 1 from public.team_challenges link
      join public.team_members member on member.group_id = link.group_id
      where link.challenge_id = p_challenge_id and member.user_id = v_actor
    )
  ) then
    return false;
  end if;

  return coalesce(p_status = 'approved', false) or not exists (
    select 1 from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.user_id = v_actor and member.role = 'supporter'
  );
end;
$$;

create or replace function private.proof_object_visible_v1(
  p_object_key text,
  p_owner_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or public.current_session_is_active() is not true then
    return false;
  end if;
  -- Preserve an uploader's access to their own unsubmitted proof draft.
  if p_owner_id = v_actor::text then
    return true;
  end if;
  return exists (
    select 1 from public.challenge_submissions submission
    where submission.media_url = p_object_key
      and private.proof_submission_visible_v1(
        submission.challenge_id, submission.user_id, submission.status
      )
  );
end;
$$;

revoke all on function private.proof_submission_visible_v1(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function private.proof_object_visible_v1(text, text)
  from public, anon, authenticated, service_role;
-- Stored RLS expressions resolve these function OIDs without schema USAGE.
-- Preserve the existing private-schema gate on unrelated privileged helpers.
grant execute on function private.proof_submission_visible_v1(uuid, uuid, text)
  to authenticated;
grant execute on function private.proof_object_visible_v1(text, text)
  to authenticated;

-- Permissive policies combine with OR. Retire both deployed policies and the
-- original reset policy so reconstruction cannot retain a broader read path.
drop policy if exists challenge_submissions_read_authorised on public.challenge_submissions;
drop policy if exists challenge_submissions_select on public.challenge_submissions;
drop policy if exists challenge_submissions_select_member on public.challenge_submissions;
create policy challenge_submissions_select
on public.challenge_submissions for select to authenticated
using (private.proof_submission_visible_v1(challenge_id, user_id, status));

drop policy if exists proof_media_read_authorised on storage.objects;
create policy proof_media_read_authorised
on storage.objects for select to authenticated
using (
  bucket_id = 'challenge-verifications'
  and private.proof_object_visible_v1(name, owner_id)
);

commit;
