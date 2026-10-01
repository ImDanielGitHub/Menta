-- Caller-initiated repair of a currently active weekly trial whose authenticated
-- provider event was applied without its initial credit. No historical backfill.
begin;

create or replace function public.reconcile_my_initial_pro_trial_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_authority record;
  v_entitlement public.rc_entitlements%rowtype;
  v_event public.rc_webhook_events%rowtype;
  v_receipt public.rc_receipts%rowtype;
  v_payload jsonb;
  v_price jsonb;
  v_reference text;
  v_credit jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  -- Match the webhook lock and ordering so cancellation/renewal and caller
  -- reconciliation cannot inspect and apply different versions concurrently.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('revenuecat-entitlement:' || v_user_id::text, 0)
  );

  select * into v_authority from public.get_my_pro_authority();
  if not found then
    raise exception 'PRO_AUTHORITY_UNAVAILABLE' using errcode = '55000';
  end if;
  if v_authority.reconciliation_pending then
    raise exception 'PRO_RECONCILIATION_PENDING' using errcode = '55000';
  end if;
  if v_authority.is_pro is not true then
    raise exception 'PRO_NOT_CONFIRMED' using errcode = '55000';
  end if;
  if not exists (
    select 1 from public.rc_entitlements
    where user_id = v_user_id and is_active
      and entitlement_key = any (array['pro_access', 'Pro', 'pro']::text[])
      and (ends_at is null or ends_at > pg_catalog.now())
  ) then
    raise exception 'PRO_NOT_CONFIRMED' using errcode = '55000';
  end if;

  -- Select latest authority before testing trial eligibility. Never search
  -- older trial events when a renewal or another current period supersedes one.
  select * into v_entitlement
  from public.rc_entitlements
  where user_id = v_user_id
    and entitlement_key = any (array['pro_access', 'Pro', 'pro']::text[])
  order by last_provider_event_at desc nulls last, entitlement_key
  limit 1;

  if not found then
    return pg_catalog.jsonb_build_object('success', true, 'outcome', 'not_eligible');
  end if;

  select * into v_event from public.rc_webhook_events
  where provider_event_id = v_entitlement.last_provider_event_id;

  if not found then
    return pg_catalog.jsonb_build_object('success', true, 'outcome', 'not_eligible');
  end if;
  if v_event.event_type <> 'INITIAL_PURCHASE' then
    return pg_catalog.jsonb_build_object('success', true, 'outcome', 'not_eligible');
  end if;

  v_payload := case
    when pg_catalog.jsonb_typeof(v_event.payload -> 'event') = 'object'
      then v_event.payload -> 'event'
    else v_event.payload
  end;
  v_price := case
    when pg_catalog.jsonb_typeof(v_payload -> 'price_in_purchased_currency') = 'number'
      then v_payload -> 'price_in_purchased_currency'
    else v_payload -> 'price'
  end;

  -- A confirmed paid period or another plan has no trial repair to perform.
  -- Unknown/malformed initial weekly trial evidence must keep activation pending.
  if (v_payload ->> 'product_id') is null
     or (v_payload ->> 'product_id') not ilike '%weekly%'
     or (v_payload ->> 'period_type') is distinct from 'TRIAL'
     or (pg_catalog.jsonb_typeof(v_price) = 'number' and v_price > '0'::jsonb) then
    return pg_catalog.jsonb_build_object('success', true, 'outcome', 'not_eligible');
  end if;

  if not v_entitlement.is_active or v_entitlement.ends_at <= pg_catalog.now() then
    return pg_catalog.jsonb_build_object('success', true, 'outcome', 'not_eligible');
  end if;

  if v_entitlement.ends_at is null
     or v_event.user_id is distinct from v_user_id
     or v_event.target_user_id is distinct from v_user_id
     or v_event.processing_status <> 'applied'
     or v_event.event_at is distinct from v_entitlement.last_provider_event_at
     or v_event.store is distinct from v_entitlement.source
     or not (v_entitlement.entitlement_key = any (v_event.entitlement_keys))
     or (v_payload ->> 'type') is distinct from 'INITIAL_PURCHASE'
     or (v_payload ->> 'period_type') is distinct from 'TRIAL'
     or pg_catalog.jsonb_typeof(v_price) is distinct from 'number'
     or v_price is distinct from '0'::jsonb
     or nullif(pg_catalog.btrim(v_payload ->> 'transaction_id'), '') is null
     or (v_payload ->> 'transaction_id') is distinct from v_event.transaction_id
     or (v_payload ->> 'product_id') not ilike '%weekly%'
     or (v_payload ->> 'product_id') is null
     or pg_catalog.lower(coalesce(nullif(v_payload ->> 'store', ''), 'app_store'))
       is distinct from v_event.store then
    raise exception 'PRO_TRIAL_RECEIPT_PENDING' using errcode = '55000';
  end if;

  select * into v_receipt from public.rc_receipts
  where user_id = v_user_id
    and store = v_event.store
    and transaction_id = v_event.transaction_id
    and product_id = v_payload ->> 'product_id'
    and purchase_at = v_entitlement.starts_at
    and expires_at = v_entitlement.ends_at;

  if not found then
    raise exception 'PRO_TRIAL_RECEIPT_PENDING' using errcode = '55000';
  end if;

  v_reference := 'rc:' || v_receipt.store || ':' || v_receipt.transaction_id
    || ':subscription_credit';
  if exists (
    select 1 from public.wallet_transactions
    where external_reference_id = v_reference
      and (user_id is distinct from v_user_id or amount is distinct from 75
        or reason is distinct from 'subscription_credit'
        or transaction_type is distinct from 'credit')
  ) then
    raise exception 'CREDIT_RECEIPT_MISMATCH' using errcode = '55000';
  end if;

  -- A forward webhook can already have granted from its fallback `price`
  -- field, for which legacy receipts store NULL amount_cents. Recognize the
  -- exact credited receipt without minting or requiring the repair-only amount.
  if exists (
    select 1 from public.wallet_transactions
    where external_reference_id = v_reference
  ) then
    return pg_catalog.jsonb_build_object('success', true, 'outcome', 'already_granted');
  end if;
  if v_receipt.amount_cents is distinct from 0 then
    raise exception 'PRO_TRIAL_RECEIPT_PENDING' using errcode = '55000';
  end if;

  v_credit := public.grant_momenta_credit(
    v_user_id, 75, 'subscription_credit', 'credit', v_reference, 'Menta Pro, weekly'
  );
  return pg_catalog.jsonb_build_object(
    'success', true,
    'outcome', case when (v_credit ->> 'duplicate')::boolean
      then 'already_granted' else 'granted' end,
    'balance', v_credit -> 'new_balance'
  );
end;
$$;

revoke all on function public.reconcile_my_initial_pro_trial_v1()
  from public, anon, authenticated;
grant execute on function public.reconcile_my_initial_pro_trial_v1()
  to authenticated;

commit;
