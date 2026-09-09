import * as ImageManipulator from 'expo-image-manipulator';

import { persistProofMediaLocally } from '@/lib/services/proof-media-service';

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

jest.mock('@/lib/image-service', () => ({
  ImageService: { upload: jest.fn() },
}));

type MockFileEntry = { exists: boolean; base64?: string };
type MockFile = { uri: string };

const fileSystemMock = (
  jest.requireMock('expo-file-system') as {
    __mock: {
      copy: jest.Mock<Promise<void>, [MockFile, MockFile, { overwrite: true }]>;
      directories: Set<string>;
      files: Map<string, MockFileEntry>;
    };
  }
).__mock;

const manipulateMock = ImageManipulator.ImageManipulator
  .manipulate as jest.Mock;

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

describe('proof media persistence', () => {
  beforeEach(() => {
    fileSystemMock.copy.mockReset();
    fileSystemMock.directories.clear();
    fileSystemMock.files.clear();
    manipulateMock.mockReset();
  });

  it('awaits video copy completion and explicitly overwrites the durable destination', async () => {
    const sourceUri = 'file:///tmp/capture.mov';
    const destinationUri =
      'file:///documents/menta-proof-drafts/video-event.mov';
    fileSystemMock.files.set(sourceUri, { exists: true });
    fileSystemMock.files.set(destinationUri, { exists: true });

    const pendingCopy = createDeferred<void>();
    fileSystemMock.copy.mockReturnValueOnce(pendingCopy.promise);

    let settled = false;
    const persistence = persistProofMediaLocally({
      sourceUri,
      mediaType: 'video',
      clientEventId: 'video-event',
    }).then(result => {
      settled = true;
      return result;
    });

    expect(fileSystemMock.copy).toHaveBeenCalledTimes(1);
    const [source, destination, options] = fileSystemMock.copy.mock.calls[0];
    expect(source.uri).toBe(sourceUri);
    expect(destination.uri).toBe(destinationUri);
    expect(options).toEqual({ overwrite: true });
    await Promise.resolve();
    expect(settled).toBe(false);

    pendingCopy.resolve();

    await expect(persistence).resolves.toEqual({
      localMediaUri: destinationUri,
      mediaType: 'video',
      fileExt: 'mov',
      contentType: 'video/quicktime',
    });
    expect(settled).toBe(true);
  });

  it('surfaces a rejected copy and can recover by retrying the same durable key', async () => {
    const sourceUri = 'file:///tmp/capture.mp4';
    const destinationUri =
      'file:///documents/menta-proof-drafts/retry-event.mp4';
    fileSystemMock.files.set(sourceUri, { exists: true });
    fileSystemMock.files.set(destinationUri, { exists: true });

    fileSystemMock.copy.mockRejectedValueOnce(new Error('disk unavailable'));

    const input = {
      sourceUri,
      mediaType: 'video' as const,
      clientEventId: 'retry-event',
    };

    await expect(persistProofMediaLocally(input)).rejects.toThrow(
      'disk unavailable'
    );

    fileSystemMock.copy.mockImplementationOnce(async (_source, destination) => {
      fileSystemMock.files.set(destination.uri, { exists: true });
    });

    await expect(persistProofMediaLocally(input)).resolves.toEqual({
      localMediaUri: destinationUri,
      mediaType: 'video',
      fileExt: 'mp4',
      contentType: 'video/mp4',
    });
    expect(fileSystemMock.copy).toHaveBeenCalledTimes(2);
    expect(fileSystemMock.copy.mock.calls[1][2]).toEqual({ overwrite: true });
  });

  it('awaits the compressed photo copy before returning a durable draft', async () => {
    const sourceUri = 'file:///tmp/photo.heic';
    const compressedUri = 'file:///tmp/compressed.jpg';
    const destinationUri =
      'file:///documents/menta-proof-drafts/photo-event.jpg';
    fileSystemMock.files.set(sourceUri, { exists: true });
    fileSystemMock.files.set(compressedUri, { exists: true });

    const resize = jest.fn();
    const saveAsync = jest.fn().mockResolvedValue({ uri: compressedUri });
    const renderAsync = jest.fn().mockResolvedValue({ saveAsync });
    manipulateMock.mockReturnValue({ renderAsync, resize });

    const pendingCopy = createDeferred<void>();
    fileSystemMock.copy.mockReturnValueOnce(pendingCopy.promise);

    let settled = false;
    const persistence = persistProofMediaLocally({
      sourceUri,
      mediaType: 'photo',
      clientEventId: 'photo-event',
    }).then(result => {
      settled = true;
      return result;
    });

    await renderAsync.mock.results[0]?.value;
    await saveAsync.mock.results[0]?.value;
    expect(manipulateMock).toHaveBeenCalledWith(sourceUri);
    expect(resize).toHaveBeenCalledWith({ width: 1080 });
    expect(saveAsync).toHaveBeenCalledWith({
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    expect(fileSystemMock.copy).toHaveBeenCalledTimes(1);
    const [copySource, copyDestination, options] =
      fileSystemMock.copy.mock.calls[0];
    expect(copySource.uri).toBe(compressedUri);
    expect(copyDestination.uri).toBe(destinationUri);
    expect(options).toEqual({ overwrite: true });
    expect(settled).toBe(false);

    pendingCopy.resolve();

    await expect(persistence).resolves.toEqual({
      localMediaUri: destinationUri,
      mediaType: 'photo',
      fileExt: 'jpg',
      contentType: 'image/jpeg',
    });
  });
});
