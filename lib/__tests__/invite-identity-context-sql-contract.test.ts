import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260901154500_invite_identity_context_v1.sql'
  ),
  'utf8'
);

const between = (start: string, end: string): string =>
  source.slice(source.indexOf(start), source.indexOf(end));

const groupPreview = between(
  'create or replace function public.preview_group_invite_guest_v1',
  'revoke all on function public.preview_group_invite_guest_v1'
);

const eventPreview = between(
  'create or replace function public.event_get_invite_entry_summary_v2',
  'revoke all on function public.event_get_invite_entry_summary_v2'
);

describe('invite identity context SQL contract', () => {
  it('adds only coarse privacy to a valid possession-scoped group preview', () => {
    expect(groupPreview).toContain("v_code !~ '^[A-HJ-NP-Z2-9]{26}$'");
    expect(groupPreview).toContain(
      "when group_row.privacy = 'public' then 'public'"
    );
    expect(groupPreview).toContain("else 'private'");
    expect(groupPreview).toContain("'privacy', v_privacy");
    expect(groupPreview).not.toContain("'group_id'");
    expect(groupPreview).not.toContain("'member_count'");
    expect(groupPreview).not.toContain("'email'");
    expect(groupPreview).not.toContain("'phone'");
  });

  it('keeps every unavailable group capability generic and non-consuming', () => {
    expect(groupPreview.match(/'code', 'UNAVAILABLE'/g)).toHaveLength(2);
    expect(groupPreview).not.toMatch(/\binsert\s+into\b/i);
    expect(groupPreview).not.toMatch(/\bupdate\s+public\./i);
    expect(groupPreview).not.toMatch(/\bdelete\s+from\b/i);
    expect(groupPreview).not.toContain("'EXPIRED'");
    expect(groupPreview).not.toContain("'REPLACED'");
  });

  it('keeps the group guest capability anonymous-only', () => {
    expect(source).toMatch(
      /revoke all on function public\.preview_group_invite_guest_v1\(text\)[\s\S]*from public, anon, authenticated, service_role;[\s\S]*grant execute on function public\.preview_group_invite_guest_v1\(text\)[\s\S]*to anon;/
    );
  });

  it('adds an event inviter only after the full invite capability gate', () => {
    expect(eventPreview).toContain('private.users_have_block_relationship_v1(');
    expect(eventPreview).toContain('invite.token_hash = p_invite_token_hash');
    expect(eventPreview).toContain('invite.revoked_at is null');
    expect(eventPreview).toContain(
      'invite.expires_at is null or invite.expires_at > now()'
    );
    expect(eventPreview).toContain('invite.use_count < invite.max_uses');
    expect(eventPreview).toContain('invite.issued_to_user_id = p_actor_id');
    expect(eventPreview).toContain('if v_invite_id is not null');
    expect(eventPreview).toContain("'{data,inviterName}'");
    expect(eventPreview).toContain("v_summary ->> 'outcome' = 'completed'");
  });

  it('does not add event contact, token, proof, media, or organiser IDs', () => {
    expect(eventPreview).not.toContain("'organiserId'");
    expect(eventPreview).not.toContain("'email'");
    expect(eventPreview).not.toContain("'phone'");
    expect(eventPreview).not.toContain("'tokenHash'");
    expect(eventPreview).not.toContain("'rawToken'");
    expect(eventPreview).not.toContain("'proof'");
    expect(eventPreview).not.toContain("'media'");
  });

  it('keeps the event capability behind the service-role Edge Function', () => {
    expect(source).toMatch(
      /revoke all on function public\.event_get_invite_entry_summary_v2\([\s\S]*from public, anon, authenticated, service_role;[\s\S]*grant execute on function public\.event_get_invite_entry_summary_v2\([\s\S]*\) to service_role;/
    );
  });
});
