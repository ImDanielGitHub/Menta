-- LOCAL CANDIDATE ONLY. Additive migration must be created with the Supabase CLI.
-- This preserves the existing two-argument client contract. Grants are separate.
CREATE OR REPLACE FUNCTION public.archive_failed_group(p_group_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_group public.teams%rowtype;
  v_archived_at timestamptz;
BEGIN
  IF v_actor IS NULL OR NOT public.current_session_is_active() THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  -- The caller parameter is compatibility input, never the source of authority.
  IF p_user_id IS DISTINCT FROM v_actor THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;

  SELECT * INTO v_group FROM public.teams WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'group_not_found');
  END IF;

  -- Preserve the old documented owner-or-current-member permission, tied to
  -- the verified session. Lock a membership so concurrent removal cannot race.
  IF v_group.owner_id IS DISTINCT FROM v_actor THEN
    PERFORM 1 FROM public.team_members
    WHERE group_id = p_group_id AND user_id = v_actor
    FOR KEY SHARE;
    IF NOT FOUND THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'not_authorized');
    END IF;
  END IF;

  IF v_group.status IS DISTINCT FROM 'failed' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false, 'error', 'group_not_failed', 'current_status', v_group.status
    );
  END IF;
  IF v_group.archived_at IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', true, 'archived_at', v_group.archived_at);
  END IF;

  v_archived_at := pg_catalog.now();
  UPDATE public.teams
  SET archived_at = v_archived_at, updated_at = v_archived_at
  WHERE id = p_group_id;
  RETURN pg_catalog.jsonb_build_object('success', true, 'archived_at', v_archived_at);
END;
$function$;
