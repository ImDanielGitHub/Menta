import {
  GROUP_IMAGE_PRESETS,
  getGroupImagePresetToken,
  isGroupImagePresetKey,
  resolveGroupImagePreset,
} from '../group-image-presets';

describe('group image presets', () => {
  it('exposes four stable bundled choices', () => {
    expect(GROUP_IMAGE_PRESETS.map(preset => preset.key)).toEqual([
      'move',
      'focus',
      'reset',
      'create',
    ]);
    expect(GROUP_IMAGE_PRESETS.every(preset => preset.source)).toBe(true);
  });

  it('round-trips an allowlisted database token', () => {
    const token = getGroupImagePresetToken('focus');

    expect(token).toBe('menta-preset:focus');
    expect(resolveGroupImagePreset(token)?.label).toBe('Focus');
  });

  it('keeps production accessibility descriptions for each image choice', () => {
    expect(GROUP_IMAGE_PRESETS.map(preset => preset.description)).toEqual([
      'Walking, exercise and active routines',
      'Study, planning and focused work',
      'Rest, reflection and quiet routines',
      'Writing, art, music and making',
    ]);
  });

  it.each([
    null,
    '',
    'https://example.com/group.png',
    'menta-preset:unknown',
    'menta-preset:../move',
  ])('does not resolve an unrecognised preset token', value => {
    expect(resolveGroupImagePreset(value)).toBeNull();
  });

  it('rejects arbitrary client values', () => {
    expect(isGroupImagePresetKey('move')).toBe(true);
    expect(isGroupImagePresetKey('remote-url')).toBe(false);
  });
});
