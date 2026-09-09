import {
  getMascotFrameAtElapsed,
  MASCOT_SPRITE_FRAME_COUNT,
  MASCOT_SPRITE_FRAME_SIZE,
  MASCOT_SPRITE_METADATA,
  validateMascotSpriteMetadata,
} from '@/components/ui/mascot-sprite-metadata';

describe('mascot sprite metadata', () => {
  it.each(Object.entries(MASCOT_SPRITE_METADATA))(
    'keeps %s inside the authored frame grid',
    (_row, metadata) => {
      expect(validateMascotSpriteMetadata(metadata)).toBe(true);
      expect(metadata.frameCount).toBe(MASCOT_SPRITE_FRAME_COUNT);
      expect(metadata.frameHeight).toBe(MASCOT_SPRITE_FRAME_SIZE);
      expect(metadata.frameWidth).toBe(MASCOT_SPRITE_FRAME_SIZE);
    }
  );

  it('holds a one-shot result on its final frame', () => {
    expect(getMascotFrameAtElapsed('gift', Number.MAX_SAFE_INTEGER)).toBe(11);
  });

  it('loops only the idle phrase without leaving frame bounds', () => {
    const duration = MASCOT_SPRITE_METADATA.idle.frameDurationsMs.reduce(
      (total, frameDuration) => total + frameDuration,
      0
    );

    expect(getMascotFrameAtElapsed('idle', 0)).toBe(0);
    expect(getMascotFrameAtElapsed('idle', duration)).toBe(0);
    expect(getMascotFrameAtElapsed('idle', duration - 1)).toBe(11);
  });
});
