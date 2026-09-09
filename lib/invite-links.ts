export type InviteKind = 'group' | 'challenge';

export type InviteLinkChannel = 'https' | 'menta' | 'lockedin' | 'lockedinprod';

export type ParsedInviteLink = {
  kind: InviteKind;
  code: string;
  source: 'direct_code' | 'custom_scheme' | 'https';
  url: string;
};

export type GroupInviteInputResolution =
  | {
      status: 'group';
      code: string;
      source: ParsedInviteLink['source'] | 'normalized_code';
    }
  | {
      status: 'challenge';
      code: string;
      source: ParsedInviteLink['source'];
    }
  | {
      status: 'invalid';
      code: string;
      source: 'unrecognized';
    };

export const PRIMARY_INVITE_HOST = 'menta.quest';

const CUSTOM_SCHEMES = new Set(['menta', 'lockedin', 'lockedinprod']);
const HTTPS_HOSTS = new Set([
  PRIMARY_INVITE_HOST,
  `www.${PRIMARY_INVITE_HOST}`,
  'lockedinpro.com',
  'www.lockedinpro.com',
]);
const INVITE_CODE_PATTERN = /^[A-Z0-9]{4,32}$/;
const REFERRAL_CODE_PATTERN = /^[0-9A-F]{32}$/;

export const normalizeInviteCode = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/[\s-]+/g, '')
    .toUpperCase();
};

export const isValidInviteCode = (value: unknown): boolean =>
  INVITE_CODE_PATTERN.test(normalizeInviteCode(value));

/**
 * Referral capabilities have a deliberately narrower database contract than
 * group and promise invites. Keeping that distinction at every entry point
 * prevents a malformed link from being presented as a saved referral before
 * the server can reject it.
 */
export const isValidReferralCode = (value: unknown): boolean =>
  REFERRAL_CODE_PATTERN.test(normalizeInviteCode(value));

const firstParam = (
  params: URLSearchParams,
  names: readonly string[]
): string => {
  const requestedNames = new Set(names.map(name => name.toLowerCase()));

  for (const name of names) {
    const value = params.get(name);
    if (value) {
      return value;
    }
  }

  let caseInsensitiveValue = '';
  params.forEach((value, name) => {
    if (!caseInsensitiveValue && requestedNames.has(name.toLowerCase())) {
      caseInsensitiveValue = value;
    }
  });

  if (caseInsensitiveValue) {
    return caseInsensitiveValue;
  }

  return '';
};

const getParamCaseInsensitive = (
  params: URLSearchParams,
  name: string
): string | null => {
  const directValue = params.get(name);
  if (directValue !== null) {
    return directValue;
  }

  const targetName = name.toLowerCase();
  let caseInsensitiveValue: string | null = null;

  params.forEach((value, paramName) => {
    if (
      caseInsensitiveValue === null &&
      paramName.toLowerCase() === targetName
    ) {
      caseInsensitiveValue = value;
    }
  });

  return caseInsensitiveValue;
};

const hasParamCaseInsensitive = (
  params: URLSearchParams,
  name: string
): boolean => getParamCaseInsensitive(params, name) !== null;

const pathSegmentsForUrl = (url: URL, isCustomScheme: boolean): string[] => {
  const segments = url.pathname
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean);

  if (isCustomScheme && url.hostname) {
    return [url.hostname, ...segments];
  }

  return segments;
};

const kindFromParamsAndPath = (
  params: URLSearchParams,
  pathSegments: readonly string[],
  fallback: InviteKind
): InviteKind => {
  const requestedType = (
    getParamCaseInsensitive(params, 'type') || ''
  ).toLowerCase();

  if (
    requestedType === 'challenge' ||
    hasParamCaseInsensitive(params, 'challenge')
  ) {
    return 'challenge';
  }

  if (
    requestedType === 'group' ||
    hasParamCaseInsensitive(params, 'invite') ||
    hasParamCaseInsensitive(params, 'group')
  ) {
    return 'group';
  }

  if (pathSegments.some(segment => segment.toLowerCase() === 'challenge')) {
    return 'challenge';
  }

  return fallback;
};

