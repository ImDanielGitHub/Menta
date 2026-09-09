type AppleIdentity = {
  provider_id?: unknown;
  identity_id?: unknown;
  identity_data?: Record<string, unknown> | null;
  provider?: unknown;
};

type AppleLinkedUser = {
  app_metadata?: Record<string, unknown> | null;
  identities?: AppleIdentity[] | null;
};

export type AccountDeletionRequest = {
  appleAuthorizationCode?: string;
  clientEventId?: string;
};

export type AppleProviderState =
  | { linked: false }
  | { linked: true; subject: string | null };

export type AppleRevocationConfig = {
  clientId: string;
  keyId: string;
  privateKey: string;
  teamId: string;
};

export type AppleRevocationErrorCode =
  | 'APPLE_AUTHORIZATION_INVALID'
  | 'APPLE_AUTHORIZATION_MISMATCH'
  | 'APPLE_REVOCATION_CONFIGURATION_ERROR'
  | 'APPLE_REVOCATION_FAILED';

export class AppleRevocationError extends Error {
  readonly code: AppleRevocationErrorCode;

  constructor(code: AppleRevocationErrorCode, message: string) {
    super(message);
    this.name = 'AppleRevocationError';
    this.code = code;
  }
}

type ParseDeletionRequestResult =
  | { ok: true; request: AccountDeletionRequest }
  | { ok: false };

type AppleTokenResponse = {
  access_token?: unknown;
  id_token?: unknown;
  refresh_token?: unknown;
};

type AppleIdentityTokenPayload = {
  aud?: unknown;
  exp?: unknown;
  iss?: unknown;
  sub?: unknown;
};

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

type ClientSecretFactory = (
  config: AppleRevocationConfig,
  now: Date
) => Promise<string>;

type EcdsaSigner = (
  signingInput: Uint8Array,
  privateKey: string
) => Promise<Uint8Array>;

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const MAX_AUTHORIZATION_CODE_LENGTH = 4096;
const CLIENT_SECRET_LIFETIME_SECONDS = 5 * 60;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const parseAccountDeletionRequest = (
  value: unknown
): ParseDeletionRequestResult => {
  if (value === null || value === undefined) {
    return { ok: true, request: {} };
  }

  if (!isRecord(value)) return { ok: false };
  const keys = Object.keys(value);
  if (
    keys.some(
      key => key !== 'appleAuthorizationCode' && key !== 'clientEventId'
    )
  ) {
    return { ok: false };
  }

  const request: AccountDeletionRequest = {};
  if ('clientEventId' in value) {
    const clientEventId = nonEmptyString(value.clientEventId);
    if (!clientEventId || !UUID_PATTERN.test(clientEventId)) {
      return { ok: false };
    }
    request.clientEventId = clientEventId.toLowerCase();
  }

  if ('appleAuthorizationCode' in value) {
    const code = nonEmptyString(value.appleAuthorizationCode);
    if (!code || code.length > MAX_AUTHORIZATION_CODE_LENGTH) {
      return { ok: false };
    }
    request.appleAuthorizationCode = code;
  }

  return { ok: true, request };
};

export const appleProviderStateForUser = (
  user: AppleLinkedUser
): AppleProviderState => {
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const appleIdentities = identities.filter(
    identity => identity.provider === 'apple'
  );
  const metadataProvider = user.app_metadata?.provider;
  const metadataProviders = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : [];
  const linked =
    metadataProvider === 'apple' ||
    metadataProviders.includes('apple') ||
    appleIdentities.length > 0;

  if (!linked) return { linked: false };

  const subjects = new Set<string>();
  for (const identity of appleIdentities) {
    const providerId = nonEmptyString(identity.provider_id);
    const identitySubject = nonEmptyString(identity.identity_data?.sub);

    if (providerId && identitySubject && providerId !== identitySubject) {
      return { linked: true, subject: null };
    }
    if (providerId) subjects.add(providerId);
    if (identitySubject) subjects.add(identitySubject);
  }

  if (subjects.size !== 1) return { linked: true, subject: null };
  return { linked: true, subject: [...subjects][0] };
};

