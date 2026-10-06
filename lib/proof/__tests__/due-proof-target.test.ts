import { supabase } from '@/lib/supabase';
import { getMyFirstDueProofTarget } from '@/lib/proof/due-proof-target';

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

const mockRpc = jest.mocked(supabase.rpc);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getMyFirstDueProofTarget', () => {
  it('returns only the server-authorised target and verification type', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          challenge_id: '10000000-0000-4000-8000-000000000001',
          verification_type: 'video',
        },
      ],
      error: null,
    } as never);

    await expect(getMyFirstDueProofTarget('Pacific/Auckland')).resolves.toEqual(
      {
        challengeId: '10000000-0000-4000-8000-000000000001',
        verificationType: 'video',
      }
    );
    expect(mockRpc).toHaveBeenCalledWith('get_my_due_proof_targets_v1', {
      p_timezone: 'Pacific/Auckland',
    });
  });

  it('returns no target when the server reports nothing due', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null } as never);
    await expect(getMyFirstDueProofTarget('UTC')).resolves.toBeNull();
  });

  it('fails closed on a malformed response or an RPC error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ verification_type: 'photo' }],
      error: null,
    } as never);
    await expect(getMyFirstDueProofTarget('UTC')).resolves.toBeNull();

    const denied = new Error('AUTH_SESSION_REVOKED');
    mockRpc.mockResolvedValueOnce({ data: null, error: denied } as never);
    await expect(getMyFirstDueProofTarget('UTC')).rejects.toBe(denied);
  });
});
