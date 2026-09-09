import {
  extractOAuthCodeFromCallback,
  isExpectedOAuthCallbackUrl,
} from '@/lib/oauth-callback';

describe('OAuth callback security', () => {
  const redirect = 'menta://auth/callback';

  it('accepts one code from the exact callback route', () => {
    const callback = 'menta://auth/callback?code=one-time-code';

    expect(isExpectedOAuthCallbackUrl(callback, redirect)).toBe(true);
    expect(extractOAuthCodeFromCallback(callback, redirect)).toBe(
      'one-time-code'
    );
  });

  it.each([
    'menta://attacker/callback?code=one-time-code',
    'menta://auth/other?code=one-time-code',
    'other://auth/callback?code=one-time-code',
    'menta://auth/callback?code=first&code=second',
    'menta://auth/callback#access_token=attacker&refresh_token=attacker',
    'menta://auth/callback?access_token=attacker&refresh_token=attacker',
  ])('rejects an unbound or token-bearing callback: %s', callback => {
    expect(extractOAuthCodeFromCallback(callback, redirect)).toBeNull();
  });
});
