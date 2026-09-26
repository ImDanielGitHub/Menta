import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Updates from 'expo-updates';

import { OtaUpdateReadyHost } from '@/components/update/OtaUpdateReadyHost';
import { ThemeProvider } from '@/constants/ThemeContext';
import { ToastProvider, toastManager } from '@/components/ui/Toast';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ToastProvider>{children}</ToastProvider>
  </ThemeProvider>
);

const mockedUpdates = Updates as jest.Mocked<typeof Updates>;

describe('OtaUpdateReadyHost', () => {
  const originalDev = global.__DEV__;

  beforeAll(() => {
    global.__DEV__ = false;
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    toastManager.clear();
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({
      isAvailable: false,
      manifest: undefined,
      reason: undefined,
    });
    mockedUpdates.fetchUpdateAsync.mockResolvedValue({
      isNew: false,
      manifest: undefined,
    });
    mockedUpdates.reloadAsync.mockResolvedValue(undefined);
  });

  it('automatically offers a restart after downloading a newer OTA', async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValueOnce({
      isAvailable: true,
      manifest: {},
      reason: undefined,
    });
    mockedUpdates.fetchUpdateAsync.mockResolvedValueOnce({
      isNew: true,
      manifest: {},
    });

    const screen = render(<OtaUpdateReadyHost enabled />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Menta update ready')).toBeTruthy();
    });
    expect(mockedUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockedUpdates.fetchUpdateAsync).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: 'Restart Menta' }));

    await waitFor(() => {
      expect(mockedUpdates.reloadAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('stays quiet when the installed update is current', async () => {
    const screen = render(<OtaUpdateReadyHost enabled />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockedUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Menta update ready')).toBeNull();
    expect(mockedUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
  });

  it('waits for setup eligibility before notifying about a download that finished later', async () => {
    let finish!: (
      result: Awaited<ReturnType<typeof Updates.fetchUpdateAsync>>
    ) => void;
    mockedUpdates.checkForUpdateAsync.mockResolvedValueOnce({
      isAvailable: true,
      manifest: {},
      reason: undefined,
    });
    mockedUpdates.fetchUpdateAsync.mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      })
    );
    const screen = render(<OtaUpdateReadyHost enabled />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(mockedUpdates.fetchUpdateAsync).toHaveBeenCalledTimes(1)
    );
    screen.rerender(<OtaUpdateReadyHost enabled={false} />);
    await act(async () => {
      finish({ isNew: true, manifest: {} });
    });
    expect(screen.queryByText('Menta update ready')).toBeNull();
    screen.rerender(<OtaUpdateReadyHost enabled />);
    expect(await screen.findByText('Menta update ready')).toBeTruthy();
    expect(mockedUpdates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
  });
});
