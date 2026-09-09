import {
  getOnboardingAuthPaperState,
  ONBOARDING_AUTH_PAPER_STATES,
} from '@/lib/paper-state-registry/onboarding-auth';

describe('onboarding/auth Paper state registry', () => {
  it('covers every assigned continuation state exactly once', () => {
    expect(ONBOARDING_AUTH_PAPER_STATES.map(state => state.id)).toEqual([
      'ONB-02A',
      'ONB-02B',
      'ONB-02C',
      'ONB-03A',
      'ONB-03B',
      'AUTH-01',
      'AUTH-02A',
      'AUTH-02B',
      'AUTH-02C',
      'WEB-01',
    ]);
  });

  it('keeps local and provider states below an account receipt', () => {
    expect(getOnboardingAuthPaperState('AUTH-01').authority).toBe('auth-gate');
    expect(getOnboardingAuthPaperState('AUTH-02B').authority).toBe(
      'provider-sheet'
    );
    expect(getOnboardingAuthPaperState('WEB-01').detail).toContain(
      'not consumed'
    );
  });
});
