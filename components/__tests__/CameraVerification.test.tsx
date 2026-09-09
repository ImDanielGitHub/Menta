import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { CameraVerification } from '@/components/CameraVerification';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getProofDraft } from '@/lib/proof-drafts';
import { captureError, captureMessage } from '@/lib/sentry';

jest.mock('@/components/proof', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    HoldToSendButton: ({
      label,
      onComplete,
    }: {
      label: string;
      onComplete: () => void;
    }) => (
      <Pressable testID="hold-to-send" onPress={onComplete}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

type PermissionState = {
  granted: boolean;
  canAskAgain: boolean;
} | null;

const mockRequestCameraPermission = jest.fn();
const mockRequestMicrophonePermission = jest.fn();
const mockUseIsFocused = jest.fn();
const mockPersistProofMediaLocally = jest.fn();
const mockGetDurableProofMedia = jest.fn();
const mockVideoPlay = jest.fn();
const mockVideoPause = jest.fn();
const mockCaptureError = captureError as jest.Mock;
const mockCaptureMessage = captureMessage as jest.Mock;
let mockCameraPermission: PermissionState = null;
let mockMicrophonePermission: PermissionState = null;
let mockUser: { id: string } | null = { id: 'user-123' };
let mockAllowsLoops = true;
let mockUsesIPadWorkspace = false;

jest.mock('@/components/ipad/ipad-workspace', () => {
  const actual = jest.requireActual('@/components/ipad/ipad-workspace');
  return {
    ...actual,
    useIPadPortraitWorkspace: () => mockUsesIPadWorkspace,
  };
});

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: React.forwardRef(({ children, ...props }, ref) => {
      React.useImperativeHandle(ref, () => ({
        recordAsync: jest.fn(),
        stopRecording: jest.fn(),
        takePictureAsync: jest.fn(),
      }));

      return (
        <View {...props} testID="proof-camera-view">
          {children}
        </View>
      );
    }),
    useCameraPermissions: () => [
      mockCameraPermission,
      mockRequestCameraPermission,
    ],
    useMicrophonePermissions: () => [
      mockMicrophonePermission,
      mockRequestMicrophonePermission,
    ],
  };
});

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  VideoExportPreset: {
    H264_1280x720: 6,
  },
}));

jest.mock('@/lib/services/proof-media-service', () => ({
  persistProofMediaLocally: (...args: unknown[]) =>
    mockPersistProofMediaLocally(...args),
  getDurableProofMedia: (...args: unknown[]) =>
    mockGetDurableProofMedia(...args),
}));

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    VideoView: (props: Record<string, unknown>) => (
      <View {...props} testID="proof-video-preview" />
    ),
    useVideoPlayer: () => ({
      loop: false,
      play: mockVideoPlay,
      pause: mockVideoPause,
    }),
  };
});

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => ({ allowsLoops: mockAllowsLoops }),
}));

jest.mock('expo-router/react-navigation', () => ({
  useIsFocused: () => mockUseIsFocused(),
}));

jest.mock('@/lib/app-state-manager', () => ({
  appStateManager: {
    addListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/lib/image-service', () => ({
  ImageService: {
    upload: jest.fn(),
  },
}));

jest.mock('@/components/ui/Toast', () => ({
  showToast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector?: (state: { user: typeof mockUser }) => unknown) => {
    const state = { user: mockUser };
    return selector ? selector(state) : state;
  },
}));

