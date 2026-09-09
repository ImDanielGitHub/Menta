import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260815074817_complete_notification_delivery_contract.sql'
  ),
  'utf8'
);

const claimMigration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260815081337_notification_claim_and_orphan_repair.sql'
  ),
  'utf8'
);

describe('notification delivery SQL contract', () => {
  it('targets every eligible unblocked reviewer without making the client authoritative', () => {
    expect(migration).toContain(
      'create or replace function private.challenge_review_recipients_v1('
    );
    expect(migration).toContain('private.users_have_block_relationship_v1(');
    expect(migration).toContain(
      'after insert or update of status on public.challenge_submissions'
    );
    expect(migration).toContain("'challenge-review-ready:%s:%s'");
    expect(migration).not.toContain('new.reviewer_id :=');
  });

  it('creates the job before the notification and uses one durable idempotency key', () => {
    const helper = migration.slice(
      migration.indexOf(
        'create or replace function private.enqueue_notification_v1('
      ),
      migration.indexOf(
        'create or replace function private.challenge_review_recipients_v1('
      )
    );
    expect(helper.indexOf('insert into public.notification_jobs')).toBeLessThan(
      helper.indexOf('insert into public.notifications')
    );
    expect(helper).toContain('on conflict (idempotency_key) do nothing');
  });

  it('keeps the client preference check owned by the authenticated user', () => {
    expect(migration).toContain('v_actor_id uuid := auth.uid()');
    expect(migration).toContain('v_actor_id is distinct from p_user_id');
    expect(migration).toContain('not public.current_session_is_active()');
    expect(migration).toContain(
      'revoke all on function public.can_send_notification_to_user(uuid, text, integer)'
    );
  });

  it('leases one processor batch atomically and restricts it to service role', () => {
    expect(claimMigration).toContain('for update of job skip locked');
    expect(claimMigration).toContain("job.status = 'processing'");
    expect(claimMigration).toContain('pg_catalog.make_interval(');
    expect(claimMigration).toContain(
      'grant execute on function public.claim_notification_batch_v1(integer, integer)\n  to service_role'
    );
    expect(claimMigration).toContain('from public, anon, authenticated');
    expect(claimMigration).toContain(
      'create unique index if not exists idx_notification_jobs_one_per_notification'
    );
    expect(claimMigration).toContain("'delivery-notification:'");
  });
});
