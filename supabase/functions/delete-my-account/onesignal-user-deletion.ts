const ONESIGNAL_APP_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OneSignalUserDeletionResult =
  | { kind: 'deleted' }
  | { kind: 'already-absent' }
  | { kind: 'not-configured' };

export const deleteOneSignalUser = async (options: {
  appId: string;
  externalUserId: string;
  fetcher?: typeof fetch;
  restApiKey: string;
}): Promise<OneSignalUserDeletionResult> => {
  const appId = options.appId.trim();
  const externalUserId = options.externalUserId.trim();
  const restApiKey = options.restApiKey.trim();
  if (!ONESIGNAL_APP_ID.test(appId) || !restApiKey) {
    return { kind: 'not-configured' };
  }
  if (!externalUserId || externalUserId.length > 128) {
    throw new Error('OneSignal external user identifier is invalid.');
  }

  const response = await (options.fetcher ?? fetch)(
    `https://api.onesignal.com/apps/${appId}/users/by/external_id/${encodeURIComponent(externalUserId)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: restApiKey.startsWith('Key ')
          ? restApiKey
          : `Key ${restApiKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (response.status === 202) return { kind: 'deleted' };
  if (response.status === 404) return { kind: 'already-absent' };
  throw new Error(`OneSignal user deletion returned HTTP ${response.status}.`);
};