const renderCameraVerification = (
  props?: Partial<React.ComponentProps<typeof CameraVerification>>
) => {
  const handlers = {
    onVerificationComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  render(
    <ThemeProvider>
      <CameraVerification
        challengeId="challenge-123"
        verificationType="photo"
        clientEventId="11111111-1111-4111-8111-111111111111"
        clientTimeZone="Pacific/Auckland"
        {...handlers}
        {...props}
      />
    </ThemeProvider>
  );

  return handlers;
};

describe('CameraVerification permission primer', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockUseIsFocused.mockReturnValue(true);
    mockCameraPermission = { granted: false, canAskAgain: true };
    mockMicrophonePermission = { granted: true, canAskAgain: true };
    mockUser = { id: 'user-123' };
    mockAllowsLoops = true;
    mockUsesIPadWorkspace = false;
    mockPersistProofMediaLocally.mockResolvedValue({
      localMediaUri: 'file:///documents/11111111-proof.jpg',
      mediaType: 'photo',
      fileExt: 'jpg',
      contentType: 'image/jpeg',
    });
    mockGetDurableProofMedia.mockReturnValue({
      localMediaUri: 'file:///documents/11111111-proof.jpg',
      mediaType: 'photo',
      fileExt: 'jpg',
      contentType: 'image/jpeg',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a proof permission primer before requesting camera access', async () => {
    mockRequestCameraPermission.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });

    renderCameraVerification();

    expect(screen.getByTestId('camera-proof-primer')).toBeTruthy();
    expect(screen.getByText('Use the camera for proof')).toBeTruthy();
    expect(screen.getByText('Review camera access')).toBeTruthy();
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('camera-proof-primer-continue'));

    expect(screen.getByTestId('camera-proof-permission')).toBeTruthy();
    expect(screen.getByText('Allow camera access')).toBeTruthy();
    expect(
      screen.getByText(
        'Camera access lets Menta capture photo proof for this promise. You can also choose a saved photo from your library.'
      )
    ).toBeTruthy();
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('camera-proof-permission-action'));

    await waitFor(() =>
      expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1)
    );
  });

  it('opens the system picker without requesting broad library access', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    renderCameraVerification();

    fireEvent.press(screen.getByTestId('camera-proof-primer-continue'));

    fireEvent.press(screen.getByTestId('camera-proof-library'));

    await waitFor(() =>
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1)
    );
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images'] })
    );
    expect(
      ImagePicker.requestMediaLibraryPermissionsAsync
    ).not.toHaveBeenCalled();
    expect(screen.queryByTestId('camera-proof-notice')).toBeNull();
  });

  it('uses a focused microphone primer for video proof', async () => {
    mockCameraPermission = { granted: true, canAskAgain: true };
    mockMicrophonePermission = { granted: false, canAskAgain: true };
    mockRequestMicrophonePermission.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });

    renderCameraVerification({ verificationType: 'video' });

    expect(screen.getByText('Use the camera for proof')).toBeTruthy();
    fireEvent.press(screen.getByTestId('camera-proof-primer-continue'));

    expect(screen.getByText('Allow microphone access')).toBeTruthy();
    expect(
      screen.getByText(
        'Microphone access lets Menta capture video proof for this promise. You can also choose a saved video from your library.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('camera-proof-permission-action'));

    expect(await screen.findByText('Microphone access is off')).toBeTruthy();
    expect(mockRequestMicrophonePermission).toHaveBeenCalledTimes(1);
  });

  it('persists a library capture before preview and records consent only on send', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/picked.jpg' }],
    });
    const handlers = renderCameraVerification();

    fireEvent.press(screen.getByTestId('camera-proof-primer-continue'));
    fireEvent.press(screen.getByTestId('camera-proof-library'));

    expect(await screen.findByText('Check your proof')).toBeTruthy();
    const previewDraft = await getProofDraft(
      '11111111-1111-4111-8111-111111111111'
    );
    expect(previewDraft?.localMediaUri).toBe(
      'file:///documents/11111111-proof.jpg'
    );
    expect(previewDraft?.sendRequestedAt).toBeNull();
    expect(
      ImagePicker.requestMediaLibraryPermissionsAsync
    ).not.toHaveBeenCalled();
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaTypes: ['images'],
        videoExportPreset: 6,
      })
    );

    fireEvent.press(screen.getByTestId('hold-to-send'));

    await waitFor(() =>
      expect(handlers.onVerificationComplete).toHaveBeenCalledWith({
        clientEventId: '11111111-1111-4111-8111-111111111111',
        localMediaUri: 'file:///documents/11111111-proof.jpg',
        proofType: 'photo',
        proofValue: 'file:///documents/11111111-proof.jpg',
      })
    );
    expect(
      (await getProofDraft('11111111-1111-4111-8111-111111111111'))
        ?.sendRequestedAt
    ).toBeTruthy();
  });

  it('uses a media and decision workspace for a full portrait iPad', async () => {
    mockUsesIPadWorkspace = true;
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/picked.jpg' }],
    });

    renderCameraVerification();

    fireEvent.press(screen.getByTestId('camera-proof-primer-continue'));
    fireEvent.press(screen.getByTestId('camera-proof-library'));

    expect(
      await screen.findByTestId('media-proof-ipad-workspace')
    ).toBeTruthy();
    expect(screen.getByText('PHOTO PROOF')).toBeTruthy();
    expect(screen.getByText('SAVED ON THIS IPAD')).toBeTruthy();
    expect(screen.getByTestId('hold-to-send')).toBeTruthy();
  });

  it('does not autoplay or loop a saved video when Reduce Motion is enabled', async () => {
    mockCameraPermission = { granted: true, canAskAgain: true };
    mockMicrophonePermission = { granted: true, canAskAgain: true };
    mockAllowsLoops = false;
    mockGetDurableProofMedia.mockReturnValue({
      localMediaUri: 'file:///documents/saved-proof.mov',
      mediaType: 'video',
      fileExt: 'mov',
      contentType: 'video/quicktime',
    });

    renderCameraVerification({
      verificationType: 'video',
      initialLocalMediaUri: 'file:///documents/saved-proof.mov',
    });

    expect(await screen.findByTestId('proof-video-preview')).toBeTruthy();
    expect(mockVideoPause).toHaveBeenCalledTimes(1);
    expect(mockVideoPlay).not.toHaveBeenCalled();
  });

  it('captures native proof-camera mount failures without customer content', () => {
    const previousCurrentState = AppState.currentState;
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    mockCameraPermission = { granted: true, canAskAgain: true };

    renderCameraVerification();

    fireEvent(screen.getByTestId('proof-camera-view'), 'mountError', {
      message: 'Camera unavailable',
    });

    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Camera unavailable' }),
      expect.objectContaining({
        phase: 'mount',
        surface: 'proof_camera',
        verificationType: 'photo',
      })
    );
    expect(screen.getByText('Camera needs a reset')).toBeTruthy();
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: previousCurrentState,
    });
  });

  it('reports a bounded proof-camera startup timeout', () => {
    jest.useFakeTimers();
    const previousCurrentState = AppState.currentState;
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    mockCameraPermission = { granted: true, canAskAgain: true };

    renderCameraVerification();

    act(() => {
      jest.advanceTimersByTime(8000);
    });

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'camera_start_timeout',
      'warning',
      expect.objectContaining({
        extras: expect.objectContaining({
          surface: 'proof_camera',
          verificationType: 'photo',
        }),
      })
    );
    expect(screen.getByText('Camera needs a reset')).toBeTruthy();
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: previousCurrentState,
    });
  });

  it('reports a slow proof camera when it eventually becomes ready', () => {
    jest.useFakeTimers();
    const previousCurrentState = AppState.currentState;
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    mockCameraPermission = { granted: true, canAskAgain: true };

    renderCameraVerification();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    fireEvent(screen.getByTestId('proof-camera-view'), 'cameraReady');

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'camera_start_slow',
      'warning',
      expect.objectContaining({
        extras: expect.objectContaining({
          durationMs: 3000,
          surface: 'proof_camera',
        }),
      })
    );

    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: previousCurrentState,
    });
  });
});
