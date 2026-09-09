import fs from 'node:fs';
import path from 'node:path';

const readFile = (workspaceRelativePath: string): string => {
  const absolutePath = path.join(process.cwd(), workspaceRelativePath);
  return fs.readFileSync(absolutePath, 'utf-8');
};

describe('challenge creation SQL contract', () => {
  it('exposes auth-owned core creation RPCs for the Paper rebuild', () => {
    const migration = readFile(
      'supabase/migrations/20260605143000_auth_owned_core_creation_rpcs.sql'
    );

    expect(migration).toContain(
      'function public.create_accountability_challenge'
    );
    expect(migration).toContain('function public.create_accountability_group');
    expect(migration).toContain('function public.join_accountability_group');
    expect(migration).toContain('v_user_id uuid := auth.uid()');
    expect(migration).toContain('public.create_challenge_with_payment(');
    expect(migration).toContain('public.create_group_with_payment(');
    expect(migration).toContain('public.join_group_with_payment(');
    expect(migration).not.toContain('p_user_id uuid');
    expect(migration).toContain(
      'revoke all on function public.create_accountability_challenge'
    );
    expect(migration).toContain(
      'grant execute on function public.create_accountability_challenge'
    );
    expect(migration).toContain('to authenticated, service_role');
  });

  it('adds allowlisted group image presets without replacing the installed-client RPC', () => {
    const legacyMigration = readFile(
      'supabase/migrations/20260605143000_auth_owned_core_creation_rpcs.sql'
    );
    const presetMigration = readFile(
      'supabase/migrations/20260814154500_add_group_image_presets.sql'
    );
    const imageColumnMigration = readFile(
      'supabase/migrations/20260814160000_add_team_image_url.sql'
    );
    const coalesceRepair = readFile(
      'supabase/migrations/20260815023241_repair_group_image_preset_coalesce.sql'
    );
    const nullifRepair = readFile(
      'supabase/migrations/20260815115007_repair_group_creation_nullif.sql'
    );

    expect(legacyMigration).toContain(
      'function public.create_accountability_group('
    );
    expect(presetMigration).toContain(
      'function public.create_accountability_group_v2('
    );
    expect(presetMigration).toContain(
      "array['move', 'focus', 'reset', 'create']::text[]"
    );
    expect(presetMigration).toContain(
      "set image_url = 'menta-preset:' || v_image_preset"
    );
    expect(presetMigration).not.toContain(
      'drop function public.create_accountability_group('
    );
    expect(imageColumnMigration).toContain(
      'add column if not exists image_url text'
    );
    expect(coalesceRepair).toContain(
      'create or replace function public.create_accountability_group_v2('
    );
    expect(coalesceRepair).toContain("coalesce(p_image_preset, ''::text)");
    expect(coalesceRepair).not.toMatch(/\bpg_catalog\.coalesce\s*\(/);
    expect(coalesceRepair).toContain(') to authenticated, service_role;');
    expect(nullifRepair).toContain(
      'create or replace function public.create_accountability_group_v2('
    );
    expect(nullifRepair).not.toMatch(/\bpg_catalog\.nullif\s*\(/);
    expect(nullifRepair).not.toMatch(/\bpg_catalog\.coalesce\s*\(/);
    expect(nullifRepair).toContain(') to authenticated, service_role;');
  });

  it('persists solo and enhanced challenge fields passed by the app RPC', () => {
    const migration = readFile(
      'supabase/migrations/20260512015340_fix_create_challenge_with_payment_fields.sql'
    );
    const insertBlock = migration.match(
      /insert into public\.challenges\(([\s\S]*?)\)\s*values\s*\(([\s\S]*?)\)\s*returning id into new_challenge_id/i
    );

    expect(insertBlock).not.toBeNull();
    const [, columns, values] = insertBlock ?? ['', '', ''];

    for (const column of [
      'duration',
      'verification_description',
      'difficulty',
      'points_value',
      'allow_extensions',
      'max_extensions',
      'deadline_type',
      'allow_self_review',
      'submission_expectations',
      'streak_timezone',
    ]) {
      expect(columns).toContain(column);
    }

    expect(values).toContain('effective_duration');
    expect(values).toContain('p_verification_description');
    expect(values).toContain('effective_difficulty');
    expect(values).toContain('coalesce(p_points, 200)');
    expect(values).toContain('coalesce(p_allow_extensions, true)');
    expect(values).toContain('greatest(coalesce(p_max_extensions, 2), 0)');
    expect(values).toContain('effective_deadline_type');
    expect(values).toContain('effective_allow_self_review');
    expect(values).toContain(
      "'requires_peer_review', not effective_allow_self_review"
    );
    expect(values).toContain(
      "'reviewers_required', case when effective_allow_self_review then 0 else 1 end"
    );
  });

  it('backfills active groupless challenges as solo so they appear up next', () => {
    const migration = readFile(
      'supabase/migrations/20260512015340_fix_create_challenge_with_payment_fields.sql'
    );

    expect(migration).toContain('set');
    expect(migration).toContain('allow_self_review = true');
    expect(migration).toContain('not exists (');
    expect(migration).toContain('from public.team_challenges tc');
    expect(migration).toContain('where tc.challenge_id = c.id');
    expect(migration).toContain('from public.challenge_participants cp');
    expect(migration).toContain('cp.user_id = c.creator_id');
  });
});
