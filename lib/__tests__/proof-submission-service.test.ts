import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createProofDraft,
  getProofDraft,
  updateProofDraft,
} from '@/lib/proof-drafts';
import { getQueuedProofUpload } from '@/lib/proof-upload-queue';
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

const installMatchingReceiptReadback = () => {
  (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
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

        const rpcMock = mockProofRpc;
        const callIndex = rpcMock.mock.calls.length - 1;
        const rpcArgs = rpcMock.mock.calls[callIndex]?.[1] ?? {};
        const rpcResponse = await rpcMock.mock.results[callIndex]?.value;
        const payload = rpcResponse?.data ?? {};

        return {
          data:
            typeof payload.submissionId === 'string' &&
            typeof payload.status === 'string'
              ? {
                  id: payload.submissionId,
                  challenge_id: rpcArgs.p_challenge_id,
                  client_event_id: rpcArgs.p_client_event_id,
                  media_type: rpcArgs.p_media_type,
                  media_url: rpcArgs.p_media_url,
                  submission_text: rpcArgs.p_submission_text,
                  status: payload.status,
                }
              : null,
          error: null,
        };
      }),
    };
    return query;
  });
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
    installMatchingReceiptReadback();
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
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data:
          table === 'challenge_participants'
            ? { challenge_id: 'challenge-1', status: 'active' }
            : null,
        error: null,
      }),
    }));

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
    expect(
      await getQueuedProofUpload('13131313-1313-4313-8313-131313131313')
    ).not.toBeNull();
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

  it('reuses the same client event id across resume retries', async () => {
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
