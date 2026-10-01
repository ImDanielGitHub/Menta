/** Keep service-role storage access inside the submitting person's folder. */
export function ownsProofPath(path: string, userId: string): boolean {
  return Boolean(
    userId &&
    path.startsWith(`${userId}/`) &&
    !path.includes('..') &&
    !path.includes('%') &&
    !path.includes('://') &&
    !path.includes('\\')
  );
}

export const MAX_VIDEO_BYTES = 24 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 35;

/** Scrub MP4/QuickTime metadata without moving media offsets. Replacing boxes
 * with equally sized free boxes keeps sample tables valid. Decode stays with
 * the video provider, rather than running an unbounded transcoder in the edge.
 */
export function prepareVideo(bytes: Uint8Array): Uint8Array {
  if (bytes.byteLength > MAX_VIDEO_BYTES) throw new Error('VIDEO_TOO_LARGE');
  const output = new Uint8Array(bytes);
  const view = new DataView(output.buffer);
  let formatFound = false;
  let duration: number | null = null;
  let boxes = 0;
  const containers = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts']);
  const walk = (start: number, end: number, depth: number) => {
    if (depth > 8) throw new Error('VIDEO_FORMAT_INVALID');
    let offset = start;
    while (offset < end) {
      if (++boxes > 10000 || offset + 8 > end)
        throw new Error('VIDEO_FORMAT_INVALID');
      let size = view.getUint32(offset);
      let header = 8;
      if (size === 1) {
        if (offset + 16 > end) throw new Error('VIDEO_FORMAT_INVALID');
        const extended = view.getBigUint64(offset + 8);
        if (extended > BigInt(Number.MAX_SAFE_INTEGER))
          throw new Error('VIDEO_FORMAT_INVALID');
        size = Number(extended);
        header = 16;
      } else if (size === 0) size = end - offset;
      if (size < header || offset + size > end)
        throw new Error('VIDEO_FORMAT_INVALID');
      const type = String.fromCharCode(
        ...output.subarray(offset + 4, offset + 8)
      );
      const body = offset + header;
      if (type === 'ftyp' && depth === 0) formatFound = true;
      if (type === 'mvhd') {
        const version = output[body];
        const scaleAt = body + (version === 1 ? 20 : 12);
        const durationAt = scaleAt + 4;
        if (
          (version !== 0 && version !== 1) ||
          durationAt + (version === 1 ? 8 : 4) > offset + size
        )
          throw new Error('VIDEO_FORMAT_INVALID');
        const scale = view.getUint32(scaleAt);
        const ticks =
          version === 1
            ? Number(view.getBigUint64(durationAt))
            : view.getUint32(durationAt);
        duration = scale ? ticks / scale : null;
      }
      if (['udta', 'meta', 'uuid'].includes(type)) {
        output.set([102, 114, 101, 101], offset + 4);
        output.fill(0, body, offset + size);
      } else if (containers.has(type)) walk(body, offset + size, depth + 1);
      offset += size;
    }
  };
  walk(0, output.length, 0);
  if (
    !formatFound ||
    duration === null ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    throw new Error('VIDEO_FORMAT_INVALID');
  if (duration > MAX_VIDEO_SECONDS) throw new Error('VIDEO_TOO_LONG');
  return output;
}

/** Strip JPEG metadata (including EXIF GPS) before the image leaves storage.
 * Current clients re-encode proof as JPEG. Unknown formats are never forwarded.
 */
export function removeJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new Error('PHOTO_FORMAT_UNSUPPORTED');
  const parts = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('PHOTO_FORMAT_INVALID');
    const marker = bytes[offset + 1];
    if (marker === 0xda) {
      parts.push(bytes.subarray(offset));
      break;
    }
    if (marker === 0xd9) {
      parts.push(bytes.subarray(offset, offset + 2));
      break;
    }
    if (offset + 4 > bytes.length) throw new Error('PHOTO_FORMAT_INVALID');
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length)
      throw new Error('PHOTO_FORMAT_INVALID');
    if (!(marker >= 0xe1 && marker <= 0xef) && marker !== 0xfe)
      parts.push(bytes.subarray(offset, offset + 2 + length));
    offset += 2 + length;
  }
  const output = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0)
  );
  let index = 0;
  for (const part of parts) {
    output.set(part, index);
    index += part.length;
  }
  return output;
}
