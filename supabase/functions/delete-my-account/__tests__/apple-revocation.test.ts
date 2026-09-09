import {
  AppleRevocationError,
  appleProviderStateForUser,
  createAppleClientSecret,
  parseAccountDeletionRequest,
  revokeAppleAuthorization,
  toJoseEcdsaSignature,
  type AppleRevocationConfig,
} from '../apple-revocation.ts';

const CONFIG: AppleRevocationConfig = {
  clientId: 'com.anekedigitalapps.lockedin',
  keyId: 'KEY1234567',
  privateKey: 'test-private-key',
  teamId: '7PDP8J2L53',
};

const EXPECTED_SUBJECT = 'apple-user-subject';
const CLIENT_EVENT_ID = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-08-14T00:00:00.000Z');

const identityTokenFor = (overrides: Record<string, unknown> = {}): string => {
  const payload = {
    iss: 'https://appleid.apple.com',
    aud: CONFIG.clientId,
    sub: EXPECTED_SUBJECT,
    exp: Math.floor(NOW.getTime() / 1000) + 300,
    ...overrides,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
};

const jsonResponse = (
  body: Record<string, unknown>,
  ok = true,
  status = ok ? 200 : 400
): Response =>
  ({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Response;

describe('Apple account-deletion revocation', () => {
  it('preserves email and Google deletion without requiring Apple credentials', () => {
    expect(
      appleProviderStateForUser({
        app_metadata: { provider: 'google', providers: ['email', 'google'] },
        identities: [
          {
            provider: 'google',
            identity_id: 'google-user',
          },
        ],
      })
    ).toEqual({ linked: false });
    expect(parseAccountDeletionRequest(null)).toEqual({
      ok: true,
      request: {},
    });
  });

  it('binds revocation to the server-known Apple subject', () => {
    expect(
      appleProviderStateForUser({
        app_metadata: { provider: 'apple', providers: ['apple'] },
        identities: [
          {
            provider: 'apple',
            provider_id: EXPECTED_SUBJECT,
            identity_id: '11111111-1111-4111-8111-111111111111',
            identity_data: { sub: EXPECTED_SUBJECT },
          },
        ],
      })
    ).toEqual({ linked: true, subject: EXPECTED_SUBJECT });

    expect(
      appleProviderStateForUser({
        app_metadata: { provider: 'apple', providers: ['apple'] },
        identities: [],
      })
    ).toEqual({ linked: true, subject: null });
  });

  it('rejects a conflicting provider subject without trusting the internal identity UUID', () => {
    expect(
      appleProviderStateForUser({
        app_metadata: { provider: 'apple', providers: ['apple'] },
        identities: [
          {
            provider: 'apple',
            provider_id: 'different-apple-subject',
            identity_id: '11111111-1111-4111-8111-111111111111',
            identity_data: { sub: EXPECTED_SUBJECT },
          },
        ],
      })
    ).toEqual({ linked: true, subject: null });
  });

  it('accepts only the short-lived authorization code and optional request identity', () => {
    expect(
      parseAccountDeletionRequest({
        appleAuthorizationCode: 'fresh-code',
        clientEventId: CLIENT_EVENT_ID,
      })
    ).toEqual({
      ok: true,
      request: {
        appleAuthorizationCode: 'fresh-code',
        clientEventId: CLIENT_EVENT_ID,
      },
    });
    expect(
      parseAccountDeletionRequest({
        appleAuthorizationCode: 'fresh-code',
        identityToken: 'must-not-be-sent',
      })
    ).toEqual({ ok: false });
    expect(
      parseAccountDeletionRequest({ refreshToken: 'must-not-be-sent' })
    ).toEqual({ ok: false });
    expect(
      parseAccountDeletionRequest({ clientEventId: 'not-a-uuid' })
    ).toEqual({ ok: false });
  });

  it('creates a five-minute ES256 client secret without embedding the private key', async () => {
    let signedInput: Uint8Array | undefined;
    const clientSecret = await createAppleClientSecret(
      CONFIG,
      NOW,
      async input => {
        signedInput = input;
        return new Uint8Array(64).fill(7);
      }
    );

    const [header, payload, signature] = clientSecret.split('.');
    expect(
      JSON.parse(Buffer.from(header, 'base64url').toString('utf8'))
    ).toEqual({ alg: 'ES256', kid: CONFIG.keyId });
    expect(
      JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    ).toEqual({
      iss: CONFIG.teamId,
      iat: Math.floor(NOW.getTime() / 1000),
      exp: Math.floor(NOW.getTime() / 1000) + 300,
      aud: 'https://appleid.apple.com',
      sub: CONFIG.clientId,
    });
    expect(Buffer.from(signature, 'base64url')).toHaveLength(64);
    expect(Buffer.from(signedInput ?? []).toString('utf8')).toBe(
      `${header}.${payload}`
    );
    expect(clientSecret).not.toContain(CONFIG.privateKey);
  });

  it('normalises ASN.1 signatures to the JOSE byte format Apple requires', () => {
    const jose = toJoseEcdsaSignature(
      Uint8Array.from([0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02])
    );

    expect(jose).toHaveLength(64);
    expect(jose[31]).toBe(1);
    expect(jose[63]).toBe(2);
  });

  it('exchanges a fresh code, verifies the account subject, then revokes the refresh token', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: 'apple-access-token',
          refresh_token: 'apple-refresh-token',
          id_token: identityTokenFor(),
        })
      )
      .mockResolvedValueOnce(jsonResponse({}));

    await expect(
      revokeAppleAuthorization({
        authorizationCode: 'fresh-authorization-code',
        clientSecretFactory: async () => 'signed-client-secret',
        config: CONFIG,
        expectedSubject: EXPECTED_SUBJECT,
        fetcher,
        now: NOW,
      })
    ).resolves.toBeUndefined();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toBe(
      'https://appleid.apple.com/auth/token'
    );
    const exchangeBody = new URLSearchParams(fetcher.mock.calls[0][1].body);
    expect(Object.fromEntries(exchangeBody.entries())).toEqual({
      client_id: CONFIG.clientId,
      client_secret: 'signed-client-secret',
      code: 'fresh-authorization-code',
      grant_type: 'authorization_code',
    });

    expect(fetcher.mock.calls[1][0]).toBe(
      'https://appleid.apple.com/auth/revoke'
    );
    const revocationBody = new URLSearchParams(fetcher.mock.calls[1][1].body);
    expect(Object.fromEntries(revocationBody.entries())).toEqual({
      client_id: CONFIG.clientId,
      client_secret: 'signed-client-secret',
      token: 'apple-refresh-token',
      token_type_hint: 'refresh_token',
    });
  });

  it('fails before revocation when Apple reauthentication belongs to another subject', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(
      jsonResponse({
        access_token: 'apple-access-token',
        refresh_token: 'apple-refresh-token',
        id_token: identityTokenFor({ sub: 'different-apple-user' }),
      })
    );

    await expect(
      revokeAppleAuthorization({
        authorizationCode: 'fresh-authorization-code',
        clientSecretFactory: async () => 'signed-client-secret',
        config: CONFIG,
        expectedSubject: EXPECTED_SUBJECT,
        fetcher,
        now: NOW,
      })
    ).rejects.toMatchObject<Partial<AppleRevocationError>>({
      code: 'APPLE_AUTHORIZATION_MISMATCH',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fails closed when Apple does not confirm token revocation', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: 'apple-access-token',
          refresh_token: 'apple-refresh-token',
          id_token: identityTokenFor(),
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: 'invalid_request' }, false, 400)
      );

    await expect(
      revokeAppleAuthorization({
        authorizationCode: 'fresh-authorization-code',
        clientSecretFactory: async () => 'signed-client-secret',
        config: CONFIG,
        expectedSubject: EXPECTED_SUBJECT,
        fetcher,
        now: NOW,
      })
    ).rejects.toMatchObject<Partial<AppleRevocationError>>({
      code: 'APPLE_REVOCATION_FAILED',
    });
  });
});
