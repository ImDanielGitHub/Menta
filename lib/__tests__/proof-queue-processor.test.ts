import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { networkManager } from '@/lib/network';
import { logError } from '@/lib/sentry';
import { attachQueuedProofSubmissionProcessor } from '@/lib/services/proof-submission-service';

jest.mock('@/lib/network', () => ({
  networkManager: {
    isOnline: jest.fn(() => true),
    checkConnectivity: jest.fn(async () => ({})),
    addListener: jest.fn(() => jest.fn()),
  },
}));

describe('foreground proof recovery', () => {
  let networkListener: (() => void) | undefined;
  let appListener: ((state: AppStateStatus) => void) | undefined;
  let cleanup: (() => void) | undefined;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    jest.mocked(networkManager.addListener).mockImplementation(listener => {
      networkListener = () =>
        listener({
          isConnected: true,
          isInternetReachable: false,
          type: 'wifi',
        });
      return jest.fn();
    });
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        appListener = listener;
        return { remove: jest.fn() };
      });
  });
  afterEach(() => {
    cleanup?.();
    jest.restoreAllMocks();
  });

  it('contains a failed storage read and retries on the next foreground event', async () => {
    jest
      .mocked(AsyncStorage.getItem)
      .mockRejectedValueOnce(new Error('Storage temporarily unavailable'));
    cleanup = attachQueuedProofSubmissionProcessor('user-1');
    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Queued proof recovery failed' }),
        expect.any(Object)
      )
    );
    const reads = jest.mocked(AsyncStorage.getItem).mock.calls.length;
    appListener?.('active');
    await waitFor(() =>
      expect(
        jest.mocked(AsyncStorage.getItem).mock.calls.length
      ).toBeGreaterThan(reads)
    );
  });

  it('contains a failed initial connectivity check', async () => {
    jest
      .mocked(networkManager.checkConnectivity)
      .mockRejectedValueOnce(new Error('Connectivity unavailable'));
    cleanup = attachQueuedProofSubmissionProcessor('user-1');
    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Proof recovery connectivity check failed',
        }),
        expect.any(Object)
      )
    );
  });

  it('retries when the network manager considers the route online despite a stale reachability probe', async () => {
    cleanup = attachQueuedProofSubmissionProcessor('user-1');
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    const reads = jest.mocked(AsyncStorage.getItem).mock.calls.length;
    networkListener?.();
    await waitFor(() =>
      expect(
        jest.mocked(AsyncStorage.getItem).mock.calls.length
      ).toBeGreaterThan(reads)
    );
  });
});
