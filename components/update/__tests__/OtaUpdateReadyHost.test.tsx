import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Updates from 'expo-updates';

import { OtaUpdateReadyHost } from '@/components/update/OtaUpdateReadyHost';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

jest.mock('@/components/ui/modal/ModalCard', () => ({
  ModalCard: ({
    children,
    testID,
    visible,
  }: {
    children: React.ReactNode;
    testID: string;
    visible: boolean;
  }) => {
    const { View } = require('react-native') as typeof import('react-native');
    return visible ? <View testID={testID}>{children}</View> : null;
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native') as typeof import('react-native');
  return { SafeAreaView: View };
});

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

    const screen = render(
      <ThemeProvider>
        <OtaUpdateReadyHost enabled />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Menta update ready')).toBeTruthy();
    });
    expect(mockedUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockedUpdates.fetchUpdateAsync).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('ota-update-restart'));

    await waitFor(() => {
      expect(mockedUpdates.reloadAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('stays quiet when the installed update is current', async () => {
    const screen = render(
      <ThemeProvider>
        <OtaUpdateReadyHost enabled />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockedUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId('ota-update-ready')).toBeNull();
    expect(mockedUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
  });
});
