import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildPromiseCreationDraft,
  clearPromiseCreationDraft,
  decodePromiseCreationDraft,
  getOwnedPromiseCreationDraft,
  getPromiseCreationDraftKey,
  loadPromiseCreationDraft,
  savePromiseCreationDraft,
  retainPromiseCreationReceipt,
  getPromiseCreationReceiptRecovery,
  saveFreshPromiseCreationDraft,
  cancelPromiseCreationAttempt,
} from '@/lib/promise-creation-draft';

const draft = {
  version: 1,
  ownerUserId: 'member-a',
  currentStep: 2,
  title: 'Morning walk',
  description: 'Walk outside for twenty minutes before work each day.',
  proofType: 'photo',
  proofDescription: 'Show the route, outside view, or finished walk.',
  submissionText: 'What route did you walk?',
  duration: 14,
  difficulty: 'medium',
  unknownCreateResultAt: null,
  todayReadbackRequestedAt: null,
  updatedAt: '2026-08-05T00:00:00.000Z',
} as const;

const storageImplementations = {
  getItem: (AsyncStorage.getItem as jest.Mock).getMockImplementation()!,
  setItem: (AsyncStorage.setItem as jest.Mock).getMockImplementation()!,
  removeItem: (AsyncStorage.removeItem as jest.Mock).getMockImplementation()!,
};
const restoreStorageImplementations = () => {
  for (const key of ['getItem', 'setItem', 'removeItem'] as const)
    (AsyncStorage[key] as jest.Mock).mockImplementation(
      storageImplementations[key]
    );
};

