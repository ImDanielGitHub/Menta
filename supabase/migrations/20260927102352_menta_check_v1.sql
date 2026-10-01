-- Menta Check v1: Menta reviews proof.
--
-- A trigger queues each Menta-checked proof. The menta-check Edge Function
-- describes the photo, asks Jev fixed questions, applies the code thresholds
-- and writes the result through menta_check_apply_v1. That function reuses the
-- same lock order, pending check, earlier-proof rule and streak authority as a
-- human review, so an approval by Menta has exactly the effects of a human
-- approval. Decisions leave reviewer_id null, so no review reward can ever be
-- claimed for them.
--
-- People only ever see fixed catalogue copy chosen by a verdict's outcome,
-- reason and tip. No model-written text reaches a person.
begin;

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.challenges
  add column if not exists review_mode text,
  add column if not exists menta_backup_hours integer;

alter table public.challenges
  drop constraint if exists challenges_review_mode_check;
alter table public.challenges
  add constraint challenges_review_mode_check
  check (review_mode is null or review_mode in ('self', 'people', 'menta'));

alter table public.challenges
  drop constraint if exists challenges_menta_backup_hours_check;
alter table public.challenges
  add constraint challenges_menta_backup_hours_check
  check (menta_backup_hours is null or menta_backup_hours in (12, 24, 48));

alter table public.challenge_submissions
  add column if not exists review_source text;

alter table public.challenge_submissions
  drop constraint if exists challenge_submissions_review_source_check;
alter table public.challenge_submissions
  add constraint challenge_submissions_review_source_check
  check (
    review_source is null
    or review_source in (
      'human', 'self', 'menta', 'menta_backup', 'menta_unavailable',
      'self_override'
    )
  );

comment on column public.challenges.review_mode is
  'Who checks proof: self, people or menta. Null keeps the legacy allow_self_review meaning. Written only by set_promise_menta_check_v1 and Menta Check authority.';
comment on column public.challenges.menta_backup_hours is
  'When people check proof, Menta decides proof that nobody has checked after this many hours (12, 24 or 48). Null turns the backup off.';
comment on column public.challenge_submissions.review_source is
  'Who decided this proof: human, self, menta, menta_backup, menta_unavailable or self_override. Null for rows decided before Menta Check.';

-- Only the Menta Check RPCs may change review_mode or menta_backup_hours. A
-- creator who can update their own promise row must not be able to switch on
-- a paid review mode by writing the column directly.
create or replace function private.guard_menta_check_columns_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(pg_catalog.current_setting('menta.check_write', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.review_mode = 'menta' or new.menta_backup_hours is not null then
      raise exception 'MENTA_CHECK_MODE_REQUIRES_RPC';
    end if;
    return new;
  end if;

  if new.review_mode is distinct from old.review_mode
    or new.menta_backup_hours is distinct from old.menta_backup_hours
  then
    raise exception 'MENTA_CHECK_MODE_REQUIRES_RPC';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_menta_check_columns_v1()
  from public, anon, authenticated;

drop trigger if exists guard_menta_check_columns_v1 on public.challenges;
create trigger guard_menta_check_columns_v1
before insert or update on public.challenges
for each row execute function private.guard_menta_check_columns_v1();

-- ---------------------------------------------------------------------------
-- Private tables
-- ---------------------------------------------------------------------------

create table if not exists private.menta_check_consents (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  accepted_at timestamptz,
  withdrawn_at timestamptz,
  policy_version integer not null default 1,
  source text not null
    check (source in ('onboarding', 'create', 'settings', 'intro', 'group')),
  updated_at timestamptz not null default now()
);

create table if not exists private.menta_check_jobs (
  id bigint generated always as identity primary key,
  submission_id uuid not null
    references public.challenge_submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('check', 'hint', 'backup')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'done', 'dead')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, kind)
);

create index if not exists menta_check_jobs_due_idx
  on private.menta_check_jobs (next_attempt_at)
  where status in ('queued', 'processing');

create table if not exists private.menta_check_verdicts (
  submission_id uuid not null
    references public.challenge_submissions(id) on delete cascade,
  mode text not null check (mode in ('menta', 'hint', 'backup')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null,
  policy_version integer not null,
  outcome text not null check (
    outcome in (
      'counted', 'counted_tip', 'not_yet', 'backup_counted', 'unavailable',
      'access_ended', 'hint_only', 'left_for_people'
    )
  ),
  reason text check (
    reason is null or reason in (
      'cant_see_rule', 'shows_something_else', 'too_unclear', 'old_photo',
      'screenshot', 'duplicate'
    )
  ),
  tip text check (
    tip is null or tip in (
      'show_display', 'get_closer', 'more_light', 'show_whole_activity',
      'add_detail', 'video_counted'
    )
  ),
  hint text check (hint is null or hint in ('matches', 'unsure')),
  p_match numeric(5, 4),
  reason_confidence numeric(5, 4),
  flags text[] not null default '{}',
  second_look boolean not null default false,
  jev_model text,
  jev_request_id text,
  vision_model text,
  caption jsonb,
  jev_answers jsonb,
  media_sha256 text,
  cost_usd numeric(12, 8),
  latency_ms integer,
  applied boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (submission_id, mode)
);

create index if not exists menta_check_verdicts_user_idx
  on private.menta_check_verdicts (user_id, created_at desc);
create index if not exists menta_check_verdicts_hash_idx
  on private.menta_check_verdicts (user_id, media_sha256)
  where media_sha256 is not null;

create table if not exists private.menta_check_feedback (
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_event_id uuid not null,
  submission_id uuid not null
    references public.challenge_submissions(id) on delete cascade,
  kind text not null
    check (kind in ('false_negative', 'false_positive', 'group_question')),
  created_at timestamptz not null default now(),
  primary key (user_id, client_event_id),
  unique (user_id, submission_id, kind)
);

create table if not exists private.menta_check_overrides (
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_event_id uuid not null,
  rejected_submission_id uuid not null unique
    references public.challenge_submissions(id) on delete cascade,
  new_submission_id uuid,
  cost integer not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, client_event_id)
);

create table if not exists private.menta_check_passes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null
    references public.challenges(id) on delete cascade,
  active_until timestamptz not null,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

create table if not exists private.menta_check_receipts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_event_id uuid not null,
  operation text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, client_event_id)
);

alter table private.menta_check_consents enable row level security;
alter table private.menta_check_consents force row level security;
alter table private.menta_check_jobs enable row level security;
alter table private.menta_check_jobs force row level security;
alter table private.menta_check_verdicts enable row level security;
alter table private.menta_check_verdicts force row level security;
alter table private.menta_check_feedback enable row level security;
alter table private.menta_check_feedback force row level security;
alter table private.menta_check_overrides enable row level security;
alter table private.menta_check_overrides force row level security;
alter table private.menta_check_passes enable row level security;
alter table private.menta_check_passes force row level security;
alter table private.menta_check_receipts enable row level security;
alter table private.menta_check_receipts force row level security;

revoke all on table private.menta_check_consents from public, anon, authenticated;
revoke all on table private.menta_check_jobs from public, anon, authenticated;
revoke all on table private.menta_check_verdicts from public, anon, authenticated;
revoke all on table private.menta_check_feedback from public, anon, authenticated;
revoke all on table private.menta_check_overrides from public, anon, authenticated;
revoke all on table private.menta_check_passes from public, anon, authenticated;
revoke all on table private.menta_check_receipts from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.menta_check_has_consent_v1(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.menta_check_consents consent
    where consent.user_id = p_user_id
      and consent.accepted_at is not null
      and consent.withdrawn_at is null
  );
$$;