const codeFromParamsAndPath = (
  params: URLSearchParams,
  pathSegments: readonly string[],
  kind: InviteKind
): string => {
  const paramCode =
    kind === 'challenge'
      ? firstParam(params, ['challenge', 'code', 'invite'])
      : firstParam(params, ['invite', 'group', 'code']);

  if (paramCode) {
    return paramCode;
  }

  const joinIndex = pathSegments.findIndex(
    segment => segment.toLowerCase() === 'join'
  );

  if (joinIndex >= 0) {
    const afterJoin = pathSegments.slice(joinIndex + 1);

    if (afterJoin[0]?.toLowerCase() === 'challenge') {
      return afterJoin[1] || '';
    }

    if (afterJoin[0]?.toLowerCase() === 'group') {
      return afterJoin[1] || '';
    }

    return afterJoin[0] || '';
  }

  const kindIndex = pathSegments.findIndex(
    segment => segment.toLowerCase() === kind
  );

  if (kindIndex >= 0) {
    return pathSegments[kindIndex + 1] || '';
  }

  return '';
};

export const parseInviteLink = (
  value: string,
  defaultKind: InviteKind = 'group'
): ParsedInviteLink | null => {
  const rawValue = value.trim();
  if (!rawValue) {
    return null;
  }

  const directCode = normalizeInviteCode(rawValue);
  if (!rawValue.includes(':') && INVITE_CODE_PATTERN.test(directCode)) {
    return {
      kind: defaultKind,
      code: directCode,
      source: 'direct_code',
      url: rawValue,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    return null;
  }

  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const isCustomScheme = CUSTOM_SCHEMES.has(scheme);
  const isHttpsLink = scheme === 'https' && HTTPS_HOSTS.has(hostname);

  if (!isCustomScheme && !isHttpsLink) {
    return null;
  }

  const pathSegments = pathSegmentsForUrl(parsed, isCustomScheme);
  const kind = kindFromParamsAndPath(
    parsed.searchParams,
    pathSegments,
    defaultKind
  );
  const code = normalizeInviteCode(
    codeFromParamsAndPath(parsed.searchParams, pathSegments, kind)
  );

  if (!INVITE_CODE_PATTERN.test(code)) {
    return null;
  }

  return {
    kind,
    code,
    source: isCustomScheme ? 'custom_scheme' : 'https',
    url: rawValue,
  };
};

export const resolveGroupInviteInput = (
  value: unknown
): GroupInviteInputResolution => {
  if (typeof value !== 'string') {
    return { status: 'invalid', code: '', source: 'unrecognized' };
  }

  const parsedInvite = parseInviteLink(value, 'group');

  if (parsedInvite?.kind === 'challenge') {
    return {
      status: 'challenge',
      code: parsedInvite.code,
      source: parsedInvite.source,
    };
  }

  const code = parsedInvite?.code || normalizeInviteCode(value);

  if (!isValidInviteCode(code)) {
    return {
      status: 'invalid',
      code,
      source: 'unrecognized',
    };
  }

  return {
    status: 'group',
    code,
    source: parsedInvite?.source ?? 'normalized_code',
  };
};

export const buildInviteShareUrl = (
  kind: InviteKind,
  code: string,
  channel: InviteLinkChannel = 'https'
): string => {
  const normalizedCode = normalizeInviteCode(code);
  const paramName = kind === 'challenge' ? 'challenge' : 'invite';

  if (!INVITE_CODE_PATTERN.test(normalizedCode)) {
    throw new Error('Invalid invite code');
  }

  if (channel === 'https') {
    return `https://${PRIMARY_INVITE_HOST}/join?${paramName}=${encodeURIComponent(
      normalizedCode
    )}`;
  }

  return `${channel}://join?${paramName}=${encodeURIComponent(normalizedCode)}`;
};

export const buildInviteShareMessage = ({
  kind,
  code,
  title,
  appName = 'Menta',
}: {
  kind: InviteKind;
  code: string;
  title: string;
  appName?: string;
}): string => {
  const normalizedCode = normalizeInviteCode(code);
  const shareUrl = buildInviteShareUrl(kind, normalizedCode);
  const noun = kind === 'challenge' ? 'challenge' : 'group';

  return `Join "${title}" ${noun} on ${appName}.\nInvite code: ${normalizedCode}\n${shareUrl}`;
};

export const buildReferralShareUrl = (
  referralCode: string,
  channel: InviteLinkChannel = 'https'
): string => {
  const normalizedCode = normalizeInviteCode(referralCode);

  if (!REFERRAL_CODE_PATTERN.test(normalizedCode)) {
    throw new Error('Invalid referral code');
  }

  if (channel === 'https') {
    return `https://${PRIMARY_INVITE_HOST}/invite?ref=${encodeURIComponent(
      normalizedCode
    )}`;
  }

  return `${channel}://invite?ref=${encodeURIComponent(normalizedCode)}`;
};
