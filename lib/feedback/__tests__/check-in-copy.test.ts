import { getFeedbackCheckInCopy } from '../check-in-copy';

describe('first-promise feedback check-in copy', () => {
  it('asks how Menta is going instead of a rating pre-question', () => {
    const copy = getFeedbackCheckInCopy();
    expect(copy.heading).toBe('How is Menta going?');
    expect(copy.accessibilityLabel).toBe('How is Menta going?');
    expect(copy.body).toBe(
      'Tell us what works for you, or what could be clearer.'
    );
    expect(copy.working).toBe("Yes, it's working for me");
    expect(copy.better).toBe('Something could be better');
    expect(copy.notNow).toBe('Not now');
  });
});
