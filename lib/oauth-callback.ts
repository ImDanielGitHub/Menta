const normalisePath = (path: string): string =>
  `/${path}`.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';

export const isExpectedOAuthCallbackUrl = (
  callbackUrl: string,
  expectedRedirectUrl: string
): boolean => {
  try {
    const callback = new URL(callbackUrl);
    const expected = new URL(expectedRedirectUrl);
    return (
      callback.protocol === expected.protocol &&
      callback.hostname === expected.hostname &&
      callback.port === expected.port &&
      normalisePath(callback.pathname) === normalisePath(expected.pathname) &&
      !callback.username &&
      !callback.password
    );
  } catch {
    return false;
  }
};

export const extractOAuthCodeFromCallback = (
  callbackUrl: string,
  expectedRedirectUrl: string
): string | null => {
  if (!isExpectedOAuthCallbackUrl(callbackUrl, expectedRedirectUrl)) {
    return null;
  }

  try {
    const callback = new URL(callbackUrl);
    if (callback.hash) return null;
    for (const tokenKey of [
      'access_token',
      'refresh_token',
      'id_token',
      'token',
    ]) {
      if (callback.searchParams.has(tokenKey)) return null;
    }

    const codes = callback.searchParams
      .getAll('code')
      .map(value => value.trim())
      .filter(Boolean);
    if (codes.length !== 1 || codes[0].length > 2048) return null;
    return codes[0];
  } catch {
    return null;
  }
};
