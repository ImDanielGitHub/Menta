import * as Updates from 'expo-updates';
import { downloadAvailableOtaUpdate } from '@/lib/ota-updates';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  UpdateCheckResultNotAvailableReason: {
    NO_UPDATE_AVAILABLE_ON_SERVER: 'noUpdateAvailableOnServer',
  },
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

const check = jest.mocked(Updates.checkForUpdateAsync);
const fetchUpdate = jest.mocked(Updates.fetchUpdateAsync);

describe('OTA downloads', () => {
  beforeEach(() => {
    global.__DEV__ = false;
    jest.clearAllMocks();
  });
  afterEach(() => {
    global.__DEV__ = true;
  });

  it('downloads a rollback directive and offers recovery by restarting', async () => {
    check.mockResolvedValue({
      isAvailable: false,
      isRollBackToEmbedded: true,
      manifest: undefined,
      reason: undefined,
    });
    fetchUpdate.mockResolvedValue({
      isNew: false,
      isRollBackToEmbedded: true,
      manifest: undefined,
    });
    expect(await downloadAvailableOtaUpdate()).toBe('ready');
    expect(fetchUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when no update or rollback is available', async () => {
    check.mockResolvedValue({
      isAvailable: false,
      isRollBackToEmbedded: false,
      manifest: undefined,
      reason:
        Updates.UpdateCheckResultNotAvailableReason
          .NO_UPDATE_AVAILABLE_ON_SERVER,
    });
    expect(await downloadAvailableOtaUpdate()).toBe('current');
    expect(fetchUpdate).not.toHaveBeenCalled();
  });

  it('skips update checks in development', async () => {
    global.__DEV__ = true;
    expect(await downloadAvailableOtaUpdate()).toBe('unavailable');
    expect(check).not.toHaveBeenCalled();
  });
});
