import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export type LegalAcceptanceSurface =
  | 'account_creation'
  | 'post_auth'
  | 'pre_authoring'
  | 'material_update'
  | 'settings';

export type LegalDocumentKey = 'terms' | 'privacy' | 'community_standards';

export type LegalDocumentVersion = {
  version: string;
  url: string;
  effectiveAt: string;
};

export type CurrentLegalDocuments = Record<
  LegalDocumentKey,
  LegalDocumentVersion
>;

export type LegalAcceptanceReceipt = {
  id: string;
  acceptedAt: string;
  surface: LegalAcceptanceSurface;
  appVersion: string;
  appBuild: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  locale: string | null;
};

export type LegalAcceptanceStatus = {
  userId: string;
  accepted: boolean;
  requiresAcceptance: boolean;
  reason: 'current' | 'missing_or_stale';
  current: CurrentLegalDocuments;
  enforcement: {
    promiseCreationRequired: boolean;
  };
  receipt: LegalAcceptanceReceipt | null;
};

type UnknownRecord = Record<string, unknown>;
type LegalRpcResult = { data: unknown; error: unknown };
type LegalRpc = (
  functionName: string,
  params?: Record<string, string | null>
) => Promise<LegalRpcResult>;

// Generated database types are refreshed after all forward migrations merge.
// Keep this temporary boundary typed without weakening the rest of the module.
// Supabase's RPC method reads client state through `this`, so every call must
// retain the client receiver.
const callLegalRpc: LegalRpc = (functionName, params) =>
  (supabase.rpc as unknown as LegalRpc).call(supabase, functionName, params);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const decodeDocument = (value: unknown): LegalDocumentVersion | null => {
  if (!isRecord(value)) return null;
  const version = readString(value.version);
  const url = readString(value.url);
  const effectiveAt = readString(value.effectiveAt);
  if (!version || !url || !effectiveAt || !url.startsWith('https://')) {
    return null;
  }
  if (Number.isNaN(Date.parse(effectiveAt))) return null;
  return { version, url, effectiveAt };
};

const legalSurfaces: readonly LegalAcceptanceSurface[] = [
  'account_creation',
  'post_auth',
  'pre_authoring',
  'material_update',
  'settings',
];

const decodeReceipt = (value: unknown): LegalAcceptanceReceipt | null => {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  const acceptedAt = readString(value.acceptedAt);
  const surface = readString(value.surface);
  const appVersion = readString(value.appVersion);
  const appBuild = readString(value.appBuild);
  const platform = readString(value.platform);
  const locale = value.locale === null ? null : readString(value.locale);

  if (
    !id ||
    !acceptedAt ||
    Number.isNaN(Date.parse(acceptedAt)) ||
    !surface ||
    !legalSurfaces.includes(surface as LegalAcceptanceSurface) ||
    !appVersion ||
    !appBuild ||
    !platform ||
    !['ios', 'android', 'web', 'unknown'].includes(platform)
  ) {
    return null;
  }

  return {
    id,
    acceptedAt,
    surface: surface as LegalAcceptanceSurface,
    appVersion,
    appBuild,
    platform: platform as LegalAcceptanceReceipt['platform'],
    locale,
  };
};

export const decodeLegalAcceptanceStatus = (
  value: unknown
): LegalAcceptanceStatus | null => {
  if (!isRecord(value) || !isRecord(value.current)) return null;
  const terms = decodeDocument(value.current.terms);
  const privacy = decodeDocument(value.current.privacy);
  const communityStandards = decodeDocument(value.current.community_standards);
  const userId = readString(value.userId);
  const accepted = value.accepted === true;
  const requiresAcceptance = value.requiresAcceptance === true;
  const reason = readString(value.reason);
  const promiseCreationRequired = isRecord(value.enforcement)
    ? value.enforcement.promiseCreationRequired
    : null;

  if (
    !userId ||
    !terms ||
    !privacy ||
    !communityStandards ||
    accepted === requiresAcceptance ||
    typeof promiseCreationRequired !== 'boolean' ||
    (reason !== 'current' && reason !== 'missing_or_stale')
  ) {
    return null;
  }

  const receipt = value.receipt === null ? null : decodeReceipt(value.receipt);
  if ((accepted && !receipt) || (!accepted && value.receipt !== null)) {
    return null;
  }

  return {
    userId,
    accepted,
    requiresAcceptance,
    reason,
    current: { terms, privacy, community_standards: communityStandards },
    enforcement: { promiseCreationRequired },
    receipt,
  };
};

const rpcError = (error: unknown, fallback: string) => {
  if (isRecord(error)) {
    const next = new Error(readString(error.message) ?? fallback);
    Object.assign(next, {
      code: readString(error.code),
      details: readString(error.details),
      hint: readString(error.hint),
    });
    return next;
  }
  return error instanceof Error ? error : new Error(fallback);
};

export class LegalAcceptanceRequiredError extends Error {
  readonly code = 'LEGAL_ACCEPTANCE_REQUIRED';
  readonly status: LegalAcceptanceStatus;

  constructor(status: LegalAcceptanceStatus) {
    super('Accept Menta’s current legal documents before creating content.');
    this.name = 'LegalAcceptanceRequiredError';
    this.status = status;
  }
}

export class LegalAccountScopeChangedError extends Error {
  readonly code = 'ACCOUNT_SCOPE_CHANGED';

  constructor() {
    super(
      'The active Menta account changed before this legal action finished.'
    );
    this.name = 'LegalAccountScopeChangedError';
  }
}

