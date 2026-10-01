-- Deleting a proof must not rewind the next every-second-proof ordinal or
-- erase a recent ad claim from the daily cap and cooldown. Retain only the
-- account's cadence receipt; the deleted proof identifier becomes null.
-- Account deletion still removes all receipts through the profile FK.
begin;

alter table private.proof_ad_break_cadence
  drop constraint proof_ad_break_cadence_submission_id_fkey,
  drop constraint proof_ad_break_cadence_pkey,
  drop constraint proof_ad_break_cadence_user_id_ordinal_key;

alter table private.proof_ad_break_cadence
  alter column submission_id drop not null,
  add constraint proof_ad_break_cadence_submission_id_key unique (submission_id),
  add constraint proof_ad_break_cadence_pkey primary key (user_id, ordinal),
  add constraint proof_ad_break_cadence_submission_id_fkey
    foreign key (submission_id) references public.challenge_submissions(id)
    on delete set null;

-- The existing trigger allocates max(ordinal)+1 under the per-account lock.
-- Existing RPCs look up a non-null owned submission, so removed proofs cannot
-- be claimed again. No new grants or client-readable data are introduced.
commit;
