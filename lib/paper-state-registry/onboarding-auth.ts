export type OnboardingAuthPaperStateId =
  | 'ONB-02A'
  | 'ONB-02B'
  | 'ONB-02C'
  | 'ONB-03A'
  | 'ONB-03B'
  | 'AUTH-01'
  | 'AUTH-02A'
  | 'AUTH-02B'
  | 'AUTH-02C'
  | 'WEB-01';

export type OnboardingAuthAuthority =
  | 'local-draft'
  | 'local-choice'
  | 'auth-gate'
  | 'provider-sheet'
  | 'provider-attempt'
  | 'web-unavailable';

export type OnboardingAuthPaperState = {
  id: OnboardingAuthPaperStateId;
  paperNodeId: string;
  title: string;
  detail: string;
  authority: OnboardingAuthAuthority;
  primaryAction?: string;
  secondaryAction?: string;
};

/**
 * Deterministic contracts for the live Paper onboarding/auth continuation.
 * A contract records what is visible and what kind of evidence it represents;
 * it never turns a local draft or provider attempt into an account receipt.
 */
export const ONBOARDING_AUTH_PAPER_STATES: readonly OnboardingAuthPaperState[] =
  [
    {
      id: 'ONB-02A',
      paperNodeId: '3KA-0',
      title: 'What do you want to follow through on?',
      detail: 'Saved on this phone as you type.',
      authority: 'local-draft',
      primaryAction: 'Choose proof',
    },
    {
      id: 'ONB-02B',
      paperNodeId: '3L3-0',
      title: 'What do you want to follow through on?',
      detail: 'Nothing has been sent yet.',
      authority: 'local-draft',
      primaryAction: 'Choose proof',
    },
    {
      id: 'ONB-02C',
      paperNodeId: '3LW-0',
      title: 'Write the action you want to prove.',
      detail: 'The promise stays local until you choose to save it.',
      authority: 'local-draft',
      primaryAction: 'Choose proof',
    },
    {
      id: 'ONB-03A',
      paperNodeId: '3MP-0',
      title: 'What will count as proof?',
      detail: 'A photo, a short video, or a note.',
      authority: 'local-choice',
      primaryAction: 'Preview my promise',
    },
    {
      id: 'ONB-03B',
      paperNodeId: '3R9-0',
      title: 'What will count as proof?',
      detail: 'One proof method is selected locally.',
      authority: 'local-choice',
      primaryAction: 'Preview my promise',
    },
    {
      id: 'AUTH-01',
      paperNodeId: '3TX-0',
      title: 'Save this promise to Menta.',
      detail: 'Draft saved on this phone. Nothing has been sent yet.',
      authority: 'auth-gate',
      primaryAction: 'Continue to save',
      secondaryAction: 'Not now',
    },
    {
      id: 'AUTH-02A',
      paperNodeId: '3UZ-0',
      title: 'Save your promise',
      detail: 'Choose Apple, Google, or email. Your draft stays on this phone.',
      authority: 'auth-gate',
    },
    {
      id: 'AUTH-02B',
      paperNodeId: '3VS-0',
      title: 'Continue with Apple',
      detail:
        'The system provider sheet is in progress; no account receipt exists yet.',
      authority: 'provider-sheet',
    },
    {
      id: 'AUTH-02C',
      paperNodeId: '3WL-0',
      title: 'Sign-in did not finish.',
      detail: 'Try another method. Your draft is still here.',
      authority: 'provider-attempt',
    },
    {
      id: 'WEB-01',
      paperNodeId: '8VF-0',
      title: 'Menta needs the mobile app.',
      detail:
        'No action was taken. Your invite or local draft was not consumed.',
      authority: 'web-unavailable',
    },
  ];

export const getOnboardingAuthPaperState = (
  id: OnboardingAuthPaperStateId
): OnboardingAuthPaperState => {
  const state = ONBOARDING_AUTH_PAPER_STATES.find(
    candidate => candidate.id === id
  );
  if (!state) throw new Error(`Missing onboarding/auth Paper state: ${id}`);
  return state;
};
