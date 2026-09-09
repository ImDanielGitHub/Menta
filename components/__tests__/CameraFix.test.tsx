import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking } from 'react-native';

import CameraFix from '@/components/CameraFix';
import { ThemeProvider } from '@/constants/ThemeContext';
import { captureError, captureMessage } from '@/lib/sentry';

const mockPausePreview = jest.fn();
const mockUseCameraPermissions = jest.fn();
const mockUseIsFocused = jest.fn();
const mockCaptureError = captureError as jest.Mock;
const mockCaptureMessage = captureMessage as jest.Mock;

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: React.forwardRef(({ children, ...props }, ref) => {
      React.useImperativeHandle(ref, () => ({
        pausePreview: mockPausePreview,
      }));

      return (
        <View {...props} testID="invite-scanner-camera">
          {children}
        </View>
      );
    }),
    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

jest.mock('expo-router/react-navigation', () => ({
  useIsFocused: () => mockUseIsFocused(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const renderScanner = (
  props?: Partial<React.ComponentProps<typeof CameraFix>>
) => {
  const handlers = {
    onBarCodeScanned: jest.fn(),
    onClose: jest.fn(),
  };

  render(
    <ThemeProvider>
      <CameraFix {...handlers} {...props} />
    </ThemeProvider>
  );

  return handlers;
};

describe('CameraFix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true);
    mockUseCameraPermissions.mockReturnValue([null, jest.fn()]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps loading camera access recoverable inside the scanner modal', () => {
    const { onClose } = renderScanner();

    expect(screen.getByTestId('invite-scanner-loading')).toBeTruthy();
    expect(
      screen.getByTestId('invite-scanner-loading-visual', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(screen.getByText('Checking camera access')).toBeTruthy();
    expect(
      screen.getByText('Menta is getting the invite scanner ready.')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('invite-scanner-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('requests camera permission without leaving the invite flow', async () => {
    const requestPermission = jest.fn().mockResolvedValue({ granted: true });
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      requestPermission,
    ]);

    const { onClose } = renderScanner();

    expect(screen.getByTestId('invite-scanner-permission')).toBeTruthy();
    expect(screen.getByText('Scan an invite')).toBeTruthy();

    fireEvent.press(screen.getByTestId('invite-scanner-permission-action'));
    fireEvent.press(screen.getByTestId('invite-scanner-permission-close'));

    await waitFor(() => expect(requestPermission).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens system settings when camera permission is blocked', async () => {
    const openSettings = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined);
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: false },
      jest.fn(),
    ]);

    renderScanner();

    expect(screen.getByText('Camera access is off')).toBeTruthy();
    expect(screen.getByText('Open Settings')).toBeTruthy();

    fireEvent.press(screen.getByTestId('invite-scanner-permission-action'));

    await waitFor(() => expect(openSettings).toHaveBeenCalledTimes(1));

    openSettings.mockRestore();
  });

  it('pauses the camera preview and debounces duplicate QR scans', async () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);
    const onBarCodeScanned = jest.fn();

    renderScanner({ onBarCodeScanned });

    await waitFor(() =>
      expect(screen.getByTestId('invite-scanner-camera')).toBeTruthy()
    );

    fireEvent(screen.getByTestId('invite-scanner-camera'), 'barcodeScanned', {
      data: 'MENTA-GROUP-123',
      type: 'qr',
    });
    fireEvent(screen.getByTestId('invite-scanner-camera'), 'barcodeScanned', {
      data: 'MENTA-GROUP-123',
      type: 'qr',
    });

    expect(mockPausePreview).toHaveBeenCalledTimes(1);
    expect(onBarCodeScanned).toHaveBeenCalledTimes(1);
  });

  it('keeps native camera mount failures inside a retryable scanner state', async () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);

    renderScanner();

    await waitFor(() =>
      expect(screen.getByTestId('invite-scanner-camera')).toBeTruthy()
    );

    fireEvent(screen.getByTestId('invite-scanner-camera'), 'mountError', {
      message: 'Camera unavailable',
    });

    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Camera unavailable' }),
      expect.objectContaining({
        phase: 'mount',
        surface: 'invite_scanner',
      })
    );

    expect(screen.getByTestId('invite-scanner-error')).toBeTruthy();
    expect(screen.getByText('Scanner needs a reset')).toBeTruthy();

    fireEvent.press(screen.getByTestId('invite-scanner-retry'));

    expect(
      screen.getByTestId('invite-scanner-preparing-visual', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(screen.getByText('Preparing invite scanner...')).toBeTruthy();
  });

  it('reports a bounded scanner startup timeout', async () => {
    jest.useFakeTimers();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);

    renderScanner();

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });
    expect(screen.getByTestId('invite-scanner-camera')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(8000);
    });

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'camera_start_timeout',
      'warning',
      expect.objectContaining({
        extras: expect.objectContaining({ surface: 'invite_scanner' }),
      })
    );
    expect(screen.getByTestId('invite-scanner-error')).toBeTruthy();
  });

  it('reports a slow invite scanner when it eventually becomes ready', async () => {
    jest.useFakeTimers();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);

    renderScanner();

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    fireEvent(screen.getByTestId('invite-scanner-camera'), 'cameraReady');

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'camera_start_slow',
      'warning',
      expect.objectContaining({
        extras: expect.objectContaining({
          durationMs: expect.any(Number),
          surface: 'invite_scanner',
        }),
      })
    );
  });
});
