import * as ImageManipulator from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';

import { ImageService } from '@/lib/image-service';

export type LocalProofMediaType = 'photo' | 'video';

export type DurableProofMedia = {
  localMediaUri: string;
  mediaType: LocalProofMediaType;
  fileExt: string;
  contentType: string;
};

const PROOF_MEDIA_DIRECTORY = 'menta-proof-drafts';
export const MAX_PROOF_MEDIA_BYTES = 50 * 1024 * 1024;

const getProofMediaDirectory = (): Directory => {
  const directory = new Directory(Paths.document, PROOF_MEDIA_DIRECTORY);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
};

const getVideoFormat = (uri: string) => {
  const source = new File(uri);
  const extension = source.extension.toLowerCase();
  if (extension === '.mov') {
    return { fileExt: 'mov', contentType: 'video/quicktime' };
  }
  return { fileExt: 'mp4', contentType: 'video/mp4' };
};

export const getDurableProofMedia = ({
  localMediaUri,
  mediaType,
}: {
  localMediaUri: string;
  mediaType: LocalProofMediaType;
}): DurableProofMedia => {
  const file = new File(localMediaUri);
  if (!file.exists) {
    throw new Error(
      'The saved proof file is no longer available on this phone.'
    );
  }

  const format =
    mediaType === 'photo'
      ? { fileExt: 'jpg', contentType: 'image/jpeg' }
      : getVideoFormat(localMediaUri);

  return { localMediaUri: file.uri, mediaType, ...format };
};

const replaceDurableFile = async (
  sourceUri: string,
  destination: File
): Promise<File> => {
  const source = new File(sourceUri);
  if (!source.exists) {
    throw new Error(
      'The saved proof file is no longer available on this phone.'
    );
  }

  if (source.uri === destination.uri) return source;
  await source.copy(destination, { overwrite: true });
  return destination;
};

/**
 * Move a capture out of temporary camera/library storage before it is shown as
 * a durable draft. The deterministic filename lets crash recovery reopen the
 * same file without guessing which temporary asset belonged to the draft.
 */
export const persistProofMediaLocally = async ({
  sourceUri,
  mediaType,
  clientEventId,
}: {
  sourceUri: string;
  mediaType: LocalProofMediaType;
  clientEventId: string;
}): Promise<DurableProofMedia> => {
  const directory = getProofMediaDirectory();

  if (mediaType === 'photo') {
    const destination = new File(directory, `${clientEventId}.jpg`);
    const source = new File(sourceUri);
    if (source.uri === destination.uri && source.exists) {
      return {
        localMediaUri: source.uri,
        mediaType,
        fileExt: 'jpg',
        contentType: 'image/jpeg',
      };
    }

    const imageContext =
      ImageManipulator.ImageManipulator.manipulate(sourceUri);
    imageContext.resize({ width: 1080 });
    const renderedImage = await imageContext.renderAsync();
    const compressed = await renderedImage.saveAsync({
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    if (!compressed.uri) {
      throw new Error('Menta could not prepare this photo for sending.');
    }

    const durable = await replaceDurableFile(compressed.uri, destination);
    return {
      localMediaUri: durable.uri,
      mediaType,
      fileExt: 'jpg',
      contentType: 'image/jpeg',
    };
  }

  const format = getVideoFormat(sourceUri);
  const destination = new File(directory, `${clientEventId}.${format.fileExt}`);
  const durable = await replaceDurableFile(sourceUri, destination);
  return {
    localMediaUri: durable.uri,
    mediaType,
    ...format,
  };
};

export const readDurableProofMedia = async ({
  localMediaUri,
  mediaType,
}: {
  localMediaUri: string;
  mediaType: LocalProofMediaType;
}): Promise<DurableProofMedia & { fileData: string }> => {
  const prepared = getDurableProofMedia({ localMediaUri, mediaType });
  const file = new File(prepared.localMediaUri);
  if (
    typeof file.size !== 'number' ||
    file.size <= 0 ||
    file.size > MAX_PROOF_MEDIA_BYTES
  ) {
    throw new Error('Choose proof media smaller than 50 MB.');
  }
  const fileData = await file.base64();
  if (!fileData) {
    throw new Error('Menta could not reopen the saved proof on this phone.');
  }

  return { ...prepared, fileData };
};

export const releaseDurableProofMedia = (localMediaUri: string): void => {
  const file = new File(localMediaUri);
  if (file.exists) file.delete();
};

/**
 * Upload a durable local capture to a stable user-scoped object key. A retry
 * after response loss may find the same object already present; that is the
 * expected idempotent outcome for this client event, not a second proof.
 */
export const uploadDurableProofMedia = async ({
  userId,
  challengeId,
  clientEventId,
  localMediaUri,
  mediaType,
}: {
  userId: string;
  challengeId: string;
  clientEventId: string;
  localMediaUri: string;
  mediaType: LocalProofMediaType;
}): Promise<string> => {
  const prepared = await readDurableProofMedia({ localMediaUri, mediaType });
  const objectKey =
    `${userId}/proof-${challengeId}-${clientEventId}.` + prepared.fileExt;

  try {
    await ImageService.upload(
      'CHALLENGE_VERIFICATIONS',
      objectKey,
      prepared.fileData,
      prepared.contentType
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists|duplicate/i.test(message)) throw error;
  }

  return objectKey;
};
