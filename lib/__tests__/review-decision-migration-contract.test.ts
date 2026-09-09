import fs from 'fs';
import path from 'path';

describe('review decision migration contract', () => {
  const sql = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260805100000_review_decision_cas_contract.sql'
    ),
    'utf8'
  );

  it('locks and accepts only pending submissions', () => {
    expect(sql).toContain('for update');
    expect(sql).toContain("v_submission.status is distinct from 'pending'");
    expect(sql).toContain("where id = $7 and status = ''pending''");
  });

  it('returns typed conflict receipts without overwriting the first decision', () => {
    expect(sql).toContain("'code', 'ALREADY_DECIDED'");
    expect(sql).toContain("'code', 'CHANGED_WHILE_REVIEWING'");
    expect(sql).toContain("'current_status', v_submission.status");
  });

  it('keeps the security-definer boundary self-scoped and least privilege', () => {
    expect(sql).toContain('security definer');
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain('v_reviewer_id uuid := auth.uid()');
    expect(sql).toContain('public.current_session_is_active()');
    expect(sql).toContain('from public, anon');
    expect(sql).toContain('to authenticated, service_role');
    expect(sql).not.toContain("'detail', sqlerrm");
    expect(sql).not.toContain("'sqlstate', sqlstate");
  });
});
