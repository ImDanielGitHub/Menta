export type MascotSheetRow = 'idle' | 'wave' | 'guide' | 'gift';

export const MASCOT_SPRITE_FRAME_SIZE = 362;
export const MASCOT_SPRITE_FRAME_COUNT = 12;

export type MascotSpriteMetadata = Readonly<{
  frameCount: number;
  frameHeight: number;
  frameWidth: number;
  frameDurationsMs: readonly number[];
  loop: boolean;
  playCount: number | 'infinite';
}>;

/**
 * Timings describe authored beats, not a generic fixed frame rate. Active
 * movement stays near 12 fps; anticipation and result frames hold long enough
 * to read. Only the calm idle phrase repeats.
 */
export const MASCOT_SPRITE_METADATA: Readonly<
  Record<MascotSheetRow, MascotSpriteMetadata>
> = {
  idle: {
    frameCount: MASCOT_SPRITE_FRAME_COUNT,
    frameHeight: MASCOT_SPRITE_FRAME_SIZE,
    frameWidth: MASCOT_SPRITE_FRAME_SIZE,
    frameDurationsMs: [220, 100, 90, 90, 100, 90, 90, 110, 110, 120, 180, 3200],
    loop: true,
    playCount: 'infinite',
  },
  wave: {
    frameCount: MASCOT_SPRITE_FRAME_COUNT,
    frameHeight: MASCOT_SPRITE_FRAME_SIZE,
    frameWidth: MASCOT_SPRITE_FRAME_SIZE,
    frameDurationsMs: [160, 100, 90, 90, 90, 100, 120, 120, 100, 100, 120, 520],
    loop: false,
    playCount: 1,
  },
  guide: {
    frameCount: MASCOT_SPRITE_FRAME_COUNT,
    frameHeight: MASCOT_SPRITE_FRAME_SIZE,
    frameWidth: MASCOT_SPRITE_FRAME_SIZE,
    frameDurationsMs: [
      180, 110, 100, 100, 110, 120, 180, 220, 140, 120, 140, 640,
    ],
    loop: false,
    playCount: 1,
  },
  gift: {
    frameCount: MASCOT_SPRITE_FRAME_COUNT,
    frameHeight: MASCOT_SPRITE_FRAME_SIZE,
    frameWidth: MASCOT_SPRITE_FRAME_SIZE,
    frameDurationsMs: [
      180, 110, 100, 100, 110, 120, 180, 220, 220, 180, 160, 720,
    ],
    loop: false,
    playCount: 1,
  },
};

export function getMascotFrameAtElapsed(
  row: MascotSheetRow,
  elapsedMs: number
): number {
  const metadata = MASCOT_SPRITE_METADATA[row];
  const safeElapsed = Math.max(0, elapsedMs);
  const sequenceDuration = metadata.frameDurationsMs.reduce(
    (total, duration) => total + duration,
    0
  );
  const elapsed = metadata.loop
    ? safeElapsed % sequenceDuration
    : Math.min(safeElapsed, sequenceDuration - 1);

  let boundary = 0;
  for (let index = 0; index < metadata.frameCount; index += 1) {
    boundary += metadata.frameDurationsMs[index];
    if (elapsed < boundary) return index;
  }

  return metadata.frameCount - 1;
}

export function validateMascotSpriteMetadata(
  metadata: MascotSpriteMetadata
): boolean {
  return (
    metadata.frameCount > 1 &&
    metadata.frameHeight > 0 &&
    metadata.frameWidth > 0 &&
    metadata.frameDurationsMs.length === metadata.frameCount &&
    metadata.frameDurationsMs.every(duration => duration >= 80)
  );
}
