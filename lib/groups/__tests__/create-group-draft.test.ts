import {
  decodeCreateGroupDraft,
  getCreateGroupDraftKey,
} from '../create-group-draft';

describe('create group draft ownership', () => {
  it('isolates drafts by authenticated user', () => {
    expect(getCreateGroupDraftKey('creator-a')).not.toBe(
      getCreateGroupDraftKey('creator-b')
    );
    expect(getCreateGroupDraftKey('creator-a')).toContain('creator-a');
  });

  it('decodes the current bounded draft contract', () => {
    expect(
      decodeCreateGroupDraft(
        JSON.stringify({
          version: 1,
          groupName: 'Morning Miles',
          privacy: 'private',
          memberNudges: true,
          imagePreset: 'focus',
        })
      )
    ).toEqual({
      version: 1,
      groupName: 'Morning Miles',
      privacy: 'private',
      memberNudges: true,
      imagePreset: 'focus',
    });
  });

  it('restores an older draft with the default image preset', () => {
    expect(
      decodeCreateGroupDraft(
        JSON.stringify({
          version: 1,
          groupName: 'Morning Miles',
          privacy: 'private',
          memberNudges: true,
        })
      )
    ).toMatchObject({ imagePreset: 'move' });
  });

  it.each([
    null,
    '',
    'not-json',
    '{}',
    JSON.stringify({ version: 2, groupName: 'Old draft' }),
    JSON.stringify({
      version: 1,
      groupName: 'Morning Miles',
      privacy: 'secret',
      memberNudges: true,
    }),
    JSON.stringify({
      version: 1,
      groupName: 'Morning Miles',
      privacy: 'private',
      memberNudges: true,
      imagePreset: 'unknown',
    }),
  ])('rejects an invalid or stale draft without leaking values', raw => {
    expect(decodeCreateGroupDraft(raw)).toBeNull();
  });
});
