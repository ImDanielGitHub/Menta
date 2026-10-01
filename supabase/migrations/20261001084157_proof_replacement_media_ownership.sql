-- Keep new upload paths bound to their event; permit only identical owned proof reuse.
-- Existing object owner, MIME and size validation and RPC authority remain intact.
begin;

create or replace function private.validate_challenge_proof_object_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_object storage.objects%rowtype;
  v_mime text;
  v_size bigint;
  v_pattern text;
  v_source_event_id uuid;
begin
  if new.media_type = 'text' then
    if new.media_url is not null then
      raise check_violation using message = 'Text proof cannot reference media';
    end if;
    return new;
  end if;

  v_pattern := '^' || new.user_id::text
    || '/proof-' || new.challenge_id::text
    || '-' || new.client_event_id::text
    || case when new.media_type = 'photo'
      then '\.(jpg|jpeg|png|webp)$'
      else '\.(mp4|mov|webm)$'
    end;

  if new.media_url is not null and new.media_url !~* v_pattern
    and new.replaces_submission_id is not null
  then
    -- A deliberate override / friend handoff reuses the proof, not a new upload.
    -- Resolve only the directly referenced, identical owned proof. Never trust
    -- a supplied path or an event ID belonging to another account or promise.
    select source.client_event_id into v_source_event_id
    from public.challenge_submissions source
    where source.id = new.replaces_submission_id
      and source.user_id = new.user_id
      and source.challenge_id = new.challenge_id
      and source.media_url = new.media_url
      and source.media_type = new.media_type;

    if v_source_event_id is not null then
      v_pattern := '^' || new.user_id::text
        || '/proof-' || new.challenge_id::text
        || '-' || v_source_event_id::text
        || case when new.media_type = 'photo'
          then '\.(jpg|jpeg|png|webp)$'
          else '\.(mp4|mov|webm)$'
        end;
    end if;
  end if;

  if new.media_url is null or new.media_url !~* v_pattern then
    raise check_violation using message = 'Proof media path is not account-bound';
  end if;

  select object_row.* into v_object
  from storage.objects object_row
  where object_row.bucket_id = 'challenge-verifications'
    and object_row.name = new.media_url
    and object_row.owner_id = new.user_id::text
  limit 1;

  if not found then
    raise check_violation using message = 'Proof media object is unavailable';
  end if;

  v_mime := coalesce(v_object.metadata ->> 'mimetype', '');
  v_size := coalesce((v_object.metadata ->> 'size')::bigint, 0);
  if v_size <= 0 or v_size > 52428800
    or (new.media_type = 'photo' and v_mime not in ('image/jpeg','image/png','image/webp'))
    or (new.media_type = 'video' and v_mime not in ('video/mp4','video/quicktime','video/webm'))
  then
    raise check_violation using message = 'Proof media metadata is invalid';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_challenge_proof_object_v1()
  from public, anon, authenticated, service_role;

commit;
