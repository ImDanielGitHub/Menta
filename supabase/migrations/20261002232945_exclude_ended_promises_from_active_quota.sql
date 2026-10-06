CREATE OR REPLACE FUNCTION private.economy_active_promise_count_v1(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select count(*)::integer
  from public.challenge_participants participant
  join public.challenges challenge
    on challenge.id = participant.challenge_id
  where participant.user_id = p_user_id
    and participant.status = 'active'
    and coalesce(challenge.status, 'active') = 'active'
    and coalesce(challenge.completion_status, 'active') = 'active'
    and coalesce(challenge.is_expired, false) = false
    and (challenge.end_date is null or challenge.end_date >= pg_catalog.now());
$function$;
