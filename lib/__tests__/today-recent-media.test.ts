import { decodeTodayRecentMedia } from '@/lib/today-recent-media';

describe('Today recent proof media', () => {
  it('keeps authorised photo and video receipts with honest visibility', () => {
    const decoded = decodeTodayRecentMedia(
      [
        {
          id: 'photo-1',
          challenge_id: 'challenge-1',
          challenge_title: 'Walk after work',
          group_id: null,
          media_type: 'photo',
          media_url: 'user/proof.jpg',
          submitted_at: '2026-09-01T07:00:00.000Z',
          contributor_name: 'Mia',
          visibility: 'only_you',
        },
        {
          id: 'video-1',
          challenge_id: 'challenge-2',
          challenge_title: 'Read together',
          group_id: 'group-1',
          media_type: 'video',
          media_url: 'user/proof.mp4',
          submitted_at: '2026-08-31T07:00:00.000Z',
          contributor_name: 'Ari',
          visibility: 'promise_people',
        },
      ],
      'en-NZ'
    );

    expect(decoded).toEqual([
      expect.objectContaining({
        id: 'photo-1',
        mediaType: 'photo',
        thumbnailUrl: 'user/proof.jpg',
        visibility: 'only-you',
      }),
      expect.objectContaining({
        id: 'video-1',
        mediaType: 'video',
        thumbnailUrl: null,
        visibility: 'promise-people',
      }),
    ]);
  });

  it('drops malformed, text, duplicate, or identity-free media rows', () => {
    const valid = {
      id: 'proof-1',
      challenge_id: 'challenge-1',
      challenge_title: 'Walk after work',
      group_id: null,
      media_type: 'photo',
      media_url: 'user/proof.jpg',
      submitted_at: '2026-09-01T07:00:00.000Z',
      contributor_name: 'Mia',
      visibility: 'only_you',
    };

    expect(
      decodeTodayRecentMedia(
        [
          valid,
          { ...valid },
          { ...valid, id: 'text-1', media_type: 'text' },
          { ...valid, id: 'missing-media', media_url: null },
          { ...valid, id: 'missing-person', contributor_name: '' },
        ],
        'en-NZ'
      )
    ).toHaveLength(1);
  });
});
