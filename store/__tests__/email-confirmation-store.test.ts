import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EMAIL_CONFIRMATION_RESEND_COOLDOWN_MS,
  EMAIL_CONFIRMATION_STORAGE_KEY,
} from '@/lib/auth/email-confirmation-config';
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
} from '@/lib/onboarding-draft';
import {
  isEmailConfirmationForSession,
  useEmailConfirmationStore,
} from '@/store/email-confirmation-store';

describe('email confirmation store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useEmailConfirmationStore.setState({
      pending: null,
      hasHydrated: false,
    });
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores the exact pending address after an app process restart', async () => {
    const requestedAt = Date.now() - 1000;
    const staged = await useEmailConfirmationStore.getState().stage({
      email: '  Alex@Example.com ',
      username: ' alexm ',
      expectedUserId: 'pending-user',
      fromOnboarding: true,
      now: requestedAt,
    });

    expect(staged).toEqual({
      version: 1,
      email: 'alex@example.com',
      username: 'alexm',
      expectedUserId: 'pending-user',
      fromOnboarding: true,
      requestedAt,
      resendAvailableAt: requestedAt + EMAIL_CONFIRMATION_RESEND_COOLDOWN_MS,
    });

    useEmailConfirmationStore.setState({
      pending: null,
      hasHydrated: false,
    });

    await expect(
      useEmailConfirmationStore.getState().hydrate()
    ).resolves.toEqual(staged);
    expect(useEmailConfirmationStore.getState().pending).toEqual(staged);
  });

  it('finishes hydration safely when the auxiliary storage read fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage unavailable')
    );

    await expect(
      useEmailConfirmationStore.getState().hydrate()
    ).rejects.toThrow('storage unavailable');
    expect(useEmailConfirmationStore.getState()).toMatchObject({
      pending: null,
      hasHydrated: true,
    });
  });

  it('does not rewrite the onboarding consent, referral, or invite handoffs', async () => {
    const legalConsentAt = new Date().toISOString();
    const legalConsentVersions = {
      terms: 'terms-2026-08-31',
      privacy: 'privacy-2026-08-31',
      communityStandards: 'community-2026-08-31',
    };
    await saveOnboardingDraft(
      {
        promise: 'Walk with Alex after work',
        proofType: 'photo',
        durationDays: 14,
        accountabilityChoice: 'new_group',
        legalConsentAt,
        legalConsentVersions,
        referralCode: 'ABCDEF1234567890',
        marketingOptIn: false,
      },
      null,
      'auth_method'
    );
    await AsyncStorage.multiSet([
      ['invite-storage', 'promise-or-group-invite-sentinel'],
      ['protected-route-storage', 'event-invite-sentinel'],
      ['referral-storage', 'referral-handoff-sentinel'],
    ]);

    await useEmailConfirmationStore.getState().stage({
      email: 'alex@example.com',
      username: 'alexm',
      expectedUserId: 'pending-user',
      fromOnboarding: true,
    });
    await useEmailConfirmationStore.getState().markResent('alex@example.com');

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      promise: 'Walk with Alex after work',
      proofType: 'photo',
      durationDays: 14,
      accountabilityChoice: 'new_group',
      legalConsentAt,
      legalConsentVersions,
      referralCode: 'ABCDEF1234567890',
      resumeStep: 'auth_method',
    });
    await expect(
      AsyncStorage.multiGet([
        'invite-storage',
        'protected-route-storage',
        'referral-storage',
      ])
    ).resolves.toEqual([
      ['invite-storage', 'promise-or-group-invite-sentinel'],
      ['protected-route-storage', 'event-invite-sentinel'],
      ['referral-storage', 'referral-handoff-sentinel'],
    ]);
  });

  it('clears only the matching email and leaves a different account pending', async () => {
    await useEmailConfirmationStore.getState().stage({
      email: 'alex@example.com',
      username: 'alexm',
      expectedUserId: 'pending-user',
      fromOnboarding: true,
    });

    await expect(
      useEmailConfirmationStore.getState().clearForEmail('other@example.com')
    ).resolves.toBe(false);
    expect(useEmailConfirmationStore.getState().pending?.email).toBe(
      'alex@example.com'
    );
    expect(
      await AsyncStorage.getItem(EMAIL_CONFIRMATION_STORAGE_KEY)
    ).not.toBeNull();

    await expect(
      useEmailConfirmationStore.getState().clearForEmail('ALEX@EXAMPLE.COM')
    ).resolves.toBe(true);
    expect(useEmailConfirmationStore.getState().pending).toBeNull();
  });

  it('matches a callback to both the staged user and email', async () => {
    const pending = await useEmailConfirmationStore.getState().stage({
      email: 'alex@example.com',
      username: 'alexm',
      expectedUserId: 'pending-user',
      fromOnboarding: true,
    });

    expect(
      isEmailConfirmationForSession(pending, {
        id: 'pending-user',
        email: 'ALEX@EXAMPLE.COM',
      })
    ).toBe(true);
    expect(
      isEmailConfirmationForSession(pending, {
        id: 'other-user',
        email: 'alex@example.com',
      })
    ).toBe(false);
    expect(
      isEmailConfirmationForSession(pending, {
        id: 'pending-user',
        email: 'other@example.com',
      })
    ).toBe(false);
  });
});