-- Returns 'pro', 'pass' or null. With p_charge a pass that has run out and is
-- set to renew is renewed from the Momenta balance for another week.
create or replace function private.menta_check_access_v1(
  p_user_id uuid,
  p_challenge_id uuid,
  p_charge boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pass private.menta_check_passes%rowtype;
  v_cost constant integer := 20;
  v_new_balance integer;
begin
  if p_user_id is null then
    return null;
  end if;

  if public.user_is_pro(p_user_id) then
    return 'pro';
  end if;

  if p_challenge_id is null then
    return null;
  end if;

  select pass.* into v_pass
  from private.menta_check_passes pass
  where pass.user_id = p_user_id
    and pass.challenge_id = p_challenge_id
  for update;

  if not found then
    return null;
  end if;

  if v_pass.active_until > pg_catalog.now() then
    return 'pass';
  end if;

  if not p_charge or not v_pass.auto_renew then
    return null;
  end if;

  update public.profiles profile
  set
    momenta_balance = coalesce(profile.momenta_balance, 0) - v_cost,
    updated_at = pg_catalog.now()
  where profile.id = p_user_id
    and coalesce(profile.momenta_balance, 0) >= v_cost
  returning profile.momenta_balance into v_new_balance;

  if v_new_balance is null then
    return null;
  end if;

  insert into public.wallet_transactions (
    user_id, amount, reason, source_uuid, transaction_type, description,
    reference_id, created_at
  ) values (
    p_user_id, -v_cost, 'menta_check_pass', pg_catalog.gen_random_uuid(),
    'spent', 'Menta Check for one promise, one week', p_challenge_id,
    pg_catalog.now()
  );

  update private.menta_check_passes pass
  set
    active_until = pg_catalog.now() + interval '7 days',
    updated_at = pg_catalog.now()
  where pass.user_id = p_user_id
    and pass.challenge_id = p_challenge_id;

  return 'pass';
end;
$$;

-- A promise Menta checks alone has no other people in it.
create or replace function private.menta_check_promise_is_solo_v1(
  p_challenge_id uuid,
  p_creator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
      select 1
      from public.challenge_participants participant
      where participant.challenge_id = p_challenge_id
        and participant.user_id is distinct from p_creator_id
        and coalesce(participant.status, 'active') = 'active'
    )
    and not exists (
      select 1
      from public.team_challenges link
      where link.challenge_id = p_challenge_id
    );
$$;

create or replace function private.menta_check_wake_v1()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- pg_net sends after commit, so the job row is visible to the worker. A
  -- failed wake-up never loses the job; the one-minute schedule is the
  -- fallback.
  begin
    perform net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'project_url'
      ) || '/functions/v1/menta-check?batch=5',
      headers := pg_catalog.jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'anon_key'
        ),
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'anon_key'
        ),
        'x-maintenance-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'daily_maintenance_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  exception when others then
    null;
  end;
end;
$$;

