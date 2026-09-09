import { translate } from '@/lib/localization';

export type AuthHandoffMode = 'login' | 'signup';

export type AuthHandoffSurface =
  | 'login'
  | 'register'
  | 'email-auth'
  | 'onboarding';

export type OnboardingHandoffAction = 'sign_in' | 'finish_setup';

export type PendingInviteHandoff = {
  type: 'group' | 'challenge';
} | null;

export type AuthHandoffRow = {
  label: string;
  value: string;
};

export type AuthHandoffNotice = {
  title: string;
  description: string;
  tone: 'success';
};

const hasReferral = (pendingReferral: unknown) => Boolean(pendingReferral);
const inviteName = (pendingInvite: NonNullable<PendingInviteHandoff>) => {
  if (pendingInvite.type === 'challenge') {
    return translate('en-NZ', 'term.promise');
  }
  return translate('en-NZ', 'term.group');
};

export const getInviteSavedNotice = (
  surface: AuthHandoffSurface,
  pendingInvite: PendingInviteHandoff,
  options: { onboardingAction?: OnboardingHandoffAction } = {}
): AuthHandoffNotice | null => {
  if (!pendingInvite) return null;

  const action =
    surface === 'onboarding' && options.onboardingAction === 'finish_setup'
      ? translate('en-NZ', 'domain.handoff.finish_setup')
      : surface === 'register'
        ? translate('en-NZ', 'domain.handoff.create_your_account')
        : surface === 'email-auth'
          ? translate('en-NZ', 'domain.handoff.complete_sign_in')
          : translate('en-NZ', 'domain.handoff.sign_in');

  return {
    title: translate('en-NZ', 'domain.handoff.invite_saved'),
    description: translate('en-NZ', 'domain.handoff.invite_description', {
      action,
      inviteType: inviteName(pendingInvite),
    }),
    tone: 'success',
  };
};

export const getReferralSavedNotice = ({
  surface,
  mode = 'signup',
  pendingReferral,
  onboardingAction,
}: {
  surface: AuthHandoffSurface;
  mode?: AuthHandoffMode;
  pendingReferral: unknown;
  onboardingAction?: OnboardingHandoffAction;
}): AuthHandoffNotice | null => {
  if (!hasReferral(pendingReferral)) return null;

  if (surface === 'login') {
    return {
      title: translate('en-NZ', 'domain.handoff.referral_saved'),
      description: translate(
        'en-NZ',
        'domain.handoff.referral_login_description'
      ),
      tone: 'success',
    };
  }

  if (surface === 'email-auth') {
    return {
      title: translate('en-NZ', 'domain.handoff.referral_saved'),
      description:
        mode === 'signup'
          ? translate('en-NZ', 'domain.handoff.referral_signup_description')
          : translate('en-NZ', 'domain.handoff.referral_login_new_description'),
      tone: 'success',
    };
  }

  if (surface === 'onboarding') {
    return {
      title: translate('en-NZ', 'domain.handoff.referral_saved'),
      description:
        onboardingAction === 'finish_setup'
          ? translate('en-NZ', 'domain.handoff.referral_finish_description')
          : translate('en-NZ', 'domain.handoff.referral_setup_description'),
      tone: 'success',
    };
  }

  return {
    title: translate('en-NZ', 'domain.handoff.referral_saved'),
    description: translate(
      'en-NZ',
      'domain.handoff.referral_signup_description'
    ),
    tone: 'success',
  };
};

export const getLoginHandoffRows = ({
  pendingInvite,
  pendingReferral,
}: {
  pendingInvite: PendingInviteHandoff;
  pendingReferral: unknown;
}): AuthHandoffRow[] => {
  if (pendingInvite) {
    return [
      {
        label: translate('en-NZ', 'domain.handoff.next'),
        value: translate('en-NZ', 'domain.handoff.sign_in_any_method'),
      },
      {
        label: translate('en-NZ', 'domain.handoff.then'),
        value: translate('en-NZ', 'domain.handoff.open_saved_invite', {
          inviteType: inviteName(pendingInvite),
        }),
      },
    ];
  }

  if (hasReferral(pendingReferral)) {
    return [
      {
        label: translate('en-NZ', 'domain.handoff.next'),
        value: translate('en-NZ', 'domain.handoff.sign_in_or_create'),
      },
      {
        label: translate('en-NZ', 'domain.handoff.then'),
        value: translate('en-NZ', 'domain.handoff.check_referral'),
      },
    ];
  }

  return [];
};

