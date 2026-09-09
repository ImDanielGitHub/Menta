import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  REPORT_DRAFTS_STORAGE_KEY,
  beginReportSubmission,
  clearReportDraftsForUser,
  createReportDraft,
  getLatestOpenReportDraft,
  getOpenReportDraftByIdForUser,
  getReportDraftCopy,
  isDefinitiveReportRejection,
  isResponseUnknownError,
  listOpenReportDraftsForUser,
  loadReportDrafts,
  updateReportDraft,
} from '@/lib/report-drafts';

describe('report drafts', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  const createDraft = (userId = 'user-1') =>
    createReportDraft({
      userId,
      contextKey: 'support:general',
      source: 'support',
      reportKind: null,
      challengeId: null,
      groupId: null,
      submissionId: null,
      contextLabel: null,
      crashReference: null,
      attachments: [
        {
          name: 'proof-stopped.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1200,
          localUri: 'file:///proof-stopped.jpg',
        },
      ],
      title: 'Proof stalled',
      description: 'The receipt did not appear.',
    });

  it('keeps a draft and its attachment metadata locally', async () => {
    const draft = await createDraft();

    expect(draft.status).toBe('draft');
    expect(draft.serverReceiptId).toBeNull();
    expect(draft.attachments[0].localUri).toBe('file:///proof-stopped.jpg');
    expect(await AsyncStorage.getItem(REPORT_DRAFTS_STORAGE_KEY)).toContain(
      draft.id
    );
  });

  it('isolates open drafts by account and context', async () => {
    const first = await createDraft('user-1');
    await createDraft('user-2');
    await updateReportDraft('user-1', first.id, {
      contextKey: 'support:challenge:one',
    });

    expect(await listOpenReportDraftsForUser('user-1')).toHaveLength(1);
    expect(await listOpenReportDraftsForUser('user-2')).toHaveLength(1);
    await expect(
      getLatestOpenReportDraft('user-2', 'support:challenge:one')
    ).resolves.toBeNull();
  });

  it('reopens only the exact open draft owned by the active account', async () => {
    const first = await createDraft('user-1');
    const second = await createDraft('user-1');
    await createDraft('user-2');

    await expect(
      getOpenReportDraftByIdForUser('user-1', second.id)
    ).resolves.toEqual(second);
    await expect(
      getOpenReportDraftByIdForUser('user-2', second.id)
    ).resolves.toBeNull();

    await updateReportDraft('user-1', first.id, {
      status: 'server-confirmed',
    });
    await expect(
      getOpenReportDraftByIdForUser('user-1', first.id)
    ).resolves.toBeNull();
  });

  it("removes only the confirmed-deletion account's drafts", async () => {
    const deleted = await createDraft('user-1');
    const retained = await createDraft('user-2');

    await clearReportDraftsForUser('user-1');

    await expect(listOpenReportDraftsForUser('user-1')).resolves.toEqual([]);
    await expect(listOpenReportDraftsForUser('user-2')).resolves.toEqual([
      retained,
    ]);
    await expect(
      getLatestOpenReportDraft('user-1', deleted.contextKey)
    ).resolves.toBeNull();
  });

  it('captures one immutable snapshot before the first send attempt', async () => {
    const draft = await createDraft();
    const submitting = await beginReportSubmission('user-1', draft.id);
    const firstSnapshot = submitting.submissionSnapshot;

    await updateReportDraft('user-1', draft.id, {
      title: 'Edited after send began',
    });
    const retrying = await beginReportSubmission('user-1', draft.id);

    expect(firstSnapshot?.title).toBe('Proof stalled');
    expect(retrying.submissionSnapshot).toEqual(firstSnapshot);
    expect(retrying.attemptCount).toBe(2);
  });

  it('keeps a content target in the immutable retry snapshot', async () => {
    const draft = await createReportDraft({
      userId: 'user-1',
      contextKey: 'proof:one',
      source: 'review_queue',
      reportKind: 'submission',
      challengeId: 'challenge-one',
      groupId: 'group-one',
      submissionId: 'proof-one',
      targetUserId: 'member-two',
      targetUserLabel: 'Aroha',
      contextLabel: 'Morning proof',
      crashReference: null,
      attachments: [],
      title: 'Report this proof',
      description: 'This proof breaks the SFW rule.',
    });

    const submitting = await beginReportSubmission('user-1', draft.id);

    expect(submitting.submissionSnapshot).toEqual(
      expect.objectContaining({
        reportKind: 'submission',
        submissionId: 'proof-one',
        targetUserId: 'member-two',
        targetUserLabel: 'Aroha',
      })
    );
  });

  it('does not update or submit a draft through another account scope', async () => {
    const draft = await createDraft('user-1');

    await expect(
      updateReportDraft('user-2', draft.id, { title: 'Cross-account edit' })
    ).rejects.toThrow('Report draft not found');
    await expect(beginReportSubmission('user-2', draft.id)).rejects.toThrow(
      'Report draft not found'
    );

    await expect(
      getOpenReportDraftByIdForUser('user-1', draft.id)
    ).resolves.toEqual(draft);
  });

  it('does not confuse non-send, uncertain response, and server confirmation', async () => {
    expect(getReportDraftCopy('not-sent').description).toContain(
      'Nothing was delivered'
    );
    expect(getReportDraftCopy('result-unknown').title).toBe(
      'Send result unknown'
    );
    expect(getReportDraftCopy('server-confirmed').description).toContain(
      'reached the server'
    );
    expect(isResponseUnknownError(new Error('Network request timed out'))).toBe(
      true
    );
    expect(isResponseUnknownError(new Error('permission denied'))).toBe(false);
    expect(isDefinitiveReportRejection({ code: '42501' })).toBe(true);
    expect(isDefinitiveReportRejection({ code: '23514' })).toBe(true);
    expect(isDefinitiveReportRejection({ code: 'XX000' })).toBe(false);
  });

  it('drops malformed persisted entries instead of leaking them into a report', async () => {
    await AsyncStorage.setItem(REPORT_DRAFTS_STORAGE_KEY, '[{"id":"bad"}]');
    await expect(loadReportDrafts()).resolves.toEqual([]);
  });
});
