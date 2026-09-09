import fs from 'fs';
import path from 'path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260430120000_text_proof_submission_contract.sql'
);
const reviewMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260430120500_review_challenge_submission_contract.sql'
);

describe('text proof migration contract', () => {
  it('allows text media type and stores text through the submit RPC', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain("media_type IN ('photo', 'video', 'text')");
    expect(sql).toContain("submission_type IN ('photo', 'video', 'text')");
    expect(sql).toContain('p_submission_text text DEFAULT NULL');
    expect(sql).toContain('stored_media_url := NULL');
    expect(sql).toContain('submission_text');
    expect(sql).toContain("'error', 'Text proof requires submission text.'");
  });

  it('reviews challenge_submissions instead of the retired verification table', () => {
    const sql = fs.readFileSync(reviewMigrationPath, 'utf8');

    expect(sql).toContain('review_challenge_verification');
    expect(sql).toContain('FROM public.challenge_submissions cs');
    expect(sql).toContain('UPDATE public.challenge_submissions');
    expect(sql).toContain('Cannot review your own submission');
    expect(sql).toContain("'reviewer_id', v_reviewer_id");
    expect(sql).toContain("'reviewed_by', v_reviewer_id");
    expect(sql).not.toContain('public.challenge_verifications');
    expect(sql).not.toContain('FROM challenge_verifications');
    expect(sql).not.toContain('UPDATE challenge_verifications');
  });
});
