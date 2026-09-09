import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260901160000_join_target_group_id_ambiguity_v1.sql'
  ),
  'utf8'
);

const extract = (name: string): string => {
  const start = source.indexOf(`create or replace function ${name}`);
  const end = source.indexOf(`revoke all on function ${name}`, start);
  return source.slice(start, end);
};

describe('join target group ID ambiguity repair', () => {
  it.each([
    'private.resolve_challenge_join_target_v1',
    'private.resolve_promise_accountability_join_target_v2',
  ])('uses an unambiguous local group ID in %s', name => {
    const definition = extract(name);
    expect(definition).toContain('v_resolved_group_id uuid');
    expect(definition).toContain(
      'into v_resolved_group_id, group_name, v_group_status'
    );
    expect(definition).toContain('group_id := v_resolved_group_id');
    expect(definition).toContain('member.group_id = v_resolved_group_id');
    expect(definition).toContain(
      'v_resolved_group_id is not null and v_group_status'
    );
    expect(definition).not.toMatch(/member\.group_id\s*=\s*group_id\b/);
  });

  it('preserves stable definer execution and a fixed empty search path', () => {
    expect(
      source.match(
        /\nlanguage plpgsql\nstable\nsecurity definer\nset search_path = ''/g
      )
    ).toHaveLength(2);
  });

  it('keeps both private helpers ungranted', () => {
    expect(
      source.match(/from public, anon, authenticated, service_role;/g)
    ).toHaveLength(2);
    expect(source).not.toMatch(
      /grant execute on function private\.resolve_(?:challenge|promise)/
    );
  });
});