export const getRegisterHandoffRows = ({
  pendingInvite,
  pendingReferral,
}: {
  pendingInvite: PendingInviteHandoff;
  pendingReferral: unknown;
}): AuthHandoffRow[] => [
  {
    label: translate('en-NZ', 'domain.handoff.step_one'),
    value: translate('en-NZ', 'domain.handoff.create_account'),
  },
  {
    label: translate('en-NZ', 'domain.handoff.step_two'),
    value: pendingInvite
      ? translate('en-NZ', 'domain.handoff.open_saved_invite', {
          inviteType: inviteName(pendingInvite),
        })
      : hasReferral(pendingReferral)
        ? translate('en-NZ', 'domain.handoff.check_referral_short')
        : translate('en-NZ', 'domain.handoff.open_menta'),
  },
  {
    label: translate('en-NZ', 'domain.handoff.step_three'),
    value: pendingInvite
      ? translate('en-NZ', 'domain.handoff.continue_invite')
      : hasReferral(pendingReferral)
        ? translate('en-NZ', 'domain.handoff.show_reward')
        : translate('en-NZ', 'domain.handoff.create_first_promise'),
  },
];

export const getEmailAuthHandoffRows = ({
  mode,
  pendingInvite,
  pendingReferral,
}: {
  mode: AuthHandoffMode;
  pendingInvite: PendingInviteHandoff;
  pendingReferral: unknown;
}): AuthHandoffRow[] => {
  if (pendingInvite) {
    return [
      {
        label: translate('en-NZ', 'domain.handoff.next'),
        value: translate('en-NZ', 'domain.handoff.open_saved_invite', {
          inviteType: inviteName(pendingInvite),
        }),
      },
      {
        label: translate('en-NZ', 'domain.handoff.then'),
        value: translate('en-NZ', 'domain.handoff.continue_invite'),
      },
    ];
  }

  if (hasReferral(pendingReferral)) {
    return [
      {
        label: translate('en-NZ', 'domain.handoff.next'),
        value: translate('en-NZ', 'domain.handoff.check_referral'),
      },
      {
        label: translate('en-NZ', 'domain.handoff.then'),
        value:
          mode === 'signup'
            ? translate('en-NZ', 'domain.handoff.show_reward')
            : translate('en-NZ', 'domain.handoff.continue_menta'),
      },
    ];
  }

  if (mode === 'signup') {
    return [
      {
        label: translate('en-NZ', 'domain.handoff.next'),
        value: translate('en-NZ', 'domain.handoff.open_menta'),
      },
      {
        label: translate('en-NZ', 'domain.handoff.then'),
        value: translate('en-NZ', 'domain.handoff.create_first_promise'),
      },
    ];
  }

  return [];
};

export const getOnboardingFinishingRows = (
  pendingInvite: PendingInviteHandoff
): AuthHandoffRow[] => [
  {
    label: translate('en-NZ', 'domain.handoff.promise'),
    value: translate('en-NZ', 'domain.handoff.saving_account'),
  },
  {
    label: pendingInvite
      ? translate('en-NZ', 'domain.handoff.invite')
      : translate('en-NZ', 'domain.handoff.account'),
    value: pendingInvite
      ? translate('en-NZ', 'domain.handoff.waiting_after_sign_in')
      : translate('en-NZ', 'domain.handoff.connecting'),
  },
  {
    label: translate('en-NZ', 'domain.handoff.next'),
    value: translate('en-NZ', 'domain.handoff.open_today'),
  },
];
