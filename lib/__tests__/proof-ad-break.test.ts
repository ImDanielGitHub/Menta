import { AppState } from 'react-native';

const mockShowInterstitialAdDetailed = jest.fn();
const mockGetMyProAuthority = jest.fn();
const mockRpc = jest.fn();
const mockSentryCapture = jest.fn();

jest.mock('@/lib/ads', () => ({
  showInterstitialAdDetailed: (...args: unknown[]) =>
    mockShowInterstitialAdDetailed(...args),
}));

jest.mock('@/lib/profile-api', () => ({
  getMyProAuthority: (...args: unknown[]) => mockGetMyProAuthority(...args),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: (...args: unknown[]) => mockSentryCapture(...args),
}));

jest.mock('@/lib/posthog', () => ({
  trackProductOperation: jest.fn(),
}));

import {
  attemptProofAdBreak,
  decodeProofAdBreakHint,
  getProofAdBreakHint,
} from '@/lib/proof-ad-break';

describe('proof ad break authority', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'active',
    });
    mockGetMyProAuthority.mockResolvedValue({
      is_pro: false,
      reconciliation_pending: false,
    });
    mockShowInterstitialAdDetailed.mockResolvedValue({
      shown: false,
      reason: 'no_fill',
    });
  });

  it('decodes only a complete optional cadence hint', () => {
    expect(
      decodeProofAdBreakHint({ success: true, due: true, ordinal: 2 })
    ).toEqual({ due: true, ordinal: 2 });
    expect(decodeProofAdBreakHint({ due: false, ordinal: 3 })).toEqual({
      due: false,
      ordinal: 3,
    });
    expect(
      decodeProofAdBreakHint({ success: false, due: true, ordinal: 2 })
    ).toBeNull();
    expect(decodeProofAdBreakHint({ due: true, ordinal: 0 })).toBeNull();
    expect(decodeProofAdBreakHint({ due: 'yes', ordinal: 2 })).toBeNull();
  });

  it('treats a missing or malformed hint as optional metadata', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, due: 'yes', ordinal: 'second' },
      error: null,
    });

    await expect(getProofAdBreakHint('submission-2')).resolves.toBeNull();
    expect(mockRpc).toHaveBeenCalledWith('get_proof_ad_break_hint', {
      p_submission_id: 'submission-2',
    });
  });

  it.each([
    [null, 'pro_unknown'],
    [{ is_pro: false, reconciliation_pending: true }, 'pro_unknown'],
    [{ is_pro: true, reconciliation_pending: false }, 'pro'],
  ])(
    'fails closed before claiming when Pro authority is %p',
    async (authority, reason) => {
      mockGetMyProAuthority.mockResolvedValue(authority);

      await expect(attemptProofAdBreak('submission-2')).resolves.toMatchObject({
        attempted: false,
        claimed: false,
        shown: false,
        reason,
      });
      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockShowInterstitialAdDetailed).not.toHaveBeenCalled();
    }
  );

  it('consumes a claimed ordinal even when the ad has no fill', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, code: 'CLAIMED', ordinal: 2 },
      error: null,
    });

    await expect(attemptProofAdBreak('submission-2')).resolves.toEqual({
      attempted: true,
      claimed: true,
      shown: false,
      reason: 'ad_unavailable',
    });
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('claim_proof_ad_break', {
      p_submission_id: 'submission-2',
    });
    expect(mockShowInterstitialAdDetailed).toHaveBeenCalledTimes(1);
  });

  it('does not show an ordinal that the server already consumed', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, code: 'ALREADY_CLAIMED', ordinal: 2 },
      error: null,
    });

    await expect(attemptProofAdBreak('submission-2')).resolves.toMatchObject({
      attempted: false,
      claimed: false,
      shown: false,
      reason: 'not_due',
    });
    expect(mockShowInterstitialAdDetailed).not.toHaveBeenCalled();
  });

  it('allows only one claim attempt in flight', async () => {
    let releaseAuthority: ((value: unknown) => void) | null = null;
    mockGetMyProAuthority.mockImplementation(
      () =>
        new Promise(resolve => {
          releaseAuthority = resolve;
        })
    );
    mockRpc.mockResolvedValue({
      data: { success: false, code: 'NOT_DUE' },
      error: null,
    });

    const firstAttempt = attemptProofAdBreak('submission-2');
    await expect(attemptProofAdBreak('submission-4')).resolves.toMatchObject({
      reason: 'in_flight',
    });

    releaseAuthority?.({ is_pro: false, reconciliation_pending: false });
    await expect(firstAttempt).resolves.toMatchObject({ reason: 'not_due' });
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('does not claim after the app has left the foreground', async () => {
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      get: () => 'background',
    });

    await expect(attemptProofAdBreak('submission-2')).resolves.toMatchObject({
      reason: 'background',
    });
    expect(mockGetMyProAuthority).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
