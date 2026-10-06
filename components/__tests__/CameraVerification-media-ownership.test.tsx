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
import * as ImageManipulator from 'expo-image-manipulator';
import { getDurableProofMedia } from '@/lib/services/proof-media-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { CameraVerification } from '@/components/CameraVerification';
import { ThemeProvider } from '@/constants/ThemeContext';
import {
  createProofDraft,
  getProofDraft,
  updateProofDraft,
} from '@/lib/proof-drafts';

jest.mock('@/components/proof', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    HoldToSendButton: ({
      label,
      onComplete,
      leadingAction,
    }: {
      label: string;
      onComplete: () => void;
      leadingAction?: { onPress: () => void; testID: string };
    }) => (
      <>
        <Pressable testID="hold-to-send" onPress={onComplete}>
          <Text>{label}</Text>
        </Pressable>
        {leadingAction ? (
          <Pressable
            testID={leadingAction.testID}
            onPress={leadingAction.onPress}
          />
        ) : null}
      </>
    ),
  };
});

type PermissionState = {
  granted: boolean;
  canAskAgain: boolean;
} | null;

const mockTakePicture = jest.fn();
const mockRecord = jest.fn();
const mockRequestCameraPermission = jest.fn();
const mockRequestMicrophonePermission = jest.fn();
const mockUseIsFocused = jest.fn();
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
        recordAsync: mockRecord,
        stopRecording: jest.fn(),
        takePictureAsync: mockTakePicture,
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
  useAuthStore: Object.assign(
    (selector?: (state: { user: typeof mockUser }) => unknown) => {
      const state = { user: mockUser };
      return selector ? selector(state) : state;
    },
    { getState: () => ({ user: mockUser }) }
  ),
}));

jest.mock('expo-file-system', () => {
  const files = new Map<string, { exists: boolean; base64?: string }>();
  const directories = new Set<string>();
  const copy = jest.fn();

  const partUri = (part: unknown): string => {
    if (typeof part === 'string') return part;
    if (
      part &&
      typeof part === 'object' &&
      'uri' in part &&
      typeof part.uri === 'string'
    ) {
      return part.uri;
    }
    return String(part);
  };

  const joinUri = (parts: unknown[]): string =>
    parts
      .map(partUri)
      .map((part, index) =>
        index === 0 ? part.replace(/\/$/, '') : part.replace(/^\//, '')
      )
      .join('/');

  class MockDirectory {
    uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinUri(parts);
    }

    get exists() {
      return directories.has(this.uri);
    }

    create() {
      directories.add(this.uri);
    }
  }

  class MockFile {
    uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinUri(parts);
    }

    get exists() {
      return files.get(this.uri)?.exists ?? false;
    }

    get extension() {
      const filename = this.uri.split('/').pop() ?? '';
      const extensionStart = filename.lastIndexOf('.');
      return extensionStart >= 0 ? filename.slice(extensionStart) : '';
    }

    copy(destination: MockFile, options?: { overwrite?: boolean }) {
      return copy(this, destination, options);
    }

    async base64() {
      return files.get(this.uri)?.base64 ?? '';
    }

    delete() {
      files.delete(this.uri);
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { document: 'file:///documents' },
    __mock: { copy, directories, files },
  };
});

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

type MockFileEntry = { exists: boolean; base64?: string };
type MockFile = { uri: string };

const fileSystemMock = (
  jest.requireMock('expo-file-system') as {
    __mock: {
      copy: jest.Mock<
        Promise<void>,
        [MockFile, MockFile, { overwrite?: boolean }]
      >;
      directories: Set<string>;
      files: Map<string, MockFileEntry>;
    };
  }
).__mock;

