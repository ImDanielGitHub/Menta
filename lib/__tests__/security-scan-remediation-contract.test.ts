import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('security scan remediation contracts', () => {
  const migration = read(
    'supabase/migrations/20260815100043_harden_security_scan_authority_v1.sql'
  );

  it('keeps profile and group authority behind narrow grants and RPCs', () => {
    expect(migration).toContain(
      'revoke all on table public.profiles from anon, authenticated'
    );
    expect(migration).toContain(
      'grant select (id, username, display_name, avatar_url)'
    );
    expect(migration).toContain(
      'revoke insert on table public.teams from anon, authenticated'
    );
    expect(migration).toContain('public.join_public_group_v1');
    expect(migration).toContain('public.join_challenge_with_invite_v1');
    expect(migration).toContain(
      'challenge_row.creator_id = (select auth.uid())'
    );
  });

  it('enforces atomic limits, private event access, and media ownership', () => {
    const proofPathRepair = read(
      'supabase/migrations/20260815121728_fix_proof_media_path_regex.sql'
    );
    expect(migration).toContain('public.consume_edge_rate_limit');
    expect(migration).toContain(
      'on conflict (endpoint, actor_key, window_start)'
    );
    expect(migration).toContain('private.enforce_ad_reward_limit_v1');
    expect(migration).toContain('private.enforce_event_post_quota_v1');
    expect(migration).toContain('private.validate_challenge_proof_object_v1');
    expect(migration).toContain(
      "object_row.bucket_id = 'challenge-verifications'"
    );
    expect(proofPathRepair).toContain("then '\\.(jpg|jpeg|png|webp)$'");
    expect(proofPathRepair).toContain("else '\\.(mp4|mov|webm)$'");
    expect(proofPathRepair).not.toContain("then '\\\\.(jpg|jpeg|png|webp)$'");
    expect(migration).toContain('v_attendance.id is null');
    expect(migration).toContain("'EVENT_ACCESS_REQUIRED'");
  });

  it('uses expiring cryptographic invites and a transactional challenge join', () => {
    const inviteHelper = read('supabase/functions/_shared/invite-code.ts');
    const challengeInvite = read(
      'supabase/functions/generate-challenge-invite/index.ts'
    );
    const groupInvite = read(
      'supabase/functions/generate-group-invite/index.ts'
    );
    const consumer = read('supabase/functions/consume-join-code/index.ts');

    expect(inviteHelper).toContain('crypto.getRandomValues');
    expect(inviteHelper).toContain('INVITE_CODE_LENGTH = 26');
    expect(challengeInvite).toContain('expires_at: inviteExpiryIso()');
    expect(groupInvite).toContain('expires_at: inviteExpiryIso()');
    expect(consumer).toContain("'join_challenge_with_invite_v1'");
    expect(consumer).not.toContain("from('team_members').insert");
  });

  it('scopes and bounds client notification jobs', () => {
    const enqueue = read(
      'supabase/functions/enqueue-notification-job/index.ts'
    );
    const processor = read(
      'supabase/functions/notification-processor/index.ts'
    );

    expect(enqueue).toContain('CLIENT_JOB_TYPES');
    expect(enqueue).toContain("'enqueue-notification-job'");
    expect(enqueue).toContain('client-notification:${targetUserId}:${digest}');
    expect(enqueue).toContain(".eq('user_id', targetUserId)");
    expect(enqueue).toContain('(outstandingCount ?? 0) >= 50');
    expect(processor).toContain("supabase.rpc('claim_notification_batch_v1'");
  });

  it('never cascades a foreign or shared challenge during group deletion', () => {
    const deletion = read('supabase/functions/delete-group/index.ts');

    expect(deletion).toContain(".eq('creator_id', user.id)");
    expect(deletion).toContain(".neq('group_id', groupId)");
    expect(deletion).toContain('sharedChallengeIds.has(challengeId)');
  });
});