-- English fallback for review_notes. The app shows its own localised copy
-- from the verdict; this text only reaches older app versions.
create or replace function private.menta_check_reason_note_v1(p_reason text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_reason
    when 'cant_see_rule' then 'Menta could not see what the proof rule asks for. Send another photo.'
    when 'shows_something_else' then 'Menta saw something different from the proof rule. Send another photo.'
    when 'old_photo' then 'Menta needs a photo taken today. Send a new one.'
    when 'screenshot' then 'Menta needs a real photo for this rule, not a screenshot.'
    when 'duplicate' then 'Menta has seen this photo before. Send a new one.'
    else 'Menta could not make this proof out. Send a clearer one.'
  end;
$$;

create or replace function private.enqueue_menta_check_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_backup integer;
  v_kind text;
begin
  if new.status is distinct from 'pending' then
    return new;
  end if;

  select challenge.review_mode, challenge.menta_backup_hours
  into v_mode, v_backup
  from public.challenges challenge
  where challenge.id = new.challenge_id;

  if v_mode = 'menta' then
    v_kind := 'check';
  elsif v_backup is not null
    and private.menta_check_has_consent_v1(new.user_id)
  then
    v_kind := 'hint';
  else
    return new;
  end if;

  insert into private.menta_check_jobs (submission_id, user_id, kind)
  values (new.id, new.user_id, v_kind)
  on conflict (submission_id, kind) do nothing;

  perform private.menta_check_wake_v1();
  return new;
exception when others then
  -- Queueing Menta Check must never block sending proof.
  return new;
end;
$$;

revoke all on function private.menta_check_has_consent_v1(uuid)
  from public, anon, authenticated;
revoke all on function private.menta_check_access_v1(uuid, uuid, boolean)
  from public, anon, authenticated;
revoke all on function private.menta_check_promise_is_solo_v1(uuid, uuid)
  from public, anon, authenticated;
revoke all on function private.menta_check_wake_v1()
  from public, anon, authenticated;
revoke all on function private.menta_check_reason_note_v1(text)
  from public, anon, authenticated;
revoke all on function private.enqueue_menta_check_v1()
  from public, anon, authenticated;

drop trigger if exists enqueue_menta_check_v1 on public.challenge_submissions;
create trigger enqueue_menta_check_v1
after insert on public.challenge_submissions
for each row execute function private.enqueue_menta_check_v1();

-- Menta sends its own result message. Keep the generic review result push
-- for decisions people make, so a Menta decision is announced once.
create or replace function private.enqueue_challenge_review_notifications_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge_title text;
  v_recipient record;
begin
  select challenge_row.title
  into v_challenge_title
  from public.challenges challenge_row
  where challenge_row.id = new.challenge_id;

  if new.status = 'pending'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    for v_recipient in
      select recipient.reviewer_id
      from private.challenge_review_recipients_v1(
        new.challenge_id,
        new.user_id
      ) recipient
    loop
      perform private.enqueue_notification_v1(
        v_recipient.reviewer_id,
        'review_reminder',
        'Proof ready to review',
        pg_catalog.format(
          'A proof for %s is waiting for a decision.',
          coalesce(nullif(v_challenge_title, ''), 'a promise')
        ),
        pg_catalog.jsonb_build_object(
          'type', 'review_reminder',
          'action', 'open_review_queue',
          'challengeId', new.challenge_id,
          'submissionId', new.id
        ),
        pg_catalog.jsonb_build_object('challengeTitle', v_challenge_title),
        2,
        pg_catalog.format(
          'challenge-review-ready:%s:%s',
          new.id,
          v_recipient.reviewer_id
        ),
        pg_catalog.now()
      );
    end loop;
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'pending'
    and new.status in ('approved', 'rejected')
    and coalesce(new.review_source, 'human') = 'human'
  then
    perform private.enqueue_notification_v1(
      new.user_id,
      case
        when new.status = 'approved' then 'verification_approved'
        else 'verification_rejected'
      end,
      case when new.status = 'approved' then 'Proof approved' else 'Proof needs changes' end,
      case
        when new.status = 'approved'
          then pg_catalog.format(
            'Your proof for %s was approved.',
            coalesce(nullif(v_challenge_title, ''), 'your promise')
          )
        else pg_catalog.format(
          'Your proof for %s needs a correction. Open the promise for the reviewer note.',
          coalesce(nullif(v_challenge_title, ''), 'your promise')
        )
      end,
      pg_catalog.jsonb_build_object(
        'type', case
          when new.status = 'approved' then 'verification_approved'
          else 'verification_rejected'
        end,
        'action', 'open_challenge',
        'challengeId', new.challenge_id,
        'submissionId', new.id
      ),
      pg_catalog.jsonb_build_object('challengeTitle', v_challenge_title),
      2,
      pg_catalog.format('challenge-review-result:%s:%s', new.id, new.status),
      pg_catalog.now()
    );
  end if;

  return new;
end;
$$;

revoke all on function private.enqueue_challenge_review_notifications_v1()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Service functions (menta-check Edge Function only)

-- ---------------------------------------------------------------------------

-- Queue backup checks for proof people have not checked in time.
create or replace function public.menta_check_queue_backups_v1(
  p_limit integer default 50
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
begin
  with due as (
    select submission.id, submission.user_id
    from public.challenge_submissions submission
    join public.challenges challenge on challenge.id = submission.challenge_id
    where submission.status = 'pending'
      and challenge.review_mode is distinct from 'menta'
      and challenge.menta_backup_hours is not null
      and submission.submission_date
        < pg_catalog.now()
          - pg_catalog.make_interval(hours => challenge.menta_backup_hours)
      and private.menta_check_has_consent_v1(submission.user_id)
      and not exists (
        select 1 from private.menta_check_jobs job
        where job.submission_id = submission.id
          and job.kind = 'backup'
      )
    order by submission.submission_date
    limit greatest(1, least(coalesce(p_limit, 50), 200))
  ), inserted as (
    insert into private.menta_check_jobs (submission_id, user_id, kind)
    select due.id, due.user_id, 'backup' from due
    on conflict (submission_id, kind) do nothing
    returning 1
  )
  select count(*)::integer into v_count from inserted;

  -- A backup that could not decide stays pending for people. Look again
  -- every 12 hours so the 72-hour rule can still apply.
  update private.menta_check_jobs job
  set status = 'queued', next_attempt_at = pg_catalog.now(), attempts = 0,
      updated_at = pg_catalog.now()
  where job.kind = 'backup'
    and job.status = 'done'
    and job.updated_at < pg_catalog.now() - interval '12 hours'
    and exists (
      select 1 from public.challenge_submissions submission
      where submission.id = job.submission_id
        and submission.status = 'pending'
        and submission.submission_date > pg_catalog.now() - interval '4 days'
    );

  return v_count;
end;
$$;

create or replace function public.menta_check_claim_v1(
  p_limit integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jobs jsonb := '[]'::jsonb;
begin
  -- Finish jobs whose proof no longer needs Menta.
  update private.menta_check_jobs job
  set status = 'done', updated_at = pg_catalog.now()
  where job.status in ('queued', 'processing')
    and exists (
      select 1 from public.challenge_submissions submission
      where submission.id = job.submission_id
        and submission.status is distinct from 'pending'
    );

  with claimable as (
    select job.id
    from private.menta_check_jobs job
    where job.status in ('queued', 'processing')
      and job.next_attempt_at <= pg_catalog.now()
      and (job.locked_until is null or job.locked_until < pg_catalog.now())
    order by job.created_at
    limit greatest(1, least(coalesce(p_limit, 5), 20))
    for update skip locked
  ), claimed as (
    update private.menta_check_jobs job
    set
      status = 'processing',
      attempts = job.attempts + 1,
      locked_until = pg_catalog.now() + interval '2 minutes',
      updated_at = pg_catalog.now()
    from claimable
    where job.id = claimable.id
    returning job.*
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'job_id', claimed.id,
    'kind', claimed.kind,
    'attempts', claimed.attempts,
    'submission_id', submission.id,
    'user_id', submission.user_id,
    'challenge_id', submission.challenge_id,
    'status', submission.status,
    'media_url', submission.media_url,
    'media_type', submission.media_type,
    'submission_text', submission.submission_text,
    'submitted_at', submission.submission_date,
    'local_day', submission.local_day::text,
    'is_correction', submission.replaces_submission_id is not null,
    'minutes_pending', pg_catalog.floor(
      extract(epoch from pg_catalog.now() - submission.submission_date) / 60
    )::integer,
    'local_time', pg_catalog.to_char(
      submission.submission_date at time zone public.get_effective_streak_timezone(
        submission.user_id, submission.challenge_id, null
      ),
      'HH24:MI'
    ),
    'promise_title', challenge.title,
    'proof_rule', challenge.verification_description,
    'proof_kind', challenge.verification_type,
    'review_mode', challenge.review_mode,
    'not_yets_today', (
      select count(*)::integer
      from public.challenge_submissions earlier
      join private.menta_check_verdicts verdict
        on verdict.submission_id = earlier.id and verdict.mode = 'menta'
      where earlier.user_id = submission.user_id
        and earlier.challenge_id = submission.challenge_id
        and earlier.local_day = submission.local_day
        and verdict.outcome = 'not_yet'
    ),
    'prior_verdict', (
      select pg_catalog.jsonb_build_object(
        'p_match', verdict.p_match,
        'reason', verdict.reason,
        'reason_confidence', verdict.reason_confidence,
        'tip', verdict.tip,
        'flags', pg_catalog.to_jsonb(verdict.flags),
        'jev_model', verdict.jev_model,
        'vision_model', verdict.vision_model
      )
      from private.menta_check_verdicts verdict
      where verdict.submission_id = submission.id
        and verdict.mode = 'hint'
    ),
    'recent_hashes', coalesce((
      select pg_catalog.jsonb_agg(verdict.media_sha256)
      from private.menta_check_verdicts verdict
      where verdict.user_id = submission.user_id
        and verdict.media_sha256 is not null
        and verdict.submission_id <> submission.id
        and verdict.created_at > pg_catalog.now() - interval '90 days'
    ), '[]'::jsonb)
  )), '[]'::jsonb)
  into v_jobs
  from claimed
  join public.challenge_submissions submission
    on submission.id = claimed.submission_id
  join public.challenges challenge on challenge.id = submission.challenge_id;

  return v_jobs;
end;
$$;

-- Retry with backoff. A 'check' job that keeps failing, or a proof that has
-- waited 30 minutes, fails open: the caller then applies 'unavailable'.
create or replace function public.menta_check_fail_v1(
  p_job_id bigint,
  p_error text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.menta_check_jobs%rowtype;
  v_submitted_at timestamptz;
begin
  select job.* into v_job
  from private.menta_check_jobs job
  where job.id = p_job_id
  for update;

  if not found then
    return 'missing';
  end if;

  select submission.submission_date into v_submitted_at
  from public.challenge_submissions submission
  where submission.id = v_job.submission_id;

  if v_job.kind = 'check'
    and (
      v_job.attempts >= 5
      or v_submitted_at < pg_catalog.now() - interval '30 minutes'
    )
  then
    update private.menta_check_jobs job
    set last_error = pg_catalog.left(coalesce(p_error, ''), 500),
        updated_at = pg_catalog.now()
    where job.id = p_job_id;
    return 'fail_open';
  end if;

  if v_job.attempts >= 6 then
    update private.menta_check_jobs job
    set status = 'dead',
        last_error = pg_catalog.left(coalesce(p_error, ''), 500),
        locked_until = null,
        updated_at = pg_catalog.now()
    where job.id = p_job_id;
    return 'dead';
  end if;

  update private.menta_check_jobs job
  set
    status = 'queued',
    locked_until = null,
    last_error = pg_catalog.left(coalesce(p_error, ''), 500),
    next_attempt_at = pg_catalog.now() + case v_job.attempts
      when 1 then interval '20 seconds'
      when 2 then interval '1 minute'
      when 3 then interval '4 minutes'
      else interval '10 minutes'
    end,
    updated_at = pg_catalog.now()
  where job.id = p_job_id;
  return 'retry';
end;
$$;

-- Records a verdict and, for 'check' and 'backup' jobs, applies it with the
-- same authority as a human review.
create or replace function public.menta_check_apply_v1(
  p_job_id bigint,
  p_verdict jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.menta_check_jobs%rowtype;
  v_submission public.challenge_submissions%rowtype;
  v_challenge public.challenges%rowtype;
  v_decision text := p_verdict ->> 'decision';
  v_outcome text := p_verdict ->> 'outcome';
  v_reason text := nullif(p_verdict ->> 'reason', '');
  v_tip text := nullif(p_verdict ->> 'tip', '');
  v_mode text;
  v_access text;
  v_source text;
  v_tz text;
  v_day_end timestamptz;
  v_streak jsonb := 'null'::jsonb;
  v_notification_type text;
  v_title text;
  v_body text;
begin
  if v_decision not in ('approve', 'reject', 'record') then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'INVALID_DECISION');
  end if;

  select job.* into v_job
  from private.menta_check_jobs job
  where job.id = p_job_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'JOB_NOT_FOUND');
  end if;

  v_mode := case v_job.kind when 'check' then 'menta' else v_job.kind end;

  select challenge.* into v_challenge
  from public.challenges challenge
  join public.challenge_submissions submission
    on submission.challenge_id = challenge.id
  where submission.id = v_job.submission_id;

  -- Match the human review lock order: participant, then proof.
  perform 1
  from public.challenge_participants participant
  join public.challenge_submissions submission
    on submission.challenge_id = participant.challenge_id
   and submission.user_id = participant.user_id
  where submission.id = v_job.submission_id
    and coalesce(participant.status, 'active') = 'active'
  for update of participant;

  select submission.* into v_submission
  from public.challenge_submissions submission
  where submission.id = v_job.submission_id
  for update;

  if not found then
    update private.menta_check_jobs job
    set status = 'done', locked_until = null, updated_at = pg_catalog.now()
    where job.id = p_job_id;
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND');
  end if;

  -- A hint only records what Menta thinks. People still decide.
  if v_job.kind = 'hint' or v_decision = 'record' then
    insert into private.menta_check_verdicts (
      submission_id, mode, user_id, challenge_id, policy_version, outcome,
      reason, tip, hint, p_match, reason_confidence, flags, second_look,
      jev_model, jev_request_id, vision_model, caption, jev_answers,
      media_sha256, cost_usd, latency_ms, applied
    ) values (
      v_submission.id, v_mode, v_submission.user_id, v_submission.challenge_id,
      coalesce((p_verdict ->> 'policy_version')::integer, 1),
      coalesce(v_outcome, 'hint_only'), v_reason, v_tip,
      nullif(p_verdict ->> 'hint', ''),
      (p_verdict ->> 'p_match')::numeric,
      (p_verdict ->> 'reason_confidence')::numeric,
      coalesce(
        array(select pg_catalog.jsonb_array_elements_text(p_verdict -> 'flags')),
        '{}'::text[]
      ),
      coalesce((p_verdict ->> 'second_look')::boolean, false),
      p_verdict ->> 'jev_model', p_verdict ->> 'jev_request_id',
      p_verdict ->> 'vision_model', p_verdict -> 'caption',
      p_verdict -> 'jev_answers', p_verdict ->> 'media_sha256',
      (p_verdict ->> 'cost_usd')::numeric, (p_verdict ->> 'latency_ms')::integer,
      false
    )
    on conflict (submission_id, mode) do update set
      outcome = excluded.outcome,
      reason = excluded.reason,
      tip = excluded.tip,
      hint = excluded.hint,
      p_match = excluded.p_match,
      reason_confidence = excluded.reason_confidence,
      flags = excluded.flags,
      created_at = pg_catalog.now();

    update private.menta_check_jobs job
    set status = 'done', locked_until = null, updated_at = pg_catalog.now()
    where job.id = p_job_id;
    return pg_catalog.jsonb_build_object('success', true, 'code', 'RECORDED');
  end if;

  if v_submission.status is distinct from 'pending' then
    update private.menta_check_jobs job
    set status = 'done', locked_until = null, updated_at = pg_catalog.now()
    where job.id = p_job_id;
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'ALREADY_DECIDED',
      'current_status', v_submission.status
    );
  end if;

  if exists (
    select 1
    from public.challenge_submissions earlier
    where earlier.challenge_id = v_submission.challenge_id
      and earlier.user_id = v_submission.user_id
      and earlier.status = 'pending'
      and (
        earlier.local_day < v_submission.local_day
        or (
          earlier.local_day = v_submission.local_day
          and earlier.submission_date < v_submission.submission_date
        )
      )
  ) then
    update private.menta_check_jobs job
    set status = 'queued', locked_until = null,
        next_attempt_at = pg_catalog.now() + interval '1 minute',
        updated_at = pg_catalog.now()
    where job.id = p_job_id;
    return pg_catalog.jsonb_build_object('success', false, 'code', 'EARLIER_PROOF_FIRST');
  end if;

  -- Menta only checks the proof of someone who said yes, with access.
  if v_mode = 'menta' then
    v_access := private.menta_check_access_v1(
      v_submission.user_id, v_submission.challenge_id, true
    );
    if v_access is null
      or not private.menta_check_has_consent_v1(v_submission.user_id)
    then
      v_decision := 'approve';
      v_outcome := 'access_ended';
      v_reason := null;
      v_tip := null;
      perform pg_catalog.set_config('menta.check_write', 'on', true);
      update public.challenges challenge
      set review_mode = 'self', allow_self_review = true,
          updated_at = pg_catalog.now()
      where challenge.id = v_submission.challenge_id;
      perform pg_catalog.set_config('menta.check_write', 'off', true);
    end if;
  elsif v_mode = 'backup' then
    if not private.menta_check_has_consent_v1(v_submission.user_id) then
      update private.menta_check_jobs job
      set status = 'done', locked_until = null, updated_at = pg_catalog.now()
      where job.id = p_job_id;
      return pg_catalog.jsonb_build_object('success', false, 'code', 'NO_CONSENT');
    end if;
    -- Backup never rejects. Anything short of a confident pass stays with
    -- people.
    if v_decision = 'reject' then
      v_decision := 'record';
      v_outcome := 'left_for_people';
    end if;
  end if;

  insert into private.menta_check_verdicts (
    submission_id, mode, user_id, challenge_id, policy_version, outcome,
    reason, tip, hint, p_match, reason_confidence, flags, second_look,
    jev_model, jev_request_id, vision_model, caption, jev_answers,
    media_sha256, cost_usd, latency_ms, applied
  ) values (
    v_submission.id, v_mode, v_submission.user_id, v_submission.challenge_id,
    coalesce((p_verdict ->> 'policy_version')::integer, 1),
    v_outcome, v_reason, v_tip, nullif(p_verdict ->> 'hint', ''),
    (p_verdict ->> 'p_match')::numeric,
    (p_verdict ->> 'reason_confidence')::numeric,
    coalesce(
      array(select pg_catalog.jsonb_array_elements_text(p_verdict -> 'flags')),
      '{}'::text[]
    ),
    coalesce((p_verdict ->> 'second_look')::boolean, false),
    p_verdict ->> 'jev_model', p_verdict ->> 'jev_request_id',
    p_verdict ->> 'vision_model', p_verdict -> 'caption',
    p_verdict -> 'jev_answers', p_verdict ->> 'media_sha256',
    (p_verdict ->> 'cost_usd')::numeric, (p_verdict ->> 'latency_ms')::integer,
    v_decision in ('approve', 'reject')
  )
  on conflict (submission_id, mode) do update set
    outcome = excluded.outcome,
    reason = excluded.reason,
    tip = excluded.tip,
    p_match = excluded.p_match,
    reason_confidence = excluded.reason_confidence,
    flags = excluded.flags,
    second_look = excluded.second_look,
    jev_model = coalesce(excluded.jev_model, private.menta_check_verdicts.jev_model),
    vision_model = coalesce(excluded.vision_model, private.menta_check_verdicts.vision_model),
    media_sha256 = coalesce(excluded.media_sha256, private.menta_check_verdicts.media_sha256),
    applied = excluded.applied,
    created_at = pg_catalog.now();

  if v_decision = 'record' then
    update private.menta_check_jobs job
    set status = 'done', locked_until = null, updated_at = pg_catalog.now()
    where job.id = p_job_id;
    return pg_catalog.jsonb_build_object('success', true, 'code', 'LEFT_FOR_PEOPLE');
  end if;

  v_tz := public.get_effective_streak_timezone(
    v_submission.user_id, v_submission.challenge_id, null
  );

  if v_decision = 'approve' then
    v_source := case v_outcome
      when 'backup_counted' then 'menta_backup'
      when 'unavailable' then 'menta_unavailable'
      when 'access_ended' then 'self'
      else 'menta'
    end;

    update public.challenge_submissions submission
    set
      status = 'approved',
      review_notes = null,
      verification_date = pg_catalog.now(),
      reviewed_at = pg_catalog.now(),
      reviewer_id = null,
      reviewed_by = null,
      review_source = v_source
    where submission.id = v_submission.id
      and submission.status = 'pending';

    v_streak := public.apply_approved_streak_checkin(
      v_submission.user_id,
      v_submission.challenge_id,
      v_submission.local_day,
      v_tz,
      v_submission.id
    );
    if not coalesce((v_streak ->> 'success')::boolean, false) then
      raise exception 'APPROVED_STREAK_APPLY_FAILED: %',
        coalesce(v_streak ->> 'error', 'UNKNOWN');
    end if;
  else
    update public.challenge_submissions submission
    set
      status = 'rejected',
      review_notes = private.menta_check_reason_note_v1(v_reason),
      verification_date = pg_catalog.now(),
      reviewed_at = pg_catalog.now(),
      reviewer_id = null,
      reviewed_by = null,
      review_source = 'menta'
    where submission.id = v_submission.id
      and submission.status = 'pending';

    -- Late in the day, keep the day open for at least two more hours so a
    -- second photo can still count. The row is inactive, so it never shows as
    -- a shop item; open proof_due_at is what submit and maintenance honour.
    v_day_end := ((v_submission.local_day + 1)::timestamp) at time zone v_tz;
    if v_day_end - pg_catalog.now() < interval '2 hours' then
      insert into public.power_up_usage (
        user_id, item_sku, challenge_id, used_at, expires_at, is_active,
        client_event_id, obligation_local_day, proof_due_at,
        effective_timezone, result_payload
      ) values (
        v_submission.user_id, 'menta_check_grace', v_submission.challenge_id,
        pg_catalog.now(), pg_catalog.now() + interval '2 hours', false,
        pg_catalog.gen_random_uuid(), v_submission.local_day,
        greatest(v_day_end, pg_catalog.now() + interval '2 hours'), v_tz,
        pg_catalog.jsonb_build_object(
          'source', 'menta_check', 'submission_id', v_submission.id
        )
      );
    end if;

    perform 1 from public.resolve_streak_day_outcomes(
      v_submission.user_id, v_submission.challenge_id,
      v_submission.local_day, v_tz
    );
  end if;

  -- Tell the person when they are probably not looking at the app.
  v_notification_type := case
    when v_outcome = 'not_yet' then 'menta_check_not_yet'
    when v_outcome = 'backup_counted' then 'menta_check_stepped_in'
    when v_outcome = 'access_ended' then null
    when v_submission.submission_date < pg_catalog.now() - interval '45 seconds'
      then 'menta_check_counted'
    else null
  end;

  if v_notification_type is not null then
    v_title := case v_notification_type
      when 'menta_check_not_yet' then 'Not quite yet'
      when 'menta_check_stepped_in' then 'Menta checked your proof'
      else 'That counts!'
    end;
    v_body := case v_notification_type
      when 'menta_check_not_yet' then 'Menta needs another photo. Open Menta to send one.'
      when 'menta_check_stepped_in' then 'Your group was busy, so Menta had a look. It counts.'
      else 'Menta checked your proof. Open Menta to see it.'
    end;
    perform private.enqueue_notification_v1(
      v_submission.user_id,
      v_notification_type,
      v_title,
      v_body,
      pg_catalog.jsonb_build_object(
        'type', v_notification_type,
        'action', 'open_today',
        'challengeId', v_submission.challenge_id,
        'submissionId', v_submission.id
      ),
      pg_catalog.jsonb_build_object('source', 'menta_check'),
      2,
      'menta-check:' || v_submission.id::text,
      pg_catalog.now()
    );
  end if;

  update private.menta_check_jobs job
  set status = 'done', locked_until = null, updated_at = pg_catalog.now()
  where job.id = p_job_id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'code', 'APPLIED',
    'decision', v_decision,
    'outcome', v_outcome,
    'notify', v_notification_type is not null
  );
