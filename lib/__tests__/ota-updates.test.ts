import { clearInitialURL, getLinkingURL } from 'expo-linking';
import * as Updates from 'expo-updates';
import { restartIntoDownloadedOta } from '@/lib/ota-updates';

jest.mock('expo-linking', () => ({
  clearInitialURL: jest.fn(),
  getLinkingURL: jest.fn(),
}));
jest.mock('expo-updates', () => ({ reloadAsync: jest.fn() }));

it('restarts from the app root instead of replaying a consumed widget launch URL', async () => {
  let retainedUrl: string | null = 'menta://home-widget';
  jest.mocked(getLinkingURL).mockImplementation(() => retainedUrl);
  jest.mocked(clearInitialURL).mockImplementation(() => {
    retainedUrl = null;
  });
  jest.mocked(Updates.reloadAsync).mockImplementation(async () => {
    expect(getLinkingURL()).toBeNull();
  });
  await restartIntoDownloadedOta();
  expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
});
