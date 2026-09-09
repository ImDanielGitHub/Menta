import { getReviewEvidenceStatus } from '@/lib/review-evidence';

describe('review evidence decision gate', () => {
  it('does not treat missing text or media as reviewable evidence', () => {
    expect(
      getReviewEvidenceStatus({
        mediaType: 'text',
        mediaUrl: '',
        submissionText: ' ',
      })
    ).toBe('unavailable');
    expect(getReviewEvidenceStatus({ mediaType: 'photo', mediaUrl: ' ' })).toBe(
      'unavailable'
    );
  });

  it('keeps photo decisions locked until the image is displayed', () => {
    const input = {
      mediaType: 'photo' as const,
      mediaUrl: 'proof/object-key.jpg',
    };
    expect(getReviewEvidenceStatus(input)).toBe('loading');
    expect(getReviewEvidenceStatus(input, 'unavailable')).toBe('unavailable');
    expect(getReviewEvidenceStatus(input, 'available')).toBe('available');
  });

  it('recognises a specific text submission as available', () => {
    expect(
      getReviewEvidenceStatus({
        mediaType: 'text',
        mediaUrl: '',
        submissionText: 'Walked 20 minutes after work at 6:10 PM.',
      })
    ).toBe('available');
  });

  it('keeps video decisions locked until the player is ready', () => {
    const input = {
      mediaType: 'video' as const,
      mediaUrl: 'proof/walk.mp4',
    };
    expect(getReviewEvidenceStatus(input)).toBe('loading');
    expect(getReviewEvidenceStatus(input, 'unavailable')).toBe('unavailable');
    expect(getReviewEvidenceStatus(input, 'available')).toBe('available');
  });
});