exception when others then
  if sqlerrm like 'APPROVED_STREAK_APPLY_FAILED:%' then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'STREAK_APPLY_FAILED'
    );
  end if;
  return pg_catalog.jsonb_build_object(
    'success', false, 'code', 'UNKNOWN', 'message', sqlerrm
  );
end;
$$;

revoke all on function public.menta_check_queue_backups_v1(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.menta_check_queue_backups_v1(integer)
  to service_role;
revoke all on function public.menta_check_claim_v1(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.menta_check_claim_v1(integer)
  to service_role;
revoke all on function public.menta_check_fail_v1(bigint, text)
  from public, anon, authenticated, service_role;
grant execute on function public.menta_check_fail_v1(bigint, text)
  to service_role;
revoke all on function public.menta_check_apply_v1(bigint, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.menta_check_apply_v1(bigint, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- Signed-in RPCs
-- ---------------------------------------------------------------------------

create or replace function public.set_menta_check_consent_v1(
  p_accept boolean,
  p_source text default 'settings'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
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

  if coalesce(p_accept, false) then
    insert into private.menta_check_consents (
      user_id, accepted_at, withdrawn_at, source, updated_at
    ) values (
      v_user_id, pg_catalog.now(), null, v_source, pg_catalog.now()
    )
    on conflict (user_id) do update set
      accepted_at = case
        when private.menta_check_consents.withdrawn_at is null
          and private.menta_check_consents.accepted_at is not null
        then private.menta_check_consents.accepted_at
        else pg_catalog.now()
      end,
      withdrawn_at = null,
      source = excluded.source,
      updated_at = pg_catalog.now();
  else
    update private.menta_check_consents consent
    set withdrawn_at = pg_catalog.now(), updated_at = pg_catalog.now()
    where consent.user_id = v_user_id;

    -- Their promises go back to "Just me". Pending checks finish as counted.
    perform pg_catalog.set_config('menta.check_write', 'on', true);
    update public.challenges challenge
    set review_mode = 'self', allow_self_review = true,
        updated_at = pg_catalog.now()
    where challenge.creator_id = v_user_id
      and challenge.review_mode = 'menta';
    perform pg_catalog.set_config('menta.check_write', 'off', true);
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'consented', private.menta_check_has_consent_v1(v_user_id)
  );
end;
$$;

create or replace function public.set_promise_menta_check_v1(
  p_challenge_id uuid,
  p_mode text,
  p_backup_hours integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.challenges%rowtype;
  v_backup integer := case
    when p_backup_hours in (12, 24, 48) then p_backup_hours
    else null
  end;
  v_solo boolean;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;

  if p_mode not in ('menta', 'self', 'people') then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'INVALID_MODE');
  end if;

  select challenge.* into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id
  for update;

  if not found or v_challenge.creator_id is distinct from v_user_id then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_ALLOWED');
  end if;

  v_solo := private.menta_check_promise_is_solo_v1(p_challenge_id, v_user_id);

  if p_mode = 'menta' then
    if not v_solo then
      return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_SOLO');
    end if;
    if not private.menta_check_has_consent_v1(v_user_id) then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'CONSENT_REQUIRED'
      );
    end if;
    if private.menta_check_access_v1(v_user_id, p_challenge_id, false) is null then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'ACCESS_REQUIRED'
      );
    end if;
  elsif p_mode = 'self' and not v_solo then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_SOLO');
  elsif p_mode = 'people' and v_backup is not null
    and not private.menta_check_has_consent_v1(v_user_id)
  then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'CONSENT_REQUIRED'
    );
  end if;

  perform pg_catalog.set_config('menta.check_write', 'on', true);
  update public.challenges challenge
  set
    review_mode = p_mode,
    allow_self_review = (p_mode = 'self'),
    menta_backup_hours = case when p_mode = 'people' then v_backup else null end,
    updated_at = pg_catalog.now()
  where challenge.id = p_challenge_id;
  perform pg_catalog.set_config('menta.check_write', 'off', true);

  return pg_catalog.jsonb_build_object(
    'success', true,
    'review_mode', p_mode,
    'backup_hours', case when p_mode = 'people' then v_backup else null end
  );
end;
$$;

create or replace function public.buy_menta_check_pass_v1(
  p_challenge_id uuid,
  p_auto_renew boolean,
  p_client_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost constant integer := 20;
  v_existing jsonb;
  v_challenge public.challenges%rowtype;
  v_pass private.menta_check_passes%rowtype;
  v_new_balance integer;
  v_response jsonb;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;
  if p_client_event_id is null then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'EVENT_REQUIRED');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('menta-check-pass:' || v_user_id::text, 0)
  );

  select receipt.response into v_existing
  from private.menta_check_receipts receipt
  where receipt.user_id = v_user_id
    and receipt.client_event_id = p_client_event_id;
  if found then
    return v_existing;
  end if;

  select challenge.* into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id;
  if not found or v_challenge.creator_id is distinct from v_user_id then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_ALLOWED');
  end if;

  select pass.* into v_pass
  from private.menta_check_passes pass
  where pass.user_id = v_user_id and pass.challenge_id = p_challenge_id
  for update;

  if found and v_pass.active_until > pg_catalog.now() then
    update private.menta_check_passes pass
    set auto_renew = coalesce(p_auto_renew, true), updated_at = pg_catalog.now()
    where pass.user_id = v_user_id and pass.challenge_id = p_challenge_id;
    v_response := pg_catalog.jsonb_build_object(
      'success', true, 'code', 'ALREADY_ACTIVE',
      'active_until', v_pass.active_until,
      'auto_renew', coalesce(p_auto_renew, true)
    );
  else
    update public.profiles profile
    set
      momenta_balance = coalesce(profile.momenta_balance, 0) - v_cost,
      updated_at = pg_catalog.now()
    where profile.id = v_user_id
      and coalesce(profile.momenta_balance, 0) >= v_cost
    returning profile.momenta_balance into v_new_balance;

    if v_new_balance is null then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'INSUFFICIENT_BALANCE', 'cost', v_cost
      );
    end if;

    insert into public.wallet_transactions (
      user_id, amount, reason, source_uuid, transaction_type, description,
      reference_id, created_at
    ) values (
      v_user_id, -v_cost, 'menta_check_pass', p_client_event_id, 'spent',
      'Menta Check for one promise, one week', p_challenge_id, pg_catalog.now()
    );

    insert into private.menta_check_passes (
      user_id, challenge_id, active_until, auto_renew
    ) values (
      v_user_id, p_challenge_id, pg_catalog.now() + interval '7 days',
      coalesce(p_auto_renew, true)
    )
    on conflict (user_id, challenge_id) do update set
      active_until = pg_catalog.now() + interval '7 days',
      auto_renew = excluded.auto_renew,
      updated_at = pg_catalog.now();

    v_response := pg_catalog.jsonb_build_object(
      'success', true, 'code', 'BOUGHT',
      'active_until', pg_catalog.now() + interval '7 days',
      'auto_renew', coalesce(p_auto_renew, true),
      'new_balance', v_new_balance,
      'cost', v_cost
    );
  end if;

  insert into private.menta_check_receipts (
    user_id, client_event_id, operation, response
  ) values (v_user_id, p_client_event_id, 'buy_pass', v_response);

  return v_response;
