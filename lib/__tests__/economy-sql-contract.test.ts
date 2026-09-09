import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260815010000_economy_contract_v1.sql'
  ),
  'utf8'
);

describe('economy contract SQL', () => {
  it('owns prices and quotas on the server', () => {
    expect(migration).toContain('key, value, updated_at');
    expect(migration).toContain("'economy_contract_v1'");
    expect(migration).toContain('private.economy_action_cost_v1');
    expect(migration).toContain('private.economy_quota_error_v1');
    expect(migration).not.toContain('when is_pro_user then 0');
    expect(migration).toContain('QUOTA_ACTIVE_PROMISES');
    expect(migration).toContain('QUOTA_ACTIVE_GROUPS');
  });

  it('repairs quota_status onto teams instead of the removed groups table', () => {
    expect(migration).toContain(
      'create or replace function public.quota_status'
    );
    expect(migration).toContain('from public.teams team');
    expect(migration).not.toContain('from groups');
  });

  it('grants freezes for kept account streaks without confiscating them', () => {
    expect(migration).toContain('streak_unlock_receipts');
    expect(migration).toContain('streak_freeze_7');
    expect(migration).toContain('streak_freeze_30');
    expect(migration).toContain("'streak_freeze_basic'");
    expect(migration).toContain('on conflict (user_id, sku) do nothing');
  });

  it('ignores client-supplied join prices', () => {
    expect(migration).toContain(
      "v_effective_cost := private.economy_action_cost_v1(p_user_id, 'join_group')"
    );
    expect(migration).not.toMatch(
      /join_group_with_payment[\s\S]*if p_cost > 0 then/
    );
    expect(migration).toContain("hashtextextended('join-group:'");
  });

  it('persists bounded group duration in the server-owned create transaction', () => {
    expect(migration).toContain('status,\n    duration_days');
    expect(migration).toContain(
      'least(365, greatest(coalesce(p_duration_days, 30), 1))'
    );
  });
});

const freezeGrant = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260815013000_pro_period_freeze_grant.sql'
  ),
  'utf8'
);

describe('Pro period freeze grant SQL', () => {
  it('grants one freeze per billing reference and keeps it service-role only', () => {
    expect(freezeGrant).toContain('grant_pro_period_freeze_v1');
    expect(freezeGrant).toContain(
      "v_receipt_sku := 'pro_freeze:' || v_reference"
    );
    expect(freezeGrant).toContain("'streak_freeze_basic'");
    expect(freezeGrant).toContain('on conflict (user_id, sku) do nothing');
    expect(freezeGrant).toContain('to service_role');
    expect(freezeGrant).not.toMatch(/grant execute[\s\S]*to authenticated/);
  });
});