export const isLegalAcceptanceRequiredError = (
  value: unknown
): value is LegalAcceptanceRequiredError =>
  value instanceof LegalAcceptanceRequiredError ||
  (isRecord(value) &&
    (value.code === 'LEGAL_ACCEPTANCE_REQUIRED' ||
      [value.message, value.details, value.hint]
        .filter(item => typeof item === 'string')
        .some(item => (item as string).includes('LEGAL_ACCEPTANCE_REQUIRED'))));

const requireExpectedOwner = (expectedUserId: string) => {
  const activeUserId = useAuthStore.getState().user?.id ?? null;
  if (!expectedUserId || activeUserId !== expectedUserId) {
    throw new LegalAccountScopeChangedError();
  }
};

export const getMyLegalAcceptanceStatus = async (expectedUserId: string) => {
  requireExpectedOwner(expectedUserId);
  const { data, error } = await callLegalRpc('get_my_legal_acceptance_status', {
    p_expected_user_id: expectedUserId,
  });
  if (error) {
    throw rpcError(error, 'Menta could not check the legal documents.');
  }

  requireExpectedOwner(expectedUserId);

  const status = decodeLegalAcceptanceStatus(data);
  if (!status || status.userId !== expectedUserId) {
    throw new Error('Menta received an invalid legal-document status.');
  }
  return status;
};

export const getCurrentLegalDocuments =
  async (): Promise<CurrentLegalDocuments> => {
    const { data, error } = await callLegalRpc(
      'get_current_legal_document_versions'
    );
    if (error) {
      throw rpcError(
        error,
        'Menta could not load the current legal documents.'
      );
    }
    if (!isRecord(data)) {
      throw new Error('Menta received invalid legal-document details.');
    }
    const terms = decodeDocument(data.terms);
    const privacy = decodeDocument(data.privacy);
    const communityStandards = decodeDocument(data.community_standards);
    if (!terms || !privacy || !communityStandards) {
      throw new Error('Menta received incomplete legal-document details.');
    }
    return {
      terms,
      privacy,
      community_standards: communityStandards,
    };
  };

export const acceptCurrentLegalDocuments = async (
  status: LegalAcceptanceStatus,
  surface: LegalAcceptanceSurface,
  expectedUserId: string
) => {
  requireExpectedOwner(expectedUserId);
  if (status.userId !== expectedUserId) {
    throw new LegalAccountScopeChangedError();
  }

  const locale = Intl.DateTimeFormat().resolvedOptions().locale || null;
  const platform = ['ios', 'android', 'web'].includes(Platform.OS)
    ? Platform.OS
    : 'unknown';
  const { data, error } = await callLegalRpc('accept_current_legal_documents', {
    p_expected_user_id: expectedUserId,
    p_terms_version: status.current.terms.version,
    p_privacy_policy_version: status.current.privacy.version,
    p_community_standards_version: status.current.community_standards.version,
    p_acceptance_surface: surface,
    p_app_version: Application.nativeApplicationVersion ?? 'development',
    p_app_build: Application.nativeBuildVersion ?? 'development',
    p_app_platform: platform,
    p_locale: locale,
  });
  if (error) {
    throw rpcError(error, 'Menta could not save the legal acceptance.');
  }

  requireExpectedOwner(expectedUserId);

  const accepted = decodeLegalAcceptanceStatus(data);
  if (
    !accepted?.accepted ||
    accepted.requiresAcceptance ||
    accepted.userId !== expectedUserId
  ) {
    throw new Error('Menta did not return a confirmed acceptance receipt.');
  }
  return accepted;
};

export const assertCurrentLegalAcceptance = async (expectedUserId: string) => {
  const status = await getMyLegalAcceptanceStatus(expectedUserId);
  if (status.enforcement.promiseCreationRequired && status.requiresAcceptance) {
    throw new LegalAcceptanceRequiredError(status);
  }
  return status;
};

export const ONBOARDING_LEGAL_ACCEPTED_RETURN =
  '/onboarding?resume=legal-accepted';
export const ONBOARDING_LEGAL_DECLINED_RETURN =
  '/onboarding?resume=legal-declined';

export const buildOnboardingLegalAcceptanceRoute = (
  surface: Extract<
    LegalAcceptanceSurface,
    'post_auth' | 'pre_authoring'
  > = 'pre_authoring'
) =>
  ({
    pathname: '/legal-acceptance',
    params: {
      surface,
      next: ONBOARDING_LEGAL_ACCEPTED_RETURN,
      back: ONBOARDING_LEGAL_DECLINED_RETURN,
    },
  }) as const;

export const normaliseLegalReturnPath = (value: unknown): string => {
  const path = typeof value === 'string' ? value.trim() : '';
  if (
    path === '/onboarding' ||
    path === ONBOARDING_LEGAL_ACCEPTED_RETURN ||
    path === ONBOARDING_LEGAL_DECLINED_RETURN
  ) {
    return path;
  }
  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('://') ||
    path.includes('\n') ||
    path.includes('\r') ||
    /^\/(?:auth-required|email-auth|email-confirmation|forgot-password|invite-activation|join-event|join-promise|legal-acceptance|login|onboarding|register)(?:[/?#]|$)/.test(
      path
    )
  ) {
    return '/(tabs)';
  }
  return path;
};

export const resolveLegalReturnPath = (
  value: unknown,
  hasCompletedOnboarding: boolean
) => {
  const path = normaliseLegalReturnPath(value);
  if (
    !hasCompletedOnboarding &&
    path !== '/onboarding' &&
    path !== ONBOARDING_LEGAL_ACCEPTED_RETURN &&
    path !== ONBOARDING_LEGAL_DECLINED_RETURN
  ) {
    return '/onboarding';
  }
  return path;
};