end;
$$;

create or replace function public.stop_menta_check_pass_v1(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;

  update private.menta_check_passes pass
  set auto_renew = false, updated_at = pg_catalog.now()
  where pass.user_id = v_user_id and pass.challenge_id = p_challenge_id;

  return pg_catalog.jsonb_build_object('success', true);
end;
$$;

-- "Count it anyway": replaces a proof Menta turned down with an approved
-- correction the person vouches for. It costs Momenta, is capped at two a
-- week, and is labelled as counted by the person.
create or replace function public.count_menta_proof_anyway_v1(
  p_submission_id uuid,
  p_client_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost constant integer := 15;
  v_weekly_limit constant integer := 2;
  v_existing jsonb;
  v_rejected public.challenge_submissions%rowtype;
  v_tz text;
  v_today date;
  v_open_day date;
  v_used integer;
  v_new_balance integer;
  v_new_id uuid;
  v_streak jsonb;
  v_response jsonb;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;
  if p_client_event_id is null then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'EVENT_REQUIRED');
  end if;

  select override_row.response into v_existing
  from private.menta_check_overrides override_row
  where override_row.user_id = v_user_id
    and override_row.client_event_id = p_client_event_id;
  if found then
    return v_existing;
  end if;

  select submission.* into v_rejected
  from public.challenge_submissions submission
  where submission.id = p_submission_id;

  if not found or v_rejected.user_id is distinct from v_user_id then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND');
  end if;

  -- Participant, then proof, as every other proof writer does.
  perform 1
  from public.challenge_participants participant
  where participant.challenge_id = v_rejected.challenge_id
    and participant.user_id = v_user_id
    and coalesce(participant.status, 'active') = 'active'
  for update;
  if not found then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_JOINED');
  end if;

  select submission.* into v_rejected
  from public.challenge_submissions submission
  where submission.id = p_submission_id
  for update;

  if v_rejected.status is distinct from 'rejected'
    or v_rejected.review_source is distinct from 'menta'
  then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_A_MENTA_NOT_YET');
  end if;

  if exists (
    select 1 from public.challenge_submissions later
    where later.replaces_submission_id = v_rejected.id
  ) or exists (
    select 1 from public.challenge_submissions active_row
    where active_row.user_id = v_user_id
      and active_row.challenge_id = v_rejected.challenge_id
      and active_row.local_day = v_rejected.local_day
      and active_row.status in ('pending', 'approved')
  ) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'ALREADY_REPLACED');
  end if;

  v_tz := public.get_effective_streak_timezone(v_user_id, v_rejected.challenge_id, null);
  v_today := (pg_catalog.now() at time zone v_tz)::date;
  v_open_day := public.resolve_extension_submission_local_day_v1(
    v_user_id, v_rejected.challenge_id, v_today
  );
  if v_rejected.local_day is distinct from v_today
    and v_rejected.local_day is distinct from v_open_day
  then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'DAY_CLOSED');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('menta-check-override:' || v_user_id::text, 0)
  );

  select count(*)::integer into v_used
  from private.menta_check_overrides override_row
  where override_row.user_id = v_user_id
    and override_row.created_at > pg_catalog.now() - interval '7 days';
  if v_used >= v_weekly_limit then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'WEEKLY_LIMIT', 'limit', v_weekly_limit
    );
  end if;

  update public.profiles profile
  set
    momenta_balance = coalesce(profile.momenta_balance, 0) - v_cost,
    updated_at = pg_catalog.now()
  where profile.id = v_user_id
    and coalesce(profile.momenta_balance, 0) >= v_cost
  returning profile.momenta_balance into v_new_balance;
  if v_new_balance is null then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'INSUFFICIENT_BALANCE', 'cost', v_cost
    );
  end if;

  insert into public.challenge_submissions (
    challenge_id, user_id, media_url, media_type, submission_text,
    submission_type, status, submission_date, verification_date, reviewer_id,
    local_day, client_event_id, replaces_submission_id, review_source
  ) values (
    v_rejected.challenge_id, v_user_id, v_rejected.media_url,
    v_rejected.media_type, v_rejected.submission_text,
    coalesce(v_rejected.submission_type, v_rejected.media_type), 'approved',
    pg_catalog.now(), pg_catalog.now(), null, v_rejected.local_day,
    p_client_event_id, v_rejected.id, 'self_override'
  )
  returning id into v_new_id;

  v_streak := public.apply_approved_streak_checkin(
    v_user_id, v_rejected.challenge_id, v_rejected.local_day, v_tz, v_new_id
  );
  if not coalesce((v_streak ->> 'success')::boolean, false) then
    raise exception 'APPROVED_STREAK_APPLY_FAILED: %',
      coalesce(v_streak ->> 'error', 'UNKNOWN');
  end if;

  insert into public.wallet_transactions (
    user_id, amount, reason, source_uuid, transaction_type, description,
    reference_id, created_at
  ) values (
    v_user_id, -v_cost, 'menta_check_override', p_client_event_id, 'spent',
    'Counted a proof yourself', v_new_id, pg_catalog.now()
  );

  insert into private.menta_check_feedback (
    user_id, client_event_id, submission_id, kind
  ) values (
    v_user_id, pg_catalog.gen_random_uuid(), v_rejected.id, 'false_negative'
  )
  on conflict (user_id, submission_id, kind) do nothing;

  v_response := pg_catalog.jsonb_build_object(
    'success', true,
    'submission_id', v_new_id,
    'cost', v_cost,
    'new_balance', v_new_balance,
    'overrides_left', v_weekly_limit - v_used - 1,
    'streak', v_streak
  );

  insert into private.menta_check_overrides (
    user_id, client_event_id, rejected_submission_id, new_submission_id,
    cost, response
  ) values (
    v_user_id, p_client_event_id, v_rejected.id, v_new_id, v_cost, v_response
  );

  return v_response;
