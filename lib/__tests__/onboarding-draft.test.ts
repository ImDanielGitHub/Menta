import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearOnboardingDraft,
  clearOwnedOnboardingDraft,
  getOnboardingDraftKeyForUser,
  hasFreshOnboardingLegalConsent,
  loadOnboardingDraft,
  loadOnboardingDraftForUser,
  ONBOARDING_DRAFT_KEY,
  saveOnboardingDraft,
} from '@/lib/onboarding-draft';

const LEGACY_V1_KEY = 'menta.onboarding.promise-draft.v1';
const LEGACY_V2_KEY = 'menta.onboarding.promise-draft.v2';

describe('onboarding draft', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists an anonymous promise without claiming it was sent', async () => {
    const draft = await saveOnboardingDraft({
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo',
      durationDays: 30,
      accountabilityChoice: 'new_group',
    });

    expect(draft).toMatchObject({
      version: 3,
      proofType: 'photo',
      durationDays: 30,
      accountabilityChoice: 'new_group',
      ownerUserId: null,
      resumeStep: null,
    });
    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'Walk for 20 minutes after work',
      proofType: 'photo',
      durationDays: 30,
      accountabilityChoice: 'new_group',
    });
    expect(await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY)).not.toBeNull();
    expect(await AsyncStorage.getItem(LEGACY_V2_KEY)).toBeNull();
  });

  it('keeps combined legal consent and an optional referral through auth handoff', async () => {
    const legalConsentAt = '2026-08-31T03:00:00.000Z';
    await saveOnboardingDraft(
      {
        promise: 'Walk for 20 minutes after work',
        proofType: 'photo',
        legalConsentAt,
        referralCode: 'aabbccddeeff00112233445566778899',
      },
      null,
      'auth_method'
    );

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      legalConsentAt,
      referralCode: 'AABBCCDDEEFF00112233445566778899',
      resumeStep: 'auth_method',
    });
    expect(
      hasFreshOnboardingLegalConsent(
        legalConsentAt,
        Date.parse('2026-08-31T03:20:00.000Z')
      )
    ).toBe(true);
    expect(
      hasFreshOnboardingLegalConsent(
        legalConsentAt,
        Date.parse('2026-08-31T03:31:00.000Z')
      )
    ).toBe(false);
  });

  it('defaults older v3 drafts to private accountability and persists the migration', async () => {
    await AsyncStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({
        version: 3,
        promise: 'Keep the existing promise',
        proofType: 'note',
        durationDays: 14,
        marketingOptIn: false,
        updatedAt: '2026-08-25T08:00:00.000Z',
        ownerUserId: null,
        resumeStep: 'preview',
      })
    );

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      accountabilityChoice: 'just_me',
    });
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY)) ?? '')
    ).toMatchObject({ accountabilityChoice: 'just_me' });
  });

  it('persists each proof method exposed by the Paper onboarding flow', async () => {
    for (const proofType of ['photo', 'video', 'note'] as const) {
      await saveOnboardingDraft({
        promise: `Use ${proofType} proof`,
        proofType,
      });

      await expect(loadOnboardingDraft()).resolves.toMatchObject({
        proofType,
      });
    }
  });

  it.each([7, 14, 30] as const)(
    'persists the selected %i-day promise length',
    async durationDays => {
      await saveOnboardingDraft({
        promise: `Keep this promise for ${durationDays} days`,
        proofType: 'note',
        durationDays,
      });

      await expect(loadOnboardingDraft()).resolves.toMatchObject({
        durationDays,
      });
    }
  );

  it('migrates a v2 draft to the 14-day default without losing its resume point', async () => {
    await AsyncStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({
        version: 2,
        promise: 'Legacy current-key promise',
        proofType: 'photo',
        marketingOptIn: false,
        updatedAt: '2026-08-12T09:00:00.000Z',
        ownerUserId: null,
        resumeStep: 'preview',
      })
    );

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      version: 3,
      durationDays: 14,
      resumeStep: 'preview',
    });
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY)) ?? '')
    ).toMatchObject({ version: 3, durationDays: 14 });
  });

  it('rejects malformed durable state and can clear the anonymous draft', async () => {
    await AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, '{"version":2}');
    await expect(loadOnboardingDraft()).resolves.toBeNull();

    await saveOnboardingDraft({ promise: 'Read ten pages', proofType: null });
    await clearOnboardingDraft();
    await expect(loadOnboardingDraft()).resolves.toBeNull();
  });

  it('claims an anonymous draft for only the intended authenticated account', async () => {
    await saveOnboardingDraft({
      promise: 'Finish the report',
      proofType: 'note',
    });

    await expect(
      loadOnboardingDraftForUser({
        userId: 'new-user',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({ ownerUserId: 'new-user' });

    await expect(loadOnboardingDraft()).resolves.toBeNull();
    await expect(
      loadOnboardingDraftForUser({
        userId: 'other-user',
        hasCompletedOnboarding: false,
      })
    ).resolves.toBeNull();
  });

  it('consumes an auth handoff exactly once when the new account claims the draft', async () => {
    await saveOnboardingDraft(
      { promise: 'Finish the report', proofType: 'note' },
      null,
      'auth_method'
    );
    await expect(
      loadOnboardingDraftForUser({
        userId: 'new-user',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({
      ownerUserId: 'new-user',
      resumeStep: 'auth_method',
    });
    const firstClaimedValue = await AsyncStorage.getItem(
      getOnboardingDraftKeyForUser('new-user')
    );
    await expect(
      loadOnboardingDraftForUser({
        userId: 'new-user',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({
      ownerUserId: 'new-user',
      resumeStep: 'auth_method',
    });

    expect(
      await AsyncStorage.getItem(getOnboardingDraftKeyForUser('new-user'))
    ).toBe(firstClaimedValue);
    await expect(loadOnboardingDraft()).resolves.toBeNull();
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY)) ?? '')
    ).toMatchObject({ ownerUserId: 'new-user' });
  });

  it('keeps a delayed anonymous write with the account that claimed it', async () => {
    await saveOnboardingDraft({
      promise: 'Account A anonymous promise',
      proofType: 'video',
    });
    await loadOnboardingDraftForUser({
      userId: 'account-a',
      hasCompletedOnboarding: false,
    });
    await saveOnboardingDraft(
      { promise: 'Account B promise', proofType: 'photo' },
      'account-b'
    );

    await saveOnboardingDraft({
      promise: 'Late account A write',
      proofType: 'note',
    });

    await expect(
      loadOnboardingDraftForUser({
        userId: 'account-b',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({
      promise: 'Account B promise',
      ownerUserId: 'account-b',
    });
    await expect(
      loadOnboardingDraftForUser({
        userId: 'account-a',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({
      promise: 'Late account A write',
      ownerUserId: 'account-a',
    });
    await expect(loadOnboardingDraft()).resolves.toBeNull();
  });

  it('does not let an anonymous clear remove an owner-marked claim guard', async () => {
    await saveOnboardingDraft({
      promise: 'Claimed promise',
      proofType: 'photo',
    });
    await loadOnboardingDraftForUser({
      userId: 'account-a',
      hasCompletedOnboarding: false,
    });

    await clearOnboardingDraft();

    await expect(
      loadOnboardingDraftForUser({
        userId: 'account-a',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({ promise: 'Claimed promise' });
    expect(await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY)).not.toBeNull();
  });

  it('does not treat an empty expected owner as permission to clear anonymous data', async () => {
    await saveOnboardingDraft({
      promise: 'Anonymous promise',
      proofType: 'note',
    });

    await clearOwnedOnboardingDraft('');
    await clearOnboardingDraft('');

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'Anonymous promise',
    });
  });

  it('clears only the expected owner and leaves other account and anonymous drafts', async () => {
    await saveOnboardingDraft(
      { promise: 'Account A promise', proofType: 'video' },
      'account-a'
    );
    await saveOnboardingDraft(
      { promise: 'Account B promise', proofType: 'photo' },
      'account-b'
    );
    await saveOnboardingDraft({
      promise: 'Anonymous promise',
      proofType: 'note',
    });

    await clearOwnedOnboardingDraft('account-a');

    expect(
      await AsyncStorage.getItem(getOnboardingDraftKeyForUser('account-a'))
    ).toBeNull();
    expect(
      await AsyncStorage.getItem(getOnboardingDraftKeyForUser('account-b'))
    ).not.toBeNull();
    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'Anonymous promise',
    });

    await clearOnboardingDraft();
    expect(
      await AsyncStorage.getItem(getOnboardingDraftKeyForUser('account-b'))
    ).not.toBeNull();
  });

  it('does not let a completed account clear another owner or anonymous handoff', async () => {
    await saveOnboardingDraft(
      { promise: 'Account A promise', proofType: 'video' },
      'account-a'
    );
    await saveOnboardingDraft(
      { promise: 'Account B promise', proofType: 'photo' },
      'account-b'
    );
    await saveOnboardingDraft({
      promise: 'Anonymous promise',
      proofType: 'note',
    });

    await expect(
      loadOnboardingDraftForUser({
        userId: 'account-a',
        hasCompletedOnboarding: true,
      })
    ).resolves.toBeNull();

    expect(
      await AsyncStorage.getItem(getOnboardingDraftKeyForUser('account-a'))
    ).toBeNull();
    expect(
      await AsyncStorage.getItem(getOnboardingDraftKeyForUser('account-b'))
    ).not.toBeNull();
    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'Anonymous promise',
    });
  });

  it('lets a newly authored anonymous draft coexist with prior account ownership', async () => {
    await saveOnboardingDraft(
      { promise: 'Previous account draft', proofType: 'video' },
      'previous-user'
    );

    await saveOnboardingDraft(
      { promise: 'New anonymous draft', proofType: 'photo' },
      null
    );

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'New anonymous draft',
      ownerUserId: null,
    });
    expect(
      await AsyncStorage.getItem(getOnboardingDraftKeyForUser('previous-user'))
    ).not.toBeNull();
  });

  it('preserves the auth-method resume point across a native handoff', async () => {
    await saveOnboardingDraft(
      { promise: 'Resume after Google', proofType: 'photo' },
      null,
      'auth_method'
    );

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'Resume after Google',
      ownerUserId: null,
      resumeStep: 'auth_method',
    });

    await saveOnboardingDraft({
      promise: 'Resume after Google with an edit',
      proofType: 'photo',
    });
    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      resumeStep: 'auth_method',
    });
  });

  it.each(['provider', 'email'] as const)(
    'keeps the %s handoff durable through legal accepted and declined returns',
    async handoff => {
      await saveOnboardingDraft(
        {
          promise: `Resume after ${handoff}`,
          proofType: 'photo',
          durationDays: 30,
          marketingOptIn: true,
        },
        null,
        'auth_method'
      );
      const claimed = await loadOnboardingDraftForUser({
        userId: `${handoff}-user`,
        hasCompletedOnboarding: false,
      });
      expect(claimed).toMatchObject({
        durationDays: 30,
        marketingOptIn: true,
        resumeStep: 'auth_method',
      });

      await saveOnboardingDraft(
        claimed!,
        `${handoff}-user`,
        'legal_acceptance'
      );
      await expect(
        loadOnboardingDraftForUser({
          userId: `${handoff}-user`,
          hasCompletedOnboarding: false,
        })
      ).resolves.toMatchObject({ resumeStep: 'legal_acceptance' });

      // A declined return keeps the marker. A server-current accepted return
      // consumes it explicitly only after the caller confirms the receipt.
      const declined = await loadOnboardingDraftForUser({
        userId: `${handoff}-user`,
        hasCompletedOnboarding: false,
      });
      expect(declined?.resumeStep).toBe('legal_acceptance');
      await saveOnboardingDraft(declined!, `${handoff}-user`, null);
      await expect(
        loadOnboardingDraftForUser({
          userId: `${handoff}-user`,
          hasCompletedOnboarding: false,
        })
      ).resolves.toMatchObject({ resumeStep: null });
    }
  );

  it('persists cancellation and legal-acceptance resume markers', async () => {
    await saveOnboardingDraft(
      { promise: 'Still safe locally', proofType: 'note' },
      null,
      'auth_cancelled'
    );

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      resumeStep: 'auth_cancelled',
    });

    await saveOnboardingDraft(
      { promise: 'Return after the terms', proofType: 'photo' },
      null,
      'legal_acceptance'
    );
    await expect(
      loadOnboardingDraftForUser({
        userId: 'new-user',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({
      ownerUserId: 'new-user',
      resumeStep: 'legal_acceptance',
    });
  });

  it('migrates legacy anonymous and account-owned drafts once without loss', async () => {
    await AsyncStorage.setItem(
      LEGACY_V1_KEY,
      JSON.stringify({
        version: 1,
        promise: 'Legacy anonymous promise',
        proofType: 'note',
        updatedAt: '2026-08-12T08:00:00.000Z',
        resumeStep: null,
      })
    );
    await AsyncStorage.setItem(
      LEGACY_V2_KEY,
      JSON.stringify({
        version: 2,
        promise: 'Legacy account promise',
        proofType: 'video',
        updatedAt: '2026-08-12T09:00:00.000Z',
        ownerUserId: 'legacy-user',
        resumeStep: 'legal_acceptance',
      })
    );

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'Legacy anonymous promise',
      ownerUserId: null,
    });
    await expect(
      loadOnboardingDraftForUser({
        userId: 'legacy-user',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({
      promise: 'Legacy account promise',
      ownerUserId: 'legacy-user',
      resumeStep: 'legal_acceptance',
    });

    expect(await AsyncStorage.getItem(LEGACY_V1_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(LEGACY_V2_KEY)).toBeNull();
  });

  it('does not replace a newer scoped draft while migrating an older v2 value', async () => {
    await saveOnboardingDraft(
      { promise: 'New scoped promise', proofType: 'photo' },
      'same-user',
      'preview'
    );
    await AsyncStorage.setItem(
      LEGACY_V2_KEY,
      JSON.stringify({
        version: 2,
        promise: 'Old shared-key promise',
        proofType: 'note',
        updatedAt: '2020-01-01T00:00:00.000Z',
        ownerUserId: 'same-user',
        resumeStep: 'preview',
      })
    );

    await expect(
      loadOnboardingDraftForUser({
        userId: 'same-user',
        hasCompletedOnboarding: false,
      })
    ).resolves.toMatchObject({ promise: 'New scoped promise' });
    expect(await AsyncStorage.getItem(LEGACY_V2_KEY)).toBeNull();
  });
});