describe('promise creation draft contract', () => {
  beforeEach(async () => {
    restoreStorageImplementations();
    await Promise.all(['member-a', 'member-b'].map(clearPromiseCreationDraft));
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    restoreStorageImplementations();
  });

  it('retains an owned confirmed ID synchronously before failed receipt writes and reads', async () => {
    const receipt = {
      ...draft,
      pendingFriendChallengeId: '11111111-1111-4111-8111-111111111111',
    };
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValue(new Error('disk unavailable'));
    const saving = savePromiseCreationDraft(receipt);
    expect(
      getPromiseCreationReceiptRecovery('member-a')?.draft
        .pendingFriendChallengeId
    ).toBe(receipt.pendingFriendChallengeId);
    await expect(saving).rejects.toThrow('disk unavailable');
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValue(new Error('read unavailable'));
    await expect(loadPromiseCreationDraft('member-a')).resolves.toMatchObject({
      ...receipt,
      updatedAt: expect.any(String),
    });
    expect(getPromiseCreationReceiptRecovery('member-a')?.persistence).toBe(
      'failed'
    );
    expect(getPromiseCreationReceiptRecovery('member-b')).toBeNull();
    jest.restoreAllMocks();
    restoreStorageImplementations();
    await savePromiseCreationDraft({ ...draft, title: 'Stale autosave' });
    expect(
      JSON.parse(
        (await AsyncStorage.getItem(getPromiseCreationDraftKey('member-a')))!
      )
    ).toMatchObject({ ...receipt, updatedAt: expect.any(String) });
    expect(getPromiseCreationReceiptRecovery('member-a')?.persistence).toBe(
      'saved'
    );
  });

  it('preserves the durable attempt across a simulated process restart when receipt writes fail', async () => {
    const attempt = {
      ...draft,
      unknownCreateResultAt: '2026-10-01T12:00:00.000Z',
    };
    await savePromiseCreationDraft(attempt);
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValue(new Error('disk unavailable'));
    await expect(
      savePromiseCreationDraft({
        ...draft,
        pendingFriendChallengeId: '11111111-1111-4111-8111-111111111111',
      })
    ).rejects.toThrow();
    jest.restoreAllMocks();
    restoreStorageImplementations();
    let restarted!: typeof import('@/lib/promise-creation-draft');
    jest.isolateModules(() => {
      restarted = jest.requireActual('@/lib/promise-creation-draft');
    });
    expect(restarted.getPromiseCreationReceiptRecovery('member-a')).toBeNull();
    expect(await restarted.loadPromiseCreationDraft('member-a')).toMatchObject({
      unknownCreateResultAt: attempt.unknownCreateResultAt,
    });
    await restarted.savePromiseCreationDraft({
      ...draft,
      title: 'Unrelated template',
    });
    expect(await restarted.loadPromiseCreationDraft('member-a')).toMatchObject({
      title: draft.title,
      unknownCreateResultAt: attempt.unknownCreateResultAt,
    });
    await expect(
      restarted.saveFreshPromiseCreationDraft(draft)
    ).rejects.toThrow('Check the owned promise');
    await restarted.savePromiseCreationDraft({
      ...attempt,
      todayReadbackRequestedAt: '2026-10-01T12:05:00.000Z',
    });
    await restarted.saveFreshPromiseCreationDraft(draft);
    expect(await restarted.loadPromiseCreationDraft('member-a')).toMatchObject({
      unknownCreateResultAt: null,
    });
  });

  it.each([
    'broken JSON',
    JSON.stringify({ ...draft, ownerUserId: 'member-b' }),
  ])('fails closed on unreadable owned recovery data: %s', async raw => {
    await AsyncStorage.setItem(getPromiseCreationDraftKey('member-a'), raw);
    await expect(loadPromiseCreationDraft('member-a')).rejects.toThrow(
      'could not be read safely'
    );
    await expect(savePromiseCreationDraft(draft)).rejects.toThrow(
      'could not be read safely'
    );
    expect(
      await AsyncStorage.getItem(getPromiseCreationDraftKey('member-a'))
    ).toBe(raw);
  });

  it('does not erase confirmed memory when clearing storage fails or a fresh draft is requested', async () => {
    retainPromiseCreationReceipt({
      ...draft,
      pendingFriendChallengeId: '11111111-1111-4111-8111-111111111111',
    });
    jest
      .spyOn(AsyncStorage, 'removeItem')
      .mockRejectedValue(new Error('clear unavailable'));
    await expect(clearPromiseCreationDraft('member-a')).rejects.toThrow();
    expect(getPromiseCreationReceiptRecovery('member-a')).not.toBeNull();
    await expect(saveFreshPromiseCreationDraft(draft)).rejects.toThrow();
    jest.restoreAllMocks();
    restoreStorageImplementations();
    await clearPromiseCreationDraft('member-a');
    expect(getPromiseCreationReceiptRecovery('member-a')).toBeNull();
  });

  it('cancels only a proven rejected matching attempt and never a newer attempt or confirmed ID', async () => {
    const attemptedAt = '2026-10-01T12:00:00.000Z';
    await savePromiseCreationDraft({
      ...draft,
      unknownCreateResultAt: attemptedAt,
    });
    await cancelPromiseCreationAttempt(draft, '2026-10-01T11:00:00.000Z');
    expect(
      (await loadPromiseCreationDraft('member-a'))?.unknownCreateResultAt
    ).toBe(attemptedAt);
    await cancelPromiseCreationAttempt(draft, attemptedAt);
    expect(
      (await loadPromiseCreationDraft('member-a'))?.unknownCreateResultAt
    ).toBeNull();
    await savePromiseCreationDraft({
      ...draft,
      pendingFriendChallengeId: '11111111-1111-4111-8111-111111111111',
    });
    await cancelPromiseCreationAttempt(draft, attemptedAt);
    expect(
      (await loadPromiseCreationDraft('member-a'))?.pendingFriendChallengeId
    ).toBeTruthy();
  });

  it('round trips the reviewer, schedule and confirmed pending setup without mixing accounts', async () => {
    const extended = {
      ...draft,
      reviewer: { kind: 'friend' } as const,
      checkInPlan: { kind: 'custom', days: [1, 3, 5] } as const,
      templateId: 'morning_walk' as const,
      mentaBackup: false,
      mentaMomenta: false,
      stepId: 'review' as const,
      groupId: null,
      pendingFriendChallengeId: '11111111-1111-1111-1111-111111111111',
    };
    await savePromiseCreationDraft({
      ...extended,
      checkInPlan: { kind: 'custom', days: [1, 3, 5] },
    });
    expect(await loadPromiseCreationDraft('member-a')).toMatchObject({
      ...extended,
      updatedAt: expect.any(String),
    });
    expect(await loadPromiseCreationDraft('member-b')).toBeNull();
  });
  it.each([
    { reviewer: { kind: 'unknown' } },
    { checkInPlan: { kind: 'custom', days: [1, 1] } },
    { checkInPlan: { kind: 'custom', days: [8] } },
    { templateId: null },
    { pendingFriendChallengeId: 'not-a-receipt' },
    { mentaBackup: 'true' },
    { stepId: 'purchase' },
  ])('rejects malformed extended draft fields', extras => {
    expect(
      decodePromiseCreationDraft(JSON.stringify({ ...draft, ...extras }))
    ).toBeNull();
  });

  it.each(['receipt-first', 'autosave-first'] as const)(
    'keeps the confirmed receipt through concurrent %s writes',
    async order => {
      const pending = {
        ...draft,
        pendingFriendChallengeId: '11111111-1111-4111-8111-111111111111',
        reviewer: { kind: 'friend' } as const,
        stepId: 'review' as const,
      };
      const stale = {
        ...draft,
        title: 'Unrelated new template',
        pendingFriendChallengeId: null,
      };
      await Promise.all(
        order === 'receipt-first'
          ? [savePromiseCreationDraft(pending), savePromiseCreationDraft(stale)]
          : [savePromiseCreationDraft(stale), savePromiseCreationDraft(pending)]
      );
      const raw = await AsyncStorage.getItem(
        getPromiseCreationDraftKey('member-a')
      );
      expect(JSON.parse(raw!)).toMatchObject({
        title: draft.title,
        pendingFriendChallengeId: pending.pendingFriendChallengeId,
      });
      await savePromiseCreationDraft(stale);
      expect(
        await AsyncStorage.getItem(getPromiseCreationDraftKey('member-a'))
      ).toBe(raw);
      await clearPromiseCreationDraft('member-a');
      await savePromiseCreationDraft(stale);
      expect(await loadPromiseCreationDraft('member-a')).toMatchObject({
        title: stale.title,
        pendingFriendChallengeId: null,
      });
    }
  );

  it('uses a user-scoped key and refuses another account draft', () => {
    const raw = JSON.stringify(draft);

    expect(getPromiseCreationDraftKey('member-a')).not.toBe(
      getPromiseCreationDraftKey('member-b')
    );
    expect(
      getOwnedPromiseCreationDraft({ raw, userId: 'member-a' })
    ).toMatchObject({
      ownerUserId: 'member-a',
      title: 'Morning walk',
    });
    expect(
      getOwnedPromiseCreationDraft({ raw, userId: 'member-b' })
    ).toBeNull();
  });

  it('decodes only the bounded current draft version', () => {
    expect(decodePromiseCreationDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it.each([
    JSON.stringify({ ...draft, version: 2 }),
    JSON.stringify({ ...draft, proofType: 'none' }),
    JSON.stringify({ ...draft, duration: 31 }),
    JSON.stringify({ ...draft, title: 'x'.repeat(101) }),
    JSON.stringify({ ...draft, unknownCreateResultAt: 'not-a-date' }),
  ])('rejects stale or malformed drafts without leaking values', raw => {
    expect(decodePromiseCreationDraft(raw)).toBeNull();
  });

  it('retains unknown-result reconciliation until a deliberate fresh start', () => {
    const pending = buildPromiseCreationDraft({
      ...draft,
      unknownCreateResultAt: '2026-08-05T00:01:00.000Z',
      todayReadbackRequestedAt: '2026-08-05T00:02:00.000Z',
    });

    expect(pending.unknownCreateResultAt).toBe('2026-08-05T00:01:00.000Z');
    expect(pending.todayReadbackRequestedAt).toBe('2026-08-05T00:02:00.000Z');
  });

  it('restores and clears only the named account storage key', async () => {
    await savePromiseCreationDraft({
      ownerUserId: draft.ownerUserId,
      currentStep: draft.currentStep,
      title: draft.title,
      description: draft.description,
      proofType: draft.proofType,
      proofDescription: draft.proofDescription,
      submissionText: draft.submissionText,
      duration: draft.duration,
      difficulty: draft.difficulty,
      unknownCreateResultAt: draft.unknownCreateResultAt,
      todayReadbackRequestedAt: draft.todayReadbackRequestedAt,
    });

    expect(await loadPromiseCreationDraft('member-a')).toMatchObject({
      title: 'Morning walk',
      ownerUserId: 'member-a',
    });
    expect(await loadPromiseCreationDraft('member-b')).toBeNull();

    await clearPromiseCreationDraft('member-a');
    expect(await loadPromiseCreationDraft('member-a')).toBeNull();
  });
});