const manipulateMock = ImageManipulator.ImageManipulator
  .manipulate as jest.Mock;

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const draftId = '11111111-1111-4111-8111-111111111111';
const captureProps = {
  challengeId: 'challenge-123',
  verificationType: 'photo' as const,
  clientEventId: draftId,
  clientTimeZone: 'Pacific/Auckland',
};
const view = (
  key: string,
  overrides: Partial<React.ComponentProps<typeof CameraVerification>> = {}
) => (
  <ThemeProvider>
    <CameraVerification
      key={key}
      {...captureProps}
      onVerificationComplete={jest.fn()}
      onCancel={jest.fn()}
      {...overrides}
    />
  </ThemeProvider>
);
const installPhotos = (stage: 'render' | 'save' | 'copy' = 'render') => {
  fileSystemMock.files.set('file:///tmp/a.jpg', {
    exists: true,
    base64: 'A-private-bytes',
  });
  fileSystemMock.files.set('file:///tmp/b.jpg', {
    exists: true,
    base64: 'B-private-bytes',
  });
  const heldRender = createDeferred<{
    saveAsync: () => Promise<{ uri: string }>;
  }>();
  const heldSave = createDeferred<{ uri: string }>();
  const heldCopy = createDeferred<void>();
  if (stage === 'copy') {
    fileSystemMock.copy.mockImplementation(
      async (source, destination, options) => {
        if (source.uri === 'file:///tmp/a.jpg') await heldCopy.promise;
        if (fileSystemMock.files.has(destination.uri) && !options?.overwrite)
          throw new Error('collision');
        fileSystemMock.files.set(destination.uri, {
          ...fileSystemMock.files.get(source.uri)!,
          exists: true,
        });
      }
    );
  }
  manipulateMock.mockImplementation((uri: string) => ({
    resize: jest.fn(),
    renderAsync: () =>
      uri === 'file:///tmp/a.jpg' && stage === 'render'
        ? heldRender.promise
        : Promise.resolve({
            saveAsync: () =>
              uri === 'file:///tmp/a.jpg' && stage === 'save'
                ? heldSave.promise
                : Promise.resolve({ uri }),
          }),
  }));
  return () => {
    heldRender.resolve({
      saveAsync: async () => ({ uri: 'file:///tmp/a.jpg' }),
    });
    heldSave.resolve({ uri: 'file:///tmp/a.jpg' });
    heldCopy.resolve();
  };
};
const choosePhoto = (uri: string) => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri }],
  } as ImagePicker.ImagePickerResult);
};

