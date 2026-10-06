-- Temporarily pause referral wallet grants without consuming accepted claims.
-- Only the disabled settlement branch/readback changes. Welcome activation,
-- historical rewards and existing enabled settlement semantics are preserved.
-- Re-enable only after trusted eligibility and its rollout are reviewed.
begin;

create or replace function private.referral_existing_result_v2(
  p_referral public.user_referrals
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_inviter_amount integer := 0;
  v_referred_amount integer := 0;
  v_outcome text;
begin
  -- Keep accepted, activated claims durable while rewards are paused. Older
  -- clients already understand program_disabled; pending state is preserved.
  if p_referral.status = 'pending'
    and p_referral.reward_outcome = 'pending_activation_v2'
    and not private.referral_config_boolean_v2('referral_program_enabled_v2', false)
    and exists (
      select 1 from private.account_activation_receipts activation
      where activation.user_id = p_referral.referred_user_id
        and activation.source = 'first_promise_v1'
    )
  then
    return pg_catalog.jsonb_build_object(
      'success', true, 'result_code', 'referral_accepted_v2',
      'accepted', true, 'outcome', 'program_disabled',
      'referral_id', p_referral.id,
      'referral_code', p_referral.referral_code,
      'authoritative_referral_code', p_referral.referral_code,
      'status', p_referral.status, 'authoritative_status', p_referral.status,
      'already_claimed', false, 'programme_enabled', false,
      'reward_outcome', p_referral.reward_outcome,
      'referred_reward_amount', 0, 'inviter_reward_amount', 0,
      'inviter_capped', false, 'settlement_paused', true
    );
  end if;

  select coalesce(transaction_row.amount, 0)
  into v_referred_amount
  from public.wallet_transactions transaction_row
  where transaction_row.external_reference_id =
    'referral_reward_v2:referred:' || p_referral.id::text
  limit 1;

  select coalesce(transaction_row.amount, 0)
  into v_inviter_amount
  from public.wallet_transactions transaction_row
  where transaction_row.external_reference_id =
    'referral_reward_v2:inviter:' || p_referral.id::text
  limit 1;

  v_outcome := case p_referral.reward_outcome
    when 'pending_activation_v2' then 'pending_activation'
    when 'cancelled_before_activation_v2' then 'cancelled'
    when 'account_not_eligible_v2' then 'account_not_eligible'
    when 'rewards_granted_v2' then 'both_rewarded'
    when 'inviter_capped_v2' then 'inviter_capped'
    when 'programme_disabled_v2' then 'program_disabled'
    else 'referral_already_accepted'
  end;

  return pg_catalog.jsonb_build_object(
    'success', p_referral.reward_outcome in (
      'rewards_granted_v2',
      'inviter_capped_v2',
      'programme_disabled_v2'
    ),
    'result_code', case
      when p_referral.reward_outcome = 'pending_activation_v2'
        then 'activation_required'
      when p_referral.reward_outcome = 'cancelled_before_activation_v2'
        then 'referral_cancelled'
      when p_referral.reward_outcome = 'account_not_eligible_v2'
        then 'account_not_eligible'
      when p_referral.reward_outcome in (
        'rewards_granted_v2',
        'inviter_capped_v2',
        'programme_disabled_v2'
      ) then 'referral_accepted_v2'
      else 'already_claimed'
    end,
    'accepted', p_referral.reward_outcome in (
      'rewards_granted_v2',
      'inviter_capped_v2',
      'programme_disabled_v2'
    ),
    'outcome', v_outcome,
    'referral_id', p_referral.id,
    'referral_code', p_referral.referral_code,
    'authoritative_referral_code', p_referral.referral_code,
    'status', p_referral.status,
    'authoritative_status', p_referral.status,
    'already_claimed', p_referral.reward_outcome <> 'pending_activation_v2',
    'reward_outcome', p_referral.reward_outcome,
    'referred_reward_amount', coalesce(v_referred_amount, 0),
    'inviter_reward_amount', coalesce(v_inviter_amount, 0),
    'inviter_capped', p_referral.reward_outcome = 'inviter_capped_v2'
  );
end;
$function$;

create or replace function private.settle_referral_v2(
  p_referral_id uuid,
  p_referred_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_referral public.user_referrals%rowtype;
  v_profile_id uuid;
  v_programme_enabled boolean;
  v_reward_amount integer;
  v_annual_cap integer;
  v_year_start timestamptz;
  v_year_end timestamptz;
  v_inviter_rewards integer := 0;
  v_referred_transaction_id bigint;
  v_inviter_transaction_id bigint;
  v_referred_balance integer;
begin
  if not exists (
    select 1
    from private.account_activation_receipts activation
    where activation.user_id = p_referred_user_id
      and activation.source = 'first_promise_v1'
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', case
        when exists (
          select 1
          from private.account_activation_receipts activation
          where activation.user_id = p_referred_user_id
        ) then 'account_not_eligible'
        else 'activation_required'
      end,
      'accepted', false,
      'outcome', case
        when exists (
          select 1
          from private.account_activation_receipts activation
          where activation.user_id = p_referred_user_id
        ) then 'account_not_eligible'
        else 'activation_required'
      end,
      'referral_id', p_referral_id,
      'referral_code', null,
      'status', 'pending',
      'already_claimed', false,
      'reward_outcome', 'pending_activation_v2',
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0,
      'inviter_capped', false
    );
  end if;

  select referral.*
  into v_referral
  from public.user_referrals referral
  where referral.id = p_referral_id
    and referral.referred_user_id = p_referred_user_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', 'referral_not_found',
      'accepted', false,
      'outcome', 'referral_already_accepted',
      'referral_id', p_referral_id,
      'referral_code', null,
      'status', null,
      'already_claimed', false,
      'reward_outcome', null,
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0,
      'inviter_capped', false
    );
  end if;

  if v_referral.status <> 'pending'
     or v_referral.reward_outcome <> 'pending_activation_v2' then
    return private.referral_existing_result_v2(v_referral);
  end if;

  -- Lock both wallets in one deterministic order before calculating the cap
  -- or changing a balance.
  for v_profile_id in
    select profile.id
    from public.profiles profile
    where profile.id in (
      v_referral.referrer_user_id,
      v_referral.referred_user_id
    )
    order by profile.id
    for update
  loop
    null;
  end loop;

  v_programme_enabled := private.referral_config_boolean_v2(
    'referral_program_enabled_v2',
    false
  );
  v_reward_amount := 50;
  v_annual_cap := 10;

  if not v_programme_enabled then
    -- Do not consume accepted claims. A future reviewed eligibility process
    -- may settle them; simply re-enabling rewards is not an abuse control.
    return private.referral_existing_result_v2(v_referral);
  end if;

  v_year_start := (
    pg_catalog.date_trunc('year', now() at time zone 'UTC')
    at time zone 'UTC'
  );
  v_year_end := v_year_start + interval '1 year';

  select count(*)::integer
  into v_inviter_rewards
  from public.wallet_transactions transaction_row
  where transaction_row.user_id = v_referral.referrer_user_id
    and transaction_row.amount = 50
    and pg_catalog.left(
      transaction_row.external_reference_id,
      pg_catalog.length('referral_reward_v2:inviter:')
    ) = 'referral_reward_v2:inviter:'
    and transaction_row.created_at >= v_year_start
    and transaction_row.created_at < v_year_end;

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    description,
    reference_id,
    external_reference_id,
    created_at
  )
  values (
    v_referral.referred_user_id,
    v_reward_amount,
    'Referral reward',
    'bonus',
    'Referral reward for starting a first promise',
    v_referral.id,
    'referral_reward_v2:referred:' || v_referral.id::text,
    now()
  )
  on conflict (external_reference_id)
    where external_reference_id is not null
  do nothing
  returning id into v_referred_transaction_id;

  if v_referred_transaction_id is not null then
    update public.profiles
    set
      momenta_balance = coalesce(momenta_balance, 0) + v_reward_amount,
      updated_at = now()
    where id = v_referral.referred_user_id
    returning momenta_balance into v_referred_balance;
  else
    select profile.momenta_balance
    into v_referred_balance
    from public.profiles profile
    where profile.id = v_referral.referred_user_id;
  end if;

  if v_inviter_rewards < v_annual_cap then
    insert into public.wallet_transactions (
      user_id,
      amount,
      reason,
      transaction_type,
      description,
      reference_id,
      external_reference_id,
      created_at
    )
    values (
      v_referral.referrer_user_id,
      v_reward_amount,
      'Referral reward',
      'bonus',
      'Referral reward for an activated account',
      v_referral.id,
      'referral_reward_v2:inviter:' || v_referral.id::text,
      now()
    )
    on conflict (external_reference_id)
      where external_reference_id is not null
    do nothing
    returning id into v_inviter_transaction_id;

    if v_inviter_transaction_id is not null then
      update public.profiles
      set
        momenta_balance = coalesce(momenta_balance, 0) + v_reward_amount,
        updated_at = now()
      where id = v_referral.referrer_user_id;
    end if;

    update public.user_referrals
    set
      status = 'completed',
      completed_at = now(),
      reward_granted = true,
      reward_outcome = 'rewards_granted_v2'
    where id = v_referral.id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'result_code', 'referral_accepted_v2',
      'accepted', true,
      'outcome', 'both_rewarded',
      'referral_id', v_referral.id,
      'referral_code', v_referral.referral_code,
      'authoritative_referral_code', v_referral.referral_code,
      'status', 'completed',
      'authoritative_status', 'completed',
      'already_claimed', false,
      'programme_enabled', true,
      'reward_outcome', 'rewards_granted_v2',
      'referred_reward_amount', v_reward_amount,
      'referred_balance', coalesce(v_referred_balance, 0),
      'inviter_reward_amount', v_reward_amount,
      'inviter_capped', false
    );
  end if;

  update public.user_referrals
  set
    status = 'completed',
    completed_at = now(),
    reward_granted = false,
    reward_outcome = 'inviter_capped_v2'
  where id = v_referral.id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'referral_accepted_v2',
    'accepted', true,
    'outcome', 'inviter_capped',
    'referral_id', v_referral.id,
    'referral_code', v_referral.referral_code,
    'authoritative_referral_code', v_referral.referral_code,
    'status', 'completed',
    'authoritative_status', 'completed',
    'already_claimed', false,
    'programme_enabled', true,
    'reward_outcome', 'inviter_capped_v2',
    'referred_reward_amount', v_reward_amount,
    'referred_balance', coalesce(v_referred_balance, 0),
    'inviter_reward_amount', 0,
    'inviter_capped', true
  );
end;
$function$;

revoke all on function private.referral_existing_result_v2(public.user_referrals)
  from public, anon, authenticated, service_role;
revoke all on function private.settle_referral_v2(uuid, uuid)
  from public, anon, authenticated, service_role;

insert into public.system_config (key, value, updated_at)
values ('referral_program_enabled_v2', 'false', pg_catalog.now())
on conflict (key) do update
set value = excluded.value, updated_at = excluded.updated_at;

commit;
