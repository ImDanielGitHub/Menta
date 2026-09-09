import { decodeAttachableSavedGroups } from '@/lib/promises/saved-group-options';

describe('attachable saved-group options', () => {
  it('keeps only active saved groups the viewer can administer', () => {
    expect(
      decodeAttachableSavedGroups(
        [
          {
            role: 'admin',
            teams: {
              id: '21234567-89ab-4def-8123-456789abcdef',
              name: 'Sunday crew',
              privacy: 'private',
              status: 'active',
              kind: 'saved',
              archived_at: null,
              image_url: 'menta-preset:move',
            },
          },
          {
            role: 'member',
            teams: {
              id: '31234567-89ab-4def-8123-456789abcdef',
              name: 'Friends',
              privacy: 'public',
              status: 'active',
              kind: 'saved',
              archived_at: null,
              image_url: null,
            },
          },
          {
            role: 'owner',
            teams: {
              id: '41234567-89ab-4def-8123-456789abcdef',
              name: 'Automatic promise container',
              privacy: 'private',
              status: 'active',
              kind: 'promise',
              archived_at: null,
              image_url: null,
            },
          },
        ],
        [
          {
            group_id: '21234567-89ab-4def-8123-456789abcdef',
            total_members: 5,
          },
        ]
      )
    ).toEqual([
      {
        id: '21234567-89ab-4def-8123-456789abcdef',
        name: 'Sunday crew',
        privacy: 'private',
        imageUrl: 'menta-preset:move',
        memberCount: 5,
        viewerRole: 'admin',
      },
    ]);
  });

  it('maps secret groups to the coarse private label and tolerates no stats', () => {
    expect(
      decodeAttachableSavedGroups(
        [
          {
            role: 'owner',
            teams: {
              id: '21234567-89ab-4def-8123-456789abcdef',
              name: 'Family',
              privacy: 'secret',
              status: 'active',
              kind: 'saved',
              archived_at: null,
              image_url: null,
            },
          },
        ],
        null
      )
    ).toMatchObject([
      { name: 'Family', privacy: 'private', memberCount: null },
    ]);
  });
});