exception when others then
  if sqlerrm like 'APPROVED_STREAK_APPLY_FAILED:%' then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'STREAK_APPLY_FAILED');
  end if;
  raise;
end;
$$;

-- "Ask a friend to check it": a person decides this proof instead. The
-- promise moves to friend checks with Menta as a 24-hour backup, and the same
-- photo goes in again as a pending correction.
create or replace function public.ask_friend_for_menta_proof_v1(
  p_submission_id uuid,
  p_client_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing jsonb;
  v_rejected public.challenge_submissions%rowtype;
  v_tz text;
  v_today date;
  v_open_day date;
  v_new_id uuid;
  v_response jsonb;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;
  if p_client_event_id is null then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'EVENT_REQUIRED');
  end if;

  select receipt.response into v_existing
  from private.menta_check_receipts receipt
  where receipt.user_id = v_user_id
    and receipt.client_event_id = p_client_event_id;
  if found then
    return v_existing;
  end if;

  select submission.* into v_rejected
  from public.challenge_submissions submission
  where submission.id = p_submission_id;
  if not found or v_rejected.user_id is distinct from v_user_id then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND');
  end if;

  perform 1
  from public.challenge_participants participant
  where participant.challenge_id = v_rejected.challenge_id
    and participant.user_id = v_user_id
    and coalesce(participant.status, 'active') = 'active'
  for update;
  if not found then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_JOINED');
  end if;

  select submission.* into v_rejected
  from public.challenge_submissions submission
  where submission.id = p_submission_id
  for update;

  if v_rejected.status is distinct from 'rejected'
    or v_rejected.review_source is distinct from 'menta'
  then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_A_MENTA_NOT_YET');
  end if;

  if exists (
    select 1 from public.challenge_submissions active_row
    where active_row.user_id = v_user_id
      and active_row.challenge_id = v_rejected.challenge_id
      and active_row.local_day = v_rejected.local_day
      and active_row.status in ('pending', 'approved')
  ) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'ALREADY_REPLACED');
  end if;

  v_tz := public.get_effective_streak_timezone(v_user_id, v_rejected.challenge_id, null);
  v_today := (pg_catalog.now() at time zone v_tz)::date;
  v_open_day := public.resolve_extension_submission_local_day_v1(
    v_user_id, v_rejected.challenge_id, v_today
  );
  if v_rejected.local_day is distinct from v_today
    and v_rejected.local_day is distinct from v_open_day
  then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'DAY_CLOSED');
  end if;

  perform pg_catalog.set_config('menta.check_write', 'on', true);
  update public.challenges challenge
  set review_mode = 'people', allow_self_review = false,
      menta_backup_hours = 24, updated_at = pg_catalog.now()
  where challenge.id = v_rejected.challenge_id
    and challenge.creator_id = v_user_id;
  perform pg_catalog.set_config('menta.check_write', 'off', true);

  insert into public.challenge_submissions (
    challenge_id, user_id, media_url, media_type, submission_text,
    submission_type, status, submission_date, local_day, client_event_id,
    replaces_submission_id
  ) values (
    v_rejected.challenge_id, v_user_id, v_rejected.media_url,
    v_rejected.media_type, v_rejected.submission_text,
    coalesce(v_rejected.submission_type, v_rejected.media_type), 'pending',
    pg_catalog.now(), v_rejected.local_day, p_client_event_id, v_rejected.id
  )
  returning id into v_new_id;

  insert into private.menta_check_feedback (
    user_id, client_event_id, submission_id, kind
  ) values (
    v_user_id, pg_catalog.gen_random_uuid(), v_rejected.id, 'false_negative'
  )
  on conflict (user_id, submission_id, kind) do nothing;

  v_response := pg_catalog.jsonb_build_object(
    'success', true,
    'submission_id', v_new_id,
    'challenge_id', v_rejected.challenge_id
  );

  insert into private.menta_check_receipts (
    user_id, client_event_id, operation, response
  ) values (v_user_id, p_client_event_id, 'ask_friend', v_response);

  return v_response;
