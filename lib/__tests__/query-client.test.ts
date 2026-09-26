import { queryClient } from '@/lib/queryClient';
import { logError } from '@/lib/sentry';

jest.mock('@/lib/sentry', () => ({ logError: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: () => () => undefined,
}));
jest.mock('@/lib/app-state-manager', () => ({
  appStateManager: { addListener: () => () => undefined },
}));

describe('query failure boundaries', () => {
  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it('reports a failed background refresh and preserves the last successful result', async () => {
    const key = ['audit-background-refresh'];
    const error = new Error('service unavailable');
    queryClient.setQueryData(key, { count: 3 });
    await expect(
      queryClient.fetchQuery({
        queryKey: key,
        queryFn: async () => {
          throw error;
        },
        staleTime: 0,
        retry: false,
      })
    ).rejects.toBe(error);
    expect(queryClient.getQueryData(key)).toEqual({ count: 3 });
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(error, { source: 'react-query' });
  });

  it('does not repeat a potentially committed mutation after its response is lost', async () => {
    const write = jest.fn(async () => {
      throw new Error('response lost');
    });
    const mutation = queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: write });
    await expect(mutation.execute(undefined)).rejects.toThrow('response lost');
    expect(write).toHaveBeenCalledTimes(1);
  });
});
