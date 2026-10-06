import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createProofDraft,
  getProofDraft,
  updateProofDraft,
} from '@/lib/proof-drafts';
import { getQueuedProofUpload } from '@/lib/proof-upload-queue';
import { trackProductEvent } from '@/lib/posthog';
import { supabase } from '@/lib/supabase';
import { StreakManager } from '@/lib/streak-manager';
import {
  releaseDurableProofMedia,
  uploadDurableProofMedia,
} from '@/lib/services/proof-media-service';
import {
  ProofSubmissionError,
  canReleaseConfirmedLocalProofMedia,
  decodeSubmitProofPayload,
  resumeProofSubmission,
  submitChallengeProof,
} from '@/lib/services/proof-submission-service';

jest.mock('@/lib/streak-manager', () => ({
  StreakManager: {
    checkMilestone: jest.fn(),
  },
}));

jest.mock('@/lib/posthog', () => ({ trackProductEvent: jest.fn() }));

jest.mock('@/lib/services/proof-media-service', () => ({
  uploadDurableProofMedia: jest.fn(),
  releaseDurableProofMedia: jest.fn(),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockProofRpc = jest.fn();
const mockRpcSetHeader = jest.fn();
const mockCheckMilestone = StreakManager.checkMilestone as jest.Mock;
const mockUploadDurableProofMedia = uploadDurableProofMedia as jest.Mock;
const mockReleaseDurableProofMedia = releaseDurableProofMedia as jest.Mock;

const buildSuccessfulRpcPayload = ({
  submissionId,
  clientEventId,
  status = 'pending',
  allowSelfReview = false,
  mediaType = 'photo',
  mediaUrl = mediaType === 'text' ? null : 'user-1/proof.jpg',
  submissionText = null,
  newStreak = 1,
  longestStreak = newStreak,
  inputAccepted = true,
  replacesSubmissionId = null,
  dayStatus = status === 'approved'
    ? replacesSubmissionId === null
      ? 'done'
      : 'already_applied'
    : 'pending_review',
  milestone = null,
}: {
  submissionId: string;
  clientEventId: string;
  status?: 'pending' | 'approved' | 'rejected';
  allowSelfReview?: boolean;
  mediaType?: 'photo' | 'video' | 'text';
  mediaUrl?: string | null;
  submissionText?: string | null;
  newStreak?: number;
  longestStreak?: number;
  inputAccepted?: boolean;
  dayStatus?:
    'pending_review' | 'already_applied' | 'done' | 'freeze_used' | 'missed';
  milestone?: {
    reached: true;
    milestone: number;
    reward: number;
    rewardGranted: true;
  } | null;
  replacesSubmissionId?: string | null;
}) => ({
  success: true,
  inputAccepted,
  submissionId,
  clientEventId,
  status,
  allowSelfReview,
  newStreak,
  longestStreak,
  freezeUsed: false,
  freezesRemaining: 2,
  dayStatus,
  milestone,
  effectiveLocalDay: '2026-08-05',
  effectiveTimezone: 'Pacific/Auckland',
  isCorrection: replacesSubmissionId !== null,
  replacesSubmissionId,
  data: {
    id: submissionId,
    client_event_id: clientEventId,
    status,
    allowSelfReview,
    media_url: mediaUrl,
    media_type: mediaType,
    submission_text: submissionText,
    replaces_submission_id: replacesSubmissionId,
  },
});

const buildFailedRpcPayload = (error: string, code: string) => ({
  success: false,
  error,
  code,
  message: error,
});

type CommittedProofReceipt = {
  id: string;
  user_id: string;
  challenge_id: string;
  client_event_id: string;
  media_type: 'photo' | 'video' | 'text';
  media_url: string | null;
  submission_text: string | null;
  status: 'pending' | 'approved' | 'rejected';
};

// Committed rows are explicitly seeded by each scenario, independently of RPC
// arguments and responses. Wrong table/filter requests cannot echo a receipt.
const committedReceipt = (
  facts: Pick<CommittedProofReceipt, 'id' | 'client_event_id'> &
    Partial<CommittedProofReceipt>
): CommittedProofReceipt => ({
  user_id: 'user-1',
  challenge_id: 'challenge-1',
  media_type: 'photo',
  media_url: 'user-1/proof.jpg',
  submission_text: null,
  status: 'pending',
  ...facts,
});

const installReceiptReadback = (
  receipts: CommittedProofReceipt[] = [],
  deliveredReceipt?: CommittedProofReceipt
) => {
  const readbacks: (CommittedProofReceipt | null)[] = [];
  (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
    const filters = new Map<string, unknown>();
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn(function (this: unknown, column: string, value: unknown) {
        filters.set(column, value);
        return this;
      }),
      maybeSingle: jest.fn(async () => {
        if (table === 'challenge_participants') {
          return {
            data: {
              challenge_id: 'challenge-1',
              status: 'active',
              challenges: { id: 'challenge-1', status: 'active' },
            },
            error: null,
          };
        }
        if (table !== 'challenge_submissions') {
          throw new Error(`Unexpected receipt table: ${table}`);
        }
        // A deliberately misaddressed non-null server row isolates the receipt
        // validator from query filtering, so a mismatch cannot pass via null.
        const matches = deliveredReceipt
          ? [deliveredReceipt]
          : receipts.filter(row =>
              [...filters].every(
                ([column, value]) =>
                  row[column as keyof CommittedProofReceipt] === value
              )
            );
        readbacks.push(matches.length === 1 ? matches[0] : null);
        return {
          data: matches.length === 1 ? matches[0] : null,
          error:
            matches.length > 1
              ? { code: 'PGRST116', message: 'Multiple committed rows' }
              : null,
        };
      }),
    };
  });
  return readbacks;
};

describe('proof-submission-service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: { user: { id: 'user-1' }, access_token: 'fake-user-1-token' },
      },
      error: null,
    });
    mockProofRpc.mockReset();
    mockProofRpc.mockResolvedValue({ data: null, error: null });
    (mockSupabase.rpc as jest.Mock).mockImplementation(
      (...args: unknown[]) => ({
        setHeader: (name: string, value: string) => {
          mockRpcSetHeader(name, value);
          return mockProofRpc(...args);
        },
      })
    );
    await AsyncStorage.clear();
    mockCheckMilestone.mockResolvedValue(null);
    mockUploadDurableProofMedia.mockResolvedValue(
      'user-1/proof-challenge-1-local-event.jpg'
    );
    installReceiptReadback();
  });

  it('releases local media only for pending or accepted server receipts', () => {
    expect(canReleaseConfirmedLocalProofMedia('pending-review')).toBe(true);
    expect(canReleaseConfirmedLocalProofMedia('accepted')).toBe(true);
    expect(canReleaseConfirmedLocalProofMedia('sent')).toBe(false);
    expect(canReleaseConfirmedLocalProofMedia('correction-requested')).toBe(
      false
    );
    expect(canReleaseConfirmedLocalProofMedia('unknown-result')).toBe(false);
  });

  it('dispatches text proof with the confirmed owner token when the client account changes at dispatch', async () => {
    installReceiptReadback([
      committedReceipt({
        id: '15151515-1515-4515-8515-151515151515',
        client_event_id: '14141414-1414-4414-8414-141414141414',
        media_type: 'text',
        media_url: null,
        submission_text: 'Completed 45 minutes of study.',
      }),
    ]);
    const clientEventId = '14141414-1414-4414-8414-141414141414';
    mockProofRpc.mockResolvedValue({
      data: buildSuccessfulRpcPayload({
        submissionId: '15151515-1515-4515-8515-151515151515',
        clientEventId,
        mediaType: 'text',
        submissionText: 'Completed 45 minutes of study.',
      }),
      error: null,
    });
    mockRpcSetHeader.mockImplementationOnce(() => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-2' },
            access_token: 'fake-user-2-token',
          },
        },
        error: null,
      });
    });

    await submitChallengeProof({
      userId: 'user-1',
      challengeId: 'challenge-1',
      clientEventId,
      proofValue: 'Completed 45 minutes of study.',
      proofType: 'text',
    });

    expect(mockRpcSetHeader).toHaveBeenCalledWith(
      'Authorization',
      'Bearer fake-user-1-token'
    );
    expect(mockProofRpc).toHaveBeenCalledTimes(1);
  });

  it('preserves text proof without submitting it as an account that signed in during the target check', async () => {
    let finishTargetCheck!: (value: unknown) => void;
    let targetCheckStarted!: () => void;
    const started = new Promise<void>(resolve => {
      targetCheckStarted = resolve;
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() => {
        targetCheckStarted();
        return new Promise(resolve => {
          finishTargetCheck = resolve;
        });
      }),
    });
    const clientEventId = '12121212-1212-4212-8212-121212121212';
    const submission = submitChallengeProof({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofValue: 'Completed 45 minutes of study.',
      proofType: 'text',
      clientEventId,
    });
    await started;
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-2' } } },
      error: null,
    });
    finishTargetCheck({
      data: { challenge_id: 'challenge-1', status: 'active' },
      error: null,
    });

    await expect(submission).rejects.toMatchObject({
      code: 'ACCOUNT_CHANGED',
      receiptStatus: 'saved-local',
    });
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(await getProofDraft(clientEventId)).toMatchObject({
      userId: 'user-1',
      proofValue: 'Completed 45 minutes of study.',
      status: 'saved-local',
    });
  });

  it('keeps uploaded and local media recoverable when the account changes during upload', async () => {
    mockUploadDurableProofMedia.mockImplementationOnce(async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
      return 'user-1/preserved-proof.jpg';
    });
    const clientEventId = '13131313-1313-4313-8313-131313131313';

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'file:///documents/preserved-proof.jpg',
        localMediaUri: 'file:///documents/preserved-proof.jpg',
        proofType: 'photo',
        clientEventId,
      })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_CHANGED',
      receiptStatus: 'saved-local',
    });

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(mockReleaseDurableProofMedia).not.toHaveBeenCalled();
    expect(await getProofDraft(clientEventId)).toMatchObject({
      userId: 'user-1',
      localMediaUri: 'file:///documents/preserved-proof.jpg',
      remoteMediaUrl: 'user-1/preserved-proof.jpg',
      status: 'saved-local',
    });
  });

  it('decodes a complete correction receipt and rejects mismatched identities', () => {
    const payload = buildSuccessfulRpcPayload({
      submissionId: '77777777-7777-4777-8777-777777777777',
      clientEventId: '78787878-7878-4878-8878-787878787878',
      replacesSubmissionId: '79797979-7979-4979-8979-797979797979',
    });

    expect(decodeSubmitProofPayload(payload)).toEqual(payload);
    expect(
      decodeSubmitProofPayload({
        ...payload,
        data: {
          ...payload.data,
          client_event_id: '80808080-8080-4080-8080-808080808080',
        },
      })
    ).toBeNull();
    expect(
      decodeSubmitProofPayload({
        ...payload,
        isCorrection: false,
      })
    ).toBeNull();
  });

  it('keeps optional ad cadence metadata non-authoritative', () => {
    const payload = buildSuccessfulRpcPayload({
      submissionId: '71717171-7171-4171-8171-717171717171',
      clientEventId: '72727272-7272-4272-8272-727272727272',
    });

    expect(
      decodeSubmitProofPayload({
        ...payload,
        proofAdBreakHint: { due: true, ordinal: 2 },
      })
    ).toEqual({
      ...payload,
      proofAdBreakHint: { due: true, ordinal: 2 },
    });

    expect(
      decodeSubmitProofPayload({
        ...payload,
        proofAdBreakHint: { due: 'yes', ordinal: 'second' },
      })
    ).toEqual(payload);
  });

  it('requires code, error, and message before treating a failure as definitive', () => {
    expect(
      decodeSubmitProofPayload(
        buildFailedRpcPayload('Join this promise first.', 'NOT_JOINED')
      )
    ).toEqual(buildFailedRpcPayload('Join this promise first.', 'NOT_JOINED'));
    expect(
      decodeSubmitProofPayload({
        success: false,
        error: 'Join this promise first.',
      })
    ).toBeNull();
    expect(
      decodeSubmitProofPayload({
        success: false,
        error: 'Join this promise first.',
        code: '',
      })
    ).toBeNull();
    expect(decodeSubmitProofPayload({ success: false })).toBeNull();
    expect(decodeSubmitProofPayload({ success: true })).toBeNull();
  });

  it('requires an authoritative receipt for an existing daily proof', () => {
    const payload = {
      ...buildFailedRpcPayload(
        "Today's proof is already waiting for review.",
        'DAILY_SUBMISSION_EXISTS'
      ),
      submissionId: '34343434-3434-4434-8434-343434343434',
      status: 'pending',
    };

    expect(decodeSubmitProofPayload(payload)).toEqual(payload);
    expect(
      decodeSubmitProofPayload({ ...payload, submissionId: 'not-a-uuid' })
    ).toBeNull();
    expect(
      decodeSubmitProofPayload({ ...payload, status: 'rejected' })
    ).toBeNull();
  });

  it('validates current input, milestone, media, and day-status fields', () => {
    const accepted = buildSuccessfulRpcPayload({
      submissionId: '91919191-9191-4191-8191-919191919191',
      clientEventId: '92929292-9292-4292-8292-929292929292',
      status: 'approved',
      allowSelfReview: true,
      inputAccepted: false,
      dayStatus: 'already_applied',
      milestone: null,
    });

    expect(decodeSubmitProofPayload(accepted)).toEqual(accepted);
    expect(
      decodeSubmitProofPayload({ ...accepted, inputAccepted: 'yes' })
    ).toBeNull();
    expect(
      decodeSubmitProofPayload({ ...accepted, dayStatus: 'at_risk' })
    ).toBeNull();
    expect(
      decodeSubmitProofPayload({
        ...accepted,
        data: { ...accepted.data, media_url: 42 },
      })
    ).toBeNull();

    const approvedCorrection = buildSuccessfulRpcPayload({
      submissionId: '93939393-9393-4393-8393-939393939393',
      clientEventId: '94949494-9494-4494-8494-949494949494',
      status: 'approved',
      allowSelfReview: true,
      replacesSubmissionId: '95959595-9595-4595-8595-959595959595',
      dayStatus: 'done',
      milestone: {
        reached: true,
        milestone: 3,
        reward: 25,
        rewardGranted: true,
      },
    });

    expect(decodeSubmitProofPayload(approvedCorrection)).toEqual(
      approvedCorrection
    );
  });

  it('submits text proof with a stable client event id before network work', async () => {
    installReceiptReadback([
      committedReceipt({
        id: '11111111-1111-4111-8111-111111111111',
        client_event_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        media_type: 'text',
        media_url: null,
        submission_text: 'Completed 45 minutes of study.',
      }),
    ]);
    mockCheckMilestone.mockResolvedValue({
      reached: true,
      milestone: 3,
      reward: 25,
    });
    mockProofRpc.mockResolvedValue({
      data: buildSuccessfulRpcPayload({
        submissionId: '11111111-1111-4111-8111-111111111111',
        clientEventId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        mediaType: 'text',
        submissionText: 'Completed 45 minutes of study.',
        newStreak: 3,
        longestStreak: 3,
      }),
      error: null,
    });

    const result = await submitChallengeProof({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofValue: '  Completed 45 minutes of study.  ',
      proofType: 'text',
      groupId: 'group-1',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'submit_challenge_verification',
      expect.objectContaining({
        p_challenge_id: 'challenge-1',
        p_media_url: null,
        p_media_type: 'text',
        p_submission_text: 'Completed 45 minutes of study.',
        p_client_tz: 'Pacific/Auckland',
        p_client_event_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      })
    );
    expect(result.clientEventId).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    expect(result.draft.groupId).toBe('group-1');
    expect(result.receiptStatus).toBe('pending-review');
    expect(result.milestone).toBeNull();
    expect(mockCheckMilestone).not.toHaveBeenCalled();
    expect(await getQueuedProofUpload(result.clientEventId)).toBeNull();
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });

  it('reconciles a correction receipt under its new client event id', async () => {
    installReceiptReadback([
      committedReceipt({
        id: '83838383-8383-4383-8383-838383838383',
        client_event_id: '81818181-8181-4181-8181-818181818181',
        media_url: 'user-1/corrected-proof.jpg',
      }),
    ]);
    const clientEventId = '81818181-8181-4181-8181-818181818181';
    const replacedSubmissionId = '82828282-8282-4282-8282-828282828282';
    mockProofRpc.mockResolvedValue({
      data: buildSuccessfulRpcPayload({
        submissionId: '83838383-8383-4383-8383-838383838383',
        clientEventId,
        replacesSubmissionId: replacedSubmissionId,
      }),
      error: null,
    });

    const result = await submitChallengeProof({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofValue: 'user-1/corrected-proof.jpg',
      proofType: 'photo',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId,
    });

    expect(result).toMatchObject({
      receiptStatus: 'pending-review',
      clientEventId,
      isCorrection: true,
      replacesSubmissionId: replacedSubmissionId,
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('challenge_submissions');
  });

  it('maps approved server status to accepted receipt', async () => {
    installReceiptReadback([
      committedReceipt({
        id: '22222222-2222-4222-8222-222222222222',
        client_event_id: '23232323-2323-4232-8232-232323232323',
        status: 'approved',
      }),
    ]);
    const milestone = {
      reached: true as const,
      milestone: 3,
      reward: 25,
      rewardGranted: true as const,
    };
    mockProofRpc.mockResolvedValue({
      data: buildSuccessfulRpcPayload({
        submissionId: '22222222-2222-4222-8222-222222222222',
        clientEventId: '23232323-2323-4232-8232-232323232323',
        status: 'approved',
        allowSelfReview: true,
        newStreak: 3,
        longestStreak: 3,
        milestone,
      }),
      error: null,
    });

    const result = await submitChallengeProof({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofValue: 'user-1/proof.jpg',
      proofType: 'photo',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: '23232323-2323-4232-8232-232323232323',
    });

    expect(result.receiptStatus).toBe('accepted');
    expect(result.milestone).toEqual(milestone);
    expect(mockCheckMilestone).not.toHaveBeenCalled();
    const draft = await getProofDraft(result.clientEventId);
    expect(draft?.status).toBe('accepted');
    expect(draft?.submissionId).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('uploads durable local media before RPC and releases it only after a server receipt', async () => {
    installReceiptReadback([
      committedReceipt({
        id: '33333333-3333-4333-8333-333333333333',
        client_event_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        media_url: 'user-1/proof-challenge-1-local-event.jpg',
      }),
    ]);
    mockProofRpc.mockResolvedValue({
      data: buildSuccessfulRpcPayload({
        submissionId: '33333333-3333-4333-8333-333333333333',
        clientEventId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      }),
      error: null,
    });

    const result = await submitChallengeProof({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofValue: 'file:///documents/proof.jpg',
      proofType: 'photo',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      localMediaUri: 'file:///documents/proof.jpg',
    });

    expect(mockUploadDurableProofMedia).toHaveBeenCalledWith({
      userId: 'user-1',
      challengeId: 'challenge-1',
      clientEventId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      localMediaUri: 'file:///documents/proof.jpg',
      mediaType: 'photo',
    });
    expect(
      mockUploadDurableProofMedia.mock.invocationCallOrder[0]
    ).toBeLessThan((mockSupabase.rpc as jest.Mock).mock.invocationCallOrder[0]);
    expect(mockReleaseDurableProofMedia).toHaveBeenCalledWith(
      'file:///documents/proof.jpg'
    );
    expect(result.receiptStatus).toBe('pending-review');
    expect(result.draft.remoteMediaUrl).toBe(
      'user-1/proof-challenge-1-local-event.jpg'
    );
    expect(result.draft.localMediaUri).toBeNull();
    expect(result.draft.sendRequestedAt).toBeTruthy();
  });

  it('keeps correction-requested media for a clearer resubmission', async () => {
    installReceiptReadback([
      committedReceipt({
        id: '44444444-4444-4444-8444-444444444444',
        client_event_id: '12121212-1212-4212-8212-121212121212',
        media_url: 'user-1/proof-challenge-1-local-event.jpg',
        status: 'rejected',
      }),
    ]);
    mockProofRpc.mockResolvedValue({
      data: buildSuccessfulRpcPayload({
        submissionId: '44444444-4444-4444-8444-444444444444',
        clientEventId: '12121212-1212-4212-8212-121212121212',
        status: 'rejected',
      }),
      error: null,
    });

    const result = await submitChallengeProof({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofValue: 'file:///documents/correction.jpg',
      proofType: 'photo',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: '12121212-1212-4212-8212-121212121212',
      localMediaUri: 'file:///documents/correction.jpg',
    });

    expect(result.receiptStatus).toBe('correction-requested');
    expect(result.draft.localMediaUri).toBe('file:///documents/correction.jpg');
    expect(mockReleaseDurableProofMedia).not.toHaveBeenCalled();
  });

  it('does not trust an RPC success that cannot be read back by the same send key', async () => {
    mockProofRpc.mockResolvedValue({
      data: buildSuccessfulRpcPayload({
        submissionId: '55555555-5555-4555-8555-555555555555',
        clientEventId: '13131313-1313-4313-8313-131313131313',
        status: 'approved',
        allowSelfReview: true,
      }),
      error: null,
    });
    installReceiptReadback();

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'file:///documents/unmatched.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: '13131313-1313-4313-8313-131313131313',
        localMediaUri: 'file:///documents/unmatched.jpg',
      })
    ).rejects.toMatchObject({
      receiptStatus: 'unknown-result',
      code: 'RECEIPT_RECONCILIATION_REQUIRED',
    });

    expect(mockReleaseDurableProofMedia).not.toHaveBeenCalled();
    expect(trackProductEvent).not.toHaveBeenCalled();
    expect(
      await getQueuedProofUpload('13131313-1313-4313-8313-131313131313')
    ).not.toBeNull();
  });

  describe('independent committed receipt readback', () => {
    const clientEventId = '56565656-5656-4656-8656-565656565656';
    const submissionId = '57575757-5757-4757-8757-575757575757';
    const localMediaUri = 'file:///documents/independent-proof.jpg';
    const remoteMediaUrl = 'user-1/proof-challenge-1-local-event.jpg';
    const proofText = 'Finished my practice session.';

    it.each<{
      field: string;
      proofType: 'photo' | 'text';
      conflict: Partial<CommittedProofReceipt>;
    }>([
      {
        field: 'challenge',
        proofType: 'photo',
        conflict: { challenge_id: 'challenge-2' },
      },
      {
        field: 'send key',
        proofType: 'photo',
        conflict: { client_event_id: '58585858-5858-4858-8858-585858585858' },
      },
      {
        field: 'submission',
        proofType: 'photo',
        conflict: { id: '59595959-5959-4959-8959-595959595959' },
      },
      {
        field: 'media type',
        proofType: 'photo',
        conflict: { media_type: 'video' },
      },
      {
        field: 'media URL',
        proofType: 'photo',
        conflict: { media_url: 'user-1/another-proof.jpg' },
      },
      {
        field: 'text',
        proofType: 'text',
        conflict: { submission_text: 'An unrelated committed proof.' },
      },
    ])(
      'rejects a non-null committed receipt with conflicting $field',
      async ({ proofType, conflict }) => {
        const row = committedReceipt({
          id: submissionId,
          client_event_id: clientEventId,
          media_type: proofType,
          media_url: proofType === 'text' ? null : remoteMediaUrl,
          submission_text: proofType === 'text' ? proofText : null,
          ...conflict,
        });
        const readbacks = installReceiptReadback([], row);
        mockProofRpc.mockResolvedValue({
          data: buildSuccessfulRpcPayload({
            submissionId,
            clientEventId,
            mediaType: proofType,
            mediaUrl: proofType === 'text' ? null : remoteMediaUrl,
            submissionText: proofType === 'text' ? proofText : null,
          }),
          error: null,
        });

        await expect(
          submitChallengeProof({
            userId: 'user-1',
            challengeId: 'challenge-1',
            clientEventId,
            proofType,
            proofValue: proofType === 'text' ? proofText : localMediaUri,
            localMediaUri: proofType === 'photo' ? localMediaUri : undefined,
          })
        ).rejects.toMatchObject({
          code: 'RECEIPT_RECONCILIATION_REQUIRED',
          receiptStatus: 'unknown-result',
        });

        expect(readbacks).toEqual([row]);
        expect(mockProofRpc).toHaveBeenCalledTimes(1);
        expect(await getProofDraft(clientEventId)).toMatchObject({
          status: 'unknown-result',
          submissionId: null,
          proofValue: proofType === 'text' ? proofText : remoteMediaUrl,
          localMediaUri: proofType === 'photo' ? localMediaUri : null,
          remoteMediaUrl: proofType === 'photo' ? remoteMediaUrl : null,
        });
        expect(await getQueuedProofUpload(clientEventId)).not.toBeNull();
        expect(mockReleaseDurableProofMedia).not.toHaveBeenCalled();
        expect(mockSupabase.storage.from).not.toHaveBeenCalled();
        expect(trackProductEvent).not.toHaveBeenCalled();
      }
    );

    it.each([
      { filter: 'owner', other: { user_id: 'user-2' } },
      {
        filter: 'send key',
        other: { client_event_id: '58585858-5858-4858-8858-585858585858' },
      },
    ])(
      'selects one independently seeded receipt using the $filter filter',
      async ({ other }) => {
        installReceiptReadback([
          committedReceipt({
            id: submissionId,
            client_event_id: clientEventId,
          }),
          committedReceipt({
            id: '59595959-5959-4959-8959-595959595959',
            client_event_id: clientEventId,
            ...other,
          }),
        ]);
        mockProofRpc.mockResolvedValue({
          data: buildSuccessfulRpcPayload({ submissionId, clientEventId }),
          error: null,
        });
        const result = await submitChallengeProof({
          userId: 'user-1',
          challengeId: 'challenge-1',
          clientEventId,
          proofType: 'photo',
          proofValue: 'user-1/proof.jpg',
        });
        expect(result).toMatchObject({
          receiptStatus: 'pending-review',
          submissionId,
        });
        expect(await getQueuedProofUpload(clientEventId)).toBeNull();
      }
    );

    it('keeps a sent draft and local media when resumed readback conflicts without another RPC', async () => {
      await createProofDraft({
        userId: 'user-1',
        challengeId: 'challenge-1',
        clientEventId,
        proofType: 'photo',
        proofValue: localMediaUri,
        localMediaUri,
        clientTimeZone: 'Pacific/Auckland',
      });
      await updateProofDraft(clientEventId, {
        status: 'sent',
        submissionId,
        serverStatus: 'sent',
        remoteMediaUrl,
        sendRequestedAt: '2026-10-03T08:00:00.000Z',
      });
      const row = committedReceipt({
        id: '59595959-5959-4959-8959-595959595959',
        client_event_id: clientEventId,
        media_url: remoteMediaUrl,
      });
      const readbacks = installReceiptReadback([row]);
      await expect(resumeProofSubmission(clientEventId)).rejects.toMatchObject({
        code: 'RECEIPT_RECONCILIATION_REQUIRED',
        receiptStatus: 'unknown-result',
      });
      expect(readbacks).toEqual([row]);
      expect(mockProofRpc).not.toHaveBeenCalled();
      expect(await getProofDraft(clientEventId)).toMatchObject({
        status: 'unknown-result',
        localMediaUri,
        remoteMediaUrl,
        submissionId,
      });
      expect(await getQueuedProofUpload(clientEventId)).not.toBeNull();
      expect(mockReleaseDurableProofMedia).not.toHaveBeenCalled();
      expect(trackProductEvent).not.toHaveBeenCalled();
    });
  });

  it('rejects reuse of a send key for a different proof identity', async () => {
    const draft = await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      proofValue: 'First proof detail',
      proofType: 'text',
      clientTimeZone: 'Pacific/Auckland',
      clientEventId: '14141414-1414-4414-8414-141414141414',
    });
    await updateProofDraft(draft.clientEventId, {
      sendRequestedAt: '2026-08-05T01:00:00.000Z',
    });

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-2',
        proofValue: 'Second proof detail',
        proofType: 'text',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: draft.clientEventId,
      })
    ).rejects.toMatchObject({
      receiptStatus: 'failed',
      code: 'CLIENT_EVENT_ID_REUSED',
    });

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('keeps local media queued when upload cannot start the RPC', async () => {
    mockUploadDurableProofMedia.mockRejectedValueOnce(
      new Error('Network request failed')
    );

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'file:///documents/proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        localMediaUri: 'file:///documents/proof.jpg',
      })
    ).rejects.toMatchObject({
      receiptStatus: 'saved-local',
      code: 'MEDIA_UPLOAD_DEFERRED',
    });

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(mockReleaseDurableProofMedia).not.toHaveBeenCalled();
    expect(
      await getQueuedProofUpload('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
    ).not.toBeNull();
    expect(
      (await getProofDraft('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'))
        ?.localMediaUri
    ).toBe('file:///documents/proof.jpg');
  });

  it('keeps an incomplete successful response unknown and queued', async () => {
    mockProofRpc.mockResolvedValue({
      data: {
        success: true,
        submissionId: 'submission-without-status',
        status: null,
        newStreak: 4,
      },
      error: null,
    });

    let caught: ProofSubmissionError | null = null;
    try {
      await submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'user-1/proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
      });
    } catch (error) {
      caught = error as ProofSubmissionError;
    }

    expect(caught).toMatchObject({
      receiptStatus: 'unknown-result',
      code: 'INVALID_SUBMIT_RECEIPT',
    });
    expect(caught?.draft?.status).toBe('unknown-result');
    expect(await getQueuedProofUpload(caught!.clientEventId)).not.toBeNull();
    expect(mockCheckMilestone).not.toHaveBeenCalled();
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });

  it('removes uploaded media only on definitive RPC failure', async () => {
    const remove = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.storage.from as jest.Mock).mockReturnValue({ remove });
    mockProofRpc.mockResolvedValue({
      data: buildFailedRpcPayload(
        'Challenge is no longer active',
        'CHALLENGE_NOT_FOUND'
      ),
      error: null,
    });

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'user-1/proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
      })
    ).rejects.toMatchObject({
      name: 'ProofSubmissionError',
      receiptStatus: 'failed',
    });

    expect(mockSupabase.storage.from).toHaveBeenCalledWith(
      'challenge-verifications'
    );
    expect(remove).toHaveBeenCalledWith(['user-1/proof.jpg']);
    expect(mockCheckMilestone).not.toHaveBeenCalled();
  });

  it('returns the existing daily receipt and removes the redundant local attempt', async () => {
    const clientEventId = '35353535-3535-4535-8535-353535353535';
    const remove = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.storage.from as jest.Mock).mockReturnValue({ remove });
    mockProofRpc.mockResolvedValue({
      data: {
        ...buildFailedRpcPayload(
          "Today's proof is already waiting for review.",
          'DAILY_SUBMISSION_EXISTS'
        ),
        submissionId: '36363636-3636-4636-8636-363636363636',
        status: 'pending',
      },
      error: null,
    });

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'file:///documents/duplicate.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId,
        localMediaUri: 'file:///documents/duplicate.jpg',
      })
    ).rejects.toMatchObject({
      name: 'ProofSubmissionError',
      receiptStatus: 'pending-review',
      code: 'DAILY_SUBMISSION_EXISTS',
      draft: null,
    });

    expect(remove).toHaveBeenCalledWith([
      'user-1/proof-challenge-1-local-event.jpg',
    ]);
    expect(mockReleaseDurableProofMedia).toHaveBeenCalledWith(
      'file:///documents/duplicate.jpg'
    );
    expect(await getProofDraft(clientEventId)).toBeNull();
    expect(await getQueuedProofUpload(clientEventId)).toBeNull();
  });

  it('keeps the durable file retryable after a definitive media rejection', async () => {
    const remove = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.storage.from as jest.Mock).mockReturnValue({ remove });
    mockProofRpc.mockResolvedValue({
      data: buildFailedRpcPayload(
        'Challenge is no longer active',
        'CHALLENGE_NOT_FOUND'
      ),
      error: null,
    });

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'file:///documents/proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        localMediaUri: 'file:///documents/proof.jpg',
      })
    ).rejects.toMatchObject({ receiptStatus: 'failed' });

    const draft = await getProofDraft('ffffffff-ffff-4fff-8fff-ffffffffffff');
    expect(remove).toHaveBeenCalledWith([
      'user-1/proof-challenge-1-local-event.jpg',
    ]);
    expect(mockReleaseDurableProofMedia).not.toHaveBeenCalled();
    expect(draft).toMatchObject({
      status: 'failed',
      localMediaUri: 'file:///documents/proof.jpg',
      proofValue: 'file:///documents/proof.jpg',
      remoteMediaUrl: null,
    });
  });

  it('keeps uploaded media and marks unknown-result on ambiguous network failure', async () => {
    const remove = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.storage.from as jest.Mock).mockReturnValue({ remove });
    mockProofRpc.mockResolvedValue({
      data: null,
      error: { message: 'Network request failed' },
    });

    let caught: ProofSubmissionError | null = null;
    try {
      await submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'user-1/proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      });
    } catch (error) {
      caught = error as ProofSubmissionError;
    }

    expect(caught).toBeInstanceOf(ProofSubmissionError);
    expect(caught?.receiptStatus).toBe('unknown-result');
    expect(caught?.clientEventId).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(remove).not.toHaveBeenCalled();

    const draft = await getProofDraft('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(draft?.status).toBe('unknown-result');
    expect(await getQueuedProofUpload(draft!.clientEventId)).not.toBeNull();
  });

  it('treats a database check rejection as failed, not result unknown', async () => {
    const remove = jest.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase.storage.from as jest.Mock).mockReturnValue({ remove });
    mockProofRpc.mockResolvedValue({
      data: null,
      error: {
        code: '23514',
        message: 'Proof media path is not account-bound',
      },
    });

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'file:///documents/proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: 'abababab-abab-4bab-8bab-abababababab',
        localMediaUri: 'file:///documents/proof.jpg',
      })
    ).rejects.toMatchObject({ receiptStatus: 'failed', code: '23514' });

    const draft = await getProofDraft('abababab-abab-4bab-8bab-abababababab');
    expect(draft).toMatchObject({
      status: 'failed',
      localMediaUri: 'file:///documents/proof.jpg',
      proofValue: 'file:///documents/proof.jpg',
      remoteMediaUrl: null,
    });
    expect(remove).toHaveBeenCalled();
  });

  it('does not upload media for a stale or foreign promise route', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'deleted-challenge',
        proofValue: 'file:///documents/stale-proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: 'acacacac-acac-4cac-8cac-acacacacacac',
        localMediaUri: 'file:///documents/stale-proof.jpg',
      })
    ).rejects.toMatchObject({
      receiptStatus: 'failed',
      code: 'NOT_JOINED',
    });

    expect(mockUploadDurableProofMedia).not.toHaveBeenCalled();
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });

  it('records a reconciled sent proof even when no new submit RPC is needed', async () => {
    const clientEventId = '71717171-7171-4171-8171-717171717171';
    const submissionId = '72727272-7272-4272-8272-727272727272';
    await createProofDraft({
      userId: 'user-1',
      challengeId: 'challenge-1',
      clientEventId,
      proofType: 'text',
      proofValue: 'Finished my practice session.',
      clientTimeZone: 'Pacific/Auckland',
    });
    await updateProofDraft(clientEventId, {
      status: 'sent',
      submissionId,
      serverStatus: 'sent',
      allowSelfReview: true,
      sendRequestedAt: new Date().toISOString(),
    });
    installReceiptReadback([
      committedReceipt({
        id: submissionId,
        client_event_id: clientEventId,
        media_type: 'text',
        media_url: null,
        submission_text: 'Finished my practice session.',
        status: 'approved',
      }),
    ]);
    const result = await resumeProofSubmission(clientEventId);
    expect(result.receiptStatus).toBe('accepted');
    expect(mockProofRpc).not.toHaveBeenCalled();
    expect(trackProductEvent).toHaveBeenCalledWith('Proof Submitted', {
      proof_type: 'text',
      receipt_status: 'accepted',
      review_mode: 'self',
      day_status: 'unknown',
      is_correction: 'unknown',
      streak_length_bucket: 'unknown',
    });
  });

  describe('confirmed receipt analytics', () => {
    const clientEventId = '81818181-8181-4181-8181-818181818181';
    const submissionId = '82828282-8282-4282-8282-828282828282';
    const input = {
      userId: 'user-1',
      challengeId: 'challenge-1',
      clientEventId,
      proofType: 'text' as const,
      proofValue: 'Private proof text must not enter analytics.',
      clientTimeZone: 'Pacific/Auckland',
    };
    const flushAnalytics = () => new Promise(resolve => setTimeout(resolve, 0));
    const events = () =>
      (trackProductEvent as jest.Mock).mock.calls.filter(
        ([event]) => event === 'Proof Submitted'
      );

    beforeEach(() => {
      installReceiptReadback([
        committedReceipt({
          id: '82828282-8282-4282-8282-828282828282',
          client_event_id: '81818181-8181-4181-8181-818181818181',
          media_type: 'text',
          media_url: null,
          submission_text: 'Private proof text must not enter analytics.',
        }),
      ]);
      mockProofRpc.mockResolvedValue({
        error: null,
        data: buildSuccessfulRpcPayload({
          submissionId,
          clientEventId,
          mediaType: 'text',
          submissionText: input.proofValue,
        }),
      });
    });

    it('deduplicates a confirmed receipt after the service is reloaded', async () => {
      await submitChallengeProof(input);
      await flushAnalytics();
      await jest.isolateModulesAsync(async () => {
        const reloaded =
          await import('@/lib/services/proof-submission-service');
        await reloaded.submitChallengeProof(input);
      });
      await flushAnalytics();
      expect(events()).toHaveLength(1);
    });

    it('deduplicates concurrent confirmation of the same receipt', async () => {
      await Promise.all([
        submitChallengeProof(input),
        submitChallengeProof(input),
      ]);
      await flushAnalytics();
      expect(events()).toHaveLength(1);
    });

    it('counts a new correction receipt separately from retries of the original', async () => {
      await submitChallengeProof(input);
      await flushAnalytics();
      installReceiptReadback([
        committedReceipt({
          id: '84848484-8484-4484-8484-848484848484',
          client_event_id: '83838383-8383-4383-8383-838383838383',
          media_type: 'text',
          media_url: null,
          submission_text: 'Private proof text must not enter analytics.',
        }),
      ]);
      const correctionInput = {
        ...input,
        clientEventId: '83838383-8383-4383-8383-838383838383',
      };
      mockProofRpc.mockResolvedValue({
        error: null,
        data: buildSuccessfulRpcPayload({
          submissionId: '84848484-8484-4484-8484-848484848484',
          clientEventId: correctionInput.clientEventId,
          mediaType: 'text',
          submissionText: input.proofValue,
          replacesSubmissionId: submissionId,
        }),
      });
      await submitChallengeProof(correctionInput);
      await flushAnalytics();
      await submitChallengeProof(correctionInput);
      await flushAnalytics();
      expect(events()).toHaveLength(2);
      expect(events()[1][1].is_correction).toBe(true);
    });

    it('records only bounded receipt metadata, without proof content or identifiers', async () => {
      await submitChallengeProof(input);
      await flushAnalytics();
      expect(events()).toEqual([
        [
          'Proof Submitted',
          {
            day_status: 'pending_review',
            is_correction: false,
            proof_type: 'text',
            receipt_status: 'pending_review',
            review_mode: 'peer',
            streak_length_bucket: '1_2',
          },
        ],
      ]);
    });

    it('keeps the receipt successful when analytics storage cannot be read', async () => {
      const original = (
        AsyncStorage.getItem as jest.Mock
      ).getMockImplementation()!;
      const spy = jest
        .spyOn(AsyncStorage, 'getItem')
        .mockImplementation(key =>
          key.startsWith('menta.analytics.')
            ? Promise.reject(new Error('Storage unavailable'))
            : original(key)
        );
      try {
        expect((await submitChallengeProof(input)).receiptStatus).toBe(
          'pending-review'
        );
        await flushAnalytics();
        expect(events()).toHaveLength(0);
      } finally {
        spy.mockImplementation(original);
      }
    });

    it('does not backfill marker-less legacy terminal receipts', async () => {
      await createProofDraft(input);
      await updateProofDraft(clientEventId, {
        status: 'accepted',
        submissionId,
        serverStatus: 'approved',
        allowSelfReview: true,
      });
      expect((await resumeProofSubmission(clientEventId)).receiptStatus).toBe(
        'accepted'
      );
      await flushAnalytics();
      expect(events()).toHaveLength(0);
      expect(mockProofRpc).not.toHaveBeenCalled();
    });

    it('recovers analytics on terminal resume after a transient storage read failure', async () => {
      const original = (
        AsyncStorage.getItem as jest.Mock
      ).getMockImplementation()!;
      const spy = jest
        .spyOn(AsyncStorage, 'getItem')
        .mockImplementation(key =>
          key.startsWith('menta.analytics.')
            ? Promise.reject(new Error('Storage unavailable'))
            : original(key)
        );
      try {
        await submitChallengeProof(input);
        await flushAnalytics();
        expect(events()).toHaveLength(0);
      } finally {
        spy.mockImplementation(original);
      }
      mockProofRpc.mockClear();
      expect((await resumeProofSubmission(clientEventId)).receiptStatus).toBe(
        'pending-review'
      );
      await flushAnalytics();
      expect(events()).toHaveLength(1);
      expect(mockProofRpc).not.toHaveBeenCalled();
      await resumeProofSubmission(clientEventId);
      await flushAnalytics();
      expect(events()).toHaveLength(1);
    });

    it('does not make a saved receipt wait for analytics storage', async () => {
      const original = (
        AsyncStorage.getItem as jest.Mock
      ).getMockImplementation()!;
      let release!: (value: null) => void;
      const pending = new Promise<null>(resolve => {
        release = resolve;
      });
      const spy = jest
        .spyOn(AsyncStorage, 'getItem')
        .mockImplementation(key =>
          key.startsWith('menta.analytics.') ? pending : original(key)
        );
      try {
        expect((await submitChallengeProof(input)).receiptStatus).toBe(
          'pending-review'
        );
        expect(events()).toHaveLength(0);
        release(null);
        await flushAnalytics();
        expect(events()).toHaveLength(1);
      } finally {
        release(null);
        spy.mockImplementation(original);
      }
    });

    it('does not attribute a recovered receipt to a different signed-in account', async () => {
      await createProofDraft(input);
      await updateProofDraft(clientEventId, {
        status: 'sent',
        submissionId,
        serverStatus: 'sent',
        allowSelfReview: true,
      });
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
      installReceiptReadback([
        committedReceipt({
          id: submissionId,
          client_event_id: clientEventId,
          media_type: 'text',
          media_url: null,
          submission_text: 'Private proof text must not enter analytics.',
          status: 'approved',
        }),
      ]);
      expect((await resumeProofSubmission(clientEventId)).receiptStatus).toBe(
        'accepted'
      );
      await flushAnalytics();
      expect(events()).toHaveLength(0);
    });

    it('does not dispatch twice in one process when the durable marker write fails', async () => {
      const original = (
        AsyncStorage.setItem as jest.Mock
      ).getMockImplementation()!;
      const spy = jest
        .spyOn(AsyncStorage, 'setItem')
        .mockImplementation((key, value) =>
          key.startsWith('menta.analytics.')
            ? Promise.reject(new Error('Storage unavailable'))
            : original(key, value)
        );
      try {
        expect((await submitChallengeProof(input)).receiptStatus).toBe(
          'pending-review'
        );
        await flushAnalytics();
        await submitChallengeProof(input);
        await flushAnalytics();
        expect(events()).toHaveLength(1);
      } finally {
        spy.mockImplementation(original);
      }
    });
  });

  it('reuses the same client event id across resume retries', async () => {
    installReceiptReadback([
      committedReceipt({
        id: '66666666-6666-4666-8666-666666666666',
        client_event_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      }),
    ]);
    mockProofRpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'timed out' },
      })
      .mockResolvedValueOnce({
        data: buildSuccessfulRpcPayload({
          submissionId: '66666666-6666-4666-8666-666666666666',
          clientEventId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          newStreak: 2,
          longestStreak: 2,
        }),
        error: null,
      });

    await expect(
      submitChallengeProof({
        userId: 'user-1',
        challengeId: 'challenge-1',
        proofValue: 'user-1/proof.jpg',
        proofType: 'photo',
        clientTimeZone: 'Pacific/Auckland',
        clientEventId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      })
    ).rejects.toMatchObject({ receiptStatus: 'unknown-result' });

    const resumed = await resumeProofSubmission(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    );

    expect(resumed.receiptStatus).toBe('pending-review');
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      1,
      'submit_challenge_verification',
      expect.objectContaining({
        p_client_event_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      })
    );
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      2,
      'submit_challenge_verification',
      expect.objectContaining({
        p_client_event_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      })
    );
  });
});
