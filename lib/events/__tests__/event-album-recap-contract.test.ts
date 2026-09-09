import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('event album and recap SQL contract', () => {
  const migration = () =>
    read(
      'supabase/migrations/20260809145820_event_album_recap_read_models.sql'
    );
  const edge = () => read('supabase/functions/event-participation/index.ts');

  it('keeps only the two authenticated entrypoints security-defining', () => {
    const sql = migration();
    const helper = sql.slice(
      sql.indexOf(
        'create or replace function private.event_album_item_json_v1'
      ),
      sql.indexOf(
        'create or replace function public.event_get_attendee_album_v1'
      )
    );

    expect(sql.match(/security definer/gi)).toHaveLength(2);
    expect(sql.match(/set search_path = ''/g)).toHaveLength(3);
    expect(helper).not.toContain('security definer');
    expect(sql.match(/v_actor_id uuid := auth\.uid\(\)/g)).toHaveLength(2);
    expect(sql).not.toContain('p_actor_id uuid');
    expect(sql).toContain(
      'revoke all on function public.event_get_attendee_album_v1(uuid)\n  from public, anon, authenticated;'
    );
    expect(sql).toContain(
      'revoke all on function public.event_get_organiser_recap_v1(uuid)\n  from public, anon, authenticated;'
    );
    expect(sql).toContain(
      'grant execute on function public.event_get_attendee_album_v1(uuid)\n  to authenticated;'
    );
    expect(sql).toContain(
      'grant execute on function public.event_get_organiser_recap_v1(uuid)\n  to authenticated;'
    );
  });

  it('requires organiser ownership or a joined non-revoked check-in', () => {
    const sql = migration();

    expect(sql).toContain(
      'v_is_organiser := v_event.organiser_id is not distinct from v_actor_id'
    );
    expect(sql).toContain("attendance.state = 'joined'");
    expect(sql).toContain('checkin.revoked_at is null');
    expect(sql).toContain('if not v_is_organiser and not v_is_checked_in then');
    expect(sql).toContain(
      'v_viewer_can_post :=\n    v_is_joined\n    and v_is_checked_in'
    );
    expect(sql).toContain('v_event.organiser_id is distinct from v_actor_id');
  });

  it('returns approved checked-in items without a durable path', () => {
    const sql = migration();
    const helper = sql.slice(
      sql.indexOf(
        'create or replace function private.event_album_item_json_v1'
      ),
      sql.indexOf(
        'create or replace function public.event_get_attendee_album_v1'
      )
    );

    expect(sql).toContain("post.status = 'approved'");
    expect(sql).toContain('post.reviewed_at is not null');
    expect(sql).toContain('checkin.revoked_at is null');
    expect(helper).not.toContain('media_path');
    expect(helper).not.toContain("'mediaPath'");
    expect(helper).not.toContain("'storagePath'");
  });

  it('chooses the latest ended occurrence deterministically', () => {
    const sql = migration();

    expect(sql).toContain("occurrence.state = 'ended'");
    expect(sql).toContain(
      'order by occurrence.ends_at desc, occurrence.id desc\n  limit 1;'
    );
    expect(sql).toContain("'joined', v_joined_count");
    expect(sql).toContain("'checkedIn', v_checked_in_count");
    expect(sql).toContain("'posted', v_posted_count");
    expect(sql).toContain("'verified', v_verified_count");
  });

  it('preserves caller auth for reads and fails closed on partial signing', () => {
    const source = edge();

    expect(source).toContain('context.userClient.rpc(rpc, args)');
    expect(source).toContain("'event_get_attendee_album_v1'");
    expect(source).toContain("'event_get_organiser_recap_v1'");
    expect(source).toContain('attachSignedMediaPreviews');
    expect(source).toContain("'mediaPath' in item");
    expect(source).toContain('data.length !== postIds.length');
    expect(source).toContain('signed.length !== paths.length');
    expect(source).toContain('createSignedUrls(paths, 60)');
    expect(source).toContain("options.expectedStatus === 'approved'");
  });
});
