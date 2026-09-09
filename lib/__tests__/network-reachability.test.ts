import { isNetworkStateOnline } from '@/lib/network-state';

describe('network reachability', () => {
  it('keeps a connected device online while internet reachability is unknown', () => {
    expect(
      isNetworkStateOnline({
        isConnected: true,
        isInternetReachable: null,
        type: 'wifi',
      })
    ).toBe(true);
  });

  it('uses the connected route when the secondary iOS probe is stale', () => {
    expect(
      isNetworkStateOnline({
        isConnected: false,
        isInternetReachable: null,
        type: 'wifi',
      })
    ).toBe(false);
    expect(
      isNetworkStateOnline({
        isConnected: true,
        isInternetReachable: false,
        type: 'wifi',
      })
    ).toBe(true);
  });

  it('treats an explicitly disconnected route as offline', () => {
    expect(
      isNetworkStateOnline({
        isConnected: false,
        isInternetReachable: true,
        type: 'none',
      })
    ).toBe(false);
  });
});
