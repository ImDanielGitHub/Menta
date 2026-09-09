import {
  getEmailAuthHandoffRows,
  getInviteSavedNotice,
  getLoginHandoffRows,
  getOnboardingFinishingRows,
  getReferralSavedNotice,
  getRegisterHandoffRows,
} from '@/lib/navigation/auth-handoff';

const groupInvite = { type: 'group' as const };
const challengeInvite = { type: 'challenge' as const };
const referral = { referralCode: 'REF2026' };

describe('auth-handoff navigation copy', () => {
  it('keeps saved invite notices surface-specific without changing meaning', () => {
    expect(getInviteSavedNotice('login', groupInvite)).toMatchObject({
      title: 'Invite saved',
      description: 'Sign in and Menta will open your saved group invite.',
      tone: 'success',
    });

    expect(getInviteSavedNotice('register', challengeInvite)).toMatchObject({
      description:
        'Create your account and Menta will open your saved promise invite.',
    });

    expect(getInviteSavedNotice('email-auth', groupInvite)).toMatchObject({
      description:
        'Complete sign-in and Menta will open your saved group invite.',
    });

    expect(
      getInviteSavedNotice('onboarding', challengeInvite, {
        onboardingAction: 'finish_setup',
      })
    ).toMatchObject({
      description:
        'Finish setup and Menta will open your saved promise invite.',
    });

    expect(getInviteSavedNotice('onboarding', null)).toBeNull();
  });

  it('keeps referral notices eligible-account aware across auth surfaces', () => {
    expect(
      getReferralSavedNotice({
        surface: 'login',
        pendingReferral: referral,
      })
    ).toMatchObject({
      title: 'Referral code saved',
      description:
        'If this is a new account, Menta will check the code after sign-in. Any available reward will appear in your account.',
    });

    expect(
      getReferralSavedNotice({
        surface: 'email-auth',
        mode: 'signup',
        pendingReferral: referral,
      })
    ).toMatchObject({
      description:
        'Create your account and Menta will check whether the code qualifies for a reward.',
    });

    expect(
      getReferralSavedNotice({
        surface: 'email-auth',
        mode: 'login',
        pendingReferral: referral,
      })
    ).toMatchObject({
      description:
        'If this is a new account, Menta will check the code after sign-in.',
    });

    expect(
      getReferralSavedNotice({
        surface: 'onboarding',
        pendingReferral: referral,
      })
    ).toMatchObject({
      description:
        'Create your account and Menta will check the code after setup.',
    });

    expect(
      getReferralSavedNotice({
        surface: 'onboarding',
        pendingReferral: referral,
        onboardingAction: 'finish_setup',
      })
    ).toMatchObject({
      description:
        'Finish setup and Menta will check whether the code qualifies for a reward.',
    });

    expect(
      getReferralSavedNotice({
        surface: 'register',
        pendingReferral: null,
      })
    ).toBeNull();
  });

  it('prioritizes saved invites over referrals on login handoff rows', () => {
    expect(
      getLoginHandoffRows({
        pendingInvite: challengeInvite,
        pendingReferral: referral,
      })
    ).toEqual([
      { label: 'Next', value: 'Sign in with any method' },
      { label: 'Then', value: 'Open saved promise invite' },
    ]);

    expect(
      getLoginHandoffRows({
        pendingInvite: null,
        pendingReferral: referral,
      })
    ).toEqual([
      { label: 'Next', value: 'Sign in or create account' },
      { label: 'Then', value: 'Check saved referral code' },
    ]);
  });

  it('keeps register handoff rows deterministic for default, referral, and invite states', () => {
    expect(
      getRegisterHandoffRows({
        pendingInvite: null,
        pendingReferral: null,
      })
    ).toEqual([
      { label: 'Step 1', value: 'Create account' },
      { label: 'Step 2', value: 'Open Menta' },
      { label: 'Step 3', value: 'Create your first promise' },
    ]);

    expect(
      getRegisterHandoffRows({
        pendingInvite: null,
        pendingReferral: referral,
      })
    ).toEqual([
      { label: 'Step 1', value: 'Create account' },
      { label: 'Step 2', value: 'Check referral code' },
      { label: 'Step 3', value: 'Show any available reward' },
    ]);

    expect(
      getRegisterHandoffRows({
        pendingInvite: groupInvite,
        pendingReferral: referral,
      })
    ).toEqual([
      { label: 'Step 1', value: 'Create account' },
      { label: 'Step 2', value: 'Open saved group invite' },
      { label: 'Step 3', value: 'Continue from the invite' },
    ]);
  });

  it('keeps email auth handoff rows mode-aware', () => {
    expect(
      getEmailAuthHandoffRows({
        mode: 'login',
        pendingInvite: null,
        pendingReferral: null,
      })
    ).toEqual([]);

    expect(
      getEmailAuthHandoffRows({
        mode: 'signup',
        pendingInvite: null,
        pendingReferral: null,
      })
    ).toEqual([
      { label: 'Next', value: 'Open Menta' },
      { label: 'Then', value: 'Create your first promise' },
    ]);

    expect(
      getEmailAuthHandoffRows({
        mode: 'login',
        pendingInvite: null,
        pendingReferral: referral,
      })
    ).toEqual([
      { label: 'Next', value: 'Check saved referral code' },
      { label: 'Then', value: 'Continue in Menta' },
    ]);

    expect(
      getEmailAuthHandoffRows({
        mode: 'signup',
        pendingInvite: challengeInvite,
        pendingReferral: referral,
      })
    ).toEqual([
      { label: 'Next', value: 'Open saved promise invite' },
      { label: 'Then', value: 'Continue from the invite' },
    ]);
  });

  it('keeps onboarding finish receipt rows aligned with saved invites', () => {
    expect(getOnboardingFinishingRows(null)).toEqual([
      { label: 'Promise', value: 'Saving to your account' },
      { label: 'Account', value: 'Connecting' },
      { label: 'Next', value: 'Open Today' },
    ]);

    expect(getOnboardingFinishingRows(groupInvite)).toEqual([
      { label: 'Promise', value: 'Saving to your account' },
      { label: 'Invite', value: 'Waiting after sign-in' },
      { label: 'Next', value: 'Open Today' },
    ]);
  });
});
