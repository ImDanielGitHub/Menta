import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('event deployment contract', () => {
  const migration = () =>
    read('supabase/migrations/20260803120000_event_participation_v1.sql');
  const edge = () => read('supabase/functions/event-participation/index.ts');
  const discoveryMigration = () =>
    read('supabase/migrations/20260805090000_event_public_discovery.sql');
  const authoringMigration = () =>
    read('supabase/migrations/20260809123400_event_authoring_v1.sql');

  it('keeps events isolated from promise, group and streak tables', () => {
    const sql = migration().toLowerCase();
    expect(sql).toContain('create table public.event_events');
    expect(sql).toContain('create table public.event_occurrences');
    expect(sql).toContain('create table public.event_action_receipts');
    expect(sql).not.toContain('alter table public.teams');
    expect(sql).not.toContain('challenge_submissions');
    expect(sql).not.toContain('group_streak');
  });

  it('makes the deployment boundary explicit in SQL and Edge routing', () => {
    const sql = migration();
    const source = edge();

    for (const rpc of [
      'event_join_v1',
      'event_redeem_checkin_v1',
      'event_prepare_post_upload_v1',
      'event_finalise_post_v1',
      'event_review_post_v1',
    ]) {
      expect(sql).toContain(rpc);
    }

    expect(sql).toContain('event_checkin_token_redemptions');
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(sql).toContain('security definer');
    expect(sql).toContain('event_media_path_parts');
    expect(sql).toContain('event_can_read_own_media_v1');
    expect(sql).toContain('unique (token_id, user_id)');
    expect(sql).toContain('revision = p_expected_revision');
    expect(source).toContain("case 'prepare_post_upload':");
    expect(source).toContain("case 'finalise_post':");
    expect(source).toContain("case 'delete_own_post':");
    expect(source).toContain('createSignedUploadUrl(preparation.storagePath');
    expect(source).toContain('.remove([data.storagePath])');
  });

  it('keeps direct event table access limited to exact private preview signing', () => {
    const source = edge();

    expect(source).toContain(".from('event_posts')");
    expect(source).toContain('attachSignedMediaPreviews');
    expect(source).toContain(".eq('status', options.expectedStatus)");
    expect(source).toContain('data.length !== postIds.length');
    expect(source).toContain('createSignedUrls(paths, 60)');
    expect(source).not.toMatch(/\.from\(['\"]event_(?!posts)/);
    expect(source).not.toContain('storagePath: command.storagePath');
  });

  it('keeps public discovery bounded and supplies the current consent version', () => {
    const sql = discoveryMigration();
    const source = edge();

    expect(sql).toContain('event_list_public_summaries_v1');
    expect(sql).toContain("event_row.visibility = 'public'");
    expect(sql).toContain('limit 50');
    expect(sql).toContain("'consentVersion', p_occurrence.consent_version");
    expect(source).toContain("command.action === 'list_public_events'");
    expect(source).toContain("'event_list_public_summaries_v1'");
  });

  it('publishes an event, occurrence and organiser capability in one idempotent transaction', () => {
    const sql = authoringMigration();
    const source = edge();

    expect(sql).toContain('create or replace function public.event_create_v1');
    expect(sql).toContain("'create_event'");
    expect(sql).toContain('private.event_claim_receipt_v1');
    expect(sql).toContain("'event-attendance-v1'");
    expect(sql).toContain('insert into public.event_checkin_tokens');
    expect(sql).toContain('p_checkin_token_hash');
    expect(sql).toContain('revoke all on function public.event_create_v1');
    expect(sql).toContain('to service_role;');
    expect(sql).not.toContain('to authenticated;');
    expect(source).toContain("case 'create_event':");
    expect(source).toContain('p_actor_id: context.user.id');
    expect(source).toContain(
      'p_checkin_token_hash: await sha256Hex(checkInToken)'
    );
  });
});
