import { File, Paths } from 'expo-file-system';

export interface FileMetadata {
  exists: boolean;
  size: number;
  uri: string;
  isDirectory: boolean;
}

export async function readFileBase64(uri: string): Promise<string> {
  return new File(uri).base64();
}

export function getFileMetadata(uri: string): FileMetadata {
  const file = new File(uri);

  return {
    exists: file.exists,
    size: file.size ?? 0,
    uri: file.uri,
    isDirectory: false,
  };
}

export async function writeJsonDocument(
  fileName: string,
  payload: unknown
): Promise<string> {
  const file = new File(Paths.document, fileName);
  file.write(JSON.stringify(payload));
  return file.uri;
}
