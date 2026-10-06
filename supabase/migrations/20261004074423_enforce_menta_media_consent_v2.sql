-- Enforce the explicit video/audio disclosure at the repeated provider gate.
-- Photo/text v1 continuity remains unchanged; never infer v2 from legacy fields.
begin;

create or replace function private.menta_check_has_media_consent_v2(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.menta_check_has_consent_v1(p_user_id) and exists (
    select 1 from private.menta_check_media_acknowledgements_v2 acknowledgement
    where acknowledgement.user_id = p_user_id
      and acknowledgement.policy_version = 2
      and acknowledgement.withdrawn_at is null
  );
$$;
revoke all on function private.menta_check_has_media_consent_v2(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.get_menta_check_media_consent_v2()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ack private.menta_check_media_acknowledgements_v2%rowtype;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED');
  end if;
  if private.menta_check_has_media_consent_v2(v_user_id) then
    select * into v_ack from private.menta_check_media_acknowledgements_v2
    where user_id = v_user_id;
    return pg_catalog.jsonb_build_object('success', true, 'consented', true,
      'policy_version', 2, 'acknowledgement_id', v_ack.acknowledgement_id,
      'acknowledged_at', v_ack.acknowledged_at);
  end if;
  return pg_catalog.jsonb_build_object('success', true, 'consented', false,
    'policy_version', null, 'acknowledgement_id', null, 'acknowledged_at', null);
end;
$$;
revoke all on function public.get_menta_check_media_consent_v2()
  from public, anon, authenticated, service_role;
grant execute on function public.get_menta_check_media_consent_v2() to authenticated;

create or replace function public.menta_check_authorise_job_v1(p_job_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.menta_check_jobs%rowtype;
  v_submission public.challenge_submissions%rowtype;
  v_challenge public.challenges%rowtype;
  v_access text;
begin
  select * into v_job from private.menta_check_jobs where id = p_job_id for update;
  if not found or v_job.status <> 'processing' or v_job.locked_until is null or v_job.locked_until <= pg_catalog.now() then
    return false;
  end if;
  select * into v_submission from public.challenge_submissions where id = v_job.submission_id;
  select * into v_challenge from public.challenges where id = v_submission.challenge_id;
  -- Missing media disclosure is never an access-ended approval and must not
  -- charge or change the promise's review policy. Preserve proof for people.
  if coalesce(v_submission.media_type, v_challenge.verification_type, 'photo')
      in ('video', 'audio')
    and not private.menta_check_has_media_consent_v2(v_submission.user_id)
  then
    update private.menta_check_jobs
    set status = 'done', locked_until = null,
      last_error = 'MEDIA_CONSENT_RENEWAL_REQUIRED', updated_at = pg_catalog.now()
    where id = p_job_id;
    return false;
  end if;
  if v_job.kind = 'check' and v_submission.status = 'pending' and private.menta_check_has_consent_v1(v_submission.user_id)
    and v_challenge.review_mode = 'menta' then
    v_access := private.menta_check_access_v1(v_submission.user_id, v_submission.challenge_id, true);
  end if;
  if v_submission.status is distinct from 'pending'
    or not private.menta_check_has_consent_v1(v_submission.user_id)
    or (v_job.kind = 'check' and (v_challenge.review_mode is distinct from 'menta'
      or v_access is null))
    or (v_job.kind <> 'check' and (v_challenge.review_mode is distinct from 'people'
      or v_challenge.menta_backup_hours is null))
  then
    -- Resolve a pending personal check through the existing access-ended path;
    -- no photo or note leaves storage. Group proof remains for people.
    if v_job.kind = 'check' and v_submission.status = 'pending'
      and (not private.menta_check_has_consent_v1(v_submission.user_id)
        or private.menta_check_access_v1(v_submission.user_id, v_submission.challenge_id, false) is null)
    then
      perform public.menta_check_apply_v1(p_job_id,
        '{"decision":"approve","outcome":"access_ended","flags":[]}'::jsonb);
    else
      update private.menta_check_jobs set status = 'done', locked_until = null,
        updated_at = pg_catalog.now() where id = p_job_id;
    end if;
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.menta_check_authorise_job_v1(bigint) from public, anon, authenticated;
grant execute on function public.menta_check_authorise_job_v1(bigint) to service_role;

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

  -- Resume only this person's still-pending proof stopped by this gate.
  -- Completed verdicts and other accounts' jobs cannot be resurrected.
  update private.menta_check_jobs job
  set status = 'queued', attempts = 0, next_attempt_at = pg_catalog.now(),
    locked_until = null, last_error = null, updated_at = pg_catalog.now()
  from public.challenge_submissions submission
  join public.challenges challenge on challenge.id = submission.challenge_id
  where job.submission_id = submission.id
    and job.user_id = v_user_id and submission.user_id = v_user_id
    and submission.status = 'pending'
    and job.status = 'done' and job.last_error = 'MEDIA_CONSENT_RENEWAL_REQUIRED'
    and coalesce(submission.media_type, challenge.verification_type, 'photo')
      in ('video', 'audio')
    and (
      (job.kind = 'check' and challenge.review_mode = 'menta')
      or (job.kind in ('hint', 'backup') and challenge.review_mode = 'people'
        and challenge.menta_backup_hours is not null)
    );
  if found then
    perform private.menta_check_wake_v1();
  end if;

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

commit;
