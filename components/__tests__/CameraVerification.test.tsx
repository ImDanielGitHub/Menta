jest.mock('@/hooks/usePromiseAccountability', () => ({
  usePromiseAccountability: () => ({ data: undefined }),
}));
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
import { AppState, Linking } from 'react-native';

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
const mockVideoPlayer = {
  loop: true,
  staysActiveInBackground: true,
  status: 'readyToPlay',
  play: mockVideoPlay,
  pause: mockVideoPause,
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};
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
    useVideoPlayer: (
      _source: unknown,
      setup: (player: typeof mockVideoPlayer) => void
    ) =>
      React.useMemo(() => {
        setup(mockVideoPlayer);
        return mockVideoPlayer;
      }, []),
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

describe('CameraVerification camera access', () => {
  beforeEach(async () => {
    mockVideoPlayer.loop = true;
    mockVideoPlayer.staysActiveInBackground = true;
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

  it('asks for the camera in one step and lets the system prompt follow', async () => {
    mockRequestCameraPermission.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    const onAccessGateChange = jest.fn();

    renderCameraVerification({ onAccessGateChange });

    expect(screen.getByTestId('camera-proof-permission')).toBeTruthy();
    expect(screen.getByText('Snap your proof')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta needs your camera to take the photo. You’ll see it before anything is sent.'
      )
    ).toBeTruthy();
    expect(onAccessGateChange).toHaveBeenLastCalledWith(true);
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Allow camera'));

    await waitFor(() =>
      expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1)
    );
  });

  it('points to Settings once the system will not ask again', async () => {
    mockCameraPermission = { granted: false, canAskAgain: false };
    const openSettings = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined);

    renderCameraVerification();

    expect(screen.getByText('Camera access is off')).toBeTruthy();
    fireEvent.press(screen.getByText('Open Settings'));

    await waitFor(() => expect(openSettings).toHaveBeenCalledTimes(1));
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
    openSettings.mockRestore();
  });

  it('opens the system picker without requesting broad library access', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    renderCameraVerification();

    fireEvent.press(screen.getByText('Choose a saved photo'));

    await waitFor(() =>
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1)
    );
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images'] })
    );
    expect(
      ImagePicker.requestMediaLibraryPermissionsAsync
    ).not.toHaveBeenCalled();
    // Choosing a saved photo never asks for camera access.
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
    expect(screen.queryByTestId('camera-proof-notice')).toBeNull();
  });

  it('goes back when the person is not ready', () => {
    const handlers = renderCameraVerification();

    fireEvent.press(screen.getByText('Not now'));

    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it('asks only for the microphone when video proof already has the camera', async () => {
    mockCameraPermission = { granted: true, canAskAgain: true };
    mockMicrophonePermission = { granted: false, canAskAgain: true };
    mockRequestMicrophonePermission.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });

    renderCameraVerification({ verificationType: 'video' });

    expect(screen.getByText('Record your proof')).toBeTruthy();
    fireEvent.press(screen.getByText('Allow microphone'));

    expect(await screen.findByText('Microphone access is off')).toBeTruthy();
    expect(mockRequestMicrophonePermission).toHaveBeenCalledTimes(1);
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });

  it('persists a library capture before preview and records consent only on send', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/picked.jpg' }],
    });
    const handlers = renderCameraVerification();

    fireEvent.press(screen.getByTestId('camera-proof-library'));

    expect(await screen.findByText('Check your photo')).toBeTruthy();
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
    expect(mockVideoPlayer.loop).toBe(false);
    expect(mockVideoPlayer.staysActiveInBackground).toBe(false);
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
