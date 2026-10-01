import { ownsProofPath, removeJpegMetadata, prepareVideo } from '../media';
it('never reads another person’s storage or a URL with service authority', () => {
  expect(ownsProofPath('alex/proof.jpg', 'alex')).toBe(true);
  for (const path of [
    'sam/proof.jpg',
    'alex/../sam/proof.jpg',
    'alex/%2e%2e/proof.jpg',
    'https://example.com/a.jpg',
  ])
    expect(ownsProofPath(path, 'alex')).toBe(false);
});

const box = (type: string, payload: Uint8Array) => {
  const bytes = new Uint8Array(8 + payload.length);
  new DataView(bytes.buffer).setUint32(0, bytes.length);
  bytes.set(
    Array.from(type, c => c.charCodeAt(0)),
    4
  );
  bytes.set(payload, 8);
  return bytes;
};
const concat = (...parts: Uint8Array[]) =>
  new Uint8Array(parts.flatMap(p => Array.from(p)));
const clip = (seconds: number) => {
  const header = new Uint8Array(24);
  const view = new DataView(header.buffer);
  view.setUint32(12, 1000);
  view.setUint32(16, seconds * 1000);
  return concat(
    box('ftyp', new Uint8Array([105, 115, 111, 109])),
    box(
      'moov',
      concat(box('mvhd', header), box('udta', new Uint8Array([71, 80, 83])))
    ),
    box('mdat', new Uint8Array([3, 4, 5]))
  );
};
it('removes video metadata without shifting sample offsets or changing media bytes', () => {
  const input = clip(30);
  const result = prepareVideo(input);
  expect(result.length).toBe(input.length);
  expect(Array.from(result.slice(-3))).toEqual([3, 4, 5]);
  expect(Buffer.from(result).includes(Buffer.from('GPS'))).toBe(false);
  expect(Buffer.from(input).includes(Buffer.from('GPS'))).toBe(true);
});
it('bounds video duration and rejects truncated containers', () => {
  expect(() => prepareVideo(clip(36))).toThrow('VIDEO_TOO_LONG');
  expect(() => prepareVideo(clip(30).slice(0, -1))).toThrow(
    'VIDEO_FORMAT_INVALID'
  );
  expect(() => prepareVideo(new Uint8Array([1, 2, 3]))).toThrow(
    'VIDEO_FORMAT_INVALID'
  );
});
it('removes EXIF and comments while preserving scan bytes', () => {
  const bytes = new Uint8Array([
    255, 216, 255, 225, 0, 6, 71, 80, 83, 0, 255, 254, 0, 4, 65, 66, 255, 219,
    0, 3, 7, 255, 218, 0, 2, 42, 255, 217,
  ]);
  expect(Array.from(removeJpegMetadata(bytes))).toEqual([
    255, 216, 255, 219, 0, 3, 7, 255, 218, 0, 2, 42, 255, 217,
  ]);
});
it('rejects unknown formats and truncated segments', () => {
  expect(() => removeJpegMetadata(new Uint8Array([137, 80, 78, 71]))).toThrow(
    'PHOTO_FORMAT_UNSUPPORTED'
  );
  expect(() =>
    removeJpegMetadata(new Uint8Array([255, 216, 255, 225, 0, 200]))
  ).toThrow('PHOTO_FORMAT_INVALID');
});
