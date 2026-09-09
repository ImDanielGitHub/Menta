import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildPromiseCreationDraft,
  clearPromiseCreationDraft,
  decodePromiseCreationDraft,
  getOwnedPromiseCreationDraft,
  getPromiseCreationDraftKey,
  loadPromiseCreationDraft,
  savePromiseCreationDraft,
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

describe('promise creation draft contract', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

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