const utf8ToBase64Url = (value: string): string =>
  bytesToBase64Url(new TextEncoder().encode(value));

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const base64UrlToJson = (value: string): Record<string, unknown> | null => {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const parsed: unknown = JSON.parse(decoded);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const readDerLength = (
  bytes: Uint8Array,
  offset: number
): { length: number; nextOffset: number } | null => {
  const first = bytes[offset];
  if (first === undefined) return null;
  if ((first & 0x80) === 0) {
    return { length: first, nextOffset: offset + 1 };
  }

  const lengthBytes = first & 0x7f;
  if (lengthBytes < 1 || lengthBytes > 2) return null;
  let length = 0;
  for (let index = 0; index < lengthBytes; index += 1) {
    const byte = bytes[offset + 1 + index];
    if (byte === undefined) return null;
    length = (length << 8) | byte;
  }
  return { length, nextOffset: offset + 1 + lengthBytes };
};

const readDerInteger = (
  bytes: Uint8Array,
  offset: number
): { bytes: Uint8Array; nextOffset: number } | null => {
  if (bytes[offset] !== 0x02) return null;
  const length = readDerLength(bytes, offset + 1);
  if (!length || length.length < 1) return null;
  const end = length.nextOffset + length.length;
  if (end > bytes.length) return null;

  let integer = bytes.slice(length.nextOffset, end);
  while (integer.length > 32 && integer[0] === 0) {
    integer = integer.slice(1);
  }
  if (integer.length > 32) return null;

  const padded = new Uint8Array(32);
  padded.set(integer, 32 - integer.length);
  return { bytes: padded, nextOffset: end };
};

export const toJoseEcdsaSignature = (signature: Uint8Array): Uint8Array => {
  if (signature.length === 64) return signature;
  if (signature[0] !== 0x30) {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_CONFIGURATION_ERROR',
      'Apple revocation signing returned an unsupported signature.'
    );
  }

  const sequence = readDerLength(signature, 1);
  if (!sequence || sequence.nextOffset + sequence.length !== signature.length) {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_CONFIGURATION_ERROR',
      'Apple revocation signing returned an invalid signature.'
    );
  }

  const r = readDerInteger(signature, sequence.nextOffset);
  const s = r ? readDerInteger(signature, r.nextOffset) : null;
  if (!r || !s || s.nextOffset !== signature.length) {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_CONFIGURATION_ERROR',
      'Apple revocation signing returned an invalid signature.'
    );
  }

  const jose = new Uint8Array(64);
  jose.set(r.bytes, 0);
  jose.set(s.bytes, 32);
  return jose;
};

const decodePem = (privateKey: string): Uint8Array => {
  const normalized = privateKey.replace(/\\n/g, '\n').trim();
  const base64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  if (!base64) {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_CONFIGURATION_ERROR',
      'Apple revocation signing is not configured.'
    );
  }

  try {
    return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
  } catch {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_CONFIGURATION_ERROR',
      'Apple revocation signing is not configured.'
    );
  }
};

const copyToArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer as ArrayBuffer;
};

const signWithApplePrivateKey: EcdsaSigner = async (
  signingInput,
  privateKey
) => {
  try {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      copyToArrayBuffer(decodePem(privateKey)),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      copyToArrayBuffer(signingInput)
    );
    return new Uint8Array(signature);
  } catch (error) {
    if (error instanceof AppleRevocationError) throw error;
    throw new AppleRevocationError(
      'APPLE_REVOCATION_CONFIGURATION_ERROR',
      'Apple revocation signing is not configured.'
    );
  }
};

const assertAppleRevocationConfig = (config: AppleRevocationConfig): void => {
  if (
    !nonEmptyString(config.clientId) ||
    !nonEmptyString(config.keyId) ||
    !nonEmptyString(config.privateKey) ||
    !nonEmptyString(config.teamId)
  ) {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_CONFIGURATION_ERROR',
      'Apple revocation is not configured.'
    );
  }
};

export const createAppleClientSecret = async (
  config: AppleRevocationConfig,
  now = new Date(),
  signer: EcdsaSigner = signWithApplePrivateKey
): Promise<string> => {
  assertAppleRevocationConfig(config);
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = utf8ToBase64Url(
    JSON.stringify({ alg: 'ES256', kid: config.keyId })
  );
  const payload = utf8ToBase64Url(
    JSON.stringify({
      iss: config.teamId,
      iat: issuedAt,
      exp: issuedAt + CLIENT_SECRET_LIFETIME_SECONDS,
      aud: APPLE_ISSUER,
      sub: config.clientId,
    })
  );
  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = toJoseEcdsaSignature(
    await signer(signingInput, config.privateKey)
  );
  return `${header}.${payload}.${bytesToBase64Url(signature)}`;
};

