import fs from 'fs';
import path from 'path';

describe('group invite preview SQL contract', () => {
  const migration = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260805113000_group_invite_preview_v2.sql'
    ),
    'utf8'
  );
  const guestPreviewMigration = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260825134519_allow_guest_group_invite_preview.sql'
    ),
    'utf8'
  );
  const generator = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/functions/generate-group-invite/index.ts'
    ),
    'utf8'
  );
  const previewFunction = migration.slice(
    migration.indexOf(
      'create or replace function public.preview_group_invite_v2'
    ),
    migration.indexOf('revoke all on function public.preview_group_invite_v2')
  );
  const guestPreviewFunction = guestPreviewMigration.slice(
    guestPreviewMigration.indexOf(
      'create or replace function public.preview_group_invite_guest_v1'
    ),
    guestPreviewMigration.indexOf(
      'revoke all on function public.preview_group_invite_guest_v1'
    )
  );

  it('is authenticated, active-session checked, self-scoped and least grant', () => {
    expect(previewFunction).toContain('v_user_id uuid := auth.uid()');
    expect(previewFunction).toContain('public.current_session_is_active()');
    expect(previewFunction).toContain("set search_path = ''");
    expect(migration).toContain(
      'revoke all on function public.preview_group_invite_v2(text)'
    );
    expect(migration).toContain(
      'from public, anon, authenticated, service_role'
    );
    expect(migration).toContain('to authenticated;');
  });

  it('lets a guest preview only with a complete high-entropy capability', () => {
    expect(guestPreviewFunction).toContain("v_code !~ '^[A-HJ-NP-Z2-9]{26}$'");
    expect(guestPreviewMigration).toContain(
      'revoke all on function public.preview_group_invite_guest_v1(text)'
    );
    expect(guestPreviewMigration).toContain(
      'from public, anon, authenticated, service_role'
    );
    expect(guestPreviewMigration).toContain('to anon;');
    expect(guestPreviewMigration).not.toContain('to authenticated;');
  });

  it('returns only the Paper-required guest fields', () => {
    expect(guestPreviewFunction).toContain("'group_name', v_group_name");
    expect(guestPreviewFunction).toContain("'inviter_name', v_inviter_name");
    expect(guestPreviewFunction).toContain(
      "'shared_promise', v_shared_promise"
    );
    expect(guestPreviewFunction).toContain("'expires_at', v_expires_at");
    expect(guestPreviewFunction).not.toContain("'group_id'");
    expect(guestPreviewFunction).not.toContain("'group_description'");
    expect(guestPreviewFunction).not.toContain("'privacy'");
    expect(guestPreviewFunction).not.toContain("'member_count'");
    expect(guestPreviewFunction).not.toContain("'is_member'");
  });

  it('uses one non-leaking unavailable response for every guest failure', () => {
    expect(guestPreviewFunction.match(/'code', 'UNAVAILABLE'/g)).toHaveLength(
      2
    );
    expect(guestPreviewFunction).not.toContain(
      'private.group_invite_replacements'
    );
    expect(guestPreviewFunction).not.toContain("'EXPIRED'");
    expect(guestPreviewFunction).not.toContain("'REPLACED'");
    expect(guestPreviewFunction).not.toContain("'GROUP_INACTIVE'");
    expect(guestPreviewFunction).not.toContain("'NOT_FOUND'");
  });

  it('previews without consuming, joining or changing group state', () => {
    expect(guestPreviewFunction).not.toMatch(/\binsert\s+into\b/i);
    expect(guestPreviewFunction).not.toMatch(/\bupdate\s+public\./i);
    expect(guestPreviewFunction).not.toMatch(/\bdelete\s+from\b/i);
    expect(guestPreviewFunction).not.toContain('join_group_with_payment');
    expect(guestPreviewFunction).not.toContain('join_accountability_group');
  });

  it.each([
    'ACTIVE',
    'ALREADY_MEMBER',
    'EXPIRED',
    'REPLACED',
    'GROUP_INACTIVE',
    'NOT_FOUND',
  ])('returns an explicit %s state', state => {
    expect(previewFunction).toContain(`'${state}'`);
  });

  it('records replacements only when the new code exists before old-code deletion', () => {
    const insertBoundary = generator.indexOf(
      'const { error: insertError } = await context.serviceClient'
    );
    const deleteBoundary = generator.indexOf(
      'const { error: deleteError } = await context.serviceClient'
    );

    expect(insertBoundary).toBeGreaterThan(-1);
    expect(deleteBoundary).toBeGreaterThan(insertBoundary);
    expect(migration).toContain(
      "replacement.type = 'group'\n        and replacement.ref_id = old.ref_id"
    );
    expect(migration).toContain("'status', 'NOT_FOUND'");
  });

  it('does not reveal group metadata through a replaced capability', () => {
    const replacedResponse = previewFunction.slice(
      previewFunction.indexOf(
        '-- A replaced code proves only that this exact capability is stale.'
      ),
      previewFunction.indexOf(
        '  end if;',
        previewFunction.indexOf(
          '-- A replaced code proves only that this exact capability is stale.'
        )
      )
    );

    expect(replacedResponse).toContain("'status', 'REPLACED'");
    expect(replacedResponse).toContain("'group_id', null");
    expect(replacedResponse).toContain("'group_name', null");
    expect(replacedResponse).toContain("'inviter_name', null");
  });
});
