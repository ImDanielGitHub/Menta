import { deleteOneSignalUser } from '../onesignal-user-deletion.ts';

const options = {
  appId: '11111111-2222-4333-8444-555555555555',
  externalUserId: 'user-1',
  restApiKey: 'os_v2_secret',
};

describe('OneSignal account deletion', () => {
  it('deletes the external user with app-key authentication', async () => {
    const fetcher = jest.fn().mockResolvedValue({ status: 202 });

    await expect(deleteOneSignalUser({ ...options, fetcher })).resolves.toEqual(
      {
        kind: 'deleted',
      }
    );
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.onesignal.com/apps/11111111-2222-4333-8444-555555555555/users/by/external_id/user-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Key os_v2_secret' }),
      })
    );
  });

  it('accepts a provider 404 as an already-clean account', async () => {
    await expect(
      deleteOneSignalUser({
        ...options,
        fetcher: jest.fn().mockResolvedValue({ status: 404 }),
      })
    ).resolves.toEqual({ kind: 'already-absent' });
  });

  it('stays inert when provider configuration is unavailable', async () => {
    await expect(
      deleteOneSignalUser({ ...options, restApiKey: '' })
    ).resolves.toEqual({ kind: 'not-configured' });
  });

  it('blocks deletion when a configured provider cannot confirm cleanup', async () => {
    await expect(
      deleteOneSignalUser({
        ...options,
        fetcher: jest.fn().mockResolvedValue({ status: 503 }),
      })
    ).rejects.toThrow('HTTP 503');
  });
});