const safeJson = async (
  response: Response
): Promise<Record<string, unknown>> => {
  try {
    const body: unknown = await response.json();
    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
};

const appleErrorCode = (body: Record<string, unknown>): string | null =>
  nonEmptyString(body.error);

const verifyAppleIdentityToken = (
  identityToken: string,
  expectedSubject: string,
  clientId: string,
  now: Date
): void => {
  const parts = identityToken.split('.');
  const payload =
    parts.length === 3
      ? (base64UrlToJson(parts[1]) as AppleIdentityTokenPayload | null)
      : null;
  const audienceMatches =
    payload?.aud === clientId ||
    (Array.isArray(payload?.aud) && payload.aud.includes(clientId));
  const expiresAt =
    typeof payload?.exp === 'number' && Number.isFinite(payload.exp)
      ? payload.exp
      : 0;
  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (
    !payload ||
    payload.iss !== APPLE_ISSUER ||
    !audienceMatches ||
    payload.sub !== expectedSubject ||
    expiresAt <= nowSeconds
  ) {
    throw new AppleRevocationError(
      'APPLE_AUTHORIZATION_MISMATCH',
      'Apple reauthentication did not match this Menta account.'
    );
  }
};

export const revokeAppleAuthorization = async ({
  authorizationCode,
  clientSecretFactory = createAppleClientSecret,
  config,
  expectedSubject,
  fetcher = fetch,
  now = new Date(),
}: {
  authorizationCode: string;
  clientSecretFactory?: ClientSecretFactory;
  config: AppleRevocationConfig;
  expectedSubject: string;
  fetcher?: Fetcher;
  now?: Date;
}): Promise<void> => {
  assertAppleRevocationConfig(config);
  const code = nonEmptyString(authorizationCode);
  if (!code || code.length > MAX_AUTHORIZATION_CODE_LENGTH) {
    throw new AppleRevocationError(
      'APPLE_AUTHORIZATION_INVALID',
      'Apple reauthentication expired or was invalid.'
    );
  }

  const clientSecret = await clientSecretFactory(config, now);
  const exchangeBody = new URLSearchParams({
    client_id: config.clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
  });

  let exchangeResponse: Response;
  try {
    exchangeResponse = await fetcher(APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: exchangeBody.toString(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_FAILED',
      'Apple access could not be revoked right now.'
    );
  }

  const exchangePayload = (await safeJson(
    exchangeResponse
  )) as AppleTokenResponse & Record<string, unknown>;
  if (!exchangeResponse.ok) {
    const codeFromApple = appleErrorCode(exchangePayload);
    throw new AppleRevocationError(
      codeFromApple === 'invalid_client'
        ? 'APPLE_REVOCATION_CONFIGURATION_ERROR'
        : 'APPLE_AUTHORIZATION_INVALID',
      codeFromApple === 'invalid_client'
        ? 'Apple revocation is not configured.'
        : 'Apple reauthentication expired or was invalid.'
    );
  }

  const identityToken = nonEmptyString(exchangePayload.id_token);
  const refreshToken = nonEmptyString(exchangePayload.refresh_token);
  const accessToken = nonEmptyString(exchangePayload.access_token);
  if (!identityToken || (!refreshToken && !accessToken)) {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_FAILED',
      'Apple did not return a revocable authorization.'
    );
  }

  verifyAppleIdentityToken(
    identityToken,
    expectedSubject,
    config.clientId,
    now
  );

  const revocationBody = new URLSearchParams({
    client_id: config.clientId,
    client_secret: clientSecret,
    token: refreshToken ?? accessToken!,
    token_type_hint: refreshToken ? 'refresh_token' : 'access_token',
  });

  let revocationResponse: Response;
  try {
    revocationResponse = await fetcher(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: revocationBody.toString(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AppleRevocationError(
      'APPLE_REVOCATION_FAILED',
      'Apple access could not be revoked right now.'
    );
  }

  if (!revocationResponse.ok) {
    const revocationPayload = await safeJson(revocationResponse);
    throw new AppleRevocationError(
      appleErrorCode(revocationPayload) === 'invalid_client'
        ? 'APPLE_REVOCATION_CONFIGURATION_ERROR'
        : 'APPLE_REVOCATION_FAILED',
      'Apple access could not be revoked right now.'
    );
  }
};
