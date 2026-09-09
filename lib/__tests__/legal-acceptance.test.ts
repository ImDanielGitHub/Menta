import {
  acceptCurrentLegalDocuments,
  assertCurrentLegalAcceptance,
  decodeLegalAcceptanceStatus,
  getMyLegalAcceptanceStatus,
  buildOnboardingLegalAcceptanceRoute,
  LegalAcceptanceRequiredError,
  isLegalAcceptanceRequiredError,
  normaliseLegalReturnPath,
  ONBOARDING_LEGAL_ACCEPTED_RETURN,
  ONBOARDING_LEGAL_DECLINED_RETURN,
  resolveLegalReturnPath,
} from '@/lib/legal-acceptance';
import { supabase } from '@/lib/supabase';

const mockRpc = jest.fn();
let mockActiveUserId = 'user-a';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc(this: unknown, ...args: unknown[]) {
      return mockRpc.apply(this, args);
    },
  },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: {
    getState: () => ({
      user: mockActiveUserId ? { id: mockActiveUserId } : null,
    }),
  },
}));

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.8.0',
  nativeBuildVersion: '118',
}));

const current = {
  terms: {
    version: '2026-08-13',
    url: 'https://menta.quest/terms',
    effectiveAt: '2026-08-13T00:00:00.000Z',
  },
  privacy: {
    version: '2026-08-13',
    url: 'https://menta.quest/privacy',
    effectiveAt: '2026-08-13T00:00:00.000Z',
  },
  community_standards: {
    version: '2026-08-13',
    url: 'https://menta.quest/community-standards',
    effectiveAt: '2026-08-13T00:00:00.000Z',
  },
};

const missingStatus = {
  userId: 'user-a',
  accepted: false,
  requiresAcceptance: true,
  reason: 'missing_or_stale',
  current,
  enforcement: { promiseCreationRequired: true },
  receipt: null,
};

const acceptedStatus = {
  userId: 'user-a',
  accepted: true,
  requiresAcceptance: false,
  reason: 'current',
  current,
  enforcement: { promiseCreationRequired: true },
  receipt: {
    id: 'receipt-1',
    acceptedAt: '2026-08-13T01:00:00.000Z',
    surface: 'pre_authoring',
    appVersion: '1.8.0',
    appBuild: '118',
    platform: 'ios',
    locale: 'en-NZ',
  },
};

