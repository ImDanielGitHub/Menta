const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

import {
  getMyProAuthority,
  getMyProfile,
  updateMyProfile,
} from '@/lib/profile-api';

const profile = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'daniel',
  display_name: 'Daniel',
  avatar_url: null,
  momenta_balance: 8,
  has_completed_onboarding: true,
  created_at: '2026-08-04T00:00:00.000Z',
  updated_at: '2026-08-04T00:00:00.000Z',
  is_pro: false,
  is_approved: true,
};

describe('profile RPC API', () => {
  beforeEach(() => mockRpc.mockReset());

  it('reads the caller profile through the private RPC', async () => {
    mockRpc.mockResolvedValue({ data: [profile], error: null });
    await expect(getMyProfile()).resolves.toEqual(profile);
    expect(mockRpc).toHaveBeenCalledWith('get_my_profile');
  });

  it('reads the receipt-aware Pro authority projection', async () => {
    const authority = { is_pro: false, reconciliation_pending: true };
    mockRpc.mockResolvedValue({ data: [authority], error: null });

    await expect(getMyProAuthority()).resolves.toEqual(authority);
    expect(mockRpc).toHaveBeenCalledWith('get_my_pro_authority');
  });

  it('updates only an allow-listed caller patch', async () => {
    mockRpc.mockResolvedValue({ data: [profile], error: null });
    await expect(
      updateMyProfile({ has_completed_onboarding: true })
    ).resolves.toEqual(profile);
    expect(mockRpc).toHaveBeenCalledWith('update_my_profile', {
      p_patch: { has_completed_onboarding: true },
    });
  });

  it('does not treat a successful empty RPC response as a profile', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await expect(updateMyProfile({ username: 'daniel' })).rejects.toThrow(
      'PROFILE_NOT_FOUND'
    );
  });
});
