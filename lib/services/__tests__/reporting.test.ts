import {
  reportingService,
  type SubmitContentReportInput,
} from '@/lib/services/reporting';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    rpc: jest.fn(),
  },
}));

const mockedGetUser = jest.mocked(supabase.auth.getUser);
const mockedRpc = jest.mocked(supabase.rpc);

const reporterId = '11111111-1111-4111-8111-111111111111';
const clientEventId = '22222222-2222-4222-8222-222222222222';
const targetId = '33333333-3333-4333-8333-333333333333';
const receiptId = '44444444-4444-4444-8444-444444444444';

const input: SubmitContentReportInput = {
  expectedReporterId: reporterId,
  clientEventId,
  targetType: 'verification',
  targetId,
  reason: 'inappropriate',
  facts: {
    title: 'Report this proof',
    description: 'This proof breaks the SFW rule.',
    observed_behavior: null,
    expected_behavior: null,
    steps_to_reproduce: null,
    source: 'review_queue',
    report_kind: 'submission',
    challenge_id: '55555555-5555-4555-8555-555555555555',
    group_id: null,
    submission_id: targetId,
    target_user_id: '66666666-6666-4666-8666-666666666666',
    target_user_label: 'Aroha',
    context_label: 'Morning proof',
    crash_reference: null,
    attachments: [],
    attachment_state: 'none',
    snapshot_created_at: '2026-08-13T00:00:00.000Z',
    report_draft_id: clientEventId,
  },
};

const authenticatedAs = (userId: string | null) => {
  mockedGetUser.mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
};

describe('reportingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authenticatedAs(reporterId);
  });

  it('uses the account-bound RPC and validates its exact receipt', async () => {
    mockedRpc.mockResolvedValue({
      data: {
        success: true,
        outcome: 'confirmed',
        code: 'REPORT_RECEIVED',
        reporter_id: reporterId,
        client_event_id: clientEventId,
        receipt_id: receiptId,
        status: 'open',
        received_at: '2026-08-13T00:00:01.000Z',
        replayed: false,
      },
      error: null,
    } as never);

    await expect(reportingService.submitContentReport(input)).resolves.toEqual({
      success: true,
      outcome: 'confirmed',
      code: 'REPORT_RECEIVED',
      reporterId,
      clientEventId,
      receiptId,
      status: 'open',
      receivedAt: '2026-08-13T00:00:01.000Z',
      replayed: false,
    });
    expect(mockedRpc).toHaveBeenCalledWith('submit_content_report_v1', {
      p_expected_reporter_id: reporterId,
      p_client_event_id: clientEventId,
      p_target_type: 'verification',
      p_target_id: targetId,
      p_reason: 'inappropriate',
      p_facts: input.facts,
    });
    expect(mockedRpc.mock.contexts[0]).toBe(supabase);
    expect(mockedGetUser).toHaveBeenCalledTimes(2);
  });

  it('does not call the RPC after a preflight account change', async () => {
    authenticatedAs('77777777-7777-4777-8777-777777777777');

    await expect(reportingService.submitContentReport(input)).resolves.toEqual(
      expect.objectContaining({
        success: false,
        outcome: 'not-sent',
        code: 'ACCOUNT_CHANGED',
      })
    );
    expect(mockedRpc).not.toHaveBeenCalled();
  });

  it('treats a network failure as result unknown', async () => {
    mockedRpc.mockRejectedValue(new TypeError('Network request failed'));

    await expect(reportingService.submitContentReport(input)).resolves.toEqual(
      expect.objectContaining({
        success: false,
        outcome: 'result-unknown',
        code: 'REPORT_RESPONSE_UNAVAILABLE',
      })
    );
  });

  it('rejects a receipt for another account or report key', async () => {
    mockedRpc.mockResolvedValue({
      data: {
        success: true,
        outcome: 'confirmed',
        code: 'REPORT_RECEIVED',
        reporter_id: '77777777-7777-4777-8777-777777777777',
        client_event_id: clientEventId,
        receipt_id: receiptId,
        status: 'open',
        received_at: '2026-08-13T00:00:01.000Z',
        replayed: false,
      },
      error: null,
    } as never);

    await expect(reportingService.submitContentReport(input)).resolves.toEqual(
      expect.objectContaining({
        success: false,
        outcome: 'result-unknown',
        code: 'MALFORMED_REPORT_RECEIPT',
      })
    );
  });

  it('does not expose a confirmed receipt after the account changes', async () => {
    mockedGetUser
      .mockResolvedValueOnce({
        data: { user: { id: reporterId } },
        error: null,
      } as never)
      .mockResolvedValueOnce({
        data: {
          user: { id: '77777777-7777-4777-8777-777777777777' },
        },
        error: null,
      } as never);
    mockedRpc.mockResolvedValue({
      data: {
        success: true,
        outcome: 'confirmed',
        code: 'REPORT_RECEIVED',
        reporter_id: reporterId,
        client_event_id: clientEventId,
        receipt_id: receiptId,
        status: 'open',
        received_at: '2026-08-13T00:00:01.000Z',
        replayed: false,
      },
      error: null,
    } as never);

    await expect(reportingService.submitContentReport(input)).resolves.toEqual(
      expect.objectContaining({
        success: false,
        outcome: 'result-unknown',
        code: 'ACCOUNT_CHANGED_AFTER_SEND',
      })
    );
  });
});