describe('legal acceptance client contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveUserId = 'user-a';
  });

  it('rejects malformed or contradictory server status', () => {
    expect(decodeLegalAcceptanceStatus(missingStatus)).not.toBeNull();
    expect(
      decodeLegalAcceptanceStatus({
        ...missingStatus,
        accepted: true,
        requiresAcceptance: true,
      })
    ).toBeNull();
    expect(
      decodeLegalAcceptanceStatus({
        ...missingStatus,
        current: { ...current, privacy: { version: 'missing-url' } },
      })
    ).toBeNull();
  });

  it('turns a missing or stale receipt into a typed authoring gate', async () => {
    mockRpc.mockResolvedValueOnce({ data: missingStatus, error: null });

    await expect(assertCurrentLegalAcceptance('user-a')).rejects.toBeInstanceOf(
      LegalAcceptanceRequiredError
    );
    expect(mockRpc).toHaveBeenCalledWith('get_my_legal_acceptance_status', {
      p_expected_user_id: 'user-a',
    });
    expect(mockRpc.mock.contexts[0]).toBe(supabase);
  });

  it('recognises the stable server gate error through Postgres metadata', () => {
    expect(
      isLegalAcceptanceRequiredError({
        code: 'P0001',
        message: 'LEGAL_ACCEPTANCE_REQUIRED',
      })
    ).toBe(true);
    expect(
      isLegalAcceptanceRequiredError({
        code: 'P0001',
        details: 'LEGAL_ACCEPTANCE_REQUIRED: current receipt missing',
      })
    ).toBe(true);
  });

  it('passes through a revoked-session rejection without treating it as consent state', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: '42501',
        message: 'AUTH_SESSION_REVOKED',
        details: null,
        hint: null,
      },
    });

    await expect(getMyLegalAcceptanceStatus('user-a')).rejects.toMatchObject({
      code: '42501',
      message: 'AUTH_SESSION_REVOKED',
    });
  });

  it('lets current receipts pass the client authoring gate', async () => {
    mockRpc.mockResolvedValueOnce({ data: acceptedStatus, error: null });

    await expect(assertCurrentLegalAcceptance('user-a')).resolves.toMatchObject(
      {
        accepted: true,
        requiresAcceptance: false,
        receipt: { id: 'receipt-1' },
      }
    );
  });

  it('submits server-provided versions and requires a confirmed receipt', async () => {
    const status = decodeLegalAcceptanceStatus(missingStatus)!;
    mockRpc.mockResolvedValueOnce({ data: acceptedStatus, error: null });

    const receipt = await acceptCurrentLegalDocuments(
      status,
      'pre_authoring',
      'user-a'
    );

    expect(receipt.receipt?.id).toBe('receipt-1');
    expect(mockRpc).toHaveBeenCalledWith(
      'accept_current_legal_documents',
      expect.objectContaining({
        p_expected_user_id: 'user-a',
        p_terms_version: '2026-08-13',
        p_privacy_policy_version: '2026-08-13',
        p_community_standards_version: '2026-08-13',
        p_acceptance_surface: 'pre_authoring',
        p_app_version: '1.8.0',
        p_app_build: '118',
      })
    );
  });

  it('keeps promise creation available while enforcement is in observe mode', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        ...missingStatus,
        enforcement: { promiseCreationRequired: false },
      },
      error: null,
    });

    await expect(assertCurrentLegalAcceptance('user-a')).resolves.toMatchObject(
      {
        requiresAcceptance: true,
        enforcement: { promiseCreationRequired: false },
      }
    );
  });

  it('rejects a receipt result when the active account changes in flight', async () => {
    mockRpc.mockImplementationOnce(async () => {
      mockActiveUserId = 'user-b';
      return { data: acceptedStatus, error: null };
    });

    await expect(
      acceptCurrentLegalDocuments(
        decodeLegalAcceptanceStatus(missingStatus)!,
        'pre_authoring',
        'user-a'
      )
    ).rejects.toMatchObject({ code: 'ACCOUNT_SCOPE_CHANGED' });
  });

  it('keeps legal and external destinations out of the return path', () => {
    expect(normaliseLegalReturnPath('/create-challenge?mode=solo')).toBe(
      '/create-challenge?mode=solo'
    );
    expect(normaliseLegalReturnPath(ONBOARDING_LEGAL_ACCEPTED_RETURN)).toBe(
      ONBOARDING_LEGAL_ACCEPTED_RETURN
    );
    expect(normaliseLegalReturnPath(ONBOARDING_LEGAL_DECLINED_RETURN)).toBe(
      ONBOARDING_LEGAL_DECLINED_RETURN
    );
    expect(
      normaliseLegalReturnPath('/onboarding?resume=legal-acceptance')
    ).toBe('/(tabs)');
    expect(normaliseLegalReturnPath('/onboarding?resume=anything-else')).toBe(
      '/(tabs)'
    );
    expect(normaliseLegalReturnPath('/legal-acceptance')).toBe('/(tabs)');
    expect(normaliseLegalReturnPath('/invite-activation')).toBe('/(tabs)');
    expect(normaliseLegalReturnPath('/join-event?eventId=event')).toBe(
      '/(tabs)'
    );
    expect(normaliseLegalReturnPath('/join-promise?code=secret')).toBe(
      '/(tabs)'
    );
    expect(normaliseLegalReturnPath('https://example.com')).toBe('/(tabs)');
    expect(normaliseLegalReturnPath('//example.com')).toBe('/(tabs)');
  });

  it('keeps incomplete accounts inside onboarding and separates accept from back', () => {
    expect(resolveLegalReturnPath('/create-challenge', false)).toBe(
      '/onboarding'
    );
    expect(
      resolveLegalReturnPath(ONBOARDING_LEGAL_ACCEPTED_RETURN, false)
    ).toBe(ONBOARDING_LEGAL_ACCEPTED_RETURN);
    expect(buildOnboardingLegalAcceptanceRoute()).toEqual({
      pathname: '/legal-acceptance',
      params: {
        surface: 'pre_authoring',
        next: ONBOARDING_LEGAL_ACCEPTED_RETURN,
        back: ONBOARDING_LEGAL_DECLINED_RETURN,
      },
    });
  });
});
