import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('event posting window after the occurrence ends', () => {
  const migration = () =>
    read(
      'supabase/migrations/20260827034434_event_posting_window_after_end_v1.sql'
    );

  it('keeps posting open through posting_closes_at after the event ends', () => {
    const sql = migration();

    expect(sql).toContain(
      'create or replace function private.event_posting_is_open_v1'
    );
    expect(sql).toContain(
      "p_occurrence.state in ('scheduled', 'live', 'ended')"
    );
    expect(sql).toContain('now() >= p_occurrence.posting_opens_at');
    expect(sql).toContain('now() <= p_occurrence.posting_closes_at');
    expect(sql).toContain('private.event_posting_is_open_v1(v_occurrence)');
    expect(sql).not.toContain("v_occurrence.state = 'live'");
  });

  it('does not delay recap by rewriting the organiser recap RPC', () => {
    const sql = migration();

    expect(sql).not.toContain('event_get_organiser_recap_v1');
    expect(sql).toContain('Recap still waits for ended');
  });

  it('keeps prepare-post service-only and album reads authenticated', () => {
    const sql = migration();

    expect(sql).toContain(
      'revoke all on function public.event_prepare_post_upload_v1(uuid, uuid, uuid, text, text, text, bigint)\n  from public, anon, authenticated;'
    );
    expect(sql).toContain(
      'grant execute on function public.event_prepare_post_upload_v1(uuid, uuid, uuid, text, text, text, bigint)\n  to service_role;'
    );
    expect(sql).toContain(
      'revoke all on function public.event_get_attendee_album_v1(uuid)\n  from public, anon, authenticated;'
    );
    expect(sql).toContain(
      'grant execute on function public.event_get_attendee_album_v1(uuid)\n  to authenticated;'
    );
    expect(sql).toContain(
      'revoke all on function private.event_posting_is_open_v1(public.event_occurrences)\n  from public, anon, authenticated;'
    );
  });
});
