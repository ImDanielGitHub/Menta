const mockPolicyRead = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          abortSignal: () => ({ maybeSingle: () => mockPolicyRead() }),
        }),
      }),
    }),
  },
}));

const row = {
  key: 'menta_1_9_2_update_policy',
  schema_version: 1,
  release: '1.9.2',
  enabled: true,
  mode: 'required',
  ios_minimum_version: '1.9.5',
  ios_store_available: true,
  android_minimum_version: '1.9.2',
  android_store_available: false,
};

describe('native update authority cache', () => {
  beforeEach(() => {
    jest.resetModules();
    mockPolicyRead.mockReset();
  });

  it('bypasses a cached mandatory decision on foreground and respects a withdrawn policy', async () => {
    const { loadLegacyUpdatePolicy } =
      await import('@/lib/legacy-app-update-policy-client');
    mockPolicyRead.mockResolvedValueOnce({ data: row, error: null });
    const request = { currentVersion: '1.9.4', platform: 'ios' as const };
    await expect(loadLegacyUpdatePolicy(request)).resolves.toMatchObject({
      status: 'offer',
    });
    await expect(loadLegacyUpdatePolicy(request)).resolves.toMatchObject({
      status: 'offer',
    });
    expect(mockPolicyRead).toHaveBeenCalledTimes(1);

    mockPolicyRead.mockResolvedValueOnce({
      data: { ...row, enabled: false },
      error: null,
    });
    await expect(
      loadLegacyUpdatePolicy({ ...request, forceRefresh: true })
    ).resolves.toEqual({ status: 'kill_switch' });
    expect(mockPolicyRead).toHaveBeenCalledTimes(2);
  });

  it('does not retain either a failed refresh or a stale mandatory decision after network failure', async () => {
    const { loadLegacyUpdatePolicy } =
      await import('@/lib/legacy-app-update-policy-client');
    const request = { currentVersion: '1.9.4', platform: 'ios' as const };
    mockPolicyRead.mockResolvedValueOnce({ data: row, error: null });
    await loadLegacyUpdatePolicy(request);
    mockPolicyRead.mockRejectedValueOnce(new Error('network offline'));
    await expect(
      loadLegacyUpdatePolicy({ ...request, forceRefresh: true })
    ).resolves.toEqual({ status: 'authority_unknown' });

    mockPolicyRead.mockResolvedValueOnce({
      data: { ...row, enabled: false },
      error: null,
    });
    await expect(loadLegacyUpdatePolicy(request)).resolves.toEqual({
      status: 'kill_switch',
    });
    expect(mockPolicyRead).toHaveBeenCalledTimes(3);
  });
});
