import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const submissionService = fs.readFileSync(
  path.join(root, 'lib/services/proof-submission-service.ts'),
  'utf8'
);
const currentProofContract = fs.readFileSync(
  path.join(
    root,
    'supabase/migrations/20260805123000_proof_correction_resubmission_contract.sql'
  ),
  'utf8'
);

describe('proof day authority contract', () => {
  it('does not send a client timestamp as streak-day authority', () => {
    expect(submissionService).not.toContain('p_client_committed_at');
    expect(submissionService).not.toContain('p_captured_at');
    expect(submissionService).toContain(
      'p_client_event_id: draft.clientEventId'
    );
  });

  it('derives the credited local day from server time', () => {
    expect(currentProofContract).toContain(
      'v_today_local := (now() at time zone v_effective_tz)::date;'
    );
    expect(currentProofContract).not.toContain('p_client_committed_at');
    expect(currentProofContract).not.toContain('p_captured_at');
  });

  it('keeps replay idempotent under the original client event id', () => {
    expect(currentProofContract).toContain(
      'where cs.user_id = v_user_id\n    and cs.client_event_id = v_client_event_id'
    );
    expect(currentProofContract).toContain("'IDEMPOTENCY_KEY_REUSED'");
  });
});
