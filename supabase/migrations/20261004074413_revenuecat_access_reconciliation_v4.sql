-- Match every terminal provider event to its current owned purchase period.
-- Explicit entitlement IDs do not authorize expiring a later paid renewal.
begin;

CREATE OR REPLACE FUNCTION public.apply_revenuecat_webhook_event(p_provider_event_id text, p_event_type text, p_event_at timestamp with time zone, p_user_id uuid, p_store text, p_product_id text, p_transaction_id text, p_original_transaction_id text, p_purchase_at timestamp with time zone, p_expires_at timestamp with time zone, p_amount_cents integer, p_currency text, p_entitlement_keys text[], p_entitlement_state boolean, p_credit_amount integer, p_credit_reason text, p_credit_transaction_type text, p_credit_external_reference_id text, p_credit_description text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event_inserted text;
  v_entitlement_keys text[] := p_entitlement_keys;
  v_entitlement_keys_valid boolean;
  v_provider_payload jsonb := coalesce(p_payload -> 'event', p_payload);
  v_existing_status text;
  v_existing_ignored_reason text;
  v_profile_exists boolean := false;
  v_entitlement_key text;
  v_key_changed boolean;
  v_changed_count integer := 0;
  v_has_active_pro boolean := false;
  v_reconciliation_keys text[] := '{}'::text[];
  v_status text := 'accepted';
  v_ignored_reason text;
  v_credit_result jsonb;
begin
  if p_provider_event_id is null or pg_catalog.btrim(p_provider_event_id) = '' then
    raise exception 'PROVIDER_EVENT_ID_REQUIRED';
  end if;

  -- Take the account lock before a retry row lock. A newer event may resolve a
  -- pending row in the same transaction, so the reverse order can deadlock.
  if p_user_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'revenuecat-entitlement:' || p_user_id::text,
        0
      )
    );
  end if;

  -- Missing identity is not permission to revoke every entitlement. Recover
  -- only current keys backed by an applied provider grant and an owned receipt
  -- for this exact product and transaction lineage. Unmatched events retain
  -- access and remain retryable, including legitimate unmapped products.
  v_entitlement_keys_valid :=
    coalesce(pg_catalog.cardinality(v_entitlement_keys), 0) > 0
    and not exists (
      select 1 from pg_catalog.unnest(v_entitlement_keys) as supplied(key)
      where supplied.key is null or supplied.key = ''
        or supplied.key <> pg_catalog.btrim(supplied.key)
    );

  -- Terminal events name keys, not necessarily the current product or period.
  -- A delayed expiration with valid IDs must not revoke a later paid renewal.
  if p_entitlement_state is false then
    select coalesce(
      pg_catalog.array_agg(distinct entitlement.entitlement_key order by entitlement.entitlement_key),
      '{}'::text[]
    ) into v_entitlement_keys
    from public.rc_entitlements entitlement
    left join public.rc_webhook_events grant_event
      on grant_event.provider_event_id = entitlement.last_provider_event_id
      and grant_event.target_user_id = p_user_id
      and grant_event.user_id = p_user_id
      and grant_event.processing_status = 'applied'
      and grant_event.event_type in (
        'INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL',
        'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED',
        'TEMPORARY_ENTITLEMENT_GRANT', 'REFUND_REVERSED'
      )
      and entitlement.entitlement_key = any (grant_event.entitlement_keys)
    join public.rc_receipts receipt
      on receipt.user_id = p_user_id
      and (
        (grant_event.provider_event_id is not null
          and receipt.store = grant_event.store
          and receipt.transaction_id = grant_event.transaction_id)
        or (
          -- Pre-authority rows have no event ID. Explicit provider keys plus
          -- the exact owned stored purchase period can reconcile these rows;
          -- never infer missing keys or use a different/later legacy period.
          entitlement.last_provider_event_id is null
          and v_entitlement_keys_valid
          and entitlement.source = receipt.store
          and entitlement.starts_at = receipt.purchase_at
          and entitlement.ends_at = receipt.expires_at
        )
      )
    where entitlement.user_id = p_user_id
      and (
        not v_entitlement_keys_valid
        or entitlement.entitlement_key = any (v_entitlement_keys)
      )
      -- Adjacent renewals begin exactly when the old period expires.
      and (
        p_expires_at is null or entitlement.starts_at is null
        or entitlement.starts_at < p_expires_at
      )
      and receipt.store = p_store
      and receipt.product_id = p_product_id
      and pg_catalog.jsonb_typeof(v_provider_payload -> 'store') = 'string'
      and pg_catalog.lower(v_provider_payload ->> 'store') = p_store
      and pg_catalog.jsonb_typeof(v_provider_payload -> 'product_id') = 'string'
      and v_provider_payload ->> 'product_id' = p_product_id
      and (
        (
          pg_catalog.jsonb_typeof(v_provider_payload -> 'transaction_id') = 'string'
          and nullif(pg_catalog.btrim(v_provider_payload ->> 'transaction_id'), '') is not null
          and v_provider_payload ->> 'transaction_id' = p_transaction_id
          and receipt.transaction_id = p_transaction_id
        ) or (
          pg_catalog.jsonb_typeof(v_provider_payload -> 'original_transaction_id') = 'string'
          and nullif(pg_catalog.btrim(v_provider_payload ->> 'original_transaction_id'), '') is not null
          and v_provider_payload ->> 'original_transaction_id' = p_original_transaction_id
          and receipt.original_transaction_id = p_original_transaction_id
          -- An older period can share the lineage with a later paid renewal.
          -- Do not infer its keys when the current period starts after expiry.
          and p_expires_at is not null
          and receipt.purchase_at < p_expires_at
        )
      );
  end if;

  insert into public.rc_webhook_events (
    provider_event_id,
    event_type,
    event_at,
    target_user_id,
    user_id,
    store,
    transaction_id,
    entitlement_keys,
    payload
  )
  values (
    p_provider_event_id,
    coalesce(nullif(pg_catalog.btrim(p_event_type), ''), 'UNKNOWN'),
    p_event_at,
    p_user_id,
    case
      when p_user_id is not null
        and exists (select 1 from public.profiles where id = p_user_id)
      then p_user_id
      else null
    end,
    coalesce(nullif(pg_catalog.btrim(p_store), ''), 'unknown'),
    p_transaction_id,
    coalesce(v_entitlement_keys, '{}'::text[]),
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (provider_event_id) do nothing
  returning provider_event_id into v_event_inserted;

  if v_event_inserted is null then
    select processing_status, ignored_reason
    into v_existing_status, v_existing_ignored_reason
    from public.rc_webhook_events
    where provider_event_id = p_provider_event_id
    for update;

    if v_existing_status <> 'retry'
      and not (v_existing_status = 'ignored' and coalesce(v_existing_ignored_reason in (
        'missing_event_timestamp', 'missing_entitlement_ids'
      ), false))
      -- Older handlers accepted ended cancellations without changing access.
      -- Allow the corrected terminal replay once; applied events stay duplicate.
      and not (v_existing_status = 'accepted'
        and p_event_type = 'CANCELLATION'
        and p_entitlement_state is false) then
      return pg_catalog.jsonb_build_object(
        'accepted', true,
        'duplicate', true,
        'entitlement_applied', false,
        'status', 'duplicate'
      );
    end if;

    update public.rc_webhook_events
    set
      event_type = coalesce(
        nullif(pg_catalog.btrim(p_event_type), ''),
        event_type
      ),
      event_at = coalesce(p_event_at, event_at),
      target_user_id = coalesce(p_user_id, target_user_id),
      store = coalesce(
        nullif(pg_catalog.btrim(p_store), ''),
        store
      ),
      transaction_id = coalesce(p_transaction_id, transaction_id),
      entitlement_keys = coalesce(
        v_entitlement_keys,
        entitlement_keys
      ),
      payload = coalesce(p_payload, payload),
      attempt_count = attempt_count + 1,
      last_attempt_at = pg_catalog.now(),
      ignored_reason = null,
      processed_at = null
    where provider_event_id = p_provider_event_id;
  end if;

  if p_user_id is not null then
    select exists (
      select 1
      from public.profiles
      where id = p_user_id
    ) into v_profile_exists;
  end if;

  if v_profile_exists then
    update public.rc_webhook_events
    set user_id = p_user_id
    where provider_event_id = p_provider_event_id
      and user_id is distinct from p_user_id;
  end if;

  insert into public.rc_receipts (
    store,
    product_id,
    transaction_id,
    original_transaction_id,
    user_id,
    purchase_at,
    expires_at,
    amount_cents,
    currency,
    payload
  )
  values (
    coalesce(nullif(pg_catalog.btrim(p_store), ''), 'unknown'),
    coalesce(nullif(pg_catalog.btrim(p_product_id), ''), 'unknown_product'),
    p_transaction_id,
    p_original_transaction_id,
    case when v_profile_exists then p_user_id else null end,
    p_purchase_at,
    p_expires_at,
    p_amount_cents,
    p_currency,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (store, transaction_id) do update
  set user_id = coalesce(
    public.rc_receipts.user_id,
    excluded.user_id
  );

  if not v_profile_exists then
    v_status := 'retry';
    v_ignored_reason := 'profile_not_found';
  elsif p_credit_amount is not null and p_credit_amount > 0 then
    if p_credit_external_reference_id is null
       or pg_catalog.btrim(p_credit_external_reference_id) = '' then
      raise exception 'CREDIT_EXTERNAL_REFERENCE_REQUIRED';
    end if;

    select public.grant_momenta_credit(
      p_user_id,
      p_credit_amount,
      p_credit_reason,
      p_credit_transaction_type,
      p_credit_external_reference_id,
      p_credit_description
    ) into v_credit_result;
  end if;

  if v_profile_exists and p_entitlement_state is not null then
    if p_event_at is null then
      v_status := 'retry';
      v_ignored_reason := 'missing_event_timestamp';
    elsif coalesce(pg_catalog.array_length(v_entitlement_keys, 1), 0) = 0
      or exists (
        select 1 from pg_catalog.unnest(v_entitlement_keys) as supplied(key)
        where supplied.key is null or supplied.key = ''
          or supplied.key <> pg_catalog.btrim(supplied.key)
      ) then
      v_status := 'retry';
      v_ignored_reason := case
        when p_event_type = 'CANCELLATION' and v_entitlement_keys_valid
          then 'unmatched_entitlement_lineage'
        else 'missing_entitlement_ids'
      end;
    else
      select coalesce(
        pg_catalog.array_agg(entitlement_key order by entitlement_key),
        '{}'::text[]
      )
      into v_reconciliation_keys
      from public.rc_entitlements
      where user_id = p_user_id
        and entitlement_key = any (v_entitlement_keys)
        and last_provider_event_at = p_event_at
        and last_provider_event_id is distinct from p_provider_event_id
        and is_active is distinct from p_entitlement_state;

      if pg_catalog.cardinality(v_reconciliation_keys) > 0 then
        v_status := 'retry';
        v_ignored_reason := 'ambiguous_equal_timestamp';
      else
        foreach v_entitlement_key in array v_entitlement_keys
        loop
          with changed as (
            insert into public.rc_entitlements (
              user_id,
              entitlement_key,
              is_active,
              starts_at,
              ends_at,
              source,
              last_event_at,
              last_provider_event_at,
              last_provider_event_id
            )
            values (
              p_user_id,
              v_entitlement_key,
              p_entitlement_state,
              p_purchase_at,
              p_expires_at,
              p_store,
              pg_catalog.now(),
              p_event_at,
              p_provider_event_id
            )
            on conflict (user_id, entitlement_key) do update
            set
              is_active = excluded.is_active,
              starts_at = excluded.starts_at,
              ends_at = excluded.ends_at,
              source = excluded.source,
              last_event_at = pg_catalog.now(),
              last_provider_event_at = excluded.last_provider_event_at,
              last_provider_event_id = excluded.last_provider_event_id
            where public.rc_entitlements.last_provider_event_at is null
               or excluded.last_provider_event_at > public.rc_entitlements.last_provider_event_at
            returning true
          )
          select coalesce(pg_catalog.bool_or(true), false)
          into v_key_changed
          from changed;

          if v_key_changed then
            v_changed_count := v_changed_count + 1;
          end if;
        end loop;

        if v_changed_count = 0 then
          v_status := 'ignored';
          v_ignored_reason := 'stale_event_time';
        else
          v_status := 'applied';
        end if;
      end if;

      if v_status = 'applied' then
        select exists (
          select 1
          from public.rc_entitlements
          where user_id = p_user_id
            and is_active = true
            and entitlement_key = any (array['pro_access', 'Pro', 'pro']::text[])
        ) into v_has_active_pro;

        update public.profiles
        set is_pro = v_has_active_pro
        where id = p_user_id
          and is_pro is distinct from v_has_active_pro;

        with pending_resolution as (
          select
            e.provider_event_id,
            array(
              select unresolved_key
              from pg_catalog.unnest(e.reconciliation_keys) as unresolved_key
              where unresolved_key <> all (v_entitlement_keys)
              order by unresolved_key
            ) as remaining_keys
          from public.rc_webhook_events e
          where e.provider_event_id <> p_provider_event_id
            and e.target_user_id = p_user_id
            and e.processing_status = 'retry'
            and e.ignored_reason = 'ambiguous_equal_timestamp'
            and e.event_at < p_event_at
            and e.reconciliation_keys && v_entitlement_keys
        )
        update public.rc_webhook_events e
        set
          reconciliation_keys = pending_resolution.remaining_keys,
          processing_status = case
            when pg_catalog.cardinality(pending_resolution.remaining_keys) = 0
              then 'ignored'
            else 'retry'
          end,
          ignored_reason = case
            when pg_catalog.cardinality(pending_resolution.remaining_keys) = 0
              then 'superseded_by_newer_event'
            else 'ambiguous_equal_timestamp'
          end,
          processed_at = case
            when pg_catalog.cardinality(pending_resolution.remaining_keys) = 0
              then pg_catalog.now()
            else null
          end
        from pending_resolution
        where e.provider_event_id = pending_resolution.provider_event_id;
      end if;
    end if;
  end if;

  update public.rc_webhook_events
  set
    processing_status = v_status,
    ignored_reason = v_ignored_reason,
    reconciliation_keys = case
      when v_status = 'retry'
        and v_ignored_reason = 'ambiguous_equal_timestamp'
        then v_reconciliation_keys
      else '{}'::text[]
    end,
    processed_at = case
      when v_status = 'retry' then null
      else pg_catalog.now()
    end
  where provider_event_id = p_provider_event_id;

  return pg_catalog.jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'entitlement_applied', v_changed_count > 0,
    'status', v_status,
    'ignored_reason', v_ignored_reason,
    'credit_result', v_credit_result
  );
end;
$function$;

commit;