end;
$$;

create or replace function public.report_menta_check_v1(
  p_submission_id uuid,
  p_kind text,
  p_client_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_submission public.challenge_submissions%rowtype;
  v_allowed boolean := false;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED'
    );
  end if;
  if p_kind not in ('false_negative', 'false_positive', 'group_question')
    or p_client_event_id is null
  then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'INVALID');
  end if;

  select submission.* into v_submission
  from public.challenge_submissions submission
  where submission.id = p_submission_id;
  if not found
    or v_submission.review_source not in ('menta', 'menta_backup')
  then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND');
  end if;

  if p_kind = 'group_question' then
    v_allowed := v_submission.user_id is distinct from v_user_id
      and v_submission.submission_date > pg_catalog.now() - interval '3 days'
      and (
        exists (
          select 1 from public.challenges challenge
          where challenge.id = v_submission.challenge_id
            and challenge.creator_id = v_user_id
        )
        or exists (
          select 1 from public.challenge_participants participant
          where participant.challenge_id = v_submission.challenge_id
            and participant.user_id = v_user_id
            and coalesce(participant.status, 'active') = 'active'
        )
        or exists (
          select 1 from public.team_challenges link
          join public.team_members member on member.group_id = link.group_id
          where link.challenge_id = v_submission.challenge_id
            and member.user_id = v_user_id
        )
      );
  else
    v_allowed := v_submission.user_id = v_user_id;
  end if;

  if not v_allowed then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_ALLOWED');
  end if;

  insert into private.menta_check_feedback (
    user_id, client_event_id, submission_id, kind
  ) values (v_user_id, p_client_event_id, p_submission_id, p_kind)
  on conflict do nothing;

  return pg_catalog.jsonb_build_object('success', true);
end;
$$;

