import { translate } from '@/lib/localization';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
  addEventListener: jest.fn(),
}));

const { handleNetworkError } =
  jest.requireActual<typeof import('@/lib/network')>('@/lib/network');

describe('auth connection loss copy', () => {
  it.each([
    'fetch failed: UnexpectedException: The network connection was lost. (at ExpoModulesCore/Promise.swift:56)',
    'fetch failed',
    'Failed to fetch',
    'Load failed',
  ])('shows a connection message for %s', message => {
    expect(
      handleNetworkError({
        name: 'AuthRetryableFetchError',
        message,
        status: 0,
      })
    ).toBe(translate('en-NZ', 'domain.network.error'));
  });

  it('keeps server failure details distinct from connection loss', () => {
    expect(
      handleNetworkError({
        name: 'AuthRetryableFetchError',
        message: 'HTTP 503',
        status: 503,
      })
    ).toBe('HTTP 503');
  });
});