describe('capture media ownership interleavings', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockReset();
    mockTakePicture.mockReset();
    mockRecord.mockReset();
    await AsyncStorage.clear();
    fileSystemMock.files.clear();
    fileSystemMock.directories.clear();
    manipulateMock.mockReset();
    fileSystemMock.copy.mockImplementation(
      async (source, destination, options) => {
        if (
          fileSystemMock.files.get(destination.uri)?.exists &&
          !options?.overwrite
        ) {
          throw new Error('File already exists');
        }
        fileSystemMock.files.set(destination.uri, {
          ...fileSystemMock.files.get(source.uri)!,
          exists: true,
        });
      }
    );
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    mockCameraPermission = { granted: false, canAskAgain: true };
    mockMicrophonePermission = { granted: true, canAskAgain: true };
    mockUseIsFocused.mockReturnValue(true);
    mockUser = { id: 'user-123' };
  });

  it.each(
    ['render', 'save', 'copy'].flatMap(stage =>
      ['account', 'promise', 'same-context remount'].map(change => [
        stage,
        change,
      ])
    )
  )(
    'keeps B draft bytes and URI when A pauses at %s across %s changes',
    async (stage, change) => {
      const releaseA = installPhotos(stage as 'render' | 'save' | 'copy');
      const oldSaved = jest.fn();
      const oldSent = jest.fn();
      const result = render(
        view('a', {
          onLocalDraftSaved: oldSaved,
          onVerificationComplete: oldSent,
        })
      );
      choosePhoto('file:///tmp/a.jpg');
      fireEvent.press(screen.getByTestId('camera-proof-library'));
      await waitFor(() =>
        expect(manipulateMock).toHaveBeenCalledWith('file:///tmp/a.jpg')
      );

      if (change === 'account') mockUser = { id: 'user-b' };
      const currentChallenge =
        change === 'promise' ? 'challenge-b' : 'challenge-123';
      const newSaved = jest.fn();
      const newSent = jest.fn();
      result.rerender(
        view('b', {
          challengeId: currentChallenge,
          onLocalDraftSaved: newSaved,
          onVerificationComplete: newSent,
        })
      );
      choosePhoto('file:///tmp/b.jpg');
      fireEvent.press(screen.getByTestId('camera-proof-library'));
      await waitFor(() => expect(newSaved).toHaveBeenCalledTimes(1));
      const before = await getProofDraft(draftId);
      expect(before?.userId).toBe(mockUser!.id);
      expect(before?.challengeId).toBe(currentChallenge);
      expect(fileSystemMock.files.get(before!.localMediaUri!)?.base64).toBe(
        'B-private-bytes'
      );
      expect(before?.sendRequestedAt).toBeNull();

      await act(async () => {
        releaseA();
      });
      await waitFor(() => expect(fileSystemMock.copy).toHaveBeenCalledTimes(2));
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      const after = await getProofDraft(draftId);
      expect(after).toEqual(before);
      expect(fileSystemMock.files.get(before!.localMediaUri!)?.base64).toBe(
        'B-private-bytes'
      );
      expect(
        screen.getByLabelText('Captured photo proof').props.source.uri
      ).toBe(before?.localMediaUri);
      expect(oldSaved).not.toHaveBeenCalled();
      expect(oldSent).not.toHaveBeenCalled();
      expect(newSent).not.toHaveBeenCalled();
      expect(
        [...fileSystemMock.files.keys()].filter(uri =>
          uri.startsWith('file:///documents/menta-proof-drafts/')
        )
      ).toEqual([before?.localMediaUri]);
    }
  );

  it('keeps the newer same-context capture when an earlier callback finishes last', async () => {
    const releaseA = installPhotos();
    const saved = jest.fn();
    render(view('same', { onLocalDraftSaved: saved }));
    const pick = screen
      .UNSAFE_getAllByType(AppButton)
      .find(button => button.props.testID === 'camera-proof-library')!.props
      .onPress;
    choosePhoto('file:///tmp/a.jpg');
    let first!: Promise<void>;
    act(() => {
      first = pick();
    });
    await waitFor(() =>
      expect(manipulateMock).toHaveBeenCalledWith('file:///tmp/a.jpg')
    );
    choosePhoto('file:///tmp/b.jpg');
    await act(async () => {
      await pick();
    });
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    const before = await getProofDraft(draftId);
    expect(fileSystemMock.files.get(before!.localMediaUri!)?.base64).toBe(
      'B-private-bytes'
    );
    await act(async () => {
      releaseA();
      await first;
    });
    await waitFor(() =>
      expect(
        [...fileSystemMock.files.keys()].filter(uri =>
          uri.startsWith('file:///documents/menta-proof-drafts/')
        )
      ).toEqual([before?.localMediaUri])
    );
    expect(await getProofDraft(draftId)).toEqual(before);
    expect(fileSystemMock.files.get(before!.localMediaUri!)?.base64).toBe(
      'B-private-bytes'
    );
    expect(saved).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Captured photo proof').props.source.uri).toBe(
      before?.localMediaUri
    );
  });

  it('rejects account authority lost during preparation even before a React rerender', async () => {
    const releaseA = installPhotos();
    const saved = jest.fn();
    render(view('same', { onLocalDraftSaved: saved }));
    const pick = screen
      .UNSAFE_getAllByType(AppButton)
      .find(button => button.props.testID === 'camera-proof-library')!.props
      .onPress;
    choosePhoto('file:///tmp/a.jpg');
    let pending!: Promise<void>;
    act(() => {
      pending = pick();
    });
    await waitFor(() =>
      expect(manipulateMock).toHaveBeenCalledWith('file:///tmp/a.jpg')
    );
    mockUser = { id: 'user-b' };
    await act(async () => {
      releaseA();
      await pending;
    });
    await waitFor(() => expect(fileSystemMock.copy).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(await getProofDraft(draftId)).toBeNull();
    expect(saved).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Captured photo proof')).toBeNull();
    expect(
      [...fileSystemMock.files.keys()].filter(uri =>
        uri.startsWith('file:///documents/menta-proof-drafts/')
      )
    ).toEqual([]);
  });

  it.each(['cancel', 'unmount'])(
    'cleans only the fresh unadopted file after %s during photo render',
    async action => {
      const release = installPhotos();
      const saved = jest.fn();
      const result = render(view('cancel', { onLocalDraftSaved: saved }));
      choosePhoto('file:///tmp/a.jpg');
      fireEvent.press(screen.getByTestId('camera-proof-library'));
      await waitFor(() => expect(manipulateMock).toHaveBeenCalled());
      if (action === 'cancel')
        fireEvent.press(screen.getByTestId('camera-proof-not-now'));
      else result.unmount();
      await act(async () => {
        release();
      });
      await waitFor(() => expect(fileSystemMock.copy).toHaveBeenCalledTimes(1));
      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
      });
      expect(await getProofDraft(draftId)).toBeNull();
      expect(saved).not.toHaveBeenCalled();
      expect(fileSystemMock.files.get('file:///tmp/a.jpg')?.base64).toBe(
        'A-private-bytes'
      );
      expect(
        [...fileSystemMock.files.keys()].filter(uri =>
          uri.includes('/menta-proof-drafts/')
        )
      ).toEqual([]);
    }
  );

  it.each(['picker', 'photo-camera', 'video-camera'])(
    'rejects %s acquisition returning after cancellation',
    async source => {
      const acquisition = createDeferred<{ uri: string }>();
      const picker = createDeferred<ImagePicker.ImagePickerResult>();
      const saved = jest.fn();
      if (source !== 'picker')
        mockCameraPermission = { granted: true, canAskAgain: true };
      mockTakePicture.mockReturnValue(acquisition.promise);
      mockRecord.mockReturnValue(acquisition.promise);
      jest
        .mocked(ImagePicker.launchImageLibraryAsync)
        .mockReturnValueOnce(picker.promise);
      const result = render(
        view('acquire', {
          onLocalDraftSaved: saved,
          verificationType: source === 'video-camera' ? 'video' : 'photo',
        })
      );
      if (source === 'picker')
        fireEvent.press(screen.getByTestId('camera-proof-library'));
      else {
        fireEvent(screen.getByTestId('proof-camera-view'), 'cameraReady');
        fireEvent.press(
          screen.getByLabelText(
            source === 'video-camera'
              ? 'Start recording proof video'
              : 'Capture proof photo'
          )
        );
        await waitFor(() =>
          expect(
            source === 'video-camera' ? mockRecord : mockTakePicture
          ).toHaveBeenCalled()
        );
      }
      result.unmount();
      await act(async () => {
        acquisition.resolve({ uri: 'file:///tmp/a.jpg' });
        picker.resolve({
          canceled: false,
          assets: [{ uri: 'file:///tmp/a.jpg', width: 1, height: 1 }],
        });
      });
      expect(saved).not.toHaveBeenCalled();
      expect(fileSystemMock.copy).not.toHaveBeenCalled();
      expect(manipulateMock).not.toHaveBeenCalled();
      expect(await getProofDraft(draftId)).toBeNull();
    }
  );

  it('keeps newer video bytes when an old native copy finishes after remount', async () => {
    const copy = createDeferred<void>();
    fileSystemMock.files.set('file:///tmp/a.mov', {
      exists: true,
      base64: 'old-video',
    });
    fileSystemMock.files.set('file:///tmp/b.mp4', {
      exists: true,
      base64: 'new-video',
    });
    fileSystemMock.copy.mockImplementation(async (source, destination) => {
      if (source.uri.endsWith('a.mov')) await copy.promise;
      fileSystemMock.files.set(destination.uri, {
        ...fileSystemMock.files.get(source.uri)!,
        exists: true,
      });
    });
    const oldSaved = jest.fn();
    const saved = jest.fn();
    const result = render(
      view('old-video', {
        verificationType: 'video',
        onLocalDraftSaved: oldSaved,
      })
    );
    choosePhoto('file:///tmp/a.mov');
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(() => expect(fileSystemMock.copy).toHaveBeenCalledTimes(1));
    result.rerender(
      view('new-video', { verificationType: 'video', onLocalDraftSaved: saved })
    );
    choosePhoto('file:///tmp/b.mp4');
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    const before = await getProofDraft(draftId);
    await act(async () => {
      copy.resolve();
    });
    await waitFor(() =>
      expect(
        [...fileSystemMock.files.keys()].filter(uri =>
          uri.includes('/menta-proof-drafts/')
        )
      ).toEqual([before?.localMediaUri])
    );
    expect(await getProofDraft(draftId)).toEqual(before);
    expect(fileSystemMock.files.get(before!.localMediaUri!)?.base64).toBe(
      'new-video'
    );
    expect(oldSaved).not.toHaveBeenCalled();
  });

  it.each(['lookup', 'final-write'])(
    'rechecks live account after delayed %s storage read',
    async boundary => {
      const release = installPhotos();
      release();
      const realGet = (
        AsyncStorage.getItem as jest.Mock
      ).getMockImplementation()!;
      const held = createDeferred<string | null>();
      let reads = 0;
      (AsyncStorage.getItem as jest.Mock).mockImplementation((...args) => {
        reads += 1;
        return reads === (boundary === 'lookup' ? 1 : 3)
          ? held.promise
          : realGet(...args);
      });
      const saved = jest.fn();
      render(view('guard', { onLocalDraftSaved: saved }));
      choosePhoto('file:///tmp/b.jpg');
      fireEvent.press(screen.getByTestId('camera-proof-library'));
      await waitFor(() => expect(reads).toBe(boundary === 'lookup' ? 1 : 3));
      mockUser = { id: 'other' };
      await act(async () => {
        held.resolve(null);
      });
      (AsyncStorage.getItem as jest.Mock).mockImplementation(realGet);
      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
      });
      expect(await getProofDraft(draftId)).toBeNull();
      expect(saved).not.toHaveBeenCalled();
      expect(screen.queryByLabelText('Captured photo proof')).toBeNull();
      expect(
        [...fileSystemMock.files.keys()].filter(uri =>
          uri.includes('/menta-proof-drafts/')
        )
      ).toEqual([]);
    }
  );

  it.each(['promise', 'latest'])(
    'rejects capture when %s changes during final queued draft read',
    async change => {
      const release = installPhotos();
      release();
      const originalGet = (
        AsyncStorage.getItem as jest.Mock
      ).getMockImplementation()!;
      const held = createDeferred<string | null>();
      let reads = 0;
      (AsyncStorage.getItem as jest.Mock).mockImplementation((...args) => {
        reads += 1;
        return reads === 3 ? held.promise : originalGet(...args);
      });
      const saved = jest.fn();
      const result = render(view('guard-scope', { onLocalDraftSaved: saved }));
      const pick = screen
        .UNSAFE_getAllByType(AppButton)
        .find(button => button.props.testID === 'camera-proof-library')!.props
        .onPress;
      choosePhoto('file:///tmp/a.jpg');
      act(() => pick());
      await waitFor(() => expect(reads).toBe(3));
      if (change === 'promise')
        result.rerender(
          view('guard-scope', {
            challengeId: 'different-promise',
            onLocalDraftSaved: saved,
          })
        );
      else {
        choosePhoto('file:///tmp/b.jpg');
        act(() => pick());
      }
      await act(async () => {
        held.resolve(null);
      });
      (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
      if (change === 'latest') {
        await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
        const draft = await getProofDraft(draftId);
        expect(fileSystemMock.files.get(draft!.localMediaUri!)?.base64).toBe(
          'B-private-bytes'
        );
        expect(draft?.sendRequestedAt).toBeNull();
      } else {
        await act(async () => {
          await new Promise(r => setTimeout(r, 0));
        });
        expect(await getProofDraft(draftId)).toBeNull();
        expect(saved).not.toHaveBeenCalled();
      }
    }
  );

  it('keeps adopted media through a parent callback remount and reopens without copying', async () => {
    const release = installPhotos();
    release();
    const result = render(view('before'));
    const saved = jest.fn(
      (draft: Awaited<ReturnType<typeof createProofDraft>>) => {
        result.rerender(
          view(draft.localMediaUri!, {
            initialLocalMediaUri: draft.localMediaUri,
          })
        );
      }
    );
    result.rerender(view('before', { onLocalDraftSaved: saved }));
    choosePhoto('file:///tmp/b.jpg');
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(() =>
      expect(screen.getByTestId('hold-to-send')).toBeTruthy()
    );
    const draft = await getProofDraft(draftId);
    expect(fileSystemMock.files.get(draft!.localMediaUri!)?.base64).toBe(
      'B-private-bytes'
    );
    expect(fileSystemMock.copy).toHaveBeenCalledTimes(1);
    expect(saved).toHaveBeenCalledTimes(1);
  });

  it('canceled picker and failed rendering neither save a draft nor request send consent', async () => {
    const saved = jest.fn();
    const complete = jest.fn();
    render(
      view('cancel-picker', {
        onLocalDraftSaved: saved,
        onVerificationComplete: complete,
      })
    );
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValueOnce({ canceled: true, assets: null });
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    choosePhoto('file:///tmp/a.jpg');
    manipulateMock.mockReturnValue({
      resize: jest.fn(),
      renderAsync: () => Promise.reject(new Error('render failed')),
    });
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(() => expect(screen.getByText('render failed')).toBeTruthy());
    expect(await getProofDraft(draftId)).toBeNull();
    expect(saved).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(fileSystemMock.copy).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'retains possibly adopted file on rejected metadata write, persisted=%s',
    async persisted => {
      const release = installPhotos();
      release();
      const realSet = (
        AsyncStorage.setItem as jest.Mock
      ).getMockImplementation()!;
      (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
        async (...args) => {
          if (persisted) await realSet(...args);
          throw new Error('native write failed after invocation');
        }
      );
      const saved = jest.fn();
      render(view('ambiguous', { onLocalDraftSaved: saved }));
      choosePhoto('file:///tmp/b.jpg');
      fireEvent.press(screen.getByTestId('camera-proof-library'));
      await waitFor(() =>
        expect(screen.getByText('That proof could not be opened')).toBeTruthy()
      );
      expect(saved).not.toHaveBeenCalled();
      expect(screen.queryByLabelText('Captured photo proof')).toBeNull();
      const uris = [...fileSystemMock.files.keys()].filter(uri =>
        uri.includes('/menta-proof-drafts/')
      );
      expect(uris).toHaveLength(1);
      expect(fileSystemMock.files.get(uris[0])?.base64).toBe('B-private-bytes');
      const draft = await getProofDraft(draftId);
      if (persisted) expect(draft?.localMediaUri).toBe(uris[0]);
      else expect(draft).toBeNull();
    }
  );

  it('preserves adopted offline draft when scope changes while write response is pending', async () => {
    const release = installPhotos();
    release();
    const realSet = (
      AsyncStorage.setItem as jest.Mock
    ).getMockImplementation()!;
    const written = createDeferred<void>();
    (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
      async (...args) => {
        await realSet(...args);
        await written.promise;
      }
    );
    const saved = jest.fn();
    const result = render(view('write', { onLocalDraftSaved: saved }));
    choosePhoto('file:///tmp/b.jpg');
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(async () =>
      expect((await getProofDraft(draftId))?.localMediaUri).toBeTruthy()
    );
    result.unmount();
    await act(async () => {
      written.resolve();
    });
    expect(saved).not.toHaveBeenCalled();
    const draft = await getProofDraft(draftId);
    expect(fileSystemMock.files.get(draft!.localMediaUri!)?.base64).toBe(
      'B-private-bytes'
    );
    expect(draft?.sendRequestedAt).toBeNull();
  });

  it('does not consent or complete a saved preview after live account switches', async () => {
    const release = installPhotos();
    release();
    const complete = jest.fn();
    render(view('send', { onVerificationComplete: complete }));
    choosePhoto('file:///tmp/b.jpg');
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(() =>
      expect(screen.getByTestId('hold-to-send')).toBeTruthy()
    );
    const before = await getProofDraft(draftId);
    mockUser = { id: 'other' };
    fireEvent.press(screen.getByTestId('hold-to-send'));
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    expect(await getProofDraft(draftId)).toEqual(before);
    expect(complete).not.toHaveBeenCalled();
  });

  it('retakes with a fresh URI and preserves the previous adopted offline file', async () => {
    const release = installPhotos();
    release();
    const saved = jest.fn();
    render(view('retake', { onLocalDraftSaved: saved }));
    choosePhoto('file:///tmp/b.jpg');
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    const before = await getProofDraft(draftId);
    fireEvent.press(screen.getByTestId('media-proof-retake'));
    choosePhoto('file:///tmp/a.jpg');
    fireEvent.press(screen.getByTestId('camera-proof-library'));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(2));
    const after = await getProofDraft(draftId);
    expect(after?.clientEventId).toBe(before?.clientEventId);
    expect(after?.localMediaUri).not.toBe(before?.localMediaUri);
    expect(after?.sendRequestedAt).toBeNull();
    expect(fileSystemMock.files.get(after!.localMediaUri!)?.base64).toBe(
      'A-private-bytes'
    );
    expect(fileSystemMock.files.get(before!.localMediaUri!)?.base64).toBe(
      'B-private-bytes'
    );
    expect(screen.getByLabelText('Captured photo proof').props.source.uri).toBe(
      after?.localMediaUri
    );
  });

  it.each([false, true])(
    'does not replace a draft changed by a submission writer during render; cleanup failure=%s',
    async cleanupFails => {
      const release = installPhotos();
      const savedUri = 'file:///documents/saved-retry.jpg';
      fileSystemMock.files.set(savedUri, {
        exists: true,
        base64: 'saved-retry-bytes',
      });
      await createProofDraft({
        ...captureProps,
        userId: 'user-123',
        proofType: 'photo',
        proofValue: savedUri,
        localMediaUri: savedUri,
      });
      const saved = jest.fn();
      render(view('changed-draft', { onLocalDraftSaved: saved }));
      choosePhoto('file:///tmp/a.jpg');
      fireEvent.press(screen.getByTestId('camera-proof-library'));
      await waitFor(() => expect(manipulateMock).toHaveBeenCalled());
      const newer = await updateProofDraft(draftId, {
        sendRequestedAt: 'deliberate-consent',
        status: 'uploading',
      });
      const fileClass = jest.requireMock('expo-file-system').File;
      const deletion = cleanupFails
        ? jest.spyOn(fileClass.prototype, 'delete').mockImplementation(() => {
            throw new Error('cleanup error');
          })
        : null;
      await act(async () => {
        release();
      });
      await waitFor(() =>
        expect(
          screen.getByText('This proof capture is no longer current.')
        ).toBeTruthy()
      );
      expect(await getProofDraft(draftId)).toEqual(newer);
      expect(fileSystemMock.files.get(savedUri)?.base64).toBe(
        'saved-retry-bytes'
      );
      expect(saved).not.toHaveBeenCalled();
      expect(screen.queryByLabelText('Captured photo proof')).toBeNull();
      deletion?.mockRestore();
    }
  );

  it.each(['jpg', 'mov', 'mp4'])(
    'reopens saved %s media without copying or replacing its URI',
    async extension => {
      const uri = `file:///documents/menta-proof-drafts/previous.${extension}`;
      fileSystemMock.files.set(uri, {
        exists: true,
        base64: 'saved-private-bytes',
      });
      const mediaType = extension === 'jpg' ? 'photo' : 'video';
      await createProofDraft({
        userId: 'user-123',
        challengeId: 'challenge-123',
        clientEventId: draftId,
        proofType: mediaType,
        proofValue: uri,
        localMediaUri: uri,
        clientTimeZone: 'Pacific/Auckland',
      });
      const before = await getProofDraft(draftId);
      expect(
        getDurableProofMedia({ localMediaUri: uri, mediaType }).localMediaUri
      ).toBe(uri);
      render(
        view('retry', {
          verificationType: mediaType,
          initialLocalMediaUri: uri,
        })
      );
      await waitFor(() =>
        expect(screen.getByTestId('hold-to-send')).toBeTruthy()
      );
      expect(await getProofDraft(draftId)).toEqual(before);
      expect(fileSystemMock.files.get(uri)?.base64).toBe('saved-private-bytes');
      expect(fileSystemMock.copy).not.toHaveBeenCalled();
      expect(manipulateMock).not.toHaveBeenCalled();
    }
  );
});