create or replace function public.get_menta_check_hint_v1(p_submission_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_submission public.challenge_submissions%rowtype;
  v_hint text;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return null;
  end if;

  select submission.* into v_submission
  from public.challenge_submissions submission
  where submission.id = p_submission_id;
  if not found
    or v_submission.user_id = v_user_id
    or v_submission.status is distinct from 'pending'
  then
    return null;
  end if;

  if not (
    exists (
      select 1 from public.challenges challenge
      where challenge.id = v_submission.challenge_id
        and challenge.creator_id = v_user_id
    )
    or exists (
      select 1 from public.challenge_participants participant
      where participant.challenge_id = v_submission.challenge_id
        and participant.user_id = v_user_id
        and coalesce(participant.status, 'active') = 'active'
    )
    or exists (
      select 1 from public.team_challenges link
      join public.team_members member on member.group_id = link.group_id
      where link.challenge_id = v_submission.challenge_id
        and member.user_id = v_user_id
    )
  ) then
    return null;
  end if;

  select verdict.hint into v_hint
  from private.menta_check_verdicts verdict
  where verdict.submission_id = p_submission_id
    and verdict.mode = 'hint';

  return v_hint;
end;
$$;

-- Today: the person's own Menta-checked proof, one row per promise.
create or replace function public.get_menta_check_today_v1(
  p_timezone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return '[]'::jsonb;
  end if;

  with promises as (
    select
      challenge.id,
      challenge.title,
      coalesce(
        nullif(pg_catalog.btrim(challenge.verification_description), ''),
        challenge.title
      ) as rule,
      challenge.review_mode,
      challenge.menta_backup_hours,
      challenge.verification_type,
      (pg_catalog.now() at time zone public.get_effective_streak_timezone(
        v_user_id, challenge.id, p_timezone
      ))::date as today
    from public.challenges challenge
    join public.challenge_participants participant
      on participant.challenge_id = challenge.id
     and participant.user_id = v_user_id
     and coalesce(participant.status, 'active') = 'active'
    where coalesce(challenge.status, 'active') = 'active'
      and (challenge.review_mode = 'menta' or challenge.menta_backup_hours is not null)
  ), latest as (
    select distinct on (promise.id)
      promise.*,
      submission.id as submission_id,
      submission.status,
      submission.media_type,
      submission.media_url,
      submission.submission_date,
      submission.local_day,
      submission.review_source,
      submission.replaces_submission_id
    from promises promise
    left join public.challenge_submissions submission
      on submission.challenge_id = promise.id
     and submission.user_id = v_user_id
     and (
       submission.local_day = promise.today
       or (
         submission.local_day = promise.today - 1
         and submission.review_source = 'menta_backup'
         and submission.reviewed_at > pg_catalog.now() - interval '24 hours'
       )
       or (
         submission.local_day = public.resolve_extension_submission_local_day_v1(
           v_user_id, promise.id, promise.today
         )
       )
     )
    order by promise.id, submission.submission_date desc nulls last
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'challenge_id', latest.id,
    'title', latest.title,
    'rule', latest.rule,
    'review_mode', latest.review_mode,
    'backup_hours', latest.menta_backup_hours,
    'proof_kind', latest.verification_type,
    'local_day', coalesce(latest.local_day, latest.today)::text,
    'submission_id', latest.submission_id,
    'status', latest.status,
    'media_type', latest.media_type,
    'media_url', latest.media_url,
    'submitted_at', latest.submission_date,
    'review_source', latest.review_source,
    'outcome', verdict.outcome,
    'reason', verdict.reason,
    'tip', verdict.tip,
    'flagged', exists (
      select 1 from private.menta_check_feedback feedback
      where feedback.submission_id = latest.submission_id
        and feedback.user_id = v_user_id
    ),
    'not_yets_today', (
      select count(*)::integer
      from public.challenge_submissions earlier
      join private.menta_check_verdicts earlier_verdict
        on earlier_verdict.submission_id = earlier.id
       and earlier_verdict.mode = 'menta'
      where earlier.user_id = v_user_id
        and earlier.challenge_id = latest.id
        and earlier.local_day = coalesce(latest.local_day, latest.today)
        and earlier_verdict.outcome = 'not_yet'
    ),
    'grace_until', (
      select pg_catalog.max(extension.proof_due_at)
      from public.power_up_usage extension
      where extension.user_id = v_user_id
        and extension.challenge_id = latest.id
        and extension.obligation_local_day = coalesce(latest.local_day, latest.today)
        and extension.proof_due_at > pg_catalog.now()
    ),
    'overrides_left', greatest(0, 2 - (
      select count(*)::integer
      from private.menta_check_overrides override_row
      where override_row.user_id = v_user_id
        and override_row.created_at > pg_catalog.now() - interval '7 days'
    ))
  )), '[]'::jsonb)
  into v_result
  from latest
  left join private.menta_check_verdicts verdict
    on verdict.submission_id = latest.submission_id
   and verdict.mode = case
     when latest.review_source = 'menta_backup' then 'backup'
     else 'menta'
   end;

  return v_result;
end;
$$;

-- Settings and history.
create or replace function public.get_menta_check_overview_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_consent private.menta_check_consents%rowtype;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED');
  end if;

  select consent.* into v_consent
  from private.menta_check_consents consent
  where consent.user_id = v_user_id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'consented', private.menta_check_has_consent_v1(v_user_id),
    'consented_at', v_consent.accepted_at,
    'is_pro', public.user_is_pro(v_user_id),
    'pass_cost', 20,
    'override_cost', 15,
    'overrides_left', greatest(0, 2 - (
      select count(*)::integer
      from private.menta_check_overrides override_row
      where override_row.user_id = v_user_id
        and override_row.created_at > pg_catalog.now() - interval '7 days'
    )),
    'stats', pg_catalog.jsonb_build_object(
      'checks', (
        select count(*)::integer from private.menta_check_verdicts verdict
        where verdict.user_id = v_user_id and verdict.mode in ('menta', 'backup')
          and verdict.applied
      ),
      'not_yets', (
        select count(*)::integer from private.menta_check_verdicts verdict
        where verdict.user_id = v_user_id and verdict.outcome = 'not_yet'
      ),
      'overrides', (
        select count(*)::integer from private.menta_check_overrides override_row
        where override_row.user_id = v_user_id
      )
    ),
    'promises', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'challenge_id', challenge.id,
        'title', challenge.title,
        'review_mode', coalesce(
          challenge.review_mode,
          case when challenge.allow_self_review then 'self' else 'people' end
        ),
        'backup_hours', challenge.menta_backup_hours,
        'is_solo', private.menta_check_promise_is_solo_v1(challenge.id, v_user_id),
        'is_creator', challenge.creator_id = v_user_id,
        'pass_active_until', pass.active_until,
        'pass_auto_renew', pass.auto_renew
      ) order by challenge.created_at desc)
      from public.challenges challenge
      join public.challenge_participants participant
        on participant.challenge_id = challenge.id
       and participant.user_id = v_user_id
       and coalesce(participant.status, 'active') = 'active'
      left join private.menta_check_passes pass
        on pass.user_id = v_user_id and pass.challenge_id = challenge.id
      where coalesce(challenge.status, 'active') = 'active'
        and coalesce(challenge.completion_status, 'active') = 'active'
    ), '[]'::jsonb),
    'history', coalesce((
      select pg_catalog.jsonb_agg(item order by (item ->> 'submitted_at') desc)
      from (
        select pg_catalog.jsonb_build_object(
          'submission_id', submission.id,
          'challenge_id', submission.challenge_id,
          'title', challenge.title,
          'local_day', submission.local_day::text,
          'submitted_at', submission.submission_date,
          'media_type', submission.media_type,
          'media_url', submission.media_url,
          'status', submission.status,
          'review_source', submission.review_source,
          'outcome', verdict.outcome,
          'reason', verdict.reason,
          'tip', verdict.tip,
          'flagged', exists (
            select 1 from private.menta_check_feedback feedback
            where feedback.submission_id = submission.id
              and feedback.user_id = v_user_id
          ),
          'was_second_photo', submission.replaces_submission_id is not null
        ) as item
        from public.challenge_submissions submission
        join public.challenges challenge on challenge.id = submission.challenge_id
        left join private.menta_check_verdicts verdict
          on verdict.submission_id = submission.id
         and verdict.mode in ('menta', 'backup')
        where submission.user_id = v_user_id
          and submission.review_source in (
            'menta', 'menta_backup', 'menta_unavailable', 'self_override'
          )
          and submission.submission_date > pg_catalog.now() - interval '90 days'
        order by submission.submission_date desc
        limit 40
      ) history_rows
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.set_menta_check_consent_v1(boolean, text)
  from public, anon, authenticated, service_role;
grant execute on function public.set_menta_check_consent_v1(boolean, text)
  to authenticated;
revoke all on function public.set_promise_menta_check_v1(uuid, text, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.set_promise_menta_check_v1(uuid, text, integer)
  to authenticated;
revoke all on function public.buy_menta_check_pass_v1(uuid, boolean, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.buy_menta_check_pass_v1(uuid, boolean, uuid)
  to authenticated;
revoke all on function public.stop_menta_check_pass_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.stop_menta_check_pass_v1(uuid)
  to authenticated;
revoke all on function public.count_menta_proof_anyway_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.count_menta_proof_anyway_v1(uuid, uuid)
  to authenticated;
revoke all on function public.ask_friend_for_menta_proof_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.ask_friend_for_menta_proof_v1(uuid, uuid)
  to authenticated;
revoke all on function public.report_menta_check_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.report_menta_check_v1(uuid, text, uuid)
  to authenticated;
revoke all on function public.get_menta_check_hint_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.get_menta_check_hint_v1(uuid)
  to authenticated;
revoke all on function public.get_menta_check_today_v1(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_menta_check_today_v1(text)
  to authenticated;
revoke all on function public.get_menta_check_overview_v1()
  from public, anon, authenticated, service_role;
grant execute on function public.get_menta_check_overview_v1()
  to authenticated;

-- Configure your own authenticated Menta Check worker schedule; see docs/SETUP.md.

commit;
